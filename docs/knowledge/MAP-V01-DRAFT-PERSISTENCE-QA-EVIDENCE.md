# MAP V0.1 — Draft Persistence QA Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_DRAFT_PERSISTENCE_QA_PASS (Static) — 브라우저 항목 OPEN  
**SHA**: 1247dd9  
**Method**: 정적 코드 분석 (브라우저 실행 없음)

---

## §1 검증 항목별 결과

| # | 항목 | 방법 | 결과 |
|---|------|------|------|
| V-01 | DRAFT_KEY와 imageId·데이터버전 일치 | 코드 | ✅ PASS |
| V-02 | 빈 candidates가 저장 초안 덮어쓰지 않음 | 코드 | ✅ PASS |
| V-03 | 드래그 → localStorage 저장 | 브라우저 | 🔵 OPEN |
| V-04 | 새로고침 → 같은 place_id/x/y 복원 | 브라우저 | 🔵 OPEN |
| V-05 | Zone 1↔2 이동 후 후보 좌표 보존 | 코드+브라우저 | ✅(코드) / 🔵(브라우저) |
| V-06 | 전체 내보내기 결과 ↔ 복원 좌표 일치 | 브라우저 | 🔵 OPEN |
| V-07 | 초기 마운트/Zone 전환 중 빈 candidates 덮어쓰기 없음 | 코드 | ✅ PASS |
| V-08 | 초안 삭제 = 명시적 버튼 클릭에서만 수행 | 코드 | ✅ PASS |
| V-09 | 이전 브라우저 세션 좌표 확보 가능 여부 | 브라우저 | 🔵 OPEN |

---

## §2 정적 분석 세부 결과

### V-01 — DRAFT_KEY 일치 (PASS)

```javascript
const DRAFT_KEY = 'yeosu_map_draft_v01_oldtown';
// imageId: 'oldtown' (OLDTOWN_IMG 기준) ✅
// 데이터버전: 'v01' (MAP V0.1) ✅
// 버전 변경 시 키 변경 → 오래된 초안 자동 무효화 ✅
```

두 조건 모두 현재 시스템과 일치.

### V-02 / V-07 — 빈 candidates 덮어쓰기 방지 (PASS)

```javascript
// save useEffect
if (Object.keys(candidates).length === 0) return; // ← 핵심 가드
localStorage.setItem(DRAFT_KEY, JSON.stringify(candidates));
```

**마운트 시 실행 순서:**
1. `useState({})` → candidates = `{}`
2. mount useEffect (load): localStorage → `setCandidates(parsed)` ← 복원
3. save useEffect: candidates = `{}` → length === 0 → **return** (덮어쓰지 않음) ✅

React Effect 실행 순서: render → mount effect → candidates 변경 → save effect.
초기 `{}` 상태가 save effect를 타기 전에 이미 복원된 값으로 교체됨.

### V-05 — Zone 1↔2 전환 중 후보 좌표 보존 (코드 PASS)

**ZoneDetail 렌더링 조건:**
```jsx
{activeZone === null ? (
  <ZoneOverview onSelectZone={setActiveZone} isQAPreview={isQAPreview} />
) : (
  <ZoneDetail zoneId={activeZone} ... />  // key prop 없음
)}
```

**Zone 1 → Zone 2 실제 경로:**
- Zone 1 상세 → "← 뒤로" → `setActiveZone(null)` → ZoneDetail **언마운트**
- Zone 2 카드 클릭 → `setActiveZone(2)` → ZoneDetail **재마운트**
- mount useEffect: `zone.hasDetailMap = true` (Zone 2도 oldtown 재사용 승인) → localStorage 로드
- Zone 1에서 저장한 candidates 그대로 복원 (같은 DRAFT_KEY) ✅

**Zone 1·2 공용 oldtown 이미지 → 같은 DRAFT_KEY → candidates 공유가 올바른 동작.**

### V-08 — 초안 삭제 = 명시적 버튼 전용 (PASS)

```javascript
onClick={() => {
  setCandidates({});
  setDraftRestored(false);
  setCopied(false);
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}}
```

`localStorage.removeItem`은 이 버튼 핸들러에서만 호출. 자동 삭제 경로 없음 ✅

---

## §3 브라우저 OPEN 항목 (Founder 검증 필요)

| 항목 | 검증 절차 |
|------|----------|
| V-03 드래그→저장 | 마커 드래그 후 DevTools → Application → localStorage → DRAFT_KEY 확인 |
| V-04 새로고침 복원 | 드래그 후 F5 → 마커 위치 동일, "초안 복원됨" 배지 표시 확인 |
| V-05 Zone 전환 | Zone 1 드래그 → 뒤로 → Zone 2 → 같은 마커 좌표 목록 유지 확인 |
| V-06 내보내기 일치 | 복원 후 "전체 좌표 내보내기" → 드래그 당시와 동일한 x/y 확인 |
| V-09 이전 세션 | Founder가 이전 세션 브라우저 탭을 열어 둔 경우, React state에 candidates 잔존 가능 — F12 → React DevTools → ZoneDetail state 확인 |

---

## §4 이전 Founder 편집 세션 좌표

서버에서 브라우저 localStorage/React state 접근 불가.
이전 세션이 새로고침·탭 종료 없이 살아 있다면:
- V-09: React DevTools → ZoneDetail → candidates state 직접 확인 가능
- 있다면 "전체 좌표 내보내기" 클릭 → 코드야에게 전달

없다면 재드래그 필요 (이제 localStorage로 보존됨).

---

## §5 안전 조건

| 항목 | 상태 |
|------|------|
| 기존 yeosuMapData.js markerPos 덮어쓰기 없음 | ✅ |
| VERIFIED 자동 승격 없음 | ✅ |
| Inventory 45개 / TG_READY 12개 / 7권역 | ✅ 변경 없음 |
| SOUL 게이팅 유지 | ✅ |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
