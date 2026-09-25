# Phoenix Travel Intelligence Research Direction Handover V0.1

**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Status:** RESEARCH DIRECTION / HANDOVER — NOT SSOT / NOT CANDIDATE  
**Purpose:** Founder–Lumi 대화에서 도출된 연구 방향을 소실하지 않고 고정. 다음 담당자가 동일한 판단 위치에서 재개 가능하도록 한다.

이 문서는 새로운 SSOT, Candidate, Architecture 변경을 승인하지 않는다.

---

## 0. Continuity Check

| 항목 | 상태 |
|---|---|
| Branch | staging/storybook-c7a |
| Previous Checkpoint (지시서 기준) | 5ec6378 |
| **Actual Remote HEAD** | **9927f60** (RB-03 Field Evidence — 5ec6378 이후 3개 commit 추가) |
| Confirmed 항목 재조사 | NO |

**Actual HEAD가 지시서 기준보다 앞서 있음 — 실제 최신 상태를 기준으로 한다.**

Unchanged Governance:

| 항목 | 상태 |
|---|---|
| CAND-OPS-003 | Candidate / Approved (2026-09-25) |
| place_knowledge migration | NOT APPROVED / HOLD |
| DreamTown Founder Philosophy Candidate | HOLD |
| runtime / production / DB / schema 변경 | PROHIBITED |
| Travel Mental Map / Travel Grammar | 아직 Candidate 아님 |

---

## 1. Origin Problem

SOUL이 장소별 정보를 보유해도 실제 여행자 질문에 답하기 위해 부족했던 것들:

- 장소와 장소의 관계
- 실제 이동시간 (이동수단별 차이 포함)
- 체류시간
- 식사와 숙박의 시간 구조
- 차량 위치
- 동행자 / 체력 / 남은 시간 / 날씨 / 운영 상태
- 다음 목적지
- 여행자가 원하는 경험

결론: **Place Knowledge만으로는 "현지 여행전문가처럼 판단하는 SOUL"을 만들기 어렵다.**

이 문제의식에서 Travel Intelligence 연구가 시작되었다.

---

## 2. Research Hypothesis — Regional Mental Map

**Status: HYPOTHESIS / NOT CANDIDATE**

Working Hypothesis:

> 실제 여행 일정과 현장 운영 경험을 분석하면 장소를 하나씩 독립적으로 조사하는 것보다 빠르게 지역의 시간·공간 관계를 학습할 수 있으며, 이를 통해 SOUL의 Regional Mental Map 골격을 구축할 수 있다.

Working Structure:

```
Place → Relationship → Travel Time → Stay Time → Travel Friction
  → Traveler Condition → Choice
```

Mental Map은 단순 좌표 지도가 아닌 시간·공간 여행지도:

- Place / Edge / 이동수단 / 이동시간 / 체류시간
- 식사시간 / 숙박 / Route sequence / 차량 위치
- Travel friction / Branch / alternative
- Live variables / Traveler conditions

---

## 3. Key Discovery — Travel Schedule Corpus

**Status: HYPOTHESIS / NOT CANDIDATE**

Founder 제안 핵심 Research Input:

> **실제 여행사의 단체 일정표와 개인 여행 일정**

여행 일정표 = 사람이 실제 여행을 운영하기 위해 압축해 놓은 자료.

잠재적으로 포함된 정보:

- 반복 관광지 / 반복 Place→Place Edge
- 이동시간 / 체류시간 / 식사시간 / 숙박 위치
- 하루에 현실적으로 방문 가능한 장소 수
- 여행 순서 / 출발·도착 Hub / 주변지역 연결
- Group vs Individual travel pattern
- 운영상 buffer/slack

추출 가설:

```
Travel Schedule Corpus
  → Place Frequency
  → Edge Frequency
  → Travel-Time Pattern
  → Stay-Time Pattern
  → Meal/Sleep Pattern
  → Group vs Individual Difference
  → Regional Connection
```

**IMPORTANT — 주의사항:**

- Travel Agency Schedule은 Truth Source가 아님 (Source Type: `ROUTE / TIME EVIDENCE`)
- package convenience / 제휴 식당·쇼핑 포함 가능
- 오래된 일정일 수 있음
- group movement buffer 포함 가능
- timestamp 차이 ≠ pure driving time
- 단체 패턴을 개인 여행자에게 그대로 일반화 금지

---

## 4. Evidence Layers

현재 연구 가설에서 고려하는 Knowledge Input 계층:

| Layer | 내용 | 역할 |
|---|---|---|
| Travel Agency Schedule | 단체 여행 운영 가능한 Route/Time 구조 | Frequency / Pattern |
| Individual Travel Experience | 자차·도보·대중교통·커플·가족·혼행 등 | Individual Pattern |
| World / Official Evidence | Entity, geography, map, transportation, facts | Skeleton + Verification |
| Local Operator Evidence | 여수앤썸 등 — 실제 이동, 버스 경로, 현장 보정 | Ground truth correction |
| Founder Local / Founder Review | 검색과 현장의 차이, 오래된 정보, 실제 경험 | Final review |
| DreamTown | 여행 경험의 의미와 감정적 역할 | Emotional context |
| SOUL | 현재 여행자 상황에 맞는 조합 | Delivery |

---

## 5. Research Hypothesis — Expert Judgment Corpus

**Status: HYPOTHESIS / NOT CANDIDATE**

일정 자체보다 **"왜 그 일정을 선택했는가"**를 연구한다.

예: `Hamel → Cable Car` Edge가 존재한다는 것 + 이유:

- 왜 이 순서인가?
- 누구에게 좋은가?
- 어떤 조건에서는 좋지 않은가?
- 차량 위치가 바뀌면 어떻게 되는가?
- 단체와 개인은 왜 다르게 움직이는가?
- 시간이 부족하면 어떤 선택이 사라지는가?
- 날씨가 바뀌면 어떤 선택이 달라지는가?

Working Concept: `Schedule → Decision Rationale`

Long-term Hypothesis:

> SOUL의 차별화는 여행 일정을 많이 보유하는 것이 아니라, 지역 여행전문가가 왜 특정 선택을 하는지에 대한 **Judgment Corpus**를 축적하는 데 있을 수 있다.

---

## 6. Research Hypothesis — Counterfactual Travel Knowledge

**Status: HYPOTHESIS / NOT CANDIDATE**

좋은 여행 일정만 연구해서는 전문가 판단을 충분히 학습할 수 없다는 가설.

연구 질문:

- 왜 A→B를 선택했는가? 왜 A→C는 선택하지 않았는가?
- 어떤 조건에서 이 일정은 실패하는가?
- 지도상 가까운데 왜 실제 여행에서는 좋지 않은가?
- 어떤 순서는 어린이/고령자/단체/자차 여행에서 문제가 되는가?

Working Concept: `Good Journey + Bad Journey + Why`  
Working Name: `Counterfactual Travel Knowledge` — 아직 정식 Architecture 용어로 승인하지 않는다.

---

## 7. Research Hypothesis — Traveler State Transition

**Status: HYPOTHESIS / NOT CANDIDATE**

DreamTown 감정 구조를 여행자의 상태 변화와 연결할 가능성 연구.

Traveler State 예:

- current location / remaining time / transport / vehicle location
- companion / energy / weather / desire / emotional state

Working Structure:

```
Current Traveler State
  → Place / Route Choice
  → Experience
  → Next Traveler State
```

연구 질문:

> "이 여행자에게 지금 어떤 장소가 인기 있는가?"가 아니라
> "이 여행자가 지금 어떤 경험을 거치면 다음 상태로 자연스럽게 이동할 수 있는가?"

DreamTown 철학을 자동으로 Recommendation Logic으로 승격하지 않는다.

---

## 8. Research Hypothesis — Evidence Confidence

**Status: HYPOTHESIS / NOT CANDIDATE (기존 CAND-OPS-003 원칙 유지)**

SOUL이 모든 Knowledge를 같은 확신도로 취급해서는 안 된다.

| Evidence Type | 예시 |
|---|---|
| Official verified | 공식 사이트 직접 확인 |
| Repeated Travel Schedule | 복수 일정에서 반복 확인 |
| World Experience | 여행자 경험 패턴 |
| Local Operator | 현장 운영자 직접 확인 |
| Founder Local | Founder 현장 경험 |
| OPERATOR_INFERENCE | 지지 Evidence 기반 추론 |
| Live | 실시간 확인 필요 |
| VERIFY_REQUIRED | 미검증 |

Provenance와 Volatility는 독립 축이다.

SOUL 장기 목표:

```
내가 충분히 알고 있는 것
  vs 추정하는 것
  vs 지금 확인해야 하는 것
```

의 구별.

---

## 9. Research Hypothesis — Travel Grammar

**Status: HYPOTHESIS / NOT CANDIDATE**

Founder–Lumi 대화에서 등장한 연구 질문:

> **"여행에는 보이지 않는 문법이 존재하는가?"**

예시 가설 Sequence (설명용 — 실제 Travel Grammar로 확정하지 않음):

```
Arrival → Orientation → Anchor Experience → Meal
  → Expansion → Rest → Highlight → Return
```

검증할 질문:

- 단체여행에 반복되는 문법이 존재하는가?
- 개인여행의 문법은 다른가? 가족/커플/혼행별 차이?
- 지역마다 Travel Grammar가 다른가?
- 시간대별 문법이 존재하는가?
- 1박2일과 2박3일은 다른 구조인가?
- Regional Extension에는 별도 패턴이 존재하는가?

**Working Distinction:**

| 개념 | 내용 |
|---|---|
| Travel Mental Map | 어디와 어디가 어떻게 연결되는가 |
| Travel Grammar | 왜 지금 이 조건에서 그 연결을 선택하는가 |

---

## 10. Long-Term Hypothesis — World Travel Mental Map

**Status: HYPOTHESIS / NOT CANDIDATE (여수 Pilot 성공 후에만 검토)**

```
Place Graph → City Travel Map → Regional Travel Map
  → Country Travel Map → World Travel Map
```

핵심 가설:

> 지역별 Mental Map을 동일한 Knowledge Acquisition Method로 구축하고 연결할 수 있다면, 장기적으로 "사람이 실제로 세계를 여행하는 방식"을 이해하는 Travel Knowledge Network로 확장 가능하다.

현재: Vision / Research Hypothesis만. 세계 최초 / 검증된 Framework로 표현하지 않는다.

---

## 11. Phoenix Differentiation Hypothesis

**Status: HYPOTHESIS / NOT CANDIDATE**

현재 가장 중요한 차별화 연구축:

```
World Travel Mental Map
  × Travel Grammar
  × Local Expert Judgment
  × Traveler State
```

추가 가능 요소:

- Counterfactual Knowledge
- Evidence Confidence
- Live Verification
- DreamTown emotional context

Working Core Question:

> "어디에 무엇이 있는지를 아는 AI"를 넘어
> "왜 지금 이 여행자에게 이 길을 권해야 하는지를 아는 AI"를 만들 수 있는가?

DreamTown Extension:

> 어디로 가야 하는지만 판단하는 것이 아니라, 그 여행자가 지금 어떤 경험을 필요로 하는지까지 이해할 수 있는가?

---

## 12. Phoenix Operating Philosophy

Founder 표현:

> 소원이에게는 추천이 자연스럽게 만들어지는 것처럼 보여도, Phoenix 내부에서는 그 추천 하나를 위해 선택을 분해하고, 왜 그런 선택이 이루어지는지, 어떤 보이지 않는 규칙이 존재하는지를 연구한다.

Working Principle:

> **복잡성은 Phoenix가 감당하고, 소원이에게는 편안함만 전달한다.**

Possible Desired SOUL Experience:

> "많이 알아서 똑똑한 AI"가 아니라 "같이 여행하면 이상하게 편한 여행친구."

아직 Brand SSOT로 승격하지 않는다.

---

## 13. Three Perspectives

### ① 세계는 어디로 가고 있는가

현재 세계 여행 AI/플랫폼 흐름:

```
World/Place Data → Personal Context → Recommendation/Itinerary
  → Live Update → Agentic Action
```

Knowledge Graph, context-aware recommendation, personalization, real-time travel data, itinerary generation, agentic travel 등이 주요 흐름.

단순히 AI itinerary / Knowledge Graph / personalization / emotional recommendation / live data 각각만으로 독창성 주장 금지.

### ② Phoenix가 배워야 할 것

세계가 잘하는 Maps / Search / Live Data / Booking / Routing / Personalization은 적극 활용. Phoenix가 자체적으로 더 좋은 지도/검색엔진을 만드는 것이 목표가 아니다.

### ③ 우리의 독창성 연구 방향

> 실제 여행을 분해하여 지역 전문가의 보이지 않는 판단 규칙을 발견하고, Local Evidence와 여행자 상태를 결합하여 다음 여행자를 위한 판단 Knowledge로 축적하는 것.

현재 **Differentiation Hypothesis**이며 검증된 독창성으로 표현하지 않는다.

---

## 14. Long-Term Hypothesis — Learning Loop

**Status: FUTURE RESEARCH ONLY**

```
SOUL Recommendation
  → Traveler Choice
  → Actual Movement / Actual Stay
  → Satisfaction / Fatigue / Change
  → Knowledge Correction
```

SOUL이 여행자를 도울수록 지역을 더 잘 이해하게 되는 Learning Loop.

현재: Future Research. 구현/수집/개인정보 Architecture 승인하지 않는다.

---

## 15. Immediate Research Experiment

**Working Title:** `Yeosu Travel Schedule Corpus Pilot V0.1`

**Purpose:**

> 실제 여수 여행 일정의 작은 Corpus를 분석했을 때 Regional Mental Map과 Travel Grammar의 초기 패턴이 실제로 나타나는지 검증한다.

**Constraint:** 첫 Pilot에서는 Architecture/DB/runtime/schema 변경하지 않는다. Research only.

**Suggested Corpus:**

- 여수 단체 1박2일
- 여수 단체 2박3일
- 개인 1박2일
- 개인 2박3일
- (필요 시) 여수 + 순천/광양/고흥 등 주변지역 포함 일정

초기에는 exhaustive crawl보다 다양한 source의 작은 sample로 시작.

**각 일정에서 추출할 항목 (가능한 범위 내):**

| 항목 | 비고 |
|---|---|
| Source | URL / 제공자 |
| Provider / Author | 여행사명, 블로그 등 |
| Schedule date / freshness | 일정 날짜 또는 게시일 |
| Trip type | 단체/개인/가족/커플 등 |
| Duration | 1박2일/2박3일 등 |
| Transport mode | 버스/자차/대중교통 |
| Day / Sequence / Place | 순서 및 장소 |
| Arrival time / Departure time | 명시된 경우만 |
| Explicit stay time | 명시된 경우만 |
| Next Place / Explicit travel time | 명시된 경우만 |
| Meal / Meal time / Lodging | 식사·숙박 정보 |
| Start / End Hub | 출발·도착 기점 |
| Surrounding region | 주변지역 연결 |
| Buffer / slack | 명시된 경우만 |

**중요:** 누락된 정보는 추정하여 채우지 않는다. Timestamp 차이에서 계산된 시간은 `DERIVED_SCHEDULE_INTERVAL`로 표시하며 pure driving time으로 취급하지 않는다.

**원하는 관찰 결과:**

- repeated Place / Edge / sequence
- travel-time patterns / stay-time patterns / meal patterns
- group vs individual difference
- regional connections
- potential decision rationale / potential counterfactual
- possible Travel Grammar pattern
- evidence gaps / contradictions

Core Place를 사전에 강제로 정하지 않는다. 데이터에서 반복되는 장소와 Edge가 자연스럽게 나타나는지 관찰한다.

**Pilot Success 최소 조건:**

1. 반복 Place가 실제로 나타난다.
2. 반복 Edge가 실제로 나타난다.
3. 일부 시간 패턴을 provenance와 함께 분리할 수 있다.
4. Group과 Individual의 차이가 최소 일부 관찰된다.
5. 일정 Sequence 뒤의 판단 이유를 추가 연구할 가치가 있는 패턴이 발견된다.
6. Unsupported numeric generalization 없이 구조화할 수 있다.

**Failure도 중요한 Evidence:**

- 일정표가 너무 상업적으로 편향됨
- 시간이 너무 부정확함
- 동일 itinerary 복제본이 많음
- 개인 여행과 연결되지 않음
- Travel Grammar가 반복되지 않음

→ 이 경우 가설을 수정한다.

---

## 16. Candidate Governance

이번 Handover 저장으로 다음 Candidate를 생성하지 않는다:

| Candidate | 결정 |
|---|---|
| World Travel Mental Map Candidate | NO |
| Travel Grammar Candidate | NO |
| Expert Judgment Corpus Candidate | NO |
| Counterfactual Travel Knowledge Candidate | NO |
| Traveler State Transition Candidate | NO |
| Founder Philosophy Candidate | NO (기존 HOLD 유지) |

이유: 운영체계 수준의 아이디어이며 아직 Pilot Evidence가 충분하지 않다.

Lifecycle 우회 금지:

```
Idea → Draft → Review → Approved → LOCKED
Candidate → Review → SSOT
```

---

## 17. Handover State

### Confirmed (기존 저장 항목)

| 항목 | 상태 |
|---|---|
| CAND-OPS-003 V0.2 | Candidate / Approved (2026-09-25) |
| 하멜등대 WE+Founder | SAVED / GREEN |
| 케이블카 WE+Founder | SAVED / GREEN |
| 하멜→케이블카 Relationship Knowledge (NOF-02A) | RESOLVED |
| NOF-02B Physical Route Verification Decision | COMPLETE |

### RB-01~03 Evidence Save Status

| Research | Status | Commit |
|---|---|---|
| RB-01 Entity Identity | SAVED — PASS WITH FINDINGS | ab8ee0f |
| RB-02 One-way/Round-trip | SAVED — PASS WITH FINDINGS | 5ec6378 |
| RB-03 Founder Field Evidence | **SAVED — COMPLETE** | 9927f60 |

**RB-03 Save Status: COMPLETE (9927f60)**

NOF-02B RC 현황:

| RC | 상태 |
|---|---|
| RC-01 (명칭) | PARTIALLY_COMPLETE |
| RC-02 (물리적 접근) | **COMPLETE** (FFE-01/02) |
| RC-03 (편도/왕복) | PARTIALLY_COMPLETE |
| RC-04, RC-05 | COMPLETE |
| NOF-02B | **OPEN** (RC-01/RC-03 partial) |

### Research Hypotheses

| Hypothesis | Status |
|---|---|
| Regional Mental Map | HYPOTHESIS / NOT CANDIDATE |
| Travel Schedule Corpus | HYPOTHESIS / NOT CANDIDATE |
| Expert Judgment Corpus | HYPOTHESIS / NOT CANDIDATE |
| Counterfactual Travel Knowledge | HYPOTHESIS / NOT CANDIDATE |
| Traveler State Transition | HYPOTHESIS / NOT CANDIDATE |
| Evidence Confidence | HYPOTHESIS / NOT CANDIDATE (CAND-OPS-003 원칙 유지) |
| Travel Grammar | HYPOTHESIS / NOT CANDIDATE |
| World Travel Mental Map | HYPOTHESIS / NOT CANDIDATE (여수 Pilot 성공 후만) |

### Holds

| 항목 | 상태 |
|---|---|
| place_knowledge migration | HOLD |
| runtime implementation | HOLD |
| DB/schema change | HOLD |
| DreamTown Founder Philosophy Candidate | HOLD |
| Travel Intelligence Candidate promotion | HOLD |
| NOF-02B 완전 RESOLVED | HOLD (RC-01/RC-03 partial) |

### Current Next Action

**`Yeosu Travel Schedule Corpus Pilot V0.1 — Research Protocol & Corpus Collection`**

RB-03이 9927f60으로 저장 완료되었으므로 NOF-02B Closure Decision 및 Corpus Pilot으로 전환.

단, NOF-02B Closure Decision (RC-01/RC-03 partial 상태 수용 여부)은 Founder 판단이 필요하며, Corpus Pilot을 시작하는 것 자체가 NOF-02B가 SOUL safe-answer에 충분하다는 실용적 판단을 내포한다.

---

*Phoenix Travel Intelligence Research Direction Handover V0.1 — 2026-09-25*
