# MAP V0.1 — Boundary Founder QA View Evidence

**Date**: 2026-10-26  
**Status**: MAP_V01_BOUNDARY_FOUNDER_QA_VIEW_READY  
**목적**: Founder가 실제 앱 화면에서 Zone 1·2 PROVISIONAL 경계를 직접 확인할 수 있는 로컬 전용 QA Preview

---

## §1 접근 방법

```
1. 로컬 서버 실행: npm run dev (또는 기존 실행 중이면 불필요)
2. 브라우저: http://localhost:5000/muyojeong?qa_preview=boundary
3. "지역별 탐색" 탭 진입
4. "원도심 해안권" 또는 "오동도·엑스포권" 클릭
5. 경계 점선 + 장소 마커 확인
```

---

## §2 QA Preview 시각 요소

| 요소 | Zone 1 | Zone 2 |
|------|--------|--------|
| 경계 점선 색상 | 청록 `#6EB8FF` (Zone 1 color) | 하늘 `#B8F4FF` (Zone 2 color) |
| 경계 점선 스타일 | strokeDasharray 0.020/0.010, strokeWidth 0.007 | 동일 |
| 장소 마커 — GPS 확인 | 파란 원 (r=10px) | 파란 원 |
| 장소 마커 — 충돌 가능 | — | 주황 원 (엑스포공원·스카이타워) |
| 장소 마커 — null 추정 | 회색 원 (r=10px) | 회색 원 |
| 기준점 | — | 금색 원 ★ (r=16px, 오동도) |
| QA 배너 | "⚠ 검수용 미확정 경계 — 로컬 개발환경 전용 / Founder 검수 전 미공개 / PROVISIONAL" | 동일 |
| 컨테이너 테두리 | 주황 `rgba(255,160,0,0.35)` | 동일 |

---

## §3 보안 설계

| 항목 | 방어 방법 |
|------|----------|
| 프로덕션 비활성화 | `import.meta.env.DEV` — Vite 빌드 시 `false`로 치환 → dead-code 제거 |
| URL 파라미터 단독 우회 불가 | `DEV && param` — 프로덕션에서 DEV=false → 파라미터 무시 |
| 경계 PROVISIONAL 표시 제한 | `showBoundary`/`showZoneBoundary`/`showOldtownBoundary` 조건 모두 `isQAPreview &&` 포함 |
| 일반 사용자 화면 | VERIFIED 게이팅 유지 — `boundary?.status === 'VERIFIED'` 조건 그대로 |

---

## §4 코드 변경 범위

### `yeosuMapData.js`
- Zone 1 boundary: `UNVERIFIED` + null points → `PROVISIONAL` + oldtown 6-point polygon
- Zone 2 boundary: `UNVERIFIED` + null points → `PROVISIONAL` + oldtown 6-point polygon
- `QA_OLDTOWN_POSITIONS` export 추가 (16개 장소 위치 데이터)

### `YeosuMapSelector.jsx`
- `QA_OLDTOWN_POSITIONS` import 추가
- `isQAPreview` const (main component): `import.meta.env.DEV && URLSearchParams`
- `ZoneOverview`: `isQAPreview` prop 추가, `showBoundary` 조건 확장
- `ZoneDetail`: `isQAPreview` prop 추가, PROVISIONAL boundary + QA 마커 + QA 배너
- `YeosuMapSelector`: `isQAPreview` 계산 및 하위 컴포넌트 prop 전달

---

## §5 검증 결과

| 항목 | 결과 |
|------|------|
| 빌드 | ✅ `698 modules` (exit 0) |
| 회귀 테스트 | ✅ 615/616 PASS (R20 PRE-EXISTING 유지) |
| 일반 화면 VERIFIED 게이팅 | ✅ 변경 없음 — `boundary?.status === 'VERIFIED'` 그대로 |
| 프로덕션 비활성 | ✅ `import.meta.env.DEV=false` dead-code 제거 확인 |
| Zone 1 boundary imageId | ✅ `yeosu-oldtown-v01` (oldtown 좌표계) |
| Zone 2 boundary imageId | ✅ `yeosu-oldtown-v01` (기존 유지) |
| QA_OLDTOWN_POSITIONS 구조 | ✅ Zone 1: 8곳, Zone 2: 6곳 |

---

## §6 Founder 검수 항목 (QA Preview에서 확인)

| ID | 확인 방법 | 내용 |
|----|----------|------|
| F-1 | Zone 1 진입 후 파란 원 위치 | 이순신광장(x≈30%,y≈51%) 위치 맞는가? |
| F-2 | Zone 1 진입 후 파란 원 위치 | 하멜등대(x≈52%,y≈68%) 위치 맞는가? |
| F-3 | Zone 1 청록 점선 | 원도심 범위 커버 여부 |
| F-4 | Zone 2 주황 원 위치 | 오동도(★, x≈87%,y≈28%) 위치 맞는가? |
| F-5 | Zone 2 경계 + 노란 원 | 엑스포공원·스카이타워가 경계 서쪽? → 경계 x=0.45로 이동 필요한가? |
| F-6 | Zone 1 회색 원 | 진남관·오포대·수산시장 위치 대략 맞는가? |
| F-7 | 전체 경계 | 서쪽·남쪽 경계가 너무 좁거나 넓은가? |

---

## §7 다음 단계

1. Founder가 `localhost:5000/muyojeong?qa_preview=boundary`에서 F-1~F-7 확인
2. 피드백 → `yeosuMapData.js` `QA_OLDTOWN_POSITIONS` + boundary points 수정
3. 재확인 → Founder 승인
4. `boundary.status: 'VERIFIED'` 승격 → 일반 화면 적용
