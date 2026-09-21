import { Router } from 'express';
import { getCustomerById, listCustomers } from '../controllers/customers.controller.js';

export const customersRouter = Router();

customersRouter.get('/', listCustomers);
customersRouter.get('/:id', getCustomerById);
