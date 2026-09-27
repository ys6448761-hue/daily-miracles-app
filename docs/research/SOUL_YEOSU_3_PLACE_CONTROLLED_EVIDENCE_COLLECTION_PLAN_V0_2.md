# SOUL Yeosu 3-Place
# Controlled Evidence Collection Plan V0.2

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 92e6276 (Readiness Review V0.1)
**Status:** CORRECTION RUN — NO COLLECTION EXECUTED

**Supersedes:** V0.1 for execution purposes
**V0.1 preserved at:** `docs/research/SOUL_YEOSU_3_PLACE_CONTROLLED_EVIDENCE_COLLECTION_PLAN_V0_1.md`

**Primary input:**
`docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md`

**Protocol basis:**
`docs/research/SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_2.md`

**Readiness Review:**
`docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_COLLECTION_READINESS_REVIEW_V0_1.md`

This document defines the collection plan only.
No actual Yeosu knowledge is collected here.
All 29 Evidence Requirement slots remain NOT_COLLECTED.
All plan statuses are NOT_STARTED.
No pilot is executed. No Candidate is created.

**Gate B Verdict: PASS** — all 18 readiness findings closed. See §0 for closure table.

---

## 0. V0.1 → V0.2 Correction Summary

Closure table for all 18 findings from Readiness Review V0.1.

| Finding ID | Severity | Area / ER | V0.1 Problem | V0.2 Correction | V0.2 Section | Status |
|---|---|---|---|---|---|---|
| F1 | MAJOR | Blocked-Dependency Propagation / All with prerequisites | No rule when prerequisite is BLOCKED/UNKNOWN/CONFLICTED; downstream could falsely close | Added BLOCKED-DEPENDENCY status and explicit propagation rule; lifecycle transition gate | §5 | CLOSED |
| F2 | MAJOR | Intra-Wave-4 Ordering / REL-003→OD-002; REL-004→REL-003; REL-006→REL-005 | "Should be last" is recommendation only; no enforcement | Wave 4 split into Wave 4a (independent) and Wave 4b (intra-wave dependents) with explicit prerequisite gate | §15 Wave 4a/4b | CLOSED |
| F3 | MAJOR | SEMI_STABLE Live Trigger Gap / OD-003, OD-004, CC-002, CC-003, HY-004, HY-005, HY-007, REL-003, HY-009 | SEMI_STABLE treated as fully stable; no live trigger design required | Added SEMI_STABLE live trigger design protocol; per-ER trigger design required as secondary collection deliverable | §4 Principle 6b, §17 | CLOSED |
| F4 | MAJOR | ER-HY-001 Stop Condition / HY-001 | AUTHORITATIVE_FACT_SUFFICIENT allows closure without WE corroboration; Matrix requires it | Stop condition changed to STRUCTURAL_FACT_WITH_WE_CORROBORATION; §17 note added | §9, §16 Matrix, §17 | CLOSED |
| F5 | MAJOR | Judgment Contamination / HY-008, REL-005, REL-006 | No rule preventing Founder from producing pre-written SOUL answer text | FOUNDER REVIEW OUTPUT CONSTRAINT added; specifies allowed/forbidden Founder outputs | §7, §17 | CLOSED |
| F6 | MINOR | ER-CX-001 Wave Classification / CX-001 | CX-001 in Wave 5 implies it follows normal evidence collection lifecycle | CX-001 removed from Wave 5; placed in separate System Test Requirements section | §15 Wave 5, §15 System Test | CLOSED |
| F7 | MINOR | ER-CX-001 Prerequisite List / CX-001 | Missing OD-003, OD-004, OD-007 (Turn 2) and CC-002 (Turn 3) | Prerequisites expanded to all 7 required ERs | §15 System Test, §16 Matrix | CLOSED |
| F8 | MINOR | ER-HY-003 Stop Condition Scope / HY-003 | EXPERIENCE_PATTERN_SUFFICIENT doesn't enforce elder-specific accounts | §17 note added: elder-specific accounts required; general-difficulty inference insufficient | §17 | CLOSED |
| F9 | MINOR | Provenance Supersession Field / All | No "Superseded By" or "Recommended Refresh Window" field | Two fields added to provenance schema (Fields 17 and 18, total 18 fields) | §6 | CLOSED |
| F10 | MINOR | RB-01 ↔ ER-REL-001 / REL-001 | Matrix notes RB-01 partially addresses REL-001; Plan matrix row doesn't reference it | §17 note and matrix row note added | §17 | CLOSED |
| F11 | MINOR | RB-02 Scope Mapping / CC-001, CC-003 | §3 implies RB-02 maps to CC-001/CC-003; RB-02 covers ticket choice (different scope) | §3 RB-02 description corrected; Wave 0 must verify scope fit before crediting | §3, §15 Wave 0 | CLOSED |
| F12 | MINOR | Wave 0 Exit Condition Vagueness | "Schema ready" and "inventory complete" undefined | Concrete 6-condition Wave 0 exit definition replacing vague condition | §15 Wave 0 | CLOSED |
| F13 | MINOR | ER-REL-001 Stop Condition Scope / REL-001 | "Transition burden represented" in RELATIONSHIP_SUFFICIENT could pull collection into REL-002 territory | §17 note clarifying stop condition scope for REL-001 | §17 | CLOSED |
| F14 | MINOR | OD-007 vs OD-002 Scope Boundary / OD-002, OD-007 | Approach walk evidence overlaps with visit experience; duplicate collection risk | §17 explicit scope boundary note for both OD-002 and OD-007 | §17 | CLOSED |
| F15 | MINOR | ER-CX-001 Lifecycle Status / CX-001 | No SYSTEM_TEST_DEFERRED status; CX-001 has no valid terminal lifecycle state | SYSTEM_TEST_DEFERRED added to lifecycle statuses | §5 | CLOSED |
| F16 | MINOR | ER-HY-007 Starting Point Undefined / HY-007 | "Most likely Yeosu traveler starting locations" not defined | Two representative starting locations defined in §17 | §17 | CLOSED |
| F17 | MINOR | Gap-Collection Procedure Absent / All RB-related | "Focus on unfinished portions" stated for CC-001 only; no general procedure | General 5-step gap-collection procedure added to Wave 0 instructions | §15 Wave 0 | CLOSED |
| F18 | MINOR | Lifecycle Transition Rule Implicit / All | PROVISIONALLY_SUPPORTED → VERIFIED_FOR_PREPARATION transition undefined | Explicit transition rule with 3 conditions added to §5 | §5 | CLOSED |

**Gate B: PASS** — 5 MAJOR CLOSED, 13 MINOR CLOSED, 0 open findings.

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
| Existing partial research | RB-01 (PARTIALLY_VERIFIED), RB-02 (PARTIALLY_VERIFIED), RB-03 (COMPLETE) — Cable Car foundational assets exist |

**Existing assets and their actual scope [CORRECTED from V0.1 — F11]:**

| Asset | Actual Scope | Relevant ERs | Status |
|---|---|---|---|
| RB-01 | Cable Car station identity (names, designations) | ER-CC-001 primarily; RB-01 directional research may partially address ER-REL-001 (Wave 0 must assess) | PARTIALLY_VERIFIED |
| RB-02 | One-way/round-trip ticket choice (VR-006 dimension — ticket selection, not vehicle/parking) | Scope fit for ER-CC-001 or ER-CC-003 must be confirmed by Wave 0 mapping before crediting. RB-02 scope differs from ER-CC-003 (vehicle access/parking). | PARTIALLY_VERIFIED |
| RB-03 | Physical access from Hamel Lighthouse to Cable Car station (Hamel→Jasan approach) — scope is different from pilot's ER-REL-001/002 (Cable Car↔Odongdo) | Wave 0 must verify whether any claims transfer to ER-CC-002 (per-station access); not assumed to satisfy ER-REL scope | COMPLETE |

**IMPORTANT:** All three assets are PARTIALLY_VERIFIED, not VERIFIED_FOR_PREPARATION. Wave 0 maps claims → ERs → tests scope → identifies gaps → plans only gap collection.

---

## 4. Governing Principles

### Principle 1 — Requirement-Driven, Not Search-Driven

Do not plan: "Search everything about Odongdo."

Plan: "ER-XXX requires this type of evidence for this judgment. Collect only enough to satisfy its predefined sufficiency condition."

```
DEFINE SUFFICIENCY BEFORE SEARCH.
```

### Principle 2 — Dependency-Aware Order

Collect high-reuse P0 foundations first. Later requirements may depend on earlier findings. Do not execute later requirements before their prerequisites reach sufficient terminal state (VERIFIED_FOR_PREPARATION, LIVE_ONLY, UNKNOWN, or SYSTEM_TEST_DEFERRED).

### Principle 3 — Claim-Appropriate Authority

No universal source ranking exists. Authority depends on claim type. Official is strongest for formal rules. World Experience is strongest for recurring friction. Founder is strongest for contextual local judgment — after factual foundation is present.

### Principle 4 — Reuse Before Duplication

If a requirement serves multiple scenarios, collect and verify once. Record all scenarios that benefit. Do not re-collect the same requirement because a different scenario needs it.

### Principle 5 — Atomic Evidence

Capture evidence at claim level where practical. One source may support multiple claims. Different claims from the same source may have different stability, authority, and conflict status.

### Principle 6a — Volatile / Live Separation

Establish the LIVE-BOUNDARY (what is volatile, when to check, which source, fallback) as prepared knowledge. The current LIVE VALUE is not collected in advance. It is checked at runtime when scenarios require it.

### Principle 6b — SEMI_STABLE Live Trigger Design [NEW — F3]

SEMI_STABLE requirements require two types of collection deliverables:

1. **Stable pattern/structure** — collected and prepared in the normal wave sequence; reaches VERIFIED_FOR_PREPARATION for this stable component.
2. **Live trigger design** — a secondary deliverable that defines: (a) under what conditions the stable pattern may be stale, (b) what source role should verify currency when that condition is met, (c) the fallback behavior if current status is unavailable.

SEMI_STABLE does NOT mean always live-check. It means: prepared evidence may remain usable, but defined conditions should trigger fresh verification.

The live trigger design is collected as part of the same Wave effort as the stable component. Collection does not close until both deliverables are present.

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
| BLOCKED-DEPENDENCY | Dependent ER cannot advance to VERIFIED_FOR_PREPARATION because one or more required prerequisites are in BLOCKED, CONFLICTED, or UNKNOWN state. Independent evidence may still be collected. |
| VERIFIED_FOR_PREPARATION | Evidence sufficient for this Pilot's prepared-knowledge purpose under recorded boundaries |
| LIVE_ONLY | Underlying fact must be verified live at answer time; stable-pattern knowledge may exist separately |
| UNKNOWN | Evidence genuinely cannot support the requirement; research outcome accepted |
| SYSTEM_TEST_DEFERRED | Requirement is a system-behavior verification, not evidence collection. Verification occurs at pilot execution. No evidence collection lifecycle applies. Terminal state for ER-CX-001. |

**VERIFIED_FOR_PREPARATION does NOT mean eternal truth.**
It means evidence is sufficient for this Pilot's purpose under recorded boundaries and at the recorded time.

Acceptable terminal states: VERIFIED_FOR_PREPARATION / LIVE_ONLY / BLOCKED (with escalation recorded) / UNKNOWN / SYSTEM_TEST_DEFERRED

---

### BLOCKED-DEPENDENCY Propagation Rule [NEW — F1]

**If any prerequisite ER is in status BLOCKED, CONFLICTED, or UNKNOWN, and the dependent ER requires that prerequisite as part of its judgment foundation:**

- The dependent ER MAY continue collecting evidence that is independently useful (evidence not dependent on the blocked prerequisite).
- The dependent ER MUST NOT advance to VERIFIED_FOR_PREPARATION for any claim that requires the blocked prerequisite.
- The dependent ER enters status BLOCKED-DEPENDENCY.
- The blocking chain must be explicitly recorded in the dependency-state tracker (which ER is blocked, which ERs depend on it, and why they cannot close).
- Escalation must be applied before any attempt to close the dependent ER.

**Distinguish:**
```
Evidence collection for independent portions → CAN CONTINUE
Judgment foundation closure requiring blocked prerequisite → CANNOT CLOSE
```

This rule applies to all ERs with prerequisites — not only the examples cited in the readiness review.

---

### Lifecycle Transition Rule [NEW — F18]

A requirement may advance from PROVISIONALLY_SUPPORTED to VERIFIED_FOR_PREPARATION when ALL of the following conditions are true:

(a) Its stop condition type is met per §9 criteria.
(b) No CONFLICT entries remain unclassified or CONFLICT_OPEN.
(c) All hard prerequisites are in terminal states (VERIFIED_FOR_PREPARATION, LIVE_ONLY, UNKNOWN, or SYSTEM_TEST_DEFERRED).

The collector makes this determination explicitly. It is not automatic. When advancing, the collector records which stop condition was met and which terminal-state prerequisites are satisfied.

---

## 6. Evidence Provenance Schema

Every future collected evidence item must carry minimum provenance fields.

**Provenance Schema (18 fields) [Updated from V0.1 16-field schema — F9]:**

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
| Superseded By | Evidence Item ID of the item that supersedes this one, if any. Leave blank if current. (NEW — F9) |
| Recommended Refresh Window | Optional: when this item should be re-verified given its stability class. (NEW — F9) |

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

### FOUNDER REVIEW OUTPUT CONSTRAINT [NEW — F5]

During evidence collection, Founder review output is constrained to judgment-ingredient level.

**Founder MAY produce:**
- Judgment boundary conditions (under what traveler states X is recommended / not recommended)
- Exception cases (when the default judgment reverses)
- Traveler-fit conditions (which traveler types are and are not appropriate)
- Decision boundary scope (confidence range of the judgment)
- Local practical meaning of a fact or route
- Challenge to stale or incomplete evidence
- Conditional judgment ingredient for EXPERT_JUDGMENT_SUFFICIENT close

**Founder MUST NOT produce / store as Prepared Evidence:**
- Final SOUL response text
- Travel recommendation paragraphs in user-facing form
- A/B-specific response wording
- Scripted recommendation language
- Final conversational phrasing directed at the user
- Hidden-transfer answers
- Pre-written "best answer" to a pilot scenario

**Why this matters:** If Founder synthesis for ER-REL-005 or ER-HY-008 produces complete user-facing recommendation text, that text becomes a pre-written answer. Model B would then retrieve a pre-written answer rather than assembling a judgment from evidence — invalidating the A/B comparison.

**If final-answer language emerges in a Founder session:** It must be decomposed into judgment boundary evidence and NOT recorded as a prepared answer. The collector is responsible for applying this decomposition before recording any Founder-session output.

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

**Exception: ER-HY-001 uses STRUCTURAL_FACT_WITH_WE_CORROBORATION — see §9 and §17.**

---

### Structural Fact With World Experience Corroboration (OFFICIAL + WE combined — new for HY-001) [NEW — F4]

Stop when:
- An authoritative source establishes the structural facts (access structure, steps, incline, path character)
- AND at least one independent World Experience source corroborates that the official description matches practical access reality
- AND no material unresolved conflict exists between official description and experiential accounts

Neither an official source alone nor a single WE account alone is sufficient. Both layers must be present before closure.

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
- Founder output is in judgment-ingredient form (§7 FOUNDER OUTPUT CONSTRAINT)

Founder judgment may not substitute for incomplete factual foundation.

---

### Live-Boundary Knowledge (for VOLATILE requirements)

Stop when:
- Phoenix knows WHAT fact is volatile
- Phoenix knows WHEN live verification is required (trigger condition)
- Phoenix knows WHICH source role should verify it
- Phoenix knows the fallback behavior if live verification is unavailable

The current live VALUE does not need to be stored as prepared knowledge.

---

### SEMI_STABLE Pattern + Trigger Design (for SEMI_STABLE requirements) [NEW — F3]

Stop when:
- The stable pattern or structure is established (per the relevant claim-type stop condition above)
- AND the live trigger design is established: (a) stale condition defined, (b) source role for currency verification defined, (c) fallback behavior defined

Both deliverables must be present before SEMI_STABLE requirement closure. See §17 for per-ER trigger designs.

---

## 9. Sufficiency / Stop Conditions

Terminology used in the Collection Plan Matrix (§16):

| Stop Condition Type | Meaning |
|---|---|
| AUTHORITATIVE_FACT_SUFFICIENT | One or more appropriate authoritative sources establish the claim; scope clear; no material conflict |
| STRUCTURAL_FACT_WITH_WE_CORROBORATION | Authoritative source establishes structural facts AND independent WE source corroborates they match practical reality; neither alone sufficient (ER-HY-001 only) |
| EXPERIENCE_PATTERN_SUFFICIENT | Recurring pattern established across multiple independent accounts; variation/exception represented; no new material changes from additional sources |
| RELATIONSHIP_SUFFICIENT | Both endpoint/place foundations adequate; relationship/sequence/direction evidenced; transition burden represented where applicable; no material contradiction |
| LIVE_BOUNDARY_SUFFICIENT | Phoenix knows what to verify live, when, and via which source; current value reserved for runtime |
| SEMI_STABLE_PATTERN_WITH_TRIGGER | Stable pattern ESTABLISHED + live trigger design DEFINED (stale condition, verification source, fallback) |
| EXPERT_JUDGMENT_SUFFICIENT | Factual foundation VERIFIED_FOR_PREPARATION; Founder judgment provided with scope, traveler-state conditions, exception boundary; Founder output in judgment-ingredient form |
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
→ Mark "Superseded By" field if a newer Evidence Item replaces it
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
Wave 4 is split into Wave 4a and Wave 4b to enforce intra-wave dependency order.
ER-CX-001 is not a collection wave — see System Test Requirements below.

---

### Wave 0 — Collection Infrastructure / Provenance Readiness

**Before any collection begins.**

Purpose: Establish collection tooling, provenance capture templates, conflict handling records, dependency-state tracker, and existing asset inventory.

**Activities:**

1. Create provenance capture template using §6 18-field schema; test with at least one placeholder item.
2. Create ER→Evidence linkage log with all 29 ER slots set to NOT_STARTED.
3. Create conflict tracking log and reuse tracking log.
4. Create dependency-state tracker with BLOCKED-DEPENDENCY propagation columns (prerequisite ER, dependent ER, blocking reason, escalation status).
5. Map RB-01, RB-02, RB-03 to relevant ERs — verify scope fit claim by claim:
   - RB-01: Map claims to ER-CC-001; assess whether any directional research partially addresses ER-REL-001.
   - RB-02: Confirm actual claim scope (ticket choice / VR-006 dimension). Verify scope fit before crediting any ER. Do not assume RB-02 satisfies ER-CC-003 (vehicle access/parking) without scope confirmation.
   - RB-03: Assess whether Hamel→Jasan approach claims transfer to ER-CC-002; confirm whether this scope is inside or outside pilot ER-REL-001/002 scope.
6. Gap-collection procedure for each asset (general, applies to all partially-verified assets):
   - (1) Map all existing claims to specific ER slots and claim fields.
   - (2) Identify which ER claims are satisfied at PARTIALLY_VERIFIED level vs. which are missing.
   - (3) Plan new collection only for missing claims.
   - (4) Do not re-collect claims already evidenced unless a conflict review requires re-examination.
   - (5) Record the gap-collection plan as a Wave 0 exit deliverable.

**Wave 0 Exit Condition [UPDATED from V0.1 — F12]:**

Exit Wave 0 when ALL of the following are true:

1. Provenance capture template created and tested with at least one placeholder item.
2. ER→Evidence linkage log exists with all 29 ER slots (status = NOT_STARTED).
3. Conflict tracking log and reuse tracking log both exist.
4. Dependency-state tracker exists with BLOCKED-DEPENDENCY propagation columns.
5. RB-01, RB-02, RB-03 asset scope assessment completed and claims mapped to ER rows with PARTIALLY_VERIFIED notation and gap list.
6. No actual ER evidence has been collected.

---

### Wave 1 — High-Reuse P0 Foundations (No Dependencies)

**Requirements:** ER-CC-001, ER-HY-001, ER-OD-001, ER-OD-003

**Dependency type:** All Wave 1 ERs are independent. No prerequisites within or across waves.

**Rationale:**
- All four have no prerequisite requirements
- All four are P0
- ER-CC-001 serves 4 scenarios (highest reuse); RB-01 provides partial coverage — complete, do not re-execute
- ER-HY-001 serves 3 scenarios (second highest reuse); requires STRUCTURAL_FACT_WITH_WE_CORROBORATION (both Official and WE layers)
- ER-OD-001 and ER-OD-003 are foundational Odongdo pillars that unlock Wave 2 requirements

**Wave 1 Exit Condition:**
All four Wave 1 requirements are in terminal states (VERIFIED_FOR_PREPARATION, BLOCKED with escalation, or UNKNOWN).
No Wave 1 requirement may remain IN_COLLECTION or PROVISIONALLY_SUPPORTED at Wave 1 exit. All conflicts must be classified.

---

### Wave 2 — First-Level Dependents

**Requirements:** ER-CC-002, ER-HY-002, ER-REL-001, ER-OD-004, ER-HY-006

**Dependency type:** All depend on Wave 1 only (HARD DEPENDENCY on Wave 1 prerequisites).

**Rationale:**
- ER-CC-002 depends on ER-CC-001 (Wave 1)
- ER-HY-002 depends on ER-HY-001 (Wave 1)
- ER-REL-001 depends on ER-CC-001 (Wave 1) — directional foundation enables Wave 3 relationship work
- ER-OD-004 depends on ER-OD-003 (Wave 1)
- ER-HY-006 depends on ER-HY-001 (Wave 1)

All five may proceed in parallel once their Wave 1 prerequisites are terminal.

**Wave 2 Exit Condition:**
All five requirements in terminal states. No open IN_COLLECTION states permitted at exit.

---

### Wave 3 — Second-Level Dependents and Volatile-Boundary Classification

**Requirements:** ER-CC-003, ER-HY-003, ER-HY-007, ER-REL-002, ER-OD-006, ER-CC-005

**Dependency type:** Depend on Wave 1 and/or Wave 2 (HARD DEPENDENCY).

**Rationale:**
- ER-CC-003 depends on ER-CC-001 (W1) + ER-CC-002 (W2)
- ER-HY-003 depends on ER-HY-001 (W1) + ER-HY-002 (W2)
- ER-HY-007 depends on ER-HY-006 (W2)
- ER-REL-002 depends on ER-REL-001 (W2) + ER-CC-001 (W1) + ER-OD-003 (W1)
- ER-OD-006 is VOLATILE classification; independent of other Odongdo ERs
- ER-CC-005 is VOLATILE classification; depends on ER-CC-001 (W1) only

ER-OD-006 and ER-CC-005 collect volatility classification only. Current operational values remain LIVE.

**Wave 3 Exit Condition:**
All six requirements in terminal states (VERIFIED_FOR_PREPARATION, LIVE_ONLY, BLOCKED with escalation, or UNKNOWN). LIVE_ONLY is the expected terminal state for ER-OD-006 and ER-CC-005.

---

### Wave 4a — Independent Wave 4 Requirements

**Requirements (7 — may proceed in parallel):**
ER-OD-002, ER-OD-005, ER-OD-007, ER-HY-004, ER-HY-005, ER-CC-004, ER-REL-005

**Dependency type:** Depend on Wave 1, 2, or 3 only (HARD DEPENDENCY on earlier waves). No intra-Wave-4 dependencies among these seven.

**Rationale:**
- ER-OD-002 depends on ER-OD-001 (W1)
- ER-OD-005 depends on ER-OD-003 (W1) + ER-OD-004 (W2)
- ER-OD-007 depends on ER-OD-003 (W1)
- ER-HY-004 depends on ER-HY-001 (W1)
- ER-HY-005 depends on ER-HY-001 (W1)
- ER-CC-004 depends on ER-CC-001 (W1) + ER-CC-002 (W2) + ER-CC-003 (W3)
- ER-REL-005 depends on ER-REL-001 (W2) + ER-REL-002 (W3) — direction selection judgment after spatial foundations

All seven may proceed in parallel once their Wave 1–3 prerequisites are terminal.

**Wave 4a Exit Condition:**
All seven Wave 4a requirements in terminal states.

---

### Wave 4b — Intra-Wave Dependents (Synthesis Last) [F2]

**Requirements (4 — sequential dependency within Wave 4b):**
ER-HY-008, ER-REL-003, ER-REL-004, ER-REL-006

**HARD RULE: Wave 4b requirements may not begin closure until their specified Wave 4a (or earlier) prerequisites are VERIFIED_FOR_PREPARATION. This is an enforced gate, not a recommendation.**

**Dependency type and permitted execution:**

| Requirement | Hard Prerequisite(s) for Closure | Permitted Parallelism |
|---|---|---|
| ER-HY-008 | ER-HY-001 (W1), ER-HY-002 (W2), ER-HY-003 (W3), ER-HY-006 (W2), ER-HY-007 (W3) — all from Waves 1–3 | May begin after all HY-001/002/003/006/007 are terminal. No Wave 4a dependencies. |
| ER-REL-003 | ER-REL-001 (W2), ER-REL-002 (W3), ER-CC-005 (W3), ER-OD-002 (Wave 4a) | MUST NOT close until ER-OD-002 is VERIFIED_FOR_PREPARATION. May collect independently pending OD-002. |
| ER-REL-004 | ER-REL-001 (W2), ER-REL-002 (W3), ER-REL-003 (Wave 4b) | MUST NOT close until ER-REL-003 is VERIFIED_FOR_PREPARATION. May collect independently pending REL-003. |
| ER-REL-006 | ER-REL-001 (W2), ER-REL-002 (W3), ER-OD-003 (W1), ER-REL-005 (Wave 4a) | MUST NOT close until ER-REL-005 is VERIFIED_FOR_PREPARATION. May collect independently pending REL-005. |

**BLOCKED-DEPENDENCY applies:** If any prerequisite is BLOCKED or UNKNOWN, the dependent Wave 4b ER enters BLOCKED-DEPENDENCY until the prerequisite resolves.

**Wave 4b Exit Condition:**
All four requirements in terminal states. No Founder synthesis output recorded in final-answer form — only judgment-ingredient form per §7 FOUNDER OUTPUT CONSTRAINT.

---

### Wave 5 — Supporting Depth

**Requirements (1):** ER-HY-009

**[NOTE: ER-CX-001 removed from Wave 5 — see System Test Requirements below — F6]**

**Rationale:**
- ER-HY-009 (P2) provides supporting depth for H-1; depends on ER-HY-001 (Wave 1); deferred because P2 and not blocking any P0 judgment

**Wave 5 Exit Condition:**
ER-HY-009 in a terminal state. ER-CX-001 is not part of Wave 5.

---

### System Test Requirements [NEW SECTION — F6]

**ER-CX-001 is outside the Evidence Collection Waves.**

ER-CX-001 (MT-1 Context Retention Requirement) is a system-behavior verification, not a place evidence collection task. Its lifecycle terminal state is SYSTEM_TEST_DEFERRED. It is not IN_COLLECTION, not PROVISIONALLY_SUPPORTED, and does not reach VERIFIED_FOR_PREPARATION through evidence collection.

**Verification:** Occurs at pilot execution — does the system retain companion + vehicle context signals from Turn 1 in Turns 2 and 3 without re-asking?

**Prerequisites for the system test to be valid [EXPANDED from V0.1 — F7]:**

Before pilot execution can run MT-1:
- Turn 2 place evidence: ER-OD-003, ER-OD-004, ER-OD-005, ER-OD-007 all VERIFIED_FOR_PREPARATION
- Turn 3 place evidence: ER-CC-002, ER-CC-003, ER-CC-004 all VERIFIED_FOR_PREPARATION

These place ERs are collected as part of O-2 and C-2 collection. No additional place collection is required specifically for MT-1.

**Collection method:** None — SYSTEM_TEST at pilot execution.

---

## 16. 29-Requirement Collection Plan Matrix

| ER ID | Wave | Priority | Reason for Order | Prerequisite | Primary Source Role | Secondary Source Role | Collection Method | Stop Condition Type | Status |
|---|---|---|---|---|---|---|---|---|---|
| ER-OD-001 | 1 | P0 | No dependencies; Odongdo foundational character | None | WORLD_EXPERIENCE | OFFICIAL / FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-OD-002 | 4a | P1 | Depends on OD-001; experience deepening | ER-OD-001 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-OD-003 | 1 | P0 | No dependencies; vehicle access unlocks OD-004/005/007 | None | OFFICIAL | LOCAL_OPERATOR / FOUNDER | OFFICIAL_WEB_REVIEW | AUTHORITATIVE_FACT_SUFFICIENT + SEMI_STABLE_TRIGGER | NOT_STARTED |
| ER-OD-004 | 2 | P0 | Depends on OD-003; parking friction required for O-2 | ER-OD-003 | LOCAL_OPERATOR / FOUNDER | WORLD_EXPERIENCE | LOCAL_OPERATOR_INQUIRY + FOUNDER_REVIEW | SEMI_STABLE_PATTERN_WITH_TRIGGER | NOT_STARTED |
| ER-OD-005 | 4a | P1 | Depends on OD-003 + OD-004; child-context deepening | ER-OD-003, ER-OD-004 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-OD-006 | 3 | P1 | Volatile-boundary classification needed before O-3 assessment; independent of other OD | None | OFFICIAL | LOCAL_OPERATOR | OFFICIAL_WEB_REVIEW | LIVE_BOUNDARY_SUFFICIENT | NOT_STARTED |
| ER-OD-007 | 4a | P1 | Depends on OD-003; walking friction deepening | ER-OD-003 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-HY-001 | 1 | P0 | No dependencies; foundational for all 3 Hyangiram scenarios; highest structural importance | None | OFFICIAL / LOCAL_OPERATOR | WORLD_EXPERIENCE | OFFICIAL_WEB_REVIEW + LOCAL_OPERATOR_INQUIRY + WE_REVIEW (corroboration) | STRUCTURAL_FACT_WITH_WE_CORROBORATION | NOT_STARTED |
| ER-HY-002 | 2 | P0 | Depends on HY-001; experiential burden required for H-1/H-2 | ER-HY-001 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-HY-003 | 3 | P0 | Depends on HY-001 + HY-002; elder-specific pattern needed for H-2 judgment | ER-HY-001, ER-HY-002 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT (elder-specific) | NOT_STARTED |
| ER-HY-004 | 4a | P1 | Depends on HY-001; rest point nuance for H-2 | ER-HY-001 | WORLD_EXPERIENCE / FOUNDER | LOCAL_OPERATOR | WE_REVIEW + FOUNDER_REVIEW | SEMI_STABLE_PATTERN_WITH_TRIGGER | NOT_STARTED |
| ER-HY-005 | 4a | P1 | Depends on HY-001; alternative access for H-2 | ER-HY-001 | LOCAL_OPERATOR / FOUNDER | OFFICIAL | LOCAL_OPERATOR_INQUIRY + FOUNDER_REVIEW | AUTHORITATIVE_FACT_SUFFICIENT + SEMI_STABLE_TRIGGER | NOT_STARTED |
| ER-HY-006 | 2 | P0 | Depends on HY-001; visit duration required for H-3 time calculation | ER-HY-001 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-HY-007 | 3 | P0 | Depends on HY-006; travel time required for H-3 feasibility | ER-HY-006 | MAP_ROUTE | FOUNDER / LOCAL_OPERATOR | MAP_ROUTE_CHECK | SEMI_STABLE_PATTERN_WITH_TRIGGER | NOT_STARTED |
| ER-HY-008 | 4b | P1 | SYNTHESIS DEPENDENCY: all HY-001~003+006~007 must be VERIFIED first; Founder synthesis last | ER-HY-001, ER-HY-002, ER-HY-003, ER-HY-006, ER-HY-007 | FOUNDER | WORLD_EXPERIENCE | FOUNDER_REVIEW | EXPERT_JUDGMENT_SUFFICIENT | NOT_STARTED |
| ER-HY-009 | 5 | P2 | P2 depth; depends on HY-001; seasonal pattern not blocking any P0 judgment | ER-HY-001 | LOCAL_OPERATOR / WORLD_EXPERIENCE | OFFICIAL | LOCAL_OPERATOR_INQUIRY + WE_REVIEW | SEMI_STABLE_PATTERN_WITH_TRIGGER | NOT_STARTED |
| ER-CC-001 | 1 | P0 | No dependencies; foundational for all 4 cable car scenarios; highest reuse | None | OFFICIAL | FOUNDER / LOCAL_OPERATOR | OFFICIAL_WEB_REVIEW (complete RB-01 gaps only) | AUTHORITATIVE_FACT_SUFFICIENT | NOT_STARTED |
| ER-CC-002 | 2 | P0 | Depends on CC-001; per-station access unlocks CC-003/004 | ER-CC-001 | MAP_ROUTE / OFFICIAL | FOUNDER | MAP_ROUTE_CHECK + OFFICIAL_WEB_REVIEW | SEMI_STABLE_PATTERN_WITH_TRIGGER | NOT_STARTED |
| ER-CC-003 | 3 | P0 | Depends on CC-001 + CC-002; vehicle/parking judgment for C-2/MT-1 | ER-CC-001, ER-CC-002 | LOCAL_OPERATOR / FOUNDER | WORLD_EXPERIENCE | LOCAL_OPERATOR_INQUIRY + FOUNDER_REVIEW | SEMI_STABLE_PATTERN_WITH_TRIGGER | NOT_STARTED |
| ER-CC-004 | 4a | P1 | Depends on CC-001+002+003; child suitability deepening for C-2/MT-1 | ER-CC-001, ER-CC-002, ER-CC-003 | WORLD_EXPERIENCE | FOUNDER | WE_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-CC-005 | 3 | P1 | Volatile-boundary classification needed before REL-003/004 and O-3/C-3 operating alignment | ER-CC-001 | OFFICIAL / LOCAL_OPERATOR | FOUNDER | OFFICIAL_WEB_REVIEW + LOCAL_OPERATOR_INQUIRY | LIVE_BOUNDARY_SUFFICIENT | NOT_STARTED |
| ER-REL-001 | 2 | P0 | Depends on CC-001; directional geography is relationship foundation for O-3/C-3; assess RB-01 directional research first | ER-CC-001 | MAP_ROUTE | FOUNDER / OFFICIAL | MAP_ROUTE_CHECK (after RB-01 assessment) | RELATIONSHIP_SUFFICIENT | NOT_STARTED |
| ER-REL-002 | 3 | P0 | Depends on REL-001 + CC-001 + OD-003; exit-to-Odongdo connection for O-3/C-3 | ER-REL-001, ER-CC-001, ER-OD-003 | MAP_ROUTE | FOUNDER / WORLD_EXPERIENCE | MAP_ROUTE_CHECK | RELATIONSHIP_SUFFICIENT | NOT_STARTED |
| ER-REL-003 | 4b | P1 | INTRA-WAVE DEPENDENCY: requires OD-002 from Wave 4a + REL-001+002+CC-005 from W2+3 | ER-REL-001, ER-REL-002, ER-OD-002, ER-CC-005 | MAP_ROUTE / WORLD_EXPERIENCE | FOUNDER | MAP_ROUTE_CHECK + WE_REVIEW | SEMI_STABLE_PATTERN_WITH_TRIGGER | NOT_STARTED |
| ER-REL-004 | 4b | P1 | INTRA-WAVE DEPENDENCY: requires REL-003 from Wave 4b | ER-REL-001, ER-REL-002, ER-REL-003 | WORLD_EXPERIENCE / FOUNDER | MAP_ROUTE | WE_REVIEW + FOUNDER_REVIEW | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED |
| ER-REL-005 | 4a | P0 | Depends on REL-001+002; direction selection judgment after spatial foundations ready | ER-REL-001, ER-REL-002 | FOUNDER | MAP_ROUTE / LOCAL_OPERATOR | FOUNDER_REVIEW | EXPERT_JUDGMENT_SUFFICIENT | NOT_STARTED |
| ER-REL-006 | 4b | P1 | INTRA-WAVE DEPENDENCY: requires REL-005 from Wave 4a + REL-001+002+OD-003 from earlier | ER-REL-001, ER-REL-002, ER-REL-005, ER-OD-003 | FOUNDER / LOCAL_OPERATOR | MAP_ROUTE | FOUNDER_REVIEW + LOCAL_OPERATOR_INQUIRY | EXPERT_JUDGMENT_SUFFICIENT | NOT_STARTED |
| ER-CX-001 | SYSTEM_TEST | N/A | Outside Evidence Collection Waves — system-behavior verification at pilot execution | ER-OD-003, ER-OD-004, ER-OD-005, ER-OD-007 (Turn 2); ER-CC-002, ER-CC-003, ER-CC-004 (Turn 3) | N/A | N/A | SYSTEM_TEST | SYSTEM_TEST | SYSTEM_TEST_DEFERRED |

---

## 17. Detailed Collection Notes by Requirement Group

### High-Reuse Foundation Notes

**ER-CC-001 (Wave 1):** RB-01 is PARTIALLY_VERIFIED and provides early coverage. Wave 0 inventory assesses which RB-01 claims are complete vs. require completion. Do not repeat completed RB-01 work. Apply general gap-collection procedure (§15 Wave 0). PARTIALLY_VERIFIED ≠ VERIFIED_FOR_PREPARATION.

**ER-HY-001 (Wave 1):** Stop condition is STRUCTURAL_FACT_WITH_WE_CORROBORATION — ER-HY-001 CANNOT be closed on an official source alone. Required: (1) Official/authoritative source establishes structural access facts (steps, incline, path character, approach extent). (2) At least one independent World Experience source corroborates that the official description matches practical access reality. Both must be PROVISIONALLY_SUPPORTED before VERIFIED_FOR_PREPARATION transition.

**ER-REL-001 (Wave 2):** Wave 0 must assess whether RB-01 directional findings partially satisfy this requirement before planning fresh MAP_ROUTE collection. Do not plan new MAP_ROUTE collection for REL-001 until RB-01 assessment is complete (see F10).

RELATIONSHIP_SUFFICIENT for ER-REL-001 is satisfied when each cable car direction's physical exit location is established and Founder confirms practical geography. "Transition burden" in the RELATIONSHIP_SUFFICIENT definition refers to ER-REL-002 scope (connection from exit to Odongdo), NOT to ER-REL-001. Do not extend ER-REL-001 collection into Odongdo connection territory — that is ER-REL-002's scope. (F13)

---

### Scope Boundary Notes

**ER-OD-002 vs ER-OD-007 Scope Boundary [NEW — F14]:**

- ER-OD-002 scope: visitor experience WITHIN Odongdo after entry — time, physical scope of visit, experiential character, what visitors encounter during the visit.
- ER-OD-007 scope: walking burden from the vehicle arrival/parking point to the Odongdo entry point — the approach before entry.

Evidence describing the approach walk (before entry) belongs to OD-007.
Evidence describing the visit itself (after entry) belongs to OD-002.
Evidence from a single WE source covering both must be split into two separate Evidence Items with appropriate scope fields. Do not re-collect approach evidence as OD-002 content or visit-character evidence as OD-007 content.

---

### Relationship Evidence Notes

**ER-REL-002 (Wave 3):** The connection from each cable car exit to Odongdo must be established per exit station, not as a single route. Two distinct sub-questions: (1) from Station A exit to Odongdo; (2) from Station B exit to Odongdo. Each should be evidenced separately.

**ER-REL-005 (Wave 4a):** EXPERT_JUDGMENT_SUFFICIENT. Founder review should occur after ER-REL-001 and ER-REL-002 are VERIFIED_FOR_PREPARATION. Do not solicit Founder judgment on direction without first establishing the spatial facts. Founder output must follow the FOUNDER OUTPUT CONSTRAINT — judgment boundary conditions and exception cases only, not pre-written direction recommendation text.

**ER-REL-006 (Wave 4b):** Also a judgment requirement. Both "vehicle matters" and "vehicle does not matter" are valid evidenced outcomes. MUST NOT begin closure until ER-REL-005 is VERIFIED_FOR_PREPARATION. If REL-005 is BLOCKED, REL-006 enters BLOCKED-DEPENDENCY.

**ER-REL-003 (Wave 4b):** MUST NOT begin closure until ER-OD-002 is VERIFIED_FOR_PREPARATION. May collect MAP_ROUTE and WE evidence independently, but cannot close the combined time estimate without OD-002's visit duration foundation.

---

### Founder Synthesis Requirements

**ER-HY-008 (Wave 4b):** SYNTHESIS DEPENDENCY — ER-HY-001, ER-HY-002, ER-HY-003, ER-HY-006, and ER-HY-007 must ALL be in terminal states before Founder review begins. If any is BLOCKED, HY-008 enters BLOCKED-DEPENDENCY. Founder output must be in judgment-ingredient form per §7 FOUNDER OUTPUT CONSTRAINT — not pre-written SOUL answer text about when Hyangiram is inadvisable.

**ER-REL-005 (Wave 4a):** See Relationship Evidence Notes above.

**ER-REL-006 (Wave 4b):** See Relationship Evidence Notes above.

---

### VOLATILE / LIVE Boundary Notes

**ER-OD-006 (Wave 3):** Collect the volatility classification (is this formally set? seasonal? changes frequently?). Do NOT collect the current operating status. The current value is LIVE at answer time.

**ER-CC-005 (Wave 3):** Same principle — establish the volatility pattern and trigger conditions for cable car operating status. The current status is LIVE at answer time. What Phoenix needs prepared: under what conditions does SOUL flag operating status as requiring live verification.

---

### SEMI_STABLE Live Trigger Design [NEW — F3]

For each SEMI_STABLE requirement, two deliverables are required. The table below defines the trigger design (deliverable 2) that must accompany the stable pattern/structure (deliverable 1).

| ER | Stale Condition | Verification Source Role | Fallback Behavior |
|---|---|---|---|
| ER-OD-003 | Material change to vehicle access policy or formal restriction | OFFICIAL + LOCAL_OPERATOR | QUALIFY on vehicle access; advise traveler to check official source before travel |
| ER-OD-004 | High-traffic periods, known seasonal events, or local operator reports of current volatility | LOCAL_OPERATOR (field check) | Advise traveler to verify parking availability before departure; cannot guarantee |
| ER-CC-002 | Road construction, event-based closure, or temporary access modification reported | OFFICIAL + LOCAL_OPERATOR | Confirm via official source before travel; QUALIFY if unavailable |
| ER-CC-003 | Peak event days, seasonal changes to parking configuration, or field reports of current congestion | LOCAL_OPERATOR (field check) | Advise traveler to check station parking before departure; note which station typically has less friction based on stable pattern |
| ER-HY-004 | Rest facility renovation, removal, or temporary closure reported by local operator | LOCAL_OPERATOR | QUALIFY that rest point details may have changed; traveler should verify on-site |
| ER-HY-005 | New alternative route opened, existing alternative closed or restricted | LOCAL_OPERATOR + OFFICIAL | Cannot confirm or deny alternative access; advise traveler to ask locally before committing to the approach |
| ER-HY-007 | Road construction, route change, or major traffic events materially affecting travel time | MAP_ROUTE (current routing at answer time) + LOCAL_OPERATOR | Use wider time range estimate; note potential disruption; if critical — traveler should re-check before travel |
| ER-REL-003 | Cable car operating status change (ER-CC-005 live trigger fired) or Odongdo access point change | ER-CC-005 live-check result + OFFICIAL | Describe sequence without time framing; QUALIFY on feasibility; defer to CC-005 live verification |
| ER-HY-009 | Entering peak season, national holidays, or known festival periods | LOCAL_OPERATOR + timing context check | Acknowledge seasonal variation possibility; note specific peak/off-peak character from stable pattern; advise current-status check for crowd density |

The stable deliverable (pattern/structure) reaches VERIFIED_FOR_PREPARATION independently. The live trigger design is recorded as a secondary provenance note on the same requirement. Both must be present before the requirement is fully closed.

---

### Elder-Specific Pattern Note

**ER-HY-003 (Wave 3) [NEW — F8]:** EXPERIENCE_PATTERN_SUFFICIENT is satisfied ONLY by accounts describing elder or mobility-sensitive traveler experiences specifically. General-difficulty accounts applied by inference to elders are NOT sufficient. The pattern must emerge from elder-specific or mobility-sensitive experiential accounts. If sufficient elder-specific accounts cannot be found, escalate via NO_SUITABLE_SOURCE trigger.

---

### ER-HY-007 Starting Points [NEW — F16]

**ER-HY-007 (Wave 3):** Representative starting locations for travel time collection:
(a) Yeosu Expo Station area — the most common tourist arrival point for train travelers.
(b) Yeosu downtown waterfront area — second representative point for travelers already in the city center.

Starting points must be defined before collection begins. Do not choose starting points during collection. Travel time ranges should be established from both representative starting points. Acknowledge that traveler starting position may vary and should be ASKed if H-3 feasibility is marginal.

---

### MT-1 Context System Note

**ER-CX-001 (System Test — outside waves):** This is not a place-evidence collection task. No WE_REVIEW, OFFICIAL_WEB_REVIEW, or FOUNDER_REVIEW is planned. Verification is behavioral at pilot execution. The place evidence that MT-1 depends on is collected as part of normal O-2 and C-2 collection. See §15 System Test Requirements for full prerequisite list.

---

## 18. Dependency Graph Summary

| Dependency Type | Definition | Examples in This Plan |
|---|---|---|
| HARD DEPENDENCY | Dependent cannot close without prerequisite in terminal state | HY-002 cannot close without HY-001 VERIFIED. REL-003 cannot close without OD-002 VERIFIED. |
| SOFT DEPENDENCY | Earlier evidence materially improves interpretation; independent collection can proceed | OD-002 (W4a) improves context for REL-003 (W4b) but OD-002 evidence can be collected independently. |
| SYNTHESIS DEPENDENCY | Judgment/synthesis must occur after specified factual/experiential foundations are complete | HY-008: all 5 prerequisites VERIFIED before Founder review. REL-005: REL-001+002 VERIFIED before Founder. |
| SYSTEM DEPENDENCY | System-behavior verification, not evidence collection | ER-CX-001: all Turn 2+3 place ERs VERIFIED before pilot execution. |
| INTRA-WAVE DEPENDENCY | Within Wave 4b, specific ordering is enforced | REL-003 before REL-004. REL-005 before REL-006. OD-002 (4a) before REL-003 (4b). |

**BLOCKED-DEPENDENCY propagation:** When any prerequisite enters BLOCKED or UNKNOWN, all dependent ERs that require it for closure enter BLOCKED-DEPENDENCY. Dependency-state tracker must reflect the full chain.

---

## 19. Wave Exit Criteria

### Wave 0 Exit
Six concrete conditions defined in §15 Wave 0. Provenance template tested. All 29 ER slots in linkage log. Trackers created. RB assets mapped with gap plans. No evidence collected.

### Wave 1 Exit
ER-CC-001, ER-HY-001, ER-OD-001, ER-OD-003 each in terminal state. All conflicts classified. No requirement in IN_COLLECTION or PROVISIONALLY_SUPPORTED.

### Wave 2 Exit
ER-CC-002, ER-HY-002, ER-REL-001, ER-OD-004, ER-HY-006 each in terminal state. No open IN_COLLECTION states permitted.

### Wave 3 Exit
ER-CC-003, ER-HY-003, ER-HY-007, ER-REL-002, ER-OD-006, ER-CC-005 each in terminal state. LIVE_ONLY is acceptable for OD-006 and CC-005.

### Wave 4a Exit
All seven Wave 4a requirements (ER-OD-002, OD-005, OD-007, HY-004, HY-005, CC-004, REL-005) in terminal states. Wave 4b may begin for any requirement whose 4a prerequisites are now terminal.

### Wave 4b Exit
All four Wave 4b requirements (ER-HY-008, REL-003, REL-004, REL-006) in terminal states. No Founder output recorded in final-answer form. No open conflicts unclassified.

### Wave 5 Exit
ER-HY-009 in terminal state. ER-CX-001 remains SYSTEM_TEST_DEFERRED (unchanged — no evidence collection required).

### System Test Prerequisites
Before MT-1 system test can be declared ready: ER-OD-003, OD-004, OD-005, OD-007, CC-002, CC-003, CC-004 all VERIFIED_FOR_PREPARATION.

**Across all waves:** Do not manufacture certainty to exit a wave. BLOCKED and UNKNOWN are acceptable research outcomes. BLOCKED-DEPENDENCY is a valid state when prerequisite chains are broken.

---

## 20. Relationship Evidence Special Handling

Per Protocol V0.2 §J and the Evidence Requirement Matrix, O-3 and C-3 require relationship evidence that cannot be reduced to individual place records.

**Rule:** Relationship evidence must independently establish where required:
- sequence (which comes before/after)
- direction (which cable car direction, which exit)
- transition (how to get from one place to the other)
- dependency (what one place requires of the other)
- combined burden (total time/friction for the combined experience)
- next-place fit (does the combination work for the traveler's situation)

A complete place record for Odongdo and a complete place record for Cable Car do not automatically provide relationship evidence for O-3 and C-3. Relationship evidence must be collected as a first-class evidence type.

**Collection sequence for relationship evidence:**
1. ER-CC-001 (W1) + ER-OD-003 (W1) — endpoint anchors
2. ER-REL-001 (W2) — which direction exits where
3. ER-REL-002 (W3) — connection from each exit to Odongdo
4. ER-OD-002 (W4a) — visit duration (prerequisite for REL-003)
5. ER-REL-005 (W4a) — direction selection judgment (Founder synthesis)
6. ER-REL-003 (W4b, after OD-002) — time and time trigger design
7. ER-REL-004 (W4b, after REL-003) — friction character
8. ER-REL-006 (W4b, after REL-005) — vehicle-impact judgment

Do not shortcut steps 2–8 by relying on step 1 alone.

---

## 21. Reuse Tracking in Collection Plan

| ER ID | Serves Scenarios | Reuse Note |
|---|---|---|
| ER-CC-001 | C-1, C-2, C-3, O-3 | Collect once in Wave 1; referenced by all downstream CC and REL work |
| ER-HY-001 | H-1, H-2, H-3 | Collect once in Wave 1; all Hyangiram waves depend on this |
| ER-REL-001 | O-3, C-3 | Collect once in Wave 2; shared directional foundation |
| ER-REL-002 | O-3, C-3 | Collect once in Wave 3; shared connection foundation |
| ER-OD-005 | O-2, MT-1 (Turn 2) | Collect once in Wave 4a; MT-1 references via context |
| ER-CC-003 | C-2, MT-1 (Turn 3) | Collect once in Wave 3; MT-1 references via context |
| ER-CC-004 | C-2, MT-1 (Turn 3) | Collect once in Wave 4a; MT-1 references via context |
| ER-CC-005 | C-1, C-3, O-3 | Collect once in Wave 3; LIVE boundary shared |
| ER-OD-006 | O-1, O-3 | Collect once in Wave 3; LIVE boundary shared |

Do not duplicate collection merely because a different scenario needs the same requirement. Record all dependent scenarios in the collection log.

---

## 22. Plan Completeness Audit (V0.2)

**A. Collection Wave assigned?** YES — all 29 requirements assigned to Wave 1–5 or SYSTEM_TEST. ER-CX-001 outside waves. ✓

**B. Primary Source Role assigned?** YES — all 29 requirements have primary source role. ✓

**C. Source-claim fit valid?** YES — verified against §7 source authority definitions. ✓

**D. Verification Rule defined?** YES — stop condition type per requirement maps to §9 verification rules. ER-HY-001 uses new STRUCTURAL_FACT_WITH_WE_CORROBORATION. ✓

**E. Provenance requirements defined?** YES — §6 18-field provenance schema applies to all future evidence items. ✓

**F. Conflict handling defined?** YES — §11 taxonomy and §12 handling rules apply to all requirements. ✓

**G. Stop Condition defined?** YES — all 29 requirements have stop condition type, including SEMI_STABLE_PATTERN_WITH_TRIGGER for 9 SEMI_STABLE ERs. ✓

**H. Escalation condition defined?** YES — §13 escalation triggers and outcomes apply to all requirements. ✓

**I. Stability/Live handling defined?** YES — VOLATILE (OD-006, CC-005) with LIVE_BOUNDARY_SUFFICIENT; SEMI_STABLE (9 ERs) with SEMI_STABLE_PATTERN_WITH_TRIGGER including live trigger designs. ✓

**J. BLOCKED-DEPENDENCY rule defined?** YES — §5 explicit rule with lifecycle status; all intra-Wave-4b dependencies gated. ✓

**K. Founder Output Constraint defined?** YES — §7 FOUNDER section. ✓

**L. No actual evidence collected?** CONFIRMED — no web search, map lookup, WE review, Founder consultation, or any collection activity performed in this run. ✓

**M. Matrix requirement unchanged?** CONFIRMED — all 29 Matrix Evidence Requirements remain unmodified. ✓

**N. Collection status remains NOT_STARTED?** CONFIRMED — all 29 plan entries carry NOT_STARTED (or SYSTEM_TEST_DEFERRED for CX-001). ✓

**O. All 18 review findings closed?** CONFIRMED — §0 closure table shows all 18 CLOSED. ✓

**Additional checks:**
- All Matrix Evidence Slots remain NOT_COLLECTED: CONFIRMED ✓
- No actual place facts entered anywhere in this document: CONFIRMED ✓
- No Hidden Transfer items generated: CONFIRMED ✓
- No SOUL answers generated: CONFIRMED ✓
- Wave 4a/4b split enforces intra-wave ordering: CONFIRMED ✓
- CX-001 outside waves with expanded prerequisites: CONFIRMED ✓

---

## 23. Explicit Non-Conclusions

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
| Wave 0 executed | NOT EXECUTED |

---

## 24. Governance

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

*SOUL Yeosu 3-Place Controlled Evidence Collection Plan V0.2 — 2026-09-27*
*Supersedes V0.1 for execution purposes. V0.1 preserved as historical record.*
*Gate B: PASS — 5 MAJOR + 13 MINOR findings CLOSED.*
