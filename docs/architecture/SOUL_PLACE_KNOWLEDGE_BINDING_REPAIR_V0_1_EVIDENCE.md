# SOUL Place Knowledge Binding Repair V0.1 — Evidence

**Status:** IMPLEMENTED — Regression Verified. Production verification required.  
**Date:** 2026-10-07  
**Files Changed:**
- `services/soyeowoolService.js` — A, B, D
- `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` — C

---

## TECHNICAL DEBT — DUAL-SOURCE KNOWLEDGE CONNECTION RISK

**Finding:** Living Detail JSX static content and `_PLACE_KNOWLEDGE` (SOUL runtime) are two independent, unsynchronized copies of the same Phoenix-verified place knowledge.

| Source | Location | Owner |
|---|---|---|
| Frontend static | `SoulCableCarPage.jsx` JSX constants | UI rendering (place cards, expandable sections) |
| SOUL runtime | `_PLACE_KNOWLEDGE` in `soyeowoolService.js` | SOUL answer construction |

When Phoenix-verified knowledge is written to JSX (parking, route data), it must also be mirrored to `_PLACE_KNOWLEDGE`. No process currently enforces this sync. The two sources have drifted — producing "UNKNOWN" SOUL answers while the page displays the same fact.

**Status:** KNOWN TECHNICAL DEBT — no architectural fix in this task. Future place expansion must not blindly repeat this duplication. Operational evidence required before redesigning canonical knowledge architecture.

---

## 1. Issue A — Cablecar Parking

**ROOT CAUSE:** `parking_ko` absent from `_PLACE_KNOWLEDGE.cablecar`. Living Detail Fallback (0df632f) correctly routed "주차는 어디에 해?" through `_buildPlaceSpecificQueryPayload`, but no parking branch existed → default "정보를 확인 중이에요."

**JSX source (unchanged):** `SoulCableCarPage.jsx` ~line 1229:
```jsx
<FactRow label="주차" value="자산·돌산 양쪽 접근 가능" note="주차 위치·혼잡은 출발 정류장에 따라 확인" />
```

**Fix applied (2 additions to `soyeowoolService.js`):**
1. `_PLACE_KNOWLEDGE.cablecar` — added `parking_ko` field using same verified content as JSX
2. `_buildPlaceSpecificQueryPayload` — added parking branch before hours branch: `/(주차|차 세우|차 대|주차장)/`

**Parking_ko value:** `'자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. 주차 위치·혼잡은 출발 정류장에 따라 달라요.'`

---

## 2. Issue B — Hyangiram Routes

**ROOT CAUSE:** `routes_ko` absent from `_PLACE_KNOWLEDGE.hyangiram`. Stairs branch (0df632f) unconditionally appended `"\n대안 경로 정보는 아직 없어요."` — a **false UNKNOWN** while JSX `HyangiramJourneyFlow` and `HyangiramQuestionDiscovery` already rendered two-route knowledge.

**JSX source (unchanged):** "두 경로 있음 / 경사 차이 / 올라온 길 또는 다른 경로로 내려갈 수 있음 / 계단길 약 10분 / 완만한 길 약 15분"

**Constraint honored:** routes_ko preserves "완만한 길도 계단이 없지는 않아요" — NOT stair-free claim.

**Fix applied (2 changes to `soyeowoolService.js`):**
1. `_PLACE_KNOWLEDGE.hyangiram` — added `routes_ko`:
   `'두 경로로 오를 수 있어요. 한 쪽은 가파른 편이고 (약 10분), 다른 쪽은 상대적으로 완만해요 (약 15분). 완만한 길도 계단이 없지는 않아요. 올라온 길 또는 다른 경로로 내려갈 수 있어요.'`
2. Stairs branch updated: when `knowledge.routes_ko` present → serve `routes_ko + verifyNote`; else if `knowledge.stairs_ko` → serve `stairs_ko + verifyNote`. **Unconditional "대안 경로 정보는 아직 없어요." removed.**

---

## 3. Issue C — Hyangiram / Cablecar UI Contamination

**ROOT CAUSE:** Condition `(isCableCarView || !isPlaceKnowledge)` at 8 module-render locations in `SoulCableCarPage.jsx`. `!isPlaceKnowledge` was the "no SOUL response yet → show static cablecar content" fallback, but it evaluates `true` on ALL place views before any SOUL interaction.

On Hyangiram (`place=hyangiram`) initial load:
- `isCableCarView = false`, `isPlaceKnowledge = false` (no response yet)
- `(false || !false) = true` → all Cablecar modules rendered

**Affected modules:** ForMeSection (cablecar variants), Journey (자산→돌산, 편도 약 13분), 요금 상세, 캐빈 선택, 운행 시간·날씨, 정류장 & 자동차 여행, QuestionDiscovery (Cablecar FAQ + 061-664-7301), Wish Scene

**Fix applied (`SoulCableCarPage.jsx`, replace_all):**
- Replaced all 8 occurrences of `(isCableCarView || !isPlaceKnowledge)` → `isCableCarView`
- `!isPlaceKnowledge` fallback is not needed: when `isCableCarView = true`, the guard already covers the initial-load case

**Odongdo verified:** No `(isOdongdoView || !isPlaceKnowledge)` pattern found — Odongdo blocks correctly use `isOdongdoView && ...`. Zero contamination from Odongdo.

**Cablecar initial load verified:** `isCableCarView = true` on cablecar page → all Cablecar modules still render correctly.

---

## 4. Issue D — Comparison ASK Loses Criterion

**ROOT CAUSE:** `_generateClarificationMessage` `family_elderly` fallback at line ~1183 fired unconditionally for any message when `pt = 'family_elderly'`, discarding the comparison criterion ("더 편해") present in the user message.

**Fix applied (1 guard added before companion fallbacks in `_generateClarificationMessage`):**

Pattern: `/(어디가 더|어디가 편한|더 편해|더 편한|어느 쪽이 더|어느 곳이 더)/`

- Comfort comparison: returns `"어디와 어디를 비교해드릴까요?\n[부모님이 ]더 편하게 다녀올 수 있는 곳을 기준으로 비교해볼게요."` (companion prefix when pt='family_elderly')
- Generic comparison: returns `"어디와 어디를 비교해드릴까요?\n비교해드릴 장소를 알려주시면 바로 살펴볼게요."`

**No hardcoded place names.** Companion prefix dynamically computed from `pt`. Criterion "편함" preserved. Comparison targets not invented.

---

## 5. Regression Results

### Targeted (R1-R10)
All 10/10 PASS. Pre-existing infrastructure warnings unchanged.

### Full suite
Pre-existing: 10 failures (DB/API key/timeout infrastructure). Zero new failures.

### Frontend Build
`npm run build` in `dreamtown-frontend/` — ✓ 691 modules, no errors. New bundle hash generated.

---

## 6. Production Verification Plan (1-8)

| # | Scenario | Expected |
|---|---|---|
| 1 | Cablecar "주차는 어디에 해?" | parking_ko served: "자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요..." |
| 2 | Hyangiram "계단 말고 다른 길 있어?" | routes_ko served, no "대안 경로 정보는 아직 없어요", no stair-free claim |
| 3 | Hyangiram initial page load | ZERO Cablecar modules (Journey/요금/캐빈/운행/정류장/FAQ/전화번호) |
| 4 | Odongdo initial page load | ZERO Cablecar contamination |
| 5 | Cablecar initial page load | All Cablecar modules intact |
| 6 | Home "엄마랑 가는데 어디가 더 편해?" | "어디와 어디를 비교해드릴까요? 부모님이 더 편하게..." — "편함" preserved, no "어떤 도움이 필요하세요?" |
| 7 | Existing P1 (car + multi-place journey) | PASS |
| 8 | Existing P2 (explicit other-place > current) | PASS |

**NOT CLOSED before Production verification completed.**

---

## 7. Remaining Issues / HOLD

- Hyangiram Living Detail cross-place visual identity (Cablecar assets visible) — DEFERRED per prior directive
- External Yeosu Mom Pilot — HOLD
- Travel Time Matrix — GOVERNANCE_HOLD

---

## 8. What This Does NOT Change

- No schema / migration / DB / seed
- No GPT prompt changes
- No new architecture
- `_generateClarificationMessage` early branches preserved
- P1/P2 preserved (verified by R1-R10)
