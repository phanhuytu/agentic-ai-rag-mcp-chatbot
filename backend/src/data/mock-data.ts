export type Customer = {
  id: string;
  name: string;
  email: string;
  city: string;
};

export type Order = {
  id: string;
  customerId: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  totalUsd: number;
  items: string[];
};

export const customers: Customer[] = [
  {
    id: 'cust-001',
    name: 'An Nguyen',
    email: 'an.nguyen@example.com',
    city: 'Ho Chi Minh',
  },
  {
    id: 'cust-002',
    name: 'Binh Tran',
    email: 'binh.tran@example.com',
    city: 'Ha Noi',
  },
  {
    id: 'cust-003',
    name: 'Chi Le',
    email: 'chi.le@example.com',
    city: 'Da Nang',
  },
];

export const orders: Order[] = [
  {
    id: 'ord-1001',
    customerId: 'cust-001',
    status: 'shipped',
    totalUsd: 129.5,
    items: ['Wireless mouse', 'USB-C hub'],
  },
  {
    id: 'ord-1002',
    customerId: 'cust-002',
    status: 'pending',
    totalUsd: 49.0,
    items: ['Notebook'],
  },
  {
    id: 'ord-1003',
    customerId: 'cust-001',
    status: 'delivered',
    totalUsd: 899.0,
    items: ['Laptop stand', 'Mechanical keyboard'],
  },
];
