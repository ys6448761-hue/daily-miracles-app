#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
team-memory Index Rebuild (v2 with Pinned Support)
===============================================================================

Usage:
  python tools/rebuild_team_memory_indexes_simple.py

Features:
  - Scan all .md files in decisions/, learnings/ folders
  - Support pinned.md for always-top entries (max 20)
  - Recent entries limited to 30
  - Auto-regenerate index.md files
  - Sort by date/tag

Policy:
  - Pinned: max 20 entries (from pinned.md)
  - Recent: max 30 entries (from other files)
  - Total index: pinned + recent

===============================================================================
"""

import sys
import io
import os
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ===============================================================================
# Configuration
# ===============================================================================

TEAM_MEMORY_ROOT = Path(__file__).parent.parent / ".claude" / "team-memory"
DECISIONS_DIR = TEAM_MEMORY_ROOT / "decisions"
LEARNINGS_DIR = TEAM_MEMORY_ROOT / "learnings"

MAX_PINNED = 20
MAX_RECENT = 30


# ===============================================================================
# Utilities
# ===============================================================================

def extract_entries_from_file(filepath: Path, is_pinned: bool = False) -> list:
    """
    Extract ## headings and metadata from markdown file
    """
    entries = []
    content = filepath.read_text(encoding="utf-8")

    heading_pattern = r"^## (.+)$"
    date_pattern = r"\*\*일자\*\*:\s*(\d{4}-\d{2}-\d{2})"
    tag_pattern = r"\*\*태그\*\*:\s*(\w+)"

    current_section = None
    current_date = None
    current_tag = None

    for line in content.split("\n"):
        heading_match = re.match(heading_pattern, line)
        if heading_match:
            if current_section and current_date:
                entries.append({
                    "title": current_section,
                    "date": current_date,
                    "tag": current_tag or "General",
                    "file": filepath.name,
                    "anchor": slugify(current_section),
                    "pinned": is_pinned
                })
            current_section = heading_match.group(1)
            current_date = None
            current_tag = None

        date_match = re.search(date_pattern, line)
        if date_match:
            current_date = date_match.group(1)

        tag_match = re.search(tag_pattern, line)
        if tag_match:
            current_tag = tag_match.group(1)

    if current_section and current_date:
        entries.append({
            "title": current_section,
            "date": current_date,
            "tag": current_tag or "General",
            "file": filepath.name,
            "anchor": slugify(current_section),
            "pinned": is_pinned
        })

    return entries


def slugify(text: str) -> str:
    """
    Convert text to anchor-friendly slug
    """
    text = text.lower()
    text = re.sub(r"[^가-힣a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    return text


# ===============================================================================
# Index Generation
# ===============================================================================

def rebuild_decisions_index():
    """
    Rebuild decisions/index.md with pinned + recent policy
    """
    print("[INFO] Rebuilding decisions/index.md...")

    pinned_entries = []
    recent_entries = []

    for filepath in DECISIONS_DIR.glob("*.md"):
        if filepath.name == "index.md":
            continue
        is_pinned = filepath.name == "pinned.md"
        entries = extract_entries_from_file(filepath, is_pinned)

        if is_pinned:
            pinned_entries.extend(entries)
        else:
            recent_entries.extend(entries)

    # Sort and limit
    pinned_entries = sorted(pinned_entries, key=lambda x: x["date"], reverse=True)[:MAX_PINNED]
    recent_entries = sorted(recent_entries, key=lambda x: x["date"], reverse=True)[:MAX_RECENT]

    # Generate index
    lines = [
        "# Decisions Index",
        "",
        "> Single Source of Truth for all decisions.",
        "> Pinned (max 20) + Recent (max 30)",
        "",
        "---",
        ""
    ]

    if pinned_entries:
        lines.append("## Pinned")
        lines.append("")
        for entry in pinned_entries:
            lines.append(f"- {entry['date']}: [{entry['tag']}] {entry['title']} ({entry['file']}#{entry['anchor']})")
        lines.append("")

    if recent_entries:
        # Group by month
        by_month = defaultdict(list)
        for entry in recent_entries:
            month = entry["date"][:7]
            by_month[month].append(entry)

        for month in sorted(by_month.keys(), reverse=True):
            lines.append(f"## {month}")
            lines.append("")
            for entry in sorted(by_month[month], key=lambda x: x["date"], reverse=True):
                lines.append(f"- {entry['date']}: [{entry['tag']}] {entry['title']} ({entry['file']}#{entry['anchor']})")
            lines.append("")

    lines.extend([
        "---",
        "",
        "<!-- New entries go above this line -->"
    ])

    index_path = DECISIONS_DIR / "index.md"
    index_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  [OK] Written: {index_path}")
    print(f"  [INFO] Pinned: {len(pinned_entries)}, Recent: {len(recent_entries)}")


def rebuild_learnings_index():
    """
    Rebuild learnings/index.md with pinned + recent policy
    """
    print("[INFO] Rebuilding learnings/index.md...")

    pinned_entries = []
    recent_entries = []

    for filepath in LEARNINGS_DIR.glob("*.md"):
        if filepath.name == "index.md":
            continue
        is_pinned = filepath.name == "pinned.md"
        entries = extract_entries_from_file(filepath, is_pinned)

        if is_pinned:
            pinned_entries.extend(entries)
        else:
            recent_entries.extend(entries)

    # Sort and limit
    pinned_entries = sorted(pinned_entries, key=lambda x: x["date"], reverse=True)[:MAX_PINNED]
    recent_entries = sorted(recent_entries, key=lambda x: x["date"], reverse=True)[:MAX_RECENT]

    # Generate index
    lines = [
        "# Learnings Index",
        "",
        "> Single Source of Truth for all learnings.",
        "> Pinned (max 20) + Recent (max 30)",
        "",
        "---",
        ""
    ]

    if pinned_entries:
        lines.append("## Pinned")
        lines.append("")
        for entry in pinned_entries:
            lines.append(f"- {entry['date']}: [{entry['tag']}] {entry['title']} ({entry['file']}#{entry['anchor']})")
        lines.append("")

    if recent_entries:
        # Group by tag
        by_tag = defaultdict(list)
        for entry in recent_entries:
            by_tag[entry["tag"]].append(entry)

        for tag in sorted(by_tag.keys()):
            lines.append(f"## {tag}")
            lines.append("")
            for entry in sorted(by_tag[tag], key=lambda x: x["date"], reverse=True):
                lines.append(f"- {entry['date']}: [{entry['tag']}] {entry['title']} ({entry['file']}#{entry['anchor']})")
            lines.append("")

    lines.extend([
        "---",
        "",
        "<!-- New entries go above this line -->"
    ])

    index_path = LEARNINGS_DIR / "index.md"
    index_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  [OK] Written: {index_path}")
    print(f"  [INFO] Pinned: {len(pinned_entries)}, Recent: {len(recent_entries)}")


# ===============================================================================
# Main
# ===============================================================================

def main():
    print("")
    print("===============================================================")
    print("  team-memory Index Rebuild (v2)")
    print("===============================================================")
    print("")

    if not TEAM_MEMORY_ROOT.exists():
        print("[ERROR] team-memory folder not found.")
        return 1

    rebuild_decisions_index()
    print("")
    rebuild_learnings_index()

    print("")
    print("===============================================================")
    print("  [OK] Index rebuild completed!")
    print("===============================================================")
    print("")

    return 0


if __name__ == "__main__":
    sys.exit(main())
