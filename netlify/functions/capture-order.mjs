import { buildDefaultApi } from '../lib/default.mjs';

export default async (req) => buildDefaultApi().captureOrder(req);

export const config = { path: '/api/paypal/capture-order' };
