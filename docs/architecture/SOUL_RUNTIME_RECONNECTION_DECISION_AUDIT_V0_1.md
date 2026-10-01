# SOUL Runtime Reconnection Decision Audit V0.1
Date: 2026-10-01  
Branch: staging/storybook-c7a  
HEAD: c8a5aed  
Status: READ-ONLY EVIDENCE — NOT Candidate / NOT SSOT  
Scope: Can existing Path B Travel Intelligence be reused as the Execution Layer for SOUL Living Detail Page?

---

## A. CURRENT_SOUL_INPUT_CONTRACT

**File:** `dreamtown-frontend/src/pages/SoulCableCarPage.jsx`

### Input State
```javascript
const [inputValue, setInputValue] = useState('');
const [travelerContext, setTravelerContext] = useState({
  hasVehicle: false,
  nextPlace: null,    // 'odongdo' | null
  companion: null,    // 'parents' | 'family' | null
});
```

### handleSubmit (line 285)
```javascript
function handleSubmit(e) {
  e.preventDefault();
  if (!inputValue.trim()) return;
  const updated = parseContext(inputValue, travelerContext);
  setTravelerContext(updated);
  setInputValue('');   // ← raw text destroyed immediately
}
```

### parseContext — exact token recognition (line 51)
| Token Group | Keywords | Output Field |
|---|---|---|
| vehicle | '차', '자차', '드라이브', '렌트' | `hasVehicle: true` |
| nextPlace | '오동도' | `nextPlace: 'odongdo'` |
| companion/parents | '부모', '어르신', '어머니', '아버지', '부모님' | `companion: 'parents'` |
| companion/family | '아이', '아기', '유모차', '어린이' | `companion: 'family'` |

**Unrecognized:** 날짜, 출발지, 호텔명, 비용, 일정, 인원, 이동수단(버스/택시 등)

### Quick Context buttons (line 366)
```javascript
{ label: '🚗 자차로 가요',    query: '차가 있어요' }
{ label: '🌿 오동도도요',     query: '오동도도 갈 거예요' }
{ label: '👨‍👩‍👧 부모님과요', query: '부모님도 같이 가요' }
```
→ Each click calls `setTravelerContext(c => parseContext(s.query, c))` — same keyword parser

### stateIndex derivation (line 257)
```javascript
const stateIndex = hasParents ? 3 : travelerContext.nextPlace ? 2 : travelerContext.hasVehicle ? 1 : 0;
```

### Information LOST on submit
- Raw question text: destroyed at `setInputValue('')`
- No conversationLog
- No date, cost, departure origin, hotel name
- No fallback/failure path for unrecognized input

### Backend calls
**ZERO.** No fetch(), no axios, no API call anywhere in SoulCableCarPage.jsx.

---

## B. LEGACY_INPUT_CONTRACT

### Endpoint
```
POST /api/dt/travel/input/text
File: routes/travelInputRoutes.js:25
```

### Authentication
```javascript
requireAuthenticatedPrincipal  // JWT Bearer token (guest_token or user JWT)
// travelInputRoutes.js:25
```
LumiTravelPage obtains via `getOrEnsureGuestCredential()` → `localStorage['dt_guest_token']` + auto-bootstrap via `POST /api/dt/identity/bootstrap`.

### Request Body Schema
```typescript
{
  message: string;       // required — raw NL text
  session_id?: string;   // optional — existing session UUID
  hotel_id?: string;     // optional — must match /^[A-Z][A-Z0-9_]{0,29}$/
}
```

### Session lifecycle (travelInputRoutes.js:41)
- `session_id` absent → create new session, `entry_point = hotel_id || 'YEOSU_GENERAL'`
- `session_id` present + valid → `touchSession()`
- `session_id` present + invalid → create fresh session

### SOUL orchestration call (travelInputRoutes.js:60)
```javascript
const soulResult = await handleTravelRequest({
  message,
  sessionId: finalSessionId,
  hotelId: hotel_id || null,
  principal: { ...req.principal, sowon_id: req.sowon_id }
});
```

### soyeowoolService.handleTravelRequest routing (per prior audit §7)
- `DISCOVERY_OVERRIDES` regex: `/일정|비용|어디|추천|뭐 할|.../` → DISCOVERY path
- `PLACE_LOOKUP`: specific place name → DB lookup + PLACE_IDENTITY_KO
- `COMMERCE_FOLLOW_UP`: booking intent → quoteEngine

### contextExtractionService (GPT-4 based)
- Input: raw message string
- Extracted fields: stay_date, travel_date, party_size, leisure_code, companion type
- D2 provenance tagging: USER_EXPLICIT / AI_INFERENCE / UNKNOWN

---

## C. LEGACY_OUTPUT_CONTRACT

**File:** `dreamtown-frontend/src/pages/LumiTravelPage.jsx` (response handler + UI consumption)  
**File:** `dreamtown-frontend/src/components/TravelGuide/CourseDisplay.jsx`

### Top-level response shape
```typescript
{
  session_id: string;
  status: string;              // 'DISCOVERY' | 'PLACE_LOOKUP' | 'GROUP_CONSULTATION_REQUIRED' | ...
  message_ko: string;          // primary Korean text response
  understood_context: {
    people_type: string;       // extracted companion type
    // + other extracted fields from contextExtractionService
  };
  places: Place[];             // array of place cards
  next_options: Option[];      // follow-up question chips

  // Optional — present when schedule computed:
  route?: {
    start_date: string;        // ISO date
    end_date?: string;
    party: { type: string; count: number };
    days: Day[];               // Day[].items[]: { type, time_slot, name, source, selection_status, time }
  };

  // Optional — present when Journey Composer V0 runs:
  course?: {
    available_minutes: number;
    actual_stop_count: number;
    blocks: Block[];           // Block: { type: 'place'|'travel_transition'|'meal'|'cafe', ... }
    summary: {
      fit_status: string;
      total_stay_minutes: number;
      estimated_total_range: { min: number; max: number };
    };
    message_ko?: string;
    notes?: string;
  };

  // Optional — present when quoteEngine runs:
  quote?: {
    status: 'CALCULATED' | 'PENDING_HUMAN_QUOTE';
    guestCount: number;
    pricing: {
      totalSell: number;
      totalList: number;
      totalSavings: number;
    };
    breakdown: { name: string; sell: number; list: number }[];
    validUntil: string;
  };
}
```

### CourseDisplay.jsx block types (line 30)
- `'place'`: name_ko, stay_minutes
- `'travel_transition'`: message_ko, estimated_duration_range.{min,max}
- `'meal'`: meal_context, estimated_duration_minutes, restaurants[]
- `'cafe'`: estimated_duration_minutes, cafes[].{name, benefit.display_copy}

---

## D. GOLDEN QUESTION TRACE

**Question:** "10월 17일 라마다에서 출발해서 여수해상케이블카 타려고 해. 일정하고 비용 알려줘."

| Step | File | Symbol/Function | Input | Output | Continues? |
|---|---|---|---|---|---|
| 1 | LumiTravelPage.jsx:48 | submitQuestion → fetch | raw text + guest_token + session_id:null + hotel_id:null | POST body `{ message, session_id:null, hotel_id:null }` | YES |
| 2 | travelInputRoutes.js:25 | POST /input/text handler | request body | session created (entry_point='YEOSU_GENERAL'), calls handleTravelRequest | YES |
| 3 | soyeowoolService.js:940 | handleTravelRequest | {message, sessionId, hotelId:null} | DISCOVERY_OVERRIDES: '일정','비용' → MATCH → DISCOVERY path | YES |
| 4 | contextExtractionService.js | parseUserMessage (GPT-4) | "10월 17일 라마다..." | stay_date='2026-10-17', leisure='cablecar', companion=null | YES |
| 5 | travelGuideService.js:803 | recommend (8-filter cascade) | extracted context | journey composed, Ramada entry_point → jaisan_park 제외 | YES |
| 6 | quoteEngine.js | calculateQuote | KST date='2026-10-17' (토요일) | weekend pricing applied, quote.status='CALCULATED' | YES → response |

**Chain verdict:** ALL 6 STEPS CHAIN. CONFIRMED by prior audit (SOUL_READINESS_AUDIT_EVIDENCE_PACKAGE_V0_1.md §7).

**BUT:** This trace runs only via LumiTravelPage. SoulCableCarPage has zero connection to this chain.

---

## E. PHOENIX KNOWLEDGE INJECTION POINTS

| Layer | Current Responsibility | Current I/O | Knowledge Injection Point | Extension Risk |
|---|---|---|---|---|
| soyeowoolService._buildPlaceLookupMessage() | Assembles PLACE_IDENTITY_KO + DB fields into Korean response | place_code → Korean string | Could accept additional `prepared_knowledge_block: string` parameter; append before response assembly | LOW — additive |
| soyeowoolService DISCOVERY path | Routes to contextExtractionService + travelGuideService | message → intent | No explicit hook; knowledge would need to be passed into travelGuideService.recommend() | MEDIUM |
| travelGuideService.recommend() | Queries `travel_places` WHERE code=$1, applies 8 filters | context → places[] | `description_short` field exists (NULL for all 12) — natural injection point via UPDATE | LOW — field already in schema |
| contextExtractionService | GPT-4 NL parse; no knowledge context injected | raw message → extracted fields | Could accept `system_context` block (place descriptions) to improve extraction accuracy | MEDIUM — GPT call change |
| quoteEngine.calculateQuote | Pure pricing — KST date, weekday/weekend/holiday | date + leisure_key → price | NO knowledge needed — deterministic math | NONE |

**Key finding:** `grep -rn "require.*knowledge\|import.*knowledge" services/ routes/ → 0 matches`  
All Phoenix Knowledge files (docs/knowledge/*.md) are static documents with no runtime import.  
`travel_places.description_short` is the only existing runtime field designed for knowledge content — currently NULL for all 12 places.

---

## F. RECONNECTION FIT

| # | Question | Verdict | Evidence |
|---|---|---|---|
| 1 | Can SoulCableCarPage call the existing endpoint directly? | REUSE_WITH_ADAPTER | Endpoint exists. SoulCableCarPage needs: (a) guest_token fetch via `getOrEnsureGuestCredential()` (already in `api/dreamtown.js`), (b) fetch() call, (c) session_id state. Adapter = ~30 lines |
| 2 | Can Living Detail Page consume existing response directly? | REUSE_WITH_ADAPTER | response.message_ko → SOUL judgment slot; response.course → JourneyFlow data; response.quote → cost display. But response shape is generic, SOUL page expects place-specific recomposition. Mapping adapter needed. |
| 3 | Is an adapter needed? | CONFIRMED YES | Path B output designed for LumiTravelPage result screen (chat-style). SOUL page uses page-recomposition model. Structural gap requires mapping layer. |
| 4 | Can Quick Context map to existing Traveler Context? | REUSE_WITH_ADAPTER | hasVehicle → no direct field in contextExtractionService output; nextPlace='odongdo' → partially maps to place_code; companion → maps to people_type. 1:1 mapping incomplete; needs explicit field in handleTravelRequest params |
| 5 | Can existing session/context model be reused? | REUSE_DIRECT | sessionService is standalone; guestCredentialUtil.js already implements localStorage lifecycle; `getOrEnsureGuestCredential()` is importable from `api/dreamtown.js` |
| 6 | Can Raw Question Preservation be recovered via Path B? | REUSE_DIRECT | sessionService.journey_ctx preserves raw messages when endpoint is called. Currently zero because SoulCableCarPage never calls it. Calling the endpoint restores preservation. |
| 7 | Can "never silent" failure safety be reused? | REUSE_DIRECT | soyeowoolService._generateClarificationMessage() fires for all unmatched intents. "SOUL is always responsible for the next turn — never silent, never blank." (soyeowoolService.js:642). Calling the endpoint restores this. |
| 8 | Can Schedule+Cost be reused without building new engines? | REUSE_DIRECT | Journey Composer V0 + quoteEngine fully implemented and working. No new engine needed. |

---

## G. DUPLICATION/CONFLICT TABLE

| Responsibility | Path A (SoulCableCarPage) | Path B (Travel Intelligence) | Conflict? | Decision Status |
|---|---|---|---|---|
| NL parsing | parseContext() — keyword, 3 token groups, frontend, zero LLM | contextExtractionService — GPT-4, backend, date/place/companion/party | YES — different systems, different depth | OPEN |
| Traveler State | travelerContext {hasVehicle, nextPlace, companion} — React state, no persist | session journey_ctx — DB persisted, D2 provenance tagged | PARTIAL — overlapping concepts, no shared schema | OPEN |
| Place Knowledge | SOUL_DISCOVERY hardcoded strings (4 states, cable car only) | PLACE_IDENTITY_KO in-memory (12 places, 1-2 sentence) + travel_places DB | YES — both serve "what I know about this place"; no shared source | OPEN |
| Judgment | stateIndex select from 4 hardcoded texts | soyeowoolService intent routing (DISCOVERY/PLACE_LOOKUP/COMMERCE) + GPT-4 composition | PARTIAL — both judge; Path A is manual branching, Path B is LLM reasoning | OPEN |
| Journey Composition | JourneyFlow — visual nodes only (no data source) | travelGuideService Journey Composer V0 — stops, transitions, meals, cafes, timing | NO — Path A is visual shell only; Path B generates the data. Complement, not conflict | OPEN |
| Pricing | None | quoteEngine.calculateQuote (KST, weekday/weekend/holiday, breakdown) | NO — Path B monopoly | OPEN |
| Failure Safety | SILENT FAIL (CONFIRMED) | _generateClarificationMessage() — never silent (code-stated principle) | YES — Path A absent, Path B present | OPEN |
| UI presentation | SoulCableCarPage — page recomposition, judgment-first, context-stable | LumiTravelPage — chat-style result screen, replace-on-submit | PARTIAL — product intention differs; UI components could be shared with mapping | OPEN |

---

## H. FINAL DECISION EVIDENCE

| # | Question | Verdict | Evidence |
|---|---|---|---|
| 1 | Existing Travel Intelligence reusable? | PARTIAL | Functions chain correctly (CONFIRMED §7 prior audit). SoulCableCarPage cannot call them (no auth, no fetch). Gap = connection only, not rebuild. |
| 2 | New Schedule Engine needed? | CONFIRMED NO | Journey Composer V0 at travelGuideService._composeJourney exists and is tested (commit 4efaece). |
| 3 | New Pricing Engine needed? | CONFIRMED NO | quoteEngine.calculateQuote handles KST, weekday/weekend/holiday, multi-item breakdown. |
| 4 | New NL Parser needed? | CONFIRMED NO | contextExtractionService (GPT-4) handles date, place, companion, party_size, leisure from free-form Korean. |
| 5 | Adapter/Bridge needed? | CONFIRMED YES | Three adapter pieces required: (a) auth/credential fetch, (b) POST call with session lifecycle, (c) response → SOUL module slot mapping. |
| 6 | Phoenix Knowledge runtime connection point exists? | PARTIAL | `travel_places.description_short` exists but NULL for all 12 places. PLACE_IDENTITY_KO is the closest live hook (1-2 sentence only). docs/knowledge/*.md has zero runtime import. |

---

## Architecture Conflicts Requiring Decision Before Implementation

1. **NL Parser authority:** Quick Context keyword parser (Path A) vs GPT-4 contextExtractionService (Path B) — which is the authoritative Traveler State source? Are they additive or do they replace each other?

2. **Traveler State schema:** `travelerContext {hasVehicle, nextPlace, companion}` has no field in Path B's contextExtractionService schema. `hasVehicle` in particular has no known mapping. A decision is needed on whether to extend contextExtractionService or keep keyword-layer as preprocessing.

3. **Page model vs response model:** Path B response is designed for LumiTravelPage's full-replace result screen. SOUL's page recomposition model expects persistent place context + selective slot updates. How does a single API response map to SOUL module slots (SOUL JUDGMENT / FOR ME / JOURNEY / DEPTH) without replacing static place facts?

4. **Judgment text ownership:** SOUL_DISCOVERY texts are currently authored as prepared judgments (product decision). Path B generates judgment text via GPT-4 at runtime. Founder decision needed: prepared authoring vs LLM runtime generation, or combination.

5. **Failure safety surface:** Path B failure safety (clarification messages) returns in the API response body. In SOUL's page model, where does this surface? As a new card? As an overlay? As a replacement to the SOUL section? No design decision exists.

6. **hotelId ↔ SOUL place context:** `/soul/cable-car` has no hotel_id param. `entry_point` would default to 'YEOSU_GENERAL'. If SoulCableCarPage is place-specific, should it pass a canonical place_code as hotel_id equivalent? The ENTRY_POINT_PATTERN already accepts e.g. 'CABLE_CAR'. No convention defined.

---

*생성: 2026-10-01 / 브랜치: staging/storybook-c7a / HEAD: c8a5aed*  
*commit 없음. push 없음. 코드 변경 없음.*
