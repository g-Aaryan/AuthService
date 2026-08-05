import { Request, Response, NextFunction } from "express";
import { loginUser, logoutUser, logoutAllDevices, refreshAccessToken, registerUser, verifyUserEmail, resendVerificationOtp, forgotPassword, resetPassword, getActiveSessions, revokeUserSession } from "../services/auth.service";
import { BadRequestError } from "../utils/errors/app.error";

export async function register( req: Request,res: Response,next: NextFunction) {
        const response = await registerUser(req.body);
        return res.status(201).json({
            success: true,
            message: response.message
        });
}
export async function verifyEmail(req: Request,res: Response,next: NextFunction) {
        const response =
            await verifyUserEmail(req.body);
        return res.status(200).json({
            success: true,
            message: response.message
        });
}
export async function login(req: Request,res: Response,next: NextFunction){
        const response = await loginUser(
            req.body,
            req.ip || "",
            req.get("user-agent") || ""
        );

        res.cookie("refreshToken", response.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken: response.accessToken
            }
        });
}
export async function refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const refreshToken = req.cookies.refreshToken;
    const response = await refreshAccessToken(refreshToken);

    res.cookie("refreshToken", response.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        success: true,
        message: "Token refreshed",
        data: {
            accessToken: response.accessToken
        }
    });
}

export async function logout(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        try {
            await logoutUser(refreshToken);
        } catch (error) {
            // Ignore failure, we will clear the cookie anyway
        }
    }

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}

export async function logoutAll(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        throw new BadRequestError("User not found in token");
    }

    await logoutAllDevices(userId);

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });

    return res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully"
    });
}

export async function resendOtp(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const response = await resendVerificationOtp(req.body);
    return res.status(200).json({
        success: true,
        message: response.message
    });
}

export async function forgotPasswordController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const response = await forgotPassword(req.body);
    return res.status(200).json({
        success: true,
        message: response.message
    });
}

export async function resetPasswordController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const response = await resetPassword(req.body);
    return res.status(200).json({
        success: true,
        message: response.message
    });
}

export async function getSessionsController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        throw new BadRequestError("User ID not found in token");
    }

    const sessions = await getActiveSessions(userId);
    return res.status(200).json({
        success: true,
        message: "Active sessions retrieved successfully",
        data: sessions
    });
}

export async function revokeSessionController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        throw new BadRequestError("User ID not found in token");
    }

    const sessionId = req.params.sessionId;
    await revokeUserSession(userId, sessionId);

    return res.status(200).json({
        success: true,
        message: "Session revoked successfully"
    });
}
