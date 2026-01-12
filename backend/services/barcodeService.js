/**
 * Barcode/QR Code Generation Service
 * Generates QR codes and barcodes for orders and tracking
 */

const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

/**
 * Generate QR code for an order
 * @param {string} orderId - Order ID
 * @param {string} orderNumber - Order number
 * @param {string} trackingUrl - Tracking URL
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
async function generateOrderQRCode(orderId, orderNumber, trackingUrl) {
  try {
    const qrData = JSON.stringify({
      orderId,
      orderNumber,
      trackingUrl,
      type: 'order'
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate barcode for tracking ID
 * @param {string} trackingId - Tracking ID
 * @returns {Promise<string>} - Base64 encoded barcode image
 */
async function generateTrackingBarcode(trackingId) {
  try {
    const canvas = createCanvas(200, 100);
    JsBarcode(canvas, trackingId, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: true
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw error;
  }
}

/**
 * Generate QR code for waybill
 * @param {string} waybillNumber - Waybill number
 * @param {Object} waybillData - Waybill data
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
async function generateWaybillQRCode(waybillNumber, waybillData) {
  try {
    const qrData = JSON.stringify({
      waybillNumber,
      ...waybillData,
      type: 'waybill'
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating waybill QR code:', error);
    throw error;
  }
}

module.exports = {
  generateOrderQRCode,
  generateTrackingBarcode,
  generateWaybillQRCode
};

