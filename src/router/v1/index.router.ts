import express from "express";
import pingRouter from "./ping.router";

const v1router = express.Router();

v1router.use('/ping',pingRouter)

export default v1router;