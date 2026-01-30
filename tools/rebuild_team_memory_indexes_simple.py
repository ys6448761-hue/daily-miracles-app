#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
team-memory Index Rebuild (Simple Version)
===============================================================================

사용법:
  python tools/rebuild_team_memory_indexes_simple.py

Features:
  - Scan all .md files in decisions/, learnings/ folders
  - Auto-regenerate index.md files
  - Sort by date/tag

===============================================================================
"""

import sys
import io
import os

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# ═══════════════════════════════════════════════════════════════════════════
# 설정
# ═══════════════════════════════════════════════════════════════════════════

TEAM_MEMORY_ROOT = Path(__file__).parent.parent / ".claude" / "team-memory"
DECISIONS_DIR = TEAM_MEMORY_ROOT / "decisions"
LEARNINGS_DIR = TEAM_MEMORY_ROOT / "learnings"


# ═══════════════════════════════════════════════════════════════════════════
# 유틸리티
# ═══════════════════════════════════════════════════════════════════════════

def extract_entries_from_file(filepath: Path) -> list:
    """
    마크다운 파일에서 ## 헤딩과 메타데이터 추출
    """
    entries = []
    content = filepath.read_text(encoding="utf-8")

    # ## 헤딩 찾기
    heading_pattern = r"^## (.+)$"
    date_pattern = r"\*\*일자\*\*:\s*(\d{4}-\d{2}-\d{2})"
    tag_pattern = r"\*\*태그\*\*:\s*(\w+)"

    current_section = None
    current_date = None
    current_tag = None

    for line in content.split("\n"):
        heading_match = re.match(heading_pattern, line)
        if heading_match:
            # 이전 섹션 저장
            if current_section and current_date:
                entries.append({
                    "title": current_section,
                    "date": current_date,
                    "tag": current_tag or "General",
                    "file": filepath.name,
                    "anchor": slugify(current_section)
                })
            # 새 섹션 시작
            current_section = heading_match.group(1)
            current_date = None
            current_tag = None

        date_match = re.search(date_pattern, line)
        if date_match:
            current_date = date_match.group(1)

        tag_match = re.search(tag_pattern, line)
        if tag_match:
            current_tag = tag_match.group(1)

    # 마지막 섹션 저장
    if current_section and current_date:
        entries.append({
            "title": current_section,
            "date": current_date,
            "tag": current_tag or "General",
            "file": filepath.name,
            "anchor": slugify(current_section)
        })

    return entries


def slugify(text: str) -> str:
    """
    텍스트를 앵커 링크용 슬러그로 변환
    """
    text = text.lower()
    text = re.sub(r"[^가-힣a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    return text


def group_by_month(entries: list) -> dict:
    """
    엔트리를 월별로 그룹화
    """
    grouped = defaultdict(list)
    for entry in entries:
        month = entry["date"][:7]  # YYYY-MM
        grouped[month].append(entry)
    return dict(sorted(grouped.items(), reverse=True))


def group_by_tag(entries: list) -> dict:
    """
    엔트리를 태그별로 그룹화
    """
    grouped = defaultdict(list)
    for entry in entries:
        grouped[entry["tag"]].append(entry)
    return dict(sorted(grouped.items()))


# ═══════════════════════════════════════════════════════════════════════════
# 인덱스 생성
# ═══════════════════════════════════════════════════════════════════════════

def rebuild_decisions_index():
    """
    decisions/index.md 재구축
    """
    print("📁 Rebuilding decisions/index.md...")

    entries = []
    for filepath in DECISIONS_DIR.glob("*.md"):
        if filepath.name == "index.md":
            continue
        entries.extend(extract_entries_from_file(filepath))

    # 월별 그룹화
    grouped = group_by_month(entries)

    # 인덱스 생성
    lines = [
        "# Decisions Index",
        "",
        "> Single Source of Truth for all decisions. Each line links to the detailed record.",
        "",
        "---",
        ""
    ]

    for month, month_entries in grouped.items():
        lines.append(f"## {month}")
        lines.append("")
        for entry in sorted(month_entries, key=lambda x: x["date"], reverse=True):
            lines.append(f"- {entry['date']}: [{entry['tag']}] {entry['title']} ({entry['file']}#{entry['anchor']})")
        lines.append("")

    lines.extend([
        "---",
        "",
        "<!-- New entries go above this line -->"
    ])

    index_path = DECISIONS_DIR / "index.md"
    index_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  ✅ Written: {index_path}")
    print(f"  📊 Total entries: {len(entries)}")


def rebuild_learnings_index():
    """
    learnings/index.md 재구축
    """
    print("📁 Rebuilding learnings/index.md...")

    entries = []
    for filepath in LEARNINGS_DIR.glob("*.md"):
        if filepath.name == "index.md":
            continue
        entries.extend(extract_entries_from_file(filepath))

    # 태그별 그룹화
    grouped = group_by_tag(entries)

    # 인덱스 생성
    lines = [
        "# Learnings Index",
        "",
        "> Single Source of Truth for all learnings. Each line links to the detailed record.",
        "",
        "---",
        ""
    ]

    for tag, tag_entries in grouped.items():
        lines.append(f"## {tag}")
        lines.append("")
        for entry in sorted(tag_entries, key=lambda x: x["date"], reverse=True):
            lines.append(f"- {entry['date']}: [{entry['tag']}] {entry['title']} ({entry['file']}#{entry['anchor']})")
        lines.append("")

    lines.extend([
        "---",
        "",
        "<!-- New entries go above this line -->"
    ])

    index_path = LEARNINGS_DIR / "index.md"
    index_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  ✅ Written: {index_path}")
    print(f"  📊 Total entries: {len(entries)}")


# ═══════════════════════════════════════════════════════════════════════════
# 메인
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print("")
    print("===============================================================")
    print("  team-memory Index Rebuild")
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
    exit(main())
