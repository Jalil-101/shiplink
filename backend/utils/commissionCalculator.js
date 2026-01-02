/**
 * Commission Calculator Utility
 * Calculates commission ONLY on backend - never trust frontend
 * Commission is immutable after order completion
 */

const Seller = require('../models/Seller.model');
const SourcingAgent = require('../models/SourcingAgent.model');
const ImportCoach = require('../models/ImportCoach.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');
const Driver = require('../models/Driver.model');

/**
 * Default commission rates by order type
 */
const DEFAULT_COMMISSION_RATES = {
  delivery: 15, // 15% for delivery orders
  marketplace: 10, // 10% for marketplace orders (can be overridden by seller)
  sourcing: 5, // 5% for sourcing orders (can be overridden by agent)
  coaching: 10 // 10% for coaching orders (can be overridden by coach)
};

/**
 * Calculate commission for an order
 * @param {String} orderType - Type of order ('delivery', 'marketplace', 'sourcing', 'coaching')
 * @param {Number} grossAmount - Total amount before commission
 * @param {String} providerId - ID of provider (driver, seller, agent, coach)
 * @param {String} providerModel - Model type ('Driver', 'Seller', 'SourcingAgent', 'ImportCoach')
 * @returns {Object} Commission calculation result
 */
async function calculateCommission(orderType, grossAmount, providerId = null, providerModel = null) {
  if (!grossAmount || grossAmount <= 0) {
    return {
      commission_rate: 0,
      commission_amount: 0,
      provider_payout: 0
    };
  }

  let commissionRate = DEFAULT_COMMISSION_RATES[orderType] || 10;

  // Get provider-specific commission rate if provider exists
  if (providerId && providerModel) {
    try {
      switch (providerModel) {
        case 'Seller':
          const seller = await Seller.findById(providerId);
          if (seller && seller.commissionRate !== undefined) {
            commissionRate = seller.commissionRate;
          }
          break;
        
        case 'SourcingAgent':
          const agent = await SourcingAgent.findById(providerId);
          if (agent && agent.commissionRate !== undefined) {
            commissionRate = agent.commissionRate;
          }
          break;
        
        case 'ImportCoach':
          const coach = await ImportCoach.findById(providerId);
          if (coach && coach.consultationFee !== undefined) {
            // For coaches, commission might be based on consultation fee
            // Adjust logic as needed
            commissionRate = 10; // Default for now
          }
          break;
        
        case 'Driver':
        case 'LogisticsCompany':
          // Delivery commission is typically fixed or based on distance/weight
          // Use default delivery rate
          commissionRate = DEFAULT_COMMISSION_RATES.delivery;
          break;
      }
    } catch (error) {
      console.error('Error fetching provider commission rate:', error);
      // Fall back to default rate
    }
  }

  // Calculate commission amount
  const commissionAmount = (grossAmount * commissionRate) / 100;
  
  // Calculate provider payout
  const providerPayout = grossAmount - commissionAmount;

  return {
    commission_rate: commissionRate,
    commission_amount: parseFloat(commissionAmount.toFixed(2)),
    provider_payout: parseFloat(providerPayout.toFixed(2))
  };
}

/**
 * Calculate delivery commission based on distance and weight
 * @param {Number} distance - Distance in kilometers
 * @param {Number} weight - Weight in kg
 * @param {Number} basePrice - Base price for delivery
 * @returns {Object} Commission calculation result
 */
function calculateDeliveryCommission(distance, weight, basePrice) {
  // Delivery commission is typically a percentage of the total price
  const grossAmount = basePrice;
  return calculateCommission('delivery', grossAmount);
}

/**
 * Validate that commission hasn't been tampered with
 * @param {Object} order - Order object
 * @returns {Boolean} True if commission is valid
 */
async function validateCommission(order) {
  if (!order.order_type || !order.gross_amount) {
    return false;
  }

  // Recalculate commission
  const calculated = await calculateCommission(
    order.order_type,
    order.gross_amount,
    order.provider_id,
    order.providerModel
  );

  // Compare with stored values (allow small floating point differences)
  const rateMatch = Math.abs(calculated.commission_rate - (order.commission_rate || 0)) < 0.01;
  const amountMatch = Math.abs(calculated.commission_amount - (order.commission_amount || 0)) < 0.01;
  const payoutMatch = Math.abs(calculated.provider_payout - (order.provider_payout || 0)) < 0.01;

  return rateMatch && amountMatch && payoutMatch;
}

/**
 * Check if commission can be modified (only before completion)
 * @param {Object} order - Order object
 * @returns {Boolean} True if commission can be modified
 */
function canModifyCommission(order) {
  // Commission is immutable after order completion
  return order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'failed';
}

module.exports = {
  calculateCommission,
  calculateDeliveryCommission,
  validateCommission,
  canModifyCommission,
  DEFAULT_COMMISSION_RATES
};



