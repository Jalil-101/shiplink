/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
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
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};

/**
 * Calculate delivery price based on distance, weight, and vehicle type
 * @param distance Distance in kilometers
 * @param weight Package weight in kilograms
 * @param vehicleType Type of vehicle
 * @returns Price in currency units
 */
export const calculatePrice = (
    distance: number,
    weight: number,
    vehicleType: 'car' | 'truck' | 'motorcycle' = 'car'
): number => {
    // Base price
    let basePrice = 5;

    // Price per kilometer
    const pricePerKm: Record<string, number> = {
        motorcycle: 0.8,
        car: 1.2,
        truck: 2.0,
    };

    // Weight surcharge (per kg above 5kg)
    const weightSurcharge = weight > 5 ? (weight - 5) * 0.5 : 0;

    // Calculate total price
    const distancePrice = distance * pricePerKm[vehicleType];
    const totalPrice = basePrice + distancePrice + weightSurcharge;

    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate estimated delivery time based on distance
 * @param distance Distance in kilometers
 * @param vehicleType Type of vehicle
 * @returns Estimated time in minutes
 */
export const calculateEstimatedTime = (
    distance: number,
    vehicleType: 'car' | 'truck' | 'motorcycle' = 'car'
): number => {
    // Average speed in km/h
    const averageSpeed: Record<string, number> = {
        motorcycle: 45,
        car: 40,
        truck: 35,
    };

    // Add 10 minutes for pickup and drop-off
    const baseTime = 10;

    // Calculate travel time in minutes
    const travelTime = (distance / averageSpeed[vehicleType]) * 60;

    return Math.round(baseTime + travelTime);
};

/**
 * Find drivers within a certain radius
 * @param pickupLat Pickup latitude
 * @param pickupLon Pickup longitude
 * @param drivers Array of drivers with location data
 * @param radiusKm Search radius in kilometers (default 10km)
 * @returns Array of drivers within radius, sorted by distance
 */
export const findNearbyDrivers = <T extends { location?: { latitude: number; longitude: number }; isAvailable: boolean }>(
    pickupLat: number,
    pickupLon: number,
    drivers: T[],
    radiusKm: number = 10
): Array<T & { distance: number }> => {
    const nearbyDrivers = drivers
        .filter((driver) => driver.isAvailable && driver.location)
        .map((driver) => {
            const distance = calculateDistance(
                pickupLat,
                pickupLon,
                driver.location!.latitude,
                driver.location!.longitude
            );

            return {
                ...driver,
                distance,
            };
        })
        .filter((driver) => driver.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

    return nearbyDrivers;
};
