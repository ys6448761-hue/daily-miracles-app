# SOUL Origin-aware Journey Judgment Connection V0.1 — Scope Verification
Date: 2026-10-01
Branch: staging/storybook-c7a
HEAD: daeec4e
Status: SCOPE VERIFIED / IMPLEMENTATION NOT APPROVED
Review: ACCEPT (2026-10-01)
Code changes: NONE. Runtime changes: NONE.

---

## 1. departure_origin End-to-End Trace

| Step | File | Line | State | Note |
|---|---|---|---|---|
| GPT extraction | `contextExtractionService.js` | — | **PRESERVED** | `departure_origin` in GPT schema |
| `parseUserMessage()` return | `contextExtractionService.js` | 105 | **PRESERVED** | `departure_origin: extracted.departure_origin ?? null` |
| `_correctCoupleClassification()` | `soyeowoolService.js` | 305 | **PRESERVED** | spread-copies soulContext |
| `_understand()` return | `soyeowoolService.js` | 319 | **PRESERVED** | returns full soulContext |
| `_buildDomainContext()` | `soyeowoolService.js` | 375–401 | **DROPPED ← EXACT DROP POINT** | Not in return object |
| `_supplementDomainFromSharedJourney()` | `soyeowoolService.js` | 341 | **NOT_MAPPED** | adds only time_of_day + mobility_constraint |
| `travelGuideService.recommend(domainContext)` | `travelGuideService.js` | 23 | **NOT_MAPPED** | never reads departure_origin |
| `_composeJourney(candidates, context)` | `travelGuideService.js` | 276 | **NOT_MAPPED** | never reads departure_origin |
| `_buildJourneyBlocks()` | `travelGuideService.js` | 437 | **NOT_MAPPED** | never reads departure_origin |
| journey_ctx write-back | `soyeowoolService.js` | 1456 | **PRESERVED** | written to DB as independent JSONB key |

**Exact drop point: `soyeowoolService._buildDomainContext()` lines 375–401.**
`soulContext` has `departure_origin`; the return object does not include it.

---

## 2. Current domainContext Contract

`_buildDomainContext(soulContext, sessionId, hotelId)` return fields (exact):

```
session_id, entry_point, user_mode, country_code, city_code,
time_available_minutes, people_type, companion_constraints,
meal_context, has_car, mobility_type, wish_context,
exclude_place_ids, must_visit_place_ids,
time_of_day, preference_type, budget_constraint, group_size,
requested_count, mobility_constraint,
_domainFallbacks
```

### Field classification for departure_origin connection

| Field | In domainContext? | Verdict |
|---|---|---|
| `departure_origin` | No | **NOT_EXISTING** |
| `hotel_code` | No | **NOT_EXISTING** — quoteCtx carries it, not domainContext |
| `hotel_lodging` | No | **NOT_EXISTING** |
| `origin` | No | **NOT_EXISTING** |
| `destination` | No | **NOT_EXISTING** |
| `current_place` | No | **NOT_EXISTING** |
| `entry_point` | Yes (`hotelId \|\| soulContext.entry_point \|\| 'YEOSU_GENERAL'`) | **LEGACY_SEMANTICS** — hotel partner code / general tag, not semantic role |
| `must_visit_place_ids` | Yes | **REUSE_AS_IS** — already anchors must-visit places |
| `time_of_day` | Yes | **REUSE_AS_IS** |
| `mobility_constraint` | Yes | **REUSE_AS_IS** |

---

## 3. Journey Composer — What It Actually Uses

`travelGuideService.recommend(context)` reads:
- `entry_point` — hardcoded RAMADA→jaisan_park exclusion (line 39)
- `exclude_place_ids`, `must_visit_place_ids` — DB query filters
- `country_code`, `city_code` — DB query
- `time_available_minutes` — time slot + stop count
- `has_car` — transport filter
- `companion_constraints` — accessibility filter
- `people_type`, `wish_context`, `user_mode` — emotion sort
- `weather` — weather filter
- `mobility_constraint` — low_walking filter

`_composeJourney(candidates, context)` reads:
- `time_available_minutes`, `requested_count` — stop count
- `meal_context` — meal block inclusion
- `country_code`, `city_code` — cafe/benefit query
- `people_type`, `companion_constraints`, `time_of_day`, `preference_type`, `budget_constraint` — scoring/reason generation

**Neither `departure_origin`, `hotel_code`, `origin`, `destination`, nor `current_place` appears anywhere in Journey Composer logic.**

---

## 4. Journey Composer Consumption Verdict

**Verdict: B — field would be passed but existing logic would NOT use it.**

There is no geography-based ordering in `_composeJourney` or `_buildJourneyBlocks`. Place selection is score-based (traveler fit score), not proximity-to-departure-based. Forwarding `departure_origin` into domainContext makes it available but Composer does not consume it.

The one near-connection: `entry_point.includes('RAMADA')` → excludes `jaisan_park`. This is a **hardcoded business rule**, not departure semantics.

---

## 5. RAMADA Departure vs Lodging Separation State

| Layer | Separation Status |
|---|---|
| `_extractSemanticRoles()` | **CORRECT** — departure_origin (에서 출발) vs hotel_lodging (에서 숙박) deterministically separated |
| `_hotelCodeForSkeleton()` | **CORRECT** — uses only hotel_lodging for lodging nodes; departure-only → null |
| journey_ctx DB write-back | **PRESERVED** — both written as independent JSONB keys |
| `_buildDomainContext()` | **NEITHER REACHES** — both departure_origin and hotel_lodging are dropped here |
| `travelGuideService` / Journey Composer | **NEITHER REACHES** — not in domainContext |

**The separation is correct in routing and DB, but both roles are lost before Journey Composer.**

---

## 6. Journey Composer — Can Existing Logic USE departure_origin After Forwarding?

**No — not without new logic.**

Forwarding `departure_origin` into domainContext (1 line) makes it available to Composer, but:
- `_selectPlacesByTime()` doesn't check origin
- `_calculateTravelerFitScore()` doesn't weight proximity to origin
- `_buildJourneyBlocks()` doesn't reorder by departure point
- No "start from X" or "sort by distance from X" function exists anywhere in the pipeline

The only actionable effect today: a downstream consumer could read `domainContext.departure_origin` and act on it. Composer itself does not act on it.

---

## 7. Minimum Implementation Files

**Exactly 1 file change for EXISTING_CONNECT (forward-only):**

`services/soyeowoolService.js` → `_buildDomainContext()` (line ~401 return block)

```javascript
// Add to return:
departure_origin: soulContext.departure_origin || null,
```

Risk: LOW. Additive. travelGuideService ignores unknown fields. No contract change downstream.
Effect: departure_origin reaches domainContext; Composer still does not consume it (SEMANTIC_GAP remains).

**No other file changes needed for EXISTING_CONNECT scope.**

---

## 8–14. Classification Matrix

### EXISTING_CONNECT
- Add `departure_origin` to `_buildDomainContext()` return — 1 line, soulContext already has it

### EXISTING_MAPPING
- `must_visit_place_ids` can already anchor cable car as must-visit (already working)
- No clean mapping found for departure_origin → existing Composer field

### SEMANTIC_GAP
- `departure_origin` stored in journey_ctx DB ✓; NOT consumed by Journey Composer
- `hotel_lodging` stored in journey_ctx DB ✓; NOT consumed by Journey Composer (only routeSkeletonService uses it via `_hotelCodeForSkeleton`)
- Journey Composer place ordering is score-based, not departure-origin-aware

### PRESENTATION_GAP
- SOUL message (`_generateSoulMessage()` / prepared SOUL_DISCOVERY texts) does not acknowledge departure_origin
- 오동도 Place Identity: page title/hero always = cable car regardless of user query context

### LEGACY_CONFLICT
- `entry_point` repurposing for departure_origin: LEGACY_CONFLICT — entry_point = partner/hotel code (e.g. 'RAMADA', 'YEOSU_GENERAL'); departure_origin = named departure place. Different semantics; conflating would break partner routing.

### GOVERNANCE_HOLD
- Travel Time Matrix: `travel_transition.estimated_duration_range` → null. Departure-to-first-place transition time = also null.

### TRUE_NEW_REQUIRED
- Geography-based place ordering from departure point: no such logic exists in Journey Composer or anywhere in the pipeline. Score-based ordering only.
- "Start from X" journey structure (departure block as first course element): not in `_buildJourneyBlocks()`. course.blocks[0] is always first SOUL-recommended place, never a departure node.

---

## 15. Capability / Authority / Required Evidence Summary

| Component | Capability | Authority | Required Evidence |
|---|---|---|---|
| `contextExtractionService` | GPT-4 extraction → TravelGuideContext; now includes departure_origin/hotel_lodging | Defines semantic role field schema | Raw user message |
| `soyeowoolService` | Orchestration; semantic role separation; domainContext assembly | Controls what enters domainContext (exact drop point) | soulContext (from contextExtraction) |
| `travelGuideService` / Journey Composer | Place selection by score; course block assembly; meal/cafe/transition blocks | Decides which places appear and in what order | domainContext (currently: time/companion/meal context) |
| `routeSkeletonService` | Calendar-anchored locked route with hotel check-in/out nodes | hotel_lodging canonical_code → lodging skeleton | hotel_code from `_hotelCodeForSkeleton` |
| `quoteEngine` | Price calculation | Hotel + leisure quote | hotel_code, leisure_code, travel_date, guest_count |
| `SoulCableCarPage` | Cable Car detail page; Travel Intelligence overlay (course/route/quote) | Page identity always = cable car; journey cards are overlay | API response (soulResponse.course / route / quote) |

---

## 16. 오동도 Place Identity — Same Root as departure_origin Problem?

**Answer: Different problems.**

| Dimension | departure_origin gap | 오동도 Place Identity |
|---|---|---|
| Layer | Service layer (data flow) | Presentation layer (page identity) |
| Problem | `departure_origin` dropped at `_buildDomainContext()` — never reaches Composer | SoulCableCarPage hero/title/SOUL_DISCOVERY are hardcoded to cable car regardless of user query |
| Location | `soyeowoolService.js:375` | `SoulCableCarPage.jsx` SOUL_DISCOVERY static texts + page structure |
| Fix type | 1-line additive in `_buildDomainContext()` | Separate scope — page-level place context API or stateIndex expansion |
| Composer involved? | Yes (upstream of Composer) | No (Composer output is used; page framing is separate) |

**Both are context-forwarding problems but at different layers:**
- departure_origin: service-layer data flow gap
- 오동도: presentation-layer page identity anchor (cable car page context ≠ query context)

Not the same root. Do not conflate in implementation scope.

---

## 17. Founder Decision Items

**Count: 1**

> **Decision: What does "departure_origin → Journey Composer connection" mean?**

- **Option A (EXISTING_CONNECT — 1 line):** Forward `departure_origin` into `_buildDomainContext()`. Makes it available in domainContext for any future consumer. Current Journey Composer behavior unchanged — it ignores the field. Departure origin is "in the pipe" but Composer doesn't act on it.

- **Option B (EXISTING_CONNECT + TRUE_NEW_REQUIRED):** Forward `departure_origin` AND add geography-based place ordering to Journey Composer (sort/filter by proximity to departure point). Requires new logic in `_composeJourney` / `_calculateTravelerFitScore`. No such logic exists anywhere.

Option A is low-risk, 1 line, additive.
Option B requires new journey ordering logic that does not exist in the codebase.

---

## 18. Recommended Next Action (Exactly 1)

**Founder Decision on Option A vs Option B (§17), then:**

If **Option A approved:**
Forward `departure_origin` into `_buildDomainContext()` — 1-line EXISTING_CONNECT in `services/soyeowoolService.js`. No other changes. Composer receives field; behavior unchanged until downstream logic reads it.

If **Option B required:**
Separate scope definition needed before implementation — geography-based ordering is TRUE_NEW_REQUIRED. Not a V0.1 scope item.

**Minimum recommendation:** Option A first (1 line, zero risk), then evaluate whether Composer-level geography ordering is a separate project.

---

## Evidence References

- `services/soyeowoolService.js` lines 375–401: `_buildDomainContext()` return (drop point)
- `services/soyeowoolService.js` lines 341–366: `_supplementDomainFromSharedJourney()` (also does not add departure_origin)
- `services/soyeowoolService.js` line 1456: journey_ctx write-back (departure_origin preserved in DB)
- `services/contextExtractionService.js` line 105: `departure_origin` in parseUserMessage() return
- `services/travelGuideService.js` line 39: `entry_point.includes('RAMADA')` hardcoded rule (only departure-adjacent logic)
- `services/travelGuideService.js` lines 276–338: `_composeJourney()` — no departure_origin reference
- `services/travelGuideService.js` lines 437–519: `_buildJourneyBlocks()` — no departure_origin reference
- Origin Preservation impl: `docs/architecture/SOUL_GOLDEN_QUESTION_ORIGIN_PRESERVATION_IMPL_V0_1.md`
- Legacy Journey impl: `docs/architecture/SOUL_LEGACY_JOURNEY_PRESENTATION_RESTORATION_IMPL_V0_1.md`

---

## 19. Review Conclusions (2026-10-01 ACCEPT)

### Canonical State Summary

| Item | State |
|---|---|
| departure_origin extraction (contextExtractionService) | **PRESERVED** |
| departure_origin in journey_ctx DB | **PRESERVED** |
| departure_origin in _buildDomainContext() | **DROPPED** |
| Journey Composer departure_origin consumer | **NONE** |
| Simple pipe connection (Option A) | **POSSIBLE — but no current judgment effect** |
| Geography ordering (Option B) | capability **NOT_EXISTING** / product requirement **NOT YET DECIDED** |
| entry_point reuse as departure_origin | **LEGACY_SEMANTICS — REUSE FORBIDDEN** |
| Travel Time | **GOVERNANCE_HOLD** |

### Why Implementation Not Approved

**Option A** (forward-only, 1 line): Technically possible. Rejected because Journey Composer has no consumer for departure_origin — pipe connection alone produces zero judgment change. Forwarding a field nobody reads is not a V0.1 deliverable.

**Option B** (geography ordering): Capability does not exist in Repository. More importantly, whether geography-based ordering from departure point is the correct Journey Judgment for SOUL has no Product Evidence yet. **"TRUE_NEW_REQUIRED capability"** ≠ **"TRUE_NEW_REQUIRED product requirement."** The distinction is recorded explicitly.

### Place Identity Observation (Browser Evidence)

"오동도" 질문 시:
- Odongdo recognized ✓
- Odongdo response/course context generated ✓
- Page Identity remains Cable Car (title/hero/basic info)

**Common observation across both gaps:**
> Place recognition ≠ Semantic role consumption

**Root cause judgment:** departure_origin gap and Odongdo Place Identity gap have **different direct root causes**:
- departure_origin: service-layer data flow (dropped at _buildDomainContext)
- Odongdo: presentation-layer page identity anchor (SoulCableCarPage is cable car context)

Not the same root. Not to be conflated in implementation scope. Not yet an Architecture Candidate.

### Current Next Action (exactly 1)

**SOUL Multi-turn Traveler Context Continuity V0.1 — READ-ONLY Existing Capability Audit**

Purpose: When a traveler explores multiple places and situations then delegates "그럼 일정 짜줘", determine what prior-turn context the Repository currently preserves and can forward to Journey Composer.

Scope: session lifecycle, journey_ctx, Shared Journey, must_visit_place_ids, exclude_place_ids, companion context, vehicle/mobility, date, guest_count, explored/selected places, place semantic roles.

Constraints: No new Memory Architecture. No new Traveler State schema. No new field. No new Dispatch Gate. Existing capability audit only.
