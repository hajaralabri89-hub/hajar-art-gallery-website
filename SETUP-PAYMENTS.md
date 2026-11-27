# Original Artwork payments — setup guide

Nothing here works until you finish steps 1–4. Until then the **Acquire Artwork**
buttons stay hidden (they never appear unless payment can really work), and
SOLD labels still show for anything marked sold.

## How it works
1. A visitor clicks **Acquire Artwork** → PayPal checkout opens.
2. The server (Netlify Functions in `/netlify`) creates the PayPal order using the
   name and price from `netlify/lib/catalog.mjs` — the browser cannot change them.
   Quantity is always 1, currency always EUR.
3. After the customer approves, the server asks PayPal to take the money.
   **Only when PayPal answers "COMPLETED" does the server mark the artwork SOLD.**
4. SOLD is stored in Netlify Blobs (built into Netlify, no extra account),
   so every visitor and device sees it.
5. A PayPal **webhook** is a backup: if a payment finishes later (e.g. was pending),
   PayPal tells the server and the artwork is marked SOLD then.

## Step 1 — PayPal credentials (developer.paypal.com → Apps & Credentials → **Live**)
- Open the app whose **Client ID** is the one inside the PayPal `<script>` line of `index.html`
  (the `client-id=BAAk…` part). Copy its **Secret**.
- ⚠️ The Client ID in the page and the Secret must belong to the **same app**.
  If you can't find that Client ID in your apps, don't swap it blindly — tell me.

## Step 2 — PayPal webhook (same app, "Webhooks" section → Add webhook)
- Webhook URL: `https://hajarartgallery.com/api/paypal/webhook`
- Events: **Payment capture completed**, **Payment capture denied**, **Payment capture declined**
- Save, then copy the **Webhook ID**.

## Step 3 — Netlify environment variables (Site configuration → Environment variables)
| Name | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | the Client ID from step 1 |
| `PAYPAL_CLIENT_SECRET` | the Secret from step 1 (tick "contains secret value") |
| `PAYPAL_WEBHOOK_ID` | the Webhook ID from step 2 |
| `ADMIN_TOKEN` | a long random password you invent (at least 20 characters) — this is your admin login |
| `PAYPAL_ENV` | leave **unset** for real payments (`sandbox` only for test mode) |

Secrets live only here. They are never in your HTML/JS/GitHub.
If a Netlify build error mentions the Node version, also add `NODE_VERSION` = `22`.

## Step 4 — Upload to GitHub (keep the folder structure) and deploy once
```
index.html            (changed)
script.js             (changed)
style.css             (unchanged since last time)
admin.html            (new)
package.json          (new — if you already have one, just add the @netlify/blobs line)
netlify/functions/    artworks.mjs  create-order.mjs  capture-order.mjs  webhook.mjs  admin-status.mjs
netlify/lib/          api.mjs  catalog.mjs  default.mjs  paypal.mjs  status.mjs
```
Do not edit `netlify/functions/*.mjs`. If you already have a `netlify.toml`, make sure it
doesn't point `functions` somewhere other than `netlify/functions`.

## Step 5 — Check it's alive
- Open `https://hajarartgallery.com/api/artworks` → should show `"paymentsReady":true`.
- Reload the homepage → 14 **Acquire Artwork** buttons appear.
- Open `/admin.html` → sign in with your `ADMIN_TOKEN`.

## Testing a real purchase
PayPal won't let an account pay itself, so use a friend's PayPal account (or PayPal sandbox):
buy the cheapest piece (The Quiet Island, €100) → it should turn **SOLD** → refund it in PayPal →
open `/admin.html` → **Put back on sale**.
(Testing in sandbox on your own computer with `netlify dev` costs no Netlify deploy credits:
set `PAYPAL_ENV=sandbox` and sandbox keys, and temporarily use the sandbox Client ID in `index.html`.)

## Day-to-day
- **Sold in person:** `/admin.html` → **Mark sold**. Customers can no longer buy it immediately.
- **"Reserved" label:** a payment is pending, or PayPal didn't confirm the result. Check PayPal:
  money arrived → **Mark sold**; no money → **Put back on sale**.
- **Changing a price:** edit it in BOTH `index.html` (what visitors see) and `netlify/lib/catalog.mjs`
  (what PayPal charges), then redeploy.
- **EU only:** orders to a non-EU address are not charged; the buyer is asked to contact you.
  Set `EU_ONLY_CHECKOUT = false` in `catalog.mjs` to allow free delivery everywhere.
- Each page view calls `/api/artworks` once (one small Netlify Function run).
