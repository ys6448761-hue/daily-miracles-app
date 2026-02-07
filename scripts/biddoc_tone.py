#!/usr/bin/env python3
"""
BidDoc Ops Center - Step 2: Tone Rewrite
═══════════════════════════════════════════════════════════════════════════
익명화된 텍스트를 공적/대외용 어투로 변환
"""

import re
from typing import Dict, Any


def rewrite_tone(text: str, config: Dict[str, Any]) -> str:
    """
    톤 리라이트 수행

    Args:
        text: 익명화된 텍스트
        config: tone 설정

    Returns:
        공적 어투로 변환된 텍스트
    """
    result = text

    # ─────────────────────────────────────────────────────────────────────
    # 1. 용어 치환
    # ─────────────────────────────────────────────────────────────────────
    replacements = config.get('replacements', [])

    for r in replacements:
        from_text = r.get('from', '')
        to_text = r.get('to', '')
        if from_text and to_text:
            result = result.replace(from_text, to_text)

    # ─────────────────────────────────────────────────────────────────────
    # 2. 금지어 제거/치환
    # ─────────────────────────────────────────────────────────────────────
    forbidden_words = config.get('forbidden_words', [])

    for word in forbidden_words:
        result = result.replace(word, '')

    # ─────────────────────────────────────────────────────────────────────
    # 3. 어투 정제 (경어체 통일)
    # ─────────────────────────────────────────────────────────────────────
    # "~했습니다" → "~하였다" (공문서 어투)
    formal_replacements = [
        (r'했습니다', '하였다'),
        (r'됩니다', '된다'),
        (r'합니다', '한다'),
        (r'입니다', '이다'),
        (r'있습니다', '있다'),
        (r'없습니다', '없다'),
        (r'됐습니다', '되었다'),
        (r'왔습니다', '왔다'),
        (r'습니다\.', '다.'),
    ]

    for pattern, replacement in formal_replacements:
        result = re.sub(pattern, replacement, result)

    # ─────────────────────────────────────────────────────────────────────
    # 4. 불필요한 수식어 제거
    # ─────────────────────────────────────────────────────────────────────
    remove_modifiers = [
        '다양한 ',  # 너무 모호
        '많은 ',    # 정량화 안 됨
        '크게 ',
        '매우 ',
        '상당히 ',
    ]

    for mod in remove_modifiers:
        result = result.replace(mod, '')

    # ─────────────────────────────────────────────────────────────────────
    # 5. 중복 공백/줄바꿈 정리
    # ─────────────────────────────────────────────────────────────────────
    result = re.sub(r' +', ' ', result)
    result = re.sub(r'\n{3,}', '\n\n', result)

    return result.strip()


def gate2_check(original_text: str, toned_text: str, config: Dict[str, Any]) -> Dict:
    """
    Gate2: 톤 리라이트 검증
    - 익명 라벨 유지
    - 신규 고유명사/수치 추가 없음
    - 섹션별 문장 수 제한

    Returns:
        {
            "gate": "gate2_tone",
            "passed": bool,
            "checks": { ... }
        }
    """
    # ─────────────────────────────────────────────────────────────────────
    # 1. 익명 라벨 유지 확인
    # ─────────────────────────────────────────────────────────────────────
    labels = ['[회사명]', '[행사명]', '[발주처]', '[담당자]', '[EMAIL]', '[URL]', '[PHONE]']
    labels_in_original = [l for l in labels if l in original_text]

    labels_preserved = True
    missing_labels = []
    for label in labels_in_original:
        if label not in toned_text:
            labels_preserved = False
            missing_labels.append(label)

    # ─────────────────────────────────────────────────────────────────────
    # 2. 신규 고유명사 추가 확인
    # ─────────────────────────────────────────────────────────────────────
    # 간단한 휴리스틱: 원본에 없는 새로운 한글 고유명사 패턴 검출
    # 실제 구현에서는 NER 사용 권장
    new_identifiers = []

    # 기본 체크 패턴 (회사명, 기관명 패턴)
    identifier_patterns = [
        r'[가-힣]+센터',
        r'[가-힣]+회사',
        r'[가-힣]+기관',
        r'[가-힣]+협회',
        r'[가-힣]+박람회',
    ]

    for pattern in identifier_patterns:
        original_matches = set(re.findall(pattern, original_text))
        toned_matches = set(re.findall(pattern, toned_text))
        new_matches = toned_matches - original_matches

        # 익명 라벨 제외
        for match in new_matches:
            if not match.startswith('['):
                new_identifiers.append(match)

    no_new_identifiers = len(new_identifiers) == 0

    # ─────────────────────────────────────────────────────────────────────
    # 3. 섹션별 문장 수 확인
    # ─────────────────────────────────────────────────────────────────────
    tone_config = config.get('tone', {})
    max_sentences = tone_config.get('sentence_limit_per_section', 2)

    # 섹션 분리 (숫자. 으로 시작하는 제목 기준)
    sections = re.split(r'\n(?=\d+\.\s)', toned_text)
    sentences_ok = True
    section_details = []

    for section in sections:
        if not section.strip():
            continue

        # 문장 수 계산 (마침표, 물음표, 느낌표 기준)
        sentences = re.split(r'[.?!]+', section)
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_count = len(sentences)

        # 제목 줄 제외
        if sentence_count > 0:
            sentence_count -= 1  # 제목은 문장 수에서 제외

        if sentence_count > max_sentences:
            sentences_ok = False

        section_details.append({
            "section": section[:30] + "..." if len(section) > 30 else section,
            "sentences": sentence_count,
            "passed": sentence_count <= max_sentences
        })

    # ─────────────────────────────────────────────────────────────────────
    # 결과 종합
    # ─────────────────────────────────────────────────────────────────────
    passed = labels_preserved and no_new_identifiers and sentences_ok

    return {
        "gate": "gate2_tone",
        "passed": passed,
        "checks": {
            "labels_preserved": {
                "expected": len(labels_in_original),
                "found": len(labels_in_original) - len(missing_labels),
                "missing": missing_labels,
                "passed": labels_preserved
            },
            "new_identifiers": {
                "found": new_identifiers,
                "count": len(new_identifiers),
                "passed": no_new_identifiers
            },
            "sentence_limit": {
                "max_allowed": max_sentences,
                "sections": section_details,
                "passed": sentences_ok
            }
        }
    }


# ═══════════════════════════════════════════════════════════════════════════
# 단독 실행 지원
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python biddoc_tone.py <input_file> [output_file]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace('.txt', '_tone.txt')

    default_config = {
        'sentence_limit_per_section': 2,
        'replacements': [
            {'from': 'AI', 'to': '표준화된 운영'},
            {'from': 'Control Tower', 'to': '통합 관리 체계'},
        ],
        'forbidden_words': ['혁신적', '최첨단', '획기적']
    }

    with open(input_file, 'r', encoding='utf-8') as f:
        text = f.read()

    toned_text = rewrite_tone(text, default_config)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(toned_text)

    print(f"Toned: {output_file}")
