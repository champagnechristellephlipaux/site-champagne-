---
name: champagne-site-guardian
description: Main routing and quality-control skill for Champagne Christelle Phlipaux. Use for any design, ecommerce, copy, SEO, product, delivery, cart, checkout, performance, conversion, release review or PrestaShop migration task in this repository.
compatibility: Intended for Codex and other Agent Skills-compatible coding agents working in this repository.
metadata:
  author: champagne-christelle-phlipaux
  version: "1.1"
---

# Champagne Site Guardian

## Purpose

This is the primary project skill. It protects the House's positioning, routes work to the correct specialist skill and acts as the final verification gate.

It replaces the former `champagne-release-qa` skill. Do not recreate a separate general release skill: final validation belongs here.

## Required context

Before proposing or implementing changes:

1. Read `../../../product-marketing-context.md`.
2. Read the repository root `AGENTS.md`.
3. Inspect the current implementation, configuration and tests relevant to the task.
4. Separate verified facts from assumptions.

Never invent a price, format, shipping rule, award, certification, review, stock level, delivery promise or technical wine claim.

## Route to specialist skills

Use this guardian together with the relevant specialist skill, not instead of it:

- Accessibility, semantics, keyboard, forms or focus: `a11y-premium-ecommerce`.
- Titles, metadata, structured data, sitemap, internal linking or search intent: `seo-evidence-audit`.
- Layout, CSS, imagery, navigation, responsive behavior or rendered UI: `static-site-visual-qa`.
- Current Netlify Functions, Stripe checkout, cart calculations, consent, webhook or order storage: `netlify-stripe-commerce`.

The specialist skills are complementary. Do not activate all of them automatically when the task only concerns one domain.

## Architecture lifecycle

The repository currently contains a Netlify and Stripe commerce implementation. The `netlify-stripe-commerce` skill remains valid only while that implementation is active.

For PrestaShop migration work:

- do not apply Netlify-specific assumptions to PrestaShop;
- document which legacy behavior must be preserved;
- identify the new source of truth for products, prices, delivery and orders;
- remove the Netlify-specific skill only after the old checkout is no longer used or maintained.

## Working method

### Diagnose before redesigning

Identify:

- the user problem;
- the business impact;
- current behavior;
- affected files and data sources;
- regression risks;
- the smallest robust change.

Do not begin with a visual rewrite merely because the current design could be made more impressive.

### Protect the real brand

Reject proposals that rely primarily on:

- black and gold as a substitute for identity;
- empty prestige language;
- decorative animation that delays content;
- oversized hero sections with little information;
- generic vineyard stock photography;
- fake testimonials, awards, urgency or scarcity.

Prefer real people, real work, practical clarity, customer relationships and carefully executed restraint.

### Protect ecommerce facts

Treat product prices, formats, shipping thresholds and checkout totals as business-critical data.

When modifying them:

- locate the source of truth;
- avoid duplicated hard-coded values;
- preserve currency precision;
- test boundary quantities;
- verify UI totals against server or platform calculations;
- report ambiguity rather than silently choosing a rule.

### Design for purchase decisions

For every page or section, identify:

- primary audience;
- primary question;
- primary action;
- evidence required for trust;
- mobile behavior.

A beautiful section that does not improve understanding, trust or action should be simplified or removed.

### Communicate alcohol responsibly

Keep content adult-oriented and product-focused. Do not associate Champagne consumption with social or professional success, seduction, performance, driving, emotional recovery or excessive consumption.

Flag legal uncertainty rather than presenting legal compliance as guaranteed.

## Final verification gate

Before declaring completion:

1. Read `references/release-checklist.md` when the change affects visible UI, commerce, SEO, copy, data or deployment.
2. Run `scripts/release_snapshot.py` when useful to identify available checks and high-value pages.
3. Run all relevant repository checks that are available.
4. Use the applicable specialist scanners and browser checks.
5. Report exact evidence and residual risk.

For cart, shipping or checkout work, verify at least:

- 1, 2, 3, 4, 5 and 6 standard bottles;
- mixed cuvées;
- magnum handling;
- free-delivery threshold messaging;
- desktop header cart opening;
- mobile cart interaction;
- totals immediately before checkout.

For visible work, inspect representative desktop and mobile widths. Check keyboard access, contrast, text overflow, image cropping and reduced-motion behavior when relevant.

Never say “fixed”, “working”, “responsive”, “accessible”, “compliant” or “production-ready” unless fresh evidence supports that exact statement.

## Output format

Conclude with:

### Changes
What was implemented.

### Business rationale
How it improves understanding, trust, conversion, maintainability or risk control.

### Files
Every file changed.

### Verification
Exact commands or checks run and their results.

### Unverified items
Anything not tested or dependent on external services, credentials, legal review or production data.

### Risks and next action
The most important remaining risk and the next sensible step.
