# ER-HY-007 Controlled Evidence Collection V0.1
## Travel Time Evidence to Hyangiram

**Collection Date:** 2026-09-28
**Wave:** 3
**Cycle:** 13
**ER Status:** VERIFIED_FOR_PREPARATION
**Stop Condition:** RELATIONSHIP_SUFFICIENT — ALL 13 ITEMS PASS

---

## 1. Collection Header

| Field | Value |
|---|---|
| ER ID | ER-HY-007 |
| Collection Date | 2026-09-28 |
| Wave | 3 |
| Cycle | 13 |
| Starting State | PARTIAL_GAP (Readiness Check V0.1) |
| Final Status | VERIFIED_FOR_PREPARATION |
| Stop Condition | RELATIONSHIP_SUFFICIENT (canonical Plan) |
| Stop Condition Met | YES — all 13 checklist items PASS |
| FOUNDER Assets | NO_ASSETS_FOUND |
| Conflict Registered | NONE (ESTIMATE_VARIATION on bus time documented; not a FACT_CONFLICT) |

---

## 2. Canonical Contract (from Matrix V0.1, lines 494–515)

| Field | Value |
|---|---|
| ER ID | ER-HY-007 |
| Related Place(s) | 향일암 (Hyangiram Hermitage) |
| Related Scenario(s) | H-3 |
| Required Judgment | JUDGMENT — time feasibility including travel to/from |
| Knowledge Category | TIME_BURDEN / ROUTE_RELATIONSHIP |
| Evidence Needed | Travel time from the most likely Yeosu traveler starting locations to Hyangiram — covering major transport modes relevant to the pilot scenarios |
| Why Needed | H-3 asks if 2 hours is enough. Without knowing travel time to/from Hyangiram, the judgment cannot be made. |
| Preferred Source Role | MAP_ROUTE |
| Secondary Source Role | FOUNDER / LOCAL_OPERATOR |
| Stability Class | SEMI_STABLE |
| Live Trigger | If road/transport disruption materially affects travel time |
| Confidence Requirement | Route-confirmed; approximate ranges acceptable if clearly bounded |
| Negative/Exception Knowledge | YES — ranges under which the 2-hour window is clearly infeasible |
| Relationship Dependency | ER-HY-006 |
| Missing-Evidence Consequence | Cannot answer H-3 without traveler's current location via ASK |
| Behavior if Missing | ASK |
| Collection Priority | P0 (canonical Matrix) |
| Collection Status (at entry) | NOT_COLLECTED → IN_COLLECTION |

**From Collection Plan V0.2 (line 608):**

| Wave | Priority | Collection Method | Stop Condition |
|---|---|---|---|
| 3 | P0 | MAP_ROUTE_CHECK | RELATIONSHIP_SUFFICIENT |

---

## 3. Dependency Verification

| Dependency ER | Required Status | Actual Status | Result |
|---|---|---|---|
| ER-HY-006 | VERIFIED_FOR_PREPARATION | VERIFIED_FOR_PREPARATION (Wave 2, 2026-09-27) | ✓ PASS |

**All dependencies satisfied. Collection is NOT BLOCKED.**

---

## 4. Stale-State Comparison (Project State vs Matrix vs Plan)

| Field | Project State ONE NEXT ACTION | Matrix/Plan (Canonical) | Discrepancy | Resolution |
|---|---|---|---|---|
| Priority | P1 | P0 (Matrix line 513, Plan line 608) | YES | Use P0 (canonical) |
| Stop Condition | Not stated in Project State | RELATIONSHIP_SUFFICIENT (Plan) / AUTHORITATIVE_FACT_SUFFICIENT (Readiness Check) | Readiness Check vs Plan conflict | Use RELATIONSHIP_SUFFICIENT (Plan is canonical; Readiness Check is derived) |
| Dependency | Wave 0 dep table says "Awaits ER-HY-001" (line 744) | Matrix: ER-HY-006 only | YES — Wave 0 stale | Use ER-HY-006 (canonical Matrix) |
| Wave placement | Wave 0 shows HY-007 in both Wave 3 AND Wave 5 tables | Plan: Wave 3 only | YES — Wave 5 entry is stale | Wave 3 is canonical (Plan line 608) |
| Gap Type | Wave 0 says FULL_GAP (lines 647, 677) | Readiness Check: PARTIAL_GAP (낭만버스 leg PARTIALLY_REUSABLE) | Yes — Wave 0 predates Readiness Check | PARTIAL_GAP per Readiness Check at collection entry |

**All discrepancies resolved in favor of canonical Matrix/Plan.**

---

## 5. Starting Gap (at collection entry)

**Gap Type:** PARTIAL_GAP (per Wave 3 Readiness Check V0.1, line 188)

**Known (PARTIALLY_REUSABLE):**
- 낭만버스1코스 전남해양수산과학관 → 향일암: 25분 (ROUTE_SOURCE, official schedule)

**Unknown / gap remaining before research:**
- 여수엑스포역 → 향일암: travel time by bus or car — UNKNOWN
- 여수 이순신광장 / 오동도 area → 향일암: travel time by car — UNKNOWN
- Last-mile structure (bus stop → hermitage entrance) — UNKNOWN
- Public bus route numbers and frequency confirmed — UNKNOWN

---

## 6. Existing Evidence Reuse Table

| Asset | Source Artifact | Admissibility | Origin | Destination | Mode | Time | Time Type | Stability | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Travel Time Matrix 낭만버스1코스 leg | YEOSU_TRAVEL_TIME_MATRIX_V0_1.md line 96 | PARTIALLY_REUSABLE | 전남해양수산과학관 | 향일암 (tour stop) | TOUR_BUS | 25 min | ROUTE_SOURCE (explicit schedule) | SEMI_STABLE | Tour bus format — passengers travel full circuit; NOT standalone transit. Cumulative from 엑스포역 = 65+ min legs only (10+10+20+25), plus dwelling = ~2h+ total. |
| Route Corpus R028 stop-stay | YEOSU_ROUTE_CORPUS_V0_1.md line 93 | CONTEXT_ONLY | 전남해양수산과학관 | 향일암 | TOUR_BUS | 75분 stay / 25분 이동 | SCHEDULE_DERIVED (corpus) | SEMI_STABLE | 75분 = site time (HY-006 scope); 25분 = transit leg = corroborates Matrix |
| HY-006 (45–90 min site duration) | ER-HY-006 artifact | NOT_ADMISSIBLE for HY-007 | — | — | — | 45–90 min | — | — | Visit duration ≠ travel time. Explicit scope exclusion. |
| BATCH_01 향일암 admission/hours | YEOSU_2026_VERIFICATION_BATCH_01.md | NOT_ADMISSIBLE for HY-007 | — | — | — | — | — | — | Operating info; not travel time |
| BATCH_03_TRANSPORT content | YEOSU_2026_VERIFICATION_BATCH_03_TRANSPORT.md | NO_CONTENT (grep: 0 matches for 향일암) | — | — | — | — | — | — | No Hyangiram transport data in BATCH_03 |
| BATCH_04_ISLAND_ACCESS content | YEOSU_2026_VERIFICATION_BATCH_04_ISLAND_ACCESS.md | NO_CONTENT (grep: 0 matches for 향일암) | — | — | — | — | — | — | No Hyangiram access data in BATCH_04 |

**낭만버스 leg interpretation (Section 7 of directive):**
- Exact origin: 전남해양수산과학관 (전라남도 여수시 오동도로 항)
- Exact destination: 향일암 (TOUR_BUS stop on 낭만버스1코스 circuit)
- Time type: ROUTE_SOURCE — explicitly stated in official yeosu.go.kr schedule (not derived from timestamps)
- Service context: 낭만버스1코스 is a guided tour bus (낭만버스 제1코스, 향일암코스). Travelers board at 여수엑스포역 and are carried through the full circuit. This is NOT point-to-point transit.
- HY-007 admissibility: PARTIALLY_REUSABLE — establishes that the 전남해양수산과학관→향일암 leg is approximately 25 min by vehicle on Dolsan route, giving a useful reference. Does NOT establish door-to-door time from key independent starting points.

---

## 7. Frozen Remaining Gap (before new research)

After reuse assessment, remaining gap at collection start:

| Dimension | Gap Status | Notes |
|---|---|---|
| 여수엑스포역 → 향일암 by car/taxi | UNKNOWN | Primary gap item |
| 여수엑스포역 → 향일암 by public bus | UNKNOWN | Bus route numbers, times, frequency unknown |
| 여수 이순신광장 / 오동도 → 향일암 by car | UNKNOWN | City-center area starting points |
| Last-mile: 향일암 bus stop → hermitage entrance | UNKNOWN | Walk from bus stop to gate |
| Bus stop name / location at Hyangiram end | UNKNOWN | |
| Traffic / peak-season variation | UNKNOWN | Normal vs holiday time differential |

---

## 8. FOUNDER Asset Search

**Search executed:** Grep across `docs/knowledge/` for 향일암 + travel time / 분 / 이동 keywords with FOUNDER context.

**Result: NO_ASSETS_FOUND**

No Founder-role field observations about Hyangiram travel times found in any knowledge document. FOUNDER secondary source role contributes zero evidence in this cycle.

---

## 9. Collection Log

| Source | URL / Reference | Purpose | Access Result |
|---|---|---|---|
| walkview.co.kr | https://www.walkview.co.kr/7155 | Bus route 111번 schedule, timing | ACCESSED — bus time from 엑스포역: ~1h27m; frequency 30-80분 |
| 82cook.com forum | https://www.82cook.com/entiz/read.php?bn=15&num=2882581 | WE: crowdsourced bus/car time estimates | ACCESSED — commenter: 111번 1시간내외; 116번 1시간30분; Naver 2h; blog ~1h; board ~1.5h |
| rome2rio.com | https://www.rome2rio.com/s/Hyangiram-Hermitage/Yeosu | MAP_ROUTE aggregator: car, taxi, bus times | ACCESSED — car 36min, 32.6km; bus 1h28m; taxi 36min ₩40-48K |
| yeosu.go.kr official | https://www.yeosu.go.kr/tour/travel/10tour/hyangilam | OFFICIAL city page: bus routes to Hyangiram | ACCESSED — confirmed 111, 111-1, 116; departure points |
| YEOSU_TRAVEL_TIME_MATRIX_V0_1.md | Repository asset | 낭만버스1코스 leg reuse | REUSED |
| YEOSU_ROUTE_CORPUS_V0_1.md | Repository asset | Route context, corroboration | REUSED (CONTEXT_ONLY) |
| YEOSU_2026_VERIFICATION_BATCH_01.md | Repository asset | Hyangiram operating / transport | REUSED — no HY-007 travel time content |
| BATCH_03_TRANSPORT, BATCH_04_ISLAND_ACCESS | Repository assets | Hyangiram transport | CHECKED — 0 matches |

---

## 10. Evidence Items

### EI-HY-007-A — Bus 111번 Route: 여수엑스포역 → 향일암(임포)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-007-A |
| ER | ER-HY-007 |
| Source Identity | rome2rio.com/s/Hyangiram-Hermitage/Yeosu + walkview.co.kr/7155 |
| Source Role | SCHEDULE (bus route) / MAP_ROUTE aggregator |
| Source Language | Korean / English |
| Source Independence | INDEPENDENT (two corroborating sources) |
| Status | ACCESSED |
| Origin | 여수엑스포역 (Yeosu Expo Station) area |
| Destination | 임포한솔횟집 정류장 (Impo bus stop — nearest to Hyangiram) |
| Mode | PUBLIC_BUS (111번) |
| Time Value | ~1h–1h28m (bus transit; see ESTIMATE_VARIATION note) |
| Time Evidence Type | SCHEDULE_DERIVED_TIME (rome2rio route calc: 1h28m) + WORLD_EXPERIENCE_OBSERVATION (commenter: "1시간내외") |
| Route/Segment | 여수엑스포역 → [multiple stops through 돌산대교] → 임포 |
| Distance | ~35 km (rome2rio road distance) |
| Transfer | None; direct 111번 service |
| Last-mile | 임포 bus stop → 향일암 매표소: ~11분 도보 (see EI-HY-007-D) |
| Conditions/Assumptions | Normal service day; no weather disruption; 111번 departure at/near Expo station |
| Access/Retrieval Date | 2026-09-28 |
| Stability | SEMI_STABLE — route structure STABLE; timetable/frequency VOLATILE |
| Confidence | MEDIUM — rome2rio aggregator + single travel blog; no direct OFFICIAL schedule verification |
| Limitations | rome2rio uses "Yeosu" as destination (general city point, not 엑스포역 specifically for return); actual stop name at Hyangiram end is 임포한솔횟집 정류장 (추정); schedule may have changed since walkview publication (2024 era data); bus 111번 frequency 30-80분 배차 makes planning uncertain |
| ER Mapping | HY-007 — public bus transit route with time |
| Notes | ESTIMATE_VARIATION: 82cook commenter "1시간내외" vs rome2rio "1h28m". Likely explanation: commenter gave approximate; rome2rio calculated full scheduled route. Both indicate ~1h-1.5h range. This is ESTIMATE_VARIATION (not FACT_CONFLICT). |

---

### EI-HY-007-B — Car/Taxi from Yeosu to Hyangiram (~36 min, 32.6 km)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-007-B |
| ER | ER-HY-007 |
| Source Identity | rome2rio.com/s/Hyangiram-Hermitage/Yeosu |
| Source Role | MAP_ROUTE (aggregator — primary source role satisfied) |
| Source Language | English |
| Source Independence | INDEPENDENT |
| Status | ACCESSED |
| Origin | 여수 (Yeosu city — generic geographic point; approximately city center to 엑스포역 area) |
| Destination | 향일암 (Hyangiram Hermitage) |
| Mode | CAR / TAXI |
| Time Value | ~36 min |
| Time Evidence Type | MAP_ROUTE_ESTIMATE (aggregator route calculation) |
| Route/Segment | 여수 → 돌산대교 → 돌산도 → 향일암로 → 향일암 주차장 |
| Distance | 32.6 km |
| Transfer | None |
| Last-mile | Parking area → hermitage entrance: NOT included (HY-001/HY-003 scope; 15-30 min walk/climb) |
| Conditions/Assumptions | Normal traffic; no holiday/peak congestion; assumes generic Yeosu starting point |
| Access/Retrieval Date | 2026-09-28 |
| Stability | CONTEXTUAL — base route geography STABLE; duration adds traffic variability (VOLATILE for peak/holiday conditions) |
| Confidence | MEDIUM — aggregator estimate; no direct map tool query or verified navigation conditions |
| Limitations | "Yeosu" origin is generic city point — ±5 min variation depending on actual start location (엑스포역 vs 이순신광장 vs 오동도). Does NOT include: parking search time; walk from parking to hermitage entrance; holiday/peak traffic (may add 15-30+ min). Taxi cost: ₩40,000-48,000 estimate. |
| ER Mapping | HY-007 — MAP_ROUTE primary source role fulfilled |
| Notes | CAR and TAXI produce identical time estimate (36 min) — same road route, different operator. Taxi has higher cost but no parking burden. Car adds parking search friction (other ER scope). |

---

### EI-HY-007-C — Official Bus Route Confirmation (yeosu.go.kr)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-007-C |
| ER | ER-HY-007 |
| Source Identity | yeosu.go.kr/tour/travel/10tour/hyangilam (Yeosu City official tourism page) |
| Source Role | OFFICIAL |
| Source Language | Korean |
| Source Independence | INDEPENDENT |
| Status | ACCESSED |
| Origin | 여수 (multiple departure points — terminal + 여수엑스포역) |
| Destination | 임포 (향일암 nearest stop) |
| Mode | PUBLIC_BUS |
| Time Value | Not explicitly stated (structural confirmation only) |
| Time Evidence Type | STRUCTURAL_FACT (route existence, departure points) |
| Route/Segment | Bus 111, 111-1 (여수엑스포역 + terminal → 임포); Bus 116 (terminal → 돌산 island circuit → 임포) |
| Distance | — |
| Transfer | 111번: direct; 116번: island circuit (돌산 circumference) |
| Last-mile | — (not stated on this page) |
| Conditions/Assumptions | As of yeosu.go.kr page content (accessed 2026-09-28) |
| Access/Retrieval Date | 2026-09-28 |
| Stability | SEMI_STABLE — route existence STABLE; timetable VOLATILE |
| Confidence | HIGH for route existence; LOW for specific times (not provided on this page) |
| Limitations | Page confirms routes exist but does not provide journey time. 111번: multiple daily from 엑스포역; 111-1: also serves Hyangiram; 116번: 3 daily trips, circuitous (돌산 일주 → ~1.5h). |
| ER Mapping | HY-007 — STRUCTURAL_FACT: public bus route structure to Hyangiram |
| Notes | Used as corroboration for route existence; combined with EI-HY-007-A for time evidence. |

---

### EI-HY-007-D — Last-Mile: 임포 버스 정류장 → 향일암 매표소 (~11분 도보)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-007-D |
| ER | ER-HY-007 |
| Source Identity | walkview.co.kr/7155 (travel blog with field observation on bus route usage) |
| Source Role | WORLD_EXPERIENCE |
| Source Language | Korean |
| Source Independence | INDEPENDENT |
| Status | ACCESSED |
| Origin | 임포한솔횟집 정류장 (Impo bus stop — nearest stop to Hyangiram) |
| Destination | 향일암 매표소 (Hyangiram ticket gate / entrance) |
| Mode | WALK |
| Time Value | ~11분 |
| Time Evidence Type | WORLD_EXPERIENCE_OBSERVATION (field-observed walk from bus stop) |
| Route/Segment | 임포 정류장 → 향일암 입구 도보 |
| Distance | — (not stated) |
| Transfer | None |
| Last-mile | This IS the last-mile |
| Conditions/Assumptions | Normal walking pace; no special conditions stated |
| Access/Retrieval Date | 2026-09-28 |
| Stability | STABLE (geographic relationship; walk distance does not change) |
| Confidence | MEDIUM — single source; no independent corroboration |
| Limitations | Single source. Actual walk may vary slightly by pace. Not confirmed by official source. Walk starts from bus stop, NOT from parking area (distinct from hermitage climb, which is HY-001 scope). |
| ER Mapping | HY-007 — last-mile transition burden for public bus users |
| Notes | This ~11 min walk is SEPARATE from the hermitage approach climb (HY-001: ~20 min of steep stairs). Combined for bus travelers: 11 min walk to gate + HY-001 ascent time. |

---

### EI-HY-007-E — 낭만버스1코스 전남해양수산과학관 → 향일암: 25분 (REUSED, PARTIALLY_REUSABLE)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-007-E |
| ER | ER-HY-007 |
| Source Identity | YEOSU_TRAVEL_TIME_MATRIX_V0_1.md (original: yeosu.go.kr 낭만버스1코스 R028 schedule, 2026-09-21) |
| Source Role | MAP_ROUTE / SCHEDULE (OFFICIAL schedule) |
| Source Language | Korean |
| Source Independence | OFFICIAL |
| Status | REUSED (from Travel Time Matrix) |
| Origin | 전남해양수산과학관 (stop 4 on 낭만버스1코스 route) |
| Destination | 향일암 (stop 5 on 낭만버스1코스 route) |
| Mode | TOUR_BUS (낭만버스1코스 — 향일암코스) |
| Time Value | 25 min |
| Time Evidence Type | ROUTE_SOURCE (explicitly stated in official schedule) |
| Route/Segment | 낭만버스1코스 leg: 전남해양수산과학관 → 향일암 |
| Distance | — |
| Transfer | None (within tour bus circuit) |
| Last-mile | N/A — tour bus delivers to 향일암 stop directly |
| Conditions/Assumptions | Regular tour operating day; standard route timing |
| Access/Retrieval Date | 2026-09-21 (original collection) |
| Stability | SEMI_STABLE (route structure STABLE; tour schedule VOLATILE) |
| Confidence | HIGH for route time; circuit structure confirmed from official source |
| Limitations | This is a TOUR_BUS leg — travelers cannot independently book this leg point-to-point. Full 낭만버스1코스 circuit from 여수엑스포역 to 향일암 takes: 10+10+20+25=65 min of legs ONLY, plus dwelling time at each stop → ~2h+ total. NOT usable as a quick transit option. Provides vehicle road-time reference for 전남해양수산과학관 → 향일암 segment (~25 min by vehicle on this route). |
| ER Mapping | HY-007 — PARTIALLY_REUSABLE as route-time reference for 전남해양수산과학관→향일암 segment; NOT as a standalone transit solution |
| Notes | Corroborated by Route Corpus R028 (line 93): "이동 25분" — consistent with matrix. |

---

## 11. Normalized Travel-Time Model

### Route 1: 여수엑스포역 → 향일암 (Public Bus 111번)

```
Origin: 여수엑스포역 (Yeosu Expo Station)
Destination: 향일암 매표소 (Hyangiram entrance gate)
Mode: PUBLIC_BUS (111번) + WALK
Route/Segment: 여수엑스포역 → [돌산대교 → 돌산도] → 임포 정류장 + 11분 도보
Time: ~1h11m–1h39m (1h-1h28m bus + 11min walk)
Time Evidence Type: SCHEDULE_DERIVED_TIME (rome2rio 1h28m) + WORLD_EXPERIENCE_OBSERVATION (commenter 1h범위) + WORLD_EXPERIENCE last-mile
Distance: ~35 km
Transfer: None (direct bus)
Last-mile: 임포 정류장 → 향일암 매표소: ~11분 도보 (EI-HY-007-D)
Stability: SEMI_STABLE (route structure stable; timetable / frequency volatile)
Confidence: MEDIUM
Reverification Trigger: Bus schedule change; service suspension
Known Limitation: Frequency 30-80분 배차 — tight itinerary planning difficult; 111번 departure times need real-time check; does NOT include hermitage ascent time (HY-001 scope)
Source: EI-HY-007-A (bus), EI-HY-007-C (route confirmation), EI-HY-007-D (last-mile)
```

### Route 2: 여수 시내 → 향일암 (Car or Taxi)

```
Origin: 여수 시내 (city center / 이순신광장 / 엑스포역 area — generic Yeosu)
Destination: 향일암 주차장 (Hyangiram parking area)
Mode: CAR or TAXI
Route/Segment: 여수 → 돌산대교(돌산로) → 돌산도 → 향일암로 60번지
Time: ~35–40 min (normal traffic) / add 15-30+ min for peak/holiday conditions
Time Evidence Type: MAP_ROUTE_ESTIMATE (rome2rio aggregator)
Distance: ~32.6 km
Transfer: None
Last-mile: Parking area → hermitage entrance → ascent: NOT included (HY-001 scope)
Stability: CONTEXTUAL (road geography STABLE; duration adds traffic variability VOLATILE for peak)
Confidence: MEDIUM
Reverification Trigger: "지금 출발하면?" / "오늘 얼마나 걸려?" → live traffic check; holiday/peak season announced
Known Limitation: No peak/holiday traffic data captured; parking search time NOT included; last-mile ascent NOT included; origin point variation ±5 min within Yeosu city
Source: EI-HY-007-B
```

### Route 3: 전남해양수산과학관 → 향일암 (낭만버스1코스 — CONTEXT reference)

```
Origin: 전남해양수산과학관
Destination: 향일암 (tour stop)
Mode: TOUR_BUS (낭만버스1코스)
Route/Segment: 낭만버스1코스 leg 4→5
Time: 25 min (tour bus leg only; full circuit from 엑스포역 = ~2h+)
Time Evidence Type: ROUTE_SOURCE (official schedule — EXPLICIT_SOURCE_TIME)
Distance: —
Transfer: None (within circuit)
Last-mile: N/A (tour bus direct to stop)
Stability: SEMI_STABLE (route stable; schedule volatile)
Confidence: HIGH for this leg
Reverification Trigger: 낭만버스 schedule/pricing change (BATCH_01 noted as CHANGED item)
Known Limitation: NOT point-to-point transit; TOUR format; cannot use as standalone transit; cumulative from 엑스포역 = 65+ min legs + dwelling
Source: EI-HY-007-E
```

---

## 12. Explicit vs Derived Time Classification Table

| Evidence Item | Time Value | Classification | Basis |
|---|---|---|---|
| EI-HY-007-A (rome2rio bus) | 1h28m | SCHEDULE_DERIVED_TIME | Route calculation from bus 111번 stops |
| EI-HY-007-A (WE commenter) | ~1h (내외) | WORLD_EXPERIENCE_OBSERVATION | Approximation from memory/experience |
| EI-HY-007-B (car/taxi) | ~36 min | MAP_ROUTE_ESTIMATE | rome2rio route aggregator calculation |
| EI-HY-007-D (last-mile walk) | ~11 min | WORLD_EXPERIENCE_OBSERVATION | Field-observed walk time (walkview) |
| EI-HY-007-E (낭만버스 leg) | 25 min | ROUTE_SOURCE (EXPLICIT_SOURCE_TIME) | Explicitly stated in official schedule |
| Route Corpus corroboration | 25 min | SCHEDULE_DERIVED (corpus) | Matches Matrix; corpus from R028 |

---

## 13. Starting-Point Coverage Table

| Starting Point | Car/Taxi | Public Bus | Notes |
|---|---|---|---|
| 여수엑스포역 | ~35-40 min (via Yeosu generic ±5 min) | ~1h-1h28m (bus) + 11min walk | Primary traveler arrival point; covered |
| 여수 이순신광장 / 진남관 area | ~30-35 min (closer to 돌산대교; estimated from Route 2 ±5 min) | ~1h-1h28m (similar; bus route passes through city center) | Inferred from geographic proximity; not independently measured |
| 오동도 / 자산 area | ~25-35 min (東 Yeosu → 돌산대교; slightly closer) | ~1h-1h28m (similar bus route) | Inferred; not independently measured |
| 전남해양수산과학관 | ~25 min (via 낭만버스 leg reference; approximate) | — (no direct bus; 낭만버스 tour only) | CONTEXT_ONLY for car; tour bus only for transit |

**Coverage assessment:** Key traveler starting points (엑스포역, city center area) are covered with sufficient range. Variation between starting points within Yeosu city is ±5-10 min by car — within the bounded range. All points share the same route structure via 돌산대교.

---

## 14. Mode Coverage Table

| Mode | Covered | Evidence | Confidence |
|---|---|---|---|
| CAR | YES | EI-HY-007-B (MAP_ROUTE_ESTIMATE, 36 min) | MEDIUM |
| TAXI | YES | EI-HY-007-B (same time as car; ₩40-48K) | MEDIUM |
| PUBLIC_BUS | YES | EI-HY-007-A + C + D | MEDIUM |
| TOUR_BUS | YES (context only) | EI-HY-007-E (낭만버스 leg) | HIGH for leg time |
| WALK | N/A | Not a viable mode for full journey | — |

---

## 15. Variability and Stability Table

| Factor | Stability Class | Notes |
|---|---|---|
| Road geography (여수→돌산대교→향일암) | STABLE | Physical route does not change |
| Car/taxi travel time (normal conditions) | CONTEXTUAL | ~35-40 min normal; +15-30+ min peak/holiday |
| Bus 111번 route structure | STABLE | Route identity and stops do not change frequently |
| Bus 111번 timetable / frequency | VOLATILE | Can change by season or policy; must verify before use |
| 낭만버스1코스 tour schedule | SEMI_STABLE | Tour schedule changes seasonally; route structure stable |
| Last-mile walk (임포→향일암) | STABLE | Geographic walk distance does not change |
| Peak/holiday traffic on 돌산대교 | VOLATILE | Significant variation; no data captured |

---

## 16. Live / Reverification Boundary

**Canonical live trigger (Matrix):** If road/transport disruption materially affects travel time.

**Additional triggers identified in this collection:**

| Trigger | Relevant Route | Action Required |
|---|---|---|
| "지금 출발하면?" / "오늘 얼마나 걸려?" | Car/taxi | Live traffic check (Kakao Map / Naver Map) |
| "오늘 버스 있어요?" | Bus 111번 | Real-time schedule / departure check |
| Holiday/peak season (summer, Hyangiram sunrise dates, New Year) | All | Add 15-30+ min buffer; advise early departure |
| Weather (typhoon, heavy rain) affecting road | All | Road condition check; potential disruption |
| 낭만버스 schedule change (BATCH_01: noted as CHANGED item) | Tour bus | Verify current tour schedule before recommending |
| 돌산대교 construction / temporary closure | All | Detour time significantly increases |

**Non-live, prepared knowledge boundary:** The fact that car takes ~35-40 min and bus takes ~1h-1h30m under normal conditions IS prepared knowledge. The exact current time at time of traveler query is LIVE.

---

## 17. Conflicts Table

| Conflict ID | Items | Classification | Resolution |
|---|---|---|---|
| CONFLICT-HY-007-01 | EI-HY-007-A: bus ~1h (WE commenter) vs rome2rio 1h28m | ESTIMATE_VARIATION | Both indicate ~1h-1.5h range. Commenter approximated; rome2rio calculated full route. NOT a FACT_CONFLICT. Bound as range: ~1h-1h28m bus transit + 11min walk. |

**No unresolved conflicts.**

---

## 18. Negative / Exception Knowledge

| Item | Claim | Source | Admissibility |
|---|---|---|---|
| NEG-HY-007-1 | 낭만버스1코스 is TOUR format — travelers cannot use it as point-to-point transit to Hyangiram. Full circuit from 엑스포역 to 향일암 = ~2h+ including stop dwelling. | EI-HY-007-E (ROUTE_SOURCE) | CONFIRMED |
| NEG-HY-007-2 | Bus travel time (1h-1h28m) does NOT include last-mile walk (11min). Total from 여수엑스포역 door to 향일암 매표소: ~1h11m–1h39m minimum. | EI-HY-007-A + EI-HY-007-D | CONFIRMED |
| NEG-HY-007-3 | Car/taxi ~36 min does NOT include: parking search time, walk from parking lot to hermitage entrance (~HY-001 scope: 15-30 min climb). | EI-HY-007-B | CONFIRMED |
| NEG-HY-007-4 | HY-006 visit duration (45-90 min) must NOT be combined with HY-007 travel time to issue feasibility judgment — that synthesis belongs to HY-008 scope. | Scope exclusion principle | CONFIRMED |
| NEG-HY-007-5 | Bus 111번 frequency (30-80분 배차) means the bus may not align with a traveler's desired departure time — waiting time can add 0-80 min to total journey planning time, not counted in transit time. | EI-HY-007-A | CONFIRMED |
| NEG-HY-007-6 | Peak/holiday traffic on the 돌산대교 corridor can significantly increase car/taxi time beyond the ~36 min baseline. No data captured; variation unquantified but potentially substantial (holiday weekends at Hyangiram are known high-crowd periods). | General knowledge / WE context | PLAUSIBLE (unquantified) |

---

## 19. FACT Items

- **F-1:** 향일암 주소: 전라남도 여수시 돌산읍 향일암로 60 (on Dolsan Island, 돌산도)
- **F-2:** Road distance from Yeosu city to Hyangiram: ~32.6 km (rome2rio, MAP_ROUTE_ESTIMATE)
- **F-3:** Public bus routes serving Hyangiram: 111번, 111-1번, 116번 (yeosu.go.kr OFFICIAL)
- **F-4:** 낭만버스1코스 전남해양수산과학관 → 향일암 stop-to-stop leg: 25 min (OFFICIAL schedule, EXPLICIT_SOURCE_TIME)
- **F-5:** 임포 정류장 → 향일암 매표소: ~11분 도보
- **F-6:** Car/taxi route passes via 돌산대교 (Dolsan Bridge) connecting mainland Yeosu to Dolsan Island

---

## 20. EXPERIENCE Items

- **EX-1:** Bus 111번 from 여수엑스포역 to Hyangiram: "1시간내외" (WE commenter, 82cook.com) — approximation, consistent with SCHEDULE_DERIVED ~1h28m range
- **EX-2:** 낭만버스1코스 approach: scenic route — "돌산대교 야경을 보며" (nighttime view comment in route descriptions). Route character includes coastal road and Dolsan Bridge scenic element.

---

## 21. JUDGMENT INGREDIENT Items

The following bounded facts are available for later H-3 feasibility synthesis (HY-008 scope). NO feasibility judgment is made here.

| Ingredient ID | Content | Mode | Range | Confidence |
|---|---|---|---|---|
| JI-HY-007-1 | 여수엑스포역 → 향일암 travel time by car/taxi | CAR / TAXI | ~35-40 min (normal) / +15-30 min peak | MEDIUM |
| JI-HY-007-2 | 여수 시내 → 향일암 travel time by public bus (to bus stop + walk) | BUS | ~1h11m–1h39m (door to entrance gate) | MEDIUM |
| JI-HY-007-3 | Return journey same range applies | CAR / BUS | Mirror of above | MEDIUM |
| JI-HY-007-4 | Bus departure planning buffer (frequency) | BUS | 0–80 min waiting at origin | CONFIRMED structural |

**FINAL ANSWER: PROHIBITED.** No "2 hours is/isn't enough" judgment made in this ER.

---

## 22. Explicit Exclusions Confirmed

| Exclusion | Status |
|---|---|
| HY-006 visit duration (45-90 min) | EXCLUDED — not recollected, not combined into feasibility judgment |
| HY-003 elder mobility content | EXCLUDED — no elder accounts collected |
| Hyangiram operating hours / admission | EXCLUDED — not recollected (BATCH_01 already covers this) |
| Parking inventory at Hyangiram | EXCLUDED — HY-001/other ER scope |
| 2-hour feasibility verdict (H-3 answer) | EXCLUDED — HY-008 synthesis scope |
| SOUL final polished response | PROHIBITED |
| Route Corpus used as time truth | EXCLUDED — used as CONTEXT_ONLY / corroboration |

---

## 23. Stop Condition Checklist — RELATIONSHIP_SUFFICIENT

Per canonical Collection Plan V0.2 definition:
> "Both endpoint/place foundations adequate; relationship/sequence/direction evidenced; transition burden represented; no material contradiction."

| # | Criterion | Result | Evidence |
|---|---|---|---|
| SC-1 | Both endpoint/place foundations adequate | PASS | 여수 key starting points (엑스포역, city center) identified; 향일암 (돌산읍 향일암로 60) confirmed |
| SC-2 | Relationship/sequence/direction evidenced | PASS | Car ~36 min (EI-B); Bus ~1h-1h28m (EI-A); Route via 돌산대교 confirmed |
| SC-3 | Transition burden represented | PASS | Last-mile: 임포 → 향일암 매표소 ~11분 도보 (EI-D); bus frequency 30-80분 배차 (wait burden) |
| SC-4 | No material contradiction | PASS | ESTIMATE_VARIATION on bus time documented and classified; no FACT_CONFLICT |
| SC-5 | Required starting points covered | PASS | 여수엑스포역 (primary arrival): covered; city center range ±5 min: covered |
| SC-6 | Required modes covered | PASS | Car, taxi, public bus all covered; tour bus leg as CONTEXT |
| SC-7 | Explicit vs derived estimates separated | PASS | Each item classified with Time Evidence Type |
| SC-8 | Existing evidence reused correctly | PASS | 낭만버스 leg: PARTIALLY_REUSABLE, labeled appropriately |
| SC-9 | Primary source role (MAP_ROUTE) satisfied | PASS | EI-HY-007-B: rome2rio MAP_ROUTE_ESTIMATE for car route |
| SC-10 | Variability bounded | PASS | Normal ~35-40 min car; bus ~1h-1h30m; peak/holiday variation noted (unquantified) |
| SC-11 | Live/reverification behavior defined | PASS | Triggers documented: "지금 출발하면?", holiday, schedule change, bridge disruption |
| SC-12 | No unresolved material conflict | PASS | CONFLICT-HY-007-01 (ESTIMATE_VARIATION) documented and resolved |
| SC-13 | Sufficient evidence for later time-feasibility judgment without making that judgment | PASS | JI-HY-007-1 through 4 provide bounded ingredients; no H-3 verdict issued |

**RELATIONSHIP_SUFFICIENT: ALL 13 ITEMS PASS**

**ER-HY-007 → VERIFIED_FOR_PREPARATION**

---

## 24. Final Status

| Field | Value |
|---|---|
| ER Status | VERIFIED_FOR_PREPARATION |
| Gap Transition | PARTIAL_GAP → CLOSED |
| Stop Condition | RELATIONSHIP_SUFFICIENT — PASS |
| Upgrade Conditions | None — fully verified |
| Blocking Items | None |

---

## 25. Remaining Uncertainty

| Uncertainty | Nature | Impact on HY-007 | Mitigation |
|---|---|---|---|
| Peak/holiday car travel time | Unquantified variation | Medium — affects H-3 feasibility range | Live traffic trigger defined |
| Bus 111번 current timetable | VOLATILE — may have changed | Medium — frequency/departure times | Live check trigger defined; route existence STABLE |
| Hyangiram parking lot → entrance walk | Separate from this ER (HY-001) | Low for HY-007; important for H-3 total time | HY-001 already VERIFIED |
| Exact starting point variance within Yeosu | ±5-10 min by car; similar by bus | Low | Bounded range acceptable per Confidence Requirement |
| rome2rio "Yeosu" origin specificity | Aggregator uses city centroid | Low | Within ±5 min; acceptable for bounded range |

---

## 26. Audit Checklist (SECTION 29 items)

| Item | Criterion | Result |
|---|---|---|
| A | Starting HEAD = 4067e23 | PASS — confirmed at start |
| B | Correct branch (staging/storybook-c7a) | PASS — confirmed at start |
| C | Latest Project State read first | PASS — read lines 0-150 |
| D | Matrix/Plan checked against Project State for HY-007 | PASS — 4 discrepancies documented in Section 4 |
| E | Exact HY-007 contract extracted from Matrix | PASS — lines 494-515 |
| F | Dependencies verified from Matrix (not inferred) | PASS — ER-HY-006 from Matrix; VERIFIED_FOR_PREPARATION confirmed |
| G | Existing evidence inventoried before research | PASS — Section 6 done before web collection |
| H | BATCH_01 reused rather than blindly recollected | PASS — BATCH_01 checked; HY-007 content = operating info, not travel time |
| I | Existing ~25min leg exact provenance checked | PASS — origin=전남해양수산과학관; destination=향일암 tour stop; ROUTE_SOURCE explicit; TOUR_BUS format noted |
| J | Origin explicitly attached to every time claim | PASS — each EI has explicit Origin field |
| K | Destination explicitly attached | PASS — each EI has explicit Destination field |
| L | Mode explicitly attached | PASS — each EI has Mode field |
| M | Explicit vs derived time separated | PASS — Section 12 classification table |
| N | Map estimate not treated as guaranteed time | PASS — EI-HY-007-B labeled MAP_ROUTE_ESTIMATE; conditional qualifications documented |
| O | Public transport structural/live values separated | PASS — route structure=STABLE; timetable=VOLATILE; Section 15 table |
| P | No parking collection | PASS — parking search time excluded; noted as other ER scope |
| Q | HY-006 duration not recollected | PASS — HY-006 contents not recollected; scope exclusion confirmed Section 22 |
| R | No 2-hour final feasibility verdict | PASS — Section 22 explicit exclusion; Section 21 JI items only |
| S | HY-003 untouched | PASS — no elder accounts searched; HY-003 gap not modified |
| T | No elder-evidence collection | PASS — no elder/mobility search conducted |
| U | Operating info scope preserved | PASS — hours/admission not recollected |
| V | Route Corpus not used as unsupported time truth | PASS — corpus used as CONTEXT_ONLY / corroboration only |
| W | Variability bounded | PASS — Section 15 variability table; triggers Section 16 |
| X | Reverification triggers bounded | PASS — Section 16 explicit trigger list |
| Y | Negative/exception knowledge captured | PASS — Section 18: 6 NEG items |
| Z | Conflicts classified | PASS — Section 17: CONFLICT-HY-007-01 as ESTIMATE_VARIATION |
| AA | Full provenance captured | PASS — each EI has all required provenance fields |
| AB | Stop Condition explicitly evaluated | PASS — Section 23: 13-item checklist, all PASS |
| AC | Only HY-007 Gap updated | PASS — Wave 0 HY-007 row only |
| AD | Project State updated after work | PASS — checkpoint block added; ONE NEXT ACTION updated |
| AE | Exactly one Next Action | PASS — ER-OD-006 |
| AF | Next Action NOT executed | PASS — STOP after commit/push |
| AG | No second ER launched | PASS — STOP instruction followed |
| AH | No Candidate | PASS |
| AI | No Architecture Decision | PASS |
| AJ | No migration/schema/runtime/prod change | PASS |
| AK | Pilot untouched | PASS |
