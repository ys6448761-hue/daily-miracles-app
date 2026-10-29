# MAP V0.1 — Zone 3 Draft vs Source Reconciliation Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE3_DRAFT_SOURCE_RECONCILED  
**분류**: 좌표 교체 (4곳) + 검증 완료

---

## §1 대조 결과

Founder 초안 좌표(직접 전달) vs 기존 SOURCE(yeosuMapData.js).

| place_id | name_ko | OLD x | OLD y | NEW x | NEW y | 변경 |
|----------|---------|-------|-------|-------|-------|------|
| dolsan_daegyo | 돌산대교 | 0.639 | 0.518 | **0.617** | **0.495** | ✏️ 교체 |
| dolsan_nightscape | 돌산공원 | 0.681 | 0.539 | **0.671** | **0.511** | ✏️ 교체 |
| museukmok | 무슬목 | 0.701 | 0.615 | **0.696** | **0.606** | ✏️ 교체 |
| cablecar_dolsan | 해상케이블카 돌산탑승장 | 0.678 | 0.531 | **0.715** | **0.528** | ✏️ 교체 |
| artland_resort | 예술랜드리조트 | 0.740 | 0.580 | 0.740 | 0.580 | ✅ 동일 |

---

## §2 Puppeteer 검증 결과 (5/5 PASS)

**테스트**: `tests/map-alignment-real.js`  
**방법**: Founder 초안 좌표를 localStorage에 주입 → QA preview candidate 마커 vs regular 마커 중심 비교

```
place_id               src_x   src_y   cand_x   cand_y   reg_x    reg_y    결과
dolsan_daegyo          0.617   0.495   0.6170   0.4950   0.6170   0.4950   Δ=0.0000 ✅
dolsan_nightscape      0.671   0.511   0.6710   0.5110   0.6710   0.5110   Δ=0.0000 ✅
museukmok              0.696   0.606   0.6960   0.6060   0.6960   0.6060   Δ=0.0000 ✅
cablecar_dolsan        0.715   0.528   0.7150   0.5280   0.7150   0.5280   Δ=0.0000 ✅
artland_resort         0.740   0.580   0.7400   0.5800   0.7400   0.5800   Δ=0.0000 ✅
```

**최종: PASS** — 5/5 Δ=0.0000

---

## §3 회귀 검사

| 항목 | 결과 |
|------|------|
| Vite build | ✅ 698 modules |
| Jest | ✅ 639/640 PASS (R20 PRE-EXISTING 제외) |

---

## §4 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| Zone 1·2·4·5·6·7 좌표 불변 | ✅ |
| 5곳 PROVISIONAL 유지 | ✅ |
| VERIFIED 자동 승격 | ❌ 없음 |
| 렌더링 코드 수정 | ❌ 없음 |
| 미남크루즈·이사부크루즈 상태 보존 | ✅ markerPos 없음 유지 |
| Inventory 49곳 / SOURCE_SAVED 36곳 | ✅ 유지 |
| SOUL 게이팅 변경 | ❌ 없음 |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §5 변경 파일

- `dreamtown-frontend/src/constants/yeosuMapData.js` — Zone 3 4곳 markerPos.overview x/y 교체
- `tests/map-alignment-real.js` — ZONE3_SOURCE 상수 신규 좌표로 동기화
