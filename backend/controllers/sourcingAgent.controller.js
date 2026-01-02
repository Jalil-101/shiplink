/**
 * Sourcing Agent Controller
 * Handles sourcing agent profile management
 */

const SourcingAgent = require('../models/SourcingAgent.model');
const User = require('../models/User.model');

/**
 * @route   POST /api/sourcing-agents/create-profile
 * @desc    Create sourcing agent profile
 * @access  Private (sourcing-agent role)
 */
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const user = await User.findById(userId);
    if (!user || user.role !== 'sourcing-agent') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only sourcing agent users can create this profile'
      });
    }

    const existingProfile = await SourcingAgent.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Profile already exists'
      });
    }

    const {
      agentName,
      specialization,
      coverageAreas,
      languages,
      commissionRate,
      bio,
      experience,
      contactInfo
    } = req.body;

    const profile = await SourcingAgent.create({
      userId,
      agentName,
      specialization: specialization || [],
      coverageAreas: coverageAreas || [],
      languages: languages || [],
      commissionRate: commissionRate || 5,
      bio,
      experience,
      contactInfo: contactInfo || {}
    });

    res.status(201).json({
      message: 'Sourcing agent profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create sourcing agent profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating profile'
    });
  }
};

/**
 * @route   GET /api/sourcing-agents/profile
 * @desc    Get current user's sourcing agent profile
 * @access  Private (sourcing-agent role)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await SourcingAgent.findOne({ userId })
      .populate('userId', 'name email phone');

    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get sourcing agent profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching profile'
    });
  }
};

/**
 * @route   PATCH /api/sourcing-agents/profile
 * @desc    Update sourcing agent profile
 * @access  Private (sourcing-agent role)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await SourcingAgent.findOne({ userId });

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
    console.error('Update sourcing agent profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating profile'
    });
  }
};

/**
 * @route   GET /api/sourcing-agents
 * @desc    Get all verified sourcing agents (public)
 * @access  Public
 */
exports.getAllAgents = async (req, res) => {
  try {
    const { search, specialization, country } = req.query;
    const query = {
      isVerified: true,
      verificationStatus: 'approved'
    };

    if (specialization) {
      query.specialization = specialization;
    }

    if (country) {
      query['coverageAreas.country'] = country;
    }

    let agents = await SourcingAgent.find(query)
      .populate('userId', 'name email phone avatar')
      .sort({ rating: -1, successfulRequests: -1 });

    if (search) {
      agents = agents.filter(agent => 
        agent.agentName.toLowerCase().includes(search.toLowerCase()) ||
        agent.bio?.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      agents,
      count: agents.length
    });
  } catch (error) {
    console.error('Get all sourcing agents error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching agents'
    });
  }
};

