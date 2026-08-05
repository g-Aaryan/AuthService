import nodemailer from "nodemailer";
import { serverconfig } from "../config";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: serverconfig.EMAIL_USER,
        pass: serverconfig.EMAIL_PASSWORD
    }
});

export async function sendVerificationOtp(
    email: string,
    otp: string
) {
    await transporter.sendMail({
        from: serverconfig.EMAIL_USER,
        to: email,
        subject: "Verify your email",
        html: `<h2>Your OTP is ${otp}</h2>`
    });
}

export async function sendForgotPasswordOtp(
    email: string,
    otp: string
) {
    await transporter.sendMail({
        from: serverconfig.EMAIL_USER,
        to: email,
        subject: "Reset your password",
        html: `<h2>Your password reset OTP is ${otp}</h2>`
    });
}