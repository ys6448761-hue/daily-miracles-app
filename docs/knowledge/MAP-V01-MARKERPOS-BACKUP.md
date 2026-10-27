# MAP V0.1 — markerPos 백업 (CLEAN RESTART 전)

**Date**: 2026-10-27  
**Decision**: MAP_V01_MARKER_CLEAN_RESTART_APPROVED  
**Git 체크포인트**: SHA `72367ee` (CLEAN RESTART 직전)  
**목적**: 초기화 전 모든 PROVISIONAL markerPos 값 보존 (복구 가능)

---

## 백업된 markerPos 값 (전부 PROVISIONAL)

| place_id | x | y | 출처 | 비고 |
|----------|---|---|------|------|
| lee_soon_shin_plaza | 0.255 | 0.540 | 흰 원 기준 (픽셀 추출 불가) | Founder 재확인 필요 |
| romantic_pojangmacha | 0.593 | 0.599 | 그림판 PNG "낭만포다" px(928,603)/1564×1006 | |
| hamel_lighthouse | 0.519 | 0.718 | 그림판 PNG "하멜등다" px(812,722)/1564×1006 | |
| marine_park | 0.387 | 0.509 | 그림판 PNG "종해양공원" px(605,512)/1564×1006 | |
| odongdo | 0.853 | 0.340 | MAP-V01-MARKER-PLAN §2-1 (등대+방파제) | |
| cablecar | 0.690 | 0.570 | AMBIGUOUS — 자산탑승장 위치 불확실 | |
| jaisan_park | 0.582 | 0.495 | 시각 추정 | |

**markerPos 없음 (미지정 상태):**
- yeosu_expo_park
- sky_tower

---

## 미배치 PLACEMENT_TARGETS (9곳)

| place_id | name_ko | zone | 비고 |
|----------|---------|------|------|
| yeosu_expo_park | 엑스포공원 | 2 | markerPos 없음 |
| sky_tower | 스카이타워 | 2 | markerPos 없음 |
| opodae | 오포대 | 1 | EXPLORER, markerPos 없음 |
| jinamgwan | 진남관 | 1 | EXPLORER, markerPos 없음 |
| aquaplanet | 아쿠아플라넷 | 2 | EXPLORER, markerPos 없음 |
| big_o_show | 빅오쇼 | 2 | EXPLORER, markerPos 없음 |
| nangman_yacht | 낭만요트 | 2 | EXPLORER, markerPos 없음 |
| blue_yacht | 블루요트 | 2 | EXPLORER, markerPos 없음 |

---

## 복구 방법

Git history에서 `72367ee` 이전 커밋 체크아웃 후 해당 값 복원 가능.

---

## 로컬 초안 현황

DRAFT_KEY v01 (`yeosu_map_draft_v01_oldtown`): Founder 브라우저에 있을 수 있음.  
CLEAN RESTART 후 DRAFT_KEY는 v02로 변경 → v01 초안은 새 편집기에서 자동 복원되지 않음 (격리).  
v01 초안이 필요하면: Founder 브라우저 DevTools → Application → localStorage → `yeosu_map_draft_v01_oldtown` 확인.
