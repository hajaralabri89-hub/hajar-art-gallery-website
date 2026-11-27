import { buildDefaultApi } from '../lib/default.mjs';

export default async (req) => buildDefaultApi().createOrder(req);

export const config = { path: '/api/paypal/create-order' };
