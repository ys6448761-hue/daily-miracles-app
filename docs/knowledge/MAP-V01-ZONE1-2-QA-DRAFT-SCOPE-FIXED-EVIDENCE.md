# MAP V0.1 — Zone 1·2 QA 편집기 권역 분리 버그 수정 Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE1_2_QA_DRAFT_SCOPE_FIXED  
**분류**: REPAIR — Zone 1 선택 시 Zone 2 초안 표시 버그 수정

---

## §1 버그 요약

**Founder 증상**: 원도심 해안권(Zone 1) QA 편집기 진입 시
- Zone 1 장소: 체크 없음
- Zone 2 장소: 체크 있음 (✓ 표시)
- 하단 좌표 목록: Zone 2 저장 초안 10곳 표시
- "초안 복원됨" 표시

---

## §2 근본 원인

**파일**: `dreamtown-frontend/src/components/YeosuMapSelector.jsx`  
**위치**: `zoneTargets` 계산 (구 line 244)

```javascript
// BEFORE (버그):
if (zone?.hasDetailMap) return p.zone === 1 || p.zone === 2;
// hasDetailMap=true인 Zone 1·2 양쪽을 항상 zoneTargets에 포함
// → Zone 1 선택 시 Zone 2 장소도 편집 대상으로 표시
// → 공유 localStorage(yeosu_map_draft_v02_oldtown)의 Zone 2 데이터가 Zone 1 화면에 노출
```

---

## §3 수정 내용

### A. `zoneTargets` — 항상 현재 권역(zoneId)만 포함
```javascript
// AFTER (수정):
return p.zone === zoneId;  // 현재 선택 권역만, Zone 1·2 구분 없이
```

### B. `zoneHasDraft` 파생 상수 추가
```javascript
const zoneHasDraft = draftRestored && zoneTargets.some(t => candidates[t.code]);
```
- `draftRestored`: 공유 oldtown localStorage에서 어떤 데이터라도 로드됨
- `zoneHasDraft`: 현재 권역 소속 장소에 초안 데이터 존재 여부

### C. "초안 복원됨" → 현재 권역 기준으로 표시
```jsx
// zoneHasDraft: 현재 권역 초안 복원됨
// draftRestored && !zoneHasDraft: Zone N 저장 초안 없음
```

### D. `copyAllCandidates` — 현재 권역 코드만 내보냄
```javascript
const zoneCodes = new Set(zoneTargets.map(t => t.code));
const entries = Object.entries(candidates).filter(([code]) => zoneCodes.has(code));
```

### E. "초안 삭제" 버튼 — 현재 권역만 삭제, 다른 권역 초안 보존
```javascript
const remaining = Object.fromEntries(
    Object.entries(candidates).filter(([code]) => !zoneCodes.has(code))
);
setCandidates(remaining);
// localStorage에 remaining 저장 (Zone 2 데이터 유지)
```

---

## §4 검증 결과

**테스트**: `tests/map-zone12-draft-scope-verify.js`

```
A. Zone 1 (원도심 해안권) 선택:
  편집 대상 권역: [1]     ✅ Zone 1만 표시
  Zone 2 미표시: ✅

B. Zone 2 (오동도·엑스포권) 선택:
  편집 대상 권역: [2]     ✅ Zone 2만 표시
  Zone 1 미표시: ✅

C. Zone 1→2→1 전환 혼선 테스트:
  Zone 1 복귀 후 편집 대상 권역: [1]  ✅ 혼선 없음

D. 일반 모드 (비 QA Preview):
  위치 지정 패널 없음: ✅

최종 판정: ✅ PASS
```

---

## §5 빌드·회귀

| 항목 | 결과 |
|------|------|
| Vite build | ✅ 698 modules |
| Jest | ✅ 639/640 (R20 PRE-EXISTING) |
| Puppeteer A/B/C/D | ✅ 4/4 PASS |

---

## §6 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| 기존 Founder 좌표 재배치 | ❌ 없음 |
| yeosu_map_draft_v02_oldtown 데이터 자동 삭제 | ❌ 없음 |
| Zone 3~7 수정 | ❌ 없음 |
| SOUL 게이팅 변경 | ❌ 없음 |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
