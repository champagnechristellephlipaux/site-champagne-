---
name: netlify-stripe-commerce
description: Netlify Functions and Stripe checkout workflow for the Champagne Christelle Phlipaux ecommerce site. Use when changing checkout sessions, Stripe metadata, pricing, shipping, consent, order storage, webhook handling, reviews, environment variables, Netlify deploy behavior, or commerce-related client scripts.
---

# Netlify Stripe Commerce

## Quick Start

Use this skill before editing commerce or Netlify function behavior. Read `references/commerce-contract.md` first.

Primary validation command when Node/npm are available:

```bash
npm run test:commerce
```

Run `npm run check` before final delivery when commerce changes are user-facing or cross multiple files.

## Workflow

1. Trace both client and server paths before editing. For commerce, check `shop-config.js`, `cart.js`, checkout client scripts, and `netlify/functions`.
2. Preserve product SKUs, Stripe price IDs, shipping calculations, terms consent, and order reference behavior unless the user explicitly asks to change them.
3. Keep validation mirrored between browser and server. Server-side logic is the source of truth for checkout safety.
4. Never log secrets, expose secret environment variables, or hard-code live secret keys.
5. Treat webhook changes as high risk. Validate idempotency, required event shape, and local order storage behavior.
6. After changes, run commerce tests and any affected site/static checks.

## Risk Flags

Pause for extra inspection when changing:

- `create-checkout-session.js`
- `create-checkout-elements-session.js`
- `checkout-shared.js`
- `stripe-webhook.js`
- `orders-store.js`
- `cart.js`
- `shop-config.js`
- Checkout or confirmation page HTML/JS

## Reporting

State whether prices, shipping, consent, and storage were touched. Mention exactly which commerce checks ran.
