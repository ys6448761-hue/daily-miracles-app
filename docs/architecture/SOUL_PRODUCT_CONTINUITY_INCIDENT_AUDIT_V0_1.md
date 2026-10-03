# SOUL Product Continuity Incident Audit V0.1
— Handover / Product Contract / Current Code State

**Date:** 2026-10-03  
**Mode:** STRICT READ-ONLY / FORENSIC AUDIT / NO IMPLEMENTATION  
**Trigger:** Lumi generated a new 10-item conceptual structure in response to a product-structure question, instead of recovering the previously agreed SOUL detail-page design  
**Status:** AUDIT_COMPLETE  

---

## §0. Incident Description

A continuity incident occurred during the Basic Information phase. When asked about the product structure of the SOUL experience, Lumi produced a new 10-item conceptual model rather than recovering the existing, agreed conversational travel detail page design. The Founder supplied original visual concepts referencing these elements:

- "질문할수록" — the page deepens with each question
- "SOUL의 한마디" — SOUL's message slot
- "먼저 다녀간 소원이" — "Sowon who visited before" (community/social proof element)
- "여수를 아는 사람들의 시선" — "perspective of people who know Yeosu" (local knowledge element)
- Overall framing: "대화하는 여행 상세페이지" — conversational travel detail page

Audit question: Was the original product model adequately persisted? Was it handover-reachable? What failed?

---

## §1. Handover Chain Audit

**Mandated read chain (per CLAUDE.md):**
1. `DREAMTOWN_STATUS.md` — mandated first-read
2. `docs/architecture/PHOENIX_HANDOVER_2026_09_21.md` — active Phoenix handover
3. `docs/architecture/*.md` — specific domain docs

**Findings:**

| Document | Phoenix Coverage | SOUL Detail Page Coverage |
|---|---|---|
| `DREAMTOWN_STATUS.md` | ZERO — dated 2026-04-04, covers pre-Phoenix DreamTown sonar/payment | ZERO |
| `docs/architecture/PHOENIX_HANDOVER_2026_09_21.md` | Partial — Route Intelligence / Aurora3 only | ZERO |
| `docs/architecture/MUYEOJEONG_MAEK_MASTER_HANDOVER_2026_09_20.md` | Architecture philosophy / MAEK design | ZERO — mentions SOUL character role only |
| `docs/architecture/SOUL_PLACE_IDENTITY_CONNECTION_SCOPE_V0_1.md` | Technical scope audit — 5 SoulCableCarPage elements | No product vision |
| `docs/architecture/SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md` | 9-element staging structure | No product vision |

**Handover chain assessment: BROKEN for SOUL product vision**

A session starting from DREAMTOWN_STATUS.md (mandated) receives ZERO signal about Project Phoenix, SOUL, TravelGuidePage, SoulCableCarPage, Judgment, or any 2026-09+ work.

---

## §2. Full-Text Search — Original Concept Terms

Searched all `.md`, `.jsx`, `.js`, `.json` files in the entire repository.

| Search Term | Matches |
|---|---|
| `상세페이지` | 0 |
| `대화하는 여행` | 0 |
| `질문할수록` | 0 |
| `SOUL의 한마디` | 0 |
| `먼저 다녀간 소원이` | 0 |
| `여수를 아는 사람들의 시선` | 0 |
| `대화하는 여행 상세페이지` | 0 |

**Result: ZERO MATCHES — the original product concept language is not present in the repository in any file.**

**"Living Detail Page"** (the internal engineering label for the concept) — Found in 4 architecture docs. However, these are technical scope audit documents, not product vision documents. None define the original concept elements or their rationale.

**D2 decision** ("Living Detail Page = canonical experience, questions do NOT replace the page") — Referenced in `SOUL_LEGACY_JOURNEY_RESTORATION_AUDIT_V0_1.md` as a known locked decision ("D2 says..."), but the **defining document for D2 does not exist in the repository.** D2 is treated as a known fact in downstream docs but cannot be traced to an origin document.

**Referenced document not found:** `DREAMTOWN_SOUL_JOURNEY_SNAPSHOT_WORKING_HYPOTHESIS_2026_09_29.md` — cited in `SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md §F` but absent from the repository.

---

## §3. Persistence Classification

**PRIMARY CLASSIFICATION: NOT_MEANINGFULLY_PERSISTED**

The original Founder product model for the SOUL conversational travel detail page was not transcribed into any repository document. The concept existed in design conversations and/or visual mockups that were never converted to documentation.

**What IS persisted (partial):**

| Artifact | What it preserves | What it lacks |
|---|---|---|
| `SoulCableCarPage.jsx` (staging/storybook-c7a) | Implemented 9-element structure | Not on main; no rationale; no original concept framing |
| `SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md` | Technical inventory of JSX elements | Not a vision doc; describes what exists, not what was intended |
| `docs/architecture/MUYEOJEONG_MAEK_MASTER_HANDOVER_2026_09_20.md §3` | "SOUL = 소원이와 대화하는 존재. 최종 설명의 주인" | Character philosophy only; no UI model |
| D2 label "Living Detail Page" | Label used consistently across 4+ docs | No defining document; rationale not recoverable |

**What is NOT persisted:**

- "질문할수록" (conversational depth principle) — why questions deepen the page experience
- "먼저 다녀간 소원이" — the social proof / community element
- "여수를 아는 사람들의 시선" — the local knowledge / curation element
- Rationale for the D2 decision ("why Living Detail Page = canonical experience")
- The original full element list and ordering from Founder vision

---

## §4. Handover Failure Analysis

**Failure mode: VISION_NOT_TRANSCRIBED**

The implementation (SoulCableCarPage.jsx) was built from the Founder's conversational/visual model without a corresponding product-level SSOT document being created first. The implementation partially captures the structure but not the intent or the full element list.

**Contributing factors:**

1. **Mandated first-read is stale (6 months):** `DREAMTOWN_STATUS.md` was last updated 2026-04-04. A new session following CLAUDE.md instructions reads a document that predates all Phoenix work. No Phoenix signal at all.

2. **Phoenix handover covers architecture, not product:** The handover chain focuses on technical architecture decisions (Route Intelligence, Aurora3, MAEK design) rather than the product experience model.

3. **D2 definition document absent:** A locked decision is cited but its origin document doesn't exist. Future sessions cannot verify D2's scope.

4. **Referenced document absent:** `DREAMTOWN_SOUL_JOURNEY_SNAPSHOT_WORKING_HYPOTHESIS_2026_09_29.md` cited but absent. Creates broken reference chain.

5. **SoulCableCarPage on staging-only branch:** The nearest artifact to the original vision is on `staging/storybook-c7a`, not on `main`. A session checking only main finds no trace of the SOUL conversational UI.

---

## §5. Product Model Reconstruction (from code evidence only)

**Source:** `SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md §A` — inventory of SoulCableCarPage.jsx at commit c98bd7e

**Reconstructed element structure (staging implementation):**

| # | Element | Source | State after submit |
|---|---|---|---|
| 1 | QUESTION_COMPOSER | Static JSX | Unchanged |
| 2 | SOUL_MESSAGE | `data.message_ko` | NEW — inserted above hero post-submit |
| 3 | PLACE_HERO | Hero image asset | Unchanged (ASSET_GAP for odongdo/hyangiram) |
| 4 | ESSENTIAL_INFO | PU-CC-001~005 storybook static content | Unchanged |
| 5 | FOR_ME | `stateIndex`-driven | Recomposes |
| 6 | SOUL_JUDGMENT | `primaryDiscovery` / SOUL_DISCOVERY | Recomposes via parseContext |
| 7 | JOURNEY | `travelerContext` JourneyFlow | Recomposes |
| 8 | COST | `quote.breakdown` | NEW — conditional when calculated |
| 9 | DEPTH | Expandable static section | Unchanged |

**Gap between staging implementation and Founder concept:**

| Founder concept element | Staging implementation | Present? |
|---|---|---|
| "질문할수록" (deepens with questions) | SOUL_MESSAGE + JOURNEY extension pattern | PARTIAL — mechanism exists but not framed as principle |
| "SOUL의 한마디" | SOUL_MESSAGE card (message_ko) | YES — functionally implemented |
| "먼저 다녀간 소원이" | NOT PRESENT in any element | ABSENT |
| "여수를 아는 사람들의 시선" | NOT PRESENT in any element | ABSENT |

**Conclusion:** The staging implementation implements ~50% of the original concept elements. The social proof / community elements are absent from both staging and documentation.

---

## §6. Current Code State Audit

**On `main` (production):**

| Component | Status | Notes |
|---|---|---|
| TravelGuidePage.jsx | LIVE — `/api/dt/travel/recommend` based | Original hotel-entry flow |
| TravelRecommendCard.jsx + PlaceBasicInfo.jsx | LIVE — V0.2 (17aebc8) | DB-driven facts. 6 fields null-tolerant. |
| SoulCableCarPage.jsx | ABSENT | Not ported from staging |
| Judgment V0.1 backend | LIVE — d3e7f0e | Frontend wiring deferred (SoulCableCarPage not on main) |
| UI-001 explicit_context backend | LIVE — 294c55c | Frontend wiring deferred |
| CourseDisplay.jsx | EXISTS but not called | Legacy component. Not wired in current pipeline. |

**On `staging/storybook-c7a`:**

| Component | Status |
|---|---|
| SoulCableCarPage.jsx | EXISTS — 9-element conversational UI |
| Living Detail Page title/hero switching | LIVE (f7c635f) |
| Judgment chip → API connection | Gap B identified but not fixed |
| PlaceBasicInfo | NOT mounted in SoulCableCarPage (mounted only in TravelRecommendCard on main) |

**Key disconnection:** PlaceBasicInfo V0.2 (DB-driven facts) was built and deployed on the TravelRecommendCard surface. When SoulCableCarPage is ported, its ESSENTIAL_INFO slot (currently storybook static content PU-CC-001~005) should be replaced or supplemented by PlaceBasicInfo — this integration is not yet done on staging.

---

## §7. Directional Drift Assessment

| Dimension | Was drift known? | Severity |
|---|---|---|
| SoulCableCarPage staging-only | YES — explicitly identified in Closure Review §I | KNOWN_GAP |
| PlaceBasicInfo not in SoulCableCarPage | IMPLICIT — Basic Info was built for TravelRecommendCard first | KNOWN_SEQUENCE |
| Social proof elements absent (먼저 다녀간, 여수를 아는) | UNKNOWN — not documented | UNDETECTED_GAP |
| D2 defining document absent | UNKNOWN — referenced but not investigated | UNDETECTED_GAP |

**Assessment: PARTIAL_DRIFT**

The primary path (SoulCableCarPage port) was identified and tracked. The social proof / community elements were not tracked. The product model was implemented without all original elements.

---

## §8. Basic Information Work Impact Assessment

The Basic Information V0.1/V0.2 work was implemented on the `TravelGuidePage / TravelRecommendCard` surface — the non-SOUL, recommend-based flow. This was correct sequencing:

**Positive:** PlaceBasicInfo component (DB-driven, null-tolerant, 6 fields) is now available as a ready component for the SoulCableCarPage port. When SoulCableCarPage reaches main, connecting PlaceBasicInfo to its ESSENTIAL_INFO slot replaces storybook static content with live data.

**Remaining integration:** SoulCableCarPage.jsx's ESSENTIAL_INFO section currently uses static `PU-CC-001~005` storybook content. The port must connect `places[0]` from PLACE_LOOKUP response to `PlaceBasicInfo` within the page hierarchy.

**Verdict:** BASIC_INFO_WORK_PREPARES_SOUL_PORT — no wasted effort. Sequencing was appropriate.

---

## §9. Product State Matrix

| Surface | Branch | Status | Next action |
|---|---|---|---|
| TravelGuidePage + TravelRecommendCard | main | PRODUCTION_LIVE | Base surface. PlaceBasicInfo V0.2 connected. |
| SoulCableCarPage conversational UI | staging/storybook-c7a | STAGING_ONLY | Port to main (next action) |
| Judgment V0.1 backend | main | PRODUCTION_LIVE | Frontend wiring deferred pending SoulCableCarPage port |
| UI-001 explicit_context backend | main | PRODUCTION_LIVE | Frontend wiring deferred pending SoulCableCarPage port |
| PlaceBasicInfo in SoulCableCarPage | none | NOT_CONNECTED | Required during port |
| Social proof elements | none | NOT_IMPLEMENTED | Requires product decision first |
| MAEK persistent memory | none | NOT_IMPLEMENTED | Separate phase |
| course.blocks[] → UI | staging | ADAPTER_LIMIT | Journey Composer not wired |

---

## §10. Continuity Control Evaluation

| Control | Status | Value | Priority |
|---|---|---|---|
| A: Write product vision SSOT from Founder concept | NOT_DONE | HIGH — prevents recurrence | IMMEDIATE |
| B: Define D2 decision in own document | NOT_DONE | HIGH — breaks reference chain | IMMEDIATE |
| C: Update DREAMTOWN_STATUS.md to Phoenix era | NOT_DONE | MEDIUM — mandated first-read is misleading | NEXT |
| D: Add "phoenix-era" pointer in DREAMTOWN_STATUS.md | NOT_DONE | MEDIUM | NEXT |
| E: Recover/create SNAPSHOT document | NOT_DONE | LOW — historical context only | LATER |
| F: Document social proof elements as unresolved | NOT_DONE | MEDIUM — undetected gap | IMMEDIATE |

---

## §11. Code as Preservation Mechanism

**The code (staging SoulCableCarPage.jsx) is the best existing preservation artifact for the product model.**

However, code preserves STRUCTURE, not INTENT:
- Element ordering (QUESTION_COMPOSER → SOUL_MESSAGE → PLACE_HERO → ...) is recoverable
- WHY certain elements exist (e.g., why SOUL_JUDGMENT precedes JOURNEY) is not recoverable from code alone
- Missing elements (social proof, local knowledge) are invisible from code — code absence ≠ "intentionally absent"
- D2 rationale ("why questions don't replace the page") cannot be derived from JSX structure

**Verdict:** Code preserves structure at ~60% fidelity. Intent, missing elements, and decision rationale are not code-recoverable.

---

## §12. Root Cause Decision

**PRIMARY ROOT CAUSE: VISION_NOT_TRANSCRIBED**

The Founder's conversational travel detail page model was not transcribed into a repository SSOT document before or during implementation. The concept existed in design conversations / visual mockups but was never committed to the repository.

**SECONDARY: HANDOVER_CHAIN_GAP**

The mandated read chain (DREAMTOWN_STATUS.md → Phoenix handovers) provides ZERO Phoenix-era product context to a new session. A session following CLAUDE.md instructions literally arrives blind to all SOUL/Phoenix work.

**TERTIARY: REFERENCED_DOCUMENT_ABSENT**

`DREAMTOWN_SOUL_JOURNEY_SNAPSHOT_WORKING_HYPOTHESIS_2026_09_29.md` is cited as evidence but does not exist in the repository. D2's defining document also does not exist.

---

## §13. Recommended Remediation

### IMMEDIATE

**R1: Write SOUL Product Vision SSOT**
- Document: `docs/ssot/SSOT-SOUL-001_SOUL_Travel_Detail_Page_Product_Vision.md`
- Content: Founder concept elements + rationale + current implementation mapping + missing elements
- Requires: Founder confirmation of element list before writing

**R2: Write D2 Decision Record**
- Document: `docs/decisions/DECISION-D2-Living-Detail-Page.md`
- Content: "Living Detail Page = canonical experience, questions do NOT replace the page" + why + scope
- Requires: Founder confirmation of original D2 reasoning before writing

**R3: Document missing elements as explicit gap**
- Add to memory: "먼저 다녀간 소원이" + "여수를 아는 사람들의 시선" = PRODUCT_UNRESOLVED, not IMPLEMENTED
- These are not in staging code and must be explicitly re-decided, not assumed implemented

### NEXT

**R4: Update DREAMTOWN_STATUS.md**
- Add Phoenix section header at top: "Project Phoenix (2026-09+): [pointer to Phoenix handover docs]"
- Minimal change — preserves existing content, adds Phoenix pointer

**R5: Complete SoulCableCarPage port to main**
- The port is the highest-value product action (confirmed by Closure Review)
- During port: connect PlaceBasicInfo to ESSENTIAL_INFO slot

### LATER

**R6: Recover SNAPSHOT document**
- Either recreate from memory or remove the citation

---

## §14. Completion Report

| # | Item | Value |
|---|---|---|
| 1 | Audit mode | STRICT READ-ONLY / FORENSIC / NO IMPLEMENTATION |
| 2 | Incident confirmed | YES — original product model NOT_MEANINGFULLY_PERSISTED |
| 3 | Original concept terms found | ZERO — no matches in repository |
| 4 | "Living Detail Page" label | Found in 4 docs — as engineering label, not product vision |
| 5 | D2 decision defining document | ABSENT — referenced, not findable |
| 6 | DREAMTOWN_STATUS.md Phoenix coverage | ZERO — dated 2026-04-04 |
| 7 | PHOENIX_HANDOVER product vision coverage | ZERO — covers architecture only |
| 8 | Staging SoulCableCarPage element count | 9 elements (from SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md) |
| 9 | Founder concept elements implemented | ~50% (SOUL_MESSAGE yes; social proof elements absent) |
| 10 | Referenced doc absent | DREAMTOWN_SOUL_JOURNEY_SNAPSHOT_WORKING_HYPOTHESIS_2026_09_29.md |
| 11 | Primary root cause | VISION_NOT_TRANSCRIBED |
| 12 | Secondary root cause | HANDOVER_CHAIN_GAP (mandated first-read: 6 months stale) |
| 13 | Tertiary root cause | REFERENCED_DOCUMENT_ABSENT |
| 14 | Basic Info work impact | BASIC_INFO_WORK_PREPARES_SOUL_PORT — correct sequencing |
| 15 | Directional drift | PARTIAL_DRIFT — port gap known; social proof gap undetected |
| 16 | Immediate remediation | R1: SOUL Product Vision SSOT (requires Founder confirmation) |
| 17 | Immediate remediation | R2: D2 Decision Record (requires Founder confirmation) |
| 18 | Immediate remediation | R3: Document social proof elements as PRODUCT_UNRESOLVED |
| 19 | Next remediation | R4: DREAMTOWN_STATUS.md Phoenix pointer + R5: SoulCableCarPage port |
| 20 | Audit decision | **AUDIT_COMPLETE — root cause confirmed, remediation plan ready** |

---

## §15. Founder Questions

Before IMMEDIATE remediation (R1/R2/R3) can proceed, Founder confirmation is required:

**Q1:** Is the full list of original SOUL detail-page elements: QUESTION_COMPOSER / SOUL_MESSAGE / PLACE_HERO / ESSENTIAL_INFO / FOR_ME / SOUL_JUDGMENT / JOURNEY / COST / DEPTH + the missing "먼저 다녀간 소원이" + "여수를 아는 사람들의 시선"?

**Q2:** What was the original D2 decision rationale — why are questions additive to the Living Detail Page rather than replacing it?

**Q3:** Should "먼저 다녀간 소원이" and "여수를 아는 사람들의 시간" be treated as Phase 2 feature requirements or as currently deferred out of scope?

**Q4:** Should DREAMTOWN_STATUS.md be updated now (R4), or is it intentionally kept as the pre-Phoenix DreamTown record?

---

## Audit Evidence Path

`docs/architecture/SOUL_PRODUCT_CONTINUITY_INCIDENT_AUDIT_V0_1.md`  
**Implementation:** NO changes. Read-only audit only.  
**Files read:** DREAMTOWN_STATUS.md, PHOENIX_HANDOVER_2026_09_21.md, MUYEOJEONG_MAEK_MASTER_HANDOVER_2026_09_20.md, SOUL_LIVING_DETAIL_PAGE_SIMPLE_PLACE_SWITCHING_IMPL_V0_1.md, SOUL_PLACE_IDENTITY_CONNECTION_SCOPE_V0_1.md, SOUL_LEGACY_JOURNEY_RESTORATION_AUDIT_V0_1.md, SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md, SOUL_DELEGATION_CLARIFICATION_CONTRACT_AUDIT_V0_1.md, aurora5-master-knowledge-v2.md, .claude/team-memory/*, STORYBOOK_MUYEOJEONG_TARGET_ARCHITECTURE_OPTIONS_2026_09_19.md  
**Grep scans:** 12 targeted pattern searches across full repository
