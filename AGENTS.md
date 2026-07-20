# AGENTS.md — Champagne Christelle Phlipaux

## Mission

Build and maintain the official website of Champagne Christelle Phlipaux, an independent family Champagne house based in Channes, in the Aube.

The site must make visitors want to discover and buy the wines through trust, clarity, authenticity and quality of execution. It must not imitate the visual codes or language of an impersonal luxury group.

Before any marketing, design, SEO, ecommerce or conversion task, read `.agents/product-marketing-context.md` and use `.agents/skills/champagne-site-guardian/SKILL.md` as the main project skill.

## Skill routing

Keep the project skill set deliberately small:

- `champagne-site-guardian`: main brand, business, routing and final verification skill.
- `a11y-premium-ecommerce`: accessibility, semantics, keyboard, forms and focus.
- `seo-evidence-audit`: technical and editorial SEO checks.
- `static-site-visual-qa`: rendered layout, responsive behavior and visual QA.
- `netlify-stripe-commerce`: current legacy Netlify/Stripe commerce implementation only.

Do not recreate a separate general release or completion skill. That responsibility belongs to `champagne-site-guardian`.

Do not apply `netlify-stripe-commerce` assumptions to PrestaShop. Remove that specialist only after the legacy checkout is no longer active or maintained.

## Brand hierarchy

1. Family identity and real human relationships.
2. Love of well-done work, from vineyard to bottle.
3. Simplicity, generosity and accessibility.
4. Product quality and confidence.
5. Elegance without ostentation.

Do not equate Champagne with black-and-gold luxury, excessive prestige language, castles, aristocratic clichés or artificial scarcity.

## Approved product facts

Current website prices:

- Brut 75 cl: 22.50 €
- Brut magnum: 49 €
- Brut carton of 6: 135 €
- Rosé 75 cl: 25 €
- Rosé carton of 6: 150 €
- Demi-sec: same prices as Brut
- Rosé has no active magnum or 37.5 cl format

Never invent prices, awards, certifications, stock, delivery times, reviews, vintages, grape proportions or technical wine claims.

## Approved delivery rules

- 1 standard bottle: 12 € total delivery
- 2 standard bottles: 10 € total delivery
- 3 standard bottles: 6 € total delivery
- 4–5 standard bottles: 10 € total delivery
- Magnum: 10 € per magnum, cumulative
- Free delivery from 6 standard bottles

Treat these rules as business-critical. Add or update automated tests whenever delivery logic changes. Flag ambiguous mixed-format cases instead of guessing.

## UX and conversion rules

- Mobile-first, but fully polished on desktop.
- Make the range, prices, delivery threshold and purchasing path immediately understandable.
- Reduce friction rather than adding aggressive persuasion.
- Use concrete reassurance: family House, real production, customer relationship, delivery information and depositary network.
- Product pages must answer practical objections before decorative storytelling.
- Keep calls to action visible and explicit.
- Do not hide essential information behind animation, hover or oversized editorial sections.
- Maintain the depositary network on the homepage or through a clearly accessible dedicated area.

## Design rules

- Warm, restrained, human and contemporary.
- Strong typography, deliberate spacing and clear hierarchy.
- Prefer real photography over generic stock imagery or synthetic luxury imagery.
- Motion must clarify or enhance; never delay access to content or purchasing.
- Avoid generic AI layouts, excessive gradients, glassmorphism, ornamental gold and decorative clutter.
- Accessibility and readability take priority over visual novelty.

## Copy rules

Write in natural French unless another language is requested.

Preferred tone:

- direct;
- warm;
- precise;
- sincere;
- knowledgeable without sounding elitist.

Avoid empty luxury vocabulary, unverifiable superlatives, generic wine poetry, pressure tactics and robotic SEO repetition.

## Engineering workflow

Before changing code:

1. inspect the relevant architecture and existing behavior;
2. identify affected business rules;
3. state assumptions when information is missing;
4. prefer small, reversible changes;
5. do not introduce dependencies without a clear benefit.

After changing code, run every relevant available check:

- formatting;
- lint;
- type checking when available;
- site and commerce tests;
- build when available;
- browser or end-to-end checks;
- responsive review;
- accessibility checks where applicable.

Never claim a correction is complete without fresh evidence from the checks actually run. Clearly distinguish verified results from untested assumptions.

## Mandatory checkout scenarios

For any cart, delivery or checkout change, validate:

- 1, 2, 3, 4, 5 and 6 standard bottles;
- mixed cuvées;
- magnums;
- free-delivery messaging;
- desktop cart opening from the header;
- mobile cart interaction;
- displayed totals against the active server or platform calculation;
- checkout handoff and confirmation behavior.

## Responsible alcohol communication

Keep communication adult-oriented and product-focused. Do not associate Champagne consumption with success, seduction, physical or mental performance, driving, emotional relief or excessive consumption.

Do not present legal compliance as guaranteed when legal review has not occurred.

## Completion report

Every completed task must state:

1. what changed;
2. why it improves the site or reduces risk;
3. every file touched;
4. exact validation performed and results;
5. anything unverified;
6. the main remaining risk or next action.
