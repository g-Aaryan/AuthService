import { Session } from "../models/session.model";
import { IUser, User } from "../models/user.model";

export async function createUser(data: Partial<IUser>){
    return await User.create(data);
}

export async function findUserByEmail(email: string) {
    return await User.findOne({ email });
}

export async function verifyUser(userId: string){
    return await User.findByIdAndUpdate(
        userId,
        {
            isEmailVerified: true
        },
        {
            new: true
        }
    );
}
export async function createSession(data: {
    userId: string;
    refreshToken: string;
    ipAddress: string;
    userAgent: string;
}) {
    return await Session.create(data);
}
export async function findSessionByRefreshToken(
    refreshToken: string
){
    return await Session.findOne({
        refreshToken,
        isRevoked: false
    });
}
export async function updateSessionRefreshToken(
    sessionId: string,
    refreshToken: string
) {
    return await Session.findByIdAndUpdate(
        sessionId,
        {
            refreshToken
        },
        {
            new: true
        }
    );
}
export async function revokeSession(
    sessionId: string
) {
    return await Session.findByIdAndUpdate(
        sessionId,
        {
            isRevoked: true
        }
    );
}
export async function revokeAllSessions(userId: string) {
    return await Session.updateMany(
        {
            userId,
            isRevoked: false
        },
        {
            isRevoked: true
        }
    );
}
