/**
 * Role Controller
 * Handles role switching, role requests, and role management
 */

const User = require('../models/User.model');
const Driver = require('../models/Driver.model');
const Seller = require('../models/Seller.model');
const SourcingAgent = require('../models/SourcingAgent.model');
const ImportCoach = require('../models/ImportCoach.model');
const { logRoleSwitched, logRoleRequested } = require('../utils/eventLogger');

/**
 * Get user's available roles
 */
exports.getAvailableRoles = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Get roles with verification status
    const roles = user.roles || [];
    const availableRoles = roles.map(roleEntry => ({
      role: roleEntry.role,
      verified: roleEntry.verified,
      verifiedAt: roleEntry.verifiedAt,
      requestedAt: roleEntry.requestedAt, // Include requestedAt to check if application is pending
      canActivate: roleEntry.verified // Can only activate verified roles
    }));

    // Always include 'user' role (buyer - default, always verified)
    if (!availableRoles.find(r => r.role === 'user')) {
      availableRoles.unshift({
        role: 'user',
        verified: true,
        verifiedAt: user.createdAt,
        canActivate: true
      });
    }

    res.json({
      success: true,
      availableRoles,
      activeRole: user.activeRole
    });
  } catch (error) {
    console.error('Error getting available roles:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get available roles'
    });
  }
};

/**
 * Switch active role
 */
exports.switchActiveRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    if (!role) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Role is required'
      });
    }

    const validRoles = ['user', 'seller', 'driver', 'import-coach', 'sourcing-agent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Check if user has this role
    const roleEntry = user.roles?.find(r => r.role === role);
    const hasRole = roleEntry || role === 'user'; // 'user' is always available

    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `You don't have the ${role} role. Please request it first.`
      });
    }

    // Check if role is verified (required for non-user roles)
    if (role !== 'user' && roleEntry && !roleEntry.verified) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Your ${role} role is pending verification. Please wait for admin approval.`
      });
    }

    // Check if already in this role
    if (user.activeRole === role) {
      return res.json({
        success: true,
        message: `Already active as ${role}`,
        user: {
          ...user.toObject(),
          activeRole: role,
          role: role // Sync legacy field
        }
      });
    }

    const oldRole = user.activeRole;

    // Switch role
    user.activeRole = role;
    user.role = role; // Sync legacy field for backward compatibility
    await user.save();

    // Log role switch
    await logRoleSwitched(userId, oldRole, role);

    res.json({
      success: true,
      message: `Successfully switched to ${role} role`,
      user: {
        ...user.toObject(),
        activeRole: role,
        role: role
      }
    });
  } catch (error) {
    console.error('Error switching role:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to switch role'
    });
  }
};

/**
 * Request a new role
 */
exports.requestRole = async (req, res) => {
  try {
    const { role, data } = req.body;
    const userId = req.user.id;

    if (!role) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Role is required'
      });
    }

    const validRoles = ['seller', 'driver', 'import-coach', 'sourcing-agent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Check if user already has this role
    const existingRole = user.roles?.find(r => r.role === role);
    if (existingRole) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `You already have the ${role} role. Status: ${existingRole.verified ? 'verified' : 'pending verification'}`
      });
    }

    // Add role to user's roles array (pending verification)
    if (!user.roles) {
      user.roles = [];
    }

    user.roles.push({
      role: role,
      verified: false,
      requestedAt: new Date()
    });

    await user.save();

    // Create role-specific profile based on role type
    let profile = null;
    try {
      switch (role) {
        case 'driver':
          // Check if driver profile already exists
          const existingDriver = await Driver.findOne({ userId });
          if (!existingDriver) {
            profile = new Driver({
              userId,
              licenseNumber: data?.licenseNumber || '',
              licenseExpiry: data?.licenseExpiry || null,
              vehicleType: data?.vehicleType || 'car',
              vehicleModel: data?.vehicleModel || '',
              vehiclePlate: data?.vehiclePlate || '',
              documents: data?.documents || {
                governmentId: [],
                driversLicense: [],
                vehicleRegistration: [],
                insuranceDocument: [],
                selfie: []
              },
              verificationStatus: 'pending'
            });
            await profile.save();
          } else {
            // Update existing driver profile with new data
            existingDriver.licenseExpiry = data?.licenseExpiry || existingDriver.licenseExpiry;
            existingDriver.licenseNumber = data?.licenseNumber || existingDriver.licenseNumber;
            existingDriver.vehicleType = data?.vehicleType || existingDriver.vehicleType;
            existingDriver.vehicleModel = data?.vehicleModel || existingDriver.vehicleModel;
            existingDriver.vehiclePlate = data?.vehiclePlate || existingDriver.vehiclePlate;
            if (data?.documents) {
              existingDriver.documents = {
                governmentId: data.documents.governmentId || existingDriver.documents?.governmentId || [],
                driversLicense: data.documents.driversLicense || existingDriver.documents?.driversLicense || [],
                vehicleRegistration: data.documents.vehicleRegistration || existingDriver.documents?.vehicleRegistration || [],
                insuranceDocument: data.documents.insuranceDocument || existingDriver.documents?.insuranceDocument || [],
                selfie: data.documents.selfie || existingDriver.documents?.selfie || []
              };
            }
            await existingDriver.save();
            profile = existingDriver;
          }
          break;
        
        case 'seller':
          const existingSeller = await Seller.findOne({ userId });
          if (!existingSeller) {
            profile = new Seller({
              userId,
              businessName: data?.businessName || user.name,
              businessType: data?.businessType || 'individual',
              taxId: data?.taxId || null,
              bankAccountNumber: data?.bankAccountNumber || null,
              bankName: data?.bankName || null,
              accountHolderName: data?.accountHolderName || null,
              documents: data?.businessRegistration || data?.proofOfStock ? {
                businessRegistration: data?.businessRegistration || [],
                proofOfStock: data?.proofOfStock || []
              } : {
                businessRegistration: [],
                proofOfStock: []
              },
              verificationStatus: 'pending'
            });
            await profile.save();
          } else {
            // Update existing seller profile with new data
            existingSeller.businessName = data?.businessName || existingSeller.businessName;
            existingSeller.businessType = data?.businessType || existingSeller.businessType;
            existingSeller.taxId = data?.taxId || existingSeller.taxId;
            existingSeller.bankAccountNumber = data?.bankAccountNumber || existingSeller.bankAccountNumber;
            existingSeller.bankName = data?.bankName || existingSeller.bankName;
            existingSeller.accountHolderName = data?.accountHolderName || existingSeller.accountHolderName;
            if (data?.businessRegistration || data?.proofOfStock) {
              existingSeller.documents = {
                businessRegistration: data.businessRegistration || existingSeller.documents?.businessRegistration || [],
                proofOfStock: data.proofOfStock || existingSeller.documents?.proofOfStock || []
              };
            }
            await existingSeller.save();
            profile = existingSeller;
          }
          break;
        
        case 'sourcing-agent':
          const existingAgent = await SourcingAgent.findOne({ userId });
          if (!existingAgent) {
            profile = new SourcingAgent({
              userId,
              agentName: data?.agentName || user.name,
              specialization: data?.specialization || [],
              coverageAreas: data?.coverageAreas ? data.coverageAreas.map((area: string) => ({ country: area, cities: [], regions: [] })) : [],
              languages: data?.languages || [],
              bio: data?.bio || null,
              experience: data?.experience || null,
              bankAccountNumber: data?.bankAccountNumber || null,
              bankName: data?.bankName || null,
              accountHolderName: data?.accountHolderName || null,
              references: data?.references || [],
              documents: data?.idVerification || data?.businessRegistration ? {
                idVerification: data.idVerification || [],
                businessRegistration: data.businessRegistration || []
              } : {
                idVerification: [],
                businessRegistration: []
              },
              verificationStatus: 'pending'
            });
            await profile.save();
          } else {
            // Update existing agent profile with new data
            existingAgent.agentName = data?.agentName || existingAgent.agentName;
            existingAgent.specialization = data?.specialization || existingAgent.specialization;
            existingAgent.coverageAreas = data?.coverageAreas ? data.coverageAreas.map((area: string) => ({ country: area, cities: [], regions: [] })) : existingAgent.coverageAreas;
            existingAgent.languages = data?.languages || existingAgent.languages;
            existingAgent.bio = data?.bio || existingAgent.bio;
            existingAgent.experience = data?.experience || existingAgent.experience;
            existingAgent.bankAccountNumber = data?.bankAccountNumber || existingAgent.bankAccountNumber;
            existingAgent.bankName = data?.bankName || existingAgent.bankName;
            existingAgent.accountHolderName = data?.accountHolderName || existingAgent.accountHolderName;
            existingAgent.references = data?.references || existingAgent.references;
            if (data?.idVerification || data?.businessRegistration) {
              existingAgent.documents = {
                idVerification: data.idVerification || existingAgent.documents?.idVerification || [],
                businessRegistration: data.businessRegistration || existingAgent.documents?.businessRegistration || []
              };
            }
            await existingAgent.save();
            profile = existingAgent;
          }
          break;
        
        case 'import-coach':
          const existingCoach = await ImportCoach.findOne({ userId });
          if (!existingCoach) {
            profile = new ImportCoach({
              userId,
              coachName: data?.coachName || user.name,
              expertise: data?.expertise || [],
              countries: data?.countries || [],
              languages: data?.languages || [],
              bio: data?.bio || null,
              qualifications: data?.qualifications || [],
              references: data?.references || [],
              documents: data?.portfolio || data?.certificates ? {
                portfolio: data.portfolio || [],
                certificates: data.certificates || []
              } : {
                portfolio: [],
                certificates: []
              },
              verificationStatus: 'pending'
            });
            await profile.save();
          } else {
            // Update existing coach profile with new data
            existingCoach.coachName = data?.coachName || existingCoach.coachName;
            existingCoach.expertise = data?.expertise || existingCoach.expertise;
            existingCoach.countries = data?.countries || existingCoach.countries;
            existingCoach.languages = data?.languages || existingCoach.languages;
            existingCoach.bio = data?.bio || existingCoach.bio;
            existingCoach.qualifications = data?.qualifications || existingCoach.qualifications;
            existingCoach.references = data?.references || existingCoach.references;
            if (data?.portfolio || data?.certificates) {
              existingCoach.documents = {
                portfolio: data.portfolio || existingCoach.documents?.portfolio || [],
                certificates: data.certificates || existingCoach.documents?.certificates || []
              };
            }
            await existingCoach.save();
            profile = existingCoach;
          }
          break;
      }
    } catch (profileError) {
      console.error(`Error creating ${role} profile:`, profileError);
      // Don't fail the request - profile can be created later
    }

    // Log role request
    await logRoleRequested(userId, role);

    res.json({
      success: true,
      message: `Role request submitted. Your ${role} role is pending admin verification.`,
      role: {
        role: role,
        verified: false,
        requestedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error requesting role:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to request role'
    });
  }
};



