# SOUL Yeosu ER-REL-001 Controlled Evidence Collection V0.1
# Yeosu Maritime Cable Car — Directional Outcome

**Collection Date:** 2026-09-27  
**Collector:** Claude Sonnet 4.6  
**Branch:** staging/storybook-c7a  
**Base Commit:** 1ca995b (Wave 2 ER-CC-002 VERIFIED)  
**Protocol Version:** Controlled Evidence Collection Plan V0.2  

---

## 1. Collection Metadata

| Field | Value |
|---|---|
| ER ID | ER-REL-001 |
| ER Name | Cable Car Directional Outcome |
| Wave | Wave 2 |
| Starting State | FULL_GAP |
| Protocol | Reuse-First (CONTEXT_ONLY items noted; no ER-level reuse) |
| Collection Lifecycle Entry | NOT_STARTED → VERIFIED_FOR_PREPARATION |
| Artifact Status | VERIFIED_FOR_PREPARATION |
| Commit | see §9 |

---

## 2. Contract Reference (from Matrix V0.1, lines 694–714)

| Field | Value |
|---|---|
| Related Scenarios | O-3, C-3 |
| Required Judgment | ANSWER + JUDGMENT — sequence/direction feasibility; direction selection |
| Knowledge Category | ROUTE_RELATIONSHIP / DIRECTIONAL_CHOICE |
| Evidence Needed | Which station a one-way trip from each departure point delivers the traveler to, and what geography/access that creates |
| Preferred Source Role | MAP_ROUTE |
| Secondary Source Role | FOUNDER / OFFICIAL |
| Stability Class | STABLE |
| Live Trigger | NONE for directional geography |
| Confidence Requirement | Route-confirmed |
| Negative/Exception Knowledge | YES — when one direction does NOT connect to intended destination efficiently |
| Relationship Dependency | ER-CC-001 ✓ (VERIFIED_FOR_PREPARATION) |
| Behavior if Missing | UNKNOWN |
| Stop Condition | AUTHORITATIVE_FACT_SUFFICIENT |

**Source Role Note:** Contract specifies MAP_ROUTE primary, FOUNDER/OFFICIAL secondary. Collection followed this hierarchy exactly — no canonical override required.

---

## 3. Starting Evidence State (FULL_GAP)

No ER-REL-001 evidence existed before this collection cycle. EI-REL-001-A in Wave 0 index (line 85) was a naming convention example only — an empty placeholder, not a registered evidence item.

**Gap scope at collection start:**
- Direction A (자산→돌산): which physical exit is the mainland side? Which is the island side?
- Direction B (돌산→자산): what geography/access does 자산 station deliver?
- 오동도 proximity: which exit station is closer/more connected to 오동도?
- Negative knowledge: which direction does NOT efficiently serve 오동도?

---

## 4. Existing CONTEXT_ONLY Items (not ER-level evidence)

| Item | Source | Role for REL-001 |
|---|---|---|
| EI-CC-001-A/B/C (station identity) | CC-001 VERIFIED | CONTEXT_ONLY — station naming prerequisite; does not address directional geography |
| EI-CC-RB02-A (one-way ticket option) | RB-02 PARTIALLY_VERIFIED | CONTEXT_ONLY — confirms one-way tickets exist; does not establish which direction = which geography |

---

## 5. New Evidence Items (EI-REL-001-A onward)

---

**EI-REL-001-A — 자산정류장 is MAINLAND station at 오동도 parking tower area**

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-001-A |
| ER IDs | ER-REL-001 |
| Collection Date | 2026-09-27 |
| Source Type | Government official tourism page |
| Source Locator | https://www.yeosu.go.kr/tour/travel/10tour/cablecar |
| Source Role | OFFICIAL |
| Raw Claim | 자산정류장 주소: 수정동 332-55(오동도 주차타워) |
| Normalized Claim | 자산정류장 (해야정류장) is located at Sujeong-dong 332-55, the Odongdo parking tower area — MAINLAND, Yeosu city side. |
| Stability | STABLE |
| Conflict Links | — |
| Corroboration Links | EI-REL-001-B, EI-REL-001-C |
| Admissibility Notes | OFFICIAL primary source. Address "오동도 주차타워" confirms mainland positioning near 오동도. Admissible as AUTHORITATIVE geographic fact. |

---

**EI-REL-001-B — 돌산정류장 is DOLSAN ISLAND station at 돌산공원**

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-001-B |
| ER IDs | ER-REL-001 |
| Collection Date | 2026-09-27 |
| Source Type | Government official tourism page |
| Source Locator | https://www.yeosu.go.kr/tour/travel/10tour/cablecar |
| Source Role | OFFICIAL |
| Raw Claim | 돌산정류장 주소: 돌산읍 돌산로 3600-1(돌산공원) |
| Normalized Claim | 돌산정류장 (놀아정류장) is located at Dolsan-eup Dolsan-ro 3600-1, Dolsan Park — DOLSAN ISLAND side. |
| Stability | STABLE |
| Conflict Links | — |
| Corroboration Links | EI-REL-001-A, EI-REL-001-E |
| Admissibility Notes | OFFICIAL primary source. "돌산읍" confirms Dolsan Island township. Admissible as AUTHORITATIVE geographic fact. Cross-confirmed by CC-001 (VERIFIED_FOR_PREPARATION) and CC-002 EI-CC-002-J. |

---

**EI-REL-001-C — 자산정류장 to 오동도 entry: ~5 min walk**

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-001-C |
| ER IDs | ER-REL-001 |
| Collection Date | 2026-09-27 |
| Source Type | Web travel resource |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-from-ktx-station/ (referenced in search result excerpt) |
| Source Role | MAP_ROUTE |
| Raw Claim | 오동도 입구 정류장에서 자산정류장까지는 도보 5분 거리입니다. 자산 정류장의 주소는 전라남도 여수시 오동도로 116(소노캄 호텔 맞은편). |
| Normalized Claim | From 오동도 entrance stop to 자산정류장: ~5 minutes walk. Station address: 오동도로 116 (across from Sonokami Hotel). |
| Stability | STABLE |
| Conflict Links | CONFLICT-REL-001-01 (address discrepancy 수정동 777-4 vs 오동도로 116 vs 수정동 332-55 — see §7) |
| Corroboration Links | EI-REL-001-A |
| Admissibility Notes | MAP_ROUTE role. Walk time is APPROXIMATE (Founder field confirmed ~5 min walk from Hamel, same 오동도 area, EI-CC-002-B). Core claim (자산 station is within short walking distance of 오동도 entrance) is AUTHORITATIVE. |

---

**EI-REL-001-D — Direction A (자산→돌산) confirmed by WE traveler: 오동도 → cable car → 돌산공원**

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-001-D |
| ER IDs | ER-REL-001 |
| Collection Date | 2026-09-27 |
| Source Type | Travel blog (foot traveler account) |
| Source Locator | https://neoplats.com/37 |
| Source Role | WORLD_EXPERIENCE |
| Raw Claim | 오동도 방문 후 케이블카 자산 탑승장에서 탑승 → 돌산정류장 도착. 편도 이용. 돌산 도착 후 택시 이용. |
| Normalized Claim | Traveler visited 오동도 first, then boarded at 자산 station, exited at 돌산 station. One-way 자산→돌산 direction confirmed: mainland near 오동도 → Dolsan Island (돌산공원 area). After exiting, took taxi. |
| Stability | STABLE |
| Conflict Links | — |
| Corroboration Links | EI-REL-001-A, EI-REL-001-B |
| Admissibility Notes | WE secondary role per contract. Confirms Direction A geography from lived experience. The sequence (오동도→자산탑승→돌산공원) is the key directional fact. PARTIALLY_REUSABLE for O-3 (sequence context). |

---

**EI-REL-001-E — 돌산정류장 → 오동도 requires cross-island return**

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-001-E |
| ER IDs | ER-REL-001 |
| Collection Date | 2026-09-27 |
| Source Type | Geographic inference from OFFICIAL address + CC-002 taxi evidence |
| Source Locator | yeosu.go.kr (EI-REL-001-B address) + CC-002 EI-CC-002-L |
| Source Role | MAP_ROUTE |
| Raw Claim | 돌산정류장은 돌산읍 소재. 오동도는 여수시 본도(육지) 소재. 돌산→여수 본도 이동 시 거북선대교 경유 필요. 택시 약 10~12분, ₩8,000~10,000 (EI-CC-002-L). |
| Normalized Claim | 돌산정류장 is on Dolsan Island. Reaching 오동도 from 돌산정류장 requires crossing back to the mainland via Geobukseon Bridge (~10–12 min by taxi). This is a significant directional overhead. |
| Stability | STABLE |
| Conflict Links | — |
| Corroboration Links | EI-REL-001-B, CC-002 EI-CC-002-L |
| Admissibility Notes | MAP_ROUTE role (geographic route relationship, corroborated by CC-002 taxi time). Not a claim requiring independent web collection — the geographic separation of Dolsan Island from mainland Yeosu is an established geographic fact. AUTHORITATIVE for directional implications. |

---

## 6. Negative/Exception Knowledge Items

**NEG-REL-001-001 — One-way 자산→돌산 does NOT efficiently serve 오동도**

| Field | Value |
|---|---|
| Item ID | NEG-REL-001-001 |
| ER IDs | ER-REL-001 |
| Negative Knowledge Type | DIRECTIONAL_MISMATCH — one direction does not serve intended destination |
| Statement | A traveler who boards at 자산정류장 (one-way ticket, 자산→돌산) arrives at 돌산정류장 on Dolsan Island. From there, reaching 오동도 requires crossing back via Geobukseon Bridge (~10–12 min by taxi, ~₩8,000–10,000). This direction DOES NOT efficiently serve 오동도 access. |
| Source Evidence | EI-REL-001-B (돌산 = island), EI-REL-001-E (bridge crossing required), EI-REL-001-D (traveler took taxi after 돌산 exit) |
| Stability | STABLE |
| Admissibility | AUTHORITATIVE — derived from verified geographic facts, not speculation |
| SOUL Use | Flag this to traveler when they state intent to visit 오동도 AND are considering or have purchased one-way 자산→돌산 tickets. |

---

**NEG-REL-001-002 — One-way 돌산→자산 does NOT efficiently serve Dolsan Island attractions**

| Field | Value |
|---|---|
| Item ID | NEG-REL-001-002 |
| ER IDs | ER-REL-001 |
| Negative Knowledge Type | DIRECTIONAL_MISMATCH |
| Statement | A traveler who boards at 돌산정류장 (one-way ticket, 돌산→자산) arrives at 자산정류장 on the Yeosu mainland. From there, reaching Dolsan attractions (돌산공원, 카페거리, 무슬목) requires crossing back to Dolsan Island. This direction DOES NOT efficiently serve Dolsan Island attractions for a traveler whose destination is Dolsan-side. |
| Source Evidence | EI-REL-001-A (자산 = mainland), EI-REL-001-B (돌산 = island) |
| Stability | STABLE |
| Admissibility | AUTHORITATIVE — geographic inverse of NEG-REL-001-001 |
| SOUL Use | Flag this when traveler states intent to visit 돌산공원 or island attractions after riding cable car from 돌산 side. |

---

## 7. Conflict Register

**CONFLICT-REL-001-01 — 자산정류장 address discrepancy across sources**

| Field | Value |
|---|---|
| Conflict ID | CONFLICT-REL-001-01 |
| Conflict Type | SCOPE_DIFFERENCE |
| Claim A | 수정동 777-4 (CC-002 EI-CC-002-E, designated station building) |
| Claim B | 수정동 332-55(오동도 주차타워) (yeosu.go.kr OFFICIAL — parking tower building) |
| Claim C | 오동도로 116 (소노캄 호텔 맞은편) (travel resource — street address of same complex) |
| Resolution | SCOPE_DIFFERENCE — same compound, three building-level or address-level references. 수정동 332-55 = parking tower; 수정동 777-4 = station boarding facility; 오동도로 116 = street-facing address. All are within the same 자산 station complex. Core fact unaffected: 자산정류장 is at the 오동도 parking compound on the MAINLAND. |
| SOUL Use | Use "오동도 앞 주차타워 엘리베이터" or "오동도 입구 케이블카 탑승장" for directional guidance; avoid specific lot addresses. |

**CONFLICT-REL-001-02 — Route Corpus zone label discrepancy**

| Field | Value |
|---|---|
| Conflict ID | CONFLICT-REL-001-02 |
| Conflict Type | INTERPRETATION_DIFFERENCE |
| Claim A | Route Corpus V0.1 (line 508): "오동도권: 오동도, 해상케이블카(돌산측 승강장), 신북항" — assigns 돌산측 승강장 to 오동도권 zone |
| Claim B | All OFFICIAL sources (yeosu.go.kr, search results, namu.wiki): 돌산정류장 is on Dolsan Island (돌산읍); 자산정류장 is on mainland near 오동도 |
| Resolution | INTERPRETATION_DIFFERENCE — Route Corpus appears to have labeled the cable car's Odongdo-side station (자산측) as "돌산측 승강장" in zone labels, or the zone label represents the cable car entity generically rather than specifying which station. Primary OFFICIAL sources confirm geographic reality: 자산측 = mainland/오동도권; 돌산측 = Dolsan Island. **Route Corpus label for this specific line is an error or naming shorthand; geographic facts override corpus zone assignment.** |
| Impact | Route Corpus CONTEXT_ONLY status confirmed — not used as directional geography evidence. REL-001 collection unaffected. |

---

## 8. Stop Condition Test — AUTHORITATIVE_FACT_SUFFICIENT

| # | Criterion | Evidence | Result |
|---|---|---|---|
| A | 자산정류장 confirmed as MAINLAND station | EI-REL-001-A (yeosu.go.kr: "오동도 주차타워" = mainland) | ✓ PASS |
| B | 돌산정류장 confirmed as DOLSAN ISLAND station | EI-REL-001-B (yeosu.go.kr: "돌산읍" = island township) | ✓ PASS |
| C | Geographic relationship 자산↔오동도 established | EI-REL-001-C (~5 min walk from 오동도 entrance to 자산 station) | ✓ PASS |
| D | Geographic relationship 돌산↔오동도 established | EI-REL-001-E (bridge crossing required; ~10–12 min taxi) | ✓ PASS |
| E | Direction A (자산→돌산) = mainland-to-island confirmed | EI-REL-001-A + B + D (WE traveler: 오동도→자산탑승→돌산도착) | ✓ PASS |
| F | Direction B (돌산→자산) = island-to-mainland confirmed | Logical inverse of E; geographic facts per A+B | ✓ PASS |
| G | Directional implication for O-3/C-3 established | EI-REL-001-A/B/C/E: 돌산→자산 delivers traveler near 오동도; 자산→돌산 moves away from 오동도 | ✓ PASS |
| H | Negative/exception knowledge captured | NEG-REL-001-001: 자산→돌산 DOES NOT efficiently serve 오동도; NEG-REL-001-002: 돌산→자산 DOES NOT efficiently serve Dolsan attractions | ✓ PASS |
| I | ≥2 independent MAP_ROUTE/OFFICIAL sources confirm geographic relationship | yeosu.go.kr (OFFICIAL), search results from multiple independent sources, namu.wiki, neoplats.com WE | ✓ PASS |
| J | No unresolved FACT_CONFLICT | CONFLICT-REL-001-01: SCOPE_DIFFERENCE resolved (same compound); CONFLICT-REL-001-02: INTERPRETATION_DIFFERENCE resolved (corpus label vs OFFICIAL) | ✓ PASS |

**Stop Condition Result: 10/10 PASS → AUTHORITATIVE_FACT_SUFFICIENT**

---

## 9. Collection Outcome

| Field | Value |
|---|---|
| ER-REL-001 Final Status | **VERIFIED_FOR_PREPARATION** |
| Stop Condition | AUTHORITATIVE_FACT_SUFFICIENT — 10/10 PASS |
| Evidence Items Collected | EI-REL-001-A, B, C, D, E (5 items) |
| Negative Knowledge Items | NEG-REL-001-001, NEG-REL-001-002 (2 items) |
| Conflicts Found | 2 (both resolved: 1 SCOPE_DIFFERENCE, 1 INTERPRETATION_DIFFERENCE) |
| Source Role Corrections | None — MAP_ROUTE/OFFICIAL primary matched canonical contract |
| Stability Class | STABLE — no live trigger required |
| Wave 2 Impact | ER-REL-001 = final Wave 2 ER → **Wave 2 COMPLETE** |
| Unlocks | ER-REL-002 (gated on REL-001 + OD-003), ER-REL-005 (gated on REL-001 + REL-002) |
| Artifact | `docs/research/SOUL_YEOSU_ER_REL_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |

---

## 10. Directional Summary for SOUL Use

**Facts only. SOUL makes the verdict; this summary provides the geographic base.**

여수해상케이블카는 두 정류장을 잇습니다: **자산정류장(해야정류장)**은 여수 본도(육지)의 오동도 주차타워 앞에 위치하며, 오동도 입구에서 도보 약 5분 거리입니다. **돌산정류장(놀아정류장)**은 돌산섬 돌산공원에 위치하며, 오동도에서 거북선대교를 건너야 도달합니다(택시 약 10–12분).

**방향 A (자산→돌산):** 오동도 인근 육지에서 출발 → 돌산섬 도착. 이 방향으로 편도 이용 후 오동도를 방문하려면 다리를 다시 건너야 합니다.

**방향 B (돌산→자산):** 돌산섬에서 출발 → 오동도 인근 육지 도착. 이 방향 편도 이용 후 오동도는 도보 5분 거리입니다.

**O-3/C-3 사용 원칙:** 오동도와 케이블카를 함께 경험할 경우, 오동도를 먼저 방문하고 자산정류장에서 승차 후 돌산에서 하차(방향 A)하거나, 돌산에서 승차 후 자산(오동도 인근)에서 하차(방향 B)하는 순서가 오동도 접근 부담을 최소화합니다. 자산→돌산 편도 후 오동도 방문은 비효율적입니다(NEG-REL-001-001).
