import { RegisterDto, VerifyEmailDto, LoginDto, ResendOtpDto, ForgotPasswordDto, ResetPasswordDto } from "../validators/user.validator";
import { findUserByEmail,createUser, verifyUser, createSession, findSessionByRefreshToken,updateSessionRefreshToken, revokeSession, revokeAllSessions, updateUserPassword, findActiveSessionsByUserId, findSessionById, findUserByGoogleId, findSessionByUsedRefreshToken } from "../repositories/auth.repository";
import { serverconfig } from "../config";
import { BadRequestError } from "../utils/errors/app.error";
import { comparePassword, hashPassword } from "../utils/password.utils";
import { compareOtp, generateOtp, hashOtp } from "../utils/otp.utils";
import { deleteOtp, getOtp, incrementOtpAttempts, storeOtp } from "../utils/redis.utils";
import { sendForgotPasswordOtp, sendVerificationOtp } from "../utils/mail.utils";
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

    await storeOtp(user.id, otpHash);

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

    if (user.lockUntil && user.lockUntil > Date.now()) {
        throw new BadRequestError("Account is temporarily locked. Try again later.");
    }

    if (!user.password) {
        user.loginAttempts += 1;
        if (user.loginAttempts >= 5) {
            user.lockUntil = Date.now() + 15 * 60 * 1000;
        }
        await user.save();
        throw new BadRequestError("Invalid credentials");
    }

    const isPasswordCorrect =
        await comparePassword(
            data.password,
            user.password
        );

    if (!isPasswordCorrect) {
        user.loginAttempts += 1;
        if (user.loginAttempts >= 5) {
            user.lockUntil = Date.now() + 15 * 60 * 1000;
        }
        await user.save();
        throw new BadRequestError("Invalid credentials");
    }

    if (user.loginAttempts > 0 || user.lockUntil) {
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
    }
    
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

    if (!session) {
        const replayedSession = await findSessionByUsedRefreshToken(hashedToken);
        if (replayedSession) {
            await revokeAllSessions(replayedSession.userId.toString());
            throw new BadRequestError("Token replay detected. All sessions revoked for security.");
        }
        throw new BadRequestError(
            "Session not found"
        );
    }

    const newPayload = {
        id: payload.id,
        email: payload.email,
        role: payload.role
    };

    const accessToken =
        generateAccessToken(newPayload);

    const newRefreshToken =
        generateRefreshToken(newPayload);

    const hashedNewRefreshToken =
        hashToken(newRefreshToken);

    await updateSessionRefreshToken(
        session.id,
        hashedNewRefreshToken,
        hashedToken
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

export async function resendVerificationOtp(data: ResendOtpDto) {
    const user = await findUserByEmail(data.email);
    if (!user) {
        throw new BadRequestError("User not found");
    }
    if (user.isEmailVerified) {
        throw new BadRequestError("Email already verified");
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    await storeOtp(user.id, otpHash);

    await sendVerificationOtp(user.email, otp);

    return {
        message: "Verification OTP sent successfully"
    };
}

export async function forgotPassword(data: ForgotPasswordDto) {
    const user = await findUserByEmail(data.email);
    if (!user) {
        throw new BadRequestError("User not found");
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    await storeOtp(user.id, otpHash);

    await sendForgotPasswordOtp(user.email, otp);

    return {
        message: "Password reset OTP sent successfully"
    };
}

export async function resetPassword(data: ResetPasswordDto) {
    const user = await findUserByEmail(data.email);
    if (!user) {
        throw new BadRequestError("User not found");
    }

    const otpData = await getOtp(user.id);
    if (!otpData) {
        throw new BadRequestError("OTP expired");
    }

    if (otpData.attempts >= 5) {
        throw new BadRequestError("Too many attempts");
    }

    const isValid = compareOtp(data.otp, otpData.otpHash);
    if (!isValid) {
        await incrementOtpAttempts(user.id);
        throw new BadRequestError("Invalid OTP");
    }

    const hashedPassword = await hashPassword(data.password);
    await updateUserPassword(user.id, hashedPassword);

    await deleteOtp(user.id);
    await revokeAllSessions(user.id);

    return {
        message: "Password reset successfully"
    };
}

export async function getActiveSessions(userId: string) {
    return await findActiveSessionsByUserId(userId);
}

export async function revokeUserSession(userId: string, sessionId: string) {
    const session = await findSessionById(sessionId);
    if (!session) {
        throw new BadRequestError("Session not found");
    }

    if (session.userId.toString() !== userId) {
        throw new BadRequestError("Unauthorized to revoke this session");
    }

    await revokeSession(sessionId);
}

export async function googleLoginService(code: string, ipAddress: string, userAgent: string) {
    // 1. Exchange code for Google access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            code,
            client_id: serverconfig.GOOGLE_CLIENT_ID,
            client_secret: serverconfig.GOOGLE_CLIENT_SECRET,
            redirect_uri: serverconfig.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code"
        }).toString()
    });

    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new BadRequestError(`Failed to exchange Google OAuth code: ${errorText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string };

    // 2. Fetch user profile info from Google
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`
        }
    });

    if (!profileResponse.ok) {
        throw new BadRequestError("Failed to retrieve Google user profile info");
    }

    const profileData = await profileResponse.json() as {
        id: string;
        email: string;
        name: string;
        picture?: string;
    };

    const { id, email, name, picture } = profileData;

    // 3. Find User by googleId
    let user = await findUserByGoogleId(id);

    if (!user) {
        // Find User by email
        user = await findUserByEmail(email);

        if (user) {
            // Link account if email matches
            user.googleId = id;
            if (picture) user.avatar = picture;
            await user.save();
        } else {
            // Create user
            user = await createUser({
                name,
                email,
                googleId: id,
                avatar: picture,
                isEmailVerified: true // Google pre-verified
            });
        }
    }

    // 4. Generate tokens & create Session
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const hashedRefreshToken = hashToken(refreshToken);

    await createSession({
        userId: user.id,
        refreshToken: hashedRefreshToken,
        ipAddress,
        userAgent
    });

    return {
        accessToken,
        refreshToken
    };
}