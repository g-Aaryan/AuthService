import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils";
import { ForbiddenError, UnauthorizedError } from "../utils/errors/app.error";

export const authenticateJWT = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Access token is missing or invalid");
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token) as {
            id: string;
            email: string;
            role: string;
        };

        req.user = payload;
        next();
    } catch (error) {
        throw new UnauthorizedError("Invalid or expired access token");
    }
};

export const authorize = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new UnauthorizedError("Unauthorized");
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ForbiddenError("Forbidden: Access is denied");
        }

        next();
    };
};
