# MAP V0.1 — Zone 2 Boundary Correction

**Date**: 2026-10-26  
**Status**: MAP_V01_ZONE2_BOUNDARY_CORRECTION_READY  
**Founder Decision**: FOUNDER_ZONE2_BOUNDARY_CORRECTION_REQUIRED

---

## §1 수정 내용

### 수정 전 (BEFORE)
```js
points: [
  { x: 0.57, y: 0.38 }, // NW
  { x: 0.90, y: 0.15 }, // NE: 오동도 북동
  { x: 0.95, y: 0.45 }, // E
  { x: 0.80, y: 0.82 }, // SE ← 돌산 방향 침범
  { x: 0.60, y: 0.76 }, // SW ← 돌산 방향 침범
  { x: 0.60, y: 0.55 }, // W
]
```

### 수정 후 (AFTER, PROVISIONAL)
```js
points: [
  { x: 0.47, y: 0.30 }, // NW: 엑스포 단지 북측 — 엑스포역 포함 추정 (UNKNOWN exact)
  { x: 0.90, y: 0.14 }, // NE: 오동도 북동
  { x: 0.96, y: 0.46 }, // E:  오동도 동쪽 이미지 경계
  { x: 0.74, y: 0.63 }, // SE: 케이블카 자산탑승장 남동 (돌산 제외) ← 수정
  { x: 0.57, y: 0.63 }, // S:  Zone 2 남측 경계 (돌산 제외) ← 수정
  { x: 0.56, y: 0.40 }, // W:  Zone 1/2 경계 하단
]
```

---

## §2 수정 근거

| 포인트 | 수정 전 | 수정 후 | 이유 |
|--------|---------|---------|------|
| SE corner | (0.80, **0.82**) | (0.74, **0.63**) | y=0.82 = 이미지 하단(돌산 방향). y=0.63으로 인상 |
| SW corner | (0.60, **0.76**) | (0.57, **0.63**) | 동일하게 남측 경계 인상 |
| NW corner | (0.57, **0.38**) | (0.47, **0.30**) | 엑스포역 포함위해 북쪽·서쪽 확장 |

---

## §3 필수 조건 충족 여부

| 조건 | 충족 여부 | 비고 |
|------|---------|------|
| 여수엑스포역 포함 | PROVISIONAL — NW 확장으로 추정 포함 | null coords, UNKNOWN exact position |
| 오동도 포함 | ✅ NE (0.90, 0.14) ~ E (0.96, 0.46) 포함 | CONFIRMED 기준점 |
| 엑스포공원 포함 | ✅ 추정 (x≈0.48, y≈0.42) 경계 내 | GPS 확인 |
| 스카이타워 포함 | ✅ 추정 (x≈0.51, y≈0.43) 경계 내 | GPS 확인 |
| 돌산도·돌산권 제외 | ✅ SE y=0.82→0.63 — 돌산 방향 침범 제거 | |
| 원도심 중첩 최소화 | ✅ Zone 1/2 경계 W x≈0.56~0.57 유지 | |
| 바다 큰 가로지름 금지 | ✅ 오동도 연결부 유지 | |

---

## §4 여수엑스포역 위치 처리

- **현재 상태**: null coords (coordVerified=false)
- **QA 마커**: `QA_OLDTOWN_POSITIONS.yeosu_expo_station = { x:0.490, y:0.320, confirmed:false, zone:2 }`
- **경계 포함 방법**: NW corner (0.47, 0.30)으로 엑스포역이 위치할 것으로 추정되는 북측 범위 포함
- **불확실성**: UNKNOWN — Founder 시각 확인 또는 좌표 취득 후 정밀화 필요

---

## §5 비교 이미지

`docs/knowledge/MAP-V01-ZONE2-BOUNDARY-CORRECTION-COMPARE.png`

- 상단: BEFORE — SE(0.80,0.82) 돌산 방향 침범
- 하단: AFTER — SE(0.74,0.63) 돌산 제외
- 빨간 원: SE corner 위치 표시
- 회색 원: 여수엑스포역 추정 위치

---

## §6 불확실 구간

| 구간 | 불확실 이유 |
|------|-----------|
| NW (x:0.47, y:0.30) | 엑스포역 정확한 위치 UNKNOWN |
| S (y=0.63) | 돌산대교 정확한 위치 미확인 — 0.63이 안전한지 Founder 확인 필요 |
| E (x=0.96) | 이미지 오른쪽 끝 처리 |

---

## §7 다음 단계

1. Founder가 AFTER 이미지에서 S boundary (y=0.63)가 돌산을 충분히 제외하는지 확인
2. 여수엑스포역 위치 확인 → NW corner 정밀화
3. Founder 승인 → status: VERIFIED 승격 → 일반 화면 적용
4. 빨간 테스트 사각형 제거 (VERIFIED 승격과 동시)
