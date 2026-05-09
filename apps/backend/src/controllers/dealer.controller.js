import { Dealer } from '../models/Dealer.js';
import { Order } from '../models/Order.js';

export async function dealerOrders(req, res, next) {
    try {
        const dealer = await Dealer.findOne({ user: req.user.userId });
        if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

        const orders = await Order.find({ dealer: dealer._id })
            .sort({ createdAt: -1 })
            .populate('customer', 'name email')
            .populate({ path: 'rider', populate: { path: 'user', select: 'name email' } });

        return res.json({ orders });
    } catch (err) {
        return next(err);
    }
}

export async function dealerDashboard(req, res, next) {
    try {
        const dealer = await Dealer.findOne({ user: req.user.userId });
        if (!dealer) return res.status(404).json({ error: 'Dealer profile not found' });

        const [totalOrders, deliveredOrders] = await Promise.all([
            Order.countDocuments({ dealer: dealer._id }),
            Order.countDocuments({ dealer: dealer._id, status: 'DELIVERED' }),
        ]);

        const revenueAgg = await Order.aggregate([
            { $match: { dealer: dealer._id, 'payment.status': 'PAID' } },
            { $group: { _id: null, revenue: { $sum: '$amount' } } },
        ]);

        const revenue = revenueAgg?.[0]?.revenue || 0;

        return res.json({ metrics: { totalOrders, deliveredOrders, revenue } });
    } catch (err) {
        return next(err);
    }
}
