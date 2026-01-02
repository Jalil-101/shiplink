/**
 * Import Coach Controller
 * Handles import coach profile management
 */

const ImportCoach = require('../models/ImportCoach.model');
const User = require('../models/User.model');

/**
 * @route   POST /api/import-coaches/create-profile
 * @desc    Create import coach profile
 * @access  Private (import-coach role)
 */
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const user = await User.findById(userId);
    if (!user || user.role !== 'import-coach') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only import coach users can create this profile'
      });
    }

    const existingProfile = await ImportCoach.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Profile already exists'
      });
    }

    const {
      coachName,
      expertise,
      countries,
      languages,
      hourlyRate,
      bio,
      qualifications,
      certifications,
      contactInfo
    } = req.body;

    const profile = await ImportCoach.create({
      userId,
      coachName,
      expertise: expertise || [],
      countries: countries || [],
      languages: languages || [],
      hourlyRate: hourlyRate || 0,
      bio,
      qualifications: qualifications || [],
      certifications: certifications || [],
      contactInfo: contactInfo || {}
    });

    res.status(201).json({
      message: 'Import coach profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create import coach profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating profile'
    });
  }
};

/**
 * @route   GET /api/import-coaches/profile
 * @desc    Get current user's import coach profile
 * @access  Private (import-coach role)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await ImportCoach.findOne({ userId })
      .populate('userId', 'name email phone');

    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get import coach profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching profile'
    });
  }
};

/**
 * @route   PATCH /api/import-coaches/profile
 * @desc    Update import coach profile
 * @access  Private (import-coach role)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await ImportCoach.findOne({ userId });

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
    console.error('Update import coach profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating profile'
    });
  }
};

/**
 * @route   GET /api/import-coaches
 * @desc    Get all verified import coaches (public)
 * @access  Public
 */
exports.getAllCoaches = async (req, res) => {
  try {
    const { search, expertise, country } = req.query;
    const query = {
      isActive: true,
      verificationStatus: 'approved'
    };

    if (expertise) {
      query.expertise = expertise;
    }

    if (country) {
      query.countries = country;
    }

    let coaches = await ImportCoach.find(query)
      .populate('userId', 'name email phone avatar')
      .sort({ rating: -1, successfulSessions: -1 });

    if (search) {
      coaches = coaches.filter(coach => 
        coach.coachName.toLowerCase().includes(search.toLowerCase()) ||
        coach.bio?.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      coaches,
      count: coaches.length
    });
  } catch (error) {
    console.error('Get all import coaches error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching coaches'
    });
  }
};

