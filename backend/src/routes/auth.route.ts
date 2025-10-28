import { Router } from "express";
import type { Request, Response } from "express";
import { login, register } from "../controllers/auth.controller.js";

export const authRoutes = Router();

authRoutes.get("/", (req: Request, res: Response) => {
    return res.json({ message: "Auth route is working" });
});

authRoutes.post("/login", login);
authRoutes.post("/register", register);