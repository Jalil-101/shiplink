import { Router } from "express";
import {
    createDeliveryRequest,
    getAllDeliveryRequests,
    getDeliveryRequestById,
    updateDeliveryRequest,
    deleteDeliveryRequest,
    assignDriver,
    acceptRequest,
    updateStatus,
    getMyRequests,
    getDriverRequests,
    getPendingRequests
} from "../controllers/delivery_request.controller.js";
import { auth_check } from "../middleware/auth_check.js";
import { requireDriver, requireCustomer } from "../middleware/role_check.js";

export const deliveryRequestRoutes = Router();

// Public/Admin routes

/**
 * @swagger
 * /api/delivery-requests:
 *   get:
 *     summary: Get all delivery requests
 *     description: Retrieve a list of all delivery requests in the system. This endpoint can be used for admin dashboards or general monitoring.
 *     tags: [Delivery Requests]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, picked_up, in_transit, delivered, cancelled]
 *         description: Filter by delivery status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of results to return
 *         example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of results to skip (for pagination)
 *         example: 0
 *     responses:
 *       200:
 *         description: List of delivery requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryRequest'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
deliveryRequestRoutes.get("/", getAllDeliveryRequests);

/**
 * @swagger
 * /api/delivery-requests/pending:
 *   get:
 *     summary: Get pending delivery requests
 *     description: Retrieve all delivery requests with pending status. Useful for drivers to see available delivery jobs.
 *     tags: [Delivery Requests]
 *     responses:
 *       200:
 *         description: List of pending delivery requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryRequest'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
deliveryRequestRoutes.get("/pending", getPendingRequests);

/**
 * @swagger
 * /api/delivery-requests/{id}:
 *   get:
 *     summary: Get delivery request by ID
 *     description: Retrieve detailed information about a specific delivery request including pickup/dropoff locations, package details, and current status.
 *     tags: [Delivery Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the delivery request
 *         example: 60d5ec49f1b2c8b1f8e4e1a3
 *     responses:
 *       200:
 *         description: Delivery request found and retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryRequest'
 *       404:
 *         description: Delivery request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Not found
 *               message: Delivery request with the specified ID does not exist
 *       400:
 *         description: Invalid delivery request ID format
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
deliveryRequestRoutes.get("/:id", getDeliveryRequestById);

// Customer routes (authenticated)

/**
 * @swagger
 * /api/delivery-requests:
 *   post:
 *     summary: Create a delivery request
 *     description: Create a new delivery request. Requires authentication and customer role. The user must provide pickup/delivery addresses, coordinates, and package details.
 *     tags: [Delivery Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryRequestInput'
 *     responses:
 *       201:
 *         description: Delivery request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryRequest'
 *       400:
 *         description: Invalid request body or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Validation error
 *               message: All required fields must be provided
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Forbidden - Insufficient permissions
 *               requiredRoles: [user]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
deliveryRequestRoutes.post("/", auth_check, requireCustomer, createDeliveryRequest);

/**
 * @swagger
 * /api/delivery-requests/user/my-requests:
 *   get:
 *     summary: Get my delivery requests
 *     description: Retrieve all delivery requests created by the currently authenticated customer. Requires authentication and customer role.
 *     tags: [Delivery Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, picked_up, in_transit, delivered, cancelled]
 *         description: Filter by delivery status
 *     responses:
 *       200:
 *         description: List of user's delivery requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryRequest'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a customer
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
deliveryRequestRoutes.get("/user/my-requests", auth_check, requireCustomer, getMyRequests);

// Driver routes (authenticated)

/**
 * @swagger
 * /api/delivery-requests/driver/my-requests:
 *   get:
 *     summary: Get driver's assigned delivery requests
 *     description: Retrieve all delivery requests assigned to or accepted by the currently authenticated driver. Requires authentication and driver role.
 *     tags: [Delivery Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [accepted, picked_up, in_transit, delivered]
 *         description: Filter by delivery status
 *     responses:
 *       200:
 *         description: List of driver's delivery requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryRequest'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
deliveryRequestRoutes.get("/driver/my-requests", auth_check, requireDriver, getDriverRequests);

/**
 * @swagger
 * /api/delivery-requests/{id}/accept:
 *   post:
 *     summary: Accept a delivery request
 *     description: Driver accepts a pending delivery request. Changes status from pending to accepted and assigns the driver to the request. Requires authentication and driver role.
 *     tags: [Delivery Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the delivery request
 *         example: 60d5ec49f1b2c8b1f8e4e1a3
 *     responses:
 *       200:
 *         description: Delivery request accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryRequest'
 *       400:
 *         description: Invalid request or delivery already assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               alreadyAssigned:
 *                 value:
 *                   error: Invalid operation
 *                   message: This delivery request has already been accepted by another driver
 *               invalidStatus:
 *                 value:
 *                   error: Invalid operation
 *                   message: Only pending requests can be accepted
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
 *       404:
 *         description: Delivery request not found
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
deliveryRequestRoutes.post("/:id/accept", auth_check, requireDriver, acceptRequest);

// Management routes (authenticated)

/**
 * @swagger
 * /api/delivery-requests/{id}:
 *   put:
 *     summary: Update a delivery request
 *     description: Update details of a delivery request. Requires authentication. Can be used to modify addresses, package details, or other request information.
 *     tags: [Delivery Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the delivery request
 *         example: 60d5ec49f1b2c8b1f8e4e1a3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryRequestInput'
 *     responses:
 *       200:
 *         description: Delivery request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryRequest'
 *       400:
 *         description: Invalid request body or ID
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
 *         description: Delivery request not found
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
deliveryRequestRoutes.put("/:id", auth_check, updateDeliveryRequest);

/**
 * @swagger
 * /api/delivery-requests/{id}:
 *   delete:
 *     summary: Delete a delivery request
 *     description: Delete a delivery request from the system. Requires authentication. This action is permanent and should be used with caution.
 *     tags: [Delivery Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the delivery request to delete
 *         example: 60d5ec49f1b2c8b1f8e4e1a3
 *     responses:
 *       200:
 *         description: Delivery request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Delivery request deleted successfully
 *       400:
 *         description: Invalid delivery request ID format
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
 *         description: Delivery request not found
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
deliveryRequestRoutes.delete("/:id", auth_check, deleteDeliveryRequest);

/**
 * @swagger
 * /api/delivery-requests/{id}/assign:
 *   post:
 *     summary: Assign a driver to delivery request
 *     description: Manually assign a specific driver to a delivery request. Requires authentication. Typically used by admins or dispatchers.
 *     tags: [Delivery Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the delivery request
 *         example: 60d5ec49f1b2c8b1f8e4e1a3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignDriver'
 *     responses:
 *       200:
 *         description: Driver assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryRequest'
 *       400:
 *         description: Invalid driver ID or request ID, or driver not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               driverNotAvailable:
 *                 value:
 *                   error: Invalid operation
 *                   message: Driver is not available for assignments
 *               alreadyAssigned:
 *                 value:
 *                   error: Invalid operation
 *                   message: This delivery request already has a driver assigned
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Delivery request or driver not found
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
deliveryRequestRoutes.post("/:id/assign", auth_check, assignDriver);

/**
 * @swagger
 * /api/delivery-requests/{id}/status:
 *   patch:
 *     summary: Update delivery request status
 *     description: Update the current status of a delivery request (pending, accepted, picked_up, in_transit, delivered, cancelled). Requires authentication.
 *     tags: [Delivery Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the delivery request
 *         example: 60d5ec49f1b2c8b1f8e4e1a3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusUpdate'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryRequest'
 *       400:
 *         description: Invalid status or invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidStatus:
 *                 value:
 *                   error: Invalid status
 *                   message: Status must be one of pending, accepted, picked_up, in_transit, delivered, cancelled
 *               invalidTransition:
 *                 value:
 *                   error: Invalid operation
 *                   message: Cannot transition from current status to the requested status
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Delivery request not found
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
deliveryRequestRoutes.patch("/:id/status", auth_check, updateStatus);
