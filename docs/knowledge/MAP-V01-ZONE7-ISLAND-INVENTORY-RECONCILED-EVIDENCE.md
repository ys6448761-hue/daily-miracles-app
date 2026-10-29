# MAP V0.1 — Zone 7 섬섬길 Inventory Reconciliation Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE7_ISLAND_INVENTORY_RECONCILED  
**Classification**: REPAIR + NEW — hwajung_island 제거 / 사도·하화도 좌표 저장 / 금오·거문·백도·개도 신규 등록

---

## §1 Founder 결정 원문 (2026-10-29)

> 화정도서를 Zone 7 탐색 대상에서 제거하고, 금오도·거문도·백도·개도를 구체적인 섬 탐색 대상으로 연결한다.
> 기존 사도·하화도는 삭제 지시가 없으므로 좌표와 장소 데이터를 보존한다.

---

## §2 변경 전후 Zone 7

### 변경 전 (3곳)
| place_code | name_ko | markerPos |
|------------|---------|-----------|
| sado_island | 사도 | OPEN |
| hahwado_island | 하화도 | OPEN |
| hwajung_island | 화정도서 | OPEN → **제거** |

### 변경 후 (6곳)
| place_code | name_ko | markerPos.overview | 비고 |
|------------|---------|-------------------|------|
| sado_island | 사도 | x=0.307, y=0.823 PROVISIONAL | Founder QA 초안 좌표 보존 |
| hahwado_island | 하화도 | x=0.420, y=0.818 PROVISIONAL | Founder QA 초안 좌표 보존 |
| geumo_island | 금오도 | PLACEMENT_OPEN | 신규 등록 |
| geomundo_island | 거문도 | PLACEMENT_OPEN | 신규 등록 |
| baekdo_island | 백도 | PLACEMENT_OPEN | 신규 등록 (거문도와 독립 place_id) |
| gaedo_island | 개도 | PLACEMENT_OPEN | 신규 등록 |

---

## §3 hwajung_island 참조 확인

| 위치 | 참조 수 | 조치 |
|------|---------|------|
| `dreamtown-frontend/src/constants/yeosuMapData.js` | 1 | **물리 삭제** |
| `docs/knowledge/*.md` | 7 | 기록 문서 — 코드 동작 무관, 변경 불필요 |
| SOUL 엔진 / 라우트 / 서버 JS | **0** | 참조 없음 |
| DREAMTOWN_STATUS.md | 1 | §현황 갱신 |

---

## §4 배편 안내 수정

**이전**: '백야선착장 출발' 일괄 적용 방식  
**이후**: 모든 Zone 7 장소 coordNote = '배편 필수 · 섬별 출발항, 운항 일정 및 물때 확인'  
장소별 출발항은 검증된 경우에만 개별 표시.

---

## §5 신규 장소 좌표 정책

| 장소 | 좌표 상태 | 이유 |
|------|-----------|------|
| 금오도 | PLACEMENT_OPEN | overview 이미지 범위 내 위치 미확인 |
| 거문도 | PLACEMENT_OPEN | overview 이미지 범위 내 위치 미확인 |
| 백도 | PLACEMENT_OPEN | overview 이미지 범위 내 위치 미확인 |
| 개도 | PLACEMENT_OPEN | overview 이미지 범위 내 위치 미확인 |

임의 좌표 생성 금지 — Founder QA 편집기에서 위치 지정 후 저장.

---

## §6 전체 Inventory 현황

| 구분 | 수량 |
|------|------|
| 직전 Inventory (Zone 6 정리 후) | 46곳 |
| hwajung_island 제거 | -1 |
| geumo·geomundo·baekdo·gaedo 신규 | +4 |
| **현재 Inventory** | **49곳** |
| Zone 7 QA 편집 대상 | **6곳** |
| 이미지 밖 가짜 마커 | **0건** |
| 타 권역 마커 혼입 | **0건** |

---

## §7 검증

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 698 modules |
| Jest 회귀 | ✅ 639/640 (R20 PRE-EXISTING) |
| 사도·하화도 좌표 불변 | ✅ PROVISIONAL 저장 완료 |
| 화정도서 Zone 7 목록·QA 제외 | ✅ 물리 삭제 (런타임 참조 0) |
| 금오·거문·백도·개도 등록 | ✅ PLACEMENT_OPEN |
| 거문도·백도 독립 place_id | ✅ (geomundo_island / baekdo_island 별도) |
| 이미지 밖 가짜 마커 | ✅ 0건 |
| TG_READY / SOUL 게이팅 불변 | ✅ |
| Zone 1~6 기능·좌표 불변 | ✅ |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
