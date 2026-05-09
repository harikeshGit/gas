import { z } from 'zod';
import mongoose from 'mongoose';
import crypto from 'crypto';

import { Order } from '../models/Order.js';
import { Dealer } from '../models/Dealer.js';
import { createPaymentOrder } from '../utils/payment.js';

const payModeSchema = z
    .object({
        mode: z.enum(['demo', 'razorpay']).optional(),
    })
    .optional();

const updatePaymentModeSchema = z.object({
    mode: z.enum(['ONLINE', 'CASH']),
});

const razorpayConfirmSchema = z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
});

const createOrderSchema = z.object({
    dealerId: z.string().min(1),
    paymentMode: z.enum(['ONLINE', 'CASH']).optional(),
    cylinderType: z.string().optional(),
    quantity: z.number().int().min(1).max(5).default(1),
    address: z.string().min(5),
    location: z
        .object({
            lat: z.number().optional(),
            lng: z.number().optional(),
        })
        .optional(),
    amount: z.number().min(1),
});

export async function createOrder(req, res, next) {
    try {
        const data = createOrderSchema.parse(req.body);

        if (!mongoose.isValidObjectId(data.dealerId)) {
            return res.status(400).json({ error: 'Invalid dealerId' });
        }

        const dealer = await Dealer.findById(data.dealerId);
        if (!dealer) {
            return res.status(404).json({ error: 'Dealer not found' });
        }

        const order = await Order.create({
            customer: req.user.userId,
            dealer: dealer._id,
            cylinderType: data.cylinderType || 'Domestic',
            quantity: data.quantity,
            address: data.address,
            location: data.location,
            amount: data.amount,
            status: 'CREATED',
            payment: {
                mode: data.paymentMode || 'ONLINE',
                status: 'UNPAID',
                provider: (data.paymentMode || 'ONLINE') === 'CASH' ? 'cash' : 'none',
            },
        });

        return res.status(201).json({ order });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}

export async function listMyOrders(req, res, next) {
    try {
        const orders = await Order.find({ customer: req.user.userId })
            .sort({ createdAt: -1 })
            .populate('dealer')
            .populate({ path: 'rider', populate: { path: 'user', select: 'name email phone' } });

        return res.json({ orders });
    } catch (err) {
        return next(err);
    }
}

export async function getOrderById(req, res, next) {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name email')
            .populate('dealer')
            .populate({ path: 'rider', populate: { path: 'user', select: 'name email phone' } });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        const role = req.user?.role;
        const userId = req.user?.userId;

        if (role === 'customer' && order.customer?._id?.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        return res.json({ order });
    } catch (err) {
        return next(err);
    }
}

export async function payOrder(req, res, next) {
    try {
        const payMode = payModeSchema?.parse(req.body || {});

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.customer.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Order is cancelled' });
        }

        if (order.payment.status === 'PAID') {
            return res.json({ message: 'Already paid', order });
        }

        if (order.payment?.mode === 'CASH') {
            return res.status(400).json({
                error: 'Cash on Delivery selected. Online payment not required.',
            });
        }

        // Demo mode: complete payment immediately for presentation.
        if (payMode?.mode === 'demo') {
            order.payment.status = 'PAID';
            order.payment.provider = 'demo';
            order.payment.paidAt = new Date();
            order.status = 'PAID';
            await order.save();

            return res.json({
                demo: true,
                message: 'Demo payment successful',
                order,
            });
        }

        const paymentOrder = await createPaymentOrder({
            amountInRupees: order.amount,
            receipt: `order_${order._id}`,
        });

        if (paymentOrder.demo) {
            order.payment.status = 'PAID';
            order.payment.provider = 'demo';
            order.payment.paidAt = new Date();
            order.status = 'PAID';
            await order.save();

            return res.json({
                demo: true,
                message: 'Demo payment successful (Razorpay keys not set)',
                order,
            });
        }

        order.payment.provider = 'razorpay';
        order.payment.razorpayOrderId = paymentOrder.razorpayOrderId;
        await order.save();

        return res.json({
            demo: false,
            razorpay: {
                keyId: paymentOrder.keyId,
                orderId: paymentOrder.razorpayOrderId,
                amount: paymentOrder.amount,
                currency: 'INR',
            },
            order,
        });
    } catch (err) {
        return next(err);
    }
}

export async function updatePaymentMode(req, res, next) {
    try {
        const data = updatePaymentModeSchema.parse(req.body);

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.customer.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (order.status !== 'CREATED') {
            return res.status(400).json({ error: 'Payment mode can be changed only before assignment' });
        }

        order.payment.mode = data.mode;
        order.payment.status = 'UNPAID';
        order.payment.paidAt = undefined;
        order.payment.razorpayOrderId = undefined;
        order.payment.razorpayPaymentId = undefined;
        order.payment.provider = data.mode === 'CASH' ? 'cash' : 'none';

        await order.save();
        return res.json({ message: 'Payment mode updated', order });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}

export async function confirmRazorpayPayment(req, res, next) {
    try {
        const data = razorpayConfirmSchema.parse(req.body);

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.customer.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (order.payment?.mode !== 'ONLINE') {
            return res.status(400).json({ error: 'Order is not in ONLINE payment mode' });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(400).json({ error: 'Razorpay secret is not configured on server' });
        }

        if (!order.payment?.razorpayOrderId) {
            return res.status(400).json({ error: 'Razorpay order not created yet' });
        }

        if (data.razorpay_order_id !== order.payment.razorpayOrderId) {
            return res.status(400).json({ error: 'Razorpay orderId mismatch' });
        }

        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
            .digest('hex');

        if (expected !== data.razorpay_signature) {
            return res.status(400).json({ error: 'Invalid Razorpay signature' });
        }

        order.payment.status = 'PAID';
        order.payment.provider = 'razorpay';
        order.payment.razorpayPaymentId = data.razorpay_payment_id;
        order.payment.paidAt = new Date();
        order.status = 'PAID';
        await order.save();

        return res.json({ message: 'Payment verified', order });
    } catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        return next(err);
    }
}

export async function cancelOrder(req, res, next) {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.customer.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (order.status === 'DELIVERED') {
            return res.status(400).json({ error: 'Delivered orders cannot be cancelled' });
        }

        order.status = 'CANCELLED';
        order.cancelledAt = new Date();
        await order.save();

        return res.json({ message: 'Cancelled', order });
    } catch (err) {
        return next(err);
    }
}
