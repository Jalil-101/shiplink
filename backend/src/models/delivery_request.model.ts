import mongoose, { Schema, Document } from "mongoose";
import type { DeliveryRequestInput } from "../schemas/delivery_request.schema.js";

export interface DeliveryRequest extends Document, DeliveryRequestInput {
    id: string;
    receiverId: mongoose.Schema.Types.ObjectId;
    driverId: mongoose.Schema.Types.ObjectId;
    pickupLocation: {
        address: string;
        latitude: number;
        longitude: number;
    };
    dropoffLocation: {
        address: string;
        latitude: number;
        longitude: number;
    };
    packageDetails: {
        weight: number;
        dimensions: {
            length: number;
            width: number;
            height: number;
        };
        contentDescription: string;
    };
    status: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    price?: number;
    createdAt: string;
    updatedAt: string;
}

const DeliveryRequestSchema: Schema<DeliveryRequest> = new Schema<DeliveryRequest>(
    {
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
        pickupLocation: {
            address: { type: String, required: true },
            latitude: { type: Number, required: true, min: -90, max: 90 },
            longitude: { type: Number, required: true, min: -180, max: 180 },
        },
        dropoffLocation: {
            address: { type: String, required: true },
            latitude: { type: Number, required: true, min: -90, max: 90 },
            longitude: { type: Number, required:    true, min: -180, max: 180 },
        },
        packageDetails: {
            weight: { type: Number, required: true, min: 0 },
            dimensions: {
                length: { type: Number, required: true, min: 0 },
                width: { type: Number, required: true, min: 0 },
                height: { type: Number, required: true, min: 0 },
            },
            contentDescription: { type: String, required: true },
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
            required: true,
        },
        estimatedDeliveryTime: { type: String },
        actualDeliveryTime: { type: String },
        price: { type: Number, min: 0 },
    },
    {
        timestamps: true,
    }
);

const DeliveryRequest = mongoose.model<DeliveryRequest>('DeliveryRequest', DeliveryRequestSchema);

export default DeliveryRequest;