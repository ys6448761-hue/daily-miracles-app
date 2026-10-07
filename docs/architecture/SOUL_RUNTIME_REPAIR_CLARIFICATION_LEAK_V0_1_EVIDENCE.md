# SOUL Runtime Repair V0.1 — Remaining Clarification Leak Evidence

**Status:** IMPLEMENTED — Regression Verified  
**Date:** 2026-10-07  
**Files Changed:**
- `services/soyeowoolService.js` — Living Detail Fallback + hours/stairs branches in `_buildPlaceSpecificQueryPayload`

---

## 1. Production Request Recovery

**Exact user message: EXACT INPUT NOT RECOVERABLE FROM AVAILABLE EVIDENCE**

Local logs (`logs/app-2026-10-06.log`, `logs/app-2026-10-07.log`) contain only local test runner noise and one HTTP 404 — no production SOUL conversation records. Production traffic is on Render.com, not accessible from this environment. The Founder's RED screenshot (generic planning prompt on Cable Car Living Detail with "부모님" context) cannot be matched to a specific raw input.

**Determination:** STOP on exact input recovery. Proceed with structural code analysis per Founder directive section 16: "If exact input not recoverable, STOP. Structural analysis and minimal fix may proceed when root cause is deterministic from code."

---

## 2. Structural Root Cause — Confirmed from Code Analysis

**ROOT CAUSE C confirmed: `_isPlaceSpecificQuery` is pattern-enumeration based. Any concrete question with vocabulary outside the enumerated set bypasses the PSQ gate and reaches `_generateClarificationMessage` with the generic planning prompt fallback.**

### Failure path (deterministic):

```
User message: "주차는 어디에 해?" / "몇 시까지 해?" / "계단 말고 다른 길 있어?"
  ↓
_isDiscoveryIntent → false (no discovery vocabulary)
_isJourneyPlanningIntent → false
needsTravelIntelligence = false
  ↓
PSQ gate (line 2088): _psqPlaceCode = 'cablecar' (from explicit_context)
  _isPlaceSpecificQuery(message) → FALSE (pattern not in enumerated list)
  → PSQ gate SKIPS
  ↓
Journey Decision Gate: null (no journey verb patterns match)
  ↓
_generateClarificationMessage(soulContext, message, journeyCtxForClar)
  pt = null (no people_type extracted from concrete question, no stored profile on fresh session)
  → no cable car branch
  → no greeting/indecision branch
  → no operational guard match (different vocabulary)
  → no companion match (pt = null)
  → GENERIC FINAL FALLBACK:
    "여수 여행을 더 잘 도와드릴 수 있도록, 어떤 여행을 계획하고 계신지 말씀해 주세요."
```

**The generic planning prompt is NEVER the right response on a Living Detail page for a concrete factual question. This is a structural design flaw: the code clarifies when it doesn't recognize a pattern instead of admitting knowledge gap.**

---

## 3. Minimum Structural Fix

Two targeted additions — NO GPT prompt changes, NO schema changes, NO new architecture:

### Fix 1: Living Detail Fallback (`handleTravelRequest`, inserted at line 2128)

When `_psqPlaceCode` is present AND the Journey Decision Gate returned null AND the message is not a greeting/indecision/cable-car-intent, route through `_buildPlaceSpecificQueryPayload` instead of `_generateClarificationMessage`.

This inverts the default for Living Detail pages from "clarify unless pattern known" to "attempt answer unless clearly unrelated."

`_buildPlaceSpecificQueryPayload` returns a graceful default ("정보를 확인 중이에요. 정확한 정보는 [phone]에 문의하시거나 현장에서 확인해보세요.") for unknown patterns — always better than generic planning prompt.

**Guard conditions** (skip LDF → fall through to `_generateClarificationMessage`):
- Greeting: `^(안녕|안녕하세요|반가워|hi|hello)[\s!.?]*$`
- Indecision: `/(잘 모르겠|모르겠어|뭐가 좋을|뭐 해야|어떡하|어쩌)/`
- Cable car intent: `케이블카 AND (꼭|반드시|타고 싶|타야|빼고|빼줘|제외|일정에|탈거야)`

### Fix 2: Hours branch in `_buildPlaceSpecificQueryPayload` (before "알려 줘" fallback)

Catches "몇 시까지", "마감", "닫어", "언제까지", "열어", "몇 시에 열", "언제 열" — returns `knowledge.hours_ko` if present.

Covers C4 "몇 시까지 해?" which the existing operation branch missed ("영업.*해" didn't match "몇 시까지").

### Fix 3: Stairs/route branch in `_buildPlaceSpecificQueryPayload` (before hours branch)

Catches "계단", "다른 길", "우회", "올라가는 길", "내려가는 길" — returns `knowledge.stairs_ko` if present, admits no alternate path data.

Covers C7 "계단 말고 다른 길 있어?" on Hyangiram. Serves existing Phoenix Knowledge (`stairs_ko`) rather than ignoring it.

---

## 4. C1-C10 Logic Traces

All on Cable Car Living Detail (`place_code='cablecar'`) unless noted.

| ID | Message | Route | Response | Verdict |
|---|---|---|---|---|
| C1 | "주차는 어디에 해?" | LDF → PSQ default | "케이블카에 대한 정보를 확인 중이에요. 정확한 정보는 061-664-7301에 문의하시거나 현장에서 확인해보세요." | PASS — safe UNKNOWN, phone provided |
| C2 | "몇 시까지 해?" (Odongdo) | LDF → hours branch | "오동도 운영시간은 연중무휴 09:00~18:00 (입도 마감 17:00)예요." | PASS — hours knowledge served |
| C3 | "주차는 어디에 해?" | LDF → PSQ default | "케이블카에 대한 정보를 확인 중이에요. 정확한 정보는 061-664-7301에 문의하시거나..." | PASS — same as C1 ✓ |
| C4 | "몇 시까지 해?" | LDF → hours branch | "케이블카 운영시간은 09:30~21:30 (토요일·성수기 연장)예요." | PASS — hours knowledge served |
| C5 | "휠체어로 탈 수 있어?" | PSQ gate (direct) → wheelchair branch | Accessibility status + stairs_ko | PASS — already working, unchanged ✓ |
| C6 | "얼마나 걸어야 해?" (Odongdo) | PSQ gate (direct) → duration branch | Safe UNKNOWN: "오동도 소요시간은 아직 정확하게 파악하지 못했어요." | PASS — already working, unchanged ✓ |
| C7 | "계단 말고 다른 길 있어?" (Hyangiram) | LDF → stairs branch | "경내 계단 구간이 있어요. 거동이 불편하신 분은 주의가 필요해요.\n대안 경로 정보는 아직 없어요." | PASS — Phoenix Knowledge served, no fabrication |
| C8 | "어디가 좋아?" | `_isDiscoveryIntent`=true → Travel Intelligence | Discovery response | PASS — never reaches LDF ✓ |
| C9 | "엄마랑 가는데 어디가 더 편해?" | LDF → PSQ default | "케이블카에 대한 정보를 확인 중이에요. 정확한 정보는 061-664-7301에 문의하시거나..." | PASS — admits comparison knowledge gap, no fabrication (ASK acceptable per Founder) |
| C10 | "향일암은 부모님이 가기 괜찮아?" (Cable Car page) | MEDIUM_PROXIMITY fix → hyangiram PLACE_LOOKUP | Hyangiram suitability judgment | PASS — prior fix, unchanged ✓ |

---

## 5. Prior Regression Suites

| Suite | Before | After |
|---|---|---|
| R1-R10 (`soul-context-precedence-r1-r10.test.js`) | 10/10 | **10/10** |
| `routes/__tests__/travelInputRoutes.test.js` | 12/12 | 12/12 (unchanged) |
| Full suite (pre-existing failures) | 10 failed (infrastructure) | 10 failed (same infrastructure, zero new) |
| Total passing tests | 77 | 77 (no regression) |

---

## 6. What the Living Detail Fallback Does NOT Change

- No schema migrations
- No seed data
- No GPT prompt changes
- No new knowledge/FAQ additions
- No `_generateClarificationMessage` early branches removed
- No Living Detail UI changes
- No existing PSQ patterns modified
- No Answer Summary, Commerce, Home visual, Place Hero changes
- Greeting/indecision messages still route through `_generateClarificationMessage` (guard)
- Cable car negation/intent messages still route through `_generateClarificationMessage` (guard)

---

## 7. Coverage Gaps Remaining (DEFERRED)

| Gap | Status |
|---|---|
| "엄마랑 가는데 어디가 더 편해?" comparison → PSQ default (no comparison answer) | ACCEPTABLE per Founder: "ASK may be valid, no fabrication" — PSQ default is honest knowledge gap |
| "주차" knowledge absent from `_PLACE_KNOWLEDGE` | COVERAGE_GAP — safe UNKNOWN + phone number is honest response |
| Hyangiram alternate route knowledge absent | COVERAGE_GAP — stairs_ko served, alternate path admitted as unknown |
| LDF fires for ALL non-guard questions when place_code set | ACCEPTABLE — `_buildPlaceSpecificQueryPayload` default is always honest UNKNOWN |
| Hyangiram Living Detail showing Cable Car content | DEFERRED (separate task per Founder directive) |

---

## 8. Production Verification Plan (P1-P5)

After deploy to Render.com:

| ID | Scenario | Expected | Result |
|---|---|---|---|
| P1 | Cable Car page + "주차는 어디에 해?" | "케이블카에 대한 정보를 확인 중이에요. 정확한 정보는 061-664-7301에..." | — |
| P2 | Cable Car page + "몇 시까지 해?" | "케이블카 운영시간은 09:30~21:30 (토요일·성수기 연장)예요." | — |
| P3 | Hyangiram page + "계단 말고 다른 길 있어?" | "경내 계단 구간이 있어요. 거동이 불편하신 분은 주의가 필요해요.\n대안 경로 정보는 아직 없어요." | — |
| P4 | Cable Car page + "케이블카 꼭 타고 싶어" | Cable car clarification (_generateClarificationMessage guard bypass) | — |
| P5 | Cable Car page + "향일암은 부모님이 가기 괜찮아?" | Hyangiram suitability response (prior fix, MEDIUM_PROXIMITY=15) | — |

---

## 9. Next Action

STOP — Founder/Lumi Review required.

Deploy to production after review confirmation.  
**Pilot gate:** YEOSU MOM INTERNAL SOUL PILOT V0.1 remains NEXT PLANNED ACTION.  
**Readiness doc:** `docs/architecture/SOUL_PRE_PILOT_READINESS_CHECK_V0_1.md`
