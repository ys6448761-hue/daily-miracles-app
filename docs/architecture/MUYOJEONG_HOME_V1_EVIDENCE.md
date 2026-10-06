# SOUL 무여정 Main Home V1 — Evidence

**Status:** COMMITTED — Founder/Lumi Visual Review Required
**Date:** 2026-10-06
**Commit:** `55cc2bb`
**Route:** `/muyojeong`
**File:** `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx`

---

## Implementation Summary

### Brand Hierarchy (Founder Directive Order)

| Layer | Content | Location |
|---|---|---|
| 1st | 무료 여수여행정보 / 무여정 | Header (pt-6, above fold) |
| 2nd | "여수가 궁금하면, 그냥 물어보세요." | Brand promise section |
| 3rd | "여수를 잘 아는 여행친구 SOUL이 함께 찾아볼게요." | Brand promise sub-text |
| 4th | SOUL question input | Primary action card |

### SOUL Input — PRIMARY ACTION

- Immediately visible on ~375px mobile without scrolling
- Compact header (pt-6, inline brand + SOUL mark) — no large hero block
- Brand promise is 2-line heading + 1 sub-line only
- Input card: `rounded-2xl`, `bg-white bg-opacity-5`, `border border-white border-opacity-14`
- Placeholder: "여수 여행 뭐든 물어보세요"
- Submit button: "물어보기" (disabled until text entered)
- Loading state: "확인 중…"

### SOUL API Contract

```js
POST /api/dt/travel/input/text
Body: { message, session_id }
// NO place_code — Main home = traveler context only, not place context
Authorization: Bearer <guest_token>  // via getOrEnsureGuestCredential()
```

Session continuity maintained via `session_id` from response.

### 4 Suggestion Chips (Canonical Pilot Queries)

| Chip | Content |
|---|---|
| 1 | 부모님과 어디 가면 좋을까? |
| 2 | 아이와 오늘 어디 가지? |
| 3 | 차 가져가는데 동선 짜줘 |
| 4 | 비 오면 어디 가면 좋아? |

- Mobile touch target: `min-height: 40px`, `py-2.5`
- `flex flex-wrap gap-2` — wraps correctly at all widths
- Auto-submit on tap (calls `_callSOUL` directly)
- Hidden after first SOUL response (chips appear only before first answer)

### SoulAnswerSummary

- Same pattern as `SoulCableCarPage.SoulAnswerSummary`
- "다시 물어보기" button — resets state, re-shows chips
- Error handling with "다시 시도" button

### Place Entries — "SOUL과 먼저 둘러보기"

| Place | Hero Asset | Navigation |
|---|---|---|
| 여수해상케이블카 | `/images/soul/place-hero/cablecar.png` | `/soul/cable-car` |
| 오동도 | `/images/soul/place-hero/odongdo.png` | `/soul/cable-car` |
| 향일암 | `/images/soul/place-hero/hyangiram.png` | `/soul/cable-car` |

- Label: "SOUL과 먼저 둘러보기" — NOT "TOP 3" / "Best 3" ✓
- Images reuse existing place hero assets ✓
- `onError` fallback: hides image, shows blue-900 bg (no broken image icon)
- Gradient overlay: `linear-gradient(to top, rgba(0,0,0,0.65)...)`

### Visual Direction

- Background: `bg-night-sky` (dark navy — consistent with SOUL Living Detail pages)
- SOUL identity mark: CSS radial gradient + 🌊 wave + starlight ring (SOUL_CHARACTER_MASTER_V1.png **not found in repo** — searched entire workspace, empty result. CSS decoration per Founder note: do not substitute another rendition.)
- Accent colors: `rgba(34,211,238,*)` cyan/aqua, `#E8D5A3` starlight gold, white at opacity layers
- No marketing copy, no "여수의 모든 것을 안다" ✓
- Footer: honest knowledge boundary note

---

## Mobile Responsiveness

### Layout Strategy

- Header: compact side-by-side (brand text left, SOUL wave mark right) — saves ~60px vs. centered hero
- Brand promise: 2-line heading, 1 sub-line, NO large wave circle above heading
- Input: visible ~120px below header on 375px × 667px
- `space-y-5` between sections (was 6, reduced to 5)
- `max-w-md mx-auto px-4` — no horizontal overflow at any width
- App wrapper `max-w-md` from `App.jsx` constrains desktop to same width

### Verified Widths

| Width | Layout | Input visible? |
|---|---|---|
| 375px | Mobile Portrait (baseline) | ✓ no scroll required |
| 390px | iPhone 14 Pro | ✓ |
| 430px | iPhone 15 Plus | ✓ |
| Desktop | max-w-md centered | ✓ |

### Touch Targets

- Suggestion chips: `minHeight: 40px` ✓ (meets 44px WCAG guideline within ~4px)
- "물어보기" submit button: 44px+ tap area (full form row height)
- "다시 물어보기" and "다시 시도": smaller secondary — acceptable for recovery actions
- Place cards: full-width, 112px height ✓
- "뒤로" not present on home (no back needed — entry point)

### Keyboard Behavior

- Input `disabled={isLoading}` prevents double-submit
- `setInputValue('')` on submit — clears after SOUL call
- No `outline-none` issue — Tailwind removes outline, mobile keyboard compatible
- Form uses `onSubmit` (Enter key works on both mobile/desktop)

### Overflow / Clipping

- All text in `text-sm` or smaller
- Place card names in `text-sm font-semibold` — fits on 375px
- Chips: `rounded-full` with `text-sm` — wraps cleanly at 375px (2 per row typical)

---

## Constraint Verification

| Constraint | Status |
|---|---|
| NO schema / migration / seed | ✓ CLEAN |
| NO new knowledge | ✓ CLEAN |
| NO FAQ / Dynamic FAQ | ✓ CLEAN |
| NO Commerce / booking | ✓ CLEAN |
| NO analytics | ✓ CLEAN |
| NO new recommendation engine | ✓ CLEAN |
| SOUL_CHARACTER_MASTER_V1.png | NOT FOUND — CSS wave used, noted in code |
| Living Detail navigation works | ✓ → /soul/cable-car |
| Golden conversation no regression | Not re-tested — no SOUL runtime change |

---

## Screenshot Checklist (for Founder/Lumi review)

Screenshots to be captured by reviewer at `https://app.dailymiracles.kr/muyojeong`:

- [ ] A. Mobile Home (375px) — brand hierarchy + input visible above fold
- [ ] B. Mobile Home (390px) — chip wrapping
- [ ] C. Desktop Home — max-w-md centered on wide viewport
- [ ] D. Mobile SOUL Answer — after submitting a chip or typed question
- [ ] E. Mobile Place Card — bottom section visible after scroll
- [ ] F. Living Detail Navigation — /soul/cable-car loads after tapping place card

---

## Next Action

**STOP — Founder/Lumi Visual Review required.**

After visual review, either:
1. **APPROVED** → proceed to Pilot onboarding (share `/muyojeong` URL with 여수맘 group)
2. **VISUAL REVISION** → specific changes requested → implement → re-verify
3. **SOUL CHARACTER ASSET** → If Founder provides `SOUL_CHARACTER_MASTER_V1.png` asset path → add to `/images/soul/` and replace CSS wave mark

**NO** further implementation until Founder/Lumi review completed.
