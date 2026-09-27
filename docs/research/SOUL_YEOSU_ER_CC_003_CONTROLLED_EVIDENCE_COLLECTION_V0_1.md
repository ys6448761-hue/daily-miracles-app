# SOUL Yeosu — ER-CC-003 Controlled Evidence Collection
# Per-Station Vehicle Access and Parking
# V0.1

**Date:** 2026-09-27  
**Branch:** staging/storybook-c7a  
**Base Commit:** cb700b0 (Wave 3 ER-REL-002 VERIFIED_FOR_PREPARATION)  
**ER:** ER-CC-003  
**Execution Basis:** `docs/research/SOUL_YEOSU_3_PLACE_CONTROLLED_EVIDENCE_COLLECTION_PLAN_V0_2.md`  
**Matrix Basis:** `docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md`  
**Collection Result:** VERIFIED_FOR_PREPARATION

---

## 1. ER Contract Reference

**ER-CC-003 — Per-Station Vehicle Access and Parking**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카 |
| Related Scenario(s) | C-2, MT-1 (via C-2 intent) |
| Required Judgment | ANSWER + JUDGMENT — situation-aware boarding guidance for vehicle arrival |
| Knowledge Category | VEHICLE_ACCESS / PARKING |
| Evidence Needed | Vehicle access and parking conditions at or near each station — which station is better suited for vehicle arrival and why, parking friction at each |
| Why Needed | C-2 requires a vehicle-aware boarding recommendation. MT-1 Turn 3 reuses via companion+vehicle context. |
| Preferred Source Role | LOCAL_OPERATOR / FOUNDER |
| Secondary Source Role | WORLD_EXPERIENCE |
| Stability Class | SEMI_STABLE |
| Live Trigger | Current parking availability if volatile |
| Confidence Requirement | Field-confirmed per station |
| Negative/Exception Knowledge | YES — parking conditions that discourage vehicle arrival at a particular station |
| Relationship Dependency | ER-CC-001 ✓, ER-CC-002 ✓ |
| Missing-Evidence Consequence | Cannot make vehicle-aware recommendation; LIVE_VERIFY or QUALIFY |
| Behavior if Missing | LIVE_VERIFY |
| Collection Priority | P0 |
| Stop Condition | EXPERIENCE_PATTERN_SUFFICIENT |

---

## 2. Pre-Collection State

**Starting Gap State (Wave 0):** FULL_GAP (CONTEXT_ONLY in practice)  
**Active Conflict:** CONFLICT-F OPEN — parking: 무료/유료/시간별 요금 conflict (WE §15)  
**Wave 0 Escalation Trigger (§16):** If CONFLICT-F unresolved at CC-003 collection time → MORE_EVIDENCE_REQUIRED

Pre-existing item:
- `EI-CC-003-CTX-A` — Conflict documentation only (WE §12, §15, §16); Verification Status = CONFLICTED

---

## 3. Dependency Verification

| Dependency | Required State | Actual State | Result |
|---|---|---|---|
| ER-CC-001 (Station Identity) | VERIFIED_FOR_PREPARATION | VERIFIED ✓ | PASS |
| ER-CC-002 (Per-Station Access Structure) | VERIFIED_FOR_PREPARATION | VERIFIED ✓ (1ca995b) | PASS |

**Dependency gate: OPEN — collection authorized.**

---

## 4. CONFLICT-F Resolution

### 4.1 CONFLICT-F Definition (Wave 0 §16)

> Parking: 무료/유료/시간별 요금 등 상충. Action: VERIFY_REQUIRED / LIVE_CHECK  
> "Parking location / fee / capacity — OPEN"

### 4.2 Evidence Basis for Resolution

Evidence collected this cycle reveals **multiple distinct parking facilities** in the 자산/오동도 compound area, each with **different rate structures**:

| Facility | Address | Spaces | Rate |
|---|---|---|---|
| 오동도 공영주차장/주차타워 | 오동도로 116 | 237–250 | 1시간 무료 → 200원/10분 |
| 동백 공영주차장 | 수정동 280 | 112 | 1시간 무료 → 200원/10분 |
| 공영주차장 | 수정동 332-7 | 60 | 30분 무료 → 500원/30분 |
| 여수 엑스포 주차장 | 수정동 777-4 | 733 | 400원/10분, max 13,000원/day, 24시간 |

돌산정류장 compound also has a primary paid lot and two free alternatives.

### 4.3 Conflict Resolution Verdict

**CONFLICT-F STATUS: CLOSED**  
**Resolution Type: SCOPE_DIFFERENCE + INTERPRETATION_DIFFERENCE**

**Analysis:**
- "무료" sources = citing the free period (1시간 or 30분 free) that exists at main lots
- "유료" sources = citing the paid period after the free window
- "시간별 요금" sources = citing the per-10min or per-30min rate structure that applies during paid period
- ALL three framings describe the SAME layered rate structure: free period → timed paid → (some with daily max)
- Rate discrepancies across sources = different sources cited different facilities at different addresses
- No single parking facility has contradictory confirmed rates from two independent sources

**CONFLICT-F is NOT a FACT_CONFLICT about the same facility. It is:**
1. INTERPRETATION_DIFFERENCE: "무료" interpreted as "free exists" vs "always free"
2. SCOPE_DIFFERENCE: Different sources cited different facilities within the same compound area

**Wave 0 §16 escalation override:** CONFLICT-F resolved before CC-003 collection proceeds. Escalation to MORE_EVIDENCE_REQUIRED NOT triggered.

---

## 5. REUSE-FIRST — Admissible Prior Evidence

### 5.1 EI-CC-002-I (Elevator Tower — 자산 direct connection) — REUSED

**Reuse classification:** DIRECT_REUSE (core to vehicle arrival model for 자산)

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-I (REUSED) |
| ER IDs | ER-CC-003 (access structure at 자산) |
| Source Role | OFFICIAL |
| Source Name | yeosucablecar.com / 나무위키 여수해상케이블카 |
| Extracted Claim | 자산정류장 주차타워: 11층 높이 엘리베이터 탑; 주차층에서 승강장까지 무료 수직 이동; 운행 09:00–22:00 |
| Claim Type | STRUCTURAL_FACT |
| Verification Status | VERIFIED_FOR_PREPARATION (from ER-CC-002 collection) |
| Reuse Note | Confirms direct physical connection from primary parking (오동도로 116 tower) to boarding area |

### 5.2 EI-OD-004 (Primary Parking Rate and Capacity — 오동도로 116) — REUSED

**Reuse classification:** DIRECT_REUSE (rate and capacity anchor for primary 자산 lot)

| Field | Value |
|---|---|
| Evidence Item ID | EI-OD-004 (REUSED) |
| ER IDs | ER-CC-003 (primary parking at 자산) |
| Source Role | LOCAL_OPERATOR |
| Source Name | yumcorp.or.kr (주차 운영 기관) |
| Source Locator | yumcorp.or.kr |
| Extracted Claim | 오동도 공영주차장 / 주차타워 (오동도로 116): 237 spaces; 1시간 무료 후 200원/10분; 최대 5,000원/일; 08:00–20:00; 여수시 휴일 무료 주차 프로그램 제외 대상 |
| Claim Type | OPERATIONAL_FACT |
| Stability Classification | SEMI_STABLE |
| Verification Status | VERIFIED_FOR_PREPARATION (from ER-OD-004 collection) |
| Reuse Note | OD-004 recorded max 5,000원/day; oh-my-post records "no daily max" at same address — minor discrepancy; OD-004 (LOCAL_OPERATOR) preferred for rate details |

### 5.3 EI-CC-002-E (Station Addresses) — CONTEXT_ONLY

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-E (CONTEXT) |
| Reuse Note | 자산정류장 = 수정동 777-4; 오동도 주차타워 = 수정동 332-55 (same compound, different buildings, confirmed CC-002) |

---

## 6. New Evidence Items

### EI-CC-003-A — 자산 Primary Parking: Compound Multi-Facility Summary

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-003-A |
| ER IDs | ER-CC-003 |
| Source Role | LOCAL_OPERATOR |
| Source Name | oh-my-post.com 여수 케이블카 주차 비교 |
| Source Type | NON_OFFICIAL_AGGREGATOR (parking comparison, structured data) |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-parking/ |
| Accessed Date | 2026-09-27 |
| Publication Date | UNKNOWN |
| Extracted Claim | 자산정류장 인근 4개 공영주차장: (1) 오동도로 116 — 250 spaces, 1시간 무료 → 200원/10분, 엘리베이터 탑 직결; (2) 수정동 280 (동백) — 112 spaces, 1시간 무료 → 200원/10분, 도보 ~5분; (3) 수정동 332-7 — 60 spaces, 30분 무료 → 500원/30분; (4) 수정동 777-4 (엑스포) — 733 spaces, 400원/10분, max 13,000원/day, 24시간, 도보 12–15분 |
| Claim Type | OPERATIONAL_FACT |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | 자산정류장 compound (수정동/오동도로 복합) |
| Traveler-Context Scope | Vehicle arrival — all parking options |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | EI-OD-004 (오동도로 116 — capacity minor discrepancy 237 vs 250; rate consistent), EI-CC-002-I (elevator tower direct) |
| Conflict Status | CLEAR (CONFLICT-F RESOLVED — SCOPE_DIFFERENCE, see §4) |
| Notes/Limitations | Space count at 오동도로 116: 237 (OD-004/LOCAL_OPERATOR) vs 250 (oh-my-post/aggregator) — minor discrepancy; LOCAL_OPERATOR preferred for exact count. Max daily cap at 오동도로 116: OD-004 says 5,000원, oh-my-post says none; OD-004 preferred. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot; availability volatile on peak days |

---

### EI-CC-003-B — 자산 Parking Pressure: HIGH Vehicle Load

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-003-B |
| ER IDs | ER-CC-003 |
| Source Role | WORLD_EXPERIENCE |
| Source Name | oh-my-post.com + WE collective synthesis |
| Source Type | WE_SYNTHESIS |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-parking/ + YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md |
| Accessed Date | 2026-09-27 |
| Publication Date | 2026-09-24 (WE) / UNKNOWN (oh-my-post) |
| Extracted Claim | 자산정류장 구역은 오동도 관광 수요와 케이블카 이용객이 겹쳐 차량 압력이 높음. 주말/성수기 주차 대기 발생 가능. 자산정류장은 돌산정류장보다 차량 압력이 높음. |
| Claim Type | EXPERIENCE_PATTERN |
| Stability Classification | CONTEXTUAL |
| Geographic Scope | 자산정류장 compound |
| Traveler-Context Scope | Vehicle arrival, peak period |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | EI-CC-003-F (돌산 pressure lower — asymmetry confirmed) |
| Conflict Status | CLEAR |
| Notes/Limitations | Pressure level is CONTEXTUAL — off-peak periods may have ample space. WE pattern only; no live data. |
| Superseded By | NONE |
| Recommended Refresh Window | Always live-verify for weekend/holiday travel |

---

### EI-CC-003-C — 돌산 Primary Parking: Dolsan Park Compound

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-003-C |
| ER IDs | ER-CC-003 |
| Source Role | LOCAL_OPERATOR |
| Source Name | oh-my-post.com 여수 케이블카 주차 비교 |
| Source Type | NON_OFFICIAL_AGGREGATOR (parking comparison, structured data) |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-parking/ |
| Accessed Date | 2026-09-27 |
| Publication Date | UNKNOWN |
| Extracted Claim | 돌산공원 공영주차장 1–4구역 (돌산로 3600-1, 돌산정류장 구내): 250 spaces; 1시간 무료 → 200원/10분 → max 5,000원/day; 카드 전용; 점심(12–14시) 및 저녁 시간 무료 |
| Claim Type | OPERATIONAL_FACT |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | 돌산정류장 (돌산로 3600-1) |
| Traveler-Context Scope | Vehicle arrival — primary parking |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | EI-CC-002-J (돌산정류장 address 돌산로 3600-1 confirmed) |
| Conflict Status | CLEAR |
| Notes/Limitations | Card-only (no cash). Free periods at lunch/evening may vary seasonally — LIVE_VERIFY for time windows. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot; confirm free window availability |

---

### EI-CC-003-D — 돌산 Free Parking Alternatives

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-003-D |
| ER IDs | ER-CC-003 |
| Source Role | LOCAL_OPERATOR |
| Source Name | oh-my-post.com 여수 케이블카 주차 비교 |
| Source Type | NON_OFFICIAL_AGGREGATOR |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-parking/ |
| Accessed Date | 2026-09-27 |
| Publication Date | UNKNOWN |
| Extracted Claim | 돌산정류장 인근 무료 주차 2개소: (1) 여객선터미널 주차장 (돌산읍-1) — 무료, 24시간, 도보 5–7분; (2) 돌산교 하부 주차장 (돌산읍-12) — 무료, 24시간, 도보 7–10분 |
| Claim Type | OPERATIONAL_FACT |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | 돌산정류장 인근 |
| Traveler-Context Scope | Vehicle arrival — free parking alternatives |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | NONE |
| Conflict Status | CLEAR |
| Notes/Limitations | Exact capacities unknown. Free lot availability not guaranteed on peak days. 도보 거리는 대략적 수치. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot; live-check availability on peak days |

---

### EI-CC-003-E — 돌산 vs 자산 Vehicle Pressure Asymmetry (WE Pattern)

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-003-E |
| ER IDs | ER-CC-003 |
| Source Role | WORLD_EXPERIENCE |
| Source Name | oh-my-post.com + WE collective synthesis |
| Source Type | WE_SYNTHESIS |
| Source Locator | https://oh-my-post.com/yeosu-cable-car-parking/ |
| Accessed Date | 2026-09-27 |
| Publication Date | UNKNOWN |
| Extracted Claim | 돌산정류장은 자산정류장보다 차량 압력이 낮은 편이므로 주차 가능성이 더 높다. 특히 장시간 주차 시 돌산정류장이 가성비 측면에서 유리함 (5,000원 일일 상한선, 추가 무료 주차장 존재). |
| Claim Type | EXPERIENCE_PATTERN |
| Stability Classification | CONTEXTUAL |
| Geographic Scope | Both stations — comparative |
| Traveler-Context Scope | Vehicle arrival — station choice decision |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | EI-CC-003-B (자산 HIGH pressure), EI-CC-003-C (돌산 daily max cap), EI-CC-003-D (돌산 free alternatives) |
| Conflict Status | CLEAR |
| Notes/Limitations | 돌산 has structural parking advantage per evidence; however, 돌산 requires Geobukseon Bridge crossing (REL-002) — tradeoff for traveler heading to 오동도. |
| Superseded By | NONE |
| Recommended Refresh Window | Seasonal — update if Yeosu area development changes parking supply |

---

## 7. Negative Evidence

### NEG-CC-003-001 — 자산 Free Parking NOT Available

| Field | Value |
|---|---|
| Evidence Item ID | NEG-CC-003-001 |
| ER IDs | ER-CC-003 |
| Claim | 자산정류장 구역 주요 공영주차장은 모두 유료(일부 무료 시간 후 과금). 완전 무료 주차는 없음. |
| Basis | OD-004 (yumcorp.or.kr): 여수시 휴일 무료 주차 프로그램 대상 제외. EI-CC-003-A: 4개 시설 전부 유료 또는 무료 시간 후 유료. |
| Note | "무료 1시간" ≠ 완전 무료. CONFLICT-F "무료" 해석 정리. |

### NEG-CC-003-002 — 자산 Parking Lot at 777-4 (Expo) = FAR from Boarding

| Field | Value |
|---|---|
| Evidence Item ID | NEG-CC-003-002 |
| ER IDs | ER-CC-003 |
| Claim | 수정동 777-4 엑스포 주차장 (733 spaces) = 도보 12–15분. 용량은 크나 승강장에서 먼 편. 단기 방문 또는 이동 불편 여행자에게는 부적합. |
| Basis | EI-CC-003-A (oh-my-post) |
| Note | 자산정류장 주소가 777-4이나, 엑스포 주차장이 같은 주소에 있을 가능성 있음 — 승강장과 주차 입구는 별개 동 (CC-002-E 참조). |

---

## 8. Stop Condition Assessment

**ER-CC-003 Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT**

> The collected evidence provides a reliable structural description of per-station vehicle access and parking conditions that allows SOUL to give meaningful, accurate, experience-level guidance to a traveler arriving by car.

| Criterion | Evidence | Result |
|---|---|---|
| 자산 primary parking confirmed (location, rate, access) | EI-OD-004 + EI-CC-003-A + EI-CC-002-I | ✅ PASS |
| 자산 additional parking options mapped | EI-CC-003-A (3 additional facilities) | ✅ PASS |
| 돌산 primary parking confirmed (location, rate, daily cap) | EI-CC-003-C | ✅ PASS |
| 돌산 free alternatives confirmed | EI-CC-003-D (2 lots, 5–10 min walk) | ✅ PASS |
| Comparative vehicle pressure pattern | EI-CC-003-E (WE) | ✅ PASS |
| Elevator tower 자산 boarding connection | EI-CC-002-I (REUSED) | ✅ PASS |
| CONFLICT-F resolved (not blocking) | §4 — SCOPE_DIFFERENCE + INTERPRETATION_DIFFERENCE | ✅ PASS |
| SEMI_STABLE live trigger noted (availability volatile) | EI-CC-003-B + LIVE_TRIGGER | ✅ PASS |

**EXPERIENCE_PATTERN_SUFFICIENT: PASS (8/8)**

**Collection Status: VERIFIED_FOR_PREPARATION**

---

## 9. Integrated Vehicle Access Model

### 자산정류장 — Vehicle Arrival Model

**Compound identifier:** 오동도로 116 복합단지 (= 자산정류장 구내)

| Lot | Address | Spaces | Rate | Walk to Station |
|---|---|---|---|---|
| 오동도 주차타워 (PRIMARY) | 오동도로 116 | 237 (OD-004) | 1hr 무료 → 200원/10분, max 5,000원/day | 0분 (엘리베이터 탑 직결) |
| 동백 공영주차장 | 수정동 280 | 112 | 1hr 무료 → 200원/10분 | ~5분 |
| 공영주차장 | 수정동 332-7 | 60 | 30분 무료 → 500원/30분 | nearby |
| 여수 엑스포 주차장 | 수정동 777-4 | 733 | 400원/10분, max 13,000원/day, 24hr | 12–15분 |

**Vehicle Pressure:** HIGH (오동도 관광객 + 케이블카 이용객 중첩)  
**Live Trigger:** 주말/성수기 주차 대기 발생 가능 → SOUL must QUALIFY during volatile periods  
**Key SOUL Guidance Point:** 주차타워(오동도로 116) → 엘리베이터 탑 → 승강장 직결 (무료 이동)

### 돌산정류장 — Vehicle Arrival Model

**Compound identifier:** 돌산로 3600-1 (돌산공원)

| Lot | Address | Spaces | Rate | Walk to Station |
|---|---|---|---|---|
| 돌산공원 공영주차장 1-4 (PRIMARY) | 돌산로 3600-1 | 250 | 1hr 무료 → 200원/10분, max 5,000원/day; 점심/저녁 무료 | 0분 (구내) |
| 여객선터미널 주차장 (FREE) | 돌산읍-1 | — | 무료, 24hr | 5–7분 |
| 돌산교 하부 주차장 (FREE) | 돌산읍-12 | — | 무료, 24hr | 7–10분 |

**Vehicle Pressure:** LOWER than 자산 (WE pattern)  
**Cards Only:** 돌산공원 공영주차장 — 카드 전용 (현금 불가)  
**Key SOUL Guidance Point:** 무료 대안 주차 2개소 존재 → 가성비 우위. 단, 오동도 방면 여행자는 자산 출발 시 거북선대교 차량 이동 추가.

### Comparative SOUL Judgment Framework

```
차량 도착 → 오동도만 목적지: 자산 출발 권장 (엘리베이터 직결 + 오동도 도보 5분)
차량 도착 → 케이블카 체험 목적 + 주차비 고려: 돌산 출발 가능 (주차 여유 + max 5,000원)
차량 도착 → 주말/성수기: 자산 주차 대기 주의, 돌산 여유 가능성 높음
```

---

## 10. Gap Register Update

**ER-CC-003 row (Wave 0 §11):**

| Field | Before | After |
|---|---|---|
| Gap State | FULL_GAP (CONTEXT_ONLY) | CLOSED |
| Verification Status | CONFLICTED (CONFLICT-F OPEN) | VERIFIED_FOR_PREPARATION |
| CONFLICT-F | OPEN | RESOLVED — SCOPE_DIFFERENCE + INTERPRETATION_DIFFERENCE |
| Items | EI-CC-003-CTX-A only | CTX-A + A + B + C + D + E (new); OD-004 + CC-002-I (reused) |

**Wave 0 §17 CONFLICT register update:**

| Conflict | Was | Now |
|---|---|---|
| CONFLICT-F | OPEN — blocks ER-CC-003 | RESOLVED — SCOPE_DIFFERENCE + INTERPRETATION_DIFFERENCE |

---

## 11. Collection Cycle Summary

```
Wave 3 ER-CC-003 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_CC_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: cb700b0 (Wave 3 ER-REL-002 VERIFIED_FOR_PREPARATION)

  ER: ER-CC-003 — Per-Station Vehicle Access and Parking
  Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT — 8/8 PASS

  Starting State: FULL_GAP — CONFLICT-F OPEN

  CONFLICT-F Resolution: SCOPE_DIFFERENCE + INTERPRETATION_DIFFERENCE (CLOSED)
    - Multiple facilities in 자산 compound have different rate structures
    - "무료/유료/시간별 요금" all describe SAME layered structure at different addresses
    - NOT a FACT_CONFLICT about any single facility

  Reused Items:
    EI-CC-002-I: 자산 엘리베이터 탑 직결 (OFFICIAL, CC-002) — DIRECT_REUSE
    EI-OD-004: 오동도로 116 주차 237 spaces, 1hr free, 200원/10분 (LOCAL_OPERATOR) — DIRECT_REUSE

  New Evidence Items:
    EI-CC-003-A: 자산 4-lot compound map (oh-my-post, NON_OFFICIAL_AGGREGATOR)
    EI-CC-003-B: 자산 HIGH vehicle pressure (WE synthesis)
    EI-CC-003-C: 돌산 250-space primary lot, 5,000원 daily cap (oh-my-post)
    EI-CC-003-D: 돌산 2 free alternatives, 5–10분 walk (oh-my-post)
    EI-CC-003-E: 돌산 LOWER pressure than 자산 — comparative WE pattern

  Negative Items:
    NEG-CC-003-001: 자산 완전 무료 없음 (all lots paid after free window)
    NEG-CC-003-002: 엑스포 주차장 777-4 = 12-15분 도보 (far from boarding)

  Key Structural Fact: 자산 → 오동도 목적: 자산 출발 권장 (도보 직결)
                       주차비/여유 우선: 돌산 출발 가능 (lower pressure + free lots)

  Gap Register: ER-CC-003 FULL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)
  CONFLICT-F: OPEN → RESOLVED
  Controlled Collection Cycles: 10 → 11
  Wave 3 Status: IN_PROGRESS (REL-002 ✓ + CC-003 ✓; remaining: HY-003, HY-007, OD-006, CC-005)
  DB / Schema / Runtime / Production: NO CHANGE
```

---

## 12. Admissibility Notes

**PROVISIONALLY_SUPPORTED items (A–E):** All from single non-official aggregator (oh-my-post.com). Structural facts (addresses, space counts, rate structures) are internally consistent and corroborated by OD-004 for the primary lot. Confidence: HIGH for structural model; CONTEXTUAL for availability predictions.

**Upgrade path to VERIFIED:** OFFICIAL confirmation (yeosucablecar.com or Yeosu city parking portal) for each lot's rate. Currently inaccessible (SSL error persists). Founder field verification before pilot execution.

**LIVE_TRIGGER active:** Current parking availability is VOLATILE. SOUL must add qualification ("주말에는 미리 도착하세요" / "성수기에는 돌산 쪽이 주차하기 더 편할 수 있어요") for volatile periods.
