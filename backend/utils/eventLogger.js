/**
 * Event Logger Utility
 * Creates immutable event logs for orders, role switches, and system events
 */

const AuditLog = require('../models/AuditLog.model');

/**
 * Log an event
 * @param {Object} options - Event options
 * @param {String} options.event_type - Type of event
 * @param {String} options.actor_id - ID of user/admin who triggered event
 * @param {String} options.actorModel - Model type ('User' or 'AdminUser')
 * @param {String} options.order_id - Order ID (if order-related)
 * @param {Object} options.metadata - Additional event data
 * @param {String} options.ipAddress - IP address (optional)
 * @param {String} options.userAgent - User agent (optional)
 * @param {String} options.status - Event status ('success', 'failure', 'error')
 * @param {String} options.errorMessage - Error message (if status is error/failure)
 */
async function logEvent({
  event_type,
  actor_id,
  actorModel = 'User',
  order_id = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
  status = 'success',
  errorMessage = null
}) {
  try {
    // Determine adminId if actor is AdminUser
    let adminId = null;
    if (actorModel === 'AdminUser') {
      adminId = actor_id;
    }

    const event = new AuditLog({
      event_type,
      actor_id,
      actorModel,
      adminId,
      order_id,
      metadata,
      ipAddress,
      userAgent,
      status,
      errorMessage
    });

    await event.save();
    return event;
  } catch (error) {
    console.error('Error logging event:', error);
    // Don't throw - event logging should not break the main flow
    return null;
  }
}

/**
 * Log order creation event
 */
async function logOrderCreated(orderId, userId, orderData = {}) {
  return logEvent({
    event_type: 'order_created',
    actor_id: userId,
    actorModel: 'User',
    order_id: orderId,
    metadata: {
      order_type: orderData.order_type,
      gross_amount: orderData.gross_amount,
      ...orderData
    }
  });
}

/**
 * Log order status change event
 */
async function logOrderStatusChanged(orderId, userId, oldStatus, newStatus, reason = null) {
  return logEvent({
    event_type: 'order_status_changed',
    actor_id: userId,
    actorModel: 'User',
    order_id: orderId,
    metadata: {
      old_status: oldStatus,
      new_status: newStatus,
      reason
    }
  });
}

/**
 * Log order cancellation event
 */
async function logOrderCancelled(orderId, userId, reason = null) {
  return logEvent({
    event_type: 'order_cancelled',
    actor_id: userId,
    actorModel: 'User',
    order_id: orderId,
    metadata: {
      reason
    }
  });
}

/**
 * Log order completion event
 */
async function logOrderCompleted(orderId, userId, orderData = {}) {
  return logEvent({
    event_type: 'order_completed',
    actor_id: userId,
    actorModel: 'User',
    order_id: orderId,
    metadata: {
      gross_amount: orderData.gross_amount,
      commission_amount: orderData.commission_amount,
      provider_payout: orderData.provider_payout,
      ...orderData
    }
  });
}

/**
 * Log commission calculation event
 */
async function logCommissionCalculated(orderId, userId, commissionData = {}) {
  return logEvent({
    event_type: 'commission_calculated',
    actor_id: userId,
    actorModel: 'User',
    order_id: orderId,
    metadata: {
      commission_rate: commissionData.commission_rate,
      commission_amount: commissionData.commission_amount,
      gross_amount: commissionData.gross_amount,
      provider_payout: commissionData.provider_payout
    }
  });
}

/**
 * Log role switch event
 */
async function logRoleSwitched(userId, oldRole, newRole) {
  return logEvent({
    event_type: 'role_switched',
    actor_id: userId,
    actorModel: 'User',
    metadata: {
      old_role: oldRole,
      new_role: newRole
    }
  });
}

/**
 * Log role request event
 */
async function logRoleRequested(userId, requestedRole) {
  return logEvent({
    event_type: 'role_requested',
    actor_id: userId,
    actorModel: 'User',
    metadata: {
      requested_role: requestedRole
    }
  });
}

/**
 * Log admin action (for backward compatibility)
 */
async function logAdminAction(adminId, action, resource, resourceId = null, details = {}) {
  return logEvent({
    event_type: 'admin_action',
    actor_id: adminId,
    actorModel: 'AdminUser',
    adminId,
    action,
    resource,
    resourceId,
    metadata: details
  });
}

module.exports = {
  logEvent,
  logOrderCreated,
  logOrderStatusChanged,
  logOrderCancelled,
  logOrderCompleted,
  logCommissionCalculated,
  logRoleSwitched,
  logRoleRequested,
  logAdminAction
};



