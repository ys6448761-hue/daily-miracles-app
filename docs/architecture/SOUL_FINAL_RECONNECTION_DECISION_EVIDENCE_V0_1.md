# SOUL Final Reconnection Decision Evidence V0.1
Date: 2026-10-01  
Branch: staging/storybook-c7a  
HEAD: c8a5aed  
Status: READ-ONLY EVIDENCE — NOT Candidate / NOT SSOT  
Prior Evidence:  
- SOUL_MINIMUM_RECONNECTION_CONTRACT_AUDIT_V0_1.md  
- SOUL_RUNTIME_RECONNECTION_DECISION_AUDIT_V0_1.md  
- SOUL_READINESS_AUDIT_EVIDENCE_PACKAGE_V0_1.md

---

## Question 1 — Judgment Ownership

**STATUS:** PARTIAL

**EXISTING DECISION:**  
Founder Working Decision Input [C] (from this session, not yet in code):  
> "Prepared Knowledge / Prepared Authoring을 기본으로 유지한다. LLM은 필요한 경우 Understanding / Reasoning 계층에서 사용하되, Runtime 생성 문장이 Founder 검수 Prepared Content를 자동으로 대체하지 않는다."

No prior SSOT or Architecture Decision document defines per-response-type ownership.

**REPOSITORY EVIDENCE:**

Prepared Content in SoulCableCarPage.jsx:

| Content | Symbol | Lines | Role (from code comment) |
|---|---|---|---|
| SOUL_DISCOVERY 4 texts | `primaryDiscovery` | 276-283 | "그래서 지금 어떻게 판단하는가" — routing/movement judgment |
| FOR_ME 3 texts | ForMeSection | 452-457 | "내 상황에서 무엇이 중요해졌나" — one critical practical fact |
| DEPTH static text | ExpandableSection | 479-496 | "왜 그런가 / 더 알고 싶을 때" — prepared explanation |

Path B `message_ko` per response type (soyeowoolService.js):

| Response Type | message_ko Source | Role | File/Line | Conflict with Prepared? |
|---|---|---|---|---|
| PLACE_LOOKUP | `_buildPlaceLookupMessage()` — DB fields + PLACE_IDENTITY_KO, no GPT-4 | Retrieval/Information ("에 대해 알려드릴게요") | soyeowoolService.js:165 | **NO_CONFLICT** — different role from routing judgment |
| DISCOVERY | GPT-4 composed `soulMessage` via Travel Intelligence | Travel recommendation narrative | soyeowoolService.js:917 | **MIXED_OPEN** — targets same SOUL JUDGMENT slot; Prepared covers routing, Runtime covers rec narrative |
| COMMERCE_FOLLOW_UP | `'견적을 계산했어요.'` hardcoded string | Cost announcement | soyeowoolService.js:1023 | **NO_CONFLICT** — no cost slot in SoulCableCarPage |
| DATE_PROVISION | route + quote result | Cost/schedule confirmation | soyeowoolService.js:~1106 | **NO_CONFLICT** — no cost/schedule slot |
| CLARIFICATION | `_generateClarificationMessage()` — keyword-driven Korean text, no GPT-4 | Response to unrecognized/ambiguous input | soyeowoolService.js:643 | **NO_CONFLICT** — SoulCableCarPage currently SILENT FAIL; no Prepared content exists for this role |
| GROUP_CONSULTATION_REQUIRED | escalation message | Escalation to phone | soyeowoolService.js:~1145 | **NO_CONFLICT** — no slot |

**SAFE CONCLUSION:**  
4 of 5 response types have NO structural conflict with Prepared Content — they serve different roles or have no corresponding slot in SoulCableCarPage.  
Only the DISCOVERY path response (`message_ko` = GPT-4 narrative) competes with SOUL_DISCOVERY for the SOUL JUDGMENT slot.  
Clarification is RUNTIME_OWNER with zero competing prepared alternative — restoring this is low-risk.  
Role separation is structurally possible by response type. The DISCOVERY case is the only true overlap.

**STILL OPEN:**  
Single item: when Path B returns a DISCOVERY response (travel recommendation narrative), which occupies the SOUL JUDGMENT slot — SOUL_DISCOVERY (prepared cable car routing judgment) or Path B `message_ko` (recommendation narrative)?  
This is a product decision about the role of SOUL JUDGMENT during a journey-planning query.

---

## Question 2 — Living Detail Page Slot Mapping

**STATUS:** PARTIAL

**EXISTING DECISION:**  
SOUL Journey Snapshot Working Hypothesis (2026-09-29) §3:  
> "고정되는 것은 장소이고, 변하는 것은 여행자의 관점이다."  
> "Prepared Knowledge / reusable asset / context routing을 우선한다."  
No slot assignment decision for Path B response fields.

**REPOSITORY EVIDENCE:**

SoulCableCarPage.jsx JSX inventory:

| Area | Lines | Currently Renders |
|---|---|---|
| Question Composer + Quick Context | 315-389 | Input + context chips + Quick Context buttons |
| Place Hero | 391-433 | Founder image (static) + place name/tagline |
| Essential Info card | 435-449 | 5 FactRow items (PU-CC-001~005, static) |
| ForMeSection | 452-457 | State-driven prepared text (1 of 3 strings) |
| SOUL JUDGMENT card | 460-467 | `primaryDiscovery` text string (1 of 4 strings) |
| JourneyFlow (JOURNEY card) | 469-476 | Visual nodes from travelerContext (static shape) |
| DEPTH expandable | 479-496 | Static prepared paragraphs + conditional odongdo note |
| Wish Scene image | 500-512 | Founder image (stateIndex >= 2 only) |
| Bottom CTA | 517-530 | Disabled "내 여정에 담기" button |

No Schedule display, no Cost display, no Clarification/Failure display area exists.

Path B response → SoulCableCarPage slot mapping:

| Path B Field | Existing Slot | Verdict | Evidence |
|---|---|---|---|
| `message_ko` (CLARIFICATION / DISCOVERY) | SOUL JUDGMENT card line 466 (`primaryDiscovery` text) | **DERIVED_SLOT** | Slot renders a text string. Source would change from SOUL_DISCOVERY constant to API response. Mapping = conditional assignment. |
| `understood_context` | None | **NO_SLOT** | No display area for extracted context fields. |
| `places[]` | None | **NO_SLOT** | No PlaceCard component in SoulCableCarPage. |
| `course` (blocks[], Journey Composer V0) | None | **NO_SLOT** | No CourseDisplay component. |
| `route` (days[], items[]) | JourneyFlow line 471-475 | **DERIVED_SLOT** | JourneyFlow exists but currently reads from `travelerContext` (boolean state), not structured `route.days[]`. Data shape differs — adapter required. |
| `quote` (pricing, breakdown) | None | **NO_SLOT** | No cost display area. |
| `next_options[]` | Quick Context button area lines 363-388 | **CONFLICT** | Quick Context = Traveler State INPUT buttons (Prepared, hardcoded). next_options[] = server-generated follow-up suggestions (Runtime). Both occupy the same visual area in the Question Composer card. |
| Place Basics (hero, Essential Info) | Place Hero + Essential Info cards | **DO_NOT_DISPLAY** | Static Prepared Content. Path B does not produce competing content for these areas. No overlap by design. |
| `status` | None | **NO_SLOT** | Routing signal only — consumed internally, not displayed. |

**SAFE CONCLUSION:**  
SOUL JUDGMENT card (text slot) and JourneyFlow (visual slot) are the only two DERIVED_SLOT targets — both exist, both need adapter.  
`course`, `quote`, `places[]`, `understood_context` have NO_SLOT — displaying them requires new UI areas.  
Place Basics (hero, Essential Info, DEPTH) are DO_NOT_DISPLAY for Path B output — they are Prepared Content and Path B does not produce competing content.  
Minimum viable display = `message_ko` → SOUL JUDGMENT slot. Schedule and cost require new slot design.

**STILL OPEN:**  
Which of `course`, `quote`, `places[]` — if any — the SOUL page should display, and where. This is a product slot assignment decision. Code alone cannot determine it.

---

## Question 3 — Quick Context vs next_options[]

**STATUS:** RESOLVED

**EXISTING DECISION:**  
NONE FOUND — no prior document defines Quick Context vs next_options semantic boundary.

**REPOSITORY EVIDENCE:**

Quick Context (SoulCableCarPage.jsx:363-388):
```javascript
// onClick:
setTravelerContext((c) => parseContext(s.query, c))
// Effect: updates travelerContext state only. Zero backend call. Zero POST.
// Semantic: "I have a car / I'm going to Odongdo / I'm with parents"
// Timing: available BEFORE any question is asked; shows unactivated options progressively
```

next_options[] (soyeowoolService.js + LumiTravelPage.jsx):
```javascript
// In soyeowoolService.js — example:
next_options: ['여수 관광지 먼저 둘러보기']   // line 1147
// In LumiTravelPage.jsx — onClick:
onClick={onNewQuestion}   // line 427
// handleNewQuestion = () => { setRecommendations(null); setError(null); }  // line 93-96
// Effect: clears current result, resets to Ask-First input screen.
// next_options button text is a label suggestion; clicking it does NOT auto-submit the text.
```

Functional comparison:

| Dimension | Quick Context | next_options[] |
|---|---|---|
| Trigger timing | Before or alongside a question | After API response received |
| Effect on click | `setTravelerContext()` — local state update | `setRecommendations(null)` — clears result, shows input |
| Backend call | None | None (user must type and submit next question) |
| Data modified | travelerContext | recommendations (cleared) |
| Semantic role | Traveler State INPUT | Follow-up navigation suggestion (hint to the user) |
| Can share handler? | No — handler is `setTravelerContext(parseContext())` | No — handler is `setRecommendations(null)` |

**SAFE CONCLUSION:**  
**KEEP_SEPARATE.** Functionally different semantic roles confirmed by code:  
Quick Context = Traveler State INPUT (local, no POST, pre-question).  
next_options[] = post-response navigation hint (clears result to show input; user types next question).  
They do not modify the same state. Handler functions are structurally incompatible. Same visual area is a presentation decision, not a functional one — concurrent display would require visual separation (not merging the handlers).

**STILL OPEN:**  
None. Code evidence resolves this question fully.

---

## Question 4 — Entry Point Semantics

**STATUS:** PARTIAL

**EXISTING DECISION:**  
`project_entry_point_trust_boundary.md` (CLOSED, 214/214 PASS):  
ENTRY_POINT_PATTERN = `/^[A-Z][A-Z0-9_]{0,29}$/` confirmed.  
`'CABLE_CAR'` passes the pattern.  
This decision covers validation only — not semantic mapping for SOUL pages.

**REPOSITORY EVIDENCE:**

Five concepts traced in code:

| Concept | Golden Question Value | Path B Field | Code Evidence |
|---|---|---|---|
| current detail place | `/soul/cable-car` (URL path) | Not mapped to any API field unless caller sets `hotel_id='CABLE_CAR'` | No URL→hotel_id mapping exists (SoulCableCarPage has no hotel_id state or prop) |
| destination | 여수해상케이블카 | `leisure_code` extracted by contextExtractionService ('cable') | DISCOVERY_OVERRIDES matches '일정','비용' → contextExtractionService → leisure extraction |
| origin | 라마다 (departure hotel in message text) | NOT extracted as structured field. `departure_hotel` field does not exist in contextExtractionService output schema (SOUL_MINIMUM audit §1) | contextExtractionService.js:76-103 — no departure_hotel field |
| hotel_id param | Not set (absent from SoulCableCarPage) → `entry_point = 'YEOSU_GENERAL'` | `hotel_id` (request body, optional) | travelInputRoutes.js:43: `entry_point = hotel_id || 'YEOSU_GENERAL'` |
| entry_point effect | 'YEOSU_GENERAL' or 'CABLE_CAR' → same travelGuideService behavior | Only RAMADA triggers filter logic | travelGuideService.js:39: `if (context.entry_point && context.entry_point.includes('RAMADA'))` — ONLY filter |

**Critical finding:** `hotel_id='CABLE_CAR'` vs `hotel_id` absent:  
travelGuideService.js line 39 is the ONLY `entry_point` conditional in the service. It checks `.includes('RAMADA')` only. Passing `hotel_id='CABLE_CAR'` does NOT trigger any filter, exclusion, or behavior change compared to `'YEOSU_GENERAL'`. Functionally equivalent for current code.

**Golden Question trace for entry_point:**  
"10월 17일 라마다에서 출발해서 여수해상케이블카 타려고 해. 일정하고 비용 알려줘."  
- `라마다` in message text → contextExtractionService sees it as free text. No `departure_hotel` field exists. Cannot extract as structured departure.
- If caller sets `hotel_id='RAMADA'` explicitly → `entry_point='RAMADA'` → Ramada filter fires → jaisan_park excluded. Matches Ramada user intent.
- If `hotel_id` absent → `entry_point='YEOSU_GENERAL'` → no filter → jaisan_park included in candidates. Not wrong, just less precise.

**SAFE CONCLUSION:**  
`hotel_id='CABLE_CAR'` is valid per ENTRY_POINT_PATTERN and causes zero behavior change in travelGuideService (no CABLE_CAR-specific logic). Both 'CABLE_CAR' and 'YEOSU_GENERAL' are functionally equivalent for current code.  
The real semantic gap is origin (라마다): message text cannot be extracted as `departure_hotel` because the field does not exist in contextExtractionService schema.  
If the caller knows the user came from Ramada, `hotel_id='RAMADA'` is the correct way to communicate it — this triggers the Ramada filter correctly.

**STILL OPEN:**  
When the user is at `/soul/cable-car` and mentions Ramada as origin in natural language — does the SOUL page know to set `hotel_id='RAMADA'`? No automatic mechanism exists. This is a product decision: does SOUL page receive or infer hotel origin context, and if so, how?

---

## Final: Founder Decision Items

After removing items resolvable by code evidence or existing decisions:

| # | Item | Why Founder Decision Required |
|---|---|---|
| 1 | **DISCOVERY response — Judgment slot priority** | When Path B returns a DISCOVERY travel narrative, SOUL_DISCOVERY (prepared routing judgment) and Path B `message_ko` (recommendation narrative) both target the SOUL JUDGMENT slot. Code cannot determine which takes precedence — product intent decision. |
| 2 | **Page slot assignment for course/quote/places[]** | `course`, `quote`, `places[]` have NO_SLOT in SoulCableCarPage. Whether and where to display them is a product experience decision. |
| 3 | **Ramada origin context** — hotel origin inference | When user says "라마다에서 출발해서 케이블카" on `/soul/cable-car`, does the SOUL page send `hotel_id='RAMADA'` to Path B? No automatic mechanism exists. Requires product decision on whether SOUL pages carry hotel context. |

**Items removed from prior conflict list (resolved by evidence):**

- ~~next_options[] vs Quick Context merge/separate~~ → **RESOLVED: KEEP_SEPARATE** (different semantic roles, different handlers, not mergeable)
- ~~hotel_id='CABLE_CAR' semantic validity~~ → **RESOLVED: Valid pattern, zero behavior change vs YEOSU_GENERAL**
- ~~Clarification text ownership~~ → **RESOLVED: RUNTIME_OWNER** (no competing Prepared content for clarification role)
- ~~PLACE_LOOKUP/COMMERCE/DATE_PROVISION message_ko conflicts~~ → **RESOLVED: NO_CONFLICT** (different roles, different slots)

---

*생성: 2026-10-01 / 브랜치: staging/storybook-c7a / HEAD: c8a5aed*  
*commit 없음. push 없음. 코드 변경 없음.*
