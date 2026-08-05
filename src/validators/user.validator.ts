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

export const loginSchema = z.object({
    email: z.email().toLowerCase(),
    password: z.string().min(8)
});

export const resendOtpSchema = z.object({
    email: z.email().toLowerCase()
});

export type ResendOtpDto = z.infer<typeof resendOtpSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
    email: z.email().toLowerCase()
});

export const resetPasswordSchema = z.object({
    email: z.email().toLowerCase(),
    otp: z.string().length(6, "OTP must be 6 digits"),
    password: z.string().min(8, "Password must be at least 8 characters")
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;