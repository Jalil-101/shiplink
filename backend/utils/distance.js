/**
 * Distance calculation utilities
 * Uses Haversine formula for calculating distance between two coordinates
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
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate estimated delivery time based on distance
 * Assumes average speed of 30 km/h
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Estimated time (e.g., "45 minutes")
 */
function calculateEstimatedTime(distanceKm) {
  const averageSpeedKmh = 30; // Average speed in km/h
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.round(hours * 60);
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hoursPart = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;
    return minutesPart > 0 
      ? `${hoursPart} hour${hoursPart > 1 ? 's' : ''} ${minutesPart} minutes`
      : `${hoursPart} hour${hoursPart > 1 ? 's' : ''}`;
  }
}

/**
 * Calculate delivery price based on distance and weight
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} weightKg - Weight in kilograms
 * @returns {number} Price in dollars
 */
function calculatePrice(distanceKm, weightKg) {
  const basePrice = 5; // Base price in dollars
  const pricePerKg = 2; // Price per kilogram
  const pricePerKm = 1.5; // Price per kilometer
  
  const weightPrice = weightKg * pricePerKg;
  const distancePrice = distanceKm * pricePerKm;
  const totalPrice = basePrice + weightPrice + distancePrice;
  
  return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
}

module.exports = {
  calculateDistance,
  calculateEstimatedTime,
  calculatePrice
};


