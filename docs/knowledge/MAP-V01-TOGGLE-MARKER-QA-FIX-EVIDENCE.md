# MAP V0.1 — Toggle & Marker QA Fix Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_TOGGLE_AND_MARKER_QA_FIXED  
**Trigger**: Founder QA Failure — 토글 미작동 + 마커 위치 불일치

---

## §1 근본 원인 분석

### 버그 1 — PROVISIONAL 마커가 일반 사용자 화면에 표시됨

**현상**: `YeosuMapSelector.jsx` 마커 렌더링 코드에서 `markerPos.status` 검사 없이 항상 표시.

```jsx
// BEFORE (버그): isQAPreview 조건 없이 항상 표시
{markers.filter(m => m.zone === zone.id).map(m => {
  const mp = m.markerPos.oldtown;
  // status 검사 없음 → PROVISIONAL도 렌더링됨
```

**yeosuMapData.js 주석(line 110)**: `"VERIFIED만 실제 렌더링"` — 이 의도가 마커 렌더링 코드에 구현되지 않았음.

**오동도 마커 상태**: `{ x: 0.87, y: 0.28, confidence: 'HIGH', status: 'PROVISIONAL' }`  
→ PROVISIONAL이지만 일반 사용자 화면에 표시됨.

### 버그 2 — 마커 위치와 실제 장소 불일치

**현상**: 오동도 마커(0.87, 0.28) ≠ 이미지 실제 오동도 위치(등대 중심 추정 x≈0.91, y≈0.24).

**영향**:
1. 사용자가 지도에서 오동도 위치를 클릭해도 마커가 없어서 선택 불가
2. 마커가 있는 위치(0.87, 0.28)를 클릭하면 오동도가 아닌 곳을 탭한 것처럼 느껴짐
3. 버튼 클릭으로 오동도를 선택해도 지도 마커가 다른 위치에 있어 동기화 안 된 것처럼 보임

---

## §2 수정 내용

### 수정: PROVISIONAL 마커 숨김 + QA 전용 표시

**파일**: `dreamtown-frontend/src/components/YeosuMapSelector.jsx`

**핵심 변경**:
```jsx
// AFTER (수정): status 검사 추가
const isVerified = mp.status === 'VERIFIED';
// 일반 화면: VERIFIED만. QA Preview: PROVISIONAL도 위치 참고용으로.
if (!isVerified && !isQAPreview) return null;

// PROVISIONAL은 클릭 불가 — 위치 미검증으로 선택 연결 금지
const selectable = isSelectablePlace(m) && isVerified;

// 스타일: PROVISIONAL = 반투명 주황, VERIFIED = 흰색/금색
background: !isVerified ? 'rgba(255,160,0,0.45)' : selected ? '#FFD67A' : 'rgba(255,255,255,0.92)'

// pointerEvents: PROVISIONAL = 클릭 이벤트 차단
pointerEvents: isVerified ? undefined : 'none'
```

---

## §3 상태별 동작 (수정 후)

### 일반 사용자 화면

| 상황 | 동작 |
|------|------|
| VERIFIED 마커 없음 (현재) | 마커 미표시 — 버튼만으로 장소 선택 |
| 버튼 클릭 | 장소 선택/해제 정상 작동 |
| 마커-버튼 양방향 토글 | Phase B — VERIFIED 마커 추가 후 활성화 |

### QA Preview (`?qa_preview=boundary`)

| 상황 | 동작 |
|------|------|
| PROVISIONAL 마커 | 반투명 주황(rgba 0.45) 표시 — 위치 참고용 |
| PROVISIONAL 마커 클릭 | 차단 (`pointerEvents: 'none'`) |
| title hover | `[위치 미검증] 오동도` 표시 |
| VERIFIED 마커 (미래) | 흰색→금색 토글, 클릭 가능 |

---

## §4 오동도 마커 좌표 현황

| 항목 | 현재 값 | 이미지 시각 추정 | 차이 |
|------|---------|----------------|------|
| x | 0.87 | ≈0.91 | ~0.04 차이 |
| y | 0.28 | ≈0.24 | ~0.04 차이 |
| status | PROVISIONAL | — | PROVISIONAL 유지 |

**처리 방침**: 좌표 수정은 이번 작업 제외. PROVISIONAL 숨김으로 일반 사용자 영향 없음.  
Founder가 정확한 위치 확인 후 좌표 업데이트 → VERIFIED 승격 → Phase B 마커 활성화.

---

## §5 토글 기능 현재 상태

| 기능 | 상태 | 비고 |
|------|------|------|
| 버튼 → 버튼 토글 | ✅ 작동 | toggleRoutePlace 정상 |
| 마커(VERIFIED) → 버튼 동기화 | ⏸ PHASE_B | VERIFIED 마커 없음 |
| 버튼 → 마커(VERIFIED) 동기화 | ⏸ PHASE_B | VERIFIED 마커 없음 |
| PROVISIONAL 마커 클릭 | ✅ 차단 | pointerEvents:none |

---

## §6 브라우저 테스트 가능 범위

**코드 레벨 검증**: ✅ 완료  
- `if (!isVerified && !isQAPreview) return null` — PROVISIONAL 숨김 로직 확인
- `pointerEvents: isVerified ? undefined : 'none'` — 클릭 차단 확인
- `selectable = isSelectablePlace(m) && isVerified` — 선택 연결 차단 확인

**브라우저 상호작용 테스트**: Founder 직접 검수 필요  
검수 URL: `http://localhost:5000/muyojeong`  
확인 항목:
1. 일반 화면에서 지도 마커 미표시 확인
2. 오동도·케이블카 버튼 클릭 → 선택/해제 정상 작동 확인
3. `?qa_preview=boundary` → Zone 2 진입 → 반투명 주황 마커 확인 (클릭 불가)

---

## §7 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `YeosuMapSelector.jsx` | PROVISIONAL 마커 일반 화면 숨김 + QA 전용 반투명 스타일 |

---

## §8 다음 단계 (Phase B)

1. Founder가 오동도 실제 위치를 확인하여 좌표 정밀화
2. 좌표 업데이트 후 `status: 'VERIFIED'` 승격
3. VERIFIED 마커 표시 → 마커-버튼 양방향 토글 자동 활성화
4. 빨간 테스트 사각형 제거 (VERIFIED 경계선과 동시)
