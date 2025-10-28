import mongoose, { Schema, Document } from "mongoose";

export interface DriverStats extends Document {
    driverId: mongoose.Types.ObjectId;
    totalDeliveries: number;
    successfulDeliveries: number;
    deliveriesThisMonth: number;
    averageEarningPerDelivery: number;
    deliveries: Array<{
        date: Date;
        earning: number;
        status: 'successful' | 'failed' | 'pending';
    }>;
}

const DriverStatsSchema: Schema<DriverStats> = new Schema<DriverStats>(
    {
        driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
        totalDeliveries: { type: Number, required: true, default: 0 },
        successfulDeliveries: { type: Number, required: true, default: 0 },
        deliveriesThisMonth: { type: Number, required: true, default: 0 },
        averageEarningPerDelivery: { type: Number, required: true, default: 0 },
        deliveries: [
            {
                date: { type: Date, required: true },
                earning: { type: Number, required: true },
                status: { type: String, enum: ['successful', 'failed', 'pending'], required: true },
            }
        ],
    },
    {
        timestamps: true,
    }
);

const DriverStats = mongoose.model<DriverStats>('DriverStats', DriverStatsSchema);

export default DriverStats;