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
