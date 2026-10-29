# MAP V0.1 Draggable Marker Editor — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_DRAGGABLE_MARKER_EDITOR_READY  
**Authorization**: MAP_V01_DRAGGABLE_MARKER_EDITOR_REQUIRED (Founder 관측)

---

## §1 구현 범위

`YeosuMapSelector.jsx` — `ZoneDetail` 내 QA 위치 지정 모드에 드래그 편집 기능 추가.

---

## §2 구현 내용

### 2.1 추가된 State / Ref

| 항목 | 타입 | 설명 |
|------|------|------|
| `draggingCode` | string \| null | 현재 드래그 중인 place_id |
| `mapWrapperRef` | useRef | 지도 wrapper div 참조 (좌표 계산 기준) |

### 2.2 핵심 로직

```javascript
// normalized 좌표 계산 — mapWrapperRef.getBoundingClientRect() 기준
const calcNorm = (clientX, clientY) => {
  const rect = mapWrapperRef.current?.getBoundingClientRect();
  return {
    x: parseFloat(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)).toFixed(3)),
    y: parseFloat(Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)).toFixed(3)),
  };
};

// Pointer Events + capture — 마커 외부 이동 시에도 드래그 지속
const handleCandidatePointerDown = (e, code) => {
  e.target.setPointerCapture(e.pointerId);   // capture 등록
  setDraggingCode(code);
  setPlacementTarget(code);                  // 드래그 시 자동 선택
};
const handleCandidatePointerMove = (e, code) => {
  if (draggingCode !== code) return;
  setCandidates(prev => ({ ...prev, [code]: calcNorm(e.clientX, e.clientY) }));
};
const handleCandidatePointerUp = (e, code) => setDraggingCode(null);
```

### 2.3 미세 조정

- ←/→: x ±0.001 (이미지 1564px 기준 ≈ 1.5px)
- ↑/↓: y ±0.001 (이미지 1006px 기준 ≈ 1.0px)
- 선택된 장소(placementTarget)에만 버튼 표시

### 2.4 재설정

- ✕ 버튼 → `delete candidates[code]` → 해당 장소 후보 좌표 삭제

### 2.5 이벤트 분리

| 이벤트 | 동작 |
|--------|------|
| 후보 마커 pointerdown | 드래그 시작, plaecmentTarget 자동 선택 |
| pointermove | 실시간 좌표 갱신 (transition: none) |
| pointerup / pointercancel | 드래그 종료, 좌표 유지 |
| 지도 클릭 | draggingCode 있으면 무시 (드래그 직후 클릭 방지) |
| touch-action: none | placementMode 시 스크롤 억제 |
| 기존 마커 onClick | placementMode 시 return (토글 비활성) — 변경 없음 |

### 2.6 드래그 중 UX

- 마커 원: 16px → 20px (커짐)
- cursor: grab → grabbing
- 라벨: `장소명 (x, y)` 실시간 표시
- boxShadow: 강조 (5px glow)
- zIndex: 30 → 40 (최상위)

---

## §3 안전 조건 보존

| 항목 | 상태 |
|------|------|
| VERIFIED 자동 승격 없음 | ✅ — 드래그·클릭은 candidates 업데이트만 |
| DB 저장 없음 | ✅ — React state 전용 |
| 일반 사용자 화면 숨김 | ✅ — isQAPreview && localhost 게이팅 유지 |
| 기존 마커 토글 보존 | ✅ — placementMode 아닐 때 변경 없음 |
| 장소별 독립 좌표 | ✅ — candidates[code] 각각 독립 |
| 원본 PNG 변경 없음 | ✅ |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| Inventory 42개 / TG_READY 12개 / 7개 권역 | ✅ 변경 없음 |
| SOUL 게이팅 | ✅ 변경 없음 |

---

## §4 검증

| 항목 | 상태 |
|------|------|
| 빌드 | ✅ 698 modules |
| 테스트 | ✅ 639/640 PASS (R20 PRE-EXISTING 유지) |
| 브라우저 드래그 검증 | **OPEN** — 자동화 불가, Founder 직접 확인 필요 |

---

## §5 브라우저 검증 미완료 범위 (OPEN)

자동화된 환경에서 Pointer Events 드래그를 시뮬레이션할 수 없음.

Founder가 직접 확인해야 하는 항목:
1. 마커 드래그 시 위치 이동 여부
2. 드래그 후 손 놓으면 그 자리 유지
3. 동일 장소 재드래그 가능
4. 다른 장소 선택 시 기존 후보 위치 유지
5. 이미지 크기 변경 후 위치 일치
6. 모바일 터치 이동 정상 (touch-action:none)
7. 드래그 중 장소 선택 토글 발생 0건

---

## §6 Founder 검수 절차

1. `node server.js` 재시작
2. `http://localhost:5000/muyojeong?qa_preview=boundary`
3. Zone 1 또는 Zone 2 진입
4. 위치 지정 모드 시작 → 장소 선택 → 지도 클릭 → 녹색 마커 등장
5. **녹색 마커를 마우스로 잡고 드래그** → 실시간 이동 확인
6. ←/→/↑/↓ 미세 조정 버튼으로 1픽셀 단위 조정
7. "전체 좌표 복사" → 코드야에게 전달
