import type { Request, Response } from "express";
import Driver from "../models/driver.model.js";
import DriverStats from "../models/driver_stats.model.js";
import type { AuthRequest } from "../middleware/auth_check.js";
import type { DriverInput } from "../schemas/driver.schema.js";
import { findNearbyDrivers } from "../utils/location.js";

/**
 * Create a new driver profile
 */
export const createDriver = async (req: Request, res: Response) => {
    try {
        const driverData: DriverInput = req.body;

        // Validate required fields
        if (!driverData.licenseNumber || !driverData.vehicleType || !driverData.vehicleModel || !driverData.vehiclePlate) {
            return res.status(400).json({ error: "Missing required driver information" });
        }

        // Check if driver with this license already exists
        const existingDriver = await Driver.findOne({ licenseNumber: driverData.licenseNumber });
        if (existingDriver) {
            return res.status(400).json({ error: "Driver with this license number already exists" });
        }

        const newDriver = new Driver({
            ...driverData,
            role: 'driver',
            rating: driverData.rating || 5,
            totalDeliveries: 0,
            isAvailable: driverData.isAvailable !== undefined ? driverData.isAvailable : true,
        });

        await newDriver.save();

        // Create driver stats
        const driverStats = new DriverStats({
            driverId: newDriver._id,
            totalDeliveries: 0,
            successfulDeliveries: 0,
            deliveriesThisMonth: 0,
            averageEarningPerDelivery: 0,
            deliveries: [],
        });

        await driverStats.save();

        return res.status(201).json({
            message: "Driver created successfully",
            driver: newDriver,
        });
    } catch (error) {
        console.error("Create driver error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get all drivers with optional filters
 */
export const getAllDrivers = async (req: Request, res: Response) => {
    try {
        const { isAvailable, vehicleType, minRating } = req.query;

        // Build filter query
        const filter: any = {};

        if (isAvailable !== undefined) {
            filter.isAvailable = isAvailable === 'true';
        }

        if (vehicleType) {
            filter.vehicleType = vehicleType;
        }

        if (minRating) {
            filter.rating = { $gte: parseFloat(minRating as string) };
        }

        const drivers = await Driver.find(filter).sort({ rating: -1 });

        return res.json({
            message: "Drivers fetched successfully",
            count: drivers.length,
            drivers,
        });
    } catch (error) {
        console.error("Get all drivers error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get driver by ID
 */
export const getDriverById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({ error: "Driver not found" });
        }

        return res.json({
            message: "Driver fetched successfully",
            driver,
        });
    } catch (error) {
        console.error("Get driver by ID error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update driver information
 */
export const updateDriver = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Don't allow updating certain fields
        delete updateData.totalDeliveries;
        delete updateData.rating;
        delete updateData.role;

        const driver = await Driver.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!driver) {
            return res.status(404).json({ error: "Driver not found" });
        }

        return res.json({
            message: "Driver updated successfully",
            driver,
        });
    } catch (error) {
        console.error("Update driver error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete driver
 */
export const deleteDriver = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const driver = await Driver.findByIdAndDelete(id);

        if (!driver) {
            return res.status(404).json({ error: "Driver not found" });
        }

        // Also delete driver stats
        await DriverStats.findOneAndDelete({ driverId: id });

        return res.json({
            message: "Driver deleted successfully",
        });
    } catch (error) {
        console.error("Delete driver error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update driver location
 */
export const updateDriverLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ error: "Invalid coordinates" });
        }

        const driver = await Driver.findByIdAndUpdate(
            id,
            {
                $set: {
                    location: { latitude, longitude }
                }
            },
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({ error: "Driver not found" });
        }

        return res.json({
            message: "Driver location updated successfully",
            driver,
        });
    } catch (error) {
        console.error("Update driver location error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Toggle driver availability
 */
export const toggleAvailability = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({ error: "Driver not found" });
        }

        driver.isAvailable = !driver.isAvailable;
        await driver.save();

        return res.json({
            message: `Driver is now ${driver.isAvailable ? 'available' : 'unavailable'}`,
            driver,
        });
    } catch (error) {
        console.error("Toggle availability error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get driver statistics
 */
export const getDriverStats = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const driver = await Driver.findById(id);
        if (!driver) {
            return res.status(404).json({ error: "Driver not found" });
        }

        const stats = await DriverStats.findOne({ driverId: id });

        if (!stats) {
            return res.status(404).json({ error: "Driver statistics not found" });
        }

        return res.json({
            message: "Driver statistics fetched successfully",
            stats: {
                driver: {
                    id: driver._id,
                    licenseNumber: driver.licenseNumber,
                    vehicleType: driver.vehicleType,
                    rating: driver.rating,
                },
                ...stats.toObject(),
            },
        });
    } catch (error) {
        console.error("Get driver stats error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Find nearby available drivers
 */
export const findNearbyAvailableDrivers = async (req: Request, res: Response) => {
    try {
        const { latitude, longitude, radius, vehicleType } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        const lat = parseFloat(latitude as string);
        const lon = parseFloat(longitude as string);
        const radiusKm = radius ? parseFloat(radius as string) : 10;

        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return res.status(400).json({ error: "Invalid coordinates" });
        }

        // Build filter for vehicle type
        const filter: any = { isAvailable: true };
        if (vehicleType) {
            filter.vehicleType = vehicleType;
        }

        const allDrivers = await Driver.find(filter);
        const nearbyDrivers = findNearbyDrivers(lat, lon, allDrivers, radiusKm);

        return res.json({
            message: "Nearby drivers found",
            count: nearbyDrivers.length,
            searchRadius: radiusKm,
            drivers: nearbyDrivers,
        });
    } catch (error) {
        console.error("Find nearby drivers error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get driver's own profile (authenticated)
 */
export const getMyDriverProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Find driver associated with this user
        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({ error: "Driver profile not found" });
        }

        return res.json({
            message: "Driver profile fetched successfully",
            driver,
        });
    } catch (error) {
        console.error("Get my driver profile error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
