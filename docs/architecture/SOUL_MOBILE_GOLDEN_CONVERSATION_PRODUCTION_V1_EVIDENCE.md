# SOUL MOBILE GOLDEN CONVERSATION — Production V1 Evidence

**Status:** PRODUCTION VERIFIED / READY FOR PRE-PILOT REVIEW
**Date:** 2026-10-06
**Commits:** `c9abe82` (Answer Summary micro-fix) + `9949383` (people_type continuity guard)
**Session tested:** bd75107f-567b-44bd-8017-a3471c4c04a3 (original) + 7bb19113-dd70-4230-a23d-691adeaa50ef (continuity guard regression)
**Bootstrap:** OK (identity bootstrap returns guest_token, sowon_id, guest_principal_id)

---

## Turn-by-Turn Results (Original T1-T8 Run)

| Turn | Message | HTTP | Status | Mode | people_type | has_car | mobility | journey state | message excerpt | ASK? |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | 부모님과 여수 가 | 200 | CLARIFICATION | CLARIFICATION | family_elderly ✓ | — | — | null | "부모님과 함께하는 여행이시군요. 어떤 도움이 필요하신가요?" | 어떤 도움? |
| T2 | 차 가져가 | 200 | CLARIFICATION | CLARIFICATION | **family_elderly ✓** (fixed) | absent | — | null | "여수 여행을 더 잘 도와드릴 수 있도록..." | generic CLARIFICATION |
| T3 | 오동도 먼저 가고 싶어 | 200 | JOURNEY_CONTINUITY | CLARIFICATION | family_elderly ✓ | — | — | odongdo:included/first | "오동도를 첫 번째 장소로 넣을게요." | 추가할 곳? |
| T4 | 케이블카도 탈래 | 200 | JOURNEY_CONTINUITY | CLARIFICATION | family_elderly ✓ | — | — | odongdo:first, cablecar:included | "케이블카도 함께 넣을게요. 지금까지: 오동도, 케이블카." | 향일암? |
| T5 | 향일암까지 가능해? | 200 | JOURNEY_CONTINUITY | CLARIFICATION | family_elderly ✓ | — | — | odongdo:first, cablecar, hyangiram:proposed | "향일암은 계단이 가파른 구간이 있어요. 체력에 따라 다를 수 있어요." | 일정 넣을까요? |
| T6 | 많이 걷는 건 힘들어하셔 | 200 | JOURNEY_CONTINUITY | CLARIFICATION | family_elderly ✓ | — | low_walking ✓ | + constraints.low_walking=true | "알겠어요. 걷기 부담을 줄이는 방향으로 볼게요. 현재 일정: 오동도, 케이블카, 향일암(검토중)..." | 향일암 어떻게? |
| T7 | 그럼 하나 빼줘 | 200 | JOURNEY_CONTINUITY | CLARIFICATION | family_elderly ✓ | — | low_walking ✓ | odongdo:first, cablecar (hyangiram removed) | "향일암을 빼겠어요. 걷기 부담이 있는 상황에서 계단이 가파른 구간이 있어요. 남은 일정: 오동도, 케이블카." | 없음 |
| T8 | 저녁엔 어디 가면 좋아? | 200 | PARTIAL | DISCOVERING | family_elderly ✓ | — | — | null | "부모님과 함께 밤 시간이 남으셨군요. 지금 갈 수 있는 야간 명소를 골라봤어요." | 시간 얼마나? |

### Decision Type per JOURNEY_CONTINUITY turn
| Turn | Inferred Decision Type |
|---|---|
| T3 | PREFERENCE (오동도 first) |
| T4 | ADD (케이블카) |
| T5 | FEASIBILITY (향일암) |
| T6 | CONSTRAINT_UPDATE (low_walking) |
| T7 | JOURNEY_MODIFY (hyangiram 제거) |

---

## 11-Criterion Pass Check

| # | Criterion | Result | Notes |
|---|---|---|---|
| 1 | T1→T8 Context continuity | ✓ PASS | people_type: family_elderly T1→T8. Continuity guard fix (9949383) verified. |
| 2 | Journey continuity (T3-T7) | ✓ PASS | odongdo:first → +cablecar → +hyangiram:proposed → constraints.low_walking → hyangiram removed. |
| 3 | Known information not re-asked | ✓ PASS | T6 doesn't re-ask companion/destination. mobility only newly asked. |
| 4 | T3/T4/T5/T7 no generic CLARIFICATION regression | ✓ PASS | All 4 turns return JOURNEY_CONTINUITY status. |
| 5 | T6 changes subsequent judgment | ✓ PASS | T6 low_walking → T6 message re-evaluates hyangiram → T7 removes with explicit reason. |
| 6 | T7 recomputes Journey | ✓ PASS | "향일암을 빼겠어요. 걷기 부담이 있는 상황에서 계단이 가파른 구간이 있어요." |
| 7 | Existing 3-place Judgment reused | ✓ PASS | T5/T6/T7 all cite hyangiram's stairs from DB physical_difficulty field. No fabrication. |
| 8 | Answer Summary (API-level: fields present) | ✓ PASS | message_ko, status, presentation_mode, next_options present every turn. |
| 9 | 3-place identity/hero works | ✓ PASS | All 3 places: HTTP 200, PLACE_LOOKUP, no IDENTITY_BOOTSTRAP_FAILED. |
| 10 | Knowledge Safety violations = 0 | ✓ PASS | See Knowledge Safety section below. |
| 11 | Fatal mobile/runtime errors = 0 | ✓ PASS | All turns HTTP 200. Bootstrap HTTP 201. No 5xx. |

---

## Continuity Guard Fix — Regression Test (commit 9949383)

**Test A: people_type preservation (session 7bb19113)**

| Turn | Message | people_type | Result |
|---|---|---|---|
| T1 | 부모님과 여수 가 | family_elderly | ✓ PASS |
| T2 | 차 가져가 | family_elderly | ✓ PASS (was solo before fix) |
| T3 | 오동도 먼저 가고 싶어 | family_elderly | ✓ PASS |
| T4 | 케이블카도 탈래 | family_elderly | ✓ PASS |
| T8 | 저녁엔 어디 가면 좋아? | family_elderly | ✓ PASS |

**Test B: Genuine override works**

| Turn | Message | people_type | Result |
|---|---|---|---|
| B-T1 | 부모님과 여수 가 | family_elderly | ✓ PASS |
| B-T2 | 혼자 갈 거야 | solo | ✓ PASS (USER_EXPLICIT override wins) |

**Fix mechanism:** `_applyPersistedTravelerProfile` now called immediately after `journeyCtxForClar` session read, before Journey Decision Gate and CLARIFICATION paths. CURRENT USER_EXPLICIT (e.g. "혼자") wins; stored fills non-explicit gaps.

---

## Knowledge Safety

| Check | Result |
|---|---|
| Fabricated travel time | 0 violations. No turn invents transit time between places. |
| stay_time → walking burden inference | 0 violations. T5 ASKs about feasibility rather than inferring from stay_minutes. |
| Unsupported elderly suitability claim | 0 violations. T6 cites physical_difficulty (stairs) — no "어르신 가능" without basis. |
| Invented route/order | 0 violations. Journey reflects only user-stated preferences. |
| Human Experience fabrication | 0 violations. |
| UNKNOWN expressed as Fact | 0 violations. T5: "체력에 따라 다를 수 있어요" — correct hedging. |
| 3-place stay times | DB-sourced: cablecar=45min, odongdo=2hr, hyangiram=45min-1.5hr ✓ |

---

## 3-Place Check

| Place | HTTP | status | mode | IDENTITY_BOOTSTRAP_FAILED? | message excerpt |
|---|---|---|---|---|---|
| cablecar | 200 | PLACE_LOOKUP | PLACE_KNOWLEDGE | NO | "여수 바다 위를 가로지르는 해상 케이블카예요. 2030, 가족 여행에 잘 어울려요. 보통 약 45분 정도 머물러요." |
| odongdo | 200 | PLACE_LOOKUP | PLACE_KNOWLEDGE | NO | "여수 앞바다에 자리한 섬이에요. 가족, 아이 동반 여행에 잘 어울려요. 보통 약 2시간 정도 머물러요. 무료." |
| hyangiram | 200 | PLACE_LOOKUP | PLACE_KNOWLEDGE | NO | "돌산도에 자리한 암자예요. 빠르면 45분, 여유 있게 1시간 30분. 무료. 운영시간 04:00~19:00" |

---

## Remaining Observations

### HOLD — Journey null at T8
- `conversation_journey` drops to null at T8 (PARTIAL/DISCOVERING). Prior journey (odongdo, cablecar) not passed to evening recommendation.
- Impact: T8 answer doesn't reference the planned itinerary.
- Action: LATER IMPROVEMENT — pass accumulated journey to PARTIAL mode handler. Outside V0.1 scope.

### HOLD — OBS-2: "차 가져가" has_car text extraction
- "차 가져가" doesn't populate `has_car=true` in uctx via text. Mitigated by mobile car chip (explicit_context).
- Action: LATER IMPROVEMENT per Founder directive.

---

## STOP

**SOUL Mobile Golden Conversation = PRODUCTION VERIFIED**

All 11 criteria: PASS
Continuity Guard regression: PASS (Test A + Test B)

**Founder/Lumi Final Review 대기.**

Next Action (exactly 1):
Founder + Lumi review this evidence. Decide: proceed to pilot.

**NO schema/migration/DB/seed/Travel Memory/Regional Journey/Travel Time Matrix/Human Experience/4th Place/Commerce/Home/Character/new Recommendation Engine.**
