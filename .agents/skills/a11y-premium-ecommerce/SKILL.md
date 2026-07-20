---
name: a11y-premium-ecommerce
description: Accessibility workflow for the Champagne Christelle Phlipaux premium ecommerce site. Use when changing forms, buttons, cart or checkout UI, navigation, modals, images, headings, color, focus behavior, mobile interaction, or any user-facing HTML/CSS/JS that must remain accessible and polished.
---

# A11y Premium Ecommerce

## Quick Start

Use this skill when UI or interaction changes could affect access. Read `references/a11y-rubric.md`, then run:

```bash
python3 .agents/skills/a11y-premium-ecommerce/scripts/scan_static_a11y.py
```

The script is a static smoke test, not a replacement for browser, keyboard, or screen-reader judgment.

## Workflow

1. Inspect the real component or page state affected by the change.
2. Check keyboard access: tab order, focus visibility, escape behavior, and no keyboard traps.
3. Check names and semantics: links, buttons, labels, landmarks, headings, image alt text.
4. Check ecommerce confidence: price, quantity, totals, consent, and error states must be understandable without visual guessing.
5. Check mobile: tap target size, no overlap, readable text, and reachable CTAs.
6. Validate with the static script and browser checks where possible.

## Premium Accessibility Standard

Accessibility should feel integrated, not bolted on. Prefer clear language, native controls, predictable focus, and restrained styling that still gives strong visual feedback.

## Reporting

List accessibility issues by page and user impact. Do not overstate compliance from static checks alone.
