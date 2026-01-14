/**
 * Email Service
 * Handles sending email notifications for logistics companies and users
 */

const nodemailer = require('nodemailer');

// Email transporter configuration
// Uses environment variables for SMTP settings
// Defaults to Gmail if no SMTP config provided
let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;

  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
    }
  };

  // If using SendGrid
  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else if (process.env.AWS_SES_REGION) {
    // AWS SES configuration
    const AWS = require('aws-sdk');
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_SES_REGION
    });
    transporter = nodemailer.createTransport({
      SES: new AWS.SES({ apiVersion: '2010-12-01' })
    });
  } else if (smtpConfig.auth.user && smtpConfig.auth.pass) {
    transporter = nodemailer.createTransport(smtpConfig);
  } else {
    console.warn('Email service not configured. Set SMTP_USER and SMTP_PASS or SENDGRID_API_KEY or AWS_SES_REGION');
    return null;
  }

  return transporter;
};

/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 * @param {Array} options.cc - CC recipients (optional)
 * @param {Array} options.bcc - BCC recipients (optional)
 * @returns {Promise<Object>} - Send result
 */
const sendEmail = async (options) => {
  try {
    const emailTransporter = initializeTransporter();
    if (!emailTransporter) {
      console.warn('Email service not configured. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@shiplink.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'ShipLink';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      cc: options.cc,
      bcc: options.bcc
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send shipment status update email
 * @param {Object} user - User object with email
 * @param {Object} order - Order object
 * @param {string} status - New status
 */
const sendShipmentStatusEmail = async (user, order, status) => {
  const statusMessages = {
    created: 'Your shipment request has been created',
    provider_assigned: 'Your shipment has been assigned to a logistics company',
    in_progress: 'Your shipment is now in progress',
    completed: 'Your shipment has been delivered successfully',
    cancelled: 'Your shipment has been cancelled',
    failed: 'Your shipment delivery failed'
  };

  const subject = `Shipment Update: ${order.orderNumber || order.order_id}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .status { background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ShipLink - Shipment Update</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name || 'Customer'},</p>
          <p>${statusMessages[status] || 'Your shipment status has been updated'}.</p>
          <div class="status">
            <strong>Order Number:</strong> ${order.orderNumber || order.order_id}<br>
            <strong>Status:</strong> ${status.replace('_', ' ').toUpperCase()}<br>
            ${order.pickupLocation?.address ? `<strong>Pickup:</strong> ${order.pickupLocation.address}<br>` : ''}
            ${order.dropoffLocation?.address ? `<strong>Delivery:</strong> ${order.dropoffLocation.address}<br>` : ''}
          </div>
          <p>You can track your shipment at any time through the ShipLink app.</p>
          <a href="${process.env.FRONTEND_URL || 'https://shiplink.com'}/track" class="button">Track Shipment</a>
        </div>
        <div class="footer">
          <p>This is an automated message from ShipLink. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send pickup confirmation email
 * @param {Object} user - User object with email
 * @param {Object} order - Order object
 * @param {string} scheduledTime - Scheduled pickup time
 */
const sendPickupConfirmationEmail = async (user, order, scheduledTime) => {
  const subject = `Pickup Scheduled: ${order.orderNumber || order.order_id}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .info { background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ShipLink - Pickup Scheduled</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name || 'Customer'},</p>
          <p>Your pickup has been scheduled successfully.</p>
          <div class="info">
            <strong>Order Number:</strong> ${order.orderNumber || order.order_id}<br>
            <strong>Scheduled Pickup:</strong> ${new Date(scheduledTime).toLocaleString()}<br>
            <strong>Pickup Location:</strong> ${order.pickupLocation?.address || 'N/A'}<br>
          </div>
          <p>Please ensure someone is available at the pickup location at the scheduled time.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from ShipLink. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send delivery completion email
 * @param {Object} user - User object with email
 * @param {Object} order - Order object
 */
const sendDeliveryCompletionEmail = async (user, order) => {
  const subject = `Delivery Completed: ${order.orderNumber || order.order_id}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .info { background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ShipLink - Delivery Completed</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name || 'Customer'},</p>
          <p>Great news! Your shipment has been delivered successfully.</p>
          <div class="info">
            <strong>Order Number:</strong> ${order.orderNumber || order.order_id}<br>
            <strong>Delivery Location:</strong> ${order.dropoffLocation?.address || 'N/A'}<br>
            ${order.actualDeliveryTime ? `<strong>Delivered At:</strong> ${new Date(order.actualDeliveryTime).toLocaleString()}<br>` : ''}
          </div>
          <p>Thank you for using ShipLink!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from ShipLink. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send delay/exception alert email
 * @param {Object} user - User object with email
 * @param {Object} order - Order object
 * @param {string} reason - Reason for delay/exception
 */
const sendDelayAlertEmail = async (user, order, reason) => {
  const subject = `Shipment Delay Alert: ${order.orderNumber || order.order_id}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .alert { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ShipLink - Delay Alert</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name || 'Customer'},</p>
          <p>We wanted to inform you about a delay in your shipment.</p>
          <div class="alert">
            <strong>Order Number:</strong> ${order.orderNumber || order.order_id}<br>
            <strong>Reason:</strong> ${reason}<br>
          </div>
          <p>We are working to resolve this issue and will keep you updated. We apologize for any inconvenience.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from ShipLink. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendShipmentStatusEmail,
  sendPickupConfirmationEmail,
  sendDeliveryCompletionEmail,
  sendDelayAlertEmail
};



