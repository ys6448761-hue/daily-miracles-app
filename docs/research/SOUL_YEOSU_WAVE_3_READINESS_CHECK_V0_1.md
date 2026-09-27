# SOUL Yeosu Wave 3 Readiness Check V0.1
# Controlled Evidence Collection — Pre-Wave 3 Dependency Verification

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Starting HEAD:** a7ee4b5
**Governed by:** SOUL_YEOSU_3_PLACE_CONTROLLED_EVIDENCE_COLLECTION_PLAN_V0_1.md + SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md
**Purpose:** Readiness/dependency check only. No evidence collected. No ER executed.

---

## 1. Starting Checkpoint Verification

| Field | Expected | Actual | Status |
|---|---|---|---|
| HEAD | a7ee4b5 | a7ee4b5 | ✓ MATCH |
| Branch | staging/storybook-c7a | staging/storybook-c7a | ✓ MATCH |
| Wave 1 | COMPLETE | COMPLETE (persisted in Project State + commit 45d8a38) | ✓ CONFIRMED |
| Wave 2 | COMPLETE | COMPLETE (persisted in Project State + commit a7ee4b5) | ✓ CONFIRMED |
| Cycles Completed | 9 | 9 | ✓ CONFIRMED |

**Wave 2 ERs Verified (from Project State + Gap Register):**

| ER | Status | Commit | Artifact |
|---|---|---|---|
| ER-OD-004 | VERIFIED_FOR_PREPARATION | 78cb071 | SOUL_YEOSU_ER_OD_004_... |
| ER-HY-002 | VERIFIED_FOR_PREPARATION | 5f555d2 | SOUL_YEOSU_ER_HY_002_... |
| ER-HY-006 | VERIFIED_FOR_PREPARATION | 7c00202 | SOUL_YEOSU_ER_HY_006_... |
| ER-CC-002 | VERIFIED_FOR_PREPARATION | 1ca995b | SOUL_YEOSU_ER_CC_002_... |
| ER-REL-001 | VERIFIED_FOR_PREPARATION | a7ee4b5 | SOUL_YEOSU_ER_REL_001_... |

**Wave 1 ERs Verified (from Project State):**

| ER | Status | Notes |
|---|---|---|
| ER-OD-001 | VERIFIED_FOR_PREPARATION | Visitor experience profile |
| ER-OD-003 | VERIFIED_FOR_PREPARATION | Vehicle/transit access; artifact confirmed |
| ER-HY-001 | VERIFIED_FOR_PREPARATION | Physical access structure |
| ER-CC-001 | VERIFIED_FOR_PREPARATION | Station identity confirmed |

---

## 2. REL-001 Corpus Interpretation Flag Review

**Persisted finding (CONFLICT-REL-001-02 in REL-001 artifact):**

- Conflict Type: INTERPRETATION_DIFFERENCE
- Claim A: Route Corpus V0.1 (line ~508): assigns "해상케이블카(돌산측 승강장)" to 오동도권 zone
- Geographic reality (confirmed OFFICIAL): 자산측 = mainland/오동도권; 돌산측 = Dolsan Island
- Resolution: Corpus label is an error or naming shorthand; OFFICIAL sources override

**Governance consequence: Option A — no corpus modification.**

- Route Corpus CONTEXT_ONLY status preserved as-is
- Interpretation warning is recorded in REL-001 collection artifact
- No ER reopening required
- No schema or architecture change required
- Downstream REL ERs use OFFICIAL/MAP_ROUTE evidence (REL-001 verified facts), not corpus zone labels
- Route Corpus itself is unchanged; the erroneous zone label remains in the corpus file as a historical artifact; SOUL must not use that label as directional geography evidence

---

## 3. OD-003 Actual Persisted Status

**Authoritative sources (read order: Gap Register §5 → Project State → artifact existence):**

- Gap Register line 338 (OD-003 artifact): `Gap Register Update: ER-OD-003 FULL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)`
- Project State lines 234/304: `Wave 1 ER-OD-003 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)`
- Artifact: `docs/research/SOUL_YEOSU_ER_OD_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` — EXISTS

**Verdict: ER-OD-003 = VERIFIED_FOR_PREPARATION ✓**

**Wave 0 dependency table discrepancy:** Wave 0 dependency tracking table (line ~728) shows ER-OD-003 as `NOT_STARTED` — this is a stale entry. The table was not updated when OD-003 was collected. The Gap Register §5 and Project State are authoritative. No revert or re-collection action required.

**REL-002 consequence:** ER-OD-003 dependency for ER-REL-002 is VERIFIED. REL-002 is not blocked.

---

## 4. Wave 3 ER Contracts

### ER-CC-003 — Per-Station Vehicle Access and Parking
| Field | Value |
|---|---|
| Scenarios | C-2, MT-1 (via C-2 intent) |
| Judgment Need | ANSWER + JUDGMENT — vehicle-aware boarding guidance per station |
| Primary Source | LOCAL_OPERATOR / FOUNDER |
| Secondary Source | WORLD_EXPERIENCE |
| Stability | SEMI_STABLE |
| Live Trigger | Current parking availability if volatile |
| Dependencies | ER-CC-001 ✓, ER-CC-002 ✓ |
| Behavior if Missing | LIVE_VERIFY |
| Stop Condition | EXPERIENCE_PATTERN_SUFFICIENT (plan table) / field-confirmed per station |
| Negative/Exception | YES — parking conditions discouraging vehicle arrival |

### ER-HY-003 — Hyangiram Elder Mobility Friction
| Field | Value |
|---|---|
| Scenarios | H-2 |
| Judgment Need | JUDGMENT — elder/senior mobility suitability |
| Primary Source | WORLD_EXPERIENCE |
| Secondary Source | FOUNDER |
| Stability | STABLE |
| Live Trigger | None |
| Dependencies | ER-HY-001 ✓, ER-HY-002 ✓ |
| Behavior if Missing | ASK |
| Stop Condition | EXPERIENCE_PATTERN_SUFFICIENT |
| Negative/Exception | YES — mobility thresholds below which visit is not advisable |

### ER-HY-007 — Travel Time Evidence to Hyangiram
| Field | Value |
|---|---|
| Scenarios | H-3 |
| Judgment Need | JUDGMENT — time feasibility including travel to/from Hyangiram |
| Primary Source | MAP_ROUTE |
| Secondary Source | FOUNDER / LOCAL_OPERATOR |
| Stability | SEMI_STABLE |
| Live Trigger | Road/transport disruption materially affecting travel time |
| Dependencies | ER-HY-006 ✓ |
| Behavior if Missing | ASK |
| Stop Condition | AUTHORITATIVE_FACT_SUFFICIENT (route-confirmed ranges) |
| Negative/Exception | YES — ranges under which 2-hour window is infeasible |

### ER-REL-002 — Route/Connection from Each Cable Car Exit to Odongdo
| Field | Value |
|---|---|
| Scenarios | O-3, C-3 |
| Judgment Need | ANSWER + JUDGMENT — sequence feasibility; direction selection for Odongdo |
| Primary Source | MAP_ROUTE |
| Secondary Source | FOUNDER / WORLD_EXPERIENCE |
| Stability | STABLE |
| Live Trigger | None for route geography |
| Dependencies | ER-REL-001 ✓, ER-CC-001 ✓, ER-OD-003 ✓ |
| Behavior if Missing | UNKNOWN |
| Stop Condition | RELATIONSHIP_SUFFICIENT (per plan table) / route-confirmed per exit station |
| Negative/Exception | YES — connection impractical or requiring major detour |

### ER-OD-006 — Odongdo Operating Hours / Seasonal Status
| Field | Value |
|---|---|
| Scenarios | O-1 (live requirement), O-3 (operating alignment) |
| Judgment Need | LIVE_VERIFY trigger classification (volatility class) |
| Primary Source | OFFICIAL |
| Secondary Source | LOCAL_OPERATOR |
| Stability | VOLATILE (the ER's own classification requirement) |
| Live Trigger | Always — current operating status must be confirmed when material |
| Dependencies | None (per Matrix) |
| Behavior if Missing | LIVE_VERIFY |
| Stop Condition | LIVE_BOUNDARY_SUFFICIENT (per plan table) |
| Negative/Exception | YES — closed/restricted periods |

### ER-CC-005 — Cable Car Operating Status Volatility Classification
| Field | Value |
|---|---|
| Scenarios | C-1, C-3, O-3 |
| Judgment Need | LIVE_VERIFY trigger classification |
| Primary Source | OFFICIAL / LOCAL_OPERATOR |
| Secondary Source | FOUNDER |
| Stability | VOLATILE (the ER's own classification requirement) |
| Live Trigger | Always — current operating status when material |
| Dependencies | ER-CC-001 ✓ |
| Behavior if Missing | LIVE_VERIFY |
| Stop Condition | LIVE_BOUNDARY_SUFFICIENT (per plan table) |
| Negative/Exception | YES — conditions causing suspension or modification |

---

## 5. Dependency Graph

| ER | Dependencies | Status |
|---|---|---|
| ER-CC-003 | CC-001 ✓, CC-002 ✓ | **READY** |
| ER-HY-003 | HY-001 ✓, HY-002 ✓ | **READY** |
| ER-HY-007 | HY-006 ✓ | **READY** |
| ER-REL-002 | REL-001 ✓, CC-001 ✓, OD-003 ✓ | **READY** |
| ER-OD-006 | None | **READY** |
| ER-CC-005 | CC-001 ✓ | **READY** |

All 6 Wave 3 ERs: READY. No BLOCKED_DEPENDENCY conditions.

---

## 6. Gap State Assessment (Current)

| ER | Wave 0 Gap | New Reusable Evidence (Waves 1–2) | Current Gap | Gap Type |
|---|---|---|---|---|
| CC-003 | FULL_GAP | EI-CC-003-CTX-A (CONFLICT-F documentation, CONTEXT_ONLY); CC-002 station location context | FULL_GAP in practice (CONFLICT-F active; no field-confirmed parking facts) | FULL_GAP |
| HY-003 | FULL_GAP | HY-001 structural WE (PARTIALLY_REUSABLE for context — path structure exists); HY-002 burden WE (SUPPORTING_ONLY — only if accounts explicitly describe elder experience) | Near-FULL_GAP (structural foundation available; elder-specific accounts = 0) | FULL_GAP (admissibility test required at collection) |
| HY-007 | FULL_GAP | Travel Time Matrix: 낭만버스1코스 전남해양수산과학관→향일암 25분 (PARTIALLY_REUSABLE); Expostation→Hyangiram direct: UNKNOWN | PARTIAL_GAP (tour bus leg known; direct routes from key starting points unknown) | PARTIAL_GAP |
| REL-002 | FULL_GAP | EI-REL-001-C: 자산정류장→오동도 도보 ~5분 (MAP_ROUTE, PARTIALLY_REUSABLE); EI-REL-001-E: 돌산정류장→오동도 거북선대교 경유 택시 10~12분 (MAP_ROUTE, PARTIALLY_REUSABLE) | PARTIAL_GAP (structural connection facts established; route character + WE corroboration missing) | PARTIAL_GAP |
| OD-006 | FULL_GAP | OD-001 experience mentions (CONTEXT_ONLY); OD-003 train hours (CONTEXT_ONLY — different entity) | FULL_GAP (volatility classification not established) | FULL_GAP |
| CC-005 | CONTEXT_ONLY | EI-CC-005-CTX-A (WE volatility context: weather/wind factors noted, CONTEXT_ONLY) | FULL_GAP formal classification (OFFICIAL/LOCAL_OPERATOR level required) | FULL_GAP |

---

## 7. Reuse-First Inventory per Wave 3 ER

### ER-CC-003
| Asset | Admissibility | Notes |
|---|---|---|
| EI-CC-003-CTX-A (Wave 0 WE) | CONTEXT_ONLY — CONFLICT_DOCUMENTATION | Documents CONFLICT-F (parking price/policy); does not resolve gap |
| CC-002 EI-CC-002-E through L | CONTEXT_ONLY | Station location facts; access structure; parking is a separate dimension |
| RB-03 FFE-01/02/03/04 | NOT_ADMISSIBLE for CC-003 | Hamel→station travel time; not vehicle parking at station |
| RB-02 | CONTEXT_ONLY | Ticket structure; not parking |

### ER-HY-003
| Asset | Admissibility | Notes |
|---|---|---|
| HY-001 WE (EI-HY-001-D, E) | PARTIALLY_REUSABLE as context | Path structure (narrow passages, steep stairs) informs elder friction context; not elder-specific |
| HY-002 WE (EI-HY-002-A through E) | SUPPORTING_ONLY | Only admissible if accounts explicitly reference elder/senior traveler or mobility concern; general adult difficulty ≠ elder-specific |
| BATCH_01/02/03 | Check at collection | Not yet assessed for elder-specific HY content |
| BATCH_06 RESTAURANT | NOT_ADMISSIBLE | Different domain |

### ER-HY-007
| Asset | Admissibility | Notes |
|---|---|---|
| Travel Time Matrix — 낭만버스1코스 전남해양수산과학관→향일암 | PARTIALLY_REUSABLE | 25 min tour bus leg; not direct from likely traveler start |
| Travel Time Matrix — 여수엑스포역→향일암 direct | NOT_AVAILABLE (UNKNOWN in matrix) | Primary gap item |
| HY-006 (45–90 min site duration) | NOT_ADMISSIBLE for HY-007 | Duration within site; travel-to is separate dimension |
| BATCH_03_TRANSPORT | POTENTIALLY_REUSABLE | Transport hub data; check for Dolsando/Hyangiram bus routes at collection |
| BATCH_04_ISLAND_ACCESS | POTENTIALLY_REUSABLE | Island access data; check for Hyangiram transport at collection |

### ER-REL-002
| Asset | Admissibility | Notes |
|---|---|---|
| EI-REL-001-C (자산→오동도 도보 5분) | **PARTIALLY_REUSABLE** | MAP_ROUTE. Establishes 자산 exit → 오동도 walking distance and mode. Core structural fact. |
| EI-REL-001-E (돌산→오동도 거북선대교 경유 택시 10~12분) | **PARTIALLY_REUSABLE** | MAP_ROUTE. Establishes 돌산 exit → 오동도 cross-bridge requirement and approximate time. Core structural fact. |
| NEG-REL-001-001 (자산→돌산 one-way not efficient for 오동도) | CONTEXT_ONLY | Sets negative direction; REL-002 needs route character for positive connection |
| OD-003 EI-OD-003-A/B/C/D | CONTEXT_ONLY | 오동도 access structure from 오동도 side; not from cable car exit |
| CC-002 EI-CC-002-E/J | CONTEXT_ONLY | Station location facts; REL-002 needs exit-to-destination route |

### ER-OD-006
| Asset | Admissibility | Notes |
|---|---|---|
| OD-001 EI-OD-001-A through E | CONTEXT_ONLY | Visitor experience; hours not the focus of OD-001 |
| OD-003 EI-OD-003-B (train hours 09:30–17:30) | CONTEXT_ONLY | Dongbaek Train = separate entity from OD-006 admission/park hours |
| BATCH_01 through BATCH_06 | Not yet assessed for OD-006 specific content |

### ER-CC-005
| Asset | Admissibility | Notes |
|---|---|---|
| EI-CC-005-CTX-A (WE volatility context) | CONTEXT_ONLY | Weather/wind mentioned; no formal classification |
| CC-001 (station identity) | CONTEXT_ONLY | Station names; not operating volatility |
| CONFLICT-A (price conflict) / CONFLICT-D (reservation) / CONFLICT-G (ride duration) / CONFLICT-H (start time) | SUPPORTING_ONLY | These conflict items from Wave 0 illustrate volatility dimensions without producing classification |

---

## 8. Wave 3 Readiness Table

| ER | Judgment Need | Current Gap | Primary Role | Secondary Role | Dependencies | Dep. Status | Reusable Assets | Remaining Gap | Stop Condition | Readiness |
|---|---|---|---|---|---|---|---|---|---|---|
| CC-003 | Vehicle-aware boarding guidance | FULL_GAP | LOCAL_OPERATOR / FOUNDER | WORLD_EXPERIENCE | CC-001, CC-002 | BOTH ✓ | CONFLICT-F doc (CONTEXT_ONLY) | Field-confirmed parking + vehicle access per station; CONFLICT-F resolution | EXPERIENCE_PATTERN_SUFFICIENT | **READY** |
| HY-003 | Elder mobility suitability judgment | FULL_GAP | WORLD_EXPERIENCE | FOUNDER | HY-001, HY-002 | BOTH ✓ | HY-001/002 structural context (PARTIALLY_REUSABLE / SUPPORTING_ONLY) | Elder-specific WE accounts (0 items currently) | EXPERIENCE_PATTERN_SUFFICIENT | **READY** |
| HY-007 | H-3 time feasibility (travel component) | PARTIAL_GAP | MAP_ROUTE | FOUNDER / LOCAL_OPERATOR | HY-006 | ✓ | Travel Matrix tour-bus leg 25min PARTIALLY_REUSABLE | Direct routes from 엑스포역/오동도/이순신광장 to 향일암 | AUTHORITATIVE_FACT_SUFFICIENT | **READY** |
| REL-002 | Exit→Odongdo connection per station | PARTIAL_GAP | MAP_ROUTE | FOUNDER / WE | REL-001, CC-001, OD-003 | ALL THREE ✓ | EI-REL-001-C + EI-REL-001-E (PARTIALLY_REUSABLE — structural connection established) | Route character + walk quality + WE corroboration; negative connection evidence for 돌산 side | RELATIONSHIP_SUFFICIENT | **READY** |
| OD-006 | Odongdo operating volatility classification | FULL_GAP | OFFICIAL | LOCAL_OPERATOR | None | N/A ✓ | OD-001/003 CONTEXT_ONLY | Formal volatility classification; seasonal variation pattern; closed periods | LIVE_BOUNDARY_SUFFICIENT | **READY** |
| CC-005 | Cable car operating volatility classification | FULL_GAP | OFFICIAL / LOCAL_OPERATOR | FOUNDER | CC-001 | ✓ | EI-CC-005-CTX-A (CONTEXT_ONLY) | Formal classification; wind/weather suspension thresholds; operating modification conditions | LIVE_BOUNDARY_SUFFICIENT | **READY** |

---

## 9. Wave 3 Entry Verdict

**WAVE_3_READY**

All 6 Wave 3 ERs have their dependency prerequisites verified. No BLOCKED_DEPENDENCY conditions exist. Collection may proceed in Plan V0.2 wave ordering.

---

## 10. Prioritization Reasoning

Considerations applied (no new scoring framework — Plan V0.2 canonical criteria):

| Factor | CC-003 | REL-002 | Others |
|---|---|---|---|
| Priority class | P0 | P0 | P1 |
| Dependency readiness | READY | READY | READY |
| Current gap type | FULL_GAP + CONFLICT-F active | PARTIAL_GAP (REL-001-C/E admissible) | FULL_GAP or PARTIAL_GAP |
| Downstream unlock | CC-004, CX-001 (partial) | REL-003, REL-004, REL-005, REL-006 (4 ERs) | Limited |
| Stability overhead | SEMI_STABLE (live trigger design required) | STABLE (no live trigger design) | Varies |
| Scenario coverage | C-2, MT-1 | O-3, C-3 (both highest-complexity scenarios) | H-2/H-3, O-1/O-3, C-1/C-3 |
| Collection efficiency | Low (CONFLICT-F complicates; field-only source roles) | High (2 MAP_ROUTE items already collected; gap is route character + WE) | Medium |

**Selection: ER-REL-002**

- REL-002 and CC-003 are the only P0 Wave 3 ERs.
- REL-002 starts as PARTIAL_GAP vs CC-003's FULL_GAP — collection is materially more efficient.
- REL-002 downstream unlock cascade (4 ERs) exceeds CC-003's (2 ERs).
- REL-002 is STABLE (no live trigger design overhead); CC-003 is SEMI_STABLE.
- REL-002 serves O-3 + C-3 simultaneously, the two scenarios most dependent on relationship evidence.
- CC-003's CONFLICT-F (parking policy conflict) requires conflict resolution during collection, adding uncertainty; REL-002 has no open conflicts from previous waves.

---

## 11. Selected First Wave 3 ER — Current Next Action

**ER: ER-REL-002**

**Gap:** PARTIAL_GAP — 자산정류장→오동도 structural connection established (EI-REL-001-C: 도보 ~5분); 돌산정류장→오동도 cross-bridge structural connection established (EI-REL-001-E: 거북선대교 경유 택시 10~12분). Missing: walk route character from 자산 exit to 오동도 entrance (path quality, friction), 돌산→오동도 burden characterization beyond time estimate, WE corroboration for both connections, negative knowledge (돌산→오동도 impractical for walk?), and any intermediate access friction.

**Source Roles:** MAP_ROUTE (primary), FOUNDER / WORLD_EXPERIENCE (secondary)

**Dependency:** ER-REL-001 VERIFIED ✓ | ER-CC-001 VERIFIED ✓ | ER-OD-003 VERIFIED ✓

**Existing Reuse:**
- EI-REL-001-C: 자산정류장→오동도 입구 도보 ~5분 (MAP_ROUTE) — PARTIALLY_REUSABLE
- EI-REL-001-E: 돌산정류장→오동도 거북선대교 경유 택시 10~12분 (MAP_ROUTE) — PARTIALLY_REUSABLE
- NEG-REL-001-001: 자산→돌산 one-way not efficient for 오동도 — CONTEXT_ONLY (direction; REL-002 needs connection route, not direction)

**Collection Boundary:** Per-exit-station connection from cable car station to Odongdo. NOT: cable car operating status (CC-005), combined sequence time (REL-003), direction selection judgment (REL-005), vehicle-specific concerns (CC-003).

**Explicit Exclusions:**
- ER-REL-003 scope (combined time estimate) — gated on REL-002 + OD-002 + CC-005
- ER-REL-005 scope (direction selection judgment — Founder synthesis) — gated on REL-001 + REL-002
- ER-CC-003 scope (vehicle parking) — separate ER
- ER-OD-003 scope (Odongdo vehicle access) — already VERIFIED; do not re-collect

**Stop Condition:** RELATIONSHIP_SUFFICIENT — route confirmed per exit station, with WE corroboration for at least one station; negative knowledge established for impractical connection.

**DO NOT EXECUTE. This is the declared next action only.**

---

## 12. Audit

| Check | Result |
|---|---|
| A. Starting HEAD = a7ee4b5? | ✓ PASS |
| B. Wave 2 persisted COMPLETE? | ✓ PASS |
| C. REL-001 persisted? | ✓ PASS (artifact confirmed) |
| D. REL-001 interpretation flag reviewed? | ✓ PASS (Option A: no corpus modification) |
| E. No unjustified corpus rewrite? | ✓ PASS |
| F. All six Wave 3 contracts extracted? | ✓ PASS |
| G. All dependencies checked? | ✓ PASS |
| H. OD-003 actual status checked? | ✓ PASS (VERIFIED_FOR_PREPARATION via 3 sources) |
| I. All Gap states checked? | ✓ PASS |
| J. Existing assets inspected before readiness? | ✓ PASS |
| K. No new Evidence collected? | ✓ PASS |
| L. No web/place research performed? | ✓ PASS |
| M. No ER collection artifact created? | ✓ PASS |
| N. No Wave 3 ER marked verified? | ✓ PASS |
| O. Exactly one Next Action selected? | ✓ PASS (ER-REL-002) |
| P. Selected ER NOT executed? | ✓ PASS |
| Q. No second ER launched? | ✓ PASS |
| R. No Candidate? | ✓ PASS |
| S. No Architecture Decision? | ✓ PASS |
| T. No migration/schema/runtime/prod change? | ✓ PASS |
| U. Pilot still not executed? | ✓ PASS |

**All 21 audit checks: PASS**

---

## 13. Administrative Finding

**Wave 0 dependency tracking table (line ~728) — stale OD-003 entry:**
The dependency tracking sub-table in Wave 0 shows ER-OD-003 as `NOT_STARTED`. This is a stale entry. Authoritative sources (Gap Register §5, Project State, artifact existence) confirm OD-003 = VERIFIED_FOR_PREPARATION. No revert required. This discrepancy does not affect any readiness determination. Correction of the stale entry is deferred to the next canonical Wave 0 update pass.

---

*Readiness check complete. No evidence collected. No ER executed. Selected next action: ER-REL-002 (DO NOT EXECUTE until authorized).*
