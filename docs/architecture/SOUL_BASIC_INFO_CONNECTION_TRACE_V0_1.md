# Basic Information UI Connection V0.1
## Existing Knowledge → Product Surface Trace

**Mode:** READ-ONLY / DESIGN / CONNECTION TRACE  
**Date:** 2026-10-03  
**Production checkpoint:** 294c55c  
**Status:** BASIC_INFO_CONNECTION_READY

---

## A. Target Experience

Surface already-verified Basic Knowledge for hyangiram, odongdo, cablecar:
- admission / fee
- opening hours
- average stay time
- physical difficulty
- address, indoor/outdoor

From **existing DB data only**. No new research.

---

## B. Current Production Surface

### Frontend on main (294c55c)

| Component | Path | Endpoint | Renders place info? |
|---|---|---|---|
| `TravelGuidePage.jsx` | `/travel-guide` | POST `/api/dt/travel/recommend` | TravelRecommendCard only — no Basic Info |
| `TravelGuideHome.jsx` | sub-component | POST `/api/dt/travel/recommend` | Form only |
| `CablecarPage.jsx` | `/cablecar` | None (star/QR flow) | NO — QR/wish flow only |
| `SoulCableCarPage.jsx` | staging only | POST `/api/dt/travel/input/text` | NOT on main |

**Finding:** No frontend component on main calls `/api/dt/travel/input/text`. No component renders `presentation_mode=PLACE_KNOWLEDGE`. No Basic Info component exists on main.

### "Basic Info" searches on main frontend
- `알아야 할`, `admission_fee`, `opening_hours`, `avg_stay_minutes`, `resolved_code`, `PLACE_KNOWLEDGE` → **zero matches in** `dreamtown-frontend/src/`
- `기본 정보` → admin/partner onboarding only (AdminPartners.jsx, PartnerApply.jsx)

---

## C. Backend Knowledge Trace

```
travel_places (DB)
  ↓ SELECT * WHERE code = $1
travelGuideService.getPlaceByCode()          ← line 1162
  ↓ place object (all columns)
soyeowoolService._detectPlaceLookupIntent()  ← resolves alias → code
soyeowoolService.handleTravelRequest()       ← chip place fallback (UI-001)
  ↓ resolved place object
soyeowoolService._buildPlaceLookupClientPayload()  ← line 345
  ↓ response.places[0] = full place object
POST /api/dt/travel/input/text response
  → (NO frontend component on main to consume this)
```

**Critical finding (E):** The PLACE_LOOKUP backend response already exposes a **fully structured** `places[0]` object containing all `travel_places` columns via `SELECT *`. This includes `admission_fee_json`, `opening_hours_json`, `avg_stay_minutes`, `physical_difficulty`, `indoor_outdoor`, `address`, etc.

The backend is NOT hiding this behind natural-language only. The `message_ko` text is an additional layer; the raw structured data is in `places[0]`.

**Implication:** The backend response contract is already sufficient. No backend change needed to expose Basic Info.

---

## D. Field Matrix

Scope: hyangiram, odongdo, cablecar (3 production PLACE_LOOKUP targets)

| Field | DB Schema | Seeded (001) | Backend Reads | Response Exposes | Frontend Receives | UI Renders | Classification |
|---|---|---|---|---|---|---|---|
| `name_ko` | YES | YES | YES (SELECT *) | YES — places[0] | NO (no component) | NO | **B: EXISTS_NOT_CONNECTED** |
| `description_short` | YES | NO (NULL) | YES (NULL) | YES (NULL) | NO | NO | **F: PRESENTATION_GAP** (code uses PLACE_IDENTITY_KO as fallback) |
| `admission_fee_json` | YES | NO (NULL) | YES (NULL) | YES (NULL) | NO | NO | **B+E: EXISTS_NOT_CONNECTED (NULL data)** |
| `opening_hours_json` | YES | NO (NULL) | YES (NULL) | YES (NULL) | NO | NO | **B+E: EXISTS_NOT_CONNECTED (NULL data)** |
| `avg_stay_minutes` | YES | YES (all 3) | YES | YES — places[0] | NO | NO | **B: EXISTS_NOT_CONNECTED** |
| `physical_difficulty` | YES | NO (NULL) | YES (NULL) | YES (NULL) | NO | NO | **B+E: EXISTS_NOT_CONNECTED (NULL data)** |
| `parking_info` | YES | NO (NULL) | YES (NULL) | YES (NULL) | NO | NO | **E: TRUE_KNOWLEDGE_GAP** (unverified) |
| `address` | YES | YES (all 3) | YES | YES — places[0] | NO | NO | **B: EXISTS_NOT_CONNECTED** |
| `indoor_outdoor` | YES | YES (all 3 = outdoor) | YES | YES — places[0] | NO | NO | **B: EXISTS_NOT_CONNECTED** |
| `suitable_for` | YES | YES (all 3) | YES | YES — places[0] | NO | NO | **B: EXISTS_NOT_CONNECTED** |
| `phone_inquiry` | YES | NO (NULL) | YES (NULL) | YES (NULL) | NO | NO | **E: TRUE_KNOWLEDGE_GAP** |
| `lat` / `lng` | YES | YES (all 3) | YES | YES — places[0] | NO | NO | **B: EXISTS_NOT_CONNECTED** |

### Classification legend
- **B: EXISTS_NOT_CONNECTED** — value available in DB + response, frontend not connected
- **E: TRUE_KNOWLEDGE_GAP** — not in DB and not verified
- **F: PRESENTATION_GAP** — structured NULL but code-level fallback exists

---

## E. Critical Question — Structured vs Natural Language

**The backend already exposes structured Basic Info data.**

`places[0]` in the PLACE_LOOKUP response contains all `travel_places` columns as individual fields:
- `avg_stay_minutes: 90` (not just text "약 90분")
- `indoor_outdoor: "outdoor"` (not just text)
- `admission_fee_json: null` (null, not absent)
- `opening_hours_json: null` (null, not absent)

The `message_ko` text IS derived from these fields (see `_buildPlaceLookupMessage`), but the underlying structured data is also directly available.

**Implication for implementation boundary:** A frontend Basic Info component can directly read from `response.places[0]` without any backend change. The component renders non-null values and gracefully hides/dashes null values.

---

## F. Response Contract Trace

```json
POST /api/dt/travel/input/text
→ {
    "session_id": "uuid",
    "understood_context": {},
    "places": [
      {
        "id": 1,
        "code": "hyangiram",
        "name_ko": "향일암",
        "address": "돌산읍 향일암로 1",
        "lat": 34.5914162,
        "lng": 127.8037534,
        "indoor_outdoor": "outdoor",
        "avg_stay_minutes": 90,
        "suitable_for": ["family","elderly","kids_ok","pilgrimage"],
        "admission_fee_json": null,      ← NULL — not seeded
        "opening_hours_json": null,      ← NULL — not seeded
        "physical_difficulty": null,     ← NULL — not seeded
        "parking_info": null,            ← NULL — not seeded
        "description_short": null,       ← NULL — all 12 places
        "emotion_tags": ["dawn","faith","historical"],
        "weather_suitable": ["clear","sunrise","all_season"],
        "trust_level": "ORIGIN"
        // ... all other travel_places columns
      }
    ],
    "message_ko": "향일암에 대해 알려드릴게요. ...",
    "place_identity_ko": "돌산도에 자리한 암자예요. ...",
    "status": "PLACE_LOOKUP",
    "intent": "PLACE_LOOKUP",
    "presentation_mode": "PLACE_KNOWLEDGE",
    "resolved_code": "hyangiram",
    "next_options": [],
    "shared_journey": null,
    "quote": null,
    "route": null
  }
```

**Response contract is sufficient.** No expansion needed to serve Basic Info UI. The `places[0]` object already carries all fields.

---

## G. Frontend Trace

### On main (294c55c):
```
/api/dt/travel/input/text
→ NOT CALLED by any frontend component
→ No soulResponse state
→ No resolved_code rendering
→ No place visual switching
→ No Basic Info component
```

### On staging (storybook-c7a):
```
SoulCableCarPage.jsx
→ POST /api/dt/travel/input/text
→ soulResponse = response.json()
→ resolved_code = soulResponse.resolved_code
→ Place Identity / Hero switching (f7c635f, STAGING ONLY)
→ message_ko rendered as text bubble
→ Basic Info: NOT YET IMPLEMENTED even on staging
```

Finding: Even on staging, the SOUL chat UI renders `message_ko` as a text blob but does NOT render a structured Basic Info section from `places[0]`. There is no PlaceBasicInfo component on staging.

**Conclusion for G:** Neither main nor staging has a Basic Info component. The staging SOUL chat interface has the infrastructure (calls /input/text, reads soulResponse) but does not extract and render `places[0]` fields as structured UI.

---

## H. Place Visual Regression Boundary

- `resolved_code`-driven Place Identity / Hero switching: staging only (f7c635f)
- Main has no place switching to regress
- Basic Info must attach to `resolved_code` from SOUL response — NOT keyword matching

When Basic Info is implemented, it must:
- Read `resolved_code` from SOUL response
- Use `places[0]` from the same response
- NOT derive place from message text parsing

---

## I. Three-Place Trace

### Hyangiram (향일암)

| Item | State |
|---|---|
| Basic Knowledge in DB | name_ko=향일암, address=돌산읍 향일암로 1, indoor_outdoor=outdoor, avg_stay_minutes=90, suitable_for=[family,elderly,kids_ok,pilgrimage] |
| DB gaps (NULL) | admission_fee_json, opening_hours_json, physical_difficulty, parking_info, description_short |
| Verified but not in DB | admission=무료 (YEOSU_2026_VERIFICATION_BATCH_01: CHANGED, legacy null → now free), hours=04:00~19:00, physical_difficulty=high (confirmed) |
| Backend exposes | places[0] with all above — nulls as null |
| Frontend receives | NOTHING (no component on main) |
| Currently renders | NOTHING |
| Missing connection | (1) No frontend component. (2) DB missing admission, hours, physical_difficulty values |
| Impact of DB gap | physical_difficulty=NULL → PU-HY-003 (elderly ASK) never fires even in Judgment V0.1 production |

### Odongdo (오동도)

| Item | State |
|---|---|
| Basic Knowledge in DB | name_ko=오동도, address=오동도로 222, indoor_outdoor=outdoor, avg_stay_minutes=120, suitable_for=[family,kids_ok,elderly,groups] |
| DB gaps (NULL) | admission_fee_json, opening_hours_json, physical_difficulty, parking_info, description_short |
| Verified but not in DB | admission: not confirmed (batch 01 focused on hyangiram/cablecar). physical_difficulty: not classified. |
| Backend exposes | places[0] with above |
| Frontend receives | NOTHING |
| Currently renders | NOTHING |
| Missing connection | (1) No frontend component. (2) Broader data gaps than hyangiram |

### Cable Car (케이블카)

| Item | State |
|---|---|
| Basic Knowledge in DB | name_ko=케이블카, address=오동도로 61-11, indoor_outdoor=outdoor, avg_stay_minutes=45, suitable_for=[family,kids_ok,young_adults] |
| DB gaps (NULL) | admission_fee_json, opening_hours_json, physical_difficulty, parking_info, description_short |
| Verified but not in DB | admission: BLOCKED — official site SSL error (per batch 01). hours: BLOCKED. physical_difficulty: unknown. |
| Backend exposes | places[0] with above |
| Frontend receives | NOTHING |
| Currently renders | NOTHING |
| Missing connection | (1) No frontend component. (2) Admission/hours verification required before DB population |

---

## J. Minimum Implementation Options

### Option A — Reuse existing `places[0]` payload

The PLACE_LOOKUP response already includes `places[0]` as `SELECT *`. Frontend reads fields directly.

- SSOT integrity: HIGH — source is DB, no duplication
- Duplication: NONE
- Request count: 0 additional requests
- Backward compatibility: COMPLETE — no backend change
- Implementation size: SMALL — frontend component only
- Place scalability: EXCELLENT — works for all 12 places, new places automatically
- Regression risk: LOW — no existing Basic Info component to break
- **Assessment: RECOMMENDED**

### Option B — Extend PLACE_LOOKUP response with explicit `basic_info` object

Duplicate `places[0]` fields into a top-level `basic_info: { admission, hours, stay, difficulty, parking }`.

- SSOT integrity: MEDIUM — data duplication between places[0] and basic_info
- Duplication: YES — same data in two shapes
- Request count: 0 additional
- Backward compatibility: OK if additive
- Implementation size: MEDIUM — backend change + frontend
- **Assessment: UNNECESSARY** — places[0] already contains all these fields. Creates a maintenance burden for no gain.

### Option C — Frontend makes separate place-detail request

New endpoint `/api/dt/travel/places/:code` → returns Basic Info.

- SSOT integrity: HIGH if endpoint reads same DB
- Duplication: NO
- Request count: +1 per place view
- Backward compatibility: N/A (new endpoint)
- Implementation size: LARGE — new route + frontend fetch
- **Assessment: UNNECESSARY** — data already in PLACE_LOOKUP response. Extra request for no reason.

### Option D — Hardcode known values in frontend

Hardcode "향일암: 무료, 04:00~19:00" etc. in JSX.

- SSOT integrity: BROKEN — breaks DB as source of truth
- Duplication: YES and decoupled from DB
- Place scalability: NONE
- **Assessment: UNACCEPTABLE** — breaks SSOT, fails to scale, creates maintenance debt.

---

## K. Recommended Minimum Basic Surface

Derived from what is ACTUALLY populated in the DB right now:

### Always available (renders immediately):
1. **머무는 시간** — `avg_stay_minutes` → "약 90분", "약 2시간", "약 45분"
2. **위치** — `indoor_outdoor=outdoor` → "야외"
3. **주소** — `address` → 주소 텍스트 (link to map)

### Available after DB data population (separate task):
4. **요금** — `admission_fee_json.adult` → "무료" / "N원" / null → "-"
5. **운영시간** — `opening_hours_json.summary` → "04:00~19:00" / null → "-"
6. **걷기 난이도** — `physical_difficulty` → "높음 (계단·경사 많음)" / null → hidden

### Note on data population:
- hyangiram: admission=무료, hours=04:00~19:00, physical_difficulty=high — verified, can be populated by UPDATE
- odongdo: needs verification before population
- cablecar: admission BLOCKED (SSL) — cannot be populated until verified

The Basic Info component must render non-null values only. No hardcoding. Null fields are hidden or displayed as "-".

---

## N. Decision

**BASIC_INFO_CONNECTION_READY**

**Rationale:**
1. Backend: Zero changes needed — `places[0]` in PLACE_LOOKUP response already exposes all structured fields
2. Response contract: Sufficient — no expansion needed
3. DB schema: Zero changes needed
4. Frontend: One component needed — PlaceBasicInfo reading from `places[0]`
5. DB data: UPDATE needed for key fields (separate data task, not blocking the UI connection)

**Implementation boundary (minimal):**

Backend:
- NO change required

Frontend:
- Create `PlaceBasicInfo` component
- Input: `places[0]` from SOUL PLACE_LOOKUP response
- Renders: avg_stay_minutes (always), indoor_outdoor (always), address (always), admission_fee_json (when non-null), opening_hours_json (when non-null), physical_difficulty (when non-null)
- Graceful null handling: non-null = render, null = hide field row
- Attachment point: inside SOUL chat response area when `presentation_mode === 'PLACE_KNOWLEDGE'`

DB data (separate task):
- UPDATE travel_places SET physical_difficulty='high', opening_hours_json='{"summary":"04:00~19:00"}' WHERE code='hyangiram'
- UPDATE travel_places SET admission_fee_json='{"adult":0}' WHERE code='hyangiram'
- odongdo and cablecar require verification first

---

## O. Evidence / Project State

**Production Evidence path:** `docs/architecture/SOUL_BASIC_INFO_CONNECTION_TRACE_V0_1.md`  
**HEAD before:** 294c55c  
**This document:** to be committed on main

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | HEAD before | 294c55c |
| 2 | Final evidence commit | (this document) |
| 3 | Evidence path | `docs/architecture/SOUL_BASIC_INFO_CONNECTION_TRACE_V0_1.md` |
| 4 | Production frontend component | `TravelGuidePage.jsx` (recommend flow). No SOUL chat component on main. |
| 5 | Basic Info UI component | DOES NOT EXIST on main or staging |
| 6 | Current API endpoint used | POST `/api/dt/travel/recommend` (TravelGuidePage). `/api/dt/travel/input/text` = backend-ready, no frontend |
| 7 | Current response shape | `/input/text` returns `places[0]` (SELECT * from travel_places) + message_ko + resolved_code + presentation_mode. Full schema at §F. |
| 8 | Current place identity source | `resolved_code` in SOUL response. Place hero switching = staging only (f7c635f not on main). |
| 9 | Basic field matrix | See §D. 4 fields B (EXISTS_NOT_CONNECTED with data), 4 fields B+E (EXISTS_NOT_CONNECTED, data NULL), 1 field F (code fallback). |
| 10 | Hyangiram trace | See §I. avg_stay_minutes=90, address populated. admission/hours/difficulty=NULL (verified but not in DB). |
| 11 | Odongdo trace | See §I. avg_stay_minutes=120, address populated. All fee/hours/difficulty=NULL. Verification less complete. |
| 12 | Cable Car trace | See §I. avg_stay_minutes=45, address populated. Admission BLOCKED (SSL). |
| 13 | Structured Basic data in response? | YES — `places[0]` contains all fields as structured object. Values mostly NULL, but structure is there. |
| 14 | Placeholder/hardcode findings | NONE — no Basic Info component exists to contain placeholders |
| 15 | Exact connection break | No frontend component calls `/api/dt/travel/input/text` on main. No component renders `places[0]` fields as structured UI. |
| 16 | Option A | RECOMMENDED — places[0] already in response, frontend reads directly. Zero backend change. |
| 17 | Option B | UNNECESSARY — duplication of places[0] data for no gain. |
| 18 | Option C | UNNECESSARY — extra round trip for data already present. |
| 19 | Option D | UNACCEPTABLE — breaks SSOT. |
| 20 | Recommended minimum Basic surface | avg_stay_minutes + indoor_outdoor + address (always). admission + hours + physical_difficulty (post DB population). |
| 21 | Backend change required? | NO |
| 22 | Frontend change required? | YES — PlaceBasicInfo component + connection to SOUL response |
| 23 | DB/schema change required? | NO (schema exists). DB data UPDATE needed for key fields = separate data task. |
| 24 | External research performed? | NO |
| 25 | Decision | **BASIC_INFO_CONNECTION_READY** |
| 26 | Project State | Design complete. Backend ready. Frontend component + DB data population = implementation scope. |
| 27 | Current Next Action | **Basic Information UI Connection V0.1 Implementation — Founder GO Gate** |
