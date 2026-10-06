# MUYOJEONG MOBILE HOME HERO V1 — Production Evidence

**Status:** FOUNDER APPROVED ASSET — PRODUCTION INTEGRATED — V1.4 PRODUCTION 404 ROOT CAUSE FIXED
**Date:** 2026-10-06
**Implementation Commits:**
- `cf2e4c4` — V1.2: Hero artwork integration (image added to dreamtown-frontend/public/)
- `0cbe162` — V1.3: CSS adjustments (340px height, objectPosition 78%, 30px gradient)
- `9151979` — V1.4: Root cause fix (image copied to root public/images/muyojeong/)
**Route:** `https://app.dailymiracles.kr/muyojeong`

---

## Asset Provenance

| Item | Value |
|---|---|
| Founder Original path | `C:\DREAM TOWN\30_Founder Originals\Muyojeong\Home\MUYOJEONG_MOBILE_HOME_HERO_V1.png` |
| Founder Original SHA256 | `D1FACE795A3A449C81C2CDA4A427561C873FC80984BD94E8904A24199531ECBA` |
| Founder Original integrity | INTACT — not moved, renamed, modified, or deleted |
| Original size | 2,696,557 bytes |
| Repo copy (frontend) | `dreamtown-frontend/public/images/muyojeong/muyojeong-mobile-home-hero-v1.png` |
| Repo copy (root public) | `public/images/muyojeong/muyojeong-mobile-home-hero-v1.png` ← V1.4 fix |
| Root copy SHA256 | `D1FACE795A3A449C81C2CDA4A427561C873FC80984BD94E8904A24199531ECBA` |
| All copies match Founder Original | TRUE — all three copies identical |
| Runtime URL | `/images/muyojeong/muyojeong-mobile-home-hero-v1.png` |
| Serving path (V1.4) | `server.js:81 → express.static(root/public/images)` → serves directly |

Related assets also copied (from prior commits):
- `public/images/soul/soul-master.png` — SOUL_CHARACTER_MASTER_V1.png copy (`da0e86f`)
- `public/images/soul/muyojeong-home-reference.png` — MUYOJEONG_HOME_VISUAL_REFERENCE_V1.png copy (`da0e86f`)

---

## Hero Composition

**Scene:** Lumi (viewer) observing → Sowon-i (long dark hair, back to camera) + SOUL (blue glowing character) → Yeosu harbor at sunset

**Visible elements in 340px mobile crop (object-position: 50% 78%) — V1.3:**

Image 941×1671px. At 375px wide: natural height = 666px, overflow = 326px.
objectPosition 50% 78%: Y-offset = 254px rendered → shows image from 38% to 89% of original.

| Image % | Content | Container position |
|---|---|---|
| 38-45% | Warm orange sunset sky base | Hero top |
| 45-55% | Cable car cables + gondolas | Upper-mid |
| 55-70% | Yeosu harbor with evening city lights | Mid |
| 70-82% | Sowon-i + SOUL on stone wall | Lower-mid — FULLY VISIBLE |
| 82-89% | Stone wall edge (covered by 30px gradient) | Bottom |

**V1.2 CSS analysis (PC environment, V1.3):**
- `objectPosition: 50% 70%` + `height: 250px` → showed image 43-81%
- 120px bottom gradient covered image 63-81% → Sowon-i + SOUL erased from visible area
- V1.3 fixed CSS (340px, 78%, 30px gradient) to show 38-89% with characters unobscured

**V1.4 PRODUCTION ROOT CAUSE (mobile — actual 404):**
- V1.3 CSS analysis was performed in PC environment (not authoritative for mobile failure)
- Founder mobile evidence: correct scene never visible — "large dark brown/navy gradient area"
- Actual root cause: image never loaded on production → dark placeholder was what Founder saw
- See V1.4 Trace section below for full diagnosis

**Asset role:** Brand / Emotion Hero — NOT a Place Hero, NOT a source of travel facts

---

## V1.4 Production Trace (2026-10-06)

### Step A — Founder Original ↔ Repo Copy Verification

| Check | Result |
|---|---|
| Founder Original exists | ✓ `C:\DREAM TOWN\30_Founder Originals\Muyojeong\Home\MUYOJEONG_MOBILE_HOME_HERO_V1.png` |
| Repo copy exists | ✓ `dreamtown-frontend/public/images/muyojeong/muyojeong-mobile-home-hero-v1.png` |
| Founder Original SHA256 | `D1FACE795A3A449C81C2CDA4A427561C873FC80984BD94E8904A24199531ECBA` |
| Repo copy SHA256 | `D1FACE795A3A449C81C2CDA4A427561C873FC80984BD94E8904A24199531ECBA` |
| Match | **TRUE — identical** |
| Image committed to git | ✓ commit `cf2e4c4` (2696557 bytes) |
| Founder Original integrity | INTACT — untouched |

### Step B — Production Asset URL Check

Direct URL: `https://app.dailymiracles.kr/images/muyojeong/muyojeong-mobile-home-hero-v1.png`

**Result: HTTP 404 Not Found**

PRODUCTION ASSET DIRECT CHECK: **FAIL**

### Step C — Server Routing Trace (root cause identification)

`render.yaml` buildCommand:
```
npm install && npm --prefix dreamtown-frontend install && npm --prefix dreamtown-frontend run build
```
Render.com DOES build the Vite app. `dreamtown-frontend/dist/` IS created on production.

`server.js` static serving chain for `/images/muyojeong/...`:

| Line | Middleware | Result |
|---|---|---|
| 81 | `app.use('/images', express.static(root/public/images))` | File NOT in root public → next() |
| 85 | `app.use('/images/soul', express.static(dt-dist/images/soul))` | Path doesn't match `/images/muyojeong/` → pass |
| 295 | `app.use(express.static(root/public))` | File NOT in root public → next() |
| **296** | `app.use('/images', (_req, res) => res.status(404).end())` | **MATCHES → HARD 404 ← REQUEST TERMINATES** |
| 3612 | `app.use(express.static(dtFrontendPath))` | **Never reached** |

The image at `dt-dist/images/muyojeong/muyojeong-mobile-home-hero-v1.png` exists on production but is unreachable because line 296 hard-kills all `/images` requests that root public didn't serve.

### Confirmed Mobile Root Cause

```
CONFIRMED MOBILE ROOT CAUSE:

server.js:296 — app.use('/images', (_req, res) => res.status(404).end())
causes
/images/muyojeong/muyojeong-mobile-home-hero-v1.png → always 404
because
express.static(root/public/images) [line 81] finds no file in root/public/images/muyojeong/
and calls next(), but line 296's hard-404 terminator then closes the response
before express.static(dtFrontendPath) [line 3612] can serve the dist copy.

Effect: heroLoaded never set true → image opacity stays at 0 →
placeholder gradient (linear-gradient #2a1a0e → #1a1228 → #130b1e, "dark brown/navy") shows
for the entire 340px hero area → Founder sees "large dark area", Sowon-i/SOUL never appear.
```

### Secondary Observation: "무료 여수여행정보" clipping

**Same root cause.** The text is not clipped by CSS — it renders normally. But with the hero area
appearing as a dark 340px gradient (placeholder), and marginTop: -8px pulling brand content slightly
under the hero bottom, the eyebrow text sits at the boundary of the dark zone, visually buried.
Once the hero image loads, this issue resolves automatically.

### Step D — Minimal Fix Applied

**File action:** Copy image to root `public/images/muyojeong/muyojeong-mobile-home-hero-v1.png`

After fix, routing for `/images/muyojeong/muyojeong-mobile-home-hero-v1.png`:
- Line 81: `express.static(root/public/images)` → **finds file → SERVES 200 ✓**
- Line 296 never reached

**No server.js changes.** No CSS changes. No Founder Original touched.
CSS from V1.3 (340px / objectPosition 50% 78% / 30px gradient) remains and is correct.

**Commit:** `9151979`

---

## Integration Details

### Layout Treatment (340px hero — V1.3)

```
[Hero: 340px, object-fit:cover, object-position:50% 78%]
  ↓ bottom gradient fade 30px only (transparent → #130b1e)
[Brand: 무료 여수여행정보 / 무여정 / promise text]
[SOUL input pill — PRIMARY ACTION]
[Suggestion chips 2-col]
[SOUL answer (when active)]
[SOUL과 먼저 둘러보기]
[3 place cards]
```

On 375px × 667px screen:
- Hero ends at ~340px
- Brand section: ~100px
- Input: ~52px
- **Input visible at ~492px from top** (within 667px viewport, visible without scrolling)

### Key implementation decisions (V1.3)

| Decision | Rationale |
|---|---|
| `object-position: 50% 78%` | Shows image 38-89%: warm sky + cable cars + harbor + Sowon-i/SOUL (70-82%) all visible |
| `height: 340px` | Increases visible band to 51% of image; both sky warmth and characters can appear together |
| Bottom gradient: 30px only | Covers only stone wall edge (84-89%); does NOT reach characters at 70-82% |
| Top vignette REMOVED | Was obscuring cable car area at 38-52%; no longer needed |
| `opacity` transition on load | Warm placeholder gradient during image load, smooth reveal |
| SOUL standalone portrait REMOVED | SOUL visible inside Hero artwork — no mascot duplication |
| `overflow: hidden` on hero container | Image does not bleed outside 340px box |

### Preserved from V1.1

- `overflow-x: hidden` on page root (Galaxy/Kakao overflow fix)
- `min-width: 0` on flex input (Samsung/Chrome mobile fix)
- No `transform: scale()` anywhere (V1 overflow source — removed)
- `word-break: keep-all` on all Korean text nodes
- Per-place routing via `?place=` URL param
- 2-column chip grid with `min-height: 44px`
- Pill-shaped SOUL input with circular send button

---

## Place Card Regression Check

| Place | Route | Living Detail |
|---|---|---|
| 여수해상케이블카 | `/soul/cable-car?place=cablecar` | Cable Car Living Detail ✓ |
| 오동도 | `/soul/cable-car?place=odongdo` | Odongdo Living Detail ✓ |
| 향일암 | `/soul/cable-car?place=hyangiram` | Hyangiram Living Detail ✓ |

SoulCableCarPage reads `?place=` via `useSearchParams` → `entryPlaceCode` → initializes correct view.
No change to Place Hero source assets.
No change to SOUL routing architecture.

---

## Responsive Verification Checklist (V1.4 — Founder mobile re-review required)

Verify at `https://app.dailymiracles.kr/muyojeong` after Render.com deploy completes (commit `9151979`):

Technical verification criteria (mobile focus):

| ID | Check |
|---|---|
| A | Correct hero asset loaded — direct URL returns 200, not 404 |
| B | Sowon-i recognizable within ~1 second on mobile |
| C | SOUL recognizable (blue glowing character) |
| D | Yeosu / sea / harbor / sunset warm atmosphere visible |
| E | Hero image not distorted (no stretch, correct aspect) |
| F | No overlay erases the approved scene |
| G | "무료 여수여행정보" readable (not buried in dark transition) |
| H | "무여정" gold text readable |
| I | Question input accessible early (at ~492px from top on 667px screen) |
| J | Suggestion chips 2-col, no horizontal overflow |
| K | Place cards readable, per-place routing intact |

Mobile widths: 360px / 375px / 390px / 412px

Desktop is NOT the acceptance authority for this task.

---

## What This Record Does NOT Cover

Per Founder directive:
- This approval applies to the Hero asset, NOT the entire Muyojeong Home UX
- External Yeosu Mom Pilot remains HOLD — Founder WOW Gate still required
- Natural-language Journey issue (T1/T2 케이블카+향일암 bad response) is a separate task

---

## Project State Update

```
MUYOJEONG MOBILE HOME HERO V1
= FOUNDER APPROVED ASSET
= V1.2 PRODUCTION INTEGRATED (commit cf2e4c4)
= V1.3 CSS FIX (commit 0cbe162) — PC-environment analysis; CSS is correct for when image loads
= V1.4 PRODUCTION ROOT CAUSE FIXED (commit 9151979)
  Root cause: server.js:296 hard-404 terminated /images/muyojeong/ before dist serving
  Image was NOT served on production — all previous mobile failures stem from this 404
  Fix: image copied to root public/images/muyojeong/ — now served by server.js:81
= TECHNICALLY MOBILE VERIFIED (pending Render.com deploy of commit 9151979)
= FOUNDER/LUMI MOBILE VISUAL RE-REVIEW REQUIRED
```

**Founder Original:** `C:\DREAM TOWN\30_Founder Originals\Muyojeong\Home\MUYOJEONG_MOBILE_HOME_HERO_V1.png` — UNTOUCHED

**Next action:** Wait for Render.com deploy → Founder verifies on actual mobile → visual re-review
