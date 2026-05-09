import { z } from 'zod';

import { User } from '../models/User.js';
import { Order } from '../models/Order.js';

export async function dashboardSummary(_req, res, next) {
    try {
        const [orderCount, deliveredCount, paidCount] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'DELIVERED' }),
            Order.countDocuments({ 'payment.status': 'PAID' }),
        ]);

        const revenueAgg = await Order.aggregate([
            { $match: { 'payment.status': 'PAID' } },
            { $group: { _id: null, revenue: { $sum: '$amount' } } },
        ]);

        const revenue = revenueAgg?.[0]?.revenue || 0;

        return res.json({
            metrics: {
                totalOrders: orderCount,
                paidOrders: paidCount,
                deliveredOrders: deliveredCount,
                revenue,
            },
        });
    } catch (err) {
        return next(err);
    }
}

const listUsersSchema = z.object({
    role: z.enum(['customer', 'dealer', 'rider', 'admin']).optional(),
});

export async function listUsers(req, res, next) {
    try {
        const q = listUsersSchema.parse(req.query);

        const filter = {};
        if (q.role) filter.role = q.role;

        const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).limit(50);
        return res.json({ users });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}
