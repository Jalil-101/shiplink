import { Router } from "express";
import {
    createDriver,
    getAllDrivers,
    getDriverById,
    updateDriver,
    deleteDriver,
    updateDriverLocation,
    toggleAvailability,
    getDriverStats,
    findNearbyAvailableDrivers,
    getMyDriverProfile
} from "../controllers/driver.controller.js";
import { auth_check } from "../middleware/auth_check.js";
import { requireDriver } from "../middleware/role_check.js";

export const driverRoutes = Router();

// Public routes

/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Get all drivers
 *     description: Retrieve a list of all registered drivers in the system with their details including availability status, ratings, and vehicle information.
 *     tags: [Drivers]
 *     responses:
 *       200:
 *         description: List of drivers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Driver'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.get("/", getAllDrivers);

/**
 * @swagger
 * /api/drivers/nearby:
 *   get:
 *     summary: Find nearby available drivers
 *     description: Search for available drivers within a specified radius of given coordinates. Useful for finding drivers for new delivery requests.
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitude of the search location
 *         example: 37.7749
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitude of the search location
 *         example: -122.4194
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           format: float
 *         description: Search radius in kilometers (default is 10km)
 *         example: 5
 *     responses:
 *       200:
 *         description: List of nearby available drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid or missing coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Invalid parameters
 *               message: Latitude and longitude are required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.get("/nearby", findNearbyAvailableDrivers);

/**
 * @swagger
 * /api/drivers/{id}:
 *   get:
 *     summary: Get driver by ID
 *     description: Retrieve detailed information about a specific driver by their unique identifier.
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the driver
 *         example: 60d5ec49f1b2c8b1f8e4e1a2
 *     responses:
 *       200:
 *         description: Driver found and retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Not found
 *               message: Driver with the specified ID does not exist
 *       400:
 *         description: Invalid driver ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.get("/:id", getDriverById);

/**
 * @swagger
 * /api/drivers/{id}/stats:
 *   get:
 *     summary: Get driver statistics
 *     description: Retrieve performance statistics for a specific driver including total deliveries, ratings, completion rate, and active requests.
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the driver
 *         example: 60d5ec49f1b2c8b1f8e4e1a2
 *     responses:
 *       200:
 *         description: Driver statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverStats'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Not found
 *               message: Driver with the specified ID does not exist
 *       400:
 *         description: Invalid driver ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.get("/:id/stats", getDriverStats);

// Protected routes (require authentication)

/**
 * @swagger
 * /api/drivers/me/profile:
 *   get:
 *     summary: Get current driver profile
 *     description: Retrieve the profile information of the currently authenticated driver. Requires authentication and driver role.
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a driver
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Forbidden - Insufficient permissions
 *               requiredRoles: [driver]
 *       404:
 *         description: Driver profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.get("/me/profile", auth_check, requireDriver, getMyDriverProfile);

// Admin/Driver management routes

/**
 * @swagger
 * /api/drivers:
 *   post:
 *     summary: Create a new driver
 *     description: Register a new driver in the system with vehicle and license information.
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverInput'
 *     responses:
 *       201:
 *         description: Driver created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid request body or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Validation error
 *               message: All required fields must be provided
 *       409:
 *         description: Driver already exists (license number conflict)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Conflict
 *               message: A driver with this license number already exists
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.post("/", createDriver);

/**
 * @swagger
 * /api/drivers/{id}:
 *   put:
 *     summary: Update driver information
 *     description: Update driver details including vehicle information, license, and other profile data. Requires authentication.
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the driver
 *         example: 60d5ec49f1b2c8b1f8e4e1a2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverInput'
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid request body or driver ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.put("/:id", auth_check, updateDriver);

/**
 * @swagger
 * /api/drivers/{id}:
 *   delete:
 *     summary: Delete a driver
 *     description: Remove a driver from the system. Requires authentication. Use with caution as this action is permanent.
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the driver to delete
 *         example: 60d5ec49f1b2c8b1f8e4e1a2
 *     responses:
 *       200:
 *         description: Driver deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Driver deleted successfully
 *       400:
 *         description: Invalid driver ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.delete("/:id", auth_check, deleteDriver);

/**
 * @swagger
 * /api/drivers/{id}/location:
 *   patch:
 *     summary: Update driver location
 *     description: Update the current GPS coordinates of a driver. This endpoint is typically called frequently to track driver movement in real-time. Requires authentication.
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the driver
 *         example: 60d5ec49f1b2c8b1f8e4e1a2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationUpdate'
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid coordinates or driver ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Invalid coordinates
 *               message: Latitude must be between -90 and 90, longitude between -180 and 180
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.patch("/:id/location", auth_check, updateDriverLocation);

/**
 * @swagger
 * /api/drivers/{id}/availability:
 *   patch:
 *     summary: Toggle driver availability
 *     description: Update the availability status of a driver (available/unavailable for new delivery requests). Requires authentication.
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the driver
 *         example: 60d5ec49f1b2c8b1f8e4e1a2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 description: New availability status
 *                 example: true
 *     responses:
 *       200:
 *         description: Availability status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid request body or driver ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
driverRoutes.patch("/:id/availability", auth_check, toggleAvailability);
