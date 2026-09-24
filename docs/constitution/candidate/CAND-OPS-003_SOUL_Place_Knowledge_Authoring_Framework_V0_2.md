# CAND-OPS-003 — SOUL Place Knowledge Authoring Framework V0.2

**Candidate ID:** CAND-OPS-003  
**Category:** Operations / Framework  
**Title:** SOUL Place Knowledge Authoring Framework  
**Status:** Candidate / Approved  
**Lifecycle:** Idea → Draft → Review → **Approved** → LOCKED  
**Approval Date:** 2026-09-25  
**Approver:** Founder / 대표 푸르미르  
**Approval Evidence:** `docs/constitution/candidate/CAND-OPS-003_FOUNDER_APPROVAL_V0_1.md`  
**Importance:** Level 4  
**생성일:** 2026-09-24 (V0.1)  
**개정일:** 2026-09-25 (V0.2)  
**Origin Places:** Yi Sun-sin Square / Jongpo Marine Park / Hamel Lighthouse / Yeosu Maritime Cable Car  
**Blind Test Place:** 금오도 비렁길 (Fifth Place)  
**Evidence Documents:** (Section 12 참조)

---

## REVISION HISTORY

### V0.2 — 2026-09-25

**Blind Test Result:** BLIND TEST PASS — CANDIDATE REVISION RECOMMENDED

**Final Review Decision:** `docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_FINAL_REVIEW_V0_1.md` (commit: 8777065)

**Revision Requirements Applied:**

| ID | Section Changed | Evidence Artifact |
|---|---|---|
| RR-01 | Section 4 Layer 1 (Official) — 출처 기준 명시 | FA-01 / MR-01 / OE-02 / Dim 2 PARTIAL |
| RR-02 | Section 5 Provenance Principle — OPERATOR_INFERENCE 추가 | FA-02 / MR-02 / OE-01 / Dim 6 PARTIAL |
| RR-03 | Section 6 Stable vs Live — 두 축 분리 원칙 명시 | CORRECTION-02 Layer Note / OE-02 근본 원인 |
| RR-04 | Section 9 Error Prevention — 수치 일반화 방지 규칙 추가 | FA-NI-01 / S5 B "30~50%" / D12 PARTIAL |

**Findings Resolution:**

| Finding | Status | Resolution |
|---|---|---|
| FA-01 | RESOLVED | RR-01: Section 4 Layer 1에 허용 출처 명시 |
| FA-02 | RESOLVED | RR-02: Section 5에 OPERATOR_INFERENCE 공식 Type 추가 |
| FA-NI-01 | RESOLVED | RR-04: Section 9에 수치 일반화 방지 규칙 추가 |
| MR-01 | RESOLVED | RR-01: Official Layer 포함 가능 출처 유형 규정 |
| MR-02 | RESOLVED | RR-02: OPERATOR_INFERENCE = Structural Inference Provenance 규정 |
| MR-03 | RESOLVED | RR-04: Numeric/Quantitative Claim provenance 처리 규정 |

**Preserved V0.1 Evidence:**

V0.1 원문: `CAND-OPS-003_SOUL_Place_Knowledge_Authoring_Framework.md`

Blind Test Artifacts:
- Research: `CAND-OPS-003_BLIND_TEST_GEUMODO_RESEARCH_V0_1.md`
- WE Review: `CAND-OPS-003_BLIND_TEST_GEUMODO_WE_REVIEW_V0_1.md`
- WE Corrections: `CAND-OPS-003_BLIND_TEST_GEUMODO_WE_CORRECTIONS_V0_1.md`
- Founder Review: `CAND-OPS-003_BLIND_TEST_GEUMODO_FOUNDER_V0_1.md`
- DreamTown Comparison: `CAND-OPS-003_BLIND_TEST_GEUMODO_DREAMTOWN_COMPARISON_V0_1.md`
- Utility Protocol: `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_PROTOCOL_V0_1.md`
- A/B Execution: `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_AB_EXECUTION_V0_1.md`
- Blind Package: `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_BLIND_PACKAGE_V0_1.md`
- Blind Evaluation: `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_BLIND_EVALUATION_V0_1.md`
- Unblinding: `CAND-OPS-003_BLIND_TEST_GEUMODO_SOUL_UTILITY_UNBLINDING_V0_1.md`
- Final Review: `CAND-OPS-003_BLIND_TEST_FINAL_REVIEW_V0_1.md`

**Scope of Revision:** Minimum. V0.1 핵심 구조 재설계 없음. RR-01~04만 반영.

---

## PROMOTION BOUNDARY

```
Candidate ≠ Approved ≠ SSOT ≠ LOCKED
```

이 문서는 Draft 상태다. 다음을 수행하지 않는다:
- SSOT 승격
- Approved / LOCKED 처리
- Constitution 변경
- DreamTown-wide Founder Philosophy Candidate 생성
- DB / Schema / Migration / Runtime / Production

---

## 1. Purpose

> SOUL이 장소에 대해 단순히 많은 정보를 수집하는 것이 아니라, 서로 다른 종류의 지식을 출처와 역할에 따라 분리하여 작성하고, 여행자의 상황에 맞게 안전하게 조합할 수 있도록 하는 반복 가능한 Place Knowledge Authoring Framework를 정의한다.

이 Framework의 목적:

- 사실과 경험을 섞지 않는 것
- 경험과 Founder 의도를 섞지 않는 것
- Founder 의도와 DreamTown 철학을 자동 동일시하지 않는 것
- Stable과 Live를 구분하는 것
- Place와 Route를 구분하는 것
- 최종적으로 SOUL이 여행자의 현재 상황에 맞게 자연스럽게 조합할 수 있는 지식을 만드는 것

---

## 2. Background

**Origin Problem:**

SOUL이 장소별 질문에 충분히 깊게 답하지 못하고 일반적인 여행 계획 답변으로 후퇴하는 문제가 있었다.

**Pilot Hypothesis:**

문제는 LLM의 문장력보다 `Yeosu local knowledge depth + relationship knowledge + provenance` 부족일 가능성이 높았다.

**Pilot Response:**

장소별로 Official / World Experience / Founder / DreamTown / SOUL Layer를 분리하여 Authoring Pilot을 수행했다.

4개 장소를 거치며 동일한 역할 분리가 반복되고 실제 Knowledge Boundary 오류를 방지했다.

**Blind Test (V0.2 기반):**

금오도 비렁길(Fifth Place)을 사용한 독립 Blind Test에서 새 Operator가 CAND-OPS-003만으로 Framework를 재현했다. SOUL Utility A/B Test 6개 시나리오 중 5개에서 Framework Knowledge가 Material Improvement를 보였다. Critical Failure 0건. Blind Test PASS — Revision Required.

---

## 3. Core Definition

> **SOUL Place Knowledge Authoring Framework는 장소의 공식 사실, 사람들이 실제로 경험하는 방식, Founder의 현장 지식과 의도, DreamTown의 감정적 의미를 서로 독립적인 Knowledge Layer로 보존한 뒤, SOUL이 여행자의 현재 상황에 맞게 필요한 층만 조합하도록 만드는 지식 작성 방식이다.**

**Short Form:**

> Separate the knowledge first. Compose it only when the traveler needs it.

**한국어 Working Phrase:**

> 지식은 먼저 분리해서 정확하게 저장하고, 여행자에게 말할 때 비로소 자연스럽게 연결한다.

---

## 4. Authoring Layers

### Layer 1 — Official

**Role:** Factual Skeleton

포함:
- identity / official location
- official facility information
- stable historical facts
- officially confirmed rules

포함하지 않는 것:
- traveler emotion
- recommendation
- Founder philosophy
- volatile information without current verification

**Principle:** `Official tells us what the place is.`

---

**[RR-01] Official Layer 허용 출처 기준 — V0.2 추가**

Official Layer는 다음 출처에서만 채워진다:

```
허용:
- 정부 / 공공기관 공식 발행 정보 (여수시, 한국관광공사, 국립공원공단 등)
- 관리 주체 공식 안내 (시설 운영자, 공식 홈페이지)
- 학술 / 법적으로 확인된 사실
```

```
불허:
- 언론 기사 / 블로그 / 개인 후기 (출처가 World Experience임)
- Operator의 구조적 추론 (출처가 OPERATOR_INFERENCE임)
- 공식처럼 보이더라도 공식 기관 원문이 아닌 2차 인용
```

물리적으로 안정적인(STABLE) 사실이라도 WE 출처(블로그, 기사, 후기)에서 나온 관찰은 **World Experience Layer에 기록하고, Stable 분류를 별도 표기한다**.

이유: Stable/Live는 시간적 휘발성 분류이며, Official/WE는 출처 유형 분류이다. 이 두 축은 독립적이다 (Section 6 참조).

---

### Layer 2 — World Experience

**Role:** How people actually experience the place

포함 반복 패턴:
- behavior / sequence / friction
- emotion / expectation / disappointment
- time-of-day difference / companion difference
- actual Journey usage

**Important:** `World Experience = Knowledge Input` — NOT Truth Source

**Principle:** `World Experience tells us how the place is lived.`

---

### Layer 3 — Founder

분리 적용:
- **Founder Local:** current local reality / corrections / observations
- **Founder Intent:** why the experience matters / intended meaning
- **Founder Philosophy Evidence:** broader philosophical patterns

**Important:**
- `Founder Local ≠ Official`
- `Founder Intent ≠ World Experience`

**Principle:** `Founder tells us what local reality may be missing and why the experience is worth offering.`

---

### Layer 4 — DreamTown

**Role:** Emotional Meaning

포함:
- place emotional role
- route emotional role
- existing SSOT meaning
- narrative continuity

**Important:** DreamTown을 World Experience 조사에 정답으로 주입하지 않는다.

**Principle:** `DreamTown tells us what the experience means inside the emotional journey.`

---

### Layer 5 — SOUL

**Role:** Contextual Composition

SOUL은 Layer 구조를 여행자에게 노출하지 않는다.

조합 기준:
- person / current place / time / companion
- energy / weather / desire / practical constraints

**Working Formula:**

```
Person + Place + Time + Companion + Energy + Weather + Desire
  → Contextual Place / Route Recommendation
```

**Principle:** `SOUL tells the traveler only what helps now.`

---

## 5. Provenance Principle

Core Governance:

```
OFFICIAL ≠ WORLD_EXPERIENCE
WORLD_EXPERIENCE ≠ FOUNDER
FOUNDER ≠ DREAMTOWN
DREAMTOWN ≠ SOUL_INTERPRETATION
POSSIBLE CONTINUITY ≠ VALIDATION
FOUNDER_LOCAL ≠ OFFICIAL
TEAM_SYNTHESIS ≠ SOURCE FACT
STABLE ≠ OFFICIAL  (V0.2 추가 — Section 6 참조)
```

Framework는 Composition 시점까지 Provenance를 보존한다.

---

**[RR-02] Provenance Type 목록 — V0.2 추가**

Knowledge 항목을 기록할 때 다음 Provenance Type 중 하나를 명시한다.

| Provenance Type | 정의 |
|---|---|
| `OFFICIAL` | 공식 기관 / 관리 주체 원문에서 직접 확인된 사실 |
| `WORLD_EXPERIENCE` | 여행자 후기 / 블로그 / 언론 기사 등 실제 경험 출처 |
| `FOUNDER_LOCAL` | Founder의 현장 관찰 / 현지 지식 / 운영 정보 |
| `FOUNDER_INTENT` | Founder가 소원이에게 의도한 경험의 의미 |
| `FOUNDER_PHILOSOPHY_EVIDENCE` | 반복 확인된 Founder 철학 수준의 패턴 |
| `DREAMTOWN` | DreamTown SSOT에서 승인된 감정 역할 / 의미 |
| `OPERATOR_INFERENCE` | (아래 참조) |
| `VERIFY_REQUIRED` | 출처 불명 / 상충 / 현장 확인 필요 |
| `LIVE_CHECK` | 방문 당일 반드시 확인 필요한 변동 정보 |

---

**OPERATOR_INFERENCE — 정의 (RR-02)**

```
정의:
Operator가 알려진 구조적 사실에서 논리적으로 추론하였으나
외부 출처가 해당 결론을 직접 확인하지 않은 경우.

사용 예:
- "절벽 트레일 구조이므로 유모차 이동 불가" — 공식 확인 없는 구조적 판단
- 안전 특성에 대한 Operator 종합 판단
- 여러 장소 Entity 관계에 대한 Operator 구조 분석

필수 기록 항목:
- 추론 내용 (inference statement)
- 지지하는 Evidence (supporting evidence)
- 신뢰도 또는 강도 (confidence or strength)
- 미해소 대안이 있다면 함께 기록 (unresolved alternative)

OPERATOR_INFERENCE 항목은 나중에 공식 출처나 WE Evidence로
대체 또는 보완되어야 한다.

OPERATOR_INFERENCE를 Official Fact나 World Experience Claim으로
위장하지 않는다.
```

Operator inference를 금지하지 않는다. 대신 반드시 가시화한다.

---

## 6. Stable vs Live Principle

SOUL은 Stable Knowledge를 깊이 알고 있다가, Live Knowledge는 필요할 때 확인한다.

### Stable Examples
- place identity / experiential character
- common behavior / emotional role
- route relationship / recurring friction

### Live Examples
- today's operating hours / current ticket price
- parking conditions / current events
- weather / wind / closure / transport disruption

**Core Principle:**

> SOUL은 여수를 많이 검색하는 AI가 아니라, 여수를 깊이 알고 있다가 바뀌는 것만 확인하는 여행친구다.

**Status:** `CANDIDATE PRINCIPLE`

---

**[RR-03] Stable/Live 축과 Provenance 축 분리 원칙 — V0.2 추가**

```
두 축은 독립적이다:

Axis A — Provenance (출처 유형):
  OFFICIAL / WORLD_EXPERIENCE / FOUNDER_LOCAL /
  FOUNDER_INTENT / DREAMTOWN / OPERATOR_INFERENCE /
  VERIFY_REQUIRED / LIVE_CHECK

Axis B — Volatility (시간적 휘발성):
  STABLE / LIVE / VERIFY / UNKNOWN
```

**유효한 조합 예시:**

| Provenance | Volatility | 의미 |
|---|---|---|
| WORLD_EXPERIENCE | STABLE | 현장에서 관찰된 물리적으로 안정된 사실 (예: 추락 경고판, 미끄러운 경사) |
| OFFICIAL | LIVE | 공식 기관 발행이나 수시 변경 가능 (예: 공식 운임, 공식 운항 시간표) |
| WORLD_EXPERIENCE | LIVE | 현장 관찰된 변동 정보 (예: 성수기 여객선 매진 경험) |
| OFFICIAL | STABLE | 장기간 변하지 않는 공식 사실 (예: 장소 위치, 코스 구조) |
| OPERATOR_INFERENCE | STABLE | 구조에서 추론된 안정된 특성 (예: 유모차 불가) |

**오해 방지:**

```
STABLE ≠ OFFICIAL
WE + STABLE = 가능하다 (모순이 아니다)
OFFICIAL 이라도 LIVE일 수 있다
```

이전 단일 축 오독 패턴:
> "STABLE이면 Official Layer에 배치할 수 있다" — **잘못됨**

올바른 사용:
> "STABLE이지만 WE 출처이면 World Experience Layer + Stable 표기"

---

## 7. Place vs Route vs Movement

Pilot에서 Place Knowledge만으로는 불충분함이 확인되었다.

| Knowledge Type | 질문 유형 |
|---|---|
| Place | "이 장소는 어떤 곳인가?" |
| Route / Relationship | "이 장소들이 어떻게 연결되는가?" |
| Movement Experience | "장소 사이를 이동하는 경험 자체는 어떤가?" |

Cable Car에서 첫 강한 Movement Experience 사례 발생:

```
Place → Movement Experience → Place
```

금오도 비렁길(Fifth Place)에서 추가 확인:

```
Island (금오도) + Trail System (Route) + 5 Courses
+ 6 intermediate Villages (Place)
+ Ferry Access (Live-constrained Movement Entry)
+ Physical trail as Movement Experience
```

Framework는 Schema 변경 없이 이를 수용했다.

**Status:** `CONCEPTUAL FRAMEWORK` — Schema 아님

---

## 8. Situation Knowledge

동일한 장소도 여행자 상황에 따라 다른 Recommendation이 필요하다.

Recommendation Context 예시:
- companion type (solo / couple / children / parents / elderly)
- physical (stroller / wheelchair / fear of heights)
- current state (tired / hungry / time pressure)
- preference (weather / crowd tolerance / budget)
- desire

**Principle:**

> Place Knowledge becomes useful Recommendation Knowledge only when combined with traveler situation.

**Status:** `CANDIDATE PRINCIPLE`

---

## 9. Error Prevention

Framework는 다음 실제 오류를 방지하기 위해 존재한다.

| Error | 설명 |
|---|---|
| Error 1 | Popular/repeated claim → Official Fact |
| Error 2 | Founder belief → traveler consensus |
| Error 3 | DreamTown meaning → externally observed emotion |
| Error 4 | Current operational information → permanent Stable Knowledge |
| Error 5 | Nearby places → same entity (silent alias) |
| Error 6 | Route distance → place dimension |
| Error 7 | Interpretation → evidence |
| Error 8 | Recommendation → fact |
| **Error 9** | **WE case-level numeric → universal range (V0.2 추가)** |

Candidate 승인 근거: 반복뿐 아니라 **실제 오류 방지 효과** 확인.

---

**[RR-04] 수치/정량 데이터 처리 원칙 — V0.2 추가**

World Experience Frictions에서 관찰된 수치 데이터를 SOUL이 사용할 때 적용한다.

```
케이스 단위 표현 권장:
  "1코스에서 공식 2시간보다 1시간 더 걸렸다는 후기가 있다"
  → OPERATOR_INFERENCE + supporting Evidence 명시

범위 합성 주의:
  여러 케이스 수치를 "30~50%"처럼 범위로 합성할 경우
  해당 범위를 직접 지지하는 Evidence가 있는지 확인 필요.
  없다면 OPERATOR_INFERENCE 표기 후 Evidence 한계 명시.

방향성 표현 안전:
  "실제로는 더 걸리는 경우가 많다"
  → 범위 없이 방향만 표현하면 Evidence 과일반화 방지

단일 케이스 일반화 금지:
  1코스 케이스를 전체 5코스에 일반화하지 않는다.

Evidence가 그 범위를 직접 지지하는지 확인 기준:
  - 직접 Source가 제시한 수치 → 명시 가능
  - 단일 사례 수치 → 케이스로만 표현
  - 여러 Source에서 반복된 방향 → 방향만 표현
  - Operator가 여러 사례를 합성한 범위 → OPERATOR_INFERENCE 명시
```

Blind Test Evidence: S5 Condition B "30~50% 더 걸리는 경우도 자주 있어요" — D12 PARTIAL (FA-NI-01).

---

## 10. What This Framework Is NOT

명시적 제외:

- NOT a database schema
- NOT a table design
- NOT a runtime architecture
- NOT a recommendation algorithm
- NOT an LLM prompt only
- NOT a tourism content template
- NOT a requirement that every place receives equal research depth

Core places: `Deep Knowledge`  
Other places: `Discovery Knowledge`

Depth는 traveler value와 project relevance에 따른다.

---

## 11. Good / Bad Example

### Good Structure

**Question:** `하멜등대 가볼 만해?`

Bad authoring: "하멜등대는 희망과 회복을 느끼는 명소이며 사람들이 그곳에서 희망을 얻습니다."

→ 문제: DreamTown/Founder 의미가 일반 여행자 사실로 전환됨.

Good authoring structure:
- Official → 장소가 어디에 무엇인지
- World Experience → 빨간 등대까지 걷기, 도착, 멈춤, 바다/조망
- Founder → 소원이가 그 자리에 잠시 머물기를 바라는 이유
- DreamTown → 희망/회복의 감정적 역할
- SOUL → 이 여행자에게 필요한 Layer만 조합

---

### Bad Example

**Question:** `종포해양공원에서 낚시해도 돼?`

Bad: 블로그/후기 사용하여 낚시 추천.

Correct Framework behavior:
- 충돌하는 외부 경험 감지
- 현재 규정 미확인
- `VERIFY_REQUIRED` 표시
- 검증 전 낚시 추천 금지

→ `knowledge depth includes knowing what not to claim.`

---

### V0.2 추가 예시 (RR-02 / RR-04)

**Question:** `비렁길 유모차 가지고 갈 수 있어?`

Bad: "visitkorea에 따르면 유모차 불가능합니다." (visitkorea 원문이 유모차를 명시했는지 확인 없이 Official 출처로 처리)

Better V0.2 behavior:
```
공식 확인: visitkorea — 유모차 불가능 (OFFICIAL + STABLE)
→ Official에 직접 명시된 경우 Official 표기 가능

공식 미확인 구조 추론:
  판정: 불가
  Provenance: OPERATOR_INFERENCE
  추론 근거: 절벽 트레일 + 좁은 폭 + 경사 구간 구조
  Supporting Evidence: Section 2.3 코스 구조 (OFFICIAL)
  Confidence: HIGH (공식 출처 visitkorea의 접근성 불가 정보와 일치)
  Note: OPERATOR_INFERENCE로 표기하나, Official 확인 사실과 일치함
```

**Question:** `비렁길 공식 소요시간보다 얼마나 더 걸려?`

Bad V0.1 style: "실제로는 30~50% 더 걸린다." (Evidence 불충분 범위)

Better V0.2 behavior:
```
케이스 단위 표현: "1코스는 공식 2시간보다 1시간 정도 더 걸렸다는 후기가 있어요."
방향성 표현: "대부분의 후기에서 공식 소요시간보다 더 걸린다고 해요."
범위 합성 시: OPERATOR_INFERENCE 명시 + supporting cases 나열
```

---

## 12. Pilot Evidence

| # | Place | place_code | Key Contribution | Document |
|---|---|---|---|---|
| 1 | 이순신광장 | lee_soon_shin_plaza | Connection Knowledge | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_LEE_SOON_SHIN_PLAZA_V0_1.md` |
| 2 | 종포해양공원 | marine_park | Place/Route/Entity Boundary | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_MARINE_PARK_V0_1.md` |
| 3 | 하멜등대 | hamel_lighthouse | Experience ↔ Founder/DreamTown separation | WE: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_WE_V0_1.md` / Founder: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_FOUNDER_V0_1.md` |
| 4 | 여수해상케이블카 | cablecar | Place+Movement+Route / Situation Knowledge | WE: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` / Founder: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` |
| **5** | **금오도 비렁길** | geumodo_bireong | **Blind Test / Island+Route+Live / Utility A/B** | `docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_GEUMODO_RESEARCH_V0_1.md` (+ 연관 Artifacts) |

### Candidate Readiness Decision Basis

**A. Repetition:** 서로 다른 성격의 5개 장소에서 Framework 작동 확인. Blind Test(금오도) 추가.

**B. Knowledge Boundary Protection:** 9가지 실제 오류 유형 방지 확인 (Error 9 추가).

**C. Cross-Place Reusability:** 광장(연결) / 해안공원(머무름) / 등대(도착·전환) / 케이블카(이동+경험) / **비렁길(섬+장거리 트레일+Live 제약)** — 유형 다변화에도 Framework 수용.

**D. Practical Knowledge Quality:** 단순 POI Fact를 넘어 lived experience / emotion / relationship / situation / Founder intent / volatile boundary까지 분리 작성 가능.

**E. SOUL Utility (V0.2 추가):** 금오도 Blind Test 6개 시나리오 중 5개 Material Improvement. CF-U1~U7 0건. Runtime 미사용 한계 있음.

---

## 13. Applications

| Application | Description |
|---|---|
| SOUL | Place/Route/Situation answer authoring |
| DreamTown | 감정 의미 보존 (외부 Evidence 오염 방지) |
| Yeosu Knowledge Base | Stable/experiential/relational/live knowledge 분리 |
| Research | Provenance 경계 명확화 |
| Founder Review | Local knowledge + intent를 Official Fact로 전환하지 않고 보존 |
| Future Locations | 반복 가능한 authoring workflow — Yeosu 이후 확장 가능성 |
| Runtime / Retrieval | **미래 작업** — 이 Candidate에서 검증되지 않음 |

---

## 14. Promotion Criteria

SSOT 직접 승격 금지. Review에서 다음을 확인한다:

1. 새 운영자가 원 대화 없이 Framework 사용 가능한가?
2. 다섯 번째 장소를 이 Framework로 작성할 수 있는가? **→ Blind Test PASS (금오도)**
3. Provenance가 명확하게 유지되는가?
4. Stable / Live를 일관되게 분리할 수 있는가?
5. Place / Route / Movement를 구분할 수 있는가?
6. 알려진 Pilot 오류를 방지하는가?
7. Framework 적용 시 SOUL 답변 품질이 향상되는가? **→ 5/6 시나리오 Material Improvement (단일 장소 한계)**
8. 불필요하게 무거운 단계가 있는가?
9. SSOT와 Operations Guide의 경계는 어디인가?
10. Yeosu 이외에서도 Framework가 유효한가?

특히 `Runtime answer quality improvement`는 현재 미증명 — `PROMOTION EVIDENCE NEEDED`.

---

## 15. Promotion Hold — DreamTown Philosophy

다음 반복 Evidence는 존재한다:
- 혼자가 아님
- 작은 희망
- 다시 나아감
- 삶으로 돌아감
- 삶 속에 있되 삶에 매이지 않음
- 자기 속도 (금오도 Founder Evidence — 3개 장소 반복)
- 뒤돌아봄 (금오도 Founder Evidence — 반복)

**Status:** `REPEATED FOUNDER PHILOSOPHY EVIDENCE — HOLD`

이 작업에서 Philosophy Candidate 생성 금지.

Knowledge Authoring Framework와 DreamTown 철학은 별도 Candidate Family.

---

## 16. Project Impact

**Working Assessment:** `90 / 100`

영향 대상:
- SOUL knowledge quality
- research process / provenance
- authoring workflow
- future location expansion
- handover continuity

**Knowledge Value:** ★★★★★

Note: Candidate metadata — objective performance score 아님.

---

## 17. Open Items

### Open (V0.2 이후)
- SOUL Runtime 실제 연동 검증
- 여수 외 장소에서 Framework 적용 가능성
- 2개 이상 독립 Operator Blind Test (재현성 추가 검증)
- SSOT 범위와 Operations Guide 경계
- RL-01/02/03/04 Research Gap (현장 확인 없이 해소 불가)

### Resolved (V0.2)
- FA-01 / MR-01: Official Layer 출처 기준 — **RESOLVED (RR-01)**
- FA-02 / MR-02: OPERATOR_INFERENCE Provenance Type — **RESOLVED (RR-02)**
- FA-NI-01 / MR-03: Numeric/Quantitative Claim 처리 — **RESOLVED (RR-04)**
- Stable/Live × Provenance 두 축 분리 — **RESOLVED (RR-03)**

### Hold
- SSOT promotion
- Approved / LOCKED
- DreamTown Philosophy Candidate
- DB/Schema implementation
- place_knowledge migration
- Production application

---

## 18. RR Self-Check (V0.2)

| RR | Requirement | Changed Section | Verification |
|---|---|---|---|
| RR-01 | Official Layer 출처 기준 명시 | Section 4 Layer 1 | "허용/불허" 목록 추가됨. WE + STABLE 조합 허용 설명 포함. FA-01/MR-01 해소. |
| RR-02 | OPERATOR_INFERENCE 공식 Type 추가 | Section 5 Provenance Type 표 + 정의 | Type 표 9개 항목에 OPERATOR_INFERENCE 포함. 정의 / 사용 예 / 필수 기록 항목 명시. FA-02/MR-02 해소. |
| RR-03 | Stable/Live 축과 Provenance 축 명시적 분리 | Section 6 신규 블록 | Two-Axis 표 추가. 유효한 조합 예시 4가지. "STABLE ≠ OFFICIAL" 명시. RR-03 해소. |
| RR-04 | 수치 일반화 방지 규칙 | Section 9 Error 9 + 수치 처리 원칙 블록 | Error 9 추가. 케이스 표현/범위 합성 주의/방향성 표현/단일 케이스 일반화 금지 규칙 명시. FA-NI-01/MR-03 해소. |

이 Self-Check는 내용 누락 확인이다. Candidate Approval이 아니다.
