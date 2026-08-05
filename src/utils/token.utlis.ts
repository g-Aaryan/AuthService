import crypto from "crypto";

export function hashToken(token: string): string {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

export function compareToken(
    token: string,
    hashedToken: string
): boolean {
    return hashToken(token) === hashedToken;
}