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
deliveryRequestRoutes.get("/", getAllDeliveryRequests);
deliveryRequestRoutes.get("/pending", getPendingRequests);
deliveryRequestRoutes.get("/:id", getDeliveryRequestById);

// Customer routes (authenticated)
deliveryRequestRoutes.post("/", auth_check, requireCustomer, createDeliveryRequest);
deliveryRequestRoutes.get("/user/my-requests", auth_check, requireCustomer, getMyRequests);

// Driver routes (authenticated)
deliveryRequestRoutes.get("/driver/my-requests", auth_check, requireDriver, getDriverRequests);
deliveryRequestRoutes.post("/:id/accept", auth_check, requireDriver, acceptRequest);

// Management routes (authenticated)
deliveryRequestRoutes.put("/:id", auth_check, updateDeliveryRequest);
deliveryRequestRoutes.delete("/:id", auth_check, deleteDeliveryRequest);
deliveryRequestRoutes.post("/:id/assign", auth_check, assignDriver);
deliveryRequestRoutes.patch("/:id/status", auth_check, updateStatus);
