/**
 * SMS Service
 * Handles sending SMS notifications via Twilio or other providers
 */

// Twilio configuration (if using Twilio)
let twilioClient = null;

const initializeTwilio = () => {
  if (twilioClient) return twilioClient;

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    return twilioClient;
  }

  return null;
};

/**
 * Send SMS notification
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} message - SMS message
 * @returns {Promise<Object>} - Send result
 */
async function sendSMS(to, message) {
  try {
    const client = initializeTwilio();
    if (!client) {
      console.warn('SMS service not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
      return { success: false, error: 'SMS service not configured' };
    }

    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      console.warn('TWILIO_PHONE_NUMBER not set');
      return { success: false, error: 'SMS phone number not configured' };
    }

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    console.log('SMS sent successfully:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send shipment status SMS
 * @param {string} phoneNumber - Customer phone number
 * @param {Object} order - Order object
 * @param {string} status - New status
 */
async function sendShipmentStatusSMS(phoneNumber, order, status) {
  const statusMessages = {
    created: 'Your shipment request has been created',
    provider_assigned: 'Your shipment has been assigned to a logistics company',
    in_progress: 'Your shipment is now in progress',
    completed: 'Your shipment has been delivered successfully',
    cancelled: 'Your shipment has been cancelled',
    failed: 'Your shipment delivery failed'
  };

  const message = `${statusMessages[status] || 'Your shipment status has been updated'}. Order: ${order.orderNumber || order.order_id}. Track at: ${process.env.FRONTEND_URL || 'https://shiplink.com'}/track`;

  return await sendSMS(phoneNumber, message);
}

/**
 * Send delay alert SMS
 * @param {string} phoneNumber - Customer phone number
 * @param {Object} order - Order object
 * @param {string} reason - Reason for delay
 */
async function sendDelayAlertSMS(phoneNumber, order, reason) {
  const message = `Shipment Delay Alert: Your order ${order.orderNumber || order.order_id} has been delayed. Reason: ${reason}. We apologize for the inconvenience.`;

  return await sendSMS(phoneNumber, message);
}

module.exports = {
  sendSMS,
  sendShipmentStatusSMS,
  sendDelayAlertSMS
};



