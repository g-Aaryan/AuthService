import express from "express";
import { register, verifyEmail } from "../../controller/auth.controller";
import { validateRequestBody } from "../../validators/index";
import { registerSchema, verifyEmailSchema } from "../../validators/user.validator";

const authRouter = express.Router();

authRouter.post("/register",validateRequestBody(registerSchema),register);
authRouter.post("/verify",validateRequestBody(verifyEmailSchema),verifyEmail);

export default authRouter;