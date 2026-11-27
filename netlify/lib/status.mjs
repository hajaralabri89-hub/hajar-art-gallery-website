/* ================================================
   ARTWORK STATUS STORE (persistent)
   Backed by Netlify Blobs in production. Per artwork:
     sold/<key>   -> written ONLY after a verified, completed payment
                     (or manually by the owner via the admin page)
     claim/<key>  -> "first buyer wins" lock taken just before capture;
                     it is what stops two customers buying the same piece
   Works with any store exposing get / setJSON / delete.
   ================================================ */
import { ARTWORKS } from './catalog.mjs';

export function createStatusStore(store) {
  const readSold  = (key) => store.get(`sold/${key}`,  { type: 'json' });
  const readClaim = (key) => store.get(`claim/${key}`, { type: 'json' });

  return {
    async get(key) {
      const [sold, claim] = await Promise.all([readSold(key), readClaim(key)]);
      if (sold) return 'sold';
      if (claim) return 'reserved';
      return 'available';
    },

    async all() {
      const keys = Object.keys(ARTWORKS);
      const states = await Promise.all(keys.map((k) => this.get(k)));
      return Object.fromEntries(keys.map((k, i) => [k, states[i]]));
    },

    async getClaim(key) { return readClaim(key); },

    /* Atomic: only ONE caller can create the claim. */
    async claim(key, orderId) {
      const res = await store.setJSON(
        `claim/${key}`,
        { orderId, at: new Date().toISOString() },
        { onlyIfNew: true }
      );
      return Boolean(res && res.modified);
    },

    async releaseClaim(key, orderId) {
      const claim = await readClaim(key);
      if (claim && claim.orderId === orderId) await store.delete(`claim/${key}`);
    },

    async markSold(key, details = {}) {
      await store.setJSON(
        `sold/${key}`,
        { ...details, soldAt: new Date().toISOString() },
        { onlyIfNew: true } // keep the first (real) record if called twice
      );
    },

    async setAvailable(key) {
      await Promise.all([store.delete(`sold/${key}`), store.delete(`claim/${key}`)]);
    },
  };
}
