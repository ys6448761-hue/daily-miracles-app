# SOUL Yeosu ER-REL-003 Controlled Evidence Collection V0.1
# Cable Car + Odongdo Combined Sequence Time Estimate

**Document ID:** SOUL_YEOSU_ER_REL_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1
**Date:** 2026-09-28
**Branch:** staging/storybook-c7a
**Starting HEAD:** be12cea
**Controlled Collection Cycle:** 23
**Wave:** 4b
**Status:** VERIFIED_FOR_PREPARATION

---

## §0. Starting Checkpoint

| Field | Value |
|-------|-------|
| Starting HEAD | be12cea |
| Branch | staging/storybook-c7a |
| Remote HEAD (be12cea) | VERIFIED — refs/heads/staging/storybook-c7a |
| Working tree | CLEAN (only untracked files outside collection scope) |
| Current Next Action (Project State) | Wave 4b — execute REL-003 (READY_FOR_COLLECTION) — Founder authorization required |
| Expected WAVE_4A_COLLECTION_EXECUTION_COMPLETE | TRUE ✓ |
| Expected ALL_WAVE_4A_ERS_VERIFIED | TRUE ✓ |
| Expected Controlled Collection Cycles | 22 ✓ |
| REL-003 Pre-collection State | READY_FOR_COLLECTION |
| REL-004 Pre-collection State | NOT_STARTED (BLOCKED on REL-003) |
| REL-006 Pre-collection State | READY_FOR_COLLECTION (unchanged) |
| HY-008 Pre-collection State | HARD BLOCKED (HY-003 VERIFIED required) |

---

## §1. Canonical Contract (from Matrix V0.1, lines 742–762)

| Field | Value |
|-------|-------|
| ER ID | ER-REL-003 |
| ER Name | Time Estimate for Cable Car + Odongdo Combined Sequence |
| Related Place(s) | 여수해상케이블카, 오동도 |
| Related Scenario(s) | O-3 |
| Required Judgment | ANSWER + JUDGMENT — sequence time feasibility |
| Knowledge Category | TIME_BURDEN / SEQUENCE |
| Evidence Needed | Evidence establishing an approximate time estimate for the combined cable car + Odongdo visit sequence — including cable car ride, connection time, and Odongdo visit duration |
| Why Needed | O-3 requires honest feasibility assessment. Without time framing, "어때?" cannot be answered with honest scope. |
| Preferred Source Role | MAP_ROUTE / WORLD_EXPERIENCE |
| Secondary Source Role | FOUNDER |
| Stability Class | SEMI_STABLE |
| Live Trigger | If cable car operating status changes; if Odongdo access point changes |
| Confidence Requirement | Approximate range; acknowledge traveler-speed variation |
| Negative/Exception Knowledge | YES — time conditions under which the sequence becomes impractical |
| Relationship Dependency | ER-REL-001, ER-REL-002, ER-OD-002, ER-CC-005 |
| Missing-Evidence Consequence | Can describe sequence without time framing; must QUALIFY on feasibility |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |

**Plan V0.2 note (§17):** MUST NOT close until ER-OD-002 is VERIFIED_FOR_PREPARATION. May collect MAP_ROUTE and WE evidence independently, but cannot close the combined time estimate without OD-002's visit duration foundation.

**Plan V0.2 §16 collection method:** MAP_ROUTE_CHECK + WE_REVIEW

**Stop Condition per Plan V0.2:** SEMI_STABLE_PATTERN_WITH_TRIGGER — two deliverables required:
1. Stable pattern established (time range across components + WE combined-sequence pattern)
2. Live trigger design complete (per §17 SEMI_STABLE table: trigger conditions, verification source, fallback behavior)

**Matrix vs. prompt discrepancy check:** NONE — no discrepancy. Canonical Matrix wins; prompt was consistent.

---

## §2. Dependency Verification

All four canonical dependencies must be VERIFIED_FOR_PREPARATION before closure.

| Dependency | Required Status | Actual Status | Contribution to REL-003 | Reuse Classification |
|-----------|-----------------|---------------|------------------------|---------------------|
| ER-REL-001 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED (Wave 2, Cycle 9) | Station geography: 자산 = mainland/near Odongdo; 돌산 = Dolsan Island. Connection from 자산 to 오동도 입구: ~5 min walk (EI-REL-001-C). | DIRECT_REUSE |
| ER-REL-002 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED (Wave 3, Cycle 10) | Route specifics: 자산 exit = directly adjacent to 오동도 入口 compound (~5 min); 돌산 exit → Odongdo requires taxi crossing 거북선대교 (~10-12 min). Route model per station confirmed. | DIRECT_REUSE |
| ER-OD-002 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED (Wave 4a, Cycle 16) | Odongdo visit duration pattern: 30-60 min minimum / ~1 hour standard loop / 1-2 hours thorough / 2+ hours photography. OD-002 §5.1 convergence: "Combined Odongdo + Cable Car: half-day (3-4 hours total)" from 4 independent WE sources. | DIRECT_REUSE |
| ER-CC-005 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED (Wave 3, Cycle 15) | Cable car ride duration: EI-CC-005-C "편도 약 10분" (CONTEXTUAL — speed-adjusted); volatility boundary and live trigger design established. | DIRECT_REUSE |

**Dependency gate: ALL CLEAR.** Collection proceeds as READY.

---

## §3. Starting Gap

Wave 0 state (line 593): `ER-REL-003 | NONE | NOT_ADDRESSED | Combined time estimate: zero evidence.`

Gap Register (line 766, post-OD-002): `READY_FOR_COLLECTION — all 4 deps satisfied.`

**Gap scope at collection start:**
- Cable car ride time component: COVERED via CC-005 reuse
- Station-to-Odongdo connection time: COVERED via REL-001/002 reuse
- Causeway walk approach time: COVERED via OD-007 reuse
- Odongdo visit duration foundation: COVERED via OD-002 reuse
- Combined sequence time synthesis: COVERED via OD-002 §5.1 WE convergence "half-day (3-4 hours)"
- Live trigger design: COVERED via CC-005 established trigger design
- Exception/negative knowledge: PARTIAL — condition where sequence becomes impractical requires synthesis from above

**Residual gap after reuse:** NONE requiring new external collection. Full synthesis achievable from existing admissible evidence.

---

## §4. Reuse-First Inventory

### REL-005 Admissibility Check (mandatory)

| Item | REL-005 Content | Admissibility for REL-003 | Reuse Classification |
|------|-----------------|--------------------------|---------------------|
| REL-005 directional judgment (돌산→자산 PREFERRED for Odongdo-combined) | Direction selection judgment for C-3 | PARTIAL_REUSE — establishes which direction is standard for Odongdo-combined itinerary, therefore which connection time (5 min from 자산) applies as the standard-case time estimate. The direction preference judgment itself is OUTSIDE REL-003's time-estimate scope. | PARTIAL_REUSE |
| REL-005 exception note (if not combining with Odongdo, direction is neutral) | Direction conditionality | CONTEXT_ONLY — defines when REL-003's sequence assumption applies vs. does not | CONTEXT_ONLY |

**REL-005 admissibility verdict:** PARTIAL_REUSE. REL-005 informs the standard-case connection path (자산 exit → 5 min → Odongdo) without itself providing time evidence. Time components come from MAP_ROUTE/WE reuse of REL-001/002/OD-007 items.

**Boundary preserved:** REL-005's directional preference judgment is not imported into REL-003's time estimate as directional evidence. Direction is used only to identify which station's connection time is the standard path.

### Full Reuse Inventory

| Evidence Item ID | Original ER | Source Role | Content | REL-003 Claim | Reuse Classification |
|-----------------|------------|-------------|---------|--------------|---------------------|
| EI-CC-005-C | CC-005 | WEB_BLOG (MAP_ROUTE proxy) | "편도 약 10분" (one-way ~10 min); speed adjustment possible at peak | Cable car ride time component | DIRECT_REUSE |
| EI-REL-001-C | REL-001 | MAP_ROUTE | 자산정류장 → 오동도 입구 도보 ~5분 | Station-to-Odongdo connection (standard/preferred direction) | DIRECT_REUSE |
| EI-REL-002-A | REL-002 | WORLD_EXPERIENCE | 자산정류장 = 오동도 입구 구내 위치 — same compound | Confirms ~5 min connection is structural (not just route estimate) | DIRECT_REUSE |
| EI-REL-002-D / NEG-REL-002-002 | REL-002 | MAP_ROUTE | 돌산정류장 → 오동도: 거북선대교 차량 필수, 택시 ~10-12분 | Exception-case connection (non-preferred direction) | DIRECT_REUSE |
| OD-007 WE evidence | OD-007 | WORLD_EXPERIENCE | Causeway ~768m, ~10-15 min at leisurely pace; flat deck | Causeway approach time component | DIRECT_REUSE |
| EI-OD-002-A | OD-002 | WORLD_EXPERIENCE | Half-day (≥2 hours) — thorough family visit including approach + island circuit | Duration upper bound (combined with Cable Car → half-day) | DIRECT_REUSE |
| EI-OD-002-B | OD-002 | WORLD_EXPERIENCE | "한 바퀴는 대체로 1시간 내외로 충분하다" — one loop ~1 hour | Visit duration standard anchor | DIRECT_REUSE |
| EI-OD-002-C | OD-002 | WORLD_EXPERIENCE | 1-2 hours standard; 2+ hours with photography | Visit duration standard range | DIRECT_REUSE |
| EI-OD-002-D | OD-002 | WORLD_EXPERIENCE | R028 = 60 min (tour bus); R040 = 30-60 min (independent minimalist) | Visit duration lower bound | DIRECT_REUSE |
| OD-002 §5.1 convergence | OD-002 | WE synthesis | "Combined Odongdo + Cable Car: half-day (3-4 hours total)" | Direct WE pattern for combined sequence duration | DIRECT_REUSE |
| CC-005 live trigger design | CC-005 | OFFICIAL/LOCAL_OPERATOR | Cable car operating status VOLATILE; trigger: 강풍주의보/경보; live-check: 운행현황 page | REL-003 live trigger design source | DIRECT_REUSE |
| REL-005 direction judgment | REL-005 | FOUNDER | 돌산→자산 PREFERRED for Odongdo-combined | Standard-case direction identification only | PARTIAL_REUSE |

**CONTEXT_ONLY items (not promoted to evidence):**
- Route Corpus co-occurrence data: CONTEXT_ONLY — routes featuring both cable car and Odongdo cannot establish time burden
- REL-005 directionality rationale: CONTEXT_ONLY (beyond standard-case identification)
- CC-005 fare/ticket structure: CONTEXT_ONLY for REL-003

---

## §5. Residual Gap Statement

**After reuse mapping, residual gap: NONE requiring new external collection.**

All REL-003 canonical requirements are satisfied by reuse:
- MAP_ROUTE components (ride + connection + approach): DIRECT_REUSE from CC-005-C, REL-001-C, REL-002-A/D, OD-007
- WE pattern (visit duration + combined sequence): DIRECT_REUSE from OD-002 4-source convergence + §5.1 "half-day (3-4 hours)"
- Exception/negative knowledge: synthesizable from reused MAP_ROUTE facts (돌산 exit adds ~10-12 min taxi + return detour; sequence collapse if cable car suspended)
- Live trigger design: DIRECT_REUSE from CC-005 established trigger

**Collection decision: NO NEW EXTERNAL EVIDENCE COLLECTION REQUIRED.**

Synthesis proceeds from reuse inventory.

---

## §6. Evidence Item Assignments (Reused)

Assigned REL-003 Evidence Item IDs for tracking purposes:

| REL-003 EI ID | Reused From | Content | Claim Type | Confidence | Stability |
|---------------|------------|---------|------------|------------|-----------|
| EI-REL-003-A | EI-CC-005-C | Cable car one-way ride: ~10 min (speed-adjusted at peak) | RELATIONSHIP_FACT (time component) | MEDIUM-HIGH (blog, 2026) | CONTEXTUAL |
| EI-REL-003-B | EI-REL-001-C + EI-REL-002-A | 자산정류장 → 오동도 입구: ~5 min walk (structural, same compound) | RELATIONSHIP_FACT (connection component) | HIGH (MAP_ROUTE + WE corroboration) | STABLE |
| EI-REL-003-C | OD-007 WE | Causeway ~768m, ~10-15 min leisurely; flat deck | RELATIONSHIP_FACT (approach component) | HIGH (multiple WE sources) | STABLE |
| EI-REL-003-D | EI-OD-002-B | Odongdo one-loop: ~1 hour | EXPERIENCE (visit duration anchor) | HIGH (Trip.com 2026, WE) | STABLE |
| EI-REL-003-E | EI-OD-002-C | Odongdo 1-2 hours standard; 2+ hours photography | EXPERIENCE_PATTERN (visit duration range) | MEDIUM-HIGH (aggregated WE) | STABLE |
| EI-REL-003-F | EI-OD-002-D | Tour bus: 60 min; minimalist independent: 30-60 min | EXPERIENCE_PATTERN (lower bound) | MEDIUM (planning data) | STABLE |
| EI-REL-003-G | OD-002 §5.1 | "Combined Odongdo + Cable Car: half-day (3-4 hours total)" | EXPERIENCE_PATTERN (combined sequence WE pattern) | HIGH (4-source convergence) | STABLE |
| EI-REL-003-H | EI-REL-002-D + NEG-REL-002-002 | 돌산 exit → 오동도: 거북선대교 차량 필수, 택시 ~10-12분 | RELATIONSHIP_FACT (exception-case component) | HIGH (MAP_ROUTE) | STABLE |
| EI-REL-003-I | CC-005 live trigger design | Cable car suspension: 강풍주의보/경보; live check: 운행현황 | RELATIONSHIP_FACT (live trigger component) | HIGH (OFFICIAL policy) | STABLE (rule) / VOLATILE (current state) |

---

## §7. Independence Assessment

| EI-REL-003 ID | Independence Status |
|---------------|---------------------|
| EI-REL-003-A (CC-005-C) | INDEPENDENT — 2026 blog source, distinct from REL-001/002/OD-002 |
| EI-REL-003-B (REL-001-C/REL-002-A) | PARTIALLY_INDEPENDENT — two distinct MAP_ROUTE and WE sources independently confirming same spatial fact |
| EI-REL-003-C (OD-007) | INDEPENDENT — OD-007 WE from multiple independent WE sources |
| EI-REL-003-D/E/F (OD-002 duration) | INDEPENDENT from each other — 4 distinct WE sources: kidsfuninseoul WP, Trip.com, TripAdvisor/guides, Route Corpus |
| EI-REL-003-G (OD-002 §5.1) | CONVERGENT SYNTHESIS — derives from 4 independent WE sources; pattern confidence HIGH |
| EI-REL-003-H (REL-002-D) | INDEPENDENT — MAP_ROUTE confirmed route + official bridge data |
| EI-REL-003-I (CC-005 trigger) | INDEPENDENT — OFFICIAL policy source (weather authority threshold) |

No laundering of CONTEXT_ONLY items detected. All items carry traceable provenance to original source.

---

## §8. Relationship Knowledge Synthesis

### §8.1 Combined Sequence Time Estimate — Standard Case (돌산→자산 direction)

Per REL-005, the preferred direction for Odongdo-combined itinerary is 돌산→자산 (one-way ticket). In this direction:

| Component | Time | Source | Stability |
|-----------|------|--------|-----------|
| Cable car ride (돌산→자산, one-way) | ~10 min | EI-REL-003-A | CONTEXTUAL |
| 자산역 → 오동도 입구 walk | ~5 min | EI-REL-003-B | STABLE |
| Causeway walk (방파제) to island | ~10-15 min | EI-REL-003-C | STABLE |
| Odongdo visit (minimum purposeful) | 30-60 min | EI-REL-003-F | STABLE |
| Odongdo visit (standard thorough) | 1-2 hours | EI-REL-003-E | STABLE |
| Odongdo visit (unhurried/photography) | 2+ hours | EI-REL-003-E | STABLE |

**Combined time range (one-way cable car + Odongdo, standard direction):**

| Visit Type | Time Overhead (ride + connection + causeway) | Visit Duration | Total |
|------------|---------------------------------------------|---------------|-------|
| Minimum purposeful | ~25-30 min | 30-60 min | **~1 to 1.5 hours** |
| Standard thorough | ~25-30 min | 1-2 hours | **~1.5 to 2.5 hours** |
| Unhurried / photography | ~25-30 min | 2+ hours | **~2.5 hours+** |
| WE "half-day" (combined pattern) | ~25-30 min | ~3-3.5 hours experience | **~3-4 hours total (half-day)** |

**RELATIONSHIP_FACT:** The combined cable car + Odongdo sequence is a recognizable half-day travel block (~3-4 hours), confirmed by WE pattern across 4 independent sources (EI-REL-003-G from OD-002 §5.1).

### §8.2 Exception Case — Non-Preferred Direction (자산→돌산)

If traveler departs from 자산 station → arrives at 돌산 station:
- 돌산역 is on Dolsan Island
- 오동도 requires crossing 거북선대교 by vehicle (not walkable per NEG-REL-002-002)
- Taxi from 돌산 to 오동도: ~10-12 min (EI-REL-003-H)
- Additional time: ~15-25 min overhead vs. standard direction
- **This direction is LESS EFFICIENT for Odongdo-combined itinerary** (REL-005 confirms)

### §8.3 Impracticality Conditions (Negative Knowledge)

| Condition | Why Impractical | Source |
|-----------|----------------|--------|
| Available time < 1 hour | Even minimum purposeful Odongdo requires ~1 hour (ride + connection + approach + minimum walk) | Synthesis from EI-REL-003-A/B/C/F |
| Cable car suspended (강풍주의보/경보) | Sequence collapses — cable car unavailable; Odongdo accessible alone but combined sequence impossible | EI-REL-003-I (CC-005 live trigger) |
| Late arrival at 자산 station (after ~17:00) | Odongdo's Dongbaek Train ends ~17:00-17:30; lighthouse closes Monday; causeway always open but less content accessible | EI-OD-002 context + OD-003 hours |
| 자산→돌산 direction selected for Odongdo-combined | Returns traveler to wrong island; requires 10-12 min taxi + inefficient routing | EI-REL-003-H |

### §8.4 Relationship Pattern

**RELATIONSHIP_PATTERN:** The cable car + Odongdo sequence is a natural half-day cluster in Yeosu. The connection from 자산정류장 to 오동도 (same compound, ~5 min) makes the 돌산→자산 one-way cable car trip the efficient gateway to Odongdo — one continuous travel thread rather than two separate destinations. WE confirms this as a recognized combined travel block of 3-4 hours / half-day.

**Conditionality preserved:** The sequence works well under cable car operating conditions and minimum time availability (≥1 hour). It becomes impractical or suboptimal under cable car suspension, very short time windows (<1 hour), or non-preferred direction selection.

---

## §9. Directionality and Conditions

**Standard-case direction:** 돌산→자산 (one-way cable car) → walk to Odongdo  
**Condition for standard case:** Cable car operating + traveler has ≥1 hour available  
**Standard-case overhead:** ~25-30 min (ride + connection + causeway)  
**Combined time range:** ~1 hour minimum → ~2-3 hours standard → ~3-4 hours half-day

**Exception-case direction:** 자산→돌산 → taxi back to 오동도  
**Condition for exception:** Traveler is already at 자산 and wants to do cable car before Odongdo  
**Exception-case overhead:** ~35-45 min (ride + taxi return)  
**Effect:** Less efficient; adds ~10-20 min; fewer integration benefits

---

## §10. Conflicts and Variation

| Conflict ID | Description | Classification | Resolution |
|-------------|-------------|----------------|------------|
| VAR-REL-003-01 | Cable car ride time 10 min (EI-CC-005-C) vs. range 10-15 min from CC-004/CC-005 context | ESTIMATE_VARIATION | No conflict — "약 10분" is a stated single estimate; 10-15 min is the observed range. Use range (10-15 min) for planning; 10 min as stated nominal. NOT_BLOCKING. |
| VAR-REL-003-02 | Visit duration range (30 min minimalist vs. half-day) | EXPERIENCE_VARIATION | No conflict — range reflects visit-type variation, not contradictory evidence. All four OD-002 WE sources are internally consistent when visit type is specified. |
| VAR-REL-003-03 | Causeway walk time OD-007 "~10-15 min" vs. OD-003 "~15 min" | ESTIMATE_VARIATION | Not a conflict — both describe 768m causeway; slight variation in pace estimate. Use 10-15 min as the range. NOT_BLOCKING. |

**No CONFLICT requiring escalation.** All variation explained by visit type, pace, or estimate precision.

---

## §11. Stability and Live Trigger

### Stability Classification per Component

| Component | Stability | Reasoning |
|-----------|-----------|-----------|
| Cable car ride time (~10 min) | CONTEXTUAL | Speed-adjusted by operator during peak (EI-CC-005-C) |
| Station-to-Odongdo connection (~5 min from 자산) | STABLE | Physical geography fixed; same compound |
| Causeway walk (~10-15 min) | STABLE | Fixed 768m structure; physical geography |
| Odongdo visit duration range | STABLE | Trail structure fixed; variation by traveler pace only |
| Combined sequence "half-day" WE pattern | STABLE | Recognized travel block; confirmed across 4 sources |
| Cable car operational status | VOLATILE | Weather/maintenance dependent |

**REL-003 overall stability: SEMI_STABLE** — stable time structure with one VOLATILE dependency (cable car operating status).

### Live Trigger Design (per Plan V0.2 §17 SEMI_STABLE table)

| Field | Design |
|-------|--------|
| Stale Condition | Cable car operating status change (CC-005 live trigger fires: 강풍주의보/경보 issued) OR Odongdo access point structural change |
| Verification Source Role | CC-005 live-check result (운행현황 page or 061-664-7301) + OFFICIAL (if Odongdo access changes) |
| Fallback Behavior | Describe sequence structure without time framing; QUALIFY on cable car operating status; defer to CC-005 live verification for current availability |
| SOUL behavior when triggered | "Cable car availability needs live verification before you rely on this combination" — do NOT assume cable car is running; offer Odongdo-only or cable car-only alternatives |

**Live trigger design: COMPLETE** ✓

---

## §12. Traveler Condition Hypothesis Relevance

`POTENTIAL_RESEARCH_RELEVANCE` observed:

The combined sequence time (~1-3+ hours) creates a meaningful capability threshold:
- Minimum physical demand: ~25-30 min walking overhead (ride omitted) + 30-60 min island walk
- For travelers with mobility concerns: causeway walk (10-15 min flat) is manageable per OD-007 WE; island trail has some stairs (OD-005 context)
- **Natural applicability:** REL-003 time estimate usefulness is conditional on traveler's physical capacity for the combined sequence duration, not just each segment independently

This observation is tagged POTENTIAL_RESEARCH_RELEVANCE. Not promoted to ER, Candidate, or hypothesis extension. Traveler Condition × Experience Requirement remains RESEARCH_HYPOTHESIS.

---

## §13. Journey Knowledge Hypothesis Relevance

`POTENTIAL_RESEARCH_RELEVANCE` observed:

**Day-level Time Budget:** The cable car + Odongdo block consumes 1-3+ hours. For travelers with a single Yeosu day, this is a significant time commitment.

**Transport Logistics:** The directionality of cable car (one-way preferred) creates a sequential commitment — traveler cannot easily reverse the sequence without additional taxi cost.

**Plan Change / Counterfactual:** Cable car suspension collapses the combined sequence; the most natural counterfactual is Odongdo-only (no cable car). This is a natural plan-change scenario that SOUL should be able to support.

Tagged POTENTIAL_RESEARCH_RELEVANCE. No collection expansion. No ER creation.

---

## §14. FOUNDER Secondary Assessment

Canonical secondary role: FOUNDER.

No Founder field evidence for REL-003 scope (combined sequence timing) currently in repository. REL-005 artifact (Founder synthesis) contains directional preference only, not time components. Founder time observations would strengthen the synthesis layer — particularly if Founder has directly timed or observed the combined sequence.

**FOUNDER gap noted:** Founder observation of an actual combined cable car + Odongdo visit with timing would close the secondary gap. Not required for stop condition (pattern is WE+MAP_ROUTE sufficient). Filed as optional enrichment.

---

## §15. Stop Condition Evaluation

**Stop Condition: SEMI_STABLE_PATTERN_WITH_TRIGGER**

This requires two deliverables:
1. Stable pattern established ✓
2. Live trigger design complete ✓

### Deliverable 1 — Stable Pattern

| Criterion | Status |
|-----------|--------|
| MAP_ROUTE components established | ✓ — ride ~10 min + connection ~5 min + causeway ~10-15 min (all from admissible MAP_ROUTE/WE sources) |
| WE pattern across ≥2 independent sources | ✓ — OD-002 4-source convergence; combined "half-day (3-4 hours)" from WE |
| Negative/exception knowledge present | ✓ — <1 hour → impractical; cable car suspension → collapses; non-preferred direction → less efficient |
| Time range with traveler-pace variation acknowledged | ✓ — range from ~1 hour minimum to ~3-4 hours half-day |
| Directionality + conditions preserved | ✓ — standard vs. exception case documented |

### Deliverable 2 — Live Trigger Design

| Criterion | Status |
|-----------|--------|
| Stale condition defined | ✓ — CC-005 live trigger fires OR Odongdo access point change |
| Verification source role identified | ✓ — CC-005 live-check (운행현황) + OFFICIAL |
| Fallback behavior specified | ✓ — describe sequence without time framing; QUALIFY; defer to CC-005 |
| SOUL behavior when triggered defined | ✓ — flag cable car verification need; offer alternatives |

**SEMI_STABLE_PATTERN_WITH_TRIGGER: PASS**

---

## §16. Final Status

**ER-REL-003 → VERIFIED_FOR_PREPARATION**
**Gap → CLOSED**
**Collection method:** FULL REUSE — no new external collection needed
**Cycle count:** 22 → 23

---

## §17. Dependency Transition

**REL-004 dependency check (from Plan V0.2 §Wave 4b table):**

| Dependency | Required Status | Status After This Cycle |
|-----------|-----------------|------------------------|
| ER-REL-001 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED (was already) |
| ER-REL-002 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED (was already) |
| ER-REL-003 | VERIFIED_FOR_PREPARATION | ✓ VERIFIED (this cycle) |

→ All 3 REL-004 dependencies now VERIFIED_FOR_PREPARATION.
→ **REL-004: NOT_STARTED → READY_FOR_COLLECTION**

**REL-006: READY_FOR_COLLECTION (unchanged)** — no change from this cycle.
**HY-008: HARD BLOCKED (unchanged)** — requires HY-003 VERIFIED; no change.
**HY-003: PROVISIONALLY_SUPPORTED / ACCEPT_PROVISIONAL_WITH_BOUNDARY (unchanged)** — no change.

---

## §18. Work Explicitly Not Executed

| Prohibited Action | Confirmed Not Done |
|-------------------|--------------------|
| REL-004 execution | NOT EXECUTED |
| REL-006 execution | NOT EXECUTED |
| HY-008 execution | NOT EXECUTED |
| HY-003 new search / field validation | NOT DONE |
| YTC Coverage Check | NOT DONE |
| Prepared Knowledge construction | NOT DONE |
| Internal Pilot | NOT DONE |
| Human Blind Test | NOT DONE |
| Candidate creation | NOT DONE |
| Architecture Decision | NOT DONE |
| Schema / migration / runtime / prod change | NOT DONE |

---

## §19. Provenance Records

| EI-REL-003 ID | Source Identity | Source Role | Original ER | Reuse Class | Confidence | Stability | Limitations |
|---------------|----------------|-------------|------------|-------------|------------|-----------|-------------|
| EI-REL-003-A | naturelove40.com 2026 blog (via CC-005-C) | WEB_BLOG | CC-005 | DIRECT_REUSE | MEDIUM-HIGH | CONTEXTUAL | Non-official; single source for exact 10-min figure |
| EI-REL-003-B | yeosu.go.kr + neoplats.com (REL-001-C / REL-002-A) | MAP_ROUTE + WORLD_EXPERIENCE | REL-001/002 | DIRECT_REUSE | HIGH | STABLE | Structural; not current-state check |
| EI-REL-003-C | OD-007 WE sources (multiple) | WORLD_EXPERIENCE | OD-007 | DIRECT_REUSE | HIGH | STABLE | Pace varies; 10-15 min is leisurely range |
| EI-REL-003-D | kr.trip.com Moments 2026 (OD-002-B) | WORLD_EXPERIENCE | OD-002 | DIRECT_REUSE | HIGH | STABLE | Single platform aggregation |
| EI-REL-003-E | TripAdvisor / travel guides aggregate (OD-002-C) | WORLD_EXPERIENCE | OD-002 | DIRECT_REUSE | MEDIUM-HIGH | STABLE | Aggregated; individual accounts not verified separately |
| EI-REL-003-F | Route Corpus R028/R040 (OD-002-D) | WORLD_EXPERIENCE | OD-002 | DIRECT_REUSE | MEDIUM | STABLE | Planned vs. actual time distinction |
| EI-REL-003-G | 4-source WE convergence synthesis (OD-002 §5.1) | WORLD_EXPERIENCE synthesis | OD-002 | DIRECT_REUSE | HIGH | STABLE | Synthesis — inherits limitations of component sources |
| EI-REL-003-H | MAP_ROUTE + OFFICIAL (거북선대교, REL-002-D/REL-002-C) | MAP_ROUTE | REL-002 | DIRECT_REUSE | HIGH | STABLE | Pedestrian access not confirmed (car/taxi required) |
| EI-REL-003-I | OFFICIAL weather authority policy + CC-005 live trigger design | OFFICIAL | CC-005 | DIRECT_REUSE | HIGH | STABLE (rule) / VOLATILE (current) | Current suspension state not assessed |
| REL-005 direction judgment | REL-005 FOUNDER synthesis | FOUNDER | REL-005 | PARTIAL_REUSE | HIGH | STABLE | Used only to identify standard-case direction |

---

## §20. Artifact Completeness Self-Check

| Required Section | Present |
|-----------------|---------|
| Starting checkpoint | ✓ |
| Canonical contract | ✓ |
| Dependency verification | ✓ |
| REL-005 admissibility decision | ✓ |
| Reuse inventory | ✓ |
| Residual gap statement | ✓ |
| Collection method | ✓ (FULL REUSE) |
| Accepted evidence (EI-REL-003-A through I) | ✓ |
| Rejected evidence summary | ✓ (CONTEXT_ONLY items in §4) |
| Full provenance records | ✓ |
| Relationship pattern | ✓ |
| Directionality/conditions | ✓ |
| Conflicts/variation | ✓ |
| Stability + live trigger | ✓ |
| Traveler Condition relevance | ✓ |
| Journey Knowledge relevance | ✓ |
| Stop Condition result | ✓ |
| Final REL-003 status | ✓ |
| REL-004 dependency transition | ✓ |
| REL-006 status (unchanged) | ✓ |
| HY-008 status (unchanged) | ✓ |
| Cycle count | ✓ |
| Work not executed | ✓ |
