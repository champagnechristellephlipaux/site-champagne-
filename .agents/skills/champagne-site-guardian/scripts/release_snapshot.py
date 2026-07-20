#!/usr/bin/env python3
"""Print a lightweight release snapshot for the Champagne site."""

from __future__ import annotations

import json
import pathlib
import subprocess


ROOT = pathlib.Path.cwd()
HIGH_VALUE = [
    "index.html",
    "boutique.html",
    "checkout.html",
    "brut-tradition.html",
    "brut-rose.html",
    "demi-sec.html",
    "cuvees.html",
    "livraison-paiement.html",
    "cgv.html",
]


def run_git_status() -> list[str]:
    try:
        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=ROOT,
            check=False,
            text=True,
            capture_output=True,
        )
    except FileNotFoundError:
        return ["git unavailable"]
    return result.stdout.splitlines() or ["clean worktree"]


def read_package_scripts() -> dict[str, str]:
    package_path = ROOT / "package.json"
    if not package_path.exists():
        return {}
    with package_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    scripts = data.get("scripts", {})
    return scripts if isinstance(scripts, dict) else {}


def main() -> int:
    html_pages = sorted(path.name for path in ROOT.glob("*.html"))
    missing_high_value = [page for page in HIGH_VALUE if not (ROOT / page).exists()]
    scripts = read_package_scripts()

    print("Release snapshot")
    print("================")
    print(f"Root: {ROOT}")
    print(f"HTML pages: {len(html_pages)}")
    print(f"High-value pages missing: {', '.join(missing_high_value) or 'none'}")
    print()

    print("Package scripts")
    for name in ["check", "lint", "test:site", "test:commerce", "build", "dev"]:
        if name in scripts:
            print(f"- npm run {name}: {scripts[name]}")
    if not scripts:
        print("- package.json scripts unavailable")
    print()

    print("Suggested validation")
    if "check" in scripts:
        print("- npm run check")
    else:
        print("- Run the relevant lint, site and commerce checks available")
    print("- python3 .agents/skills/seo-evidence-audit/scripts/scan_static_seo.py")
    print("- python3 .agents/skills/a11y-premium-ecommerce/scripts/scan_static_a11y.py")
    print("- python3 .agents/skills/static-site-visual-qa/scripts/visual_targets.py")
    print()

    print("Git status")
    for line in run_git_status():
        print(f"- {line}")

    return 1 if missing_high_value else 0


if __name__ == "__main__":
    raise SystemExit(main())
