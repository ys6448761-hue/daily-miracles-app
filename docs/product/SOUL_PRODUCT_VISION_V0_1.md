# SOUL Product Vision V0.1

**Status:** CANONICALIZED — Founder-confirmed recovery  
**Date:** 2026-10-03  
**Type:** PRODUCT VISION  
**Recovery basis:** SOUL Product Continuity Incident Audit V0.1 (@54c2221) + State Inventory (@af6b4f0) + Founder task input 2026-10-03  
**Related Decision:** `docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md`  
**This is NOT a design document.** It is the canonical record of recovered product direction.

---

## A. Role Map — DreamTown Characters

| Character | Role | Domain |
|---|---|---|
| **무여정 (MOO)** | Where — Travel facts, mobility, routes | Practical Travel Intelligence |
| **SOUL (소여울 / 소울)** | Who — Conversational travel guide, journey host | Travel Experience / Guidance |
| **Phoenix** | How — Knowledge supply chain, Judgment, Personalization engine | AI Architecture |
| **소원이** | Traveler / protagonist | User identity |

아우룸 = 소원별/금오설화 Experience Channel. NOT replaced by SOUL. Different channel, different role.

---

## B. Core Recovered Product Model

### The Living Detail Page

The SOUL detail page is NOT a static tourism information page.  
The SOUL detail page is NOT merely a Basic Information surface.

It is a **conversational / living travel detail experience**.

```
장소를 이해한다
  → 소원이의 상황을 이해한다
  → 질문할수록 그 사람의 여행으로 재구성한다
  → 실제 여행 행동으로 연결한다
```

The defining principle: **As more context is given, the experience becomes more personally relevant — not by replacing the page, but by recomposing what matters within it.**

This is the D2 decision. See `docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md`.

---

## C. Product Surface — Recovered Role Model

These are **product roles**, not a rigid element count. Staging implementation maps against these roles below (§G).

| # | Role | Description |
|---|---|---|
| 1 | **Place Identity / Hero** | Establish where we are. Anchors the experience. |
| 2 | **SOUL Message / Interpretation** | SOUL's opening read of the situation — not a description, an orientation. |
| 3 | **Traveler Situation / Context Input** | Who are you, how are you going, what do you care about? |
| 4 | **Personalized Journey Reconstruction** | Phoenix recomposes: what matters → recommendation → route → cautions → next action |
| 5 | **Recommended Journey / Choices** | The concrete options, with rationale |
| 6 | **Actual Movement / Route Flow** | Real routing, logistics, time |
| 7 | **SOUL Judgment / Cautions / Local Intelligence** | What SOUL knows that a search engine doesn't |
| 8 | **Human Experience Layer** | Two distinct sub-concepts (see §D) |
| 9 | **Basic Trust Information** | Trust-foundation facts: hours, fee, stay time, difficulty, environment, parking |
| 10 | **Next Travel Action** | Concrete next step — book, navigate, save to journey |

### §D Human Experience Layer — Two Distinct Concepts

**Concept A — Local / Field / Yeosu-Informed Perspective**  
The voice of people who know Yeosu from lived experience. Not scripted descriptions. Field knowledge — what the official pages don't say.

**Concept B — Previous Traveler / Sowon-i Experience**  
The experience of travelers who came before. Prototype in Founder source: **"다음 소원이에게 한마디"** (무여정 기초 연구 자료, pos 76107). What one Sowon-i would tell the next.

**Implementation Status:** Both concepts = `VISION_EXISTS_NOT_IMPLEMENTED`  
**Provenance rule:** Do not fabricate testimonials or local voices. Until real provenance and consent infrastructure is established, these remain product vision — not implementable content.

---

## E. Knowledge Supply Chain

Founder-designed flow — product vision level, not runtime architecture:

```
actual experience
  → organize / anonymize
  → experience analysis
  → factual verification
  → Phoenix knowledge
  → SOUL delivery
```

This chain is the basis for why SOUL's guidance has legitimacy. It is not a search result. It is not a fabricated description. It traces to real, organized, verified experience.

**Runtime status:** Phoenix knowledge runtime → NOT_IMPLEMENTED. Knowledge exists in archive form (6117 knowledge audit, docs/knowledge/). Founder decision required on DB transfer timing.

---

## F. Basic Information — Position

Basic Information is a **trust foundation** inside the larger SOUL experience. It is NOT the entire detail page.

Role 9 (Basic Trust Information) answers:

| Question | Field |
|---|---|
| 비용은? | admission_fee_json |
| 언제 갈 수 있나? | opening_hours_json |
| 얼마나 걸리나? | avg_stay_minutes |
| 걷기 어렵지 않나? | physical_difficulty |
| 실내/실외인가? | indoor_outdoor |
| 차로 갈 때? | parking_info |

**Current phase decision:** `BASIC_INFO_SURFACE_CLOSED_CURRENT_PHASE`  
V0.1 + V0.2 Parking LIVE (@17aebc8). Do not reopen.

---

## G. Vision → Implementation Map

| Vision Role | Production Status | Notes |
|---|---|---|
| Place Identity / Hero | `STAGING_ONLY` | PLACE_HERO_MAP; cablecar image; odongdo/hyangiram gradient |
| SOUL Message / Interpretation | `STAGING_ONLY` | SOUL_MESSAGE element; maps to `data.message_ko` (UI-001 LIVE) |
| Traveler Context Input | `STAGING_ONLY` | QUESTION_COMPOSER; 3 chips (자차/오동도/부모님); Quick Context buttons |
| Personalized Journey Reconstruction | `PRODUCTION_LIVE` | Phoenix backend (Judgment V0.1 @d3e7f0e, UI-001 @294c55c); reconstruction engine LIVE; frontend delivery STAGING_ONLY |
| Recommended Journey / Choices | `STAGING_ONLY` | SOUL_JUDGMENT element; `place_identity_ko` or `primaryDiscovery` |
| Actual Movement / Route Flow | `STAGING_ONLY` | JOURNEY element; CourseDisplay (course.blocks) + route.days fallback |
| SOUL Judgment / Local Intelligence | `PRODUCTION_LIVE` | Judgment V0.1 backend LIVE; PU-HY-003 (elderly+difficult) pattern active |
| Human Experience Layer | `NOT_IMPLEMENTED` | Both Concept A (local voice) and Concept B (previous traveler) absent everywhere |
| Basic Trust Information | `PRODUCTION_LIVE` | PlaceBasicInfo V0.2 LIVE in TravelRecommendCard (@17aebc8); NOT connected to SoulCableCarPage ESSENTIAL_INFO yet |
| Next Travel Action | `PARTIAL` | Map/길찾기 buttons PRODUCTION_LIVE; "내 여정에 담기" CTA disabled ("소원꿈터 연결 예정") |

### Production-live elements (no frontend surface yet — backend only)
- Judgment V0.1 backend: @d3e7f0e
- UI-001 explicit_context contract: @294c55c
- Soyeowool Phase 1: @1f5afab
- PlaceBasicInfo V0.2: @17aebc8

### Staging-only elements (SoulCableCarPage, origin/staging/storybook-c7a)
- QUESTION_COMPOSER, SOUL_MESSAGE, PLACE_HERO, FOR_ME, SOUL_JUDGMENT, JOURNEY, COST, DEPTH

### Not-implemented Vision elements
- Human Experience Layer (Concept A: local voice; Concept B: previous traveler)
- "다음 소원이에게 한마디" as product surface
- Save/Share feature (🔖↗ icons exist in staging UI only — no backend)
- Full "내 여정에 담기" CTA (소원꿈터 connection deferred)

---

## H. Context Examples — Personalization Inputs

From Founder source (무여정 입구 질문):

```
차가 있어요
부모님과 가요
아이와 가요
오동도도 갈 거예요
일몰을 보고 싶어요
```

These add decision context. Phoenix recomposes: what matters → recommendation → route → cautions → next action. The result is more personally relevant — not a different page, but the same experience reorganized for this person.

---

## I. What This Document Is / Is Not

**IS:**
- Canonical recovered product direction
- Basis for Product Contract preflight (see CLAUDE.md §Product Contract)
- Authority for SoulCableCarPage port alignment decisions

**IS NOT:**
- A design specification (no pixel counts, no component APIs)
- A complete UI spec for all 10 roles
- An implementation plan

**Relationship to staging:**
SoulCableCarPage.jsx on `origin/staging/storybook-c7a` is implementation evidence. It is not authority over Vision. Vision defines what the product is. Implementation maps to Vision — not the other way.

---

*Recovered 2026-10-03. No implementation in this document.*
