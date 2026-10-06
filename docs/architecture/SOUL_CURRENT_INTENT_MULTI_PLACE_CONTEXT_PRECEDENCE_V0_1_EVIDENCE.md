# SOUL Current Intent × Multi-Place × Context Precedence V0.1 — Evidence

**Status:** IMPLEMENTED — Regression Verified  
**Date:** 2026-10-07  
**Source:** SOUL Founder-Preview Stress Test V0.1 (10 scenarios, 45 questions, RED 20/YELLOW 20/GREEN 5)  
**Commit:** (pending)  
**Files Changed:**
- `services/soyeowoolService.js` (deterministic routing logic only)
- `tests/soul/soul-context-precedence-r1-r10.test.js` (new — R1-R10 regression suite)

---

## 1. Failure Classification

4 primary failure types were identified from the stress test. All are DETERMINISTIC routing failures — not GPT faithfulness issues.

| ID | Failure | Root Cause | Status |
|---|---|---|---|
| F1 | Multi-place collapse: "동선 짜줘" + "케이블카 타고 향일암 갔다 올 거야" | "동선" not in `_isJourneyPlanningIntent`; JOURNEY_MULTI_PLACE absent | FIXED |
| F2 | Current page overrides explicit intent: "향일암은 부모님이 가기 괜찮아?" on Cable Car page → answers Cable Car | MEDIUM_PROXIMITY=6 too narrow; "괜찮아?" missed within 14-char afterAlias | FIXED |
| F3 | Traveler context replaces question: family_elderly profile + "운행해?" → profile greeting | `_generateClarificationMessage` line 1170 family_elderly fallback fired unconditionally | FIXED |
| F4 | Explicit override fails at UI: "나 혼자 버스로 갈게" → chip shows 부모님 | `_applyExplicitContextChip` overrode USER_EXPLICIT text with stale chip | FIXED (backend) |

---

## 2. Confirmed Root Causes

### ROOT CAUSE A — `_isJourneyPlanningIntent` missing "동선"

**Function:** `_isJourneyPlanningIntent` (line 820)  
**Mechanism:** Pattern `/(일정|코스|여행|계획).*(짜줘|...)/ ` did not include "동선". "차 가지고 가는데 동선 짜줘" → `needsTravelIntelligence = false` → CLARIFICATION.  
**Effect:** T1 "동선 짜줘" routed to clarification instead of Travel Intelligence.  

**CONFIRMED ROOT CAUSE A — `_isJourneyPlanningIntent` excludes "동선" causing "동선 짜줘" to fall to CLARIFICATION instead of Travel Intelligence.**

### ROOT CAUSE B — MEDIUM_PROXIMITY too narrow for Korean SOV

**Function:** `_detectPlaceLookupIntent` (line 133), constant `MEDIUM_PROXIMITY = 6`  
**Mechanism:** Korean is SOV — judgment verbs appear at sentence end. "향일암은 부모님이 가기 괜찮아?" has "괜찮아?" at position 11+ of afterAlias, beyond MEDIUM_PROXIMITY=6. Alias detection failed → chip supplement fired → current page (cablecar) used instead of "향일암".  

**CONFIRMED ROOT CAUSE B — MEDIUM_PROXIMITY=6 misses end-of-sentence verbs in Korean SOV structure, causing "향일암은 부모님이 가기 괜찮아?" on Cable Car page to route as cablecar PSQ instead of hyangiram suitability query.**

### ROOT CAUSE C — family_elderly fallback unconditionally swallows concrete questions

**Function:** `_generateClarificationMessage` (line 1183)  
**Mechanism:** `if (pt === 'family_elderly') return '부모님과 함께하는 여행이시군요...'` fired for ANY message with persisted family_elderly profile. When user asked "지금 비 오는데 운행해?" (no place_code on Home page), PSQ gate was skipped (requires place_code), and the family_elderly fallback discarded the actual question entirely.  

**CONFIRMED ROOT CAUSE C — `_generateClarificationMessage` family_elderly fallback at line 1183 fires unconditionally, discarding concrete operational questions like "운행해?" when there is no place_code context.**

### ROOT CAUSE D — `_applyExplicitContextChip` overrides USER_EXPLICIT text

**Function:** `_applyExplicitContextChip` (line 561)  
**Mechanism:** `companion=parents` chip set `people_type = 'family_elderly'` regardless of whether GPT extracted `USER_EXPLICIT` people_type from text. "나 혼자 버스로 갈게" → GPT returns `solo` (USER_EXPLICIT via `_applyExplicitCompanionGuard`), but chip re-overwrites to family_elderly.  

**CONFIRMED ROOT CAUSE D — `_applyExplicitContextChip` companion mapping lacked `prov.people_type !== 'USER_EXPLICIT'` guard, allowing stale chip to override explicit text override.**

### RELATED — JOURNEY_MULTI_PLACE absent

**Function:** `_detectJourneyDecisionType`  
**Mechanism:** No detection for multi-place sequential intent ("갔다 올", "들렀다가"). "케이블카 타고 향일암 갔다 올 거야" → null → fell to `_generateClarificationMessage` → cable car check at line 1142 → "케이블카에 대해 알고 싶으신 게 있으신가요?" (single-place cable car non-answer).  

**CONFIRMED ROOT CAUSE E — `_detectJourneyDecisionType` lacked JOURNEY_MULTI_PLACE detection, causing multi-place sequential intent to collapse to single-place cable car clarification.**

---

## 3. Minimal Structural Fixes

All fixes are DETERMINISTIC ONLY — no GPT prompt changes, no knowledge additions, no schema changes.

### Fix 1 — MEDIUM_PROXIMITY: 6 → 15

```js
// Before
const MEDIUM_PROXIMITY = 6;
// After
const MEDIUM_PROXIMITY = 15;
```

**Rationale:** Korean SOV verb comes at sentence end. 15-char window covers "향일암은 가기 괜찮아?" (14 chars total afterAlias). DISCOVERY_OVERRIDES fires first for planning messages — no false positive risk.

### Fix 2 — "동선" added to `_isJourneyPlanningIntent`

```js
// Before
if (/(일정|코스|여행|계획).*(짜줘|짜주세요|만들어줘|만들어주세요|세워줘|구성해줘)/.test(message)) return true;

// After
if (/(일정|코스|여행|계획|동선).*(짜줘|짜주세요|만들어줘|만들어주세요|세워줘|구성해줘)/.test(message)) return true;
```

"동선 알려줘" and "동선 짜줘" both now correctly recognized as journey planning intent.

### Fix 3 — Operational guard before family_elderly fallback

```js
// New: lines 1170-1174 in _generateClarificationMessage
// Specific operational/photo question — do NOT replace with companion context.
if (/(운행|운영|열었|오픈|마감|비 오|날씨|기상|사진|찍어|찍을|포토|얼마나|걸려|요금|입장|가격)/.test(msg)) {
  return '더 정확히 알아볼게요. 어느 장소에 대해 궁금하신가요?';
}
```

Operational questions now prompt for place context (Home page) instead of being silently replaced by profile greeting.

### Fix 4 — USER_EXPLICIT guard in `_applyExplicitContextChip`

```js
// Before
if (explicit_context.companion && COMPANION_PEOPLE_MAP[explicit_context.companion]) {

// After
if (explicit_context.companion && COMPANION_PEOPLE_MAP[explicit_context.companion] &&
    prov.people_type !== 'USER_EXPLICIT') {
```

Stale companion chip cannot override text-extracted USER_EXPLICIT provenance.

### Fix 5 — JOURNEY_MULTI_PLACE detection and handler

In `_detectJourneyDecisionType`:
```js
if (/(갔다 올|갔다가|들렀다가|타고.*갔다)/.test(msg)) {
  const mentionedCodes = [...new Set(
    Object.entries(PLACE_ALIAS_MAP)
      .filter(([alias]) => msg.includes(alias))
      .map(([, code]) => code)
  )];
  if (mentionedCodes.length >= 2) return 'JOURNEY_MULTI_PLACE';
  if (mentionedCodes.length === 1) return 'JOURNEY_PREFERENCE';
}
```

In `_handleJourneyDecision` (new branch F):
```js
else if (decisionType === 'JOURNEY_MULTI_PLACE') {
  // Extracts ordered places from message, builds "케이블카 → 향일암 순서로 계획해볼게요."
}
```

### Fix 6 — PSQ text alias override

```js
let _psqPlaceCode = explicit_context && explicit_context.place_code;
if (_psqPlaceCode) {
  const _psqTextAlias = Object.keys(PLACE_ALIAS_MAP)
    .sort((a, b) => b.length - a.length)
    .find(alias => message.includes(alias));
  const _psqTextCode = _psqTextAlias ? PLACE_ALIAS_MAP[_psqTextAlias] : null;
  if (_psqTextCode && _psqTextCode !== _psqPlaceCode) _psqPlaceCode = _psqTextCode;
}
```

"케이블카는 얼마야?" on Odongdo page → correctly routes to cablecar PSQ.

### Fix 7 — PSQ detection patterns extended

```
운행.*해|운행.*돼|운행 중|지금.*운행   → covers "지금 비 오는데 운행해?"
비 오|비가 오                          → covers "비 오는데" without "면"
```

---

## 4. Execution Trace: Canonical Reproduction

### T1+T2 — "동선 짜줘" then "케이블카 타고 향일암 갔다 올 거야"

**Turn 1: "차 가지고 가는데 동선 짜줘"** (Home page, no place_code)

| Step | Before Fix | After Fix |
|---|---|---|
| `_detectPlaceLookupIntent` | no place alias → false | (same) |
| `_isJourneyPlanningIntent` | "동선" not in pattern → **false** | "동선.*짜줘" matches → **true** |
| Route | → CLARIFICATION | → Travel Intelligence |
| Response | generic clarification | place recommendations with car context |

**Turn 2: "케이블카 타고 향일암 갔다 올 거야"** (session has T1 has_car=true)

| Step | Before Fix | After Fix |
|---|---|---|
| `_detectPlaceLookupIntent` | "케이블카" no MEDIUM verb → false | (same) |
| `_isJourneyPlanningIntent` | "갔다 올" not in pattern → false | (same — handled by Journey Decision gate) |
| `_detectJourneyDecisionType` | **null** (no JOURNEY_MULTI_PLACE) | **JOURNEY_MULTI_PLACE** (갔다 올 + 2 places) |
| Journey Decision gate | skipped → `_generateClarificationMessage` | fires → `_handleJourneyDecision` |
| Clarification message | "케이블카에 대해 알고 싶으신 게 있으신가요?" | "케이블카 → 향일암 순서로 계획해볼게요. 차로 이동하시면 편하게 둘 다 보실 수 있어요." |

### F2 — "향일암은 부모님이 가기 괜찮아?" on Cable Car page

| Step | Before Fix | After Fix |
|---|---|---|
| `_detectPlaceLookupIntent("향일암...")` | MEDIUM_PROXIMITY=6, "괜찮아?" at position 11 → **missed** → false | MEDIUM_PROXIMITY=15, "괜찮아?" within 14 chars → **matched** → hyangiram, isSuitabilityQuery=true |
| Chip supplement (1667-1677) | `MEDIUM_LOOKUP.test(full message)` matches "괜찮아?" → cablecar chip fires | not reached (hyangiram already detected) |
| Response | cablecar suitability judgment | **hyangiram suitability judgment** |

### F3 — "지금 비 오는데 운행해?" on Home page, family_elderly profile

| Step | Before Fix | After Fix |
|---|---|---|
| PSQ gate | no place_code → skipped | (same) |
| Journey Decision gate | "운행해" no match → null → skipped | (same) |
| `_generateClarificationMessage` | pt='family_elderly' → "부모님과 함께하는 여행이시군요..." | "운행" matches operational guard → "더 정확히 알아볼게요. 어느 장소에 대해 궁금하신가요?" |

### F4 — "나 혼자 버스로 갈게" + companion=parents chip

| Step | Before Fix | After Fix |
|---|---|---|
| `_applyExplicitCompanionGuard` | "혼자" → solo USER_EXPLICIT | (same) |
| `_applyExplicitContextChip` | companion=parents → **overwrites to family_elderly** (no USER_EXPLICIT guard) | companion=parents but prov.people_type='USER_EXPLICIT' → **skipped** |
| Session write | family_elderly persisted | **solo** persisted |

---

## 5. R1-R10 Targeted Regression Results

**Test file:** `tests/soul/soul-context-precedence-r1-r10.test.js`  
**Result: 10/10 PASS**

| ID | Scenario | Expected | Result |
|---|---|---|---|
| R1 | "동선 짜줘" → not CLARIFICATION | status ≠ CLARIFICATION | PASS |
| R2 | "케이블카 타고 향일암 갔다 올 거야" → both places in journey | JOURNEY_CONTINUITY + codes=['cablecar','hyangiram'] | PASS |
| R3 | family_elderly + "운행해?" → no "부모님과 함께하는" | message_ko not contains "부모님과 함께하는" | PASS |
| R4 | "나 혼자" + companion=parents chip → solo context | understood_context.people_type='solo' | PASS |
| R5 | "향일암은 부모님이 가기 괜찮아?" on cablecar page → hyangiram | getPlaceByCode('hyangiram') called, NOT cablecar | PASS |
| R6 | "지금 비 오는데 운행해?" on cablecar page → PSQ fires | getPlaceByCode('cablecar') called, no profile greeting | PASS |
| R7 | REGRESSION — "케이블카 꼭 타고 싶어" → cable car clarification | status=CLARIFICATION, message_ko contains '케이블카' | PASS |
| R8 | REGRESSION — "여수 2박3일 동선 알려줘" → journey planning | status ≠ CLARIFICATION | PASS |
| R9 | REGRESSION — family_elderly + "추천해줘" → Travel Intelligence | status ≠ CLARIFICATION | PASS |
| R10 | REGRESSION — "오동도 갔다 올 거야" (1 place) → no false multi-place | codes=['odongdo'] only | PASS |

---

## 6. Existing Regression Suites

| Suite | Before | After |
|---|---|---|
| `routes/__tests__/travelInputRoutes.test.js` | 12/12 | 12/12 |

---

## 7. Coverage Gaps (DEFERRED)

| Gap | Mechanism | Status |
|---|---|---|
| UI chip display staleness | Frontend doesn't re-render chips based on `understood_context.people_type` response field. Cosmetic for current turn only; session context IS updated correctly for next turn. | COVERAGE_GAP — LATER |
| PSQ on Home without place_code | "지금 비 오는데 운행해?" → asks "어느 장소?" (correct) but can't auto-answer; user must specify a place | ACCEPTABLE — knowledge boundary |
| "갔다가" single-place phrasing | "향일암 갔다가" routes to JOURNEY_PREFERENCE (correct per R10) | OK |

---

## 8. What This Does NOT Change

- No schema migrations
- No seed data
- No GPT prompt changes
- No new knowledge/FAQ
- No Living Detail UI changes (UI01 hyangiram display explicitly deferred)
- No new architecture — all fixes are minimal routing rule corrections
- No external research performed

---

## 9. Next Action

STOP — Founder/Lumi Review required.

**Pilot gate:** YEOSU MOM INTERNAL SOUL PILOT V0.1 remains NEXT PLANNED ACTION.  
**Pre-pilot readiness:** `docs/architecture/SOUL_PRE_PILOT_READINESS_CHECK_V0_1.md`
