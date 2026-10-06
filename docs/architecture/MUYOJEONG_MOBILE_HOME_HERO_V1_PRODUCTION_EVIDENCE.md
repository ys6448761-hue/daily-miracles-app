# MUYOJEONG MOBILE HOME HERO V1 — Production Evidence

**Status:** FOUNDER APPROVED ASSET — PRODUCTION INTEGRATED
**Date:** 2026-10-06
**Implementation Commit:** `cf2e4c4`
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

**Visible elements in 250px mobile crop (object-position: 50% 70%):**
- Warm orange-red sunset sky with clouds and first stars
- Yeosu harbor with evening city lights below
- Cable car cables and gondolas crossing the harbor
- Sowon-i seated on stone wall (center frame)
- SOUL seated beside Sowon-i (glowing blue character, fully visible)
- Stone wall flowers/greenery in foreground

**Asset role:** Brand / Emotion Hero — NOT a Place Hero, NOT a source of travel facts

---

## Integration Details

### Layout Treatment (250px hero = no full-height poster)

```
[Hero: 250px, object-fit:cover, object-position:50% 70%]
  ↓ bottom gradient fade (transparent → #130b1e)
[Brand: 무료 여수여행정보 / 무여정 / promise text]
[SOUL input pill — PRIMARY ACTION]
[Suggestion chips 2-col]
[SOUL answer (when active)]
[SOUL과 먼저 둘러보기]
[3 place cards]
```

On 375px × 667px screen:
- Hero ends at ~250px
- Brand section: ~100px
- Input: ~52px
- **Input visible at ~402px from top** (within 667px viewport, no scrolling required)

### Key implementation decisions

| Decision | Rationale |
|---|---|
| `object-position: 50% 70%` | Shows characters + harbor; sky glow visible; no cropping of Sowon-i or SOUL |
| 250px hero height | Balances emotional impact with immediate SOUL access |
| Bottom gradient fade | Hero → page background (#130b1e) seamless, no hard edge |
| Top vignette (60px) | Subtle darkening for sky readability |
| `opacity` transition on load | Warm placeholder gradient during image load, smooth reveal |
| SOUL standalone portrait REMOVED | SOUL visible inside Hero artwork — no mascot duplication |
| `overflow: hidden` on hero container | Image does not bleed outside 250px box |

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

## Responsive Verification Checklist

Verify at `https://app.dailymiracles.kr/muyojeong`:

- [ ] A. 360px first viewport — hero, brand, input above fold
- [ ] B. 375px first viewport — input visible without scrolling
- [ ] C. 390px first viewport — same
- [ ] D. 412px first viewport — same
- [ ] E. SOUL question submission — chip or typed
- [ ] F. Hero composition — Sowon-i + SOUL visible, no distortion
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
= PRODUCTION INTEGRATED (commit cf2e4c4)
= MOBILE VERIFICATION PENDING (Founder/Lumi production review required)
```

**Next action:** Founder/Lumi reviews production page → then proceeds to SOUL Founder Natural Question Stress Test V0.1
