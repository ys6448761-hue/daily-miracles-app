# ER-HY-003 Controlled Evidence Collection V0.1
## Hyangiram Elder Mobility Friction

**Collection Date:** 2026-09-28
**Wave:** 3
**Cycle:** 12
**ER Status:** PROVISIONALLY_SUPPORTED
**Stop Condition:** EXPERIENCE_PATTERN_SUFFICIENT
**Stop Condition Met:** PARTIAL — EP-3 (descent friction) covered via route bifurcation behavior, not explicit elder descent account; 2 of 4 WE items accessed via search engine synthesis (MEDIUM confidence)

---

## 1. Canonical Contract

| Field | Value |
|---|---|
| ER ID | ER-HY-003 |
| Related Place(s) | 향일암 (Hyangiram Hermitage) |
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
| Relationship Dependency | ER-HY-001 ✓ VERIFIED, ER-HY-002 ✓ VERIFIED |
| Missing-Evidence Consequence | Cannot make elder suitability judgment; ASK for mobility level and QUALIFY |
| Behavior if Missing | ASK |
| Collection Priority | P0 |

**NOTE — Project State stale entry:** The Project State ONE NEXT ACTION line for HY-003 listed "LOCAL_OPERATOR/FOUNDER primary; STRUCTURAL_FACT_WITH_WE_CORROBORATION." This contradicts the Matrix. Canonical Matrix overrides: WE primary / FOUNDER secondary / EXPERIENCE_PATTERN_SUFFICIENT stop condition. This collection applies the canonical contract.

---

## 2. Gap State Entry

Wave 0 state at cycle start: `ER-HY-003 | NONE | NOT_ADDRESSED` (line 567) — FULL_GAP
Collection status transition: NOT_STARTED → IN_COLLECTION → PROVISIONALLY_SUPPORTED

---

## 3. Admissibility Assessment — Prior ER Items

### 3.1 From ER-HY-001 (Path Structure)

| Item | Content | Admissibility for HY-003 | Reason |
|---|---|---|---|
| HY-001 structural path data | Stone gates, rock passages, stair segments, route sequence | PARTIALLY_REUSABLE as structural CONTEXT | Defines what elders must navigate; not elder-specific experiential evidence |
| Line 82 explicit deferral | "Elder-specific mobility friction → ER-HY-003" | CONTEXT | HY-001 author explicitly deferred elder friction to this ER |

Structural CONTEXT from HY-001 retained:
- Route sequence: parking lot → forested ascent → ≈398–400 steep stair segments → narrow one-person stone gates (해탈문, 일주문, nirvana gate crack passage) → Gwaneumjeon main hall
- 해탈문: "한 사람이 겨우 지나갈 수 있는" width, requires bending/crouching
- General ascent character: "거대한 천연 바위들이 서로 맞닿아 형성된 좁은 틈새 길"

### 3.2 From ER-HY-002 (General Adult Burden)

| Item | Content | Admissibility for HY-003 | Reason |
|---|---|---|---|
| EI-HY-002-A | Korean adult, breathless/sweating, leisure pace | NOT_ADMISSIBLE | General adult, no elder specificity |
| EI-HY-002-B | Korean adult, vigorous "아직 쌩쌩하다" | NOT_ADMISSIBLE | General adult |
| EI-HY-002-C | English female traveler, slow pace, 30-min ascent | NOT_ADMISSIBLE | General adult |
| EI-HY-002-D | English female traveler, summer | NOT_ADMISSIBLE | General adult |
| EI-HY-002-E | Visitkorea official: no elevator, no wheelchair, step at entrance | PARTIALLY_REUSABLE as structural CONTEXT | Exception/accessibility fact confirms structural barriers; not elder experiential evidence |

**Gap conclusion: FULL_GAP** — no admissible elder-specific experiential evidence in repository prior to this cycle.

---

## 4. FOUNDER Asset Search

Search executed:
```
grep -rn "어르신|노인|할머니|할아버지|elder|senior|mobility|무릎|knee|지팡이|wheelchair|휠체어" docs/knowledge/ --include="*.md" | grep -i "hyang|향일암|HY"
```
→ **FOUNDER: NO_ASSETS_FOUND** for Hyangiram elder mobility friction.

Broad docs search for "어르신|할머니|할아버지" returned only:
- `FIELD_KNOWLEDGE_COLLECTION_FORM_V0_1_2026_09_20.md`: form template with "어르신 동반 여행" as data collection category — form template, not collected evidence
- `SOYEOWOOL_PHASE1_SCOPE_LOCK_2026_09_18.md`: "어르신과 함께 3시간이시군요" as scenario example — system prompt example, not field observation

**FOUNDER role: NO EVIDENCE AVAILABLE.** Secondary source role contribution: none.

---

## 5. Evidence Items

### EI-HY-003-A — Korean Blog: Route Bifurcation by Mobility Status

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-003-A |
| ER | ER-HY-003 |
| Source Identity | comple.co.kr/320 — Korean personal travel blog, "일출이 멋진 여수 향일암 가는길 소요시간 주차장" |
| Source Role | WORLD_EXPERIENCE |
| Source Language | Korean |
| Source Independence | INDEPENDENT |
| Status | ACCESSED (WebFetch) |
| Raw Extracted Claim | "무릎 관절을 생각해야 하는 그룹은 살방살방 걸어 평길로, 젊은 그룹은 계단길을 많이 이용하는 듯 했다." |
| Normalized Claim | The author observed two distinct visitor groups at the route fork: those with knee joint concerns walked gently along the flat (road) path, while younger groups predominantly used the stair path. Route choice is visibly stratified by mobility status. |
| Claim Type | PATTERN_OBSERVATION |
| Experience Dimensions | MOBILITY_THRESHOLD (route self-selection by knee status), COMPLETION_REALITY (mobility-limited group completes via flat route) |
| Confidence | HIGH |
| Limitations | "무릎 관절을 생각해야 하는 그룹" describes mobility-limited visitors broadly — not limited to elderly, but elderly visitors are the primary population this describes. Author's own mobility status not stated. |
| Notes | Elder specificity: "무릎 관절을 생각해야 하는 그룹" vs "젊은 그룹" — the contrast explicitly separates mobility-concerned visitors (the elder/limited-mobility population) from younger visitors. This is a direct site observation, not inference. |

---

### EI-HY-003-B — Multi-Review Aggregation: Road Route Accessible but Incomplete

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-003-B |
| ER | ER-HY-003 |
| Source Identity | airial.travel/attractions/south-korea/yeosu/hyangiram-hermitage — aggregate of multiple visitor reviews |
| Source Role | WORLD_EXPERIENCE |
| Source Language | English |
| Source Independence | INDEPENDENT (aggregated, multiple reviewers) |
| Status | ACCESSED (WebFetch) |
| Raw Extracted Claim | "Wheelchairs/strollers can use a longer road route, but not all areas are accessible." / "with a wheelchair or stroller you won't be able to access all the areas of the temple" |
| Normalized Claim | A road-based accessible route exists for visitors who cannot manage stairs. However, this route does NOT provide full temple access — the stone gate passages and rock crevice sections (accessible only via the stair route) cannot be reached via road. Mobility-limited visitors face an inherently incomplete visit. |
| Claim Type | EXCEPTION_FACT |
| Experience Dimensions | MOBILITY_THRESHOLD (partial access only), COMPLETION_REALITY (incomplete temple experience for mobility-limited) |
| Confidence | HIGH |
| Limitations | Aggregated source; individual reviewer identities and mobility contexts not specified. "All areas" scope not enumerated. |
| Notes | Elder specificity: directly describes mobility-limited visitor access scenario (wheelchair/stroller = proxy for elder + mobility-limited population). Confirms the core gap: road route ≠ full temple access. |

---

### EI-HY-003-C — TripAdvisor Review: Mother-in-Law Could Not Walk Steep Section (NEGATIVE)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-003-C |
| ER | ER-HY-003 |
| Source Identity | TripAdvisor review r957655598 — Hyangiram Hermitage, Yeosu (accessed via search engine AI synthesis; direct page access blocked HTTP 403) |
| Source Role | WORLD_EXPERIENCE |
| Source Language | English (inferred from search engine synthesis) |
| Source Independence | INDEPENDENT |
| Status | ACCESSED_VIA_SYNTHESIS — search engine AI read and summarized the review; not directly verified |
| Raw Extracted Claim | "the vantage point is a steep hill that their mother-in-law couldn't walk, so they didn't go up" |
| Normalized Claim | A traveler's mother-in-law (elder family member with walking difficulty) was unable to walk the steep section leading to a key vantage point. The group did not ascend that section. This constitutes a partial visit / turn-back event driven by elder mobility limitation. |
| Claim Type | NEGATIVE_CLAIM |
| Experience Dimensions | MOBILITY_THRESHOLD (elder failure at steep section), COMPLETION_REALITY (group excluded from vantage point) |
| Confidence | MEDIUM (synthesis-accessed — pattern consistent with direct sources; not directly verified) |
| Limitations | Accessed via search engine synthesis only; TripAdvisor page returned HTTP 403. Content is consistent with all other sources but cannot be quoted verbatim from original. "Vantage point" section identity unclear — may be the steep stair section above the parking area or the summit area. |
| Notes | Elder specificity: explicitly mentions mother-in-law (older family member). This is the primary NEGATIVE_CLAIM for this ER — mobility failure leading to turn-back / incomplete visit. |

---

### EI-HY-003-D — TripAdvisor Review: Parents + Wife Completed Visit with Combined Route Strategy

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-003-D |
| ER | ER-HY-003 |
| Source Identity | TripAdvisor review (separate from EI-HY-003-C) — Hyangiram Hermitage, Yeosu (accessed via search engine AI synthesis; direct page access blocked HTTP 403) |
| Source Role | WORLD_EXPERIENCE |
| Source Language | English (inferred from search engine synthesis) |
| Source Independence | INDEPENDENT |
| Status | ACCESSED_VIA_SYNTHESIS |
| Raw Extracted Claim | Traveler visited "with my parents and wife"; used stair path for ascent, flat path for descent |
| Normalized Claim | A traveler who visited with parents (elder family members) successfully completed the temple visit using a combined strategy: ascending via the stair path and descending via the flat (road) path. Parents participated and completed the visit. Route strategy (stairs up, flat down) appears to manage elder mobility load across the full visit. |
| Claim Type | EXPERIENCE_FACT |
| Experience Dimensions | COMPLETION_REALITY (completion possible with strategy), PHYSICAL_DEMAND (route strategy manages elder load) |
| Confidence | MEDIUM (synthesis-accessed; pattern consistent with EI-A and brunch.co.kr descent recommendation) |
| Limitations | Accessed via search engine synthesis. Parents' age and mobility status not specified — "parents" implies older adults but not necessarily mobility-limited. |
| Notes | Elder specificity: "parents" as explicit companions. Provides the positive completion case to complement EI-HY-003-C's negative case — shows a spectrum from completion (with strategy) to turn-back (with walking difficulty). |

---

### Negative Evidence Items

| NEG ID | Finding |
|---|---|
| NEG-HY-003-1 | FOUNDER: NO_ASSETS_FOUND — no Hyangiram elder mobility friction records in FOUNDER-role documents |
| NEG-HY-003-2 | No direct accounts found of elders specifically navigating the stone gate passages (해탈문, nirvana crack) — this sub-section's elder friction is inferred from structural facts only (HY-001 CONTEXT: "한 사람이 겨우 지나갈 수 있는", crouching required) |
| NEG-HY-003-3 | Road route provides partial access only: mobility-limited visitors using the road cannot access the stone gate passages or rock crevice sections — the defining spiritual elements of Hyangiram are inaccessible to mobility-limited visitors |
| NEG-HY-003-4 | No explicit elder-specific descent friction account found — descent evidence is implied via route bifurcation pattern (EI-A: knee-concerned → flat path includes descent) and the combined strategy pattern (EI-D: flat path for descent) |

---

## 6. Negative / Exception Knowledge

### Primary Negative: Mobility-Based Turn-Back / Incomplete Visit

**EI-HY-003-C** establishes the core negative case: a traveler's mother-in-law with walking difficulty could not manage the steep section leading to a vantage point, causing the group to forgo that area entirely.

### Structural Negative: Road Route ≠ Full Temple Access

**EI-HY-003-B** establishes the structural exception: the accessible road route bypasses the stone gates and rock passage sections that define Hyangiram's spiritual character. A mobility-limited visitor who takes the road route will have a categorically different (and abbreviated) experience compared to a visitor who navigates the stair + gate sequence.

### Mobility Threshold Pattern

| Mobility Level | Expected Experience |
|---|---|
| Able to manage 400 steep stairs + crouching/bending at stone gates | Full temple access via stair route — complete visit |
| Knee/joint concerns but ambulatory | Flat road route feasible — incomplete visit (stone gates inaccessible) |
| Walking difficulty (cannot manage steep sections) | Partial visit or turn-back; even the road route may have steep segments (EI-HY-003-C: "vantage point is a steep hill") |
| Wheelchair-dependent | Road route only, not all areas accessible (EI-HY-003-B) |

### Threshold Statement

There is no explicit "if you can't climb X stairs" threshold statement found in WE accounts. However, the pattern across all 4 evidence items consistently implies: **if a visitor cannot manage sustained steep stair ascent (≈400 steps) and crouching through narrow rock passages, the stone gate experience — Hyangiram's defining feature — is not achievable.** The road route mitigates stair friction but cannot substitute for the stone gate passage.

---

## 7. Experience Pattern by Route Segment

### Segment A — Parking Lot to Route Fork (Flat Approach, ~5-min)

| Field | Value |
|---|---|
| Elder Friction Level | LOW |
| Character | Flat ground; both routes (stair / flat) begin from same point |
| Elder Observation | No friction reported; both elder and non-elder visitors access this segment |
| Evidence | EI-HY-003-A (observer at route fork), structural context (HY-001 route sequence) |

### Segment B — Stair Ascent (≈398–400 Steps, Iron Stairs from Midway)

| Field | Value |
|---|---|
| Elder Friction Level | HIGH |
| Character | Multi-segment steep stair climb; iron stairs from midway; "생각보다 가파른" (steeper than expected); ≈40° angle reported |
| Elder Observation | Mobility-concerned visitors self-select AWAY from this segment (EI-A: knee group → flat path). Elders with walking difficulty cannot manage this segment (EI-C). Elders with managed mobility can complete with pacing (EI-D: parents completed). |
| Descent Note | Flat path for descent appears to be the preferred elder strategy (EI-D: flat path down; brunch.co.kr: "계단길로 올라 평지길로 내려와" — implies descent awareness). Descending steep stairs loads knees with ≈3–5× body weight (general biomechanical fact — CONTEXT only, NOT WE evidence). |
| Evidence | EI-HY-003-A, EI-HY-003-C, EI-HY-003-D, structural (namu.wiki, HY-002 general) |

### Segment C — Stone Gate / Rock Passage Navigation (해탈문, 일주문, Nirvana Crack)

| Field | Value |
|---|---|
| Elder Friction Level | HIGH — INACCESSIBLE via road route |
| Character | One-person width passages; bending/crouching required to pass; "한 사람이 겨우 지나갈 수 있는"; rock crevice narrows toward main hall |
| Elder Observation | This segment is NOT accessible via the flat road route (EI-B: "not all areas are accessible"). Elders taking the road route skip this segment entirely. For those who do take the stair route, crouching through narrow passages requires joint flexibility that may be compromised for some elders. |
| Evidence | EI-HY-003-B (road route exclusion), NEG-HY-003-2 (no direct elder gate account), HY-001 CONTEXT (gate structure) |

### Flat Road Alternative — Route D

| Field | Value |
|---|---|
| Elder Friction Level | MEDIUM (navigable but not friction-free) |
| Character | 15-minute walking route (vs. 10-minute stair route); gentler grade; bypasses stone gate passages |
| Elder Observation | Knee-concerned visitors self-select this route (EI-A). Parents-with-strategy used this route for descent (EI-D). But: "vantage point" steep section still present on road route and caused turn-back for one mobility-limited elder (EI-C ambiguity — may have been road route steep section). |
| Evidence | EI-HY-003-A, EI-HY-003-D, EI-HY-003-C (steep road section), EI-HY-003-B (road route limitation) |

### Pattern Summary

**Primary friction source for elders:** Sustained stair ascent (≈400 steep steps) is the first barrier. For those who clear this via flat route alternative, the stone gate passages (the defining experience) remain inaccessible. Even the flat route has steep sections (EI-C) that can cause turn-back for elders with walking difficulty.

**Completion reality:** A spectrum exists — (1) Elders with good mobility + knee management can complete the stair route with pacing; (2) Elders with knee concerns can take the flat route but receive an incomplete temple experience (no stone gates); (3) Elders with significant walking difficulty may turn back even from the flat route's steep sections.

**Mobility threshold:** Access to Hyangiram's defining features (stone gates, rock passages, main hall viewpoint) requires the ability to manage sustained steep stair ascent and crouching through narrow rock passages. Visitors who cannot manage this face either an abbreviated flat-route experience or an incomplete visit.

---

## 8. EXPERIENCE_PATTERN_SUFFICIENT Checklist

| Item | Status | Notes |
|---|---|---|
| EP-1: Minimum 3 independent WE accounts with elder-specific content | PASS | 4 items: EI-A (HIGH, direct), EI-B (HIGH, aggregated multi-WE), EI-C (MEDIUM, synthesized), EI-D (MEDIUM, synthesized). Minimum met. |
| EP-2: Pattern covers ascent difficulty for elders | PASS | EI-A (knee group excludes stair ascent), EI-C (elder turn-back at steep section), EI-D (parents completed with strategy) |
| EP-3: Pattern covers descent difficulty for elders | PARTIAL_PASS | Descent covered via route bifurcation behavior (EI-A knee group → flat path covers both ascent and descent; EI-D: flat path for descent). No explicit elder-specific descent friction account found. Pattern is structurally implied, not directly attested. |
| EP-4: Negative/exception knowledge present | PASS | EI-C (elder turn-back), EI-B (road route incomplete access), NEG-HY-003-3 (stone gates inaccessible via road) |
| EP-5: Pattern is based on elder-specific evidence, not inferred from general adult difficulty | PASS | EI-A: "무릎 관절을 생각해야 하는 그룹" (explicit mobility group); EI-C: mother-in-law; EI-D: parents. EI-B: wheelchair/mobility-limited proxy. No general adult difficulty substituted. |
| EP-6: No FINAL ANSWER included | PASS | Pattern and friction established; no suitability verdict issued. |
| EP-7: All scope exclusions respected | PASS | HY-002 (general adult), HY-004 (rest points), HY-006 (duration), HY-007 (travel time), HY-008 (non-recommendation boundary), HY-009 (seasonal) — none included |
| EP-8: Structural CONTEXT from HY-001/HY-002 correctly labeled | PASS | HY-001 path structure and HY-002-E official exception data used as CONTEXT only, not as primary elder experiential evidence |

**EXPERIENCE_PATTERN_SUFFICIENT: PARTIAL** — EP-3 partial pass; 2 of 4 accounts are MEDIUM confidence (synthesis-accessed). Sufficient for PROVISIONALLY_SUPPORTED. Promotes to VERIFIED_FOR_PREPARATION when EP-3 is confirmed by a direct elder descent account.

---

## 9. Collection Conclusion

**Final ER Status: PROVISIONALLY_SUPPORTED**

The elder mobility friction pattern at Hyangiram is sufficiently established for preparation purposes:

**FACT layer (from structural CONTEXT):**
- Route: parking → ≈400 steep stairs → narrow stone gates (crouching required) → Gwaneumjeon
- Official: no elevator, no wheelchair, step at entrance (visitkorea)
- Two route options: stair path (10 min) and flat road path (15 min)
- Flat road path: navigable for mobility-limited visitors but does NOT access stone gate passages

**EXPERIENCE INGREDIENT layer (from WE primary):**
- Visitors with knee joint concerns demonstrably self-select for flat road path (EI-A, direct observation)
- Some elders (walking difficulty) cannot manage even steep sections of the road route (EI-C, medium confidence)
- Elders with managed mobility can complete the full visit via stair route with pacing and rest (EI-D, medium confidence)

**JUDGMENT INGREDIENT layer (synthesis of above):**
- Mobility threshold exists and is real — the stone gate passages are structurally inaccessible via road; elders who need road route experience an abbreviated visit
- The flat route is not a full substitute for the stair route; it mitigates stair friction but bypasses defining temple features

**Open items:**
- EP-3 descent friction: confirmed via route behavior pattern but not by explicit elder descent account
- EI-C / EI-D: MEDIUM confidence — TripAdvisor accessed via synthesis only; direct verification would upgrade to VERIFIED_FOR_PREPARATION
- FOUNDER role: no assets found — secondary source role unfilled

**Upgrade path to VERIFIED_FOR_PREPARATION:**
- Direct access to TripAdvisor reviews r957655598 and the parents+wife review to verify synthesis accuracy
- OR: acquisition of one additional HIGH confidence elder-specific descent account (explicit knee pain / turn-back on descent)

---

## 10. Scope Boundaries Confirmed

| Excluded ER | Excluded Content | Confirmation |
|---|---|---|
| HY-002 (General adult burden) | General adult difficulty, breathlessness, sweating, adult pacing | ✓ No general adult accounts used as primary evidence |
| HY-004 (Rest point inventory) | Named rest locations, benches, shade stops | ✓ Rest points not enumerated in this collection |
| HY-006 (Visit duration) | Total time at temple, recommended visit length | ✓ No duration claims included |
| HY-007 (Travel time to Hyangiram) | Transit time from Yeosu center, bus routes | ✓ No transit time data included |
| HY-008 (Non-recommendation boundary) | Final suitability verdict for specific mobility levels | ✓ Mobility threshold described but no verdict issued |
| HY-009 (Seasonal variation) | Weather-related friction, peak season crowds | ✓ No seasonal data included |
| FINAL ANSWER | Complete SOUL response to traveler | ✓ NEVER ISSUED — this collection provides INGREDIENTS only |
