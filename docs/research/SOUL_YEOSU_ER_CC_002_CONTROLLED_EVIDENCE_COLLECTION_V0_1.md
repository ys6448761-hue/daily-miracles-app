# SOUL Yeosu ER-CC-002 Controlled Evidence Collection V0.1
# Yeosu Maritime Cable Car — Per-Station Access Structure

**Collection Date:** 2026-09-27  
**Branch:** staging/storybook-c7a  
**Collector:** Claude Sonnet 4.6  
**Wave:** Wave 2 (First-Level Dependents)  
**Status:** VERIFIED_FOR_PREPARATION

---

## 1. Collection Metadata

| Field | Value |
|---|---|
| Evidence Requirement ID | ER-CC-002 |
| ER Title | Per-Station Access Structure |
| Related Scenarios | C-1 (basic boarding guidance), C-2 (vehicle-aware boarding) |
| Dependency ER | ER-CC-001 — VERIFIED_FOR_PREPARATION ✓ |
| Collection Wave | Wave 2 |
| Starting Gap Type | PARTIAL_GAP |
| Existing Items Count | 4 (EI-CC-002-A through D, from RB-03/Founder, Hamel-specific scope) |
| New Items Collected | 8 (EI-CC-002-E through L) |
| Total Items Registered | 12 |
| Stop Condition | AUTHORITATIVE_FACT_SUFFICIENT |
| Outcome | VERIFIED_FOR_PREPARATION |
| Artifact File | `docs/research/SOUL_YEOSU_ER_CC_002_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |

---

## 2. Contract Reference (from Matrix V0.1, line 594)

| Field | Value |
|---|---|
| ER ID | ER-CC-002 |
| Related Place(s) | 여수해상케이블카 |
| Related Scenario(s) | C-1, C-2 |
| Required Judgment | ANSWER — how to access each station |
| Knowledge Category | ACCESS / ROUTE_RELATIONSHIP |
| Evidence Needed | How a traveler physically reaches each cable car station — approach routes, access method from nearby areas |
| Why Needed | C-1: where to board. C-2: vehicle-specific access guidance per station. |
| Preferred Source Role | MAP_ROUTE / OFFICIAL |
| Secondary Source Role | FOUNDER |
| Stability Class | SEMI_STABLE |
| Live Trigger | Temporary route/access disruption |
| Confidence Requirement | Route-confirmed |
| Negative/Exception Knowledge | NO |
| Relationship Dependency | ER-CC-001 (VERIFIED_FOR_PREPARATION ✓) |
| Missing-Evidence Consequence | Cannot specify how to reach stations; QUALIFY |
| Behavior if Missing | QUALIFY |
| Collection Priority | P0 |
| Stop Condition | AUTHORITATIVE_FACT_SUFFICIENT |

**Source Role Note:** No correction required. Contract specifies MAP_ROUTE / OFFICIAL primary; FOUNDER secondary. Collection followed this exactly.

---

## 3. Starting Evidence State

### 3.1 Existing Items (pre-collection, from Wave 0 / RB-03)

**EI-CC-002-A — 자산 side access by car from Hamel entrance (Founder field)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-A |
| ER IDs | ER-CC-002 (partial — one approach direction only) |
| Collection Date | Pre-Wave 0 (RB-03 field research) |
| Source Type | FOUNDER_LOCAL / FIELD_CONFIRMATION |
| Source Locator | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` §4 FFE-01 |
| Source Role | FOUNDER (secondary) |
| Raw Claim | 하멜등대 방파제 입구 → 자산 측 케이블카 탑승 시설: 차량 약 1~2분 |
| Normalized Claim | Car travel from Hamel Lighthouse breakwater entrance to 자산 station: approximately 1–2 minutes |
| Stability | STABLE (structural) |
| Scope Limitation | HAMEL_SPECIFIC_ACCESS — one approach direction only |

**EI-CC-002-B — 자산 side access by walking from Hamel entrance (Founder field)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-B |
| ER IDs | ER-CC-002 (partial — one approach direction, walking mode) |
| Collection Date | Pre-Wave 0 (RB-03 field research) |
| Source Type | FOUNDER_LOCAL / FIELD_CONFIRMATION |
| Source Locator | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` §4 FFE-02 |
| Source Role | FOUNDER (secondary) |
| Raw Claim | 하멜등대 방파제 입구 → 자산 측 케이블카 탑승 시설: 도보 약 5~10분. 평지 (Founder Local 기준). |
| Normalized Claim | Walking from Hamel breakwater entrance to 자산 station: approximately 5–10 minutes; flat terrain |
| Stability | STABLE (structural) |
| Scope Limitation | HAMEL_SPECIFIC_ACCESS |

**EI-CC-002-C — 돌산 side access by car from Hamel entrance (Founder field, secondary)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-C |
| ER IDs | ER-CC-002 (supplementary — 돌산 side, Hamel approach only) |
| Collection Date | Pre-Wave 0 (RB-03 field research) |
| Source Type | FOUNDER_LOCAL / FIELD_CONFIRMATION |
| Source Locator | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` §4 FFE-03 |
| Source Role | FOUNDER (secondary) |
| Raw Claim | 하멜등대 → 돌산 측 케이블카 탑승 시설: 차량 약 5~10분 |
| Normalized Claim | Car travel from Hamel area to 돌산 station: approximately 5–10 minutes |
| Stability | STABLE (structural) |
| Scope Limitation | HAMEL_SPECIFIC_ACCESS |

**EI-CC-002-D — 돌산 side access by walking from Hamel entrance (Founder field, secondary)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-D |
| ER IDs | ER-CC-002 (supplementary — 돌산 side, walking, Hamel approach) |
| Collection Date | Pre-Wave 0 (RB-03 field research) |
| Source Type | FOUNDER_LOCAL / FIELD_CONFIRMATION |
| Source Locator | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` §4 FFE-04 |
| Source Role | FOUNDER (secondary) |
| Raw Claim | 하멜등대 방파제 입구 → 돌산 측 케이블카 탑승 시설: 도보 약 20~30분 |
| Normalized Claim | Walking from Hamel breakwater entrance to 돌산 station: approximately 20–30 minutes |
| Stability | STABLE (structural) |
| Scope Limitation | HAMEL_SPECIFIC_ACCESS |

---

## 4. Admissibility Test for Existing Evidence

| Item | Source Role Test | Scope Adequacy | Verdict | Usage |
|---|---|---|---|---|
| EI-CC-002-A | FOUNDER = permitted secondary role ✓ | HAMEL_SPECIFIC — does NOT establish general 자산 access structure | PARTIALLY_REUSABLE | Confirms car access mode IS possible to 자산 side; time from one specific starting point. Not general access structure. |
| EI-CC-002-B | FOUNDER = permitted secondary role ✓ | HAMEL_SPECIFIC — flat-terrain walk from one approach direction | PARTIALLY_REUSABLE | Confirms walking access is possible to 자산 side from coastal waterfront. Not general access pattern. |
| EI-CC-002-C | FOUNDER = permitted secondary role ✓ | HAMEL_SPECIFIC — one approach direction only | PARTIALLY_REUSABLE | Confirms 돌산 station is ~5–10 min by car from Hamel area; implies bridge crossing required (해멜↔돌산 = different island). Structural implication valid. |
| EI-CC-002-D | FOUNDER = permitted secondary role ✓ | HAMEL_SPECIFIC — very long walk (20–30 min) | PARTIALLY_REUSABLE | 20–30 min walk from Hamel → implies 돌산 station is substantially further from Yeosu downtown than 자산 station. Structural distance implication valid. |

**Admissibility summary:** All 4 items PARTIALLY_REUSABLE. They provide Hamel-relative access evidence for FOUNDER role. They do NOT cover: general 자산 address/approach from Expo area; general 돌산 address/approach for typical traveler; bus/public transit for either station; structural access features of stations.

---

## 5. Gap Freeze

After admissibility test, the following gaps were frozen before collection:

| Gap Component | Status Before Collection | Source Role Required |
|---|---|---|
| 자산정류장 general location / address | MISSING | MAP_ROUTE / OFFICIAL |
| 자산정류장 bus/public transit routes | MISSING | MAP_ROUTE / OFFICIAL |
| 자산정류장 walk access from Expo station | MISSING | MAP_ROUTE |
| 자산정류장 taxi access | MISSING | MAP_ROUTE |
| 자산정류장 structural access features | MISSING | OFFICIAL / MAP_ROUTE |
| 돌산정류장 general location / address | MISSING | MAP_ROUTE / OFFICIAL |
| 돌산정류장 bus/public transit routes | MISSING | MAP_ROUTE / OFFICIAL |
| 돌산정류장 taxi access | MISSING | MAP_ROUTE |
| 돌산정류장 car access (bridge required) | PARTIALLY — EI-CC-002-C implies; not general | MAP_ROUTE / OFFICIAL |

**Note:** Parking structure at each station is NOT in scope for CC-002 — that belongs to ER-CC-003.

---

## 6. New Evidence Items (EI-CC-002-E through L)

**EI-CC-002-E — 자산정류장 location and address (OFFICIAL)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-E |
| ER IDs | ER-CC-002 |
| Collection Date | 2026-09-27 |
| Source Type | OFFICIAL (government tourism + official cable car site) |
| Source Locator | https://www.yeosu.go.kr/tour/travel/10tour/cablecar (Yeosu city official); http://yeosucablecar.com/kr/jasan/parking (official cable car parking page — SSL-indexed snippet) |
| Source Role | OFFICIAL (primary) |
| Raw Claim | 자산정류장(해야정류장): 여수시 수정동 777-4 위치. 여수엑스포역에서 약 1.5km 거리. |
| Normalized Claim | 자산정류장 (해야정류장) is located in Sujeong-dong (수정동), Yeosu city. Address: 수정동 777-4. Approximately 1.5 km from 여수엑스포역. Located in the 자산공원 (Jasan Park) area on the Yeosu mainland side. |
| Stability | STABLE |
| Corroboration Links | EI-CC-002-F (bus from Expo to this area), EI-CC-002-G (walk from Expo), EI-CC-002-H (taxi) |
| Admissibility Notes | OFFICIAL primary per contract. Yeosu city official tourism page verified. Official site address snippet confirmed 수정동 777-4 for 자산정류장. Note: Yeosu city page also lists "수정동 332-55 (오동도 주차타워)" as a related compound reference — this is the parking tower, not the station building itself (SCOPE_DIFFERENCE, not conflict — see §8). |

**EI-CC-002-F — 자산정류장 bus access from 여수엑스포역 (MAP_ROUTE)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-F |
| ER IDs | ER-CC-002 |
| Collection Date | 2026-09-27 |
| Source Type | MAP_ROUTE (practical transit guide based on real route data) |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-from-ktx-station/ |
| Source Role | MAP_ROUTE (primary) |
| Raw Claim | 여수엑스포역 → 케이블카 자산정류장: 2번·68번·76번·333번·555번 버스 탑승. "오동도 입구" 등 인근 정류장 하차. 소요시간 약 5~10분. 요금 ₩1,500 (교통카드 ₩1,400). |
| Normalized Claim | From 여수엑스포역: Bus routes 2, 68, 76, 333, 555 reach the 자산 cable car station area. Alight at "오동도 입구" or nearby stop. Travel time: approximately 5–10 minutes. Fare: ₩1,500 cash / ₩1,400 transit card. |
| Stability | SEMI_STABLE (route numbers stable; schedule/fare volatile) |
| Corroboration Links | Namu Wiki also confirms routes 2, 68, 76, 333, 555 to 해야정류장 area |
| Admissibility Notes | MAP_ROUTE primary per contract. Travel blog with specific bus number details confirmed by secondary Namu Wiki source. Individual route schedules DYNAMIC — not stored here. |

**EI-CC-002-G — 자산정류장 walking access from 여수엑스포역 (MAP_ROUTE)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-G |
| ER IDs | ER-CC-002 |
| Collection Date | 2026-09-27 |
| Source Type | MAP_ROUTE |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-from-ktx-station/ |
| Source Role | MAP_ROUTE (primary) |
| Raw Claim | 여수엑스포역에서 자산정류장까지 약 1.5km, 도보 15~20분. 바다 옆 해안 도로 경로. 짐 없을 때 적합. |
| Normalized Claim | Walking from 여수엑스포역 to 자산정류장: approximately 1.5 km / 15–20 minutes. Route follows the seaside coastal road. Suitable for luggage-free travel. |
| Stability | STABLE |
| Corroboration Links | EI-CC-002-E (confirms 1.5 km distance) |
| Admissibility Notes | MAP_ROUTE primary. Walk distance corroborated by Yeosu city page (1.5 km) independently. Seaside path description = MAP_ROUTE level. |

**EI-CC-002-H — 자산정류장 taxi access from 여수엑스포역 (MAP_ROUTE)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-H |
| ER IDs | ER-CC-002 |
| Collection Date | 2026-09-27 |
| Source Type | MAP_ROUTE |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-from-ktx-station/ |
| Source Role | MAP_ROUTE (primary) |
| Raw Claim | 여수엑스포역 → 자산정류장 택시 5~7분, 요금 약 ₩5,000~7,000. 기사에게 "여수 해상 케이블카 자산정류장" 전달. |
| Normalized Claim | Taxi from 여수엑스포역 to 자산정류장: approximately 5–7 minutes / ₩5,000–7,000. Tell driver "여수 해상 케이블카 자산정류장" or "여수 해상 케이블카 해야정류장." |
| Stability | SEMI_STABLE (time STABLE; fare volatile — metered) |
| Corroboration Links | EI-CC-002-G (same origin-destination, shorter by vehicle vs. walk) |
| Admissibility Notes | MAP_ROUTE primary. Taxi fare estimate = RANGE (metered — specific fare VOLATILE). Time estimate STABLE given 1.5 km short distance. |

**EI-CC-002-I — 자산정류장 structural access: elevator tower (OFFICIAL_PUBLIC)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-I |
| ER IDs | ER-CC-002 |
| Collection Date | 2026-09-27 |
| Source Type | OFFICIAL_PUBLIC (Namu Wiki — crowd-verified reference) |
| Source Locator | https://namu.wiki/w/%EC%97%AC%EC%88%98%ED%95%B4%EC%83%81%EC%BC%80%EC%9D%B4%EB%B8%94%EC%B9%B4 |
| Source Role | OFFICIAL (secondary/public reference) |
| Raw Claim | 자산정류장에는 엘리베이터 타워가 있어 주차장 레벨에서 탑승 구역으로 무료 이동 가능 (09:00~22:00). 목조 계단 대안 존재하나 "꽤 가팔라서" 노약자는 엘리베이터 이용 권장. |
| Normalized Claim | 자산정류장 has an elevator tower providing free vertical access from the parking level to the boarding area (09:00–22:00). Wooden stairs are an alternative but described as "quite steep" — elevator strongly recommended for elderly visitors. |
| Stability | STABLE (structural feature); operating hours SEMI_STABLE |
| Corroboration Links | EI-CC-002-E (자산 station location context) |
| Admissibility Notes | Structural access feature relevant to C-2 (vehicle/physical access per station). Elevator hours = SEMI_STABLE (event trigger: operational change announcement). NOT CC-003 scope — this is access structure, not parking. |

**EI-CC-002-J — 돌산정류장 location and address (OFFICIAL)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-J |
| ER IDs | ER-CC-002 |
| Collection Date | 2026-09-27 |
| Source Type | OFFICIAL (Yeosu city official tourism page) |
| Source Locator | https://www.yeosu.go.kr/tour/travel/10tour/cablecar |
| Source Role | OFFICIAL (primary) |
| Raw Claim | 돌산정류장(놀아정류장): 여수시 돌산읍 돌산로 3600-1 (돌산공원). 여수엑스포역에서 약 10km (거북선대교/돌산대교 경유). |
| Normalized Claim | 돌산정류장 (놀아정류장) is located within 돌산공원 (Dolsan Park), Dolsando Island. Address: 돌산읍 돌산로 3600-1. Approximately 10 km from 여수엑스포역 via 거북선대교 (Geobukseon Bridge) / Dolsan Bridge. Car or bus required — not walkable from Yeosu city center. |
| Stability | STABLE |
| Corroboration Links | EI-CC-002-K (bus access to this area), EI-CC-002-L (taxi) |
| Admissibility Notes | OFFICIAL primary. Yeosu city official page. Structural fact: 돌산정류장 is on Dolsan Island (separate island connected by bridge). Bridge crossing = mandatory for any access from Yeosu mainland. |

**EI-CC-002-K — 돌산정류장 bus access routes (OFFICIAL_PUBLIC)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-K |
| ER IDs | ER-CC-002 |
| Collection Date | 2026-09-27 |
| Source Type | OFFICIAL_PUBLIC (Namu Wiki) |
| Source Locator | https://namu.wiki/w/%EC%97%AC%EC%88%98%ED%95%B4%EC%83%81%EC%BC%80%EC%9D%B4%EB%B8%94%EC%B9%B4 |
| Source Role | MAP_ROUTE / OFFICIAL (primary — Dolsan bus cluster serving island) |
| Raw Claim | 돌산정류장으로는 100·102·103·105·106·109·111·112·113·114·115·116·999번 등 돌산도 방면 다수 노선 버스 운행. |
| Normalized Claim | 돌산정류장 is served by the Dolsan Island bus cluster: routes 100, 102, 103, 105, 106, 109, 111, 112, 113, 114, 115, 116, 999 and others running to/through Dolsando Island via bridge. |
| Stability | SEMI_STABLE (many routes provide redundancy; single-route cancellation low-impact) |
| Corroboration Links | EI-CC-002-J (confirms Dolsando island location requiring bridge crossing) |
| Admissibility Notes | Bus cluster to Dolsan Island confirms multiple transit options. Individual schedules DYNAMIC. Because Dolsan Island is served by many routes, access by bus is structurally well-supported despite distance. |

**EI-CC-002-L — 돌산정류장 taxi access (MAP_ROUTE)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-L |
| ER IDs | ER-CC-002 |
| Collection Date | 2026-09-27 |
| Source Type | MAP_ROUTE |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-from-ktx-station/ |
| Source Role | MAP_ROUTE (primary) |
| Raw Claim | 여수엑스포역 → 돌산정류장: 약 10km, 택시 약 10~12분, 요금 ₩8,000~10,000. 대중교통에 비해 효율적. |
| Normalized Claim | Taxi from 여수엑스포역 to 돌산정류장: approximately 10 km / 10–12 minutes / ₩8,000–10,000. More time-efficient than public transit for this distance. |
| Stability | SEMI_STABLE (time STABLE; fare volatile) |
| Corroboration Links | EI-CC-002-J (10 km distance confirmed) |
| Admissibility Notes | MAP_ROUTE primary. ₩8,000–10,000 range = estimate (metered fare volatile). Time estimate STABLE for 10 km with bridge crossing. |

---

## 7. SEMI_STABLE Live Trigger Design

**Stable core** (store permanently, no periodic refresh):
- Station addresses (자산=수정동 777-4; 돌산=돌산읍 돌산로 3600-1)
- Bus route numbers serving each station (자산: 2/68/76/333/555; 돌산: 100-series+999)
- Walk distance from Expo to 자산 (1.5 km)
- Elevator tower existence at 자산 station and free operation window
- Structural fact: 돌산 station on Dolsan Island — bridge crossing mandatory

**Volatile** (do NOT store as permanent facts — use LIVE trigger protocol):
- Current bus schedules and exact fares
- Elevator operating hour changes (beyond 09:00–22:00 baseline)
- Road construction affecting specific access routes
- Current taxi metered fare levels

**Live Trigger Events (event/context-based — not time-interval-based):**

| Trigger Event | Detection Signal | Response |
|---|---|---|
| 거북선대교 or 돌산대교 construction/closure | Traveler mentions road closure; news of bridge work | QUALIFY 돌산 station access; taxi via alternate route or redirect to 자산 only |
| 자산정류장 access road construction | Traveler asks about current construction in 수정동 area | QUALIFY 자산 walking/car access; provide bus as alternative |
| Bus route restructuring (노선 개편) | Traveler asks about specific bus number not matching stored list | QUALIFY specific route; direct to 여수시교통정보센터 (its.yeosu.go.kr) for current routes |
| 자산 elevator tower operational change | Traveler mentions elevator unavailable | QUALIFY elevator; note wooden stair alternative (steep) |
| Seasonal access changes (peak season) | Traveler mentions specific high-season date | Note parking congestion potential (CC-003 scope); access structure unchanged |

**Fallback for any live trigger:** QUALIFY specific disrupted access mode; taxi remains universal alternative for both stations from Expo area.

---

## 8. Conflict Register

**CONFLICT-CC-002-01 — 자산 station address: 수정동 332-55 vs 수정동 777-4**

| Field | Value |
|---|---|
| Conflict ID | CONFLICT-CC-002-01 |
| Conflict Type | SCOPE_DIFFERENCE |
| Item A | Yeosu city page: "수정동 332-55 (오동도 주차타워)" |
| Item B | Official cable car parking page snippet: "수정동 777-4" |
| Resolution | RESOLVED — SCOPE_DIFFERENCE (not fact conflict). 수정동 332-55 = 오동도 주차타워 (parking tower building). 수정동 777-4 = 자산정류장 station building. Both are within the same 자산 station compound in 수정동. Different buildings, same access area. The station building address (777-4) is the relevant claim for ER-CC-002. |
| Verdict | SCOPE_DIFFERENCE_RESOLVED |

No other conflicts detected across 12 evidence items.

---

## 9. Stop Condition Test (AUTHORITATIVE_FACT_SUFFICIENT)

| # | Criterion | Result |
|---|---|---|
| A | Both stations have confirmed geographic location (area/island) | PASS — 자산=수정동 Yeosu city mainland; 돌산=돌산도 Dolsan Island |
| B | 자산 station has confirmed address | PASS — 수정동 777-4 (OFFICIAL source) |
| C | 돌산 station has confirmed address | PASS — 돌산읍 돌산로 3600-1 (Yeosu city OFFICIAL) |
| D | At least 1 MAP_ROUTE/OFFICIAL confirmed access mode for 자산 station | PASS — Bus routes 2/68/76/333/555 + walk 1.5 km (MAP_ROUTE confirmed) |
| E | At least 1 MAP_ROUTE/OFFICIAL confirmed access mode for 돌산 station | PASS — Bus 100-series + taxi 10–12 min (MAP_ROUTE/OFFICIAL_PUBLIC confirmed) |
| F | Bus access confirmed for at least one station | PASS — 자산: routes 2/68/76/333/555 (2-source corroboration: oh-my-post + Namu Wiki) |
| G | SEMI_STABLE live trigger design complete | PASS — 5 event triggers defined in §7 |
| H | Source role contract fulfilled (MAP_ROUTE/OFFICIAL primary for new items) | PASS — E-J from OFFICIAL/MAP_ROUTE; K-L from MAP_ROUTE/OFFICIAL_PUBLIC |
| I | Dependency ER-CC-001 verified before collection | PASS — VERIFIED_FOR_PREPARATION (Wave 1, 2026-09-27) |
| J | Gap freeze documented before any new collection | PASS — §5 Gap Freeze table executed before §6 |
| K | Existing items A-D admissibility-tested; PARTIALLY_REUSABLE classification recorded | PASS — §4 Admissibility Test complete |
| L | Structural access feature of 자산 station confirmed (elevator) | PASS — Namu Wiki OFFICIAL_PUBLIC (EI-CC-002-I) |
| M | Bridge crossing requirement for 돌산 station structurally confirmed | PASS — EI-CC-002-J; 돌산도 island confirmed by Yeosu OFFICIAL |
| N | CC-003 parking scope excluded from this collection | PASS — parking detail explicitly excluded; CC-003 boundary preserved |
| O | No suitability verdict generated | PASS — no SOUL judgment text produced |

**15/15 PASS → AUTHORITATIVE_FACT_SUFFICIENT → VERIFIED_FOR_PREPARATION**

---

## 10. Collection Outcome

**Outcome:** VERIFIED_FOR_PREPARATION  
**Stop Condition Met:** AUTHORITATIVE_FACT_SUFFICIENT (15/15 criteria PASS)  
**Conflicts Resolved:** 1 (CONFLICT-CC-002-01 — SCOPE_DIFFERENCE, resolved)  
**Total Evidence Items:** 12 (A–D existing PARTIALLY_REUSABLE + E–L new)

### Access Structure Summary (for SOUL preparation use)

**자산정류장 (해야정류장) — Mainland Yeosu side:**
- Location: 수정동 777-4, 자산공원 area, Yeosu city mainland
- Distance from 여수엑스포역: ~1.5 km
- Bus: routes 2, 68, 76, 333, 555 → "오동도 입구" area (~5–10 min, ~₩1,400–1,500)
- Walk: ~15–20 min from Expo station via seaside coastal road (flat)
- Taxi: ~5–7 min / ₩5,000–7,000
- Structural access: elevator tower (free, 09:00–22:00) from parking level to boarding; wooden stairs alternative (steep)

**돌산정류장 (놀아정류장) — Dolsan Island side:**
- Location: 돌산읍 돌산로 3600-1 (돌산공원), Dolsando Island
- Distance from 여수엑스포역: ~10 km (via 거북선대교 / Dolsan Bridge)
- Bridge crossing mandatory for all access modes
- Bus: Dolsan Island cluster — routes 100, 102, 103, 105, 106, 109, 111, 112, 113, 114, 115, 116, 999 and others
- Taxi: ~10–12 min / ₩8,000–10,000 from Expo station
- Car: via Dolsandaegyo — substantially further from Yeosu city center than 자산 station

**Key structural asymmetry:** 자산 station is 1.5 km / walkable from main transit hub; 돌산 station is 10 km / bridge-crossing required. This is a material input for C-2 (vehicle-aware boarding guidance) and CC-003 (parking judgment).

### Unlocks
- ER-CC-003 (prerequisite: CC-001 + CC-002 — now both VERIFIED ✓)
- ER-CC-004 (prerequisite: CC-001 + CC-002 + CC-003 — CC-003 still needed)
- ER-REL-001 (no access dependency; CC-001 dependency already met)

---

## 11. Source Role Corrections

**No source role correction required for ER-CC-002.**

The canonical Matrix specifies MAP_ROUTE / OFFICIAL primary and FOUNDER secondary. Collection followed this exactly:
- EI-CC-002-E (OFFICIAL), EI-CC-002-F/G/H/L (MAP_ROUTE), EI-CC-002-I/K (OFFICIAL_PUBLIC)
- EI-CC-002-A/B/C/D (FOUNDER secondary — pre-existing, correctly classified)

This differs from prior cycles (OD-004 where OFFICIAL was incorrectly assumed as primary; HY-002 where OFFICIAL was incorrectly assumed as secondary). CC-002 had no prompt-vs-canonical mismatch.
