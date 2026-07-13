---
name: champagne-release-qa
description: Release-quality workflow for the Champagne Christelle Phlipaux static ecommerce site. Use when Codex is finishing or reviewing changes, preparing a delivery, validating premium brand consistency, checking mobile/desktop impact, or deciding which project checks to run before presenting work as complete.
---

# Champagne Release QA

## Quick Start

Use this skill before finalizing any site change. Treat it as the final gate for code quality, premium presentation, SEO hygiene, ecommerce confidence, and validation honesty.

First read `references/project-release-rubric.md` when the change affects visible UI, checkout, SEO, copy, or Netlify functions.

Run the local evidence helper when useful:

```bash
python3 .agents/skills/champagne-release-qa/scripts/release_snapshot.py
```

## Workflow

1. Inspect the touched files and the relevant surrounding templates before editing.
2. Identify the user-facing surface: homepage, shop listing, product page, checkout, legal page, blog, review flow, or Netlify function.
3. Apply the smallest change that solves the request while preserving the brand rules in `AGENTS.md`.
4. Run the best available checks:
   - `npm run check` when Node/npm are available.
   - `npm run lint`, `npm run test:site`, and `npm run test:commerce` when a narrower run is more appropriate.
   - The bundled Python audit scripts from related skills when Node/npm are unavailable.
5. Verify desktop and mobile impact for visible changes. Use browser screenshots when a server/browser tool is available.
6. Report what changed, why it improves the site, files touched, validation performed, and remaining risks.

## Release Judgment

Do not call work release-ready when:

- Only code was inspected for a visual change.
- Checkout, pricing, shipping, consent, or Stripe metadata changed without commerce validation.
- A copy change sounds generic, pushy, or unlike a small Champagne house.
- SEO changes add keywords at the cost of trust, hierarchy, or readability.
- A mobile layout may wrap, overlap, or hide primary actions and was not checked.

Prefer explicit residual risk over false certainty.
