import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  getUserProfile,
} from "../controllers/user.controller.js";
import { auth_check } from "../middleware/auth_check.js";

export const userRoutes = Router();

userRoutes.get("/", getAllUsers); // View all users at http://localhost:5444/api/users
userRoutes.get("/me", auth_check, getUserProfile);
userRoutes.get("/:id", getUserById);
