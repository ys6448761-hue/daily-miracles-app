# MAP V0.1 — Discovery Click UX Fix Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_DISCOVERY_CLICK_FIXED  
**Classification**: REPAIR  
**SHA**: (pending commit)

---

## §1 문제 요약

| 증상 | 원인 |
|------|------|
| "탐색 가능" 배지 장소 (진남관·오포대·수산시장·고소동·낭만요트·블루요트·아쿠아플라넷·빅오쇼) 클릭 불가 | `isSelectablePlace()` = `status === 'tg_ready'` → explorer 장소 false |
| 하단 목록에서 `<div>` 렌더링 | selectable=false → button 대신 div → 인터랙션 없음 |
| 마커 클릭 무반응 | `if (selectable) onTogglePlace(m)` → explorer 마커 onClick 없음 |
| 툴팁 "코스 추천 준비 중이에요" | "탐색 가능" 배지와 충돌 — 의도 불명확 |
| 마커 title `[QA위치미검증]` | 개발자 내부 용어 노출 |

---

## §2 수정 내용

### A. 하단 목록 explorer 장소 UX 텍스트

**파일**: `YeosuMapSelector.jsx` (bottom list non-selectable div)

**변경 전**:
```jsx
title={place.status === MAP_STATUS.FERRY ? '배편 예약 후 방문 권장' : '코스 추천 준비 중이에요'}
style={{ ..., cursor: 'default' }}
// opacity: 없음 — 일반 brightness와 동일
```

**변경 후**:
```jsx
title={
  place.status === MAP_STATUS.FERRY
    ? '배편 예약 후 방문 권장'
    : place.status === MAP_STATUS.EXPLORER
    ? `${place.name_ko} — 탐색 가능한 장소예요. 여행 코스 직접 추가는 준비 중이에요.`
    : '정보 수집 중인 장소예요'
}
style={{ ..., cursor: 'default', opacity: place.status === MAP_STATUS.EXPLORER ? 0.72 : 0.55 }}
```

**효과**: "탐색 가능" 배지와 충돌 없는 명확한 상태 설명 제공.

### B. 지도 마커 title 텍스트

**파일**: `YeosuMapSelector.jsx` line 720

**변경 전**:
```javascript
title={isVerified ? m.name_ko : `[QA위치미검증] ${m.name_ko}`}
```

**변경 후**:
```javascript
title={isVerified ? m.name_ko : `${m.name_ko} · 위치 검수 중`}
```

**효과**: 개발자 내부 용어(`[QA위치미검증]`) 제거 → 사용자 친화적 문구.

---

## §3 SOUL 게이팅 유지 확인

| 항목 | 상태 | 근거 |
|------|------|------|
| `isSelectablePlace()` 변경 없음 | ✅ | `status === 'tg_ready'` 유지 |
| explorer 장소 `onTogglePlace` 호출 | ✅ 없음 | `if (selectable) onTogglePlace(m)` 유지 |
| explorer 하단 목록 `<button>` 변환 | ✅ 없음 | `<div>` 유지 — 인터랙션 없음 |
| TG_READY 아닌 장소 SOUL 포함 | ✅ 없음 | isSelectablePlace 조건 불변 |
| 낭만요트·블루요트 SOUL 게이팅 | ✅ 유지 | explorer status → selectable=false |

**낭만요트·블루요트 click fix**: SOUL 게이팅 유지 결정 — status=explorer이므로 선택 불가가 의도된 상태. 텍스트 명확화로 UX 혼란 해소.

---

## §4 marine_park 중복 재확인

| 확인 항목 | 결과 |
|-----------|------|
| `d67df29` qaPlaces filter 코드 dist 반영 | ✅ (`index-DZ9wBtDZ.js`) |
| marine_park markerPos 존재 여부 | ✅ `{ x: 0.447, y: 0.577, status: 'PROVISIONAL' }` |
| `!YEOSU_PLACES.find(pl => pl.code === code)?.markerPos?.oldtown` 필터 | ✅ marine_park 제거 대상 |
| Founder 화면 중복 원인 | **브라우저 캐시** — 수정 전 dist 파일 캐시. 하드 리프레시(Ctrl+Shift+R) 필요 |
| 코드 레벨 중복 | **없음** — qaPlaces에서 정상 제거됨 |

---

## §5 4곳 위치 보정 필요 표시

Founder Visual QA 결과: 아쿠아플라넷·빅오쇼·낭만요트·블루요트 해안가 위치 오류.  
추측 보정 금지 — 좌표는 Founder 재드래그 후 SOURCE_SAVED 처리.

| place_code | 현재 markerPos | 상태 |
|------------|---------------|------|
| aquaplanet | x=0.563, y=0.334 | POSITION_CORRECTION_REQUIRED |
| big_o_show | x=0.529, y=0.296 | POSITION_CORRECTION_REQUIRED |
| nangman_yacht | x=0.643, y=0.419 | POSITION_CORRECTION_REQUIRED |
| blue_yacht | x=0.607, y=0.435 | POSITION_CORRECTION_REQUIRED |

주석 추가 위치: `yeosuMapData.js` 각 place 객체 trailing comment.  
**좌표 변경 없음** — 현재 PROVISIONAL 유지, Founder 재지정 후 갱신.

---

## §6 검증

| 항목 | 결과 |
|------|------|
| 빌드 | ✅ 698 modules |
| 회귀 | ✅ 639/640 PASS (R20 PRE-EXISTING) |
| Inventory 45 / TG_READY 12 / 7권역 | ✅ 유지 |
| SOUL 게이팅 | ✅ isSelectablePlace() 변경 없음 |
| Founder markerPos 15곳 좌표 불변 | ✅ 4곳 POSITION_CORRECTION_REQUIRED 주석만 추가 |
| VERIFIED 자동 승격 | ✅ 없음 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §7 Founder 다음 액션

| 항목 | 액션 |
|------|------|
| marine_park 중복 잔존 확인 | **브라우저 하드 리프레시** (Ctrl+Shift+R) → 중복 해소 예상 |
| 아쿠아플라넷·빅오쇼 위치 | QA Preview → 드래그 모드 → 4곳 재지정 → 내보내기 → 코드야에게 전달 |
| 낭만요트·블루요트 위치 | 동일 — 4곳 일괄 재드래그 권장 |
