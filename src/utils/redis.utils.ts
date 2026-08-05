import { redis } from "../config/redis.config";

const OTP_EXPIRY = 300;

interface OtpData {
    otpHash: string;
    attempts: number;
}

export async function storeOtp(
    email: string,
    otpHash: string
) {
    const otpData: OtpData = {
        otpHash,
        attempts: 0
    };
    await redis.set(
        `verify:${email}`,
        JSON.stringify(otpData),
        "EX",
        OTP_EXPIRY
    );
}

export async function getOtp(email: string){
    const data = await redis.get(`verify:${email}`);
    if (!data) {
        return null;
    }
    return JSON.parse(data) as OtpData;
}

export async function incrementOtpAttempts(email: string){
    const otpData = await getOtp(email);
    if (!otpData) {
        return;
    }
    otpData.attempts++;
    await redis.set(
        `verify:${email}`,
        JSON.stringify(otpData),
        
            "EX",
            OTP_EXPIRY
        );
    }


export async function deleteOtp(email: string) {
    await redis.del(
        `verify:${email}`
    );
}