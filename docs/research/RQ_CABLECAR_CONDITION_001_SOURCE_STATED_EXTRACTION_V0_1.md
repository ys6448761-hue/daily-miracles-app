# RQ-CABLECAR-CONDITION-001
# Source-Stated Condition Extraction V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 252e286
**Status:** COMPLETE / PERSISTED

---

## A. Protocol Reference

| 항목 | 값 |
|---|---|
| Protocol File | `docs/research/RQ_CABLECAR_CONDITION_001_PROTOCOL_V0_1.md` |
| Research Question (Korean) | 현재 corpus의 케이블카 방문 케이스에서, 방문 유형(편도/왕복) 및 편도 방향(돌산→자산/자산→돌산)의 차이와 함께 문서화된 source-stated conditions는 무엇인가? |
| Research Type | NARROW WHY-ORIENTED EXPLORATORY RQ — NON-CAUSAL |
| Comparison Unit | YTC |
| Structural Variables | VISIT_TYPE + ONE_WAY_DIRECTION |
| Condition Fields | Exactly 5 frozen |
| Causality | FORBIDDEN |
| External Evidence | FORBIDDEN |
| Provenance Rule | SOURCE_STATED only |

**Authoritative Corpus:**

| Source | File |
|---|---|
| First Sample (YTC-001~006) | `docs/research/YEOSU_TRAVEL_SCHEDULE_CORPUS_PILOT_FIRST_SAMPLE_V0_1.md` |
| Second Sample (YTC-007~014) | `docs/research/YEOSU_TRAVEL_SCHEDULE_CORPUS_PILOT_SECOND_SAMPLE_V0_1.md` |
| SEU Ledger | `docs/research/RQ_SEQUENCE_001_PROTOCOL_AND_SCREENING_LEDGER_V0_1.md` |

---

## B. Extraction Verdict

**E-B**

`EXTRACTION COMPLETE WITH MATERIAL MISSINGNESS — INTEGRITY REVIEW REQUIRED BEFORE ANALYSIS`

**Independent Integrity Review:**

`PASS WITH MATERIAL MISSINGNESS`

**Analysis Readiness:**

`READY WITH FIELD-SPECIFIC DENOMINATORS`

**Material Missingness:**

`CONFIRMED / NON-BLOCKING`

The E-B verdict does NOT mean analysis is blocked. It means any later comparison must respect the actual evidence coverage of each field.

---

## C. Eligibility Screening

**Candidate Set:** YTC-001, YTC-002, YTC-005, YTC-006, YTC-007, YTC-008, YTC-009, YTC-011, YTC-012, YTC-013

| YTC | 케이블카 방문 문서화 | Eligibility |
|---|---|---|
| YTC-001 | 케이블카 탑승장 → 여수해상케이블카 → 오동도 | **ELIGIBLE** |
| YTC-002 | 여수해상케이블카/돌산공원 | **ELIGIBLE** |
| YTC-005 | 당머리첫집 → 여수해상케이블카 → 숙소 | **ELIGIBLE** |
| YTC-006 | 조식 → 여수해상케이블카 편도 → 오동도 | **ELIGIBLE** |
| YTC-007 | 돌산탑승장(돌산공원) → 케이블카 편도 → 자산탑승장 | **ELIGIBLE** |
| YTC-008 | 돌산 탑승장 → 케이블카 편도 → 자산 탑승장 | **ELIGIBLE** |
| YTC-009 | 자산탑승장 → 케이블카 편도 → 돌산탑승장 | **ELIGIBLE** |
| YTC-011 | 돌산탑승장 주차 → 케이블카 왕복(돌산↔자산) → 돌산탑승장 귀환 | **ELIGIBLE** |
| YTC-012 | 자산탑승장 → 케이블카 왕복(자산↔돌산) → 자산탑승장 귀환 | **ELIGIBLE** |
| YTC-013 | 오동도 → 자산탑승장 → 케이블카 편도 → 돌산탑승장 | **ELIGIBLE** |

**Eligible: 10 / 10 | INELIGIBLE: 0 | INSUFFICIENT_DOCUMENTATION: 0**

---

## D. Extraction Matrix

*Comparison unit = YTC. Values are source-faithful. Missing = MISSING / NOT_DOCUMENTED.*

---

### YTC-001

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-001 |
| Corpus Source | 네스트투어/홍익여행사 (Package/Group) |
| VISIT_TYPE | `MISSING / NOT_DOCUMENTED` |
| ONE_WAY_DIRECTION | `MISSING / NOT_DOCUMENTED` |
| C-01 PREDECESSOR_NODE | `진남관·이순신광장` |
| C-02 SUCCESSOR_NODE | `오동도` |
| C-03 TRAVEL_TYPE | `Package/Group` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `MISSING / NOT_DOCUMENTED` |
| C-05 LODGING_DIRECTION | `광양 숙소` |

---

### YTC-002

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-002 |
| Corpus Source | 테마캠프 (Package/Group) |
| VISIT_TYPE | `MISSING / NOT_DOCUMENTED` |
| ONE_WAY_DIRECTION | `MISSING / NOT_DOCUMENTED` |
| C-01 PREDECESSOR_NODE | `개별석식` |
| C-02 SUCCESSOR_NODE | `광양 숙소` |
| C-03 TRAVEL_TYPE | `Package/Group` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `MISSING / NOT_DOCUMENTED` |
| C-05 LODGING_DIRECTION | `광양 숙소` |

---

### YTC-005

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-005 |
| Corpus Source | 안나의 파란차 (Individual/Personal) |
| VISIT_TYPE | `MISSING / NOT_DOCUMENTED` |
| ONE_WAY_DIRECTION | `MISSING / NOT_DOCUMENTED` |
| C-01 PREDECESSOR_NODE | `당머리첫집` |
| C-02 SUCCESSOR_NODE | `숙소` |
| C-03 TRAVEL_TYPE | `Individual/Personal` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `MISSING / NOT_DOCUMENTED` |
| C-05 LODGING_DIRECTION | `MISSING / NOT_DOCUMENTED` |

---

### YTC-006

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-006 |
| Corpus Source | 스타투어 (Package/Group) |
| VISIT_TYPE | `ONE_WAY` |
| ONE_WAY_DIRECTION | `MISSING / NOT_DOCUMENTED` |
| C-01 PREDECESSOR_NODE | `조식` |
| C-02 SUCCESSOR_NODE | `오동도` |
| C-03 TRAVEL_TYPE | `Package/Group` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `MISSING / NOT_DOCUMENTED` |
| C-05 LODGING_DIRECTION | `MISSING / NOT_DOCUMENTED` |

---

### YTC-007

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-007 |
| Corpus Source | 모두투어 (Package/Group) |
| VISIT_TYPE | `ONE_WAY` |
| ONE_WAY_DIRECTION | `DOLSAN_TO_JASAN` |
| C-01 PREDECESSOR_NODE | `MISSING / NOT_DOCUMENTED` |
| C-02 SUCCESSOR_NODE | `버스*(MOVEMENT_EVENT)*` |
| C-03 TRAVEL_TYPE | `Package/Group` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `MISSING / NOT_DOCUMENTED` |
| C-05 LODGING_DIRECTION | `광양 숙박` |

---

### YTC-008

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-008 |
| Corpus Source | 롯데관광 (Package/Group) |
| VISIT_TYPE | `ONE_WAY` |
| ONE_WAY_DIRECTION | `DOLSAN_TO_JASAN` |
| C-01 PREDECESSOR_NODE | `MISSING / NOT_DOCUMENTED` |
| C-02 SUCCESSOR_NODE | `오동도` |
| C-03 TRAVEL_TYPE | `Package/Group` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `MISSING / NOT_DOCUMENTED` |
| C-05 LODGING_DIRECTION | `여수 숙박` |

---

### YTC-009

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-009 |
| Corpus Source | 웹투어 (Package/Group) |
| VISIT_TYPE | `ONE_WAY` |
| ONE_WAY_DIRECTION | `JASAN_TO_DOLSAN` |
| C-01 PREDECESSOR_NODE | `MISSING / NOT_DOCUMENTED` |
| C-02 SUCCESSOR_NODE | `돌산공원` |
| C-03 TRAVEL_TYPE | `Package/Group` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `MISSING / NOT_DOCUMENTED` |
| C-05 LODGING_DIRECTION | `돌산 숙박` |

---

### YTC-011

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-011 |
| Corpus Source | 가족/자가용 (Individual/Personal) |
| VISIT_TYPE | `ROUND_TRIP` |
| ONE_WAY_DIRECTION | `NOT_APPLICABLE` |
| C-01 PREDECESSOR_NODE | `돌산탑승장 주차` |
| C-02 SUCCESSOR_NODE | `돌산탑승장 귀환` |
| C-03 TRAVEL_TYPE | `Individual/Personal` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `자가용` |
| C-05 LODGING_DIRECTION | `MISSING / NOT_DOCUMENTED` |

---

### YTC-012

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-012 |
| Corpus Source | 커플/KTX+렌터카 (Individual/Personal) |
| VISIT_TYPE | `ROUND_TRIP` |
| ONE_WAY_DIRECTION | `NOT_APPLICABLE` |
| C-01 PREDECESSOR_NODE | `MISSING / NOT_DOCUMENTED` |
| C-02 SUCCESSOR_NODE | `자산탑승장 귀환` |
| C-03 TRAVEL_TYPE | `Individual/Personal` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `렌터카` |
| C-05 LODGING_DIRECTION | `MISSING / NOT_DOCUMENTED` |

---

### YTC-013

| 필드 | 값 |
|---|---|
| YTC_ID | YTC-013 |
| Corpus Source | 지역 연계 패키지 (Regional-linked) |
| VISIT_TYPE | `ONE_WAY` |
| ONE_WAY_DIRECTION | `JASAN_TO_DOLSAN` |
| C-01 PREDECESSOR_NODE | `오동도` |
| C-02 SUCCESSOR_NODE | `광양` |
| C-03 TRAVEL_TYPE | `Regional-linked` |
| C-04 EXPLICIT_VEHICLE_CONTEXT | `MISSING / NOT_DOCUMENTED` |
| C-05 LODGING_DIRECTION | `MISSING / NOT_DOCUMENTED` |

*YTC-013 Quality = PARTIAL_SEQUENCE — 유지. 이 추출에서 품질 레이블 변경 없음.*

---

## E. Field Coverage / Missingness

| 필드 | Documented | MISSING | NOT_APPLICABLE | Denominator | Coverage |
|---|---|---|---|---|---|
| VISIT_TYPE | 7 | 3 (YTC-001,002,005) | 0 | 10 | **7/10** |
| ONE_WAY_DIRECTION | 4 | 1 (YTC-006) | 2 (YTC-011,012) | 5 (ONE_WAY cases) | **4/5** |
| C-01 PREDECESSOR_NODE | 6 | 4 (YTC-007,008,009,012) | 0 | 10 | **6/10** |
| C-02 SUCCESSOR_NODE | 10 | 0 | 0 | 10 | **10/10** |
| C-03 TRAVEL_TYPE | 10 | 0 | 0 | 10 | **10/10** |
| C-04 EXPLICIT_VEHICLE_CONTEXT | 2 (YTC-011,012) | 8 | 0 | 10 | **2/10** |
| C-05 LODGING_DIRECTION | 5 | 5 | 0 | 10 | **5/10** |

**Material Missingness (≥40% missing):**

| 필드 | Missing 비율 | 주요 원인 |
|---|---|---|
| EXPLICIT_VEHICLE_CONTEXT | 80% | Package/개인 기록에서 이동 수단 미명시 |
| LODGING_DIRECTION | 50% | SEGMENT_ONLY 케이스 + 일부 숙박 미특정 |
| PREDECESSOR_NODE | 40% | Segment 첫 노드 = 탑승장 케이스에서 선행 노드 없음 |

Coverage 100% 필드: SUCCESSOR_NODE, TRAVEL_TYPE

---

## F. Provenance Audit

| YTC | 필드 | 값 | Provenance |
|---|---|---|---|
| 001 | PREDECESSOR_NODE | 진남관·이순신광장 | SOURCE_STATED — SEU ledger Day 2 |
| 001 | SUCCESSOR_NODE | 오동도 | SOURCE_STATED — SEU ledger Day 2 |
| 001 | TRAVEL_TYPE | Package/Group | PERSISTED_APPROVED_LABEL — 네스트투어/홍익여행사 |
| 001 | LODGING_DIRECTION | 광양 숙소 | SOURCE_STATED — SEU ledger Day 2 |
| 002 | PREDECESSOR_NODE | 개별석식 | SOURCE_STATED — SEU ledger Day 1 |
| 002 | SUCCESSOR_NODE | 광양 숙소 | SOURCE_STATED — SEU ledger Day 1 |
| 002 | TRAVEL_TYPE | Package/Group | PERSISTED_APPROVED_LABEL — 테마캠프 |
| 002 | LODGING_DIRECTION | 광양 숙소 | SOURCE_STATED — SEU ledger Day 1 |
| 005 | PREDECESSOR_NODE | 당머리첫집 | SOURCE_STATED — SEU ledger Day 1 |
| 005 | SUCCESSOR_NODE | 숙소 | SOURCE_STATED — SEU ledger Day 1 |
| 005 | TRAVEL_TYPE | Individual/Personal | PERSISTED_APPROVED_LABEL — 안나의 파란차 |
| 006 | VISIT_TYPE | ONE_WAY | SOURCE_STATED — "여수해상케이블카 편도" |
| 006 | PREDECESSOR_NODE | 조식 | SOURCE_STATED — SEU ledger Day 2 |
| 006 | SUCCESSOR_NODE | 오동도 | SOURCE_STATED — SEU ledger Day 2 |
| 006 | TRAVEL_TYPE | Package/Group | PERSISTED_APPROVED_LABEL — 스타투어 |
| 007 | VISIT_TYPE | ONE_WAY | SOURCE_STATED — "케이블카 편도" |
| 007 | ONE_WAY_DIRECTION | DOLSAN_TO_JASAN | SOURCE_STATED — 돌산탑승장(돌산공원)→케이블카 편도→자산탑승장 |
| 007 | SUCCESSOR_NODE | 버스*(MOVEMENT_EVENT)* | SOURCE_STATED — SEU ledger; MOVEMENT_EVENT 보존 |
| 007 | TRAVEL_TYPE | Package/Group | PERSISTED_APPROVED_LABEL — 모두투어 |
| 007 | LODGING_DIRECTION | 광양 숙박 | SOURCE_STATED — SEU ledger |
| 008 | VISIT_TYPE | ONE_WAY | SOURCE_STATED — "케이블카 편도" |
| 008 | ONE_WAY_DIRECTION | DOLSAN_TO_JASAN | SOURCE_STATED — 돌산 탑승장→케이블카 편도→자산 탑승장 (공백 표기 유지 V-04) |
| 008 | SUCCESSOR_NODE | 오동도 | SOURCE_STATED — SEU ledger |
| 008 | TRAVEL_TYPE | Package/Group | PERSISTED_APPROVED_LABEL — 롯데관광 |
| 008 | LODGING_DIRECTION | 여수 숙박 | SOURCE_STATED — SEU ledger |
| 009 | VISIT_TYPE | ONE_WAY | SOURCE_STATED — "케이블카 편도" |
| 009 | ONE_WAY_DIRECTION | JASAN_TO_DOLSAN | SOURCE_STATED — 자산탑승장→케이블카 편도→돌산탑승장 |
| 009 | SUCCESSOR_NODE | 돌산공원 | SOURCE_STATED — SEU ledger |
| 009 | TRAVEL_TYPE | Package/Group | PERSISTED_APPROVED_LABEL — 웹투어 |
| 009 | LODGING_DIRECTION | 돌산 숙박 | SOURCE_STATED — SEU ledger |
| 011 | VISIT_TYPE | ROUND_TRIP | SOURCE_STATED — "케이블카 왕복(돌산↔자산)" |
| 011 | PREDECESSOR_NODE | 돌산탑승장 주차 | SOURCE_STATED — SEU ledger |
| 011 | SUCCESSOR_NODE | 돌산탑승장 귀환 | SOURCE_STATED — SEU ledger |
| 011 | TRAVEL_TYPE | Individual/Personal | PERSISTED_APPROVED_LABEL — 가족/자가용 |
| 011 | EXPLICIT_VEHICLE_CONTEXT | 자가용 | PERSISTED_APPROVED_LABEL + SOURCE_STATED — "가족/자가용" + "주차" in SEU |
| 012 | VISIT_TYPE | ROUND_TRIP | SOURCE_STATED — "케이블카 왕복(자산↔돌산)" |
| 012 | SUCCESSOR_NODE | 자산탑승장 귀환 | SOURCE_STATED — SEU ledger |
| 012 | TRAVEL_TYPE | Individual/Personal | PERSISTED_APPROVED_LABEL — 커플/KTX+렌터카 |
| 012 | EXPLICIT_VEHICLE_CONTEXT | 렌터카 | PERSISTED_APPROVED_LABEL — "커플/KTX+렌터카" |
| 013 | VISIT_TYPE | ONE_WAY | SOURCE_STATED — "케이블카 편도" |
| 013 | ONE_WAY_DIRECTION | JASAN_TO_DOLSAN | SOURCE_STATED — 자산탑승장→케이블카 편도→돌산탑승장 |
| 013 | PREDECESSOR_NODE | 오동도 | SOURCE_STATED — SEU ledger |
| 013 | SUCCESSOR_NODE | 광양 | SOURCE_STATED — SEU ledger |
| 013 | TRAVEL_TYPE | Regional-linked | PERSISTED_APPROVED_LABEL — 지역 연계 패키지 |

**모든 비-MISSING 값에 provenance 부여됨. INFERRED 카테고리 사용 없음.**

---

## G. Independent Integrity Review

**Verdict: PASS WITH MATERIAL MISSINGNESS**

**Extraction Integrity Checklist:**

| 항목 | 판정 |
|---|---|
| 후보 YTC = 10건 | PASS |
| 10건 전체 스크리닝 완료 | PASS |
| YTC당 정확히 1개 row | PASS |
| 후보 누락 없음 | PASS |
| 추가 YTC 없음 | PASS |
| 비교 단위 = YTC | PASS |
| 구조 변수 정확히 2개 | PASS |
| 조건 필드 정확히 5개 | PASS |
| 비-MISSING 모든 값에 provenance | PASS |
| implied vehicle context 없음 (YTC-005 파란차 제외) | PASS |
| 추론된 predecessor/successor 없음 | PASS |
| MOVEMENT_EVENT 건너뜀 없음 (YTC-007 버스 보존) | PASS |
| Missing data 보존 | PASS |
| 표기 정규화 없음 (V-04: 자산 탑승장 / 자산탑승장 별도 유지) | PASS |
| 외부 Evidence 없음 | PASS |
| 인과 언어 없음 | PASS |
| co-occurrence 결론 없음 | PASS |
| 추천 없음 | PASS |
| Candidate 없음 | PASS |
| Architecture/DB/schema/runtime/prod 변경 없음 | PASS |
| place_knowledge migration HOLD | PASS |
| YTC-013 PARTIAL_SEQUENCE 유지 | PASS |

**전체 22항목 PASS**

---

## H. Edge-Case Dispositions (Integrity Review Confirmed)

### YTC-001 / YTC-002 / YTC-005

`VISIT_TYPE = MISSING / NOT_DOCUMENTED` — **APPROVED**

Cable-car visit alone does not establish one-way or round-trip. 소스 원문에 편도/왕복 qualifier 없음. 인과 추론 금지.

### YTC-007

`SUCCESSOR_NODE = 버스*(MOVEMENT_EVENT)*` — **APPROVED**

오동도로 대체하지 않음. 즉각 문서화된 adjacency 보존 필수 (R-03 MOVEMENT_EVENT 보존 원칙).

### YTC-011

`EXPLICIT_VEHICLE_CONTEXT = 자가용` — **APPROVED**

Support: persisted approved corpus label `가족/자가용` + source-stated parking evidence `돌산탑승장 주차` in SEU.

### YTC-012

`EXPLICIT_VEHICLE_CONTEXT = 렌터카` — **APPROVED**

Support: persisted approved corpus label `커플/KTX+렌터카`.

### YTC-013

`LODGING_DIRECTION = MISSING / NOT_DOCUMENTED` — **APPROVED**

`광양` successor node does NOT establish `광양 숙박`. Movement destination ≠ lodging evidence.

---

## I. Field-Specific Denominator Rule (FROZEN)

`FIELD-SPECIFIC DENOMINATOR REQUIRED`

Any future co-occurrence statement must report the denominator corresponding to cases where the relevant comparison fields are actually documented.

**Never silently use all 10 eligible YTC as the denominator when one or more required fields are missing.**

For every future comparison report:

| 항목 | 필수 보고 |
|---|---|
| eligible YTC count | 보고 필수 |
| analyzable YTC count for that comparison | 보고 필수 |
| excluded-from-comparison YTC (due to missing field) | 보고 필수 |
| observed count | 보고 필수 |
| missing count | 보고 필수 |

Example structure (형식 예시 — 결론 예시 아님):

`Observed X in n/N analyzable cases; M eligible cases lacked one or more required fields.`

This is a reporting structure, NOT permission to generalize.

---

## J. Missingness Guardrail (FROZEN)

`MISSING ≠ NEGATIVE`

| MISSING 항목 | 의미하지 않는 것 |
|---|---|
| EXPLICIT_VEHICLE_CONTEXT missing | NO VEHICLE |
| LODGING_DIRECTION missing | NO LODGING |
| PREDECESSOR_NODE missing | JOURNEY STARTED AT BOARDING STATION |
| VISIT_TYPE missing | ONE_WAY or ROUND_TRIP |

Never place MISSING cases into a negative comparison category.

---

## K. Vehicle Guardrail

Because `EXPLICIT_VEHICLE_CONTEXT = 2/10`:

Future analysis must NOT make a comparative statement equivalent to:

`"round-trip travelers use cars"`

merely because both documented vehicle cases are round-trip.

Allowed form is limited to:

`Both YTC cases with documented explicit vehicle context are round-trip cases; vehicle context is missing for 8/10 eligible YTC, so no cross-group vehicle comparison is supported.`

Do not turn absence of documentation on one-way cases into evidence of no vehicle.

---

## L. Travel-Type Guardrail

TRAVEL_TYPE has `10/10 coverage` — more complete than vehicle context.

Even if visit type and travel type align within all analyzable cases:

- do not infer preference
- do not infer operator intent
- do not infer traveler behavior
- do not infer causality
- do not generalize beyond current corpus

Package schedule decisions and individual traveler decisions have different decision-makers.

---

## M. Successor / Predecessor Guardrail

SUCCESSOR_NODE: `10/10 documented`
PREDECESSOR_NODE: `6/10 documented`

Do not collapse nodes into destination categories during co-occurrence analysis.

Do not normalize the following:

- 오동도
- 광양
- 광양 숙소
- 돌산공원
- 버스*(MOVEMENT_EVENT)*
- 자산탑승장 귀환
- 돌산탑승장 귀환

No route ontology. No Gateway/Hub. No V-04 normalization.

---

## N. Lodging Guardrail

`LODGING_DIRECTION = 5/10`

Only explicit lodging evidence counts.

Do not infer lodging from:

- final city
- successor city
- regional movement
- itinerary endpoint

**Canonical reminder:**

`YTC-013: 광양 ≠ 광양 숙박` — successor destination ≠ lodging unless explicitly stated.

---

## O. Analysis Language Rule

Future analysis may use:

- documented alongside
- co-occurs with
- observed together
- within the current sample
- among analyzable cases
- sample-bounded
- missing / not documented

Future analysis may NOT conclude:

| 금지 언어 | 이유 |
|---|---|
| cause / because | causal claim |
| determines / influences | causal claim |
| preference | behavioral generalization |
| typical traveler behavior | behavioral generalization |
| optimal / best / efficient | value judgment |
| recommended / rule / grammar | recommendation logic |

---

## P. Authorized Co-occurrence Analysis Scope

The next analysis may examine only documented coexistence between:

**Structural Variables:** VISIT_TYPE + ONE_WAY_DIRECTION

**Condition Fields:** PREDECESSOR_NODE + SUCCESSOR_NODE + TRAVEL_TYPE + EXPLICIT_VEHICLE_CONTEXT + LODGING_DIRECTION

No additional variable may be introduced without review.

---

## Q. Research Status

| 항목 | 상태 |
|---|---|
| RQ-CABLECAR-CONDITION-001 Extraction | **COMPLETE / PERSISTED** |
| Independent Integrity Review | **PASS WITH MATERIAL MISSINGNESS** |
| Co-occurrence Analysis | **NOT YET EXECUTED** |
| RQ-CABLECAR-CONDITION-001 (whole RQ) | NOT COMPLETE — Analysis step remaining |

---

## R. Research Boundary

| 항목 | 상태 |
|---|---|
| WHY causal explanation | NOT CONCLUDED |
| Route Pattern | NOT CONCLUDED |
| Journey Grammar | NOT CONCLUDED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |
| Recommendation Logic | NOT CREATED |
| Candidate Generated | NO |
| Architecture Decision | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |
| DreamTown Founder Philosophy Candidate | HOLD |

---

*RQ-CABLECAR-CONDITION-001 Source-Stated Condition Extraction V0.1 — 2026-09-26*
