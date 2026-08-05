import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.config";

export const rateLimiter = (prefix: string, limit: number, windowSec: number) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const ip = req.ip || "unknown";
        const key = `ratelimit:${prefix}:${ip}`;

        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, windowSec);
            }

            if (current > limit) {
                res.status(429).json({
                    success: false,
                    message: "Too many requests, please try again later."
                });
                return;
            }
            next();
        } catch (error) {
            // Fail open on redis errors to prevent downtime if redis is offline
            next();
        }
    };
};
