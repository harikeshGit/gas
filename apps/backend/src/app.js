import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { notFoundHandler, errorHandler } from './middleware/error.js';
import { authRoutes } from './routes/auth.routes.js';
import { ordersRoutes } from './routes/orders.routes.js';
import { riderRoutes } from './routes/rider.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { dealerRoutes } from './routes/dealer.routes.js';
import { publicRoutes } from './routes/public.routes.js';

export function createApp() {
    dotenv.config();

    const app = express();

    app.use(express.json({ limit: '1mb' }));

    const corsOrigin = process.env.CLIENT_URL || '*';
    app.use(
        cors({
            origin: corsOrigin === '*' ? true : corsOrigin,
            credentials: true,
        })
    );

    app.get('/health', (_req, res) => {
        res.json({ ok: true, service: 'cylendra-wala-backend' });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/public', publicRoutes);
    app.use('/api/orders', ordersRoutes);
    app.use('/api/rider', riderRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/dealer', dealerRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
