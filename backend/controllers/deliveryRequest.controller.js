/**
 * Delivery Request Controller
 * Handles delivery request operations
 */

const DeliveryRequest = require('../models/DeliveryRequest.model');
const Driver = require('../models/Driver.model');
const { calculateDistance, calculateEstimatedTime, calculatePrice } = require('../utils/distance');

/**
 * @route   POST /api/delivery-requests
 * @desc    Create a new delivery request
 * @access  Private (User only)
 */
exports.createDeliveryRequest = async (req, res, next) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array()[0].msg
      });
    }

    const { pickupLocation, dropoffLocation, packageDetails, driverId } = req.body;

    // Calculate distance
    const distance = calculateDistance(
      pickupLocation.latitude,
      pickupLocation.longitude,
      dropoffLocation.latitude,
      dropoffLocation.longitude
    );

    // Calculate estimated time
    const estimatedTime = calculateEstimatedTime(distance);

    // Calculate price
    const price = calculatePrice(distance, packageDetails.weight);

    // Create delivery request
    const deliveryRequest = await DeliveryRequest.create({
      receiverId: req.user._id,
      driverId: driverId || null,
      pickupLocation,
      dropoffLocation,
      packageDetails,
      distance,
      price,
      estimatedDeliveryTime: estimatedTime,
      status: driverId ? 'accepted' : 'pending'
    });

    // Populate user data
    await deliveryRequest.populate('receiverId', 'name email phone');

    res.status(201).json({
      message: 'Delivery request created successfully',
      deliveryRequest: {
        id: deliveryRequest._id,
        receiverId: deliveryRequest.receiverId._id,
        driverId: deliveryRequest.driverId,
        pickupLocation: deliveryRequest.pickupLocation,
        dropoffLocation: deliveryRequest.dropoffLocation,
        packageDetails: deliveryRequest.packageDetails,
        status: deliveryRequest.status,
        estimatedDeliveryTime: deliveryRequest.estimatedDeliveryTime,
        actualDeliveryTime: deliveryRequest.actualDeliveryTime,
        price: deliveryRequest.price,
        distance: deliveryRequest.distance,
        createdAt: deliveryRequest.createdAt,
        updatedAt: deliveryRequest.updatedAt
      },
      estimatedDistance: distance,
      estimatedTime: estimatedTime
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/delivery-requests
 * @desc    Get all delivery requests with optional filters
 * @access  Private
 */
exports.getDeliveryRequests = async (req, res, next) => {
  try {
    const { status, customerId, driverId } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (customerId) query.receiverId = customerId;
    if (driverId) query.driverId = driverId;

    const deliveryRequests = await DeliveryRequest.find(query)
      .populate('receiverId', 'name email phone')
      .populate('driverId')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Delivery requests retrieved successfully',
      count: deliveryRequests.length,
      deliveryRequests: deliveryRequests.map(dr => ({
        id: dr._id,
        receiverId: dr.receiverId._id,
        driverId: dr.driverId,
        pickupLocation: dr.pickupLocation,
        dropoffLocation: dr.dropoffLocation,
        packageDetails: dr.packageDetails,
        status: dr.status,
        estimatedDeliveryTime: dr.estimatedDeliveryTime,
        actualDeliveryTime: dr.actualDeliveryTime,
        price: dr.price,
        distance: dr.distance,
        createdAt: dr.createdAt,
        updatedAt: dr.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/delivery-requests/pending
 * @desc    Get all pending delivery requests
 * @access  Private
 */
exports.getPendingRequests = async (req, res, next) => {
  try {
    const deliveryRequests = await DeliveryRequest.find({ status: 'pending' })
      .populate('receiverId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Pending delivery requests retrieved successfully',
      count: deliveryRequests.length,
      deliveryRequests: deliveryRequests.map(dr => ({
        id: dr._id,
        receiverId: dr.receiverId._id,
        driverId: dr.driverId,
        pickupLocation: dr.pickupLocation,
        dropoffLocation: dr.dropoffLocation,
        packageDetails: dr.packageDetails,
        status: dr.status,
        estimatedDeliveryTime: dr.estimatedDeliveryTime,
        actualDeliveryTime: dr.actualDeliveryTime,
        price: dr.price,
        distance: dr.distance,
        createdAt: dr.createdAt,
        updatedAt: dr.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/delivery-requests/:id
 * @desc    Get delivery request by ID
 * @access  Private
 */
exports.getDeliveryRequestById = async (req, res, next) => {
  try {
    const deliveryRequest = await DeliveryRequest.findById(req.params.id)
      .populate('receiverId', 'name email phone')
      .populate('driverId');

    if (!deliveryRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    res.json({
      deliveryRequest: {
        id: deliveryRequest._id,
        receiverId: deliveryRequest.receiverId._id,
        driverId: deliveryRequest.driverId,
        pickupLocation: deliveryRequest.pickupLocation,
        dropoffLocation: deliveryRequest.dropoffLocation,
        packageDetails: deliveryRequest.packageDetails,
        status: deliveryRequest.status,
        estimatedDeliveryTime: deliveryRequest.estimatedDeliveryTime,
        actualDeliveryTime: deliveryRequest.actualDeliveryTime,
        price: deliveryRequest.price,
        distance: deliveryRequest.distance,
        createdAt: deliveryRequest.createdAt,
        updatedAt: deliveryRequest.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/delivery-requests/user/my-requests
 * @desc    Get current user's delivery requests
 * @access  Private (User only)
 */
exports.getMyRequests = async (req, res, next) => {
  try {
    const deliveryRequests = await DeliveryRequest.find({ receiverId: req.user._id })
      .populate('driverId')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Your delivery requests retrieved successfully',
      count: deliveryRequests.length,
      deliveryRequests: deliveryRequests.map(dr => ({
        id: dr._id.toString(),
        receiverId: dr.receiverId.toString(),
        driverId: dr.driverId ? (dr.driverId._id ? dr.driverId._id.toString() : dr.driverId.toString()) : null,
        pickupLocation: dr.pickupLocation,
        dropoffLocation: dr.dropoffLocation,
        packageDetails: dr.packageDetails,
        status: dr.status,
        estimatedDeliveryTime: dr.estimatedDeliveryTime,
        actualDeliveryTime: dr.actualDeliveryTime,
        price: dr.price,
        distance: dr.distance,
        createdAt: dr.createdAt,
        updatedAt: dr.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/delivery-requests/driver/my-requests
 * @desc    Get driver's assigned delivery requests
 * @access  Private (Driver only)
 */
exports.getMyDeliveries = async (req, res, next) => {
  try {
    // Get driver profile
    const driver = await Driver.findOne({ userId: req.user._id });
    
    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver profile not found'
      });
    }

    const deliveryRequests = await DeliveryRequest.find({ driverId: driver._id })
      .populate('receiverId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Your deliveries retrieved successfully',
      count: deliveryRequests.length,
      deliveryRequests: deliveryRequests.map(dr => ({
        id: dr._id,
        receiverId: dr.receiverId._id,
        driverId: dr.driverId,
        pickupLocation: dr.pickupLocation,
        dropoffLocation: dr.dropoffLocation,
        packageDetails: dr.packageDetails,
        status: dr.status,
        estimatedDeliveryTime: dr.estimatedDeliveryTime,
        actualDeliveryTime: dr.actualDeliveryTime,
        price: dr.price,
        distance: dr.distance,
        createdAt: dr.createdAt,
        updatedAt: dr.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/delivery-requests/:id/accept
 * @desc    Accept a delivery request (Driver only)
 * @access  Private (Driver only)
 */
exports.acceptDeliveryRequest = async (req, res, next) => {
  try {
    const deliveryRequest = await DeliveryRequest.findById(req.params.id);

    if (!deliveryRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    if (deliveryRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Only pending requests can be accepted'
      });
    }

    // Get driver profile
    const driver = await Driver.findOne({ userId: req.user._id });
    
    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver profile not found'
      });
    }

    if (!driver.isAvailable) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You must be available to accept delivery requests'
      });
    }

    // Assign driver and update status
    deliveryRequest.driverId = driver._id;
    deliveryRequest.status = 'accepted';
    await deliveryRequest.save();

    await deliveryRequest.populate('receiverId', 'name email phone');
    await deliveryRequest.populate('driverId');

    res.json({
      message: 'Delivery request accepted successfully',
      deliveryRequest: {
        id: deliveryRequest._id,
        receiverId: deliveryRequest.receiverId._id,
        driverId: deliveryRequest.driverId,
        pickupLocation: deliveryRequest.pickupLocation,
        dropoffLocation: deliveryRequest.dropoffLocation,
        packageDetails: deliveryRequest.packageDetails,
        status: deliveryRequest.status,
        estimatedDeliveryTime: deliveryRequest.estimatedDeliveryTime,
        actualDeliveryTime: deliveryRequest.actualDeliveryTime,
        price: deliveryRequest.price,
        distance: deliveryRequest.distance,
        createdAt: deliveryRequest.createdAt,
        updatedAt: deliveryRequest.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/delivery-requests/:id/assign
 * @desc    Assign driver to a delivery request
 * @access  Private
 */
exports.assignDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Driver ID is required'
      });
    }

    const deliveryRequest = await DeliveryRequest.findById(req.params.id);

    if (!deliveryRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    deliveryRequest.driverId = driverId;
    deliveryRequest.status = 'accepted';
    await deliveryRequest.save();

    await deliveryRequest.populate('receiverId', 'name email phone');
    await deliveryRequest.populate('driverId');

    res.json({
      message: 'Driver assigned successfully',
      deliveryRequest: {
        id: deliveryRequest._id,
        receiverId: deliveryRequest.receiverId._id,
        driverId: deliveryRequest.driverId,
        pickupLocation: deliveryRequest.pickupLocation,
        dropoffLocation: deliveryRequest.dropoffLocation,
        packageDetails: deliveryRequest.packageDetails,
        status: deliveryRequest.status,
        estimatedDeliveryTime: deliveryRequest.estimatedDeliveryTime,
        actualDeliveryTime: deliveryRequest.actualDeliveryTime,
        price: deliveryRequest.price,
        distance: deliveryRequest.distance,
        createdAt: deliveryRequest.createdAt,
        updatedAt: deliveryRequest.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/delivery-requests/:id/status
 * @desc    Update delivery request status
 * @access  Private
 */
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const deliveryRequest = await DeliveryRequest.findById(req.params.id);

    if (!deliveryRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    // Check permissions
    const isReceiver = deliveryRequest.receiverId.toString() === req.user._id.toString();
    const isDriver = deliveryRequest.driverId && deliveryRequest.driverId.toString() === req.user._id.toString();

    // Only receiver can cancel, only driver can update status
    if (status === 'cancelled' && !isReceiver) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the request creator can cancel a delivery'
      });
    }

    if (status !== 'cancelled' && !isDriver && !isReceiver) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this delivery status'
      });
    }

    // Set actual delivery time when status is delivered
    if (status === 'delivered' && deliveryRequest.status !== 'delivered') {
      deliveryRequest.actualDeliveryTime = new Date();
      
      // Update driver stats
      if (deliveryRequest.driverId) {
        const driver = await Driver.findById(deliveryRequest.driverId);
        if (driver) {
          driver.totalDeliveries += 1;
          await driver.save();
        }
      }
    }

    deliveryRequest.status = status;
    await deliveryRequest.save();

    await deliveryRequest.populate('receiverId', 'name email phone');
    await deliveryRequest.populate('driverId');

    res.json({
      message: 'Delivery status updated successfully',
      deliveryRequest: {
        id: deliveryRequest._id,
        receiverId: deliveryRequest.receiverId._id,
        driverId: deliveryRequest.driverId,
        pickupLocation: deliveryRequest.pickupLocation,
        dropoffLocation: deliveryRequest.dropoffLocation,
        packageDetails: deliveryRequest.packageDetails,
        status: deliveryRequest.status,
        estimatedDeliveryTime: deliveryRequest.estimatedDeliveryTime,
        actualDeliveryTime: deliveryRequest.actualDeliveryTime,
        price: deliveryRequest.price,
        distance: deliveryRequest.distance,
        createdAt: deliveryRequest.createdAt,
        updatedAt: deliveryRequest.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/delivery-requests/:id
 * @desc    Update delivery request information
 * @access  Private
 */
exports.updateDeliveryRequest = async (req, res, next) => {
  try {
    const deliveryRequest = await DeliveryRequest.findById(req.params.id);

    if (!deliveryRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    // Only receiver can update
    if (deliveryRequest.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own delivery requests'
      });
    }

    // Only allow updates if status is pending
    if (deliveryRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Only pending delivery requests can be updated'
      });
    }

    // Update allowed fields
    const { pickupLocation, dropoffLocation, packageDetails } = req.body;

    if (pickupLocation) deliveryRequest.pickupLocation = pickupLocation;
    if (dropoffLocation) deliveryRequest.dropoffLocation = dropoffLocation;
    if (packageDetails) deliveryRequest.packageDetails = packageDetails;

    // Recalculate distance and price if locations changed
    if (pickupLocation || dropoffLocation) {
      const finalPickup = pickupLocation || deliveryRequest.pickupLocation;
      const finalDropoff = dropoffLocation || deliveryRequest.dropoffLocation;
      
      const distance = calculateDistance(
        finalPickup.latitude,
        finalPickup.longitude,
        finalDropoff.latitude,
        finalDropoff.longitude
      );
      
      const price = calculatePrice(distance, packageDetails?.weight || deliveryRequest.packageDetails.weight);
      const estimatedTime = calculateEstimatedTime(distance);

      deliveryRequest.distance = distance;
      deliveryRequest.price = price;
      deliveryRequest.estimatedDeliveryTime = estimatedTime;
    }

    await deliveryRequest.save();
    await deliveryRequest.populate('receiverId', 'name email phone');
    await deliveryRequest.populate('driverId');

    res.json({
      message: 'Delivery request updated successfully',
      deliveryRequest: {
        id: deliveryRequest._id,
        receiverId: deliveryRequest.receiverId._id,
        driverId: deliveryRequest.driverId,
        pickupLocation: deliveryRequest.pickupLocation,
        dropoffLocation: deliveryRequest.dropoffLocation,
        packageDetails: deliveryRequest.packageDetails,
        status: deliveryRequest.status,
        estimatedDeliveryTime: deliveryRequest.estimatedDeliveryTime,
        actualDeliveryTime: deliveryRequest.actualDeliveryTime,
        price: deliveryRequest.price,
        distance: deliveryRequest.distance,
        createdAt: deliveryRequest.createdAt,
        updatedAt: deliveryRequest.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/delivery-requests/:id
 * @desc    Cancel/delete a delivery request
 * @access  Private (User only)
 */
exports.cancelDeliveryRequest = async (req, res, next) => {
  try {
    const deliveryRequest = await DeliveryRequest.findById(req.params.id);

    if (!deliveryRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    // Only receiver can cancel
    if (deliveryRequest.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only cancel your own delivery requests'
      });
    }

    // Only allow cancellation if status is pending
    if (deliveryRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Only pending delivery requests can be cancelled'
      });
    }

    await DeliveryRequest.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Delivery request cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

