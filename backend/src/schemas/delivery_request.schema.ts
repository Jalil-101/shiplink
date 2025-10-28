export interface DeliveryRequestInput {
    userId: string;
    driverId?: object;
    pickupAddress: string;
    deliveryAddress: string;
    pickupCoordinates: {
        latitude: number;
        longitude: number;
    };
    deliveryCoordinates: {
        latitude: number;
        longitude: number;
    };
    packageDescription: string;
    packageWeight: number;
    packageValue: number;
    status: "pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled";
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    price?: number;
    createdAt?: string;
    updatedAt?: string;
}
