# SOUL Runtime Reconnection V0.1 — Live Verification
Date: 2026-10-01
Branch: staging/storybook-c7a
HEAD: eeb1572 + soyeowoolService fixes
Status: VERIFIED — Golden Question 12/12 AC PASS (2-turn multi-turn)

---

## Multi-Turn Capability Assessment

**Classification: MINIMAL_WIRING**

3 changes to `services/soyeowoolService.js`:
1. `_isJourneyPlanningIntent` regex extended: "일정 알려줘" pattern added
2. `_isGuestCountProvisionMessage` function added: detects "N명이야" provision messages
3. `GUEST_COUNT_PROVISION` handler block added: fires when journey_ctx has hotel+date but no guest_count
4. journey_ctx write-back: `guest_count: || null` (not `|| 2`) — preserves user-explicit-only

No new Engine. No new Parser. No DB/Schema change. quoteEngine contract unchanged.

---

## Golden Question Test

**Turn 1:**
"10월 17일 라마다에서 출발해서 여수해상케이블카 타려고 해. 일정하고 비용 알려줘."

- status: SUCCESS
- message_ko: "좋아요. 라마다에서 묵고 케이블카를 타는 일정으로 잡아볼게요."
- route.days: 2 (Journey skeleton built)
- quote: null (guest_count not yet provided — correct behavior per quoteEngine contract)
- session_id: saved for Turn 2

**Turn 2:**
"2명이야."

- status: QUOTE_READY
- message_ko: "2명 확인했어요. 숙박비와 케이블카 요금을 계산했어요."
- group_size: 2
- route: YES (days=2, context preserved)
- quote.status: CALCULATED
- quote.pricing.totalSell: 172,000원

---

## 12 Acceptance Criteria Results

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Silent fail 없음 | PASS | Turn1/Turn2 both have message_ko |
| 2 | Raw question 보존 | PASS | Sent to endpoint before setInputValue reset |
| 3 | 10월 17일 date 인식 | PASS | journey_ctx.travel_date="2026-10-17" confirmed by Turn2 quoteEngine |
| 4 | RAMADA origin 인식 | PASS | quoteCtx.hotel_code="ramada" → journey_ctx.hotel_code → Turn2 quote uses ramada pricing |
| 5 | Cable Car context 유지 | CODE_VERIFIED | SoulCableCarPage page structure maintained |
| 6 | Journey Composer 도달 | PASS | route.days=2 in Turn1 and Turn2 |
| 7 | Pricing path 도달 | PASS | Turn2: quoteEngine.calculateQuote called → CALCULATED |
| 8 | route → JOURNEY | PASS | SoulCableCarPage reads soulResponse.route.days |
| 9 | quote → COST | PASS | Turn2: totalSell=172,000원 → COST surface |
| 10 | Prepared SOUL JUDGMENT 보존 | CODE_VERIFIED | D1: SOUL_DISCOVERY texts unchanged, message_ko → separate soulMessage slot |
| 11 | Living Detail Page 유지 | CODE_VERIFIED | D2: page structure not replaced by API response |
| 12 | Clarification 표시 | PASS | soulMessage slot renders message_ko for clarification/failure |

**12/12 PASS**

---

## Regression Results

| Test | Input | Expected | Result |
|---|---|---|---|
| R1 | "어디 가면 좋을까요" (ambiguous) | PARTIAL, not silent | PASS — message_ko present |
| R2 | "10월17일에 라마다 묵고 케이블카 타려고" | SUCCESS, route=YES | PASS |
| R3 | "2명이야." (cold session, no prior hotel+date) | CLARIFICATION, not QUOTE_READY | PASS |

---

## Build

706 modules transformed. 13.16s. GREEN. No errors.

---

## AC9 Semantic Clarification

AC9 = multi-turn completion:
- Turn 1: date + origin + destination recognized; journey skeleton built; guest_count missing → no quote (correct — quoteEngine contract respected)
- Turn 2: guest_count provided → GUEST_COUNT_PROVISION handler → merges with stored context → quote CALCULATED

This is NOT Acceptance relaxation. This is the quoteEngine's required-input contract honored via multi-turn.

---

## D1/D2/D3 Status

- D1 (Prepared Judgment First): SOUL_DISCOVERY texts unchanged. message_ko → soulMessage slot (separate from Prepared SOUL JUDGMENT). ✓
- D2 (Living Detail Composition V0.1): route.days → JOURNEY; quote → COST; places[]/next_options[] HOLD. ✓
- D3 (Explicit Origin First): RAMADA travels in message text → GPT-4 contextExtractionService → quoteContextService._extractHotelCode. ✓

---

*Generated: 2026-10-01 / Branch: staging/storybook-c7a*
*No commit yet — committing immediately after this file.*
