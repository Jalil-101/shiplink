export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  message: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'driver';
};

export type RegisterResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
  message: string;
};

