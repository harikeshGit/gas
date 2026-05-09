import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { dashboardSummary, listUsers } from '../controllers/admin.controller.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth);
adminRoutes.use(requireRole('admin'));

adminRoutes.get('/dashboard', dashboardSummary);
adminRoutes.get('/users', listUsers);
