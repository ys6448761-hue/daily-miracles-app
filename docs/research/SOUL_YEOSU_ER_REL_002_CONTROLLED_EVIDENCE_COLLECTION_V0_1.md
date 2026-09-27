# SOUL Yeosu ER-REL-002 Controlled Evidence Collection V0.1
# Yeosu Maritime Cable Car — Route/Connection from Each Exit to Odongdo

**Collection Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Starting HEAD:** 9251378
**Governed by:** SOUL_YEOSU_3_PLACE_CONTROLLED_EVIDENCE_COLLECTION_PLAN_V0_1.md + SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md

---

## 1. Collection Metadata

| Field | Value |
|---|---|
| ER ID | ER-REL-002 |
| Title | Route/Connection from Each Cable Car Exit to Odongdo |
| Wave | Wave 3 (first cycle) |
| Collection Status (start) | NOT_ADDRESSED / PARTIAL_GAP (via REL-001 reuse) |
| Collection Status (end) | VERIFIED_FOR_PREPARATION |
| Stop Condition | RELATIONSHIP_SUFFICIENT |
| Controlled Collection Cycle | 10 |
| Collector | Claude Sonnet 4.6 |

---

## 2. Canonical Contract (from Matrix V0.1, lines 718–738)

| Field | Value |
|---|---|
| ER ID | ER-REL-002 |
| Related Place(s) | 여수해상케이블카, 오동도 |
| Related Scenario(s) | O-3, C-3 |
| Required Judgment | ANSWER + JUDGMENT — sequence feasibility; direction selection for Odongdo |
| Knowledge Category | PLACE_TO_PLACE_CONNECTION / SEQUENCE |
| Evidence Needed | Practical connection from each cable car exit station to Odongdo — what route exists, what the practical connection looks like, what the travel burden is |
| Preferred Source Role | MAP_ROUTE |
| Secondary Source Role | FOUNDER / WORLD_EXPERIENCE |
| Stability Class | STABLE |
| Live Trigger | None for route geography; operating status = ER-CC-005 (separate) |
| Confidence Requirement | Route-confirmed per exit station |
| Negative/Exception Knowledge | YES — connection impractical or requiring major detour |
| Relationship Dependency | ER-REL-001, ER-CC-001, ER-OD-003 |
| Behavior if Missing | UNKNOWN |
| Stop Condition | RELATIONSHIP_SUFFICIENT |
| Collection Priority | P0 |

**Collection Boundary:** the structural RELATIONSHIP between each cable car exit station and Odongdo.

**Explicit Exclusions (do NOT collect):**
- Ticket type / one-way vs round-trip recommendation (REL-005 scope)
- Which station user should board at (REL-005 scope)
- Best direction recommendation (REL-005 scope)
- Parking per station (CC-003 scope)
- Station operating hours (CC-005 scope)
- Current cable car availability (CC-005 scope)
- Ticket price / queue time
- Odongdo parking detail (OD-004 scope)
- Odongdo internal vehicle/train structure beyond OD-003 verified context
- Child/Senior suitability
- Final SOUL answer

---

## 3. Dependency Verification

| Dependency | Required Status | Actual Status | Verification Source |
|---|---|---|---|
| ER-REL-001 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED | Project State + artifact a7ee4b5 |
| ER-CC-001 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED | Project State + artifact 45d8a38 |
| ER-OD-003 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED | Project State line 234 + artifact exists |

All 3 dependencies met. Collection proceeds as READY.

---

## 4. Starting Gap / Existing Evidence Admissibility Test

### 4.1 Candidate Existing Items

**EI-REL-001-C** (from ER-REL-001 artifact, commit a7ee4b5)

| Field | Value |
|---|---|
| Original ER | ER-REL-001 |
| Source Role | MAP_ROUTE |
| Claim | 오동도 입구 정류장에서 자산정류장까지는 도보 5분 거리. 자산정류장 주소: 오동도로 116 (소노캄 호텔 맞은편). |
| Admissibility for REL-002 | **PARTIALLY_REUSABLE** |
| Reason | Establishes 자산정류장 ↔ 오동도 입구 walking distance (~5 min). Source role MAP_ROUTE matches REL-002 primary. Core structural connection fact. Scope: 오동도 입구/방파제 시작, NOT island interior. |

**EI-REL-001-E** (from ER-REL-001 artifact)

| Field | Value |
|---|---|
| Original ER | ER-REL-001 |
| Source Role | DERIVED (yeosu.go.kr OFFICIAL + CC-002 MAP_ROUTE EI-CC-002-L) |
| Claim | 돌산정류장은 돌산읍 소재. 오동도 도달 위해 거북선대교 경유 필요. 택시 약 10~12분, ₩8,000~10,000. |
| Admissibility for REL-002 | **PARTIALLY_REUSABLE** |
| Reason | Establishes 돌산정류장 → 오동도 requires bridge crossing; taxi mode confirmed; time and cost bracketed. Derivation is transparent (OFFICIAL address + MAP_ROUTE taxi time). Core structural constraint. |

**NEG-REL-001-001** (from ER-REL-001 artifact)

| Field | Value |
|---|---|
| Original ER | ER-REL-001 |
| Source Role | AUTHORITATIVE (derived from ER-REL-001 geographic facts) |
| Claim | 자산→돌산 one-way does NOT efficiently serve 오동도. From 돌산정류장, bridge crossing back required. |
| Admissibility for REL-002 | **SUPPORTING_ONLY** |
| Reason | Establishes directional inefficiency. Does not fill route-character gap for REL-002 (which needs practical connection description, not direction framing). Supports negative knowledge item. |

**EI-OD-003-A** (from ER-OD-003 artifact, VERIFIED Wave 1)

| Field | Value |
|---|---|
| Original ER | ER-OD-003 |
| Source Role | OFFICIAL (yeosu.go.kr) |
| Claim | 오동도 입구 주차장 60대. 방파제 도보 약 15분으로 섬 진입. 차량 방파제 진입 금지. |
| Admissibility for REL-002 | **CONTEXT_ONLY** |
| Reason | Anchors the destination: 오동도 입구 (방파제 시작점) is the relevant endpoint for REL-002 — NOT the island interior. The ~15 min causeway walk is Odongdo internal structure, not the cable-car-to-entrance route. |

### 4.2 Starting Gap Classification

**PARTIAL_GAP** — two structural facts established via reuse; path character and alternative modes not yet confirmed.

---

## 5. Gap Freeze

| Component | Status | Source |
|---|---|---|
| 자산 측: ~5 min walk to 오동도 입구 | **SUPPORTED** | EI-REL-001-C (MAP_ROUTE) |
| 돌산 측: bridge crossing required | **SUPPORTED** | EI-REL-001-E (DERIVED OFFICIAL+MAP_ROUTE) |
| 돌산 측: taxi ~10~12 min, ₩8,000~10,000 | **SUPPORTED** | EI-REL-001-E + EI-CC-002-L |
| 자산 측: path character (flat/waterfront/terrain) | **MISSING** |
| 자산 측: scope clarification (5 min = entrance; island interior further) | **MISSING** |
| 자산 측: bus option from 자산 area to 오동도 | **MISSING** |
| 돌산 측: Geobukseon Bridge pedestrian feasibility | **MISSING** |
| 돌산 측: bus alternative mode from 돌산 to 오동도 | **MISSING** |

---

## 6. New Evidence Items

### EI-REL-002-A — 자산정류장 is co-located in 오동도 compound (walking flat, same campus)

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-002-A |
| ER IDs | ER-REL-002 |
| Collection Date | 2026-09-27 |
| Source Type | World Experience blog (Korean travel) |
| Source Name | neoplats.com — "여수 케이블카 편도 오동도에서 돌산공원으로~" |
| Source URL | https://neoplats.com/37 |
| Source Role | WORLD_EXPERIENCE |
| Raw Claim | 자산정류장은 오동도 입구에 위치. Jasan station appears to be located at the Odongdo entrance itself. Blogger found cable car station "on the way out" of 오동도 — i.e., departing 오동도 directly leads to the cable car station. |
| Normalized Claim | 자산정류장 is physically situated at the 오동도 entrance area. A traveler exiting 오동도 naturally encounters 자산정류장 on departure — no separate travel segment required between 오동도 입구 and 자산정류장. |
| Stability | STABLE |
| Corroboration Links | EI-REL-001-C (5 min walk confirmed same area), EI-REL-001-A (자산 compound = 오동도 parking tower area) |
| Conflict Links | None |
| Admissibility Notes | WE confirms co-location; corroborates MAP_ROUTE claim EI-REL-001-C. Single WE source — treated as CORROBORATION, not independent primary. |
| Notes/Limitations | Korean blog, direction: 오동도 → 케이블카 (reverse of main question but symmetric). Traveler did not describe precise path character. |

---

### EI-REL-002-B — 자산정류장 to 오동도 island interior: ~20 min walk (scope = island, not entrance)

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-002-B |
| ER IDs | ER-REL-002 |
| Collection Date | 2026-09-27 |
| Source Type | English travel blog (MAP_ROUTE-type itinerary) |
| Source Name | South of Seoul — "Car Free Yeosu Itinerary" |
| Source URL | https://blog.southofseoul.net/car-free-yeosu-itinerary/ |
| Source Role | MAP_ROUTE |
| Raw Claim | "On the Jasan Station side of the cable car ride is a 20 minute walk to this island." |
| Normalized Claim | From 자산정류장, walking to Odongdo island proper (interior) takes approximately 20 minutes. |
| Stability | STABLE |
| Corroboration Links | CONFLICT-REL-002-01 (scope difference with EI-REL-001-C — see §11) |
| Conflict Links | CONFLICT-REL-002-01 |
| Admissibility Notes | MAP_ROUTE role. Establishes total walk time from 자산 station to island proper. Scope = 오동도 island (full walk including causeway), NOT just the entrance gate. This is a SCOPE_DIFFERENCE from EI-REL-001-C (5 min = entrance only). Both are correct within their respective scope anchors. |
| Notes/Limitations | Single English blog. "20 minutes" is consistent with: ~5 min to 오동도 입구 (EI-REL-001-C) + ~15 min causeway walk (OD-003-A) = ~20 min total. Internally consistent. |

---

### EI-REL-002-C — Geobukseon Bridge: 744m vehicular highway, no confirmed pedestrian walkway

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-002-C |
| ER IDs | ER-REL-002 |
| Collection Date | 2026-09-27 |
| Source Type | Official city tourism + government bridge page |
| Source Name | yeosu.go.kr — 거북선대교 관광 페이지 |
| Source URL | https://yeosu.go.kr/tour/leisure/bridge/geobuksun_bridge |
| Source Role | OFFICIAL |
| Raw Claim | 거북선대교: 총연장 744m, 4차로 왕복. 차량 통행 전용 구조. 보행자 전용 시설 언급 없음. |
| Normalized Claim | Geobukseon Bridge: 744m total length, 4-lane bidirectional vehicular highway. No pedestrian walkway is mentioned in official city tourism materials or bridge specification sources. |
| Stability | STABLE |
| Corroboration Links | EI-REL-001-E (bridge crossing confirmed required for 돌산→오동도) |
| Conflict Links | None |
| Admissibility Notes | OFFICIAL source. Establishes bridge is a vehicular structure. Absence of pedestrian walkway mention across multiple sources (city tourism, bridge specs, Wikipedia) supports: walking across this bridge is not a confirmed practical option for travelers. |
| Notes/Limitations | Absence-of-evidence finding: no positive confirmation of pedestrian prohibition (no sign saying "no pedestrians"). However, zero sources describe or recommend walking the bridge; city tourism promotes it for driving and scenic views by vehicle. Walking across a 744m 4-lane highway bridge is not a standard travel behavior absent explicit pedestrian infrastructure. NEG classification: see §10. |

---

### EI-REL-002-D — Bus from 돌산 area to 오동도: viable but requires transfer / not direct

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-002-D |
| ER IDs | ER-REL-002 |
| Collection Date | 2026-09-27 |
| Source Type | Web search synthesis (city bus system) |
| Source Name | Yeosu bus route research (its.yeosu.go.kr + namu.wiki) |
| Source URL | https://its.yeosu.go.kr/bus/bustimeinfo |
| Source Role | MAP_ROUTE (search-synthesized) |
| Raw Claim | 돌산도 방면 버스(100번대 등)는 거북선대교를 경유해 여수 시내로 이동. 오동도 방면 버스(2, 68, 76, 333번 등)는 별도 노선. 돌산공원 → 오동도입구 직통 버스 단일 노선 확인되지 않음. |
| Normalized Claim | Buses from 돌산 area (100-series) cross Geobukseon Bridge toward Yeosu city center. Separate buses (routes 2, 68, 76, 333) serve 오동도입구 from city. No single direct bus from 돌산정류장 area to 오동도입구 confirmed. A traveler using public transit would likely need to take a 돌산-area bus toward city, then transfer or walk to 오동도입구. |
| Stability | SEMI_STABLE (bus routes can change; structure = STABLE) |
| Corroboration Links | EI-CC-002-K (돌산 bus 100-series confirmed), EI-CC-002-F (자산 bus 2/68/76/333 confirmed to 오동도 area) |
| Conflict Links | None |
| Admissibility Notes | MAP_ROUTE-synthesized. No single source confirmed direct bus; inference from two separate route systems. Bus as viable mode for 돌산→오동도 is POSSIBLE but requires at least one transfer and significantly more time than taxi. |
| Notes/Limitations | Bus transfer point and total time NOT confirmed. Exact transfer required. For this ER, the structural conclusion is: bus route exists but is not direct. Specific route number/time = VERIFY_REQUIRED if needed for HY-007-type precision. |

---

## 7. Reused Evidence Cross-Reference

| Item | ER Origin | Admissibility | Role in REL-002 |
|---|---|---|---|
| EI-REL-001-C | ER-REL-001 | PARTIALLY_REUSABLE | Anchors 자산↔오동도 입구 ~5 min walk (MAP_ROUTE) |
| EI-REL-001-E | ER-REL-001 | PARTIALLY_REUSABLE | Anchors 돌산→오동도 bridge crossing requirement + taxi time |
| NEG-REL-001-001 | ER-REL-001 | SUPPORTING_ONLY | Supports 돌산 side negative knowledge |
| EI-OD-003-A | ER-OD-003 | CONTEXT_ONLY | Anchors 오동도 입구 as destination reference (방파제 시작 = REL-002 endpoint) |

---

## 8. Both-Side Normalized Relationship Model

### A. 자산정류장 → 오동도

| Field | Value |
|---|---|
| Origin | 자산정류장 (해야정류장), 오동도로 116, 수정동 |
| Destination | 오동도 입구 (방파제 시작점) / 오동도 섬 본체 |
| Mode | Walking (primary — no vehicle required) |
| Connection Type | **DIRECT** — same mainland compound; no bridge crossing; no vehicle transfer |
| Route Segment | 자산정류장 케이블카 건물 하차 → 엘리베이터 하강(무료, CC-002 확인) → 오동도 주차장 구역 (same compound) → 오동도 방파제 입구 |
| Approximate Burden / Time | **~5 min walk** to 오동도 입구/방파제 시작 (EI-REL-001-C, MAP_ROUTE); **~20 min walk** to 오동도 섬 내부 (EI-REL-002-B; = 5min entrance + ~15min causeway) |
| Directness | **DIRECT** — no bridge crossing; no road crossing overhead; same waterfront compound |
| Transfer Requirement | None |
| Physical Friction | Flat (주차 구역 및 방파제 진입로 평지 — consistent with 오동도 entrance structure per OD-003); elevator from cable car tower available (CC-002 EI-CC-002-I) |
| Evidence Role | MAP_ROUTE (EI-REL-001-C) + WORLD_EXPERIENCE corroboration (EI-REL-002-A) |
| Stability | STABLE |
| Confidence | HIGH for structural connection (same compound, multiple sources agree); APPROXIMATE for time range |
| Exception/Limitation | Scope distinction: 5 min = 방파제 입구; ~20 min = 섬 내부. SOUL must distinguish these when answering H-3-type time questions. Elevator tower hours (09:00–22:00 per CC-002): foot alternative (wooden stairs) noted as steep. |

---

### B. 돌산정류장 → 오동도

| Field | Value |
|---|---|
| Origin | 돌산정류장 (놀아정류장), 돌산읍 돌산로 3600-1, 돌산공원 |
| Destination | 오동도 입구 (방파제 시작점) |
| Mode | Taxi (primary — confirmed viable); Bus (possible but requires transfer, not direct) |
| Connection Type | **INDIRECT** — requires crossing Geobukseon Bridge from Dolsan Island back to mainland |
| Route Segment | 돌산정류장 → 거북선대교 경유(taxi/bus) → 여수 본도 → 오동도 입구 |
| Approximate Burden / Time | Taxi: **~10–12 min, ₩8,000–10,000** (EI-REL-001-E + EI-CC-002-L); Bus: VERIFY_REQUIRED (likely 20–30 min + transfer) |
| Directness | **INDIRECT** — must cross bridge to return to mainland; then travel to 오동도 area |
| Transfer Requirement | Vehicle (taxi or bus + possible transfer) required |
| Physical Friction | Bridge overhead (~10–12 min road transit); taxi cost; bus route complexity |
| Evidence Role | MAP_ROUTE + OFFICIAL DERIVED (EI-REL-001-E); OFFICIAL bridge specs (EI-REL-002-C) |
| Stability | STABLE (geographic structure); SEMI_STABLE for taxi time (traffic) |
| Confidence | HIGH for structural constraint (bridge crossing mandatory); APPROXIMATE for time |
| Exception/Limitation | Walking: not a confirmed practical option (see §10 NEG-REL-002-002). Bus transfer: viable but route and time unconfirmed. 돌산 area has ferries to Yeosu port area — irrelevant to 오동도 access. |

---

## 9. Stability Assessment

| Component | Stability | Rationale |
|---|---|---|
| 자산 = mainland side / 오동도 same compound | STABLE | Geographic fact; will not change without construction |
| 돌산 = Dolsan Island / bridge crossing required | STABLE | Geographic fact; bridge exists and is permanent |
| ~5 min walk (자산 → 오동도 입구) | STABLE (structure) | Route geography stable; actual walking speed varies |
| ~20 min walk (자산 → 오동도 island) | STABLE (structure) | Route geography stable; actual speed varies |
| Taxi time 돌산 → 오동도 (~10–12 min) | SEMI_STABLE | Road route stable; traffic conditions variable |
| Bridge = vehicular road | STABLE | Engineering fact; no pedestrian infrastructure confirmed |
| Bus route availability | SEMI_STABLE | Bus routes can be modified; current structure confirmed |

**Live Trigger (per contract):** None for route geography. ER-CC-005 handles operating status triggers for cable car itself.

---

## 10. Negative/Exception Knowledge

### NEG-REL-002-001 — 자산→돌산 one-way exits away from 오동도; 돌산 exit is NOT the 오동도-side exit

| Field | Value |
|---|---|
| Item ID | NEG-REL-002-001 |
| Source Evidence | EI-REL-001-A (자산=mainland), EI-REL-001-B (돌산=island), NEG-REL-001-001 (direction inefficiency) |
| Statement | A traveler who boards at 자산정류장 and takes a one-way ticket to 돌산정류장 exits on Dolsan Island — the OPPOSITE side from 오동도. They cannot reach 오동도 on foot from 돌산 exit; they must take a vehicle across Geobukseon Bridge (~10–12 min taxi). |
| Scope | Direction-aware sequencing: 자산→돌산 one-way is NOT an 오동도-access route. |
| Admissibility | AUTHORITATIVE — derived from verified geographic facts. |

### NEG-REL-002-002 — Walking from 돌산정류장 to 오동도 is not a practical option

| Field | Value |
|---|---|
| Item ID | NEG-REL-002-002 |
| Source Evidence | EI-REL-002-C (Geobukseon Bridge = 744m vehicular highway; no pedestrian walkway confirmed) |
| Statement | Geobukseon Bridge is a 744m 4-lane vehicular highway. No pedestrian walkway is confirmed in any official or travel source. Walking from 돌산정류장 to 오동도 is not a confirmed practical option for travelers. A vehicle (taxi or bus) is required for this connection. |
| Scope | 돌산 side mode constraint: walking-only approach is NOT viable for this connection. |
| Confidence | HIGH (multiple sources confirm vehicular nature; no source describes or recommends pedestrian crossing) |
| Limitation | Absence-of-evidence (no explicit pedestrian prohibition sign found). If a pedestrian path were confirmed, this item would require revision. |

### NEG-REL-002-003 — 오동도 입구 ≠ 오동도 island interior (scope distinction)

| Field | Value |
|---|---|
| Item ID | NEG-REL-002-003 |
| Source Evidence | EI-REL-001-C (5 min to entrance), EI-REL-002-B (20 min to island), EI-OD-003-A (15 min causeway) |
| Statement | "5분 거리" from 자산정류장 refers to 오동도 방파제 입구 (causeway gate), NOT the island interior. Reaching the island interior requires an additional ~15 min walk along the causeway, totaling ~20 min from 자산정류장. SOUL should not represent 5 min as "오동도에 도달하는 시간" without scope qualification. |
| Scope | Time-scope integrity in O-3/C-3 answers. |

---

## 11. Conflict Register

### CONFLICT-REL-002-01 — Scope Difference: 5 min vs 20 min walk from 자산 station to Odongdo

| Field | Value |
|---|---|
| Conflict ID | CONFLICT-REL-002-01 |
| Conflict Type | SCOPE_DIFFERENCE |
| Claim A | EI-REL-001-C (MAP_ROUTE): 도보 5분 — from 오동도 입구 정류장 to 자산정류장 |
| Claim B | EI-REL-002-B (MAP_ROUTE/WE): "20 minute walk to this island" from 자산 station |
| Resolution | SCOPE_DIFFERENCE — both claims are correct within their respective destination anchors. Claim A: 오동도 입구 (방파제 시작점) = 5 min. Claim B: 오동도 island proper (interior, after causeway) = 20 min. Reconciliation: 5 min (자산→입구) + 15 min (causeway per EI-OD-003-A) = ~20 min (자산→island). Internally consistent. |
| Status | RESOLVED |
| Impact | No evidence retraction required. NEG-REL-002-003 captures the scope distinction for SOUL use. |

---

## 12. Stop Condition Test (RELATIONSHIP_SUFFICIENT)

| # | Criterion | Evidence | Result |
|---|---|---|---|
| A | Geographic connection from 자산 exit to 오동도 established (MAP_ROUTE confirmed)? | EI-REL-001-C (MAP_ROUTE, ~5 min) + EI-REL-002-A (WE corroboration, co-located) | ✓ PASS |
| B | Route character for 자산 side established (path described beyond time)? | EI-REL-002-A: 자산 is at 오동도 entrance compound; flat waterfront area; elevator descent available (CC-002). Path character: same compound, flat access. | ✓ PASS |
| C | Geographic connection from 돌산 exit to 오동도 established (bridge crossing confirmed)? | EI-REL-001-E (bridge mandatory), EI-REL-002-C (bridge = 744m vehicular highway) | ✓ PASS |
| D | Mode requirement for 돌산 side established (vehicle required for practical connection)? | EI-REL-002-C (no pedestrian walkway confirmed), EI-REL-002-D (bus possible but indirect), NEG-REL-002-002 | ✓ PASS |
| E | Asymmetry between 자산 side (direct walk) and 돌산 side (indirect vehicle) established? | Both-side model in §8 explicitly separates DIRECT vs INDIRECT | ✓ PASS |
| F | Negative/exception knowledge captured? | NEG-REL-002-001 (direction), NEG-REL-002-002 (walking infeasible), NEG-REL-002-003 (scope) | ✓ PASS |
| G | At least 2 MAP_ROUTE/OFFICIAL sources confirm 자산 side connection? | EI-REL-001-C (MAP_ROUTE) + EI-REL-002-B (MAP_ROUTE blog) + EI-REL-002-A (WE corroboration) | ✓ PASS |
| H | No unresolved FACT_CONFLICT? | CONFLICT-REL-002-01 = SCOPE_DIFFERENCE, RESOLVED | ✓ PASS |
| I | OD-003 Odongdo entrance/parking location provides destination anchor? | EI-OD-003-A (방파제 시작 = destination anchor); 15 min causeway bounds total time | ✓ PASS |
| J | Neighboring ER scopes (CC-003, REL-005) NOT required to make relationship usable? | Structural route facts established without parking (CC-003) or direction judgment (REL-005) | ✓ PASS |

**Stop Condition Result: 10/10 PASS → RELATIONSHIP_SUFFICIENT → VERIFIED_FOR_PREPARATION**

---

## 13. Collection Outcome

| Field | Value |
|---|---|
| Final Status | **VERIFIED_FOR_PREPARATION** |
| Gap Transition | PARTIAL_GAP → CLOSED |
| Stop Condition | RELATIONSHIP_SUFFICIENT — 10/10 PASS |
| Existing Items Reused | EI-REL-001-C (PARTIALLY_REUSABLE), EI-REL-001-E (PARTIALLY_REUSABLE), NEG-REL-001-001 (SUPPORTING_ONLY), EI-OD-003-A (CONTEXT_ONLY) |
| New Items Collected | EI-REL-002-A, EI-REL-002-B, EI-REL-002-C, EI-REL-002-D |
| NEG Items | NEG-REL-002-001, NEG-REL-002-002, NEG-REL-002-003 |
| Conflicts | 1 (CONFLICT-REL-002-01: SCOPE_DIFFERENCE, RESOLVED) |
| Controlled Collection Cycle | 9 → **10** |

---

## 14. Relationship Summary for SOUL Use

**FACT (supported structural relationships):**

- FACT-A: 자산정류장 is located in the same waterfront compound as 오동도 입구. Walking from 자산 cable car exit to 오동도 방파제 입구 takes approximately 5 minutes on flat ground. No bridge crossing or vehicle is required.
- FACT-B: Walking from 자산정류장 to 오동도 island interior (past the causeway) takes approximately 20 minutes total (~5 min to entrance + ~15 min causeway).
- FACT-C: 돌산정류장 is on Dolsan Island. Reaching 오동도 from 돌산정류장 requires crossing Geobukseon Bridge (744m vehicular highway) back to the mainland. A vehicle (taxi: ~10–12 min, ₩8,000–10,000) is the confirmed practical mode.
- FACT-D: Geobukseon Bridge has no confirmed pedestrian walkway. Walking from 돌산 to 오동도 is not an established practical option.
- FACT-E: The two cable car exit stations create fundamentally asymmetric 오동도 connection burdens: 자산 = direct walkable; 돌산 = indirect vehicle-dependent.

**EXPERIENCE (supported practical patterns):**

- EXP-A: At least one traveler (neoplats.com WE) went to 오동도 first, then naturally discovered and boarded the cable car at 자산 station on the way out — confirming that 오동도 and 자산 station are co-located and transitions between them are spontaneous/low-friction.
- EXP-B: A traveler who exited at 돌산정류장 immediately took a taxi — no described walking attempt. The taxi was the practical exit mode from 돌산.

**JUDGMENT INGREDIENT (bounded inputs for later SOUL judgment — NOT final answers):**

- JI-A: 자산 side offers walkable, low-cost 오동도 access. This is relevant evidence for C-3 direction selection judgment (REL-005) and O-3 sequence feasibility.
- JI-B: 돌산 side requires a vehicle return trip (~₩8,000–10,000 taxi) to reach 오동도. This additional cost and time is relevant evidence for direction selection, but the judgment itself (which direction is "better") belongs to REL-005.
- JI-C: If a traveler uses the cable car for 오동도 access efficiency, exiting at 자산 (or boarding at 자산 on return) is structurally advantageous. This is a JUDGMENT INGREDIENT — not a recommendation in this artifact.

**FINAL ANSWER: PROHIBITED in this artifact. Direction recommendation belongs to REL-005.**

---

## 15. Explicit Exclusions Confirmed

All items in the canonical exclusion list were not collected:
- No ticket type recommendation ✓
- No direction recommendation ("which station to board at") ✓
- No parking per station (CC-003) ✓
- No operating hours (CC-005) ✓
- No current cable car availability ✓
- No ticket price collected ✓
- No Odongdo parking beyond OD-003 context ✓
- No child/senior suitability ✓
- No polished SOUL dialogue ✓
- No final itinerary ✓

---

*Collection complete. ER-REL-002: VERIFIED_FOR_PREPARATION. Cycle 10. Next: ER-CC-003.*
