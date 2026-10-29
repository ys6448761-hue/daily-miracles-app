# MAP V0.1 — Overview 2× Zoom Center Fix Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_OVERVIEW_ZONE_CENTERED_ZOOM_PASS  
**Classification**: REPAIR — 2× 확대 시 권역 중심 이탈 버그 수정

---

## §1 문제 정의

| 항목 | 내용 |
|------|------|
| 증상 | Zone 3 돌산권에서 2× 확대 시 돌산도 대신 서쪽 해역·화양 방면으로 화면이 치우침 |
| 원인 | `width: 200%` + `overflowX: auto` 구조 — 항상 이미지 왼쪽부터 표시 |
| 영향 | 전체 overview 권역 (Zone 3~7) 및 oldtown 권역 (Zone 1·2) |

---

## §2 수정 내용

### 변경 파일
`dreamtown-frontend/src/components/YeosuMapSelector.jsx`

### 추가 상수 (line 54~68)

```javascript
const OVERVIEW_ZONE_ZOOM_CENTERS = {
  3: { x: 0.62, y: 0.58 }, // 돌산도 중심 — PROVISIONAL
  4: { x: 0.75, y: 0.90 }, // 향일암 — PROVISIONAL
  5: { x: 0.50, y: 0.33 }, // 소호·장도 — PROVISIONAL
  6: { x: 0.15, y: 0.42 }, // 화양·여자만 — PROVISIONAL
  7: { x: 0.55, y: 0.70 }, // 섬섬길 — PROVISIONAL
};
const OLDTOWN_ZONE_ZOOM_CENTERS = {
  1: { x: 0.49, y: 0.58 }, // Zone 1 Founder 마커 6곳 평균
  2: { x: 0.63, y: 0.36 }, // Zone 2 Founder 마커 9곳 평균
};
```

### 수정 패턴 (oldtown·overview 공통)

| 항목 | 이전 | 이후 |
|------|------|------|
| 외부 div overflow | `overflowX: mapZoomed ? 'auto' : 'hidden'` | `overflow: 'hidden'` |
| 내부 div width | `mapZoomed ? '200%' : '100%'` | `'100%'` 고정 |
| 내부 div transform | 없음 | `mapZoomed ? 'scale(2)' : 'none'` |
| 내부 div transformOrigin | 없음 | `${c.x*100}% ${c.y*100}%` (권역별) |
| 내부 div transition | 없음 | `'transform 0.25s ease'` |

---

## §3 좌표 계산 수학적 증명

CSS `transform: scale(2)` 적용 시 `getBoundingClientRect()` 반환값:
- `rect.left = L - W*cx`, `rect.width = 2W` (W=원본 너비, cx=transformOrigin x)

calcNorm 계산:
```
(clientX - rect.left) / rect.width
= (clientX - L + W*cx) / 2W
= true normalized image coordinate ✅
```

**결론: calcNorm 변경 불필요. 좌표 정확도 유지.**

---

## §4 PROVISIONAL 좌표 근거

### OVERVIEW_ZONE_ZOOM_CENTERS

| Zone | 중심 | 근거 |
|------|------|------|
| 3 (돌산도) | x=0.62, y=0.58 | dolsan_daegyo lat=34.7395, dolsan_nightscape lat=34.7289 → 돌산도 지리적 중심 추정 |
| 4 (향일암) | x=0.75, y=0.90 | hyangiram lat=34.5914, lng=127.8038 → 이미지 남단 동쪽 |
| 5 (소호·장도) | x=0.50, y=0.33 | 시내 서편 소호요트마리나 위치 지리적 추정 |
| 6 (화양·여자만) | x=0.15, y=0.42 | 화양반도 서편 반도 지리적 추정 |
| 7 (섬섬길) | x=0.55, y=0.70 | 남해 도서 분포 지리적 추정 |

### OLDTOWN_ZONE_ZOOM_CENTERS

| Zone | 중심 | 근거 |
|------|------|------|
| 1 | x=0.49, y=0.58 | Founder PROVISIONAL 마커 6곳 x/y 평균 |
| 2 | x=0.63, y=0.36 | Founder PROVISIONAL 마커 9곳 x/y 평균 |

**모든 좌표 PROVISIONAL — Founder 확인 후 갱신 가능**

---

## §5 검증

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 698 modules |
| Jest 회귀 | ✅ 639/640 PASS (R20 PRE-EXISTING) |
| Zone 1·2 좌표 15곳 불변 | ✅ |
| PROVISIONAL 유지 | ✅ |
| VERIFIED 자동 승격 | ✅ 없음 |
| SOUL 게이팅 (isSelectablePlace) | ✅ 변경 없음 |
| calcNorm 변경 | ✅ 없음 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §6 안전 조건

- `markerPos` 저장 좌표 변경 없음 — calcNorm 수식 동일
- `isSelectablePlace()` (SOUL 게이팅) 변경 없음
- Zone 1·2 Founder PROVISIONAL 좌표 15곳 불변
- PROVISIONAL → VERIFIED 자동 승격 없음
- 임의 좌표 생성 없음

---

## §7 Founder 확인 필요

Zone 3~7 overview 권역 중심 PROVISIONAL 좌표는 지리적 추정값.
`localhost:5000/muyojeong?qa_preview=boundary` → 각 권역 2× 확대 → 중심 위치 확인 후 코드야에게 갱신 좌표 전달.
