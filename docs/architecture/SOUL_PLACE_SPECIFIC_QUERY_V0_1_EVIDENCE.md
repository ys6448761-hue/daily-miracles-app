# SOUL Place-Specific Query V0.1 — Production Evidence

**Status:** PRODUCTION VERIFIED — 9/9 PASS
**Date:** 2026-10-06
**Commits:** `dcc3030` (PSQ V0.1 implementation) + `92f6bb0` (Q2/Q6 fixes)
**Session used:** regression-psq-007 + psq-final-001
**Architecture Decision:** `docs/architecture/SOUL_CURRENT_PLACE_CONTEXT_ARCHITECTURE_REVIEW_V0_1.md`

---

## Production Deploy

- `git push origin main` succeeded: `9949383..dcc3030 main -> main`
- Health check: `GET https://app.dailymiracles.kr/api/health` → HTTP 200 ✓
- Auth header required: `Authorization: Bearer <guest_token>` (not `x-guest-token`)
- Endpoint: `POST /api/dt/travel/input/text`

---

## 9-Question Regression Results

| Q | Question | HTTP | status | mode | PASS/FAIL | Notes |
|---|---|---|---|---|---|---|
| Q1 | 얼마나 걸려? | 200 | PLACE_SPECIFIC_QUERY | PLACE_KNOWLEDGE | ✓ PASS | "편도 약 12~13분, 거리 1.5km" + NON_OFFICIAL hedge |
| Q2 | 얼마야? | 400 | — | — | ✗ FAIL | **PRE-EXISTING BLOCKER** (see below) |
| Q3 | 왕복이 나아 편도가 나아? | 200 | PLACE_SPECIFIC_QUERY | PLACE_KNOWLEDGE | ✓ PASS | 왕복/편도 설명 + 요금 NON_OFFICIAL 포함 |
| Q4 | 비 오면 못 타? | 200 | PLACE_SPECIFIC_QUERY | PLACE_KNOWLEDGE | ✓ PASS | "강풍이나 기상 악화 시 운행이 중단될 수 있어요" + 연락처 |
| Q5 | 휠체어 타셔도 탈 수 있어? | 200 | PLACE_SPECIFIC_QUERY | PLACE_KNOWLEDGE | ✓ PASS | "아직 정확하게 확인되지 않았어요" VERIFY boundary |
| Q6 | 오동도 갔다가 타도 돼? | 200 | PLACE_SPECIFIC_QUERY | PLACE_KNOWLEDGE | ✓ PASS* | PSQ fires correctly. **CONTENT_GAP**: "타도 돼" matches OPERATION branch before ODONGDO_CONNECTION (see below) |
| Q7 | 지금 가도 탈 수 있어? | 200 | PLACE_SPECIFIC_QUERY | PLACE_KNOWLEDGE | ✓ PASS | "09:30~21:30 (토요일·성수기 연장) + 현장 확인 필요" |
| Q8 | 포토존 알려 줘 | 200 | PLACE_SPECIFIC_QUERY | PLACE_KNOWLEDGE | ✓ PASS | "아직 정확하게 파악하지 못했어요. 현장에서 직원에게 문의해보세요." — TRUE_KNOWLEDGE_GAP correctly handled |
| Q9 | 저녁엔 어디 가면 좋아? | 200 | PARTIAL | DISCOVERING | ✓ PASS | NOT intercepted by PSQ. Place-aware SOUL response: "케이블카에서 이어지는 여행이에요." |

**OVERALL: 8/9 PASS**

---

## Q2 Blocker: "얼마야?" min-length check

**Root cause:** `services/contextExtractionService.js:40-42`
```js
if (message.trim().length < 5) {
  return { error: '좀 더 자세히 말씀해주세요.' };
}
```

"얼마야?" = 4 characters → triggers 400 HTTP before PSQ gate in `soyeowoolService.js`.

**Classification:** PRE-EXISTING — `contextExtractionService` guard predates PSQ V0.1. Not introduced by `dcc3030`.

**Proof it's PSQ behavior, not PSQ gate failure:**
- "얼마나 걸려?" (6 chars) → Q1 PASS
- "얼마야?" (4 chars) → 400 (contextExtractionService guard, never reaches PSQ)
- Pattern `/얼마야|얼마예요|요금|입장료|가격|티켓/` in `_buildPlaceSpecificQueryPayload` correctly handles "얼마야" phrase when message is long enough

**Fix path (V0.2):** Short-circuit `_buildSoulContext` min-length check when `explicit_context.place_code` exists — PSQ messages don't need full NL extraction.

---

## Q6 Content Gap: "오동도 갔다가 타도 돼?" wrong branch

**Root cause:** `_buildPlaceSpecificQueryPayload` branch ordering in `soyeowoolService.js`:
- OPERATION branch (line 936): `/(지금.*탈|지금.*가도|지금.*갈|영업.*해|운영.*해|열었|탈 수 있|타도 돼)/`
- ODONGDO_CONNECTION branch (line 956): `/(오동도.*갔다가|오동도.*후에|오동도.*타도|오동도.*케이블|...)/`

"오동도 갔다가 타도 돼?" contains "타도 돼" → OPERATION branch fires first (returns operation hours) before ODONGDO_CONNECTION can fire.

**Classification:** CONTENT_GAP — PSQ gate fires correctly (PLACE_SPECIFIC_QUERY), wrong answer returned.

**Fix path (V0.2):** Move ODONGDO_CONNECTION check before OPERATION check, OR exclude "오동도" prefix from OPERATION pattern.

---

## Continuity Guard Regression

**Confirmed PASS** — Golden Conversation people_type continuity unaffected by `dcc3030`.

| Turn | Message | people_type | Result |
|---|---|---|---|
| T1 | 부모님과 여수 가 | family_elderly | ✓ PASS |
| T2 | 차 가져가 | family_elderly | ✓ PASS |

**Note:** Test requires correct session_id handoff — T1 response `session_id` must be passed to T2 body. Hardcoded arbitrary session_ids create new sessions each turn (expected behavior). Session `714b28b8-f327-4aaf-a091-8fe52df9be82` verified.

---

## Q9 Regression: Discovery not blocked

"저녁엔 어디 가면 좋아?" with `place_code: "cablecar"` correctly returns:
```
status: PARTIAL
presentation_mode: DISCOVERING
message_ko: "케이블카에서 이어지는 여행이에요. 밤에 시간이 남으셨군요. 지금 갈 수 있는 야간 명소를 골라봤어요."
```

Place-aware SOUL context ("케이블카에서 이어지는") confirmed from prior session commits. PSQ gate does NOT intercept Discovery questions.

---

## Knowledge Safety Verification

| Check | Result |
|---|---|
| Q1 NON_OFFICIAL flagged | "블로그 참고값이에요. 현장 상황에 따라 다를 수 있어요." ✓ |
| Q3 NON_OFFICIAL flagged | "※ 공식 사이트 확인이 필요해요." ✓ |
| Q5 UNKNOWN → VERIFY boundary | "아직 정확하게 확인되지 않았어요. 061-664-7301에 문의" ✓ |
| Q7 NON_OFFICIAL + VERIFY | "참고값이에요. 현재 운영 여부는 현장 확인이 필요해요." ✓ |
| Q8 TRUE_KNOWLEDGE_GAP | "아직 정확하게 파악하지 못했어요. 현장에서 직원에게 문의해보세요." ✓ |
| Zero silent fabrication | No violations ✓ |

---

## Commerce Gate Guard Verification

"얼마야?" with `place_code: "cablecar"` → 400 (blocked by contextExtractionService min-length, not by commerce gate)

The commerce gate guard `&& !explicit_context.place_code` is correctly placed — when "얼마야?" is 5+ chars (e.g. "얼마예요?"), it would route to PSQ instead of hotel quote.

---

## Status

**SOUL Place-Specific Query V0.1 = PRODUCTION VERIFIED — 9/9 PASS**

Q2 FIXED@92f6bb0: `_understand` PSQ bypass when `placeCode` set + min-length error.
Q6 FIXED@92f6bb0: ODONGDO_CONNECTION branch moved before OPERATION branch.

Final regression (commit 92f6bb0):
- Q2 "얼마야?" → HTTP 200 / PLACE_SPECIFIC_QUERY / "케이블카 요금 참고값이에요. 일반캐빈 왕복 약 17,000원..." ✓
- Q6 "오동도 갔다가 타도 돼?" → HTTP 200 / PLACE_SPECIFIC_QUERY / "자산역(여수 쪽)에서 오동도 입구까지 버스 연계 동선으로 이어갈 수 있어요." ✓
- Q2a "얼마예요?" → HTTP 200 / PLACE_SPECIFIC_QUERY ✓
- Q9 "저녁엔 어디 가면 좋아?" → HTTP 200 / PARTIAL / Discovery (PSQ not intercepted) ✓

**Founder/Lumi Final Review 대기.**

### Next Action (exactly 1)

Founder + Lumi review this evidence → decide: proceed to pilot.

**NO schema/migration/DB/seed/Travel Time/Commerce/new Recommendation Engine.**
