# Project Release Rubric

## Project Shape

This is a static HTML/CSS/JS ecommerce site for Champagne Christelle Phlipaux with Netlify Functions and Stripe checkout.

Key files and folders:

- Root `*.html`: static pages.
- `assets/css/`: visual system and page-level styles.
- `assets/js/`: checkout and confirmation scripts.
- `netlify/functions/`: server-side commerce, review, checkout, and storage logic.
- `data/reviews.json`: review data.
- `scripts/validate-site.mjs`: static site integrity checks.
- `scripts/validate-commerce.mjs`: pricing, shipping, consent, and order storage checks.

## High-Value Pages

Always consider these pages when changes affect the wider site:

- `index.html`: first impression and brand promise.
- `boutique.html`: commercial clarity and product discovery.
- `cuvees.html`: range narrative.
- `brut-tradition.html`, `brut-rose.html`, `demi-sec.html`: product confidence.
- `checkout.html`: conversion, consent, and trust.
- `livraison-paiement.html`, `cgv.html`, `mentions-legales.html`, `politique-confidentialite.html`: reassurance and compliance.
- `maison.html`, `terroir.html`, `champagne-de-vigneron.html`: authenticity and SEO support.

## Validation Ladder

Use the strongest available validation:

1. `npm run check`
2. `npm run lint`
3. `npm run test:site`
4. `npm run test:commerce`
5. Skill scripts:
   - `seo-evidence-audit/scripts/scan_static_seo.py`
   - `a11y-premium-ecommerce/scripts/scan_static_a11y.py`
   - `static-site-visual-qa/scripts/visual_targets.py`

If Node/npm are unavailable, say so and use Python/static/browser checks as partial validation.

## Brand Gate

Before finalizing visible work, check:

- Does the page still feel refined, calm, and credible?
- Is the copy specific to the house, the vineyard, the cuvees, or the buying context?
- Did any CTA become pushy or discount-like?
- Is mobile easier, not more crowded?
- Did SEO work preserve natural French copy?
