import { RegisterDto, VerifyEmailDto, LoginDto } from "../validators/user.validator";
import { findUserByEmail,createUser, verifyUser, createSession, findSessionByRefreshToken,updateSessionRefreshToken, revokeSession, revokeAllSessions } from "../repositories/auth.repository";
import { BadRequestError } from "../utils/errors/app.error";
import { comparePassword, hashPassword } from "../utils/password.utils";
import { compareOtp, generateOtp, hashOtp } from "../utils/otp.utils";
import { deleteOtp, getOtp, incrementOtpAttempts, storeOtp } from "../utils/redis.utils";
import { sendVerificationOtp } from "../utils/mail.utils";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.utils";
import { hashToken } from "../utils/token.utlis";


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

export async function loginUser(
    data: LoginDto,
    ipAddress: string,
    userAgent: string
) {
    const user = await findUserByEmail(data.email);
    if (!user)
        throw new BadRequestError("Invalid credentials");
    if (!user.isEmailVerified)
        throw new BadRequestError("Email not verified");
    const isPasswordCorrect =
        await comparePassword(
            data.password,
            user.password
        );
    if (!isPasswordCorrect)
        throw new BadRequestError("Invalid credentials");
    
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    };

    const accessToken =
        generateAccessToken(payload);

    const refreshToken =
        generateRefreshToken(payload);

    const hashedRefreshToken =hashToken(refreshToken);

    const session = await createSession({
        userId: user.id,
        refreshToken: hashedRefreshToken,
        ipAddress,
        userAgent
    });

    return {
        accessToken,
        refreshToken,
        session
    };
}
export async function refreshAccessToken(refreshToken?: string){
    if (!refreshToken) {
        throw new BadRequestError("Refresh token is missing");
    }

    let payload: any;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch (err) {
        throw new BadRequestError("Invalid refresh token");
    }
    if (!payload){
        throw new BadRequestError(
            "Invalid refresh token"
        )
    }
    const hashedToken =hashToken(refreshToken);

    const session =
        await findSessionByRefreshToken(
            hashedToken
        );

    if (!session)
        throw new BadRequestError(
            "Session not found"
        );

    const newPayload = {
        id: payload.id,
        email: payload.email,
        role: payload.role
    };

    const accessToken =
        generateAccessToken(newPayload);

    const newRefreshToken =
        generateRefreshToken(newPayload);

    const hashedRefreshToken =
        hashToken(newRefreshToken);

    await updateSessionRefreshToken(
        session.id,
        hashedRefreshToken
    );

    return {
        accessToken,
        refreshToken: newRefreshToken
    };
}

export async function logoutUser(refreshToken?: string) {
    if (!refreshToken) {
        throw new BadRequestError("Refresh token is missing");
    }

    let payload: any;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch (err) {
        throw new BadRequestError("Invalid refresh token");
    }
    if (!payload) {
        throw new BadRequestError("Invalid refresh token");
    }

    const hashedToken = hashToken(refreshToken);
    const session = await findSessionByRefreshToken(hashedToken);
    if (!session) {
        throw new BadRequestError("Session not found");
    }

    await revokeSession(session.id);
}

export async function logoutAllDevices(userId: string) {
    await revokeAllSessions(userId);
}