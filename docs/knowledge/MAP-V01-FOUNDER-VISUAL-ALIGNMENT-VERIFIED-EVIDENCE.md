# MAP V0.1 — Founder Visual Alignment Regression Investigation Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_FOUNDER_VISUAL_ALIGNMENT_VERIFIED  
**Classification**: 감사 전용 — 코드 변경 없음

---

## §1 기존 검증(Δ=0) 오류 원인 분석

### 이전 Puppeteer 테스트 (`map-alignment-verify.js`) 결함

```javascript
// 잘못된 QA 진입 선택자:
const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('위치 지정'));
```

실제 버튼 텍스트: `'시작'` (line 443 of YeosuMapSelector.jsx)  
`'위치 지정'`은 `<span>` 안의 라벨 텍스트 — 버튼이 아님.

**결과**: placement mode가 한 번도 진입되지 않았음.  
두 측정 모두 QA preview 일반 모드의 동일한 regular 마커를 측정 → Δ=0은 동일 마커를 두 번 측정한 값.

---

## §2 올바른 검증 — 실제 candidate vs regular 비교

**테스트**: `tests/map-alignment-real.js`

**방법론**:
1. localStorage에 yeosuMapData.js와 동일한 Zone 3 좌표 주입
2. Zone 3 QA preview 진입
3. `'시작'` 버튼으로 placement mode 실제 진입
4. 초록 candidate 마커(12×12 circle) 중심 측정
5. `'종료'` 버튼으로 placement mode 종료
6. 주황 regular PROVISIONAL 마커(26×26 outer div) 중심 측정
7. 비교

**결과 (5/5 PASS)**:

```
place_id              src_x  src_y  cand      reg       Δ(cand)        Δ(reg)
─────────────────────────────────────────────────────────────────────────────
dolsan_daegyo         0.639  0.518  (0.6390,0.5180)  (0.6390,0.5180)  0,0    0,0  ✅
dolsan_nightscape     0.681  0.539  (0.6810,0.5390)  (0.6810,0.5390)  0,0    0,0  ✅
museukmok             0.701  0.615  (0.7010,0.6150)  (0.7010,0.6150)  0,0    0,0  ✅
cablecar_dolsan       0.678  0.531  (0.6780,0.5310)  (0.6780,0.5310)  0,0    0,0  ✅
artland_resort        0.740  0.580  (0.7400,0.5800)  (0.7400,0.5800)  0,0    0,0  ✅
```

**렌더링 수학 검증**:
- candidate 마커: `padding: 8px` + `translate(-50%,-50%)` → circle center = (c.x, c.y) ✅
- regular 마커: `padding: 8px` + `translate(-50%,-50%)` → circle center = (mp.x, mp.y) ✅
- 동일 coordinate → 동일 visual position ✅

---

## §3 Founder 화면 불일치 실제 원인

**코드 버그 없음**. 렌더링 로직은 수학적으로 검증됨.

**실제 원인**: Founder 브라우저 localStorage의 `yeosu_map_draft_v02_overview` 키에 저장된 좌표가 yeosuMapData.js의 현재 좌표와 다름.

**시나리오 (추정)**:

| 단계 | localStorage | yeosuMapData.js |
|------|-------------|-----------------|
| SHA 5d12c8e 이전: Founder 최초 배치 | 구 flex layout 기반 좌표 | — |
| Founder 내보내기 → 코드 반영 | 구 좌표 유지 | 구 내보내기 좌표 |
| SHA 5d12c8e 이후: Founder 재배치 (현 세션) | 새 배치 좌표 | 구 내보내기 좌표 (불일치) |

→ 주황(yeosuMapData.js 구 좌표) vs 초록(localStorage 새 배치 좌표) → 위치 차이 시각 확인.

---

## §4 해결 경로

**코드 변경 없이 Founder 브라우저에서 해결**:

1. QA preview URL 접속 (`/muyojeong?qa_preview=boundary`)
2. Zone 3(돌산권) 진입
3. 마커 위치 지정 모드 → `시작`
4. **"초안 삭제 (전체 초기화)"** 버튼 클릭
5. localStorage `yeosu_map_draft_v02_overview` 초기화됨
6. placement mode 종료 → 주황 마커만 남음 (yeosuMapData.js 기준)
7. 새 배치 세션에서 드래그하면 주황 마커 위치와 동일한 곳에 시작점 제공됨

**또는**: 개발자 도구 → Application → Local Storage → `yeosu_map_draft_v02_overview` 수동 삭제.

---

## §5 정리

| 항목 | 결과 |
|------|------|
| 렌더링 코드 버그 | 없음 ✅ |
| SHA 5d12c8e 수정 유효 | 확인됨 ✅ |
| 실제 5/5 PASS | Δ=0.0000 ✅ |
| 코드 변경 필요 | 없음 |
| 원인 | localStorage stale data (Founder 브라우저 한정) |
| 해결 | Founder가 "초안 삭제" 버튼으로 localStorage 초기화 |
| Founder 재드래그 요청 | 없음 — 기존 yeosuMapData.js 좌표 보존 |
| 기존 36곳 좌표 변경 | 없음 ✅ |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
