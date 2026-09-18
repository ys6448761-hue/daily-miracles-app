---
code: CAND-INTEL-001
title: Yeosu Travel Intelligence — Operating Principles for SODAM & Muyeojeong
status: Candidate
importance: Level 4
category: Intelligence / Operations
owner: DreamTown / Phoenix
created: 2026-09-17
promotion_path: Candidate → SSOT-OPS (after second vertical slice + travel completeness verification)
related: CAND-EXP-003, CAND-OPS-002, DreamTown_Travel_System_SSOT
---

> 본 문서는 DreamTown SODAM / 무여정 / 여수여행 운영 AI·개발자·운영자 교체 시
> 매번 재조사·재설명하지 않도록 현재 판단 위치를 repository에 고정한다.
> 구현 지시서가 아니다 — 운영 원칙 정의서다.

---

# CAND-INTEL-001 — Yeosu Travel Intelligence Operating Principles

## Core Definition

> "소담이는 정적인 여행 DB를 답하는 것이 아니라,
> 검증된 여수여행 지식 위에 최신 운영정보와
> DreamTown 실시간 자원을 결합해
> 현재 소원이에게 유효한 여행정보를 전달한다."

---

## Background — Why This Document Exists

여수 여행정보는 세 가지 유형이 섞여 있다:

1. **비교적 안정적인 관광 지식** (향일암은 해안 절벽 사찰이다, 오동도는 봄 동백꽃 명소다)
2. **수시로 변경되는 운영 사실** (영업시간, 입장료, 휴무, 기상조건 제한)
3. **DreamTown만 아는 계약·자원 정보** (케니 호텔 계약가, FLOW 재고, 혜택 수량)

이 세 가지를 구분하지 않으면:
- 오래된 사실을 최신 사실처럼 말하게 된다
- 공개 웹 가격과 계약 입금가를 혼동하게 된다
- DreamTown 감정 정체성이 외부 정보 업데이트에 덮어쓰인다

---

## PRINCIPLE 1 — BASE_TRAVEL_KNOWLEDGE는 기반이다, 폐기 대상이 아니다

기존 여수여행센터 정보(`travel_places`, `travel_restaurants`)는
Base Travel Knowledge다.

매 운영 사이클마다 전체 폐기 후 재조사하지 않는다.

변경 가능성이 높은 Current Travel Facts만
freshness 기준으로 재검증 대상으로 분리한다.

---

## PRINCIPLE 2 — 정보를 3 Layer로 관리한다

### A. BASE_TRAVEL_KNOWLEDGE
비교적 안정적인 기반 지식.

예: 장소명, 위치, 장소 설명, 여행 특징, 추천 대상, 감정 역할, 기본 관광정보

현재 보유 위치:
- `travel_places` (12 rows — 향일암, 오동도, 케이블카, 이순신광장 등)
- `travel_restaurants` (12 rows — source=local_curated)
- `docs/ssot/support/DreamTown_Travel_System_SSOT.md` (항로 4종, 호텔 포지셔닝)

### B. CURRENT_TRAVEL_FACT
시간에 따라 변경될 수 있어 최신 검증이 필요한 정보.

예: 영업시간, 휴무, 브레이크타임, 입장료, 운항시간, 회차, 입장마감,
주차조건, 공사/휴장, 행사, 기상 영향, 예약조건

현재 보유 상태: **MISSING** — `travel_places.opening_hours_json`과
`travel_places.admission_fee_json`이 컬럼으로 존재하나 전체 NULL.
freshness 컬럼 자체가 없다 (`verified_at`, `source_type`, `last_checked_at`, `valid_until` 모두 부재).

### C. DREAMTOWN_LIVE_CONTEXT
DreamTown만 알고 있는 운영·계약·실시간 정보.

예: DreamTown 계약가, 파트너 입금가, 환대 내용, 기본 제공 수량,
실시간 availability, Hold, Booking, 실제 이용 확인

현재 보유 위치:
- `dt_accommodations` (2 rows — Kenny 객실)
- `dt_flow_inventory` / `dt_flow_holds` / `dt_flow_bookings` (FLOW)
- `config/quotePriceData.js` v1.2_20260112 (Kenny/utop/ramada/odongjae 가격표)
- `dt_benefits` (파트너 혜택 ~30 rows)
- `dt_partners` (33 rows, 21 unique businesses)

---

## PRINCIPLE 3 — DreamTown Emotional SSOT는 외부 웹 정보가 덮어쓰지 않는다

다음은 DREAMTOWN_SSOT_PROTECTED 항목이다.
외부 여행 정보 업데이트 대상이 아니다.

| 장소 코드 | DreamTown 감정 역할 | SSOT 위치 |
|---|---|---|
| 하멜등대 | 소원 / 희망·별빛 | DreamTown_Travel_System_SSOT |
| 종포해양공원 | 쉼 | DreamTown_Travel_System_SSOT |
| 케이블카 | 상승 / expansion | travel_places.emotion_primary |

EP01 항로 순서:
```
여수엑스포역 → 엑스포 바닷길 → 이순신광장 → 케이블카
→ 종포해양공원 → 하멜등대 → 호텔
```

이 순서와 각 장소의 감정 의미는
외부 데이터 최신화 작업에서 변경하지 않는다.

---

## PRINCIPLE 4 — 사실 정보와 추천/Editorial Knowledge를 구분한다

| 유형 | 설명 | 예시 | 관리 |
|---|---|---|---|
| Factual | 객관적으로 확인 가능 | 입장료, 영업시간, 좌표 | verified_at + source 필요 |
| Editorial | DreamTown 판단 | "기적을 느끼기 좋은 일출 명소" | SSOT 보호, 외부 덮어쓰기 금지 |
| Operational | 실시간 계약/자원 | 케니 가용 객실 수, 혜택 재고 | DreamTown LIVE CONTEXT |

---

## PRINCIPLE 5 — 정보에는 Source + Verified Time + Freshness 상태를 보존한다

현재 `travel_places.trust_level` (ORIGIN/VERIFIED)은 있으나
`source_url`, `verified_at`, `last_checked_at`, `valid_until`은 부재.

향후 freshness 필드 추가 시 이 원칙을 따른다:
- `trust_level`: 데이터 품질 (ORIGIN > VERIFIED > UNVERIFIED)
- `source_type`: 출처 종류 (official / curated / web)
- `source_url`: 출처 URL
- `verified_at`: 마지막 사람이 확인한 시점
- `review_due`: 재검증 필요 기준일

구현 지시서가 아니다 — 향후 추가 시 기준선이다.

---

## PRINCIPLE 6 — Source Priority

향후 충돌 시 우선순위 기준선:

1. 공식 운영주체 / 공공기관 직접 확인
2. 업체 공식 채널 (공식 웹사이트, 공식 SNS)
3. 주요 지도/플레이스 정보 (네이버지도, 카카오맵)
4. 기타 공개 웹

단, 다음 정보는 **공개 웹보다 DreamTown/파트너 확인 Evidence 우선**:
- DreamTown 계약가격
- 파트너 입금가
- 환대 수량
- 정산 조건
- 실시간 제공 가능 수량

---

## PRINCIPLE 7 — Stale / Missing / Conflicting 시 SODAM은 추측하지 않는다

정보가 stale / missing / conflicting이면
SODAM이 추측하여 확정적으로 말하지 않는다.

현재 시스템 상태:
- `travelGuideService.js`: unknown travel time을 0으로 처리하지 않고 `status: 'unknown'` 반환 — **올바른 구현**
- SODAM (`sodamDecisionService.js`): 여행 정보를 전혀 읽지 않음 — 연결 자체가 없음 (Principle 8 참조)

---

## PRINCIPLE 8 — 공개 웹 가격과 DreamTown 계약가격을 혼합하지 않는다

현재 구현:
- `quotePriceData.js`는 `cost` (입금가) / `sell` (소원이 결제가) / `list` (시장가)를 명시적으로 분리
- SODAM은 `price_source: 'STATIC_CONFIG'`, `price_source_version: 'v1.2_20260112'`로 레이블링
- 일부 항목(`aqua.cost`, `wishVoyage.basic.cost`)은 `manual_confirm_required: true, cost: null` — 정직한 표현

---

## PRINCIPLE 9 — Partner Resource Availability만으로 추천하지 않는다

FLOW 재고가 있다고 해서 그것만으로 추천하지 않는다.
Journey State / Current Intent와 결합해야 한다.

현재 SODAM은 `party_size + stay_date + preferred_room_type`만 보고 결정한다.
Journey Context (`journeys`, `wish_journeys`, `journey_contexts` 테이블)와의 연결은 없다.

이것은 현재 단계에서 의도된 단순화이며, 향후 Journey-aware SODAM 확장 시 이 원칙을 기준으로 한다.

---

## PRINCIPLE 10 — 기존 자산을 파악하고 연결한다, 재구축하지 않는다

현재 공존하는 Travel Intelligence 자산:

| 자산 | 위치 | 상태 | 소비처 |
|---|---|---|---|
| travel_places (12 rows) | DB | BASE_TRAVEL_KNOWLEDGE | travelGuideService |
| travel_restaurants (12 rows) | DB | BASE_TRAVEL_KNOWLEDGE, 전체 NULL 주소/전화 | travelGuideService |
| dt_partners (33 rows) | DB | DREAMTOWN_LIVE_CONTEXT | (직접 소비 없음) |
| dt_benefits (~30 rows) | DB | DREAMTOWN_LIVE_CONTEXT | travelGuideService (카페 혜택) |
| dt_accommodations (2 rows) | DB | DREAMTOWN_LIVE_CONTEXT | sodamDecisionService |
| dt_flow_inventory/holds/bookings | DB | DREAMTOWN_LIVE_CONTEXT | flowInventoryService |
| quotePriceData.js | config | DREAMTOWN_LIVE_CONTEXT | sodamDecisionService, quoteEngine |
| locationRegistry.js | config | BASE_TRAVEL_KNOWLEDGE | (별공방 거점 등록) |
| experienceIdentity.js | config | UX 레이어 | (WishArt scene 결정) |
| DreamTown_Travel_System_SSOT.md | docs | 항로 SSOT | 운영자 참조 |
| YEOSU_SPOTS (itineraryService.js L69) | hardcoded | **FIXTURE — DB 미연결** | itineraryService (AI 일정) |

`itineraryService.js`의 `YEOSU_SPOTS` 상수는 hardcoded JS 객체다.
`travel_places` DB와 연결되지 않는다.
이 서비스가 production에서 사용될 경우 DB 데이터와 불일치할 수 있다.

---

## CURRENT STATE FRESHNESS GAPS (Evidence-based)

| 질문 | 답변 | Evidence |
|---|---|---|
| SODAM이 여행정보 확인 시점을 알 수 있는가? | NO | sodamDecisionService.js는 travel 정보를 읽지 않음 |
| 오래된 영업시간과 최신 영업시간을 구별할 수 있는가? | NO | travel_places에 verified_at, last_checked_at 없음 |
| 출처를 알 수 있는가? | PARTIAL | trust_level(ORIGIN/VERIFIED) 있음. source_url 전체 NULL |
| 출처 충돌을 탐지할 수 있는가? | NO | 충돌 탐지 로직 없음 |
| 최신 확인이 필요한 정보를 표시할 수 있는가? | PARTIAL | travelGuideService가 unknown을 경고로 표면화함 |
| 운영자가 REVIEW DUE를 알 수 있는가? | NO | review_due 컬럼 없음 |
| SODAM이 stale 정보를 확정 사실처럼 말하지 않도록 하는 장치가 있는가? | PARTIAL | travelGuideService의 unknown 처리는 올바름. SODAM은 travel 정보를 아예 사용하지 않아 오용 위험 낮음. itineraryService는 hardcoded YEOSU_SPOTS 사용 — stale 위험 있음 |

---

## DEFERRED (별도 인가 없이 구현하지 않는다)

- crawler / 자동 웹 최신화
- 대규모 Travel Intelligence Engine
- 자동 Source conflict resolver
- 실시간 외부정보 pipeline
- verified_at / freshness 컬럼 추가 migration
- itineraryService YEOSU_SPOTS → travel_places DB 연결

---

## Relation to Existing Documents

| 문서 | 관계 |
|---|---|
| `DreamTown_Travel_System_SSOT.md` | 항로/여행 SSOT — 이 문서는 Intelligence 운영 원칙을 보완 |
| `CAND-OPS-002` | Hotel Hub 아키텍처 — 이 문서는 Knowledge Layer 운영 원칙 |
| `CAND-EXP-003` | Route × Resource 원칙 — 상호 보완, 충돌 없음 |
| `docs/ssot/ops/PARTNER_MASTER_V1.md` | 파트너 데이터 명세 Template — 현재 미입력 상태 |

---

## Promotion Target

**SSOT-OPS — DreamTown Travel Intelligence Operating Principles**

Promotion prerequisite:
- 두 번째 vertical slice (different partner / travel type) E2E_GREEN
- travel_places freshness 필드 최소 1개 실제 적용 검증
- SODAM이 travel knowledge를 직접 소비하는 경로 최소 1개 실증

**Do NOT promote now.**

---

## Project Impact: 85/100
## Knowledge Value: ★★★★☆
## Origin

- Date: 2026-09-17
- Trigger: Yeosu Travel Intelligence Continuity + Current-State Audit
- Creator: DreamTown / Phoenix
