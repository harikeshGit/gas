import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function signToken({ userId, role, email, name }) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not set');
    }

    return jwt.sign({ userId, role, email, name }, secret, { expiresIn: '7d' });
}
