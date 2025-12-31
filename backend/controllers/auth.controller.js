/**
 * Authentication Controller
 * Handles user registration and login
 */

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User.model');
const Driver = require('../models/Driver.model');

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please set it in environment variables.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    // Check required environment variables
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is missing in environment variables');
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'JWT_SECRET is not configured. Please contact the administrator.'
      });
    }

    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is missing in environment variables');
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Database connection is not configured. Please contact the administrator.'
      });
    }

    const { name, email, phone, password, role } = req.body;

    // Clean phone number - remove formatting characters
    const cleanPhone = phone ? phone.replace(/[\s\-\(\)\+]/g, '') : phone;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User with this email already exists'
      });
    }

    // Normalize role: "customer" from frontend becomes "user" in database
    const normalizedRole = role === 'customer' ? 'user' : role;

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: cleanPhone, // Use cleaned phone number
      password,
      role: normalizedRole
    });

    // If driver, create driver profile placeholder (they'll complete it later)
    if (normalizedRole === 'driver') {
      // Driver profile will be created when they complete their profile
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user with token (transform role back to "customer" for frontend compatibility)
    const responseRole = user.role === 'user' ? 'customer' : user.role;

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: responseRole, // Return "customer" for frontend
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array()[0].msg
      });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        error: 'Account Suspended',
        message: user.suspensionReason || 'Your account has been suspended. Please contact support.',
        suspended: true,
        suspendedAt: user.suspendedAt
      });
    }

    // Update last activity
    user.lastActivity = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Transform role for frontend compatibility
    const responseRole = user.role === 'user' ? 'customer' : user.role;

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: responseRole, // Return "customer" for frontend
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

