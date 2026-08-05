import express from "express";
import pingRouter from "./ping.router";
import authRouter from "./auth.router";

const v1router = express.Router();

v1router.use('/ping',pingRouter)
v1router.use('/auth',authRouter)

export default v1router;