# Release checklist — Champagne Christelle Phlipaux

## Current project shape

The current branch contains a static HTML/CSS/JS ecommerce site with Netlify Functions and Stripe checkout.

Key areas:

- Root `*.html`: public, checkout, legal and confirmation pages.
- `assets/css/`: visual system and page-level styles.
- `assets/js/`: checkout and confirmation scripts.
- `netlify/functions/`: server-side commerce, checkout, reviews and storage.
- `shop-config.js` and `cart.js`: product and cart behavior.
- `scripts/validate-site.mjs`: static site integrity checks.
- `scripts/validate-commerce.mjs`: pricing, shipping, consent and order storage checks.

This description must be updated when PrestaShop becomes the active source of truth.

## High-value pages

Always consider these pages when changes affect the wider site:

- `index.html`: first impression and brand promise.
- `boutique.html`: commercial clarity and product discovery.
- `cuvees.html`: range narrative.
- `brut-tradition.html`, `brut-rose.html`, `demi-sec.html`: product confidence.
- `checkout.html`: conversion, consent and trust.
- `livraison-paiement.html`, `cgv.html`, `mentions-legales.html`, `politique-confidentialite.html`: reassurance and compliance.
- `maison.html`, `terroir.html`, `champagne-de-vigneron.html`: authenticity and SEO support.

## Validation ladder

Use the strongest relevant validation rather than running unrelated checks for appearance:

1. `npm run check` for broad changes.
2. `npm run lint` for HTML/JS quality.
3. `npm run test:site` for pages, links, images and structured data.
4. `npm run test:commerce` for product, price, delivery, consent and order behavior.
5. Specialist scripts:
   - `.agents/skills/seo-evidence-audit/scripts/scan_static_seo.py`
   - `.agents/skills/a11y-premium-ecommerce/scripts/scan_static_a11y.py`
   - `.agents/skills/static-site-visual-qa/scripts/visual_targets.py`
6. Browser checks for any rendered or interactive behavior.

If a tool or dependency is unavailable, say so and use the remaining checks as partial evidence only.

## Brand gate

Before finalizing visible work, check:

- Does the result feel human, credible and specific to this family House?
- Does it help the customer understand, choose or trust?
- Is any claim invented or stronger than the evidence?
- Did a CTA become pushy, artificial or discount-like?
- Is mobile easier rather than more crowded?
- Did SEO preserve natural French copy?
- Did visual polish introduce generic luxury clichés?

## Commerce gate

When commerce behavior changes, explicitly confirm whether the work touched:

- product prices or formats;
- shipping rules;
- Stripe or platform identifiers;
- client/server catalog consistency;
- terms consent;
- webhook or callback behavior;
- order storage;
- confirmation data.

Do not approve a migration simply because pages render. Product totals, delivery, payment status and accounting handoff must be verified against the active platform.
