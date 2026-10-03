# SOUL Vision Continuity — Current Repository State & Work Inventory V0.1

**Status:** STATE_INVENTORY_COMPLETE_READY_FOR_REPAIR  
**Date:** 2026-10-03  
**Mode:** STRICT READ-ONLY — No implementation, no code change, no DB change  
**HEAD at start:** 54c2221 (SOUL Product Continuity Incident Audit V0.1)  
**HEAD after audit:** 54c2221 (unchanged — read-only)  
**Prior Audit Evidence:** `docs/architecture/SOUL_PRODUCT_CONTINUITY_INCIDENT_AUDIT_V0_1.md` @ 54c2221  

---

## §1. Phoenix Continuity Read Chain

### A. Latest Project State
`memory/MEMORY.md` — Phoenix SOUL/Journey Intelligence section  
★ Current Next Action (prior to this audit): **SOUL Conversational Surface — SoulCableCarPage.jsx Production Port — Founder GO Gate**

### B. Architecture Decision Status
| Decision | Status | Origin Doc |
|---|---|---|
| D1: HYBRID MEMORY ARCHITECTURE (short-term: travel_guide_sessions; long-term: SOYEOWOOL-MAEK) | LOCKED | `docs/architecture/MUYEOJEONG_MAEK_MASTER_HANDOVER_2026_09_20.md` §D1 |
| D2: Living Detail Page = canonical experience, questions do NOT replace the page | REFERENCED — NO DEFINING DOC | Referenced at `SOUL_LEGACY_JOURNEY_RESTORATION_AUDIT_V0_1.md`:285 — no origin document found |

### C. Handover Chain State
| Document | Date | Phoenix/SOUL Coverage |
|---|---|---|
| `DREAMTOWN_STATUS.md` | 2026-04-04 | ZERO — pre-Phoenix, stale 6 months |
| `docs/architecture/PHOENIX_HANDOVER_2026_09_21.md` | 2026-09-21 | Aurora3, Route knowledge — NO SoulCableCarPage, NO SOUL UI |
| `docs/architecture/PHOENIX_HANDOVER_2026_09_21_TRAVELER_BASELINE_SHARED_JOURNEY.md` | 2026-09-21 | Level 4 핵심 — 8 confirmed decisions, Traveler Baseline |
| `docs/architecture/MUYEOJEONG_MAEK_MASTER_HANDOVER_2026_09_20.md` | 2026-09-20 | SOUL character role, D1 locked, MAEK runtime NOT_IMPLEMENTED |

---

## §2. Existing Vision/Product Records

### SOUL Architecture Docs (24 files in docs/architecture/SOUL_*.md)
All 24 files are: technical audit, implementation evidence, scope lock, gap analysis, restoration audit — **NONE is a product vision document**.

### Missing Documents (cited but absent)
| Document | Cited In | Status |
|---|---|---|
| D2 Decision Record | `SOUL_LEGACY_JOURNEY_RESTORATION_AUDIT_V0_1.md`:285 | ABSENT — no defining origin document found |
| `DREAMTOWN_SOUL_JOURNEY_SNAPSHOT_WORKING_HYPOTHESIS_2026_09_29.md` | `SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md` §F | ABSENT — file does not exist in repository |

### What Exists for Vision
- `docs/architecture/SOUL_PRODUCT_CONTINUITY_INCIDENT_AUDIT_V0_1.md` (@54c2221): Evidence of VISION_NOT_TRANSCRIBED — NOT a product vision doc
- `memory/project_character_channel_identity.md`: 아우룸=소원별채널/소여울=여행안내/MAEK=연속성/소담=판단제안/무여정=Travel Intelligence — CANONICAL
- `memory/project_phoenix_founding_principle.md`: "SOUL은 완벽한 지식을 기다렸다가 관계를 시작하지 않는다." — CANONICAL

---

## §3. Founder Source Corpus Overlap Analysis

**Source:** `무여정 기초 연구 자료(10월3일).docx`

### Concepts in docx — Classification
| Concept | In docx | In repo | Status |
|---|---|---|---|
| 아우룸↔소울 채널 분화 | YES (pos 38367, 46510) | memory/project_character_channel_identity.md | ALREADY_CANONICAL |
| 소울 = 무료여행정보/여행안내 채널 | YES (pos 74676) | PHOENIX_HANDOVER + memory | ALREADY_CANONICAL |
| Traveler Baseline (Bucket List, EXPERIENCED≠EXCLUDE) | YES (pos 148728) | PHOENIX_HANDOVER_2026_09_21_TRAVELER_BASELINE | ALREADY_CANONICAL |
| Journey State Schema (SOWONI ID, Journey Identity, Route State) | YES (pos 0) | soyeowoolService.js implements session | PARTIALLY_PERSISTED |
| MOO Modes (GUIDE/DESIGN/COMPANION) | YES (pos 7266) | Partial — no canonical doc | PARTIALLY_PERSISTED |
| "다음 소원이에게 한마디" | YES (pos 76107) | NOT in code or docs | SOURCE_ONLY |
| CIV market research (Korean hotel vacancy 33.6%) | YES (pos 15373) | NOT in repo | SOURCE_ONLY |
| Journey Sequence Evidence (YTC corpus) | YES (pos 161151+) | docs/knowledge/YEOSU_ROUTE_CORPUS_V0_1.json | PERSISTED |

### Concepts NOT in docx
| Concept | Search Result |
|---|---|
| 질문할수록 | NOT FOUND in docx |
| SOUL의 한마디 | NOT FOUND in docx |
| 먼저 다녀간 소원이 | NOT FOUND in docx (related: "다음 소원이에게 한마디" found as prototype) |
| 여수를 아는 사람들의 시선 | NOT FOUND in docx |
| 대화하는 여행 상세페이지 | NOT FOUND in docx |
| Living Detail Page (as product concept) | NOT FOUND in docx |

**Critical finding:** The Founder concept terms driving the VISION_NOT_TRANSCRIBED root cause are NOT in this docx. Source is a different design document (visual mockup/Figma/separate spec) not captured here.

---

## §4. Current Code State — Classified

### PRODUCTION_LIVE
| Asset | Commit | Notes |
|---|---|---|
| TravelGuidePage + TravelRecommendCard | — | Main, live |
| PlaceBasicInfo.jsx V0.2 (6 fields) | 17aebc8 | Mounted in TravelRecommendCard |
| /api/dt/travel/recommend | — | Production |
| /api/dt/travel/input/text (UI-001 explicit_context) | 294c55c | Backend live; frontend wiring deferred |
| Judgment V0.1 backend | d3e7f0e | 22/22 PASS |
| Map/길찾기 (card-actions in TravelRecommendCard) | — | Production |

### STAGING_ONLY (origin/staging/storybook-c7a)
| Asset | Lines | Notes |
|---|---|---|
| SoulCableCarPage.jsx | 679 | 9-element structure |
| Hero image switching (PLACE_HERO_MAP) | — | cablecar image; odongdo/hyangiram = gradient |
| Journey section (route.days via SoulCableCarPage) | — | Shown only in staging |
| Situation chips (3: 자차/오동도/부모님) | — | Local state only, NOT wired to API payload (Gap B) |

### NOT_IMPLEMENTED (absent from both main and staging)
| Feature | Status |
|---|---|
| "먼저 다녀간 소원이" actual experience surface | NOT_IMPLEMENTED |
| "여수를 아는 사람들의 시선" Human Voice surface | NOT_IMPLEMENTED |
| Save (🔖) / Share (↗) header icons | UI_ONLY — no backend |
| "내 여정에 담기" CTA | `disabled` — "소원꿈터 연결 예정" |
| PlaceBasicInfo inside SoulCableCarPage ESSENTIAL_INFO slot | NOT_CONNECTED |

### SoulCableCarPage 9-Element Structure (from staging JSX)
| # | Element | Staging State |
|---|---|---|
| 1 | QUESTION_COMPOSER | Input form + 3 chips + Quick Context buttons |
| 2 | SOUL_MESSAGE | Conditional (post-submit); `data.message_ko` |
| 3 | PLACE_HERO | PLACE_HERO_MAP cablecar image; gradient fallback |
| 4 | ESSENTIAL_INFO | Cable car = static FactRows; other places = placeData-driven (PlaceBasicInfo NOT mounted here) |
| 5 | FOR_ME | ForMeSection; cable car / non-placeKnowledge only |
| 6 | SOUL_JUDGMENT | `place_identity_ko` or `primaryDiscovery` |
| 7 | JOURNEY | JourneyFlow + CourseDisplay (blocks) OR route.days fallback; cable car only |
| 8 | COST | Conditional when quote.status === 'CALCULATED' |
| 9 | DEPTH | ExpandableSection; cable car only |
| — | WISH_SCENE | stateIndex ≥ 2; cable car only |
| — | BOTTOM CTA | "내 여정에 담기" disabled; "소원꿈터 연결 예정" |

---

## §5. Completed Work (Production-Verified)

| Item | Commit | Status |
|---|---|---|
| Basic Info V0.1 | 07a0fa3 | PRODUCTION_LIVE |
| Basic Info V0.2 Parking | f9ac53f (merge), 17aebc8 (evidence) | PRODUCTION_LIVE |
| Basic Info Surface Closure Review | f6c4d6a | BASIC_INFO_SURFACE_CLOSED_CURRENT_PHASE |
| UI-001 explicit_context contract (backend) | 294c55c | PRODUCTION_LIVE |
| Judgment V0.1 (backend + promotion) | d3e7f0e | PRODUCTION_LIVE |
| Place Identity/Hero switching | f7c635f | STAGING_ONLY |
| Judgment V0.1 UI Trace | 37031ec | STAGING_ONLY (evidence) |
| SOUL Product Continuity Incident Audit | 54c2221 | EVIDENCE_ONLY |
| Soyeowool Phase 1 | 1f5afab | PRODUCTION_LIVE |
| Identity Bootstrap | — | 230/230 PASS, LIVE |
| Shared Journey V0.2 | — | AT-6/6 PASS, LIVE |

---

## §6. Audit 54c2221 Effect

Commit 54c2221 created `docs/architecture/SOUL_PRODUCT_CONTINUITY_INCIDENT_AUDIT_V0_1.md` ONLY.

**NOT updated by 54c2221:**
- DREAMTOWN_STATUS.md (still stale 2026-04-04)
- Any handover document
- Project State or MEMORY.md Current Next Action (memory was updated in same session)
- No Product Vision SSOT created
- No D2 Decision Record created
- No code changes

---

## §7. Gap Matrix

| Gap | Type | Source Present | Action Required |
|---|---|---|---|
| SOUL product vision (original concept) | CANONICALIZATION_GAP | UNKNOWN SOURCE | CREATE after Founder confirmation |
| D2 decision definition | MISSING_SOURCE | Referenced only | CREATE after Founder confirmation |
| "먼저 다녀간 소원이" surface | IMPLEMENTATION_GAP + MISSING_SOURCE | "다음 소원이에게 한마디" in docx (prototype) | HOLD — Founder product scope decision |
| "여수를 아는 사람들의 시선" | IMPLEMENTATION_GAP + MISSING_SOURCE | NONE | HOLD — Founder product scope decision |
| "SOUL의 한마디" | CANONICALIZATION_GAP | SOUL_MESSAGE in staging (partial) | LINK staging element to Founder concept after confirmation |
| "질문할수록" principle | CANONICALIZATION_GAP | NONE | CREATE document after Founder confirmation |
| SoulCableCarPage → main port | PRODUCTION_PORT_GAP | All backends LIVE | IMPLEMENT — pending product alignment |
| DREAMTOWN_STATUS.md Phoenix pointer | HANDOVER_LINK_GAP | DREAMTOWN_STATUS.md exists | UPDATE (minimal) |
| PlaceBasicInfo in SoulCableCarPage ESSENTIAL_INFO | CONNECTION_GAP | PlaceBasicInfo LIVE on main | CONNECT during port |
| Chip Gap B (verb mismatch → API) | WIRING_GAP | UI-001 backend LIVE | IMPLEMENT during port |
| Basic Info V0.1+V0.2, Judgment V0.1, UI-001 | NO_GAP | — | KEEP |
| Traveler Baseline | NO_GAP | — | KEEP |
| Character/Channel Identity | NO_GAP | — | KEEP |

---

## §8. Duplication Check

| Proposed Document | Existing Coverage | Duplication Risk | Verdict |
|---|---|---|---|
| SOUL Product Vision SSOT | SOUL_PRODUCT_CONTINUITY_INCIDENT_AUDIT_V0_1.md (evidence only, no vision rationale) | LOW — different content | CREATE after Founder confirmation |
| D2 Decision Record | No existing D2 origin document | NONE | CREATE after Founder confirmation |
| DREAMTOWN_STATUS.md Phoenix section | File exists (stale) | UPDATE — not duplicate | UPDATE (minimal) |

---

## §9. Real Next Work Package

| Action | Items | Trigger |
|---|---|---|
| KEEP | All Basic Info evidence; Judgment V0.1; UI-001 evidence; Traveler Baseline handover; Character Identity memory; 54c2221 audit; Soyeowool Phase 1 | — |
| UPDATE | DREAMTOWN_STATUS.md (minimal Phoenix pointer section) | Next session (no Founder block) |
| CREATE | SOUL Product Vision SSOT; D2 Decision Record | After Founder Q1+Q2 confirmed |
| LINK | DREAMTOWN_STATUS.md → Phoenix handover chain docs | With UPDATE |
| IMPLEMENT | SoulCableCarPage.jsx port to main | After product alignment; includes PlaceBasicInfo connection in ESSENTIAL_INFO + chip Gap B wiring |
| HOLD | "먼저 다녀간 소원이" surface; "여수를 아는 사람들의 시선"; full SOUL Product Vision SSOT; source of 질문할수록/SOUL의 한마디 terms | Until Founder Q3 confirmed |

---

## §10. SoulCableCarPage Port Classification

**Classification: REQUIRES_PRODUCT_ALIGNMENT**

**Evidence:**
1. VISION_NOT_TRANSCRIBED confirmed (54c2221) — no canonical product spec defines required vs. deferred elements for the port
2. Social proof elements ("먼저 다녀간 소원이", "여수를 아는 사람들의 시선") absent from staging — unknown if staging is complete or partial relative to Founder vision
3. D2 scope boundaries not verifiable without defining doc — cannot confirm whether staging JOURNEY/COST/DEPTH elements are within D2 or overriding D2
4. Source of 5 product concept elements (질문할수록/SOUL의 한마디/먼저 다녀간/여수를 아는/대화하는 상세페이지) not identified in repository OR in the primary docx source
5. "내 여정에 담기" CTA is disabled ("소원꿈터 연결 예정") — not a blocker for port, but indicates known incompleteness

**What IS ready (no alignment needed):**
- QUESTION_COMPOSER (3 chips): port as-is; Gap B chip-to-API wiring is additive
- SOUL_MESSAGE: port as-is; maps to `data.message_ko` (UI-001 LIVE)
- PLACE_HERO: port as-is; hero switching LIVE from f7c635f logic
- SOUL_JUDGMENT: port as-is; Judgment V0.1 LIVE
- ESSENTIAL_INFO: port with PlaceBasicInfo connection (replace static cable car stubs with PlaceBasicInfo V0.2 component)
- COST: port as-is (conditional, quote.status gated)

**What requires alignment before/during port:**
- JOURNEY section scope (is course.blocks[] D2-approved for port?)
- Social proof slot definition (do we add a placeholder or hold until Phase 2?)
- Save/Share icons (stub placeholder or remove from port version?)

---

## §11. Code Safety-Gate Readiness

### EXISTING (in CLAUDE.md / docs governance)
- Mandatory read chain (DREAMTOWN_STATUS.md → CLAUDE.md)
- Guardian Preflight Report format (10-field required before implementation)
- CONNECT/EXTEND/REPAIR/REPLACE/NEW classification with NEW requiring full workspace search
- Implementation Status BLOCKED gate when questions unresolved
- Absolute prohibition: investigating only current repo before declaring no prior art

### MISSING (not currently in any governance document)
| Missing Rule | Gap Consequence |
|---|---|
| "grep 0건 ≠ Vision 부재" — zero grep results does not mean concept does not exist | Session reads ZERO matches and concludes no prior concept exists → implements duplicate |
| "코드 상태 ≠ 제품 의도" — staging code reflects implementation attempt, not Founder product intent | Session ports staging 1:1 without checking if missing elements were deferred or forgotten |
| "NOT_IMPLEMENTED ≠ DEPRECATED" — distinction rule | Session omits elements classified as "not yet built" vs "deliberately removed" |
| Product Surface Guard — Founder approval required to REDUCE/REPLACE/REDEFINE an element in the conversational surface | Session removes staging elements during port without Founder review |
| VISION_CONFLICT reporting requirement — if implementation contradicts vision evidence, halt + report before proceeding | Session proceeds on implementation despite detected contradiction |
| Completion Report Vision fields: Source/Preserved/Changed/Deferred | Evidence docs cannot reconstruct what was preserved vs. dropped in port |

---

## §12. Final Decision

**STATE_INVENTORY_COMPLETE_READY_FOR_REPAIR**

Repository state is consistent — no contradictions found between implementation evidence and governance decisions. Repair path is clear.

**Blocking Founder decisions (before some HOLD items can proceed):**
- Q1: Full element list for SOUL detail page (staging 9 elements + social proof = complete vs. partial?)
- Q2: D2 rationale ("Living Detail Page = canonical, questions don't replace it" — why?)
- Q3: Social proof elements scope (Phase 2 requirement or current-phase requirement?)
- Q4: DREAMTOWN_STATUS.md update authorization?

**Not blocking Current Next Action (SoulCableCarPage port):**
- Q4 is not blocking — DREAMTOWN_STATUS.md update is simple metadata change
- Q1/Q2/Q3 affect social proof slot design during port, but base port (QUESTION_COMPOSER + SOUL_MESSAGE + PLACE_HERO + SOUL_JUDGMENT + ESSENTIAL_INFO + COST) can proceed without them

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | HEAD at audit start | 54c2221 |
| 2 | HEAD after audit | 54c2221 (unchanged — read-only) |
| 3 | Prior audit evidence path/commit | `docs/architecture/SOUL_PRODUCT_CONTINUITY_INCIDENT_AUDIT_V0_1.md` @ 54c2221 |
| 4 | Latest Project State path | `memory/MEMORY.md` |
| 5 | Current Next Action (before this audit) | SOUL Conversational Surface — SoulCableCarPage.jsx Production Port — Founder GO Gate |
| 6 | DREAMTOWN_STATUS.md state | STALE — 2026-04-04, zero Phoenix/SOUL coverage |
| 7 | D2 defining document | ABSENT — referenced at SOUL_LEGACY_JOURNEY_RESTORATION_AUDIT_V0_1.md:285 only |
| 8 | D2 classification | REFERENCED_DECISION_WITHOUT_ORIGIN |
| 9 | Snapshot working hypothesis doc | ABSENT — `DREAMTOWN_SOUL_JOURNEY_SNAPSHOT_WORKING_HYPOTHESIS_2026_09_29.md` not found |
| 10 | Vision product concept terms in repository | ZERO matches for: 질문할수록/SOUL의 한마디/먼저 다녀간 소원이/여수를 아는 사람들의 시선 |
| 11 | Vision product concept terms in docx | NOT FOUND in `무여정 기초 연구 자료(10월3일).docx` |
| 12 | docx source classification | Contains: already-canonical decisions + partially-persisted schemas + SOURCE_ONLY prototypes |
| 13 | "다음 소원이에게 한마디" in docx | FOUND (pos 76107) — prototype of "먼저 다녀간 소원이" concept |
| 14 | Character/Channel Identity classification | ALREADY_CANONICAL (memory + PHOENIX_HANDOVER docs) |
| 15 | Traveler Baseline classification | ALREADY_CANONICAL (PHOENIX_HANDOVER_2026_09_21_TRAVELER_BASELINE) |
| 16 | SoulCableCarPage.jsx location | origin/staging/storybook-c7a ONLY — NOT on main |
| 17 | SoulCableCarPage element count | 9 elements (+ WISH_SCENE + BOTTOM CTA) |
| 18 | Social proof elements in staging | ABSENT — "먼저 다녀간" and "여수를 아는" not implemented in staging or docs |
| 19 | PlaceBasicInfo in SoulCableCarPage | NOT_CONNECTED — PlaceBasicInfo LIVE in TravelRecommendCard; ESSENTIAL_INFO in SoulCableCarPage is separate static/placeData content |
| 20 | Judgment V0.1 backend status | PRODUCTION_LIVE (d3e7f0e) |
| 21 | UI-001 explicit_context backend status | PRODUCTION_LIVE (294c55c) |
| 22 | Judgment V0.1 frontend wiring | DEFERRED — SoulCableCarPage not on main |
| 23 | Chip Gap B (chip state → API payload) | WIRING_GAP — chips are local state only, not sent to API |
| 24 | Save/Share icons | UI_ONLY — no backend implementation |
| 25 | "내 여정에 담기" CTA | disabled — "소원꿈터 연결 예정" |
| 26 | MAEK runtime status | DESIGNED — NOT_IMPLEMENTED |
| 27 | Vision/Product SSOT document for SOUL | ABSENT — no canonical product vision document exists |
| 28 | Gap Matrix items | 13 rows (7 gaps, 3 no-gap, 3 hold) |
| 29 | Safety-gate existing rules | 5 rules confirmed in CLAUDE.md governance |
| 30 | Safety-gate missing rules | 6 rules not in any governance document |
| 31 | SoulCableCarPage port classification | REQUIRES_PRODUCT_ALIGNMENT |
| 32 | Port classification rationale | VISION_NOT_TRANSCRIBED + social proof elements absent + D2 scope unverifiable |
| 33 | What IS port-ready (no alignment needed) | QUESTION_COMPOSER, SOUL_MESSAGE, PLACE_HERO, SOUL_JUDGMENT, COST |
| 34 | What requires alignment during port | JOURNEY scope, social proof slot, save/share icons |
| 35 | Blocking Founder questions | Q1 (element list), Q2 (D2 rationale), Q3 (social proof scope), Q4 (STATUS.md update) |
| 36 | Founder questions blocking Current Next Action? | Q4 not blocking; Q1/Q2/Q3 affect slot design but not base port |
| 37 | Recommended next action (immediate, no Founder block) | UPDATE DREAMTOWN_STATUS.md (minimal Phoenix pointer) |
| 38 | Recommended next action (after Founder Q1+Q2) | CREATE SOUL Product Vision SSOT + D2 Decision Record |
| 39 | Recommended next action (after product alignment) | IMPLEMENT SoulCableCarPage port to main |
| 40 | Documents to NOT create yet | Product Vision SSOT, Continuity Guardrail, D2 Decision Record, source-code changes |
| 41 | Final state decision | **STATE_INVENTORY_COMPLETE_READY_FOR_REPAIR** |

---

*This document is inventory evidence only. No product vision, no guardrail, no D2 record, no code change.*
