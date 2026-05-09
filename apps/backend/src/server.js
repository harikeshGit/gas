import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
    await connectDb();
    const app = createApp();
    app.listen(PORT, () => {
        console.log(`[backend] listening on http://localhost:${PORT}`);
    });
}

bootstrap().catch((err) => {
    console.error('[backend] failed to start', err);
    process.exit(1);
});
