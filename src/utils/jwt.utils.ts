import jwt from "jsonwebtoken";
import { serverconfig } from "../config";

export function generateAccessToken(payload: object) { // will add dto later
    return jwt.sign(
        payload,
        serverconfig.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "15m"
        }
    );
}

export function generateRefreshToken(payload: object) {
    return jwt.sign(
        payload,
        serverconfig.REFRESH_TOKEN_SECRET,
        {
            expiresIn: "7d"
        }
    );
}

export function verifyAccessToken(token: string) {
    return jwt.verify(
        token,
        serverconfig.ACCESS_TOKEN_SECRET
    );
}

export function verifyRefreshToken(token: string) {
    return jwt.verify(
        token,
        serverconfig.REFRESH_TOKEN_SECRET
    );
}