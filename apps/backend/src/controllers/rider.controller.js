import { z } from 'zod';

import { Order } from '../models/Order.js';
import { Rider } from '../models/Rider.js';
import { User } from '../models/User.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { sendOtpEmail } from '../utils/email.js';

export async function listAvailableOrders(_req, res, next) {
    try {
        const orders = await Order.find({
            rider: { $exists: false },
            status: { $in: ['CREATED', 'PAID'] },
            $or: [
                { status: 'PAID' },
                { status: 'CREATED', 'payment.mode': 'CASH' },
            ],
        })
            .sort({ createdAt: -1 })
            .populate('dealer')
            .populate('customer', 'name email');

        return res.json({ orders });
    } catch (err) {
        return next(err);
    }
}

export async function listMyAssignedOrders(req, res, next) {
    try {
        const rider = await Rider.findOne({ user: req.user.userId });
        if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

        const orders = await Order.find({ rider: rider._id, status: { $in: ['ASSIGNED', 'PICKED'] } })
            .sort({ createdAt: -1 })
            .populate('dealer')
            .populate('customer', 'name email');

        return res.json({ orders });
    } catch (err) {
        return next(err);
    }
}

export async function acceptOrder(req, res, next) {
    try {
        const rider = await Rider.findOne({ user: req.user.userId });
        if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

        if (!rider.isAvailable) {
            return res.status(400).json({ error: 'Rider is not available' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.rider) {
            return res.status(400).json({ error: 'Order is already assigned' });
        }

        const isOnlinePaid = order.status === 'PAID' && order.payment?.mode === 'ONLINE' && order.payment?.status === 'PAID';
        const isCashOrder = order.status === 'CREATED' && order.payment?.mode === 'CASH';

        if (!isOnlinePaid && !isCashOrder) {
            return res.status(400).json({ error: 'Order is not available for assignment' });
        }

        order.rider = rider._id;
        order.status = 'ASSIGNED';
        await order.save();

        return res.json({ message: 'Order accepted', order });
    } catch (err) {
        return next(err);
    }
}

export async function collectCash(req, res, next) {
    try {
        const rider = await Rider.findOne({ user: req.user.userId });
        if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.rider?.toString() !== rider._id.toString()) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (order.status !== 'PICKED') {
            return res.status(400).json({ error: 'Cash can be collected only after PICKED' });
        }

        if (order.payment?.mode !== 'CASH') {
            return res.status(400).json({ error: 'This order is not Cash on Delivery' });
        }

        if (order.payment.status === 'PAID') {
            return res.json({ message: 'Already marked as paid', order });
        }

        order.payment.status = 'PAID';
        order.payment.provider = 'cash';
        order.payment.paidAt = new Date();
        await order.save();

        return res.json({ message: 'Cash collected', order });
    } catch (err) {
        return next(err);
    }
}

export async function markPicked(req, res, next) {
    try {
        const rider = await Rider.findOne({ user: req.user.userId });
        if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.rider?.toString() !== rider._id.toString()) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (order.status !== 'ASSIGNED') {
            return res.status(400).json({ error: 'Only ASSIGNED orders can be picked' });
        }

        order.status = 'PICKED';
        order.pickedAt = new Date();
        await order.save();

        return res.json({ message: 'Marked as picked', order });
    } catch (err) {
        return next(err);
    }
}

const sendOtpSchema = z.object({
    subject: z.string().optional(),
});

export async function sendDeliveryOtp(req, res, next) {
    try {
        sendOtpSchema.parse(req.body || {});

        const rider = await Rider.findOne({ user: req.user.userId });
        if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.rider?.toString() !== rider._id.toString()) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (order.status !== 'PICKED') {
            return res.status(400).json({ error: 'Generate OTP only after PICKED' });
        }

        const customer = await User.findById(order.customer);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const otp = generateOtp();
        const hash = await hashOtp(otp);

        order.deliveryOtp = {
            hash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        };
        await order.save();

        const result = await sendOtpEmail({
            to: customer.email,
            otp,
            subject: 'Cylendra-Wala Delivery OTP',
        });

        return res.json({ message: 'OTP generated', email: result });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}

const verifyOtpSchema = z.object({
    otp: z.string().min(4).max(10),
});

export async function verifyDeliveryOtp(req, res, next) {
    try {
        const data = verifyOtpSchema.parse(req.body);

        const rider = await Rider.findOne({ user: req.user.userId });
        if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.rider?.toString() !== rider._id.toString()) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (order.status !== 'PICKED') {
            return res.status(400).json({ error: 'Only PICKED orders can be delivered' });
        }

        if (order.payment?.mode === 'CASH' && order.payment?.status !== 'PAID') {
            return res.status(400).json({ error: 'Collect cash before delivery' });
        }

        if (!order.deliveryOtp?.hash || !order.deliveryOtp?.expiresAt) {
            return res.status(400).json({ error: 'OTP not generated yet' });
        }

        if (order.deliveryOtp.expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        const ok = await verifyOtp(data.otp, order.deliveryOtp.hash);
        if (!ok) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        order.deliveryOtp.verifiedAt = new Date();
        order.status = 'DELIVERED';
        order.deliveredAt = new Date();
        await order.save();

        return res.json({ message: 'Delivered successfully', order });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}

const availabilitySchema = z.object({
    isAvailable: z.boolean(),
});

export async function setAvailability(req, res, next) {
    try {
        const data = availabilitySchema.parse(req.body);

        const rider = await Rider.findOne({ user: req.user.userId });
        if (!rider) return res.status(404).json({ error: 'Rider profile not found' });

        rider.isAvailable = data.isAvailable;
        await rider.save();

        return res.json({ message: 'Availability updated', rider });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}
