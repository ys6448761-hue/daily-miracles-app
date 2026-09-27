# SOUL Yeosu 3-Place Pilot — Wave 4 Readiness Check V0.1

**Document ID:** SOUL_YEOSU_WAVE_4_READINESS_CHECK_V0_1  
**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Status:** COMPLETE — Wave 4 entry conditions CONFIRMED

---

## §1. Purpose

This document records the Wave 4 Readiness Check for the SOUL Yeosu 3-Place Research Pilot.

Scope:
- Verify dependency states for all 11 Wave 4 ERs
- Determine which Wave 4 ERs are immediately executable
- Confirm Wave 4 entry conditions per Collection Plan V0.2
- Identify BATCH_01 reuse opportunities
- Derive exactly ONE next action

NOT in scope: Wave 4 evidence collection, web research, Founder judgment solicitation.

---

## §2. Starting Checkpoint

| Item | Value |
|------|-------|
| Branch | staging/storybook-c7a |
| HEAD commit | 2561b6c |
| Controlled Collection Cycles (entering) | 15 |
| WAVE_3_COLLECTION_EXECUTION_COMPLETE | TRUE |
| ALL_WAVE_3_ERS_VERIFIED | FALSE (HY-003 = ACCEPT_PROVISIONAL_WITH_BOUNDARY) |
| Readiness Check Type | PRE-WAVE-4 |

---

## §3. Wave 4 Entry Condition Audit

Per Collection Plan V0.2 §15 and §Wave 4 Exit header:

> Acceptable terminal states before Wave 4 can begin:
> VERIFIED_FOR_PREPARATION / LIVE_ONLY / BLOCKED (with escalation recorded) / UNKNOWN

### Wave 3 Terminal State Audit

| ER | Final State | Terminal? |
|----|-------------|-----------|
| ER-OD-006 | VERIFIED_FOR_PREPARATION | YES |
| ER-HY-003 | ACCEPT_PROVISIONAL_WITH_BOUNDARY | YES — governance disposition recorded; upgrade path documented; escalation artifact created |
| ER-HY-007 | VERIFIED_FOR_PREPARATION | YES |
| ER-CC-005 | VERIFIED_FOR_PREPARATION | YES |

**HY-003 Terminal State Classification:**
`ACCEPT_PROVISIONAL_WITH_BOUNDARY` is treated as terminal equivalent to `BLOCKED with escalation recorded`:
- Governance artifact: `SOUL_YEOSU_ER_HY_003_TARGETED_UPGRADE_V0_1.md` and `SOUL_YEOSU_ER_HY_003_TARGETED_UPGRADE_SECOND_ATTEMPT_V0_1.md`
- Disposition artifact: `SOUL_YEOSU_TRAVELER_CONDITION_EXPERIENCE_REQUIREMENT_HYPOTHESIS_V0_1.md`
- WEB_UPGRADE_PATH_EXHAUSTED (TripAdvisor 403 + Naver platforms inaccessible)
- Open upgrade path: Founder field validation (requires deliberate authorization)
- SOUL behavior documented: ASK (capability, not age) + QUALIFY (EP-3 KNOWN_LIMIT)

**WAVE 4 ENTRY CONDITION: MET**

All Wave 3 ERs are in terminal states. Wave 4 collection may commence.

---

## §4. Dependency State Master Table

All prior-wave ERs required as dependencies by any Wave 4 ER:

| ER | State | Source Artifact |
|----|-------|-----------------|
| OD-001 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_OD_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| OD-003 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_OD_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| OD-004 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_OD_004_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| HY-001 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_HY_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| HY-002 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_HY_002_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| HY-003 | ACCEPT_PROVISIONAL_WITH_BOUNDARY | `SOUL_YEOSU_ER_HY_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` (PROVISIONALLY_SUPPORTED) |
| HY-006 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_HY_006_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| HY-007 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_HY_007_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| CC-001 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_CC_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| CC-002 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_CC_002_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| CC-003 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_CC_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| CC-005 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_CC_005_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| REL-001 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_REL_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| REL-002 | VERIFIED_FOR_PREPARATION | `SOUL_YEOSU_ER_REL_002_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |

---

## §5. Wave 4 ER-by-ER Readiness Status

### Wave 4a — Parallel-Safe (Independent of other Wave 4 ERs)

| ER | Deps Required | Dep States | Priority | Stop Condition | Current Wave 0 State | READY? |
|----|---------------|------------|----------|----------------|----------------------|--------|
| ER-REL-005 | REL-001, REL-002 | ✓ ✓ | P0 | EXPERT_JUDGMENT_SUFFICIENT | CONTEXT_ONLY (EI-REL-005-CTX-A: Founder philosophy, no directional evidence) | **READY** |
| ER-OD-002 | OD-001 | ✓ | P1 | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED | **READY** |
| ER-OD-005 | OD-003, OD-004 | ✓ ✓ | P1 | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED | **READY** |
| ER-OD-007 | OD-003 | ✓ | P1 | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED | **READY** |
| ER-HY-004 | HY-001 | ✓ | P1 | EXPERIENCE_PATTERN_SUFFICIENT | NOT_STARTED | **READY** |
| ER-HY-005 | HY-001 | ✓ | P1 | AUTHORITATIVE_FACT_SUFFICIENT | NOT_STARTED (BATCH_01 reuse available — see §6) | **READY** |
| ER-CC-004 | CC-001, CC-002, CC-003 | ✓ ✓ ✓ | P1 | EXPERIENCE_PATTERN_SUFFICIENT | PARTIALLY_SUPPORTED (EI-CC-004-CTX-A: general WE child/age pattern; per-station gap remains) | **READY** |

**Wave 4a READY count: 7 / 7**

### Wave 4b — Intra-Wave Gated

| ER | Blocking Dep | Blocking State | Unlock Condition | READY? |
|----|-------------|----------------|------------------|--------|
| ER-HY-008 | HY-003 | ACCEPT_PROVISIONAL_WITH_BOUNDARY (NOT VERIFIED_FOR_PREPARATION) | HY-003 → VERIFIED_FOR_PREPARATION (requires Founder field validation; not yet authorized) | **BLOCKED** |
| ER-REL-003 | OD-002 | NOT_STARTED | OD-002 → VERIFIED_FOR_PREPARATION | **BLOCKED** |
| ER-REL-004 | REL-003 | NOT_STARTED | REL-003 → VERIFIED_FOR_PREPARATION | **BLOCKED** |
| ER-REL-006 | REL-005 | NOT_STARTED | REL-005 → VERIFIED_FOR_PREPARATION | **BLOCKED** |

**Wave 4b BLOCKED count: 4 / 4**

---

## §6. BATCH_01 Reuse Pre-Scan

Existing `YEOSU_2026_VERIFICATION_BATCH_01.md` contains admissible evidence for ER-HY-005:

| Field | BATCH_01 Finding | Admissibility for ER-HY-005 |
|-------|-----------------|------------------------------|
| 향일암 admission_fee | 무료 (입장료 폐지; 기존 성인 2,500원 → 0원) | ADMISSIBLE — OFFICIAL source (여수시 공식 + 남해안신문) |
| 향일암 operating hours | 04:00~19:00 (관람시간) | ADMISSIBLE — OFFICIAL source (여수시 공식) |
| Bus access | 111, 111-1, 116번 | ADMISSIBLE — OFFICIAL transit route |
| Public parking | 공영주차장 2시간 무료 | ADMISSIBLE — LOCAL_OPERATOR supporting |

**Caveat:** 입장료 무료 전환 공식 시행일은 추가 확인 권장 (남해한신문 보도 시점 vs. 실제 시행일 불일치 가능성). BATCH_01 records this as "보도에서 시행 예정으로 보도됨." Minor uncertainty does not block AUTHORITATIVE_FACT_SUFFICIENT stop condition for hours/fees.

**Implication for HY-005 collection (Cycle TBD):** BATCH_01 can serve as EI-HY-005-BATCH01 (OFFICIAL/LOCAL_OPERATOR). HY-005 stop condition = AUTHORITATIVE_FACT_SUFFICIENT. BATCH_01 may partially satisfy or fully satisfy depending on ER-HY-005 canonical scenario scope.

Also noted: `YEOSU_TRAVEL_TIME_MATRIX_V0_1.md` has potential relevance to ER-REL-003 (combined time estimates across 3 places). Not actionable now (REL-003 BLOCKED pending OD-002).

---

## §7. Intra-Wave Dependency Chain

```
Wave 4a (7 READY — all parallel-safe):
  OD-002 ──────────────────────────────────────────────────────── unlocks REL-003
  OD-005 (independent)
  OD-007 (independent)
  HY-004 (independent)
  HY-005 (independent; BATCH_01 reuse available)
  CC-004 (independent; partial pattern from Wave 0)
  REL-005 ──────────────────────────────────────────────────────── unlocks REL-006
    ↑ Founder PRIMARY — should execute after other Wave 4a ERs are collected
       (Plan V0.2: "Founder synthesis requirements should be among the last in Wave 4")

Wave 4b (4 BLOCKED — sequential gates):
  REL-003 ← depends: OD-002 (Wave 4a) + REL-001 ✓ + REL-002 ✓ + CC-005 ✓
  REL-004 ← depends: REL-003 (Wave 4b)
  REL-006 ← depends: REL-005 (Wave 4a) + REL-001 ✓ + REL-002 ✓ + OD-003 ✓
  HY-008  ← depends: HY-003 VERIFIED (currently ACCEPT_PROVISIONAL — HARD BLOCK)
              → Only Founder field validation can upgrade HY-003
              → HY-008 has no wave-internal unlock path currently
```

**Critical path for Wave 4 completion:**
OD-002 (Wave 4a) → REL-003 (4b) → REL-004 (4b)
REL-005 (Wave 4a) → REL-006 (4b)
HY-008: blocked; parallel path, not on critical chain

---

## §8. REL-005 Ordering Note

Per Collection Plan V0.2 §642:
> "ER-REL-005 (Wave 4): This is a judgment requirement (EXPERT_JUDGMENT_SUFFICIENT), not a spatial fact. Founder review should occur after ER-REL-001 and ER-REL-002 are VERIFIED_FOR_PREPARATION so the judgment has a fact base."

REL-001 ✓ and REL-002 ✓ — fact base is established. REL-005 is technically executable now.

However, per Plan V0.2 §Wave 4 Exit: "Founder synthesis requirements (ER-REL-005, ER-HY-008, ER-REL-006) should be among the last in Wave 4." This means:
- REL-005 should execute AFTER the other 6 Wave 4a ERs are collected (OD-002, OD-005, OD-007, HY-004, HY-005, CC-004)
- REL-005 can proceed despite HY-008 being BLOCKED (REL-005 has no HY dependency)

---

## §9. HY-008 Block Analysis

Per Collection Plan V0.2 §658:
> "ER-HY-008 (Wave 4): Negative knowledge boundary requires that ER-HY-001, ER-HY-002, ER-HY-003, ER-HY-006, and ER-HY-007 all be VERIFIED_FOR_PREPARATION before Founder review."

HY-003 = ACCEPT_PROVISIONAL_WITH_BOUNDARY (not VERIFIED_FOR_PREPARATION).

**Implication:** ER-HY-008 CANNOT proceed under the governance disposition alone. The Canon Plan explicitly requires VERIFIED_FOR_PREPARATION, not ACCEPT_PROVISIONAL. HY-008 is a HARD BLOCK.

**HY-008 unlock path:** Founder field validation — one qualifying in-field observation of elder descent friction at Hyangiram EP-3 (route bifurcation + experienced descent difficulty). Not currently scheduled or authorized.

**HY-008 Wave 4 exit status:** Will exit Wave 4 as BLOCKED with escalation recorded unless Founder field validation is authorized and executed before Wave 4 closes.

---

## §10. Wave 4 Execution Ordering (Recommended Sequence)

Based on dependency analysis and Plan V0.2 ordering guidance:

```
Phase 4-α (READY — web-researchable, no Founder required):
  Priority 1: ER-OD-002  — unlocks REL-003; highest downstream value
  Priority 2: ER-HY-005  — BATCH_01 reuse available; AUTHORITATIVE_FACT stop; fast close
  Priority 3: ER-HY-004  — experience pattern; HY-001 foundation complete
  Priority 4: ER-OD-005  — experience pattern; OD-003+004 foundation complete
  Priority 5: ER-OD-007  — experience pattern; OD-003 foundation complete
  Priority 6: ER-CC-004  — partial pattern available; per-station gap closure needed

Phase 4-β (READY — requires Founder synthesis, execute last):
  Priority 7: ER-REL-005 — Founder PRIMARY; direction judgment; execute after 4-α complete

Phase 4-γ (GATED — unblocks as 4-α progresses):
  ER-REL-003 ← after OD-002 VERIFIED
  ER-REL-006 ← after REL-005 VERIFIED
  ER-REL-004 ← after REL-003 VERIFIED
  ER-HY-008  ← HARD BLOCK (HY-003 upgrade required; no authorized path)
```

---

## §11. Summary

| Category | Count | ERs |
|----------|-------|-----|
| Wave 4a READY (immediate) | 6 | OD-002, OD-005, OD-007, HY-004, HY-005, CC-004 |
| Wave 4a READY (Founder synthesis — execute last) | 1 | REL-005 |
| Wave 4b BLOCKED (will unblock within Wave 4) | 3 | REL-003, REL-004, REL-006 |
| Wave 4b HARD BLOCKED (no current unlock path) | 1 | HY-008 |
| **Total Wave 4 ERs** | **11** | |

**Wave 4 entry: AUTHORIZED**
**Wave 4a first ER: ER-OD-002** (highest unlock value — opens REL-003 chain)

---

## §12. ONE NEXT ACTION

**Execute ER-OD-002 Controlled Evidence Collection (Wave 4, Cycle 16)**

Rationale:
- OD-002 is the sole non-REL-005 ER that unblocks a Wave 4b ER (REL-003)
- REL-003 further gates REL-004 — two downstream ERs depend on OD-002
- OD-002 dependencies (OD-001 ✓) are fully satisfied
- Source roles: WE primary / FOUNDER secondary
- Stop condition: EXPERIENCE_PATTERN_SUFFICIENT (EP-1 through EP-8)
- BATCH_01 pre-scan: no OD-002 relevant reuse found (Odongdo experience not covered)
- Fresh WE collection required
- Canonical Matrix: OD-002 = Odongdo visit experience pattern (visitor behavior/experience during the visit, not access)

DO NOT execute any other Wave 4 ER until OD-002 cycle is complete and committed.

---

*Document created: 2026-09-28 | Branch: staging/storybook-c7a | Cycle: Wave 4 Readiness Check (pre-Cycle 16)*
