import mongoose, { Schema, Document } from "mongoose";
import type { DriverInput } from "../schemas/driver.schema.js";


export interface Driver extends Document, DriverInput {
    role: 'driver';
    licenseNumber: string;
    vehicleType: 'car' | 'truck' | 'motorcycle';
    vehicleModel: string;
    vehiclePlate: string;
    rating: number;
    totalDeliveries: number;
    isAvailable: boolean;
    location?: {
        latitude: number;
        longitude: number;
    };
}

const DriverSchema: Schema<Driver> = new Schema<Driver>(
    {
        role: { type: String, enum: ['driver'], required: true },
        licenseNumber: { type: String, required: true },
        vehicleType: { type: String, enum: ['car', 'truck', 'motorcycle'], required: true },
        vehicleModel: { type: String, required: true },
        vehiclePlate: { type: String, required: true },
        rating: { type: Number, required: true, min: 0, max: 5 },
        totalDeliveries: { type: Number, required: true, min: 0 },
        isAvailable: { type: Boolean, required: true },
        location: {
            latitude: { type: Number, min: -90, max: 90 },
            longitude: { type: Number, min: -180, max: 180 },
        },
    },
    {
        timestamps: true,
    }
);

const Driver = mongoose.model<Driver>('Driver', DriverSchema);

export default Driver;