import { buildDefaultApi } from '../lib/default.mjs';

export default async (req) => buildDefaultApi().webhook(req);

export const config = { path: '/api/paypal/webhook' };
