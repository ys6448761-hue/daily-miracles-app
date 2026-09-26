# RQ-SEQUENCE-001 — Journey Sequence Evidence Surface
# Pre-Pattern Restriction Set V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 4764612
**Status:** FROZEN FOR RQ-SEQUENCE-001 LIMITED PATTERN REVIEW

---

## A. Purpose

이 문서는 `RQ-SEQUENCE-001 — Journey Sequence Evidence Surface`의 Limited Pattern Review 진입 전에 반드시 동결되어야 하는 분석 제한 규칙을 정의한다.

이 문서는:

- **RQ-SEQUENCE-001 내부 분석 제한 규칙**이다
- 새로운 연구가 아니다
- Pattern 결론이 아니다
- Evidence 추가/변경이 아니다

이 문서는 아니다:

- Architecture Decision
- SSOT
- Candidate
- 전역 Travel Intelligence 온톨로지
- 전역 SOUL 추천 규칙

---

## B. Evidence Sufficiency Decision

**Reference:**
`docs/research/RQ_SEQUENCE_001_EVIDENCE_SUFFICIENCY_DECISION_V0_1.md`

**Decision B — SUFFICIENT WITH PRE-PATTERN RESTRICTIONS**

Pattern Review는 R-01~R-05가 동결되고 persisted된 이후에만 수행 가능하다.

---

## C. Frozen Baseline Reference

| 항목 | 값 |
|---|---|
| YTC Screened | 14 / 14 |
| Contributing YTC | 13 (YTC-004 = 0 SEU) |
| Total SEU | 104 |
| First Sample (YTC-001~006) | 78 |
| Second Sample (YTC-007~014) | 26 |
| Inference-created SEU | 0 |
| Unsupported inter-day adjacency | 0 |
| Corrections Applied | C-01 (YTC-010) / C-02 (YTC-013) |
| Integrity Review Verdict | PASS WITH CORRECTIONS |

Scope: FULL=5 / SEGMENT=7 / PARTIAL_ITINERARY=1 / UNCLEAR=1  
Quality: CONTINUOUS=11 / PARTIAL=1 / COMPRESSED=0 / INCOMPLETE=2

---

## D. R-01 — Independence Unit

**Frozen Rule:**

`Pattern support의 독립 근거 단위 = YTC.`

**세부 규칙:**

| 항목 | 규칙 |
|---|---|
| SEU 역할 | adjacency evidence unit — 구조 기술에 사용 가능 |
| SEU 빈도 | 독립 케이스 수로 해석 불가 |
| `104 SEU ≠ 104 independent traveler cases` | 강제 |
| 특정 adjacency 지지 강도 | YTC 수로 보고 |
| 동일 YTC 내 반복 adjacency | independent support = 1 YTC로 계산 |
| within-itinerary SEU | 구조적으로 종속적 |
| SEU 폐기 | 금지 — SEU volume과 independent YTC support를 구분 |

**Required Statement:**

`SEU frequency ≠ independent-case frequency`

---

## E. R-02 — Source-Type Stratification

**Frozen Labels:**

| Source Type | YTC | SEU | 비고 |
|---|---|---|---|
| Package / Group Tour | 6 (YTC-001, 002, 006, 007, 008, 009) | 65 | 여행사 기획 일정 |
| Individual / Personal | 6 (YTC-003, 005, 010, 011, 012, 014) | 35 | 개인 실제 여행 기록 |
| Regional-linked | 1 (YTC-013) | 4 | 지역 연계 패키지 |
| Unknown / MISSING_DATA | 1 (YTC-004) | 0 | 미확인 |

*이 수치는 sufficiency-context 집계 수치이다. 여행자 모집단 추정값이 아니다.*

**세부 규칙:**

| 항목 | 규칙 |
|---|---|
| Package + Individual 병합 | 단일 denominator로 합산 금지 |
| 여행자 행동 주장 | Package와 Individual 분리 레이블 유지 필수 |
| Cross-source 비교 | 명시적 레이블 있을 때만 허용 |
| Package 일정 구조 | 개인 여행자 선호로 해석 불가 |

**Required Statement:**

`Travel-agency sequence ≠ Traveler behavior`

---

## F. R-03 — MOVEMENT_EVENT Handling

**Frozen Flags:**

| YTC | Node | Classification |
|---|---|---|
| YTC-006 | 투어버스 | `MOVEMENT_EVENT / UNRESOLVED_NODE_TYPE` |
| YTC-007 | 버스 | `MOVEMENT_EVENT / UNRESOLVED_NODE_TYPE` |

**세부 규칙:**

| 항목 | 규칙 |
|---|---|
| 보존 | frozen source-faithful SEU ledger에서 삭제 금지 |
| 삭제 | source wording 변경 없이 삭제 금지 |
| 직접 adjacency 전환 | `순천역 → 남해`, `자산탑승장 → 자산공원주차장` 생성 = Gap Filling 위반 |
| PLACE_NODE 자동 포함 | 금지 |
| Pattern Review 처리 옵션 (선택) | (1) MOVEMENT_EVENT를 별도 category로 독립 집계, 또는 (2) PLACE_NODE 특정 denominator에서 명시적 제외 |
| 처리 방식 결정 | Pattern Review 시점에 질문 유형에 따라 결정 — 지금 해결 금지 |
| 새 온톨로지 생성 | 금지 |

MOVEMENT_EVENT flag = **NON-BLOCKING** (이 restriction 하에서)

**Required Statement:**

`MOVEMENT_EVENT ≠ PLACE_NODE`

---

## G. R-04 — Scope Stratification

**Frozen Strata:**

| Stratum | YTC | SEU | Pattern Review 참여 | 제한 |
|---|---|---|---|---|
| FULL_ITINERARY_SCOPE | 5 | 78 | **ELIGIBLE** | full-trip arc 분석 가능. 다른 stratum과 denominator 병합 금지 |
| SEGMENT_ONLY_SCOPE | 7 | 24 | **ELIGIBLE WITH RESTRICTION** | documented segment 내 adjacency만. 전체 여행 위치 분석 불가 |
| PARTIAL_ITINERARY_SCOPE | 1 (YTC-014) | 2 | **ELIGIBLE WITH RESTRICTION** | "..." 이전 2 SEU만. 이후 adjacency 생성 금지 |
| SCOPE_UNCLEAR | 1 (YTC-004) | 0 | **EXCLUDED** | denominator 포함 불가 |

**세부 규칙:**

| 항목 | 규칙 |
|---|---|
| FULL + SEGMENT 병합 | full-journey 주장을 위한 공통 denominator 금지 |
| SEGMENT_ONLY | documented segment 관찰만 지지 |
| PARTIAL_ITINERARY | 명시적으로 문서화된 부분만 |
| SCOPE_UNCLEAR | Pattern denominator 제외 |
| Cross-scope 비교 | 명시적 stratum 레이블 있을 때만 허용 |
| segment boundary 해석 | source 지지 없이 실제 여행 시작/종료로 해석 불가 |

**Required Statements:**

`SEGMENT_ONLY evidence ≠ full-itinerary evidence`

`Sequence continuity ≠ Complete itinerary coverage`

---

## H. R-05 — Quality Label Preservation

**Frozen Quality Labels:**

| Quality | YTC | SEU | Pattern Review 참여 |
|---|---|---|---|
| CONTINUOUS_SEQUENCE | 11 | 98 | PRIMARY ELIGIBLE |
| PARTIAL_SEQUENCE | 1 (YTC-013) | 4 | ELIGIBLE WITH LABEL |
| SEQUENCE_INCOMPLETE | 2 (YTC-004, 014) | 0+2 | CONDITIONALLY ELIGIBLE (아래 규칙) |

**YTC-013 (PARTIAL_SEQUENCE):**

| 항목 | 규칙 |
|---|---|
| PARTIAL 레이블 | 유지 |
| 4개 source-stated SEU | PARTIAL 레이블 하에서만 참여 가능 |
| CONTINUOUS denominator 병합 | 금지 |

**YTC-014 (SEQUENCE_INCOMPLETE):**

| 항목 | 규칙 |
|---|---|
| 2개 source-stated pre-truncation SEU | 참여 가능 |
| "..." truncation 표기 | 보존 |
| 향일암 이후 adjacency | 생성 금지 |
| INCOMPLETE 레이블 | 유지 |

**YTC-004 (SEQUENCE_INCOMPLETE):**

| 항목 | 규칙 |
|---|---|
| SEU | 0 — 제외 |
| adjacency Pattern denominator | 포함 금지 |
| sequence 재구성 | 금지 |

**Global Quality Rule:**

Pattern Review 중 observed adjacency가 유용해 보인다는 이유만으로 Quality label 승급 금지.

---

## I. Global Pattern-Review Guardrails

Pattern Review 전 과정에서 아래 guardrail이 유효하다.

`Repeated adjacency ≠ Route Pattern`

`Documented order ≠ Preferred order`

`Travel-agency sequence ≠ Traveler behavior`

`Sequence continuity ≠ Complete itinerary coverage`

`MOVEMENT_EVENT ≠ PLACE_NODE`

`104 SEU ≠ 104 independent cases`

`SEU frequency ≠ independent-case frequency`

---

## J. What This Does NOT Authorize

Limited Pattern Review는 아래를 결론 내릴 수 없다:

| 항목 | 상태 |
|---|---|
| Common / Typical / Popular / Preferred route | NOT AUTHORIZED |
| Best / Optimal route | NOT AUTHORIZED |
| Representative itinerary | NOT AUTHORIZED |
| Gateway | NOT CONCLUDED |
| Hub | NOT CONCLUDED |
| Entry / Exit Pattern | NOT CONCLUDED |
| Traveler preference | NOT AUTHORIZED |
| WHY / causal explanation | NOT AUTHORIZED |
| Journey Grammar | NOT AUTHORIZED |
| Travel Grammar | NOT AUTHORIZED |
| Mental Map | NOT AUTHORIZED |
| Traveler State Transition | NOT AUTHORIZED |
| Candidate 생성 | NO |
| Architecture 변경 | NO |
| SSOT 승격 | NO |
| DB / Schema / Runtime / Production 변경 | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |

위 항목을 결론 내리려면 별도로 승인된 연구 단계가 필요하다.

---

## K. Pattern Review Entry Condition

아래 조건이 모두 충족되면 Pattern Review 진입 가능하다:

| 조건 | 상태 |
|---|---|
| R-01 Independence Unit 동결 | **FROZEN** |
| R-02 Source-Type Stratification 동결 | **FROZEN** |
| R-03 MOVEMENT_EVENT Handling 동결 | **FROZEN** |
| R-04 Scope Stratification 동결 | **FROZEN** |
| R-05 Quality Label Preservation 동결 | **FROZEN** |
| Evidence Sufficiency Decision persisted | **COMPLETE** |
| Corrected 104-SEU baseline unchanged | **CONFIRMED** |

**Pattern Review Entry: AUTHORIZED (restrictions applied)**

---

## L. Exact Next Action

`Perform RQ-SEQUENCE-001 Limited Sequence Pattern Review on the persisted corrected 104-SEU baseline under frozen restrictions R-01 through R-05.`

---

*RQ-SEQUENCE-001 Pre-Pattern Restriction Set V0.1 — 2026-09-26*
