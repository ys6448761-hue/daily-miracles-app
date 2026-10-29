# MAP V0.1 — Zone 4~7 Coordinates Reconciliation Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE4_7_COORDINATES_RECONCILED  
**분류**: 좌표 대조 + 렌더링 검증 (코드 변경 없음)

---

## §1 대조 결과: Founder 전달값 vs SOURCE (yeosuMapData.js)

### Zone 4 (향일암권) — 4곳

| place_id | name_ko | Founder x | Founder y | SOURCE x | SOURCE y | 일치? |
|----------|---------|-----------|-----------|----------|----------|-------|
| dolsan_got_market | 돌산갓장터마을 | 0.702 | 0.660 | 0.702 | 0.660 | ✅ |
| hyangiram | 향일암 | 0.751 | 0.804 | 0.751 | 0.804 | ✅ |
| nk_submarine | 북한반잠수정전시관 | 0.726 | 0.772 | 0.726 | 0.772 | ✅ |
| bonghwangsan | 봉황산자연휴양림 | 0.678 | 0.743 | 0.678 | 0.743 | ✅ |

### Zone 5 (소호·장도권) — 6곳

| place_id | name_ko | Founder x | Founder y | SOURCE x | SOURCE y | 일치? |
|----------|---------|-----------|-----------|----------|----------|-------|
| yworld_luge | 유월드루지 | 0.461 | 0.460 | 0.461 | 0.460 | ✅ |
| jangdo | 장도 | 0.525 | 0.503 | 0.525 | 0.503 | ✅ |
| soho_yacht | 소호요트장 | 0.478 | 0.509 | 0.478 | 0.509 | ✅ |
| soho_bridge | 소호동동다리 | 0.496 | 0.471 | 0.496 | 0.471 | ✅ |
| lee_soon_shin_marina | 이순신마리나 | 0.547 | 0.504 | 0.547 | 0.504 | ✅ |
| settler_cactus | 서틀러다육식물원 | 0.406 | 0.459 | 0.406 | 0.459 | ✅ |

### Zone 6 (화양·여자만권) — 4곳

| place_id | name_ko | Founder x | Founder y | SOURCE x | SOURCE y | 일치? |
|----------|---------|-----------|-----------|----------|----------|-------|
| gasari_ecology | 가사리생태공원 | 0.364 | 0.404 | 0.364 | 0.404 | ✅ |
| yeojaman_sunset | 여자만갯벌/해넘이 | 0.277 | 0.288 | 0.277 | 0.288 | ✅ |
| seomdalcheon | 섬달천 | 0.254 | 0.341 | 0.254 | 0.341 | ✅ |
| hwanyang_drive | 화양드라이브 | 0.433 | 0.506 | 0.433 | 0.506 | ✅ |

### Zone 7 (섬섬길) — 2곳

| place_id | name_ko | Founder x | Founder y | SOURCE x | SOURCE y | 일치? |
|----------|---------|-----------|-----------|----------|----------|-------|
| sado_island | 사도 | 0.307 | 0.823 | 0.307 | 0.823 | ✅ |
| hahwado_island | 하화도 | 0.420 | 0.818 | 0.420 | 0.818 | ✅ |

**합계: 16/16 MATCH** — 좌표 변경 불필요

---

## §2 Puppeteer 렌더링 검증 (16/16 PASS)

**테스트**: `tests/map-zone47-alignment.js`  
**방법**: 전체 Zone 3~7 SOURCE 좌표를 localStorage에 주입 → 권역별 QA preview → placement mode candidate 마커 vs regular 마커 비교

```
Zone 4 (향일암권):
  dolsan_got_market    Founder=SRC ✅  cand=(0.7020,0.6600)  reg=(0.7020,0.6600)  Δ=0.0000 ✅
  hyangiram            Founder=SRC ✅  cand=(0.7510,0.8040)  reg=(0.7510,0.8040)  Δ=0.0000 ✅
  nk_submarine         Founder=SRC ✅  cand=(0.7260,0.7720)  reg=(0.7260,0.7720)  Δ=0.0000 ✅
  bonghwangsan         Founder=SRC ✅  cand=(0.6780,0.7430)  reg=(0.6780,0.7430)  Δ=0.0000 ✅
  결과: 4/4 PASS

Zone 5 (소호·장도권):
  yworld_luge          Founder=SRC ✅  cand=(0.4610,0.4600)  reg=(0.4610,0.4600)  Δ=0.0000 ✅
  jangdo               Founder=SRC ✅  cand=(0.5250,0.5030)  reg=(0.5250,0.5030)  Δ=0.0000 ✅
  soho_yacht           Founder=SRC ✅  cand=(0.4780,0.5090)  reg=(0.4780,0.5090)  Δ=0.0000 ✅
  soho_bridge          Founder=SRC ✅  cand=(0.4960,0.4710)  reg=(0.4960,0.4710)  Δ=0.0000 ✅
  lee_soon_shin_marina Founder=SRC ✅  cand=(0.5470,0.5040)  reg=(0.5470,0.5040)  Δ=0.0000 ✅
  settler_cactus       Founder=SRC ✅  cand=(0.4060,0.4590)  reg=(0.4060,0.4590)  Δ=0.0000 ✅
  결과: 6/6 PASS

Zone 6 (화양·여자만권):
  gasari_ecology       Founder=SRC ✅  cand=(0.3640,0.4040)  reg=(0.3640,0.4040)  Δ=0.0000 ✅
  yeojaman_sunset      Founder=SRC ✅  cand=(0.2770,0.2880)  reg=(0.2770,0.2880)  Δ=0.0000 ✅
  seomdalcheon         Founder=SRC ✅  cand=(0.2540,0.3410)  reg=(0.2540,0.3410)  Δ=0.0000 ✅
  hwanyang_drive       Founder=SRC ✅  cand=(0.4330,0.5060)  reg=(0.4330,0.5060)  Δ=0.0000 ✅
  결과: 4/4 PASS

Zone 7 (섬섬길):
  sado_island          Founder=SRC ✅  cand=(0.3070,0.8230)  reg=(0.3070,0.8230)  Δ=0.0000 ✅
  hahwado_island       Founder=SRC ✅  cand=(0.4200,0.8180)  reg=(0.4200,0.8180)  Δ=0.0000 ✅
  결과: 2/2 PASS

최종: 16/16 PASS — Δ=0.0000 (ALL)
```

---

## §3 시각적 불일치("밀려 보임") 원인 분석

### 판정: 렌더링 코드 정상 — Founder 브라우저 localStorage stale data

코드는 SOURCE 좌표를 그대로 렌더링함. Δ=0.0000 검증 완료.

Founder 화면의 "밀려 보임"은 Zone 3와 동일한 패턴:

| 단계 | Founder localStorage | yeosuMapData.js |
|------|---------------------|-----------------|
| 최초 배치 (이전 세션) | 배치 좌표 저장 | - |
| SOURCE 저장 (코드 반영) | 이전 배치 좌표 유지 | SOURCE 좌표 |
| 현재 상태 | stale 초안 좌표 | SOURCE 좌표 |

→ 초록(localStorage stale) vs 주황(SOURCE) 위치 불일치 시각 확인.

### 해결 방법 (코드 변경 없음)

**방법 A** — UI 버튼:
1. `/muyojeong?qa_preview=boundary` 접속
2. 각 권역 선택 (향일암권·소호·장도권·화양·여자만권·섬섬길)
3. 마커 위치 지정 → 시작
4. **"초안 삭제 (전체 초기화)"** 클릭
5. 권역마다 반복 (또는 한 번으로 전체 삭제)

**방법 B** — DevTools:
```
Application → Local Storage → http://localhost:5000 → yeosu_map_draft_v02_overview → Delete
```

---

## §4 코드 변경 없음

좌표 변경: 없음 (Founder 전달값 = SOURCE 16/16 일치)  
렌더링 코드 변경: 없음  
테스트 파일 신규 추가: `tests/map-zone47-alignment.js`

---

## §5 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| Zone 3 최신 좌표 변경 | ❌ 없음 |
| Zone 1·2 좌표 변경 | ❌ 없음 |
| Zone 4~7 좌표 변경 | ❌ 없음 (Founder 전달값 = SOURCE) |
| 36곳 SOURCE_SAVED 기준선 | ✅ 유지 |
| 49곳 Inventory | ✅ 유지 |
| PROVISIONAL 유지 | ✅ |
| VERIFIED 자동 승격 | ❌ 없음 |
| SOUL 게이팅 변경 | ❌ 없음 |
| Founder 재드래그 요청 | ❌ 없음 |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
