# SOUL MINIMUM JOURNEY CONTINUITY V0.1 — Evidence

**Status:** IMPLEMENTED / VERIFIED / STOP — Founder/Lumi Final Review Required  
**Date:** 2026-10-05  
**Commit:** `f9d13e6`  

---

## 1. SCOPE

5 Journey Decision Types within conversation/session scope.  
No new DB schema. No Regional Journey. No Travel Time Matrix.  
Journey state: `journey_ctx.conversation_journey` (existing JSONB column).  
Places: `cablecar / odongdo / hyangiram` only.

---

## 2. IMPLEMENTED

### 2-1. `services/soyeowoolService.js`

| 추가/변경 | 내용 |
|---|---|
| `_koreanParticle()` | 조사 자동 선택 (을/를, 이/가 등) |
| `_extractGoldenPlaceCode()` | 메시지에서 장소 코드 추출 |
| `_detectJourneyDecisionType()` | 5 Decision Type 탐지 (우선순위 순) |
| `_readConvJourney()` | `journeyCtx.conversation_journey` → `{places, constraints}` |
| `_convJourneyPlace()` | 장소 조회 |
| `_convJourneyUpsertPlace()` | 장소 추가/갱신 |
| `_convJourneyRemovePlace()` | 장소 제거 |
| `_convJourneyIncludedKo()` | 현재 일정 한국어 목록 |
| `_handleJourneyDecision()` | A/B/C/D/E 핸들러 dispatch |
| Journey Decision Gate | `handleTravelRequest` 내 — CLARIFICATION 전에 intercept |

### 2-2. `services/sessionService.js`

| 수정 | 내용 |
|---|---|
| `getSession()` | `JSON.parse(session.context)` → `session.context` (JSONB already parsed) |
| `updateJourneyContext()` | `JSON.parse(row.context)` → `row.context` (same) |

**Root cause of prior failure:** `context JSONB NOT NULL` — pg driver auto-deserializes JSONB to JS object. Calling `JSON.parse()` on it → `"[object Object]" is not valid JSON` → write/read silently failed → journey state never persisted.

---

## 3. GOLDEN CONVERSATION — 8/8 PASS

### Turn Results

| Turn | Message | Status | pt | mobility | Journey State |
|---|---|---|---|---|---|
| T1 | 부모님과 여수 가 | CLARIFICATION | family_elderly | - | - |
| T2 | 차 가져가 | CLARIFICATION | family_elderly | - | - |
| T3 | 오동도 먼저 가고 싶어 | JOURNEY_CONTINUITY | family_elderly | - | odongdo(included/first) |
| T4 | 케이블카도 탈래 | JOURNEY_CONTINUITY | family_elderly | - | odongdo(first), cablecar |
| T5 | 향일암까지 가능해? | JOURNEY_CONTINUITY | family_elderly | - | +hyangiram(proposed) |
| T6 | 많이 걷는 건 힘들어하셔 | JOURNEY_CONTINUITY | family_elderly | low_walking | T5 state + constraint |
| T7 | 그럼 하나 빼줘 | JOURNEY_CONTINUITY | family_elderly | low_walking | hyangiram 제거 |
| T8 | 저녁엔 어디 가면 좋아? | PARTIAL | family_elderly | - | DISCOVERING |

### T6 SOUL Response
> "알겠어요. 걷기 부담을 줄이는 방향으로 볼게요.  
> 현재 일정: 오동도, 케이블카, 향일암(검토중).  
> 향일암은 계단이 가파른 구간이 있어서 부담이 될 수 있어요. 어떻게 할까요?"

### T7 SOUL Response
> "향일암을 빼겠어요. 걷기 부담이 있는 상황에서 계단이 가파른 구간이 있어요.  
> 남은 일정: 오동도, 케이블카."

---

## 4. 12-CRITERION PASS CHECK

| # | Criterion | Result |
|---|---|---|
| 1 | `family_elderly` T1→T8 유지 | ✓ |
| 2 | `has_car` T2+ 유지 | ✓ chip applied |
| 3 | `odongdo first` T3+ | ✓ `included/first` |
| 4 | `cablecar` T4+ 누적 | ✓ odongdo+cablecar 동시 표시 |
| 5 | T5 FEASIBILITY — 추정 없이 질문 | ✓ 계단 정보 → 질문 |
| 6 | `low_walking` T6+에서 반영 | ✓ T6 hyangiram 재판단, T7 제거 이유 |
| 7 | T7 JOURNEY_MODIFY — 기존 판단 재사용 | ✓ DB `physical_difficulty` 기반 |
| 8 | T3/T4/T5/T7 generic CLARIFICATION 없음 | ✓ 전부 JOURNEY_CONTINUITY |
| 9 | 이미 알려준 정보 재질문 없음 | ✓ |
| 10 | 새 Context 시 Journey 재판단 | ✓ T6→T7 |
| 11 | 기존 Place Judgment 재사용 | ✓ travelGuideService.getPlaceByCode() |
| 12 | 근거 없는 사실 0건 | ✓ |

---

## 5. KNOWLEDGE SAFETY

| 항목 | 결과 |
|---|---|
| 발명된 이동시간 | 0건 ✓ |
| Travel Time Matrix | 미사용 ✓ |
| 새 Memory Architecture | 0건 ✓ |
| 4번째 장소 구현 | 0건 ✓ |
| Schema / Migration / DB / Seed | 0건 ✓ |
| 새 recommendation engine | 0건 ✓ |
| "부담 없이" inference 제거 | ✓ — `avg_stay_minutes` 검증 수치만 사용 |

---

## 6. RELATED FIXES (same commit)

- **Fix 1**: `companion=parents` → `people_type=family_elderly` unconditional mapping
- **Fix 2**: `family_elderly + hyangiram + no mobility` → walking state 질문 (시간 X)
- **Fix 3**: `walking_burden_unknown=true` → "어르신 방문 가능" suitability claim 제거
- **Fix 4**: PARTIAL 응답도 현재 장소 반영

---

## 7. HOLD (V0.1 미구현)

| 항목 | 이유 |
|---|---|
| G-3: "향일암 가고 싶어" PLACE_LOOKUP | DISCOVERY_OVERRIDES 충돌 — 별도 판단 |
| Travel Time Matrix | GOVERNANCE_HOLD |
| Human Experience Layer | Phase 2 이후 |
| Regional Journey | HOLD |
| 4번째 장소 | HOLD |

---

## 8. STOP

**SOUL Minimum Journey Continuity V0.1 = IMPLEMENTED / VERIFIED**  
**Founder/Lumi Final Review 대기.**
