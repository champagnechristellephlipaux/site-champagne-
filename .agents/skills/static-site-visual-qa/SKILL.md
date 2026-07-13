---
name: static-site-visual-qa
description: Visual and interaction QA workflow for the Champagne Christelle Phlipaux static HTML site. Use when changes affect layout, CSS, navigation, product cards, checkout pages, forms, imagery, mobile behavior, or any visible page state that should be checked on desktop and mobile.
---

# Static Site Visual QA

## Quick Start

Use this skill for visible changes. Start by reading `references/visual-targets.md`, then generate a target matrix:

```bash
python3 .agents/skills/static-site-visual-qa/scripts/visual_targets.py
```

When a browser tool is available, open the local site and capture at least:

- Desktop: 1440 x 1000
- Mobile: 390 x 844

For checkout or commerce changes, also check the cart/checkout state with realistic basket data when possible.

## What To Inspect

Check the actual rendered page, not only HTML/CSS:

- Header, navigation, logo scale, and current-page clarity.
- Hero crop, image sharpness, and whether the first viewport feels premium.
- Text rhythm, line length, and no cramped or oversized components.
- Product cards, price visibility, quantity controls, CTA hierarchy, and trust details.
- Forms, validation states, legal consent, and confirmation pages.
- Footer links, legal reassurance, and contact paths.
- Mobile wrapping, tap targets, sticky elements, and no incoherent overlap.

## Visual Standard

The site should feel calm, refined, credible, and human. Prefer fewer stronger elements over dense decorative UI. Avoid changes that make Champagne look like a discount ecommerce template.

## Reporting

Include the pages and viewports checked. If browser validation was not possible, say that clearly and use static checks as partial evidence only.
