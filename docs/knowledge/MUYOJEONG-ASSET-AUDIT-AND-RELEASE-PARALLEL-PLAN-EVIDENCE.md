# MUYOJEONG_ASSET_AUDIT_AND_RELEASE_PARALLEL_PLAN Evidence

**Date**: 2026-10-30  
**Status**: MUYOJEONG_ASSET_AUDIT_AND_RELEASE_PARALLEL_PLAN ✅  
**분류**: READ-ONLY AUDIT — 코드 변경 없음

---

## §1 조사 범위

- `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx`
- `services/travelGuideService.js`
- `services/soyeowoolService.js`
- `services/contextExtractionService.js`
- `services/fallbackService.js`
- `dreamtown-frontend/src/constants/yeosuMapData.js`
- `DREAMTOWN_STATUS.md` (Production SHA / PR 현황)

---

## §2 장소 데이터 현황

| 분류 | 수량 | 비고 |
|------|------|------|
| 전체 등록 장소 | 50곳 | yeosuMapData.js 기준 |
| TG_READY (SOUL TG 추천 가능) | 22곳 | |
| EXPLORER (탐색 가능, TG 추천 제외) | 20곳 | |
| TG_EXCLUDED (숨김) | 4곳 | 중앙시장 포함 |
| SOUL Phase 1 완료 (experience_ko 등록) | 8곳 | cablecar, odongdo, hyangiram, lee_soon_shin_plaza, dolsan_nightscape, marine_park, dolsan_daegyo, hamel_lighthouse |
| Living Detail 페이지 완성 | 3곳 | cablecar, odongdo, hyangiram |
| 지도 SOURCE_SAVED | Zone별 진행 중 | Zone 3·4·5·6 FOUNDER_VISUAL_ACCEPTED 일부 |

---

## §3 4버튼 연결 구조

### 부모님과 함께
- query: `'부모님과 여수에서 어디 가면 좋을까?'`
- contextExtractionService: `_ELDERLY_PHRASES` → `people_type: 'family_elderly'`
- soyeowoolService: PU-HY-003 Elder ASK (고난이도 장소 접근성 질문)
- travelGuideService: `suitable_for.includes('elderly')` 점수 가산
- **작동**: ✅

### 아이와 함께
- query: `'아이와 여수에서 어디 가면 좋을까?'`
- `_KIDS_PHRASES` → `people_type: 'family_with_kids'`
- `suitable_for.includes('family')` 필터
- **작동**: ✅

### 차량으로
- query: `'여수에서 차로 가기 좋은 곳과 주차 정보를 알려줘.'` + `ec: { has_car: true }`
- `has_car: true` explicit_context → SOUL에서 parking_ko 데이터 응답
- SHORT_OP_GATE: 주차 단순 질문 즉시 처리
- **작동**: ⚠️ 부분 — 이동시간 추정 미구현(CAR GOVERNANCE_HOLD), parking_ko 데이터 3~4곳
- PILOT-INTENT-003-T5 UX_GAP: ①"추천 가능" 배지 CAR_INFO에도 동일 ②향일암·하멜등대 주차 안내 없음

### 여행코스
- query: `'여수 여행코스를 짜줘.'`
- Journey Composer V0 → course.blocks 생성
- ROUTE_PLACES_MAIN(8) + ROUTE_PLACES_MORE(+4) 선택 가능
- **작동**: ✅ — PRODUCTION_QA_CLOSED. travel_time_unverified 케이스 존재(향일암↔케이블카)

---

## §4 음식/카페 데이터 현황

- `travel_restaurants` 테이블: 구현됨 (countryCode/cityCode/meal_context 기반)
- `_getFoodRecommendation`: meal_context 없으면 `data_status: "unavailable"` 반환
- MuyojeongHomePage V1.3 주석: "식사/카페 옵션: GPT 추출 신뢰성 미검증 → V0.1 제외"
- 파트너 카페: `_getCafePartners` 구현됨 — 실제 파트너 등록 수: UNKNOWN (DB 조회 필요)
- **결론**: 파이프라인 존재, 큐레이션 데이터 부족 가능성 높음

---

## §5 오픈 준비 현황

| 항목 | 상태 |
|------|------|
| Production SHA | `425a643` (2026-10-25, 맞춤 항로 V0.1) |
| SOUL Phase 1 8곳 | ✅ Production Live |
| 맞춤 항로 V0.1 | ✅ PRODUCTION_QA_CLOSED |
| SOUL 게이팅 | ✅ TG_READY / SHORT_OP_GATE / 신호등 |
| 감성지도 V0.1 | ⏳ PR #134 미병합 (브랜치: docs/pr133-state-sync) |
| Zone 1·2 좌표 | ⏳ FOUNDER_FINAL_VISUAL_QA_PENDING |
| CAR GOVERNANCE_HOLD | 유지 (오픈 차단 사유 아님 — Task §4 명시) |
| 회귀 테스트 | ✅ 639/640 (R20 PRE-EXISTING) |

---

## §6 최소 개편안

**방안 A: 현행 유지 + 이용 안내 문구 보완** (권장)
- 4버튼 유지, 자유 입력창 하단에 예시 질문 추가
- 개발 없이 텍스트만 변경
- 데이터 불필요 / SOUL 안전 무영향
- 근거: 4버튼은 SOUL 핵심 사용 패턴 커버. 부족한 건 '뭘 물어볼 수 있는지' 안내.

**방안 B/C**: 음식/체험 데이터 미확보 상태에서 오픈 전 카테고리 추가 비권장.

---

## §7 Current Next Action

Zone 1·2 Founder 화면 확인 → MAP_V01_ZONE1_2_FOUNDER_VISUAL_ACCEPTED → PR #134 merge 승인
