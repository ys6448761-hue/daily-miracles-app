# Lumi OS Phase 1 — Operations Data Structure

---

**목적:** Project Phoenix의 100명 파일럿 운영 데이터를 체계적으로 축적하기
위한 구조. **기능 개발이 아니다** — 운영 기록 체계만 준비한다.
**관련 문서:** `docs/constitution/candidate/CAND-OS-001_Lumi_OS_v2_Phase1_Operating_Roadmap.md`
**Status:** 구조·템플릿만 준비됨 (2026-07-16, Phase 1.1에서 Observation/
Evidence 템플릿에 Confidence·Type·Frequency·Validation Status 등 품질
필드 추가, Phase 1.2에서 `highlight/` 단계 신설). 실제 운영 데이터는
아직 입력되지 않았다.
**거버넌스:** 새로운 거버넌스를 만들지 않는다 — 기존
`docs/constitution/CONSTITUTION_GOVERNANCE.md`(Research → Candidate →
Constitution)를 그대로 따른다. 이 폴더는 그 lifecycle의 "Research" 단계
바로 앞에서 운영 근거(Evidence)를 쌓는 준비 단계다.

---

## 운영 흐름

```
Conversation
  ↓
Highlight
  ↓
Observation
  ↓
Evidence
  ↓
Candidate
  ↓
Review
  ↓
Constitution / SSOT
```

Highlight는 Observation 이전의 운영 메모다 — 분석하지 않고 한두 문장만
남긴다. Observation은 Highlight가 충분히 축적된 이후에만 작성하며,
Conversation을 직접 요약하지 않는다.

자동화는 충분한 운영 경험 이후에 진행한다. 이번 단계는 기록 체계만
준비하며, Runtime/Constitution/Lumi OS 구조/새 Engine을 수정하지 않는다.

## 폴더 구조

```
docs/lumi/operations/
├── README.md            ← 이 문서
├── conversation-log/     ← 원본 대화 보관 (최소한만)
├── highlight/            ← 운영 메모 (Highlight Template)
├── observations/         ← 운영 관찰 기록 (Observation Template)
├── evidence/             ← Observation을 묶는 운영 근거 (Evidence Template)
├── weekly-review/        ← 주간 리뷰 (Weekly Review Template)
└── candidate/            ← 운영에서 검증된 내용만 이동
```

## 각 폴더의 역할

### `conversation-log/`

원본 대화 보관 영역.

- 가능한 한 최소한으로 보관한다.
- 장기 자산으로 사용하지 않는다.
- 필요 시 Observation의 근거로만 참조한다.

### `highlight/`

Observation 이전의 운영 메모. 한두 문장으로만 기록하고 분석하지 않는다.
아래 기준 중 하나 이상이면 Highlight를 만든다 — 그 외에는 Conversation
에서 종료한다.

- 반복될 가능성이 보인다
- 예상과 다른 사용자 반응이 있었다
- 응답 방식이 매우 효과적이었다
- 운영 정책에 영향을 줄 가능성이 있다
- 다시 검토할 가치가 있다

템플릿: `highlight/TEMPLATE_Highlight.md`.

### `observations/`

운영 중 발견한 **사실**을 기록한다. Observation은 "대화 요약"이 아니라
운영 관찰이며, Conversation을 직접 요약하지 않고 `highlight/`에 쌓인
Highlight를 분석하여 작성한다.

**생성 기준:** Observation은 Highlight가 충분히 축적된 이후에만
작성한다 — 권장 기준은 동일 유형 Highlight 3~5개 이상, 반복성 확인,
운영 의미 확인이다.

템플릿: `observations/TEMPLATE_Observation.md`.

### `evidence/`

여러 Observation을 연결하는 운영 근거를 관리한다. Evidence는 Candidate
승격의 근거다. 템플릿: `evidence/TEMPLATE_Evidence.md`.

### `weekly-review/`

매주 운영을 리뷰한다. 템플릿: `weekly-review/TEMPLATE_Weekly_Review.md`.

### `candidate/`

운영에서 검증된 내용만 이 폴더로 이동한다(그 안의 초안 상태). 아래
"Candidate 생성 조건"을 모두 만족하고, 정식 거버넌스 문서로 승격할
준비가 되면 `docs/constitution/candidate/`에 `CAND-*` 문서로 별도
작성한다 — 이 폴더 자체가 공식 거버넌스 레지스트리는 아니다.

**Candidate 생성 조건 (모두 충족):**

- 동일 패턴 3회 이상
- 사용자 가치 확인
- 운영 개선 효과
- 재현 가능성 존재

## Observation Quality Principle

Observation은 대화를 요약하는 문서가 아니다. 운영에서 반복되는 의미 있는
현상을 기록하는 문서이다.

## Evidence Principle

Evidence는 아이디어가 아니다. 여러 Observation을 연결하여 운영 패턴을
설명하는 근거이다. Candidate는 Evidence를 기반으로 생성한다.

## Validation Principle

Observation 하나로 Candidate를 만들지 않는다. 반복성, 재현성, 사용자
가치, 운영 영향을 확인한 뒤 Candidate를 제안한다.

## Knowledge Compression Principle

운영의 목적은 데이터를 많이 저장하는 것이 아니다. 의미를 압축하는
것이다.

권장 비율(참고 지표):

```
Conversation   100
  ↓
Highlight      15~25
  ↓
Observation    5~10
  ↓
Evidence       2~5
  ↓
Candidate      0~2
```

이 비율은 운영 건강성을 확인하기 위한 참고 지표이며 강제 규칙이
아니다. 운영 경험을 통해 지속적으로 검증한다.

> ⚠️ **주의:** 이 Knowledge Compression Ratio는 현재 Candidate 수준의
> 운영 가설이다. 공식 운영 원칙이 아니다. 파일럿 운영 결과를 통해
> 적절성을 검증한다.

## 절대 하지 말 것 (이번 단계)

- Runtime 수정
- Constitution 수정
- Lumi OS 구조(00~07) 변경
- 새로운 Engine 추가
- 자동화 기능 구현
- GitHub 구조 대규모 변경 (`highlight/` 폴더 추가는 예외로 이미 반영됨)

## 성공 기준

- 운영 기록이 일관되게 가능한가?
- Observation과 Conversation이 명확히 구분되는가?
- Candidate가 운영 근거를 통해 생성되는가?
- 운영 데이터를 기반으로 다음 개발 우선순위를 정할 수 있는가?

**Phase 1.2 추가 성공 기준:**

- Highlight와 Observation이 명확히 구분되는가?
- Observation 품질이 향상되는가?
- Candidate 생성 수가 과도하게 증가하지 않는가?
- 운영 데이터를 의미 중심으로 압축할 수 있는가?

## 최종 원칙

기억을 많이 저장하는 것이 아니라, 운영 패턴을 발견할 수 있는 구조를
만드는 것이 목표다. 개발보다 운영을 우선한다. 운영이 설계를 검증한다.
설계가 자동화를 만든다.

운영의 목표는 기록이 아니다. 의미의 압축이다.

- Highlight는 운영 메모이다.
- Observation은 운영 분석이다.
- Evidence는 운영 근거이다.
- Candidate는 운영 검증의 결과이다.
