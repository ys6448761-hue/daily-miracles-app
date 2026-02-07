# GATE: BidDoc Compliance

**문서 ID:** GATE-BIDDOC-001
**버전:** 1.0
**최종 수정:** 2026-02-07

---

## 개요

본 문서는 BidDoc Ops Center의 Quality Gate 규격을 정의한다.
모든 Gate는 **Fail Fast** 정책을 따르며, 실패 시 파이프라인이 즉시 중단된다.

---

## Gate 매트릭스

| Gate | 검증 시점 | 검증 대상 | 실패 시 동작 |
|------|----------|----------|-------------|
| Gate1 | Step1 완료 후 | 익명화 결과 | Fail Fast |
| Gate2 | Step2 완료 후 | 톤 변환 결과 | Fail Fast |
| Gate3 | Step3 완료 후 | 9장 조립 결과 | Fail Fast |

---

## Gate1: 익명화 검증 (Anonymization Compliance)

### 목적

원본 문서에서 모든 식별 가능 정보(PII)가 마스킹되었는지 확인한다.

### 검증 항목

| 항목 | 타입 | 기준 | 마스킹 라벨 |
|------|------|------|------------|
| 회사명 | 필수 | 0건 잔여 | `[회사명]` |
| 행사명 | 필수 | 0건 잔여 | `[행사명]` |
| 발주처 | 필수 | 0건 잔여 | `[발주처]` |
| 담당자 | 선택 | 0건 잔여 | `[담당자]` |
| 이메일 | 필수 | 0건 잔여 | `[EMAIL]` |
| URL | 필수 | 0건 잔여 | `[URL]` |
| 전화번호 | 필수 | 0건 잔여 | `[PHONE]` |

### 검증 로직

```python
def gate1_check(text, config):
    patterns = ['여수여행센터', '여수세계섬박람회', '@', 'http', 'www.', '010-']
    remaining = [p for p in patterns if p in text]
    return {
        'passed': len(remaining) == 0,
        'remaining': remaining
    }
```

### 출력 스키마

```json
{
  "gate": "gate1_anonymize",
  "passed": true,
  "remaining": [],
  "count": 0,
  "timestamp": "2026-02-07T10:00:00Z"
}
```

### 실패 예시

```
[FAIL] Gate1: 식별 요소 잔여
- 여수여행센터 (line 3)
- 010-1234-5678 (line 15)

파이프라인 중단됨.
config.yml의 custom_patterns 확인 후 재실행하세요.
```

---

## Gate2: 톤 리라이트 검증 (Tone Compliance)

### 목적

공적 어투로 변환된 문서가 요구사항을 충족하는지 확인한다.

### 검증 항목

| 항목 | 기준 | 허용 범위 |
|------|------|----------|
| 익명 라벨 유지 | 원본과 동일 | 100% |
| 신규 고유명사 추가 | 0건 | 0 |
| 신규 수치 추가 | 0건 | 0 |
| 섹션별 문장 수 | 1~2문장 | 최대 2 |

### 검증 로직

```python
def gate2_check(original, toned, config):
    # 1. 라벨 유지 확인
    labels = ['[회사명]', '[행사명]']
    labels_preserved = all(l in toned for l in labels if l in original)

    # 2. 신규 고유명사 확인
    new_identifiers = detect_new_identifiers(original, toned)

    # 3. 문장 수 확인
    sentences_ok = check_sentence_limit(toned, max=2)

    return {
        'passed': labels_preserved and len(new_identifiers) == 0 and sentences_ok
    }
```

### 출력 스키마

```json
{
  "gate": "gate2_tone",
  "passed": true,
  "checks": {
    "labels_preserved": { "passed": true },
    "new_identifiers": { "count": 0, "passed": true },
    "sentence_limit": { "max_found": 2, "passed": true }
  }
}
```

---

## Gate3: 9장 조립 검증 (Structure Compliance)

### 목적

최종 문서가 입찰 요구 구조(9장)를 모두 포함하는지 확인한다.

### 필수 9장 구조

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
def gate3_check(assembled, config):
    required = ['1장', '2장', '3장', '4장', '5장', '6장', '7장', '8장', '9장']
    found = [p for p in required if p in assembled]
    missing = [p for p in required if p not in assembled]

    return {
        'passed': len(missing) == 0,
        'found': len(found),
        'missing': missing
    }
```

### 출력 스키마

```json
{
  "gate": "gate3_assemble",
  "passed": true,
  "total_required": 9,
  "found": 9,
  "missing": []
}
```

---

## 통합 리포트 형식

파이프라인 완료 시 `gate_results.json` 생성:

```json
{
  "run_id": "20260207-1030",
  "overall_passed": true,
  "gates": [
    {
      "gate": "gate1_anonymize",
      "passed": true,
      "duration_ms": 1250
    },
    {
      "gate": "gate2_tone",
      "passed": true,
      "duration_ms": 890
    },
    {
      "gate": "gate3_assemble",
      "passed": true,
      "duration_ms": 450
    }
  ],
  "total_duration_ms": 2590,
  "completed_at": "2026-02-07T10:35:00Z"
}
```

---

## Fail Fast 정책

### 원칙

1. 모든 Gate는 실패 시 즉시 파이프라인 중단
2. 부분 실행 불가 (All or Nothing)
3. 실패 원인 상세 로깅 필수

### 실패 시 출력

```
═══════════════════════════════════════════════════════
 [FAIL] 파이프라인 실패
═══════════════════════════════════════════════════════

 실패 Gate: gate1_anonymize
 원인: 식별 요소 잔여 2건

 상세:
 - 여수여행센터 (line 3)
 - 010-1234-5678 (line 15)

 조치:
 1. config.yml의 custom_patterns 확인
 2. 누락된 패턴 추가
 3. 파이프라인 재실행

═══════════════════════════════════════════════════════
```

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-07 | 초안 작성 |

---

*본 문서는 BidDoc Ops Center v1 Quality Gate 규격입니다.*
