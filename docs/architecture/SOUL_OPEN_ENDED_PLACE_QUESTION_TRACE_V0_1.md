# SOUL Open-Ended Place Question Trace V0.1

**Status:** TRACE COMPLETE / STOP — Founder/Lumi Review Required
**Date:** 2026-10-06
**Context:** Cable Car Living Detail Page — place_code: cablecar, family_elderly, has_car=true

---

## 1. Routing Code Analysis

### `_isDiscoveryIntent` (lines 887–902)

```js
function _isDiscoveryIntent(message) {
  if (!message) return false;
  // Explicit recommendation verbs
  if (/(추천해|추천해줘|추천해주|추천좀|추천 좀|알려줘|알려주세요|보여줘|보여주세요|찾아줘|찾아주세요)/.test(message)) return true;
  // Discovery question forms
  if (/(어디 갈까|어딜까|어디 가면|어디가면|어디가 좋|어디 가도|어디에 가|근처에 어디|어디 뭐|갈 곳 뭐|갈곳 뭐)/.test(message)) return true;
  // Activity-seeking
  if (/(뭐 할까|뭐할까|무얼 할까|무엇을 할까|뭐 하지|뭐하지|무얼 하지)/.test(message)) return true;
  // Post-visit directional
  if (/(어딜 가|어디 가\??$)/.test(message)) return true;
  // Discovery noun phrases
  if (/(갈 만한|갈만한|가볼 만한|가볼만한|좋은 곳|좋은곳|가봐야|가야 할 곳|볼 곳|볼곳)/.test(message)) return true;
  // Sightseeing intent
  if (/(구경하고 싶|구경하고싶|구경 하고 싶)/.test(message)) return true;
  return false;
}
```

Key gaps: `알려줘` (fused only) ≠ `알려 줘` (spaced). No place-operational patterns (비, 탈 수 있어, 얼마, 휠체어, 포토존).

### `_isJourneyPlanningIntent` (lines 775–785)

Matches only: N박N일, (일정|코스|여행) + construction verbs (짜줘, 만들어줘), or "일정 알려줘".
None of the 9 test questions match.

### `_detectJourneyDecisionType` (lines 1264–1272)

```js
if (/(하나 빼|빼줘|...|뭐 빼)/.test(msg)) return 'JOURNEY_MODIFY';
if (/(걷는 건 힘|걷기 힘|...|많이 걷는)/.test(msg)) return 'CONSTRAINT_UPDATE';
if (/(가능해|가능한가요|갈 수 있어|될까|가봐도 될|갈 수 있을까)/.test(msg)) return 'FEASIBILITY';
if (/(도 탈래|도 갈래|...|도 가볼까)/.test(msg)) return 'JOURNEY_ADD';
if (/(먼저 가고 싶|가고 싶어|가고싶어)/.test(msg)) return 'JOURNEY_PREFERENCE';
```

Note: "탈 수 있어?" does NOT match — FEASIBILITY only covers "갈 수 있어". "타도 돼?" does not match. All journey types require journey-specific verbs pointing at a place in the Golden 3.

### Routing decision boundary (line 1815)

```js
const needsTravelIntelligence = _isDiscoveryIntent(message) || _isJourneyPlanningIntent(message);

if (!needsTravelIntelligence) {
  // Journey Decision Gate (JOURNEY_CONTINUITY)
  // → generic CLARIFICATION if not matched
}
// Travel Intelligence (PLACE_LOOKUP / PARTIAL / DISCOVERING)
```

If neither gate fires → CLARIFICATION. No place_code-aware fallback exists.

### `_generateClarificationMessage` — why "어떤 도움이 필요하신가요?"

Line 974–975:
```js
if (pt === 'family_elderly') {
  return '부모님과 함께하는 여행이시군요.\n어떤 도움이 필요하신가요?';
}
```

This is the companion-aware generic fallback for unrecognized input when `people_type = family_elderly`. All 8 failing questions hit this path.

Exception: "얼마야?" → hits Hotel quote path instead, producing "어느 숙소로 견적을..." — a separate routing artifact from the hotel quote system.

---

## 2. Existing Cable Car Knowledge Map

| Knowledge Area | Field / Source | Exists | Trust Level | Notes |
|---|---|---|---|---|
| 운영시간 | `opening_hours_json` (migration 200) | YES | UNVERIFIED → blog only | 09:30~21:30, 토·성수기 연장 |
| 요금 (얼마야?) | `admission_fee_json` | PARTIAL | NON_OFFICIAL_BLOG | 블로그 참고값만. 공식 SSL 오류로 미확인. BUSINESS_DIRECT_VERIFY_REQUIRED |
| 편도 시간 (얼마나 걸려?) | Batch01 verified | YES | VERIFIED_CURRENT | 12~13분, 1.5km |
| 왕복 vs 편도 | More-to-Know "차를 가져가면" | YES | ORIGIN | 편도: 차 자산역 잔류 후 돌산역 도보 귀환. 왕복: 단순. 연결 안 됨 |
| 휠체어 접근성 | `accessibility_wheelchair_status` = 'unknown' | PARTIAL | UNKNOWN | DB 필드 있으나 미검증. More-to-Know에 "전동휠체어 제한" 언급 |
| 날씨/비 (비 오면?) | `weather_suitable` (migration 200) | PARTIAL | UNVERIFIED | DB 필드 있음. 값 미확인. 실내/야외 혼합 (outdoor가 주) |
| 오동도 연계 (오동도 갔다가?) | More-to-Know "오동도와 이어가요" | YES | ORIGIN | 자산정류장↔오동도 입구. 연결 안 됨 |
| 지금 탈 수 있어? | 운영시간 DB + live_status | PARTIAL | D: LIVE_VERIFY | 시간 범위는 known. 현재 운영 여부는 LIVE — 저장된 시간만으로 확정 불가 |
| 포토존 | 없음 (scenic view description만) | NO dedicated field | — | E: TRUE_KNOWLEDGE_GAP |
| 캐빈 종류 (크리스탈) | More-to-Know / Rich Basic | YES | ORIGIN | 연결 안 됨 |

**핵심:** Knowledge는 대부분 존재한다. 그러나 SOUL 대화 레이어와 연결되지 않았다 (UI의 More-to-Know accordion에만 존재).

---

## 3. Question-by-Question Analysis

| # | 질문 | Expected | Actual status | Gap type | Knowledge | Root |
|---|---|---|---|---|---|---|
| 1 | 왕복이 나아 편도가 나아? | B: JUDGMENT | CLARIFICATION | INTENT_ROUTING_GAP + KNOWLEDGE_NOT_CONNECTED | More-to-Know에 있음 | 판단 요청 패턴 없음 |
| 2 | 비 오면 못 타? | B: JUDGMENT 또는 D: LIVE_VERIFY | CLARIFICATION | INTENT_ROUTING_GAP | weather_suitable DB 필드 (값 미확인) | 조건 질문 패턴 없음 |
| 3 | 휠체어 타셔도 탈 수 있어? | A: ANSWER (hedged) | CLARIFICATION | INTENT_ROUTING_GAP + KNOWLEDGE_NOT_CONNECTED | More-to-Know "전동휠체어 제한" + DB status=unknown | "탈 수 있어?" 패턴 없음 |
| 4 | 오동도 갔다가 타도 돼? | B: JUDGMENT | CLARIFICATION | INTENT_ROUTING_GAP + KNOWLEDGE_NOT_CONNECTED | More-to-Know "오동도와 이어가요" | "타도 돼?" 패턴 없음 |
| 5 | 지금 가도 탈 수 있어? | D: LIVE_VERIFY_REQUIRED | CLARIFICATION | INTENT_ROUTING_GAP | 운영시간 known, live status unknown | "탈 수 있어?" 패턴 없음 |
| 6 | 포토존 알려 줘 | E: TRUE_KNOWLEDGE_GAP (photo_spots 없음) | CLARIFICATION | INTENT_ROUTING_GAP + TRUE_KNOWLEDGE_GAP | 뷰 설명만. 구체 포토존 없음 | "알려 줘" (spaced) 패턴 없음 |
| 7 | 얼마야? | A: ANSWER (hedged/unverified) | CLARIFICATION→Hotel quote | INTENT_ROUTING_GAP + KNOWLEDGE_NOT_CONNECTED | blog 참고값 (NON_OFFICIAL) | 가격 질문 → hotel quote 오라우팅 |
| 8 | 얼마나 걸려? | A: ANSWER | CLARIFICATION | INTENT_ROUTING_GAP | VERIFIED: 12~13분, 1.5km | 소요 시간 질문 패턴 없음 |
| 9 | 저녁엔 어디 가면 좋아? | B/C: JUDGMENT | PARTIAL/DISCOVERING ✓ | — (PASS) | 야간 명소 DB | "어디 가면" 패턴 일치 |

### Detailed reasoning per question

**Q1 "왕복이 나아 편도가 나아?"**
No discovery verb, no journey verb. "나아" (which is better) is a judgment request — no gate covers it.
Knowledge: More-to-Know "차를 가져가면" section has the answer (편도: 자동차 자산역 잔류 후 도보 귀환, 왕복: 단순). Routing gap only.

**Q2 "비 오면 못 타?"**
Conditional-if question. "비" not in any gate. "못 타" is capability — not matched.
Knowledge: weather_suitable DB field exists but value unverified. Honest answer would be KNOW/ASK boundary — weather operation policy needs verification.

**Q3 "휠체어 타셔도 탈 수 있어?"**
"탈 수 있어" NOT in FEASIBILITY pattern (only "갈 수 있어" is). Closest match would be FEASIBILITY but it's about ride capability, not place feasibility in journey sense.
Knowledge: More-to-Know states "전동휠체어 제한". DB has `accessibility_wheelchair_status = 'unknown'`. A hedged answer is possible: "일반 휠체어는 가능하나 전동휠체어는 제한이 있을 수 있어요. 현장 확인을 권해드려요."

**Q4 "오동도 갔다가 타도 돼?"**
"타도 돼?" — not matched by any gate. Journey combination question.
Knowledge: More-to-Know "오동도와 이어가요" has the answer (자산정류장↔오동도 입구 연계 동선). Routing gap only.

**Q5 "지금 가도 탈 수 있어?"**
"탈 수 있어" not matched. Even if routed, this is LIVE — current operation status cannot be confirmed from stored hours alone. Correct answer: provide hours + recommend calling/checking.

**Q6 "포토존 알려 줘"**
"알려 줘" (space) ≠ "알려줘" (fused). Even if routed, no structured photo_spots field exists. COMBINATION: INTENT_ROUTING_GAP + TRUE_KNOWLEDGE_GAP.

**Q7 "얼마야?"**
Falls to hotel quote path ("어느 숙소로 견적을...") — a routing artifact from the hotel commerce system treating "얼마" as accommodation pricing. Cable Car price: blog reference only (NON_OFFICIAL, BUSINESS_DIRECT_VERIFY_REQUIRED).

**Q8 "얼마나 걸려?"**
No pattern. Knowledge exists and is verified: 12~13분, 1.5km (Batch01). Pure routing gap.

---

## 4. Why "저녁엔 어디 가면 좋아?" Succeeded

Line 892 in `_isDiscoveryIntent`:
```js
if (/(어디 갈까|어딜까|어디 가면|어디가면|어디가 좋|어디 가도|어디에 가|...)/.test(message)) return true;
```

"저녁엔 **어디 가면** 좋아?" → `어디 가면` matches exactly. Routes to Travel Intelligence → PARTIAL/DISCOVERING with time_of_day=evening context.

This is the only question with an outward destination-seeking phrase ("어디 가면"). All others are inward place-specific questions about the current place.

---

## 5. Common Root Cause

**There is no routing branch for Place-Specific Information-Seeking queries.**

Current architecture handles:
- `_isDiscoveryIntent` → "Where should I go?" (outward, destination-seeking)
- `_isJourneyPlanningIntent` → "Plan my N-day trip"
- `_detectJourneyDecisionType` → Journey state modification (Add/Remove/Feasibility within Golden 3)
- Everything else → CLARIFICATION

The 8 failing questions are a **4th class** that the architecture doesn't recognize:

> "I am already ON this place's page. I want to know something ABOUT this place."

These include: operational info (비, 지금), judgment (왕복/편도), capability (휠체어, 탈 수 있어), connection (오동도 갔다가), factual (얼마, 얼마나), feature (포토존).

None use outward discovery verbs. None modify a journey. None contain the narrow FEASIBILITY/JOURNEY patterns. They all presuppose the place is chosen — the user wants depth about it.

**Diagram:**

```
User on Cable Car page
         │
         ▼
Question about current place
         │
         ├── _isDiscoveryIntent?    → NO (not "어디 가면?" — they're already there)
         ├── _isJourneyPlanningIntent? → NO (not planning a multi-day trip)
         ├── _detectJourneyDecisionType? → NO (not modifying Golden 3 journey)
         │
         ▼
    CLARIFICATION
    "어떤 도움이 필요하신가요?" ← WRONG
```

---

## 6. Minimum Architectural Fix Proposal

### Option A: Widen `_isDiscoveryIntent` with place-operational patterns

Add to `_isDiscoveryIntent`:
- `알려 줘` (spaced form) alongside `알려줘`
- `탈 수 있어|타도 돼|탈 수 있을까` (ride capability)
- `얼마나 걸려|걸리나요|소요시간`
- `얼마야|얼마예요|요금이` (but needs to avoid hotel quote conflict)

**Coverage:** Q1 (partial), Q3, Q4 (partial), Q6, Q8
**Does NOT cover:** Q2 (비 오면), Q5 (지금), Q7 (얼마야→hotel conflict)
**Regression risk:**
- Widening `_isDiscoveryIntent` routes to Travel Intelligence → PLACE_LOOKUP or DISCOVERING.
- For questions about the current place, PLACE_LOOKUP with `place_code=cablecar` returns a suitability answer ("케이블카에 대해 알려드릴게요...") — not the specific question answer.
- The result would be "routed but wrong answer" rather than "wrong CLARIFICATION".
- Partial improvement only. Does not solve the answer layer.

### Option B: `_isPlaceSpecificQuery` gate — new routing branch before CLARIFICATION, gated on `place_code` presence

When `explicit_context.place_code` is set AND no other gate matched:
1. Check if message contains any interrogative/operational pattern for a place.
2. Route to a new `PLACE_SPECIFIC_QUERY` handler (or existing PLACE_LOOKUP with an `open_question=true` flag).
3. The handler: pass message + full place data to GPT with "answer this question using known place facts. If unknown, say ASK."

**Trigger pattern (broad but gated on place_code):**
```js
function _isPlaceSpecificQuery(message, hasPlaceCode) {
  if (!hasPlaceCode) return false;
  // Any interrogative ending when place is known
  if (/(나아|돼\??|있어\??|돼요\??|알려 줘|알려줘|알려주세요|걸려\??|얼마\??|괜찮아\??|어때\??)/.test(message)) return true;
  if (/(못 타|탈 수 있|가도 돼|타도 돼|비 오면|날씨|포토|사진|휠체어|편도|왕복)/.test(message)) return true;
  return false;
}
```

**Coverage:** Q1-Q8 all potentially covered (with knowledge-layer still needing connection)
**Does NOT solve:** Q7 얼마야 (hotel quote conflict — needs separate disambiguation)
**Regression risk:**
- Must be placed AFTER Journey Decision Gate to avoid overriding Journey continuity.
- `place_code` gating prevents false positives on sessions without a current place.
- "배고파요" + place_code → would hit this gate; needs exclusion patterns or GPT will handle gracefully.

### Option C: Pass ALL unmatched questions to PLACE_LOOKUP when place_code is set

Essentially: if `!needsTravelIntelligence && !journeyDecisionType && explicit_context.place_code` → route to Travel Intelligence with `PLACE_LOOKUP` intent.

**Coverage:** Maximum — all 8
**Risk:** Highest. Every clarification-worthy message on a place page gets a PLACE_LOOKUP response, which may be irrelevant. "안녕", "배고파", "좋아" would all trigger PLACE_LOOKUP.

### Recommended: **Option B** (targeted `_isPlaceSpecificQuery` gate)

Reasons:
1. Gated on `place_code` — no false positives on sessions without a current place context.
2. Surgical patterns cover the semantic class (operational/capability/judgment questions) without catching random noise.
3. Preserves Journey Continuity (placed after Journey Decision Gate).
4. Preserves existing Discovery and Planning gates unchanged.
5. Knowledge layer can be addressed separately per question (some A, some B, some D).

**Note:** Option B routing fix alone is not sufficient — the knowledge connection layer also needs work per question:
- Q1 왕복/편도: connect More-to-Know knowledge to SOUL response
- Q3 휠체어: hedged response from `accessibility_wheelchair_status` + More-to-Know note
- Q4 오동도 연계: connect More-to-Know "오동도와 이어가요" to response
- Q5 지금 탈 수 있어: hours + "현장/전화 확인 권장" hedge
- Q7 얼마야: route away from hotel quote; hedged response with blog ref + verify flag
- Q8 얼마나 걸려: connect Batch01 verified "12~13분, 1.5km"

---

## 7. Regression Risks

| Risk | Severity | Notes |
|---|---|---|
| Option B gate fires on non-travel messages (e.g. "배고파") when place_code set | LOW | GPT handles gracefully; worst case is a polite "모르겠어요" response |
| "얼마야?" hotel quote conflict persists even with B | MEDIUM | Hotel quote system intercepts "얼마" before new gate; needs separate disambiguation |
| Widened patterns intercept Journey Continuity turns (e.g. "오동도 타도 돼?" = FEASIBILITY match) | LOW | Journey Decision Gate runs FIRST; FEASIBILITY match would catch "갈 수 있어" turns before new gate |
| Knowledge-layer gap (potos없음, weather미검증) produces wrong answers | MEDIUM | Must use KNOW/ASK boundary strictly; GPT must hedge on unknown fields |
| "탈 수 있어?" gets routed but Travel Intelligence doesn't have a "cable car ride capability" handler | MEDIUM | PLACE_LOOKUP would return suitability info — partial answer better than CLARIFICATION |

---

## STOP

Founder/Lumi decision required before implementation.

**Decision points:**
1. Option A, B, or C — or combination?
2. Is it acceptable for Option B to answer "비 오면 못 타?" with available knowledge + hedge, or must weather be verified first?
3. "얼마야?" hotel quote conflict — fix in same task or separate?
4.포토존 (E: TRUE_KNOWLEDGE_GAP) — explicitly out of scope for routing fix?

**NO implementation in this document.**
NO schema/migration/DB/seed. NO web search. NO new recommendation engine.
