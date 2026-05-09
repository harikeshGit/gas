import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
    listAvailableOrders,
    listMyAssignedOrders,
    acceptOrder,
    markPicked,
    collectCash,
    sendDeliveryOtp,
    verifyDeliveryOtp,
    setAvailability,
} from '../controllers/rider.controller.js';

export const riderRoutes = Router();

riderRoutes.use(requireAuth);
riderRoutes.use(requireRole('rider'));

riderRoutes.get('/available', listAvailableOrders);
riderRoutes.get('/my-orders', listMyAssignedOrders);

riderRoutes.post('/orders/:id/accept', acceptOrder);
riderRoutes.post('/orders/:id/pick', markPicked);
riderRoutes.post('/orders/:id/collect-cash', collectCash);
riderRoutes.post('/orders/:id/send-delivery-otp', sendDeliveryOtp);
riderRoutes.post('/orders/:id/verify-delivery-otp', verifyDeliveryOtp);

riderRoutes.post('/availability', setAvailability);
