/**
 * Distance calculation utilities
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate estimated delivery time based on distance
 * @param {number} distance - Distance in kilometers
 * @returns {string} Estimated time in a human-readable format
 */
function calculateEstimatedTime(distance) {
  // Average delivery speed: 30 km/h in urban areas
  const averageSpeed = 30; // km/h
  const hours = distance / averageSpeed;
  const minutes = Math.round(hours * 60);
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  }
}

/**
 * Calculate delivery price based on distance and weight
 * @param {number} distance - Distance in kilometers
 * @param {number} weight - Weight in kilograms
 * @returns {number} Price in the base currency
 */
function calculatePrice(distance, weight) {
  // Base price
  const basePrice = 5; // Base delivery fee
  
  // Distance-based pricing: $2 per km
  const distancePrice = distance * 2;
  
  // Weight-based pricing: $1 per kg
  const weightPrice = weight * 1;
  
  // Total price
  const totalPrice = basePrice + distancePrice + weightPrice;
  
  // Minimum price
  const minPrice = 10;
  
  return Math.max(totalPrice, minPrice);
}

module.exports = { calculateDistance, calculateEstimatedTime, calculatePrice };
