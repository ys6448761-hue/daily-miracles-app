# P-NEW-1 Explicit Place Preservation — Production Deployment Evidence V1

**Date**: 2026-10-22  
**Deploy ID**: dep-dbcqt70m7kps73cl2ha0  
**Production SHA**: 292a6b0d7f78cde00f5e045203b3ea97d5900912  
**Previous SHA**: b6c05978a020bc46dcb0d2f17bcd4f90e6bc29dc  
**Endpoint**: https://app.dailymiracles.kr/api/dt/travel/input/text

---

## Scope

PR #99 (feat: P-NEW-1 Explicit Place Preservation V0.1)

- `soyeowoolService.js`: `_supplementDomainFromSharedJourney`에서 EXPLICIT want → must_visit_place_ids 전달
- `travelGuideService.js`: `_selectPlacesByTime` Step 1 `_tmFallback` bypass 추가, 중복 const 제거

---

## T1 — 케이블카+오동도 EXPLICIT 복수 장소

**Input**: "케이블카랑 오동도 가고 싶어요. 반나절 일정으로 코스 짜줘."  
**Status**: SUCCESS  
**Places**: `cablecar, odongdo, hamel_lighthouse`  
**Response Preview**: "좋아요. 케이블카를 포함해서 일정을 잡아볼게요."  
**Result**: **PASS** — cablecar ✓ / odongdo ✓ 모두 최종 코스에 포함

---

## T2 — 이순신광장+하멜등대 EXPLICIT 복수 장소

**Input**: "이순신광장이랑 하멜등대 가고 싶어요. 반나절 코스 짜줘."  
**Status**: SUCCESS  
**Places**: `lee_soon_shin_plaza, hamel_lighthouse, cablecar`  
**Response Preview**: "3시간 정도 시간이 있으시군요. 이동 시간까지 생각해서 편하게 갈 수 있는 곳으로 골라봐요."  
**Result**: **PASS** — lee_soon_shin_plaza ✓ / hamel_lighthouse ✓ 모두 최종 코스에 포함

---

## T3 — 단일 장소 오동도 2시간 코스 (회귀)

**Input**: "오동도 2시간 코스 추천해줘."  
**Status**: SUCCESS  
**Places**: `odongdo, hamel_lighthouse`  
**Response Preview**: "2시간 정도 시간이 있으시군요. 이동 시간까지 생각해서 편하게 갈 수 있는 곳으로 골라봐요."  
**Result**: **PASS** — odongdo ✓ 포함, 기존 단일 장소 추천 정상 동작

---

## T4 — 시간 부족 복수 장소 제약 처리

**Input**: "1시간밖에 없어요. 케이블카랑 오동도랑 이순신광장이랑 향일암 다 가고 싶어요."  
**Status**: JOURNEY_CONTINUITY  
**Places**: (empty — 대화형 여정 빌딩 모드)  
**Response Preview**: "오동도를 첫 번째 장소로 넣을게요. 추가하고 싶은 곳이 있으신가요?"  
**Result**: **ADVISORY (PRE-EXISTING)** — 조용한 삭제는 아님 (JOURNEY_CONTINUITY로 전환, 순서대로 장소 추가 유도). "1시간으로 4곳은 어렵다"는 명시적 제약 문구 없음. P-NEW-1 신규 회귀 아님 — 기존 JOURNEY_CONTINUITY 동작.

---

## T5 — G1 City Detection 회귀

**Input**: "부산 여행 추천해줘."  
**Status**: CITY_UNSUPPORTED  
**Response**: "부산은(는) 아직 제가 안내드릴 수 있는 지역이 아니에요. 현재는 여수 여행을 도와드릴 수 있어요. 여수에서 비슷한 경험을 찾아드릴까요?"  
**Result**: **PASS** — CITY_UNSUPPORTED 정상 유지

---

## T6 — Health Check

**Endpoint**: https://app.dailymiracles.kr/health  
**HTTP Status**: 200  
**Response**: "ok"  
**Result**: **PASS**

---

## 종합 결과

| ID | 케이스 | Status | Result |
|----|--------|--------|--------|
| T1 | 케이블카+오동도 EXPLICIT | SUCCESS | **PASS** |
| T2 | 이순신광장+하멜등대 EXPLICIT | SUCCESS | **PASS** |
| T3 | 오동도 2시간 단일 코스 | SUCCESS | **PASS** |
| T4 | 1시간+4장소 제약 처리 | JOURNEY_CONTINUITY | **ADVISORY (PRE-EXISTING)** |
| T5 | 부산 CITY_UNSUPPORTED | CITY_UNSUPPORTED | **PASS** |
| T6 | Health Check 200 | HTTP 200 | **PASS** |

- PASS: 5/6  
- ADVISORY (PRE-EXISTING): 1/6  
- FAIL: 0/6  
- 신규 회귀: **0건**

---

## 판정

**P-NEW-1: DEPLOYED_AND_VERIFIED**

- 핵심 기능 (EXPLICIT 복수 장소 → must_visit_place_ids) T1/T2 모두 PASS
- G1 회귀 없음 (T5 PASS)
- 단일 장소 회귀 없음 (T3 PASS)
- T4 ADVISORY는 P-NEW-1 이전부터 존재하는 JOURNEY_CONTINUITY 동작 — 신규 회귀 아님

**Production Live SHA**: 292a6b0d7f78cde00f5e045203b3ea97d5900912  
**Deploy ID**: dep-dbcqt70m7kps73cl2ha0
