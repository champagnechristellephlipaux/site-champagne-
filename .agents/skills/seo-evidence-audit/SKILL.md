---
name: seo-evidence-audit
description: Evidence-led SEO audit workflow for the Champagne Christelle Phlipaux static site. Use when changing titles, metadata, headings, canonicals, sitemap, robots, structured data, internal links, images, blog pages, product pages, or location/Champagne search intent.
---

# SEO Evidence Audit

## Quick Start

Use this skill for SEO-sensitive changes. Read `references/seo-rubric.md` before making recommendations or edits.

Run the static scanner:

```bash
python3 .agents/skills/seo-evidence-audit/scripts/scan_static_seo.py
```

Use the scanner output as evidence, then inspect the relevant page manually before editing.

## Workflow

1. Map the page intent before changing copy or metadata.
2. Check title, meta description, canonical, H1, heading hierarchy, structured data, image attributes, and internal links.
3. Preserve premium tone. Do not force keywords into headings or body text.
4. Prefer page-specific metadata over repeated generic snippets.
5. Keep JSON-LD valid and aligned with visible content.
6. Re-run `npm run test:site` or the static scanner after changes.

## Guardrails

Avoid:

- Keyword stuffing.
- Repeated titles or meta descriptions across distinct pages.
- Thin AI-sounding blocks added only for SEO.
- Local or Champagne claims not supported by the page.
- Structured data that promises unavailable reviews, offers, shipping terms, or ratings.

## Output Standard

Report evidence with page filenames and the exact class of issue. Separate confirmed issues from judgment calls.
