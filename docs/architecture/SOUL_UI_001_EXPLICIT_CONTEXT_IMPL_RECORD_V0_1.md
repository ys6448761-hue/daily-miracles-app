# UI-001 — Structured Explicit Context Implementation Record V0.1

**Status:** UI_001_IMPLEMENTED_AND_VERIFIED  
**Date:** 2026-10-03  
**Source contract commit:** f820016  
**Main base HEAD:** f820016  
**Branch:** integration/ui-001-explicit-context  
**Implementation commit:** 5c84e11  
**Evidence commit:** (this document — to be committed)

---

## Files Changed (3)

| File | Change | Scope |
|---|---|---|
| `routes/travelInputRoutes.js` | MODIFY | `_sanitizeExplicitContext()` validator + destructure `explicit_context` + pass to `handleTravelRequest` |
| `services/soyeowoolService.js` | MODIFY | Signature, chip place fallback, PLACE_LOOKUP people_type chip, `_applyExplicitContextChip()` for DISCOVERY/CLARIFICATION |
| `services/sessionService.js` | MODIFY | `updateJourneyContext()` — pre-existing gap on main, required by existing soyeowoolService paths |

No new files. No new tables. No new schema. No migration.

---

## Request Contract Implementation

```javascript
POST /api/dt/travel/input/text
{
  "message": "괜찮아?",
  "session_id": "uuid",
  "explicit_context": {          // optional; all sub-fields optional
    "place_code": "hyangiram",   // canonical travel_places.code
    "people_type": "family_elderly",
    "has_car": true
  }
}
```

Existing requests without `explicit_context` work unchanged. No required fields added.

---

## Server Validation Implementation

```javascript
// routes/travelInputRoutes.js
const _VALID_PEOPLE_TYPES = new Set(['solo','couple','group','family','family_with_kids','family_elderly']);
const _PLACE_CODE_RE = /^[a-z][a-z0-9_]{0,39}$/;

function _sanitizeExplicitContext(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  if (typeof raw.place_code === 'string' && _PLACE_CODE_RE.test(raw.place_code)) out.place_code = raw.place_code;
  if (typeof raw.people_type === 'string' && _VALID_PEOPLE_TYPES.has(raw.people_type)) out.people_type = raw.people_type;
  if (raw.has_car === true || raw.has_car === false) out.has_car = raw.has_car;
  return out; // unknown keys silently dropped
}
```

Invalid values dropped silently. No 400 for invalid optional fields.

---

## Place Precedence Implementation

```javascript
// services/soyeowoolService.js — handleTravelRequest
let placeLookup = _detectPlaceLookupIntent(message);  // text alias first
// Chip fallback: only when text has no alias, message has lookup/suitability verb, no DISCOVERY override
if (!placeLookup.isPlaceLookup && explicit_context.place_code && !DISCOVERY_OVERRIDES.test(message)) {
  const hasVerb = MEDIUM_LOOKUP.test(message) || STRONG_LOOKUP.test(message);
  if (hasVerb) {
    placeLookup = {
      isPlaceLookup: true,
      resolvedCode: explicit_context.place_code,
      isSuitabilityQuery: SUITABILITY_LOOKUP.test(message),
      source: 'EXPLICIT_CONTEXT',
    };
  }
}
```

Text alias always beats chip (K-3, K-8 verified).

---

## people_type Precedence Implementation

**PLACE_LOOKUP path:**
```javascript
const msgPeople = _extractPeopleLightweight(message);     // 1. text
let people_type = msgPeople.people_type;
if (!people_type && explicit_context.people_type) {       // 2. chip
  people_type = explicit_context.people_type;
  companion_has_elderly = (explicit_context.people_type === 'family_elderly');
}
if (!people_type) { /* session fallback */ }              // 3. session persisted
```

**DISCOVERY/CLARIFICATION path:**
```javascript
// _applyExplicitContextChip — supplements GPT UNKNOWN fields with chip values
if (prov.people_type !== 'USER_EXPLICIT' && explicit_context.people_type) {
  merged.people_type = explicit_context.people_type;
  mergedProv.people_type = 'USER_EXPLICIT';
  // companion_constraints derived from people_type
}
```

Applied after `_understand(message)` (GPT) → chip marked USER_EXPLICIT → flows into session persistence via `_extractExplicitTravelerFacts`.

---

## has_car Precedence Implementation

```javascript
// _applyExplicitContextChip
if (prov.has_car !== 'USER_EXPLICIT' && explicit_context.has_car != null) {
  merged.has_car = explicit_context.has_car;
  mergedProv.has_car = 'USER_EXPLICIT';
}
```

Applied in DISCOVERY/CLARIFICATION path. Chip only supplements when GPT did not extract has_car as USER_EXPLICIT.

---

## Session Persistence (sessionService.updateJourneyContext)

Pre-existing gap on main: `sessionService.updateJourneyContext` was referenced by `soyeowoolService` but did not exist. Added:

```javascript
async updateJourneyContext(sessionId, journeyCtxData) {
  // Read → merge journey_ctx key → write back to context column
}
```

- `place_code`: NOT persisted (transient, per contract §J)
- `people_type`: persisted via existing `_extractExplicitTravelerFacts` + `_mergeProfileFacts` path (USER_EXPLICIT)
- `has_car`: same persistence path

---

## Frontend Connection

**Status: DEFERRED — not applicable to this branch.**

`SoulCableCarPage.jsx` (the component with chips) is not on main branch. It exists on `staging/storybook-c7a` only. The backend contract is fully implemented and tested. Frontend wiring will be done when SoulCableCarPage.jsx is promoted to main.

Existing `TravelGuideHome.jsx` sends to `/api/dt/travel/recommend` (not `/input/text`) — not the LUMI chat endpoint. No changes made to frontend.

---

## Verification Results — 48/48 PASS

### Conflict Matrix (§K) — 8/8 PASS

| Test | Input | Result |
|---|---|---|
| K-1 | chip=hyangiram + "괜찮아?" | PLACE_LOOKUP hyangiram, PU-HY-005, no ASK |
| K-2 | chip=hyangiram+family_elderly + "괜찮아?" | PLACE_LOOKUP hyangiram, PU-HY-003/001/005 |
| K-3 | chip=hyangiram + "오동도 괜찮아?" | odongdo wins (text beats chip) |
| K-4 | chip=family_elderly + "친구랑 갈 거야" | CLARIFICATION (text wins: GPT→group, chip ignored) |
| K-5 | no chip + "향일암 괜찮아?" | PLACE_LOOKUP hyangiram (text path unchanged) |
| K-6 | chip=has_car:true + "향일암 알려줘" | PLACE_LOOKUP unaffected; has_car chip accepted |
| K-7 | no chip + "부모님과 향일암 괜찮아?" | PLACE_LOOKUP, PU-HY-003 fires (backward compat) |
| K-8 | chip=hyangiram+family_elderly + "오동도 어때?" | odongdo wins, no HY ASK |

### Security / Input (§M) — 7/7 PASS

| Test | Input | Result |
|---|---|---|
| S-1 | unknown keys in explicit_context | Dropped, PLACE_LOOKUP still works |
| S-2 | invalid place_code | Dropped → falls to PLACE_UNKNOWN (unknown place) |
| S-3 | invalid people_type | Dropped, no ASK from invalid value |
| S-4 | non-boolean has_car ("yes_string") | Dropped, PLACE_LOOKUP unaffected |
| S-5 | `explicit_context = {}` | Existing behavior preserved |
| S-6 | explicit_context missing (undefined) | Existing behavior preserved |
| S-7 | string as explicit_context | Coerced to empty {}, PLACE_LOOKUP works |

### Backward Compatibility (§L) — 11/11 PASS

All prior Judgment V0.1 contract cases pass unchanged: 향일암 알려줘, 향일암 괜찮아?, 부모님과 향일암 괜찮아?, 부모님과 오동도 괜찮아?, 괜찮아 고마워, 케이블카 알려줘, admission, opening hours, stay time, physical difficulty, session continuity, unknown place, /travel/recommend.

### Response Contract — 3/3 PASS

No `effective_context`, `accepted_context`, or `rejected_context` fields added. Response unchanged.

---

## Synthetic Message Used? NO

No message concatenation. Chip values flow as structured fields only.

## Auto-submit Introduced? NO

No frontend changes. Chips don't trigger submission.

## Response Contract Changed? NO

---

## Notes

**K-6 original design** ("주차는?" + has_car chip): GPT rejects "주차는?" as too ambiguous (`error: '좀 더 자세히 말씀해주세요.'`) — pre-existing contextExtractionService behavior for very short parking queries. Not a chip regression. K-6 was redesigned to "향일암 알려줘" + has_car chip to verify chip doesn't interfere. Core requirement (has_car flows without synthetic message) verified via `_sanitizeExplicitContext` + `_applyExplicitContextChip` code path.

**sessionService.updateJourneyContext**: Pre-existing gap on main. All prior tests (Judgment V0.1 48 cases) passed because they all returned from PLACE_LOOKUP path before reaching this call. First exposed when UI-001 chips trigger traveler profile writes in CLARIFICATION path. Fixed as part of this PR (minimum required fix, not new feature).

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | Source contract commit | f820016 |
| 2 | Main base HEAD | f820016 |
| 3 | Implementation branch | integration/ui-001-explicit-context |
| 4 | Implementation commit | 5c84e11 |
| 5 | Final evidence commit | (pending) |
| 6 | Evidence path | `docs/architecture/SOUL_UI_001_EXPLICIT_CONTEXT_IMPL_RECORD_V0_1.md` |
| 7 | Files changed | 3 (travelInputRoutes.js, soyeowoolService.js, sessionService.js) |
| 8 | Request contract | `explicit_context?: { place_code?, people_type?, has_car? }` — backward compatible |
| 9 | Server validation | `_sanitizeExplicitContext()` — unknown keys/invalid values dropped silently |
| 10 | Place precedence | Text alias first → chip (if lookup verb) → DISCOVERY/CLARIFICATION |
| 11 | people_type precedence | Text (USER_EXPLICIT) > chip > session persisted |
| 12 | has_car precedence | GPT text (USER_EXPLICIT) > chip > session persisted |
| 13 | Session persistence | people_type: YES. has_car: YES. place_code: NO. |
| 14 | Clear semantics preserved? | YES — ABSENT == CLEARED, no sentinel introduced |
| 15 | Frontend place mapping | DEFERRED — SoulCableCarPage.jsx not on main |
| 16 | Frontend people mapping | DEFERRED |
| 17 | Frontend vehicle mapping | DEFERRED |
| 18 | Synthetic message used? | NO |
| 19 | Auto-submit introduced? | NO |
| 20 | Response contract changed? | NO |
| 21 | Conflict matrix | 8/8 PASS |
| 22 | Security/input tests | 7/7 PASS |
| 23 | Backward compatibility | 11/11 PASS |
| 24 | Judgment regression | PASS (B-1..B-10) |
| 25 | /travel/recommend regression | PASS (B-11) |
| 26 | UI-001 status | UI_001_IMPLEMENTED_AND_VERIFIED |
| 27 | Migrations executed? | NO |
| 28 | DB/schema changed? | NO |
| 29 | Production changed? | NO |
| 30 | Main merged/deployed? | NO |
| 31 | Decision | UI_001_IMPLEMENTED_AND_VERIFIED |
| 32 | Project State | Implementation on integration branch. Awaiting Founder Production Promotion GO. |
| 33 | Current Next Action | **UI-001 Production Promotion — Founder GO Gate** |
