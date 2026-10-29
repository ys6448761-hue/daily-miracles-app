# MAP V0.1 — Zone 5·6·7 Visual Reconciliation Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE5_7_VISUAL_RECONCILIATION_HOLD  
**분류**: Founder 시각 검수 오류 확인 — 신규 좌표 대기

---

## §1 Founder 시각 검수 판정 (2026-10-29)

| Zone | 권역명 | 판정 |
|------|--------|------|
| Zone 3 | 돌산권 | ✅ FOUNDER_VISUAL_ACCEPTED |
| Zone 4 | 향일암권 | ✅ FOUNDER_VISUAL_ACCEPTED |
| Zone 5 | 소호·장도권 | ❌ VISUAL_REJECTED — 위치 오류 |
| Zone 6 | 화양·여자만권 | ❌ VISUAL_REJECTED — 위치 오류 |
| Zone 7 | 섬섬길 | ❌ VISUAL_REJECTED — 위치 오류 |

---

## §2 Zone 5·6·7 현황표 (12곳)

**주의**: "최신 DRAFT x/y" 열은 Founder 브라우저 localStorage(`yeosu_map_draft_v02_overview`)의 값이다.  
개발 쉘에서 Founder 브라우저 localStorage에 접근 불가 — 현재 TBD.  
"실제 렌더 x/y" = SOURCE와 동일 (렌더링 코드가 markerPos.overview를 그대로 사용).

### Zone 5 (소호·장도권)

| place_id | name_ko | SOURCE x | SOURCE y | 최신 DRAFT x/y | 실제 렌더 x/y | Founder 시각 검수 | 수정 필요 |
|----------|---------|----------|----------|----------------|---------------|-------------------|-----------|
| yworld_luge | 유월드루지 | 0.461 | 0.460 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| jangdo | 장도 | 0.525 | 0.503 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| soho_yacht | 소호요트장 | 0.478 | 0.509 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| soho_bridge | 소호동동다리 | 0.496 | 0.471 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| lee_soon_shin_marina | 이순신마리나 | 0.547 | 0.504 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| settler_cactus | 서틀러다육식물원 | 0.406 | 0.459 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |

### Zone 6 (화양·여자만권)

| place_id | name_ko | SOURCE x | SOURCE y | 최신 DRAFT x/y | 실제 렌더 x/y | Founder 시각 검수 | 수정 필요 |
|----------|---------|----------|----------|----------------|---------------|-------------------|-----------|
| gasari_ecology | 가사리생태공원 | 0.364 | 0.404 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| yeojaman_sunset | 여자만갯벌/해넘이 | 0.277 | 0.288 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| seomdalcheon | 섬달천 | 0.254 | 0.341 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| hwanyang_drive | 화양드라이브 | 0.433 | 0.506 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |

### Zone 7 (섬섬길)

| place_id | name_ko | SOURCE x | SOURCE y | 최신 DRAFT x/y | 실제 렌더 x/y | Founder 시각 검수 | 수정 필요 |
|----------|---------|----------|----------|----------------|---------------|-------------------|-----------|
| sado_island | 사도 | 0.307 | 0.823 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |
| hahwado_island | 하화도 | 0.420 | 0.818 | TBD (미확인) | SOURCE와 동일 | ❌ VISUAL_REJECTED | YES |

---

## §3 초안 확보 경로 (Founder 작업)

**기존 QA 편집기 사용 — 재개발 불필요**

### Zone 5 (소호·장도권) 내보내기 절차

1. `/muyojeong?qa_preview=boundary` 접속
2. **지역별 보기** → **소호·장도권** 선택
3. 마커 위치 지정 모드 → **시작**
4. 위치 오류 장소만 드래그하여 올바른 위치로 이동
5. **"전체 좌표 내보내기"** 버튼 클릭 → 클립보드 복사
6. 코드야에게 전달

Zone 6 (화양·여자만권), Zone 7 (섬섬길)도 동일 절차.

### DevTools 직접 추출 (현재 초안이 맞는 경우)

```javascript
// Chrome DevTools Console
(function() {
  const raw = localStorage.getItem('yeosu_map_draft_v02_overview');
  if (!raw) { console.log('초안 없음'); return; }
  const draft = JSON.parse(raw);
  const zone567 = [
    'yworld_luge','jangdo','soho_yacht','soho_bridge','lee_soon_shin_marina','settler_cactus',
    'gasari_ecology','yeojaman_sunset','seomdalcheon','hwanyang_drive',
    'sado_island','hahwado_island'
  ];
  console.log('=== Zone 5·6·7 초안 좌표 ===');
  for (const code of zone567) {
    const c = draft[code];
    if (c) console.log(`${code}: x=${c.x}, y=${c.y}`);
    else console.log(`${code}: 없음 (드래그 미완료)`);
  }
})();
```

---

## §4 판정 근거

**기존 16/16 PASS는 "SOURCE = Founder 전달값" 일치 및 렌더링 정합 검사**  
실제 지도상 장소 위치가 올바른지의 검증이 아님.

Founder가 스크린샷으로 Zone 5·6·7 위치 오류를 직접 확인함 → VISUAL_REJECTED.

**추측 좌표 적용 불가**: 공통 offset 적용·임의 이동 금지. Founder 결정 후에만 반영.

---

## §5 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| Zone 1·2 좌표 변경 | ❌ 없음 |
| Zone 3 최신 정합 좌표 변경 | ❌ 없음 |
| Zone 4 정상 좌표 변경 | ❌ 없음 |
| Zone 5~7 추측 좌표 적용 | ❌ 없음 |
| 기존 초안·저장 데이터 삭제 | ❌ 없음 |
| Inventory 49곳 | ✅ 유지 |
| PROVISIONAL 유지 | ✅ |
| VERIFIED 자동 승격 | ❌ 없음 |
| SOUL 게이팅 변경 | ❌ 없음 |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §6 다음 단계

Founder가 제공해야 할 항목:

| 항목 | 방법 |
|------|------|
| Zone 5 수정 좌표 (6곳) | QA 편집기 드래그 → "전체 좌표 내보내기" |
| Zone 6 수정 좌표 (4곳) | QA 편집기 드래그 → "전체 좌표 내보내기" |
| Zone 7 수정 좌표 (2곳) | QA 편집기 드래그 → "전체 좌표 내보내기" |

이미 정확한 장소는 재드래그 불필요 — 해당 장소 코드와 새 좌표만 전달하면 됨.
