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
driverRoutes.get("/", getAllDrivers);
driverRoutes.get("/nearby", findNearbyAvailableDrivers);
driverRoutes.get("/:id", getDriverById);
driverRoutes.get("/:id/stats", getDriverStats);

// Protected routes (require authentication)
driverRoutes.get("/me/profile", auth_check, requireDriver, getMyDriverProfile);

// Admin/Driver management routes
driverRoutes.post("/", createDriver);
driverRoutes.put("/:id", auth_check, updateDriver);
driverRoutes.delete("/:id", auth_check, deleteDriver);
driverRoutes.patch("/:id/location", auth_check, updateDriverLocation);
driverRoutes.patch("/:id/availability", auth_check, toggleAvailability);
