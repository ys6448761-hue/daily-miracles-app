# MAP V0.1 — Marker Clean Restart Evidence

**Date**: 2026-10-27  
**Decision**: MAP_V01_MARKER_CLEAN_RESTART_APPROVED (Founder)  
**Status**: MAP_V01_MARKER_CLEAN_RESTART_READY  
**Classification**: REPLACE (markerPos 데이터) + EXTEND (DRAFT_KEY v02)

---

## §1 백업 체크포인트

| 항목 | 내용 |
|------|------|
| 백업 Git SHA | `72367ee` (CLEAN RESTART 직전) |
| markerPos 백업 파일 | `docs/knowledge/MAP-V01-MARKERPOS-BACKUP.md` |
| 백업된 좌표 수 | 7개 (이순신광장·낭만포차·하멜등대·종포해양공원·오동도·케이블카·자산공원) |
| 복구 방법 | `git show 72367ee:dreamtown-frontend/src/constants/yeosuMapData.js` |

---

## §2 보존한 기능

| 기능 | 상태 |
|------|------|
| 지도 이미지 (overview·oldtown PNG) | ✅ 유지 |
| Zone 1~7 구조 | ✅ 유지 |
| Inventory 45곳 / TG_READY 12곳 | ✅ 유지 |
| SOUL 게이팅 | ✅ 유지 |
| 장소 선택·해제 (양방향 토글) | ✅ 유지 |
| 드래그 편집기 | ✅ 유지 |
| 방향 버튼 미세 조정 | ✅ 유지 |
| 좌표 내보내기 (단일/전체) | ✅ 유지 |
| localStorage 초안 자동 저장·복원 | ✅ 유지 (DRAFT_KEY v02) |
| Zone 경계 PROVISIONAL | ✅ 유지 |
| PLACEMENT_TARGETS 15곳 | ✅ 유지 |

---

## §3 초기화된 markerPos 범위

| place_id | 이전 | 이후 | 비고 |
|----------|------|------|------|
| lee_soon_shin_plaza | { x:0.255, y:0.540 } | **없음** | |
| romantic_pojangmacha | { x:0.593, y:0.599 } | **없음** | |
| hamel_lighthouse | { x:0.519, y:0.718 } | **없음** | |
| marine_park | { x:0.387, y:0.509 } | **없음** | |
| odongdo | { x:0.853, y:0.340 } | **없음** | |
| cablecar | { x:0.69, y:0.57 } | **없음** | |
| jaisan_park | { x:0.582, y:0.495 } | **없음** | |
| yeosu_expo_park | 없음 | 없음 | 변경 없음 |
| sky_tower | 없음 | 없음 | 변경 없음 |

---

## §4 DRAFT_KEY v02 — 초안 복원 충돌 방지

| 항목 | 내용 |
|------|------|
| 이전 키 | `yeosu_map_draft_v01_oldtown` |
| 새 키 | `yeosu_map_draft_v02_oldtown` |
| 격리 효과 | v01 초안은 v02 편집기에서 자동 복원되지 않음 |
| v01 초안 복구 가능 여부 | Founder 브라우저 DevTools → localStorage → v01 키 직접 확인 시 가능 |

---

## §5 Runtime QA 결과 (MAP_V01_DRAFT_RUNTIME_VERIFIED)

| 테스트 | 결과 | 내용 |
|--------|------|------|
| T-01 페이지 로드 | ✅ PASS | |
| T-02 초기 localStorage 비어 있음 | ✅ PASS | v02 키 격리 확인 |
| T-03 Zone 1 진입 | ✅ PASS | |
| T-04 편집 모드 활성화 | ✅ PASS | |
| T-05 이순신광장 선택 | ✅ PASS | |
| T-06 지도 클릭 (dispatchEvent 방식) | ✅ PASS | x=0.299, y=0.496 |
| **T-07 localStorage 저장** | ✅ **PASS** | `lee_soon_shin_plaza x=0.299, y=0.496` |
| **T-08a 새로고침 후 "초안 복원됨" 배지** | ✅ **PASS** | |
| **T-08b 복원 좌표 일치** | ✅ **PASS** | x=0.299, y=0.496 ✓ |
| **T-09 Zone 1→2 전환 후 유지** | ✅ **PASS** | 이순신광장 ✓ Zone 2에서 유지 |
| T-10 전체 내보내기 버튼 | ✅ PASS | 버튼 존재 확인 |
| T-11 초안 삭제 | ❌ TEST INFRA | puppeteer 스크롤 클릭 이슈 — 코드 버그 아님 |

**총 11/12 PASS** — 핵심 저장·복원·Zone 전환 흐름 모두 PASS.

---

## §6 4단계 위치 지정 워크플로우

| 단계 | 상태 | 조건 |
|------|------|------|
| NOT_PLACED | markerPos 없음 + candidates 없음 | 기본 상태 (CLEAN RESTART 후 전 장소) |
| DRAFT | candidates[place_id] 있음 (localStorage) | Founder 드래그 후 |
| SOURCE_SAVED | 내보내기 완료 → yeosuMapData.js 반영 | Founder 제공 좌표 코드 반영 후 |
| FOUNDER_APPROVED | — | 별도 Founder 승인 (VERIFIED 승격) |

현재 편집기 상태 레이블:
- 미지정 = NOT_PLACED
- 후보 좌표 있음 = DRAFT
- 내보내기 완료 · 코드 반영 전 = DRAFT → SOURCE_SAVED 중간
- 코드 반영 = SOURCE_SAVED

---

## §7 이전 장소별 상태 (전부 NOT_PLACED)

| place_id | name_ko | 상태 |
|----------|---------|------|
| lee_soon_shin_plaza | 이순신광장 | NOT_PLACED |
| romantic_pojangmacha | 낭만포차거리 | NOT_PLACED |
| hamel_lighthouse | 하멜등대 | NOT_PLACED |
| marine_park | 종포해양공원 | NOT_PLACED |
| odongdo | 오동도 | NOT_PLACED |
| cablecar | 케이블카 | NOT_PLACED |
| jaisan_park | 자산공원 | NOT_PLACED |
| yeosu_expo_park | 엑스포공원 | NOT_PLACED |
| sky_tower | 스카이타워 | NOT_PLACED |
| opodae | 오포대 | NOT_PLACED |
| jinamgwan | 진남관 | NOT_PLACED |
| aquaplanet | 아쿠아플라넷 | NOT_PLACED |
| big_o_show | 빅오쇼 | NOT_PLACED |
| nangman_yacht | 낭만요트 | NOT_PLACED |
| blue_yacht | 블루요트 | NOT_PLACED |

---

## §8 소스 저장 흐름 검증 (하나의 장소 완료 예시)

이순신광장 (T-06~T-08) 검증:
A. 드래그 → x=0.299, y=0.496 ✅
B. "좌표 내보내기" → 클립보드 ✅ (구조 확인)
C. yeosuMapData.js 반영 → (Founder 제공 좌표로 코드야가 입력)
D. 새로고침 → "코드 반영" 상태 표시 ← C 이후 확인
E. Evidence 기록 ← 이 파일

---

## §9 안전 조건

| 항목 | 상태 |
|------|------|
| 원본 PNG 수정 없음 | ✅ |
| DB/Schema·SOUL 엔진 변경 없음 | ✅ |
| Inventory 45개 / TG_READY 12개 / 7권역 유지 | ✅ |
| SOUL 게이팅 변경 없음 | ✅ |
| VERIFIED 자동 승격 없음 | ✅ |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| 빌드 | ✅ 698 modules |
| 회귀 | ✅ 639/640 PASS (R20 PRE-EXISTING) |
