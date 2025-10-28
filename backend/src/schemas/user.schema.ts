export interface UserInput {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: "user" | "driver";
    avatar?: string;
}
