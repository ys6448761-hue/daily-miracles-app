# BidDoc Quality Gates 규격

## Gate 개요

| Gate | 검증 시점 | 실패 시 동작 |
|------|----------|-------------|
| Gate1 | 익명화 완료 후 | Fail Fast, 파이프라인 중단 |
| Gate2 | 톤 리라이트 완료 후 | Fail Fast, 파이프라인 중단 |
| Gate3 | 9장 조립 완료 후 | Fail Fast, 파이프라인 중단 |

---

## Gate1: 익명화 검증

### 목적
원본 문서에서 모든 식별 가능 정보가 마스킹되었는지 확인

### 검증 항목

| 항목 | 조건 | 판정 |
|------|------|------|
| 회사명 잔여 | 0건 | PASS/FAIL |
| 행사명 잔여 | 0건 | PASS/FAIL |
| 이메일 잔여 | 0건 | PASS/FAIL |
| URL 잔여 | 0건 | PASS/FAIL |
| 전화번호 잔여 | 0건 | PASS/FAIL |
| 주소 잔여 | 0건 | PASS/FAIL |

### 검증 로직

```python
def gate1_check(text, config):
    check_patterns = config['gates']['gate1_anonymize']['check_patterns']
    remaining = []

    for pattern in check_patterns:
        if pattern in text:
            remaining.append(pattern)

    return {
        'passed': len(remaining) == 0,
        'remaining': remaining,
        'count': len(remaining)
    }
```

### 출력 형식

```json
{
  "gate": "gate1_anonymize",
  "passed": true,
  "checks": {
    "company_name": { "found": 0, "passed": true },
    "event_name": { "found": 0, "passed": true },
    "email": { "found": 0, "passed": true },
    "url": { "found": 0, "passed": true },
    "phone": { "found": 0, "passed": true }
  },
  "timestamp": "2026-02-07T10:30:00Z"
}
```

---

## Gate2: 톤 리라이트 검증

### 목적
공적 어투로 변환된 문서가 요구사항을 충족하는지 확인

### 검증 항목

| 항목 | 조건 | 판정 |
|------|------|------|
| 익명 라벨 유지 | [회사명], [행사명] 등 존재 | PASS/FAIL |
| 신규 고유명사 추가 | 0건 | PASS/FAIL |
| 신규 수치 추가 | 0건 | PASS/FAIL |
| 섹션별 문장 수 | 1~2문장 | PASS/FAIL |

### 검증 로직

```python
def gate2_check(original_text, toned_text, config):
    # 1. 익명 라벨 유지 확인
    labels = ['[회사명]', '[행사명]', '[발주처]', '[담당자]']
    labels_in_original = [l for l in labels if l in original_text]
    labels_in_toned = [l for l in labels if l in toned_text]
    labels_preserved = set(labels_in_original) <= set(labels_in_toned)

    # 2. 신규 고유명사/수치 확인
    # (구현: NER 또는 패턴 매칭)

    # 3. 섹션별 문장 수 확인
    max_sentences = config['tone']['sentence_limit_per_section']
    # ...

    return {
        'passed': labels_preserved and no_new_identifiers and sentences_ok,
        'details': { ... }
    }
```

### 출력 형식

```json
{
  "gate": "gate2_tone",
  "passed": true,
  "checks": {
    "labels_preserved": { "expected": 2, "found": 2, "passed": true },
    "new_identifiers": { "found": 0, "passed": true },
    "sentence_limit": { "max_allowed": 2, "max_found": 2, "passed": true }
  },
  "timestamp": "2026-02-07T10:31:00Z"
}
```

---

## Gate3: 9장 조립 검증

### 목적
최종 문서가 입찰 요구 구조(9장)를 모두 포함하는지 확인

### 검증 항목

| 장 | 제목 | 필수 여부 |
|----|------|----------|
| 1장 | 표지 | 필수 |
| 2장 | 조직/역할 | 필수 |
| 3장 | 유사 실적 | 필수 |
| 4장 | 상품/서비스 구성 | 필수 |
| 5장 | 협력 구조 | 필수 |
| 6장 | 운영 방식 | 필수 |
| 7장 | 홍보/판매/통합 운영 | 필수 |
| 8장 | 리스크 관리 | 필수 |
| 9장 | 행정/정산 | 필수 |

### 검증 로직

```python
def gate3_check(assembled_text, config):
    required_pages = config['assemble']['pages']
    found_pages = []
    missing_pages = []

    for page in required_pages:
        if page['title'] in assembled_text:
            found_pages.append(page['title'])
        elif page['required']:
            missing_pages.append(page['title'])

    return {
        'passed': len(missing_pages) == 0,
        'total_required': len(required_pages),
        'found': len(found_pages),
        'missing': missing_pages
    }
```

### 출력 형식

```json
{
  "gate": "gate3_assemble",
  "passed": true,
  "checks": {
    "total_required": 9,
    "found": 9,
    "missing": [],
    "pages": [
      { "title": "1장. 표지", "found": true },
      { "title": "2장. 조직/역할", "found": true },
      ...
    ]
  },
  "timestamp": "2026-02-07T10:32:00Z"
}
```

---

## Fail Fast 정책

모든 Gate는 **Fail Fast** 정책을 따릅니다:

1. Gate 실패 시 즉시 파이프라인 중단
2. 실패 원인 상세 로그 기록
3. 수정 후 재실행 필요

```
[Gate1 FAIL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
식별 요소 잔여: 2건
- "여수여행센터" (line 3)
- "010-1234-5678" (line 15)

파이프라인 중단됨.
config.yml의 custom_patterns 확인 후 재실행하세요.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Gate 결과 통합 리포트

파이프라인 완료 시 `reports/gate_results.json` 생성:

```json
{
  "run_id": "20260207-1030",
  "overall_passed": true,
  "gates": [
    { "gate": "gate1_anonymize", "passed": true, "duration_ms": 1250 },
    { "gate": "gate2_tone", "passed": true, "duration_ms": 890 },
    { "gate": "gate3_assemble", "passed": true, "duration_ms": 450 }
  ],
  "completed_at": "2026-02-07T10:35:00Z"
}
```
