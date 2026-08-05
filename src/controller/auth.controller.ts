import { Request, Response, NextFunction } from "express";
import { registerUser, verifyUserEmail } from "../services/auth.service";

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
