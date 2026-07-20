#!/usr/bin/env python3
"""Static SEO smoke scanner for root HTML files."""

from __future__ import annotations

import html.parser
import json
import pathlib
import re
from collections import Counter


ROOT = pathlib.Path.cwd()
PUBLIC_DOMAIN = "https://www.champagne-christelle-phlipaux.com/"


class PageParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self._in_title = False
        self.h1 = 0
        self.headings: list[tuple[int, str]] = []
        self._heading_level: int | None = None
        self._heading_text: list[str] = []
        self.meta_description = ""
        self.canonical = ""
        self.robots = ""
        self.images: list[dict[str, str]] = []
        self.links: list[str] = []
        self.json_ld: list[str] = []
        self._json_ld_depth = 0
        self._json_ld_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {key.lower(): value or "" for key, value in attrs}
        tag = tag.lower()
        if tag == "title":
            self._in_title = True
        elif re.fullmatch(r"h[1-6]", tag):
            level = int(tag[1])
            if level == 1:
                self.h1 += 1
            self._heading_level = level
            self._heading_text = []
        elif tag == "meta" and attrs_dict.get("name", "").lower() == "description":
            self.meta_description = attrs_dict.get("content", "")
        elif tag == "meta" and attrs_dict.get("name", "").lower() == "robots":
            self.robots = attrs_dict.get("content", "")
        elif tag == "link" and attrs_dict.get("rel", "").lower() == "canonical":
            self.canonical = attrs_dict.get("href", "")
        elif tag == "img":
            self.images.append(attrs_dict)
        elif tag == "a" and attrs_dict.get("href"):
            self.links.append(attrs_dict["href"])
        elif tag == "script" and attrs_dict.get("type", "").lower() == "application/ld+json":
            self._json_ld_depth = 1
            self._json_ld_text = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self._in_title = False
        elif re.fullmatch(r"h[1-6]", tag) and self._heading_level is not None:
            text = " ".join("".join(self._heading_text).split())
            self.headings.append((self._heading_level, text))
            self._heading_level = None
        elif tag == "script" and self._json_ld_depth:
            self.json_ld.append("".join(self._json_ld_text).strip())
            self._json_ld_depth = 0

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._heading_level is not None:
            self._heading_text.append(data)
        if self._json_ld_depth:
            self._json_ld_text.append(data)


def warn(issues: list[str], condition: bool, message: str) -> None:
    if condition:
        issues.append(message)


def scan_page(path: pathlib.Path, all_pages: set[str]) -> list[str]:
    parser = PageParser()
    html = path.read_text(encoding="utf-8")
    parser.feed(html)
    issues: list[str] = []

    title = " ".join(parser.title.split())
    noindex = "noindex" in parser.robots.lower()
    warn(issues, not title, "missing <title>")
    warn(issues, bool(title and len(title) < 25), "title is probably too short")
    warn(issues, bool(title and len(title) > 70), "title is probably too long")
    warn(issues, not parser.meta_description, "missing meta description")
    warn(
        issues,
        bool(parser.meta_description and len(parser.meta_description) < 70),
        "meta description is probably too short",
    )
    warn(
        issues,
        bool(parser.meta_description and len(parser.meta_description) > 180),
        "meta description is probably too long",
    )
    warn(issues, parser.h1 != 1, f"expected exactly one H1, found {parser.h1}")
    if not noindex:
        warn(issues, not parser.canonical, "missing canonical link")
        warn(
            issues,
            bool(parser.canonical and not parser.canonical.startswith(PUBLIC_DOMAIN)),
            "canonical domain is unexpected",
        )

    for index, image in enumerate(parser.images, start=1):
        warn(issues, "width" not in image, f"image {index} missing width")
        warn(issues, "height" not in image, f"image {index} missing height")
        alt = image.get("alt")
        warn(issues, alt is None, f"image {index} missing alt attribute")
        warn(issues, bool(alt and len(alt) > 140), f"image {index} alt text is very long")

    for index, block in enumerate(parser.json_ld, start=1):
        try:
            json.loads(block)
        except json.JSONDecodeError as exc:
            issues.append(f"JSON-LD block {index} is invalid: {exc.msg}")

    for href in parser.links:
        if re.match(r"^(https?:|mailto:|tel:|javascript:|#|/)", href):
            continue
        target = href.split("#", 1)[0]
        if target and target.endswith(".html") and target not in all_pages:
            issues.append(f"internal link points to missing page: {href}")

    return issues


def main() -> int:
    pages = sorted(ROOT.glob("*.html"))
    all_pages = {page.name for page in pages}
    title_counts: Counter[str] = Counter()
    description_counts: Counter[str] = Counter()
    parsed: dict[str, PageParser] = {}

    for page in pages:
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))
        parsed[page.name] = parser
        title_counts[" ".join(parser.title.split())] += 1
        description_counts[parser.meta_description] += 1

    total_issues = 0
    for page in pages:
        issues = scan_page(page, all_pages)
        parser = parsed[page.name]
        title = " ".join(parser.title.split())
        if title and title_counts[title] > 1:
            issues.append("title is duplicated")
        if parser.meta_description and description_counts[parser.meta_description] > 1:
            issues.append("meta description is duplicated")
        if issues:
            total_issues += len(issues)
            print(page.name)
            for issue in issues:
                print(f"  - {issue}")

    if total_issues == 0:
        print(f"OK: {len(pages)} HTML pages passed static SEO smoke checks.")
    else:
        print(f"Found {total_issues} SEO smoke-check issue(s) across {len(pages)} pages.")
    return 1 if total_issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
