/**
 * Reliability Calculator Utility
 * Calculates system-derived reliability metrics
 * Metrics are never manually edited - only system updates
 */

const Order = require('../models/Order.model');

/**
 * Calculate reliability metrics for a provider
 * @param {String} providerId - ID of provider (driver, seller, agent, coach)
 * @param {String} providerModel - Model type ('Driver', 'Seller', 'SourcingAgent', 'ImportCoach')
 * @param {String} orderType - Optional: filter by order type
 * @returns {Object} Reliability metrics
 */
async function calculateReliabilityMetrics(providerId, providerModel, orderType = null) {
  try {
    // Build query
    const query = {
      provider_id: providerId,
      providerModel: providerModel,
      softDelete: false
    };

    if (orderType) {
      query.order_type = orderType;
    }

    // Get all orders for this provider
    const orders = await Order.find(query);

    if (!orders || orders.length === 0) {
      return {
        total_orders: 0,
        completed_orders: 0,
        cancelled_orders: 0,
        failed_orders: 0,
        completion_rate: 0,
        cancellation_rate: 0,
        delay_frequency: 0,
        complaint_frequency: 0,
        average_completion_time: null,
        rating: 0
      };
    }

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const failedOrders = orders.filter(o => o.status === 'failed').length;

    // Calculate completion rate
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calculate cancellation rate
    const cancellationRate = totalOrders > 0 ? ((cancelledOrders + failedOrders) / totalOrders) * 100 : 0;

    // Calculate delay frequency (orders completed after estimated time)
    let delayedOrders = 0;
    let totalDelayMinutes = 0;
    const completedOrdersWithTime = orders.filter(o => 
      o.status === 'completed' && 
      o.estimatedDeliveryTime && 
      o.actualDeliveryTime
    );

    completedOrdersWithTime.forEach(order => {
      const estimated = parseEstimatedTime(order.estimatedDeliveryTime);
      const actual = new Date(order.actualDeliveryTime);
      const estimatedDate = new Date(order.createdAt);
      estimatedDate.setMinutes(estimatedDate.getMinutes() + estimated);

      if (actual > estimatedDate) {
        delayedOrders++;
        const delayMinutes = (actual - estimatedDate) / (1000 * 60);
        totalDelayMinutes += delayMinutes;
      }
    });

    const delayFrequency = completedOrdersWithTime.length > 0 
      ? (delayedOrders / completedOrdersWithTime.length) * 100 
      : 0;

    // Calculate average completion time (in minutes)
    let averageCompletionTime = null;
    if (completedOrdersWithTime.length > 0) {
      const totalCompletionTime = completedOrdersWithTime.reduce((sum, order) => {
        const createdAt = new Date(order.createdAt);
        const completedAt = new Date(order.actualDeliveryTime || order.updatedAt);
        return sum + ((completedAt - createdAt) / (1000 * 60));
      }, 0);
      averageCompletionTime = totalCompletionTime / completedOrdersWithTime.length;
    }

    // Calculate complaint frequency (orders with disputes)
    const ordersWithDisputes = orders.filter(o => 
      o.disputeResolution && 
      o.disputeResolution.resolved === true
    ).length;
    const complaintFrequency = totalOrders > 0 ? (ordersWithDisputes / totalOrders) * 100 : 0;

    // Calculate rating (based on completion rate and other factors)
    // Rating is 0-5 scale
    let rating = 0;
    if (totalOrders > 0) {
      // Base rating on completion rate (0-3 points)
      rating += (completionRate / 100) * 3;
      
      // Bonus for low cancellation rate (0-1 point)
      rating += (1 - (cancellationRate / 100)) * 1;
      
      // Penalty for high delay frequency (0-1 point deduction)
      rating -= (delayFrequency / 100) * 1;
      
      // Penalty for high complaint frequency (0-1 point deduction)
      rating -= (complaintFrequency / 100) * 1;
      
      // Ensure rating is between 0 and 5
      rating = Math.max(0, Math.min(5, rating));
    }

    return {
      total_orders: totalOrders,
      completed_orders: completedOrders,
      cancelled_orders: cancelledOrders,
      failed_orders: failedOrders,
      completion_rate: parseFloat(completionRate.toFixed(2)),
      cancellation_rate: parseFloat(cancellationRate.toFixed(2)),
      delay_frequency: parseFloat(delayFrequency.toFixed(2)),
      complaint_frequency: parseFloat(complaintFrequency.toFixed(2)),
      average_completion_time: averageCompletionTime ? parseFloat(averageCompletionTime.toFixed(2)) : null,
      rating: parseFloat(rating.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating reliability metrics:', error);
    throw error;
  }
}

/**
 * Parse estimated delivery time string to minutes
 * @param {String} timeString - Time string (e.g., "30 minutes", "1 hour")
 * @returns {Number} Minutes
 */
function parseEstimatedTime(timeString) {
  if (!timeString) return 0;
  
  const lower = timeString.toLowerCase();
  const minutesMatch = lower.match(/(\d+)\s*min/i);
  const hoursMatch = lower.match(/(\d+)\s*hour/i);
  
  let minutes = 0;
  if (minutesMatch) {
    minutes += parseInt(minutesMatch[1]);
  }
  if (hoursMatch) {
    minutes += parseInt(hoursMatch[1]) * 60;
  }
  
  return minutes || 30; // Default to 30 minutes if can't parse
}

/**
 * Update reliability metrics for a provider (to be called periodically or on-demand)
 * @param {String} providerId - ID of provider
 * @param {String} providerModel - Model type
 * @returns {Object} Updated metrics
 */
async function updateProviderReliability(providerId, providerModel) {
  const metrics = await calculateReliabilityMetrics(providerId, providerModel);
  
  // Update the provider model with calculated metrics
  try {
    const ProviderModel = require(`../models/${providerModel}.model`);
    await ProviderModel.findOneAndUpdate(
      { userId: providerId },
      {
        $set: {
          rating: metrics.rating,
          // Add other metrics as needed based on provider model structure
        }
      }
    );
  } catch (error) {
    console.error(`Error updating ${providerModel} reliability metrics:`, error);
    // Don't throw - metrics calculation should not break the flow
  }
  
  return metrics;
}

module.exports = {
  calculateReliabilityMetrics,
  updateProviderReliability,
  parseEstimatedTime
};



