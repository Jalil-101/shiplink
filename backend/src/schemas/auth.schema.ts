export interface RegisterInput {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'customer' | 'driver';
}

export interface LoginInput {
    email: string;
    password: string;
}
