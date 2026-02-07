#!/usr/bin/env python3
"""
BidDoc Ops Center - Step 1: Anonymization
═══════════════════════════════════════════════════════════════════════════
텍스트에서 식별 가능 정보(PII)를 마스킹
"""

import re
from typing import Tuple, Dict, List, Any


def anonymize_text(text: str, config: Dict[str, Any]) -> Tuple[str, Dict]:
    """
    텍스트 익명화 수행

    Args:
        text: 원본 텍스트
        config: anonymize 설정

    Returns:
        (익명화된 텍스트, QA 리포트)
    """
    result = text
    report = {
        "base_pii": [],
        "korean_pii": [],
        "total_masked": 0
    }

    # ─────────────────────────────────────────────────────────────────────
    # 1. 기본 PII 패턴 (영문 기반)
    # ─────────────────────────────────────────────────────────────────────
    base_patterns = {
        "email": (r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}', '[EMAIL]'),
        "url_https": (r'https?://[^\s]+', '[URL]'),
        "url_www": (r'www\.[^\s]+', '[URL]'),
        "phone_kr": (r'0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}', '[PHONE]'),
        "phone_mobile": (r'\d{3}[-.\s]?\d{4}[-.\s]?\d{4}', '[PHONE]'),
    }

    pii_types = config.get('types', ['email', 'phone', 'url'])

    for pii_type, (pattern, label) in base_patterns.items():
        # 타입 필터링
        type_match = any(t in pii_type for t in pii_types)
        if not type_match and pii_type not in ['url_https', 'url_www', 'phone_kr', 'phone_mobile']:
            continue

        for match in re.finditer(pattern, result, re.IGNORECASE):
            report['base_pii'].append({
                "type": pii_type,
                "original": match.group(),
                "masked": label,
                "position": (match.start(), match.end())
            })
        result = re.sub(pattern, label, result, flags=re.IGNORECASE)

    # ─────────────────────────────────────────────────────────────────────
    # 2. 커스텀 한국어 패턴
    # ─────────────────────────────────────────────────────────────────────
    custom_patterns = config.get('custom_patterns', [])

    for pattern_def in custom_patterns:
        pattern = pattern_def.get('pattern', '')
        label = pattern_def.get('label', '[REDACTED]')
        name = pattern_def.get('name', 'custom')

        if not pattern:
            continue

        try:
            for match in re.finditer(pattern, result):
                report['korean_pii'].append({
                    "type": f"korean_{name}",
                    "original": match.group(),
                    "masked": label
                })
            result = re.sub(pattern, label, result)
        except re.error as e:
            print(f"  [WARN] 잘못된 정규식 패턴 '{name}': {e}")

    # 총 마스킹 수
    report['total_masked'] = len(report['base_pii']) + len(report['korean_pii'])

    return result, report


def gate1_check(text: str, config: Dict[str, Any]) -> Dict:
    """
    Gate1: 익명화 검증
    - 모든 식별 요소가 마스킹되었는지 확인

    Returns:
        {
            "gate": "gate1_anonymize",
            "passed": bool,
            "remaining": list,
            "count": int
        }
    """
    gate_config = config.get('gates', {}).get('gate1_anonymize', {})
    check_patterns = gate_config.get('check_patterns', [
        '여수여행센터', '여수세계섬박람회',
        '@', 'http', 'www.', '010-', '02-'
    ])

    remaining = []

    for pattern in check_patterns:
        if pattern in text:
            # 라벨 내부의 패턴은 제외
            # 예: [EMAIL]에는 @가 없음
            if pattern == '@' and '[EMAIL]' not in text:
                remaining.append(pattern)
            elif pattern in ['http', 'www.'] and '[URL]' not in text:
                remaining.append(pattern)
            elif pattern not in ['@', 'http', 'www.', '010-', '02-']:
                remaining.append(pattern)
            elif pattern in ['010-', '02-'] and '[PHONE]' not in text:
                remaining.append(pattern)

    # 정규식 기반 추가 검증
    custom_patterns = config.get('anonymize', {}).get('custom_patterns', [])
    for pattern_def in custom_patterns:
        pattern = pattern_def.get('pattern', '')
        if pattern and re.search(pattern, text):
            remaining.append(f"pattern:{pattern_def.get('name', 'unknown')}")

    return {
        "gate": "gate1_anonymize",
        "passed": len(remaining) == 0,
        "remaining": remaining,
        "count": len(remaining),
        "checks": {
            "patterns_checked": len(check_patterns),
            "patterns_found": len(remaining)
        }
    }


# ═══════════════════════════════════════════════════════════════════════════
# 단독 실행 지원
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python biddoc_anonymize.py <input_file> [output_file]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace('.txt', '_anon.txt')

    # 기본 설정
    default_config = {
        'types': ['email', 'phone', 'url'],
        'custom_patterns': [
            {'name': 'company_name', 'pattern': '(여수여행센터|여수관광센터)', 'label': '[회사명]'},
            {'name': 'event_name', 'pattern': '(여수세계섬박람회|세계섬박람회)', 'label': '[행사명]'},
        ]
    }

    with open(input_file, 'r', encoding='utf-8') as f:
        text = f.read()

    anon_text, report = anonymize_text(text, default_config)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(anon_text)

    print(f"Anonymized: {output_file}")
    print(f"Total masked: {report['total_masked']}")
