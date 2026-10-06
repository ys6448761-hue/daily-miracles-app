# MUYOJEONG MOBILE HOME HERO V1 — Production Evidence

**Status:** FOUNDER APPROVED ASSET — PRODUCTION INTEGRATED — V1.3 VISIBILITY FIX DEPLOYED
**Date:** 2026-10-06
**Implementation Commit:** `cf2e4c4` (V1.2) → `0cbe162` (V1.3 visibility fix)
**Route:** `https://app.dailymiracles.kr/muyojeong`

---

## Asset Provenance

| Item | Value |
|---|---|
| Founder Original path | `C:\DREAM TOWN\30_Founder Originals\Muyojeong\Home\MUYOJEONG_MOBILE_HOME_HERO_V1.png` |
| Original size | 2,696,557 bytes |
| Production copy path | `dreamtown-frontend/public/images/muyojeong/muyojeong-mobile-home-hero-v1.png` |
| Runtime URL | `/images/muyojeong/muyojeong-mobile-home-hero-v1.png` |
| Founder Original integrity | INTACT — not moved, renamed, modified, or deleted |
| Prompt file | `MUYOJEONG_MOBILE_HOME_HERO_V1_PROMPT.md` — not present in Founder Originals folder (not needed) |

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

**V1.2 failure (fixed in V1.3):**
- `objectPosition: 50% 70%` + `height: 250px` → showed image 43-81%
- 120px bottom gradient covered image 63-81% → Sowon-i + SOUL completely erased
- Net unobscured: only dark harbor band (43-63%) → appeared as "dark brown/navy gradient area"

**Asset role:** Brand / Emotion Hero — NOT a Place Hero, NOT a source of travel facts

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

## Responsive Verification Checklist (V1.3 — Founder re-review required)

Verify at `https://app.dailymiracles.kr/muyojeong` after Render.com deploy completes (commit `0cbe162`):

- [ ] A. 360px first viewport — hero scene recognizable within 1 second
- [ ] B. 375px first viewport — Sowon-i + SOUL visible, warm sky visible
- [ ] C. 390px first viewport — same
- [ ] D. 412px first viewport — same
- [ ] E. Input visible without scrolling (at 492px from top, within 667px screen)
- [ ] F. Hero composition — warm orange sky, cable cars, Sowon-i + SOUL, harbor
- [ ] G. Brand text readable — 무여정 gold, promise white
- [ ] H. Suggestion chips — 2-col, no overflow
- [ ] I. Place cards — readable, correct links
- [ ] J. No horizontal overflow at any width
- [ ] K. Desktop sanity (max-w-md centered)

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
= V1.3 VISIBILITY FIX DEPLOYED (commit 0cbe162)
  Root cause: 120px gradient covered characters + objectPosition showed dark mid-section
  Fix: 340px hero / objectPosition 50% 78% / 30px gradient / top vignette removed
= MOBILE VERIFICATION PENDING — Founder/Lumi production re-review required
```

**Next action:** Founder/Lumi verifies production page (wait for Render.com deploy) → visual re-review → then SOUL Founder Natural Question Stress Test V0.1
