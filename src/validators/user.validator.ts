import { z } from "zod";

export const registerSchema = z.object({

    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters"),

    email: z
        .email("Invalid email")
        .toLowerCase(),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")

});

export const verifyEmailSchema = z.object({
    email: z
        .email("Invalid email")
        .toLowerCase(),
    otp: z
        .string()
        .length(6, "OTP must be 6 digits")
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;