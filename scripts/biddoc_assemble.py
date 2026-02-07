#!/usr/bin/env python3
"""
BidDoc Ops Center - Step 3: Document Assembly
═══════════════════════════════════════════════════════════════════════════
톤 변환된 텍스트를 9장 구조로 조립
"""

import re
from typing import Dict, Any, List
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════════════
# 9장 구조 템플릿
# ═══════════════════════════════════════════════════════════════════════════
PAGE_TEMPLATES = {
    "cover": """
## 1장. 표지

# [행사명] 연계 여행상품 운영 제안서

**제안 기관:** [회사명]

**제출일:** {date}

---
""",

    "organization": """
## 2장. 조직/역할

### 운영 조직 구성

{content}

---
""",

    "track_record": """
## 3장. 유사 실적

### 주요 운영 실적

{content}

---
""",

    "services": """
## 4장. 상품/서비스 구성

### 제공 서비스 개요

{content}

---
""",

    "partnership": """
## 5장. 협력 구조

### 협력 네트워크

{content}

---
""",

    "operations": """
## 6장. 운영 방식

### 통합 운영 체계

{content}

---
""",

    "marketing": """
## 7장. 홍보/판매/통합 운영

### 마케팅 및 판매 전략

{content}

---
""",

    "risk_management": """
## 8장. 리스크 관리

### 위험 요소 및 대응 방안

{content}

---
""",

    "admin_settlement": """
## 9장. 행정/정산

### 행정 처리 및 정산 체계

{content}

---
"""
}


def extract_section_content(text: str, keywords: List[str]) -> str:
    """
    텍스트에서 특정 키워드 관련 내용 추출

    Args:
        text: 전체 텍스트
        keywords: 검색할 키워드 리스트

    Returns:
        추출된 내용
    """
    lines = text.split('\n')
    relevant_lines = []
    in_section = False

    for line in lines:
        # 키워드가 포함된 섹션 시작
        if any(kw in line for kw in keywords):
            in_section = True
            relevant_lines.append(line)
        # 다른 섹션 시작 (숫자. 로 시작)
        elif re.match(r'^\d+\.', line.strip()) and in_section:
            in_section = False
        elif in_section:
            relevant_lines.append(line)

    return '\n'.join(relevant_lines).strip()


def assemble_document(text: str, config: Dict[str, Any]) -> str:
    """
    9장 구조로 문서 조립

    Args:
        text: 톤 변환된 텍스트
        config: assemble 설정

    Returns:
        조립된 마크다운 문서
    """
    pages = config.get('pages', [])
    today = datetime.now().strftime("%Y년 %m월 %d일")

    assembled_parts = []

    # ─────────────────────────────────────────────────────────────────────
    # 각 페이지 조립
    # ─────────────────────────────────────────────────────────────────────
    for page in pages:
        source = page.get('source', '')
        title = page.get('title', '')

        if source == 'cover':
            # 표지는 템플릿 사용
            content = PAGE_TEMPLATES['cover'].format(date=today)
            assembled_parts.append(content)

        elif source in PAGE_TEMPLATES:
            # 텍스트에서 관련 내용 추출
            keywords_map = {
                'organization': ['조직', '역할', '구성', '팀'],
                'track_record': ['실적', '경험', '수행', '지원'],
                'services': ['상품', '서비스', '프로그램', '여행'],
                'partnership': ['협력', '파트너', '네트워크', '연계'],
                'operations': ['운영', '방식', '관리', '체계'],
                'marketing': ['홍보', '판매', '마케팅', '판촉'],
                'risk_management': ['리스크', '위험', '대응', '안전'],
                'admin_settlement': ['행정', '정산', '기대', '효과'],
            }

            keywords = keywords_map.get(source, [])
            section_content = extract_section_content(text, keywords)

            if not section_content:
                section_content = f"(해당 내용은 별도 작성 필요)"

            template = PAGE_TEMPLATES.get(source, "## {title}\n\n{content}\n")
            content = template.format(content=section_content)
            assembled_parts.append(content)

        else:
            # 커스텀 페이지
            assembled_parts.append(f"## {title}\n\n(내용 작성 필요)\n\n---\n")

    # ─────────────────────────────────────────────────────────────────────
    # 문서 결합
    # ─────────────────────────────────────────────────────────────────────
    final_document = '\n'.join(assembled_parts)

    # 푸터 추가
    footer = f"""
---

**문서 정보**
- 생성일: {today}
- 버전: v1.0
- 상태: 초안

---
*본 문서는 BidDoc Ops Center에 의해 자동 생성되었습니다.*
"""
    final_document += footer

    return final_document


def gate3_check(assembled_text: str, config: Dict[str, Any]) -> Dict:
    """
    Gate3: 9장 조립 검증
    - 필수 9장 구조 완비 확인

    Returns:
        {
            "gate": "gate3_assemble",
            "passed": bool,
            "total_required": int,
            "found": int,
            "missing": list
        }
    """
    assemble_config = config.get('assemble', {})
    required_pages = assemble_config.get('pages', [])

    found_pages = []
    missing_pages = []

    # 각 페이지 존재 확인
    page_checks = []
    for page in required_pages:
        title = page.get('title', '')
        required = page.get('required', True)

        # 제목 또는 번호로 검색
        found = False
        if title in assembled_text:
            found = True
        else:
            # "2장." 같은 패턴으로도 검색
            page_num = title.split('.')[0] if '.' in title else ''
            if page_num and f"{page_num}." in assembled_text:
                found = True
            # "## N장" 형태로도 검색
            if page_num and f"## {page_num}장" in assembled_text:
                found = True

        page_checks.append({
            "title": title,
            "found": found,
            "required": required
        })

        if found:
            found_pages.append(title)
        elif required:
            missing_pages.append(title)

    passed = len(missing_pages) == 0

    return {
        "gate": "gate3_assemble",
        "passed": passed,
        "total_required": len([p for p in required_pages if p.get('required', True)]),
        "found": len(found_pages),
        "missing": missing_pages,
        "pages": page_checks
    }


# ═══════════════════════════════════════════════════════════════════════════
# 단독 실행 지원
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python biddoc_assemble.py <input_file> [output_file]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace('.txt', '_final.md')

    # 기본 9장 구조
    default_config = {
        'pages': [
            {'title': '1장. 표지', 'source': 'cover', 'required': True},
            {'title': '2장. 조직/역할', 'source': 'organization', 'required': True},
            {'title': '3장. 유사 실적', 'source': 'track_record', 'required': True},
            {'title': '4장. 상품/서비스 구성', 'source': 'services', 'required': True},
            {'title': '5장. 협력 구조', 'source': 'partnership', 'required': True},
            {'title': '6장. 운영 방식', 'source': 'operations', 'required': True},
            {'title': '7장. 홍보/판매/통합 운영', 'source': 'marketing', 'required': True},
            {'title': '8장. 리스크 관리', 'source': 'risk_management', 'required': True},
            {'title': '9장. 행정/정산', 'source': 'admin_settlement', 'required': True},
        ]
    }

    with open(input_file, 'r', encoding='utf-8') as f:
        text = f.read()

    assembled_text = assemble_document(text, default_config)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(assembled_text)

    print(f"Assembled: {output_file}")
