import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: "USER" | "ADMIN";
    isEmailVerified: boolean;
    googleId?: string;
    avatar?: string;
    loginAttempts: number;
    lockUntil?: number;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: false
        },
        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER"
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        googleId: {
            type: String
        },
        avatar: {
            type: String
        },
        loginAttempts: {
            type: Number,
            required: true,
            default: 0
        },
        lockUntil: {
            type: Number
        },
    },
    {
        timestamps: true,

        toJSON: {
            transform(_, ret) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;

                return ret;
            }
        }
    }
);

userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model<IUser>(
    "User",
    userSchema
);