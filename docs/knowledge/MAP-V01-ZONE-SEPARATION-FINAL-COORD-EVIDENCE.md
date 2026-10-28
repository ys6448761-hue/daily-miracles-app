# MAP V0.1 — Zone Separation & Final Coordinate Alignment

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE_SEPARATION_VERIFIED  
**Classification**: REPAIR (권역 분리 버그 수정) + EXTEND (Founder 최종 좌표 15/15 반영)  
**Commit**: (pending)

---

## §1 변경 요약

| 항목 | 이전 상태 | 이후 상태 |
|------|-----------|-----------|
| Zone 1 지도 표시 마커 | Zone 1+2 합산 15개 | Zone 1 전용 **6개** |
| Zone 2 지도 표시 마커 | Zone 1+2 합산 15개 | Zone 2 전용 **9개** |
| 15곳 좌표 | 2026-10-27 PROVISIONAL | Founder 최종 좌표 2026-10-29 반영 |
| qaPlaces 필터 | `zone 1||2` 전체 표시 | 현재 권역(`zoneId`) 전용 |

---

## §2 Zone 분리 버그 분석 (C)

### 원인

`YeosuMapSelector.jsx` 기존 마커 렌더링 필터 (line 696 → 695):

```javascript
// BUG: hasDetailMap=true인 Zone 1, Zone 2 모두 조건 통과 → 양쪽에서 15개 렌더링
markers.filter(m => zone.hasDetailMap ? (m.zone === 1 || m.zone === 2) : m.zone === zone.id)
```

Zone 1과 Zone 2 모두 `hasDetailMap: true` (oldtown 이미지 공유)이므로 두 권역 모두에서 `(m.zone === 1 || m.zone === 2)` 조건이 참 → 15개 전체 표시.

### 수정

```javascript
// FIX: 현재 권역 마커만 표시
markers.filter(m => m.zone === zone.id)
```

### qaPlaces 필터 동시 수정

```javascript
// BUG:
(p.zone === 1 || p.zone === 2)
// FIX:
p.zone === zoneId
```

QA Preview 기준점도 현재 권역 전용으로 제한 (DEV 전용 기준점이 다른 권역에 혼입되는 문제 방지).

---

## §3 Zone 2 Drift 조사 결론 (D)

### Founder 보고

"Zone 2 편집 화면 대비 일반 지도에서 마커가 왼쪽·아래쪽으로 밀려 보임."

### 조사 결과

**구조적 원인 없음** — Zone 1과 Zone 2는 동일한 HTML/CSS 레이아웃을 사용:

| 항목 | Zone 1 | Zone 2 |
|------|--------|--------|
| 이미지 파일 | `yeosu-oldtown-v01.png` | `yeosu-oldtown-v01.png` (동일) |
| 컨테이너 paddingTop | `64.32%` | `64.32%` (동일) |
| objectFit | `fill` | `fill` (동일) |
| 마커 위치 공식 | `left: x*100%, top: y*100%` | `left: x*100%, top: y*100%` (동일) |
| 클릭 좌표 계산 | `mapWrapperRef.getBoundingClientRect()` | 동일 |

**실제 원인**: Zone 1+2 혼합 렌더링 버그로 인해 Founder가 Zone 2 마커를 Zone 1 지도 뷰에서 확인하면서 Zone 1 마커들의 상대적 위치로 오인한 것으로 추정.

**해결**: 권역 분리 수정 후 Zone 2 지도에서 Zone 2 마커 9개만 표시 → Founder 최종 좌표로 갱신하여 정합.

---

## §4 Founder 최종 좌표 15/15 (Founder 2026-10-29)

### Zone 1 (6곳)

| place_code | 이전 x,y | 최종 x,y | 변경 |
|------------|----------|----------|------|
| lee_soon_shin_plaza | 0.391, 0.544 | **0.401, 0.549** | ↑ |
| romantic_pojangmacha | 0.612, 0.642 | **0.613, 0.640** | 미세 |
| hamel_lighthouse | 0.563, 0.620 | **0.564, 0.634** | ↑ |
| jinamgwan | 0.380, 0.470 | **0.391, 0.474** | ↑ |
| opodae | 0.453, 0.530 | **0.476, 0.549** | ↑ |
| marine_park | 0.447, 0.577 | **0.474, 0.601** | ↑ |

### Zone 2 (9곳)

| place_code | 이전 x,y | 최종 x,y | 변경 |
|------------|----------|----------|------|
| odongdo | 0.859, 0.397 | **0.853, 0.392** | 미세 |
| cablecar | 0.657, 0.529 | **0.660, 0.544** | ↑ |
| yeosu_expo_park | 0.551, 0.195 | **0.558, 0.211** | ↑ |
| sky_tower | 0.604, 0.152 | **0.604, 0.137** | ↑ |
| jaisan_park | 0.586, 0.535 | **0.581, 0.537** | 미세 |
| aquaplanet | 0.563, 0.334 | **0.586, 0.326** | ↑ |
| nangman_yacht | 0.643, 0.419 | **0.657, 0.430** | ↑ |
| blue_yacht | 0.607, 0.435 | **0.627, 0.414** | ↑ |
| big_o_show | 0.529, 0.296 | **0.549, 0.285** | ↑ |

모든 좌표: `confidence: 'HIGH', status: 'PROVISIONAL'` 유지.

---

## §5 브라우저 검증 결과 (puppeteer incognito)

**테스트**: `tests/zone-separation-verify.js`  
**결과**: 19/19 PASS

| 테스트 ID | 내용 | 결과 |
|-----------|------|------|
| T-Z1 | Zone 1 마커 수 = 6개만 | ✅ PASS |
| T-Z2 | Zone 2 마커 수 = 9개만 | ✅ PASS |
| T-Z3 | Zone 1에 Zone 2 마커 없음 | ✅ PASS |
| T-Z4 | Zone 2에 Zone 1 마커 없음 | ✅ PASS |
| T-C-1~15 | 15곳 최종 좌표 소스=렌더 일치 | ✅ 15/15 PASS |

**19/19 PASS**

---

## §6 빌드 + 회귀

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 698 modules |
| Jest 회귀 | ✅ 639/640 PASS (R20 PRE-EXISTING 유지) |

---

## §7 안전 조건

| 항목 | 상태 |
|------|------|
| PROVISIONAL 유지 | ✅ 15곳 전체 |
| VERIFIED 자동 승격 | ✅ 없음 |
| Inventory 45 / TG_READY 12 / 7권역 | ✅ 유지 |
| SOUL 게이팅 (isSelectablePlace) | ✅ 변경 없음 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §8 Founder 다음 액션

| 항목 | 액션 |
|------|------|
| Zone 1 마커 위치 확인 | Zone 1 QA Preview → 6개 마커 시각 확인 |
| Zone 2 마커 위치 확인 | Zone 2 QA Preview → 9개 마커 시각 확인 |
| VERIFIED 승격 | 마커 위치 확인 후 코드야에게 승격 요청 |
