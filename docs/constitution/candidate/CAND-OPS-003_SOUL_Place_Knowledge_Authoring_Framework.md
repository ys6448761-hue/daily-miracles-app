# CAND-OPS-003 — SOUL Place Knowledge Authoring Framework

**Candidate ID:** CAND-OPS-003  
**Category:** Operations / Framework  
**Title:** SOUL Place Knowledge Authoring Framework  
**Status:** Candidate / Draft  
**Lifecycle:** Idea → **Draft** → Review → Approved → LOCKED  
**Importance:** Level 4  
**생성일:** 2026-09-24  
**Origin Places:** Yi Sun-sin Square / Jongpo Marine Park / Hamel Lighthouse / Yeosu Maritime Cable Car  
**Evidence Documents:** (Section 12 참조)

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
```

Framework는 Composition 시점까지 Provenance를 보존한다.

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

Candidate 승인 근거: 반복뿐 아니라 **실제 오류 방지 효과** 확인.

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

## 12. Pilot Evidence

| # | Place | place_code | Key Contribution | Document |
|---|---|---|---|---|
| 1 | 이순신광장 | lee_soon_shin_plaza | Connection Knowledge | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_LEE_SOON_SHIN_PLAZA_V0_1.md` |
| 2 | 종포해양공원 | marine_park | Place/Route/Entity Boundary | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_MARINE_PARK_V0_1.md` |
| 3 | 하멜등대 | hamel_lighthouse | Experience ↔ Founder/DreamTown separation | WE: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_WE_V0_1.md` / Founder: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_FOUNDER_V0_1.md` |
| 4 | 여수해상케이블카 | cablecar | Place+Movement+Route / Situation Knowledge | WE: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` / Founder: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` |

### Candidate Readiness Decision Basis

**A. Repetition:** 서로 다른 성격의 4개 장소에서 Framework 작동 확인.

**B. Knowledge Boundary Protection:** 8가지 실제 오류 유형 방지 확인.

**C. Cross-Place Reusability:** 광장(연결) / 해안공원(머무름) / 등대(도착·전환) / 케이블카(이동+경험) — 유형 다변화에도 Framework 수용.

**D. Practical Knowledge Quality:** 단순 POI Fact를 넘어 lived experience / emotion / relationship / situation / Founder intent / volatile boundary까지 분리 작성 가능.

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
2. 다섯 번째 장소를 이 Framework로 작성할 수 있는가?
3. Provenance가 명확하게 유지되는가?
4. Stable / Live를 일관되게 분리할 수 있는가?
5. Place / Route / Movement를 구분할 수 있는가?
6. 알려진 Pilot 오류를 방지하는가?
7. Framework 적용 시 SOUL 답변 품질이 향상되는가?
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

### Open
- 다섯 번째 장소 reproducibility
- runtime answer-quality evidence
- final SSOT scope
- Operations Guide vs SSOT 경계
- Yeosu 이외 portability

### Hold
- SSOT promotion
- Approved / LOCKED
- DreamTown Philosophy Candidate
- DB/Schema implementation
- place_knowledge migration
- Production application
