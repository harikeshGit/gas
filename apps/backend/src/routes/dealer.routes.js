import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { dealerDashboard, dealerOrders } from '../controllers/dealer.controller.js';

export const dealerRoutes = Router();

dealerRoutes.use(requireAuth);
dealerRoutes.use(requireRole('dealer'));

dealerRoutes.get('/dashboard', dealerDashboard);
dealerRoutes.get('/orders', dealerOrders);
