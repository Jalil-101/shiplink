/**
 * WhatsApp Service
 * Handles sending WhatsApp messages via Twilio WhatsApp API or WhatsApp Cloud API
 */

// Twilio WhatsApp configuration
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
 * Send WhatsApp message
 * @param {string} to - Recipient phone number (E.164 format with country code)
 * @param {string} message - WhatsApp message
 * @returns {Promise<Object>} - Send result
 */
async function sendWhatsApp(to, message) {
  try {
    const client = initializeTwilio();
    if (!client) {
      console.warn('WhatsApp service not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    // Twilio WhatsApp sandbox number or approved WhatsApp Business number
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
    if (!fromNumber) {
      console.warn('TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER not set');
      return { success: false, error: 'WhatsApp number not configured' };
    }

    // Ensure 'whatsapp:' prefix
    const from = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await client.messages.create({
      body: message,
      from: from,
      to: toFormatted
    });

    console.log('WhatsApp message sent successfully:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send shipment status WhatsApp message
 * @param {string} phoneNumber - Customer phone number
 * @param {Object} order - Order object
 * @param {string} status - New status
 */
async function sendShipmentStatusWhatsApp(phoneNumber, order, status) {
  const statusMessages = {
    created: 'Your shipment request has been created',
    provider_assigned: 'Your shipment has been assigned to a logistics company',
    in_progress: 'Your shipment is now in progress',
    completed: 'Your shipment has been delivered successfully',
    cancelled: 'Your shipment has been cancelled',
    failed: 'Your shipment delivery failed'
  };

  const message = `🚚 *ShipLink Shipment Update*\n\n${statusMessages[status] || 'Your shipment status has been updated'}.\n\n*Order Number:* ${order.orderNumber || order.order_id}\n\nTrack your shipment: ${process.env.FRONTEND_URL || 'https://shiplink.com'}/track`;

  return await sendWhatsApp(phoneNumber, message);
}

/**
 * Send delay alert WhatsApp message
 * @param {string} phoneNumber - Customer phone number
 * @param {Object} order - Order object
 * @param {string} reason - Reason for delay
 */
async function sendDelayAlertWhatsApp(phoneNumber, order, reason) {
  const message = `⚠️ *Shipment Delay Alert*\n\nYour order *${order.orderNumber || order.order_id}* has been delayed.\n\n*Reason:* ${reason}\n\nWe apologize for the inconvenience and are working to resolve this issue.`;

  return await sendWhatsApp(phoneNumber, message);
}

module.exports = {
  sendWhatsApp,
  sendShipmentStatusWhatsApp,
  sendDelayAlertWhatsApp
};



