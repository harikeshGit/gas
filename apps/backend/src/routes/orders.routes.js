import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
    createOrder,
    listMyOrders,
    getOrderById,
    payOrder,
    updatePaymentMode,
    confirmRazorpayPayment,
    cancelOrder,
} from '../controllers/orders.controller.js';

export const ordersRoutes = Router();

ordersRoutes.use(requireAuth);

ordersRoutes.post('/', requireRole('customer'), createOrder);
ordersRoutes.get('/my', requireRole('customer'), listMyOrders);
ordersRoutes.get('/:id', getOrderById);
ordersRoutes.post('/:id/payment-mode', requireRole('customer'), updatePaymentMode);
ordersRoutes.post('/:id/pay', requireRole('customer'), payOrder);
ordersRoutes.post('/:id/pay/confirm', requireRole('customer'), confirmRazorpayPayment);
ordersRoutes.post('/:id/cancel', requireRole('customer'), cancelOrder);
