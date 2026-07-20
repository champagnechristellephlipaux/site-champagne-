---
name: champagne-site-guardian
description: Protect and improve the Champagne Christelle Phlipaux website. Use for design, ecommerce, copy, SEO, product, delivery, cart, checkout, PrestaShop migration, performance or conversion work on this repository.
compatibility: Intended for Codex and other Agent Skills-compatible coding agents working in this repository.
metadata:
  author: champagne-christelle-phlipaux
  version: "1.0"
---

# Champagne Site Guardian

## Activate this skill when

The task affects any customer-facing page, product information, pricing, delivery calculation, cart, checkout, SEO, analytics, depositary network, marketing copy, visual identity or PrestaShop migration.

## Required context

Before proposing or implementing changes:

1. Read `../../../product-marketing-context.md`.
2. Read the repository root `AGENTS.md`.
3. Inspect the existing implementation and tests relevant to the task.
4. Separate verified facts from assumptions.

If a requested claim, product fact or business rule is not verified, do not invent it. Use a clearly marked placeholder only when the user explicitly asks for one.

## Working method

### 1. Diagnose before redesigning

Identify:
- the user problem
- the business impact
- current behavior
- affected files and data sources
- regression risks
- the smallest robust change

Do not begin with a visual rewrite merely because the current design can be made more impressive.

### 2. Challenge generic luxury choices

Reject proposals that rely primarily on:
- black and gold as a substitute for identity
- empty prestige language
- decorative animation that slows access
- oversized hero sections with little information
- generic vineyard stock photography
- fake testimonials, awards, urgency or scarcity

Prefer real proof, human presence, practical clarity and carefully executed restraint.

### 3. Protect ecommerce facts

Treat product prices, formats, shipping thresholds and checkout totals as business-critical data.

When modifying them:
- locate the single source of truth
- avoid duplicated hard-coded values
- preserve currency precision
- test boundary quantities
- verify UI totals against calculation logic
- report any ambiguity rather than silently choosing a rule

### 4. Design for actual purchase decisions

For every page or section, identify:
- primary audience
- primary question
- primary action
- evidence required for trust
- mobile behavior

A beautiful section that does not improve understanding, trust or action should be simplified or removed.

### 5. Responsible alcohol communication

Keep content adult-oriented and product-focused.

Do not associate Champagne consumption with:
- social or professional success
- seduction or sexual performance
- physical or mental performance
- driving
- emotional recovery
- excessive or rapid consumption

Flag legal uncertainty rather than presenting legal compliance as guaranteed.

## Verification gate

Before declaring completion, run all relevant checks available in the repository. At minimum, attempt to determine whether the project provides:
- format
- lint
- typecheck
- unit tests
- build
- end-to-end or browser tests

For cart, shipping or checkout work, verify at least:
- 1, 2, 3, 4, 5 and 6 standard bottles
- mixed cuvées
- magnum handling
- free-delivery threshold messaging
- desktop header cart opening
- mobile cart interaction
- totals immediately before checkout

For visual work, inspect representative desktop and mobile widths. Check keyboard access, contrast, text overflow, image cropping and reduced-motion behavior when relevant.

Never say “fixed”, “working”, “responsive”, “accessible” or “production-ready” unless fresh evidence supports that exact statement.

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
