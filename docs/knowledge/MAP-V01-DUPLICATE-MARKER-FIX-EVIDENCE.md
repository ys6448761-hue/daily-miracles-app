# MAP V0.1 — Duplicate Marker Rendering Fix Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_DUPLICATE_MARKERS_REMOVED  
**SHA**: `d67df29`  
**Classification**: REPAIR

---

## §1 중복 원인

### 렌더링 경로 3개

| 경로 | 소스 | 조건 | 스타일 |
|------|------|------|--------|
| Path 1: `markers` | `getMarkersForImage('oldtown')` → `YEOSU_PLACES[].markerPos.oldtown` | QA Preview: PROVISIONAL 포함 / 일반: VERIFIED만 | 흰/주황 원 |
| Path 2: `qaPlaces` | `QA_OLDTOWN_POSITIONS` | `!placementMode && isQAPreview` | 파란/주황/금/회색 원 |
| Path 3: `candidates` | localStorage draft | `placementMode` 전용 | 녹색 원 |

### 중복 발생 조건

`isQAPreview=true` + `!placementMode` 시:
- Path 1: 15곳 `markerPos` 기반 주황 원 (Founder 신규 좌표)
- Path 2: `QA_OLDTOWN_POSITIONS` 기반 구버전 참조점 (파란/주황/회색 원)

동일 place_id 12곳이 서로 다른 좌표에 2번 렌더링됨 → 혼재된 마커 표시

### Founder가 본 현상
- 주황색 마커(Path 1) + 파란/회색/주황 마커(Path 2)가 겹쳐 보임
- 같은 장소가 두 점으로 나타남

---

## §2 수정 내용

**파일**: `YeosuMapSelector.jsx` line 355-361

**변경 전**:
```javascript
// oldtown 이미지: Zone 1·2 장소 기준점 모두 표시
const qaPlaces = isQAPreview && zone?.hasDetailMap
  ? Object.entries(QA_OLDTOWN_POSITIONS).filter(([, p]) => p.zone === 1 || p.zone === 2)
  : [];
```

**변경 후**:
```javascript
// oldtown 이미지: Zone 1·2 중 markerPos 미반영 장소만 QA 기준점 표시
// markerPos가 있는 장소는 markers 경로에서 이미 렌더링 → QA 참조점 중복 제거
const qaPlaces = isQAPreview && zone?.hasDetailMap
  ? Object.entries(QA_OLDTOWN_POSITIONS).filter(([code, p]) =>
      (p.zone === 1 || p.zone === 2) &&
      !YEOSU_PLACES.find(pl => pl.code === code)?.markerPos?.oldtown
    )
  : [];
```

---

## §3 제거된 QA 참조점 (12곳)

| place_id | name_ko | 제거 이유 |
|----------|---------|-----------|
| lee_soon_shin_plaza | 이순신광장 | markerPos 반영됨 |
| romantic_pojangmacha | 낭만포차거리 | markerPos 반영됨 |
| hamel_lighthouse | 하멜등대 | markerPos 반영됨 |
| marine_park | 종포해양공원 | markerPos 반영됨 |
| jinamgwan | 진남관 | markerPos 반영됨 |
| opodae | 오포대 | markerPos 반영됨 |
| odongdo | 오동도 | markerPos 반영됨 |
| cablecar | 케이블카 | markerPos 반영됨 |
| yeosu_expo_park | 엑스포공원 | markerPos 반영됨 |
| sky_tower | 스카이타워 | markerPos 반영됨 |
| jaisan_park | 자산공원 | markerPos 반영됨 |
| aquaplanet | 아쿠아플라넷 | markerPos 반영됨 |

## §4 유지된 QA 참조점 (3곳)

| place_id | name_ko | 이유 |
|----------|---------|------|
| gosodong_mural | 고소동 천사벽화골목 | markerPos 없음 — 참조점 필요 |
| yeosu_fish_market | 여수 수산시장 | markerPos 없음 (UV-2) |
| yeosu_expo_station | 여수엑스포역 | markerPos 없음 |

---

## §5 검증

| 항목 | 결과 |
|------|------|
| 동일 place_id 중복 마커 | **0건** (markerPos 있는 12곳에서 QA 참조점 제거됨) |
| Founder 지정 15개 x/y 불변 | ✅ yeosuMapData.js 변경 없음 |
| Path 3 (candidates) 분리 | ✅ placementMode 전용 유지 |
| 선택/해제 기능 | ✅ markers 경로 변경 없음 |
| 빌드 | ✅ 698 modules |
| 회귀 | ✅ 639/640 PASS (R20 PRE-EXISTING) |

---

## §6 안전 조건

| 항목 | 상태 |
|------|------|
| Inventory 45 / TG_READY 12 / 7권역 | ✅ 유지 |
| SOUL 게이팅 / DB·Schema | ✅ 변경 없음 |
| markerPos 15곳 PROVISIONAL | ✅ 유지 |
| VERIFIED 자동 승격 | ✅ 없음 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
