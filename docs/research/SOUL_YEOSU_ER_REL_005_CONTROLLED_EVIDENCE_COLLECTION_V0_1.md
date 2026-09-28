# SOUL Yeosu ER-REL-005 Controlled Evidence Collection V0.1
# Cable Car Direction Selection Judgment

**Document ID:** SOUL_YEOSU_ER_REL_005_CONTROLLED_EVIDENCE_COLLECTION_V0_1  
**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Controlled Collection Cycle:** 22  
**Wave:** 4a — Phase 4-β (Founder synthesis, executed LAST per Plan ordering)  
**Status:** VERIFIED_FOR_PREPARATION

---

## §1. Canonical Contract (from Matrix V0.1)

| Field | Value |
|-------|-------|
| ID | ER-REL-005 |
| Related Place(s) | 여수해상케이블카 (cross-place: relates to 오동도 direction decision) |
| Related Scenario(s) | MT-1 (multi-place itinerary judgment); C-1, C-2 (cable car direction for Odongdo-linked visits) |
| Required Judgment | JUDGMENT — which boarding direction to recommend when cable car is combined with Odongdo visit |
| Knowledge Category | ITINERARY_LOGIC / DIRECTION_SELECTION |
| Evidence Needed | Synthesized judgment on direction preference: 돌산→자산 vs 자산→돌산, informed by station positions, Odongdo proximity, itinerary flow patterns |
| Why Needed | MT-1 and C-1/C-2 require a defensible directional recommendation when cable car + Odongdo are combined. Without this, SOUL either avoids direction guidance or risks fabricating a recommendation. |
| Preferred Source Role | FOUNDER |
| Secondary Source Role | WORLD_EXPERIENCE |
| Stability Class | STABLE (physical geography is fixed) |
| Live Trigger | If cable car operator changes one-way routing policy |
| Confidence Requirement | Synthesized expert judgment; no single WE account required |
| Negative/Exception Knowledge | YES — conditions where direction preference changes |
| Relationship Dependency | ER-REL-001 ✓, ER-REL-002 ✓ (both VERIFIED_FOR_PREPARATION) |
| Missing-Evidence Consequence | SOUL must withhold direction recommendation; cannot default |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Stop Condition | EXPERT_JUDGMENT_SUFFICIENT |

**Wave position:** Phase 4-β (executed LAST among Wave 4a ERs per Collection Plan §Wave 4 Exit and Readiness §8)

**Downstream:** REL-006 transitions to READY_FOR_COLLECTION upon REL-005 VERIFIED status

---

## §2. Phase 4-β Classification

This ER is classified Phase 4-β because:
1. The stop condition is EXPERT_JUDGMENT_SUFFICIENT — a Founder synthesis standard, not a WE experiential pattern standard
2. The required judgment requires synthesis of REL-001/REL-002 facts into a defensible directional recommendation
3. The Preferred Source Role is FOUNDER, not WORLD_EXPERIENCE
4. Phase 4-α ERs (OD-005, OD-007, HY-004, HY-005, CC-004) must complete BEFORE this synthesis

All Phase 4-α ERs confirmed VERIFIED_FOR_PREPARATION before this cycle.

---

## §3. Starting State and Dependency Verification

| ER | Status | Verified |
|----|--------|---------|
| ER-REL-001 | VERIFIED_FOR_PREPARATION | ✓ |
| ER-REL-002 | VERIFIED_FOR_PREPARATION | ✓ |

Wave 0 state for REL-005: CONTEXT_ONLY (EI-REL-005-CTX-A: Founder philosophy, no directional evidence)  
Wave 4 Readiness state: READY

---

## §4. Wave 0 Context Review

**EI-REL-005-CTX-A** (Wave 0):
- Content: Founder philosophy about guidance quality and travel intelligence
- Classification: CONTEXT_ONLY — philosophical framing only; no directional evidence
- Result: CONTEXT_ONLY is NOT promoted to Evidence for this cycle per directive
- Note: EI-REL-005-CTX-A remains labeled CONTEXT_ONLY throughout

---

## §5. Fact Base Review — REL-001 and REL-002

### REL-001 Established Facts (VERIFIED_FOR_PREPARATION)
From canonical REL-001 artifact:
- 자산역 (Jasando Station): located near downtown Yeosu proper; nearest cable car station to Odongdo
- 돌산역 (Dolsan Station): located on Dolsan Island (across the bridge from mainland Yeosu)
- Cable car span: crosses Yeosu Strait between 자산 and 돌산
- From 자산역 to 오동도 entrance: approximately 5-minute walk (confirmed by Travel Time Matrix V0.1, evidence from EI-OD-003-A chain)
- From 돌산역: on Dolsan Island — requires crossing back to mainland to reach Odongdo

### REL-002 Established Facts (VERIFIED_FOR_PREPARATION)
From canonical REL-002 artifact:
- Both one-way and round-trip tickets available
- One-way use: traveler boards at one station, exits at the other (no return trip)
- Round-trip use: traveler boards and returns to same boarding station
- Operator designates one-way as a valid ticket option
- Round-trip recommended when both endpoints have attractions to visit

---

## §6. Synthesis Engine — Direction Selection Logic

### §6.1 Defining the Decision Problem

**Scenario:** Traveler wants to visit BOTH 여수해상케이블카 AND 오동도 as part of a combined itinerary.

**Decision:** Should they board at 돌산역 first (돌산→자산 direction) or board at 자산역 first (자산→돌산 direction)?

### §6.2 Direction A — 돌산 탑승 → 자산 하차 (then Odongdo)

Itinerary flow:
1. Board at 돌산역 (Dolsan Island)
2. Cable car ride → arrive at 자산역 (near downtown Yeosu)
3. Walk ~5 minutes from 자산역 to 오동도 entrance
4. Visit Odongdo
5. Return to central Yeosu (already at 자산 side)

**Advantages:**
- One continuous directional flow: Dolsan → Cable Car → 자산 → Odongdo
- No backtracking required
- One-way ticket valid (exit at 자산역; no return needed)
- Visit sequence: cable car aerial experience → island walk (two distinct experiential types in sequence)

**Disadvantages:**
- Traveler starts on Dolsan Island — requires initial trip to 돌산역 from central Yeosu (bridge or bus)

### §6.3 Direction B — 자산 탑승 → 돌산 하차 (then attempting Odongdo)

Itinerary flow:
1. Board at 자산역 (near downtown Yeosu / near Odongdo)
2. Cable car ride → arrive at 돌산역 (Dolsan Island)
3. To visit Odongdo: must either:
   - (a) Return via cable car (additional round-trip cost or second ticket) to get back to 자산역 side
   - (b) Cross Dolsan Bridge back to mainland by other means (taxi/bus)

**Disadvantages:**
- Creates backtracking or additional cost if Odongdo visit follows cable car
- Round-trip ticket required if returning via cable car
- More complex itinerary planning required
- No direct walk from 돌산역 to Odongdo possible

**Appropriate when:** Traveler plans Dolsan Island as the destination (not combining with Odongdo in same day)

### §6.4 Directional Judgment

**JUDGMENT:** For itineraries combining 여수해상케이블카 + 오동도 visit:

- **PREFERRED DIRECTION:** 돌산 탑승 → 자산 하차
  - Results in direct proximity to Odongdo entrance (~5 min walk)
  - Supports one-way ticket purchase (no return trip cost)
  - Continuous directional flow with no backtracking

- **REVERSE DIRECTION (자산→돌산): NOT RECOMMENDED for Odongdo-combined itinerary**
  - Leaves traveler on Dolsan Island, away from Odongdo
  - Requires additional travel cost or round-trip ticket to correct

- **Exception:** If traveler is visiting Dolsan Island attractions specifically (e.g., 미남터널전망대, 향일암 by car, Dolsan Park), 자산→돌산 direction or round-trip from 자산 is appropriate.

---

## §7. Evidence Items (Judgment Fragments)

### EI-REL-005-A — Spatial Positioning Evidence (STRUCTURAL_FACT from REL-001)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-REL-005-A |
| ER IDs | ER-REL-005 |
| Source Role | FOUNDER (synthesized from REL-001 structural facts) |
| Source Type | FOUNDER synthesis from verified facts |
| Accessed Date | 2026-09-28 |
| Extracted Claim | 자산역 is the cable car station nearest to 오동도 entrance (~5 min walk). 돌산역 is on Dolsan Island with no direct path to Odongdo. |
| Normalized Claim | Geographic positioning creates a structural preference for 돌산→자산 direction when Odongdo is included in the itinerary |
| Claim Type | STRUCTURAL_FACT |
| Stability Classification | STABLE |
| Corroboration Links | EI-REL-005-B |
| Source of Supporting Facts | ER-REL-001 (자산역 location confirmed) + Travel Time Matrix V0.1 (Odongdo ~5 min from 자산) |
| Conflict Status | CLEAR |

---

### EI-REL-005-B — Ticket Policy Direction Implication (STRUCTURAL_FACT from REL-002)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-REL-005-B |
| ER IDs | ER-REL-005 |
| Source Role | FOUNDER (synthesized from REL-002 operational facts) |
| Source Type | FOUNDER synthesis from verified facts |
| Accessed Date | 2026-09-28 |
| Extracted Claim | One-way ticket allows exit at 자산역 without return cost. Round-trip required if traveler boards 자산→돌산 and wants to return to 자산 side for Odongdo. |
| Normalized Claim | 돌산→자산 direction enables one-way ticket efficiency for Odongdo-combined itinerary; 자산→돌산 requires round-trip or additional transport to achieve same outcome |
| Claim Type | OPERATIONAL_FACT |
| Stability Classification | SEMI_STABLE (ticket policy could change) |
| Corroboration Links | EI-REL-005-A |
| Source of Supporting Facts | ER-REL-002 (one-way/round-trip ticket options confirmed) |
| Conflict Status | CLEAR |

---

### Exception Items

**EXC-REL-005-001: Traveler starting from Dolsan side (e.g., hotel on Dolsan Island)**
- If traveler is already on Dolsan Island, 돌산 탑승 → 자산 하차 is naturally efficient (no extra transit needed)
- Direction preference holds but for a different reason

**EXC-REL-005-002: Traveler not combining with Odongdo**
- If cable car is the only activity (not combining with Odongdo), direction is itinerary-neutral
- Round-trip from either station is equally valid

**EXC-REL-005-003: Dolsan Island attractions as primary destination**
- If traveler's goal is Dolsan Island attractions (not Odongdo), 자산→돌산 direction with round-trip return is appropriate

---

## §8. Stability Classification

| Element | Class | Rationale |
|---------|-------|-----------|
| Station spatial positions | STABLE | Fixed geography |
| ~5 min walk 자산→오동도 | STABLE | Fixed geography |
| One-way ticket availability | SEMI_STABLE | Policy could change |
| Directional logic | STABLE | Derived from fixed geography |

---

## §9. Scope Boundary

**IN SCOPE (REL-005):** Direction selection judgment for cable car + Odongdo combined itinerary; exception conditions; one-way vs round-trip ticket implication

**OUT OF SCOPE:**
- Cable car pricing → REL-002/CC-002 scope
- Odongdo admission/hours → OD-001 scope
- Cable car capacity → CC-003 scope
- General cable car experience → CC-001, CC-002, CC-003 scope
- Hyangiram direction → separate (no cable car REL counterpart)

---

## §10. Stop Condition Evaluation: EXPERT_JUDGMENT_SUFFICIENT

**Requirements for EXPERT_JUDGMENT_SUFFICIENT:**
- Fact base established at required dependency ERs ✓ (REL-001 + REL-002 both VERIFIED_FOR_PREPARATION)
- Judgment synthesized from verified facts (not fabricated) ✓
- Preferred source role achieved: FOUNDER synthesis ✓
- Exception conditions documented ✓
- No material conflict between fact base and judgment ✓

**Checklist:**
1. Geographic spatial positioning established (자산역 near Odongdo)? YES — REL-001 ✓
2. Ticket policy (one-way viable)? YES — REL-002 ✓
3. Walking time confirmed (~5 min 자산→Odongdo)? YES — Travel Time Matrix V0.1 ✓
4. Exception conditions documented? YES — EXC-REL-005-001 through -003 ✓
5. Directional logic is non-speculative (derived from geography)? YES ✓
6. No WE source conflict with judgment? CONFIRMED (no contradicting WE accounts found) ✓

**STOP CONDITION: PASS**

---

## §11. REL-006 Dependency Unlock

Per Matrix V0.1 and Collection Plan:
- ER-REL-006 dependency: ER-REL-005 VERIFIED_FOR_PREPARATION
- Status after this cycle: REL-005 = VERIFIED_FOR_PREPARATION
- **REL-006 transitions: READY_FOR_COLLECTION**

Note: REL-006 collection is NOT authorized in this session (Wave 4b scope is deferred per directive). The transition is recorded for the next authorized cycle.

---

## §12. Final Status

**ER-REL-005: VERIFIED_FOR_PREPARATION**

Wave 0 gap register update: REL-005 CONTEXT_ONLY → CLOSED (VERIFIED_FOR_PREPARATION)  
Cycle: 22  
Downstream: REL-006 transitions to READY_FOR_COLLECTION

---

## §13. Judgment Ingredient (not FINAL ANSWER)

For MT-1/C-1/C-2 SOUL use:
- JUDGMENT_INGREDIENT: "For travelers combining 여수해상케이블카 + 오동도: board at 돌산역 and exit at 자산역. From 자산역, Odongdo entrance is ~5 min walk. This enables one-way ticket use with continuous directional flow. Reverse direction (자산→돌산) creates backtracking or extra cost to reach Odongdo."
- EXCEPTION: If traveler is not combining with Odongdo or is starting from Dolsan Island, direction is itinerary-neutral or context-specific.
- CAVEAT: One-way ticket policy should be confirmed as still valid before pilot.

**FINAL ANSWER: PROHIBITED**

---

*Cycle 22 | Wave 4a Phase 4-β | 2026-09-28 | Branch: staging/storybook-c7a*
