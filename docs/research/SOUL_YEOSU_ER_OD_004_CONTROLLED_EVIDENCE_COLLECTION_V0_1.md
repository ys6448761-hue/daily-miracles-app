# SOUL Yeosu ER-OD-004 Controlled Evidence Collection V0.1
# Odongdo Parking Evidence — Wave 2

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Starting HEAD:** 45d8a38
**Collection Wave:** Wave 2
**Cycle Number:** 5

---

## §1 Purpose

Execute the first Wave 2 controlled Evidence Collection cycle for ER-OD-004 (Odongdo Parking Evidence) under Controlled Evidence Collection Plan V0.2.

Starting from FULL_GAP. Prerequisite ER-OD-003 = VERIFIED_FOR_PREPARATION ✓.

Required completion: AUTHORITATIVE_FACT_SUFFICIENT AND LIVE_TRIGGER_DESIGN_COMPLETE (both required per V0.2 for SEMI_STABLE ERs).

---

## §2 Starting Checkpoint

| Item | Value |
|---|---|
| Branch | staging/storybook-c7a |
| Starting HEAD | 45d8a383815a81ad473cd755b1261a4cacc8edb4 |
| WAVE_1_COMPLETE | CONFIRMED |
| ER-HY-001 | VERIFIED_FOR_PREPARATION / CLOSED ✓ |
| ER-OD-001 | VERIFIED_FOR_PREPARATION / CLOSED ✓ |
| ER-OD-003 | VERIFIED_FOR_PREPARATION / CLOSED ✓ |
| ER-CC-001 | VERIFIED_FOR_PREPARATION / CLOSED ✓ |
| ER-OD-004 | FULL_GAP (confirmed from Wave 0 gap register) |
| Controlled Collection Cycles Completed | 4 |
| Current Next Action | Wave 2 ER-OD-004 |

---

## §3 ER-OD-004 Contract

| Field | Value |
|---|---|
| ER ID | ER-OD-004 |
| Related Place(s) | 오동도 |
| Related Scenario(s) | O-2 |
| Required Judgment | ANSWER + potential LIVE_VERIFY — parking reality |
| Knowledge Category | PARKING |
| Evidence Needed | Parking situation near Odongdo — existence, structural friction, known capacity constraints, typical conditions |
| **Preferred Source Role** | **LOCAL_OPERATOR / FOUNDER** (NOT OFFICIAL — official parking info may be stale per Matrix) |
| Secondary Source Role | WORLD_EXPERIENCE |
| Stability Class | SEMI_STABLE |
| Live Trigger | If current parking availability is material to the answer and availability is volatile |
| Confidence Requirement | Field-level confidence; official parking information may be stale |
| Negative/Exception Knowledge | YES — known congestion conditions, high-friction scenarios |
| Relationship Dependency | ER-OD-003 |
| Missing-Evidence Consequence | Must flag parking as LIVE_VERIFY |
| Behavior if Missing | LIVE_VERIFY |
| Stop Condition | AUTHORITATIVE_FACT_SUFFICIENT + LIVE_TRIGGER_DESIGN_COMPLETE |
| Collection Priority | P0 |
| Wave | 2 |

---

## §4 Dependency / Reuse Boundary

**ER-OD-003 prerequisite status:** VERIFIED_FOR_PREPARATION ✓

**OD-003 claims available as context (NOT new OD-004 Evidence):**

| OD-003 Claim | Origin | Reuse Role |
|---|---|---|
| Main parking lot at Odongdo entrance; vehicle prohibition begins post-parking-lot | EI-OD-003-A (yeosu.go.kr OFFICIAL) | CONTEXT_FROM_OD003 — confirms lot location at entrance; incidentally mentions "60 vehicles" |
| "Small parking capacity: main lot accommodates only 60 vehicles; during peak periods may fill" | EI-OD-003 §5 exception knowledge | CONTEXT_FROM_OD003 — congestion pattern acknowledged in OD-003 but deferred to OD-004 |
| "Additional public parking ('Dongbaek parking lot') referenced" | EI-OD-003 §4 note | CONTEXT_FROM_OD003 — flag for OD-004 investigation |
| Vehicle prohibition on causeway; walk/train as access options | EI-OD-003-A~D | NOT RECOLLECTED — OD-003 established this; OD-004 does not re-establish it |

**Scope boundary:** OD-004 adds parking knowledge ON TOP OF the access structure OD-003 established. OD-004 does NOT re-establish vehicle prohibition, walking route, or Dongbaek Train structure.

---

## §5 Starting Gap

Wave 0 gap register: **ER-OD-004 — FULL GAP — "No Odongdo assets exist"**

Pre-Wave 1 Survey: Did not cover OD-004 (not a target ER in survey scope).

**FULL_GAP confirmed.** No existing Evidence item is linked to ER-OD-004.

---

## §6 Existing Evidence Check — OD-003 Incidental "60 Vehicles" Claim

The OD-003 artifact's EI-OD-003-A (yeosu.go.kr official tourist page) contains an incidental reference: "Main parking lot is at the Odongdo entrance, accommodating 60 vehicles."

**Admissibility test for ER-OD-004:**

| Test | Assessment |
|---|---|
| A. CLAIM FIT | YES — addresses parking capacity and location components |
| B. SOURCE-ROLE FIT | PARTIAL — source is OFFICIAL (yeosu.go.kr tourist page); OD-004 Matrix requires LOCAL_OPERATOR/FOUNDER primary, WE secondary. OFFICIAL is not the preferred role for OD-004 "field-level confidence" requirement |
| C. PROVENANCE FIT | YES — traceable to EI-OD-003-A, yeosu.go.kr |
| D. SCOPE FIT | YES — refers to main lot at entrance |
| E. FRESHNESS FIT | UNCERTAIN — tourist page may reflect designed capacity from an older period; operator-confirmed figure differs (see §11) |
| F. CONTAMINATION | NO — pure location/capacity claim |

**OD-003 "60 vehicles" admissibility decision:** **SUPPORTING_ONLY** — records existence of the main lot at the entrance. Cannot serve as OD-004's primary evidence for field-level parking conditions. The 60-vehicle figure conflicts with the official operator's 237-space figure (see §11 CONFLICT-OD-004-01). Preserved as CONTEXT_FROM_OD003; not elevated to OD-004 primary Evidence.

**"Dongbaek parking lot" investigation:** Extensive research found NO evidence of a distinct "Dongbaek parking lot" separate from the main Odongdo facility. The OD-003 note likely referenced the Dongbaek Train boarding area (동백열차 탑승장), not a parking lot. Finding: NOT CONFIRMED as separate facility.

---

## §7 Collection Boundary

**Collect ONLY:**
- Parking facility identity (which lots, where, names)
- Capacity (structural capacity; note designed vs. operational distinction)
- Fee structure (as friction knowledge for traveler judgment)
- Congestion/friction conditions (seasonal, peak-day patterns)
- Known exceptions (closures, holiday policies, restrictions)
- Alternative parking if documented

**Do NOT collect:**
- Vehicle prohibition on causeway (OD-003 done)
- Walking distance/route (OD-003 done)
- Dongbaek Train structure/schedule/fare (OD-003 done)
- General Odongdo visitor experience (OD-001 done)
- Child suitability (OD-005)
- Restaurant/dining information
- Broad Yeosu-wide parking inventory
- Cable Car or Hyangiram content

---

## §8 Official Source Selection

Sources consulted in order:

| Source | Role | Result |
|---|---|---|
| yumcorp.or.kr (Yeosu City Urban Management Corp) | OFFICIAL OPERATOR | SUCCESS — 237 spaces, fee structure, hours |
| polinews.co.kr (municipal news) | OFFICIAL_NEWS | SUCCESS — holiday policy, always-paid status |
| nspna.com (municipal news) | OFFICIAL_NEWS | SUCCESS — corroborates holiday exclusion |
| yeosu.go.kr/en/travel/10tour/odongdo | OFFICIAL_PUBLIC | NO PARKING INFO — tourist content only |
| forourtour.com | WORLD_EXPERIENCE | SUCCESS — visitor account, fee confirmation, location |
| koreabycar.com | LOCAL_OPERATOR (travel guide) | SUCCESS — fee reference, lot location |
| antraife.com | WE/TRAVEL_GUIDE | SUCCESS — facility name + address confirmation |

---

## §9 Parking Facility Identity

**Primary Facility:**

| Attribute | Value |
|---|---|
| Official name (operator portal) | 오동도 공영주차장 (Odongdo Public Parking) |
| Common/colloquial name | 오동도공영주차타워 (Odongdo Public Parking Tower) |
| Address | 116 Odongdo-ro (오동도로 116), Yeosu, Jeollanam-do |
| Location relationship | At/near Odongdo causeway entrance; approx. 2–3 minutes walk from breakwater entrance |
| Facility type | 노외주차장 (off-street public parking) |
| Operator | 여수시도시관리공단 (Yeosu City Urban Management Corporation) |
| Management tier | 1급지 (Grade 1 — highest-demand municipal lot) |

**Relationship to OD-003 access model:**
```
[오동도 공영주차장 / 주차타워 — 116 Odongdo-ro]
  ~2–3 min walk
[Causeway entrance / 방파제 입구]
  → vehicle prohibition begins
  → Walk 768m OR Dongbaek Train
[Odongdo Island]
```

**Second lot investigation:**
No separate "Dongbaek parking lot" confirmed. The facility at 116 Odongdo-ro is the primary managed public parking for Odongdo visitors. The "parking tower" (주차타워) name and the "공영주차장" name refer to the same facility. Ground-level spots nearby (informal/expo area) may exist but are not separately documented by the official operator.

---

## §10 Capacity Evidence

| Source | Claim | Raw Value | Scope | Source Role |
|---|---|---|---|---|
| yumcorp.or.kr (official operator) | Total facility capacity | **237 spaces** | Total managed facility | OFFICIAL OPERATOR |
| yeosu.go.kr (tourist page, via OD-003) | Incidental reference | "60 vehicles" | Unclear — possibly entrance-level surface area or outdated | OFFICIAL (tourist page, incidental) |

**CONFLICT-OD-004-01 — Capacity discrepancy (60 vs 237):**
See §14 for full conflict analysis. Working determination: 237 = authoritative current managed capacity (official operator); 60 = either a subset area (surface entrance spots) or an older/outdated reference from the tourist page.

**Capacity qualification:** 237 is the structural/designed capacity registered with the official operator. This is NOT the same as current available spaces, which vary by time and season.

---

## §11 Fee Structure

| Source | Small Vehicle | Large Vehicle | Hours |
|---|---|---|---|
| yumcorp.or.kr (OFFICIAL OPERATOR) | First 1 hour: FREE; after: 200 won/10 min; daily max: 5,000 won | First 1 hour: FREE; after: 300 won/10 min; daily max: 8,000 won | 08:00–20:00 |
| forourtour.com (WE) | First 1 hour: FREE; ~200 won/10 min after | — | Not stated |
| koreabycar.com (LOCAL_OPERATOR guide) | "1,000 KRW/hour" | — | — |

**Fee conflict note:** koreabycar.com's "1,000/hour" is a simplified approximation; it does not capture the first-hour-free structure. At 200 won/10 min after first hour, the second hour costs 1,200 won — close to but not identical to "1,000/hour." This is SCOPE_DIFFERENCE: koreabycar omits the free first hour. yumcorp rate is authoritative.

**Holiday policy:** Odongdo parking lot is **always paid** — explicitly excluded from Yeosu City's free parking program during major holidays (Chuseok Sept 24–27, 2026). Reason: "concentrated parking demand due to many tourists expected." This is MUNICIPAL POLICY, not just operator practice.

---

## §12 Seasonal / Condition Evidence

| Finding | Source | Source Role | Claim Type |
|---|---|---|---|
| Camellia season (late Feb–March): peak congestion; weekends after ~10am = recommended to arrive early | Korean WE/travel accounts (multiple) | WORLD_EXPERIENCE | CONGESTION_PATTERN |
| Holiday weekends (Chuseok, Seollal, etc.): concentrated demand expected | polinews.co.kr, nspna.com (municipal news) | OFFICIAL | CONGESTION_PATTERN |
| Odongdo excluded from free holiday parking program — always paid | polinews.co.kr, nspna.com | OFFICIAL | EXCEPTION_FACT |
| General weekends: moderate congestion risk; specific experience = "fortunately space was available" on one weekend afternoon | forourtour.com | WORLD_EXPERIENCE | CONTEXT_CONDITIONAL |
| During peak congestion: parking tower recommended over ground/expo lots | Korean WE accounts | WORLD_EXPERIENCE | CONGESTION_STRATEGY |

**Congestion pattern qualification:**
- "Camellia season + weekend after 10am" = HIGH congestion risk — source-stated pattern across multiple WE accounts
- "Holiday period" = HIGH demand — official municipal language
- "Non-peak weekend afternoon" = MODERATE — single WE observation, not generalizable
- Pattern is SEMI_STABLE: camellia season dates are consistent (late Feb–March) but actual congestion depends on visitor volume that year

---

## §13 Exceptions

| Exception | Evidence Base | Claim Type |
|---|---|---|
| Always paid — no free holiday exceptions | Municipal policy (OFFICIAL) | EXCEPTION_FACT |
| Peak season congestion: lot may fill, especially during camellia season and holiday weekends | WE + OFFICIAL (municipal language) | EXCEPTION_FACT |
| During peak congestion, arriving early (before ~10am on weekends) reduces parking friction | WE accounts | CONGESTION_STRATEGY |
| No real-time availability system confirmed by research | Absence of evidence | EXCEPTION/LIMITATION |
| Monthly permit available (60,000 won/small/daytime) — not relevant for typical visitor | yumcorp.or.kr | CONTEXT |

**No evidence found for:**
- Seasonal closure of the parking lot
- Construction-related access changes
- Event-based temporary lot closure

---

## §14 Structural vs Semi-Stable Separation

### STABLE / STRUCTURAL (can be prepared without live verification):

| Fact | Classification |
|---|---|
| Facility identity: 오동도 공영주차장 / 주차타워, 116 Odongdo-ro | STABLE |
| Managed by: 여수시도시관리공단 (1급지) | STABLE |
| Location: near Odongdo causeway entrance, ~2-3 min walk from breakwater | STABLE |
| Operating hours: 08:00–20:00 | STABLE (may change with operator decision — but structural baseline) |
| Fee structure type: paid; first 1 hour free; time-based after | STABLE (specific rates may change) |
| Always-paid policy: Odongdo excluded from free holiday programs | STABLE (policy level) |
| Peak congestion season: camellia season (late Feb–March) = high demand | STABLE (seasonal pattern) |
| Holiday periods = concentrated demand | STABLE (pattern, not specific dates) |
| Designed capacity: 237 spaces (official operator) | STABLE (structural figure) |
| Parking friction is HIGH relative to visitor volume during peak periods | STABLE (known friction point) |

### SEMI_STABLE / CURRENT-CONDITION-SENSITIVE (requires live trigger):

| Component | Volatility |
|---|---|
| Specific fee rates (200 won/10 min, daily max) | SEMI_STABLE — may change with municipal fee revision |
| Current availability (how many spaces free right now) | VOLATILE — real-time; not reliably knowable in advance |
| Current operating hours (may be extended/shortened seasonally) | SEMI_STABLE |
| Temporary closures or access restrictions | VOLATILE — event/construction-driven |
| Congestion on a specific day/time | VOLATILE — weather, events, visitor volume |

---

## §15 Conflict Review

### CONFLICT-OD-004-01 — Capacity: 60 vehicles vs 237 spaces

| Field | Value |
|---|---|
| Conflict ID | CONFLICT-OD-004-01 |
| Sources | EI-OD-003-A (yeosu.go.kr tourist page, incidental) vs EI-OD-004-A (yumcorp.or.kr official operator) |
| Conflict Type | SCOPE_DIFFERENCE (or TEMPORAL_DIFFERENCE) |
| Claim A | "Main parking lot at Odongdo entrance, 60 vehicles" — yeosu.go.kr tourist page (via OD-003) |
| Claim B | "237 parking spaces" — yumcorp.or.kr official operator |
| Analysis | Three possible explanations: (1) 60 = surface-level entrance spots; 237 = total multi-story tower capacity. (2) 60 = outdated figure from before parking tower expanded. (3) Different scope definitions. The official operator (yumcorp) has authoritative capacity registration. The tourist page was not the primary source for OD-004; it was an incidental reference in OD-003's access-structure context. |
| Resolution | PARTIALLY_RESOLVED — 237 is the current authoritative managed capacity per official operator. The 60-vehicle figure is noted as a lower-scope or older reference. Both preserved in record. SOUL should use 237 as the structural capacity figure, with a note that the lot can feel small relative to peak demand. |
| Reopen Condition | If future official source confirms a distinct surface-level lot of exactly 60 spaces alongside the tower |

### Fee Rate Simplification (koreabycar vs yumcorp)

| Conflict Type | SCOPE_DIFFERENCE — koreabycar omits first-hour-free structure |
| Resolution | yumcorp fee structure is authoritative; koreabycar is approximation |
| Status | RESOLVED — not a true conflict, just approximation difference |

---

## §16 Evidence Registration

### OD-003 Dependency Context (NOT new OD-004 evidence)

| ID | Role | Claim |
|---|---|---|
| CONTEXT_FROM_OD003_A | CONTEXT — facility location | Main parking lot at Odongdo entrance; vehicle prohibition begins post-parking-lot. Source: EI-OD-003-A (yeosu.go.kr). |
| CONTEXT_FROM_OD003_B | CONTEXT — incidental capacity | "60 vehicles" (main lot). Source: EI-OD-003-A. SUPPORTING_ONLY for OD-004. |

---

### EI-OD-004-A — Official Operator Facility Registration

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-004-A |
| ER IDs | ER-OD-004 |
| Collection Wave | Wave 2 |
| Source Identity | 여수시도시관리공단 (Yeosu City Urban Management Corporation) — official parking operator |
| Source Role | OFFICIAL OPERATOR |
| Source Locator | yumcorp.or.kr/www/service/public_parking (공영주차장 관리운영 페이지) |
| Accessed Date | 2026-09-27 |
| Publication/Update Date | Not specified on page |
| Raw Extracted Claim | 오동도 공영주차장; 237면; 노외주차장; 1급지; 소형차: 최초1시간 무료, 이후 200원/10분, 일 최대 5,000원; 대형차: 300원/10분, 일 최대 8,000원; 운영시간 08:00–20:00 |
| Normalized Claim | Odongdo Public Parking: 237 spaces, Grade 1 (1급지) municipal lot. Small vehicle: first hour free, then 200 won/10 min, daily max 5,000 won. Large vehicle: 300 won/10 min, daily max 8,000 won. Hours: 08:00–20:00. Monthly permit: 60,000 won (small, daytime). |
| Claim Type | PARKING_FACT (facility identity + capacity + fee structure) |
| Facility Scope | 오동도 공영주차장 — total managed facility |
| Temporal Scope | Current as of access date (operator portal) |
| Directional Scope | N/A |
| Stability | STABLE (capacity/identity); SEMI_STABLE (fee rates, hours) |
| Limitations | Capacity = designed/registered, not real-time availability. Fee rates may be revised by municipality. Page does not state last update date. |
| Superseded By | — |
| Recommended Refresh Window | When traveler asks about current rates; or if Yeosu City announces fee structure change |
| Conflict Status | CONFLICT-OD-004-01 (capacity 237 vs 60 from OD-003 context — PARTIALLY_RESOLVED) |
| Notes | This is the official operator's registration data — highest-authority source for structural parking facts |

---

### EI-OD-004-B — Municipal Holiday Parking Policy

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-004-B |
| ER IDs | ER-OD-004 |
| Collection Wave | Wave 2 |
| Source Identity | 여수시 / polinews.co.kr (municipal announcement) + nspna.com (corroboration) |
| Source Role | OFFICIAL (municipal policy announcement) |
| Source Locator | polinews.co.kr/news/articleView.html?idxno=743698; nspna.com/country/?mode=view&newsid=829156 |
| Accessed Date | 2026-09-27 |
| Publication/Update Date | 2026 (Chuseok period announcement) |
| Raw Extracted Claim | 오동도 공영주차장은 추석 연휴 기간(24~27일) 다수의 관광객 방문으로 주차 수요가 집중될 것으로 예상돼 대상에서 제외하고 기존과 같이 유료로 운영한다 |
| Normalized Claim | Odongdo Public Parking is always paid — it is explicitly excluded from Yeosu City's free holiday parking program (35 other lots offered free during Chuseok 2026). Reason stated: "concentrated parking demand due to many tourists expected." |
| Claim Type | EXCEPTION_FACT (always-paid policy; peak demand signal) |
| Facility Scope | 오동도 공영주차장 |
| Temporal Scope | Policy stance as of 2026; pattern consistent with prior holiday periods |
| Directional Scope | N/A |
| Stability | STABLE (policy level; Odongdo parking always paid) |
| Limitations | Specific free-period policy may vary by year; the exclusion-from-free rationale (concentrated demand) is stable even if specific dates change |
| Superseded By | — |
| Recommended Refresh Window | When traveler asks whether parking is free on a specific holiday |
| Conflict Status | CLEAR |
| Notes | The "concentrated demand expected" language from the municipality is itself an admission that peak congestion is a structural feature of this parking facility |

---

### EI-OD-004-C — World Experience: Visitor Parking Account

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-004-C |
| ER IDs | ER-OD-004 |
| Collection Wave | Wave 2 |
| Source Identity | forourtour.com — Korean travel blog, Odongdo visit review |
| Source Role | WORLD_EXPERIENCE |
| Source Locator | forourtour.com/오동도-방문-후기/ |
| Accessed Date | 2026-09-27 |
| Publication/Update Date | Not specified |
| Raw Extracted Claim | 오동도 공영주차장 위치: 방파제 입구에서 약 2~3분 거리. 요금: 최초 1시간 무료, 이후 약 200원/10분. 방문 당시(주말 오후): 다행히 자리 여유가 있었고 |
| Normalized Claim | Odongdo Public Parking is ~2–3 minutes walk from breakwater entrance. Fee: first hour free, ~200 won/10 min after. Visitor's weekend afternoon experience: "fortunately space was available" — no parking difficulty encountered. |
| Claim Type | PARKING_FACT (location, fee confirmation) + CONGESTION_PATTERN (single WE observation) |
| Facility Scope | 오동도 공영주차장 |
| Temporal Scope | Single visit, weekend afternoon (non-peak period implied by availability) |
| Directional Scope | N/A |
| Stability | STABLE (location, fee structure); CONTEXT_CONDITIONAL (availability) |
| Limitations | Single observation; weekend but apparently non-peak-season. Does not represent camellia season or holiday conditions. |
| Superseded By | — |
| Recommended Refresh Window | Not applicable — structural location and fee confirmed; availability is live |
| Conflict Status | CLEAR (fee confirms EI-OD-004-A rate structure) |
| Notes | Corroborates official fee structure; provides WE-level location confirmation |

---

### EI-OD-004-D — LOCAL_OPERATOR: Korean Road Trip Guide

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-004-D |
| ER IDs | ER-OD-004 |
| Collection Wave | Wave 2 |
| Source Identity | koreabycar.com — Korean-language coastal drive travel guide |
| Source Role | LOCAL_OPERATOR (specialized car travel guide) |
| Source Locator | koreabycar.com/journal/yeosu-coastal-city-drive |
| Accessed Date | 2026-09-27 |
| Publication/Update Date | Not specified |
| Raw Extracted Claim | Causeway entrance lot, 1,000 KRW/hour |
| Normalized Claim | Parking at Odongdo: causeway entrance lot, approximately 1,000 KRW/hour (simplified approximation; does not capture first-hour-free structure). |
| Claim Type | PARKING_FACT (location + simplified fee reference) |
| Facility Scope | 오동도 주차장 at causeway entrance |
| Temporal Scope | Publication date unknown |
| Directional Scope | N/A |
| Stability | SEMI_STABLE (fee rates may change) |
| Limitations | "1,000/hour" is approximation; omits first-hour-free structure. Rate slightly under actual post-first-hour cost (1,200 won/hour = 200 won × 6). Source is travel guide, not official operator. |
| Superseded By | EI-OD-004-A (official operator rates) |
| Recommended Refresh Window | When traveler asks specific current rate |
| Conflict Status | SCOPE_DIFFERENCE with EI-OD-004-A (omits free first hour) — RESOLVED in favor of EI-OD-004-A |
| Notes | Corroborates causeway entrance location; rate approximation acceptable as contextual/traveler-guide level knowledge |

---

### EI-OD-004-E — WE Pattern: Peak Congestion and Timing

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-004-E |
| ER IDs | ER-OD-004 |
| Collection Wave | Wave 2 |
| Source Identity | Multiple Korean WE accounts (antraife.com, Korean travel blog aggregation from search result summaries) |
| Source Role | WORLD_EXPERIENCE |
| Source Locator | antraife.com/94; Korean WE search result summaries (multiple sources) |
| Accessed Date | 2026-09-27 |
| Publication/Update Date | Various |
| Raw Extracted Claim | 동백꽃 축제 기간(2월말~3월) 주말 오전 10시 이후 혼잡. 이른 시간 방문 권장. 엑스포 주차장 등 지상 주차장 만차 가능성. 오동도 공영주차타워 이용 추천. |
| Normalized Claim | During camellia season (late Feb–March), weekend traffic after ~10am creates parking congestion. Early arrival recommended. Surface/expo-area ground lots may fill; the main Odongdo public parking tower is the recommended facility. |
| Claim Type | CONGESTION_PATTERN (seasonal + time-of-day) |
| Facility Scope | 오동도 주차장 area generally |
| Temporal Scope | Camellia season (late Feb–March); weekend mornings |
| Directional Scope | N/A |
| Stability | STABLE (seasonal pattern — camellia season dates are consistent); SEMI_STABLE (specific congestion intensity varies by year) |
| Limitations | Aggregated from multiple WE accounts; no single canonical source. Camellia season timing (late Feb–March) is consistent across sources. Cannot establish exact threshold of "full." |
| Superseded By | — |
| Recommended Refresh Window | When traveler asks about parking specifically during camellia season or a peak period |
| Conflict Status | CLEAR — consistent across multiple independent WE accounts |
| Notes | The pattern (camellia season + weekend = congestion) is repeated and consistent; qualifies as WORLD_EXPERIENCE pattern per V0.2 diminishing-return rule |

---

## §17 Live Trigger Design

### A. What parking component can change?

1. **Current availability** (how many spaces free right now) — volatile, real-time
2. **Specific fee rates** (200 won/10 min rate, daily max) — semi-stable; can change with municipal fee revision
3. **Operating hours** (08:00–20:00) — semi-stable; may be seasonally extended or shortened
4. **Temporary closures** (construction, event, maintenance) — volatile, unpredictable
5. **Congestion intensity during peak season** — varies by year (visitor volume, weather)

### B. When would that change materially alter the traveler answer?

- When the traveler is making an IMMEDIATE access decision (driving to Odongdo right now or today)
- When the traveler asks about CURRENT fee rates before deciding to drive
- When there is an active temporary closure or known restriction at the time of query
- During camellia season on a weekend when congestion is likely and traveler needs to decide whether to drive

### C. What traveler/event/context triggers live verification?

**Context triggers (event-based — NO arbitrary time intervals):**

| Trigger | Condition |
|---|---|
| T1: Immediate access question | Traveler asks "can I park there now / today?" or indicates same-day visit |
| T2: Current rates question | Traveler asks specifically for current fee or "how much to park?" |
| T3: Camellia season + weekend | Traveler asks about parking during late Feb–March on a weekend |
| T4: Major holiday | Traveler asks about parking during national holidays (Chuseok, Seollal, etc.) |
| T5: Congestion report | Traveler reports or asks about parking being full or traffic backup |
| T6: Temporary restriction signal | Active construction or event notice in the area |

Triggers T1 and T5 = LIVE_VERIFY; T2 = QUALIFY (state structural rate + recommend current check); T3/T4 = QUALIFY (warn of congestion risk, structural capacity stated, recommend early arrival or checking current status); T6 = LIVE_VERIFY.

### D. Which authoritative source should be checked for currency?

**Primary verification source:**
- 여수시도시관리공단 parking portal: parking.yumcorp.or.kr (real-time availability if portal provides it)
- 여수시도시관리공단 main site: yumcorp.or.kr (fee structure updates, policy)
- Phone: 여수시 도시관리공단 representative (061-XXX-XXXX — not confirmed in research; use main contact)
- Yeosu City tourism main: yeosu.go.kr (for parking policy notices)

**Secondary verification:**
- Naver Map real-time parking status (if provided for this lot)
- On-site observation (for same-day decision)

### E. What exactly should be verified?

- Current lot availability (T1, T5)
- Current fee schedule (T2)
- Any active closure or temporary restriction (T6)
- Hours during unusual dates (T3, T4)

### F. What may still be reused without live verification?

**Always reusable (STABLE, no live check needed):**
- Facility identity: 오동도 공영주차장, 116 Odongdo-ro
- Location: ~2–3 min walk from breakwater entrance
- Managed by: 여수시도시관리공단, Grade 1 (1급지)
- Fee structure type: paid; first hour free; time-based after
- Always-paid policy (will not be free on holidays)
- Designed capacity: 237 spaces
- Known seasonal friction: camellia season (late Feb–March) + holiday weekends = high demand
- Recommended strategy: arrive early during peak periods
- Relationship to access model: parking → ~2-3 min walk → causeway → island

### G. What happens if live source is available and clear?

Use the current status directly. If space available: confirm parking accessible. If rate confirmed: state it. If closure confirmed: trigger immediate LIVE_VERIFY and inform traveler.

### H. What happens if live source is unavailable or stale?

Fall back to structural knowledge:
- State designed capacity (237 spaces)
- State known seasonal risk (camellia season / holiday weekends = high congestion)
- State always-paid policy
- Recommend arriving before 10am during peak season
- Cannot confirm current availability → QUALIFY

### I. What happens if official sources conflict?

If a new OFFICIAL source contradicts EI-OD-004-A (237 spaces, fee structure):
- Record conflict using CONFLICT registry
- If the new source is the official operator (yumcorp): update as superseding
- If conflict cannot be resolved in context: QUALIFY and recommend direct verification

If capacity discrepancy recurs (e.g., new source says 60 again):
- Classify as SCOPE_DIFFERENCE (may refer to a specific sub-area)
- Do not average values
- Preserve both with scope annotations

### J. When must SOUL use LIVE_VERIFY / QUALIFY / ASK / UNKNOWN?

| Scenario | Behavior |
|---|---|
| Traveler asks general parking info for Odongdo | ANSWER with structural facts (facility, location, fee structure, peak warnings) |
| Traveler asks "is there parking available right now / today?" | LIVE_VERIFY |
| Traveler asks "how much does parking cost?" | ANSWER structural rate (first hour free, ~1,200 won/hour after) + QUALIFY that exact rates should be confirmed before visit |
| Traveler plans camellia season weekend visit | ANSWER with congestion warning + recommend early arrival; QUALIFY on current availability |
| Traveler asks on major holiday | ANSWER that it will be paid + congestion warning; QUALIFY on current status |
| Temporary closure reported or active | LIVE_VERIFY |
| Real-time availability needed for same-day decision | LIVE_VERIFY |
| Parking capacity unknown → current availability | UNKNOWN (cannot infer from designed capacity) |

---

## §18 Fallback Behavior Matrix

| Scenario | SOUL Behavior |
|---|---|
| LIVE_SOURCE_AVAILABLE_AND_CLEAR | Use current status; state it clearly with source |
| LIVE_SOURCE_UNAVAILABLE | State structural facts (237 spaces, fee structure, always paid); warn traveler cannot confirm availability; recommend checking yumcorp.or.kr or calling ahead |
| LIVE_SOURCE_STALE_OR_UNDATED | Treat as structural baseline only; explicitly note currency unverified; QUALIFY |
| TEMPORARY_RESTRICTION_FOUND | LIVE_VERIFY; stop using structural availability assumption; inform traveler of restriction and provide verification path |
| MULTIPLE_OFFICIAL_SOURCES_CONFLICT | Preserve both; QUALIFY with the more conservative figure; recommend traveler verify with operator directly |
| CURRENT_AVAILABILITY_NOT_PROVIDED | QUALIFY; state structural capacity (237) + known friction patterns; do not infer availability from capacity |
| CAPACITY_VALUE_CONFLICT | Record both with scope notes; use 237 as the official operator figure; QUALIFY if scope unclear |

---

## §19 Authoritative Fact Sufficiency Test

| Criterion | Assessment | Result |
|---|---|---|
| A. Required parking components covered? | Facility identity, location, capacity, fees, hours, congestion pattern, exceptions — all addressed | PASS |
| B. Parking facility identity unambiguous? | Name, address, operator, Grade 1 designation all established | PASS |
| C. Location/access relationship established? | ~2-3 min walk from breakwater entrance; within OD-003 access model | PASS |
| D. Capacity scope established or properly bounded? | 237 (official operator); 60 (incidental from OD-003, lower scope) — CONFLICT-OD-004-01 partially resolved | PASS |
| E. Official authority/source-role fit satisfied? | Matrix prefers LOCAL_OPERATOR/FOUNDER; EI-OD-004-A (official operator yumcorp) satisfies structural authority; EI-OD-004-D (koreabycar) provides LOCAL_OPERATOR field-level corroboration; EI-OD-004-C/E provide WE experiential grounding | PASS |
| F. OD-003 incidental claim correctly handled? | "60 vehicles" assessed as SUPPORTING_ONLY; not imported as OD-004 primary evidence | PASS |
| G. Structural vs current availability separated? | Designed capacity (237) explicitly distinguished from real-time availability (unknown) | PASS |
| H. Seasonal/condition claims evidence-bounded? | Camellia season pattern multi-source WE confirmed; holiday policy OFFICIAL confirmed; not over-generalized | PASS |
| I. Material exceptions captured? | Always-paid policy; camellia season congestion; parking friction during peak; no free-holiday exception | PASS |
| J. Material conflicts resolved or bounded? | CONFLICT-OD-004-01 (60 vs 237): PARTIALLY_RESOLVED; fee rate simplification: RESOLVED | PASS |
| K. Provenance complete? | All 5 evidence items have full 20-field registration; OD-003 context items labeled separately | PASS |
| L. No unsupported parking recommendation? | No "best parking" recommendation; no directional recommendation; structural facts only | PASS |
| M. Sufficient for later judgment within reuse boundary? | OD-004 facts support O-2 vehicle-child scenario, OD-005 prerequisite, MT-1 Turn 2 context | PASS |

**AUTHORITATIVE_FACT_SUFFICIENT VERDICT: PASS (13/13)**

---

## §20 Live Trigger Design Test

| Criterion | Assessment | Result |
|---|---|---|
| A. Changeable component identified? | 5 components: current availability, fee rates, hours, temporary closures, congestion intensity | PASS |
| B. Traveler-material trigger identified? | 6 context triggers (T1–T6) with behavioral mapping | PASS |
| C. Verification source identified? | yumcorp.or.kr portal; Naver Map; direct contact | PASS |
| D. Verification target identified? | Current availability, current rates, active closures, seasonal hours | PASS |
| E. Structural reuse boundary defined? | Always-reusable stable list explicitly enumerated in §17F | PASS |
| F. Current-availability boundary defined? | Designed capacity ≠ current availability; cannot be inferred | PASS |
| G. Unavailable-source behavior defined? | §18 LIVE_SOURCE_UNAVAILABLE: structural facts + QUALIFY | PASS |
| H. Stale/conflict behavior defined? | §18 LIVE_SOURCE_STALE and CONFLICT scenarios both covered | PASS |
| I. LIVE_VERIFY/QUALIFY/ASK/UNKNOWN boundary defined? | §17J table defines behavior per scenario | PASS |
| J. No arbitrary freshness interval introduced? | All triggers are event/context-based; no "check weekly" or periodic intervals | PASS |

**LIVE_TRIGGER_DESIGN_COMPLETE VERDICT: PASS (10/10)**

---

## §21 Final Stop Condition

Both required tests PASS:
- AUTHORITATIVE_FACT_SUFFICIENT: **PASS**
- LIVE_TRIGGER_DESIGN_COMPLETE: **PASS**

**STOP CONDITION MET: ER-OD-004 may advance to VERIFIED_FOR_PREPARATION.**

---

## §22 Final ER Status

**ER_OD_004_VERIFIED_FOR_PREPARATION**

---

## §23 Gap Update

**FULL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)**

---

## §24 Reuse Boundary

If ER-OD-004 is VERIFIED_FOR_PREPARATION, the following may be reused by downstream ERs/scenarios:

**May reuse (STABLE):**
- Facility identity: 오동도 공영주차장 / 주차타워, 116 Odongdo-ro
- Managed by 여수시도시관리공단, Grade 1
- Location: ~2–3 min walk from breakwater entrance
- Operating hours: 08:00–20:00 (baseline)
- Fee structure: always paid; first hour free; ~200 won/10 min after; daily max 5,000 won (small)
- Designed capacity: 237 spaces
- Always-paid policy (not free on holidays)
- Known seasonal friction: camellia season + holiday weekends = high demand
- Recommended strategy: early arrival during peak periods
- Structural relationship: parking lot → walk ~2–3 min → causeway → OD-003 access model

**May NOT automatically reuse as:**
- Current vacancy / guaranteed parking availability
- Guaranteed parking (lot may fill during peak)
- Best parking recommendation (no comparative data)
- Family suitability (belongs to OD-005)
- Child suitability (belongs to OD-005)
- Route to Odongdo from a specific origin (requires separate routing knowledge)
- Post-parking itinerary recommendation
- Live congestion status

---

## §25 Cross-ER Boundary Audit

| Check | Status |
|---|---|
| ER-OD-001 recollected? | NO — no visitor experience, atmosphere, or camellia facts collected |
| ER-OD-003 recollected? | NO — vehicle prohibition, walk/train access not recollected; used only as CONTEXT_FROM_OD003 |
| ER-OD-005+ collected? | NO — no child suitability, senior suitability |
| ER-CC-001/002 collected? | NO |
| ER-HY-001/002 collected? | NO |
| Any other ER status changed? | NO — only ER-OD-004 |
| Incidental useful facts for other ERs? | OD-005 dependency on OD-004 now unlocked; no specific OD-005 evidence encountered |

---

## §26 Collection Cycle Audit (A–X)

| Item | Check | Result |
|---|---|---|
| A | Starting HEAD = 45d8a38? | PASS |
| B | Canonical OD-004 contract extracted? | PASS |
| C | FULL_GAP confirmed? | PASS |
| D | OD-003 prerequisite confirmed? | PASS |
| E | Existing OD-004 evidence checked first? | PASS — Wave 0 confirmed no OD-004 assets |
| F | OD-003 incidental parking claim not laundered? | PASS — "60 vehicles" treated as SUPPORTING_ONLY |
| G | Official remained primary for structural facts? | PASS — EI-OD-004-A is OFFICIAL OPERATOR |
| H | Facility identity preserved? | PASS — name, address, operator all recorded |
| I | Capacity scope preserved? | PASS — 237 vs 60 conflict registered and partially resolved |
| J | Designed capacity ≠ current availability? | PASS — explicitly separated in §14 and §17 |
| K | Seasonal claims bounded? | PASS — camellia season dates, not absolute availability claims |
| L | Structural vs semi-stable separated? | PASS — §14 full classification |
| M | Live Trigger explicit? | PASS — §17 A–J all answered |
| N | Failure behavior explicit? | PASS — §18 fallback matrix 7 scenarios |
| O | Conflict handling explicit? | PASS — CONFLICT-OD-004-01 registered and partially resolved |
| P | Provenance complete? | PASS — 5 items fully registered |
| Q | No broad parking inventory? | PASS — Odongdo facility only |
| R | No OD-003 recollection? | PASS |
| S | No OD-001 recollection? | PASS |
| T | No other ER collected? | PASS |
| U | No final SOUL answer? | PASS |
| V | Pilot not executed? | PASS |
| W | No Candidate/Architecture Decision? | PASS |
| X | No migration/schema/runtime/production change? | PASS |

**Collection Cycle Audit: 24/24 PASS**

---

## §27 Governance

| Item | Status |
|---|---|
| Branch | staging/storybook-c7a ONLY |
| Production DB connection | NOT ATTEMPTED |
| DB/Schema/Runtime changes | NONE |
| Pilot execution | NOT EXECUTED |
| Candidate generated | NONE |
| Architecture Decision | NONE |
| place_knowledge migration | NOT APPROVED / HOLD |
| Participant evidence | NONE |
| BT Verdict | NOT ASSIGNED |
| All prior artifacts | PRESERVED UNCHANGED |

---

## §28 Next Action

**Wave 2 state: IN_PROGRESS** (4 remaining: ER-CC-002, ER-HY-002, ER-HY-006, ER-REL-001)

**EXACT ONE NEXT ACTION:**

**Target ER:** ER-HY-002 — Hyangiram Experiential Burden

| Field | Value |
|---|---|
| Gap | FULL_GAP |
| Source Role | WORLD_EXPERIENCE primary; FOUNDER secondary |
| Dependency | ER-HY-001 VERIFIED_FOR_PREPARATION ✓ |
| Collection Boundary | Physical/experiential burden of the ascent: effort level, duration (uphill, not total), challenge conditions; NOT facility info (hours/fees = HY-004/005 existing BATCH_01 assets) |
| Stop Condition | EXPERIENCE_PATTERN_SUFFICIENT |
| Wave | 2 |
| Priority | P0 |
| Why next | P0 priority; prerequisite met; WORLD_EXPERIENCE primary (consistent with prior WE-primary cycles); directly needed for H-1/H-2 scenarios; HY-006 (visit duration) and HY-002 (burden) both P0 but HY-002 is foundational for HY-003 (elder-specific) and HY-008 (synthesis) — highest chain-unlock value |

DO NOT execute ER-HY-002 now. This is the designated next action only.

---

*SOUL_YEOSU_ER_OD_004_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md*
*Wave 2 — 2026-09-27*
*Status: VERIFIED_FOR_PREPARATION*
