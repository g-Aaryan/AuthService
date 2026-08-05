import { RegisterDto, VerifyEmailDto } from "../validators/user.validator";
import { findUserByEmail,createUser, verifyUser } from "../repositories/auth.repository";
import { BadRequestError } from "../utils/errors/app.error";
import { hashPassword } from "../utils/password.utils";
import { compareOtp, generateOtp, hashOtp } from "../utils/otp.utils";
import { deleteOtp, getOtp, incrementOtpAttempts, storeOtp } from "../utils/redis.utils";
import { sendVerificationOtp } from "../utils/mail.utils";


export async function registerUser(data:RegisterDto){
    const existingUser = await findUserByEmail(data.email);

    if(existingUser){
        if (existingUser.isEmailVerified) {throw new BadRequestError("User already exists")}

        const otp = generateOtp();
        const otpHash = hashOtp(otp);
        await storeOtp(existingUser.id, otpHash);

        await sendVerificationOtp(
        existingUser.email,
        otp
        );
        return {
        message: "Verification OTP sent again."
        };
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await createUser({
        ...data,
        password: hashedPassword,
        isEmailVerified: false
    });

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await storeOtp(user.email, otpHash);

    await sendVerificationOtp(user.email, otp);

    return {
        message:
            "User registered successfully. Please verify your email."
    };
}

export async function verifyUserEmail(data: VerifyEmailDto) {
    const user = await findUserByEmail(data.email);
    if (!user) {
        throw new BadRequestError("User not found");
    }
    if (user.isEmailVerified) {
        throw new BadRequestError(
            "Email already verified"
        );
    }
    const otpData = await getOtp(user.id);
    if (!otpData) {
        throw new BadRequestError(
            "OTP expired"
        );
    }
    if (otpData.attempts >= 5) {
        throw new BadRequestError(
            "Too many attempts"
        );
    }
    const isValid = compareOtp(
        data.otp,
        otpData.otpHash
    );
    if (!isValid) {
        await incrementOtpAttempts(
            user.id
        );
        throw new BadRequestError(
            "Invalid OTP"
        );
    }
    await deleteOtp(user.id);
    await verifyUser(user.id);
    return {
        message:
            "Email verified successfully"
    };
}