export interface DriverInput {
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
