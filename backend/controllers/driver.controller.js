/**
 * Driver Controller
 * Handles driver profile and operations
 */

const Driver = require('../models/Driver.model');
const User = require('../models/User.model');
const DeliveryRequest = require('../models/DeliveryRequest.model');
const { calculateDistance } = require('../utils/distance');

/**
 * @route   POST /api/drivers
 * @desc    Create driver profile
 * @access  Private (Driver only)
 */
exports.createDriverProfile = async (req, res, next) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array()[0].msg
      });
    }

    const { licenseNumber, vehicleType, vehicleModel, vehiclePlate, idDocument } = req.body;

    // Check if user is a driver
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only drivers can create driver profiles'
      });
    }

    // Check if driver profile already exists
    const existingDriver = await Driver.findOne({ userId: req.user._id });
    if (existingDriver) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Driver profile already exists'
      });
    }

    // Check if license number is already taken
    const licenseExists = await Driver.findOne({ licenseNumber });
    if (licenseExists) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'License number already registered'
      });
    }

    // Create driver profile
    const driver = await Driver.create({
      userId: req.user._id,
      licenseNumber,
      vehicleType,
      vehicleModel,
      vehiclePlate,
      idDocument: idDocument || null // Optional for now, can make required later
    });

    // Populate user data
    await driver.populate('userId', 'name email phone role avatar');

    res.status(201).json({
      message: 'Driver profile created successfully',
      driver: {
        id: driver._id,
        userId: driver.userId._id,
        name: driver.userId.name,
        email: driver.userId.email,
        phone: driver.userId.phone,
        role: driver.userId.role === 'user' ? 'customer' : driver.userId.role,
        avatar: driver.userId.avatar,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehiclePlate: driver.vehiclePlate,
        idDocument: driver.idDocument ? 'uploaded' : null, // Don't send full base64 for security
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        isAvailable: driver.isAvailable,
        location: driver.location,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/drivers
 * @desc    Get all drivers with optional filters
 * @access  Private
 */
exports.getDrivers = async (req, res, next) => {
  try {
    const { vehicleType, isAvailable } = req.query;

    // Build query
    const query = {};
    if (vehicleType) query.vehicleType = vehicleType;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const drivers = await Driver.find(query)
      .populate('userId', 'name email phone role avatar')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Drivers retrieved successfully',
      count: drivers.length,
      drivers: drivers.map(driver => ({
        id: driver._id,
        userId: driver.userId._id,
        name: driver.userId.name,
        email: driver.userId.email,
        phone: driver.userId.phone,
        role: driver.userId.role === 'user' ? 'customer' : driver.userId.role,
        avatar: driver.userId.avatar,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehiclePlate: driver.vehiclePlate,
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        isAvailable: driver.isAvailable,
        location: driver.location,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/drivers/nearby
 * @desc    Get nearby available drivers
 * @access  Private
 */
exports.getNearbyDrivers = async (req, res, next) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Latitude and longitude are required'
      });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const maxDist = parseFloat(maxDistance);

    // Get all available drivers with location
    const drivers = await Driver.find({
      isAvailable: true,
      'location.latitude': { $exists: true, $ne: null },
      'location.longitude': { $exists: true, $ne: null }
    }).populate('userId', 'name email phone role avatar');

    // Calculate distance and filter
    const nearbyDrivers = drivers
      .map(driver => {
        const distance = calculateDistance(
          userLat,
          userLon,
          driver.location.latitude,
          driver.location.longitude
        );
        return { driver, distance };
      })
      .filter(item => item.distance <= maxDist)
      .sort((a, b) => a.distance - b.distance)
      .map(item => ({
        id: item.driver._id,
        userId: item.driver.userId._id,
        name: item.driver.userId.name,
        email: item.driver.userId.email,
        phone: item.driver.userId.phone,
        role: item.driver.userId.role === 'user' ? 'customer' : item.driver.userId.role,
        avatar: item.driver.userId.avatar,
        licenseNumber: item.driver.licenseNumber,
        vehicleType: item.driver.vehicleType,
        vehicleModel: item.driver.vehicleModel,
        vehiclePlate: item.driver.vehiclePlate,
        rating: item.driver.rating,
        totalDeliveries: item.driver.totalDeliveries,
        isAvailable: item.driver.isAvailable,
        location: item.driver.location,
        distance: item.distance,
        createdAt: item.driver.createdAt,
        updatedAt: item.driver.updatedAt
      }));

    res.json({
      message: 'Nearby drivers retrieved successfully',
      count: nearbyDrivers.length,
      drivers: nearbyDrivers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/drivers/:id
 * @desc    Get driver by ID
 * @access  Private
 */
exports.getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('userId', 'name email phone role avatar');

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    res.json({
      driver: {
        id: driver._id,
        userId: driver.userId._id,
        name: driver.userId.name,
        email: driver.userId.email,
        phone: driver.userId.phone,
        role: driver.userId.role === 'user' ? 'customer' : driver.userId.role,
        avatar: driver.userId.avatar,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehiclePlate: driver.vehiclePlate,
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        isAvailable: driver.isAvailable,
        location: driver.location,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/drivers/me/profile
 * @desc    Get current driver's profile
 * @access  Private (Driver only)
 */
exports.getMyDriverProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only drivers can access this resource'
      });
    }

    const driver = await Driver.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone role avatar');

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver profile not found. Please create your driver profile first.'
      });
    }

    res.json({
      driver: {
        id: driver._id,
        userId: driver.userId._id,
        name: driver.userId.name,
        email: driver.userId.email,
        phone: driver.userId.phone,
        role: driver.userId.role === 'user' ? 'customer' : driver.userId.role,
        avatar: driver.userId.avatar,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehiclePlate: driver.vehiclePlate,
        idDocument: driver.idDocument ? 'uploaded' : null, // Don't send full base64 for security
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        isAvailable: driver.isAvailable,
        location: driver.location,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/drivers/:id/stats
 * @desc    Get driver statistics
 * @access  Private
 */
exports.getDriverStats = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    // Get all deliveries for this driver
    const deliveries = await DeliveryRequest.find({
      driverId: driver._id,
      status: { $in: ['delivered'] }
    }).sort({ createdAt: -1 });

    const totalDeliveries = deliveries.length;
    const successfulDeliveries = deliveries.filter(d => d.status === 'delivered').length;
    
    // Get deliveries this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const deliveriesThisMonth = deliveries.filter(
      d => d.createdAt >= startOfMonth
    ).length;

    // Calculate average earning
    const totalEarnings = deliveries.reduce((sum, d) => sum + (d.price || 0), 0);
    const averageEarningPerDelivery = totalDeliveries > 0 
      ? totalEarnings / totalDeliveries 
      : 0;

    // Format deliveries for response
    const formattedDeliveries = deliveries.slice(0, 10).map(d => ({
      date: d.createdAt.toISOString(),
      earning: d.price || 0,
      status: d.status
    }));

    res.json({
      driverId: driver._id.toString(),
      totalDeliveries,
      successfulDeliveries,
      deliveriesThisMonth,
      averageEarningPerDelivery: Math.round(averageEarningPerDelivery * 100) / 100,
      deliveries: formattedDeliveries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/drivers/:id/location
 * @desc    Update driver location
 * @access  Private (Driver only)
 */
exports.updateDriverLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Latitude and longitude are required'
      });
    }

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    // Check if driver owns this profile or is admin
    if (driver.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own location'
      });
    }

    driver.location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      lastUpdated: new Date()
    };

    await driver.save();

    res.json({
      message: 'Location updated successfully',
      location: driver.location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/drivers/:id/availability
 * @desc    Toggle driver availability
 * @access  Private (Driver only)
 */
exports.toggleDriverAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'isAvailable must be a boolean'
      });
    }

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    // Check if driver owns this profile
    if (driver.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own availability'
      });
    }

    driver.isAvailable = isAvailable;
    await driver.save();

    await driver.populate('userId', 'name email phone role avatar');

    res.json({
      message: 'Availability updated successfully',
      driver: {
        id: driver._id,
        userId: driver.userId._id,
        name: driver.userId.name,
        email: driver.userId.email,
        phone: driver.userId.phone,
        role: driver.userId.role === 'user' ? 'customer' : driver.userId.role,
        avatar: driver.userId.avatar,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehiclePlate: driver.vehiclePlate,
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        isAvailable: driver.isAvailable,
        location: driver.location,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/drivers/:id
 * @desc    Update driver information
 * @access  Private (Driver only)
 */
exports.updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    // Check if driver owns this profile
    if (driver.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile'
      });
    }

    // Update allowed fields
    const { vehicleType, vehicleModel, vehiclePlate, licenseNumber, idDocument } = req.body;

    if (vehicleType) driver.vehicleType = vehicleType;
    if (vehicleModel) driver.vehicleModel = vehicleModel;
    if (vehiclePlate) driver.vehiclePlate = vehiclePlate;
    if (idDocument !== undefined) driver.idDocument = idDocument || null;
    if (licenseNumber) {
      // Check if license number is already taken by another driver
      const existingDriver = await Driver.findOne({ 
        licenseNumber,
        _id: { $ne: driver._id }
      });
      if (existingDriver) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'License number already registered'
        });
      }
      driver.licenseNumber = licenseNumber;
    }

    await driver.save();
    await driver.populate('userId', 'name email phone role avatar');

    res.json({
      message: 'Driver profile updated successfully',
      driver: {
        id: driver._id,
        userId: driver.userId._id,
        name: driver.userId.name,
        email: driver.userId.email,
        phone: driver.userId.phone,
        role: driver.userId.role === 'user' ? 'customer' : driver.userId.role,
        avatar: driver.userId.avatar,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehiclePlate: driver.vehiclePlate,
        idDocument: driver.idDocument ? 'uploaded' : null, // Don't send full base64 for security
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        isAvailable: driver.isAvailable,
        location: driver.location,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/drivers/:id
 * @desc    Delete driver profile
 * @access  Private (Driver only)
 */
exports.deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    // Check if driver owns this profile
    if (driver.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own profile'
      });
    }

    await Driver.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Driver profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

