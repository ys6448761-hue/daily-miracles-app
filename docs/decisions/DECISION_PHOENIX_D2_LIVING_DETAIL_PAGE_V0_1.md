# Decision Record: D2 — Living Detail Page

**Decision ID:** DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1  
**Status:** CANONICALIZED (Founder-confirmed recovery)  
**Date:** 2026-10-03  
**Authorized by:** Founder (푸르미르) via task input 2026-10-03  
**Related Vision:** `docs/product/SOUL_PRODUCT_VISION_V0_1.md`

---

## Historical Source Status

**Historical D2 defining source: MISSING**

Prior references to "D2" appear in:
- `docs/architecture/SOUL_LEGACY_JOURNEY_RESTORATION_AUDIT_V0_1.md`:285 — `"D2 says 'Living Detail Page = canonical experience, questions do NOT replace the page.'"`
- `docs/architecture/SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md`:168 — `"DROPPED (by D2 HOLD decision)"`

No document defining the original D2 decision was found in the repository.

**This Decision Record is a Founder-confirmed canonicalization after continuity recovery — NOT a recovered historical document. The substance of the decision is canonical. The original recording is absent.**

---

## The Decision

### Core Statement

**A new question does not replace the entire SOUL detail page.**

New traveler context deepens and reorganizes the same travel page — making it more personally relevant for this specific traveler.

### Elaboration

When a traveler adds context:
```
차가 있어요
부모님과 가요
아이와 가요
오동도도 갈 거예요
일몰을 보고 싶어요
```

Phoenix recomposes within the existing page:
- What matters for this traveler
- Recommendation order
- Route adjustments
- Cautions relevant to their situation
- Next action appropriate for them

The existing place understanding remains useful. The recommendation reason, route, basic trust information, SOUL message — all remain. Their relevance and emphasis shifts.

### What This Is NOT

- A new question is NOT a new page
- A new question does NOT erase prior recommendations
- A new question does NOT invalidate the Basic Trust Information surface
- Context accumulation is NOT a page replacement mechanism

### Staging Evidence

`SoulCableCarPage.jsx` on `origin/staging/storybook-c7a` implements this decision: the page structure (PLACE_HERO → QUESTION_COMPOSER → SOUL_MESSAGE → ESSENTIAL_INFO → FOR_ME → SOUL_JUDGMENT → JOURNEY → COST → DEPTH) persists across question submissions. SOUL_MESSAGE and SOUL_JUDGMENT update; the page frame does not reset.

---

## Scope Boundaries

### Within D2 Scope
- SOUL_MESSAGE update on new context submission
- SOUL_JUDGMENT update (place_identity_ko or primaryDiscovery)
- JOURNEY section update (course.blocks or route.days)
- FOR_ME section update (stateIndex-driven)
- COST conditional update

### On HOLD (referenced in prior docs)
- `next_options[]` — listed as `DROPPED (by D2 HOLD decision)` in SOUL_JOURNEY_QUALITY_GAP_AUDIT_V0_1.md:168
- `block.reason → CourseDisplay` — CONNECT_LATER per project_legacy_journey_presentation_impl.md

### Not Addressed by D2
- Human Experience Layer implementation method (separate product decision needed)
- Save/Share feature
- "내 여정에 담기" CTA implementation (소원꿈터 connection deferred)

---

## Application to SoulCableCarPage Port

This decision confirms that the port scope is:

1. The page frame structure is correct as implemented in staging
2. Context inputs (QUESTION_COMPOSER chips) should be wired to API payload — they deepen, not replace
3. The JOURNEY section is within D2 scope for the port

This decision does NOT confirm:
- Which exact staging elements to include vs. defer in the port (separate alignment required)
- Social proof elements (Human Experience Layer — separate product decision)

---

*Recorded 2026-10-03. No implementation in this document.*
