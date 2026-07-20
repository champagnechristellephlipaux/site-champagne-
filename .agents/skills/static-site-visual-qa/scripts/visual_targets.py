#!/usr/bin/env python3
"""Print the recommended visual QA page and viewport matrix."""

from __future__ import annotations

import pathlib


ROOT = pathlib.Path.cwd()
VIEWPORTS = [
    ("desktop", "1440x1000"),
    ("tablet", "768x1024"),
    ("mobile", "390x844"),
    ("small-mobile", "360x740"),
]
TIERS = {
    "tier-1": [
        "index.html",
        "boutique.html",
        "checkout.html",
        "brut-tradition.html",
        "brut-rose.html",
        "demi-sec.html",
    ],
    "tier-2": [
        "cuvees.html",
        "livraison-paiement.html",
        "maison.html",
        "terroir.html",
        "avis-clients.html",
        "cadeaux.html",
    ],
}


def main() -> int:
    print("Visual QA targets")
    print("=================")
    print("Viewports:")
    for name, size in VIEWPORTS:
        print(f"- {name}: {size}")
    print()

    for tier, pages in TIERS.items():
        print(tier)
        for page in pages:
            state = "present" if (ROOT / page).exists() else "missing"
            print(f"- /{page} [{state}]")
        print()

    print("Minimum screenshot set for broad visible changes:")
    for page in TIERS["tier-1"]:
        for viewport in ["desktop", "mobile"]:
            print(f"- {page} @ {viewport}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
