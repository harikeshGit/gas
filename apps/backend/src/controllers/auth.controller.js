import { z } from 'zod';

import { User } from '../models/User.js';
import { Dealer } from '../models/Dealer.js';
import { Rider } from '../models/Rider.js';
import { hashPassword, verifyPassword, signToken } from '../utils/auth.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { sendOtpEmail } from '../utils/email.js';

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
    role: z.enum(['customer', 'dealer', 'rider', 'admin']).default('customer'),
    businessName: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

const resetPasswordSchema = z.object({
    email: z.string().email(),
    otp: z.string().min(4).max(10),
    newPassword: z.string().min(6),
});

export async function register(req, res, next) {
    try {
        const data = registerSchema.parse(req.body);

        const existing = await User.findOne({ email: data.email });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = await hashPassword(data.password);

        const user = await User.create({
            name: data.name,
            email: data.email,
            phone: data.phone,
            passwordHash,
            role: data.role,
        });

        if (data.role === 'dealer') {
            const businessName = data.businessName || `${data.name} Dealer`;
            await Dealer.create({ user: user._id, businessName });
        }

        if (data.role === 'rider') {
            await Rider.create({ user: user._id });
        }

        const token = signToken({ userId: user._id.toString(), role: user.role, email: user.email, name: user.name });

        return res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}

export async function login(req, res, next) {
    try {
        const data = loginSchema.parse(req.body);

        const user = await User.findOne({ email: data.email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const ok = await verifyPassword(data.password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signToken({ userId: user._id.toString(), role: user.role, email: user.email, name: user.name });
        return res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}

export async function me(req, res, next) {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
}

export async function forgotPassword(req, res, next) {
    try {
        const data = forgotPasswordSchema.parse(req.body);

        const user = await User.findOne({ email: data.email });
        // Prevent account enumeration: always respond success.
        if (!user) {
            return res.json({ message: 'If an account exists for this email, an OTP has been sent.' });
        }

        const otp = generateOtp();
        user.passwordResetOtpHash = await hashOtp(otp);
        user.passwordResetOtpSentAt = new Date();
        user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        user.passwordResetOtpAttempts = 0;
        user.passwordResetOtpLastAttemptAt = null;
        await user.save();

        const emailResult = await sendOtpEmail({
            to: user.email,
            otp,
            subject: 'Password Reset OTP',
        });

        const base = { message: 'If an account exists for this email, an OTP has been sent.' };
        if (emailResult?.demo && emailResult?.demoOtp) {
            return res.json({ ...base, demo: true, demoOtp: emailResult.demoOtp });
        }
        return res.json(base);
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}

export async function resetPassword(req, res, next) {
    try {
        const data = resetPasswordSchema.parse(req.body);

        const user = await User.findOne({ email: data.email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid OTP or expired' });
        }

        const expiresAt = user.passwordResetOtpExpiresAt;
        const otpHash = user.passwordResetOtpHash;
        if (!expiresAt || !otpHash || expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ error: 'Invalid OTP or expired' });
        }

        user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
        user.passwordResetOtpLastAttemptAt = new Date();
        if (user.passwordResetOtpAttempts > 10) {
            await user.save();
            return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
        }

        const ok = await verifyOtp(data.otp, otpHash);
        if (!ok) {
            await user.save();
            return res.status(400).json({ error: 'Invalid OTP or expired' });
        }

        user.passwordHash = await hashPassword(data.newPassword);
        user.passwordResetOtpHash = null;
        user.passwordResetOtpExpiresAt = null;
        user.passwordResetOtpSentAt = null;
        user.passwordResetOtpAttempts = 0;
        user.passwordResetOtpLastAttemptAt = null;
        await user.save();

        return res.json({ message: 'Password reset successful. Please login.' });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}
