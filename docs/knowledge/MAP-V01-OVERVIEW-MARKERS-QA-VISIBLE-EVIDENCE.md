# MAP V0.1 — Overview Markers QA Visible Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_OVERVIEW_MARKERS_QA_VISIBLE  
**Classification**: REPAIR — getMarkersForImage confidence 게이트 + Zone 3 Founder 좌표 SOURCE_SAVED

---

## §1 근본 원인 (Root Cause)

`yeosuMapData.js:243` — `getMarkersForImage` confidence 필터:

```javascript
// 이전 (버그)
p.markerPos[imageKey].confidence === 'HIGH'

// 이후 (수정)
conf === 'HIGH' || (includeProvisional && conf === 'PROVISIONAL')
```

**oldtown 마커**: `confidence: 'HIGH'` → 항상 통과 (Zone 1/2 정상이었던 이유)  
**overview 마커**: `confidence: 'PROVISIONAL'` → 이전 필터에서 전부 차단 → 0개  

---

## §2 변경 내용

### yeosuMapData.js — getMarkersForImage 수정
```javascript
export function getMarkersForImage(imageKey, { includeProvisional = false } = {}) {
  return YEOSU_PLACES.filter(p => {
    if (p.hidden || !p.markerPos || !p.markerPos[imageKey]) return false;
    const conf = p.markerPos[imageKey].confidence;
    return conf === 'HIGH' || (includeProvisional && conf === 'PROVISIONAL');
  });
}
```

### YeosuMapSelector.jsx — 두 호출부 수정
```javascript
// oldtown (line 402):
const markers = getMarkersForImage('oldtown', { includeProvisional: isQAPreview });

// overview (line 880):
const overviewMarkers = getMarkersForImage('overview', { includeProvisional: isQAPreview });
```

**표시 정책 유지**:
- 공개 모드: `confidence: 'HIGH'`만 (기존 정책 불변)
- QA Preview: `'HIGH'` + `'PROVISIONAL'` 모두 표시

### yeosuMapData.js — Zone 3 Founder 좌표 5곳 SOURCE_SAVED
| place_code | x | y | 비고 |
|------------|---|---|------|
| dolsan_daegyo | 0.639 | 0.518 | Founder 제공 |
| dolsan_nightscape | 0.681 | 0.539 | Founder 제공 |
| museukmok | 0.701 | 0.615 | Founder 제공 |
| cablecar_dolsan | 0.678 | 0.531 | Founder 제공 |
| artland_resort | 0.740 | 0.580 | Founder 제공 |

---

## §3 Zone별 SOURCE_SAVED 현황

| Zone | Inventory 수 | SOURCE_SAVED 수 | QA 표시 수 | 공개 표시 수 | OPEN 사유 |
|------|-------------|----------------|-----------|------------|---------|
| Zone 1 (원도심) | 8 | 6 (HIGH) | 6 | 6 | 고소동벽화·수산시장 좌표 없음 |
| Zone 2 (오동도) | 13 | 9 (HIGH) | 9 | 9 | 4곳 좌표 없음 |
| Zone 3 (돌산권) | 7 | 5 (PROVISIONAL) | 5 | 0 | 미남·이사부 좌표 없음 |
| Zone 4 (향일암권) | 4 | 0 | 0 | 0 | Founder 좌표 미제공 |
| Zone 5 (소호·장도) | 6 | 0 | 0 | 0 | Founder 좌표 미제공 |
| Zone 6 (화양·여자만) | 4 | 4 (PROVISIONAL) | 4 | 0 | PROVISIONAL — 공개 게이트 미통과 |
| Zone 7 (섬섬길) | 6 | 2 (PROVISIONAL) | 2 | 0 | 금오·거문·백도·개도 PLACEMENT_OPEN |

**Zone 3/6/7 공개 표시 0**: `confidence: 'PROVISIONAL'`은 공개 게이트 미통과 — 의도된 정책. QA Preview에서만 표시.

---

## §4 Puppeteer 검증 결과 (Zone별 QA Preview)

| Zone | 실제 QA 표시 | 레이블 예시 | 타 권역 혼입 |
|------|------------|-----------|------------|
| Zone 1 | 6 | 이순신광장 선택(QA)/낭만포차 선택(QA)/하멜등대 선택(QA)/... | 0 |
| Zone 2 | 9 | 오동도 선택(QA)/케이블카 선택(QA)/... | 0 |
| Zone 3 | 5 | 돌산대교 선택(QA)/돌산공원 선택(QA)/무슬목 탐색/돌산탑승장 탐색/예술랜드 위치미검증 | 0 |
| Zone 4 | 0 | — | 0 |
| Zone 5 | 0 | — | 0 |
| Zone 6 | 4 | 가사리/여자만/섬달천/화양드라이브 위치미검증 | 0 |
| Zone 7 | 2 | 사도/하화도 위치미검증 | 0 |

---

## §5 검증

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 698 modules |
| Jest 회귀 | ✅ 639/640 (R20 PRE-EXISTING) |
| Zone 3 QA 마커 5개 | ✅ Puppeteer 확인 |
| Zone 6 QA 마커 4개 | ✅ Puppeteer 확인 |
| Zone 7 QA 마커 2개 | ✅ Puppeteer 확인 |
| 타 권역 마커 혼입 | ✅ 0건 |
| Zone 1/2 불변 (6+9) | ✅ |
| 공개 모드 PROVISIONAL 차단 | ✅ (isQAPreview=false 시 필터 통과 불가) |
| TG_READY 게이팅 불변 | ✅ |
| VERIFIED 자동 승격 | ✅ 없음 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §6 Founder 다음 액션

Zone 4·5 좌표 미제공 — QA Preview에서 위치 지정 모드로 좌표 지정 후 내보내기 → 코드야 전달.  
Zone 3 overview 좌표 PROVISIONAL → VERIFIED 승격은 별도 Founder 확인 후 결정.
