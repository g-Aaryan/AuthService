import express from "express";
import { login, logout, logoutAll, refreshToken,  register, verifyEmail } from "../../controller/auth.controller";
import { validateRequestBody,  } from "../../validators/index";
import { loginSchema, registerSchema, verifyEmailSchema } from "../../validators/user.validator";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const authRouter = express.Router();

authRouter.post("/register",validateRequestBody(registerSchema),register);
authRouter.post("/verify",validateRequestBody(verifyEmailSchema),verifyEmail);
authRouter.post("/login",validateRequestBody(loginSchema),login);
authRouter.post("/refresh",refreshToken);
authRouter.post("/logout",logout);
authRouter.post("/logout-all",authenticateJWT,logoutAll);

export default authRouter;