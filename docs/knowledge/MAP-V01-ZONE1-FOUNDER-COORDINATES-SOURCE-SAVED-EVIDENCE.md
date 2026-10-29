# MAP V0.1 — Zone 1 Founder Coordinates Source Saved Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE1_FOUNDER_COORDINATES_SOURCE_SAVED  
**분류**: 좌표 정정 (6곳) + 신규 마커 등록 (1곳) + PLACEMENT_PENDING 유지 (1곳)

---

## §1 배경

QA 편집기 권역 분리 버그 수정 과정에서 Zone 1 초안 유실.  
Founder가 Zone 1 원도심 해안권 마커를 직접 재지정하여 좌표 전달.  
이번 좌표 전달은 **위치 반영 지시**이며, VERIFIED 승격 승인이 아님.

---

## §2 변경 요약

| place_id | name_ko | 이전 x | 이전 y | 신규 x | 신규 y | 변경 유형 |
|----------|---------|--------|--------|--------|--------|-----------|
| lee_soon_shin_plaza | 이순신광장 | 0.401 | 0.549 | **0.375** | **0.515** | 정정 |
| romantic_pojangmacha | 낭만포차거리 | 0.613 | 0.640 | **0.599** | **0.614** | 정정 |
| hamel_lighthouse | 하멜등대 | 0.564 | 0.634 | **0.569** | **0.603** | 정정 |
| gosodong_mural | 고소동 천사벽화골목 | (없음) | — | **0.463** | **0.518** | 신규 등록 |
| jinamgwan | 진남관 | 0.391 | 0.474 | **0.380** | **0.449** | 정정 |
| opodae | 오포대 | 0.476 | 0.549 | **0.426** | **0.485** | 정정 |
| marine_park | 종포해양공원 | 0.474 | 0.601 | **0.444** | **0.582** | 정정 |
| yeosu_fish_market | 여수 수산시장 | PLACEMENT_PENDING | — | PLACEMENT_PENDING | — | 변동 없음 |

---

## §3 장소 분류 확인

| 항목 | 결과 |
|------|------|
| 고소동 천사벽화골목 중복 생성 여부 | ❌ 없음 — 기존 `gosodong_mural` place_id에 markerPos 추가 |
| 여수 수산시장 마커 생성 여부 | ❌ 없음 — PLACEMENT_PENDING 유지 |
| 여수 수산시장 탐색 가능 여부 | ✅ status='explorer' 유지 (SOUL 탐색 대상) |

---

## §4 이전 좌표 백업 위치

기존 좌표: yeosuMapData.js 주석으로 인라인 백업 (2026-10-29 Founder 재지정 전)  
추가 백업: `docs/knowledge/MAP-V01-MARKERPOS-BACKUP.md` (기존 문서)

---

## §5 Puppeteer 검증 결과

**테스트**: `tests/map-zone1-founder-coords-verify.js`  
**방법**: localStorage 주입 없음 — SOURCE 직접 렌더

```
[ 7곳 좌표 검증 ]
  ✅ 이순신광장:          SOURCE=(0.375,0.515) render=(0.3750,0.5150) Δ=0.0000
  ✅ 낭만포차거리:        SOURCE=(0.599,0.614) render=(0.5990,0.6139) Δ≈0.0001
  ✅ 하멜등대:           SOURCE=(0.569,0.603) render=(0.5690,0.6030) Δ=0.0000
  ✅ 고소동 천사벽화골목: SOURCE=(0.463,0.518) render=(0.4630,0.5179) Δ≈0.0001
  ✅ 진남관:             SOURCE=(0.380,0.449) render=(0.3800,0.4489) Δ≈0.0001
  ✅ 오포대:             SOURCE=(0.426,0.485) render=(0.4260,0.4850) Δ=0.0000
  ✅ 종포해양공원:        SOURCE=(0.444,0.582) render=(0.4440,0.5820) Δ=0.0000
  결과: 7/7 PASS

[ PLACEMENT_PENDING 마커 없음 확인 ]
  ✅ 여수 수산시장: 마커 없음 (정상)

최종 판정: ✅ PASS
```

---

## §6 빌드·회귀

| 항목 | 결과 |
|------|------|
| Vite build | ✅ 698 modules |
| Jest | ✅ 639/640 (R20 PRE-EXISTING) |
| Puppeteer Zone 1 | ✅ 7/7 PASS Δ<0.001 |

---

## §7 Inventory 재계산

| 항목 | 수량 | 비고 |
|------|------|------|
| 기존 Inventory | 50 | SHA 41cfed0 기준 |
| 신규 등록 | 0 | gosodong_mural 기존 장소에 markerPos 추가 |
| **최신 Inventory** | **50** | 변동 없음 |
| Zone 1 SOURCE_SAVED | **7곳** | 이전 6곳 → +1 (고소동) |
| Zone 1 PLACEMENT_PENDING | **1곳** | yeosu_fish_market |

---

## §8 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| Zone 2 좌표 변경 | ❌ 없음 |
| Zone 3·4 Founder 수용 좌표 변경 | ❌ 없음 |
| Zone 5·6·7 변경 | ❌ 없음 |
| SOUL 게이팅 변경 | ❌ 없음 |
| DB/Schema 변경 | ❌ 없음 |
| VERIFIED 자동 승격 | ❌ 없음 (PROVISIONAL 유지) |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §9 SOURCE_SAVED vs FOUNDER_VISUAL_ACCEPTED

Zone 1 7곳: **SOURCE_SAVED ✅ / FOUNDER_VISUAL_ACCEPTED ⏳** (Founder 화면 확인 대기)
