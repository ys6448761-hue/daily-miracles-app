# MAP V0.1 Direct Marker Placement — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_DIRECT_MARKER_PLACEMENT_READY  
**SHA**: (이 커밋 이후 갱신)  
**Authorization**: MAP_V01_DIRECT_MARKER_PLACEMENT_AUTHORIZED (Founder)

---

## §1 구현 범위

`YeosuMapSelector.jsx` — `ZoneDetail` 컴포넌트 내 마커 위치 지정 모드 추가.

QA Preview(`localhost + ?qa_preview=boundary`) 환경에서만 활성화.  
일반 사용자(Production) 화면: 위치 지정 UI 완전 숨김.

---

## §2 구현 사항

### 2.1 상태 관리 (ZoneDetail 내부)

| 상태 | 타입 | 설명 |
|------|------|------|
| `placementMode` | boolean | 위치 지정 모드 ON/OFF |
| `placementTarget` | string \| null | 현재 선택된 place_id |
| `candidates` | `{ [code]: { x, y } }` | 장소별 독립 후보 좌표 |
| `copied` | string \| false | 복사 버튼 상태 표시 |

### 2.2 위치 지정 대상 장소 (PLACEMENT_TARGETS)

| place_id | name_ko | zone |
|----------|---------|------|
| lee_soon_shin_plaza | 이순신광장 | 1 |
| marine_park | 종포해양공원 | 1 |
| romantic_pojangmacha | 낭만포차거리 | 1 |
| odongdo | 오동도 | 2 |
| jaisan_park | 자산공원 | 2 |

하멜등대·케이블카: AMBIGUOUS — PLACEMENT_TARGETS 미포함.

### 2.3 좌표 계산

```javascript
// wrapper div(objectFit:fill 컨테이너)의 getBoundingClientRect() 기준
// objectFit:fill → 이미지가 wrapper를 정확히 채움 → 좌표 보정 불필요
const rect = e.currentTarget.getBoundingClientRect();
const x = parseFloat(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)).toFixed(3));
const y = parseFloat(Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)).toFixed(3));
```

- 0~1 범위 클램핑
- 소수점 3자리 (toFixed(3))
- 클릭 이벤트: `onClick` on wrapper div
- 터치 이벤트: `onTouchEnd` on wrapper div + `e.preventDefault()` (스크롤 방지)
- SVG 오버레이: `pointerEvents: none` → 클릭 투과, 충돌 없음
- 이미지: `pointerEvents: none` → 드래그 방지, 클릭은 wrapper로 전달

### 2.4 UI 구성

1. **모드 토글 버튼** — "📍 마커 위치 지정 모드 시작/종료"
2. **장소 선택 버튼** — zoneTargets 목록. 선택 시 ✓ 표시. 현재 대상은 녹색 강조.
3. **안내 텍스트** — 선택 장소에 따라 동적 변경
4. **후보 좌표 패널** — place_id·x·y 표시 + 단일 복사 버튼
5. **전체 복사 버튼** — 2개 이상 좌표 확정 시 표시. yeosuMapData.js 붙여넣기 형식.
6. **후보 마커** — 지도 위 녹색 원 + 장소명 라벨. 현재 대상: 크고 밝음.

### 2.5 기존 토글 보존

- `placementMode === true` 시: 마커 `onClick` → `return` (토글 비활성)
- `placementMode === false` 시: 기존 토글 정상 작동
- 마커 클릭 이벤트에 `e.stopPropagation()` 추가 → wrapper 클릭 이벤트와 분리

---

## §3 보안 및 안전

| 항목 | 구현 |
|------|------|
| QA 게이팅 | `isQAPreview = hostname===localhost && qa_preview=boundary` |
| Production 차단 | `app.dailymiracles.kr` hostname 불일치 → 절대 활성화 안됨 |
| DB 저장 없음 | candidates는 React state 전용 (서버 전송 없음) |
| VERIFIED 자동 승격 없음 | 클릭은 candidates 업데이트만 — PROVISIONAL 유지 |
| 원본 PNG 수정 없음 | 이미지 파일 변경 없음 |

---

## §4 검증

| 테스트 항목 | 상태 |
|------------|------|
| 빌드 (698 modules) | ✅ |
| 회귀 테스트 (639/640) | ✅ R20 PRE-EXISTING 유지 |
| 브라우저 검증 (자동화 불가) | OPEN — Founder 직접 확인 필요 |
| Inventory 42개 / TG_READY 12개 / 7개 권역 | ✅ 변경 없음 |
| SOUL 게이팅 변경 없음 | ✅ |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| PR #134 미merge | ✅ |
| Production 배포 없음 | ✅ |

---

## §5 Founder 검수 절차

1. 서버 재시작: `node server.js`
2. 브라우저: `http://localhost:5000/muyojeong?qa_preview=boundary`
3. Zone 1 또는 Zone 2 권역 선택
4. "📍 마커 위치 지정 모드 시작" 클릭
5. 장소 선택 (예: 이순신광장)
6. 지도에서 올바른 위치 클릭 → 녹색 후보 마커 표시
7. 잘못된 경우: 다시 클릭하면 위치 수정
8. "복사" 버튼 클릭 → 좌표 클립보드 복사
9. 5개 장소 모두 완료 후 "전체 좌표 복사" → yeosuMapData.js에 붙여넣기 요청

---

## §6 AMBIGUOUS 현황 (변경 없음)

| place_id | 이유 |
|----------|------|
| hamel_lighthouse | Founder 이미지에 화살표만, 빨간 점 없음 |
| cablecar | 상단 항만 점↔레이블 대응 불명확 |
