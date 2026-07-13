# Commerce Contract

## Core Files

Client:

- `shop-config.js`: product SKUs, labels, formats, prices.
- `cart.js`: cart totals and shipping display logic.
- `assets/js/checkout-redirect.js`: Stripe Checkout handoff.
- `assets/js/checkout-elements.js`: embedded checkout behavior.
- `assets/js/merci-checkout.js`: post-checkout confirmation.

Server:

- `netlify/functions/checkout-shared.js`: shared catalog normalization, shipping, consent mapping.
- `netlify/functions/create-checkout-session.js`: Stripe Checkout session creation.
- `netlify/functions/create-checkout-elements-session.js`: embedded checkout session creation.
- `netlify/functions/get-checkout-session.js`: confirmation lookup.
- `netlify/functions/stripe-webhook.js`: Stripe webhook handling.
- `netlify/functions/orders-store.js`: order persistence.
- `netlify/functions/record-checkout-consent.js`: consent capture.

## Invariants

Preserve unless explicitly changing the commerce model:

- Client and server product catalogs match.
- Prices are converted to cents with no rounding drift.
- Shipping totals match between client and server.
- Terms acceptance stores accepted state, timestamp, version, and method.
- Stripe price IDs keep the expected `price_` format.
- Order storage is idempotent enough for webhook retries.
- No secret key is exposed to client HTML or JS.

## Validation

Run `npm run test:commerce` after changes to:

- Product pricing and Stripe price IDs.
- Shipping scenarios.
- CGV version format.
- Terms acceptance mapping.
- Local order storage.

Run `npm run test:site` too when HTML, links, JSON-LD, images, or sitemap are touched.

## Delivery Notes

In final reporting, explicitly mention whether the change touched:

- Product prices or formats.
- Shipping rules.
- Stripe session metadata.
- Terms consent.
- Webhook behavior.
- Order storage.
