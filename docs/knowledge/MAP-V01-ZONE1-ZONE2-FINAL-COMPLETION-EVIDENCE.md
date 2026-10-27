# MAP V0.1 Zone 1·2 Final Completion — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_ZONE1_ZONE2_FINAL_COMPLETION_READY  
**Authorization**: Founder Decision — MARKER_NINE_PLACEMENT_FOUNDER_COMPLETED + Final 6 처리

---

## §1 기존 9곳 좌표 코드 반영 현황

Founder가 드래그 편집기로 9곳 위치 지정 완료 선언.  
"전체 좌표 복사" 결과 미수신 → 브라우저 메모리 임의 재구성 금지.

| place_id | name_ko | x | y | 코드 반영 | 비고 |
|----------|---------|---|---|----------|------|
| lee_soon_shin_plaza | 이순신광장 | 0.255 | 0.540 | ✅ | 기존값 유지 (흰 원, Founder 재확인 필요) |
| romantic_pojangmacha | 낭만포차거리 | 0.593 | 0.599 | ✅ | 픽셀 추출 확인 |
| hamel_lighthouse | 하멜등대 | 0.519 | 0.718 | ✅ | 픽셀 추출 확인 |
| marine_park | 종포해양공원 | 0.387 | 0.509 | ✅ | 픽셀 추출 확인 |
| odongdo | 오동도 | 0.853 | 0.340 | ✅ | Founder 이미지 anchor |
| cablecar | 케이블카 | 0.690 | 0.570 | ✅ | AMBIGUOUS 유지 |
| jaisan_park | 자산공원 | 0.582 | 0.495 | ✅ | 시각 추정 (재확인 필요) |
| yeosu_expo_park | 엑스포공원 | — | — | ❌ | markerPos 없음. Founder 복사 결과 대기 |
| sky_tower | 스카이타워 | — | — | ❌ | markerPos 없음. Founder 복사 결과 대기 |

> **Founder 복사 결과 미수신**: 엑스포공원·스카이타워 + Founder가 드래그 편집기에서 수정한 다른 좌표가 있을 수 있음. "전체 좌표 내보내기" 결과 전달 요청 → 수신 즉시 반영.

---

## §2 추가 6곳 처리 결과

| 장소 | code | 처리 | zone | status | 비고 |
|------|------|------|------|--------|------|
| 오포대 | opodae | ✅ PLACEMENT_TARGETS 추가 | 1 | explorer | yeosuMapData.js 기등록 |
| 진남관 | jinamgwan | ✅ PLACEMENT_TARGETS 추가 | 1 | explorer | yeosuMapData.js 기등록 |
| 아쿠아플라넷 | aquaplanet | ✅ PLACEMENT_TARGETS 추가 | 2 | explorer | yeosuMapData.js 기등록 |
| 빅오쇼 | big_o_show | ✅ **신규 추가** | 2 | explorer | 엑스포공원 내 독립 공연 경험 |
| 낭만요트 | nangman_yacht | ✅ 기처리 (SHA `081f57e`) | 2 | explorer | 유탑마리나호텔 오른편 |
| 블루요트 | blue_yacht | ✅ 기처리 (SHA `081f57e`) | 2 | explorer | 유탑마리나호텔 왼편 |

---

## §3 최종 PLACEMENT_TARGETS (15개)

| # | code | name_ko | zone |
|---|------|---------|------|
| 1 | lee_soon_shin_plaza | 이순신광장 | 1 |
| 2 | marine_park | 종포해양공원 | 1 |
| 3 | romantic_pojangmacha | 낭만포차거리 | 1 |
| 4 | hamel_lighthouse | 하멜등대 | 1 |
| 5 | opodae | 오포대 | 1 |
| 6 | jinamgwan | 진남관 | 1 |
| 7 | odongdo | 오동도 | 2 |
| 8 | cablecar | 케이블카 | 2 |
| 9 | yeosu_expo_park | 엑스포공원 | 2 |
| 10 | sky_tower | 스카이타워 | 2 |
| 11 | jaisan_park | 자산공원 | 2 |
| 12 | aquaplanet | 아쿠아플라넷 | 2 |
| 13 | big_o_show | 빅오쇼 | 2 |
| 14 | nangman_yacht | 낭만요트 | 2 |
| 15 | blue_yacht | 블루요트 | 2 |

---

## §4 최종 Inventory 현황

| 항목 | 수량 |
|------|------|
| 이전 Inventory | 44 |
| 신규 추가 (빅오쇼) | 1 |
| **최종 합계** | **45** |
| TG_READY (변경 없음) | 12 |
| 7개 권역 (변경 없음) | 7 |
| EXPLORER | 19 |

---

## §5 통합 마무리 검증

| 항목 | 상태 |
|------|------|
| A. 기존 9곳 후보 좌표 보존 | ✅ 7곳 코드 반영 / 2곳 Founder 복사 결과 대기 |
| B. 추가 6곳 처리 | ✅ 5곳 완료 / 빅오쇼 신규 / 낭만·블루 기처리 |
| C. 추가 장소 편집 목록 표시 | ✅ PLACEMENT_TARGETS 15개 |
| D. Zone 1·2 소속 정합성 | ✅ 오포대·진남관 Zone 1 / 나머지 Zone 2 |
| E. SOUL 추천 게이팅 | ✅ 신규 장소 모두 explorer — TG_READY 자동 승격 없음 |
| F. 기존 7개 권역 보존 | ✅ 변경 없음 |
| G. 일반 화면 미검증 마커 숨김 | ✅ isQAPreview 게이팅 유지 |
| H. 빌드·회귀 테스트 | ✅ 빌드 OK / 639/640 PASS (R20 PRE-EXISTING) |

---

## §6 남은 항목 (MAP V0.1 마무리 가능 여부)

### 즉시 가능
- Founder "전체 좌표 내보내기" 결과 수신 → 엑스포공원·스카이타워 + 수정 좌표 코드 반영

### MAP V0.1 마무리 선언 조건
- 엑스포공원·스카이타워 markerPos 반영 (Founder 복사 결과 수신 후)
- 또는 Founder가 "현재 7곳으로 마무리" 결정 시

### Deferred (범위 외)
- 경계선 VERIFIED 승격
- 오포대·진남관·아쿠아플라넷·빅오쇼·낭만요트·블루요트 마커 위치 지정

---

## §7 안전 조건

| 항목 | 상태 |
|------|------|
| TG_READY / SOUL 게이팅 변경 없음 | ✅ |
| 기존 9곳 좌표 덮어쓰기 없음 | ✅ |
| VERIFIED 자동 승격 없음 | ✅ |
| 일반 화면 미검증 마커 숨김 | ✅ |
| 기존 양방향 토글 보존 | ✅ |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
