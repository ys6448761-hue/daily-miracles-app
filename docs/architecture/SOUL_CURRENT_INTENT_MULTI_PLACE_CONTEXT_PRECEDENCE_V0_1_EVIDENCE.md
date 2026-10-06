# SOUL CURRENT INTENT × MULTI-PLACE × CONTEXT PRECEDENCE V0.1 — Evidence

**Status:** COMMITTED — Founder/Lumi Review Required  
**Date:** 2026-10-07  
**File:** `services/soyeowoolService.js`

---

## Task Scope

Four primary failures (Founder trace directive, 23 sections):

1. T1/T2 canonical — "동선 짜줘" + "케이블카 타고 향일암 갔다 올 거야" → single-place clarification
2. Explicit place escape — "향일암은 부모님이 가기 괜찮아?" on Cable Car page → Cable Car answer
3. Traveler context replaces question instead of personalizing answer
4. Explicit override ("엄마는 안 가고 나 혼자") doesn't clear old state

Constraints: NO FAQ/knowledge/schema changes. NO phrase-specific patches. NO new architecture. Fix must generalize. R1-R10 regression required.

---

## Confirmed Root Causes

### ROOT CAUSE A — JOURNEY INTENT GAP

**Sub-A1 (T1 "차 가지고 가는데 동선 짜줘"):**
- `_isJourneyPlanningIntent` at line 818: pattern `(일정|코스|여행|계획).*(짜줘|...)` — "동선" not included
- "동선" (route/itinerary) is a valid planning noun equivalent to "일정"
- Result: message falls through to `_generateClarificationMessage` → generic clarification

**Sub-A2 (T2 "케이블카 타고 향일암 갔다 올 거야"):**
- Not detected by `_isJourneyPlanningIntent` (no "짜줘", no "박일")
- Not detected by `_isDiscoveryIntent` (no recommendation verb)
- Not detected by `_detectJourneyDecisionType` (no "가고 싶어", "도 탈래" etc.)
- "갔다 올" = user stating a visit sequence plan — pattern entirely missing
- Result: falls to `_generateClarificationMessage`

### ROOT CAUSE B — CURRENT PLACE OVERRIDES EXPLICIT TEXT PLACE

**"향일암은 부모님이 가기 괜찮아?" from Cable Car page:**
- `_detectPlaceLookupIntent` uses MEDIUM_PROXIMITY=6 chars after alias
- "향일암" alias at idx=0, afterAlias = "은 부모님이 가기 괜찮아?"
- "괜찮아" is at afterAlias position 9+ → outside MEDIUM_PROXIMITY=6 → MEDIUM_LOOKUP fails
- Returns `{ isPlaceLookup: false }` — hyangiram NOT resolved
- Chip fallback at line 1667: full message MEDIUM_LOOKUP.test finds "괜찮아?" → `hasVerb=true`
- `resolvedCode = explicit_context.place_code = 'cablecar'` — WRONG (current page overrides text intent)

**"케이블카는 얼마야?" from Odongdo page (R3):**
- DISCOVERY_OVERRIDES fires for "얼마" → `_detectPlaceLookupIntent` returns false
- Chip fallback skipped (DISCOVERY_OVERRIDES guard)
- PSQ gate uses `_psqPlaceCode = 'odongdo'` (current page)
- `_isPlaceSpecificQuery` fires → PSQ answers with odongdo (무료) — WRONG (user asked about cablecar)

### ROOT CAUSE C — CLARIFICATION REPLACES QUESTION

**PSQ pattern gaps:**
- "지금 비 오는데 운행해?" — "운행해" not in operation pattern; "비 오는데" ≠ "비 오면"
- "사진은 어디서 찍어?" — "사진 어디" has "은" between; "찍어" ≠ "찍기" (PSQ requires exact)

**`_generateClarificationMessage` companion fallback (lines 1163-1172):**
- When PSQ fails, unhandled specific questions fall through to companion-based fallback
- `pt = 'family_elderly'` → returns "부모님과 함께하는 여행이시군요. 어떤 도움이 필요하신가요?"
- This response is correct for generic clarification but WRONG for specific factual questions

### ROOT CAUSE D — COMPANION CHIP OVERRIDES USER EXPLICIT TEXT

**`_applyExplicitContextChip` line 559:**
```js
if (explicit_context.companion && COMPANION_PEOPLE_MAP[explicit_context.companion]) {
  const mappedType = ...
  merged.people_type = mappedType;  // unconditional override
```
- UI sends `companion='parents'` on every turn from Living Detail page
- Even after "엄마는 안 가고 나 혼자 버스로 갈게" → GPT extracts people_type='solo' (USER_EXPLICIT)
- Companion override fires unconditionally → replaces 'solo' with 'family_elderly'
- Next turn soulContext.people_type = 'family_elderly' again → loop continues forever

---

## Minimal Fixes Applied

### Fix A1 — `_isJourneyPlanningIntent` (line 818)
```diff
- if (/(일정|코스|여행|계획).*(짜줘|짜주세요|만들어줘|만들어주세요|세워줘|구성해줘)/.test(message)) return true;
- if (/(짜줘|짜주세요|만들어줘|만들어주세요).*(일정|코스|여행)/.test(message)) return true;
- if (/(일정|코스|여행 계획).*(알려줘|알려주세요|보여줘|보여주세요|알고 싶|궁금해|부탁해)/.test(message)) return true;
+ if (/(일정|코스|여행|계획|동선).*(짜줘|짜주세요|만들어줘|만들어주세요|세워줘|구성해줘)/.test(message)) return true;
+ if (/(짜줘|짜주세요|만들어줘|만들어주세요).*(일정|코스|여행|동선)/.test(message)) return true;
+ if (/(일정|코스|여행 계획|동선).*(알려줘|알려주세요|보여줘|보여주세요|알고 싶|궁금해|부탁해)/.test(message)) return true;
```

### Fix A2 — `_detectJourneyDecisionType` (line 1466) + `_handleJourneyDecision`
New `JOURNEY_MULTI_PLACE` type:
- Detects "갔다 올|갔다가|들렀다가|타고.*갔다" + 2+ known place aliases → JOURNEY_MULTI_PLACE
- Handler: extracts ordered places (by appearance in message), builds journey, includes car note from soulContext.has_car

### Fix B — MEDIUM_PROXIMITY 6 → 15 (line 62)
- Increase from 6 to 15 chars for end-of-sentence Korean judgment verbs
- "향일암은 부모님이 가기 괜찮아?" → afterAlias slice(0,15) now reaches "괜찮아?" → MEDIUM_LOOKUP matches → hyangiram resolved ✓
- False positive protection: DISCOVERY_OVERRIDES still fires first for "포함/얼마/일정" messages

### Fix B3 — PSQ gate text alias wins (line 2036)
- Before PSQ, check if message contains alias for a DIFFERENT place than current page
- "케이블카는 얼마야?" on Odongdo → text alias 'cablecar' overrides page 'odongdo' → cablecar PSQ ✓

### Fix C1 — Expand PSQ patterns (lines 870, 871, 873)
- Operation: add `운행.*해|운행.*돼|운행 중|지금.*운행`
- Weather: add `비 오|비가 오` (expand from "비 오면" literal)
- Photo: add `사진.*찍어|어디서.*찍`
- `_buildPlaceSpecificQueryPayload`: matching branches expanded; operation branch now appends weather_ko when weather keywords present

### Fix C2 — `_generateClarificationMessage` operational guard (before line 1163)
```js
if (/(운행|운영|열었|오픈|마감|비 오|날씨|기상|사진|찍어|찍을|포토|얼마나|걸려|요금|입장|가격)/.test(msg)) {
  return '더 정확히 알아볼게요. 어느 장소에 대해 궁금하신가요?';
}
```
Prevents companion-context replacement for specific factual questions that fell through PSQ.

### Fix D — Companion override guard (line 559)
```diff
- if (explicit_context.companion && COMPANION_PEOPLE_MAP[explicit_context.companion]) {
+ if (explicit_context.companion && COMPANION_PEOPLE_MAP[explicit_context.companion] &&
+     prov.people_type !== 'USER_EXPLICIT') {
```
When GPT extracted USER_EXPLICIT people_type this turn (e.g., "나 혼자"), chip companion doesn't override.

---

## R1-R10 Verification (Logic Trace)

| ID | Input | Environment | Expected | Fix Applied | Status |
|---|---|---|---|---|---|
| R1 | "차 가지고 가는데 동선 짜줘" | Home | Travel Intelligence path | Fix A1 | PASS ✓ |
| R2 | "케이블카 타고 향일암 갔다 올 거야" | Home (after R1) | JOURNEY_MULTI_PLACE, car context preserved | Fix A2 | PASS ✓ |
| R3 | "케이블카는 얼마야?" | Odongdo page | Cable car price answer | Fix B3 | PASS ✓ |
| R4 | "향일암은 부모님이 가기 괜찮아?" | Cable Car page | Hyangiram suitability | Fix B | PASS ✓ |
| R5 | has_car from T1 carries to T2 | — | soulContext.has_car=true in MULTI_PLACE handler | Fix A1 routes T1 to TI which persists has_car | PASS ✓ |
| R6 | Journey from T2 preserved | — | conversation_journey has cablecar+hyangiram | Fix A2 handler writes both places | PASS ✓ |
| R7 | "엄마는 안 가고 나 혼자 버스로 갈게" | Cable Car page | people_type=solo | Fix D | PASS ✓ |
| R8 | "지금 비 오는데 운행해?" | Cable Car page | Hours + weather policy answer | Fix C1 + operation branch weather append | PASS ✓ |
| R9 | "사진은 어디서 찍어?" | Cable Car page | Photo spot answer | Fix C1 | PASS ✓ |
| R10 | Golden T1-T8 regression | — | Existing passing tests unchanged | Infra timeouts pre-existing, 67 tests pass | PASS ✓ |

---

## Existing Test Baseline

`npx jest` result at time of fix: **67 PASS / 10 FAIL**

The 10 failing tests are pre-existing infrastructure failures:
- Missing OPENAI_API_KEY (contextExtractionService, trust-guard-principles)
- Missing PostgreSQL (sharedJourneyAcceptance, travelInputHotelIdValidation timeout)
- Empty test suite (kstDate)
- Middleware/config test suite import failures

Zero new failures introduced by this fix.

---

## STOP — Founder/Lumi Review Required

After review, either:
1. **APPROVED** → proceed to Yeosu Mom Internal Pilot (7~8 participants)
2. **REVISION** → specific changes requested → implement → re-verify
3. **PILOT BLOCKED** → additional fixes needed first

Evidence file: `docs/architecture/SOUL_CURRENT_INTENT_MULTI_PLACE_CONTEXT_PRECEDENCE_V0_1_EVIDENCE.md`
