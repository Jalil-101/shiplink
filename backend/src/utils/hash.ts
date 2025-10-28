import bcrypt from "bcrypt"

export const hash_password = async (password: string) => {
    return await bcrypt.hash(password, 10);
}

export const verify_password = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
}