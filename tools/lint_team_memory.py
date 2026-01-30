#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
team-memory Lint
===============================================================================

사용법:
  python tools/lint_team_memory.py

Features:
  - index.md <-> detail file sync verification
  - Broken link detection
  - Date format validation
  - Tag consistency validation

Exit codes:
  0 - All checks passed
  1 - Validation failed (CI build failure)

===============================================================================
"""
import sys
import io

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
import re
import sys
from pathlib import Path
from collections import defaultdict

# ═══════════════════════════════════════════════════════════════════════════
# 설정
# ═══════════════════════════════════════════════════════════════════════════

TEAM_MEMORY_ROOT = Path(__file__).parent.parent / ".claude" / "team-memory"
DECISIONS_DIR = TEAM_MEMORY_ROOT / "decisions"
LEARNINGS_DIR = TEAM_MEMORY_ROOT / "learnings"

VALID_TAGS = {"Infra", "Team", "Product", "Process", "Tools", "General"}

# ═══════════════════════════════════════════════════════════════════════════
# 검증 함수
# ═══════════════════════════════════════════════════════════════════════════

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
            print("\n❌ ERRORS:")
            for e in self.errors:
                print(f"  - {e}")

        if self.warnings:
            print("\n⚠️ WARNINGS:")
            for w in self.warnings:
                print(f"  - {w}")

        if not self.errors and not self.warnings:
            print("\n✅ All checks passed!")


def extract_index_entries(index_path: Path) -> list:
    """
    index.md에서 엔트리 추출
    """
    entries = []
    if not index_path.exists():
        return entries

    content = index_path.read_text(encoding="utf-8")

    # 형식: - YYYY-MM-DD: [Tag] title (file#anchor)
    pattern = r"^- (\d{4}-\d{2}-\d{2}): \[(\w+)\] (.+) \((.+?)#(.+?)\)$"

    for line in content.split("\n"):
        match = re.match(pattern, line.strip())
        if match:
            entries.append({
                "date": match.group(1),
                "tag": match.group(2),
                "title": match.group(3),
                "file": match.group(4),
                "anchor": match.group(5),
                "raw": line.strip()
            })

    return entries


def extract_headings_from_file(filepath: Path) -> set:
    """
    마크다운 파일에서 ## 헤딩 추출 (앵커로 변환)
    """
    headings = set()
    if not filepath.exists():
        return headings

    content = filepath.read_text(encoding="utf-8")

    for line in content.split("\n"):
        if line.startswith("## "):
            heading = line[3:].strip()
            # 앵커 변환
            anchor = heading.lower()
            anchor = re.sub(r"[^가-힣a-z0-9\s-]", "", anchor)
            anchor = re.sub(r"\s+", "-", anchor)
            headings.add(anchor)

    return headings


def lint_directory(dir_path: Path, result: LintResult):
    """
    디렉토리 검증
    """
    dir_name = dir_path.name
    print(f"\n📁 Checking {dir_name}/...")

    index_path = dir_path / "index.md"
    if not index_path.exists():
        result.error(f"{dir_name}/index.md not found")
        return

    entries = extract_index_entries(index_path)
    print(f"  Found {len(entries)} entries in index.md")

    # 각 엔트리 검증
    for entry in entries:
        # 1. 날짜 형식 검증
        try:
            from datetime import datetime
            datetime.strptime(entry["date"], "%Y-%m-%d")
        except ValueError:
            result.error(f"{dir_name}/index.md: Invalid date format '{entry['date']}'")

        # 2. 태그 검증
        if entry["tag"] not in VALID_TAGS:
            result.warn(f"{dir_name}/index.md: Unknown tag '{entry['tag']}' (valid: {VALID_TAGS})")

        # 3. 파일 존재 검증
        target_file = dir_path / entry["file"]
        if not target_file.exists():
            result.error(f"{dir_name}/index.md: Referenced file '{entry['file']}' not found")
            continue

        # 4. 앵커 검증
        headings = extract_headings_from_file(target_file)
        if entry["anchor"] not in headings:
            result.error(f"{dir_name}/index.md: Broken anchor '{entry['anchor']}' in {entry['file']}")


def check_orphan_files(dir_path: Path, result: LintResult):
    """
    인덱스에 없는 고아 파일 검사
    """
    dir_name = dir_path.name
    index_path = dir_path / "index.md"

    if not index_path.exists():
        return

    entries = extract_index_entries(index_path)
    indexed_files = {e["file"] for e in entries}

    for filepath in dir_path.glob("*.md"):
        if filepath.name == "index.md":
            continue
        if filepath.name not in indexed_files:
            result.warn(f"{dir_name}/{filepath.name}: File not referenced in index.md")


def check_duplicate_entries(dir_path: Path, result: LintResult):
    """
    중복 엔트리 검사
    """
    dir_name = dir_path.name
    index_path = dir_path / "index.md"

    if not index_path.exists():
        return

    entries = extract_index_entries(index_path)
    seen = set()

    for entry in entries:
        key = f"{entry['date']}:{entry['title']}"
        if key in seen:
            result.warn(f"{dir_name}/index.md: Duplicate entry '{entry['title']}'")
        seen.add(key)


# ═══════════════════════════════════════════════════════════════════════════
# 메인
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print("")
    print("===============================================================")
    print("  team-memory Lint")
    print("===============================================================")

    if not TEAM_MEMORY_ROOT.exists():
        print("\n❌ team-memory folder not found")
        return 1

    result = LintResult()

    # decisions/ 검증
    if DECISIONS_DIR.exists():
        lint_directory(DECISIONS_DIR, result)
        check_orphan_files(DECISIONS_DIR, result)
        check_duplicate_entries(DECISIONS_DIR, result)
    else:
        result.warn("decisions/ directory not found")

    # learnings/ 검증
    if LEARNINGS_DIR.exists():
        lint_directory(LEARNINGS_DIR, result)
        check_orphan_files(LEARNINGS_DIR, result)
        check_duplicate_entries(LEARNINGS_DIR, result)
    else:
        result.warn("learnings/ directory not found")

    # 결과 출력
    result.report()

    print("")
    print("===============================================================")
    if result.has_errors():
        print("  [FAIL] Lint failed with errors")
        print("===============================================================")
        return 1
    else:
        print("  [OK] Lint passed")
        print("===============================================================")
        return 0


if __name__ == "__main__":
    sys.exit(main())
