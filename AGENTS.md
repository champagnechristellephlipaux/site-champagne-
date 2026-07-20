# AGENTS.md — Champagne Christelle Phlipaux

## Mission

Build and maintain the official website of Champagne Christelle Phlipaux, a small independent family Champagne house based in Channes, in the Aube.

The site must make visitors want to discover and buy the wines through trust, clarity, authenticity and quality of execution. It must not imitate the visual codes of an impersonal luxury group.

Before any marketing, design, SEO or conversion task, read `.agents/product-marketing-context.md`.

## Brand hierarchy

1. Family identity and real human relationships
2. Love of well-done work, from vineyard to bottle
3. Simplicity, generosity and accessibility
4. Product quality and confidence
5. Elegance without ostentation

Do not equate Champagne with black-and-gold luxury, excessive prestige language, castles, aristocratic clichés or artificial scarcity.

## Product facts currently approved

- Brut 75 cl: 22.50 €
- Brut magnum: 49 €
- Brut carton of 6: 135 €
- Rosé 75 cl: 25 €
- Rosé carton of 6: 150 €
- Demi-sec: same prices as Brut
- Rosé has no active magnum or 37.5 cl format

Never invent prices, awards, certifications, stock, delivery times, reviews, vintages or technical wine claims.

## Delivery rules currently approved

- 1 bottle: 12 € total delivery
- 2 bottles: 10 € total delivery
- 3 bottles: 6 € total delivery
- 4–5 bottles: 10 € total delivery
- Magnum: 10 € per magnum, cumulative
- Free delivery from 6 standard bottles

Treat these rules as business-critical. Add or update automated tests whenever delivery logic changes.

## UX and conversion rules

- Mobile-first, but fully polished on desktop
- Make the range, prices, delivery threshold and purchasing path immediately understandable
- Reduce friction rather than adding aggressive persuasion
- Use concrete reassurance: family house, real production, customer relationship, delivery information and depositary network
- Product pages must answer practical objections before decorative storytelling
- Keep calls to action visible and explicit
- Do not hide essential information behind animation, hover or oversized editorial sections
- Maintain the depositary network on the homepage or a clearly accessible dedicated area

## Design rules

- Warm, restrained, human and contemporary
- Strong typography, deliberate spacing and clear hierarchy
- Real photography is preferred over generic stock imagery or synthetic luxury imagery
- Motion must clarify or enhance; never delay access to content or purchasing
- Avoid generic AI layouts, excessive gradients, glassmorphism, ornamental gold and decorative clutter
- Accessibility and readability take priority over visual novelty

## Copy rules

Write in natural French unless another language is requested.

Preferred tone:
- direct
- warm
- precise
- sincere
- knowledgeable without sounding elitist

Avoid:
- empty luxury vocabulary
- unverifiable superlatives
- generic wine poetry
- pressure tactics
- robotic SEO repetition

## Engineering workflow

Before changing code:
1. inspect the relevant architecture and existing behavior
2. identify business rules affected
3. state assumptions when information is missing
4. prefer small, reversible changes
5. do not introduce dependencies without a clear benefit

After changing code, run every relevant available check:
- formatting
- lint
- type checking
- unit tests
- build
- browser or end-to-end checks
- responsive review
- accessibility checks where applicable

Never claim a correction is complete without fresh evidence from the checks actually run. Clearly distinguish between verified results and untested assumptions.

## Mandatory checkout scenarios

Whenever the cart, delivery, products or checkout changes, verify at minimum:
- 1, 2, 3, 4, 5 and 6 standard bottles
- mixed cuvées
- one and multiple magnums
- mobile cart opening and closing
- desktop cart opening from the header
- free-delivery progress messaging
- totals before checkout
- address and delivery information collection

## SEO rules

- Preserve semantic headings and crawlable content
- Use unique, truthful titles and descriptions
- Improve internal linking and local discoverability
- Use structured data only when the underlying facts are visible and accurate
- Optimize images without damaging their framing or quality
- Do not generate thin location pages or repetitive keyword copy

## Completion report

Every completed task must state:
1. what changed
2. why it improves the site or business
3. files touched
4. commands and checks run, with outcomes
5. what remains unverified
6. risks or recommended next action
