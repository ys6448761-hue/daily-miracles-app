# LEGACY_YEOSU_ORIGIN_ASSETS_DELETED

**Decision Date:** 2026-10-04  
**Authority:** Founder (이세진 / 푸르미르)  
**Branch:** `integration/soul-cablecar-port-v0-1`  
**Status:** EXECUTED — 60 files deleted, 3 code references cleaned

---

## Founder Decision (verbatim summary)

> "The old 'Yeosu Origin' visual assets are no longer approved for current SOUL / Muyojeong product use.  
> This is NOT limited to Cable Car. Scope includes the legacy Yeosu Origin visual family such as: Cable Car, Hamel Lighthouse, cafes, hotels, other Yeosu places / scenes belonging to the same old Origin asset set.  
> Founder explicitly requests: USE PROHIBITED + DELETE FROM CURRENT REPOSITORY."

---

## Deleted Asset Manifest

### Category 1: OG photos (2 files)
| File | Bytes | Description |
|---|---|---|
| `public/images/og/cablecar.jpg` | 301,010 | Real cable car photograph — Yeosu Hamel Cable Car |
| `public/images/og/hamel.jpg` | 292,982 | Real Hamel Lighthouse photograph |

### Category 2: Archive — Hamel Legacy (42 files)
**Path:** `public/images/archive/hamel/legacy/`

`canonical_source/` (25 files):
- `hamel_calm_emerald_base01–05.png` (×5, ~3–3.5MB each)
- `hamel_confusion_moonstone_base01–05.png` (×5, ~3–3.5MB each)
- `hamel_curiosity_topaz_base01–05.png` (×5, ~3–3.5MB each)
- `hamel_fragile_hope_diamond_base01–05.png` (×5, ~3–3.5MB each)
- `hamel_pause_sapphire_base01–05.png` (×5, ~3–3.5MB each)

`sample_v1/` (~17 files including DEBUG and base_NEW variants):
- `hamel_calm_emerald_base03_v2.png` (~9MB)
- `hamel_curiosity_topaz_base04_v2.png` (~9MB)
- `hamel_fragile_hope_diamond_base05_v2.png` (~9MB)
- Plus DEBUG, unnamed, base_NEW variants

**Classification basis:** Path labeled `archive/legacy` — these are original Yeosu Origin source images, superseded and rejected.

### Category 3: Storybook page05 sources (16 files)
**Path:** `public/images/storybook/sources/page05/`

| Subdirectory | Files | ~Size each |
|---|---|---|
| `cablecar/` | 4 | 3.1–3.5MB |
| `cafe/` | 4 | 3.2–3.5MB |
| `hamel/` | 4 | 2.5–3.1MB |
| `hotel/` | 4 | 2.6–3.4MB |

Filenames follow pattern: `{place}_page05_{emotional_afterflow|reality_reconnection|widened_continuation|wish_signal_continuation}_base.png`

**Classification basis:** These are "Yeosu Origin" storybook source scenes. The Founder's scope explicitly included "Cable Car, Hamel Lighthouse, cafes, hotels" — all four place types present in this directory.

**Generation config preserved (not deleted):** `config/storybook/page05.json` — source spec config, no runtime usage.

---

**TOTAL: 60 files deleted**

---

## References Cleaned (Code)

| File | Change |
|---|---|
| `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` | `PLACE_HERO_MAP.cablecar` entry removed → `heroSrc = null` → gradient fallback |
| `dreamtown-frontend/vite.config.soul-preview.js` | `/images/og` proxy block removed (image no longer exists) |
| `routes/seedRoutes.js` | `LOCATION_BASE_IMAGE` entries for cablecar.jpg / hamel.jpg removed → `resolveBaseImage` falls to `DEFAULT_OG` |

---

## Assets Explicitly NOT Deleted (KEEP)

| Path | Reason |
|---|---|
| `public/og/star-clarity.png` | DreamTown star asset — Kakao share (different asset family) |
| `public/og/star-courage.png` | DreamTown star asset — Kakao share |
| `public/og/star-rest.png` | DreamTown star asset — Kakao share |
| `public/images/canonical/source/cablecar/` (25 files) | WishArt emotion generation pipeline — production star assets |
| `public/images/star-cache/yeosu_cablecar/` (25 files) | Processed star cache — production pipeline |
| `public/images/thumbnails/cablecar/` | DreamTown star thumbnails — production pipeline |

---

## Governance Rules

1. **USE PROHIBITED** — These images must not be re-added to this repository.
2. **RE-USE PROHIBITED** — Do not copy from git history back to working tree.
3. **SCOPE** — Prohibition covers SOUL, Muyojeong, any new DreamTown product surface.
4. **FUTURE ASSETS** — New Cable Car / Hamel / cafe / hotel images require explicit Founder selection + approval before commit.
5. **EXCEPTION PROCESS** — Any image depicting deleted Yeosu Origin places requires Founder explicit go before being added.

---

## Fallback Behavior Post-Deletion

- **SoulCableCarPage hero:** `PLACE_HERO_MAP` is empty `{}` → `heroSrc = null` → `{heroSrc && <img/>}` evaluates to false → **gradient background shown**. All text, SOUL_DISCOVERY, FOR_ME, Cabin FactRow, JourneyFlow, DEPTH sections unaffected.
- **seedRoutes.js / storybook thumbnails:** `LOCATION_BASE_IMAGE` empty → `resolveBaseImage` falls to `DEFAULT_OG` (`/images/dreamtown-og-v4.jpg`) — verified exists.
- **No build errors expected** — No import statements reference the deleted files.

---

## Preserved Restoration V0.1 (intact)

The following Restoration V0.1 work from commit `25eee04` remains fully intact despite hero image deletion:
- Cabin FactRow: `<FactRow label="캐빈" value="일반 / 크리스탈" note="탑승 전 현장 선택 · 예약 불필요" />`
- SOUL_DISCOVERY (4 variants: default / vehicle / odongdo / parents) — all preserved
- FOR_ME texts (3 variants: vehicle / odongdo / parents) — all preserved
- JourneyFlow, DEPTH, Odongdo relationship — all preserved
- vite.config.soul-preview.js structure — preserved (only `/images/og` proxy removed)
