import mongoose, { Schema, Document } from 'mongoose';
import type { UserRole } from '../types/roles.js';
import type { UserInput } from '../schemas/user.schema.js';
import { hash_password } from '../utils/hash.js';


export interface User extends Document, UserInput {
    id: string;
    email: string;
    name: string;
    password: string;
    phone: string;
    role: UserRole;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

const UserSchema: Schema<User> = new Schema<User>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: [true, 'Email already exists'] },
        password: {
            type: String, required: true, select: false
        },
        phone: { type: String, required: true, unique: [true, 'Phone number already exists'] },
        role: { type: String, enum: ['user', 'driver'], required: true },
        avatar: { type: String },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        this.password = await hash_password(this.password);
        next();
    } catch (error) {
        next(error as Error);
    }
});

const User = mongoose.model<User>('User', UserSchema);

export default User;