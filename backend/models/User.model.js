/**
 * User Model
 * Represents users with multi-role support
 * Users can have multiple roles but operate in one active role at a time
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const roleEntrySchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'seller', 'driver', 'import-coach', 'sourcing-agent'],
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null
  },
  requestedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    minlength: [8, 'Phone number must be at least 8 digits']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  // Legacy role field - kept for backward compatibility
  role: {
    type: String,
    enum: ['user', 'driver', 'seller', 'logistics-company', 'sourcing-agent', 'import-coach'],
    required: [true, 'Role is required'],
    default: 'user'
  },
  // Multi-role support
  roles: {
    type: [roleEntrySchema],
    default: function() {
      // Initialize with default 'user' role
      return [{ role: 'user', verified: true, verifiedAt: new Date() }];
    }
  },
  activeRole: {
    type: String,
    enum: ['user', 'seller', 'driver', 'import-coach', 'sourcing-agent'],
    default: 'user',
    required: true
  },
  // Role verification status map (for quick lookups)
  roleVerificationStatus: {
    type: Map,
    of: {
      verified: Boolean,
      verifiedAt: Date,
      verifiedBy: mongoose.Schema.Types.ObjectId,
      status: String // 'pending', 'approved', 'rejected'
    },
    default: {}
  },
  avatar: {
    type: String,
    default: null
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: {
    type: String,
    default: null
  },
  suspendedAt: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  pushToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sync legacy 'role' field with 'activeRole' for backward compatibility
userSchema.pre('save', function(next) {
  // If activeRole is set but role is not, sync them
  if (this.activeRole && !this.role) {
    this.role = this.activeRole;
  }
  // If role is set but activeRole is not, sync them (for existing users)
  if (this.role && !this.activeRole) {
    this.activeRole = this.role;
  }
  // Ensure roles array has at least the active role
  if (this.activeRole && (!this.roles || this.roles.length === 0)) {
    this.roles = [{ role: this.activeRole, verified: true, verifiedAt: new Date() }];
  }
  next();
});

// Indexes for efficient queries
userSchema.index({ activeRole: 1 });
userSchema.index({ 'roles.role': 1 });
userSchema.index({ email: 1 });

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);






