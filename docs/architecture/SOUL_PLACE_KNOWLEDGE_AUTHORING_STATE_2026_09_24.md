# SOUL Place Knowledge Authoring — Project State
# 2026-09-24

**Branch:** staging/storybook-c7a  
**Status:** Yi Sun-sin Square SAVED / GREEN — Jongpo Marine Park SAVED / GREEN — Hamel Lighthouse WE+Founder SAVED / GREEN — Cable Car WE+Founder SAVED / GREEN — CAND-OPS-003 CREATED / DRAFT — **Review Plan SAVED / READY**  
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
| 2 | 종포해양공원 | marine_park | DONE | DONE | DONE | **SAVED / GREEN** | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_MARINE_PARK_V0_1.md` |
| 3 | 하멜등대 | hamel_lighthouse (신규) | DONE | DONE | DONE | **SAVED / GREEN** | WE: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_WE_V0_1.md` / Founder: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_FOUNDER_V0_1.md` |
| 4 | 오동도 | odongdo | — | — | — | QUEUED | — |
| 5 | 향일암 | hyangiram | — | — | — | QUEUED | — |
| 6 | 케이블카 | cablecar | DONE | DONE | DONE | **SAVED / GREEN** | WE: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` / Founder: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` |
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

World Experience Review + Founder Review V0.1 완료.  
Conflict Register A–D 전체 OPEN 유지 — Official Verification 미완료.  
신규 VERIFY_REQUIRED: 빨간/흰 등대 항로표지 공식 의미.  
blocker (lat/lng / admission_fee / PLACE_SUFFIX_RE / PLACE_ALIAS_MAP) 미해소.

---

## Current Next Action

**CAND-OPS-003 Blind Test — 금오도 비렁길 World Experience Review**

```
선정 장소:  금오도 비렁길 (Geumodo Bireonggil)
선정 근거:  섬+장거리 탐방로 구조 — Place/Route/Movement/Entity Boundary 동시 검증
            Anti-Selection Bias Rule 충족 (Challenge Conditions 9/9)
Selection:  docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_FIFTH_PLACE_SELECTION.md
주의:       Blind Test Phase 1부터 순서대로 진행
            Official Layer → World Experience → Conflict → Entity → …
            Founder/DreamTown 의미를 WE 이전에 주입하지 않는다
```

---

## Authoring Framework Candidate

| 항목 | 값 |
|---|---|
| Candidate ID | CAND-OPS-003 |
| Candidate File | `docs/constitution/candidate/CAND-OPS-003_SOUL_Place_Knowledge_Authoring_Framework.md` |
| Review Plan | `docs/constitution/candidate/CAND-OPS-003_REVIEW_PLAN_V0_1.md` |
| Status | Candidate / Draft |
| Lifecycle | Idea → **Draft** → Review → Approved → LOCKED |
| Review Plan Status | SAVED / READY |
| DreamTown Philosophy | REPEATED FOUNDER PHILOSOPHY EVIDENCE — HOLD (별도 Candidate Family) |

---

## Authoring Pattern — Now Candidate (4 Cases Confirmed)

네 장소(이순신광장 + 종포해양공원 + 하멜등대 + 케이블카)에서 반복 확인. **Candidate CREATED.**

```
Official         → factual skeleton
World Experience → how travelers actually experience the place
Founder          → current local reality / correction of outdated info
DreamTown        → emotional meaning
SOUL             → compose what this traveler needs now
```

추가 확인 패턴:
- `Place Knowledge + Route/Relationship Knowledge 분리 필요` — 4회
- `이동 자체가 Experience Knowledge` — Cable Car (Architecture Evidence)
- `Situation Knowledge 필요` — Cable Car (강하게 확인)

**Status:** `CANDIDATE / DRAFT — CAND-OPS-003`

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
| 종포해양공원 ≠ 여수해양공원 | 별도 Entity — alias 금지, 공식 관계 VERIFY_REQUIRED |
| 하멜전시관 ≠ 하멜등대 | 별도 Entity — alias 금지 |
| Conflict Register | 낚시(SOUL 안내 금지) / 주차(과거 정보 사용 금지) / 명칭 혼용 — 문서 내 관리 |
| Hamel — Physical End / Emotional Beginning | 공간적 끝 = 감정적 새 시작 (FOUNDER_INTENT / DREAMTOWN) |
| Hamel — Founder Promise | DreamTown과 여수는 소원이를 혼자 두지 않음 — FOUNDER_INTENT Evidence, Manifesto 미승격 |
| 빨간/흰 등대 항로표지 의미 | FOUNDER_LOCAL → VERIFY_REQUIRED, Official 미승격 |
| Cable Car — 상승의 의미 | distance for reflection (탈출 아님) — FOUNDER_INTENT_SYNTHESIS |
| Cable Car — 내려옴 | 희망을 가지고 삶으로 돌아가는 순간 — FOUNDER_INTENT_SYNTHESIS |
| Cable Car — Small Change Principle | 잠깐의 연결감 + 작은 희망 → 내일은 이미 달라짐 — PHILOSOPHY EVIDENCE / HOLD |
| Cable Car — 삶 속에 있되 매이지 않음 | 핵심 Founder 철학 표현 — HOLD |
| Hamel ↔ Cable Car 반복 | 혼자가 아님 / 작은 희망 / 다시 나아감 / 현실로 돌아감 — 2개 장소 반복 |
| Potential DreamTown-Wide Philosophy | MODEL SYNTHESIS — Candidate-Worthy OBSERVATION, HOLD |
| Candidate Readiness | A(Authoring Framework) + B(DreamTown Philosophy) — Readiness Review 단계 |

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
