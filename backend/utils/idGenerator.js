/**
 * ID Generator Utility
 * Centralized generation of order_id and orderNumber
 */

const Counter = require('../models/Counter.model');

/**
 * Get and increment a counter atomically
 * @param {string} key
 * @returns {Promise<number>}
 */
async function getNextSequence(key) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

/**
 * Generate global order_id
 * Format: ORD-YYYYMMDD-########
 */
async function generateGlobalOrderId(date = new Date()) {
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const dateKey = `${yyyy}${mm}${dd}`;

  const seq = await getNextSequence(`order_global_${dateKey}`);
  const seqStr = seq.toString().padStart(8, '0');

  return `ORD-${dateKey}-${seqStr}`;
}

/**
 * Get role code for orderNumber
 */
function getRoleCode(role) {
  switch (role) {
    case 'seller':
      return 'S';
    case 'logistics-company':
      return 'L';
    case 'driver':
      return 'D';
    case 'sourcing-agent':
      return 'SA';
    case 'import-coach':
      return 'IC';
    default:
      return 'U';
  }
}

/**
 * Generate human-readable orderNumber
 * Format: SHL-<roleCode>-<shortUserId>-<dailySeq>
 */
async function generateOrderNumber(user, role, date = new Date()) {
  if (!user || !user._id) {
    throw new Error('User is required to generate orderNumber');
  }

  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const dateKey = `${yyyy}${mm}${dd}`;

  const userIdStr = user._id.toString();
  const shortUserId = userIdStr.slice(-4).toUpperCase();
  const roleCode = getRoleCode(role);

  const counterKey = `order_user_${userIdStr}_${dateKey}`;
  const seq = await getNextSequence(counterKey);
  const seqStr = seq.toString().padStart(4, '0');

  return `SHL-${roleCode}-${shortUserId}-${seqStr}`;
}

module.exports = {
  generateGlobalOrderId,
  generateOrderNumber,
};


