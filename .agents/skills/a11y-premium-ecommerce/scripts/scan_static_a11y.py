#!/usr/bin/env python3
"""Static accessibility smoke scanner for root HTML files."""

from __future__ import annotations

import html.parser
import pathlib
import re


ROOT = pathlib.Path.cwd()


class A11yParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.html_lang = ""
        self.title = ""
        self._in_title = False
        self.h1 = 0
        self.headings: list[int] = []
        self.images: list[dict[str, str]] = []
        self.buttons: list[dict[str, str | list[str]]] = []
        self.links: list[dict[str, str | list[str]]] = []
        self.inputs: list[dict[str, str]] = []
        self.labels_for: set[str] = set()
        self._label_depth = 0
        self._button_depth = 0
        self._button_text: list[str] = []
        self._current_button: dict[str, str | list[str]] | None = None
        self._link_depth = 0
        self._link_text: list[str] = []
        self._current_link: dict[str, str | list[str]] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {key.lower(): value or "" for key, value in attrs}
        tag = tag.lower()
        if tag == "html":
            self.html_lang = attrs_dict.get("lang", "")
        elif tag == "title":
            self._in_title = True
        elif re.fullmatch(r"h[1-6]", tag):
            level = int(tag[1])
            self.headings.append(level)
            if level == 1:
                self.h1 += 1
        elif tag == "img":
            self.images.append(attrs_dict)
        elif tag == "button":
            self._button_depth = 1
            self._button_text = []
            self._current_button = attrs_dict | {"text_parts": self._button_text}
        elif tag == "a" and attrs_dict.get("href") is not None:
            self._link_depth = 1
            self._link_text = []
            self._current_link = attrs_dict | {"text_parts": self._link_text}
        elif tag == "input":
            if self._label_depth:
                attrs_dict["data-nested-label"] = "true"
            self.inputs.append(attrs_dict)
        elif tag == "label" and attrs_dict.get("for"):
            self.labels_for.add(attrs_dict["for"])
        elif tag == "label":
            self._label_depth += 1

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self._in_title = False
        elif tag == "label" and self._label_depth:
            self._label_depth -= 1
        elif tag == "button" and self._current_button is not None:
            self.buttons.append(self._current_button)
            self._button_depth = 0
            self._current_button = None
        elif tag == "a" and self._current_link is not None:
            self.links.append(self._current_link)
            self._link_depth = 0
            self._current_link = None

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._button_depth:
            self._button_text.append(data)
        if self._link_depth:
            self._link_text.append(data)


def text_from(parts: object) -> str:
    if not isinstance(parts, list):
        return ""
    return " ".join("".join(str(part) for part in parts).split())


def accessible_name(attrs: dict[str, str | list[str]]) -> str:
    return (
        str(attrs.get("aria-label", "")).strip()
        or str(attrs.get("title", "")).strip()
        or text_from(attrs.get("text_parts"))
    )


def scan(path: pathlib.Path) -> list[str]:
    parser = A11yParser()
    parser.feed(path.read_text(encoding="utf-8"))
    issues: list[str] = []

    if not parser.html_lang:
        issues.append("html element missing lang")
    if not " ".join(parser.title.split()):
        issues.append("missing document title")
    if parser.h1 != 1:
        issues.append(f"expected exactly one H1, found {parser.h1}")

    previous = 0
    for level in parser.headings:
        if previous and level > previous + 1:
            issues.append(f"heading jumps from H{previous} to H{level}")
        previous = level

    for index, image in enumerate(parser.images, start=1):
        if "alt" not in image:
            issues.append(f"image {index} missing alt attribute")

    for index, button in enumerate(parser.buttons, start=1):
        if not accessible_name(button):
            issues.append(f"button {index} has no accessible name")

    for index, link in enumerate(parser.links, start=1):
        href = str(link.get("href", ""))
        if href.startswith("#"):
            continue
        if not accessible_name(link):
            issues.append(f"link {index} has no accessible name")

    for index, input_attrs in enumerate(parser.inputs, start=1):
        input_type = input_attrs.get("type", "text").lower()
        if input_type in {"hidden", "submit", "button", "reset"}:
            continue
        has_name = bool(
            input_attrs.get("aria-label")
            or input_attrs.get("aria-labelledby")
            or input_attrs.get("data-nested-label")
            or (input_attrs.get("id") and input_attrs["id"] in parser.labels_for)
        )
        if not has_name:
            issues.append(f"input {index} has no label or accessible name")

    return issues


def main() -> int:
    pages = sorted(ROOT.glob("*.html"))
    total = 0
    for page in pages:
        issues = scan(page)
        if issues:
            total += len(issues)
            print(page.name)
            for issue in issues:
                print(f"  - {issue}")
    if total == 0:
        print(f"OK: {len(pages)} HTML pages passed static accessibility smoke checks.")
    else:
        print(f"Found {total} accessibility smoke-check issue(s) across {len(pages)} pages.")
    return 1 if total else 0


if __name__ == "__main__":
    raise SystemExit(main())
