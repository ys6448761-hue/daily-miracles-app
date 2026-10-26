# MAP V0.1 — Oldtown Boundary Overlay Evidence

**Date**: 2026-10-26  
**Status**: MAP_V01_OLDTOWN_BOUNDARY_OVERLAY_READY  
**산출물**: `docs/knowledge/MAP-V01-OLDTOWN-BOUNDARY-OVERLAY.png`  
**생성 스크립트**: `scripts/generate_boundary_overlay.py`

---

## §1 이미지 생성 조건

| 항목 | 값 |
|------|-----|
| 원본 이미지 | `yeosu-oldtown-v01.png` (1564×1006 RGBA) |
| 보정 기준점 | 오동도 x=0.87, y=0.28 (CONFIRMED) |
| 불확실도 | HIGH (단일 기준점 역산) |
| 원본 PNG 수정 | 없음 (overlay만 새 파일로 저장) |

---

## §2 오버레이 시각 구성

| 요소 | 색상·스타일 | 의미 |
|------|-----------|------|
| 청록 점선 폴리곤 | teal `#1EC8B4` | Zone 1 원도심 PROVISIONAL 경계 |
| 주황 점선 폴리곤 | orange `#FF8C28` | Zone 2 오동도·엑스포 PROVISIONAL 경계 |
| 보라 세로 점선 | purple `#B450DC` | Zone 1/2 추정 분리선 (x≈0.585) |
| 파란 채운 원 | blue `#50C8FF` | 확인된 GPS 좌표 장소 |
| 주황-노란 채운 원 | amber | ⚠ 경계 충돌 가능 (Zone 2이지만 경계 서쪽) |
| 회색 속 빈 원 | gray | 미검증 위치 추정 (null coords) |
| 금색 십자 원 | gold | ★ 기준점 오동도 (CONFIRMED) |

---

## §3 시각 검증 — 이미지 표출 결과

이미지(`MAP-V01-OLDTOWN-BOUNDARY-OVERLAY.png`) 렌더링 결과 관찰:

### 위치 적합성 (보조 검토)
- **오동도(★)**: 이미지 오른쪽 섬 위에 정확히 표시 → CONFIRMED 기준점 일치 ✅
- **이순신광장**: 항만 좌측 부두 근처 위치 → 지리적으로 적합해 보임 (Founder 확인 필요)
- **하멜등대**: 이미지 하단 방파제 등대 구조물 근처 → 형태 확인 가능
- **케이블카(자산)**: 오동도 서쪽 항만 시설 근처 → 적합 추정
- **낭만포차거리**: 항구 안쪽 매립지 근처

### 충돌 구간 관찰
- **엑스포공원·스카이타워**: Zone 1/2 분리선(x≈0.585) **서쪽**에 표시됨
  → 이 두 곳은 Zone 2 소속인데 Zone 1 경계 안에 들어온 형태
  → 원인 후보 ①: 보정 오차 (경계선 x값 과대 추정)
  → 원인 후보 ②: 경계선을 x≈0.45로 이동해야 함
  → **Founder 판단 필요**

### 미검증 좌표 표시
- **진남관·오포대·수산시장**: 이미지 좌측에 회색 마커로 표시
  - 진남관(0.28, 0.58): 구시가지 느낌의 위치 — 합리적이나 확인 필요
  - 오포대(0.38, 0.67): 고소동 언덕 방향 — 추정
  - 수산시장UV-2(0.25, 0.50): 항만 서쪽 — UV-2 미검증 유지

---

## §4 PROVISIONAL 좌표 요약 (코드 적용 대기)

### Zone 1 경계 후보 (oldtown, PROVISIONAL)
```js
boundary: {
  imageId: 'yeosu-oldtown-v01',
  points: [
    { x: 0.10, y: 0.38 },  // NW: 이순신광장 북서 항만
    { x: 0.57, y: 0.38 },  // NE: 종포해양공원 북 (Zone 1/2 상단 경계)
    { x: 0.60, y: 0.55 },  // E:  하멜등대·종포 동쪽
    { x: 0.56, y: 0.76 },  // SE: 하멜등대 남동
    { x: 0.28, y: 0.82 },  // S:  낭만포차거리 남측
    { x: 0.10, y: 0.65 },  // SW: 이순신광장 남서 해안
  ],
  status: 'PROVISIONAL',
  source: 'oldtown-boundary-overlay-2026-10-26 (odongdo single-ref)'
}
```

### Zone 2 경계 후보 (oldtown, PROVISIONAL)
```js
boundary: {
  imageId: 'yeosu-oldtown-v01',
  points: [
    { x: 0.57, y: 0.38 },  // NW: Zone 1/2 상단 경계
    { x: 0.90, y: 0.15 },  // NE: 오동도 북동
    { x: 0.95, y: 0.45 },  // E:  이미지 오른쪽 경계
    { x: 0.80, y: 0.82 },  // SE: 이미지 하단 우측
    { x: 0.60, y: 0.76 },  // SW: Zone 1/2 하단 경계
    { x: 0.60, y: 0.55 },  // W:  Zone 1/2 경계 (하멜등대 동쪽)
  ],
  status: 'PROVISIONAL',
  source: 'oldtown-boundary-overlay-2026-10-26 (odongdo single-ref)'
}
```

---

## §5 불확실 구간 정리

| 구간 | 불확실 이유 | 영향 |
|------|-----------|------|
| Zone 1 NW (x<0.15) | 항만 서쪽이 이미지에 포함되는지 불명 | 이순신광장 서쪽 경계 |
| Zone 1 S (y>0.80) | 하멜등대 남쪽 이미지 하단 미확인 | 남쪽 경계 |
| Zone 1/2 분리선 x값 | 엑스포공원(x0.48)이 경계 서쪽에 위치하는 충돌 | 경계선 위치 재조정 필요 가능성 |
| Zone 2 SE | 케이블카 돌산방향 하단 범위 불명 | SE 꼭짓점 |
| 진남관·오포대·수산시장 | null 좌표 — 위치 추정만 | Zone 1 경계 내 포함 여부 |

---

## §6 Founder 검수 요청

이미지(`MAP-V01-OLDTOWN-BOUNDARY-OVERLAY.png`) 확인 후 아래 항목 피드백:

| ID | 확인 항목 |
|----|----------|
| **F-1** | 이순신광장 파란 원 위치가 실제 광장에 맞는가? |
| **F-2** | 하멜등대 파란 원이 등대 위치에 맞는가? |
| **F-3** | Zone 1 청록 점선이 원도심 범위를 대략 커버하는가? |
| **F-4** | Zone 2 주황 점선이 오동도·엑스포 범위를 포함하는가? |
| **F-5** | 엑스포공원·스카이타워(노란 원) 충돌 — 경계선을 좌측(x≈0.45)으로 이동해야 하는가? |
| **F-6** | 진남관·오포대·수산시장(회색 원) 위치 대략 맞는가? |
| **F-7** | Zone 1 서쪽 경계(x=0.10): 너무 좁거나 넓은가? |

**피드백 방법**: 이미지 보고 F-번호로 OK/수정사항 전달  
승인 후 → `status: 'PROVISIONAL'` 코드 적용 + 개발 환경 확인 진행

---

## §7 다음 단계 (Founder 검수 후)

1. F-1~F-7 피드백 수령
2. 좌표 보정 (필요 시 재생성)
3. `yeosuMapData.js` Zone 1·2 boundary 좌표 + imageId 업데이트
4. 개발 환경에서 PROVISIONAL 임시 렌더링 확인
5. Founder 승인 → `status: 'VERIFIED'` 승격 → 서비스 적용
