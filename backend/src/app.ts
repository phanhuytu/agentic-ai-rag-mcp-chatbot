import cors from 'cors';
import express from 'express';
import { requireAuth } from './http/auth.middleware.js';
import { errorMiddleware } from './http/async-handler.js';
import { chatRouter } from './routes/chat.routes.js';
import { customersRouter } from './routes/customers.routes.js';
import { okrRouter } from './routes/okr.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { weatherRouter } from './routes/weather.routes.js';
import { registerOkrTools } from './tools/okr.tools.js';

registerOkrTools();

function resolveCorsOrigin(): boolean | string | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw || raw === '*') {
    return true;
  }
  if (raw.includes(',')) {
    return raw.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return raw;
}

export function createApp() {
  const app = express();

  app.use(cors({ origin: resolveCorsOrigin() }));
  app.use(express.json({ limit: '1mb' }));

  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.json({
      status: 'ok',
      authRequired: Boolean(process.env.API_ACCESS_TOKEN?.trim()),
      ragMode: process.env.RAG_MODE ?? (process.env.VERCEL ? 'keyword' : 'embedding'),
      platform: process.env.VERCEL ? 'vercel' : 'local',
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  app.use('/api', requireAuth);
  app.use('/api/chat', chatRouter);
  app.use('/api/okr', okrRouter);

  // Coursera course stubs (tool-calling examples)
  app.use('/api/customers', customersRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/weather', weatherRouter);

  app.use(errorMiddleware);

  return app;
}
