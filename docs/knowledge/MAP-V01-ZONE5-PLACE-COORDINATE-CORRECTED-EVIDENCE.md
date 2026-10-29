# MAP V0.1 — Zone 5 Place & Coordinate Corrected Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE5_PLACE_COORDINATE_CORRECTED  
**분류**: 장소 변경 + 좌표 정정 (5곳) + 신규 등록 (1곳) + 제외 (1곳)

---

## §1 변경 요약

| 항목 | 변경 내용 |
|------|-----------|
| 이순신마리나 (`lee_soon_shin_marina`) | Zone 5 탐색 제외 (`hidden:true`, `tg_excluded`) |
| 웅천친수공원 (`ungcheon_park`) | Zone 5 신규 등록 (PLACEMENT_PENDING, markerPos 없음) |
| 장도 (`jangdo`) | 좌표 정정 (0.525/0.503 → **0.521/0.471**) |
| 유월드루지 (`yworld_luge`) | 좌표 정정 (0.461/0.460 → **0.458/0.444**) |
| 소호요트장 (`soho_yacht`) | 좌표 정정 (0.478/0.509 → **0.476/0.509**) |
| 소호동동다리 (`soho_bridge`) | 좌표 정정 (0.496/0.471 → **0.480/0.483**) |
| 서틀러다육식물원 (`settler_cactus`) | 좌표 정정 (0.406/0.459 → **0.404/0.442**) |

---

## §2 Founder 결정 근거

- 이순신마리나의 기존 좌표 (0.547/0.504)는 잘못된 위치였음
- 이전 이순신마리나 좌표로 사용된 (0.521/0.471)이 실제 **장도** 위치로 확인됨
- 이순신마리나는 Zone 5 관광 탐색에서 제외 (물리 삭제 금지)
- 웅천친수공원이 이순신마리나 대체 장소로 Zone 5에 추가 (좌표 미확정)

---

## §3 Zone 5 최종 좌표표 (Founder 최종 2026-10-29)

| place_id | name_ko | NEW x | NEW y | 이전 x | 이전 y | SOURCE_SAVED |
|----------|---------|-------|-------|--------|--------|-------------|
| yworld_luge | 유월드루지 | **0.458** | **0.444** | 0.461 | 0.460 | ✅ |
| jangdo | 장도 | **0.521** | **0.471** | 0.525 | 0.503 | ✅ |
| soho_yacht | 소호요트장 | **0.476** | **0.509** | 0.478 | 0.509 | ✅ |
| soho_bridge | 소호동동다리 | **0.480** | **0.483** | 0.496 | 0.471 | ✅ |
| settler_cactus | 서틀러다육식물원 | **0.404** | **0.442** | 0.406 | 0.459 | ✅ |
| lee_soon_shin_marina | 이순신마리나 | (제외) | (제외) | 0.547 | 0.504 | ❌ hidden |
| ungcheon_park | 웅천친수공원 | PLACEMENT_PENDING | — | 미등록 | — | ❌ 좌표 미확정 |

---

## §4 Puppeteer 검증 결과

**테스트**: `tests/map-zone5-corrected-verify.js`  
**방법**: localStorage 주입 없음 — yeosuMapData.js SOURCE 직접 렌더 측정

```
[ 5곳 좌표 검증 ]
  yworld_luge:    SOURCE=(0.458,0.444) render=(0.4580,0.4440) Δ=0.0000 ✅
  jangdo:         SOURCE=(0.521,0.471) render=(0.5210,0.4710) Δ=0.0000 ✅
  soho_yacht:     SOURCE=(0.476,0.509) render=(0.4760,0.5090) Δ=0.0000 ✅
  soho_bridge:    SOURCE=(0.480,0.483) render=(0.4800,0.4830) Δ=0.0000 ✅
  settler_cactus: SOURCE=(0.404,0.442) render=(0.4040,0.4420) Δ=0.0000 ✅
  결과: 5/5 PASS

[ 제외 장소 마커 없음 확인 ]
  이순신마리나: 마커 없음 (정상) ✅
  웅천친수공원: 마커 없음 (정상) ✅

최종 판정: ✅ PASS
```

---

## §5 Inventory 재계산

| 항목 | 수량 | 비고 |
|------|------|------|
| 기존 Inventory | 49 | SHA a47c94c 기준 |
| 신규 등록 (`ungcheon_park`) | +1 | PLACEMENT_PENDING |
| 제외 (`lee_soon_shin_marina`) | hidden 처리, 삭제 아님 | Inventory 잔존 |
| **최신 Inventory** | **50** | |
| SOURCE_SAVED (markerPos 존재·표시 가능) | **35** | 36 - 1(이순신마리나) |
| PLACEMENT_PENDING (markerPos 없음) | 2 | ungcheon_park + gosodong_mural |

---

## §6 SOURCE_SAVED vs FOUNDER_VISUAL_ACCEPTED 구분

| 상태 | 의미 |
|------|------|
| SOURCE_SAVED | yeosuMapData.js에 markerPos 저장됨 (QA 표시 가능) |
| FOUNDER_VISUAL_ACCEPTED | Founder가 실제 화면에서 위치 정확성 승인 |
| PROVISIONAL | SOURCE_SAVED이나 아직 VERIFIED 아님 |

Zone 5 5곳: **SOURCE_SAVED ✅ / FOUNDER_VISUAL_ACCEPTED ⏳** (Founder 화면 확인 후 기록 예정)

---

## §7 빌드·회귀

| 항목 | 결과 |
|------|------|
| Vite build | ✅ 698 modules |
| Jest | ✅ 639/640 (R20 PRE-EXISTING) |
| Puppeteer Zone 5 | ✅ 5/5 PASS Δ=0.0000 |

---

## §8 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| Zone 1·2·3·4·6·7 좌표 변경 | ❌ 없음 |
| lee_soon_shin_marina 물리 삭제 | ❌ 없음 (hidden:true) |
| SOUL 의존성 확인 | ✅ 없음 (services/routes 0건) |
| 이순신마리나 place_id 재사용 | ❌ 없음 (ungcheon_park 별도 place_id) |
| 추측 좌표 적용 | ❌ 없음 |
| VERIFIED 자동 승격 | ❌ 없음 |
| SOUL 게이팅 변경 | ❌ 없음 |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
