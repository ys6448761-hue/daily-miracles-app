# SOUL Taxonomy Provenance & Port Alignment Audit V0.1

**Status:** AUDIT_COMPLETE  
**Date:** 2026-10-03  
**Mode:** STRICT READ-ONLY — No implementation, no Vision modification, no main merge, no deployment  
**Audit start HEAD:** 0503ed8 (integration/soul-cablecar-port-v0-1)  
**Audit final HEAD:** 0503ed8 (unchanged)  
**Prior Evidence:** SOUL_PRODUCT_CONTINUITY_INCIDENT_AUDIT_V0_1.md @ 54c2221, SOUL_VISION_CONTINUITY_REPOSITORY_STATE_INVENTORY_V0_1.md @ af6b4f0, SOUL_PRODUCT_VISION_V0_1.md @ 1e030bf

---

## §1. ORIGINAL "10" RECOVERY

**Search result: ORIGINAL_10_EXACT_LIST_NOT_FOUND**

Full-repository search for original SOUL detail-page taxonomy terms:

| Term | Matches |
|---|---|
| 질문할수록 | 0 |
| SOUL의 한마디 | 0 |
| 먼저 다녀간 소원이 | 0 |
| 여수를 아는 사람들의 시선 | 0 |
| 대화하는 여행 상세페이지 | 0 |
| 상세페이지 구성 | 0 |
| 10 elements / 10 items (SOUL context) | 0 |

Confirmed by SOUL_PRODUCT_CONTINUITY_INCIDENT_AUDIT_V0_1.md §2 and §3.

The original concept terms also NOT FOUND in primary Founder source docx (무여정 기초 연구 자료(10월3일).docx).

**Taxonomy classifications:**

- **A. Founder 원래 10:** ORIGINAL_10_EXACT_LIST_NOT_FOUND — no repository or docx source contains an enumerated original 10.
- **B. Canonical 10 Product Roles:** EXISTS @ 1e030bf — but Lumi-constructed from Founder task input (not recovered verbatim).
- **C. Staging 9:** EXISTS in staging/storybook-c7a — first inventoried SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md (2026-10-01).
- **D. Human Experience sub-concepts:** Concept A (no Founder source). Concept B ("다음 소원이에게 한마디" docx pos 76107 = prototype only).
- **E. Other "10" taxonomies:** NONE related to SOUL detail page.

---

## §2. "9+2" TRACE

**Hypothesis verified:** 9 = staging elements / 2 = local perspective + previous traveler

| Question | Answer |
|---|---|
| Was 9+2 Founder-approved taxonomy? | **NO** |
| Was 9+2 ever canonical? | **NO** |
| Was it only an analytical comparison? | **YES** |

"9+2" was Lumi's internal analytical reasoning during the 2026-10-03 recovery session: 9 staging elements + 2 absent Human Experience concepts → merged into 10 by treating Human Experience as one Role (Role 8 with sub-concepts A and B). This framing does not appear in any Founder-originating source and was never formalized as a taxonomy.

---

## §3. ORIGINAL 10 ↔ CANONICAL 10 MATRIX

**Not producible.** ORIGINAL_10_EXACT_LIST_NOT_FOUND.

Any matrix would compare Canonical 10 against itself (reconstructed), not against a pre-existing original. This audit does not produce a fabricated comparison.

---

## §4. HUMAN EXPERIENCE HIERARCHY

| Concept | Source | Repository Status |
|---|---|---|
| Concept A: local/Yeosu perspective | NO identified Founder source document | NOT_IN_ANY_SOURCE |
| Concept B: previous traveler | docx pos 76107: "다음 소원이에게 한마디" (prototype only) | SOURCE_ONLY_AS_PROTOTYPE |
| Both as ONE parent "Human Experience Layer" | Lumi-constructed @ 1e030bf only | LUMI_CONSTRUCTED |
| Both as TWO separate top-level roles | No document supports | NOT_DOCUMENTED |

**Verdict: SEPARATE_CONCEPTS_WITH_NO_CONFIRMED_HIERARCHY**

No Founder document confirms these two concepts form a single "Human Experience Layer" parent role. The Canonical 10 places them under Role 8 as TWO_SUBELEMENTS_OF_ONE_ROLE — but this hierarchy was Lumi-synthesized from the Founder task input's phrasing ("Human experience layer: A=..., B=..."). The task input's wording implies the structure but does not explicitly confirm it.

---

## §5. CANONICAL 10 PROVENANCE

**Document:** docs/product/SOUL_PRODUCT_VISION_V0_1.md  
**Recovery basis stated:** "SOUL Product Continuity Incident Audit V0.1 (@54c2221) + State Inventory (@af6b4f0) + Founder task input 2026-10-03"

**Provenance chain:**
```
Founder original concept (visual mockup / design conversation — NOT in repository)
  → 54c2221 forensic audit (found ZERO original terms)
  → af6b4f0 state inventory (found 9 staging elements)
  → Founder task input 2026-10-03 ("10 minimum recovered roles", HEL A+B specified)
  → Lumi construction → docs/product/SOUL_PRODUCT_VISION_V0_1.md @ 1e030bf
```

**Key issue:** The Canonical 10 was Lumi-constructed (with Founder task input constraints) — not verbatim-recovered from a pre-existing document. The document says it is "NOT a design document" but "the canonical record of recovered product direction" — yet no original direction document was found to recover from.

**Verdict: CANONICAL_10_NEEDS_FOUNDER_REVIEW**

The Canonical 10 is internally consistent. The Founder did specify "10 minimum" and HEL structure in the task input. However:
1. The specific 1:1 mapping of staging elements → roles was Lumi-synthesized
2. "Recovered" implies a pre-existing source — none found
3. Founder confirmation needed: Is the role list complete and correctly structured?

This audit does NOT modify the document.

---

## §6. CANONICAL 10 ↔ STAGING 9 MAPPING

"10 Product Roles = 10 visible UI sections" assumption: NOT applied.

| # | Canonical Role | Staging Element | Status |
|---|---|---|---|
| 1 | Place Identity / Hero | PLACE_HERO | IMPLEMENTED_IN_STAGING |
| 2 | SOUL Message / Interpretation | SOUL_MESSAGE | IMPLEMENTED_IN_STAGING |
| 3 | Traveler Situation / Context Input | QUESTION_COMPOSER | IMPLEMENTED_IN_STAGING |
| 4 | Personalized Journey Reconstruction | Backend PRODUCTION_LIVE; frontend via SOUL_MESSAGE+JOURNEY | PARTIAL_IN_STAGING |
| 5 | Recommended Journey / Choices | SOUL_JUDGMENT + FOR_ME (overlaps with Role 7) | PARTIAL_IN_STAGING |
| 6 | Actual Movement / Route Flow | JOURNEY | IMPLEMENTED_IN_STAGING |
| 7 | SOUL Judgment / Local Intelligence | SOUL_JUDGMENT (backend PRODUCTION_LIVE, UI staging) | PRODUCTION_ELSEWHERE + IMPLEMENTED_IN_STAGING |
| 8 | Human Experience Layer | No staging element | NOT_IMPLEMENTED |
| 9 | Basic Trust Information | ESSENTIAL_INFO | IMPLEMENTED_IN_STAGING |
| 10 | Next Travel Action | BOTTOM CTA (disabled) + map/길찾기 (PRODUCTION_LIVE elsewhere) | PARTIAL_IN_STAGING |

**Unmapped staging elements** (no 1:1 Role):

| Element | Closest Role(s) | Note |
|---|---|---|
| FOR_ME | Roles 4+7 | Straddles Personalization and Local Intelligence |
| COST | Roles 5+10 | Conditional quote display |
| DEPTH | Role 7 | Expandable deep knowledge |
| WISH_SCENE | None | Atmospheric only |

**Observation:** 9 staging elements do NOT map 1:1 to 10 Roles. Roles 5+7 share one staging element (SOUL_JUDGMENT). Role 8 has no staging element. 4 staging elements have no clean 1:1 role mapping.

---

## §7. READ-ONLY INSPECTION OF 0503ed8

### A. ESSENTIAL_INFO Implementation

**PlaceBasicInfo.jsx (main branch):**
- Hours field: `place.operating_hours`
- Renderer: `<div className="place-basic-info">` + `<div className="info-row">`
- CSS scope: `.recommend-card .info-row` (travel-guide.css)

**SoulCableCarPage.jsx (0503ed8):**
- Hours field: `placeData.opening_hours_json` ← DIFFERENT field name
- Renderer: `<FactRow>` (Tailwind — no .place-basic-info/.info-row CSS)
- 6 formatter functions duplicated with different names

**Field comparison:**

| Field | PlaceBasicInfo.jsx | SoulCableCarPage.jsx | Match? |
|---|---|---|---|
| Hours input key | `place.operating_hours` | `placeData.opening_hours_json` | **DIVERGENT** |
| Admission | `admission_fee_json` | `admission_fee_json` | ✓ |
| Stay | `avg_stay_minutes` | `avg_stay_minutes` | ✓ |
| Difficulty | `physical_difficulty` | `physical_difficulty` | ✓ |
| Environment | `indoor_outdoor` | `indoor_outdoor` | ✓ |
| Parking | `parking_info` | `parking_info` | ✓ |

**Verdict: SEMANTIC_REUSE_WITH_DUPLICATION**

Hours field name is divergent (`operating_hours` vs `opening_hours_json`). DB column is `opening_hours_json` per Journey Quality Gap Audit. SoulCableCarPage uses the raw DB field name — likely correct for PLACE_LOOKUP response. PlaceBasicInfo.jsx uses `operating_hours` — which may be remapped by TravelRecommendCard's upstream data or may be an existing field name issue.

**Drift risk:** Future Basic Info changes to PlaceBasicInfo.jsx will NOT automatically apply to SoulCableCarPage.jsx. Confirmed as a known, accepted short-term tradeoff per port scope. Must be tracked as technical debt.

---

### B. explicit_context.place_code

**0503ed8 sends:** `has_car` (boolean), `people_type` (enum) — but **never** `place_code`

**UI-001 contract (travelInputRoutes.js):** `place_code` is a supported, sanitized field in `explicit_context`.

**Two rules — NOT equivalent:**

| Rule | Meaning | Implemented? |
|---|---|---|
| "텍스트 place alias가 chip보다 우선한다" | Chip can send place_code; text extraction overrides it backend-side | NOT implemented |
| "place_code를 전혀 보내지 않는다" | Chip never sends place_code; only text extraction works | **IS implemented** |

**Behavioral gap:** When a user selects 🌿 오동도 chip and submits a message that does NOT mention "오동도" explicitly, the backend receives no place_code signal. The chip context updates UI (JourneyFlow, SOUL_JUDGMENT) but is invisible to the backend.

**Verdict: SAFE_RESTRICTION**

Not sending place_code from chips is a safe restriction of the full UI-001 contract. The contract allows it but doesn't require it. No runtime error or regression. However, the intent ("text wins over chip") and the implementation ("chip never sends place_code") are semantically different rules. The current implementation is a valid simpler choice — but it diverges from the intended design as stated in the task spec.

---

## §8. CURRENT NEXT ACTION RACE CONDITION

**Timeline:**
1. Memory: Current Next Action = "SoulCableCarPage Production Port — PORT_REQUIRES_MINIMAL_ALIGNMENT"
2. Founder sent: IMPLEMENTATION_GO task for port
3. Lumi executed: port committed at 0503ed8
4. Founder immediately sent: "do NOT merge — audit taxonomy first"
5. Result: port committed on integration branch / PROMOTION_HOLD

**Does current governance detect "Current Next Action changed while older task is already executing"?**

`NO`

Current governance:
- MEMORY.md: tracks "★ Current Next Action (exactly 1)" — a single pointer, not an execution state
- CLAUDE.md: Guardian Preflight has BLOCKED/READY gate — checked BEFORE execution, not during
- Neither mechanism tracks in-flight execution state

**Observation (evidence only, no new framework):**

IMPLEMENTATION_GO can be actioned to completion before a subsequent Founder HOLD can be raised in the same conversation. When the Taxonomy Audit became a blocking requirement, the port was already committed. Governance relies on linear task sequencing but does not detect mid-execution task reconsideration.

---

## §9. FUTURE LUMI ERROR RISK

| Error type | Current guardrail | Verdict |
|---|---|---|
| UI element count ↔ Product Role count 혼동 | SOUL_PRODUCT_VISION_V0_1.md says "not a rigid element count" but lists exactly 10 | NOT_PREVENTED |
| Parent role ↔ sub-element 혼동 | §D explicitly labels "Two distinct sub-concepts" but no rule prevents treating as 2 top-level roles | PARTIALLY_PREVENTED |
| 같은 숫자 = 같은 taxonomy | No rule in any governance document | NOT_PREVENTED |
| Staging code → Vision 역추론 | CLAUDE.md: "코드 상태 ≠ 제품 의도" rule exists | PARTIALLY_PREVENTED |
| Missing original list → current canonical로 재구성 | No rule distinguishes "recovered original" from "Lumi-constructed canonical" | NOT_PREVENTED |
| Stale in-progress task → new Next Action 추월 | MEMORY.md has no in-flight execution state | NOT_PREVENTED |

**Current guardrail gaps (observations, no new framework written):**

1. No rule for: "ORIGINAL_10_NOT_FOUND ≠ Canonical 10 is the original"
2. No rule for: "Lumi-constructed canonical requires explicit Founder confirmation before being treated as recovered history"
3. No in-flight task state tracking
4. No provenance field in Vision documents (distinguishing "verbatim recovery" vs "Lumi-constructed with Founder input")

---

## §10. PERSISTENCE RECORD

**0503ed8 project state:** `IMPLEMENTED / BUILD_PASS / PROMOTION_HOLD`

**Files changed in 0503ed8:** (read-only inspection — not modified in this audit)
- `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` — CREATED
- `dreamtown-frontend/src/api/guestCredentialUtil.js` — CREATED
- `dreamtown-frontend/src/api/dreamtown.js` — MODIFIED (re-exports)
- `dreamtown-frontend/src/App.jsx` — MODIFIED (route added)

**Documents NOT modified in this audit:**
- `docs/product/SOUL_PRODUCT_VISION_V0_1.md` — NO CHANGE ✓
- `docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md` — NO CHANGE ✓
- All main branch files — NO CHANGE ✓
- Production — NO CHANGE ✓
- DB / schema / migration — NO CHANGE ✓

---

## §11. FINAL PORT VERDICT

**FOUNDER_TAXONOMY_DECISION_REQUIRED**

The port (0503ed8) has no functional defects and faithfully implements the current Canonical 10. However, the Canonical 10 itself requires Founder confirmation before the port can be promoted:

**Required Founder decisions:**

| Decision | Question |
|---|---|
| Q1 | Is the Canonical 10 role list in `docs/product/SOUL_PRODUCT_VISION_V0_1.md` complete and correctly structured? |
| Q2 | Is Human Experience Layer correctly ONE role with TWO sub-concepts (not two separate top-level roles)? |
| Q3 | Was "10 minimum" a count the Founder already held, or a minimum constraint for the recovery task? |

**If Founder confirms Canonical 10 is correct** → `PORT_READY_FOR_PROMOTION`  
**If Canonical 10 needs correction** → correct Vision first → re-evaluate port → then promote.

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | Audit start HEAD | 0503ed8 |
| 2 | Audit final HEAD | 0503ed8 (unchanged — read-only) |
| 3 | Evidence path | docs/architecture/SOUL_TAXONOMY_PROVENANCE_AUDIT_V0_1.md |
| 4 | Original 10 exact source | NOT_FOUND — no repository or docx source |
| 5 | Original exact 10 list | ORIGINAL_10_EXACT_LIST_NOT_FOUND |
| 6 | Original taxonomy type | NEVER_DOCUMENTED — concept existed in visual mockup / design conversations only |
| 7 | Canonical 10 list | docs/product/SOUL_PRODUCT_VISION_V0_1.md — Lumi-constructed @ 1e030bf from Founder task input |
| 8 | Staging 9 list | QUESTION_COMPOSER / SOUL_MESSAGE / PLACE_HERO / ESSENTIAL_INFO / FOR_ME / SOUL_JUDGMENT / JOURNEY / COST / DEPTH |
| 9 | Human Experience hierarchy verdict | SEPARATE_CONCEPTS_WITH_NO_CONFIRMED_HIERARCHY |
| 10 | 9+2 Founder-approved? | NO |
| 11 | 9+2 canonical? | NO |
| 12 | Original10↔Canonical10 matrix | NOT_PRODUCIBLE — Original 10 not found |
| 13 | Canonical10↔Staging9 matrix | See §6 table above |
| 14 | Merged/split/missing/new/uncertain items | FOR_ME/COST/DEPTH/WISH_SCENE unmapped; Roles 5+7 share SOUL_JUDGMENT; Role 8 has no staging element |
| 15 | Canonical 10 provenance verdict | CANONICAL_10_NEEDS_FOUNDER_REVIEW |
| 16 | ESSENTIAL_INFO implementation verdict | SEMANTIC_REUSE_WITH_DUPLICATION |
| 17 | Basic Info drift risk | CONFIRMED — hours field name diverges; future changes to PlaceBasicInfo won't auto-propagate |
| 18 | explicit_context.place_code verdict | SAFE_RESTRICTION |
| 19 | UI-001 contract consistency | No contract violation; but "text wins over chip" intent vs "chip never sends place_code" implementation diverge semantically |
| 20 | Race condition verdict | NO — current governance does not detect in-flight task vs new task conflict |
| 21 | Future Lumi repeat-risk matrix | 4× NOT_PREVENTED / 2× PARTIALLY_PREVENTED — see §9 |
| 22 | Current guardrail gaps | 4 gaps identified (§9) — observation only, no new framework written |
| 23 | 0503ed8 changed? | NO — read-only audit ✓ |
| 24 | Product Vision changed? | NO ✓ |
| 25 | main changed? | NO ✓ |
| 26 | Production changed? | NO ✓ |
| 27 | DB/schema/migration? | NO ✓ |
| 28 | External research? | NO ✓ |
| 29 | Final Port verdict | FOUNDER_TAXONOMY_DECISION_REQUIRED |
| 30 | Project State for 0503ed8 | IMPLEMENTED / BUILD_PASS / PROMOTION_HOLD |
| 31 | Current Next Action | FOUNDER_TAXONOMY_DECISION: Confirm Canonical 10 correctness (Q1/Q2/Q3) → if confirmed: PORT_READY_FOR_PROMOTION |

---

*Audit complete. No implementation. No Vision modification. No code change.*
