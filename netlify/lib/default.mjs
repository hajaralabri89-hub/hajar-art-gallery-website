/* Production wiring: secrets come from Netlify environment variables ONLY.
   Nothing secret is ever written into HTML or browser JavaScript. */
import { getStore } from '@netlify/blobs';
import { createPayPalClient } from './paypal.mjs';
import { createStatusStore } from './status.mjs';
import { createApi } from './api.mjs';

let api = null;

export function buildDefaultApi() {
  if (api) return api;
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_CLIENT_SECRET || '';
  const env = process.env.PAYPAL_ENV === 'sandbox' ? 'sandbox' : 'live';

  api = createApi({
    paypal: createPayPalClient({ clientId, secret, env }),
    status: createStatusStore(getStore({ name: 'artwork-status', consistency: 'strong' })),
    config: {
      clientId,
      adminToken: process.env.ADMIN_TOKEN || '',
      webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
      paymentsReady: Boolean(clientId && secret),
    },
  });
  return api;
}
