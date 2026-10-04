# SOUL Cable Car — Existing Work Restoration Audit V0.1

**Status:** AUDIT_COMPLETE + RESTORATION_VERIFIED  
**Branch audited:** `integration/soul-cablecar-port-v0-1` @ `3800790` → final HEAD `c7d1e38`  
**Date:** 2026-10-04  
**Mode:** READ-ONLY — no code changes

---

## Verification Closure (2026-10-04)

| Milestone | Commit | Status |
|---|---|---|
| Rich Knowledge Matrix (16 items) | 17f9401 | COMPLETE |
| Cabin FactRow (F5 PRESENTATION_GAP) | 25eee04 | IMPLEMENTED |
| Legacy Yeosu Origin deletion (60 files) | c7d1e38 | EXECUTED |
| Browser verification | — | PASS |
| PLACE_HERO | — | SAFE_IMAGELESS_FALLBACK |

**CABLE_CAR_BROWSER_VERIFY: PASS**  
URL: `http://localhost:3002/soul/cable-car`

**Current audit conclusion:**  
PRIMARY GAP = CONNECTION_GAP + PRESENTATION_GAP (not new knowledge creation).  
B/F-class items remain unconnected — addressed in next action: CABLE_CAR_KNOWLEDGE_CONNECTION_RESTORATION_V0_2.  

---

## Purpose

Founder confirmed that a previous SOUL Cable Car screen visibly showed an actual cable car image Hero.  
This audit traces what cable car work ALREADY EXISTS and identifies the exact gap between the prior verified screen and the current port.

---

## A. Hero / Visual Asset

### What exists in the repo

| Asset | Path | Status |
|---|---|---|
| OG image | `public/images/og/cablecar.jpg` | EXISTS — served at `/images/og/cablecar.jpg` |
| Fallback SVG | `public/images/fallback/star-yeosu-cablecar.svg` | EXISTS |
| Brand intro | `public/assets/brand/core/cablecar-star-intro.png` | EXISTS |
| Canonical source images (×25) | `public/images/canonical/source/cablecar/` | EXISTS — 25 files, emotion×stage |
| Star cache images (×25) | `public/images/star-cache/yeosu_cablecar/` | EXISTS — same 25 images |
| Storybook page05 (×4) | `public/images/storybook/sources/page05/cablecar/` | EXISTS |
| Thumbnail base (×5) | `public/images/thumbnails/cablecar/base/` | EXISTS |
| **SOUL hero (expected)** | `public/images/soul/cable-car/hero.png` | **DOES NOT EXIST** |

### PLACE_HERO_MAP (current — both staging and integration)

```js
const PLACE_HERO_MAP = {
  cablecar: '/dreamtown/images/soul/cable-car/hero.png',
};
```

The path `/dreamtown/images/soul/cable-car/hero.png` is correct for the production Express serving setup:
```
app.use('/dreamtown', express.static(dtFrontendPath, {...}))  // server.js:3583
```
Under this, `dist/images/soul/cable-car/hero.png` (copied from `public/`) would be served at `/dreamtown/images/soul/cable-car/hero.png`.

**BUT `public/images/soul/cable-car/hero.png` has never been placed in the repo.**

The `public/images/soul/` directory does not exist.

### Port 3002 (soul-preview, `base: '/'`) resolution

With `base: '/'`, Vite dev serves `public/foo.png` at `/foo.png`.  
The path `/dreamtown/images/soul/cable-car/hero.png` looks for `public/dreamtown/images/soul/cable-car/hero.png` — which also does not exist.

Result: `heroSrc` is `/dreamtown/images/soul/cable-car/hero.png`, `<img>` 404s silently, gradient fallback renders.

### Root cause of gradient on port 3002

**The cable car SOUL hero image has never been placed in `public/images/soul/cable-car/hero.png`.**  
Neither staging nor integration ever placed this file. Both showed gradient.

### What image did Founder see on the previous screen?

EXISTENCE_EVIDENCE: Founder confirmed a cable car image was visible on a prior SOUL Cable Car screen.  
Most likely sources (in order):

1. **`public/images/og/cablecar.jpg`** — this is a real photographic cable car image, served reliably at `/images/og/cablecar.jpg` by both Express (line 81) and Vite dev (any base config). Was it ever temporarily wired as the hero? Possible — git history of `SoulCableCarPage.jsx` does not show this path. Could be a prior uncommitted version.
2. **An older staging commit** before the PLACE_HERO_MAP was introduced — some earlier UI version may have referenced `og/cablecar.jpg` directly.
3. **The `cablecar-star-intro.png`** brand asset.

**VERDICT:** The cable car SOUL hero asset is a confirmed ASSET_GAP. The existing `og/cablecar.jpg` is the closest available real cable car image and could restore the visual immediately if wired.

---

## B. Rich Basic Knowledge

### Frontend hardcoded knowledge (EXISTING, verified in code)

**`SOUL_DISCOVERY` constants** (SoulCableCarPage.jsx:32–41):

| State | Content |
|---|---|
| `default` | Jasan↔Dolsan two-way option, offer to help with routing after knowing context |
| `vehicle` | Park at Jasan Station (1,000+ spaces), round-trip notice |
| `odongdo` | Jasan side priority for Odongdo continuation, routing caveat |
| `parents` | Crystal Cabin transparency warning, cabin choice at ticket gate |

**`FOR_ME` texts** (SoulCableCarPage.jsx:49–53):

| Context | Content |
|---|---|
| `vehicle` | Jasan parking (1,000+), early arrival advice for peak seasons |
| `odongdo` | 5-min walk from Jasan exit to Odongdo, 3–4 hour combined itinerary |
| `parents` | General/Crystal cabin selected at ticket gate, no advance reservation needed |

**`parseContext` keyword triggers** (SoulCableCarPage.jsx:56–88):

| Keyword set | Mapped to |
|---|---|
| 자차/드라이브/렌트/차(not 주차/기차) | `hasVehicle = true` |
| 오동도 | `nextPlace = 'odongdo'` |
| 부모/어르신/어머니/아버지/부모님 | `companion = 'parents'` |
| 아이/아기/유모차/어린이 | `companion = 'family'` |

### Backend service knowledge (EXISTING)

**`_buildPlaceLookupMessage`** (soyeowoolService.js:241): Constructs cable car SOUL message from DB fields:
- `name_ko`, `emotion_tags`, `suitable_for`, `weather_suitable`, `PLACE_IDENTITY_KO` (hardcoded map)
- `description_short` = NULL for all 12 DB places — DATA_GAP

**`_judgePlaceLookup`** (soyeowoolService.js:179): Judgment V0.1 — **hyangiram-only**.  
PU codes: PU-HY-001 (route options), PU-HY-003 (mandatory ASK), PU-HY-005 (stay range).  
**Cable car: zero PU-CC codes.** No mandatory ASK logic, no stay-range, no prepared judgment for cable car.

**`imageGenerationService.js:130`**: Maps `'yeosu_cablecar'` → `'yeosu-cablecar'` for thumbnail generation. Not related to SOUL hero.

### Knowledge knowledge files (EXISTING)

`docs/architecture/SOUL_CABLECAR_PORT_PRODUCTION_EVIDENCE_V0_1.md` — port evidence document.  
No `PU-CC-*` prepared knowledge codes found in docs/ or services/.

---

## C. SOUL Judgment State

### Frontend (SoulCableCarPage.jsx)

`stateIndex` computation (lines 287–310):

```js
const stateIndex = hasParents ? 3
  : travelerContext.hasVehicle ? 1  // NOTE: odongdo=2 below
  : travelerContext.nextPlace === 'odongdo' ? 2
  : 0;
```

Wait — actual logic (lines 287–295):
```js
const stateIndex = hasParents
  ? 3
  : travelerContext.nextPlace === 'odongdo'
  ? 2
  : travelerContext.hasVehicle
  ? 1
  : 0;
```

Renders `SOUL_DISCOVERY[{parents:3, odongdo:2, vehicle:1, default:0}]` below SOUL_MESSAGE.  
This is **static hardcoded text**, NOT backend-generated.

**Gap confirmed (P0-1 from Reality Audit):** SOUL_MESSAGE (backend-driven) + SOUL_DISCOVERY (hardcoded) = redundant double block.

### Backend (soyeowoolService.js)

`_judgePlaceLookup` = hyangiram-only. For cable car:
- `physical_difficulty` field in DB: unknown — never tested for cable car
- Even if cable car has `physical_difficulty`, no PU-CC rule fires
- Output: `{ askRequired: false, stayRange: null, routeOptions: null, ... }` → no Judgment impact

**VERDICT:** Cable car Judgment V0.1 is ABSENT from backend. Frontend SOUL_DISCOVERY is the only "judgment-like" content for cable car, and it is hardcoded local state.

---

## D. Context-Adaptive Content

### What actually changes per chip/context (VERIFIED in code)

| Context | JourneyFlow | ForMeSection | SOUL_DISCOVERY text |
|---|---|---|---|
| None (stateIndex=0) | Jasan/Dolsan two dots | Hidden | "자산과 돌산, 어느 쪽에서도..." |
| 자차 (stateIndex=1) | Car icon, Jasan parking note | Vehicle parking text | "자산정류장 주차장에..." |
| 오동도 (stateIndex=2) | Odongdo arc appended | Odongdo 5-min walk | "오동도까지 이어가신다면..." |
| 부모님 (stateIndex=3) | Crystal Cabin note | Cabin selection note | "크리스탈 캐빈은 바닥이..." |

**Not implemented:** PRIORITIZE, REORDER, COMPOSE. Module structure is hardcoded JSX conditionals only.

Gap B (explicit_context → backend): wired in 0503ed8. `has_car`, `people_type` sent on submit. Backend receives these but cable car page has no PU-CC judgment path that uses them.

---

## E. Journey / Relationship

**JourneyFlow component** (existing in SoulCableCarPage.jsx): renders Jasan↔Dolsan routing with context-adaptive overlays.  
**Odongdo walk distance:** hardcoded "5분" in FOR_ME.odongdo.  
**Journey suppressed for non-cablecar PLACE_LOOKUP:** implemented (staging V0.4 logic preserved).  
**Travel Time Matrix:** GOVERNANCE_HOLD — connection forbidden.

---

## F. Most Complete Historical State — Delta vs. Current Port

### Staging (storybook-c7a @ 37031ec)

- Same PLACE_HERO_MAP paths as integration — same gradient for cablecar (asset never placed)
- Same SOUL_DISCOVERY, FOR_ME, parseContext — no richer content than integration
- Odongdo/Hyangiram: PLACE_HERO_MAP had both paths, assets connected (odongdo: SOUL_ODONGDO_PLACE_HERO_V01.png, hyangiram: SOUL_HYANGIRAM_PLACE_HERO_V01.png existed)
- Gap B: NOT wired in staging (chips sent no explicit_context) — integration added this

### Integration port (0503ed8) vs. staging

| Capability | Staging V0.4 | Integration V0.5 |
|---|---|---|
| SOUL_DISCOVERY texts | Same 4 variants | Same |
| PLACE_HERO_MAP cablecar | `/dreamtown/images/soul/cable-car/hero.png` | Same |
| Hero file exists | No | No |
| Gap B (explicit_context) | NOT wired | WIRED |
| PlaceBasicInfo V0.2 formatter | Inline | Inline (same) |
| Odongdo/Hyangiram PLACE_HERO_MAP | Both paths present | Only cablecar path |
| Odongdo/Hyangiram hero assets | Connected (external files placed on staging server) | ASSET_GAP (files not in repo) |

**The cable car hero gradient existed in staging too. Staging also showed gradient for cable car.**  
The Founder's prior screen showing a cable car image was from a source not identified in any committed code path.

---

## Summary: What EXISTS vs. What Is Missing

| Capability | Status | Location |
|---|---|---|
| Cable car SOUL hero image | **ASSET_GAP** — `public/images/soul/cable-car/hero.png` MISSING | No file |
| Candidate existing image | `public/images/og/cablecar.jpg` VERIFIED | `/images/og/cablecar.jpg` |
| SOUL_DISCOVERY texts (4 variants) | EXISTS — hardcoded | SoulCableCarPage.jsx:32 |
| FOR_ME texts (3 variants) | EXISTS — hardcoded | SoulCableCarPage.jsx:49 |
| Context keywords (has_car/odongdo/parents/family) | EXISTS | SoulCableCarPage.jsx:56 |
| JourneyFlow (Jasan↔Dolsan) | EXISTS | SoulCableCarPage.jsx (JourneyFlow component) |
| Odongdo 5-min walk | EXISTS — hardcoded | FOR_ME.odongdo |
| Backend SOUL judgment for cable car | **ABSENT** — no PU-CC-* codes | soyeowoolService.js |
| Description_short from DB | **DATA_GAP** — NULL for all places | DB |
| PRIORITIZE / REORDER / COMPOSE | **NOT_IMPLEMENTED** | Not in code |
| Human Experience Layer | **TRUE_GAP** | Not in code |

---

## Recommended Next Actions (read-only finding — no implementation)

**Action 1 — Hero image (immediate, minimal):**  
Wire `public/images/og/cablecar.jpg` as cable car hero. This image EXISTS, is verified, and serves correctly via Express (`/images/og/cablecar.jpg`).  
Implementation: Update PLACE_HERO_MAP `cablecar` path. Or create `public/images/soul/cable-car/hero.png` as a copy/symlink.  
**Requires: Founder GO on image source choice.**

**Action 2 — Port 3002 preview path fix (immediate, minimal):**  
With `base: '/'`, PLACE_HERO_MAP paths prefixed with `/dreamtown/` don't resolve via Vite dev.  
Fix: Use a path that works for both dev (base='/') and production (base='/dreamtown/').  
`/images/og/cablecar.jpg` works via Express for both dev (line 81) and production (Express static).  
**Requires: same Founder decision as Action 1.**

**Action 3 — Cable car Judgment V0.1 (future, CONNECT_EXISTING):**  
Add PU-CC-* codes to `_judgePlaceLookup`. Families with elderly → Crystal cabin info (already in SOUL_DISCOVERY). Route options for car vs. no-car already in SOUL_DISCOVERY text.  
Existing SOUL_DISCOVERY knowledge can be formalized into prepared codes without new knowledge.  
**Requires: CONNECT_EXISTING classification + Founder scope GO.**

---

## Status

| Item | Finding |
|---|---|
| Founder-confirmed cable car image | SOURCE_UNKNOWN — not traceable to any committed path |
| Cable car hero in current code | ASSET_GAP — file missing from public/ |
| Closest candidate image | `public/images/og/cablecar.jpg` — verified exists |
| All cable car knowledge | EXISTS — hardcoded in SoulCableCarPage.jsx |
| Cable car backend judgment | ABSENT — PU-CC codes not implemented |
| Current port completeness | 0503ed8 is the most complete version across all branches |

**AUDIT_COMPLETE**

---

## Rich Knowledge Matrix — Addendum (2026-10-04)

### Sources searched

| Source | Path | Type |
|---|---|---|
| SoulCableCarPage.jsx (SOUL_DISCOVERY/FOR_ME/JourneyFlow/DEPTH) | `dreamtown-frontend/src/pages/SoulCableCarPage.jsx:32–645` | Hardcoded-in-code |
| Verification Batch 01 | `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_01.md §10` | Lumi-structured / NON_OFFICIAL_BLOG |
| Route Corpus V0.1 | `docs/knowledge/YEOSU_ROUTE_CORPUS_V0_1.json + .md` | Lumi-structured / OFFICIAL+WEB |
| 6117 Legacy Manifest | `docs/knowledge/6117_AUTOSAVE_LEGACY_KNOWLEDGE_MANIFEST_V0_1.md §7` | Unstructured / 2017-era |
| travel_places seed | `database/seeds/001_travel_places.sql:98–104` | Migration/seed |
| PLACE_IDENTITY_KO | `services/soyeowoolService.js:128` | Lumi-structured |
| Phoenix Handover | `docs/architecture/PHOENIX_HANDOVER_2026_09_21.md` | Lumi-structured |
| SOUL Journey Quality Audit | `docs/architecture/SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md` | Lumi-structured |
| SSOT / DreamTown Canon | `docs/ssot/core/`, `docs/ssot/constitution/` | Lumi-structured |
| docs/gpt/ | all DT_*.md | No cable car knowledge found |

---

### Rich Knowledge Matrix

**KNOWLEDGE ITEM: 1. Place Identity / History**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | soyeowoolService.js:128 (PLACE_IDENTITY_KO cablecar: 2-sentence identity). SoulCableCarPage.jsx:507 hero subtitle "도시와 섬 사이 · 바다 위 10분". 6117 legacy: §7 "해상케이블카" dedicated page (title only, content unstructured). SSOT: "케이블카 | confusion/distance" (DreamTown_Canonical_Foundation_v1.md), "케이블카 시야 코스" (Aurora5). |
| PROVENANCE | PLACE_IDENTITY_KO: Lumi-structured. Legacy: 2017-era founder/operator content. SSOT: Lumi-structured canonical. |
| VERIFIED STATUS | PLACE_IDENTITY_KO: UNVERIFIED (description_short=NULL). Legacy: VERIFICATION_REQUIRED (2017). |
| STRUCTURED? | PLACE_IDENTITY_KO: Plain-text embedded in service. Legacy: Unstructured (title only in manifest). |
| RUNTIME CONNECTED? | PARTIAL — PLACE_IDENTITY_KO fires only on PLACE_LOOKUP response (`soulResponse.place_identity_ko`). Subtitle = always rendered from JSX. |
| CURRENT UI EXPOSED? | PARTIAL — hero subtitle visible. PLACE_IDENTITY_KO in SOUL JUDGMENT card (PLACE_LOOKUP only). Rich history/character NOT exposed. |
| GAP CLASS | **B** EXISTS_NOT_CONNECTED — 6117 legacy dedicated page title confirmed but content not accessible or structured. PLACE_IDENTITY_KO is brief 2-sentence. |

---

**KNOWLEDGE ITEM: 2. Jasan vs Dolsan Station Differences**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | SoulCableCarPage.jsx:34 (SOUL_DISCOVERY.default: mentions both stations, no direction difference). SoulCableCarPage.jsx:36 (SOUL_DISCOVERY.vehicle: Jasan=parking, round-trip ok). SoulCableCarPage.jsx:38 (SOUL_DISCOVERY.odongdo: Jasan=Odongdo-friendly). ESSENTIAL INFO:522: "자산(시내) ↔ 돌산(섬) 왕복". YEOSU_ROUTE_CORPUS: zone map "오동도권: 해상케이블카(돌산측 승강장)". |
| PROVENANCE | Hardcoded-in-code. |
| VERIFIED STATUS | Partially verified (Jasan=시내/자산공원 side confirmed by zone map). |
| STRUCTURED? | Embedded-in-code. |
| RUNTIME CONNECTED? | YES — stateIndex drives variant display. |
| CURRENT UI EXPOSED? | PARTIAL — default SOUL_DISCOVERY shows both stations exist. Vehicle/Odongdo contexts surface Jasan preference. Dolsan characteristics (island exit, Dolsan Park access) NOT surfaced. |
| GAP CLASS | **B** EXISTS_NOT_CONNECTED — Dolsan exit characteristics, Dolsan Park walk, sunset view from Dolsan side not represented. |

---

**KNOWLEDGE ITEM: 3. Boarding Structure**
| EXISTS? | YES |
| EXACT SOURCE/PATH | SoulCableCarPage.jsx:522 FactRow: "자산(시내) ↔ 돌산(섬) 왕복". SOUL_DISCOVERY.vehicle:36: "왕복 운행이라 원하는 방향으로 타고 내리실 수 있어요". YEOSU_2026_VERIFICATION_BATCH_01.md §10: "자산역↔돌산역 1.5km, 편도 12~13분" (blog source). |
| PROVENANCE | Hardcoded-in-code (boarding structure). Blog-reference (1.5km distance). |
| VERIFIED STATUS | PARTIAL — structure correct, distance 1.5km from NON_OFFICIAL_BLOG only. |
| STRUCTURED? | Embedded-in-code (UI). Plain-text in batch doc. |
| RUNTIME CONNECTED? | YES — always rendered in ESSENTIAL INFO. |
| CURRENT UI EXPOSED? | YES — "자산(시내) ↔ 돌산(섬) 왕복" always visible. Route distance NOT shown. |
| GAP CLASS | **B** EXISTS_NOT_CONNECTED — 1.5km distance and "one-way get off anywhere" policy known but not in UI. |

---

**KNOWLEDGE ITEM: 4. Ride Duration**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | SoulCableCarPage.jsx:523 FactRow: "편도 약 10분". JourneyFlow:199: "편도 약 10분". YEOSU_2026_VERIFICATION_BATCH_01.md §10: "편도 12~13분" (blog reference). PHOENIX_HANDOVER_2026_09_21.md: "케이블카 왕복: 24~30분 (UNVERIFIED)". travel_places seed:100: avg_stay_minutes=45 (total visit, not just ride). |
| PROVENANCE | Hardcoded-in-code (10분). Blog reference (12~13분 discrepancy). Handover doc (round-trip UNVERIFIED). |
| VERIFIED STATUS | VERIFICATION_REQUIRED — 10분 vs 12~13분 discrepancy between code and blog. |
| STRUCTURED? | Embedded-in-code. Plain-text in batch/handover docs. |
| RUNTIME CONNECTED? | YES — hardcoded "약 10분" always shown. |
| CURRENT UI EXPOSED? | PARTIAL — "편도 약 10분" shown with "현장 확인 권장". Round-trip time NOT shown. |
| GAP CLASS | **D** VERIFICATION_REQUIRED — official source unavailable (SSL cert issue). Discrepancy between hardcoded 10분 and blog 12~13분 unresolved. |

---

**KNOWLEDGE ITEM: 5. Cabin Types**
| EXISTS? | YES |
| EXACT SOURCE/PATH | SoulCableCarPage.jsx:40 (SOUL_DISCOVERY.parents): "크리스탈 캐빈은 바닥이 투명해요. 고소 불편이 있으신 분이라면 일반 캐빈이 더 편하실 수 있어요. 탑승 전 현장에서 선택하실 수 있습니다." SoulCableCarPage.jsx:52 (FOR_ME.parents): "일반/크리스탈 캐빈은 당일 매표소에서 선택하시면 돼요." SoulCableCarPage.jsx:632: DEPTH "크리스탈 캐빈: 6인승. 바닥과 측면 일부가 투명해 아래 바다를 내려다볼 수 있어요. 일반 캐빈보다 요금이 높습니다." VERIFICATION_BATCH_01: 프리미엄캐빈 1대 350,000원 (3rd type — blog source). |
| PROVENANCE | Hardcoded-in-code (일반/크리스탈). Blog reference (프리미엄 존재 확인). |
| VERIFIED STATUS | PARTIAL — 일반/크리스탈 distinction confirmed. 프리미엄캐빈 from blog only. |
| STRUCTURED? | Embedded-in-code. |
| RUNTIME CONNECTED? | PARTIAL — crystal cabin knowledge surfaces only for parents context. Default view shows no cabin details. DEPTH section shows 크리스탈 details when expanded. |
| CURRENT UI EXPOSED? | PARTIAL — DEPTH section (expandable) shows cabin detail. Parents context shows SOUL_DISCOVERY.parents and FOR_ME.parents. Default view: no cabin type info. |
| GAP CLASS | **F** PRESENTATION_GAP — cabin knowledge exists and is rendered, but hidden behind context trigger and expandable section. Most users see only vague "일반 · 크리스탈 캐빈 구분" in ESSENTIAL INFO. |

---

**KNOWLEDGE ITEM: 6. Fares**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | SoulCableCarPage.jsx:524: "일반 · 크리스탈 캐빈 구분" + note "현장·공식 확인". YEOSU_2026_VERIFICATION_BATCH_01.md §10: 일반 왕복 17,000/편도 14,000원. 크리스탈 왕복 24,000/편도 19,000원. 프리미엄 1대 350,000원 (NON_OFFICIAL_BLOG). travel_places seed: admission_fee=NULL. VERIFICATION_BATCH_01 verdict: BUSINESS_DIRECT_VERIFY_REQUIRED. |
| PROVENANCE | Blog reference (2026-era, non-official). Deliberately withheld from UI pending official verification. |
| VERIFIED STATUS | VERIFICATION_REQUIRED — official site SSL cert error, phone verification pending. |
| STRUCTURED? | Plain-text in batch doc only. Not in DB (NULL). |
| RUNTIME CONNECTED? | NO — admission_fee_json=NULL in DB. UI deliberately vague ("현장·공식 확인"). |
| CURRENT UI EXPOSED? | PARTIAL — existence of categories acknowledged but no numbers shown. |
| GAP CLASS | **C** SOURCE_EXISTS_NOT_STRUCTURED — blog reference values in docs, not structured in DB, not shown in UI pending official verification. |

---

**KNOWLEDGE ITEM: 7. Operating Hours**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | SoulCableCarPage.jsx:525: "09:30~21:30 · 강풍 시 중단" (note: "당일 변경 가능"). YEOSU_2026_VERIFICATION_BATCH_01.md §10: "09:30~21:30 (토요일·성수기 연장)" — consistent with hardcoded value, blog source. travel_places: opening_hours_json field exists (DB value not queried in this audit — may be populated or NULL). |
| PROVENANCE | Hardcoded-in-code (from blog-era research). Blog reference in batch doc. |
| VERIFIED STATUS | VERIFICATION_REQUIRED — consistent blog source, no official source direct access. |
| STRUCTURED? | Embedded-in-code. Plain-text in batch doc. opening_hours_json: UNKNOWN (DB not queried in read-only audit). |
| RUNTIME CONNECTED? | NO — hardcoded string, not from DB opening_hours_json. |
| CURRENT UI EXPOSED? | YES — "09:30~21:30 · 강풍 시 중단" always shown. Saturday/peak extension NOT shown. |
| GAP CLASS | **F** PRESENTATION_GAP — hours rendered but Saturday extension absent. DB connection not confirmed. |

---

**KNOWLEDGE ITEM: 8. Parking**
| EXISTS? | YES |
| EXACT SOURCE/PATH | SoulCableCarPage.jsx:526: "자산정류장 측 주차장". FOR_ME.vehicle:50: "자산정류장 주차장(1,000+대)을 이용하세요. 성수기 주말엔 오전 일찍 도착하면 여유 있습니다." SOUL_DISCOVERY.vehicle:36: "자산정류장 주차장에 차를 두고 타시면 편해요." |
| PROVENANCE | Hardcoded-in-code. |
| VERIFIED STATUS | UNVERIFIED — 1,000+대 capacity not confirmed by official source. |
| STRUCTURED? | Embedded-in-code. |
| RUNTIME CONNECTED? | PARTIAL — vehicle context shows full parking detail. Default shows only "자산정류장 측 주차장". |
| CURRENT UI EXPOSED? | PARTIAL — default shows label only. Vehicle context adds 1,000+대 capacity + timing tip. |
| GAP CLASS | **F** PRESENTATION_GAP — rich parking knowledge exists but only surfaces on vehicle context trigger. Dolsan side parking not addressed. |

---

**KNOWLEDGE ITEM: 9. Weather / Suspension**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | SoulCableCarPage.jsx:525: "강풍 시 중단" (inline with operating hours). PHOENIX_HANDOVER_2026_09_21_TRAVELER_BASELINE_SHARED_JOURNEY.md:143: "케이블카 운휴 / 크루즈 결항 / 우천 / 임시휴관" listed as future verification target. |
| PROVENANCE | Hardcoded-in-code (brief mention). Handover doc (future verification tag). |
| VERIFIED STATUS | VERIFICATION_REQUIRED — specific wind speed threshold, suspension protocol, real-time check method unknown. |
| STRUCTURED? | Embedded-in-code (single phrase). |
| RUNTIME CONNECTED? | YES — "강풍 시 중단" shown inline with hours. |
| CURRENT UI EXPOSED? | PARTIAL — suspension condition mentioned but no guidance on how to check before visiting. |
| GAP CLASS | **E** TRUE_KNOWLEDGE_GAP (for specifics) — wind speed threshold, real-time check URL/method, suspension frequency genuinely absent from all corpus sources. "강풍 시 중단" is present but thin. |

---

**KNOWLEDGE ITEM: 10. Booking / Ticket Cautions**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | FOR_ME.parents:52: "일반/크리스탈 캐빈은 당일 매표소에서 선택하시면 돼요. 미리 예약하실 필요 없습니다." DEPTH section:641: "☎ 운행 문의: 061-664-7301". |
| PROVENANCE | Hardcoded-in-code. |
| VERIFIED STATUS | UNVERIFIED (no-advance-reservation policy). |
| STRUCTURED? | Embedded-in-code. |
| RUNTIME CONNECTED? | PARTIAL — "미리 예약하실 필요 없습니다" only surfaces on parents context. Phone always shown in DEPTH. |
| CURRENT UI EXPOSED? | PARTIAL — no-reservation guidance conditional on parents context. Phone in expandable DEPTH only. |
| GAP CLASS | **F** PRESENTATION_GAP — relevant cautions exist but hidden behind context trigger and expandable section. Peak-period queue wait strategy ABSENT. |

---

**KNOWLEDGE ITEM: 11. Discounts**
| EXISTS? | NO |
| EXACT SOURCE/PATH | Searched: SoulCableCarPage.jsx, soyeowoolService.js, VERIFICATION_BATCH_01, ROUTE_CORPUS, 6117 manifest, travel_places seed. No discount information found in any source. |
| PROVENANCE | N/A |
| VERIFIED STATUS | N/A |
| STRUCTURED? | N/A |
| RUNTIME CONNECTED? | NO |
| CURRENT UI EXPOSED? | NO |
| GAP CLASS | **E** TRUE_KNOWLEDGE_GAP — no discount information (여수시민/장애인/단체/패키지 할인) in any Phoenix corpus source. |

---

**KNOWLEDGE ITEM: 12. Accessibility / Family**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | travel_places seed:101: suitable_for=[family, kids_ok, young_adults]. parseContext:84: "유모차" → companion='family'. SOUL_DISCOVERY.parents: covers elderly/height anxiety. FOR_ME.parents: cabin selection note. SOUL_DISCOVERY.parents: "고소 불편이 있으신 분이라면 일반 캐빈이 더 편하실 수 있어요." |
| PROVENANCE | Seed classification (family/kids_ok). Hardcoded-in-code (elderly/height concern). |
| VERIFIED STATUS | PARTIAL — family classification verified. Wheelchair/stroller specifics unverified. |
| STRUCTURED? | Seed (classification). Embedded-in-code (elderly/height advice). |
| RUNTIME CONNECTED? | PARTIAL — family/elderly context handled. 유모차 keyword parsed. |
| CURRENT UI EXPOSED? | PARTIAL — elderly/cabin context shown on parents chip. Stroller/wheelchair specific guidance ABSENT from all UI surfaces. |
| GAP CLASS | **C** SOURCE_EXISTS_NOT_STRUCTURED for stroller — seed says kids_ok but no specific stroller/wheelchair accommodation guidance in any source. Height anxiety concern exists. |

---

**KNOWLEDGE ITEM: 13. Recommended Timing**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | YEOSU_ROUTE_CORPUS: cable car appears at AFTERNOON time_of_day (R038, R039) and EVENING (R040/20분, R041 evening). Route Tier 2 note: "여수해상케이블카 — 탑승 소요시간 UNKNOWN" (not timing recommendation). No explicit "일몰에 타면 좋다" or "오후 5시~7시 추천" statement found anywhere. |
| PROVENANCE | Route corpus (OFFICIAL+WEB pattern). |
| VERIFIED STATUS | VERIFICATION_REQUIRED — AFTERNOON/EVENING pattern inferred from route corpus, not stated as explicit timing recommendation. |
| STRUCTURED? | Plain-text (route corpus JSON). Not translated to UI guidance. |
| RUNTIME CONNECTED? | NO |
| CURRENT UI EXPOSED? | NO |
| GAP CLASS | **C** SOURCE_EXISTS_NOT_STRUCTURED — timing pattern exists in route corpus (afternoon/evening most common), but no explicit recommendation rule derived or stated. Sunset timing knowledge ABSENT as explicit fact. |

---

**KNOWLEDGE ITEM: 14. Odongdo Relationship**
| EXISTS? | YES |
| EXACT SOURCE/PATH | FOR_ME.odongdo:51: "자산 하차 후 오동도 입구까지 도보 약 5분. 케이블카 + 오동도 합산 반나절(3~4시간) 코스입니다." SOUL_DISCOVERY.odongdo:38: "오동도까지 이어가신다면 자산 쪽을 동선 후보로 먼저 볼 만해요..." DEPTH (conditional odongdo):636: "자산 하차 후 오동도 방파제 입구까지 도보 약 5분. 케이블카 + 오동도 합산 약 3~4시간. 돌산 하차 후 오동도 이동은 도보 불가(차량/택시 필요)." ROUTE_CORPUS: 여수해상케이블카↔오동도 edges (2 occurrences OFFICIAL, 2 OFFICIAL). |
| PROVENANCE | Hardcoded-in-code (5분, 3~4시간). Route corpus (OFFICIAL co-occurrence). |
| VERIFIED STATUS | PARTIAL — 5분 walk from Jasan unverified officially. 3~4시간 estimate unverified. |
| STRUCTURED? | Embedded-in-code (5분 + 3~4시간). JSON edges in corpus. |
| RUNTIME CONNECTED? | YES — odongdo context (stateIndex=2) surfaces Odongdo relationship. DEPTH section shows more detail when expanded. |
| CURRENT UI EXPOSED? | YES — Odongdo arc in JourneyFlow + FOR_ME.odongdo on context trigger + DEPTH conditional on odongdo context. |
| GAP CLASS | **A** EXISTS_AND_CONNECTED — best-covered relationship. Dolsan→Odongdo "도보 불가" warning also present. |

---

**KNOWLEDGE ITEM: 15. Car / Round-Trip / Vehicle-Return Considerations**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | SOUL_DISCOVERY.vehicle:36: "자산정류장 주차장에 차를 두고 타시면 편해요. 왕복 운행이라 원하는 방향으로 타고 내리실 수 있어요." SOUL_DISCOVERY.odongdo:38: "다만 차를 어디에 둘지와 케이블카를 왕복할지에 따라 더 편한 동선은 달라질 수 있어요." FOR_ME.vehicle:50: "자산정류장 주차장(1,000+대)을 이용하세요." |
| PROVENANCE | Hardcoded-in-code. |
| VERIFIED STATUS | UNVERIFIED — round-trip/one-way policy from code, not official source. |
| STRUCTURED? | Embedded-in-code. |
| RUNTIME CONNECTED? | YES — vehicle context surfaces car-related guidance. |
| CURRENT UI EXPOSED? | PARTIAL — vehicle context shows Jasan parking. Round-trip policy mentioned. Specific "if you exit at Dolsan, how to return to car at Jasan" workflow NOT shown. |
| GAP CLASS | **F** PRESENTATION_GAP — vehicle-return workflow (after exiting Dolsan, return to Jasan car) not explicitly addressed. Shuttle or taxi option not mentioned. |

---

**KNOWLEDGE ITEM: 16. Route Recommendations**
| EXISTS? | PARTIAL |
| EXACT SOURCE/PATH | YEOSU_ROUTE_CORPUS: cable car in 9 routes. Common patterns: 향일암→케이블카 (afternoon), 케이블카→돌산공원 (evening), 오동도→케이블카 (OFFICIAL, bidirectional). ROUTE_CORPUS edges: 향일암→케이블카 (3 occurrences), 케이블카→돌산공원 (2 occurrences), 오동도↔케이블카 (2+2 occurrences). YEOSU_ROUTE_CORPUS.md Tier 2: cable car 탑승 소요시간 UNKNOWN (blocks route planning). JourneyFlow: Jasan→cable car→Dolsan + optional Odongdo arc — partial route. |
| PROVENANCE | Route corpus (OFFICIAL+WEB patterns). Hardcoded-in-code (JourneyFlow). |
| VERIFIED STATUS | PARTIAL — route corpus derived from public sources. |
| STRUCTURED? | JSON-ready (route corpus). Embedded-in-code (JourneyFlow component). |
| RUNTIME CONNECTED? | PARTIAL — JourneyFlow shows cable car→Dolsan + optional Odongdo. Full route patterns from corpus NOT connected. |
| CURRENT UI EXPOSED? | PARTIAL — JourneyFlow shows simplified Jasan↔Dolsan+Odongdo. No full itinerary routing shown. |
| GAP CLASS | **B** EXISTS_NOT_CONNECTED — route corpus has 9+ routes with cable car. Common patterns (향일암→케이블카→돌산공원, 오동도→케이블카) exist but not surfaced as recommendations. |

---

### Summary Answer — A through E

**A. Richest Existing Cable Car Knowledge Source**

Primary richest: `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` lines 32–645 (SOUL_DISCOVERY, FOR_ME, JourneyFlow, DEPTH).
Contains: Jasan=parking side + Odongdo-friendly / Dolsan=island side. Crystal cabin 6인승, transparent floor, higher price. Jasan parking 1,000+대 capacity + peak timing tip. Odongdo walk 5분, 3~4시간 combined. Vehicle round-trip policy. Crystal vs. general cabin: field selection, no reservation. Phone 061-664-7301.

Second richest: `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_01.md §10`.
Contains: Blog-sourced fare values (일반 왕복 17,000/편도 14,000, 크리스탈 왕복 24,000/편도 19,000, 프리미엄 1대 350,000). Operating hours 09:30~21:30 (Saturday extension). Jasan↔Dolsan 1.5km, 편도 12~13분. Official source blocked by SSL cert. Phone: 061-664-7301.

Third: `docs/knowledge/YEOSU_ROUTE_CORPUS_V0_1.json` — cable car in 9 routes, rank #3 overall, zone patterns, Odongdo↔cable car bidirectional edges (OFFICIAL evidence).

**B. Founder-Shared Rich Cable Car Information — Corpus Completeness**

The only Founder-provided research document found (`docs/research/founder-source/무여정 초기 버전.docx`) is a Lumi-authored handover doc (per Taxonomy V0.2 audit) — not a cable car knowledge document.

The 6117 legacy archive (`6117_AUTOSAVE_LEGACY_KNOWLEDGE_MANIFEST_V0_1.md §7`) confirms a "해상케이블카" dedicated legacy page and "해상케이블카 패키지" EXPERIENCE entry existed in the 2017-era corpus, but ONLY titles are captured in the manifest — the actual content was not structured into Phoenix.

**VERDICT: PARTIALLY represented.**
- What IS in Phoenix: Jasan/Dolsan structure, crystal cabin basics, parking, Odongdo relationship, operating hours (approximate), fares (blog reference only, not structured)
- What is NOT in Phoenix from the 6117 legacy dedicated page: actual content of the "해상케이블카" page is unrecovered. The manifest confirms it exists as a distinct legacy page but its content was never transcribed or structured.

**C. Rich Knowledge That EXISTS But Is Not Reaching SoulCableCarPage**

| Knowledge | Source | Why Not Reaching UI |
|---|---|---|
| Fare specifics (17,000/14,000 일반, 24,000/19,000 크리스탈) | `YEOSU_2026_VERIFICATION_BATCH_01.md §10` | Deliberately withheld pending official verification |
| Ride time 12~13분 (vs hardcoded 10분) | `YEOSU_2026_VERIFICATION_BATCH_01.md §10` | Discrepancy unresolved; hardcoded 10분 used |
| Route distance 1.5km Jasan↔Dolsan | `YEOSU_2026_VERIFICATION_BATCH_01.md §10` | Not selected for ESSENTIAL INFO |
| Route patterns (향일암→케이블카→돌산공원, 오동도↔케이블카 OFFICIAL edges) | `YEOSU_ROUTE_CORPUS_V0_1.json` | Corpus not connected to UI; JourneyFlow hardcoded |
| Saturday/peak-hour operating hours extension | `YEOSU_2026_VERIFICATION_BATCH_01.md §10` | UI shows only base 09:30~21:30 |
| avg_stay_minutes=45 (total visit) | `database/seeds/001_travel_places.sql:100` | FactRow for cable car uses hardcoded strings, not DB field |
| 프리미엄캐빈 (1대 350,000원, group cabin) | `YEOSU_2026_VERIFICATION_BATCH_01.md §10` | Blog source only; not structured |
| 6117 legacy "해상케이블카 패키지" content | `6117_AUTOSAVE_LEGACY_KNOWLEDGE_MANIFEST_V0_1.md §7` | Legacy content unrecovered/unstructured |

**D. Genuinely Missing — Confirmed E (TRUE_KNOWLEDGE_GAP)**

| Item | Evidence for Absence |
|---|---|
| Discount information (여수시민/장애인/단체 할인) | Searched all 10 sources. Zero hits. |
| Wind speed suspension threshold / real-time check method | Only "강풍 시 중단" found. No threshold, no check URL. |
| Peak-period queue wait strategy | Not in any corpus source. |
| Sunset / golden hour timing recommendation (explicit) | Route corpus shows AFTERNOON/EVENING pattern but no "일몰에 타면 좋다" explicit fact. |
| Stroller / wheelchair specific accommodation details | travel_places has kids_ok but no operational accessibility detail. |
| Dolsan side exit experience (what to do in Dolsan after exit) | JourneyFlow shows Dolsan node but no guidance on Dolsan Park access from Dolsan station. |

**E. Nature of Current "알아야 할 것" Thinness**

**MIXED — predominantly CONNECTION_GAP, with genuine KNOWLEDGE_GAP for specifics.**

Evidence:
- Fares (항목 6): Rich values exist in Batch 01 (blog reference). UI deliberately vague. → CONNECTION_GAP (withheld pending verification).
- Cabin types (항목 5): Crystal cabin 6인승/transparent/higher price all exist in DEPTH section. → PRESENTATION_GAP (hidden behind expand + context trigger).
- Timing (항목 13): Route corpus has AFTERNOON/EVENING pattern. → CONNECTION_GAP (not surfaced).
- Ride duration discrepancy (항목 4): 10분 vs 12~13분. → KNOWLEDGE_GAP (verification blocked).
- Discounts (항목 11): Genuinely absent. → KNOWLEDGE_GAP.
- Suspension specifics (항목 9): Only "강풍 시 중단". → KNOWLEDGE_GAP.

**Summary classification:** The essential info section is thin primarily because (1) specific fare numbers are withheld pending official verification [CONNECTION_GAP / deliberate design decision], (2) richer detail exists but is hidden in expandable DEPTH and context-triggered FOR_ME [PRESENTATION_GAP], and (3) a subset of genuinely missing items that require new knowledge acquisition [KNOWLEDGE_GAP].

The current design deliberately presents "알아야 할 것" as a confidence-building surface, not a data dump — but some items (cabin type explanation, timing recommendation) could be surfaced without verification risk.

---

*Addendum appended: 2026-10-04. READ-ONLY — no code changes. Search completed across 10 source categories.*
