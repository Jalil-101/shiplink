/**
 * Admin Financial Management Controller
 * Handles payouts, earnings, and financial operations
 */

const Driver = require('../models/Driver.model');
const DeliveryRequest = require('../models/DeliveryRequest.model');
const Payout = require('../models/Payout.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/financial/earnings
 * @desc    Get earnings overview
 * @access  Private (Admin)
 */
exports.getEarningsOverview = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Total revenue
    const totalRevenue = await DeliveryRequest.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    // Revenue in period
    const periodRevenue = await DeliveryRequest.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: startDate }
        }
      },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    // Pending payouts
    const pendingPayouts = await Payout.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Completed payouts
    const completedPayouts = await Payout.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    await createAuditLog(req, 'view_earnings', 'financial', null);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      periodRevenue: periodRevenue[0]?.total || 0,
      pendingPayouts: pendingPayouts[0]?.total || 0,
      completedPayouts: completedPayouts[0]?.total || 0,
    });
  } catch (error) {
    console.error('Get earnings overview error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching earnings'
    });
  }
};

/**
 * @route   GET /api/admin/financial/drivers/:id/earnings
 * @desc    Get driver earnings breakdown
 * @access  Private (Admin)
 */
exports.getDriverEarnings = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    // Get completed deliveries
    const deliveries = await DeliveryRequest.find({
      driverId: id,
      status: 'delivered',
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    const totalEarnings = deliveries.reduce((sum, d) => sum + (d.price || 0), 0);

    // Get payouts
    const payouts = await Payout.find({
      driverId: id
    }).sort({ createdAt: -1 });

    const totalPayouts = payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayouts = payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    await createAuditLog(req, 'view_driver_earnings', 'financial', id);

    res.json({
      driver: {
        id: driver._id,
        name: (await driver.populate('userId')).userId?.name,
      },
      earnings: {
        total: totalEarnings,
        pendingPayout: pendingPayouts,
        totalPaid: totalPayouts,
        balance: totalEarnings - totalPayouts - pendingPayouts,
      },
      deliveries: deliveries.length,
      payouts: payouts.map(p => ({
        id: p._id,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get driver earnings error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching driver earnings'
    });
  }
};

/**
 * @route   GET /api/admin/financial/payouts
 * @desc    Get all payouts with filters
 * @access  Private (Admin)
 */
exports.getAllPayouts = async (req, res) => {
  try {
    const { status, driverId, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (driverId) query.driverId = driverId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payouts = await Payout.find(query)
      .populate('driverId', 'userId')
      .populate('driverId.userId', 'name email')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payout.countDocuments(query);

    await createAuditLog(req, 'view_payouts', 'financial', null, { filters: query });

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all payouts error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching payouts'
    });
  }
};

/**
 * @route   POST /api/admin/financial/payouts
 * @desc    Create new payout
 * @access  Private (Admin)
 */
exports.createPayout = async (req, res) => {
  try {
    const {
      driverId,
      amount,
      paymentMethod,
      paymentDetails,
      period,
      notes
    } = req.body;

    if (!driverId || !amount || !paymentMethod || !period) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Driver ID, amount, payment method, and period are required'
      });
    }

    // Get driver's completed deliveries in period
    const deliveries = await DeliveryRequest.find({
      driverId,
      status: 'delivered',
      createdAt: {
        $gte: new Date(period.startDate),
        $lte: new Date(period.endDate)
      }
    });

    const payout = await Payout.create({
      driverId,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDetails: paymentDetails || {},
      period: {
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate)
      },
      deliveries: deliveries.map(d => d._id),
      notes
    });

    await createAuditLog(
      req,
      'create_payout',
      'financial',
      payout._id.toString(),
      { driverId, amount, paymentMethod }
    );

    res.status(201).json({
      message: 'Payout created successfully',
      payout
    });
  } catch (error) {
    console.error('Create payout error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating payout'
    });
  }
};

/**
 * @route   PATCH /api/admin/financial/payouts/:id/process
 * @desc    Process/complete a payout
 * @access  Private (Admin)
 */
exports.processPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const payout = await Payout.findById(id);
    if (!payout) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Payout not found'
      });
    }

    payout.status = 'completed';
    payout.processedBy = req.admin._id;
    payout.processedAt = new Date();
    if (notes) payout.notes = notes;

    await payout.save();

    await createAuditLog(
      req,
      'process_payout',
      'financial',
      id,
      { amount: payout.amount, driverId: payout.driverId.toString() }
    );

    res.json({
      message: 'Payout processed successfully',
      payout
    });
  } catch (error) {
    console.error('Process payout error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error processing payout'
    });
  }
};

