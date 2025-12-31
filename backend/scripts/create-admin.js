/**
 * Script to create initial admin user
 * Run: node scripts/create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shiplink';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email: 'admin@shiplink.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await AdminUser.create({
      name: 'Super Admin',
      email: 'admin@shiplink.com',
      password: 'admin123', // Change this in production!
      role: 'super-admin',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: admin123 (CHANGE THIS IN PRODUCTION!)');
    console.log('👤 Role:', admin.role);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

