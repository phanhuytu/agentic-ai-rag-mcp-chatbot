import type { Request, Response } from 'express';
import { orders } from '../data/mock-data.js';

export function listOrders(_req: Request, res: Response) {
  res.json({ orders });
}

export function getOrderById(req: Request, res: Response) {
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ order });
}
