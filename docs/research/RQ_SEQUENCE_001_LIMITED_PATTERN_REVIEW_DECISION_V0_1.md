# RQ-SEQUENCE-001 — Journey Sequence Evidence Surface
# Limited Sequence Pattern Review Decision V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Base Checkpoint:** e9f8bb0
**Status:** COMPLETE / PERSISTED — Lumi Review CONFIRMED

---

## A. Research Question

"Within the persisted RQ-SEQUENCE-001 evidence surface, which exact source-supported Journey Node adjacencies, if any, are repeated across independent YTCs?"

Limited / sample-bounded structural review only.
NOT a route recommendation study.

---

## B. Frozen Baseline

| 항목 | 값 |
|---|---|
| Authoritative Source | `docs/research/RQ_SEQUENCE_001_PROTOCOL_AND_SCREENING_LEDGER_V0_1.md` |
| Integrity Review | `docs/research/RQ_SEQUENCE_001_INTEGRITY_REVIEW_DECISION_V0_1.md` |
| Sufficiency Decision | `docs/research/RQ_SEQUENCE_001_EVIDENCE_SUFFICIENCY_DECISION_V0_1.md` |
| YTC Screened | 14 / 14 |
| Contributing YTC | 13 (YTC-004 = 0 SEU) |
| Total SEU | 104 |
| First Sample (YTC-001~006) | 78 |
| Second Sample (YTC-007~014) | 26 |
| Inference-created SEU | 0 |
| Unsupported inter-day adjacency | 0 |

**Scope:** FULL=5 / SEGMENT=7 / PARTIAL_ITINERARY=1 / SCOPE_UNCLEAR=1
**Quality:** CONTINUOUS=11 / PARTIAL=1 (YTC-013) / COMPRESSED=0 / INCOMPLETE=2 (YTC-004, 014)

---

## C. Frozen Restrictions R-01~R-05

Applied throughout this review. Full definitions in:
`docs/research/RQ_SEQUENCE_001_PRE_PATTERN_RESTRICTION_SET_V0_1.md`

| # | 제한 | 핵심 규칙 |
|---|---|---|
| R-01 | Independence Unit = YTC | `SEU frequency ≠ independent-case frequency` |
| R-02 | Source-Type Stratification | `Travel-agency sequence ≠ Traveler behavior` |
| R-03 | MOVEMENT_EVENT Handling | `MOVEMENT_EVENT ≠ PLACE_NODE` |
| R-04 | Scope Stratification | `SEGMENT_ONLY evidence ≠ full-itinerary evidence` |
| R-05 | Quality Label Preservation | YTC-013=PARTIAL / YTC-014=INCOMPLETE — no upgrade |

---

## D. Verdict

**Verdict C**

`REPEATED EXACT MULTI-STEP SEQUENCE SIGNAL(S) OBSERVED — SAMPLE-BOUNDED`

Level 1에서 4개 정확한 반복 adjacency 확인.
Level 2에서 정확한 3-node 연속 시퀀스가 2 independent YTC에서 확인.

**Strict Boundary (prominent):**

`Repeated exact sequence signal ≠ Route Pattern`

`Documented order ≠ Preferred order`

`Travel-agency sequence ≠ Traveler behavior`

`SEGMENT_ONLY evidence ≠ full-itinerary evidence`

`P2 ≠ strong/generalized behavioral confidence`

`104 SEU ≠ 104 independent cases`

`SEU frequency ≠ independent-case frequency`

---

## E. Level 1 — Repeated Exact Adjacency Findings

### A-01 `용산역 → 순천역`

| 항목 | 값 |
|---|---|
| Adjacency | `용산역 → 순천역` |
| SEU 발생 수 | 2 |
| 지지 YTC count | **2** |
| 지지 YTC IDs | YTC-001, YTC-006 |
| Source Type | Package/Group × 2 — **PACKAGE-ONLY** |
| Scope | FULL_ITINERARY_SCOPE × 2 |
| Quality | CONTINUOUS_SEQUENCE × 2 |
| MOVEMENT_EVENT | 없음 |
| Evidence Label | `REPEATED EXACT ADJACENCY — SAMPLE-BOUNDED` |
| Strength | **P1** |

---

### A-02 `순천역 → 용산역`

| 항목 | 값 |
|---|---|
| Adjacency | `순천역 → 용산역` |
| SEU 발생 수 | 2 |
| 지지 YTC count | **2** |
| 지지 YTC IDs | YTC-001, YTC-006 |
| Source Type | Package/Group × 2 — **PACKAGE-ONLY** |
| Scope | FULL_ITINERARY_SCOPE × 2 |
| Quality | CONTINUOUS_SEQUENCE × 2 |
| MOVEMENT_EVENT | 없음 |
| Evidence Label | `REPEATED EXACT ADJACENCY — SAMPLE-BOUNDED` |
| Strength | **P1** |

---

### A-03 `자산탑승장 → 케이블카 편도`

| 항목 | 값 |
|---|---|
| Adjacency | `자산탑승장 → 케이블카 편도` |
| SEU 발생 수 | 2 |
| 지지 YTC count | **2** |
| 지지 YTC IDs | YTC-009, YTC-013 |
| Source Type | Package/Group (YTC-009) + Regional-linked (YTC-013) — **CROSS-SOURCE-TYPE** |
| Scope | SEGMENT_ONLY_SCOPE × 2 |
| Quality | CONTINUOUS (YTC-009) + PARTIAL (YTC-013) |
| MOVEMENT_EVENT | 없음 |
| Evidence Label | `REPEATED EXACT ADJACENCY — SAMPLE-BOUNDED` |
| Strength | **P2** |

*YTC-013 Quality = PARTIAL_SEQUENCE 유지. CONTINUOUS로 승격 금지.*

---

### A-04 `케이블카 편도 → 돌산탑승장`

| 항목 | 값 |
|---|---|
| Adjacency | `케이블카 편도 → 돌산탑승장` |
| SEU 발생 수 | 2 |
| 지지 YTC count | **2** |
| 지지 YTC IDs | YTC-009, YTC-013 |
| Source Type | Package/Group (YTC-009) + Regional-linked (YTC-013) — **CROSS-SOURCE-TYPE** |
| Scope | SEGMENT_ONLY_SCOPE × 2 |
| Quality | CONTINUOUS (YTC-009) + PARTIAL (YTC-013) |
| MOVEMENT_EVENT | 없음 |
| Evidence Label | `REPEATED EXACT ADJACENCY — SAMPLE-BOUNDED` |
| Strength | **P2** |

*YTC-013 Quality = PARTIAL_SEQUENCE 유지.*

---

## F. Level 2 — Repeated Exact Multi-Step Sequence

### S-01 `자산탑승장 → 케이블카 편도 → 돌산탑승장`

| 항목 | 값 |
|---|---|
| Exact Sequence | `자산탑승장 → 케이블카 편도 → 돌산탑승장` |
| Node Length | **3** |
| 지지 YTC count | **2** |
| 지지 YTC IDs | YTC-009, YTC-013 |
| Source Type | Package/Group (YTC-009) + Regional-linked (YTC-013) — **CROSS-SOURCE-TYPE** |
| Scope | SEGMENT_ONLY_SCOPE × 2 |
| Quality | CONTINUOUS (YTC-009) + PARTIAL (YTC-013) |
| MOVEMENT_EVENT | 없음 |
| Contiguity | VERIFIED in both YTC |
| Evidence Label | `REPEATED EXACT MULTI-STEP SEQUENCE — SAMPLE-BOUNDED` |
| Strength | **P2** |

**YTC-009 연속성 확인 (SEU 1–2):**
```
자산탑승장 → 케이블카 편도
케이블카 편도 → 돌산탑승장
```

**YTC-013 연속성 확인 (SEU 2–3):**
```
자산탑승장 → 케이블카 편도
케이블카 편도 → 돌산탑승장
```

**확장 검토 결과:**

| 방향 | YTC-009 | YTC-013 | 결과 |
|---|---|---|---|
| 전방 (4번째 노드) | 돌산공원 | 광양 | 불일치 — 4-node 미성립 |
| 후방 (선행 노드) | 없음 (segment 시작) | 오동도 | 불일치 — 4-node 역방향 미성립 |

**최대 반복 정확 시퀀스 길이 = 3 nodes**

이 진술은 현재 exact-match corpus review에만 적용된다. 전역 여행 규칙이 아니다.

---

## G. Source / Scope / Quality Stratification

| ID | Adjacency / Sequence | Strength | Source | Scope | Quality |
|---|---|---|---|---|---|
| A-01 | `용산역 → 순천역` | P1 | PACKAGE-ONLY | FULL | CONTINUOUS |
| A-02 | `순천역 → 용산역` | P1 | PACKAGE-ONLY | FULL | CONTINUOUS |
| A-03 | `자산탑승장 → 케이블카 편도` | P2 | CROSS-SOURCE | SEGMENT | CONT+PARTIAL |
| A-04 | `케이블카 편도 → 돌산탑승장` | P2 | CROSS-SOURCE | SEGMENT | CONT+PARTIAL |
| S-01 | `자산탑승장 → 케이블카 편도 → 돌산탑승장` | P2 | CROSS-SOURCE | SEGMENT | CONT+PARTIAL |

**P1/P2 정의 (RQ-SEQUENCE-001 내부 레이블):**

| 레이블 | 정의 |
|---|---|
| P1 | REPEATED STRUCTURAL SIGNAL — SAMPLE-BOUNDED (지지 YTC ≥ 2) |
| P2 | CROSS-SOURCE-TYPE REPEATED STRUCTURAL SIGNAL — SAMPLE-BOUNDED (지지 YTC ≥ 2, 최소 2개 source-type stratum) |

이 레이블은 이 RQ 전용이다. 전역 신뢰도 점수가 아니다.

---

## H. Variation Surface

### V-01 — 케이블카 방향 BIDIRECTIONAL OBSERVATION

| 방향 | YTC | Source Type |
|---|---|---|
| 돌산→자산 | YTC-007, YTC-008 | Package/Group |
| 자산→돌산 | YTC-009, YTC-013 | Package/Group + Regional-linked |

`BIDIRECTIONAL OBSERVATION`

WHY 불명. 방향 선호 결론 금지. 최적 방향 결론 금지.

### V-02 — 오동도 후계 노드 다양성

오동도에서 출발하는 adjacency (8 YTC, 모두 상이):

| YTC | 후계 노드 |
|---|---|
| YTC-001 | 장도 |
| YTC-002 | 고소동 천사벽화마을 |
| YTC-003 | 아쿠아플라넷 |
| YTC-005 | 순천 스테이두루 |
| YTC-006 | 순천 이동 |
| YTC-007 | 광양 숙박 |
| YTC-008 | 여수 숙박 |
| YTC-013 | 자산탑승장 |

`VARIATION OBSERVED` — Hub 결론 금지.

### V-03 — 향일암 선행/후계 다양성

| YTC | 선행 | 후계 |
|---|---|---|
| YTC-001 | 조식 | 교동시장/여수 풍물시장 |
| YTC-002 | 고소동 천사벽화마을 | 개별석식 |
| YTC-005 | 바다김밥 | 카페 퍼즈 |
| YTC-010 | (계획 축소) | 봉산동 식사 |
| YTC-014 | 여수 | (truncated) |

`VARIATION OBSERVED` — 경로 역할 결론 금지.

### V-04 — 케이블카 탑승장 표기 변형

| YTC | 자산 측 표기 | 돌산 측 표기 |
|---|---|---|
| YTC-007 | 자산탑승장 | 돌산탑승장(돌산공원) |
| YTC-008 | 자산 탑승장 (공백) | 돌산 탑승장 (공백) |
| YTC-009 | 자산탑승장 | 돌산탑승장 |
| YTC-011 | — | 돌산탑승장 주차 |
| YTC-012 | 자산탑승장 | — |
| YTC-013 | 자산탑승장 | 돌산탑승장 |

`TYPOGRAPHIC VARIANT — OBSERVED / NOT NORMALIZED`

**Normalization Decision = DEFERRED / NOT REQUIRED FOR RQ-SEQUENCE-001 CLOSURE**

이 표기 변형을 정규화하지 않았다. 정규화된 형태로 Pattern 결과를 재계산하지 않았다.

---

## I. Research Note — Frequently Appearing Nodes

자주 등장하는 장소(예: 오동도, 향일암)가 많은 YTC에 나타나더라도, 이것 자체가 고정된 전후 시퀀스를 확립하지는 않는다.

현재 corpus에서 오동도와 향일암의 문서화된 선행/후계 노드는 모두 다양하게 관찰되었다.

이것은 방법론적 주의 사항이다. 이를 아래로 승격하지 않는다:
- Travel Grammar
- 유연한 허브 이론
- 장소 역할 Architecture
- 추천 로직
- Candidate

---

## J. Independent Lumi Review Decision

`Verdict C — CONFIRMED WITH STRICT BOUNDARY`

| 항목 | 검토 결과 |
|---|---|
| A-01 분류 정확성 | CONFIRMED |
| A-02 분류 정확성 | CONFIRMED |
| A-03 분류 + PARTIAL 레이블 유지 | CONFIRMED |
| A-04 분류 + PARTIAL 레이블 유지 | CONFIRMED |
| S-01 연속성 검증 (YTC-009, YTC-013) | CONFIRMED |
| 금지된 결론 부재 | CONFIRMED |
| V-04 정규화 미수행 | CONFIRMED |
| 정규화 결정 = DEFERRED | CONFIRMED |
| Route Pattern 미선언 | CONFIRMED |
| WHY 추론 없음 | CONFIRMED |

---

## K. Research Boundary — NOT CONCLUDED

| 항목 | 상태 |
|---|---|
| Common / Typical / Popular route | NOT CONCLUDED |
| Preferred / Optimal / Best route | NOT CONCLUDED |
| Representative itinerary | NOT CONCLUDED |
| Gateway | NOT CONCLUDED |
| Hub | NOT CONCLUDED |
| Entry / Exit Pattern | NOT CONCLUDED |
| Traveler preference | NOT CONCLUDED |
| WHY / causal explanation | NOT OPENED |
| Journey Grammar | NOT CONCLUDED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |
| V-04 entity normalization | NOT PERFORMED |
| Bidirectional cable car preference | NOT CONCLUDED |
| Candidate Generated | NO |
| Architecture Changed | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |

---

## L. Persistence Status

| 항목 | 상태 |
|---|---|
| Pattern Review | COMPLETE / PERSISTED |
| Verdict | Verdict C — CONFIRMED |
| Route Pattern | NOT CONCLUDED |
| WHY | NOT OPENED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |

---

## M. Current Next Action

`Perform RQ-SEQUENCE-001 Post-Pattern Research Decision Review to determine whether the Sequence research horizon should close at the current sample-bounded findings or whether a narrowly scoped WHY-oriented research question is justified by existing evidence.`

---

*RQ-SEQUENCE-001 Limited Sequence Pattern Review Decision V0.1 — 2026-09-26*
