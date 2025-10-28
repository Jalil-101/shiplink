import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET

export const generate_token = (userId: string, role: string, expiresIn: string | number = "1h") => {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const payload = { userId, role };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "2days"
    });
}

export const verify_jwt = (token: string) => {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.verify(token, JWT_SECRET);
}

