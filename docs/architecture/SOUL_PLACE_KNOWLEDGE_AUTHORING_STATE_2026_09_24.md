# SOUL Place Knowledge Authoring — Project State
# 2026-09-24

**Branch:** staging/storybook-c7a  
**Status:** Yi Sun-sin Square SAVED / GREEN — Jongpo Marine Park 대기 중  
**관련 설계:** SOUL Place Knowledge Schema + Authoring Plan V0.1 (대화 컨텍스트 기록)  
**Constraint:** Production / runtime / DB 변경 금지

---

## Authoring Pilot Overview

### Goal

SOUL이 안정적인 내부 지식만으로 일반적인 Yeosu 장소 질문에 여행 친구처럼 답하도록
place_knowledge 레이어 지식을 Founder Review 기반으로 구축한다.

### Workflow

```
Claude Draft → Founder Review → Approved Knowledge → (미래) DB migration
```

모든 field에 provenance 태그 포함.  
VERIFY_REQUIRED, LIVE_CHECK, DO_NOT_PROMOTE 항목은 명시적으로 분리.

---

## Place Knowledge Authoring Queue

| # | Place | place_code | Authoring | Founder Review | World Exp Review | Status | Document |
|---|---|---|---|---|---|---|---|
| 1 | 이순신광장 | lee_soon_shin_plaza | DONE | DONE | DONE | **SAVED / GREEN** | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_LEE_SOON_SHIN_PLAZA_V0_1.md` |
| 2 | 종포해양공원 | marine_park | — | — | **NEXT** | PENDING | — |
| 3 | 하멜등대 | hamel_lighthouse (신규) | — | — | — | BLOCKED (lat/lng 미확인) | — |
| 4 | 오동도 | odongdo | — | — | — | QUEUED | — |
| 5 | 향일암 | hyangiram | — | — | — | QUEUED | — |
| 6 | 케이블카 | cablecar | — | — | — | QUEUED | — |
| 7 | 자산공원 | jaisan_park | — | — | — | QUEUED | — |
| 8 | 돌산공원 | dolsan_nightscape | — | — | — | QUEUED | — |
| 9 | 낭만포차거리 | romantic_pojangmacha | — | — | — | QUEUED | — |
| 10 | 중앙시장 | jungang_market | — | — | — | QUEUED | — |
| 11 | 스카이타워 | sky_tower | — | — | — | QUEUED | — |
| 12 | 엑스포공원 | yeosu_expo_park | — | — | — | QUEUED | — |

### Hamel Lighthouse Blocker

| Blocker | Status |
|---|---|
| lat/lng 또는 주소 Founder 확인 | ✗ OPEN |
| admission_fee Founder 확인 | ✗ OPEN |
| travel_places migration 초안 | ✗ OPEN |
| `등대` → PLACE_SUFFIX_RE 추가 (code change) | ✗ OPEN |

하멜등대는 위 blocker 해소 전까지 authoring 시작 불가.

---

## Current Next Action

**Jongpo Marine Park World Experience Review V0.1**

```
place_code: marine_park
name_ko:    종포해양공원
목적:       이순신광장과의 연결 관계를 포함한 World Experience 패턴 확인
           + place_knowledge draft 작성 → Founder Review
```

---

## Approved Architecture Decisions (이번 Pilot 기준)

| Decision | Content |
|---|---|
| 5-Layer Contract | Stable Fact / Travel Knowledge / Relationship / Live-Volatile / Source-Evidence |
| Storage boundary | travel_places = 구조화된 사실. place_knowledge = 서술·경험 지식 |
| place_knowledge migration | 아직 미생성 — 모든 field draft는 READ-ONLY |
| Category taxonomy | 12개 category 승인 (plaza/park/island/shrine/attraction/bridge/street_food_zone/market/lighthouse/station + museum/beach reserved) |
| 여수엑스포역 | yeosu_expo_park alias 금지 — 독립 station entity |
| 하멜등대 | Pilot 포함 — blocker 해소 후 |
| 진남관 | Phase 2 대기 |
| Travel Time Matrix | Founder 검수 미완료 — runtime 연결 금지 |
| Provenance | 모든 field에 source_type + confidence + do_not_promote 필수 |
| World Experience | Truth Source 아님 — 반복 패턴 발견용 Knowledge Input |

---

## Pilot-Blocking Field Gap (전체 12 장소 기준)

| Gap | 현황 | 해소 경로 |
|---|---|---|
| identity_ko (2–3문장) | 12/12 1-sentence만 존재 (PLACE_IDENTITY_KO) | Authoring Pilot |
| companion_notes (nuanced) | 0/12 | Authoring Pilot |
| weather_notes (rain/hot/wind/cold) | 0/12 | Authoring Pilot (INFERRED 가능) |
| nighttime_char | 0/12 text | Authoring Pilot |
| local_tips | 0/12 | Authoring Pilot + Founder Local |
| admission_fee | 2/12 (sky_tower, lee_soon_shin_plaza 추정) | 공식 출처 확인 |
| nearby_places walk_minutes | 0/12 runtime | Travel Time Matrix Founder 검수 후 |
| transit_from_expo | 0/12 runtime | Travel Time Matrix + 버스 정보 확인 |

---

## Schema Reference (미적용, 설계 완료)

```sql
-- place_knowledge 테이블 (migration 미생성)
-- 주요 컬럼: place_code, identity_ko, highlights, companion_notes,
--            weather_notes, daytime_char, nighttime_char, local_tips,
--            photo_spots, seasonal_notes, nearby_places, transit_from_expo,
--            zone_co_visit, source_origin, verified_date, confidence,
--            authoring_notes
-- 상세 스키마: SOUL Place Knowledge Schema + Authoring Plan V0.1 참조
```

---

## Deployment Gate

| Action | Status |
|---|---|
| place_knowledge migration 생성 | **BLOCKED — schema Founder 최종 승인 후** |
| travel_places.category 컬럼 추가 | **BLOCKED — schema 승인 후** |
| PLACE_SUFFIX_RE `등대` 추가 (code) | **BLOCKED — 하멜등대 blocker 해소 후** |
| PLACE_ALIAS_MAP 하멜등대 추가 | **BLOCKED — 하멜등대 blocker 해소 후** |
| runtime 코드 변경 | **현재 LOCKED** |
| DB write / migration 적용 | **현재 LOCKED** |
| Production 변경 | **PROHIBITED** |
