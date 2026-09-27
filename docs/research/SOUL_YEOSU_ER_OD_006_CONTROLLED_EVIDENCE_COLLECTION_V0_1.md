# ER-OD-006 Controlled Evidence Collection V0.1
## Odongdo Live / Volatility Boundary

**Collection Date:** 2026-09-28
**Wave:** 3
**Cycle:** 14
**ER Status:** VERIFIED_FOR_PREPARATION
**Stop Condition:** LIVE_BOUNDARY_SUFFICIENT
**Stop Condition Met:** YES — all LB-1 through LB-11 PASS

---

## 1. Canonical Contract

| Field | Value |
|---|---|
| ER ID | ER-OD-006 |
| Related Place(s) | 오동도 |
| Related Scenario(s) | O-1 (live requirement), O-3 (operating alignment) |
| Required Judgment | LIVE_VERIFY trigger classification |
| Knowledge Category | OPERATING_INFO / LIVE_VARIABLE |
| Evidence Needed | Evidence establishing whether operating hours are formally set, how volatile they are, and what seasonal variations are known — sufficient to classify as STABLE / SEMI_STABLE / VOLATILE for the live-trigger design |
| Why Needed | Without volatility classification, SOUL cannot correctly distinguish when to flag live verification vs. state as stable |
| Primary Source Role | OFFICIAL |
| Secondary Source Role | LOCAL_OPERATOR |
| Stability Class | VOLATILE (the ER's own classification requirement) |
| Live Trigger | Always — current operating status must be confirmed when material to judgment |
| Confidence Requirement | Official source; volatility class requires field corroboration |
| Negative/Exception Knowledge | YES — closed/restricted periods |
| Dependencies | None |
| Missing-Evidence Consequence | Must treat all operating status as VOLATILE and flag for live check |
| Behavior if Missing | LIVE_VERIFY |
| Collection Priority | P1 |

---

## 2. Stale-State Comparison

| Field | Project State | Matrix | Plan | Readiness Check | Verdict |
|---|---|---|---|---|---|
| Priority | P1 | P1 | P1 | P1 | ✓ CONSISTENT |
| Primary Source | OFFICIAL | OFFICIAL | OFFICIAL | OFFICIAL | ✓ CONSISTENT |
| Secondary Source | LOCAL_OPERATOR | LOCAL_OPERATOR | LOCAL_OPERATOR | LOCAL_OPERATOR | ✓ CONSISTENT |
| Stop Condition | LIVE_BOUNDARY_SUFFICIENT | LIVE_BOUNDARY_SUFFICIENT | LIVE_BOUNDARY_SUFFICIENT | LIVE_BOUNDARY_SUFFICIENT | ✓ CONSISTENT |
| Wave | 3 | — | Wave 3 (line 600) | Wave 3 | ✓ CONSISTENT |

**Wave 0 stale-state (CORRECTION):**
Wave 0 dependency tracking table (line 731) shows `| ER-OD-006 | NOT_STARTED | Awaits ER-OD-001 | P1; Wave 2 |`. The canonical Matrix (line 314) states `Relationship Dependency: None` and the Plan (line 600) confirms `Dependencies: None`. This is a stale administrative entry. No actual dependency exists. No action required beyond this correction note.

---

## 3. Dependency Verification

| Dependency | Required By | Status | Result |
|---|---|---|---|
| None | Matrix/Plan: no dependency | — | ✓ NOT_BLOCKED |

No blocking dependencies.

---

## 4. Starting Gap

Wave 0 line 556: `| ER-OD-006 | NONE | NOT_ADDRESSED |`
Wave 0 line 636: `| ER-OD-006 | P1 | FULL GAP | No Odongdo assets |`

**Starting gap: FULL_GAP** — no volatility classification, no live trigger definition, no verification source role mapping, no failure behavior, no fallback behavior established for OD-006.

---

## 5. Existing Evidence Reuse Assessment

### From ER-OD-001

| Item | Content | OD-006 Admissibility | Notes |
|---|---|---|---|
| EI-OD-001-A through D (island experience) | Camellia bloom, walking path, lighthouse, interior | CONTEXT_ONLY | Experience character, not operating hours or volatility structure |
| CONFLICT-OD-001-01 (bloom dates) | Jan–March OFFICIAL vs Oct–spring WE | CONTEXT_ONLY | Seasonal pattern informs CONTEXTUAL classification for bloom state |
| OD-001 scope exclusion note | "Operating hours, admission, parking (OD-003/OD-004 territory or BATCH files)" | CONTEXT_ONLY | Confirms OD-006 is the appropriate home for operating hours classification |

### From ER-OD-003

| Item | Evidence ID | Content | OD-006 Admissibility | Notes |
|---|---|---|---|---|
| Dongbaek Train hours (OFFICIAL) | EI-OD-003-B | 09:30–17:30 winter / 09:30–18:00 standard; heavy rain suspension | PARTIALLY_REUSABLE | Confirms SEMI_STABLE classification for train hours; already classified in OD-003 |
| Dongbaek Train hours (LOCAL_OP) | EI-OD-003-C | Winter until 17:00 (Nov–Feb); standard 09:30–18:00 | PARTIALLY_REUSABLE | Corroboration of seasonal split; lunch break 12:00–13:00 not in EI-OD-003-B |
| Vehicle restriction | EI-OD-003-A | No civilian vehicles on causeway | CONTEXT_ONLY | Already SEMI_STABLE in OD-003; no new classification needed |
| Walking fallback | OD-003 §3 | Walking always available (15 min) when train suspended | PARTIALLY_REUSABLE | Feeds FALLBACK knowledge for Dongbaek Train VOLATILE suspension |

**OD-003 live trigger design:** Already fully specified (A-J questions answered). OD-003's LIVE_TRIGGER_DESIGN_COMPLETE covers Dongbaek Train as access entity. OD-006 uses this as CONTEXT and extends to island-level operating hours.

### From ER-OD-004

| Item | Evidence ID | Content | OD-006 Admissibility | Notes |
|---|---|---|---|---|
| Parking hours | EI-OD-004-A | 08:00–20:00 (official operator) | NOT_ADMISSIBLE | Parking is OD-004 territory; excluded from OD-006 per canonical exclusion |
| Current vacancy | OD-004 | VOLATILE real-time | NOT_ADMISSIBLE | OD-004 territory |
| Peak congestion pattern | EI-OD-004-E | Camellia season = peak demand | CONTEXT_ONLY | Confirms CONTEXTUAL classification for seasonal congestion pattern |

**Gap conclusion after reuse:** Existing evidence covers Dongbaek Train hours (PARTIALLY_REUSABLE for confirming classification). Missing: formal island access hour classification, musical fountain operating pattern and volatility, lighthouse hours and volatility, closed/restricted period inventory, island-level live trigger design.

---

## 6. Frozen Live Boundary Gap (Before New Collection)

Missing after reuse assessment:
- [ ] Island access hours formal classification (24-hour? time-restricted?)
- [ ] Admission fee status (free? structured?)
- [ ] Musical Fountain operating season + daily hours + suspension conditions
- [ ] Lighthouse hours, weekly closure pattern, seasonal variation
- [ ] Formal seasonal closure inventory (are there any periods the island is closed?)
- [ ] Live trigger design per field (all fields above)
- [ ] Failure behavior definition per field
- [ ] Fallback behavior definition per field

---

## 7. Collection Method

**Method:** OFFICIAL_WEB_REVIEW per Plan (line 600)

**Sources consulted (2026-09-28):**
1. yeosu.go.kr — official 10 tour Odongdo page (Korean): `https://www.yeosu.go.kr/tour/travel/10tour/odongdo?print=true`
2. yeosu.go.kr — English island_beach page: `https://www.yeosu.go.kr/en/travel/island_beach?mode=view&idx=234`
3. visitkorea.or.kr — accessibility/열린관광 page: `https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=329d8e88-eadb-4cdd-9a4c-09ab70796b84`
4. yeosu.go.kr — facilities/Dongbaek Train page: `https://www.yeosu.go.kr/tour/travel/10tour/odongdo_open/facilities`
5. Web search synthesis: "오동도 운영시간 연중무휴 24시간 개방 무료입장 등대 휴관 계절 제한"

---

## 8. Evidence Items

### EI-OD-006-A — OFFICIAL: Island Access Structure (24-Hour Open, Free)

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-006-A |
| ER | ER-OD-006 |
| Source Identity | visitkorea.or.kr accessibility page (한국관광공사) |
| Source Role | OFFICIAL |
| Source Language | Korean |
| Source Independence | INDEPENDENT (KTO, separate from Yeosu City) |
| Status | ACCESSED (2026-09-28) |
| Raw Extracted Claim | "24시간 개방" (Open 24 hours). Lighthouse: until 18:00 (17:00 winter), closed Mondays. Admission: free. Train: 1,000 won standard. |
| Normalized Claim | Odongdo island access is 24-hour, year-round (연중무휴), free of charge. The island itself has no formal daily opening/closing time. Sub-facilities (lighthouse, train, fountain) have individual schedules. |
| Claim Type | STRUCTURAL_FACT (access policy) + POLICY_FACT (hours/admission) |
| Stability Implication | Island access = STABLE (24-hour policy does not change without formal municipal decision) |
| Confidence | HIGH (KTO official source; consistent with yeosu.go.kr content) |
| Limitations | KTO data may lag policy changes; last verified 2026-09-28 |
| ER Mapping | OD-006 — establishes island access as STABLE; Dongbaek Train as SEMI_STABLE |
| Notes | "연중무휴 24시간" is confirmed by multiple official sources. Lighthouse exception: weekly Monday closure is the only systematic island-level restriction. |

---

### EI-OD-006-B — OFFICIAL: Dongbaek Train Seasonal Schedule (Facilities Page)

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-006-B |
| ER | ER-OD-006 |
| Source Identity | Yeosu City Government — facilities/Dongbaek Train page (Korean) |
| Source Role | OFFICIAL |
| Source Language | Korean |
| Source Independence | PRIMARY OFFICIAL (municipal) |
| Status | ACCESSED (2026-09-28) |
| Raw Extracted Claim | Peak (March–October): first departure 09:30, last outbound 17:50, 16 round trips; Winter (November–February): first departure 09:30, last outbound 17:00, 14 round trips; Lunch break daily 12:00–13:00. |
| Normalized Claim | Dongbaek Train operates two seasonal schedules with shorter winter hours and a daily midday suspension. The seasonal split (March–October / November–February) is an annually recurring structural pattern. |
| Claim Type | POLICY_FACT (operating schedule) |
| Stability Implication | SEMI_STABLE — seasonal split structure is recurring; specific departure times are subject to annual revision |
| Confidence | HIGH (official municipal facilities page) |
| Limitations | Minor discrepancy with EI-OD-003-B (which cited 09:30–17:30 winter vs. 17:00 here) — see CONFLICT-OD-006-01 |
| ER Mapping | OD-006 — corroborates and extends OD-003 train classification |
| Notes | Lunch break 12:00–13:00 not mentioned in EI-OD-003-B; confirmed here. Reuse for OD-006 volatility classification; OD-003 remains authoritative for access structure. |

---

### EI-OD-006-C — OFFICIAL: Musical Fountain Operating Season and Conditions

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-006-C |
| ER | ER-OD-006 |
| Source Identity | Yeosu City Government — facilities page (Korean) |
| Source Role | OFFICIAL |
| Source Language | Korean |
| Source Independence | PRIMARY OFFICIAL (municipal) |
| Status | ACCESSED (2026-09-28) |
| Raw Extracted Claim | Musical fountain operates March–October only. Weekdays 11:00–20:00, Weekends 10:00–20:00. Suspends during rain or strong winds. |
| Normalized Claim | The musical fountain is a seasonal facility: operational March through October, closed November through February. Within the operating season, daily operation is subject to weather suspension (rain, strong wind). |
| Claim Type | POLICY_FACT (seasonal) + VOLATILITY_OBSERVATION (weather suspension) |
| Stability Implication | Operating season = SEMI_STABLE (March–October seasonal structure); daily operation within season = VOLATILE (weather-dependent) |
| Confidence | HIGH (official municipal page) |
| Limitations | Season end/start dates may shift by one month in any given year; current day operation always VOLATILE |
| ER Mapping | OD-006 — defines fountain operating boundary |
| Notes | The fountain suspension during rain is an explicit weather-dependency admission, confirming VOLATILE classification for same-day operation queries. |

---

### EI-OD-006-D — OFFICIAL: Lighthouse Access Pattern

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-006-D |
| ER | ER-OD-006 |
| Source Identity | visitkorea.or.kr accessibility page (한국관광공사) |
| Source Role | OFFICIAL |
| Source Language | Korean |
| Source Independence | INDEPENDENT (KTO) |
| Status | ACCESSED (2026-09-28) |
| Raw Extracted Claim | Lighthouse closes every Monday throughout the year. Daily hours until 18:00 standard; until 17:00 during winter months. |
| Normalized Claim | The Odongdo lighthouse has two recurring access restrictions: (1) weekly Monday closure year-round; (2) seasonal hour reduction (17:00 close in winter vs. 18:00 standard). These are structural policies, not random events. |
| Claim Type | POLICY_FACT (weekly + seasonal closure) |
| Stability Implication | Weekly Monday closure = SEMI_STABLE (policy; changes only with institutional decision); daily hours standard/winter split = SEMI_STABLE; current Monday = VOLATILE (requires date-awareness) |
| Confidence | HIGH (KTO official source, corroborated by web search synthesis) |
| Limitations | Exact winter months not specified (autumn transition unclear); lighthouse hours may shift with daylight saving or policy revision |
| ER Mapping | OD-006 — defines lighthouse volatility boundary |
| Notes | This is the only systematic island-level facility with a regular weekly closure day. The Monday closure is important: a Monday visitor cannot access the lighthouse regardless of other island hours. |

---

### EI-OD-006-E — OFFICIAL: No Seasonal Island Closure (Negative Evidence)

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-006-E |
| ER | ER-OD-006 |
| Source Identity | Multiple OFFICIAL sources (yeosu.go.kr + visitkorea) — converging absence |
| Source Role | OFFICIAL |
| Source Language | Korean + English |
| Source Independence | INDEPENDENT (dual sources) |
| Status | ACCESSED (2026-09-28) |
| Raw Extracted Claim | No seasonal closure mentioned for island access. "Open all year round" (English page). "연중무휴" (Korean accessibility page). Island access: 24-hour. |
| Normalized Claim | There are no formal seasonal closures to Odongdo island access itself. The island is accessible year-round on a 24-hour basis. Seasonal variation affects sub-facilities (fountain, train schedule) but not island entry. |
| Claim Type | NEGATIVE_CLAIM (no seasonal closure) |
| Stability Implication | STABLE (explicit policy from two independent official sources) |
| Confidence | HIGH (dual official corroboration, absence is deliberate) |
| Limitations | Extraordinary events (typhoon, emergency infrastructure repair) could close the causeway — these are VOLATILE and unscheduled |
| ER Mapping | OD-006 — confirms island access is STABLE; sub-facility seasonal variation is SEMI_STABLE |
| Notes | This negative evidence is critical: it means SOUL does not need to flag island access as requiring live verification for ordinary queries. Only sub-facility status requires verification when material. |

---

### NEG-OD-006-1: Designed Capacity ≠ Current Vacancy (Parking — OD-004 territory)
Parking hours and vacancy are OD-004 territory. OD-006 does not establish or reopen parking status. NEG: a query about current parking availability requires live check per OD-004's volatility classification — not derivable from OD-006.

### NEG-OD-006-2: Train Existence ≠ Current Train Operation
"동백열차 있어요?" can be answered from prepared structural knowledge (STABLE train existence). "지금 열차 있어요?" or "오늘 몇 시까지 해요?" requires current schedule verification.

### NEG-OD-006-3: Operating Season ≠ Today's Operating Status
Musical fountain operating season (March–October) is SEMI_STABLE, but whether the fountain is running today is VOLATILE (weather-dependent). Do not assert "지금 분수 공연 중" without live verification.

### NEG-OD-006-4: Bloom Season ≠ Current Bloom State
Camellia peak season (January–March) is a CONTEXTUAL recurring pattern. Whether camellia is blooming today requires date + current year condition verification. Do not assert "지금 동백꽃 피어있어요" from prepared knowledge alone.

### NEG-OD-006-5: Published Schedule ≠ Guaranteed Departure
Dongbaek Train schedule (09:30–17:50 peak, 09:30–17:00 winter) is SEMI_STABLE prepared knowledge. Specific departure times on any given day may vary with suspension, crowd, or maintenance.

### NEG-OD-006-6: Live Verification Failure Must Not Become a Guessed Answer
If SOUL cannot verify current sub-facility status, it must use fallback knowledge or ASK, not fabricate current state.

---

## 9. Knowledge Field Classification

| Knowledge Field | Stability | Prepared Knowledge Allowed? | Notes |
|---|---|---|---|
| Physical island/location structure | STABLE | YES — full description | Does not change without catastrophic event |
| Island access hours (24hr open, 연중무휴) | STABLE | YES — "24-hour open, year-round" | Formal municipal policy; changes only with official decision |
| Island admission fee (FREE) | STABLE | YES — "무료 입장" | Currently free; could change with policy decision (signal: announcement) |
| Walking route (causeway, 768m) | STABLE | YES — structural description | Already in OD-003; CONTEXT here |
| Vehicle restriction on causeway | STABLE | YES — structural description | Already in OD-003; CONTEXT here |
| Dongbaek Train existence | STABLE | YES — "Dongbaek Train exists as access option" | Already in OD-003 |
| Dongbaek Train fare structure | SEMI_STABLE | PARTIAL — state known range; recommend confirmation | Annual revision risk; current value: 1,000/500 won |
| Dongbaek Train seasonal schedule | SEMI_STABLE | PARTIAL — state seasonal split (peak/winter) as pattern | March–Oct vs Nov–Feb; annual schedule revision possible |
| Dongbaek Train lunch break | SEMI_STABLE | PARTIAL — "12:00–13:00 daily no service" | Structural pattern; could be revised |
| Dongbaek Train temporary suspension | VOLATILE | NO — cannot assert "running now" | Weather-dependent; heavy rain triggers suspension |
| Musical Fountain existence | STABLE | YES — "fountain installation exists" | Permanent structure |
| Musical Fountain operating season | SEMI_STABLE | PARTIAL — "March–October" as seasonal policy | Annual schedule; exact months may shift ±1 month |
| Musical Fountain daily operation | VOLATILE | NO — cannot assert "running today" | Rain/strong wind suspends it; current day unknown without check |
| Lighthouse existence | STABLE | YES — "lighthouse exists and is visitable" | Permanent structure |
| Lighthouse weekly closure (Monday) | SEMI_STABLE | PARTIAL — "closed Mondays year-round" | Policy; changes only with institutional decision |
| Lighthouse daily hours (18:00/17:00 winter) | SEMI_STABLE | PARTIAL — state seasonal range | Annual revision possible; exact winter transition month unclear |
| Seasonal bloom pattern (camellia) | CONTEXTUAL | YES — state as recurring pattern, not current condition | "Camellia peaks January–March; full bloom by mid-March" |
| Current bloom state today | VOLATILE | NO — cannot assert current condition | Requires date + year-specific verification |
| Extraordinary closure (typhoon/emergency) | VOLATILE | NO — cannot assert absence | Unpredictable; causeway may be closed without notice |
| Current parking vacancy | VOLATILE | NO — OD-004 territory | Excluded from OD-006 scope |

---

## 10. Live Boundary Table

| Field | Prepared OK? | Stability | Live Trigger | Verification Source | Answer w/o Live? | Assert without verify | Requires verify | Failure behavior | Fallback | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| Island access hours | YES | STABLE | "지금 오동도 열려 있어?" → STABLE (24hr) | — | YES | "24-hour open, year-round" | Nothing (stable) | — | Same | EI-OD-006-A,E |
| Island admission | YES | STABLE | — | — | YES | "무료 입장" | Nothing | — | Same | EI-OD-006-A |
| Train existence | YES | STABLE | — | — | YES | "Dongbaek Train exists" | Nothing | — | Same | EI-OD-003-B (REUSED) |
| Train fare | PARTIAL | SEMI_STABLE | "얼마야?" / EXACT_PRICE | OFFICIAL (yeosu.go.kr facility page) / LOCAL_OPERATOR (061-659-1821) | PARTIAL | State known range "1,000/500 won (known, verify current)" | Current confirmed value | QUALIFY | State range + recommend confirmation | EI-OD-006-B, OD-003-B (REUSED) |
| Train seasonal schedule | PARTIAL | SEMI_STABLE | "몇 시에 타?" / EXACT_TIME / seasonal query | OFFICIAL (yeosu.go.kr) | PARTIAL | State seasonal split as pattern | Confirmed current schedule | QUALIFY | State seasonal range + recommend confirmation | EI-OD-006-B |
| Train lunch break | PARTIAL | SEMI_STABLE | EXACT_TIME around midday | OFFICIAL | PARTIAL | "No service approximately 12:00–13:00 daily" | Exact current midday window | QUALIFY | State known pattern | EI-OD-006-B |
| Train suspension today | NO | VOLATILE | NOW / CURRENT_OPERATION / "지금 운행해?" | LOCAL_OPERATOR (061-659-1821) | NO | Cannot assert | Current operation status | USE_STABLE_FALLBACK | "If train suspended, walking (15 min) always available" | EI-OD-003-B,C (REUSED) |
| Fountain season | PARTIAL | SEMI_STABLE | seasonal / month query | OFFICIAL | PARTIAL | "March–October seasonal pattern" | Whether current month is in season | QUALIFY | State seasonal boundary | EI-OD-006-C |
| Fountain today | NO | VOLATILE | NOW / TODAY / WEATHER_DEPENDENT | OFFICIAL site or direct observation | NO | Cannot assert "running now" | Today's operation | QUALIFY + ASK | No reliable fallback; note weather dependency | EI-OD-006-C |
| Lighthouse (Mon closure) | PARTIAL | SEMI_STABLE | day-of-week aware query | — (date calculable) | PARTIAL | "Closed Mondays year-round" | Whether today is Monday | USE_STABLE_FALLBACK (date check) | "Monday = closed; other days generally open within hours" | EI-OD-006-D |
| Lighthouse hours | PARTIAL | SEMI_STABLE | "몇 시까지?" / EXACT_TIME | OFFICIAL | PARTIAL | "Until 18:00 (standard) / 17:00 (winter)" | Current confirmed hours | QUALIFY | State seasonal range | EI-OD-006-D |
| Camellia bloom pattern | YES | CONTEXTUAL | — | — | YES | "Camellia peaks January–March annually" | — | — | Same | EI-OD-001-A (CONTEXT) |
| Bloom today | NO | VOLATILE | SEASONAL_CURRENT_STATE / "지금 꽃 피어있어?" | OFFICIAL / WE current reports | NO | Cannot assert | Current bloom state | QUALIFY | "Peak season is Jan–March; current condition unverified" | EI-OD-006-E |
| Extraordinary closure | NO | VOLATILE | emergency / weather alert | OFFICIAL | NO | Cannot assert absence | Current closure status | ASK / QUALIFY | None reliable | EI-OD-006-E (negative) |

---

## 11. Live Trigger Design (Per Field Summary)

**STABLE fields — no live trigger needed for ordinary queries:**
- Island access hours, island admission, train existence, fountain existence, lighthouse existence, island access policy (24hr/free), causeway walkability

**SEMI_STABLE fields — trigger on user asking for exact/current values:**
- Train fare: trigger = `EXACT_PRICE` ("얼마야?", "요금이 얼마예요?")
- Train schedule: trigger = `EXACT_TIME` ("몇 시?" / seasonal split question)
- Train lunch break: trigger = `EXACT_TIME` around 12:00
- Fountain season: trigger = `SEASONAL_CURRENT_STATE` ("지금 분수 해요?") when month is ambiguous
- Lighthouse Monday: trigger = date awareness (`TODAY`) — if user asks on/about a Monday
- Lighthouse hours: trigger = `EXACT_TIME` ("몇 시까지?")

**VOLATILE fields — always trigger live verification when material:**
- Train suspension now: trigger = `NOW / CURRENT_OPERATION`
- Fountain today: trigger = `NOW / TODAY / WEATHER_DEPENDENT`
- Bloom today: trigger = `SEASONAL_CURRENT_STATE / NOW`
- Extraordinary closure: trigger = `NOW / weather alert context`
- Parking vacancy: trigger = `CURRENT_AVAILABILITY` (OD-004 territory)

---

## 12. Verification Source Roles (Per Field)

| Field | Preferred Verification Source | Specific Contact/URL |
|---|---|---|
| Train fare (current) | OFFICIAL | yeosu.go.kr/tour/travel/10tour/odongdo_open/facilities |
| Train schedule (current) | OFFICIAL | yeosu.go.kr/tour/travel/10tour/odongdo_open/facilities |
| Train suspension now | LOCAL_OPERATOR | 061-659-1821 (operator direct line, per OD-003) |
| Fountain today | OFFICIAL (website) or WORLD_EXPERIENCE (real-time visitor report) | yeosu.go.kr |
| Lighthouse status | OFFICIAL | yeosu.go.kr |
| Bloom today | OFFICIAL + WORLD_EXPERIENCE | yeosu.go.kr + visitor reports |
| Island extraordinary closure | OFFICIAL | yeosu.go.kr or local news |

**Note:** Architecture does NOT currently support real-time API calls. These source roles define knowledge requirements for preparation and for SOUL guidance language ("check the official site" / "call the operator"), not runtime tool calls.

---

## 13. Verification Failure Behavior

| Field | If Verification Succeeds | If Verification Fails |
|---|---|---|
| Train fare | Use confirmed current fare | QUALIFY: "Known fare: 1,000 won standard — recommend confirming before visit" |
| Train schedule | Use confirmed current schedule | QUALIFY: "Known pattern: peak 09:30–17:50 / winter 09:30–17:00 — recommend confirming" |
| Train suspension now | State "operating" or "suspended" | USE_STABLE_FALLBACK: "Walking (15 min) always available" |
| Fountain today | State operation status | QUALIFY: "Fountain operates March–October, weather permitting; cannot confirm today without check" |
| Lighthouse today | State open/closed | USE_STABLE_FALLBACK (date check): "Mondays = closed; other days open until 18:00 (17:00 winter)" |
| Bloom today | State current bloom | QUALIFY: "Camellia peaks January–March; current bloom state unconfirmed" |
| Extraordinary closure | Confirm open | QUALIFY: "No scheduled closure; extraordinary closures are unannounced" |

---

## 14. Fallback Knowledge

| Situation | Stable Fallback |
|---|---|
| Dongbaek Train suspended | Walking always available: 768m causeway, ~15 min, free, scenic coastal route |
| Train fare unknown | State known range (1,000/500 won) + recommend official confirmation |
| Fountain not running | Island interior experience (forest, rock formations, lighthouse, coastal views) still available |
| Lighthouse closed (Monday / after hours) | Exterior lighthouse viewing + island walk still available |
| Bloom not confirmed | Island has 3,000 camellia trees; peak season January–March; forest character year-round regardless |
| Extraordinary closure | Cannot offer island access; suggest checking yeosu.go.kr before departure |

---

## 15. Volatility Laundering Audit

| Prohibited Transformation | Audit Status |
|---|---|
| Current value → stable knowledge | PASS — no current values (train suspension, fountain running, bloom today) persisted as stable |
| Past value → current truth | PASS — OD-003 train hours used as SEMI_STABLE pattern, not confirmed current |
| Designed capacity → current vacancy | PASS — parking is OD-004 territory; excluded entirely |
| Service existence → service running now | PASS — "train exists" ≠ "train running now"; explicitly separated |
| Seasonal tendency → today's condition | PASS — bloom pattern is CONTEXTUAL; current bloom is VOLATILE |
| Published schedule → guaranteed departure | PASS — schedule classified as SEMI_STABLE with explicit verification trigger |

---

## 16. Conflict Register

### CONFLICT-OD-006-01 — Dongbaek Train Winter Last Departure

| Field | Value |
|---|---|
| Conflict ID | CONFLICT-OD-006-01 |
| Fields in conflict | Dongbaek Train winter operating hours (last departure) |
| Source A | EI-OD-003-B (yeosu.go.kr Dongbaek Train page): "17:30 winter" |
| Source B | EI-OD-006-B (yeosu.go.kr facilities page): "last outbound 17:00 (November–February)" |
| Source C | EI-OD-003-C (LOCAL_OPERATOR): "until 17:00 (November–February)" |
| Classification | SCHEDULE_VARIATION — two official sources differ by 30 min; local operator matches EI-OD-006-B |
| Resolution | 2-vs-1 majority supports 17:00 (facilities page + local operator). EI-OD-003-B may reflect an older schedule or different reference period. SOUL should state: "winter last departure approximately 17:00" and recommend confirmation. |
| OD-003 Impact | OD-003 is VERIFIED_FOR_PREPARATION — NOT REOPENED. The conflict is noted here; the discrepancy itself confirms SEMI_STABLE classification is correct (schedule can change). |

---

## 17. FACT / EXPERIENCE / LIVE RULE / JUDGMENT INGREDIENT

### FACT (supported structural/policy facts)
- F-1: Odongdo island access is 24-hour, year-round (연중무휴), free of admission (EI-OD-006-A,E)
- F-2: Dongbaek Train fare: 1,000 won standard / 500 won discounted (EI-OD-006-B + OD-003 REUSED)
- F-3: Dongbaek Train seasonal schedule: peak March–October 09:30–17:50; winter November–February 09:30–17:00; lunch break 12:00–13:00 daily (EI-OD-006-B)
- F-4: Musical Fountain: seasonal March–October; weather suspension condition (rain/strong wind) (EI-OD-006-C)
- F-5: Lighthouse: Monday closure year-round; daily until 18:00 (17:00 winter) (EI-OD-006-D)
- F-6: No formal seasonal island closure exists (EI-OD-006-E)

### EXPERIENCE (supported visitor pattern observations)
- EX-1: Camellia season (January–March) brings dramatically different visual character and higher visitor density (OD-001 CONTEXT; OD-004 CONTEXT)
- EX-2: Dongbaek Train may be skipped if timing is inconvenient; walking is always the fallback (OD-003 REUSED as CONTEXT)

### LIVE / VOLATILITY RULES
- LV-1: Current train suspension status = VOLATILE; verify with operator (061-659-1821) when "running now?" is material
- LV-2: Musical Fountain today = VOLATILE; cannot be asserted without current check
- LV-3: Current bloom state = VOLATILE; seasonal pattern is CONTEXTUAL but today's condition requires verification
- LV-4: Any extraordinary island closure = VOLATILE; check official channel before departure
- LV-5: Current train fare/schedule = SEMI_STABLE; state known range + recommend confirmation for exact values
- LV-6: Lighthouse today (Monday check) = SEMI_STABLE; date-aware reasoning enables partial answer ("closed if Monday")

### JUDGMENT INGREDIENT (for later scenario synthesis — not final SOUL answer)
- JI-OD-006-1: For O-1 (is Odongdo accessible now?): Island access = STABLE YES; sub-facilities require field-specific verification
- JI-OD-006-2: For O-3 (direction selection with timing): Dongbaek Train session schedule (09:30–17:50/17:00) is a time-feasibility input; fountain is bonus, not required for visit
- JI-OD-006-3: Monday visits: lighthouse access blocked; all other island access normal

### FINAL ANSWER
PROHIBITED in this artifact.

---

## 18. Negative / Exception Knowledge

- NEG-1: Island access 24-hour policy does NOT mean all facilities are available at all hours
- NEG-2: Train existence does NOT guarantee current operation (weather suspension risk)
- NEG-3: Seasonal attractiveness (camellia) does NOT establish current bloom condition
- NEG-4: Musical Fountain operating season (March–October) does NOT guarantee daily operation (weather)
- NEG-5: Published Dongbaek Train schedule does NOT guarantee exact departures (suspension, maintenance)
- NEG-6: No formal seasonal island closure does NOT mean extraordinary closure cannot occur (typhoon, emergency)
- NEG-7: Lighthouse "generally open" does NOT apply on Mondays (closed year-round)
- NEG-8: Live verification failure must not become a fabricated current-status answer

---

## 19. Explicit Exclusions Confirmed

| Exclusion | Status |
|---|---|
| Today's actual operating status for any sub-facility | EXCLUDED — not persisted as stable |
| Current Dongbaek Train departure | EXCLUDED — VOLATILE |
| Current parking vacancy | EXCLUDED — OD-004 territory |
| Current weather / bloom status | EXCLUDED — VOLATILE |
| Final child suitability / senior suitability | EXCLUDED — HY-003/other scope |
| Itinerary recommendation | EXCLUDED — PROHIBITED in this ER |
| Parking recommendation | EXCLUDED — OD-004 territory |
| Final SOUL answer | EXCLUDED — PROHIBITED |
| Runtime architecture / API implementation | EXCLUDED |
| place_knowledge schema changes | EXCLUDED |
| Production DB changes | EXCLUDED |
| OD-001 reopened | EXCLUDED |
| OD-003 reopened | EXCLUDED — CONTEXT ONLY; CONFLICT-OD-006-01 noted but OD-003 not modified |
| OD-004 reopened | EXCLUDED — parking is OD-004 territory |
| HY-003 / HY-007 / CC-003 | EXCLUDED |

---

## 20. Stop Condition Checklist

**LIVE_BOUNDARY_SUFFICIENT definition (Plan line 353):** "Phoenix knows what to verify live, when, and via which source; current value reserved for runtime"

| ID | Criterion | Result |
|---|---|---|
| LB-1 | Relevant Odongdo fields identified? | PASS — 15 fields inventoried (§9) |
| LB-2 | STABLE / SEMI_STABLE / VOLATILE / CONTEXTUAL separated? | PASS — all 15 fields explicitly classified (§9 table) |
| LB-3 | Prepared Knowledge boundary defined for each field? | PASS — §9 + §10 Live Boundary Table |
| LB-4 | Live triggers defined? | PASS — §11 per field with trigger types |
| LB-5 | Verification source roles defined? | PASS — §12 per field |
| LB-6 | Exact-current claims bounded? | PASS — no current values persisted as stable |
| LB-7 | Failure behavior defined? | PASS — §13 per field |
| LB-8 | Fallback behavior defined where available? | PASS — §14 per field |
| LB-9 | Negative knowledge captured? | PASS — §18, 8 NEG items |
| LB-10 | No current value laundered into stable truth? | PASS — §15 volatility laundering audit all PASS |
| LB-11 | No material unresolved boundary gap remains? | PASS — all fields from frozen gap (§6) are now classified |

**LIVE_BOUNDARY_SUFFICIENT: PASS → VERIFIED_FOR_PREPARATION**

---

## 21. Final Status

**ER-OD-006:** VERIFIED_FOR_PREPARATION
**Gap Transition:** FULL_GAP → CLOSED
**Stability Note:** The ER itself is VOLATILE (per Matrix classification) because operating status must always be confirmed live when material. The artifact classifies which sub-fields are STABLE, SEMI_STABLE, VOLATILE, or CONTEXTUAL to support correct prepared-vs-live boundary design.

---

## 22. Remaining Uncertainty

- Exact winter/summer transition dates for Dongbaek Train and lighthouse (month of changeover not precisely specified; November–February boundary assumed)
- CONFLICT-OD-006-01: Dongbaek Train winter last departure 17:00 vs 17:30 (2 vs 1; resolved in favor of 17:00 but confirm before use in time-critical judgment)
- Musical Fountain exact season boundary (March–October; actual start/end may vary ±2 weeks by annual decision)
- Whether the KTO "service runs once hourly" description of the train is a current or stale characterization (EI-OD-006-B says 16 round trips per day, implying more frequent service)

---

## 23. Audit Checklist (Section 29 A–AM)

| Item | Status |
|---|---|
| A. Starting HEAD = 898a6b0? | PASS |
| B. Correct branch (staging/storybook-c7a)? | PASS |
| C. Project State read first? | PASS |
| D. Matrix/Plan canonical contract checked? | PASS |
| E. Exact OD-006 contract extracted? | PASS |
| F. Dependencies verified from Matrix? | PASS — None |
| G. Existing evidence reused before research? | PASS — OD-001/003/004 assessed first |
| H. Gap frozen before collection? | PASS — §6 before §7 |
| I. OFFICIAL primary respected? | PASS — EI-OD-006-A through E all OFFICIAL |
| J. LOCAL_OPERATOR secondary respected? | PASS — OD-003's LOCAL_OPERATOR (EI-OD-003-C) reused for train hours corroboration |
| K. No broad current-status research? | PASS — no today's status collected |
| L. STABLE vs SEMI_STABLE vs VOLATILE separated? | PASS — §9 table |
| M. CONTEXTUAL vs VOLATILE separated? | PASS — bloom pattern CONTEXTUAL; bloom today VOLATILE |
| N. Current value not laundered into stable truth? | PASS — §15 audit |
| O. Capacity not treated as vacancy? | PASS — parking excluded |
| P. Service existence not treated as current operation? | PASS — train existence ≠ running now |
| Q. Seasonal tendency not treated as current condition? | PASS — bloom pattern vs bloom today separated |
| R. Live triggers explicitly defined? | PASS — §11 |
| S. Verification source roles defined? | PASS — §12 |
| T. Verification failure behavior defined? | PASS — §13 |
| U. Fallback knowledge bounded? | PASS — §14 |
| V. No invented live integration? | PASS — source roles only; no API calls claimed |
| W. OD-003 not recollected? | PASS — REUSED only; not reopened |
| X. OD-004 not recollected? | PASS — EXCLUDED; parking is OD-004 territory |
| Y. HY-003 untouched? | PASS |
| Z. HY-007 untouched? | PASS |
| AA. No final recommendation? | PASS |
| AB. No final SOUL answer? | PASS |
| AC. Full provenance captured? | PASS — all EI items include full field tables |
| AD. Stop Condition explicitly evaluated? | PASS — §20 checklist |
| AE. Only OD-006 Gap updated? | PASS — see §26 |
| AF. Project State updated after work? | PASS — see §27 |
| AG. Exactly one Next Action? | PASS — CC-005 |
| AH. Next Action NOT executed? | PASS — STOP |
| AI. No second ER launched? | PASS |
| AJ. No Candidate? | PASS |
| AK. No Architecture Decision? | PASS |
| AL. No migration/schema/runtime/prod change? | PASS |
| AM. Pilot untouched? | PASS |
