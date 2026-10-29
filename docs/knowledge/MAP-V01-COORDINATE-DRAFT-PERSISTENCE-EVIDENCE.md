# MAP V0.1 — Coordinate Draft Persistence Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_COORDINATE_DRAFT_PERSISTENCE_READY  
**SHA**: (이 커밋 이후 기록)  
**Classification**: EXTEND — 기존 candidates 흐름 보존, localStorage 층 추가

---

## §1 기존 Founder 좌표 기록 조사 결과

파일·Evidence·작업 기록 전체 검색:
- 이순신광장(lee_soon_shin_plaza) Founder 드래그 결과: **유실** — 파일에 없음
- 하멜등대(hamel_lighthouse) Founder 드래그 결과: **유실** — 파일에 없음
- 엑스포공원·스카이타워 markerPos: **없음** — Founder 드래그 미완료

**결론**: 재드래그 필요. 추정값 복구 없음.

---

## §2 구현 — localStorage 로컬 초안 자동 저장·복원

### 변경 파일
- `dreamtown-frontend/src/components/YeosuMapSelector.jsx`

### 저장 키 설계

```javascript
const DRAFT_KEY = 'yeosu_map_draft_v01_oldtown';
// imageId=oldtown, 데이터버전=v01
// 이미지·데이터 버전 변경 시 키 변경 → 오래된 초안 자동 무효화
```

### 마운트 시 복원 (useEffect — mount-only)

```javascript
useEffect(() => {
  if (!isQAPreview || !zone?.hasDetailMap) return;
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setCandidates(parsed);
        setDraftRestored(true);
      }
    }
  } catch {}
}, []);
```

### candidates 변경 시 저장 (useEffect)

```javascript
useEffect(() => {
  if (!isQAPreview || !zone?.hasDetailMap) return;
  if (Object.keys(candidates).length === 0) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(candidates));
  } catch {}
}, [candidates]);
```

### 4단계 저장 상태 레이블

| 상태 | 조건 | 표시 색상 |
|------|------|----------|
| 미지정 | candidates[code] 없음 | 흰색 35% |
| 후보 좌표 있음 | candidates[code] 있음 | 노란 85% |
| 내보내기 완료 · 코드 반영 전 | copied === code \|\| 'all' | 녹색 90% |
| **코드 반영** | candidates[code].x/y === yeosuMapData.markerPos.oldtown.x/y | 파란 90% |

### "코드 반영" 판정 로직

```javascript
const codedPlace = YEOSU_PLACES.find(p => p.code === placementTarget);
const codedPos = codedPlace?.markerPos?.oldtown;
const isCodeReflected = cand && codedPos && cand.x === codedPos.x && cand.y === codedPos.y;
```

### 초안 복원됨 배지 (편집 모드 활성 시)

편집 모드 헤더에 "초안 복원됨" 텍스트 표시.

### 초안 삭제 버튼

candidates 전체 초기화 + localStorage.removeItem(DRAFT_KEY).

---

## §3 검증 항목

| 항목 | 상태 |
|------|------|
| 드래그 → candidates 갱신 | ✅ 기존 동작 유지 |
| candidates 변경 → localStorage 저장 | ✅ useEffect |
| 새로고침 → 초안 복원 | ✅ mount useEffect |
| "전체 좌표 내보내기" → clipboard | ✅ 기존 동작 유지 |
| "초안 삭제" → state+localStorage 초기화 | ✅ 신규 |
| 상태 4단계 구분 | ✅ 미지정/후보/내보내기완료/코드반영 |
| 일반 여행 모드 영향 없음 | ✅ isQAPreview gate 유지 |
| 기존 토글 보존 | ✅ 변경 없음 |
| VERIFIED 자동 승격 없음 | ✅ |
| SOUL 게이팅 유지 | ✅ |
| Inventory 45개 / TG_READY 12개 / 7권역 | ✅ 변경 없음 |

---

## §4 Founder 다음 할 일

1. `node server.js` 재시작
2. `http://localhost:5000/muyojeong?qa_preview=boundary`
3. Zone 1 → 마커 위치 지정 모드 → 이순신광장 선택 → 드래그
4. Zone 1 → 하멜등대 선택 → 드래그
5. Zone 2 → 엑스포공원·스카이타워 드래그 (같은 oldtown 이미지)
6. "전체 좌표 내보내기" 클릭
7. 클립보드 결과 코드야에게 전달
8. **새로고침 해도 초안 유지 확인** (localStorage 복원)

---

## §5 안전 조건

| 항목 | 상태 |
|------|------|
| DB 저장 없음 | ✅ localStorage만 |
| 코드 자동 반영 없음 | ✅ Founder 전달 후 코드야가 수동 반영 |
| VERIFIED 승격 없음 | ✅ |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
