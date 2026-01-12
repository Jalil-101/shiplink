/**
 * Logistics Alert Rule Controller
 * Handles alert rule management for logistics companies
 */

const AlertRule = require('../models/AlertRule.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');

/**
 * @route   POST /api/logistics-companies/dashboard/alert-rules
 * @desc    Create an alert rule
 * @access  Private (Logistics Company)
 */
exports.createAlertRule = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, description, trigger, conditions, actions } = req.body;

    if (!name || !trigger || !actions || !actions.channels || !actions.recipients) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, trigger, and actions (channels, recipients) are required'
      });
    }

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const alertRule = await AlertRule.create({
      companyId: company._id,
      name,
      description: description || null,
      trigger,
      conditions: conditions || {},
      actions,
      isActive: true
    });

    res.status(201).json({
      message: 'Alert rule created successfully',
      alertRule
    });
  } catch (error) {
    console.error('Create alert rule error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating alert rule'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/alert-rules
 * @desc    Get all alert rules for the company
 * @access  Private (Logistics Company)
 */
exports.getAlertRules = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const alertRules = await AlertRule.find({ companyId: company._id })
      .sort({ createdAt: -1 });

    res.json({ alertRules });
  } catch (error) {
    console.error('Get alert rules error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching alert rules'
    });
  }
};

/**
 * @route   PATCH /api/logistics-companies/dashboard/alert-rules/:ruleId
 * @desc    Update an alert rule
 * @access  Private (Logistics Company)
 */
exports.updateAlertRule = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { ruleId } = req.params;
    const { name, description, trigger, conditions, actions, isActive } = req.body;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const alertRule = await AlertRule.findOne({
      _id: ruleId,
      companyId: company._id
    });

    if (!alertRule) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Alert rule not found'
      });
    }

    if (name) alertRule.name = name;
    if (description !== undefined) alertRule.description = description;
    if (trigger) alertRule.trigger = trigger;
    if (conditions) alertRule.conditions = conditions;
    if (actions) alertRule.actions = actions;
    if (isActive !== undefined) alertRule.isActive = isActive;

    await alertRule.save();

    res.json({
      message: 'Alert rule updated successfully',
      alertRule
    });
  } catch (error) {
    console.error('Update alert rule error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating alert rule'
    });
  }
};

/**
 * @route   DELETE /api/logistics-companies/dashboard/alert-rules/:ruleId
 * @desc    Delete an alert rule
 * @access  Private (Logistics Company)
 */
exports.deleteAlertRule = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { ruleId } = req.params;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const alertRule = await AlertRule.findOneAndDelete({
      _id: ruleId,
      companyId: company._id
    });

    if (!alertRule) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Alert rule not found'
      });
    }

    res.json({
      message: 'Alert rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete alert rule error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting alert rule'
    });
  }
};

