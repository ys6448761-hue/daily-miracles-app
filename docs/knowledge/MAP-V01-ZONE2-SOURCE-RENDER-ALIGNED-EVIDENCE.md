# MAP V0.1 — Zone 2 SOURCE_RENDER_ALIGNED Evidence

**Date**: 2026-10-30  
**Status**: MAP_V01_ZONE2_SOURCE_RENDER_ALIGNED / FOUNDER_VISUAL_QA_PENDING  
**분류**: REPAIR — Zone 2 SOURCE 좌표 → Founder 최종 좌표 11곳 반영

---

## §1 배경

Zone 6에서 발견한 QA localStorage 최신값 ↔ 일반 지도 SOURCE 구버전 불일치 사례를 참고.  
Zone 2 전체 좌표를 Founder 최종 지시(2026-10-30) 기준으로 교체.

Zone 6 FOUNDER_VISUAL_ACCEPTED 확정 수령 후 Zone 2 작업 착수.

---

## §2 변경 요약 — 11곳

| place_id | name_ko | 이전 x | 이전 y | 신규 x | 신규 y | 비고 |
|----------|---------|--------|--------|--------|--------|------|
| odongdo | 오동도 | 0.853 | 0.392 | **0.850** | **0.355** | 정정 |
| cablecar | 케이블카 | 0.660 | 0.544 | **0.664** | **0.507** | 정정 |
| yeosu_expo_park | 엑스포공원 | 0.558 | 0.211 | **0.556** | **0.185** | 정정 |
| sky_tower | 스카이타워 | 0.604 | 0.137 | 0.604 | **0.121** | y 정정 |
| jaisan_park | 자산공원 | 0.581 | 0.537 | **0.602** | **0.508** | 정정 |
| aquaplanet | 아쿠아플라넷 | 0.586 | 0.326 | **0.557** | **0.304** | 정정 |
| yeosu_expo_station | 여수엑스포역 | (없음) | — | **0.567** | **0.106** | 신규 등록 |
| yeosu_ocean_cruise | 여수오션크루즈 | (없음) | — | **0.608** | **0.209** | 신규 등록 |
| nangman_yacht | 낭만요트 | 0.657 | 0.430 | **0.627** | **0.425** | 정정 |
| blue_yacht | 블루요트 | 0.627 | 0.414 | **0.593** | **0.378** | 정정 |
| big_o_show | 빅오쇼 | 0.549 | 0.285 | **0.543** | **0.232** | 정정 |

**9곳 정정 + 2곳 신규 markerPos 등록 (place_id 기존 재사용)**

미배치 유지: 엑스포 바닷길(`expo_ocean_trail`) / 만성리해수욕장(`manseongri_beach`)  
→ 이번 Founder 좌표 없음. 임의 좌표 생성 금지 규정 준수.

---

## §3 Puppeteer 검증 결과

**테스트**: `tests/map-zone2-source-render-aligned.js`

```
A. Zone 2 QA Preview — 일반 지도 (11곳 SOURCE 확인):
  ✅ 오동도:        SOURCE=(0.850,0.355) render=(0.8500,0.3550) Δx=0.0000 Δy=0.0000
  ✅ 케이블카:      SOURCE=(0.664,0.507) render=(0.6640,0.5069) Δx=0.0000 Δy=0.0001
  ✅ 엑스포공원:    SOURCE=(0.556,0.185) render=(0.5560,0.1849) Δx=0.0000 Δy=0.0001
  ✅ 스카이타워:    SOURCE=(0.604,0.121) render=(0.6040,0.1210) Δx=0.0000 Δy=0.0000
  ✅ 자산공원:      SOURCE=(0.602,0.508) render=(0.6020,0.5079) Δx=0.0000 Δy=0.0001
  ✅ 아쿠아플라넷:  SOURCE=(0.557,0.304) render=(0.5570,0.3040) Δx=0.0000 Δy=0.0000
  ✅ 여수엑스포역:  SOURCE=(0.567,0.106) render=(0.5670,0.1059) Δx=0.0000 Δy=0.0001
  ✅ 여수오션크루즈: SOURCE=(0.608,0.209) render=(0.6080,0.2090) Δx=0.0000 Δy=0.0000
  ✅ 낭만요트:      SOURCE=(0.627,0.425) render=(0.6270,0.4250) Δx=0.0000 Δy=0.0000
  ✅ 블루요트:      SOURCE=(0.593,0.378) render=(0.5930,0.3780) Δx=0.0000 Δy=0.0000
  ✅ 빅오쇼:        SOURCE=(0.543,0.232) render=(0.5430,0.2319) Δx=0.0000 Δy=0.0001
  결과: 11/11 PASS / Zone1 혼입: 0건

B. Zone 2 QA Preview — 편집기 진입: ✅
   스크린샷: zone2-qa-placement-editor.png / zone2-qa-zoomed.png

C. Zone 1 QA Preview — Zone 1 마커 7/7 ✅ / Zone 2 혼입: 0건

최종 판정: ✅ PASS
```

---

## §4 스크린샷 파일

| 파일 | 내용 |
|------|------|
| `tests/screenshots-zone2/zone2-qa-regular-map.png` | Zone 2 QA 일반 지도 (신규 좌표 11곳) |
| `tests/screenshots-zone2/zone2-qa-placement-editor.png` | Zone 2 QA 편집기 (placement mode) |
| `tests/screenshots-zone2/zone2-qa-zoomed.png` | Zone 2 QA 편집기 2× 확대 |
| `tests/screenshots-zone2/zone1-check.png` | Zone 1 QA 화면 (Zone 2 혼입 없음 확인) |

---

## §5 빌드·회귀

| 항목 | 결과 |
|------|------|
| Vite build | ✅ 698 modules |
| Jest | ✅ 639/640 (R20 PRE-EXISTING) |
| Puppeteer Zone 2 A | ✅ 11/11 PASS Δ≤0.0001 |
| Puppeteer Zone 2 B | ✅ 편집기 진입 |
| Puppeteer Zone 2 C | ✅ Zone 1 마커 7/7 / Zone 2 혼입 0건 |

---

## §6 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| Zone 1 최신 7곳 SOURCE_SAVED | ✅ 보존 (C항 7/7 확인) |
| Zone 3 돌산권 변경 | ❌ 없음 |
| Zone 4 향일암권 변경 | ❌ 없음 |
| Zone 5 장도·웅천친수공원 | ❌ 없음 |
| Zone 6 최종 좌표 4곳 | ❌ 없음 |
| Zone 7 4개 마커 + offMap 2곳 | ❌ 없음 |
| Zone 1·2 QA 편집기 권역 분리 (SHA 41cfed0) | ✅ 유지 (C항 Zone 2 혼입 0건 확인) |
| PROVISIONAL 유지 | ✅ (11곳 모두 status:'PROVISIONAL') |
| VERIFIED 자동 승격 | ❌ 없음 |
| SOUL 게이팅 변경 | ❌ 없음 |
| DB/Schema 변경 | ❌ 없음 |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §7 FOUNDER_VISUAL_QA_PENDING

Zone 2 11곳: **SOURCE_SAVED ✅ / FOUNDER_VISUAL_ACCEPTED ⏳**

Founder가 `localhost:5000/muyojeong?qa_preview=boundary` → 오동도·엑스포권 선택 → 화면 확인 후  
단순 SOURCE=렌더 Δ=0만으로 지리적 최종 승인 처리 금지 (Task §3 규정).

---

## §8 미배치 항목 (이번 범위 외)

| place_id | name_ko | 이유 |
|----------|---------|------|
| expo_ocean_trail | 엑스포 바닷길 | 이번 Founder 좌표 없음 — PLACEMENT_PENDING 유지 |
| manseongri_beach | 만성리해수욕장 | 이번 Founder 좌표 없음 — PLACEMENT_PENDING 유지 |
