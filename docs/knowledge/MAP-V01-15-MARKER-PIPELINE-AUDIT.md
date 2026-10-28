# MAP V0.1 — 15곳 마커 데이터 파이프라인 감사

**Date**: 2026-10-28  
**Status**: MAP_V01_15_MARKER_PIPELINE_VERIFIED  
**SHA**: (pending commit)  
**Classification**: REPAIR (잘못된 POSITION_CORRECTION_REQUIRED 주석 제거)

---

## §1 감사 목적

Founder 가설: "마커 표시 또는 좌표 전달 과정에 최대 11개 제한이 있어서 4곳이 누락됐을 가능성"

검증 대상:
- 아쿠아플라넷 (x=0.563, y=0.334)
- 빅오쇼 (x=0.529, y=0.296)
- 낭만요트 (x=0.643, y=0.419)
- 블루요트 (x=0.607, y=0.435)

---

## §2 단계별 개수 및 경로 분석

| 단계 | 함수/구조 | 실제 수량 | 11개 제한 | 비고 |
|------|-----------|-----------|-----------|------|
| Step 1 | `YEOSU_PLACES[].markerPos.oldtown` (소스) | **15개** | ❌ 없음 | 4곳 포함 확인 |
| Step 2 | `getMarkersForImage('oldtown')` | **15개** | ❌ 없음 | filter: `!hidden && HIGH confidence` |
| Step 3 | `PLACEMENT_TARGETS` | **15개** | ❌ 없음 | Zone1:6 / Zone2:9 |
| Step 4 | `markers.filter(zone filter)` (Zone1 진입) | **15개** | ❌없음 | `hasDetailMap → zone 1||2 모두` |
| Step 5 | 브라우저 실제 렌더링 (puppeteer) | **15개** | ❌ 없음 | 15/15 소스 좌표 일치 |
| Step 6 | QA 편집기 후보 목록 버튼 | **15개** | ❌ 없음 | Zone1:6 + Zone2:9 |
| Step 7 | `copyAllCandidates` 내보내기 | 제한 없음 | ❌ 없음 | `Object.entries(candidates)` 전체 |

---

## §3 15곳 전체 위치 대조표 (puppeteer 실증)

puppeteer incognito, setCacheEnabled(false), Zone 1 QA Preview

| place_id | 소스 x,y | 렌더 x,y | 일치 |
|----------|----------|----------|------|
| lee_soon_shin_plaza | 0.391, 0.544 | 0.391, 0.544 | ✅ |
| romantic_pojangmacha | 0.612, 0.642 | 0.612, 0.642 | ✅ |
| hamel_lighthouse | 0.563, 0.620 | 0.563, 0.620 | ✅ |
| jinamgwan | 0.380, 0.470 | 0.380, 0.470 | ✅ |
| opodae | 0.453, 0.530 | 0.453, 0.530 | ✅ |
| marine_park | 0.447, 0.577 | 0.447, 0.577 | ✅ |
| odongdo | 0.859, 0.397 | 0.859, 0.397 | ✅ |
| cablecar | 0.657, 0.529 | 0.657, 0.529 | ✅ |
| yeosu_expo_park | 0.551, 0.195 | 0.551, 0.195 | ✅ |
| sky_tower | 0.604, 0.152 | 0.604, 0.152 | ✅ |
| jaisan_park | 0.586, 0.535 | 0.586, 0.535 | ✅ |
| **aquaplanet** | **0.563, 0.334** | **0.563, 0.334** | ✅ |
| **nangman_yacht** | **0.643, 0.419** | **0.643, 0.419** | ✅ |
| **blue_yacht** | **0.607, 0.435** | **0.607, 0.435** | ✅ |
| **big_o_show** | **0.529, 0.296** | **0.529, 0.296** | ✅ |

**미표시: 0개 / 좌표 불일치: 0개**

---

## §4 11개 제한 코드 전수 조사

| 검사 항목 | 결과 |
|-----------|------|
| `slice(0, N)` (YeosuMapSelector.jsx) | ❌ 없음 |
| `slice(0, N)` (yeosuMapData.js) | ❌ 없음 |
| `maxItems`, `limit = N` | ❌ 없음 |
| `.length > NN` 조건 | ❌ 없음 (`.length > 1`만 존재 — 전체복사 버튼 표시 조건) |
| localStorage 크기 제한 | 해당 없음 (15좌표 = 수백 바이트) |
| `getMarkersForImage` 내부 limit | ❌ 없음 — `.filter()` 전체 순회 |

**결론: 11개 제한 없음. Founder 가설 — 코드 레벨에서 미확인.**

---

## §5 4곳 좌표 STATUS 정정

| place_id | 이전 주석 | 정정 내용 |
|----------|-----------|-----------|
| aquaplanet | `POSITION_CORRECTION_REQUIRED` | **제거** — Founder 확인 좌표 (0.563, 0.334) |
| nangman_yacht | `POSITION_CORRECTION_REQUIRED` | **제거** — Founder 확인 좌표 (0.643, 0.419) |
| blue_yacht | `POSITION_CORRECTION_REQUIRED` | **제거** — Founder 확인 좌표 (0.607, 0.435) |
| big_o_show | `POSITION_CORRECTION_REQUIRED` | **제거** — Founder 확인 좌표 (0.529, 0.296) |

**PROVISIONAL 유지** — 4곳 좌표는 Founder 지정이 맞으나 VERIFIED 승격은 별도 승인 필요.

---

## §6 QA 편집기 후보 목록 상세

실제 렌더링 버튼 목록 (Zone 1·2 합산):
- **Zone 1**: 이순신광장, 종포해양공원, 낭만포차거리, 하멜등대, 오포대, 진남관 (6개)
- **Zone 2**: 오동도, 케이블카, 엑스포공원, 스카이타워, 자산공원, 아쿠아플라넷, 빅오쇼, 낭만요트, 블루요트 (9개)
- **총 15개 — 11개 제한 없음**

---

## §7 안전 조건

| 항목 | 상태 |
|------|------|
| Inventory 45 / TG_READY 12 / 7권역 | ✅ 유지 |
| SOUL 게이팅 | ✅ 유지 |
| markerPos 15곳 좌표 불변 | ✅ |
| PROVISIONAL 유지 | ✅ 15곳 모두 |
| VERIFIED 자동 승격 | ✅ 없음 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
