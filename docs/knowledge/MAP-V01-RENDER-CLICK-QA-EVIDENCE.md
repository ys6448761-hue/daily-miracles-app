# MAP V0.1 — Render/Click QA Evidence

**Date**: 2026-10-28  
**Status**: MAP_V01_RENDER_CLICK_QA_PASS  
**SHA**: (pending commit)  
**Classification**: REPAIR

---

## §1 검증 범위

| 항목 | 이전 상태 | 이번 검증 |
|------|-----------|-----------|
| 종포해양공원 중복 | "캐시 추정" — 실제 브라우저 미검증 | incognito 새 세션 puppeteer → **단일 마커 확인** |
| 낭만요트·블루요트 하단 목록 | `<div>` 비인터랙티브 | `<button>` → 클릭 → aria-pressed 토글 |
| 낭만요트·블루요트 지도 마커 | cursor:default, 클릭 무반응 | click → activeExplorerPlace 토글 → ring 효과 |
| SOUL 게이팅 | isSelectablePlace() 유지 | explorer 클릭 후 onTogglePlace 미호출 확인 |
| 4곳 위치 보정 | POSITION_CORRECTION_REQUIRED 주석 | 좌표 유지, 재드래그 대기 상태 유지 |

---

## §2 marine_park 중복 — incognito 브라우저 검증 결과

**테스트**: `tests/marine-park-duplicate-check.js`  
**조건**: puppeteer incognito, setCacheEnabled(false), 새 브라우저 세션  
**네비게이션**: `/muyojeong?qa_preview=boundary` → 지역별 보기 → 원도심·해안권(Zone 1)

```
=== marine_park 중복 검증 결과 ===
종포해양공원 지도 마커 수: 1
종포해양공원 마커 위치: [
  { "left": "44.7%", "top": "57.7%", "title": "종포해양공원 · 위치 검수 중", "tagName": "DIV" }
]
전체 지도 마커 수: 15
```

**판정**: ✅ PASS — 종포해양공원 마커 1개 (좌표 44.7%/57.7% = x:0.447, y:0.577)  
전체 15개 마커 정상 렌더링 (Zone 1+2 공유 이미지 포함)

---

## §3 Explorer 클릭 기능 — puppeteer 브라우저 검증

**테스트**: `tests/explorer-click-verify.js`  
**총 결과**: 5/5 PASS

| 테스트 ID | 내용 | 결과 |
|-----------|------|------|
| T-A1 | 낭만요트·블루요트 Zone 2 목록 `<button>` 확인 (tagName=BUTTON) | ✅ PASS |
| T-A2 | 낭만요트 클릭 → aria-pressed=true (탐색 하이라이트 토글) | ✅ PASS |
| T-A3 | SOUL 게이팅: 낭만요트 클릭이 오동도(TG_READY) 선택에 영향 없음 | ✅ PASS |
| T-A4 | Zone 1에서 낭만요트 지도 마커 클릭 → boxShadow에 ring (110,184,255) | ✅ PASS |
| T-A5 | 오동도(TG_READY) 클릭 → aria-pressed=true (SOUL selectedPlaces 추가) | ✅ PASS |

---

## §4 구현 내용

### A. `activeExplorerPlace` state 추가 (ZoneDetail)

```javascript
const [activeExplorerPlace, setActiveExplorerPlace] = useState(null);
```

### B. 지도 마커 — explorer 클릭 핸들러

```javascript
const isExplorer = m.status === MAP_STATUS.EXPLORER;
const isExplorerActive = isExplorer && activeExplorerPlace === m.code;
const handleToggle = () => {
  if (placementMode) return;
  if (selectable) {
    onTogglePlace({ code: m.code, name: m.name_ko });  // TG_READY만
  } else if (isExplorer) {
    setActiveExplorerPlace(prev => prev === m.code ? null : m.code);  // 탐색 하이라이트
  }
};
const interactive = !placementMode && (selectable || isExplorer);
```

**ring 효과** (isExplorerActive 시):
```javascript
boxShadow: isExplorerActive
  ? '0 0 0 4px rgba(110,184,255,0.45), 0 1px 5px rgba(0,0,0,0.45)'
  : selected ? '0 0 0 3px rgba(255,214,122,0.35)...' : '0 1px 5px...'
```

### C. 하단 목록 — explorer `<div>` → `<button>`

```jsx
if (place.status === MAP_STATUS.EXPLORER) {
  const isActive = activeExplorerPlace === place.code;
  return (
    <button
      onClick={() => setActiveExplorerPlace(prev => prev === place.code ? null : place.code)}
      aria-pressed={isActive}
      style={{ cursor: 'pointer', border: isActive ? '1px solid rgba(110,184,255,0.50)' : '...', ... }}
    >
```

### D. SOUL 게이팅 유지 확인

| 항목 | 상태 |
|------|------|
| `isSelectablePlace()` 변경 없음 | ✅ — `status === 'tg_ready'` 유지 |
| explorer 하단 목록 → `onTogglePlace` 호출 없음 | ✅ — `setActiveExplorerPlace`만 호출 |
| explorer 마커 → `onTogglePlace` 호출 없음 | ✅ — `else if (isExplorer)` 분기 |
| TG_READY 장소 선택 → SOUL selectedPlaces 추가 | ✅ — T-A5 PASS 확인 |

---

## §5 4곳 위치 보정 대기 상태

| place_code | Founder 지정 좌표 (2026-10-27) | 상태 |
|------------|-------------------------------|------|
| aquaplanet | x=0.563, y=0.334 | POSITION_CORRECTION_REQUIRED |
| big_o_show | x=0.529, y=0.296 | POSITION_CORRECTION_REQUIRED |
| nangman_yacht | x=0.643, y=0.419 | POSITION_CORRECTION_REQUIRED |
| blue_yacht | x=0.607, y=0.435 | POSITION_CORRECTION_REQUIRED |

**좌표 백업 확인**: git SHA `92e4b99` 에서 동일 좌표 복원 가능  
**변경 없음**: 재드래그 전까지 PROVISIONAL 유지, 추측 보정 없음

---

## §6 안전 조건

| 항목 | 상태 |
|------|------|
| 빌드 | ✅ 698 modules, hash: `index-D5MWK-U8.js` |
| 회귀 | ✅ 639/640 PASS (R20 PRE-EXISTING) |
| Inventory 45 / TG_READY 12 / 7권역 | ✅ 유지 |
| SOUL 게이팅 (isSelectablePlace) | ✅ 변경 없음 |
| Founder markerPos 15곳 좌표 | ✅ 변경 없음 |
| PROVISIONAL 유지 | ✅ 15곳 모두 |
| VERIFIED 자동 승격 | ✅ 없음 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §7 Founder 다음 액션

| 항목 | 액션 |
|------|------|
| 탐색 클릭 확인 | Zone 2 → 낭만요트 버튼 클릭 → 하이라이트 + 지도 마커 ring 확인 |
| 위치 재지정 | QA Preview 드래그 모드 → 아쿠아플라넷·빅오쇼·낭만요트·블루요트 4곳 재드래그 → 내보내기 |
| 재지정 좌표 전달 | 코드야에게 4곳 신규 x/y 전달 → PROVISIONAL markerPos 갱신 |
