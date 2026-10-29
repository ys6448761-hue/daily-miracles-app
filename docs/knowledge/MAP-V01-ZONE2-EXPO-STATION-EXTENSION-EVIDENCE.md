# MAP V0.1 — Zone 2 Boundary Expo Station Extension + Marker Toggle Evidence

**Date**: 2026-10-26  
**Status**: MAP_V01_ZONE2_BOUNDARY_AND_MARKER_TOGGLE_READY  
**Founder Decision**: ZONE2_BOUNDARY_EXPO_STATION_EXTENSION_REQUIRED + MAP_MARKER_CHIP_TOGGLE_REQUIRED

---

## §1 Zone 2 Boundary 확장 (NW y=0.30 → 0.10)

### 변경 전후

| 포인트 | BEFORE | AFTER | 이유 |
|--------|--------|-------|------|
| NW | (0.47, **0.30**) | (0.47, **0.10**) | 여수엑스포역(이미지 상단 역사 구조물 y≈0.05~0.10) 포함 |
| NE | (0.90, 0.14) | (0.90, 0.14) | 오동도 북동 — 변경 없음 |
| E  | (0.96, 0.46) | (0.96, 0.46) | 오동도 동쪽 경계 — 변경 없음 |
| SE | (0.74, 0.63) | (0.74, 0.63) | 돌산 제외 — 변경 없음 |
| S  | (0.57, 0.63) | (0.57, 0.63) | Zone 2 남측 — 변경 없음 |
| W  | (0.56, 0.40) | (0.56, 0.40) | Zone 1/2 경계 — 변경 없음 |

### 이미지 근거

- **여수엑스포역 시각 추정**: oldtown 이미지 상단 우측, 현대식 역사/항만 구조물 y≈0.02~0.10
- **QA 마커**: `yeosu_expo_station` 추정 좌표 (0.490, 0.320) → (0.570, 0.080) 업데이트 (시각 재추정)
- **비교 이미지**: `docs/knowledge/MAP-V01-ZONE2-EXPO-STATION-EXTENSION-COMPARE.png`
  - BEFORE: NW(0.47,0.30) — 엑스포역 추정 위치 경계 밖
  - AFTER: NW(0.47,0.10) — 엑스포역 추정 위치 경계 내

### 조건 충족 여부

| 조건 | 결과 |
|------|------|
| 여수엑스포역 포함 | PROVISIONAL — NW (0.47,0.10)으로 포함 추정. 좌표 미검증(UNKNOWN) |
| 오동도 포함 | ✅ NE/E 포인트 유지 |
| 엑스포공원 포함 | ✅ (x≈0.48, y≈0.42) 경계 내 |
| 스카이타워 포함 | ✅ (x≈0.51, y≈0.43) 경계 내 |
| 돌산 침범 없음 | ✅ SE y=0.63 유지 — 돌산 방향 포함 없음 |
| 원도심 중첩 최소화 | ✅ W x=0.56 유지 |

---

## §2 마커 ↔ 버튼 양방향 토글 구현 확인

### 구현 방식

기존 `toggleRoutePlace` 로직 + `selectedPlaces` 공유 상태를 재사용. 추가 상태 관리 불필요.

```
마커 클릭  →  onTogglePlace({code, name})  →  toggleRoutePlace  →  selectedPlaces 업데이트
                                                                         ↓
버튼 re-render ← selectedPlaces.some(p => p.code === place.code)
마커 re-render ← selectedPlaces.some(p => p.code === m.code)
```

### 코드 근거

**`YeosuMapSelector.jsx` 마커 (강화)**:
- `onClick`: `handleToggle()` — 선택/해제 toggle
- `onKeyDown`: Enter/Space로 키보드 접근성 지원
- `tabIndex={selectable ? 0 : undefined}` — 키보드 포커스
- `aria-label`: `${name} ${selected ? '선택 해제' : '선택'}` — 접근성 상태 표시
- `aria-pressed`: 현재 선택 상태 ARIA 반영
- 시각 피드백: 선택 시 14px + 금색 halo (0.30 → 0.35 opacity ring)

**`MuyojeongHomePage.jsx` toggleRoutePlace (기존)**:
```js
function toggleRoutePlace(place) {
  setRoutePlaces(prev =>
    prev.some(p => p.code === place.code)
      ? prev.filter(p => p.code !== place.code)  // 선택 해제
      : [...prev, place]                          // 선택 추가
  );
}
```

### 검증 항목

| 항목 | 결과 |
|------|------|
| A. 마커 클릭 → 버튼 활성화 | ✅ selectedPlaces 공유로 자동 동기화 |
| B. 재클릭 → 비활성화 | ✅ toggleRoutePlace toggle 로직 |
| C. 버튼 클릭 → 마커 표시 동기화 | ✅ selectedPlaces 공유로 자동 동기화 |
| D. 다른 권역 이동 후 선택 상태 유지 | ✅ routePlaces = MuyojeongHomePage 상태, Zone 이동과 무관 |
| E. 마커 없는 장소 버튼 동작 유지 | ✅ 버튼 로직은 마커와 독립적 |
| F. SOUL 게이팅 유지 | ✅ isSelectablePlace = TG_READY만. EXPLORER 마커 클릭 불가. |
| G. 키보드 접근성 | ✅ tabIndex + onKeyDown Enter/Space 추가 |

### 현재 마커 범위

현재 Phase A HIGH confidence 마커는 오동도 1개. Zone 2 상세 지도에서만 표시.
마커-버튼 토글은 오동도에 적용됨. 추가 마커는 Founder 확인 후 Phase B에서 추가.

---

## §3 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `dreamtown-frontend/src/constants/yeosuMapData.js` | Zone 2 NW y=0.30→0.10 / expo_station QA 좌표 업데이트 |
| `dreamtown-frontend/src/components/YeosuMapSelector.jsx` | 마커 tabIndex + onKeyDown + aria-label 강화 / 선택 시각 피드백 |

---

## §4 불확실 구간 (PROVISIONAL 유지)

| 항목 | 불확실 이유 |
|------|-----------|
| NW (0.47, 0.10) | 엑스포역 정확 좌표 UNKNOWN. 이미지 시각 추정만. |
| 엑스포역 QA 마커 (0.570, 0.080) | confirmed=false 유지. Founder 확인 필요. |
| 전체 Zone 2 boundary | PROVISIONAL → Founder 검수 후 VERIFIED 승격 |

---

## §5 검수 URL

```
http://localhost:5000/muyojeong?qa_preview=boundary
→ 지역별 보기 → 오동도·엑스포권
→ 파란 점선 경계 상단 확장 확인
→ 오동도 마커 클릭 → 오동도 버튼 활성화 확인
→ 오동도 버튼 클릭 → 오동도 마커 금색+halo 확인
```

---

## §6 다음 단계

1. Founder: AFTER 이미지에서 Zone 2 북측 경계가 엑스포역을 충분히 포함하는지 확인
2. 오동도 마커 위치(x=0.87, y=0.28) Founder 시각 확인 → VERIFIED 승격
3. Zone 2 전체 경계 Founder 승인 → status VERIFIED → 일반 사용자 화면 적용
4. 빨간 테스트 사각형 제거 (VERIFIED 승격과 동시)
