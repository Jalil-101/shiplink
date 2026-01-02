/**
 * Admin Sourcing Agent Controller
 * Handles sourcing agent verification and management
 */

const SourcingAgent = require('../models/SourcingAgent.model');
const User = require('../models/User.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/sourcing-agents
 * @desc    Get all sourcing agents with filters
 * @access  Private (Admin)
 */
exports.getAllAgents = async (req, res) => {
  try {
    const { search, verificationStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    let agents = await SourcingAgent.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    if (search) {
      agents = agents.filter(agent => {
        const searchLower = search.toLowerCase();
        return (
          agent.agentName.toLowerCase().includes(searchLower) ||
          agent.userId?.email.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = agents.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedAgents = agents.slice(startIndex, startIndex + parseInt(limit));

    await createAuditLog(req, 'view_sourcing_agents', 'sourcing_agents', null, { filters: query });

    res.json({
      agents: paginatedAgents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get all sourcing agents error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching sourcing agents'
    });
  }
};

/**
 * @route   GET /api/admin/sourcing-agents/:id
 * @desc    Get sourcing agent by ID
 * @access  Private (Admin)
 */
exports.getAgentById = async (req, res) => {
  try {
    const agent = await SourcingAgent.findById(req.params.id)
      .populate('userId', 'name email phone avatar');

    if (!agent) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sourcing agent not found'
      });
    }

    await createAuditLog(req, 'view_sourcing_agent', 'sourcing_agent', req.params.id);

    res.json({ agent });
  } catch (error) {
    console.error('Get sourcing agent by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching sourcing agent'
    });
  }
};

/**
 * @route   PATCH /api/admin/sourcing-agents/:id/approve
 * @desc    Approve sourcing agent verification
 * @access  Private (Admin)
 */
exports.approveAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const agent = await SourcingAgent.findById(id);
    if (!agent) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sourcing agent not found'
      });
    }

    agent.verificationStatus = 'approved';
    agent.isVerified = true;
    agent.verifiedAt = new Date();
    agent.verifiedBy = req.admin._id;
    if (notes) agent.verificationNotes = notes;

    await agent.save();

    await createAuditLog(
      req,
      'approve_sourcing_agent',
      'sourcing_agent',
      id,
      { notes }
    );

    res.json({
      message: 'Sourcing agent approved successfully',
      agent: {
        id: agent._id,
        verificationStatus: agent.verificationStatus,
        verifiedAt: agent.verifiedAt
      }
    });
  } catch (error) {
    console.error('Approve sourcing agent error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error approving sourcing agent'
    });
  }
};

/**
 * @route   PATCH /api/admin/sourcing-agents/:id/reject
 * @desc    Reject sourcing agent verification
 * @access  Private (Admin)
 */
exports.rejectAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rejection notes are required'
      });
    }

    const agent = await SourcingAgent.findById(id);
    if (!agent) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sourcing agent not found'
      });
    }

    agent.verificationStatus = 'rejected';
    agent.isVerified = false;
    agent.verifiedAt = new Date();
    agent.verifiedBy = req.admin._id;
    agent.verificationNotes = notes;

    await agent.save();

    await createAuditLog(
      req,
      'reject_sourcing_agent',
      'sourcing_agent',
      id,
      { notes }
    );

    res.json({
      message: 'Sourcing agent rejected successfully',
      agent: {
        id: agent._id,
        verificationStatus: agent.verificationStatus,
        verificationNotes: agent.verificationNotes
      }
    });
  } catch (error) {
    console.error('Reject sourcing agent error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error rejecting sourcing agent'
    });
  }
};

/**
 * @route   PATCH /api/admin/sourcing-agents/:id/suspend
 * @desc    Suspend sourcing agent
 * @access  Private (Admin)
 */
exports.suspendAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const agent = await SourcingAgent.findById(id).populate('userId');
    if (!agent || !agent.userId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Sourcing agent not found'
      });
    }

    agent.verificationStatus = 'suspended';
    agent.isActive = false;
    if (reason) agent.verificationNotes = reason;

    const user = agent.userId;
    user.isSuspended = true;
    user.suspensionReason = reason || 'Sourcing agent suspended by admin';

    await agent.save();
    await user.save();

    await createAuditLog(
      req,
      'suspend_sourcing_agent',
      'sourcing_agent',
      id,
      { reason }
    );

    res.json({
      message: 'Sourcing agent suspended successfully',
      agent: {
        id: agent._id,
        verificationStatus: agent.verificationStatus,
        isActive: agent.isActive
      }
    });
  } catch (error) {
    console.error('Suspend sourcing agent error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error suspending sourcing agent'
    });
  }
};



