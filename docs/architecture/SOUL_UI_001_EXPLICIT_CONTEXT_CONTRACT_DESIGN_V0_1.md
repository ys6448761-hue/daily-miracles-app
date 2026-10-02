# UI-001 — Structured Explicit Context Contract Design V0.1

**Mode:** READ-ONLY / DESIGN / CONTRACT  
**Status:** CONTRACT_READY_FOR_IMPLEMENTATION  
**Date:** 2026-10-03  
**HEAD before:** d3e7f0e  
**Scope:** Production Checkpoint d3e7f0e (SOUL Judgment V0.1 live)

---

## §A — Current Contract Trace

### Full request path (production d3e7f0e)

```
1. frontend: user selects chips (local state only — NOT sent)
2. frontend: user types message + presses send
3. frontend: handleSubmit → POST /api/dt/travel/input/text
   Body: { message: string, session_id?: string }
   [explicit_context field does NOT exist]

4. travelInputRoutes.js:27 — destructures { message, session_id, hotel_id }
   [no explicit_context destructured]

5. handleTravelRequest({ message, sessionId, hotelId, principal })
   [no explicit_context parameter]

6. _detectPlaceLookupIntent(message)
   → reads ONLY raw message text
   → alias matching: only detects place names embedded in text

7. PLACE_LOOKUP path (if triggered):
   → _extractPeopleLightweight(message)
     → reads ONLY raw message text for elderly phrases
     → if null: sessionService.getSession() → stored traveler_profile
   → _judgePlaceLookup(place, people_type, companion_has_elderly)

8. DISCOVERY path (if not PLACE_LOOKUP):
   → contextExtractionService.parseUserMessage(message)
     → GPT extracts people_type, has_car, etc. from text
```

### Context-loss boundary (exact)

**LOSS POINT A — Place chip not transmitted:**  
`travelInputRoutes.js:27` destructures only `{ message, session_id, hotel_id }`.  
Any `place_code` from UI chip selection is discarded at HTTP boundary.

**LOSS POINT B — Companion chip not transmitted:**  
`handleTravelRequest` receives only `message`. `_extractPeopleLightweight` reads text only.  
When user types "괜찮아?" (no companion phrase), `people_type = null`, session fallback used.

**LOSS POINT C — Verb mismatch prevents suitability path:**  
Neutral chips emit "향일암 알려줘" (`isSuitabilityQuery = false`) — Judgment not triggered.  
No chip currently emits suitability verbs ("어때?", "괜찮아?").

**LOSS POINT D — `has_car` chip:**  
TravelGuideHome.jsx has a `has_car` checkbox but its value is sent to `/api/dt/travel/recommend`, not to `/api/dt/travel/input/text`. The LUMI text path receives no `has_car` from UI.

---

## §B — Explicit UI Context Inventory

Only contexts already represented in the current UI are listed.

### B1 — Place chip (SoulCableCarPage.jsx)

| Attribute | Value |
|---|---|
| UI source | Place tab or hero button clicks (e.g., "향일암", "오동도", "케이블카") |
| Frontend representation | `selectedPlace` (string alias) or `resolved_code` from prior PLACE_LOOKUP response |
| Backend canonical | `travel_places.code` (hyangiram, odongdo, cablecar, ...) |
| Persisted field | None — place is transient context, not long-term traveler identity |
| Cross API boundary | YES — for this request only (not persisted to session) |

### B2 — Companion chip / people_type (TravelGuideHome.jsx select, SoulCableCarPage chips)

| Attribute | Value |
|---|---|
| UI source | `<select value={formData.people_type}>` or companion chip buttons |
| Frontend representation | `people_type` value (string: family_elderly, couple, solo, ...) |
| Backend canonical | `soyeowoolService._extractPeopleLightweight` → `people_type` → `_judgePlaceLookup` |
| Persisted field | `journey_ctx.traveler_profile.people_type` (USER_EXPLICIT, Traveler Profile Continuity V0.1) |
| Cross API boundary | YES — as explicit context for this request |

### B3 — has_car (TravelGuideHome.jsx checkbox)

| Attribute | Value |
|---|---|
| UI source | "차가 있어요" checkbox |
| Frontend representation | `formData.has_car` (boolean) |
| Backend canonical | `soulContext.has_car` → `_buildDomainContext` → travelGuideService filter |
| Persisted field | `journey_ctx.traveler_profile.has_car` (USER_EXPLICIT, Traveler Profile Continuity V0.1) |
| Cross API boundary | YES — but only if user doesn't express it in text |

### NOT INCLUDED (out of scope per §M)

- time_available_minutes — not a chip (time selector, not relevant to Judgment V0.1)
- mobility detail beyond people_type — V0.1 scope: ASK, not infer
- weather, preference_type, budget — not chip-based in current UI

---

## §C — Contract Principles (Preserved)

1. **User text remains authoritative for current intent.**  
   `message` is always parsed. `_detectPlaceLookupIntent(message)` runs first regardless of `explicit_context`.

2. **Explicit UI selection is context, not synthetic speech.**  
   `explicit_context.place_code` does NOT generate a fake message string. It supplements resolution only.

3. **No concatenation.**  
   Backend MUST NOT construct `"부모님 + 향일암 + 괜찮아?"` from chip values. Each field flows through its own resolution path.

4. **Chip selection does NOT auto-submit.**  
   `explicit_context` is only sent when the user explicitly presses send with a message. No trigger on chip toggle.

5. **Place chip does NOT automatically imply suitability.**  
   `explicit_context.place_code` alone does not invoke Judgment. Suitability requires `isSuitabilityQuery = true` from the message text verb.

6. **Do not infer unselected context.**  
   If `explicit_context.people_type` is absent, treat as ABSENT (not assumed). Do not default to `family_elderly` from presence of place chip.

7. **Explicit precedence:**  
   `CURRENT explicit_context > persisted traveler_profile > UNKNOWN`  
   This mirrors existing `_extractExplicitTravelerFacts` + `_mergeProfileFacts` logic.

8. **Clearing semantics are deterministic** (see §G).

---

## §D — Minimum API Shape

### Recommended request contract

```json
POST /api/dt/travel/input/text
{
  "message": "괜찮아?",
  "session_id": "uuid",
  "explicit_context": {
    "place_code": "hyangiram",
    "people_type": "family_elderly",
    "has_car": true
  }
}
```

### Field names rationale

| Field | Canonical source | Rationale |
|---|---|---|
| `place_code` | `travel_places.code` | Already canonical in DB + PLACE_ALIAS_MAP return value |
| `people_type` | `soulContext.people_type` | Canonical in contextExtractionService + _judgePlaceLookup signature |
| `has_car` | `soulContext.has_car` | Canonical in _buildDomainContext |

No new vocabulary introduced. All three map directly to existing backend fields.

### All fields optional

```javascript
// travelInputRoutes.js (conceptual — DO NOT IMPLEMENT)
const { message, session_id, hotel_id, explicit_context = {} } = req.body;
// explicit_context defaults to empty object — existing requests unchanged
```

---

## §E — Place Semantics

### Case: `explicit_context.place_code = "hyangiram"` + `message = "괜찮아?"`

`_detectPlaceLookupIntent("괜찮아?")` returns `{ isPlaceLookup: false }` (no alias in text).

**Design decision:** When `isPlaceLookup = false` in text BUT `explicit_context.place_code` is present and valid AND `message` contains a suitability verb, resolve as PLACE_LOOKUP using the chip code.

Detection logic (conceptual):

```javascript
// After _detectPlaceLookupIntent(message) returns isPlaceLookup:false
// Check if explicit place chip can satisfy lookup
if (!placeLookup.isPlaceLookup && explicit_context.place_code) {
  const isSuit = SUITABILITY_LOOKUP.test(message) || MEDIUM_LOOKUP.test(message);
  if (isSuit) {
    placeLookup = {
      isPlaceLookup: true,
      resolvedCode: explicit_context.place_code,  // chip provides the code
      isSuitabilityQuery: SUITABILITY_LOOKUP.test(message),
      source: 'EXPLICIT_CONTEXT_CHIP'
    };
  }
  // If message has no lookup verb at all → do NOT force PLACE_LOOKUP
  // e.g. chip=hyangiram + message="어디서 밥 먹어?" → falls through to DISCOVERY
}
```

**Behavior table:**

| `explicit_context.place_code` | message | Result |
|---|---|---|
| hyangiram | "괜찮아?" | PLACE_LOOKUP (hyangiram), isSuitabilityQuery=true |
| hyangiram | "알려줘" | PLACE_LOOKUP (hyangiram), isSuitabilityQuery=false |
| hyangiram | "어디서 밥 먹어?" | DISCOVERY (place chip ignored — no lookup verb) |
| hyangiram | "오동도 괜찮아?" | See Case 2 below |
| (absent) | "괜찮아?" | CLARIFICATION (no place, no lookup alias in text) |

### Case 2: `place chip = hyangiram` + `message = "오동도 괜찮아?"`

Text alias detection runs first and resolves "오동도" → `resolvedCode: 'odongdo'`.

**Rule: Text alias always beats chip.**

Rationale: User is actively redirecting to a different place. Chip represents prior selection. Current text is authoritative for current intent (Principle 1).

```
text alias detection → resolvedCode = 'odongdo'
explicit_context.place_code = 'hyangiram' → IGNORED for this request
```

This is deterministic and observable. No silent overrides.

---

## §F — Traveler Context Semantics

### people_type mapping (UI → canonical)

| UI value | Canonical `people_type` |
|---|---|
| `"solo"` | `'solo'` |
| `"couple"` | `'couple'` |
| `"friends"` | `'group'` |
| `"family_elderly"` | `'family_elderly'` |
| `"family_with_kids"` | `'family_with_kids'` |
| `"group"` | `'group'` |

UI `"부모님과"` chip → `people_type = 'family_elderly'` → `companion_has_elderly = true`.

These are the exact same canonical values already used in `_judgePlaceLookup`, `_buildWhyDetails`, `_generateSoulMessage`. No new mapping layer needed.

### people_type precedence in PLACE_LOOKUP path

Current code (lines 1159–1171):
```javascript
const msgPeople = _extractPeopleLightweight(message);
let people_type = msgPeople.people_type;
if (!people_type) {
  // fall back to session persisted
}
```

With `explicit_context.people_type`, the precedence becomes:

```
current message text (USER_EXPLICIT, raw phrase)
> explicit_context.people_type (USER_EXPLICIT, chip)
> session persisted traveler_profile (USER_EXPLICIT, prior turn)
> null
```

Implementation: after `_extractPeopleLightweight(message)`, if `people_type === null` AND `explicit_context.people_type` is present and validated → use chip value.

### has_car semantics

`explicit_context.has_car` feeds into `_buildDomainContext` (DISCOVERY path only — `has_car` is not used in Judgment V0.1). For V0.1 scope, `has_car` chip is relevant to DISCOVERY path only.

**V0.1 scope:** `has_car` crosses API boundary, used in DISCOVERY (travelGuideService filter). NOT used in PLACE_LOOKUP Judgment path.

### Do NOT infer beyond stated mapping

- `people_type = 'family_elderly'` does NOT imply `mobility_constraint = 'high'`
- `companion_has_elderly = true` does NOT imply `physical_difficulty_override = high`
- Judgment V0.1 correctly asks (PU-HY-003) rather than assuming

---

## §G — Clear / Change Semantics

### Definitions

| Action | Semantics |
|---|---|
| **Selecting** a chip | Sets `explicit_context.people_type` (or `place_code`) — sent on next submit |
| **Replacing** a chip | New selection overwrites prior. Only current chip state at submit time is sent. |
| **Clearing** a chip | Field absent from `explicit_context` on next submit |
| **Submitting after clear** | `explicit_context.people_type` absent → fall through to session persisted |

### ABSENT vs EXPLICITLY_CLEARED

**V0.1 decision: V0.1 does NOT require the ABSENT vs EXPLICITLY_CLEARED distinction.**

Rationale: The existing precedence chain (`current explicit > persisted > null`) already handles this correctly for V0.1 behaviors:

- Chip selected → `explicit_context.people_type = 'family_elderly'` → used this turn
- Chip cleared → `explicit_context.people_type` absent → session persisted fills gap
- User explicitly contradicts chip in text ("친구랑 갈 거야") → `_extractPeopleLightweight` would return null, BUT GPT in DISCOVERY path extracts `'group'` → text beats chip (Principle 1)

The ABSENT vs EXPLICITLY_CLEARED distinction becomes necessary only if:
- The session persisted value should be suppressed when the user removes a chip
- Example: user had `family_elderly` persisted, then removes parent chip, submits "괜찮아?" → should session value apply or not?

**V0.1 ruling:** Session persisted applies when chip is cleared. If the user wants to override persisted context, they express it in text. This keeps V0.1 semantics simple and the precedence chain deterministic.

**V0.2 consideration flag (do not implement):** If product finds that chip-clear should suppress persisted context, introduce `explicitly_cleared: ['people_type']` in V0.2.

---

## §H — Conflict Matrix

| # | place chip | companion chip | message | Text alias | Effective place | Effective people_type | Judgment |
|---|---|---|---|---|---|---|---|
| 1 | hyangiram | (absent) | "괜찮아?" | none | hyangiram (chip) | null → session fallback | PU-HY-005 only (no ASK unless elderly in session) |
| 2 | hyangiram | family_elderly | "괜찮아?" | none | hyangiram (chip) | family_elderly (chip) | PU-HY-003 + PU-HY-001 + PU-HY-005 |
| 3 | hyangiram | (absent) | "오동도 괜찮아?" | odongdo | odongdo (text wins) | null → session fallback | no ASK (odongdo physical_difficulty=low) |
| 4 | (absent) | family_elderly | "친구랑 갈 거야" | none | none → CLARIFICATION | text: group (GPT), chip ignored in DISCOVERY | no PLACE_LOOKUP |
| 5 | (absent) | (cleared) | "향일암 괜찮아?" | hyangiram | hyangiram (text) | session persisted (chip cleared = ABSENT) | ASK if session has elderly |
| 6 | (absent) | (absent) | "주차는?" | none | none → CLARIFICATION | session fallback | no PLACE_LOOKUP |
| 7 | (absent) | (absent) | "부모님과 향일암 괜찮아?" | hyangiram (text) | hyangiram (text) | family_elderly (text) | PU-HY-003 + PU-HY-001 + PU-HY-005 (existing behavior unchanged) |
| 8 | hyangiram | family_elderly | "오동도 어때?" | odongdo (text) | odongdo (text wins) | family_elderly (chip) | no ASK (odongdo low difficulty) |

**Case 4 detail:** message "친구랑 갈 거야" has no lookup verb → DISCOVERY path. GPT extracts `people_type = 'group'`. Chip `people_type = 'family_elderly'` is for explicit_context which feeds `_extractPeopleLightweight` fallback — BUT the DISCOVERY path uses GPT, not `_extractPeopleLightweight`. In DISCOVERY, explicit_context.people_type feeds `_buildDomainContext` only if text extraction returns UNKNOWN. Text "친구랑" gives USER_EXPLICIT `group` → chip overridden by text. ✓ Principle 1 preserved.

**Case 6 detail:** "주차는?" contains no alias, no lookup verb → CLARIFICATION. `has_car` chip (if selected) is in `explicit_context.has_car` → available but irrelevant to CLARIFICATION response. Parking question = CLARIFICATION with awareness of `has_car=true` if wanted for response phrasing.

---

## §I — Server-Side Validation Contract

```javascript
// Allowed keys in explicit_context (unknown keys silently dropped)
const ALLOWED_EXPLICIT_KEYS = ['place_code', 'people_type', 'has_car'];

// Allowed values
const ALLOWED_PEOPLE_TYPES = ['solo', 'couple', 'group', 'family', 'family_with_kids', 'family_elderly'];

// place_code: must exist in PLACE_ALIAS_MAP values (canonical codes only)
const CANONICAL_PLACE_CODES = new Set(Object.values(PLACE_ALIAS_MAP));
// Validation: if place_code provided but not in CANONICAL_PLACE_CODES → drop silently (treat as ABSENT)

// has_car: boolean coercion — if truthy string "true" → true, else boolean
```

**Invalid value handling:**
- `place_code` not in canonical set → silently dropped (ABSENT, not 400)
- `people_type` not in allowed list → silently dropped
- `has_car` non-boolean → coerce or drop
- Unknown keys → silently dropped

**No 400 for invalid explicit_context fields.** The request is valid; only the explicit_context field is invalid. Drop invalid fields, continue with ABSENT semantics. This avoids breaking existing clients that might accidentally include extra fields.

**Rationale:** Explicit context is supplemental. Invalid values are better treated as absent than as errors that block the user's message.

---

## §J — Session Persistence Decision

### V0.1 persistence rules

| Field | Persisted to session? | Rationale |
|---|---|---|
| `explicit_context.place_code` | NO | Place selection is transient context, not traveler identity |
| `explicit_context.people_type` | YES — if valid USER_EXPLICIT | Mirrors existing Traveler Profile Continuity. Companion is durable identity. |
| `explicit_context.has_car` | YES — if provided | Mirrors existing Traveler Profile Continuity. Vehicle is durable context. |

**Place does NOT persist:** "I selected 향일암 just now" ≠ "향일암 is part of my traveler identity." Place chips are request-scoped context only.

**people_type and has_car DO persist:** They follow the existing `journey_ctx.traveler_profile` write path (USER_EXPLICIT flag, merge semantics from `_mergeProfileFacts`).

**Persistence write path (conceptual):**
```javascript
// In handleTravelRequest, after resolving explicit_context:
// Persist explicit people_type and has_car as USER_EXPLICIT — same path as today
if (explicit_context.people_type || explicit_context.has_car != null) {
  const chipFacts = {
    people_type: explicit_context.people_type || null,
    has_car: explicit_context.has_car != null ? explicit_context.has_car : null,
    companion_has_elderly: explicit_context.people_type === 'family_elderly' ? true : null,
    companion_has_kids: explicit_context.people_type === 'family_with_kids' ? true : null,
  };
  // merge + write exactly as _extractExplicitTravelerFacts does today
}
```

---

## §K — Response Contract

**Response contract changes required: NO**

The current response already includes:
- `understood_context.people_type` — echoes effective people_type
- `status` — PLACE_LOOKUP / CLARIFICATION / etc.
- `resolved_code` — canonical place code

Frontend can verify effective_context from these existing fields. No new fields needed.

If debugging needs arise, `understood_context` already carries `people_type` which reflects the effective value used. No `accepted_context` / `rejected_context` envelope needed in V0.1.

---

## §L — Backward Compatibility

**Fully preserved.** Existing requests:
```json
{ "message": "부모님과 향일암 괜찮아?", "session_id": "uuid" }
```
continue working unchanged. `explicit_context` defaults to `{}`. All natural-language Judgment V0.1 paths unchanged.

No frontend context is mandatory. No breaking change to API shape.

---

## §M — Scope Confirmation (Out of Scope)

NOT included in this design:
- auto-submit on chip selection
- new chip taxonomy
- new personalization system
- Journey redesign / Exploration Memory
- Judgment V0.2 / PU-HY-002/004
- Travel Time Matrix / place_knowledge
- new DB schema changes

---

## §N — Options Evaluation

### Option A — `explicit_context` in request payload (RECOMMENDED)

```json
{ "message": "괜찮아?", "session_id": "uuid", "explicit_context": { "place_code": "hyangiram", "people_type": "family_elderly" } }
```

| Criterion | Assessment |
|---|---|
| Semantic correctness | HIGH — chip values are request-scoped context. Sending them with the request that uses them is semantically correct. |
| Implementation complexity | LOW — `travelInputRoutes.js` destructures one new optional field. `handleTravelRequest` receives it and uses it in 2 existing resolution points. |
| Backward compatibility | FULL — `explicit_context` absent = current behavior unchanged. |
| Session behavior | Controlled — only `people_type` and `has_car` persist (place does not). |
| Debuggability | HIGH — request payload is inspectable; contains its own context. |
| User-intent distortion | ZERO — text remains authoritative. Chip is a fallback, not a replacement. |

### Option B — Separate context/session update endpoint

```
PUT /api/dt/travel/session/context
{ "session_id": "uuid", "place_code": "hyangiram", "people_type": "family_elderly" }
```

| Criterion | Assessment |
|---|---|
| Semantic correctness | MEDIUM — chip selection is a UI state event, not a "save my preferences" action. Treating it as a PUT introduces lifecycle complexity. |
| Implementation complexity | HIGH — new endpoint, new session write path, client must issue 2 requests per turn. |
| Backward compatibility | PARTIAL — adds new endpoint; existing flow unchanged but new flow has dependency. |
| Session behavior | PROBLEMATIC — context update may arrive out of order with message POST. Race condition risk. |
| Debuggability | MEDIUM — context and message are in different requests; harder to trace. |
| User-intent distortion | LOW — but over-persists place chip as session state. |

**Option B is NOT recommended for V0.1.** Over-engineering for transient chip state. Race condition risk between PUT and POST.

### Option C — Synthetic message concatenation

Constructs `"부모님과 향일암 괜찮아?"` from chip values + user text before sending.

| Criterion | Assessment |
|---|---|
| Semantic correctness | LOW — violates Principle 3. Creates a fake user utterance the user never said. |
| Implementation complexity | MEDIUM — frontend string assembly; backend unchanged. |
| Backward compatibility | HIGH — backend sees natural language; no change needed. |
| Session behavior | PROBLEMATIC — GPT parses synthetic text; USER_EXPLICIT provenance incorrectly assigned. |
| Debuggability | LOW — request body misrepresents what the user said. Log inspection misleading. |
| User-intent distortion | HIGH — user said "괜찮아?" but backend sees "부모님과 향일암 괜찮아?". Distorts intent audit trail. |

**Option C explicitly prohibited** by Principle 3. Not viable.

---

## §O — Decision

**CONTRACT_READY_FOR_IMPLEMENTATION**

Option A (`explicit_context` in request payload) is the correct design.

### Exact recommended request semantics

```javascript
// Request shape
POST /api/dt/travel/input/text
{
  message: string,            // required
  session_id?: string,        // optional
  hotel_id?: string,          // existing, unchanged
  explicit_context?: {        // optional; all sub-fields optional
    place_code?: string,      // canonical travel_places.code; validated against PLACE_ALIAS_MAP values
    people_type?: string,     // canonical people_type enum
    has_car?: boolean         // boolean
  }
}
```

### Exact precedence rules

**Place resolution:**
1. `_detectPlaceLookupIntent(message)` — text alias always checked first
2. If text resolves a place → use text result (ignore `explicit_context.place_code`)
3. If text does NOT resolve a place AND `explicit_context.place_code` is present AND message contains a lookup/suitability verb → use chip code as `resolvedCode`
4. If text does NOT resolve a place AND no chip → fall through to DISCOVERY / CLARIFICATION

**people_type resolution (PLACE_LOOKUP path):**
1. `_extractPeopleLightweight(message)` — text phrases checked first
2. If text yields `people_type` → use (text wins)
3. If text yields null AND `explicit_context.people_type` present → use chip value
4. If chip also absent → session persisted traveler_profile
5. If session also absent → null (no elderly context)

**people_type resolution (DISCOVERY path):**
1. GPT extraction (`contextExtractionService.parseUserMessage`) — text wins
2. If GPT returns UNKNOWN → use `explicit_context.people_type` as supplement to `_buildDomainContext`
3. Session persisted as fallback (existing Traveler Profile Continuity)

**has_car resolution (DISCOVERY path):**
1. GPT extraction — text wins
2. If UNKNOWN → `explicit_context.has_car`
3. Session persisted

---

## §P — Persistence

**Evidence document:** This file  
**Commit:** (to be made post-design)  
**Evidence path:** `docs/architecture/SOUL_UI_001_EXPLICIT_CONTEXT_CONTRACT_DESIGN_V0_1.md`

---

## Completion Report

| Item | Value |
|---|---|
| 1. HEAD before | d3e7f0e |
| 2. Final evidence commit | (pending — see §P) |
| 3. Evidence path | `docs/architecture/SOUL_UI_001_EXPLICIT_CONTEXT_CONTRACT_DESIGN_V0_1.md` |
| 4. Current request contract | `{ message, session_id?, hotel_id? }` — no explicit_context field |
| 5. Exact context-loss boundary | travelInputRoutes.js:27 destructure + handleTravelRequest signature (see §A) |
| 6. Explicit UI context inventory | place_code, people_type, has_car (see §B) |
| 7. Canonical backend mappings | place_code→travel_places.code, people_type→canonical enum, has_car→boolean (see §F) |
| 8. Recommended API shape | `{ message, session_id?, explicit_context?: { place_code?, people_type?, has_car? } }` |
| 9. Place precedence | Text alias first → chip code if text has lookup verb → DISCOVERY/CLARIFICATION |
| 10. people_type precedence | Text phrase > chip > session persisted > null |
| 11. has_car precedence | GPT text > chip > session persisted |
| 12. ABSENT vs CLEARED decision | V0.1: no distinction. ABSENT = chip cleared. Session fills gap. |
| 13. Session persistence decision | place_code: NO. people_type: YES. has_car: YES. |
| 14. Conflict matrix result | 8 cases covered — text always wins on direct conflict (§H) |
| 15. Server validation contract | Allowed keys drop-silently; no 400 for invalid explicit_context values (§I) |
| 16. Response contract changes required? | NO |
| 17. Backward compatibility | FULL — absent explicit_context = current behavior |
| 18. Option A assessment | RECOMMENDED — low complexity, correct semantics, zero user-intent distortion |
| 19. Option B assessment | NOT RECOMMENDED — race condition, over-persists, 2 requests per turn |
| 20. Option C assessment | PROHIBITED — violates Principle 3, distorts intent audit trail |
| 21. UI-001 status | CONTRACT_READY_FOR_IMPLEMENTATION |
| 22. Code changed? | NO |
| 23. Production changed? | NO |
| 24. DB/schema changed? | NO |
| 25. Decision | CONTRACT_READY_FOR_IMPLEMENTATION (Option A) |
| 26. Project State | Design complete. Awaiting Founder Implementation GO. |
| 27. Exact ONE Current Next Action | UI-001 Structured Explicit Context Implementation — Founder GO Gate |
