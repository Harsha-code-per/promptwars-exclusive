import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getConfig } from './config/env';
import { createRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import uploadRoutes from './routes/upload';
import analysisRoutes from './routes/analysis';
import { closePool } from './db/connection';
import { closeRedis } from './services/redis';

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  }));

  // Rate limiting
  app.use('/api/', createRateLimiter());

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/documents', uploadRoutes);
  app.use('/api/documents', analysisRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

// Start server when run directly
if (require.main === module) {
  const config = getConfig();
  const app = createApp();

  // Automatically ensure database migrations and benchmark seeds are applied
  (async () => {
    try {
      const { migrate } = await import('./db/migrate');
      await migrate();
      const { seed } = await import('./db/seed');
      await seed();
    } catch (err: any) {
      console.warn(`[server] Startup DB migration/seed notice: ${err.message}`);
    }
  })();

  const server = app.listen(config.PORT, () => {
    console.log(`[server] LexiGuard AI API running on port ${config.PORT}`);
    console.log(`[server] Environment: ${config.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await closePool();
      await closeRedis();
      console.log('[server] Shutdown complete.');
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      console.error('[server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
