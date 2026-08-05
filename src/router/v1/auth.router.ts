import express from "express";
import { login, logout, logoutAll, refreshToken,  register, resendOtp, verifyEmail, forgotPasswordController, resetPasswordController, getSessionsController, revokeSessionController, googleLoginRedirect, googleLoginCallback } from "../../controller/auth.controller";
import { validateRequestBody,  } from "../../validators/index";
import { loginSchema, registerSchema, resendOtpSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from "../../validators/user.validator";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { rateLimiter } from "../../middlewares/rate-limiter.middleware";

const authRouter = express.Router();

const loginLimiter = rateLimiter("login", 5, 15 * 60); // 5 attempts per 15 mins
const otpLimiter = rateLimiter("otp", 3, 15 * 60);     // 3 OTP requests per 15 mins

authRouter.post("/register",validateRequestBody(registerSchema),register);
authRouter.post("/verify",validateRequestBody(verifyEmailSchema),verifyEmail);
authRouter.post("/login",loginLimiter,validateRequestBody(loginSchema),login);
authRouter.post("/refresh",refreshToken);
authRouter.post("/logout",logout);
authRouter.post("/logout-all",authenticateJWT,logoutAll);
authRouter.post("/resend-otp",otpLimiter,validateRequestBody(resendOtpSchema),resendOtp);
authRouter.post("/forgot-password",otpLimiter,validateRequestBody(forgotPasswordSchema),forgotPasswordController);
authRouter.post("/reset-password",validateRequestBody(resetPasswordSchema),resetPasswordController);
authRouter.get("/sessions",authenticateJWT,getSessionsController);
authRouter.delete("/sessions/:sessionId",authenticateJWT,revokeSessionController);
authRouter.get("/google",googleLoginRedirect);
authRouter.get("/google/callback",googleLoginCallback);

export default authRouter;