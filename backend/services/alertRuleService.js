/**
 * Alert Rule Service
 * Evaluates and executes alert rules
 */

const AlertRule = require('../models/AlertRule.model');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const { sendWhatsApp } = require('../services/whatsappService');
const { createNotification } = require('../utils/notificationService');

/**
 * Evaluate alert rules for a given trigger
 * @param {string} companyId - Logistics company ID
 * @param {string} trigger - Trigger type
 * @param {Object} context - Context data (order, status, etc.)
 */
async function evaluateAlertRules(companyId, trigger, context) {
  try {
    // Get active alert rules for this company and trigger
    const rules = await AlertRule.find({
      companyId,
      trigger,
      isActive: true
    });

    for (const rule of rules) {
      // Check if conditions are met
      if (checkConditions(rule.conditions, context)) {
        // Execute actions
        await executeRuleActions(rule, context);
        
        // Update rule stats
        rule.lastTriggered = new Date();
        rule.triggerCount += 1;
        await rule.save();
      }
    }
  } catch (error) {
    console.error('Error evaluating alert rules:', error);
    // Don't throw - alert rules shouldn't break main flow
  }
}

/**
 * Check if rule conditions are met
 * @param {Object} conditions - Rule conditions
 * @param {Object} context - Context data
 * @returns {boolean}
 */
function checkConditions(conditions, context) {
  for (const [key, value] of Object.entries(conditions)) {
    if (key === 'status' && context.status !== value) {
      return false;
    }
    if (key === 'delayHours' && context.delayHours < value) {
      return false;
    }
    if (key === 'exceptionType' && context.exceptionType !== value) {
      return false;
    }
    // Add more condition checks as needed
  }
  return true;
}

/**
 * Execute rule actions
 * @param {Object} rule - Alert rule
 * @param {Object} context - Context data
 */
async function executeRuleActions(rule, context) {
  const { channels, recipients, template } = rule.actions;
  const message = template || generateDefaultMessage(rule.trigger, context);

  for (const channel of channels) {
    for (const recipient of recipients) {
      try {
        if (channel === 'email') {
          await sendEmail({
            to: recipient,
            subject: `Alert: ${rule.name}`,
            html: message.replace(/\n/g, '<br>'),
            text: message
          });
        } else if (channel === 'sms') {
          await sendSMS(recipient, message);
        } else if (channel === 'whatsapp') {
          await sendWhatsApp(recipient, message);
        } else if (channel === 'in_app') {
          // Get user ID from recipient (could be email or phone)
          // For now, create notification for company admin
          await createNotification({
            userId: context.userId || rule.companyId,
            title: rule.name,
            message: message,
            category: 'deliveries',
            type: 'warning',
            priority: 'high',
            relatedId: context.orderId,
            relatedType: 'Order'
          });
        }
      } catch (error) {
        console.error(`Error sending ${channel} alert to ${recipient}:`, error);
        // Continue with other recipients/channels
      }
    }
  }
}

/**
 * Generate default message based on trigger
 * @param {string} trigger - Trigger type
 * @param {Object} context - Context data
 * @returns {string}
 */
function generateDefaultMessage(trigger, context) {
  const messages = {
    status_change: `Order ${context.orderNumber || context.orderId} status changed to ${context.status}`,
    delay: `Order ${context.orderNumber || context.orderId} has been delayed by ${context.delayHours} hours`,
    exception: `Exception detected for order ${context.orderNumber || context.orderId}: ${context.exceptionType}`,
    eta_update: `ETA updated for order ${context.orderNumber || context.orderId}: ${context.eta}`,
    payment_received: `Payment received for order ${context.orderNumber || context.orderId}: $${context.amount}`
  };
  return messages[trigger] || `Alert triggered for order ${context.orderNumber || context.orderId}`;
}

module.exports = {
  evaluateAlertRules
};



