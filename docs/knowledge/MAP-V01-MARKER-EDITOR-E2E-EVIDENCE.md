# MAP V0.1 Marker Editor E2E — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_MARKER_EDITOR_E2E_READY  
**Authorization**: MAP_V01_MARKER_EDITOR_E2E_REQUIRED (Founder — MARKER_EDITOR_END_TO_END_QA_FAILED)

---

## §1 문제 진단

Founder 관측: 기존 마커·QA 경계선·여행 장소 선택 상태가 편집 화면에서 동시에 표시되어 혼란 발생.

### 실제 원인

| 항목 | 이전 상태 | 원인 |
|------|-----------|------|
| 빨간 테스트 사각형 | 항상 표시 | `isQAPreview && (...)` 안에 `placementMode` 조건 없음 |
| PROVISIONAL 경계선 | 항상 표시 | `showOldtownBoundary` 조건만 있고 `!placementMode` 누락 |
| 기존 마커 | opacity 0.4 (흐릿하지만 존재) | `return null` 대신 `opacity` 약화만 적용 |
| QA 기준점 마커 | 항상 표시 | `!placementMode` 조건 누락 |
| 하단 장소 선택 버튼 | 편집 모드에서 클릭 가능 | 포인터 이벤트 미차단 |
| 저장 상태 | "복사됨" — 코드 미반영 상태 불명확 | 상태 텍스트가 완료를 암시 |

---

## §2 변경 내용

| 파일 | 변경 |
|------|------|
| `YeosuMapSelector.jsx` | 테스트 사각형 `!placementMode` 조건 추가 |
| `YeosuMapSelector.jsx` | 경계선 `!placementMode` 조건 추가 |
| `YeosuMapSelector.jsx` | 기존 마커 `if (placementMode) return null` |
| `YeosuMapSelector.jsx` | QA 기준점 `!placementMode &&` 조건 추가 |
| `YeosuMapSelector.jsx` | 선택 장소 현재 좌표 + 상태 패널 추가 (항상 표시) |
| `YeosuMapSelector.jsx` | 저장 상태 4단계 텍스트 명확화 |
| `YeosuMapSelector.jsx` | 하단 장소 목록 편집 모드 시 opacity 0.25 + pointerEvents none |

---

## §3 편집 모드 화면 구성 (변경 후)

### 표시되는 것
- 선택된 장소의 후보 마커 1개 (녹색, 드래그 가능)
- 다른 후보 마커들 (이미 지정된 경우)
- 선택 장소명 + 현재 x/y + 저장 상태 패널

### 숨겨지는 것
- 빨간 테스트 사각형
- PROVISIONAL 경계선
- 기존 마커 전체 (후보 마커로 대체)
- QA 기준점 마커 전체

### 비활성화되는 것
- 하단 여행 장소 선택 버튼 (opacity 0.25, 클릭 차단)

---

## §4 저장 상태 4단계

| 단계 | 표시 | 색상 |
|------|------|------|
| 미지정 | "미지정" | 회색 |
| 후보 좌표 있음 | "후보 좌표 있음" | 노란색 |
| 내보내기 완료 | "내보내기 완료 · 코드 반영 전" | 녹색 |
| 코드 반영 후 | (코드야가 yeosuMapData.js 수정) | — |

---

## §5 E2E 검증 항목 — 자산공원 기준

| 단계 | 내용 | 상태 |
|------|------|------|
| 1. 편집 대상 선택 | Zone 2 → "자산공원" 버튼 클릭 | OPEN (브라우저 직접 확인) |
| 2. 마커 드래그 | 후보 마커 잡고 이동 | OPEN |
| 3. 화면상 위치 이동 | 드래그 방향으로 이동 | OPEN |
| 4. x/y 변경 | 상태 패널 좌표 실시간 변경 | OPEN |
| 5. 후보 좌표 내보내기 | "좌표 내보내기" 클릭 → 클립보드 복사 | OPEN |
| 6. 복사 결과 비교 | 클립보드 값 = 화면 좌표 | OPEN |
| 7. 편집 종료 후 토글 | "종료" → 하단 장소 버튼 정상 클릭 | OPEN |

자동화 불가 — Founder가 브라우저에서 직접 확인 필요.

---

## §6 안전 조건

| 항목 | 상태 |
|------|------|
| 7개 권역 / 42개 Inventory / TG_READY 12개 | ✅ 변경 없음 |
| SOUL 게이팅·API·DB | ✅ 변경 없음 |
| 일반 화면 PROVISIONAL 마커 숨김 | ✅ 변경 없음 |
| VERIFIED 자동 승격 없음 | ✅ 변경 없음 |
| 기존 양방향 토글 (편집 모드 종료 후) | ✅ 변경 없음 |
| DB/Production 자동 저장 없음 | ✅ 변경 없음 |
| 지도 원본 PNG 변경 없음 | ✅ |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §7 검증

| 항목 | 결과 |
|------|------|
| 빌드 | ✅ |
| 테스트 | ✅ 639/640 PASS (R20 PRE-EXISTING) |
| 브라우저 E2E | OPEN — Founder 직접 확인 필요 |

---

## §8 Founder 검수 절차

1. `node server.js` 재시작
2. `http://localhost:5000/muyojeong?qa_preview=boundary`
3. Zone 2(오동도·엑스포권) 진입
4. "📍 마커 위치 지정 모드 시작"
5. Zone 2 → **자산공원** 선택
6. 화면 확인: 빨간 사각형·경계선·기존 마커·QA 기준점 없음 ← 핵심
7. 지도 클릭 또는 후보 마커 드래그
8. 상태 패널에서 좌표 변화 확인 + "후보 좌표 있음" 표시
9. "좌표 내보내기" 클릭 → "내보내기 완료 · 코드 반영 전" 확인
10. "종료" → 하단 장소 버튼 정상 토글 확인
11. 결과를 코드야에게 전달
