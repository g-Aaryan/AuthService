import express from "express";
import { login, register, verifyEmail } from "../../controller/auth.controller";
import { validateRequestBody } from "../../validators/index";
import { loginSchema, registerSchema, verifyEmailSchema } from "../../validators/user.validator";

const authRouter = express.Router();

authRouter.post("/register",validateRequestBody(registerSchema),register);
authRouter.post("/verify",validateRequestBody(verifyEmailSchema),verifyEmail);
authRouter.post("/login",validateRequestBody(loginSchema),login);

export default authRouter;