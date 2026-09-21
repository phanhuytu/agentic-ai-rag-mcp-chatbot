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

export function createApp() {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:4200';

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      authRequired: Boolean(process.env.API_ACCESS_TOKEN?.trim()),
    });
  });

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
