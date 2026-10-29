# MAP V0.1 — Zone 5 Visual QA Pending Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE5_VISUAL_QA_PENDING  
**분류**: Zone 5 좌표 원인 분석 완료 — 수정 좌표 대기 (코드 변경 없음)

---

## §1 원인 분석 결론

### 측정 방법

`tests/map-zone5-source-render.js`:
- localStorage 주입 없음 (개발 서버 yeosuMapData.js 직접 사용)
- Zone 5 → 소호·장도권 진입 → regular 마커 실제 DOM 좌표 측정

### 측정 결과

| place_id | name_ko | SOURCE x | SOURCE y | 렌더 x | 렌더 y | Δx | Δy |
|----------|---------|----------|----------|--------|--------|----|----|
| yworld_luge | 유월드루지 | 0.461 | 0.460 | 0.4610 | 0.4600 | 0.0000 | 0.0000 |
| jangdo | 장도 | 0.525 | 0.503 | 0.5250 | 0.5030 | 0.0000 | 0.0000 |
| soho_yacht | 소호요트장 | 0.478 | 0.509 | 0.4780 | 0.5090 | 0.0000 | 0.0000 |
| soho_bridge | 소호동동다리 | 0.496 | 0.471 | 0.4960 | 0.4710 | 0.0000 | 0.0000 |
| lee_soon_shin_marina | 이순신마리나 | 0.547 | 0.504 | 0.5470 | 0.5040 | 0.0000 | 0.0000 |
| settler_cactus | 서틀러다육식물원 | 0.406 | 0.459 | 0.4060 | 0.4590 | 0.0000 | 0.0000 |

**6/6 SOURCE = 렌더 (Δ=0.0000)**

### 판정

| 항목 | 결과 |
|------|------|
| 렌더링 코드 버그 | 없음 — SOURCE 좌표 그대로 표시됨 |
| stale localStorage 원인 | 해당 없음 — localStorage 주입 없이도 동일 |
| Founder VISUAL_REJECTED 원인 | **SOURCE 좌표 자체가 실제 장소 위치와 다름** |
| Founder 브라우저 초안 접근 | 불가 — 개발 쉘에서 Founder 브라우저 localStorage 미접근 |
| 추측 좌표 적용 | ❌ 금지 |

**요약**: 2026-10-29 "Founder 제공" 좌표는 지도 이미지 위에서 실제 장소 위치와 다르게 배치된 것으로 Founder 시각 검수에서 확인됨. 렌더링 코드는 정상 — 좌표 값 자체를 수정해야 함.

---

## §2 Zone 5 현황표

| place_id | name_ko | SOURCE x/y | Founder 초안 x/y | 렌더 x/y | Founder 검수 | 수정 필요 |
|----------|---------|------------|-----------------|----------|-------------|-----------|
| yworld_luge | 유월드루지 | 0.461/0.460 | 미확보 | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| jangdo | 장도 | 0.525/0.503 | 미확보 | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| soho_yacht | 소호요트장 | 0.478/0.509 | 미확보 | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| soho_bridge | 소호동동다리 | 0.496/0.471 | 미확보 | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| lee_soon_shin_marina | 이순신마리나 | 0.547/0.504 | 미확보 | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| settler_cactus | 서틀러다육식물원 | 0.406/0.459 | 미확보 | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |

"Founder 초안 x/y" = Founder 브라우저 localStorage `yeosu_map_draft_v02_overview`.  
개발 쉘에서 접근 불가 → 미확보.

---

## §3 Founder 수정 절차 (오류 장소만)

**전체 6곳 재드래그 불필요 — 위치 틀린 장소만 처리.**

1. `/muyojeong?qa_preview=boundary` → **소호·장도권** 선택
2. 마커 위치 지정 모드 → **시작**
3. 위치 오류인 장소(place_id 확인 후)를 드래그하여 올바른 위치로 이동
4. 정확한 장소는 그대로 유지
5. **"전체 좌표 내보내기"** 버튼 클릭 (또는 개별 "좌표 내보내기")
6. 코드야에게 결과 전달

Founder가 먼저 어떤 장소가 정확한지 지정하면, 그 장소는 재드래그 요청하지 않음.

---

## §4 DevTools 현재 초안 확인

Founder 브라우저에 이미 수정된 초안이 있을 수 있음. 아래로 확인:

```javascript
// Chrome DevTools Console (F12)
(function() {
  const raw = localStorage.getItem('yeosu_map_draft_v02_overview');
  if (!raw) { console.log('초안 없음'); return; }
  const d = JSON.parse(raw);
  const zone5 = ['yworld_luge','jangdo','soho_yacht','soho_bridge','lee_soon_shin_marina','settler_cactus'];
  console.log('=== Zone 5 현재 초안 ===');
  zone5.forEach(c => {
    const v = d[c];
    if (v) console.log(c + ': x=' + v.x + ', y=' + v.y);
    else console.log(c + ': 없음');
  });
})();
```

초안이 SOURCE와 다르면 → 해당 값 코드야에게 전달 → SOURCE 대조 후 반영.

---

## §5 코드 변경 없음

| 항목 | 결과 |
|------|------|
| Zone 5 좌표 변경 | ❌ 없음 (수정 좌표 미확보) |
| Zone 1·2·3·4·6·7 변경 | ❌ 없음 |
| 렌더링 코드 변경 | ❌ 없음 |
| 추측 좌표 적용 | ❌ 없음 |
| Inventory / SOUL 게이팅 | ✅ 유지 |
| PROVISIONAL 유지 | ✅ |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
