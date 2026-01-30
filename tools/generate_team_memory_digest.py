#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
team-memory Weekly Digest Generator
===============================================================================

Usage:
  python tools/generate_team_memory_digest.py
  python tools/generate_team_memory_digest.py --days=14  # custom period
  python tools/generate_team_memory_digest.py --output=slack  # for Slack webhook
  python tools/generate_team_memory_digest.py --save  # save to digests/

Features:
  - Scans git diff for index file changes in the last N days
  - Extracts added lines (new decisions/learnings)
  - Generates formatted digest message
  - Outputs to stdout, Slack webhook, or saves to file

===============================================================================
"""

import sys
import io
import os
import re
import json
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ===============================================================================
# Configuration
# ===============================================================================

TEAM_MEMORY_ROOT = Path(__file__).parent.parent / ".claude" / "team-memory"
DIGESTS_DIR = TEAM_MEMORY_ROOT / "digests"
DEFAULT_DAYS = 7

INDEX_FILES = [
    ".claude/team-memory/decisions/index.md",
    ".claude/team-memory/learnings/index.md",
]


# ===============================================================================
# Git Operations
# ===============================================================================

def get_git_diff_for_file(filepath: str, days: int) -> list:
    """Get added lines from git diff for a specific file"""
    since_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    try:
        # Get commits in the date range
        result = subprocess.run(
            ["git", "log", f"--since={since_date}", "--pretty=format:%H", "--", filepath],
            capture_output=True,
            text=True,
            cwd=TEAM_MEMORY_ROOT.parent.parent
        )

        if result.returncode != 0 or not result.stdout.strip():
            return []

        commits = result.stdout.strip().split("\n")
        if not commits or commits[0] == "":
            return []

        # Get diff from oldest to newest
        oldest_commit = commits[-1]

        result = subprocess.run(
            ["git", "diff", f"{oldest_commit}^..HEAD", "--", filepath],
            capture_output=True,
            text=True,
            cwd=TEAM_MEMORY_ROOT.parent.parent
        )

        if result.returncode != 0:
            return []

        # Extract added lines (starting with +, but not ++)
        added_lines = []
        for line in result.stdout.split("\n"):
            if line.startswith("+") and not line.startswith("++"):
                content = line[1:].strip()
                # Only include index entry lines
                if re.match(r"^- \d{4}-\d{2}-\d{2}:", content):
                    added_lines.append(content)

        return added_lines

    except Exception as e:
        print(f"[WARN] Git diff failed: {e}")
        return []


# ===============================================================================
# Digest Generation
# ===============================================================================

def generate_digest(days: int) -> dict:
    """Generate digest data"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    digest = {
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "decisions": [],
        "learnings": [],
        "deprecated": [],
        "action_required": [],
    }

    # Get decisions changes
    dec_lines = get_git_diff_for_file(INDEX_FILES[0], days)
    digest["decisions"] = dec_lines

    # Get learnings changes
    learn_lines = get_git_diff_for_file(INDEX_FILES[1], days)
    digest["learnings"] = learn_lines

    return digest


def format_digest_text(digest: dict) -> str:
    """Format digest as plain text"""
    lines = [
        f"[team-memory Weekly Digest] {digest['start_date']} ~ {digest['end_date']}",
        "",
    ]

    # Decisions
    lines.append(f"New Decisions (DEC) - {len(digest['decisions'])}")
    if digest["decisions"]:
        for i, entry in enumerate(digest["decisions"], 1):
            lines.append(f"  {i}) {entry}")
    else:
        lines.append("  (none)")
    lines.append("")

    # Learnings
    lines.append(f"New Learnings (LEARN) - {len(digest['learnings'])}")
    if digest["learnings"]:
        for i, entry in enumerate(digest["learnings"], 1):
            lines.append(f"  {i}) {entry}")
    else:
        lines.append("  (none)")
    lines.append("")

    # Links
    lines.append("Quick Links:")
    lines.append("  - decisions/index.md")
    lines.append("  - learnings/index.md")
    lines.append("  - context.md")

    return "\n".join(lines)


def format_digest_slack(digest: dict) -> str:
    """Format digest for Slack webhook"""
    blocks = []

    # Header
    header = f":pushpin: *[team-memory Weekly Digest]* {digest['start_date']} ~ {digest['end_date']}"
    blocks.append(header)
    blocks.append("")

    # Decisions
    dec_count = len(digest["decisions"])
    blocks.append(f":white_check_mark: *New Decisions (DEC)* - {dec_count}")
    if digest["decisions"]:
        for i, entry in enumerate(digest["decisions"][:5], 1):  # Limit to 5
            blocks.append(f"  {i}) `{entry[:80]}...`" if len(entry) > 80 else f"  {i}) `{entry}`")
        if dec_count > 5:
            blocks.append(f"  ... and {dec_count - 5} more")
    else:
        blocks.append("  (none)")
    blocks.append("")

    # Learnings
    learn_count = len(digest["learnings"])
    blocks.append(f":bulb: *New Learnings (LEARN)* - {learn_count}")
    if digest["learnings"]:
        for i, entry in enumerate(digest["learnings"][:5], 1):
            blocks.append(f"  {i}) `{entry[:80]}...`" if len(entry) > 80 else f"  {i}) `{entry}`")
        if learn_count > 5:
            blocks.append(f"  ... and {learn_count - 5} more")
    else:
        blocks.append("  (none)")
    blocks.append("")

    # Links
    blocks.append(":link: *Quick Links:* `decisions/index.md` | `learnings/index.md` | `context.md`")

    return "\n".join(blocks)


def save_digest(digest: dict, text: str):
    """Save digest to file"""
    DIGESTS_DIR.mkdir(parents=True, exist_ok=True)

    # Week number
    week_num = datetime.now().isocalendar()[1]
    year = datetime.now().year
    filename = f"{year}-W{week_num:02d}.md"
    filepath = DIGESTS_DIR / filename

    content = f"""# Weekly Digest {year}-W{week_num:02d}

> Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
> Period: {digest['start_date']} ~ {digest['end_date']}

---

{text}
"""

    filepath.write_text(content, encoding="utf-8")
    print(f"[OK] Saved digest to: {filepath}")


def send_to_slack(message: str, webhook_url: str) -> bool:
    """Send message to Slack webhook"""
    try:
        data = json.dumps({"text": message}).encode("utf-8")
        req = Request(webhook_url, data=data, headers={"Content-Type": "application/json"})
        with urlopen(req, timeout=10) as response:
            return response.status == 200
    except URLError as e:
        print(f"[ERROR] Slack webhook failed: {e}")
        return False


# ===============================================================================
# Main
# ===============================================================================

def main():
    # Parse args
    days = DEFAULT_DAYS
    output_format = "text"
    save = False

    for arg in sys.argv[1:]:
        if arg.startswith("--days="):
            days = int(arg.split("=")[1])
        elif arg == "--output=slack":
            output_format = "slack"
        elif arg == "--save":
            save = True

    print("")
    print("===============================================================")
    print("  team-memory Weekly Digest Generator")
    print(f"  Period: last {days} days")
    print("===============================================================")
    print("")

    # Generate digest
    digest = generate_digest(days)

    total_changes = len(digest["decisions"]) + len(digest["learnings"])
    print(f"[INFO] Found {total_changes} changes")
    print(f"  - Decisions: {len(digest['decisions'])}")
    print(f"  - Learnings: {len(digest['learnings'])}")
    print("")

    # Format output
    if output_format == "slack":
        text = format_digest_slack(digest)
    else:
        text = format_digest_text(digest)

    # Output
    print("--- DIGEST ---")
    print(text)
    print("--- END ---")

    # Save if requested
    if save:
        save_digest(digest, format_digest_text(digest))

    # Send to Slack if webhook URL is set
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
    if webhook_url and output_format == "slack":
        print("")
        print("[INFO] Sending to Slack...")
        if send_to_slack(text, webhook_url):
            print("[OK] Slack message sent!")
        else:
            print("[FAIL] Slack message failed")
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
