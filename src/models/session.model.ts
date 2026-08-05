import mongoose, { Document } from "mongoose";

export interface ISession extends Document {
    userId: mongoose.Types.ObjectId;
    refreshToken: string;
    usedRefreshTokens: string[];
    ipAddress: string;
    userAgent: string;
    isRevoked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const sessionSchema = new mongoose.Schema<ISession>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        refreshToken: {
            type: String,
            required: true
        },
        usedRefreshTokens: {
            type: [String],
            default: []
        },
        ipAddress: {
            type: String,
            required: true
        },
        userAgent: {
            type: String,
            required: true
        },
        isRevoked: {
            type: Boolean,
            default: false
        }

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

sessionSchema.index({ userId: 1 });

sessionSchema.index({ refreshToken: 1 });

export const Session = mongoose.model<ISession>(
    "Session",
    sessionSchema
);