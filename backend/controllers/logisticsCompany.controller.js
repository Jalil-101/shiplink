/**
 * Logistics Company Controller
 * Handles logistics company profile management
 */

const LogisticsCompany = require('../models/LogisticsCompany.model');
const User = require('../models/User.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   POST /api/logistics-companies/create-profile
 * @desc    Create logistics company profile
 * @access  Private (logistics-company role)
 */
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Check if user has correct role
    const user = await User.findById(userId);
    if (!user || user.role !== 'logistics-company') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only logistics company users can create this profile'
      });
    }

    // Check if profile already exists
    const existingProfile = await LogisticsCompany.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Profile already exists. Use update endpoint instead.'
      });
    }

    const {
      companyName,
      registrationNumber,
      businessLicense,
      description,
      services,
      coverageAreas,
      contactInfo,
      pricing
    } = req.body;

    const profile = await LogisticsCompany.create({
      userId,
      companyName,
      registrationNumber,
      businessLicense,
      description,
      services: services || [],
      coverageAreas: coverageAreas || [],
      contactInfo: contactInfo || {},
      pricing: pricing || {}
    });

    res.status(201).json({
      message: 'Logistics company profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create logistics company profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating logistics company profile'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/profile
 * @desc    Get current user's logistics company profile
 * @access  Private (logistics-company role)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await LogisticsCompany.findOne({ userId })
      .populate('userId', 'name email phone')
      .populate('drivers', 'userId vehicleType vehicleModel');

    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found. Please create your profile first.'
      });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get logistics company profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching profile'
    });
  }
};

/**
 * @route   PATCH /api/logistics-companies/profile
 * @desc    Update logistics company profile
 * @access  Private (logistics-company role)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await LogisticsCompany.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    Object.assign(profile, req.body);
    await profile.save();

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update logistics company profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating profile'
    });
  }
};

/**
 * @route   GET /api/logistics-companies
 * @desc    Get all verified logistics companies (public)
 * @access  Public
 */
exports.getAllCompanies = async (req, res) => {
  try {
    const { search, country, service } = req.query;
    const query = {
      isVerified: true,
      verificationStatus: 'approved'
    };

    if (country) {
      query['coverageAreas.country'] = country;
    }

    if (service) {
      query.services = service;
    }

    let companies = await LogisticsCompany.find(query)
      .populate('userId', 'name email phone')
      .sort({ rating: -1, totalShipments: -1 });

    if (search) {
      companies = companies.filter(company => 
        company.companyName.toLowerCase().includes(search.toLowerCase()) ||
        company.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      companies,
      count: companies.length
    });
  } catch (error) {
    console.error('Get all logistics companies error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching companies'
    });
  }
};

