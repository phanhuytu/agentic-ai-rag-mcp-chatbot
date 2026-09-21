import cors from 'cors';
import express from 'express';
import { chatRouter } from './routes/chat.routes.js';
import { customersRouter } from './routes/customers.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { weatherRouter } from './routes/weather.routes.js';

export function createApp() {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:4200';

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/chat', chatRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/weather', weatherRouter);

  return app;
}
