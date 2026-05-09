import mongoose from 'mongoose';

const roles = ['customer', 'dealer', 'rider', 'admin'];

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true, unique: true },
        phone: { type: String, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: roles, required: true, default: 'customer' },

        passwordResetOtpHash: { type: String },
        passwordResetOtpExpiresAt: { type: Date },
        passwordResetOtpSentAt: { type: Date },
        passwordResetOtpAttempts: { type: Number, default: 0 },
        passwordResetOtpLastAttemptAt: { type: Date },
    },
    { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
