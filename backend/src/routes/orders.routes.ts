import { Router } from 'express';
import { getOrderById, listOrders } from '../controllers/orders.controller.js';

export const ordersRouter = Router();

ordersRouter.get('/', listOrders);
ordersRouter.get('/:id', getOrderById);
