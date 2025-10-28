import type { Request, Response } from "express";
import User from "../models/user.model.js";
import type { AuthRequest } from "../middleware/auth_check.js";

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select("-password");

        return res.json({
            message: "Users fetched successfully",
            users
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getUserById = async (req: Request, res: Response) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ message: "UserID is required" });
    }

    try {
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        return res.json({
            message: "User fetched successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getUserProfile = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    try {
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        return res.json({
            message: "User profile fetched successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}