# SOUL Minimum Reconnection Contract Audit V0.1
Date: 2026-10-01
Branch: staging/storybook-c7a
HEAD: c8a5aed
Status: READ-ONLY EVIDENCE — NOT Candidate / NOT SSOT
Prior Evidence: SOUL_READINESS_AUDIT_EVIDENCE_PACKAGE_V0_1.md + SOUL_RUNTIME_RECONNECTION_DECISION_AUDIT_V0_1.md

Founder Working Decision Input (not yet in code):
- [A] NL + Quick Context = two input modes updating same Traveler State
- [B] Living Detail Page = canonical experience; Path B = Intelligence Provider only
- [C] Prepared Authoring = default; LLM text does NOT auto-replace Founder-reviewed content

---

## Section 1 — Minimum Traveler State

### Path A actual fields (SoulCableCarPage.jsx:246-250)
```javascript
travelerContext = { hasVehicle: boolean, nextPlace: string|null, companion: string|null }
```
No date, no party_size, no leisure_code, no hotel_id, no raw_question, no session_id.

### Path B actual fields (contextExtractionService.js:76-103)
```javascript
{
  session_id, entry_point, user_mode, country_code, city_code,
  time_available_minutes,
  people_type,                                     // 'solo' | 'couple' | 'family' | ...
  companion_constraints: { has_kids, kids_age, has_elderly, disability },
  meal_context, has_car, mobility_type,
  wish_context, exclude_place_ids, must_visit_place_ids,
  time_of_day, preference_type, budget_constraint, group_size,
  requested_count, mobility_constraint, _provenance
}
```
journey_ctx (session JSONB — sessionService.js:265-281):
```javascript
{ route_id, nights, hotel_code, leisure_code, guest_count, travel_date }
```

### Field Classification Table

| Field | Path A | Path B | Classification | Evidence |
|---|---|---|---|---|
| hasVehicle | `hasVehicle: boolean` | `has_car: boolean` (defaults true when null) | **NORMALIZE** | contextExtractionService.js:90 `has_car: extracted.has_car !== false` |
| nextPlace / place | `nextPlace: 'odongdo'\|null` | `must_visit_place_ids: []` | **NORMALIZE** | contextExtractionService.js:93. Concept = include this place; maps to must_visit_place_ids |
| companion | `companion: 'parents'\|'family'\|null` | `companion_constraints.has_elderly`, `companion_constraints.has_kids`, `people_type` | **NORMALIZE** | contextExtractionService.js:83-86. Concept split across two fields |
| stay_date / travel_date | absent | `journey_ctx.travel_date` (GPT-4 extracted) | **REUSE_AS_IS** | contextExtractionService handles free-form Korean date extraction |
| party_size | absent | `group_size` → `guest_count` in journey_ctx | **REUSE_AS_IS** | contextExtractionService.js:100 |
| leisure_code | absent | `journey_ctx.leisure_code` | **REUSE_AS_IS** | sessionService.js:265-281 journey_ctx schema |
| entry_point / origin | absent | `entry_point = hotel_id \|\| 'YEOSU_GENERAL'` (travelInputRoutes.js:43) | **OPTIONAL** | Path A has no concept; Path B uses for session tagging |
| hotel_id | absent | request body `hotel_id` (optional, ENTRY_POINT_PATTERN validated) | **OPTIONAL** | travelInputRoutes.js:27,34 |
| raw question text | destroyed at `setInputValue('')` (SoulCableCarPage.jsx:290) | passed to GPT-4; raw text NOT stored in DB; understanding stored in journey_ctx | **DERIVE** | sessionService.updateJourneyContext stores extracted fields, not raw text. logTravelInputEvent in travelInputRoutes.js:76 logs input_message.slice(0,100) to console only |
| session_id / journey_ctx | absent | UUID per session, persists 120min inactivity / 12h absolute | **OPTIONAL** | sessionService.js:25-26 |

---

## Section 2 — Quick Context → Path B Fit

### Current Quick Context buttons (SoulCableCarPage.jsx:365-369)
```javascript
{ label: '🚗 자차로 가요',    query: '차가 있어요'       } → hasVehicle: true
{ label: '🌿 오동도도요',     query: '오동도도 갈 거예요' } → nextPlace: 'odongdo'
{ label: '👨‍👩‍👧 부모님과요', query: '부모님도 같이 가요' } → companion: 'parents'
```

### Fit per button

| Quick Context | Path A State | Path B Target Field | Verdict | Evidence |
|---|---|---|---|---|
| 🚗 자차로 가요 | `hasVehicle: true` | `has_car: true` in contextExtractionService output | **REUSE_WITH_MAPPING** | contextExtractionService.js:90 `has_car` field exists; same concept, different name |
| 🌿 오동도도요 | `nextPlace: 'odongdo'` | `must_visit_place_ids: ['odongdo']` | **REUSE_WITH_MAPPING** | contextExtractionService.js:93. PLACE_ALIAS_MAP has 'odongdo' (soyeowoolService.js:34). Concept = include in itinerary |
| 👨‍👩‍👧 부모님과요 | `companion: 'parents'` | `companion_constraints.has_elderly: true` + `people_type` | **REUSE_WITH_MAPPING** | contextExtractionService.js:83-85. `has_elderly` field exists; _applyExplicitCompanionGuard handles explicit Korean companion phrases (contextExtractionService.js:51) |

### Does Quick Context require a new Parser or State Engine?

**NO.** Evidence:
- All three concepts (`has_car`, `must_visit_place_ids`, `has_elderly`) already exist in contextExtractionService output schema.
- `_applyExplicitCompanionGuard()` (contextExtractionService.js:51) already handles Korean companion expressions deterministically.
- Quick Context button clicks currently call `parseContext(s.query, c)` — the query strings ("차가 있어요", "오동도도 갈 거예요", "부모님도 같이 가요") are valid Korean natural language that contextExtractionService can parse.
- Alternative: Quick Context values can be submitted as the message body directly to the existing endpoint.

---

## Section 3 — Raw Question Preservation

### Where is raw question text stored?
- **travelInputRoutes.js:76-81**: `logTravelInputEvent({ input_message: message.slice(0, 100) })` → console log only, not DB.
- **sessionService.js:50-65**: session `context` JSONB column stores `{ entry_point, source, user_id }` at creation. Does NOT store raw message text.
- **sessionService.js:265-281**: `updateJourneyContext()` merges `{ route_id, nights, hotel_code, leisure_code, guest_count, travel_date }` into JSONB. No raw text.
- **Conclusion: raw question text is NOT persisted in DB by Path B.** GPT-4 extracted fields are stored; raw text is not.

### What IS preserved
- Extracted understanding: `journey_ctx.{ travel_date, hotel_code, leisure_code, guest_count }` — persisted to DB via `updateJourneyContext()`
- Session continuity: `session_id` returned in every response; next turn passes same session_id → `touchSession()` extends TTL
- Extracted companion/vehicle: `people_type`, `has_car` in contextExtractionService output (in-response, not persisted separately)

### Lifecycle
- Session: 120min inactivity timeout / 12h absolute (sessionService.js:25-26)
- journey_ctx: persisted to travel_guide_sessions JSONB, available on next call via `getSession()`

### Multi-turn availability
- journey_ctx fields available in subsequent requests via `getSession(sessionId)` → `sessionCtx.journey_ctx` (soyeowoolService.js:961)
- Raw text: not available across turns

### Does calling the endpoint alone restore raw-text preservation?
**PARTIAL.** Calling the endpoint restores extracted-understanding preservation (journey_ctx). Raw question text itself is not stored even in Path B. Path A's problem is that even extracted understanding is not preserved (zero backend call). Endpoint connection restores extracted understanding persistence. Raw text verbatim: not achievable without new logging field.

---

## Section 4 — Failure Safety Surface

### Path B failure output types (soyeowoolService.js)

| Output Type | Source | Structure |
|---|---|---|
| clarification | `_generateClarificationMessage()` → `_buildClarificationPayload()` (line 605-619) | `{ message_ko: string, status: 'CLARIFICATION', places: [], quote: null, route: null }` |
| fallback text | `_generateClarificationMessage()` generic fallback (line 643+) | part of `message_ko` |
| error | soyeowoolService returns `{ ok: false, error }` | HTTP 4xx/5xx from travelInputRoutes |

### SoulCableCarPage.jsx existing slots for failure display

| Path B Output | Matching JSX in SoulCableCarPage | Verdict |
|---|---|---|
| `message_ko` (clarification text) | SOUL JUDGMENT card (line 460-467): `<p>{primaryDiscovery}</p>` — renders a text string | **ADAPTER_REQUIRED** — slot exists, renders text string, but `primaryDiscovery` is currently hardwired to SOUL_DISCOVERY object |
| `status: 'CLARIFICATION'` | No state variable, no conditional on status field | **NO_SURFACE** |
| HTTP error response | No error state, no error display JSX anywhere in file | **NO_SURFACE** |

### Minimum condition to restore "never silent" behavior

Connection only: if `response.message_ko` is rendered in the SOUL JUDGMENT card when API returns clarification, "never silent" is restored. The SOUL JUDGMENT card (lines 460-467) already renders a text string. The mapping from `response.message_ko` to that text slot is the minimum required. No new UI component needed for the clarification case — only for HTTP error display.

---

## Section 5 — Entry / Place Context Contract

### ENTRY_POINT_PATTERN (travelInputRoutes.js:18, sessionService.js:35)
```javascript
const ENTRY_POINT_PATTERN = /^[A-Z][A-Z0-9_]{0,29}$/;
```
Accepts: RAMADA, KENNY, CABLE_CAR, YEOSU_GENERAL  
Rejects: free text, lowercase, spaces

### hotel_id → entry_point logic (travelInputRoutes.js:41-45)
```javascript
entry_point = hotel_id || 'YEOSU_GENERAL'
```
hotel_id absent → entry_point = 'YEOSU_GENERAL'

### Golden Question trace: "10월 17일 라마다에서 출발해서 여수해상케이블카 타려고 해. 일정하고 비용 알려줘."

| Concept | Value | How Path B handles it | Status |
|---|---|---|---|
| current page place | `/soul/cable-car` → no hotel_id in URL → entry_point='YEOSU_GENERAL' | Session tagged as YEOSU_GENERAL | **SOLVABLE** — could pass hotel_id='CABLE_CAR'; 'CABLE_CAR' passes ENTRY_POINT_PATTERN |
| origin | 라마다 (departure hotel) | Raw message passed to GPT-4. No departure_hotel field in contextExtractionService schema. 라마다 appears in message text → contextExtractionService cannot extract it as structured departure | **OPEN** — departure_hotel is not in contextExtractionService output schema |
| destination | 여수해상케이블카 | DISCOVERY_OVERRIDES matches '일정','비용' → DISCOVERY path → contextExtractionService → leisure_code='cable' likely extracted | **SOLVABLE** |
| hotel | 라마다 | Could set hotel_id='RAMADA' in POST body; ENTRY_POINT_PATTERN accepts 'RAMADA' | **SOLVABLE** if caller explicitly sets hotel_id='RAMADA' |
| entry_point effect | 'RAMADA' → jaisan_park excluded in travelGuideService (prior audit: Ramada-specific filter) | Known behavior | **SOLVABLE** |

### Existing ENTRY_POINT_PATTERN covers
- `/soul/cable-car` → hotel_id='CABLE_CAR': PATTERN MATCHES — solvable
- Ramada origin: hotel_id='RAMADA': PATTERN MATCHES — solvable IF caller sets it

### OPEN
- `/soul/cable-car` URL has no mechanism to set hotel_id — no convention defined
- 라마다 in natural language message text → NOT extracted as `departure_hotel` or `hotel_code` by contextExtractionService (field doesn't exist in schema)
- Whether entry_point='CABLE_CAR' vs 'YEOSU_GENERAL' changes travelGuideService behavior: UNKNOWN (jaisan_park exclusion is only known Ramada-specific behavior)

---

## Section 6 — Response → Living Detail Page Fit

### SoulCableCarPage JSX areas (actual file inventory)

| Page Area | JSX Location | What it renders |
|---|---|---|
| Question Composer (input) | lines 316-388 | input + chips + Quick Context buttons |
| Place Hero | lines 391-433 | Founder image + static name/tagline |
| Essential Info card | lines 435-449 | 5 FactRow items (static PU knowledge) |
| FOR ME section | lines 452-457 (ForMeSection) | state-driven prepared text (1 of 3 prepared strings) |
| SOUL JUDGMENT card | lines 460-467 | `primaryDiscovery` text string (1 of 4 prepared strings) |
| JOURNEY card (JourneyFlow) | lines 469-476 | visual nodes from travelerContext |
| DEPTH expandable | lines 479-496 | static prepared explanation text + conditional odongdo note |
| Wish Scene image | lines 500-512 | Founder image (stateIndex >= 2 only) |
| Bottom CTA | lines 517-532 | disabled button ("내 여정에 담기") |

No Schedule display, no Cost display, no Clarification/Failure display area.

### Path B Response → Living Detail Page Fit Table

| Path B Response Field | SOUL Page Area | Verdict | Notes |
|---|---|---|---|
| `message_ko` (primary judgment text) | SOUL JUDGMENT card (line 466) | **ADAPTER** | Slot renders text string; currently hardwired to `primaryDiscovery`. Mapping from response.message_ko = new assignment source |
| `message_ko` when status='CLARIFICATION' | SOUL JUDGMENT card | **ADAPTER** | Same slot; clarification text can surface here |
| `understood_context` (extracted companion etc.) | No slot | **NO_SLOT** | No display area for extracted context fields |
| `places[]` (place cards) | No slot | **NO_SLOT** | No place card component in SoulCableCarPage |
| `next_options[]` (follow-up chips) | Quick Context buttons (line 363-388) | **CONFLICT** | Quick Context is Prepared/hardcoded; next_options are runtime-generated. Same visual role, different ownership |
| `route` (schedule — start_date, days[]) | JourneyFlow (line 471-475) | **ADAPTER** | JourneyFlow renders from travelerContext; route.days[] has different shape (stops/transitions/meals) |
| `course` (Journey Composer V0 output: blocks[]) | No slot | **NO_SLOT** | No CourseDisplay component in SoulCableCarPage |
| `quote` (pricing: totalSell, breakdown) | No slot | **NO_SLOT** | No cost display area |
| Place Basics (hero, essential facts) | Place Hero + Essential Info cards | **NO_CONFLICT** | Static Prepared Content; Path B does not generate these. No overlap |

---

## Section 7 — Prepared Authoring Ownership

### Content area classification

| Area | Prepared Content (Path A) | Runtime Content (Path B) | Classification |
|---|---|---|---|
| Understanding (what did user ask?) | None | contextExtractionService GPT-4 extraction | **RUNTIME_OWNER** |
| Retrieval (what place facts are relevant?) | PU-CC-001~005 static in JSX (Essential Info card + DEPTH) | PLACE_IDENTITY_KO in-memory 1-2 sentences (soyeowoolService.js:117-127) | **MIXED_OPEN** — both cover cable car facts; Prepared covers more depth (hours/pricing/parking); PLACE_IDENTITY_KO is shorter. No ownership decision for overlap |
| Judgment (SOUL JUDGMENT text) | SOUL_DISCOVERY 4 texts — Founder reviewed (SoulCableCarPage.jsx:19-35) | soyeowoolService GPT-4 message_ko | **MIXED_OPEN** — both produce text for same SOUL JUDGMENT slot. Founder Decision [C] sets direction but implementation ownership undefined |
| Explanation (DEPTH card) | Static prepared paragraphs (crystal cabin, odongdo route, phone) | No equivalent in Path B | **PREPARED_OWNER** — Path B has no "why/explanation" layer for this content |
| Schedule (route/course) | None in SoulCableCarPage | Journey Composer V0 (travelGuideService._composeJourney) | **RUNTIME_OWNER** |
| Cost (quote) | None in SoulCableCarPage | quoteEngine.calculateQuote (KST, weekday/weekend/holiday) | **RUNTIME_OWNER** |
| Clarification (unrecognized input) | None — SILENT FAIL | `_generateClarificationMessage()` (soyeowoolService.js:641-643) | **RUNTIME_OWNER** — no Prepared Content exists for this area |

---

## Section 8 — Minimum Reconnection Contract

### A. Already reusable (zero new code)

- **POST /api/dt/travel/input/text** — endpoint fully functional; handles message, session lifecycle, SOUL orchestration
- **sessionService** — UUID session, 120min/12h TTL, journey_ctx JSONB persistence, touchSession
- **guestCredentialUtil.js + getOrEnsureGuestCredential()** — localStorage lifecycle (dt_guest_token/dt_sowon_id), auto-bootstrap, 30-day TTL; already in `api/dreamtown.js`
- **contextExtractionService.parseUserMessage()** — GPT-4 NL parsing; handles date, companion, vehicle, party_size, leisure from Korean free text
- **soyeowoolService.handleTravelRequest()** — intent routing (PLACE_LOOKUP / DISCOVERY / COMMERCE), never-silent principle
- **Journey Composer V0** (travelGuideService._composeJourney) — stop composition, transition timing, meal/cafe blocks
- **quoteEngine.calculateQuote** — KST date, weekday/weekend/holiday pricing, breakdown
- **_generateClarificationMessage()** — context-aware failure response ("never silent")
- **SOUL JUDGMENT card in SoulCableCarPage** — existing text slot, compatible with any string value

### B. Simple Mapping / Adapter needed

| Adapter | From | To | Complexity estimate |
|---|---|---|---|
| Auth fetch | `getOrEnsureGuestCredential()` (already in api/dreamtown.js) | Import + call before POST | ~5 lines |
| POST call + session_id state | LumiTravelPage pattern (lines 32-80) | New useState(null) + fetch call in SoulCableCarPage | ~15 lines |
| response.message_ko → SOUL JUDGMENT slot | API response field | `primaryDiscovery` logic in SoulCableCarPage | ~5 lines (conditional assignment) |
| Quick Context → POST body | hasVehicle/nextPlace/companion values | Map to has_car/must_visit_place_ids/has_elderly before POST OR pass as natural language query string | ~5 lines |
| response.route → JourneyFlow | Path B route.days[] | JourneyFlow currently reads travelerContext; needs state update or alternate rendering path | ~10-20 lines (multi-line) |

### C. Founder / Architecture Decisions still needed

1. **Judgment text priority**: When API returns `message_ko` AND `SOUL_DISCOVERY` prepared text exists for current state — which takes precedence? Under what conditions does API text override Prepared text?
2. **Page model slot assignment**: Which Path B response fields are mapped to SOUL page slots (JUDGMENT/FOR ME/JOURNEY) and which are intentionally discarded? (places[], next_options[], course, quote — all currently have NO_SLOT)
3. **next_options[] policy**: Display runtime-generated follow-up chips OR maintain only hardcoded Quick Context buttons? Both serve same visual role; simultaneous display conflicts.
4. **entry_point convention for /soul/* pages**: Pass hotel_id='CABLE_CAR' or leave as 'YEOSU_GENERAL'? Affects travelGuideService behavior (unknown effect for 'CABLE_CAR' specifically).

### D. Phoenix Knowledge connection — separate concern

**CONFIRMED SEPARATE.**
- Reconnection (SoulCableCarPage ↔ Path B endpoint) has zero dependency on Phoenix Knowledge runtime connection.
- `travel_places.description_short` NULL for all 12 places does not block the endpoint call.
- docs/knowledge/*.md files have zero runtime import — this is independent of the connection path.
- Reconnection can proceed fully without Phoenix Knowledge runtime connection.

### E. Evidence of "must build new"

**NONE.**
- No evidence that any new engine is required.
- No evidence that Quick Context requires a new parser (contextExtractionService already handles the concepts).
- No evidence that session management requires a new system.
- No evidence that schedule or pricing requires a new engine.

---

## Final Questions

| # | Question | Verdict | Evidence |
|---|---|---|---|
| 1 | New NL Parser needed? | **CONFIRMED NO** | contextExtractionService (GPT-4) already handles date/companion/vehicle/place in Korean free text. Quick Context = structured pre-parsed input needing only field mapping (Section 2). |
| 2 | New Schedule Engine needed? | **CONFIRMED NO** | Journey Composer V0 (travelGuideService._composeJourney, commit 4efaece) fully implemented and tested. Handles half-day/full-day stop composition. |
| 3 | New Pricing Engine needed? | **CONFIRMED NO** | quoteEngine.calculateQuote handles KST date, weekday/weekend/holiday, multi-item breakdown. Prior audit §H2-3 confirmed. |
| 4 | New Session/Conversation Engine needed? | **CONFIRMED NO** | sessionService UUID lifecycle + journey_ctx JSONB persistence + touchSession exists and works. Raw text not persisted (never was in Path B either). |
| 5 | New Traveler State Engine needed? | **CONFIRMED NO** | contextExtractionService output covers all Path B-required fields. Quick Context state maps to existing fields via NORMALIZE (Section 1). |
| 6 | Min adapter alone deliver Golden Question to Path B? | **PARTIAL** | Auth + POST + session_id delivers "일정/비용" → DISCOVERY path → contextExtractionService → Journey + Quote. OPEN: 라마다 departure origin NOT extracted as structured field (departure_hotel absent from schema). The question reaches Path B; full structured departure context requires OPEN resolution. |
| 7 | Min mapping to display Path B result in Living Detail Page? | **ADAPTER** | response.message_ko → SOUL JUDGMENT card text slot (already exists). course/quote/places: NO_SLOT (no display areas in current SoulCableCarPage). Minimum viable = message_ko only. Full display (schedule/cost) requires new slots. |
| 8 | Phoenix Knowledge runtime connection separable? | **CONFIRMED** | Zero code dependency between Reconnection path and docs/knowledge/*.md. travel_places.description_short NULL does not block endpoint. Independent concern. |
| 9 | Remaining real Architecture Decisions before implementation? | See Section 8C | (1) Judgment text priority — Prepared vs Runtime, (2) Page slot assignment — which response fields to surface vs discard, (3) next_options[] display policy vs Quick Context design, (4) entry_point convention for /soul/* URL pages |

---

*생성: 2026-10-01 / 브랜치: staging/storybook-c7a / HEAD: c8a5aed*
*commit 없음. push 없음. 코드 변경 없음.*
