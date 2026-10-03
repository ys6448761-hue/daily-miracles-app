# SOUL Cable Car — Existing Work Restoration Audit V0.1

**Status:** AUDIT_COMPLETE  
**Branch audited:** `integration/soul-cablecar-port-v0-1` @ `3800790`  
**Date:** 2026-10-04  
**Mode:** READ-ONLY — no code changes  

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
