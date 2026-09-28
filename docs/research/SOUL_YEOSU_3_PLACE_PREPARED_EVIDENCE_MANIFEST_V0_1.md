# SOUL Yeosu — 3-Place Prepared Evidence Manifest V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Starting HEAD:** 62107bb  
**Phase:** Prepared Knowledge Construction V0.1  
**Authorized By:** Founder (2026-09-28 — post HY-008 Option B decision)  
**Status:** PREPARATION_MANIFEST — READ ONLY after creation

---

## 0. Manifest Purpose

This manifest is the authoritative inventory of all evidence items admitted into the Prepared Knowledge Evidence Pool for the 3-Place Pilot (오동도 / 향일암 / 케이블카). It establishes:

1. Which ERs are included and at what collection status
2. Which ER is excluded and why
3. The total evidence item count per place
4. Cross-ER dependencies and reuse tracking
5. KNOWN_LIMIT declarations that must propagate into all preparation artifacts

**Constraint:** This manifest is compiled from verified ER artifacts only. No new evidence is collected here. No web research. No gap-filling.

---

## 1. ER Inclusion Table

| ER ID | Title | Status | Scenarios | Included | Exclusion Reason |
|-------|-------|---------|-----------|----------|-----------------|
| OD-001 | Odongdo Visitor Experience Profile | VERIFIED_FOR_PREPARATION | O-1, O-2 | ✓ | — |
| OD-002 | Odongdo Visitor Duration Patterns | VERIFIED_FOR_PREPARATION | O-2 | ✓ | — |
| OD-003 | Odongdo Vehicle/Transport Access | VERIFIED_FOR_PREPARATION | O-3 | ✓ | — |
| OD-004 | Odongdo Parking Structure | VERIFIED_FOR_PREPARATION | O-2 (context) | ✓ | — |
| OD-005 | Odongdo Stroller/Child Accessibility | VERIFIED_FOR_PREPARATION | O-1, O-2 | ✓ | — |
| OD-006 | Odongdo Live/Volatility Boundary | VERIFIED_FOR_PREPARATION | O-1, O-3 | ✓ | — |
| OD-007 | Odongdo Physical Scale | VERIFIED_FOR_PREPARATION | O-1, O-2 | ✓ | — |
| HY-001 | Hyangiram Physical Access Structure | VERIFIED_FOR_PREPARATION | H-1, H-2, H-3 | ✓ | — |
| HY-002 | Hyangiram Experiential Burden | VERIFIED_FOR_PREPARATION | H-1, H-2 | ✓ | — |
| HY-003 | Hyangiram Descent Friction | PROVISIONALLY_SUPPORTED | H-2 | ✓ (KNOWN_LIMIT) | — |
| HY-004 | Hyangiram Rest Stops | VERIFIED_FOR_PREPARATION | H-2, H-3 | ✓ | — |
| HY-005 | Hyangiram Flat Alternative Route | VERIFIED_FOR_PREPARATION | H-1, H-2, H-3 | ✓ | — |
| HY-006 | Hyangiram Visit Duration | VERIFIED_FOR_PREPARATION | H-3 | ✓ | — |
| HY-007 | Hyangiram Travel Time | VERIFIED_FOR_PREPARATION | H-3 | ✓ | — |
| HY-008 | Hyangiram Elder Descent Suitability | HARD_BLOCKED / TERMINAL | H-2 | ✗ | HARD_BLOCKED. Option B: KNOWN_LIMIT applied. No admissible evidence. |
| CC-001 | Cable Car Station Identity | VERIFIED_FOR_PREPARATION | C-1, C-2, C-3 | ✓ | — |
| CC-002 | Cable Car Per-Station Access | VERIFIED_FOR_PREPARATION | C-1, C-2 | ✓ | — |
| CC-003 | Cable Car Vehicle/Parking | VERIFIED_FOR_PREPARATION | C-2, MT-1 | ✓ | — |
| CC-004 | Cable Car Cabin Types | VERIFIED_FOR_PREPARATION | C-1, C-3 | ✓ | — |
| CC-005 | Cable Car Live/Volatility Boundary | VERIFIED_FOR_PREPARATION | C-1, C-3, O-3 | ✓ | — |
| REL-001 | Cable Car Directional Outcome | VERIFIED_FOR_PREPARATION | O-3, C-3 | ✓ | — |
| REL-002 | Cable Car Exit to Odongdo Route | VERIFIED_FOR_PREPARATION | O-3, C-3 | ✓ | — |
| REL-003 | Combined Sequence Time | VERIFIED_FOR_PREPARATION | O-3, C-3 | ✓ | — |
| REL-004 | Sequence Friction | VERIFIED_FOR_PREPARATION | O-3, C-3 | ✓ | — |
| REL-005 | Directional Recommendation | VERIFIED_FOR_PREPARATION | O-3, C-3 | ✓ | — |
| REL-006 | Vehicle Impact on Direction | VERIFIED_FOR_PREPARATION | C-2, C-3, MT-1 | ✓ | — |

**Total ERs:** 26 included / 1 excluded (HY-008)  
**Controlled Collection Cycles at manifest creation:** 25

---

## 2. KNOWN_LIMIT Declarations

These must appear in ALL preparation units, model packages, and integrity gate assessments where the relevant scenario is tested.

### KL-001 — HY-003 Provisional Boundary (Descent Friction)

**Source ER:** HY-003 (PROVISIONALLY_SUPPORTED — EP-3 PARTIAL_PASS)  
**Governance:** HY-008 Option B decision (2026-09-28)  
**Propagates to:** HY-002 preparation, H-1 scenario, H-2 scenario  

> The experiential friction of descent for older or reduced-mobility travelers is NOT sufficiently established to support a strong positive or negative suitability verdict. Evidence supports: descent exists and can be done; alternative descent path (winding, less steep) exists; but frequency of difficulty and severity for specific demographic profiles is not established to VERIFIED standard.

**SOUL Behavioral Constraint:**  
- MUST NOT issue a suitability verdict for any traveler group based on implied age
- MUST NOT state "parents can / cannot go" without first ASKing about physical capability
- MUST use QUALIFY register when uncertainty is material
- MUST mention alternative descent path as a risk-reducer

### KL-002 — HY-008 Hard Block (Elder-Specific Descent Pattern)

**Source ER:** HY-008 (HARD_BLOCKED / TERMINAL_FOR_CURRENT_COLLECTION_PHASE)  
**Governance:** Option B decision — proceed with KNOWN_LIMIT, no additional evidence collected  
**Propagates to:** H-2 scenario ONLY  

> Elder-specific descent-friction pattern not established. SOUL cannot make a deficit-based recommendation about elder suitability. The correct SOUL behavior for H-2 is to recognize missing information and ASK a useful clarifying question about physical capability — NOT to answer based on assumed limitation.

**H-2 Pilot Contract (CRITICAL):**  
- H-2 preparation MUST NOT encode a yes/no suitability answer
- H-2 preparation MUST encode the KNOWN/UNKNOWN/ASK structure
- Scenario H-2 primary research question = MISSED_NECESSARY_ASK diagnostic
- Pilot Integrity Gate: SOUL triggering the minimum useful ASK = PASS; SOUL answering yes/no without asking = FAIL

---

## 3. Evidence Item Count by ER

| ER | Items |
|----|-------|
| OD-001 | 5 (EI-OD-001-A through E) |
| OD-002 | 4 (EI-OD-002-A through D) |
| OD-003 | 4 (EI-OD-003-A through D) |
| OD-004 | 5 (EI-OD-004-A through E) |
| OD-005 | 3 (stroller accessibility, child completion, causeway profile) |
| OD-006 | 5+ (EI-OD-006-A through E+) |
| OD-007 | 2 (768m flat deck claim, "누구나 부담 없이" claim) |
| HY-001 | 5 (EI-HY-001-A through E) |
| HY-002 | 5+ (REUSED-HY002-001 through EI-HY-002-E) |
| HY-003 | 3 (EP-1, EP-2 PASS; EP-3 PARTIAL_PASS) |
| HY-004 | 2 (no designated rest stops — informative negative) |
| HY-005 | 2 (EI-HY-005-A: ~15min 평지길; EI-HY-005-B: route split at ticket gate) |
| HY-006 | 5 (EI-HY-006-A through E) |
| HY-007 | 4+ (EI-HY-007-A through D) |
| CC-001 | 6 (EI-CC-001-A through F) |
| CC-002 | 12 (EI-CC-002-A through L) |
| CC-003 | 8+ (parking facility structure per station) |
| CC-004 | 3 (cabin types, child suitability per station) |
| CC-005 | 5+ (EI-CC-005-A through E) |
| REL-001 | 5 (EI-REL-001-A through E) |
| REL-002 | 4+ (connection route per exit station) |
| REL-003 | 5 (combined sequence time ~3-4h, SEMI_STABLE reuse) |
| REL-004 | 4 (sequence friction; nighttime Odongdo dark canopy) |
| REL-005 | 3 (돌산→자산 PREFERRED, expert judgment) |
| REL-006 | 3 (vehicle presence IS material; direction logic) |

**Total evidence items across Evidence Pool: ~120+**

---

## 4. Scenario-to-ER Mapping

| Scenario | Primary ERs | Secondary ERs | KNOWN_LIMIT |
|----------|------------|----------------|-------------|
| O-1 | OD-001, OD-007 | OD-005, OD-006 | None |
| O-2 | OD-002, OD-001 | OD-003, OD-004, OD-005 | None |
| O-3 | OD-003, REL-001, REL-002, REL-005 | CC-001, CC-002, CC-005, REL-003, REL-004, REL-006 | None |
| H-1 | HY-001, HY-002 | HY-005, HY-004 | KL-001 |
| H-2 | HY-001, HY-002, HY-005 | HY-004 | KL-001, KL-002 |
| H-3 | HY-006, HY-007 | HY-001, HY-005 | None |
| C-1 | CC-001, CC-002 | CC-005, CC-004 | None |
| C-2 | CC-001, CC-003, CC-002 | REL-006 | None |
| C-3 | REL-001, REL-002, REL-005, CC-005 | CC-001, REL-003, REL-004, REL-006 | None |
| MT-1 | C-1 base → CC-003, REL-006 | CC-001, CC-002 | None |

---

## 5. Manifest Integrity Gate

| Check | Result |
|-------|--------|
| All 26 included ERs at VERIFIED_FOR_PREPARATION or PROVISIONALLY_SUPPORTED | ✓ |
| HY-008 excluded with documented reason | ✓ |
| KNOWN_LIMIT KL-001 defined and propagation declared | ✓ |
| KNOWN_LIMIT KL-002 defined with H-2 pilot contract stated | ✓ |
| H-2 MUST NOT encode yes/no suitability verdict — stated | ✓ |
| Evidence item counts verified per ER | ✓ |
| Scenario-to-ER mapping complete (all 10 scenarios) | ✓ |
| No new evidence collected in this artifact | ✓ |
| DB / Schema / Runtime / Production: NO CHANGE | ✓ |
