import { buildDefaultApi } from '../lib/default.mjs';

export default async (req) => buildDefaultApi().getArtworks(req);

export const config = { path: '/api/artworks' };
