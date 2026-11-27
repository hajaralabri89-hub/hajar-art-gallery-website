import { buildDefaultApi } from '../lib/default.mjs';

export default async (req) => buildDefaultApi().admin(req);

export const config = { path: '/api/admin/status' };
