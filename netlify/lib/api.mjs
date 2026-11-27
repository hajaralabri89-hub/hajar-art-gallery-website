/* ================================================
   ORIGINAL ARTWORK PURCHASE API
   Every rule that protects you lives here, on the server:
     - price / name / quantity come from the catalog, not the browser
     - an artwork is marked SOLD only after PayPal confirms the payment
       as COMPLETED (server-to-server), never because a browser said so
     - first buyer wins (atomic claim) — nobody can buy it twice
   ================================================ */
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  ARTWORKS, CURRENCY, EU_COUNTRIES, EU_ONLY_CHECKOUT, isArtworkKey, money,
} from './catalog.mjs';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

async function readJson(req) {
  try {
    const text = await req.text();
    if (text.length > 20_000) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const firstUnit = (order) => order && order.purchase_units && order.purchase_units[0];
const captureOf = (order) => {
  const unit = firstUnit(order);
  return unit && unit.payments && unit.payments.captures && unit.payments.captures[0];
};

/* 'COMPLETED' | 'PENDING' | 'FAILED' | 'NONE' — straight from PayPal's capture record */
function captureState(order) {
  const c = captureOf(order);
  if (!c) return 'NONE';
  if (c.status === 'COMPLETED') return 'COMPLETED';
  if (c.status === 'PENDING') return 'PENDING';
  return 'FAILED';
}

/* Is this order for a real catalogue artwork, at the exact catalogue
   price, in EUR, quantity 1? Anything else is rejected. */
function matchCatalog(order) {
  const unit = firstUnit(order);
  if (!unit) return null;
  const key = unit.custom_id || unit.reference_id;
  if (!isArtworkKey(key)) return null;
  const art = ARTWORKS[key];
  const amount = unit.amount;
  if (!amount || amount.currency_code !== CURRENCY || amount.value !== money(art.price)) return null;
  if (Array.isArray(unit.items) && unit.items.length) {
    if (unit.items.length !== 1 || unit.items[0].quantity !== '1') return null;
  }
  return { key, art };
}

const MSG = {
  sold: 'This artwork has already been acquired by another collector. You have not been charged.',
  reserved: 'This artwork is currently reserved by another collector. You have not been charged.',
  paypalDown: 'We could not reach PayPal. Please try again in a moment. You have not been charged.',
  declined: 'PayPal could not complete this payment. You have not been charged. Please try again or use another payment method.',
  unknown: 'We could not confirm your payment. Please do not pay again — check your PayPal account or contact the gallery.',
  nonEu: 'Free delivery applies to EU addresses only. For delivery outside the EU, please contact the gallery. You have not been charged.',
};

export function createApi({ paypal, status, config }) {
  const { clientId, adminToken, webhookId, paymentsReady } = config;

  /* A payment that PayPal reports COMPLETED means the artwork is sold. */
  async function settle(key, orderId, order, state) {
    if (state === 'COMPLETED') {
      const cap = captureOf(order);
      await status.markSold(key, {
        orderId,
        captureId: cap && cap.id,
        amount: cap && cap.amount && cap.amount.value,
        currency: cap && cap.amount && cap.amount.currency_code,
      });
      return json({ status: 'COMPLETED' });
    }
    if (state === 'PENDING') {
      // Money not final yet: keep it reserved, but do NOT mark it sold.
      return json({
        status: 'PENDING',
        message: 'Your payment is pending confirmation from PayPal. The artwork is reserved for you and will be confirmed as soon as the payment clears.',
      });
    }
    await status.releaseClaim(key, orderId);
    return json({ error: 'declined', message: MSG.declined }, 402);
  }

  return {
    /* GET /api/artworks — public, no secrets */
    async getArtworks(req) {
      if (req.method !== 'GET') return json({ error: 'method' }, 405);
      const artworks = await status.all();
      return json({ paymentsReady, clientId: paymentsReady ? clientId : null, artworks });
    },

    /* POST /api/paypal/create-order  { artwork } */
    async createOrder(req) {
      if (req.method !== 'POST') return json({ error: 'method' }, 405);
      const body = await readJson(req);
      const key = body && body.artwork;
      if (!isArtworkKey(key)) return json({ error: 'unknown-artwork' }, 400);
      if (!paymentsReady) return json({ error: 'unavailable', message: 'Payments are not available right now.' }, 503);

      const state = await status.get(key);
      if (state === 'sold') return json({ error: 'sold', message: MSG.sold }, 409);
      if (state === 'reserved') return json({ error: 'reserved', message: MSG.reserved }, 409);

      let res;
      try {
        res = await paypal.createOrder({
          key, name: ARTWORKS[key].name, price: ARTWORKS[key].price, requestId: randomUUID(),
        });
      } catch (err) {
        console.error('create-order failed:', err.message);
        return json({ error: 'paypal', message: MSG.paypalDown }, 502);
      }
      if (!res.ok || !res.body || !res.body.id) {
        console.error('create-order rejected by PayPal:', res.status, JSON.stringify(res.body));
        return json({ error: 'paypal', message: MSG.paypalDown }, 502);
      }
      return json({ id: res.body.id });
    },

    /* POST /api/paypal/capture-order  { orderID }
       The only place (besides the webhook) that can mark an artwork SOLD. */
    async captureOrder(req) {
      if (req.method !== 'POST') return json({ error: 'method' }, 405);
      if (!paymentsReady) return json({ error: 'unavailable', message: 'Payments are not available right now.' }, 503);

      const body = await readJson(req);
      const orderID = body && body.orderID;
      if (typeof orderID !== 'string' || !/^[A-Za-z0-9_-]{5,64}$/.test(orderID)) {
        return json({ error: 'bad-request' }, 400);
      }

      let orderRes;
      try { orderRes = await paypal.getOrder(orderID); } catch { orderRes = null; }
      if (!orderRes || !orderRes.ok) return json({ error: 'paypal', message: MSG.paypalDown }, 502);
      const order = orderRes.body;

      const match = matchCatalog(order);
      if (!match) {
        console.error('capture-order: order does not match catalogue', orderID);
        return json({ error: 'invalid-order', message: 'This order does not match an artwork in the gallery. You have not been charged.' }, 400);
      }
      const { key } = match;

      // Already captured earlier (e.g. the buyer's browser retried): confirm, never capture twice.
      if (order.status === 'COMPLETED') {
        const state = captureState(order);
        if (state === 'NONE') return json({ error: 'unknown', message: MSG.unknown }, 502);
        return settle(key, orderID, order, state);
      }
      if (order.status !== 'APPROVED') {
        return json({ error: 'not-approved', message: 'This payment has not been approved in PayPal yet. You have not been charged.' }, 400);
      }

      if (EU_ONLY_CHECKOUT) {
        const unit = firstUnit(order);
        const cc = unit && unit.shipping && unit.shipping.address && unit.shipping.address.country_code;
        if (!cc || !EU_COUNTRIES.has(String(cc).toUpperCase())) {
          return json({ error: 'non-eu', message: MSG.nonEu }, 422);
        }
      }

      if ((await status.get(key)) === 'sold') return json({ error: 'sold', message: MSG.sold }, 409);

      // First buyer wins: only one order can hold the claim.
      const won = await status.claim(key, orderID);
      if (!won) {
        const existing = await status.getClaim(key);
        if (!existing || existing.orderId !== orderID) {
          const now = await status.get(key);
          return json({ error: now === 'sold' ? 'sold' : 'reserved', message: now === 'sold' ? MSG.sold : MSG.reserved }, 409);
        }
        // same order retrying — carry on
      }

      let cap = null;
      let threw = false;
      try { cap = await paypal.captureOrder(orderID); } catch { threw = true; }
      if (cap && cap.ok && cap.body) {
        const state = captureState(cap.body);
        if (state !== 'NONE') return settle(key, orderID, cap.body, state);
      }

      // A network error or a PayPal 5xx means the capture MAY still have gone through.
      // Only a definite refusal from PayPal (e.g. 4xx "declined") is safe to treat as "not charged".
      const outcomeUnknown = threw || !cap || cap.status >= 500 || (cap.ok && captureState(cap.body) === 'NONE');

      // Ask PayPal what really happened.
      let check = null;
      try {
        const r = await paypal.getOrder(orderID);
        if (r.ok) check = r.body;
      } catch { /* handled below */ }

      if (check && check.status === 'COMPLETED' && captureState(check) !== 'NONE') {
        return settle(key, orderID, check, captureState(check));
      }
      if (check && !outcomeUnknown) {
        await status.releaseClaim(key, orderID); // PayPal definitively refused → free it for others
        return json({ error: 'declined', message: MSG.declined }, 402);
      }
      // Unknown outcome: keep it reserved (so nobody else can buy it) until the PayPal
      // webhook confirms the payment, or you clear it in the admin page.
      console.error('capture-order: outcome unknown for', orderID, '— artwork left reserved');
      return json({ error: 'unknown', message: MSG.unknown }, 502);
    },

    /* POST /api/paypal/webhook — PayPal tells us about payments.
       Backup path for payments that complete later (e.g. were PENDING). */
    async webhook(req) {
      if (req.method !== 'POST') return json({ error: 'method' }, 405);
      if (!webhookId || !paymentsReady) return json({ error: 'webhook-not-configured' }, 503);

      const raw = await req.text();
      let event;
      try { event = JSON.parse(raw); } catch { return json({ error: 'bad-json' }, 400); }

      let genuine = false;
      try { genuine = await paypal.verifyWebhook({ headers: req.headers, event, webhookId }); }
      catch (err) { console.error('webhook verification error:', err.message); return json({ error: 'verify-failed' }, 500); }
      if (!genuine) return json({ error: 'bad-signature' }, 400);

      const type = event.event_type;
      const resource = event.resource || {};
      const orderId = resource.supplementary_data && resource.supplementary_data.related_ids
        && resource.supplementary_data.related_ids.order_id;

      if (type !== 'PAYMENT.CAPTURE.COMPLETED' && type !== 'PAYMENT.CAPTURE.DENIED' && type !== 'PAYMENT.CAPTURE.DECLINED') {
        return json({ ok: true, ignored: type });
      }
      if (!orderId) return json({ ok: true, ignored: 'no-order-id' });

      let orderRes;
      try { orderRes = await paypal.getOrder(orderId); } catch { return json({ error: 'paypal' }, 500); }
      if (!orderRes.ok) return json({ error: 'paypal' }, 500); // PayPal will retry
      const order = orderRes.body;
      const match = matchCatalog(order);
      if (!match) return json({ ok: true, ignored: 'not-a-gallery-order' });

      if (type === 'PAYMENT.CAPTURE.COMPLETED') {
        const cap = captureOf(order);
        if (!cap || cap.status !== 'COMPLETED') return json({ ok: true, ignored: 'not-completed' });
        await status.markSold(match.key, {
          orderId, captureId: cap.id, amount: cap.amount && cap.amount.value,
          currency: cap.amount && cap.amount.currency_code, via: 'webhook',
        });
        return json({ ok: true, sold: match.key });
      }

      // Denied / declined: free the artwork if this order was holding it.
      await status.releaseClaim(match.key, orderId);
      return json({ ok: true, released: match.key });
    },

    /* GET/POST /api/admin/status — owner only (Bearer ADMIN_TOKEN) */
    async admin(req) {
      if (!adminToken || adminToken.length < 20) return json({ error: 'admin-disabled' }, 503);
      const header = req.headers.get('authorization') || '';
      const given = header.startsWith('Bearer ') ? header.slice(7) : '';
      const a = createHash('sha256').update(given).digest();
      const b = createHash('sha256').update(adminToken).digest();
      if (!timingSafeEqual(a, b)) return json({ error: 'unauthorized' }, 401);

      if (req.method === 'GET') return json({ artworks: await status.all() });
      if (req.method !== 'POST') return json({ error: 'method' }, 405);

      const body = await readJson(req);
      const key = body && body.artwork;
      const wanted = body && body.status;
      if (!isArtworkKey(key) || (wanted !== 'sold' && wanted !== 'available')) {
        return json({ error: 'bad-request' }, 400);
      }
      if (wanted === 'sold') await status.markSold(key, { source: 'manual' });
      else await status.setAvailable(key);
      return json({ artworks: await status.all() });
    },
  };
}
