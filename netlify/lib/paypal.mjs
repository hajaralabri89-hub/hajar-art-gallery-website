/* ================================================
   PAYPAL REST CLIENT (server-side only — uses the secret)
   ================================================ */
import { CURRENCY, money } from './catalog.mjs';

export function createPayPalClient({ clientId, secret, env = 'live', fetchImpl = fetch }) {
  const base = env === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  let token = null;
  let tokenExpires = 0;

  async function accessToken() {
    if (token && Date.now() < tokenExpires - 60_000) return token;
    const res = await fetchImpl(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
    const data = await res.json();
    token = data.access_token;
    tokenExpires = Date.now() + (Number(data.expires_in) || 300) * 1000;
    return token;
  }

  async function api(path, { method = 'GET', body, requestId } = {}) {
    const t = await accessToken();
    const res = await fetchImpl(base + path, {
      method,
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
        ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
    return { ok: res.ok, status: res.status, body: json };
  }

  return {
    /* Builds the order from the SERVER catalog: exact name, exact EUR price, quantity 1. */
    createOrder({ key, name, price, requestId }) {
      const value = money(price);
      return api('/v2/checkout/orders', {
        method: 'POST',
        requestId,
        body: {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: key,
            custom_id: key,
            description: `${name} — original artwork`.slice(0, 127),
            amount: {
              currency_code: CURRENCY,
              value,
              breakdown: { item_total: { currency_code: CURRENCY, value } },
            },
            items: [{
              name,
              quantity: '1',
              unit_amount: { currency_code: CURRENCY, value },
              category: 'PHYSICAL_GOODS',
            }],
          }],
          application_context: {
            brand_name: 'Hajar Art Gallery',
            shipping_preference: 'GET_FROM_FILE',
            user_action: 'PAY_NOW',
          },
        },
      });
    },

    getOrder(orderId) {
      return api(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
    },

    /* Same request id per order => PayPal never captures the same order twice. */
    captureOrder(orderId) {
      return api(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: 'POST',
        requestId: `capture-${orderId}`,
        body: {},
      });
    },

    /* Asks PayPal itself whether a webhook genuinely came from PayPal. */
    async verifyWebhook({ headers, event, webhookId }) {
      const res = await api('/v1/notifications/verify-webhook-signature', {
        method: 'POST',
        body: {
          auth_algo: headers.get('paypal-auth-algo'),
          cert_url: headers.get('paypal-cert-url'),
          transmission_id: headers.get('paypal-transmission-id'),
          transmission_sig: headers.get('paypal-transmission-sig'),
          transmission_time: headers.get('paypal-transmission-time'),
          webhook_id: webhookId,
          webhook_event: event,
        },
      });
      return res.ok && res.body && res.body.verification_status === 'SUCCESS';
    },
  };
}
