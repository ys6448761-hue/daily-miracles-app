# MAP V0.1 — First Marker Save Gate Evidence

**Date**: 2026-10-27  
**Task**: MAP Clean Restart Acceptance Gate (항목 1-10)  
**Status**: MAP_V01_SAVE_GATE_HOLD — 이순신광장 Founder 드래그 좌표 수신 대기  
**Classification**: CONNECT (편집기 → PROVISIONAL 저장 워크플로우)

---

## §1 항목 1 — Project State 확인

| 항목 | 확인 값 |
|------|---------|
| SHA | `2dad09f` (MAP_V01_MARKER_CLEAN_RESTART_READY) |
| 백업 SHA | `72367ee` |
| DRAFT_KEY | `yeosu_map_draft_v02_oldtown` |
| markerPos 초기화 | 7곳 완료 |
| Runtime QA | 11/12 PASS |
| 빌드 | 639/640 PASS |
| Current Next Action | Founder 이순신광장 드래그 → 좌표 전달 |

---

## §2 항목 2 — T-11 실패 ID·원인

| 항목 | 내용 |
|------|------|
| 테스트 ID | **T-11** |
| 테스트명 | "초안 삭제 후 localStorage 여전히 존재" |
| 원인 | puppeteer `ElementHandle.click()` — "초안 삭제 (전체 초기화)" 버튼이 뷰포트(844px) 하단에 위치. `scrollIntoView()` + `dispatchEvent` 방식 미적용 (지도 클릭에는 적용됨) |
| 코드 파일 | `tests/map-draft-persistence-runtime.test.js` lines 260-265 |
| 관련 코드 | `YeosuMapSelector.jsx` line 602 `localStorage.removeItem(DRAFT_KEY)` |

---

## §3 항목 3 — 기존 알려진 문제 vs 신규

**판정: 기존 알려진 문제 (PRE-EXISTING)**

근거:
- `MAP-V01-CLEAN-RESTART-EVIDENCE.md §5` 이미 "TEST INFRA" 분류 기재
- T-07 저장 PASS → `localStorage.setItem` 동기 실행 정상 확인 → `removeItem`도 동일 패턴 → 코드 버그 아님
- puppeteer 뷰포트 외 클릭 이슈는 T-07 수정 시 `dispatchEvent` 방식 도입으로 이미 인지된 한계

**신규 문제 없음** ✅

---

## §4 항목 4 — v01/v02 초안 격리 확인

| 검사 위치 | 키 값 | 결과 |
|-----------|------|------|
| `DRAFT_KEY` 상수 (line 53) | `yeosu_map_draft_v02_oldtown` | ✅ v02 |
| mount useEffect (line 219) | `localStorage.getItem(DRAFT_KEY)` | ✅ v02만 읽음 |
| save useEffect (line 235) | `localStorage.setItem(DRAFT_KEY, ...)` | ✅ v02만 씀 |
| 삭제 버튼 (line 602) | `localStorage.removeItem(DRAFT_KEY)` | ✅ v02만 삭제 |
| v01 키 참조 | `yeosu_map_draft_v01_oldtown` | ✅ 코드 전무 |

**격리 완전함** — Founder 브라우저에 v01 데이터가 있어도 v02 편집기에 자동 복원 안됨 ✅

---

## §5 항목 5 — 상태 구분 명확성 확인

코드 위치: `YeosuMapSelector.jsx` lines 481-488

```javascript
const codedPos = codedPlace?.markerPos?.oldtown;  // CLEAN RESTART 후 = undefined
const isCodeReflected = cand && codedPos &&
  cand.x === codedPos.x && cand.y === codedPos.y;

const statusLabel = isCodeReflected ? '코드 반영'
  : cand
    ? (copied === placementTarget || copied === 'all'
        ? '내보내기 완료 · 코드 반영 전'
        : '후보 좌표 있음')
    : '미지정';
```

| 상태 | 레이블 | 색상 | 조건 |
|------|--------|------|------|
| NOT_PLACED | 미지정 | 흰색 반투명 | cand=null, codedPos=null |
| DRAFT | 후보 좌표 있음 | 노란색 | cand 있음, 미내보내기 |
| DRAFT+exported | 내보내기 완료 · 코드 반영 전 | 초록색 | cand 있음 + copied |
| SOURCE_SAVED | 코드 반영 | 파란색 | cand.x===codedPos.x, cand.y===codedPos.y |

CLEAN RESTART 후: `codedPos = undefined` → `isCodeReflected = false` → "코드 반영" 미표시  
markerPos 반영 후 + 동일 draft 존재 시: "코드 반영" 표시 ✅

---

## §6 추가 발견 — QA_OLDTOWN_POSITIONS 격리 정상

| 항목 | 내용 |
|------|------|
| `QA_OLDTOWN_POSITIONS` 용도 | QA Preview 참조 점 (드래그 모드 OFF 시 회색 점) |
| CLEAN RESTART 영향 | 없음 — 이 데이터는 `markerPos`와 별개 |
| `getMarkersForImage()` 연결 | `YEOSU_PLACES[].markerPos`만 참조, `QA_OLDTOWN_POSITIONS` 미참조 |
| CLEAN RESTART 후 렌더링 마커 | 0개 (markerPos 전부 초기화됨) ✅ |
| 혼용 위험 | 없음 — 두 데이터소스 완전 분리 ✅ |

---

## §7 항목 7 준비 — 이순신광장 PROVISIONAL 저장 절차

**상태**: 좌표 수신 대기 (MAP_V01_SAVE_GATE_HOLD)

Founder 드래그 후 내보내기 결과 형식 (예시):
```javascript
// 이순신광장 — Founder 드래그 결과
markerPos: {
  oldtown: { x: <Founder_x>, y: <Founder_y>, confidence: 'HIGH', status: 'PROVISIONAL' }
}
```

코드야 반영 위치: `yeosuMapData.js` line 35 (`lee_soon_shin_plaza` 객체)

반영 후 검증:
- 서버 재시작 → `localhost:5000/muyojeong?qa_preview=boundary` → Zone 1
- 이순신광장 선택 → 상태 레이블 = "코드 반영" ✅
- 지도에 마커 표시 (드래그 모드 OFF 시) ✅

---

## §8 안전 조건

| 항목 | 상태 |
|------|------|
| Inventory 45개 / TG_READY 12개 / 7권역 | ✅ 유지 |
| 경계선 PROVISIONAL | ✅ 유지 |
| SOUL 게이팅 | ✅ 유지 |
| VERIFIED 자동 승격 금지 | ✅ |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| SOURCE_SAVED 장소 재드래그 요청 금지 | ✅ — SOURCE_SAVED 후 재확인만 |
