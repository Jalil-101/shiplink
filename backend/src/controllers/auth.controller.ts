import User from "../models/user.model.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import type { Request, Response } from "express";
import { verify_password } from "../utils/hash.js";
import { generate_token } from "../utils/jwt.js";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginInput;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid input types" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({
      email: email,
    }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const is_password_valid = await verify_password(password, user.password);

    if (!is_password_valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user_token = generate_token(user.id, user.role);

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: user_token,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role } = req.body as RegisterInput;

    // Basic validation
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      return res.status(400).json({ error: "Invalid input types" });
    }

    if (name.length < 3) {
      return res
        .status(400)
        .json({ error: "Name must be at least 3 characters long" });
    }

    if (phone.length < 8) {
      return res
        .status(400)
        .json({ error: "Phone number must be at least 8 digits long" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    if (role !== "customer" && role !== "driver") {
      return res
        .status(400)
        .json({ error: "Role must be either customer or driver" });
    }

    const existing_user = await User.findOne({ email: email });

    if (existing_user) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const new_user = new User({
      name,
      email,
      phone,
      password,
      role,
    });

    await new_user.save();

    const user_token = generate_token(new_user.id, new_user.role);

    return res.json({
      message: "User registered successfully",
      user: {
        id: new_user.id,
        name: new_user.name,
        email: new_user.email,
        role: new_user.role,
      },
      token: user_token,
    });
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: `${field === "email" ? "Email" : "Phone number"} already exists`,
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return res.status(400).json({ error: messages.join(", ") });
    }

    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
