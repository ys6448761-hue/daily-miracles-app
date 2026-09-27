# SOUL Yeosu 3-Place
# Controlled Evidence Collection Plan V0.1

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Base Checkpoint:** c4e8b8b
**Status:** COLLECTION PLAN DESIGN — NO COLLECTION EXECUTED

**Primary input:**
`docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md`

**Protocol basis:**
`docs/research/SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_2.md`

This document defines the collection plan only.
No actual Yeosu knowledge is collected here.
All 29 Evidence Requirement slots remain NOT_COLLECTED.
All plan statuses are NOT_STARTED.
No pilot is executed. No Candidate is created.

---

## 1. Purpose

This plan answers:

> **"For each of the 29 Evidence Requirements, what evidence should be collected, from which source role, in what order, under what verification rules, with what provenance, and when should collection stop?"**

It does NOT answer:

> "What are the actual facts about Odongdo, Hyangiram, or the Cable Car?"

No evidence slot may be filled in this run.
All 29 Matrix requirements remain Collection Status = NOT_COLLECTED.
All Plan entries carry Collection Status = NOT_STARTED.

---

## 2. Scope and Non-Goals

**In scope:**
- 29 Evidence Requirements from Matrix V0.1 (ER-OD-001 through ER-CX-001)
- Collection order / wave design
- Source roles + claim authority mapping
- Verification rules per requirement
- Provenance schema design
- Conflict taxonomy and handling
- Stop conditions and escalation
- Requirement Revision Guard

**Not in scope:**
- Actual evidence collection (any web search, map lookup, WE review, Founder session)
- Hidden Transfer question generation
- SOUL answer generation
- Model A or B preparation
- Pilot execution
- Candidate creation
- Architecture decision

---

## 3. Inputs / Authoritative Checkpoint

| Input | Source |
|---|---|
| Evidence Requirement Matrix | `docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md` — 29 ERs, all NOT_COLLECTED |
| Pilot Protocol | `docs/research/SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_2.md` — V0.2, 5 corrections CLOSED |
| Project State | `docs/architecture/SOUL_PLACE_KNOWLEDGE_AUTHORING_STATE_2026_09_24.md` |
| Existing partial research | RB-01 (PARTIALLY_VERIFIED), RB-02, RB-03 — Cable Car foundational assets exist |

**Existing assets relevant to collection:**
RB-01 (station identity), RB-02 (one-way/round-trip), RB-03 (Hamel↔Cable Car physical access) provide partial coverage of ER-CC-001 and ER-CC-003. These are PARTIALLY_VERIFIED, not VERIFIED_FOR_PREPARATION. Collection plan must account for their completion, not re-execution.

---

## 4. Governing Principles

### Principle 1 — Requirement-Driven, Not Search-Driven

Do not plan: "Search everything about Odongdo."

Plan: "ER-XXX requires this type of evidence for this judgment. Collect only enough to satisfy its predefined sufficiency condition."

```
DEFINE SUFFICIENCY BEFORE SEARCH.
```

### Principle 2 — Dependency-Aware Order

Collect high-reuse P0 foundations first. Later requirements may depend on earlier findings. Do not execute later requirements before their prerequisites reach sufficient state.

### Principle 3 — Claim-Appropriate Authority

No universal source ranking exists. Authority depends on claim type. Official is strongest for formal rules. World Experience is strongest for recurring friction. Founder is strongest for contextual local judgment — after factual foundation is present.

### Principle 4 — Reuse Before Duplication

If a requirement serves multiple scenarios, collect and verify once. Record all scenarios that benefit. Do not re-collect the same requirement because a different scenario needs it.

### Principle 5 — Atomic Evidence

Capture evidence at claim level where practical. One source may support multiple claims. Different claims from the same source may have different stability, authority, and conflict status.

### Principle 6 — Volatile / Live Separation

Establish the LIVE-BOUNDARY (what is volatile, when to check, which source) as prepared knowledge. The current LIVE VALUE is not collected in advance. It is checked at runtime when scenarios require it.

---

## 5. Collection Lifecycle

Future collection status for each requirement follows this lifecycle:

| Status | Definition |
|---|---|
| NOT_STARTED | Plan assigned; no collection activity begun |
| IN_COLLECTION | Active collection underway for this requirement |
| PROVISIONALLY_SUPPORTED | Evidence exists; under conflict/quality review |
| CONFLICTED | Material unresolved conflict between sources |
| BLOCKED | Normal collection cannot proceed; escalation pending |
| VERIFIED_FOR_PREPARATION | Evidence sufficient for this Pilot's prepared-knowledge purpose under recorded boundaries |
| LIVE_ONLY | Underlying fact must be verified live at answer time; stable-pattern knowledge may exist separately |
| UNKNOWN | Evidence genuinely cannot support the requirement; research outcome accepted |

**VERIFIED_FOR_PREPARATION does NOT mean eternal truth.**
It means evidence is sufficient for this Pilot's purpose under recorded boundaries and at the recorded time. Maintenance/refresh obligations are recorded in provenance.

Acceptable terminal states: VERIFIED_FOR_PREPARATION / LIVE_ONLY / BLOCKED (with escalation recorded) / UNKNOWN

---

## 6. Evidence Provenance Schema

Every future collected evidence item must carry minimum provenance fields.

**Provenance Schema:**

| Field | Definition |
|---|---|
| Evidence Item ID | Assigned at collection (e.g., EV-OD-001-A) |
| Evidence Requirement ID(s) | Which Matrix requirement(s) this satisfies |
| Source Role | OFFICIAL / MAP_ROUTE / WORLD_EXPERIENCE / LOCAL_OPERATOR / FOUNDER / LIVE |
| Source Name | Name or title of the source document, site, or person |
| Source Type | Web document / Official publication / Map tool / Personal account / Field interview / Expert consultation |
| Source Locator | URL / file path / document reference / meeting record reference |
| Accessed or Observed Date | When this evidence was collected |
| Source Publication/Update Date | When the source was published or last updated (if known) |
| Extracted Claim | The specific claim extracted (claim-level, not full-page copy) |
| Claim Type | FACT / EXPERIENCE / JUDGMENT |
| Stability Classification | STABLE / SEMI_STABLE / VOLATILE |
| Geographic/Place Scope | Specific place or area this claim applies to |
| Traveler-Context Scope | Applicable traveler states, if claim is context-conditional |
| Collector | Who collected this evidence item |
| Verification Status | UNVERIFIED / PROVISIONALLY_SUPPORTED / CONFLICTED / VERIFIED_FOR_PREPARATION |
| Corroboration Links | Other Evidence Item IDs that support the same claim |
| Conflict Status | NONE / CONFLICT_OPEN / CONFLICT_RESOLVED (type recorded separately) |
| Notes / Limitations | Scope limitations, age of source, known gaps |

Do not create actual Evidence Item IDs or claim content in this run. Schema is defined for future use.

---

## 7. Source Roles and Claim Authority

No universal source hierarchy. Authority is claim-type-dependent.

### OFFICIAL

**Allowed to establish:**
- Formal access rules and restrictions
- Official operating structure (hours, policies, fees — as formally stated)
- Official facility descriptions
- Formal closures and notices
- Authoritative place identity (official names, designations)

**Not sufficient alone for:**
- Actual felt walking burden for specific traveler types
- Practical parking friction under real conditions
- How current actual reality differs from stated policy
- Contextual travel judgment about what a traveler should do

**Collection method:** OFFICIAL_WEB_REVIEW (review official website, official document, or government publication)

---

### MAP_ROUTE

**Allowed to establish:**
- Spatial relationship (which place is where relative to another)
- Route geometry (path, direction, connection structure)
- Travel linkage (which exit leads where)
- Distance/direction fundamentals
- Physical access topology (approach structure)

**Not sufficient alone for:**
- How burdensome that route feels for different traveler types
- Practical friction along the route (condition, rest points)
- Contextual travel judgment about whether the route is suitable

**Collection method:** MAP_ROUTE_CHECK (use map tool / route analysis at collection time — not in this planning run)

---

### WORLD_EXPERIENCE

**Allowed to establish:**
- Recurring traveler friction patterns
- Practical visit experience character
- Physical burden as actually experienced
- Recurring confusion or difficulty patterns
- Experiential value characterization

**Not sufficient alone for:**
- Current official operating rule or policy
- Formal access structure (single account is not a pattern)
- Expert judgment about traveler-fit for a specific traveler state

**Requires:** Multiple independent accounts for pattern-level confidence. Single anecdote = lead, not verified pattern.

**Collection method:** WE_REVIEW (structured review of traveler accounts — blogs, review platforms, community posts)

---

### LOCAL_OPERATOR

**Allowed to establish:**
- Current field reality that may differ from official sources
- Practical operational friction (stale-info correction)
- Local behavioral patterns
- Current access or condition updates

**Not sufficient alone for:**
- Structural spatial facts (defer to MAP_ROUTE)
- Formal operating policy (defer to OFFICIAL)
- Contextual travel judgment (defer to FOUNDER after facts are present)

**Collection method:** LOCAL_OPERATOR_INQUIRY (structured field inquiry or record review — operator-provided information)

---

### FOUNDER

**Allowed to establish (after factual foundation is present):**
- Local practical meaning and contextual interpretation
- Traveler-fit judgment for specific traveler states
- Practical decision boundary (when to recommend / not recommend)
- Missing exception or stale-public-info correction
- Expert synthesis of facts + experience for a specific judgment

**Must not:**
- Silently overwrite contradictory formal factual evidence
- Replace spatial facts without MAP_ROUTE support
- Provide unsupported empirical claims as objective facts
- Be the sole source for formal operating information

**When conflicts exist:** Classify conflict first (§11). Founder opinion on a conflict is expert input, not resolution.

**Collection method:** FOUNDER_REVIEW (structured Founder consultation — guided by specific evidence requirement, not open-ended interview)

---

### LIVE

**Appropriate for:**
- Materially volatile current status (operating today, current availability, real-time queue)
- Cannot be collected in advance as prepared knowledge

**Planning rule:**
Phoenix may prepare: which fact is LIVE, why it matters, the trigger condition, appropriate source role, and fallback behavior if unavailable.

**Do not collect current LIVE values in this planning run or collection run.**
LIVE values are checked only when scenario execution requires them.

**Collection method:** LIVE_CHECK (real-time verification at pilot execution time — not during knowledge preparation)

---

## 8. Verification Rules by Claim Type

### Formal Fact (OFFICIAL primary)

Stop when:
- An appropriate authoritative source establishes the claim
- The scope is clear (not ambiguous between locations or conditions)
- Freshness is acceptable (recent enough to be current)
- No material unresolved conflict exists

A single high-quality official source may be sufficient for stable formal facts. Conflicting secondary sources require conflict classification before closure.

---

### Spatial / Route Fact (MAP_ROUTE primary)

Stop when:
- Map/route evidence establishes the spatial relationship
- Where direction or transition affects judgment: corroboration from Founder or field experience
- No material contradiction between sources

---

### Experience Pattern (WORLD_EXPERIENCE primary)

Stop when:
- A recurring pattern is adequately supported across multiple independent accounts
- Relevant variation and exception cases are represented
- Additional independent sources are no longer materially changing the operational understanding

One anecdote is not a pattern. Minimum corroboration threshold is qualitative — seek pattern adequacy, not source count.

---

### Local Field Reality (LOCAL_OPERATOR / FOUNDER primary)

Stop when:
- Field reality is established and internally consistent
- Conflicts with official sources are classified (temporal, scope, or genuine disagreement)
- Practical friction is documented sufficiently for the judgment the requirement serves

---

### Contextual Expert Judgment (FOUNDER primary)

Stop when:
- Underlying factual and experiential foundation is VERIFIED_FOR_PREPARATION
- Founder judgment is provided with scope and traveler-state conditions
- Conditions for exceptions and non-recommendations are captured

Founder judgment may not substitute for incomplete factual foundation.

---

### Live-Boundary Knowledge (for VOLATILE/SEMI_STABLE requirements)

Stop when:
- Phoenix knows WHAT fact is volatile
- Phoenix knows WHEN live verification is required (trigger condition)
- Phoenix knows WHICH source role should verify it
- Phoenix knows the fallback behavior if live verification is unavailable

The current live VALUE does not need to be stored as prepared knowledge.

---

## 9. Sufficiency / Stop Conditions

Terminology used in the Collection Plan Matrix (§16):

| Stop Condition Type | Meaning |
|---|---|
| AUTHORITATIVE_FACT_SUFFICIENT | One or more appropriate authoritative sources establish the claim; scope clear; no material conflict |
| EXPERIENCE_PATTERN_SUFFICIENT | Recurring pattern established across multiple independent accounts; variation/exception represented; no new material changes from additional sources |
| RELATIONSHIP_SUFFICIENT | Both endpoint/place foundations adequate; relationship/sequence/direction evidenced; transition burden represented; no material contradiction |
| LIVE_BOUNDARY_SUFFICIENT | Phoenix knows what to verify live, when, and via which source; current value reserved for runtime |
| EXPERT_JUDGMENT_SUFFICIENT | Factual foundation VERIFIED_FOR_PREPARATION; Founder judgment provided with scope, traveler-state conditions, and exception boundary |
| SYSTEM_TEST | Not evidence collection — verified at pilot execution via behavioral observation |

---

## 10. Diminishing-Return Rule

For experience-heavy and review-heavy evidence:

If additional independent sources:
- only repeat already-established patterns
- introduce no material exception or friction that changes the judgment
- provide no new traveler-context variation

...then collection should stop.

```
STOP WHEN PATTERN IS ESTABLISHED.
DO NOT REWARD VOLUME.
```

Do not define arbitrary minimum source counts. Do not require exhaustive search. Define sufficiency qualitatively before collection begins for each requirement.

---

## 11. Conflict Taxonomy

| Type | Definition |
|---|---|
| FACT_CONFLICT | Two sources assert incompatible factual states about the same place/time/condition |
| TEMPORAL_DIFFERENCE | Both sources may have been true at different times; freshness question |
| SCOPE_DIFFERENCE | Claims refer to different locations, segments, conditions, or access points |
| EXPERIENCE_VARIATION | Different travelers genuinely experience burden differently; variation is real not error |
| CONTEXT_CONDITIONAL | Different conclusions are valid under different traveler states or conditions |
| INTERPRETATION_DIFFERENCE | Underlying facts are similar but judgment/meaning differs between sources |
| STALE_EVIDENCE | Older evidence may no longer describe current reality; requires date-aware resolution |
| UNKNOWN_CONFLICT | Cause of disagreement cannot yet be determined with available evidence |

---

## 12. Conflict Handling

### FACT_CONFLICT
→ Seek claim-appropriate authoritative or corroborating evidence
→ Do not average incompatible facts
→ Do not silently accept either; record conflict and resolution path

### TEMPORAL_DIFFERENCE
→ Preserve publication/access dates on both sources
→ Determine which applies currently and which was historical
→ Mark older claim as STALE if superseded; do not discard if historical record is useful

### SCOPE_DIFFERENCE
→ Split claim into scope-specific claims rather than forcing one truth
→ Document scope clearly on each resulting claim

### EXPERIENCE_VARIATION
→ Preserve meaningful variation — do not erase minority-but-relevant friction
→ Capture the variation structure (e.g., "suitable for most travelers; more difficult for X")
→ Do not force a single "average" experience

### CONTEXT_CONDITIONAL
→ Encode the conditions under which each conclusion is valid
→ Both conditions may be correct simultaneously

### INTERPRETATION_DIFFERENCE
→ Preserve attribution and evidence basis for each interpretation
→ Do not silently choose one; record both with provenance

### STALE_EVIDENCE
→ Mark the stale item explicitly with its date
→ Seek current evidence where material to judgment
→ If current evidence unavailable: LIVE_VERIFY or flag as QUALIFICATION_REQUIRED

### UNKNOWN_CONFLICT
→ Keep unresolved
→ Do not close the requirement as VERIFIED while conflict is open
→ Flag for ESCALATION if conflict cannot be resolved through available sources

---

## 13. Escalation Rules

Every requirement must define when normal collection is insufficient.

Escalation trigger conditions:

| Trigger | Condition |
|---|---|
| MATERIAL_UNRESOLVED_CONFLICT | Sources conflict materially and cannot be resolved through available source roles |
| NO_SUITABLE_SOURCE | No appropriate authoritative or experiential source can be identified for this requirement |
| EVIDENCE_TOO_STALE | Best available evidence is too old to be reliable for the judgment, and current evidence is unavailable |
| REPEATED_DISAGREEMENT | Experiential sources consistently disagree in ways that affect the judgment |
| RELATIONSHIP_UNSUPPORTED | Route/relationship evidence cannot establish the required spatial or sequential connection |
| SCOPE_AMBIGUOUS | Evidence scope cannot be determined (ambiguous place, section, or condition) |
| REQUIREMENT_MALFORMED | Evidence collection reveals the Matrix requirement itself is poorly specified |

Escalation outcome options (do not resolve at collection stage without review):

| Outcome | Action |
|---|---|
| MORE_EVIDENCE_REQUIRED | Continue collection under revised source approach |
| FOUNDER_REVIEW_REQUIRED | Founder consultation required before proceeding |
| LOCAL_OPERATOR_REVIEW_REQUIRED | Field inquiry required before proceeding |
| LIVE_VERIFY_REQUIRED | Requirement reclassified to LIVE_ONLY for this pilot |
| REQUIREMENT_REVISION_REVIEW | Matrix requirement may need revision (see §14) |
| UNKNOWN | Evidence cannot support the requirement; accept as UNKNOWN terminal state |

**Escalation must NOT silently change architecture, create Candidates, or promote any hypothesis.**

---

## 14. Requirement Revision Guard

Evidence collection may reveal that a Matrix Evidence Requirement was poorly specified.

**Do not silently rewrite it during collection.**

Procedure:

1. Flag status as BLOCKED / REQUIREMENT_REVISION_REVIEW
2. Preserve the original requirement unchanged in the Matrix
3. Record the evidence or observation that challenges the requirement
4. Conduct a separate explicit revision review
5. Update the Matrix only through an explicit revision run

This prevents research from changing its target to fit collected evidence.

---

## 15. Collection Waves

Six waves designed by dependency, priority, and reuse.

### Wave 0 — Collection Infrastructure / Provenance Readiness

**Before any collection begins:**

Purpose: Establish collection tooling, provenance capture templates, conflict handling records, and source logs.

Activities:
- Confirm provenance schema §6 is ready for use
- Prepare collection log per requirement
- Identify which existing assets (RB-01, RB-02, RB-03) may contribute to specific requirements without re-collection
- Map RB-01/02/03 findings to relevant ERs and record their current PARTIALLY_VERIFIED status

**Wave 0 Exit Condition:**
Provenance schema ready. Existing asset inventory complete. No requirement collection begun.

---

### Wave 1 — High-Reuse P0 Foundations (No Dependencies)

**Requirements:** ER-CC-001, ER-HY-001, ER-OD-001, ER-OD-003

**Rationale:**
- All four have no prerequisite requirements
- All four are P0
- ER-CC-001 serves 4 scenarios (highest reuse)
- ER-HY-001 serves 3 scenarios (second highest reuse)
- ER-OD-001 and ER-OD-003 are foundational Odongdo pillars that unlock Wave 2 requirements

**Wave 1 Exit Condition:**
All four Wave 1 requirements are either VERIFIED_FOR_PREPARATION or BLOCKED with explicit escalation.

---

### Wave 2 — First-Level Dependents

**Requirements:** ER-CC-002, ER-HY-002, ER-REL-001, ER-OD-004, ER-HY-006

**Rationale:**
- ER-CC-002 depends on ER-CC-001 (now Wave 1)
- ER-HY-002 depends on ER-HY-001 (now Wave 1)
- ER-REL-001 depends on ER-CC-001 (now Wave 1) — included here because directional foundation enables Wave 3 relationship work
- ER-OD-004 depends on ER-OD-003 (now Wave 1)
- ER-HY-006 depends on ER-HY-001 (now Wave 1)

**Wave 2 Exit Condition:**
All five requirements either VERIFIED_FOR_PREPARATION or BLOCKED with escalation.

---

### Wave 3 — Second-Level Dependents and Volatile-Boundary Classification

**Requirements:** ER-CC-003, ER-HY-003, ER-HY-007, ER-REL-002, ER-OD-006, ER-CC-005

**Rationale:**
- ER-CC-003 depends on ER-CC-001 + ER-CC-002 (now Wave 1+2)
- ER-HY-003 depends on ER-HY-001 + ER-HY-002 (now Wave 1+2)
- ER-HY-007 depends on ER-HY-006 (now Wave 2)
- ER-REL-002 depends on ER-REL-001 + ER-CC-001 + ER-OD-003 (now Wave 1+2)
- ER-OD-006 and ER-CC-005 are VOLATILE classification requirements needed before Wave 4 relationship and time estimates; their stable-component collection (volatility classification) can proceed independently

Note: ER-OD-006 and ER-CC-005 are LIVE_BOUNDARY_SUFFICIENT requirements. Only their volatility classification is collected as prepared knowledge. Current operational values remain LIVE.

**Wave 3 Exit Condition:**
All six requirements either VERIFIED_FOR_PREPARATION / LIVE_ONLY / BLOCKED with escalation.

---

### Wave 4 — Relationship Judgment, Experience Deepening, Expert Synthesis

**Requirements:** ER-REL-005, ER-OD-002, ER-OD-005, ER-OD-007, ER-HY-004, ER-HY-005, ER-HY-008, ER-CC-004, ER-REL-003, ER-REL-004, ER-REL-006

**Rationale:**
- ER-REL-005 (direction selection judgment) depends on ER-REL-001 + ER-REL-002 (Wave 2+3) — expert judgment synthesis possible after relationship foundations are ready
- ER-OD-002 (visitor experience) depends on ER-OD-001 (Wave 1)
- ER-OD-005 (child suitability) depends on ER-OD-003 + ER-OD-004 (Wave 1+2)
- ER-OD-007 (walking friction) depends on ER-OD-003 (Wave 1)
- ER-HY-004 (rest points) depends on ER-HY-001 (Wave 1)
- ER-HY-005 (alternative access) depends on ER-HY-001 (Wave 1)
- ER-HY-008 (negative knowledge) depends on ER-HY-001~003 + ER-HY-006~007 (Wave 1+2+3) — Founder synthesis after all structural/experiential foundations ready
- ER-CC-004 (per-station child suitability) depends on ER-CC-001~003 (Wave 1+2+3)
- ER-REL-003 (combined time estimate) depends on ER-REL-001~002 + ER-OD-002 + ER-CC-005 (Wave 2+3+4)
- ER-REL-004 (sequence friction) depends on ER-REL-001~003 (Wave 3+4)
- ER-REL-006 (vehicle impact on direction) depends on ER-REL-001+002+005 + ER-OD-003 (Wave 1+3+4)

**Wave 4 Exit Condition:**
All eleven requirements either VERIFIED_FOR_PREPARATION or BLOCKED with escalation. Founder synthesis requirements (ER-REL-005, ER-HY-008, ER-REL-006) should be among the last in Wave 4 since they depend on other Wave 4 items.

---

### Wave 5 — Supporting Depth and Context System

**Requirements:** ER-HY-009, ER-CX-001

**Rationale:**
- ER-HY-009 (P2) is supporting depth for H-1; depends on ER-HY-001 (Wave 1) but is P2 so deferred
- ER-CX-001 (context system) is not place evidence; verified through system behavior testing at pilot execution

**Wave 5 Exit Condition:**
ER-HY-009 either VERIFIED_FOR_PREPARATION or BLOCKED.
ER-CX-001 design requirement documented; verification deferred to pilot execution.

---

## 16. 29-Requirement Collection Plan Matrix

| ER ID | Wave | Priority | Reason for Order | Prerequisite | Primary Source Role | Secondary Source Role | Collection Method | Stop Condition Type | Status |
|---|---|---|---|---|---|---|---|---|---|
| ER-OD-001 | 1 | P0 | No dependencies; Odongdo foundational character | None | WORLD_EXPERIENCE | OFFICIAL / FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-OD-002 | 4 | P1 | Depends on OD-001; experience deepening | ER-OD-001 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-OD-003 | 1 | P0 | No dependencies; vehicle access unlocks OD-004/005/007 | None | OFFICIAL | LOCAL_OPERATOR / FOUNDER | OFFICIAL_WEB_REVIEW | AUTHORITATIVE_FACT_SUFFICIENT | NOT_STARTED |
| ER-OD-004 | 2 | P0 | Depends on OD-003; parking friction required for O-2 | ER-OD-003 | LOCAL_OPERATOR / FOUNDER | WORLD_EXPERIENCE | LOCAL_OPERATOR_INQUIRY + FOUNDER_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-OD-005 | 4 | P1 | Depends on OD-003 + OD-004; child-context deepening | ER-OD-003, ER-OD-004 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-OD-006 | 3 | P1 | Volatile-boundary classification needed before O-3 assessment; independent of other OD | None | OFFICIAL | LOCAL_OPERATOR | OFFICIAL_WEB_REVIEW | LIVE_BOUNDARY_SUFFICIENT | NOT_STARTED |
| ER-OD-007 | 4 | P1 | Depends on OD-003; walking friction deepening | ER-OD-003 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-HY-001 | 1 | P0 | No dependencies; foundational for all 3 Hyangiram scenarios; highest structural importance | None | OFFICIAL / LOCAL_OPERATOR | WORLD_EXPERIENCE | OFFICIAL_WEB_REVIEW + LOCAL_OPERATOR_INQUIRY | AUTHORITATIVE_FACT_SUFFICIENT | NOT_STARTED |
| ER-HY-002 | 2 | P0 | Depends on HY-001; experiential burden required for H-1/H-2 | ER-HY-001 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-HY-003 | 3 | P0 | Depends on HY-001 + HY-002; elder-specific pattern needed for H-2 judgment | ER-HY-001, ER-HY-002 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-HY-004 | 4 | P1 | Depends on HY-001; rest point nuance for H-2 | ER-HY-001 | WORLD_EXPERIENCE / FOUNDER | LOCAL_OPERATOR | WE_REVIEW + FOUNDER_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-HY-005 | 4 | P1 | Depends on HY-001; alternative access for H-2 | ER-HY-001 | LOCAL_OPERATOR / FOUNDER | OFFICIAL | LOCAL_OPERATOR_INQUIRY + FOUNDER_REVIEW | AUTHORITATIVE_FACT_SUFFICIENT | NOT_STARTED |
| ER-HY-006 | 2 | P0 | Depends on HY-001; visit duration required for H-3 time calculation | ER-HY-001 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-HY-007 | 3 | P0 | Depends on HY-006; travel time required for H-3 feasibility | ER-HY-006 | MAP_ROUTE | FOUNDER / LOCAL_OPERATOR | MAP_ROUTE_CHECK | RELATIONSHIP_SUFFICIENT | NOT_STARTED |
| ER-HY-008 | 4 | P1 | Depends on HY-001~003 + HY-006~007; Founder synthesis possible only after all structural/experiential bases ready | ER-HY-001, ER-HY-002, ER-HY-003, ER-HY-006, ER-HY-007 | FOUNDER | WORLD_EXPERIENCE | FOUNDER_REVIEW | EXPERT_JUDGMENT_SUFFICIENT | NOT_STARTED |
| ER-HY-009 | 5 | P2 | P2 depth; depends on HY-001; seasonal pattern not blocking any P0 judgment | ER-HY-001 | LOCAL_OPERATOR / WORLD_EXPERIENCE | OFFICIAL | LOCAL_OPERATOR_INQUIRY + WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-CC-001 | 1 | P0 | No dependencies; foundational for all 4 cable car scenarios; highest reuse | None | OFFICIAL | FOUNDER / LOCAL_OPERATOR | OFFICIAL_WEB_REVIEW | AUTHORITATIVE_FACT_SUFFICIENT | NOT_STARTED |
| ER-CC-002 | 2 | P0 | Depends on CC-001; per-station access unlocks CC-003/004 | ER-CC-001 | MAP_ROUTE / OFFICIAL | FOUNDER | MAP_ROUTE_CHECK + OFFICIAL_WEB_REVIEW | RELATIONSHIP_SUFFICIENT | NOT_STARTED |
| ER-CC-003 | 3 | P0 | Depends on CC-001 + CC-002; vehicle/parking judgment for C-2/MT-1 | ER-CC-001, ER-CC-002 | LOCAL_OPERATOR / FOUNDER | WORLD_EXPERIENCE | LOCAL_OPERATOR_INQUIRY + FOUNDER_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-CC-004 | 4 | P1 | Depends on CC-001+002+003; child suitability deepening for C-2/MT-1 | ER-CC-001, ER-CC-002, ER-CC-003 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-CC-005 | 3 | P1 | Volatile-boundary classification needed before REL-003/004 and O-3/C-3 operating alignment | ER-CC-001 | OFFICIAL / LOCAL_OPERATOR | FOUNDER | OFFICIAL_WEB_REVIEW + LOCAL_OPERATOR_INQUIRY | LIVE_BOUNDARY_SUFFICIENT | NOT_STARTED |
| ER-REL-001 | 2 | P0 | Depends on CC-001; directional geography is relationship foundation for O-3/C-3 | ER-CC-001 | MAP_ROUTE | FOUNDER / OFFICIAL | MAP_ROUTE_CHECK | RELATIONSHIP_SUFFICIENT | NOT_STARTED |
| ER-REL-002 | 3 | P0 | Depends on REL-001 + CC-001 + OD-003; exit-to-Odongdo connection for O-3/C-3 | ER-REL-001, ER-CC-001, ER-OD-003 | MAP_ROUTE | FOUNDER / WORLD_EXPERIENCE | MAP_ROUTE_CHECK | RELATIONSHIP_SUFFICIENT | NOT_STARTED |
| ER-REL-003 | 4 | P1 | Depends on REL-001+002 + OD-002 + CC-005; combined time estimate for O-3 | ER-REL-001, ER-REL-002, ER-OD-002, ER-CC-005 | MAP_ROUTE / WORLD_EXPERIENCE | FOUNDER | MAP_ROUTE_CHECK + WE_REVIEW | RELATIONSHIP_SUFFICIENT | NOT_STARTED |
| ER-REL-004 | 4 | P1 | Depends on REL-001+002+003; sequence friction for O-3 | ER-REL-001, ER-REL-002, ER-REL-003 | WORLD_EXPERIENCE / FOUNDER | MAP_ROUTE | WE_REVIEW + FOUNDER_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-REL-005 | 4 | P0 | Depends on REL-001+002; direction selection judgment (Founder synthesis after spatial foundations ready) | ER-REL-001, ER-REL-002 | FOUNDER | MAP_ROUTE / LOCAL_OPERATOR | FOUNDER_REVIEW | EXPERT_JUDGMENT_SUFFICIENT | NOT_STARTED |
| ER-REL-006 | 4 | P1 | Depends on REL-001+002+005 + OD-003; vehicle-impact judgment after all direction/spatial bases ready | ER-REL-001, ER-REL-002, ER-REL-005, ER-OD-003 | FOUNDER / LOCAL_OPERATOR | MAP_ROUTE | FOUNDER_REVIEW + LOCAL_OPERATOR_INQUIRY | EXPERT_JUDGMENT_SUFFICIENT | NOT_STARTED |
| ER-CX-001 | 5 | N/A | Context system requirement; not place evidence; verified at pilot execution | ER-OD-005, ER-CC-003, ER-CC-004 | N/A | N/A | SYSTEM_TEST | SYSTEM_TEST | NOT_STARTED |

---

## 17. Detailed Collection Notes by Requirement Group

### High-Reuse Foundation Notes

**ER-CC-001 (Wave 1):** RB-01 is PARTIALLY_VERIFIED and provides early coverage. Wave 0 inventory should assess which RB-01 claims are complete vs require completion. Do not repeat completed RB-01 work. Focus collection on the unfinished portions. Note: "PARTIALLY_VERIFIED" is not the same as VERIFIED_FOR_PREPARATION.

**ER-HY-001 (Wave 1):** Structural physical facts (steps, incline, path structure) require both an official/authoritative base and experiential corroboration that the description is accurate in practice. One source alone is insufficient. Official may describe the structure; WE corroborates whether that description matches real access.

**ER-REL-001 (Wave 2):** Directional geography is a spatial fact (MAP_ROUTE primary), but Founder confirmation of practical implications is valuable. The requirement is to understand what exit each direction produces — not yet which direction to choose (that is ER-REL-005).

---

### Relationship Evidence Notes

**ER-REL-002 (Wave 3):** The connection from each cable car exit to Odongdo must be established per exit station, not as a single route. Two distinct sub-questions: (1) from Station A exit to Odongdo; (2) from Station B exit to Odongdo. Each should be evidenced separately.

**ER-REL-005 (Wave 4):** This is a judgment requirement (EXPERT_JUDGMENT_SUFFICIENT), not a spatial fact. Founder review should occur after ER-REL-001 and ER-REL-002 are VERIFIED_FOR_PREPARATION so the judgment has a fact base. Do not solicit Founder judgment on direction without first establishing the spatial facts.

**ER-REL-006 (Wave 4):** Also a judgment requirement about whether vehicle status materially changes the directional recommendation. If the answer is "vehicle does not change the direction choice," that is itself a finding worth recording. Both "vehicle matters" and "vehicle does not matter" are valid evidenced outcomes.

---

### VOLATILE / LIVE Boundary Notes

**ER-OD-006 (Wave 3):** Collect the volatility classification (is this formally set? is it seasonal? does it change frequently?). Do NOT collect the current operating status. The current value is LIVE at answer time.

**ER-CC-005 (Wave 3):** Same principle — establish the volatility pattern and trigger conditions for cable car operating status. The current status is LIVE at answer time. What Phoenix needs prepared: under what conditions does SOUL flag operating status as requiring live verification.

---

### Founder Synthesis Requirements

**ER-HY-008 (Wave 4):** Negative knowledge boundary requires that ER-HY-001, ER-HY-002, ER-HY-003, ER-HY-006, and ER-HY-007 all be VERIFIED_FOR_PREPARATION before Founder review. Founder cannot provide useful expert boundary judgment without the structural and experiential foundation first.

**ER-REL-005 (Wave 4):** Same principle — ER-REL-001 and ER-REL-002 must be VERIFIED_FOR_PREPARATION first.

**ER-REL-006 (Wave 4):** Must wait for ER-REL-005 as well as the directional foundations.

---

### MT-1 Context System Note

**ER-CX-001 (Wave 5):** This is not a place-evidence collection task. No WE_REVIEW, OFFICIAL_WEB_REVIEW, or FOUNDER_REVIEW is planned. Its verification method is behavioral observation during pilot execution: does the system retain context from Turn 1 in Turns 2 and 3 without re-asking? This is a design verification, not a knowledge collection activity.

The place evidence that MT-1 depends on (ER-OD-005 for Turn 2, ER-CC-003/004 for Turn 3) is collected as part of normal O-2 and C-2 collection. No additional place collection is needed for MT-1 specifically.

---

## 18. Relationship Evidence Special Handling

Per Protocol V0.2 §J and the instruction from the Evidence Requirement Matrix, O-3 and C-3 require relationship evidence that cannot be reduced to individual place records.

**Rule:** Relationship evidence must independently establish where required:
- sequence (which comes before/after)
- direction (which cable car direction, which exit)
- transition (how to get from one place to the other)
- dependency (what one place requires of the other)
- combined burden (total time/friction for the combined experience)
- next-place fit (does the combination work for the traveler's situation)

A complete place record for Odongdo and a complete place record for Cable Car do not automatically provide relationship evidence for O-3 and C-3. Relationship evidence must be collected as a first-class evidence type.

**Collection sequence for relationship evidence:**
1. ER-CC-001 (station identity — Wave 1) and ER-OD-003 (Odongdo vehicle access — Wave 1) provide the endpoint anchors
2. ER-REL-001 (directional outcome — Wave 2) establishes which direction exits where
3. ER-REL-002 (exit-to-Odongdo connection — Wave 3) establishes the connection from each exit to Odongdo
4. ER-REL-003 and ER-REL-004 (Wave 4) add time and friction character to the relationship
5. ER-REL-005 and ER-REL-006 (Wave 4) add expert judgment synthesis

Do not shortcut steps 2-5 by relying on steps 1 alone.

---

## 19. Wave Exit Criteria

### Wave 0 Exit
Provenance schema is ready for use. Existing asset inventory (RB-01/02/03) is mapped to relevant requirements. No collection requirement has begun. All 29 requirements remain NOT_STARTED.

### Wave 1 Exit
ER-CC-001, ER-HY-001, ER-OD-001, ER-OD-003 are each either:
- VERIFIED_FOR_PREPARATION, OR
- BLOCKED with an explicit escalation record

No Wave 1 requirement may remain IN_COLLECTION or PROVISIONALLY_SUPPORTED at Wave 1 exit. Conflicts must be classified.

### Wave 2 Exit
ER-CC-002, ER-HY-002, ER-REL-001, ER-OD-004, ER-HY-006 are each either VERIFIED_FOR_PREPARATION / LIVE_ONLY / BLOCKED with escalation. No open IN_COLLECTION states permitted at exit.

### Wave 3 Exit
ER-CC-003, ER-HY-003, ER-HY-007, ER-REL-002, ER-OD-006, ER-CC-005 are each in a terminal state or BLOCKED with escalation. LIVE_ONLY is an acceptable terminal state for ER-OD-006 and ER-CC-005 (their current values reserved for runtime).

### Wave 4 Exit
All 11 Wave 4 requirements are in terminal states. Founder synthesis requirements (ER-HY-008, ER-REL-005, ER-REL-006) are completed last within Wave 4. No open conflicts may be carried forward unclassified.

### Wave 5 Exit
ER-HY-009 is in a terminal state. ER-CX-001 is documented as SYSTEM_TEST deferred to pilot execution.

**Across all waves:** Do not manufacture certainty to exit a wave. BLOCKED and UNKNOWN are acceptable research outcomes. Evidence sufficiency is the exit criterion — not completion of a source count.

---

## 20. Reuse Tracking in Collection Plan

The following requirements will each be collected once and their findings referenced from multiple scenarios. The Collection Plan must make this reuse traceable.

| ER ID | Serves Scenarios | Reuse Note |
|---|---|---|
| ER-CC-001 | C-1, C-2, C-3, O-3 | Collect once in Wave 1; referenced by all downstream CC and REL work |
| ER-HY-001 | H-1, H-2, H-3 | Collect once in Wave 1; all Hyangiram waves depend on this |
| ER-REL-001 | O-3, C-3 | Collect once in Wave 2; shared directional foundation |
| ER-REL-002 | O-3, C-3 | Collect once in Wave 3; shared connection foundation |
| ER-OD-005 | O-2, MT-1 (Turn 2) | Collect once in Wave 4; MT-1 references via context |
| ER-CC-003 | C-2, MT-1 (Turn 3) | Collect once in Wave 3; MT-1 references via context |
| ER-CC-004 | C-2, MT-1 (Turn 3) | Collect once in Wave 4; MT-1 references via context |
| ER-CC-005 | C-1, C-3, O-3 | Collect once in Wave 3; LIVE boundary shared |
| ER-OD-006 | O-1, O-3 | Collect once in Wave 3; LIVE boundary shared |

Do not duplicate collection merely because a different scenario needs the same requirement. Record all dependent scenarios in the collection log.

---

## 21. Plan Completeness Audit

The following checks were applied after drafting this plan.

**A. Collection Wave assigned?** YES — all 29 requirements assigned to Wave 1–5. ✓

**B. Primary Source Role assigned?** YES — all 29 requirements have primary source role. ✓

**C. Source-claim fit valid?** YES — verified against §7 source authority definitions. No requirement assigns OFFICIAL to experience claims or WORLD_EXPERIENCE to formal rule claims. ✓

**D. Verification Rule defined?** YES — stop condition type per requirement maps to §9 verification rules. ✓

**E. Provenance requirements defined?** YES — §6 provenance schema applies to all future evidence items. ✓

**F. Conflict handling defined?** YES — §11 taxonomy and §12 handling rules apply to all requirements. ✓

**G. Stop Condition defined?** YES — all 29 requirements have stop condition type. ✓

**H. Escalation condition defined?** YES — §13 escalation triggers and outcomes apply to all requirements. ✓

**I. Stability/Live handling defined?** YES — VOLATILE requirements (ER-OD-006, ER-CC-005) in Wave 3 with LIVE_BOUNDARY_SUFFICIENT stop condition; current values reserved for LIVE at runtime. ✓

**J. No actual evidence collected?** CONFIRMED — no web search, map lookup, WE review, Founder consultation, or any collection activity performed in this run. ✓

**K. Matrix requirement unchanged?** CONFIRMED — all 29 Matrix Evidence Requirements remain unmodified. ✓

**L. Collection status remains NOT_STARTED?** CONFIRMED — all 29 plan entries carry NOT_STARTED. ✓

**Additional checks:**

- All Matrix Evidence Slots remain NOT_COLLECTED: CONFIRMED ✓
- No actual place facts entered anywhere in this document: CONFIRMED ✓
- No Hidden Transfer items generated: CONFIRMED ✓
- No SOUL answers generated: CONFIRMED ✓

---

## 22. Explicit Non-Conclusions

| Item | Status |
|---|---|
| Any actual Yeosu place facts collected | NOT COLLECTED |
| Any Evidence Requirement filled | ALL NOT_COLLECTED |
| Any collection activity begun | NOT_STARTED |
| Model A or B preparation | NOT EXECUTED |
| Pilot scenarios run | NOT EXECUTED |
| A/B scored | NONE |
| Hidden Transfer questions generated | NOT GENERATED |
| Pilot results | NONE |
| Prepared Knowledge Model validated | NOT VALIDATED |
| Prepared Context Model validated | NOT VALIDATED |
| Preparation Boundary decided | NOT DECIDED |
| Model winner determined | NOT DETERMINED |
| Candidate created | NONE |
| Architecture Decision made | NONE |
| SSOT promoted | NONE |
| place_knowledge migration approved | NOT APPROVED |

---

## 23. Governance

| Action | Status |
|---|---|
| Collect any actual Yeosu knowledge | PROHIBITED (this run) |
| Web research Odongdo / Hyangiram / Cable Car | PROHIBITED (this run) |
| Execute Pilot | PROHIBITED (this run) |
| Generate Hidden Transfer questions | PROHIBITED (this run) |
| Generate SOUL answers | PROHIBITED (this run) |
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

*SOUL Yeosu 3-Place Controlled Evidence Collection Plan V0.1 — 2026-09-27*
