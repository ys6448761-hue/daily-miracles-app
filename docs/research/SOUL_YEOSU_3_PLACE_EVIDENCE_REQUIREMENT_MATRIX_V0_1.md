# SOUL Yeosu 3-Place
# Evidence Requirement Matrix V0.1

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Base Checkpoint:** a7cdaae
**Status:** EVIDENCE REQUIREMENT DESIGN — NOT COLLECTED

**Protocol basis:**
`docs/research/SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_2.md`

This document defines evidence requirements only.
No actual Yeosu knowledge is collected here.
All evidence slots are NOT_COLLECTED.
No pilot is executed.
No Candidate is created.

---

## 1. Purpose

This matrix answers:

> **"What evidence must Phoenix possess before it can make the judgments required by the frozen 3-place pilot scenarios?"**

It does NOT answer:

> "What are the actual facts about these places?"

Every entry defines an empty evidence slot with traceability to a scenario, judgment, and knowledge need.

The matrix makes evidence requirements explicit, orderable, and collection-plan ready.

---

## 2. Scope and Non-Goals

**In scope:**
- 오동도 (odongdo)
- 향일암 (hyangiram)
- 여수해상케이블카 (cablecar)
- 9 Core Scenarios: O-1, O-2, O-3, H-1, H-2, H-3, C-1, C-2, C-3
- MT-1 Multi-Turn Context Variant
- Relationship evidence for O-3 and C-3
- Generic Hidden Transfer evidence requirements (actual items not generated)

**Not in scope:**
- Other Yeosu places
- Actual Yeosu facts, route data, operating hours, parking prices, or descriptions
- Hidden Transfer questions (not generated yet)
- SOUL answers
- A/B model comparison (not yet executed)

---

## 3. Gate A Closure Result

| Correction | Status |
|---|---|
| C1 — Preparation Boundary operationalization | CLOSED |
| C2 — Preparation Reuse Ledger | CLOSED |
| C3 — Context Availability Rule | CLOSED |
| C4 — Hidden Transfer NEAR/FARTHER + leakage | CLOSED |
| C5 — Single/Multi-turn consistency | CLOSED |

**Gate A Verdict: PASS**

All five corrections are substantively closed in Protocol V0.2.
Evidence Requirement Matrix design proceeds.

---

## 4. Reverse-Design Method Applied

For each Core Scenario, the following chain is traced:

```
Desired Answer Properties (from Protocol §G)
→ Required Judgment (ANSWER / JUDGMENT / ASK / LIVE_VERIFY)
→ Required Knowledge Category (what must be known)
→ Required Evidence (what source knowledge must exist)
```

No actual Yeosu content appears in any step.
Desired Answer Properties remain structural qualities only — not reference answers.

Evidence Requirements are traceable back to:
- Scenario ID
- Required Judgment type
- Required Knowledge Category

No orphan evidence slots exist.

---

## 5. Evidence Requirement Schema

Each Evidence Requirement contains:

| Field | Definition |
|---|---|
| **ID** | Stable design-only identifier (ER-OD-xxx / ER-HY-xxx / ER-CC-xxx / ER-REL-xxx / ER-CX-xxx) |
| **Related Place(s)** | Which place(s) this evidence applies to |
| **Related Scenario(s)** | Scenario IDs that depend on this evidence |
| **Required Judgment** | The judgment type this evidence enables |
| **Knowledge Category** | Knowledge type classification |
| **Evidence Needed** | Structural description of what must be established (no actual facts) |
| **Why Needed** | Traceability to scenario judgment need |
| **Preferred Source Role** | Primary source type best positioned to establish this |
| **Secondary Source Role** | Corroborating or verification source |
| **Stability Class** | STABLE / SEMI_STABLE / VOLATILE / CONTEXTUAL |
| **Live Trigger** | Condition requiring current verification (if applicable) |
| **Confidence Requirement** | Qualitative confidence level needed |
| **Negative/Exception Knowledge** | YES/NO — whether expert non-recommendation knowledge is required |
| **Relationship Dependency** | Whether this evidence depends on another ER |
| **Missing-Evidence Consequence** | What judgment becomes unavailable if missing |
| **Behavior if Missing** | ANSWER / QUALIFY / ASK / LIVE_VERIFY / UNKNOWN |
| **Collection Priority** | P0 / P1 / P2 |
| **Collection Status** | NOT_COLLECTED |

---

## 6. Source Role Definitions

| Role | Best for |
|---|---|
| **OFFICIAL** | Formal access rules, official operating rules, facilities, policies, restrictions, official closures |
| **MAP_ROUTE** | Spatial relationship, route geometry, travel connection, distance/direction/access structure |
| **WORLD_EXPERIENCE** | Experiential friction, how a visit feels in practice, recurring traveler experience patterns |
| **LOCAL_OPERATOR** | Field reality, operational friction, current/stale correction, local practical knowledge |
| **FOUNDER** | Contextual judgment, traveler-fit interpretation, local expert meaning, practical decision boundary |
| **LIVE** | Current volatile facts at answer time (cannot be collected in advance) |

Source Role ≠ Truth automatically. Every source is subject to the provenance and confidence requirements of the authoring framework.

---

## 7. Fact / Experience / Judgment Separation

Every Evidence Requirement distinguishes the layer it addresses:

**FACT REQUIREMENT**
What objectively needs to be established?
(access structure, station names, route geometry)

**EXPERIENCE REQUIREMENT**
What recurring practical/experiential pattern needs evidence?
(how the physical burden feels in practice, what travelers encounter)

**JUDGMENT REQUIREMENT**
What contextual decision will later be derived from facts + experience + traveler state?
(whether burden matters for THIS traveler's mobility, whether sequence is feasible given THIS traveler's time)

The third layer is derived during pilot execution from the first two.
It is NOT collected as an objective fact.

---

## 8. Stability / Live Model

| Class | Definition |
|---|---|
| **STABLE** | Usually slow-changing. Physical structures, geographical relationships, place identity. |
| **SEMI_STABLE** | May change operationally. Parking policies, access conditions, crowd patterns. Periodic refresh recommended. |
| **VOLATILE** | Requires current/live confirmation when material. Operating hours, current availability, real-time status. |
| **CONTEXTUAL** | Depends on traveler state — the underlying fact may be stable but its relevance is conditional. |

Refresh intervals are NOT assigned. Evidence collection timing is determined at collection plan stage, not here.

---

## 9. Evidence Requirement Matrix

### Odongdo Evidence Requirements

---

**ER-OD-001 — Odongdo Place Character and Identity**

| Field | Value |
|---|---|
| Related Place(s) | 오동도 |
| Related Scenario(s) | O-1 |
| Required Judgment | ANSWER — experiential description / place character |
| Knowledge Category | PLACE_BASIC / EXPERIENCE_VALUE |
| Evidence Needed | Evidence describing what kind of place Odongdo is experientially — what visitors typically encounter, what characterizes the visit, what honest scope looks like |
| Why Needed | O-1 requires an answer describing place character and honest scope without fabrication. This evidence is the foundation. |
| Preferred Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | OFFICIAL / FOUNDER |
| Stability Class | STABLE |
| Live Trigger | None for core character; seasonal variation may trigger SEMI_STABLE update |
| Confidence Requirement | Pattern-level confidence from multiple experience sources; single-source insufficient |
| Negative/Exception Knowledge | NO — general character question; no refusal case |
| Relationship Dependency | None |
| Missing-Evidence Consequence | Cannot provide specific experiential description; falls back to generic orientation only |
| Behavior if Missing | QUALIFY |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-OD-002 — Odongdo Visitor Experience Patterns**

| Field | Value |
|---|---|
| Related Place(s) | 오동도 |
| Related Scenario(s) | O-1, O-2 (context) |
| Required Judgment | ANSWER — visitor experience / time expectation |
| Knowledge Category | EXPERIENCE_VALUE |
| Evidence Needed | Evidence describing what travelers value at Odongdo, how long a typical visit takes, what physical scope the visit requires |
| Why Needed | O-1 requires honest time expectation and visitor experience characterization. Also provides context for O-2 judgment. |
| Preferred Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | FOUNDER |
| Stability Class | STABLE |
| Live Trigger | None |
| Confidence Requirement | Pattern-level across multiple visitor accounts |
| Negative/Exception Knowledge | NO |
| Relationship Dependency | ER-OD-001 |
| Missing-Evidence Consequence | Cannot provide time expectation or experiential orientation |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

**ER-OD-003 — Odongdo Vehicle Access Structure**

| Field | Value |
|---|---|
| Related Place(s) | 오동도 |
| Related Scenario(s) | O-2 |
| Required Judgment | ANSWER — vehicle access / honest friction disclosure |
| Knowledge Category | ACCESS / VEHICLE_ACCESS |
| Evidence Needed | Evidence establishing how vehicle access to or near Odongdo is structured — whether vehicles can approach, what restrictions exist, what the formal access structure is |
| Why Needed | O-2 requires honest vehicle access disclosure. Without this, the answer cannot be grounded. |
| Preferred Source Role | OFFICIAL |
| Secondary Source Role | LOCAL_OPERATOR / FOUNDER |
| Stability Class | SEMI_STABLE |
| Live Trigger | If current restrictions or access policy change materially |
| Confidence Requirement | Official or field-confirmed; not inferred from general knowledge |
| Negative/Exception Knowledge | YES — when vehicle access is prohibited or strongly discouraged |
| Relationship Dependency | None |
| Missing-Evidence Consequence | Cannot answer vehicle question without LIVE_VERIFY or QUALIFY |
| Behavior if Missing | LIVE_VERIFY |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-OD-004 — Odongdo Parking Evidence**

| Field | Value |
|---|---|
| Related Place(s) | 오동도 |
| Related Scenario(s) | O-2 |
| Required Judgment | ANSWER + potential LIVE_VERIFY — parking reality |
| Knowledge Category | PARKING |
| Evidence Needed | Evidence describing the parking situation near Odongdo — existence, structural friction, known capacity constraints, typical conditions |
| Why Needed | O-2 asks about driving with a child. Parking reality is a critical friction point. |
| Preferred Source Role | LOCAL_OPERATOR / FOUNDER |
| Secondary Source Role | WORLD_EXPERIENCE |
| Stability Class | SEMI_STABLE |
| Live Trigger | If current parking availability is material to the answer and availability is volatile |
| Confidence Requirement | Field-level confidence; official parking information may be stale |
| Negative/Exception Knowledge | YES — known congestion conditions, high-friction scenarios |
| Relationship Dependency | ER-OD-003 |
| Missing-Evidence Consequence | Must flag parking as LIVE_VERIFY; cannot provide specific parking guidance |
| Behavior if Missing | LIVE_VERIFY |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-OD-005 — Odongdo Child Suitability**

| Field | Value |
|---|---|
| Related Place(s) | 오동도 |
| Related Scenario(s) | O-2, MT-1 (via O-2 intent) |
| Required Judgment | ANSWER — child-suitability / condition-aware |
| Knowledge Category | CHILD_CONTEXT / WALKING / PHYSICAL_BURDEN |
| Evidence Needed | Evidence describing what makes Odongdo suitable or challenging for families with children — terrain, walking demands, physical access, facilities |
| Why Needed | O-2 requires honest child-suitability disclosure. MT-1 Turn 2 reuses this via companion context. |
| Preferred Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | FOUNDER |
| Stability Class | STABLE |
| Live Trigger | None for physical structure; special event or seasonal closure could trigger |
| Confidence Requirement | Experiential pattern across multiple family-with-children accounts |
| Negative/Exception Knowledge | YES — conditions under which children face difficulty |
| Relationship Dependency | ER-OD-003, ER-OD-004 |
| Missing-Evidence Consequence | Cannot provide child-specific suitability; must QUALIFY |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

**ER-OD-006 — Odongdo Operating Hours / Seasonal Status**

| Field | Value |
|---|---|
| Related Place(s) | 오동도 |
| Related Scenario(s) | O-1 (live requirement), O-3 (operating alignment) |
| Required Judgment | LIVE_VERIFY trigger classification |
| Knowledge Category | OPERATING_INFO / LIVE_VARIABLE |
| Evidence Needed | Evidence establishing whether operating hours are formally set, how volatile they are, and what seasonal variations are known — sufficient to classify as STABLE / SEMI_STABLE / VOLATILE for the live-trigger design |
| Why Needed | Without volatility classification, SOUL cannot correctly distinguish when to flag live verification vs. state as stable. |
| Preferred Source Role | OFFICIAL |
| Secondary Source Role | LOCAL_OPERATOR |
| Stability Class | VOLATILE |
| Live Trigger | Always — current operating status must be confirmed when material to judgment |
| Confidence Requirement | Official source; volatility class requires field corroboration |
| Negative/Exception Knowledge | YES — closed/restricted periods |
| Relationship Dependency | None |
| Missing-Evidence Consequence | Must treat all operating status as VOLATILE and flag for live check |
| Behavior if Missing | LIVE_VERIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

**ER-OD-007 — Odongdo Walking Friction from Access Point**

| Field | Value |
|---|---|
| Related Place(s) | 오동도 |
| Related Scenario(s) | O-2, O-3 (transition context) |
| Required Judgment | ANSWER — walking friction, access burden |
| Knowledge Category | WALKING / PHYSICAL_BURDEN |
| Evidence Needed | Evidence describing the walking burden from the primary access/parking point to the main visitor area — distance character, path character, physical demand |
| Why Needed | Honest friction disclosure for O-2 requires knowing what the walk from vehicle arrival to place actually demands. Also relevant to O-3 transition assessment. |
| Preferred Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | FOUNDER |
| Stability Class | STABLE |
| Live Trigger | None for physical path; temporary closures could trigger |
| Confidence Requirement | Experiential pattern |
| Negative/Exception Knowledge | NO |
| Relationship Dependency | ER-OD-003 |
| Missing-Evidence Consequence | Cannot describe walking friction accurately; must QUALIFY |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

### Hyangiram Evidence Requirements

---

**ER-HY-001 — Hyangiram Physical Access Structure**

| Field | Value |
|---|---|
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-1, H-2, H-3 |
| Required Judgment | ANSWER — approach difficulty; JUDGMENT — mobility/time feasibility |
| Knowledge Category | ACCESS / WALKING / PHYSICAL_BURDEN |
| Evidence Needed | Evidence establishing the physical structure of Hyangiram's approach — the objective access features that determine physical demand (steps, incline, path character, total approach extent) |
| Why Needed | H-1 requires accurate difficulty description. H-2 requires it for elder suitability judgment. H-3 requires it for time feasibility. All three scenarios depend on this foundation. |
| Preferred Source Role | OFFICIAL / LOCAL_OPERATOR |
| Secondary Source Role | WORLD_EXPERIENCE |
| Stability Class | STABLE |
| Live Trigger | Temporary path closure or seasonal restriction |
| Confidence Requirement | High — structural information must be accurate; experiential corroboration required |
| Negative/Exception Knowledge | YES — access features that make it prohibitive for certain mobility levels |
| Relationship Dependency | None |
| Missing-Evidence Consequence | Cannot answer H-1, H-2, or H-3 without fabrication |
| Behavior if Missing | UNKNOWN |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-HY-002 — Hyangiram Experiential Burden Evidence**

| Field | Value |
|---|---|
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-1, H-2 |
| Required Judgment | ANSWER — how difficulty actually feels in practice; JUDGMENT — suitability |
| Knowledge Category | PHYSICAL_BURDEN / EXPERIENCE_VALUE |
| Evidence Needed | Evidence describing how travelers actually experience the physical approach — not just the structural facts, but the recurring experiential pattern of difficulty, effort, rest patterns |
| Why Needed | H-1 asks about difficulty — structural facts plus experiential pattern together prevent minimization or exaggeration. H-2 judgment needs the experiential layer beyond structural data. |
| Preferred Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | FOUNDER |
| Stability Class | STABLE |
| Live Trigger | None for experiential character |
| Confidence Requirement | Multiple-source pattern; single account insufficient |
| Negative/Exception Knowledge | YES — conditions/traveler types where the difficulty becomes a real obstacle |
| Relationship Dependency | ER-HY-001 |
| Missing-Evidence Consequence | Cannot provide honest experiential characterization; QUALIFY required |
| Behavior if Missing | QUALIFY |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-HY-003 — Hyangiram Elder Mobility Friction**

| Field | Value |
|---|---|
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-2 |
| Required Judgment | JUDGMENT — elder/senior mobility suitability |
| Knowledge Category | SENIOR_CONTEXT / MOBILITY_FRICTION |
| Evidence Needed | Evidence describing how the physical approach affects senior travelers specifically — recurring patterns about elder mobility experience, difficulty levels specific to mobility-sensitive travelers |
| Why Needed | H-2 requires honest judgment about whether parents can be brought. General difficulty evidence is insufficient — elder-specific mobility friction must be established. |
| Preferred Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | FOUNDER |
| Stability Class | STABLE |
| Live Trigger | None |
| Confidence Requirement | Elder-specific experiential accounts — not inferred from general difficulty |
| Negative/Exception Knowledge | YES — mobility thresholds below which the visit is not advisable |
| Relationship Dependency | ER-HY-001, ER-HY-002 |
| Missing-Evidence Consequence | Cannot make elder suitability judgment; ASK for mobility level and QUALIFY |
| Behavior if Missing | ASK |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-HY-004 — Hyangiram Rest Point Evidence**

| Field | Value |
|---|---|
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-2 |
| Required Judgment | JUDGMENT — elder suitability support detail |
| Knowledge Category | MOBILITY_FRICTION / ACCESS |
| Evidence Needed | Evidence describing whether and where rest points exist on the approach — places to pause, shelter, seating, or natural resting areas |
| Why Needed | H-2 elder judgment is more nuanced when rest point information is available — it affects the "borderline" suitability cases. |
| Preferred Source Role | WORLD_EXPERIENCE / FOUNDER |
| Secondary Source Role | LOCAL_OPERATOR |
| Stability Class | SEMI_STABLE |
| Live Trigger | If rest facilities change or are temporarily unavailable |
| Confidence Requirement | Experiential corroboration |
| Negative/Exception Knowledge | NO — positive-context evidence; absence is informative |
| Relationship Dependency | ER-HY-001 |
| Missing-Evidence Consequence | Judgment possible but less nuanced; QUALIFY on rest point detail |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

**ER-HY-005 — Hyangiram Alternative Access Route Evidence**

| Field | Value |
|---|---|
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-2 |
| Required Judgment | JUDGMENT — does an alternative route affect elder suitability verdict? |
| Knowledge Category | ACCESS / EXCEPTION |
| Evidence Needed | Evidence establishing whether an alternative access route to Hyangiram exists that materially reduces physical burden — or confirming no such alternative exists |
| Why Needed | H-2 judgment quality depends on whether an alternative can be offered. Without knowing, the answer may miss an option or fabricate one. |
| Preferred Source Role | LOCAL_OPERATOR / FOUNDER |
| Secondary Source Role | OFFICIAL |
| Stability Class | SEMI_STABLE |
| Live Trigger | If alternative access status changes |
| Confidence Requirement | Field-confirmed; absence of alternative must also be confirmed, not assumed |
| Negative/Exception Knowledge | YES — confirming no alternative exists is negative knowledge |
| Relationship Dependency | ER-HY-001 |
| Missing-Evidence Consequence | Must QUALIFY on alternative access; cannot confirm or deny |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

**ER-HY-006 — Hyangiram Visit Duration**

| Field | Value |
|---|---|
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-3 |
| Required Judgment | JUDGMENT — time feasibility |
| Knowledge Category | TIME_BURDEN |
| Evidence Needed | Evidence establishing how long a typical Hyangiram visit takes — approach, visit at the top, descent — sufficient to assess whether a 2-hour window can work |
| Why Needed | H-3 requires time feasibility judgment. Without a visit duration estimate, total time calculation is impossible. |
| Preferred Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | FOUNDER |
| Stability Class | STABLE |
| Live Trigger | None for visit duration; crowd density may affect in season |
| Confidence Requirement | Pattern-level estimate; must acknowledge traveler-state variation (mobility affects duration) |
| Negative/Exception Knowledge | YES — duration thresholds that make the trip infeasible |
| Relationship Dependency | ER-HY-001 |
| Missing-Evidence Consequence | Cannot complete time feasibility judgment |
| Behavior if Missing | UNKNOWN |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-HY-007 — Travel Time Evidence to Hyangiram**

| Field | Value |
|---|---|
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-3 |
| Required Judgment | JUDGMENT — time feasibility including travel to/from |
| Knowledge Category | TIME_BURDEN / ROUTE_RELATIONSHIP |
| Evidence Needed | Evidence establishing travel time from the most likely Yeosu traveler starting locations to Hyangiram — covering major transport modes relevant to the pilot scenarios |
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
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-HY-008 — Hyangiram Negative Knowledge / Non-Recommendation Boundary**

| Field | Value |
|---|---|
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-2, H-3 |
| Required Judgment | JUDGMENT — when NOT to recommend; honest refusal |
| Knowledge Category | NEGATIVE_KNOWLEDGE / EXCEPTION |
| Evidence Needed | Evidence establishing what traveler states, time windows, or mobility levels result in an honest "this may not be the right choice" judgment — the expert boundary knowledge |
| Why Needed | H-2 and H-3 both require honest judgment that may include non-recommendation. Without negative knowledge, SOUL risks false reassurance. |
| Preferred Source Role | FOUNDER |
| Secondary Source Role | WORLD_EXPERIENCE |
| Stability Class | STABLE |
| Live Trigger | None |
| Confidence Requirement | Expert judgment level; Founder as primary |
| Negative/Exception Knowledge | YES — this IS the negative knowledge requirement |
| Relationship Dependency | ER-HY-001, ER-HY-002, ER-HY-003, ER-HY-006, ER-HY-007 |
| Missing-Evidence Consequence | Risk of false reassurance; QUALIFY required |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

**ER-HY-009 — Hyangiram Seasonal/Crowd Variation**

| Field | Value |
|---|---|
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-1 |
| Required Judgment | ANSWER — honest difficulty description including variation |
| Knowledge Category | OPERATING_INFO / LIVE_VARIABLE |
| Evidence Needed | Evidence describing how seasonal crowd density or path conditions vary — sufficient to classify as STABLE / SEMI_STABLE / VOLATILE and inform when live verification is needed |
| Why Needed | H-1 requires honest difficulty description. Seasonal variation can materially change the difficulty character. |
| Preferred Source Role | LOCAL_OPERATOR / WORLD_EXPERIENCE |
| Secondary Source Role | OFFICIAL |
| Stability Class | CONTEXTUAL (underlying crowd is VOLATILE; path structure is STABLE) |
| Live Trigger | Peak season / holiday periods |
| Confidence Requirement | Pattern-level for seasonal character; live for current status |
| Negative/Exception Knowledge | YES — periods when difficulty increases substantially |
| Relationship Dependency | ER-HY-001 |
| Missing-Evidence Consequence | Must treat seasonal variation as unknown; QUALIFY |
| Behavior if Missing | QUALIFY |
| Collection Priority | P2 |
| Collection Status | NOT_COLLECTED |

---

### Cable Car Evidence Requirements

---

**ER-CC-001 — Cable Car Station Identity and Names**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카 |
| Related Scenario(s) | C-1, C-2, C-3, O-3 |
| Required Judgment | ANSWER — accurate boarding point description |
| Knowledge Category | PLACE_BASIC / ACCESS |
| Evidence Needed | Evidence establishing the official and locally-used names of both cable car stations, their identity, and their basic location context |
| Why Needed | C-1 requires accurate boarding point description. All cable car scenarios require correct station identification. RB-01 research already partially addresses this. |
| Preferred Source Role | OFFICIAL |
| Secondary Source Role | FOUNDER / LOCAL_OPERATOR |
| Stability Class | STABLE |
| Live Trigger | None for station identity |
| Confidence Requirement | Official confirmation; RB-01 findings (PARTIALLY_VERIFIED) require completion |
| Negative/Exception Knowledge | NO |
| Relationship Dependency | None |
| Missing-Evidence Consequence | Cannot name stations accurately; QUALIFY required |
| Behavior if Missing | QUALIFY |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-CC-002 — Per-Station Access Structure**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카 |
| Related Scenario(s) | C-1, C-2 |
| Required Judgment | ANSWER — how to access each station |
| Knowledge Category | ACCESS / ROUTE_RELATIONSHIP |
| Evidence Needed | Evidence describing how a traveler physically reaches each cable car station — approach routes, access method from nearby areas |
| Why Needed | C-1 requires knowing where to board. C-2 requires vehicle-specific access guidance per station. |
| Preferred Source Role | MAP_ROUTE / OFFICIAL |
| Secondary Source Role | FOUNDER |
| Stability Class | SEMI_STABLE |
| Live Trigger | Temporary route/access disruption |
| Confidence Requirement | Route-confirmed |
| Negative/Exception Knowledge | NO |
| Relationship Dependency | ER-CC-001 |
| Missing-Evidence Consequence | Cannot specify how to reach stations; QUALIFY |
| Behavior if Missing | QUALIFY |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-CC-003 — Per-Station Vehicle Access and Parking**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카 |
| Related Scenario(s) | C-2, MT-1 (via C-2 intent) |
| Required Judgment | ANSWER + JUDGMENT — situation-aware boarding guidance for vehicle arrival |
| Knowledge Category | VEHICLE_ACCESS / PARKING |
| Evidence Needed | Evidence describing vehicle access and parking conditions at or near each station — which station is better suited for vehicle arrival and why, what parking friction exists at each |
| Why Needed | C-2 requires a vehicle-aware boarding recommendation. MT-1 Turn 3 reuses this via companion+vehicle context. RB-02/RB-03 already partially address related access. |
| Preferred Source Role | LOCAL_OPERATOR / FOUNDER |
| Secondary Source Role | WORLD_EXPERIENCE |
| Stability Class | SEMI_STABLE |
| Live Trigger | Current parking availability if volatile |
| Confidence Requirement | Field-confirmed per station |
| Negative/Exception Knowledge | YES — parking conditions that discourage vehicle arrival at a particular station |
| Relationship Dependency | ER-CC-001, ER-CC-002 |
| Missing-Evidence Consequence | Cannot make vehicle-aware recommendation; LIVE_VERIFY or QUALIFY |
| Behavior if Missing | LIVE_VERIFY |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-CC-004 — Per-Station Child Suitability**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카 |
| Related Scenario(s) | C-2, MT-1 (via C-2 intent) |
| Required Judgment | JUDGMENT — child consideration for boarding recommendation |
| Knowledge Category | CHILD_CONTEXT |
| Evidence Needed | Evidence describing what makes each station more or less suitable for travelers with children — boarding process, waiting area, physical access |
| Why Needed | C-2 explicitly includes a child. Station recommendation must account for child-specific friction. |
| Preferred Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | FOUNDER |
| Stability Class | STABLE |
| Live Trigger | None for station physical character |
| Confidence Requirement | Experiential pattern |
| Negative/Exception Knowledge | YES — station features that are problematic with young children |
| Relationship Dependency | ER-CC-001, ER-CC-002, ER-CC-003 |
| Missing-Evidence Consequence | Cannot account for child factor; QUALIFY |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

**ER-CC-005 — Cable Car Operating Status Volatility Classification**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카 |
| Related Scenario(s) | C-1, C-3, O-3 |
| Required Judgment | LIVE_VERIFY trigger classification |
| Knowledge Category | OPERATING_INFO / LIVE_VARIABLE |
| Evidence Needed | Evidence establishing the volatility pattern of cable car operations — what is formally stable, what varies, what conditions cause suspension or modification — sufficient to classify when live verification is required |
| Why Needed | O-3 and C-3 both require operating status alignment. Without volatility classification, SOUL cannot correctly distinguish when to flag live verification. |
| Preferred Source Role | OFFICIAL / LOCAL_OPERATOR |
| Secondary Source Role | FOUNDER |
| Stability Class | VOLATILE |
| Live Trigger | Always — current operating status must be confirmed when material |
| Confidence Requirement | Official source + operational pattern |
| Negative/Exception Knowledge | YES — conditions causing suspension or modification |
| Relationship Dependency | ER-CC-001 |
| Missing-Evidence Consequence | Must treat all operating status as VOLATILE |
| Behavior if Missing | LIVE_VERIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

### Relationship Evidence Requirements

---

**ER-REL-001 — Cable Car Directional Outcome**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카, 오동도 |
| Related Scenario(s) | O-3, C-3 |
| Required Judgment | ANSWER + JUDGMENT — sequence/direction feasibility; direction selection |
| Knowledge Category | ROUTE_RELATIONSHIP / DIRECTIONAL_CHOICE |
| Evidence Needed | Evidence establishing what each cable car direction means in terms of physical exit location — which station a one-way trip from each departure point delivers the traveler to, and what geography/access that creates |
| Why Needed | O-3 and C-3 both require direction-aware judgment. Without understanding where each direction goes, no sequence or direction recommendation can be made. |
| Preferred Source Role | MAP_ROUTE |
| Secondary Source Role | FOUNDER / OFFICIAL |
| Stability Class | STABLE |
| Live Trigger | None for directional geography |
| Confidence Requirement | Route-confirmed; RB-01 directional research partially addresses this |
| Negative/Exception Knowledge | YES — when one direction does NOT connect to intended destination efficiently |
| Relationship Dependency | ER-CC-001 |
| Missing-Evidence Consequence | Cannot make direction recommendation for O-3 or C-3 |
| Behavior if Missing | UNKNOWN |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-REL-002 — Route/Connection from Each Cable Car Exit to Odongdo**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카, 오동도 |
| Related Scenario(s) | O-3, C-3 |
| Required Judgment | ANSWER + JUDGMENT — sequence feasibility; direction selection for Odongdo |
| Knowledge Category | PLACE_TO_PLACE_CONNECTION / SEQUENCE |
| Evidence Needed | Evidence establishing the practical connection from each cable car exit station to Odongdo — what route exists, what the practical connection looks like, what the travel burden is |
| Why Needed | O-3 asks if cable car + Odongdo work together. C-3 asks which direction is better if going to Odongdo. Both require knowing the exit-to-Odongdo connection from each station. |
| Preferred Source Role | MAP_ROUTE |
| Secondary Source Role | FOUNDER / WORLD_EXPERIENCE |
| Stability Class | STABLE |
| Live Trigger | None for route geography; operating status triggers for cable car itself (ER-CC-005) |
| Confidence Requirement | Route-confirmed per exit station |
| Negative/Exception Knowledge | YES — connection that is impractical or requires major detour |
| Relationship Dependency | ER-REL-001, ER-CC-001, ER-OD-003 |
| Missing-Evidence Consequence | Cannot make direction or sequence recommendation for O-3 or C-3 |
| Behavior if Missing | UNKNOWN |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-REL-003 — Time Estimate for Cable Car + Odongdo Combined Sequence**

| Field | Value |
|---|---|
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
| Collection Status | NOT_COLLECTED |

---

**ER-REL-004 — Sequence Friction for Cable Car + Odongdo**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카, 오동도 |
| Related Scenario(s) | O-3 |
| Required Judgment | JUDGMENT — sequence feasibility, honest friction disclosure |
| Knowledge Category | SEQUENCE / NEXT_PLACE_FIT |
| Evidence Needed | Evidence describing what makes the cable car + Odongdo combination work well or create friction — physical transition burden, logical sequence fit, conditions that affect the combination |
| Why Needed | O-3 asks "어때?" — an experiential sequence judgment. Structural route data alone is insufficient; friction character is needed. |
| Preferred Source Role | WORLD_EXPERIENCE / FOUNDER |
| Secondary Source Role | MAP_ROUTE |
| Stability Class | STABLE |
| Live Trigger | None for friction character; ER-CC-005 handles operating status |
| Confidence Requirement | Experiential pattern |
| Negative/Exception Knowledge | YES — conditions that make the combination inadvisable |
| Relationship Dependency | ER-REL-001, ER-REL-002, ER-REL-003 |
| Missing-Evidence Consequence | Judgment limited to structural assessment only; QUALIFY on experiential quality |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

**ER-REL-005 — Direction Selection Judgment for Cable Car → Odongdo**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카, 오동도 |
| Related Scenario(s) | C-3 |
| Required Judgment | JUDGMENT — which direction is better for Odongdo access |
| Knowledge Category | DIRECTIONAL_CHOICE / NEXT_PLACE_FIT |
| Evidence Needed | Expert knowledge establishing which cable car boarding direction is better suited when Odongdo is the intended next destination — the directional preference judgment with supporting reasoning |
| Why Needed | C-3 is a direction selection judgment. Facts about exit locations (ER-REL-001) and connections (ER-REL-002) provide the base; direction selection judgment requires expert synthesis. |
| Preferred Source Role | FOUNDER |
| Secondary Source Role | MAP_ROUTE / LOCAL_OPERATOR |
| Stability Class | STABLE |
| Live Trigger | None for directional judgment; ER-CC-005 handles operating status |
| Confidence Requirement | Expert judgment level; Founder preferred |
| Negative/Exception Knowledge | YES — conditions under which the preferred direction becomes non-preferred |
| Relationship Dependency | ER-REL-001, ER-REL-002 |
| Missing-Evidence Consequence | Cannot make confident direction recommendation; QUALIFY |
| Behavior if Missing | QUALIFY |
| Collection Priority | P0 |
| Collection Status | NOT_COLLECTED |

---

**ER-REL-006 — Vehicle Impact on Cable Car Direction/Exit Choice**

| Field | Value |
|---|---|
| Related Place(s) | 여수해상케이블카, 오동도 |
| Related Scenario(s) | C-3, O-3 |
| Required Judgment | JUDGMENT — whether vehicle availability materially changes direction recommendation |
| Knowledge Category | VEHICLE_ACCESS / DIRECTIONAL_CHOICE |
| Evidence Needed | Evidence establishing whether having a vehicle changes which cable car direction is better for Odongdo access — or confirming that vehicle status does not materially change the recommendation |
| Why Needed | C-3 includes vehicle availability as an optional ASK. The answer to whether vehicle matters determines whether ASK is UNNECESSARY or MISSED_NECESSARY. |
| Preferred Source Role | FOUNDER / LOCAL_OPERATOR |
| Secondary Source Role | MAP_ROUTE |
| Stability Class | STABLE |
| Live Trigger | None for the vehicle-impact judgment itself |
| Confidence Requirement | Expert judgment level |
| Negative/Exception Knowledge | YES — cases where vehicle presence reverses the direction recommendation |
| Relationship Dependency | ER-REL-001, ER-REL-002, ER-REL-005, ER-OD-003 |
| Missing-Evidence Consequence | Must treat vehicle as potentially material and ASK if unknown |
| Behavior if Missing | ASK |
| Collection Priority | P1 |
| Collection Status | NOT_COLLECTED |

---

### Context System Requirement

---

**ER-CX-001 — MT-1 Context Retention Requirement**

| Field | Value |
|---|---|
| Related Place(s) | 오동도, 여수해상케이블카 |
| Related Scenario(s) | MT-1 |
| Required Judgment | Context retention across turns — no CONTEXT_REASK |
| Knowledge Category | N/A (context system requirement, not place knowledge) |
| Evidence Needed | Design requirement only: Turn 1 companion signal + vehicle signal must be available without re-asking in Turn 2 (O-2 intent) and Turn 3 (C-2 intent). No new place evidence is required beyond ER-OD-005 and ER-CC-003/004. |
| Why Needed | MT-1 tests context continuity. The place evidence requirements are already covered by O-2 and C-2 dependencies. This entry records the system-level requirement. |
| Preferred Source Role | N/A |
| Secondary Source Role | N/A |
| Stability Class | N/A (system behavior, not evidence) |
| Live Trigger | N/A |
| Confidence Requirement | Context must be verifiably present without re-prompting |
| Negative/Exception Knowledge | YES — context over-application (Irrelevant_Context_Overuse) is tracked as a failure |
| Relationship Dependency | ER-OD-005 (child suitability for O-2), ER-CC-003, ER-CC-004 (vehicle+child for C-2) |
| Missing-Evidence Consequence | If context is not retained → CONTEXT_REASK failure |
| Behavior if Missing | N/A — system behavior failure, not evidence gap |
| Collection Priority | N/A |
| Collection Status | NOT_COLLECTED (system test, not evidence collection) |

---

## 10. Relationship Evidence Requirements Summary

O-3 and C-3 require relationship evidence that cannot be reduced to independent place facts.

| Scenario | Place Dependency | Relationship Evidence Required |
|---|---|---|
| O-3 | Odongdo + Cable Car | ER-REL-001 (directional outcome) + ER-REL-002 (exit-to-Odongdo connection) + ER-REL-003 (combined time) + ER-REL-004 (sequence friction) |
| C-3 | Cable Car + Odongdo | ER-REL-001 (directional outcome) + ER-REL-002 (exit-to-Odongdo connection) + ER-REL-005 (direction selection judgment) + ER-REL-006 (vehicle impact) |

Relationship evidence requirements (ER-REL-001 through ER-REL-006) are explicitly distinguished from the place facts they depend on. O-3 and C-3 share ER-REL-001 and ER-REL-002 as common foundations.

---

## 11. MT-1 Context Requirements

MT-1 does not require new place facts beyond those already required by O-2 and C-2.

Reuse map:
- Turn 2 (O-2 intent): depends on ER-OD-003 (vehicle access), ER-OD-004 (parking), ER-OD-005 (child suitability), ER-OD-007 (walking friction)
- Turn 3 (C-2 intent): depends on ER-CC-002 (station access), ER-CC-003 (vehicle+parking), ER-CC-004 (child suitability)

ER-CX-001 records the context-system requirement: companion + vehicle signals from Turn 1 must be available in Turns 2 and 3 without re-asking.

---

## 12. Missing-Evidence Behavior by Scenario

| Scenario | Critical Missing Evidence | Behavior if Missing |
|---|---|---|
| O-1 | ER-OD-001 | QUALIFY |
| O-2 | ER-OD-003 | LIVE_VERIFY; ER-OD-004 → LIVE_VERIFY |
| O-3 | ER-REL-001, ER-REL-002 | UNKNOWN |
| H-1 | ER-HY-001 | UNKNOWN |
| H-2 | ER-HY-001 + ER-HY-003 | ASK + QUALIFY; if ER-HY-005 missing → QUALIFY |
| H-3 | ER-HY-006 + ER-HY-007 | UNKNOWN; ER-HY-007 alone → ASK |
| C-1 | ER-CC-001 | QUALIFY |
| C-2 | ER-CC-001 + ER-CC-003 | LIVE_VERIFY |
| C-3 | ER-REL-001 + ER-REL-002 + ER-REL-005 | UNKNOWN |
| MT-1 | ER-CX-001 context failure | CONTEXT_REASK failure |

UNKNOWN = Phoenix lacks sufficient evidence and should not guess. These are the scenarios where preparation gap leads to a complete judgment gap.

---

## 13. Deduplication / Reuse Notes

Several Evidence Requirements serve multiple scenarios. These represent future Reuse Ledger candidates.

| Evidence Requirement | Serves Scenarios | Reuse Potential |
|---|---|---|
| ER-CC-001 | C-1, C-2, C-3, O-3 | HIGH — foundational for all cable car scenarios |
| ER-REL-001 | O-3, C-3 | HIGH — shared directional foundation |
| ER-REL-002 | O-3, C-3 | HIGH — shared connection foundation |
| ER-HY-001 | H-1, H-2, H-3 | HIGH — foundational for all Hyangiram scenarios |
| ER-OD-005 | O-2, MT-1 (Turn 2) | MEDIUM — child context shared |
| ER-CC-003 | C-2, MT-1 (Turn 3) | MEDIUM — vehicle+parking shared |
| ER-CC-004 | C-2, MT-1 (Turn 3) | MEDIUM — child suitability shared |
| ER-CC-005 | C-1, C-3, O-3 | MEDIUM — operating status trigger shared |
| ER-OD-006 | O-1, O-3 | LOW-MEDIUM — seasonal classification shared |

The matrix begins testing the Reuse Ledger concept before execution. High-reuse requirements are candidates for P0 priority even when primarily serving one scenario, because they enable multiple.

---

## 14. Scenario Coverage Matrix

| Scenario | Evidence Requirements | Key Judgment | FACT | EXPERIENCE | JUDGMENT | Relationship |
|---|---|---|---|---|---|---|
| O-1 | ER-OD-001, ER-OD-002, ER-OD-006 | ANSWER | ✓ | ✓ | — | — |
| O-2 | ER-OD-003, ER-OD-004, ER-OD-005, ER-OD-007 | ANSWER + LIVE_VERIFY | ✓ | ✓ | ✓ (vehicle-child) | — |
| O-3 | ER-REL-001, ER-REL-002, ER-REL-003, ER-REL-004, ER-OD-006, ER-CC-005 | ANSWER + JUDGMENT | ✓ | ✓ | ✓ (sequence) | ✓ |
| H-1 | ER-HY-001, ER-HY-002, ER-HY-009 | ANSWER | ✓ | ✓ | — | — |
| H-2 | ER-HY-001, ER-HY-002, ER-HY-003, ER-HY-004, ER-HY-005, ER-HY-008 | JUDGMENT | ✓ | ✓ | ✓ (mobility) | — |
| H-3 | ER-HY-001, ER-HY-006, ER-HY-007, ER-HY-008 | JUDGMENT | ✓ | ✓ | ✓ (time) | — |
| C-1 | ER-CC-001, ER-CC-002, ER-CC-005 | ANSWER | ✓ | — | — | — |
| C-2 | ER-CC-001, ER-CC-002, ER-CC-003, ER-CC-004 | ANSWER + JUDGMENT | ✓ | ✓ | ✓ (vehicle-child) | — |
| C-3 | ER-REL-001, ER-REL-002, ER-REL-005, ER-REL-006, ER-CC-005 | JUDGMENT | ✓ | — | ✓ (direction) | ✓ |
| MT-1 | ER-CX-001 + reuse of O-2/C-2 ERs | Context retention | — | — | — | — |

Every scenario has at least one FACT and one EXPERIENCE requirement, except C-1 (basic factual) and C-3 (which relies on relationship evidence covering both layers).

---

## 15. Collection Priority Summary

**P0 — Required to make the scenario judgment at all:**

| ID | Summary |
|---|---|
| ER-OD-001 | Odongdo place character |
| ER-OD-003 | Odongdo vehicle access structure |
| ER-OD-004 | Odongdo parking evidence |
| ER-HY-001 | Hyangiram physical access structure |
| ER-HY-002 | Hyangiram experiential burden |
| ER-HY-003 | Hyangiram elder mobility friction |
| ER-HY-006 | Hyangiram visit duration |
| ER-HY-007 | Travel time to Hyangiram |
| ER-CC-001 | Cable Car station identity and names |
| ER-CC-002 | Per-station access structure |
| ER-CC-003 | Per-station vehicle access and parking |
| ER-REL-001 | Cable Car directional outcome |
| ER-REL-002 | Route/connection from exit to Odongdo |
| ER-REL-005 | Direction selection judgment for C-3 |

**P1 — Materially improves judgment reliability:**

| ID | Summary |
|---|---|
| ER-OD-002 | Odongdo visitor experience patterns |
| ER-OD-005 | Odongdo child suitability |
| ER-OD-006 | Odongdo operating hours classification |
| ER-OD-007 | Odongdo walking friction from access point |
| ER-HY-004 | Hyangiram rest point evidence |
| ER-HY-005 | Hyangiram alternative access route |
| ER-HY-008 | Hyangiram negative knowledge boundary |
| ER-CC-004 | Per-station child suitability |
| ER-CC-005 | Cable Car operating status volatility |
| ER-REL-003 | Combined sequence time estimate |
| ER-REL-004 | Sequence friction Cable Car + Odongdo |
| ER-REL-006 | Vehicle impact on direction choice |

**P2 — Supporting/corroborating depth:**

| ID | Summary |
|---|---|
| ER-HY-009 | Hyangiram seasonal/crowd variation |

---

## 16. Completeness Audit

The following checks were applied after drafting the matrix.

**A. Are Desired Answer Properties covered for each scenario?**

| Scenario | Desired Properties | Evidence Coverage |
|---|---|---|
| O-1 | Experiential description / place character / honest scope / no fabrication | ER-OD-001, ER-OD-002 ✓ |
| O-2 | Honest friction disclosure / parking reality / child-suitability / condition-aware | ER-OD-003, ER-OD-004, ER-OD-005, ER-OD-007 ✓ |
| O-3 | Honest sequence assessment / direction / time / feasibility | ER-REL-001~004, ER-OD-006, ER-CC-005 ✓ |
| H-1 | Honest difficulty description / physical access reality / no minimization or exaggeration | ER-HY-001, ER-HY-002, ER-HY-009 ✓ |
| H-2 | Condition-aware judgment / honest physical friction / no false reassurance | ER-HY-001~005, ER-HY-008 ✓ |
| H-3 | Time-aware honest judgment / no unsupported reassurance | ER-HY-001, ER-HY-006, ER-HY-007, ER-HY-008 ✓ |
| C-1 | Accurate boarding point / both stations / no fabrication | ER-CC-001, ER-CC-002 ✓ |
| C-2 | Vehicle-aware boarding recommendation / parking reality / child consideration | ER-CC-001~004 ✓ |
| C-3 | Direction-aware judgment / sequence-aware / honest | ER-REL-001, 002, 005, 006 ✓ |

**RESULT: PASS**

**B. Can every Required Judgment trace to at least one Evidence Requirement?**

All ANSWER judgments trace to at least one FACT requirement. All JUDGMENT types trace to at least one EXPERIENCE or relationship requirement. All LIVE_VERIFY triggers have a volatility classification requirement.

**RESULT: PASS**

**C. Are FACT vs EXPERIENCE vs JUDGMENT separated?**

Yes — each evidence requirement identifies its layer. JUDGMENT layer is explicitly noted as "derived later" and not collected as objective fact.

**RESULT: PASS**

**D. Are relationship questions supported by relationship evidence?**

O-3 and C-3 both have dedicated ER-REL requirements (ER-REL-001 through ER-REL-006). Neither scenario relies solely on individual place facts.

**RESULT: PASS**

**E. Are stable and volatile needs distinguishable?**

Every requirement carries a Stability Class (STABLE / SEMI_STABLE / VOLATILE / CONTEXTUAL). VOLATILE requirements have Live Trigger fields defined.

**RESULT: PASS**

**F. Is missing-evidence behavior defined?**

Every requirement has a "Behavior if Missing" field: ANSWER / QUALIFY / ASK / LIVE_VERIFY / UNKNOWN.

**RESULT: PASS**

**G. Does any requirement contain actual Yeosu facts?**

No actual station names, parking prices, stair counts, route distances, operating hours, or factual Yeosu content appears anywhere in the matrix. All entries describe what needs to be established, not what has been found.

**RESULT: PASS — no facts inserted**

**H. Is there unnecessary evidence not traceable to a frozen judgment?**

All requirements trace to at least one Core Scenario judgment. ER-CX-001 is a context system requirement with explicit MT-1 traceability. ER-HY-009 (P2) is traceable to H-1 difficulty characterization.

**RESULT: PASS — no orphan requirements**

---

## 17. Hidden Transfer Generic Requirements

Actual Hidden Transfer questions are not generated in this document.

However, the evidence pool that Hidden Transfer must draw from is implicitly defined by the total evidence requirements above. Hidden Transfer items must be answerable from the same pool without introducing new factual evidence.

Generic evidence availability requirement for Hidden Transfer:

- NEAR TRANSFER items: must be answerable from a subset of existing evidence requirements, recombined or reworded
- FARTHER TRANSFER items: must be answerable from the same evidence pool but requiring a materially different combination — ensuring the evidence pool is rich enough to support non-Core Scenario combinations

This document establishes the evidence pool boundary. Hidden Transfer generation (post-preparation freeze) operates within it.

---

## 18. Explicit Non-Conclusions

| Item | Status |
|---|---|
| Any actual Yeosu place facts collected | NOT COLLECTED |
| Evidence slots filled | NOT_COLLECTED (all 28 requirements + ER-CX-001) |
| Model A or B preparation executed | NOT EXECUTED |
| Pilot scenarios run | NOT EXECUTED |
| A/B scored | NONE |
| Hidden Transfer questions generated | NOT GENERATED |
| Pilot results available | NONE |
| Prepared Knowledge Model validated | NOT VALIDATED |
| Prepared Context Model validated | NOT VALIDATED |
| Preparation Boundary decided | NOT DECIDED |
| Model winner determined | NOT DETERMINED |
| Candidate created | NONE |
| Architecture Decision made | NONE |
| SSOT promoted | NONE |
| place_knowledge migration approved | NOT APPROVED |

---

## 19. Governance

| Action | Status |
|---|---|
| Collect any actual Yeosu knowledge | PROHIBITED (this run) |
| Web research Odongdo / Hyangiram / Cable Car | PROHIBITED (this run) |
| Execute Pilot | PROHIBITED (this run) |
| Generate Hidden Transfer questions | PROHIBITED (this run) |
| Score A/B | PROHIBITED (this run) |
| Recruit participants | HOLD |
| Conduct Blind MVP sessions | HOLD |
| Generate Participant Evidence | HOLD |
| Assign BT verdict | HOLD |
| Modify runtime / production | PROHIBITED |
| Modify DB / schema | PROHIBITED |
| Create place_knowledge migration | NOT APPROVED / HOLD |
| Alter canonical Blind MVP stimuli | PROHIBITED |
| Create Candidate | PROHIBITED (this run) |
| Promote to SSOT | PROHIBITED (this run) |

Existing status carried forward:
- Blind MVP assets: VALID / UNCHANGED
- Participant Evidence: NONE
- BT Verdict: NOT ASSIGNED
- Prepared Knowledge: RESEARCH HYPOTHESIS
- Prepared Context: RESEARCH HYPOTHESIS
- Expert Anticipation: RESEARCH HYPOTHESIS
- Preparation Boundary: RESEARCH VARIABLE

---

*SOUL Yeosu 3-Place Evidence Requirement Matrix V0.1 — 2026-09-27*
