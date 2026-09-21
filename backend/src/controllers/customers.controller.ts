import type { Request, Response } from 'express';
import { customers } from '../data/mock-data.js';

export function listCustomers(_req: Request, res: Response) {
  res.json({ customers });
}

export function getCustomerById(req: Request, res: Response) {
  const customer = customers.find((item) => item.id === req.params.id);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  res.json({ customer });
}
