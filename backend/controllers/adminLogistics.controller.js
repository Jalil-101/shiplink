/**
 * Admin Logistics Company Controller
 * Handles logistics company verification and management
 */

const LogisticsCompany = require('../models/LogisticsCompany.model');
const User = require('../models/User.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/logistics-companies
 * @desc    Get all logistics companies with filters
 * @access  Private (Admin)
 */
exports.getAllCompanies = async (req, res) => {
  try {
    const { search, verificationStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    let companies = await LogisticsCompany.find(query)
      .populate('userId', 'name email phone')
      .populate('drivers', 'userId vehicleType vehicleModel')
      .sort({ createdAt: -1 });

    if (search) {
      companies = companies.filter(company => {
        const searchLower = search.toLowerCase();
        return (
          company.companyName.toLowerCase().includes(searchLower) ||
          company.registrationNumber.toLowerCase().includes(searchLower) ||
          company.userId?.email.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = companies.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedCompanies = companies.slice(startIndex, startIndex + parseInt(limit));

    await createAuditLog(req, 'view_logistics_companies', 'logistics_companies', null, { filters: query });

    res.json({
      companies: paginatedCompanies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get all logistics companies error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching logistics companies'
    });
  }
};

/**
 * @route   GET /api/admin/logistics-companies/:id
 * @desc    Get logistics company by ID
 * @access  Private (Admin)
 */
exports.getCompanyById = async (req, res) => {
  try {
    const company = await LogisticsCompany.findById(req.params.id)
      .populate('userId', 'name email phone avatar')
      .populate('drivers', 'userId vehicleType vehicleModel vehiclePlate')
      .populate('drivers.userId', 'name email phone');

    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company not found'
      });
    }

    await createAuditLog(req, 'view_logistics_company', 'logistics_company', req.params.id);

    res.json({ company });
  } catch (error) {
    console.error('Get logistics company by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching logistics company'
    });
  }
};

/**
 * @route   PATCH /api/admin/logistics-companies/:id/approve
 * @desc    Approve logistics company verification
 * @access  Private (Admin)
 */
exports.approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const company = await LogisticsCompany.findById(id);
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company not found'
      });
    }

    company.verificationStatus = 'approved';
    company.isVerified = true;
    company.verifiedAt = new Date();
    company.verifiedBy = req.admin._id;
    if (notes) company.verificationNotes = notes;

    await company.save();

    await createAuditLog(
      req,
      'approve_logistics_company',
      'logistics_company',
      id,
      { notes }
    );

    res.json({
      message: 'Logistics company approved successfully',
      company: {
        id: company._id,
        verificationStatus: company.verificationStatus,
        verifiedAt: company.verifiedAt
      }
    });
  } catch (error) {
    console.error('Approve logistics company error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error approving logistics company'
    });
  }
};

/**
 * @route   PATCH /api/admin/logistics-companies/:id/reject
 * @desc    Reject logistics company verification
 * @access  Private (Admin)
 */
exports.rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rejection notes are required'
      });
    }

    const company = await LogisticsCompany.findById(id);
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company not found'
      });
    }

    company.verificationStatus = 'rejected';
    company.isVerified = false;
    company.verifiedAt = new Date();
    company.verifiedBy = req.admin._id;
    company.verificationNotes = notes;

    await company.save();

    await createAuditLog(
      req,
      'reject_logistics_company',
      'logistics_company',
      id,
      { notes }
    );

    res.json({
      message: 'Logistics company rejected successfully',
      company: {
        id: company._id,
        verificationStatus: company.verificationStatus,
        verificationNotes: company.verificationNotes
      }
    });
  } catch (error) {
    console.error('Reject logistics company error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error rejecting logistics company'
    });
  }
};

/**
 * @route   POST /api/admin/logistics-companies/enroll
 * @desc    Enroll new logistics company (super-admin only)
 * @access  Private (Super-Admin only)
 */
exports.enrollCompany = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      companyName,
      registrationNumber,
      businessLicense,
      logo,
      description,
      services,
      coverageAreas,
      contactInfo,
      pricing
    } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !companyName || !registrationNumber) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, email, phone, password, companyName, and registrationNumber are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User with this email already exists'
      });
    }

    // Check if registration number already exists
    const existingCompany = await LogisticsCompany.findOne({ registrationNumber });
    if (existingCompany) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Company with this registration number already exists'
      });
    }

    // Create user account with logistics-company role
    // NOTE: These accounts are for web dashboard access only, not mobile app
    // activeRole must be 'user' - logistics companies cannot use mobile app
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: 'logistics-company',
      activeRole: 'user', // Must be 'user' - logistics companies use web dashboard only
      roles: [
        { role: 'user', verified: true, verifiedAt: new Date() },
        { role: 'logistics-company', verified: true, verifiedAt: new Date() } // For web dashboard authentication
      ]
    });

    // Create logistics company profile
    const company = await LogisticsCompany.create({
      userId: user._id,
      companyName: companyName.trim(),
      registrationNumber: registrationNumber.trim(),
      businessLicense: businessLicense || null,
      logo: logo || null,
      description: description || null,
      services: services || [],
      coverageAreas: coverageAreas || [],
      contactInfo: contactInfo || {
        phone: phone,
        email: email
      },
      pricing: pricing || {},
      verificationStatus: 'approved',
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: req.admin._id,
      isActive: true
    });

    await createAuditLog(
      req,
      'enroll_logistics_company',
      'logistics_company',
      company._id,
      {
        companyName,
        registrationNumber,
        userEmail: email
      }
    );

    res.status(201).json({
      message: 'Logistics company enrolled successfully',
      company: {
        id: company._id,
        companyName: company.companyName,
        registrationNumber: company.registrationNumber,
        verificationStatus: company.verificationStatus,
        isVerified: company.isVerified
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Enroll logistics company error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.join(', ')
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: 'Duplicate Error',
        message: `A ${field === 'email' ? 'user' : 'company'} with this ${field} already exists`
      });
    }
    
    // Handle mongoose cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid Data',
        message: `Invalid ${error.path}: ${error.value}`
      });
    }
    
    res.status(500).json({
      error: 'Server Error',
      message: error.message || 'Error enrolling logistics company'
    });
  }
};

/**
 * @route   PATCH /api/admin/logistics-companies/:id/suspend
 * @desc    Suspend logistics company
 * @access  Private (Admin)
 */
exports.suspendCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const company = await LogisticsCompany.findById(id).populate('userId');
    if (!company || !company.userId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company not found'
      });
    }

    company.verificationStatus = 'suspended';
    company.isActive = false;
    if (reason) company.verificationNotes = reason;

    const user = company.userId;
    user.isSuspended = true;
    user.suspensionReason = reason || 'Logistics company suspended by admin';

    await company.save();
    await user.save();

    await createAuditLog(
      req,
      'suspend_logistics_company',
      'logistics_company',
      id,
      { reason }
    );

    res.json({
      message: 'Logistics company suspended successfully',
      company: {
        id: company._id,
        verificationStatus: company.verificationStatus,
        isActive: company.isActive
      }
    });
  } catch (error) {
    console.error('Suspend logistics company error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error suspending logistics company'
    });
  }
};



