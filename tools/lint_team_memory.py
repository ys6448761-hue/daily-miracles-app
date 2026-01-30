#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
team-memory Lint (v2 with Size Limits & Sensitive Info Detection)
===============================================================================

Usage:
  python tools/lint_team_memory.py
  python tools/lint_team_memory.py --strict  # anchor validation as error

Features:
  - Required files existence check
  - File size limits (context: 10KB, index: 15KB)
  - Index line format validation
  - Broken link/pointer detection
  - Sensitive info pattern detection (tokens, passwords)
  - Anchor validation (WARN by default, FAIL with --strict)

Exit codes:
  0 - All checks passed
  1 - Validation failed (CI build failure)

===============================================================================
"""

import sys
import io
import os
import re
from pathlib import Path
from collections import defaultdict

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ===============================================================================
# Configuration
# ===============================================================================

TEAM_MEMORY_ROOT = Path(__file__).parent.parent / ".claude" / "team-memory"
DECISIONS_DIR = TEAM_MEMORY_ROOT / "decisions"
LEARNINGS_DIR = TEAM_MEMORY_ROOT / "learnings"

# Required files
REQUIRED_FILES = [
    TEAM_MEMORY_ROOT / "context.md",
    DECISIONS_DIR / "index.md",
    LEARNINGS_DIR / "index.md",
]

# Size limits (bytes)
SIZE_LIMITS = {
    "context.md": 10 * 1024,      # 10KB
    "index.md": 15 * 1024,         # 15KB (applies to all index.md)
}

# Sensitive info patterns (FAIL if found)
SENSITIVE_PATTERNS = [
    (r"sk-[a-zA-Z0-9]{20,}", "OpenAI API key"),
    (r"sk-ant-[a-zA-Z0-9-]{20,}", "Anthropic API key"),
    (r"ghp_[a-zA-Z0-9]{36}", "GitHub token"),
    (r"gho_[a-zA-Z0-9]{36}", "GitHub OAuth token"),
    (r"glpat-[a-zA-Z0-9-]{20,}", "GitLab token"),
    (r"xox[baprs]-[a-zA-Z0-9-]{10,}", "Slack token"),
    (r"AKIA[0-9A-Z]{16}", "AWS Access Key"),
    (r"password\s*[=:]\s*['\"][^'\"]{8,}['\"]", "Password in config"),
    (r"secret\s*[=:]\s*['\"][^'\"]{8,}['\"]", "Secret in config"),
]

# Allowlist file (optional)
ALLOWLIST_FILE = TEAM_MEMORY_ROOT / ".lint_allowlist.txt"

# Valid tags
VALID_TAGS = {"Infra", "Team", "Product", "Process", "Tools", "General", "Brand", "Sora"}


# ===============================================================================
# Lint Result
# ===============================================================================

class LintResult:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def error(self, msg: str):
        self.errors.append(msg)

    def warn(self, msg: str):
        self.warnings.append(msg)

    def has_errors(self) -> bool:
        return len(self.errors) > 0

    def report(self):
        if self.errors:
            print("\n[ERRORS]")
            for e in self.errors:
                print(f"  - {e}")

        if self.warnings:
            print("\n[WARNINGS]")
            for w in self.warnings:
                print(f"  - {w}")

        if not self.errors and not self.warnings:
            print("\n[OK] All checks passed!")


# ===============================================================================
# Validation Functions
# ===============================================================================

def load_allowlist() -> set:
    """Load allowlist patterns"""
    if not ALLOWLIST_FILE.exists():
        return set()
    return set(line.strip() for line in ALLOWLIST_FILE.read_text(encoding="utf-8").splitlines() if line.strip())


def check_required_files(result: LintResult):
    """Check required files exist"""
    print("\n[CHECK] Required files...")
    for filepath in REQUIRED_FILES:
        if not filepath.exists():
            result.error(f"Required file missing: {filepath.relative_to(TEAM_MEMORY_ROOT.parent.parent)}")
        else:
            print(f"  [OK] {filepath.name}")


def check_file_sizes(result: LintResult):
    """Check file size limits"""
    print("\n[CHECK] File sizes...")

    # context.md
    context_file = TEAM_MEMORY_ROOT / "context.md"
    if context_file.exists():
        size = context_file.stat().st_size
        limit = SIZE_LIMITS["context.md"]
        if size > limit:
            result.error(f"context.md exceeds size limit: {size} bytes > {limit} bytes ({limit//1024}KB)")
        else:
            print(f"  [OK] context.md: {size} bytes (limit: {limit//1024}KB)")

    # decisions/index.md
    dec_index = DECISIONS_DIR / "index.md"
    if dec_index.exists():
        size = dec_index.stat().st_size
        limit = SIZE_LIMITS["index.md"]
        if size > limit:
            result.error(f"decisions/index.md exceeds size limit: {size} bytes > {limit} bytes ({limit//1024}KB)")
        else:
            print(f"  [OK] decisions/index.md: {size} bytes (limit: {limit//1024}KB)")

    # learnings/index.md
    learn_index = LEARNINGS_DIR / "index.md"
    if learn_index.exists():
        size = learn_index.stat().st_size
        limit = SIZE_LIMITS["index.md"]
        if size > limit:
            result.error(f"learnings/index.md exceeds size limit: {size} bytes > {limit} bytes ({limit//1024}KB)")
        else:
            print(f"  [OK] learnings/index.md: {size} bytes (limit: {limit//1024}KB)")


def check_sensitive_info(result: LintResult, allowlist: set):
    """Check for sensitive info patterns"""
    print("\n[CHECK] Sensitive info patterns...")

    found_any = False
    for filepath in TEAM_MEMORY_ROOT.rglob("*.md"):
        content = filepath.read_text(encoding="utf-8")
        rel_path = filepath.relative_to(TEAM_MEMORY_ROOT.parent.parent)

        for pattern, description in SENSITIVE_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if match in allowlist:
                    continue
                result.error(f"{rel_path}: {description} detected - '{match[:20]}...'")
                found_any = True

    if not found_any:
        print("  [OK] No sensitive info detected")


def extract_index_entries(index_path: Path) -> list:
    """Extract entries from index.md"""
    entries = []
    if not index_path.exists():
        return entries

    content = index_path.read_text(encoding="utf-8")

    # Format: - YYYY-MM-DD: [Tag] title (file#anchor)
    pattern = r"^- (\d{4}-\d{2}-\d{2}): \[(\w+)\] (.+) \((.+?)#(.+?)\)$"

    for line_num, line in enumerate(content.split("\n"), 1):
        line = line.strip()
        if not line.startswith("- "):
            continue
        if not re.match(r"^- \d{4}", line):
            continue

        match = re.match(pattern, line)
        if match:
            entries.append({
                "date": match.group(1),
                "tag": match.group(2),
                "title": match.group(3),
                "file": match.group(4),
                "anchor": match.group(5),
                "line": line_num,
                "raw": line
            })
        else:
            # Format violation
            entries.append({
                "error": "format_violation",
                "line": line_num,
                "raw": line
            })

    return entries


def extract_headings_from_file(filepath: Path) -> set:
    """Extract ## headings as anchors"""
    headings = set()
    if not filepath.exists():
        return headings

    content = filepath.read_text(encoding="utf-8")

    for line in content.split("\n"):
        if line.startswith("## "):
            heading = line[3:].strip()
            anchor = heading.lower()
            anchor = re.sub(r"[^가-힣a-z0-9\s-]", "", anchor)
            anchor = re.sub(r"\s+", "-", anchor)
            headings.add(anchor)

    return headings


def check_index_format(dir_path: Path, result: LintResult, strict: bool):
    """Check index format and links"""
    dir_name = dir_path.name
    index_path = dir_path / "index.md"

    if not index_path.exists():
        return

    print(f"\n[CHECK] {dir_name}/index.md format and links...")

    entries = extract_index_entries(index_path)
    valid_count = 0
    error_count = 0

    for entry in entries:
        if "error" in entry:
            result.error(f"{dir_name}/index.md line {entry['line']}: Invalid format - '{entry['raw'][:50]}...'")
            error_count += 1
            continue

        # Date format validation
        try:
            from datetime import datetime
            datetime.strptime(entry["date"], "%Y-%m-%d")
        except ValueError:
            result.error(f"{dir_name}/index.md line {entry['line']}: Invalid date '{entry['date']}'")
            error_count += 1
            continue

        # Tag validation
        if entry["tag"] not in VALID_TAGS:
            result.warn(f"{dir_name}/index.md line {entry['line']}: Unknown tag '{entry['tag']}'")

        # File existence validation
        target_file = dir_path / entry["file"]
        if not target_file.exists():
            result.error(f"{dir_name}/index.md line {entry['line']}: File not found '{entry['file']}'")
            error_count += 1
            continue

        # Anchor validation
        headings = extract_headings_from_file(target_file)
        if entry["anchor"] not in headings:
            msg = f"{dir_name}/index.md line {entry['line']}: Broken anchor '{entry['anchor']}' in {entry['file']}"
            if strict:
                result.error(msg)
                error_count += 1
            else:
                result.warn(msg)

        valid_count += 1

    print(f"  [INFO] Valid entries: {valid_count}, Errors: {error_count}")


def check_orphan_files(dir_path: Path, result: LintResult):
    """Check for files not referenced in index"""
    dir_name = dir_path.name
    index_path = dir_path / "index.md"

    if not index_path.exists():
        return

    entries = extract_index_entries(index_path)
    indexed_files = {e["file"] for e in entries if "file" in e}

    for filepath in dir_path.glob("*.md"):
        if filepath.name in ("index.md", "pinned.md"):
            continue
        if filepath.name not in indexed_files:
            result.warn(f"{dir_name}/{filepath.name}: Not referenced in index.md")


# ===============================================================================
# Main
# ===============================================================================

def main():
    strict = "--strict" in sys.argv

    print("")
    print("===============================================================")
    print("  team-memory Lint (v2)")
    if strict:
        print("  Mode: STRICT (anchor errors = FAIL)")
    print("===============================================================")

    if not TEAM_MEMORY_ROOT.exists():
        print("\n[ERROR] team-memory folder not found")
        return 1

    result = LintResult()
    allowlist = load_allowlist()

    # 1. Required files
    check_required_files(result)

    # 2. File sizes
    check_file_sizes(result)

    # 3. Sensitive info
    check_sensitive_info(result, allowlist)

    # 4. Index format and links
    if DECISIONS_DIR.exists():
        check_index_format(DECISIONS_DIR, result, strict)
        check_orphan_files(DECISIONS_DIR, result)

    if LEARNINGS_DIR.exists():
        check_index_format(LEARNINGS_DIR, result, strict)
        check_orphan_files(LEARNINGS_DIR, result)

    # Report
    result.report()

    print("")
    print("===============================================================")
    if result.has_errors():
        print("  [FAIL] Lint failed with errors")
        print("===============================================================")
        return 1
    else:
        print("  [PASS] Lint passed")
        print("===============================================================")
        return 0


if __name__ == "__main__":
    sys.exit(main())
