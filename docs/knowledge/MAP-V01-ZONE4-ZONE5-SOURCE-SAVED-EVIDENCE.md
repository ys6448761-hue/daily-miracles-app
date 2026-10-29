# MAP V0.1 — Zone 4·5 Founder Coordinates Source Saved Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE4_ZONE5_SOURCE_SAVED  
**Classification**: EXTEND — Zone 4·5 overview markerPos.overview PROVISIONAL 저장

---

## §1 저장 좌표

### Zone 4 향일암권 (4/4)

| place_id | name_ko | x | y | confidence |
|----------|---------|---|---|------------|
| dolsan_got_market | 돌산갓장터마을 | 0.702 | 0.660 | PROVISIONAL |
| hyangiram | 향일암 | 0.751 | 0.804 | PROVISIONAL |
| nk_submarine | 북한반잠수정전시관 | 0.726 | 0.772 | PROVISIONAL |
| bonghwangsan | 봉황산자연휴양림 | 0.678 | 0.743 | PROVISIONAL |

### Zone 5 소호·장도권 (6/6)

| place_id | name_ko | x | y | confidence |
|----------|---------|---|---|------------|
| yworld_luge | 유월드루지 | 0.461 | 0.460 | PROVISIONAL |
| jangdo | 장도 | 0.525 | 0.503 | PROVISIONAL |
| soho_yacht | 소호요트장 | 0.478 | 0.509 | PROVISIONAL |
| soho_bridge | 소호동동다리 | 0.496 | 0.471 | PROVISIONAL |
| lee_soon_shin_marina | 이순신마리나 | 0.547 | 0.504 | PROVISIONAL |
| settler_cactus | 서틀러다육식물원 | 0.406 | 0.459 | PROVISIONAL |

---

## §2 자동 비교 검증 (10/10 PASS)

`node tests/map-zone45-verify.mjs`:

```
PASS dolsan_got_market x=0.702 y=0.66 zone=4
PASS hyangiram x=0.751 y=0.804 zone=4
PASS nk_submarine x=0.726 y=0.772 zone=4
PASS bonghwangsan x=0.678 y=0.743 zone=4
PASS yworld_luge x=0.461 y=0.46 zone=5
PASS jangdo x=0.525 y=0.503 zone=5
PASS soho_yacht x=0.478 y=0.509 zone=5
PASS soho_bridge x=0.496 y=0.471 zone=5
PASS lee_soon_shin_marina x=0.547 y=0.504 zone=5
PASS settler_cactus x=0.406 y=0.459 zone=5

10/10 PASS ✅
```

---

## §3 Puppeteer Zone별 QA 마커 수

| Zone | 예상 | 실제 | 타 권역 혼입 |
|------|------|------|------------|
| Zone 1 (원도심) | 6 | 6 | 0 |
| Zone 2 (오동도) | 9 | 9 | 0 |
| Zone 3 (돌산권) | 5 | 5 | 0 |
| Zone 4 (향일암권) | 4 | 4 | 0 ✅ |
| Zone 5 (소호·장도권) | 6 | 6 | 0 ✅ |
| Zone 6 (화양·여자만권) | 4 | 4 | 0 |
| Zone 7 (섬섬길) | 2 | 2 | 0 |
| **합계** | **36** | **36** | **0** |

---

## §4 전체 QA 표시 가능 수 재계산

| 분류 | 수량 | 비고 |
|------|------|------|
| markerPos 보유 (confidence: HIGH) | 15 | Zone 1·2 공개 표시 |
| markerPos 보유 (confidence: PROVISIONAL) | 21 | Zone 3·4·5·6·7 QA 표시 |
| markerPos 없음 / PLACEMENT_OPEN | 13 | 좌표 미제공 |
| **Inventory 총계** | **49** | |

QA Preview 총 표시 가능: **36곳** (26→36, +10)  
공개 표시: **15곳** (Zone 1·2 HIGH만 — 불변)

---

## §5 미배치 장소 현황

| place_id | Zone | 사유 |
|----------|------|------|
| gosodong_mural | 1 | oldtown 좌표 미제공 |
| yeosu_fish_market | 1 | UV-2 좌표 미검증 |
| nangman_luge | 2 | oldtown 좌표 미표시 (Founder 결정 보류) |
| aqua_planet | 2 | oldtown 좌표 없음 |
| big_o_show | 2 | oldtown 좌표 없음 |
| minam_cruise | 3 | overview 좌표 미제공 |
| isabu_cruise | 3 | overview 좌표 미제공 |
| sado_island | 7 | PROVISIONAL 있음 — 이미 QA 표시 중 |
| hahwado_island | 7 | PROVISIONAL 있음 — 이미 QA 표시 중 |
| geumo_island | 7 | PLACEMENT_OPEN |
| geomundo_island | 7 | PLACEMENT_OPEN |
| baekdo_island | 7 | PLACEMENT_OPEN |
| gaedo_island | 7 | PLACEMENT_OPEN |

---

## §6 검증

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 698 modules, 19.28s |
| Jest 회귀 | ✅ 639/640 (R20 PRE-EXISTING) |
| 소스 좌표 자동 비교 | ✅ 10/10 PASS |
| Zone 4 QA 마커 4곳 | ✅ Puppeteer |
| Zone 5 QA 마커 6곳 | ✅ Puppeteer |
| 타 권역 마커 혼입 | ✅ 0건 |
| 기존 26곳 불변 | ✅ Z1=6 / Z2=9 / Z3=5 / Z6=4 / Z7=2 |
| VERIFIED 자동 승격 | ✅ 없음 — 전부 PROVISIONAL |
| 신규 중복 레코드 | ✅ 0건 |
| 권역 소속 변경 | ✅ 없음 |
| QA·일반 마커 중심 정렬 | ✅ SHA 5d12c8e 수정 보존 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| SOUL 게이팅 변경 | ✅ 없음 |
| DB/Schema 변경 | ✅ 없음 |
