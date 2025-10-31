import { Router } from "express";
import type { Request, Response } from "express";
import { login, register } from "../controllers/auth.controller.js";

export const authRoutes = Router();

/**
 * @swagger
 * /api/auth:
 *   get:
 *     summary: Check authentication route status
 *     description: Health check endpoint to verify that the authentication route is working
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication route is operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Auth route is working
 */
authRoutes.get("/", (req: Request, res: Response) => {
    return res.json({ message: "Auth route is working" });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user with email and password credentials. Returns a JWT token for subsequent authenticated requests.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid request body or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Invalid credentials
 *               message: The provided email or password is incorrect
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRoutes.post("/login", login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user or driver account. Creates a new user in the system with the specified role and credentials.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid request body, missing fields, or validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFields:
 *                 value:
 *                   error: Missing required fields
 *                   message: Name, email, phone, password, and role are required
 *               invalidEmail:
 *                 value:
 *                   error: Invalid email format
 *                   message: Please provide a valid email address
 *       409:
 *         description: User already exists (email or phone number conflict)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               emailExists:
 *                 value:
 *                   error: User already exists
 *                   message: An account with this email already exists
 *               phoneExists:
 *                 value:
 *                   error: User already exists
 *                   message: An account with this phone number already exists
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRoutes.post("/register", register);