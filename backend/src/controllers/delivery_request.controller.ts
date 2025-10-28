import type { Request, Response } from "express";
import DeliveryRequest from "../models/delivery_request.model.js";
import Driver from "../models/driver.model.js";
import DriverStats from "../models/driver_stats.model.js";
import type { AuthRequest } from "../middleware/auth_check.js";
import { calculateDistance, calculatePrice, calculateEstimatedTime } from "../utils/location.js";

/**
 * Create a new delivery request
 */
export const createDeliveryRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const {
            pickupLocation,
            dropoffLocation,
            packageDetails,
            driverId
        } = req.body;

        // Validate required fields
        if (!pickupLocation || !dropoffLocation || !packageDetails) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Calculate distance
        const distance = calculateDistance(
            pickupLocation.latitude,
            pickupLocation.longitude,
            dropoffLocation.latitude,
            dropoffLocation.longitude
        );

        // Calculate price (default to car if no driver specified yet)
        const vehicleType = driverId ? (await Driver.findById(driverId))?.vehicleType || 'car' : 'car';
        const price = calculatePrice(distance, packageDetails.weight, vehicleType);

        // Calculate estimated delivery time
        const estimatedMinutes = calculateEstimatedTime(distance, vehicleType);
        const estimatedDeliveryTime = new Date(Date.now() + estimatedMinutes * 60000).toISOString();

        const newRequest = new DeliveryRequest({
            receiverId: userId,
            driverId: driverId || null,
            pickupLocation,
            dropoffLocation,
            packageDetails,
            status: 'pending',
            price,
            estimatedDeliveryTime,
        });

        await newRequest.save();

        return res.status(201).json({
            message: "Delivery request created successfully",
            deliveryRequest: newRequest,
            estimatedDistance: distance,
            estimatedTime: `${estimatedMinutes} minutes`,
        });
    } catch (error) {
        console.error("Create delivery request error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get all delivery requests with optional filters
 */
export const getAllDeliveryRequests = async (req: Request, res: Response) => {
    try {
        const { status, userId, driverId } = req.query;

        // Build filter query
        const filter: any = {};

        if (status) {
            filter.status = status;
        }

        if (userId) {
            filter.receiverId = userId;
        }

        if (driverId) {
            filter.driverId = driverId;
        }

        const requests = await DeliveryRequest.find(filter)
            .populate('receiverId', 'name email phone')
            .populate('driverId', 'licenseNumber vehicleType vehiclePlate rating')
            .sort({ createdAt: -1 });

        return res.json({
            message: "Delivery requests fetched successfully",
            count: requests.length,
            deliveryRequests: requests,
        });
    } catch (error) {
        console.error("Get all delivery requests error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get delivery request by ID
 */
export const getDeliveryRequestById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const request = await DeliveryRequest.findById(id)
            .populate('receiverId', 'name email phone')
            .populate('driverId', 'licenseNumber vehicleType vehiclePlate rating');

        if (!request) {
            return res.status(404).json({ error: "Delivery request not found" });
        }

        return res.json({
            message: "Delivery request fetched successfully",
            deliveryRequest: request,
        });
    } catch (error) {
        console.error("Get delivery request by ID error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update delivery request
 */
export const updateDeliveryRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Don't allow updating certain fields directly
        delete updateData.receiverId;
        delete updateData.createdAt;
        delete updateData.actualDeliveryTime;

        const request = await DeliveryRequest.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({ error: "Delivery request not found" });
        }

        return res.json({
            message: "Delivery request updated successfully",
            deliveryRequest: request,
        });
    } catch (error) {
        console.error("Update delivery request error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete/Cancel delivery request
 */
export const deleteDeliveryRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const request = await DeliveryRequest.findById(id);

        if (!request) {
            return res.status(404).json({ error: "Delivery request not found" });
        }

        // Only allow deletion if status is pending or cancelled
        if (request.status !== 'pending' && request.status !== 'cancelled') {
            return res.status(400).json({
                error: "Cannot delete request in current status. Cancel it first.",
            });
        }

        await DeliveryRequest.findByIdAndDelete(id);

        return res.json({
            message: "Delivery request deleted successfully",
        });
    } catch (error) {
        console.error("Delete delivery request error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Assign driver to delivery request
 */
export const assignDriver = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { driverId } = req.body;

        if (!driverId) {
            return res.status(400).json({ error: "Driver ID is required" });
        }

        // Check if driver exists and is available
        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ error: "Driver not found" });
        }

        if (!driver.isAvailable) {
            return res.status(400).json({ error: "Driver is not available" });
        }

        const request = await DeliveryRequest.findById(id);
        if (!request) {
            return res.status(404).json({ error: "Delivery request not found" });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                error: "Can only assign driver to pending requests",
            });
        }

        // Update request with driver
        request.driverId = driverId as any;
        request.status = 'accepted';
        await request.save();

        // Update driver availability
        driver.isAvailable = false;
        await driver.save();

        return res.json({
            message: "Driver assigned successfully",
            deliveryRequest: request,
        });
    } catch (error) {
        console.error("Assign driver error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Driver accepts delivery request
 */
export const acceptRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const driverId = req.user?.userId;

        if (!driverId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const request = await DeliveryRequest.findById(id);
        if (!request) {
            return res.status(404).json({ error: "Delivery request not found" });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                error: "Request is not available for acceptance",
            });
        }

        // Find driver profile
        const driver = await Driver.findOne({ userId: driverId });
        if (!driver) {
            return res.status(404).json({ error: "Driver profile not found" });
        }

        if (!driver.isAvailable) {
            return res.status(400).json({ error: "You are not available" });
        }

        request.driverId = driver._id as any;
        request.status = 'accepted';
        await request.save();

        driver.isAvailable = false;
        await driver.save();

        return res.json({
            message: "Delivery request accepted successfully",
            deliveryRequest: request,
        });
    } catch (error) {
        console.error("Accept request error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update delivery status
 */
export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }

        const validStatuses = ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid status",
                validStatuses,
            });
        }

        const request = await DeliveryRequest.findById(id);
        if (!request) {
            return res.status(404).json({ error: "Delivery request not found" });
        }

        const oldStatus = request.status;
        request.status = status;

        // Set actual delivery time when delivered
        if (status === 'delivered') {
            request.actualDeliveryTime = new Date().toISOString();

            // Update driver stats
            if (request.driverId) {
                const driver = await Driver.findById(request.driverId);
                if (driver) {
                    driver.totalDeliveries += 1;
                    driver.isAvailable = true;
                    await driver.save();

                    // Update driver stats
                    const stats = await DriverStats.findOne({ driverId: request.driverId });
                    if (stats) {
                        stats.totalDeliveries += 1;
                        stats.successfulDeliveries += 1;
                        stats.deliveriesThisMonth += 1;
                        stats.deliveries.push({
                            date: new Date(),
                            earning: request.price || 0,
                            status: 'successful',
                        });

                        // Recalculate average earning
                        const totalEarnings = stats.deliveries.reduce((sum, d) => sum + d.earning, 0);
                        stats.averageEarningPerDelivery = totalEarnings / stats.totalDeliveries;

                        await stats.save();
                    }
                }
            }
        }

        // Make driver available again if cancelled
        if (status === 'cancelled' && request.driverId) {
            const driver = await Driver.findById(request.driverId);
            if (driver) {
                driver.isAvailable = true;
                await driver.save();
            }
        }

        await request.save();

        return res.json({
            message: `Delivery status updated from ${oldStatus} to ${status}`,
            deliveryRequest: request,
        });
    } catch (error) {
        console.error("Update status error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get current user's delivery requests
 */
export const getMyRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const requests = await DeliveryRequest.find({ receiverId: userId })
            .populate('driverId', 'licenseNumber vehicleType vehiclePlate rating')
            .sort({ createdAt: -1 });

        return res.json({
            message: "Your delivery requests fetched successfully",
            count: requests.length,
            deliveryRequests: requests,
        });
    } catch (error) {
        console.error("Get my requests error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get driver's assigned delivery requests
 */
export const getDriverRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Find driver profile
        const driver = await Driver.findOne({ userId });
        if (!driver) {
            return res.status(404).json({ error: "Driver profile not found" });
        }

        const requests = await DeliveryRequest.find({ driverId: driver._id })
            .populate('receiverId', 'name email phone')
            .sort({ createdAt: -1 });

        return res.json({
            message: "Driver's delivery requests fetched successfully",
            count: requests.length,
            deliveryRequests: requests,
        });
    } catch (error) {
        console.error("Get driver requests error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get pending delivery requests (available for drivers to accept)
 */
export const getPendingRequests = async (req: Request, res: Response) => {
    try {
        const requests = await DeliveryRequest.find({ status: 'pending' })
            .populate('receiverId', 'name email phone')
            .sort({ createdAt: -1 });

        return res.json({
            message: "Pending delivery requests fetched successfully",
            count: requests.length,
            deliveryRequests: requests,
        });
    } catch (error) {
        console.error("Get pending requests error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
