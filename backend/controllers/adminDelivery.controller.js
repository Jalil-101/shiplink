/**
 * Admin Delivery Oversight Controller
 * Handles delivery request management by admins
 */

const DeliveryRequest = require('../models/DeliveryRequest.model');
const Driver = require('../models/Driver.model');
const User = require('../models/User.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/deliveries
 * @desc    Get all delivery requests with filters
 * @access  Private (Admin)
 */
exports.getAllDeliveries = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let deliveries = await DeliveryRequest.find(query)
      .populate('userId', 'name email phone')
      .populate('receiverId', 'name email phone')
      .populate('driverId', 'userId vehicleType vehicleModel')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by search if provided
    if (search) {
      deliveries = deliveries.filter(delivery => {
        const user = delivery.userId || delivery.receiverId;
        return (
          delivery._id?.toString().includes(search) ||
          user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          delivery.pickupLocation?.address?.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    const total = await DeliveryRequest.countDocuments(query);

    await createAuditLog(req, 'view_deliveries', 'deliveries', null, { filters: query });

    res.json({
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all deliveries error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching deliveries'
    });
  }
};

/**
 * @route   GET /api/admin/deliveries/:id
 * @desc    Get delivery request by ID with full details
 * @access  Private (Admin)
 */
exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await DeliveryRequest.findById(req.params.id)
      .populate('userId', 'name email phone avatar')
      .populate('receiverId', 'name email phone avatar')
      .populate('driverId', 'userId vehicleType vehicleModel vehiclePlate licenseNumber')
      .populate('driverId.userId', 'name email phone');

    if (!delivery) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    await createAuditLog(req, 'view_delivery', 'delivery', req.params.id);

    res.json({
      delivery
    });
  } catch (error) {
    console.error('Get delivery by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching delivery'
    });
  }
};

/**
 * @route   PATCH /api/admin/deliveries/:id/reassign
 * @desc    Reassign delivery to a different driver (admin override)
 * @access  Private (Admin)
 */
exports.reassignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Driver ID is required'
      });
    }

    const delivery = await DeliveryRequest.findById(id);
    
    if (!delivery) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    // Verify driver exists and is available
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    if (!driver.isAvailable) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Driver is not available'
      });
    }

    const previousDriverId = delivery.driverId?.toString() || null;
    delivery.driverId = driverId;
    delivery.status = 'assigned';
    delivery.assignedAt = new Date();
    
    await delivery.save();

    await createAuditLog(
      req,
      'reassign_driver',
      'delivery',
      id,
      { previousDriverId, newDriverId: driverId }
    );

    res.json({
      message: 'Delivery reassigned successfully',
      delivery: {
        id: delivery._id,
        driverId: delivery.driverId,
        status: delivery.status,
        assignedAt: delivery.assignedAt
      }
    });
  } catch (error) {
    console.error('Reassign driver error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error reassigning driver'
    });
  }
};

/**
 * @route   PATCH /api/admin/deliveries/:id/resolve-dispute
 * @desc    Resolve delivery dispute
 * @access  Private (Admin)
 */
exports.resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, notes } = req.body;

    if (!resolution || !notes) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Resolution and notes are required'
      });
    }

    const delivery = await DeliveryRequest.findById(id);
    
    if (!delivery) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    // Add dispute resolution to delivery
    if (!delivery.disputeResolution) {
      delivery.disputeResolution = {};
    }
    
    delivery.disputeResolution.resolved = true;
    delivery.disputeResolution.resolution = resolution;
    delivery.disputeResolution.notes = notes;
    delivery.disputeResolution.resolvedBy = req.admin._id;
    delivery.disputeResolution.resolvedAt = new Date();
    
    await delivery.save();

    await createAuditLog(
      req,
      'resolve_dispute',
      'delivery',
      id,
      { resolution, notes }
    );

    res.json({
      message: 'Dispute resolved successfully',
      delivery: {
        id: delivery._id,
        disputeResolution: delivery.disputeResolution
      }
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error resolving dispute'
    });
  }
};

/**
 * @route   PATCH /api/admin/deliveries/:id/status
 * @desc    Update delivery status (admin override)
 * @access  Private (Admin)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'assigned', 'accepted', 'picked_up', 'in-transit', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const delivery = await DeliveryRequest.findById(id);
    
    if (!delivery) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Delivery request not found'
      });
    }

    const previousStatus = delivery.status;
    delivery.status = status;
    
    if (notes) {
      if (!delivery.adminNotes) {
        delivery.adminNotes = [];
      }
      delivery.adminNotes.push({
        note: notes,
        addedBy: req.admin._id,
        addedAt: new Date()
      });
    }
    
    await delivery.save();

    await createAuditLog(
      req,
      'update_delivery_status',
      'delivery',
      id,
      { previousStatus, newStatus: status, notes }
    );

    res.json({
      message: 'Delivery status updated successfully',
      delivery: {
        id: delivery._id,
        status: delivery.status,
        adminNotes: delivery.adminNotes
      }
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating delivery status'
    });
  }
};

