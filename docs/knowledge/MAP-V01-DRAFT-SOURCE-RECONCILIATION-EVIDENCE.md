# MAP V0.1 — Draft vs Source Reconciliation Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_DRAFT_SOURCE_RECONCILIATION_HOLD  
**분류**: Founder 초안 확인 대기

---

## §1 배경

이전 세션에서 확인된 사항:
- 렌더링 코드 5/5 PASS (Δ=0.0000)
- 코드 버그 없음
- Founder 브라우저 localStorage `yeosu_map_draft_v02_overview` 키에 yeosuMapData.js와 다른 좌표 추정

**개발 쉘에서 Founder 브라우저 localStorage 직접 접근 불가** — 미확인 상태로 보고하지 않음.

---

## §2 Zone 3 SOURCE 좌표 (yeosuMapData.js 현재 값)

| # | place_id | name_ko | SOURCE x | SOURCE y | confidence |
|---|----------|---------|----------|----------|------------|
| 1 | dolsan_daegyo | 돌산대교 | **0.639** | **0.518** | PROVISIONAL |
| 2 | dolsan_nightscape | 돌산공원 | **0.681** | **0.539** | PROVISIONAL |
| 3 | museukmok | 무슬목 | **0.701** | **0.615** | PROVISIONAL |
| 4 | cablecar_dolsan | 해상케이블카 돌산탑승장 | **0.678** | **0.531** | PROVISIONAL |
| 5 | artland_resort | 예술랜드리조트 | **0.740** | **0.580** | PROVISIONAL |

이 좌표는 Founder가 이전 세션에서 제공·승인한 값.

---

## §3 Founder DRAFT 확인 경로

### 방법 A — 기존 UI "전체 좌표 내보내기" 버튼 (권장)

1. Chrome에서 `http://localhost:5000/muyojeong?qa_preview=boundary` 접속
2. **지역별 보기** 탭 → **돌산권(Zone 3)** 선택
3. **📍 마커 위치 지정 모드 → 시작** 클릭
4. 초안이 있으면 좌표 패널이 표시됨
5. **"전체 좌표 내보내기 (yeosuMapData.js 형식)"** 버튼 클릭 → 클립보드에 복사
6. 복사된 내용 코드야에게 전달

출력 형식:
```
  // dolsan_daegyo
  markerPos: { overview: { x: ?, y: ?, confidence: 'HIGH', status: 'PROVISIONAL' } }

  // dolsan_nightscape
  markerPos: { overview: { x: ?, y: ?, ... } }
  ...
```

### 방법 B — 개발자 도구 콘솔 직접 추출

Chrome DevTools(F12) → Console 탭에 아래 코드 붙여넣기:

```javascript
(function() {
  const raw = localStorage.getItem('yeosu_map_draft_v02_overview');
  if (!raw) { console.log('초안 없음 — localStorage 비어 있음'); return; }
  const draft = JSON.parse(raw);
  const zone3 = ['dolsan_daegyo', 'dolsan_nightscape', 'museukmok', 'cablecar_dolsan', 'artland_resort'];
  console.log('=== Zone 3 초안 좌표 ===');
  for (const code of zone3) {
    const c = draft[code];
    if (c) console.log(`${code}: x=${c.x}, y=${c.y}`);
    else console.log(`${code}: 없음`);
  }
})();
```

---

## §4 비교 템플릿 (DRAFT 수신 후 작성)

| place_id | SOURCE x | SOURCE y | DRAFT x | DRAFT y | Δx | Δy | 일치? |
|----------|----------|----------|---------|---------|----|----|-------|
| dolsan_daegyo | 0.639 | 0.518 | TBD | TBD | — | — | — |
| dolsan_nightscape | 0.681 | 0.539 | TBD | TBD | — | — | — |
| museukmok | 0.701 | 0.615 | TBD | TBD | — | — | — |
| cablecar_dolsan | 0.678 | 0.531 | TBD | TBD | — | — | — |
| artland_resort | 0.740 | 0.580 | TBD | TBD | — | — | — |

---

## §5 대조 결과별 처리 방침 (Founder 결정 후 실행)

### Case A — 일치 (Δ ≤ 0.003)
- 조치 없음. SOURCE 유지. DRAFT 삭제 여부 Founder 선택.

### Case B — 일부 불일치, DRAFT가 최종 위치
- 해당 place_id의 markerPos.overview.x/y 를 DRAFT 값으로 교체
- 자동 덮어쓰기 금지 — Founder 승인 후 장소별 개별 반영
- confidence/status PROVISIONAL 유지

### Case C — 일부 불일치, SOURCE가 최종 위치
- DRAFT 좌표를 `docs/knowledge/MAP-V01-DRAFT-BACKUP-YYYYMMDD.md`에 백업
- 브라우저에서 "초안 삭제" 버튼으로 localStorage 초기화
- SOURCE 불변

### Case D — 초안 없음 (localStorage 비어 있음)
- 조치 없음. SOURCE가 유일한 진실.

---

## §6 내보내기 기능 코드 검증

`copyAllCandidates()` (YeosuMapSelector.jsx line 337-346):

```javascript
const copyAllCandidates = () => {
  const lines = Object.entries(candidates)
    .map(([code, { x, y }]) =>
      `  // ${code}\n  markerPos: { ${imageKey}: { x: ${x}, y: ${y}, confidence: 'HIGH', status: 'PROVISIONAL' } }`)
    .join('\n\n');
  navigator.clipboard.writeText(lines);
};
```

- `imageKey` = `'overview'` (Zone 3~7)
- 출력 좌표 = `candidates` state = localStorage에서 복원된 값
- 버튼 조건: `Object.keys(candidates).length > 1` (2개 이상 초안일 때 표시)
- **단일 장소 버튼** ("좌표 내보내기"): `{ code: 'dolsan_daegyo', x: ?, y: ? }` 형식

**기능 검증 ✅**: map-alignment-real.js 테스트에서 localStorage 주입 후 candidate 마커 5/5 정상 렌더링 확인.

---

## §7 현황 요약

| 항목 | 상태 |
|------|------|
| SOURCE 좌표 파악 | ✅ 5/5 (yeosuMapData.js) |
| DRAFT 좌표 파악 | ⏳ **HOLD — Founder 내보내기 대기** |
| 렌더링 정합성 | ✅ PASS (동일 좌표 시 Δ=0) |
| 코드 변경 | 없음 |
| 자동 덮어쓰기 | ❌ 금지 — Founder 승인 후만 허용 |
| VERIFIED 자동 승격 | ❌ 금지 |
| PR #134 merge / Production 배포 | ❌ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
