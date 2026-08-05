import express from "express";
import { login, logout, logoutAll, refreshToken,  register, resendOtp, verifyEmail, forgotPasswordController, resetPasswordController, getSessionsController, revokeSessionController } from "../../controller/auth.controller";
import { validateRequestBody,  } from "../../validators/index";
import { loginSchema, registerSchema, resendOtpSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from "../../validators/user.validator";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const authRouter = express.Router();

authRouter.post("/register",validateRequestBody(registerSchema),register);
authRouter.post("/verify",validateRequestBody(verifyEmailSchema),verifyEmail);
authRouter.post("/login",validateRequestBody(loginSchema),login);
authRouter.post("/refresh",refreshToken);
authRouter.post("/logout",logout);
authRouter.post("/logout-all",authenticateJWT,logoutAll);
authRouter.post("/resend-otp",validateRequestBody(resendOtpSchema),resendOtp);
authRouter.post("/forgot-password",validateRequestBody(forgotPasswordSchema),forgotPasswordController);
authRouter.post("/reset-password",validateRequestBody(resetPasswordSchema),resetPasswordController);
authRouter.get("/sessions",authenticateJWT,getSessionsController);
authRouter.delete("/sessions/:sessionId",authenticateJWT,revokeSessionController);

export default authRouter;