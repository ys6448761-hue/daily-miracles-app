# SOUL Place Basic Knowledge Runtime Trace V0.1

Date: 2026-10-02
Mode: READ-ONLY AUDIT — No implementation, no schema change, no data write
Branch: staging/storybook-c7a
HEAD inspected: f7c635f

---

## 1. Purpose

Determine why Basic Info for 오동도 and 향일암 is sparse in the Living Detail Page.
Distinguish KNOWLEDGE DEPTH from KNOWLEDGE CONNECTION from KNOWLEDGE PRESENTATION.

Central question:
"오동도/향일암의 기본정보가 현재 화면에서 빈약한 이유는
정보가 준비되지 않았기 때문인가,
준비된 정보가 runtime 연결 과정에서 유실되기 때문인가,
아니면 frontend가 의도적으로 일부만 렌더링하기 때문인가?"

---

## 2. Scope

Target places: odongdo, hyangiram only.
Cable car: reference comparison only.
No implementation. No web research. No Komi content treated as Truth.

---

## 3. Current Project State / HEAD

| Item | Value |
|---|---|
| Branch | staging/storybook-c7a |
| HEAD | f7c635f feat(soul): Living Detail Page simple place switching V0.1 |
| Prior commit | d8e9876 (Traveler Profile Continuity V0.1) |
| Modified file | `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` V0.4 |
| Backend changes | None since f7c635f |
| DB changes | None since f7c635f |

---

## 4. Runtime Trace

Full path traced for both places:

```
Canonical / Evidence
  database/seeds/001_travel_places.sql       ← ORIGIN seed (avg_stay, suitable_for, emotion)
  database/migrations/216_travel_places_core12_reality_v01.sql  ← admission_fee = {"adult":0}
        ↓
DB: travel_places table
  All fields from schema (200_travel_places.sql):
  code, name_ko, address, avg_stay_minutes, opening_hours_json,
  admission_fee_json, parking_info, suitable_for, physical_difficulty, etc.
        ↓
Backend service: travelGuideService.getPlaceByCode(code)
  services/travelGuideService.js:1162
  Query: SELECT * FROM travel_places WHERE code = $1 LIMIT 1
  → returns result.rows[0] — ALL columns, no field filtering
        ↓
soyeowoolService._buildPlaceLookupClientPayload(place, sessionId)
  services/soyeowoolService.js:248
  → places: [place]   ← full DB row, no column stripping
  → place_identity_ko: place.description_short || PLACE_IDENTITY_KO[place.code] || null
  → message_ko: _buildPlaceLookupMessage(place)   ← richer composition, correct JS typeof checks
        ↓
API response: { places: [fullPlaceRow], place_identity_ko, message_ko, resolved_code, ... }
        ↓
soulResponse (React state in SoulCableCarPage.jsx)
        ↓
placeData = soulResponse?.places?.[0]
        ↓
Basic Info FactRow rendering (jsx lines 521–540):
  1. placeData.avg_stay_minutes        → FactRow "평균 체류" — rendered if truthy
  2. placeData.opening_hours_json?.summary → FactRow "운영 시간" — rendered if truthy
  3. placeData.admission_fee_json?.summary → FactRow "입장료" — rendered if truthy
  4. !summary && placeData.admission_fee_json?.adult → FactRow "입장료" — rendered if truthy
  5. placeData.parking_info            → FactRow "주차" — rendered if truthy
  6. all-null fallback                 → "현장에서 확인하세요."
```

**SOUL Judgment** uses a SEPARATE source path:
```
place_identity_ko: place.description_short || PLACE_IDENTITY_KO[place.code]
  description_short: NULL for all 12 places (noted in service comment line 114)
  PLACE_IDENTITY_KO: hardcoded map in soyeowoolService.js lines 116–129
```
→ Basic Info and SOUL Judgment use DIFFERENT knowledge sources.

---

## 5. Odongdo Field Inventory

Source: `database/seeds/001_travel_places.sql` lines 90–96
Migration supplement: `database/migrations/216_travel_places_core12_reality_v01.sql` lines 33–46

| Field | Value in DB | Present? |
|---|---|---|
| code | 'odongdo' | ✓ |
| name_ko | '오동도' | ✓ |
| name_en | 'Odongdo Island' | ✓ |
| address | '오동도로 222' | ✓ |
| lat | 34.7602 | ✓ |
| lng | 127.7655 | ✓ |
| indoor_outdoor | 'outdoor' | ✓ |
| avg_stay_minutes | 120 | ✓ |
| suitable_for | ['family', 'kids_ok', 'elderly', 'groups'] | ✓ |
| weather_suitable | ['clear', 'clear_dry', 'spring'] | ✓ |
| emotion_primary | 'vitality' | ✓ |
| emotion_tags | ['nature', 'seasonal', 'growth'] | ✓ |
| trust_level | 'ORIGIN' | ✓ |
| origin_seed_id | 'ORIGIN-001' | ✓ |
| admission_fee_json | {"adult": 0} | ✓ (migration 216) |
| opening_hours_json | NULL | — |
| parking_info | NULL | — |
| phone_inquiry | NULL | — |
| official_website | NULL | — |
| description_short | NULL | — |
| physical_difficulty | NULL | — |
| accessibility_wheelchair | false (default) | ✓ |
| accessibility_stroller | false (default) | ✓ |
| live_status_required | true (default) | ✓ |
| zone_code | 'E-1' | ✓ |

Dedicated Prepared Knowledge doc: NONE
(Cable car has `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` + `_FOUNDER_V0_1.md`. Odongdo has no equivalent.)

---

## 6. Hyangiram Field Inventory

Source: `database/seeds/001_travel_places.sql` lines 15–21
Physical difficulty UPDATE: `database/seeds/001_travel_places.sql` line 125 (Founder-authorized 2026-09-20)
Migration supplement: `database/migrations/216_travel_places_core12_reality_v01.sql` lines 33–46

| Field | Value in DB | Present? |
|---|---|---|
| code | 'hyangiram' | ✓ |
| name_ko | '향일암' | ✓ |
| name_en | 'Hyangiram' | ✓ |
| address | '돌산읍 향일암로 1' | ✓ |
| lat | 34.5914162 | ✓ |
| lng | 127.8037534 | ✓ |
| indoor_outdoor | 'outdoor' | ✓ |
| avg_stay_minutes | 90 | ✓ |
| suitable_for | ['family', 'elderly', 'kids_ok', 'pilgrimage'] | ✓ |
| weather_suitable | ['clear', 'sunrise', 'all_season'] | ✓ |
| emotion_primary | 'serenity' | ✓ |
| emotion_tags | ['dawn', 'faith', 'historical'] | ✓ |
| trust_level | 'ORIGIN' | ✓ |
| origin_seed_id | 'ORIGIN-002' | ✓ |
| admission_fee_json | {"adult": 0} | ✓ (migration 216) |
| physical_difficulty | 'high' | ✓ (Founder-authorized seed UPDATE) |
| opening_hours_json | NULL | — |
| parking_info | NULL | — |
| phone_inquiry | NULL | — |
| official_website | NULL | — |
| description_short | NULL | — |
| accessibility_wheelchair | false (default) | ✓ |
| accessibility_stroller | false (default) | ✓ |
| live_status_required | true (default) | ✓ |
| zone_code | 'S-1' | ✓ |

Dedicated Prepared Knowledge doc: NONE
Note: `docs/knowledge/YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md` §C lists "향일암 (입장료 있음)" — conflicting with migration 216 setting `{"adult": 0}`. Verification queue entry (YEOSU_2026_VERIFICATION_QUEUE_V0_1.md) has hyangiram admission_fee as PENDING.

---

## 7. Field-Level Comparison Matrix

| Field | Odongdo Source | Odongdo API Payload | Odongdo Basic Info UI | Hyangiram Source | Hyangiram API Payload | Hyangiram Basic Info UI | Classification |
|---|---|---|---|---|---|---|---|
| avg_stay_minutes | seeds/001 line 95: 120 | places[0].avg_stay_minutes=120 | ✓ "평균 체류 약 120분" | seeds/001 line 18: 90 | places[0].avg_stay_minutes=90 | ✓ "평균 체류 약 90분" | A. RENDERED |
| admission_fee_json | migration 216: {"adult":0} | places[0].admission_fee_json={"adult":0} | ✗ 0 is JS-falsy | migration 216: {"adult":0} | places[0].admission_fee_json={"adult":0} | ✗ 0 is JS-falsy | B. AVAILABLE_NOT_RENDERED (JS falsy bug) |
| opening_hours_json | seeds/001: not set → NULL | places[0].opening_hours_json=NULL | ✗ null | seeds/001: not set → NULL | places[0].opening_hours_json=NULL | ✗ null | E. NOT_PREPARED |
| parking_info | seeds/001: not set → NULL | places[0].parking_info=NULL | ✗ null | seeds/001: not set → NULL | places[0].parking_info=NULL | ✗ null | E. NOT_PREPARED |
| address | seeds/001: '오동도로 222' | places[0].address='오동도로 222' | ✗ no FactRow | seeds/001: '돌산읍 향일암로 1' | places[0].address='돌산읍...' | ✗ no FactRow | B. AVAILABLE_NOT_RENDERED |
| physical_difficulty | seeds/001: NULL | NULL | ✗ | seeds/001 UPDATE: 'high' | places[0].physical_difficulty='high' | ✗ no FactRow | Odongdo: E. NOT_PREPARED / Hyangiram: B. AVAILABLE_NOT_RENDERED |
| suitable_for | seeds/001: array | places[0].suitable_for=[...] | ✗ no FactRow | seeds/001: array | places[0].suitable_for=[...] | ✗ no FactRow | B. AVAILABLE_NOT_RENDERED |
| weather_suitable | seeds/001: array | places[0].weather_suitable=[...] | ✗ no FactRow | seeds/001: array | places[0].weather_suitable=[...] | ✗ no FactRow | B. AVAILABLE_NOT_RENDERED |
| emotion_tags | seeds/001: array | places[0].emotion_tags=[...] | ✗ no FactRow | seeds/001: array | places[0].emotion_tags=[...] | ✗ no FactRow | B. AVAILABLE_NOT_RENDERED |
| description_short | seeds/001: not set → NULL | NULL | ✗ | seeds/001: not set → NULL | NULL | ✗ | E. NOT_PREPARED |
| phone_inquiry | seeds/001: not set → NULL | NULL | ✗ | seeds/001: not set → NULL | NULL | ✗ | E. NOT_PREPARED |
| official_website | seeds/001: not set → NULL | NULL | ✗ | seeds/001: not set → NULL | NULL | ✗ | E. NOT_PREPARED |
| place_identity_ko | PLACE_IDENTITY_KO map soyeowoolService.js:120 | place_identity_ko='여수 앞바다에...' | SOUL Judgment section (not Basic Info) | PLACE_IDENTITY_KO map soyeowoolService.js:117 | place_identity_ko='돌산도에 자리한...' | SOUL Judgment section (not Basic Info) | A. RENDERED (different section) |

---

## 8. 120min Lineage — Odongdo

**Q1: 오동도 "약 120분"은 어디에서 오는가?**

Exact lineage:

```
database/seeds/001_travel_places.sql
  line 95: ('odongdo', 'E-1', 'KR', 'YEOSU', '오동도', ..., 120, ...)
  field: avg_stay_minutes = 120

→ travel_places DB row: avg_stay_minutes = 120

→ travelGuideService.getPlaceByCode('odongdo')
     SELECT * FROM travel_places WHERE code = 'odongdo'
     → result.rows[0].avg_stay_minutes = 120

→ _buildPlaceLookupClientPayload(place, sessionId)
     → places: [place]   (place.avg_stay_minutes = 120)

→ soulResponse.places[0].avg_stay_minutes = 120

→ placeData.avg_stay_minutes = 120

→ SoulCableCarPage.jsx line 523:
     {placeData.avg_stay_minutes && (
       <FactRow label="평균 체류" value={`약 ${placeData.avg_stay_minutes}분`} />
     )}
→ UI: "평균 체류   약 120분"
```

Origin: `database/seeds/001_travel_places.sql` line 95. Not hardcoded in frontend or service. Not from Prepared Knowledge doc. Not from _buildPlaceLookupMessage composition.

---

## 9. 90min Lineage — Hyangiram

**Q2: 향일암 "약 90분"은 어디에서 오는가?**

Exact lineage:

```
database/seeds/001_travel_places.sql
  line 18: ('hyangiram', 'S-1', 'KR', 'YEOSU', '향일암', ..., 90, ...)
  field: avg_stay_minutes = 90

→ travel_places DB row: avg_stay_minutes = 90

→ travelGuideService.getPlaceByCode('hyangiram')
     SELECT * FROM travel_places WHERE code = 'hyangiram'
     → result.rows[0].avg_stay_minutes = 90

→ _buildPlaceLookupClientPayload(place, sessionId)
     → places: [place]   (place.avg_stay_minutes = 90)

→ soulResponse.places[0].avg_stay_minutes = 90

→ placeData.avg_stay_minutes = 90

→ SoulCableCarPage.jsx line 523:
     {placeData.avg_stay_minutes && (
       <FactRow label="평균 체류" value={`약 ${placeData.avg_stay_minutes}분`} />
     )}
→ UI: "평균 체류   약 90분"
```

Origin: `database/seeds/001_travel_places.sql` line 18. Same path as odongdo 120min.

---

## 10. Backend / API Payload Findings

**Q4: soulResponse.places[0]가 실제로 frontend에 전달하는 필드는 무엇인가?**

`travelGuideService.getPlaceByCode()` runs `SELECT * FROM travel_places WHERE code = $1 LIMIT 1`.
ALL columns are returned. No column filtering occurs in the service or payload builder.

Full column set delivered in `places[0]`:
```
id, code, country_code, city_code, zone_code,
name_ko, name_en, description_short (NULL),
address, lat, lng,
phone_inquiry (NULL), official_website (NULL),
opening_hours_json (NULL), admission_fee_json ({"adult":0}),
access_by_bus, access_by_car, parking_info (NULL),
suitable_for, weather_suitable, indoor_outdoor, avg_stay_minutes,
physical_difficulty (odongdo: NULL / hyangiram: 'high'),
accessibility_wheelchair, accessibility_stroller,
emotion_primary, emotion_tags,
live_status_required (true), fallback_alternatives (NULL), critical_conditions (NULL),
origin_seed_id, trust_level, source_url,
created_at, updated_at
```

**The API payload is NOT the bottleneck.** All fields that exist in the DB are delivered to the frontend.

**Additionally:**
- `place_identity_ko` is set from `PLACE_IDENTITY_KO[place.code]` — hardcoded map, richer than DB fields
- `message_ko` from `_buildPlaceLookupMessage()` composes a narrative from multiple DB fields AND PLACE_IDENTITY_KO, using correct `typeof fee.adult === 'number'` check → includes "무료로 둘러볼 수 있어요."

---

## 11. Frontend Rendering Findings

**Q5: SoulCableCarPage.jsx는 그중 무엇을 실제 렌더링하고 무엇을 버리는가?**

For non-cablecar PLACE_LOOKUP (`placeData` block, jsx lines 521–540):

| Condition checked | Odongdo result | Hyangiram result | Rendered? |
|---|---|---|---|
| `placeData.avg_stay_minutes` (truthy) | 120 → truthy | 90 → truthy | ✓ YES — "평균 체류 약 N분" |
| `placeData.opening_hours_json?.summary` (truthy) | NULL → undefined → falsy | NULL → undefined → falsy | ✗ NO |
| `placeData.admission_fee_json?.summary` (truthy) | {"adult":0} has no .summary → undefined → falsy | same | ✗ NO |
| `!summary && placeData.admission_fee_json?.adult` (truthy) | adult=0 → **0 is JS-falsy** → condition fails | adult=0 → same | ✗ NO — **BUG** |
| `placeData.parking_info` (truthy) | NULL → falsy | NULL → falsy | ✗ NO |
| all-null fallback | avg_stay=120 (truthy) → fallback not triggered | avg_stay=90 → same | ✗ fallback also suppressed |

**Result: Only "평균 체류" is rendered for both places.**

**Note on admission_fee 무료:**
The SOUL chat message (`message_ko`) DOES correctly say "무료로 둘러볼 수 있어요." because
`_buildPlaceLookupMessage()` uses `typeof fee.adult === 'number'` (correct — 0 passes this).
Only the Basic Info FactRow uses `placeData.admission_fee_json?.adult` (truthy check — 0 fails this).
→ Information exists in payload AND in SOUL message, but is absent from Basic Info section due to JS falsy check on 0.

**Fields available in payload but not rendered in Basic Info:**
- address (no FactRow defined)
- suitable_for (no FactRow defined)
- weather_suitable (no FactRow defined)
- emotion_primary, emotion_tags (no FactRow defined)
- physical_difficulty (hyangiram='high' — no FactRow in Basic Info; does appear in message_ko)
- admission_fee_json.adult=0 (FactRow defined but JS falsy blocks rendering)

---

## 12. Prepared Knowledge Connection Findings

**Q7: Prepared Knowledge에 더 풍부한 정보가 있는데 현재 runtime이 읽지 않는 경로가 있는가?**

### docs/knowledge dedicated place docs status:

| Place | Dedicated PLACE_KNOWLEDGE doc | Connected to runtime? |
|---|---|---|
| cablecar | YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md + FOUNDER_V0_1.md | NOT_CONNECTED (docs only, no runtime path) |
| lee_soon_shin_plaza | YEOSU_PLACE_KNOWLEDGE_LEE_SOON_SHIN_PLAZA_V0_1.md | NOT_CONNECTED |
| marine_park | YEOSU_PLACE_KNOWLEDGE_MARINE_PARK_V0_1.md | NOT_CONNECTED |
| hyangiram | NONE | N/A |
| odongdo | NONE | N/A |

Odongdo and Hyangiram do NOT have dedicated place knowledge docs.
Cable car, Lee Soon Shin Plaza, and Marine Park have docs, but even these are NOT connected to runtime (docs only).

### 6117 Autosave legacy:

`docs/knowledge/6117_AUTOSAVE_LEGACY_KNOWLEDGE_MANIFEST_V0_1.md` records:
- "여수 - 주요관광지 안내(오동도, 향일암)" — 2017, DIRECT_MENTION for both
- "여수 10경" — 2016, includes both

Status: CASE B (from project memory `project_6117_knowledge_audit.md`):
Archive completely preserved. Runtime DB conversion NOT executed. Founder decision pending.
→ Legacy knowledge for odongdo/hyangiram EXISTS in the 6117 archive but is NOT connected to the current runtime path.

**Q6: SOUL Judgment와 Basic Info는 같은 Knowledge Source를 쓰는가?**

NO. They use different sources:
- SOUL Judgment (`place_identity_ko`): `place.description_short || PLACE_IDENTITY_KO[place.code]` — hardcoded rich text in service file
- Basic Info FactRows: live DB fields (`avg_stay_minutes`, `opening_hours_json`, `admission_fee_json`, `parking_info`)
- SOUL message (`message_ko`): composite from DB fields + PLACE_IDENTITY_KO + _buildSuitableForLine + _buildTimingHint + physical_difficulty

SOUL Judgment is richer than Basic Info because it reads from a purpose-built hardcoded identity map.
Basic Info reads from DB operational fields — most of which are NULL.

---

## 13. Komi Content Gap Comparison

Founder-described Komi content categories vs. canonical evidence:

| Komi category | Canonical canonical evidence | Classification |
|---|---|---|
| 입장료 | admission_fee_json={"adult":0} in migration 216 (both places) | EXISTING_CANONICAL but EXISTING_BUT_DISCONNECTED from Basic Info FactRow due to JS falsy bug |
| 운영시간 | opening_hours_json = NULL for both | NOT_FOUND_IN_CANONICAL |
| 주차 | parking_info = NULL for both | NOT_FOUND_IN_CANONICAL |
| 화장실 | No field in travel_places schema or any doc | NOT_FOUND_IN_CANONICAL |
| 문의 | phone_inquiry = NULL for both | NOT_FOUND_IN_CANONICAL |
| 주소 | address='오동도로 222' / '돌산읍 향일암로 1' (both in DB) | EXISTING_CANONICAL but EXISTING_BUT_DISCONNECTED (no FactRow) |
| 이동 감각 (travel friction/approach) | No field in DB. 6117 autosave legacy may contain route info. | NOT_FOUND_IN_CANONICAL (runtime) |
| 일출/낮 방문 차이 | weather_suitable=['sunrise'] for hyangiram → timing hint in message_ko. No day/night contrast. | EXISTING_BUT_DISCONNECTED (partial — timing only, no comparison) |
| 보행 부담 | physical_difficulty='high' for hyangiram (Founder-authorized). Present in message_ko. Not in Basic Info. | EXISTING_CANONICAL but EXISTING_BUT_DISCONNECTED from Basic Info FactRow |
| 혼잡 (crowd/congestion) | No field in DB or docs | NOT_FOUND_IN_CANONICAL |
| 역사 | emotion_tags=['faith','historical'] (hyangiram). No narrative text in DB. | PARTIAL — tag only, no rich history text |
| 템플스테이 | No field or doc | NOT_FOUND_IN_CANONICAL |
| 등산 | physical_difficulty='high' present but no trail/route detail | NOT_FOUND_IN_CANONICAL (specific trail content) |
| 다른 일출 명소 (relationship/alternatives) | No relationship field or doc. fallback_alternatives=NULL. | NOT_FOUND_IN_CANONICAL |
| 소원 연결 | Business/product logic — not place knowledge | NOT_FOUND_IN_CANONICAL (by design) |
| 상품 연결 | Commerce layer — not place knowledge | NOT_FOUND_IN_CANONICAL (by design) |
| 보행 부담 (odongdo) | physical_difficulty = NULL for odongdo (only hyangiram has 'high') | NOT_FOUND_IN_CANONICAL |

**Hyangiram admission fee conflict: RESOLVED 2026-10-02**
`docs/knowledge/YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md` §C "향일암 (입장료 있음)" — STALE/SUPERSEDED. Written before free policy change. Annotated.
Migration 216 `{"adult": 0}` — CORRECT.
Verification queue entry — VERIFIED_CLOSED 2026-09-20.
Canonical value: admission_fee_json = {"adult": 0} (무료). 기존 성인 2,500원 폐지.
Evidence: YEOSU_2026_VERIFICATION_BATCH_01.md [11]; SOUL_HYANGIRAM_ADMISSION_CONFLICT_CLOSURE_V0_1.md.

---

## 14. Root Cause Classification

**Q8: 현재 Basic Info가 빈약한 가장 직접적인 원인:**

### Verdict: MIXED — two distinct causes, one primary and one secondary

**Primary cause: KNOWLEDGE_PREPARATION_GAP**

| Missing field | DB state | Impact |
|---|---|---|
| opening_hours_json | NULL for both | 운영시간 FactRow never fires |
| parking_info | NULL for both | 주차 FactRow never fires |
| description_short | NULL for both (per service comment line 114) | Falls through to PLACE_IDENTITY_KO map |
| physical_difficulty | NULL for odongdo | 보행 부담 not expressible for odongdo |

The seed (`001_travel_places.sql`) for odongdo and hyangiram captured emotional/contextual fields
(suitable_for, emotion_tags, weather_suitable) but did NOT populate operational fields
(opening_hours_json, parking_info, phone_inquiry, official_website).
These are NOT connected from any other source.

**Secondary cause: FRONTEND_PRESENTATION_GAP**

`admission_fee_json = {"adult": 0}` for both places IS populated (migration 216).
It reaches `placeData` in the frontend.
But the FactRow condition:
```javascript
{!placeData.admission_fee_json?.summary && placeData.admission_fee_json?.adult && (...)}
```
treats `adult = 0` as falsy in JavaScript. `0 && ...` = `false`. FactRow not rendered.

Evidence that the value IS available:
- DB: `admission_fee_json = {"adult":0}` ← confirmed, migration 216
- API payload: `places[0].admission_fee_json = {"adult":0}` ← SELECT * returns it
- `_buildPlaceLookupMessage()` line 204: `typeof fee.adult === 'number'` → correctly outputs "무료로 둘러볼 수 있어요." in message_ko

The 무료 information is in the SOUL chat message but absent from the Basic Info panel.

---

## 15. What Already Exists

| Item | Location | Used in runtime? |
|---|---|---|
| avg_stay_minutes (120/90) | seeds/001, DB | YES — rendered |
| admission_fee_json {"adult":0} | migration 216, DB | PARTIAL — in message_ko; NOT in Basic Info FactRow |
| address | seeds/001, DB | NO — payload present, no FactRow |
| physical_difficulty='high' (hyangiram) | seeds/001 UPDATE, DB | PARTIAL — in message_ko; NO Basic Info FactRow |
| suitable_for, weather_suitable, emotion_tags | seeds/001, DB | PARTIAL — used in message_ko composition; NO Basic Info FactRow |
| PLACE_IDENTITY_KO (both places) | soyeowoolService.js lines 117–120 | YES — in SOUL Judgment section |
| 6117 autosave "주요관광지 안내(오동도, 향일암)" | docs/knowledge/6117_AUTOSAVE_LEGACY_KNOWLEDGE_MANIFEST_V0_1.md | NOT_CONNECTED to runtime |

---

## 16. What Is Actually Missing

| Missing item | Odongdo | Hyangiram | Category |
|---|---|---|---|
| opening_hours_json | NULL | NULL | NOT_PREPARED |
| parking_info | NULL | NULL | NOT_PREPARED |
| description_short | NULL | NULL | NOT_PREPARED |
| phone_inquiry | NULL | NULL | NOT_PREPARED |
| official_website | NULL | NULL | NOT_PREPARED |
| physical_difficulty | NULL | 'high' (exists) | odongdo: NOT_PREPARED |
| 화장실 info | no schema field | no schema field | NOT_PREPARED (no schema) |
| 혼잡/crowd data | no schema field | no schema field | NOT_PREPARED (no schema) |
| relationship/alternatives | fallback_alternatives=NULL | fallback_alternatives=NULL | NOT_PREPARED |
| Dedicated place knowledge doc | NONE | NONE | NOT_PREPARED |
| opening hours verification | PENDING | PENDING | NEEDS_VERIFICATION |
| admission fee verification | — | CONFLICTED | CONFLICTED (entity manifest vs migration 216) |

---

## 17. What Must NOT Be Rebuilt

Per audit scope constraints:

- Do NOT create new FactRow types — this is an audit, not a UI extension
- Do NOT seed opening_hours or parking_info from unverified sources
- Do NOT copy Komi content values into DB
- Do NOT resolve the hyangiram admission_fee conflict by guessing
- Do NOT connect 6117 autosave content without Founder decision on CASE B
- Do NOT add address/physical_difficulty FactRows without Founder design decision
- Do NOT change admission_fee_json.adult from 0 — it was set by migration 216 with Founder approval scope

---

## 18. Open Questions

Q-A. **Hyangiram admission_fee conflict: CLOSED 2026-10-02**
Resolved. admission_fee_json = {"adult": 0} (무료) — VERIFIED.
Entity manifest annotation: STALE/SUPERSEDED. Verification queue: VERIFIED_CLOSED.
See SOUL_HYANGIRAM_ADMISSION_CONFLICT_CLOSURE_V0_1.md.

Q-B. **JS falsy bug on admission_fee_json.adult=0:**
Should the FactRow condition be changed to `typeof placeData.admission_fee_json?.adult === 'number'`?
This is a small, isolated code change in SoulCableCarPage.jsx.
Depends on Q-A: only fix after admission_fee values are confirmed.

Q-C. **Basic Info FactRow expansion scope:**
Which currently-available-but-not-rendered fields should get FactRows?
Candidates: address, physical_difficulty (hyangiram), suitable_for.
Requires Founder design decision on what belongs in Basic Info vs SOUL message.

Q-D. **opening_hours / parking_info preparation:**
What is the source and process for populating these NULL fields?
The verification queue (YEOSU_2026_VERIFICATION_QUEUE_V0_1.md) has these as PENDING for hyangiram.
Who verifies? When?

Q-E. **6117 autosave CASE B decision:**
"여수 - 주요관광지 안내(오동도, 향일암)" exists in legacy archive.
Founder decision pending on runtime DB connection.
If connected, what format do odongdo/hyangiram knowledge docs take?

---

## 19. Recommendation — NO IMPLEMENTATION

This is READ-ONLY audit. No recommendation leads to implementation in this session.

**Smallest evidence-backed next option (for Founder review):**

Option 1 — FRONTEND_PRESENTATION_GAP fix (smallest, self-contained):
Fix JS falsy check on `admission_fee_json.adult` in SoulCableCarPage.jsx.
Change: `placeData.admission_fee_json?.adult` → `typeof placeData.admission_fee_json?.adult === 'number'`
Effect: "무료" (0) would render in Basic Info FactRow for odongdo and hyangiram.
Precondition: Resolve hyangiram admission_fee conflict first (Q-A).
Risk: Low. Single condition change. No DB/schema/backend change.

Option 2 — KNOWLEDGE_PREPARATION: opening_hours + parking_info seed for odongdo/hyangiram.
Requires verified data (not Komi content — must be from official/verified source).
Would require new migration. Requires Founder scope approval per CLAUDE.md DB rules.

Option 3 — FactRow for physical_difficulty (hyangiram):
`physical_difficulty='high'` already in DB and payload.
Adding a FactRow "보행 난이도" for hyangiram would require only a jsx change.
Small scope, single place. Depends on design decision about Basic Info scope.

Option 4 — Prepare dedicated odongdo/hyangiram place knowledge docs (like cable car has).
Does not touch runtime code. Prerequisite for future SOUL message enrichment.
NOT connected to Basic Info until a runtime path is built.

DO NOT implement any of the above. Wait for Founder GO.

---

## 20. Founder Decision Required

**FD-1: CLOSED 2026-10-02**
Hyangiram admission_fee 무료 확정. admission_fee_json = {"adult":0} VERIFIED.
→ JS falsy fix (Option 1) precondition now met. Implementation requires separate Founder GO.

**FD-2 (design):**
Which currently-available fields should appear in Basic Info FactRows?
Currently available but not rendered: address, physical_difficulty (hyangiram), suitable_for.
→ Determines scope of any future FactRow additions.

**FD-3 (scope):**
JS falsy bug on `admission_fee_json.adult=0`:
Is this a go-immediately fix after FD-1 is resolved, or does it wait for a larger sprint?
→ Small, isolated, zero-regression-risk jsx change.

**FD-4 (data):**
opening_hours_json and parking_info for odongdo and hyangiram are NULL.
Should these be prepared, and if so from what verified source and by what process?
→ Determines whether KNOWLEDGE_PREPARATION_GAP is in scope for a near-term sprint.

**FD-5 (architecture):**
6117 autosave CASE B: Connect legacy "오동도/향일암 주요관광지 안내" to runtime?
→ Requires separate decision previously noted as Founder decision pending.
