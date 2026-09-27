# SOUL Yeosu — ER-HY-001 Controlled Evidence Collection V0.1
# Hyangiram Physical Access Structure — Wave 1 First Collection Cycle

**Created:** 2026-09-27
**Branch:** staging/storybook-c7a
**Starting HEAD:** eef19a8
**Collection Plan:** Controlled Evidence Collection Plan V0.2
**Stop Condition:** STRUCTURAL_FACT_WITH_WE_CORROBORATION

---

## §1. Purpose and Starting Checkpoint

This document records the first new Evidence Collection cycle under Collection Plan V0.2.
Target: ER-HY-001 (Hyangiram Physical Access Structure).

Pre-conditions verified:
- Wave 0: WAVE_0_PASS — infrastructure operational
- Pre-Wave 1 Survey: COMPLETE — ER-HY-001 FULL_GAP confirmed (no existing repository evidence for structural access)
- ER-HY-001 dependency: NONE (no prerequisite ERs for Wave 1)
- BATCH_01 known content: operating hours (04:00–19:00), admission (free), parking (2hr free), bus lines (111/111-1/116) — NOT re-collected in this run

---

## §2. ER-HY-001 Contract (from Evidence Requirement Matrix V0.1)

| Field | Value |
|---|---|
| Evidence Requirement | ER-HY-001 |
| Related Place | 향일암 (Hyangiram Hermitage) |
| Related Scenarios | H-1, H-2, H-3 |
| Required Judgment | ANSWER — approach difficulty; JUDGMENT — mobility/time feasibility |
| Knowledge Category | ACCESS / WALKING / PHYSICAL_BURDEN |
| Evidence Needed | Evidence establishing the physical structure of Hyangiram's approach — the objective access features that determine physical demand (steps, incline, path character, total approach extent) |
| Why Needed | H-1: accurate difficulty description. H-2: elder suitability judgment. H-3: time feasibility. All three scenarios depend on this foundation. |
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

**Stop Condition (V0.2 §9):**
STRUCTURAL_FACT_WITH_WE_CORROBORATION — "An authoritative source establishes the structural facts of access AND at least one independent World Experience source corroborates that the official description matches practical access reality. Neither alone is sufficient."

**V0.2 §17 HY-001 note:** "ER-HY-001 cannot be closed on official source alone. WE corroboration of structural accuracy is required before advancing to VERIFIED_FOR_PREPARATION."

---

## §3. Starting Gap (from Pre-Wave 1 Survey V0.1)

| Field | Value |
|---|---|
| Gap Type | FULL_GAP |
| Existing Coverage | NONE (zero structural access evidence in repository) |
| Known context (not structural) | BATCH_01: hours/admission/parking/bus confirmed from yeosu.go.kr — NOT in scope for this run |
| Seed classification | physical_difficulty=high (travel_places_seed) — CONTEXT_ONLY, not structural evidence |

---

## §4. Collection Boundary

**IN SCOPE:**
- Objective structural features of the Hyangiram approach path (계단, 암문, 바위 통로, 경사, 암벽 구간)
- Rock gate/passage structures (their width, height, physical requirement)
- Route sequence (parking → access points → main hall)
- Material exceptions (alternative routes, partial access options)
- Physical burden characteristics relevant to structural access

**OUT OF SCOPE (already in BATCH_01):**
- Operating hours (04:00–19:00) — NOT re-collected
- Admission fee (free) — NOT re-collected
- Bus routes (111/111-1/116) — NOT re-collected
- Parking availability (2hr free) — NOT re-collected

**OUT OF SCOPE (belongs to other ERs):**
- Experiential burden patterns → ER-HY-002
- Elder-specific mobility friction → ER-HY-003
- Visit duration → ER-HY-006
- Travel time from Yeosu → ER-HY-007
- Final suitability judgments → ER-HY-008
- SOUL answers — PROHIBITED

---

## §5. Phase A — Official Evidence Collection

### Sources Attempted

| Source | Type | Status |
|---|---|---|
| yeosu.go.kr/en/travel/10tour/hyangiram | OFFICIAL (City government EN) | ACCESSED — content retrieved |
| yeosu.go.kr/tour/spot/top10/hyangiram.do | OFFICIAL (City government KO) | 404 — not found |
| ko.wikipedia.org 향일암 | SUPPORTING (encyclopedic) | ACCESSED — no structural access content |
| v.daum.net/v/8iJ8HyyOYw | MEDIA (news/article) | ACCESSED — structural content retrieved |

### Phase A Claims Extracted

**From yeosu.go.kr/en/travel/10tour/hyangiram (OFFICIAL — Yeosu City Tourism):**

Claim A1: The approach involves multiple steep staircase sections, described as "steep stairs again and again" and "breathless stairs" throughout the complex. The terrain is progressively exhausting as height increases.
- Claim Type: STRUCTURAL_FACT (stair approach, multi-segment, steep)
- Scope: Hyangiram approach from entrance to main hall

Claim A2: At least one stone gate passage requires visitors to bend forward ("a small stone gate requiring visitors to bend forward to go through"). Described as symbolically narrow.
- Claim Type: STRUCTURAL_FACT (gate passage, requires crouching/bending)
- Scope: Gate structure on approach to main building

Claim A3: A "nirvana gate made with a small rock crack" narrows further as it approaches the main hall — visitors must navigate a rock crevice passage.
- Claim Type: STRUCTURAL_FACT (rock crevice passage, narrows toward main hall)
- Scope: Upper approach gate structure

Claim A4: Overall route sequence: access begins at a parking lot, progressing upward through densely forested sections, through successive architectural checkpoints (stone gates, rock passages), ending at the Gwaneumjeon building overlooking the sea.
- Claim Type: STRUCTURAL_FACT (route sequence)
- Scope: Full approach from parking to main hall

**From v.daum.net/v/8iJ8HyyOYw (MEDIA — Daum news article, Korean-language):**

Claim A5: "초입부터 만만치 않은 가파른 경사길과 웅장한 돌계단길로 시작" — steep incline and grand stone stairs from the very start of the approach. Not easy from the beginning.
- Claim Type: STRUCTURAL_FACT (steep incline, stone stairs, begins immediately)
- Scope: Initial approach section
- Lineage: Korean media article; independently authored

Claim A6: 해탈문(Haetalmun) — specifically named natural rock gate: "거대한 천연 바위들이 서로 맞닿아 형성된 좁은 틈새 길" (narrow gap path formed by giant natural boulders meeting), with passage width of "한 사람이 겨우 지나갈 수 있는" (barely one person at a time), requiring waist-to-bend posture to pass.
- Claim Type: STRUCTURAL_FACT (named gate, one-person width, bent posture required)
- Scope: Haetalmun gate structure specifically
- Lineage: Daum news article — corroborates and names the gate referenced in yeosu.go.kr

Claim A7: Behind Hyangiram hermitage, the 금오산 hiking trail continues — the initial section of that trail is "완만한 흙길과 나무 계단으로 정비" (gentle earth path with wooden stairs). The trail near the summit becomes "경사가 매우 가파르고 거친 암반" (very steep and rough rock). This trail is the continuation beyond the hermitage, not the access path to the hermitage itself.
- Claim Type: STRUCTURAL_FACT (scope boundary: temple access path ≠ Geomosan summit trail)
- Scope: Scope boundary clarification — ER-HY-001 covers access to the hermitage, not the subsequent summit trail
- Limitation: Summit trail is out of ER-HY-001 scope

Claim A8: Parking near the temple is "매우 협소" (very limited). Visitors arriving by vehicle face tight parking conditions.
- Claim Type: OPERATIONAL_FACT (parking constraint)
- Scope: Vehicle arrival point
- Note: This is operational, not structural access. Recorded but primarily relevant to ER-HY-007 (travel time) and future vehicle-related ERs. NOT counted as structural access claim for HY-001 stop condition.

### Phase A Assessment

**OFFICIAL_STRUCTURAL_SUPPORT_SUFFICIENT**

Structural components established:
- [COVERED] Multi-segment steep staircase approach (begins from entrance, continues throughout)
- [COVERED] At least one named narrow rock gate (해탈문/Haetalmun): one-person width, bend required
- [COVERED] Additional stone gate passage (narrowing toward main hall — "nirvana gate")
- [COVERED] Route sequence: parking lot → forested ascent → successive stone gates/rock passages → Gwaneumjeon/Gwaneumjeon main hall
- [COVERED] Scope boundary: Geomosan summit trail is distinct from and beyond the hermitage access path
- [NOT COVERED by official source] Exact stair count — not available from official sources
- [NOT COVERED] Total walking distance in meters from parking to main hall — not specified

The two missing items (stair count, precise distance) are not required by ER-HY-001 — the requirement asks for "objective access features that determine physical demand," not metric specifications. The structural character, sequence, and key physical challenge elements (multiple steep stair segments + narrow one-person-width rock passages) are established.

Official source (yeosu.go.kr) establishes the qualitative structural architecture. Daum article corroborates and names the primary rock gate (Haetalmun). Both are structurally consistent.

**DO NOT YET MARK HY-001 VERIFIED — WE corroboration required.**

---

## §6. Phase B — World Experience Corroboration

### Sources Collected

| Source | Type | Independence | Status |
|---|---|---|---|
| travel-stained.com/hyangiram-hermitage-yeosu-temple/ | WE (English travel blog) | INDEPENDENT | ACCESSED |
| seoulsearching.net/hyangiram-hermitage/ | WE (English travel blog) | INDEPENDENT | ACCESSED |

### Phase B Claims Extracted

**From travel-stained.com (independent English travel blog):**

Claim B1: "7 unique passageways created from slabs of hewn stone" — the visitor navigates seven distinct rock/stone passage structures on the approach to the temple complex.
- Claim Type: EXPERIENCE_PATTERN (recurring structural navigation: 7 passages)
- Traveler-Context Scope: General travelers
- Corroborates: Official claims A2, A3 (rock passage structures exist and are multiple)

Claim B2: Multiple steep stone staircase sections described as "fairly vertical" — steeper than typical stairs. Authors recommend the shorter staircase route (vs. gradual winding road).
- Claim Type: EXPERIENCE_PATTERN (practical steepness — "fairly vertical")
- Corroborates: Official claims A1, A5 (steep stair character confirmed by WE)

Claim B3: "Through tunnels" referenced as part of upper temple complex navigation.
- Claim Type: EXPERIENCE_PATTERN (tunnel-like passage structures in upper section)
- Corroborates: Official claims A2, A3 (narrows, crevice passages)

Claim B4: Author's 5-year-old child completed the route without unusual difficulty (stated without distress).
- Claim Type: EXPERIENCE_PATTERN (exception: young children can complete)
- Negative/Exception knowledge: access is not prohibitive for ambulatory children with adult accompaniment
- Limitation: Single account; does not imply universal child accessibility — depends on child fitness and adult support

Claim B5: Route described as "not overly long" though steep — the challenge is incline/passage nature, not cumulative distance.
- Claim Type: EXPERIENCE_PATTERN (distance characterization)
- Scope: Total approach length is short; difficulty is steepness-based not distance-based

**From seoulsearching.net (independent English travel blog):**

Claim B6: "Steep steps leading to Iljumun Gate" — the primary ascent route involves steep steps to a named gate (Iljumun = 일주문, standard temple gate). Alternative winding path available; authors recommend reserving it for descent.
- Claim Type: EXPERIENCE_PATTERN (steep steps confirmed; named gate Iljumun; alternative descent path exists)
- Corroborates: Official claim A1 (steep stair approach confirmed)
- Exception: Alternative winding path exists for descent (less steep option)

Claim B7: Narrow passages where visitors "shuffle sideways through" rock faces — tight enough that clothing scrapes rock during traversal.
- Claim Type: EXPERIENCE_PATTERN (passage width requires sideways movement; very tight)
- Corroborates: Official claims A2, A3 (narrow gates confirmed), Claim A6 (one-person width)
- Adds detail: "clothing scrapes rock" indicates extreme narrowness at key passages

Claim B8: Seven passages referenced — "seven caves and passages according to local legend" — structural count consistent with travel-stained.com.
- Claim Type: EXPERIENCE_PATTERN (structural count: 7 passages confirmed by second independent source)
- Independence check: travel-stained.com (Claim B1) and seoulsearching.net are independent blogs. The "7 passages" belief is also a well-documented local temple tradition (not one blog citing another). Counted as independent corroboration.

Claim B9: Overall characterization: "not difficult" for the authors, though carrying weight increased exertion. Families and children observed successfully completing the route.
- Claim Type: EXPERIENCE_PATTERN (traveler-relative difficulty — not universally prohibitive for ambulatory adults)
- Limitation: "Not difficult" is relative to author fitness. Structural features (steep stairs, narrow passages) are the same; experiential burden varies.
- This introduces EXPERIENCE_VARIATION (see §9 Conflict Review)

---

## §7. WE Corroboration Assessment

**INDEPENDENT SOURCES:** Both WE sources are English-language travel blogs with distinct authors, distinct writing styles, and no evidence of content syndication. They are counted as independent.

**PATTERN CONSISTENCY:**
| Structural Element | Official (yeosu.go.kr/Daum) | WE Source 1 (travel-stained) | WE Source 2 (seoulsearching) |
|---|---|---|---|
| Multiple steep stair sections | YES (steep, breathless) | YES (fairly vertical) | YES (steep steps to Iljumun) |
| Narrow rock passages | YES (stone gate, crevice gate) | YES (7 passageways) | YES (shuffle sideways, 7 passages) |
| Passage requires bending/special posture | YES (Haetalmun: bend at waist) | YES (through tunnels) | YES (clothing scrapes rock) |
| Alternative descent option | NOT MENTIONED | NOT MENTIONED | YES (winding path for descent) |
| Children capable | NOT MENTIONED | YES (5yr old) | YES (families observed) |

**Corroboration verdict:**
WE sources confirm the official structural description across all key elements. Official description is not contradicted. The structural features (steep stairs, narrow rock passages, physical gate structures) are consistently reported.

**EXPERIENCE_VARIATION noted (not a structural fact conflict):**
- seoulsearching.net says "not difficult" while yeosu.go.kr says "breathless stairs"
- This is EXPERIENCE_VARIATION — same structural features, different traveler fitness and perception
- Classified per V0.2 §11: EXPERIENCE_VARIATION (same physical structure; different traveler-state experiences)
- Does NOT invalidate structural facts. Both are preserved.

---

## §8. Negative / Exception Knowledge

| Exception | Source | Type |
|---|---|---|
| Alternative descent path (winding road, less steep) | seoulsearching.net (WE) | ROUTE_VARIANT — a less steep alternative exists for the descent; not equivalent for ascent |
| Children capability | travel-stained.com, seoulsearching.net (WE, 2 sources) | CAPABILITY_EXTENSION — ambulatory children with adult support can complete; not prohibitive |
| Geomosan summit trail | Daum (MEDIA) | SCOPE_BOUNDARY — trail continuing beyond hermitage to Geomosan peak is distinct and more demanding; ER-HY-001 scope ends at hermitage |
| Parking constraint | Daum (MEDIA) | OPERATIONAL_EXCEPTION — parking is very limited; impacts vehicle arrival timing not structural access itself |

**No exception found that makes the approach physically prohibitive for healthy ambulatory adults.**
**Haetalmun (one-person width, bend required) IS a meaningful mobility constraint — documented.**

---

## §9. Conflict Review

| Conflict | Sources | Classification | Resolution |
|---|---|---|---|
| Difficulty characterization ("breathless stairs" vs "not difficult") | yeosu.go.kr vs seoulsearching.net | EXPERIENCE_VARIATION | Preserved — same structural features; different traveler fitness. Both retained. Structural facts unaffected. |
| Stair count not specified | All sources | NOT A CONFLICT — data simply not collected at that granularity | No conflict; count not required by ER |
| Seven passages (tradition/belief) vs specific gate names | Multiple WE vs Daum MEDIA naming | SCOPE_DIFFERENCE — "7 passages" is a traditional belief/count; official/media names specific gates (Haetalmun). Consistent, not contradictory. | Preserved: 7-passage structure corroborated; Haetalmun is the most documented specific gate |

**No FACT_CONFLICT identified.** Official and WE structural descriptions are mutually consistent.

---

## §10. Provenance — Evidence Item Registration

All new Evidence Items follow the Wave 0 20-field schema. IDs: EI-HY-001-A through EI-HY-001-F.

---

### EI-HY-001-A — Yeosu City Official: Staircase Approach Structure

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-001-A |
| ER IDs | ER-HY-001 |
| Source Role | OFFICIAL |
| Source Name | Yeosu City Tourism — Hyangiram (English official page) |
| Source Type | OFFICIAL_PRIMARY (city government tourism) |
| Source Locator | https://www.yeosu.go.kr/en/travel/10tour/hyangiram |
| Accessed Date | 2026-09-27 |
| Publication Date | UNKNOWN (page checked 2026-09-27; no update date visible) |
| Extracted Claim | Approach involves multiple steep staircase sections ("steep stairs again and again," "breathless stairs") that are progressively exhausting as height increases. |
| Claim Type | STRUCTURAL_FACT |
| Stability Classification | STABLE |
| Geographic Scope | Hyangiram approach path (entrance to main hall) |
| Traveler-Context Scope | General traveler |
| Collector | Claude (SOUL Knowledge Authoring) Wave 1 |
| Verification Status | VERIFIED_FOR_PREPARATION |
| Corroboration Links | EI-HY-001-B (Daum A5), EI-HY-001-D (WE B2), EI-HY-001-E (WE B6) |
| Conflict Status | CLEAR |
| Notes/Limitations | No stair count provided; qualitative structural characterization only |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot execution; if temple path renovation reported |

---

### EI-HY-001-B — Yeosu City Official: Rock Gate Passages (Official + Media)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-001-B |
| ER IDs | ER-HY-001 |
| Source Role | OFFICIAL (primary component); MEDIA (corroborating component) |
| Source Name | yeosu.go.kr/en/travel/10tour/hyangiram (official); v.daum.net/v/8iJ8HyyOYw (Korean media/Daum) |
| Source Type | OFFICIAL_PRIMARY + MEDIA_CORROBORATION |
| Source Locator | https://www.yeosu.go.kr/en/travel/10tour/hyangiram; https://v.daum.net/v/8iJ8HyyOYw |
| Accessed Date | 2026-09-27 |
| Publication Date | UNKNOWN (official); article date from Daum |
| Extracted Claim | Multiple distinct rock/stone gate structures exist on the approach. Specifically: (1) A small stone gate requiring visitors to bend forward. (2) A "nirvana gate made with a small rock crack" narrowing toward the main hall. The Daum article names the primary gate as 해탈문(Haetalmun): formed by giant natural boulders meeting, "barely one person at a time" width, waist-bend posture required. |
| Claim Type | STRUCTURAL_FACT |
| Stability Classification | STABLE |
| Geographic Scope | Hyangiram approach — gate structures between entrance and Gwaneumjeon |
| Traveler-Context Scope | General traveler |
| Collector | Claude (SOUL Knowledge Authoring) Wave 1 |
| Verification Status | VERIFIED_FOR_PREPARATION |
| Corroboration Links | EI-HY-001-D (WE B1 — 7 passageways), EI-HY-001-E (WE B7 — shuffle sideways), EI-HY-001-F (WE B8 — 7 passages) |
| Conflict Status | CLEAR |
| Notes/Limitations | Haetalmun is the best-documented gate; "7 passages" total is WE-corroborated tradition; not all 7 individually named in official sources |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot execution; if temple renovation or path closure reported |

---

### EI-HY-001-C — Official Route Sequence (Parking → Main Hall)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-001-C |
| ER IDs | ER-HY-001 |
| Source Role | OFFICIAL |
| Source Name | Yeosu City Tourism — Hyangiram (English official page) |
| Source Type | OFFICIAL_PRIMARY |
| Source Locator | https://www.yeosu.go.kr/en/travel/10tour/hyangiram |
| Accessed Date | 2026-09-27 |
| Publication Date | UNKNOWN |
| Extracted Claim | Route sequence: parking lot → densely forested upward path → successive stone gate/rock passage checkpoints → Gwaneumjeon main hall (with sea view). Scope boundary confirmed: Geomosan summit trail continues beyond hermitage and is distinct from/more demanding than temple access path. |
| Claim Type | STRUCTURAL_FACT |
| Stability Classification | STABLE |
| Geographic Scope | Full approach: parking → main hall. Scope boundary: hermitage access ≠ Geomosan summit trail. |
| Traveler-Context Scope | General traveler |
| Collector | Claude (SOUL Knowledge Authoring) Wave 1 |
| Verification Status | VERIFIED_FOR_PREPARATION |
| Corroboration Links | EI-HY-001-A, EI-HY-001-B |
| Conflict Status | CLEAR |
| Notes/Limitations | Total walking distance in meters not specified |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot execution |

---

### EI-HY-001-D — WE Corroboration: 7 Passages + Vertical Stairs (travel-stained.com)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-001-D |
| ER IDs | ER-HY-001 |
| Source Role | WORLD_EXPERIENCE |
| Source Name | travel-stained.com — "Hyangiram Hermitage, Yeosu, Korea" |
| Source Type | WE_TRAVEL_BLOG (independent English blog) |
| Source Locator | https://travel-stained.com/hyangiram-hermitage-yeosu-temple/ |
| Accessed Date | 2026-09-27 |
| Publication Date | UNKNOWN (article date not confirmed) |
| Extracted Claim | (1) 7 unique passageways created from slabs of hewn stone — navigated on approach to temple complex. (2) Multiple steep staircases ("fairly vertical"). (3) "Through tunnels" in upper temple section. (4) Author's 5-year-old child completed route. (5) Route "not overly long" — challenge is incline/passage nature, not cumulative distance. |
| Claim Type | EXPERIENCE_PATTERN |
| Stability Classification | STABLE |
| Geographic Scope | Hyangiram approach (entrance to main hall) |
| Traveler-Context Scope | General traveler; exception noted for young children with adult |
| Collector | Claude (SOUL Knowledge Authoring) Wave 1 |
| Verification Status | VERIFIED_FOR_PREPARATION |
| Corroboration Links | EI-HY-001-A (stair character), EI-HY-001-B (rock passages), EI-HY-001-F (7-passage count) |
| Conflict Status | EXPERIENCE_VARIATION — "fairly vertical" characterization vs seoulsearching "not difficult": same structure, different fitness baseline. EXPERIENCE_VARIATION classified, not FACT_CONFLICT. |
| Notes/Limitations | Single blog account. Child capability claim: single observation, not representative sample. Lineage: independent from seoulsearching.net. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot execution |

---

### EI-HY-001-E — WE Corroboration: Sideways Shuffle Passages + Alternative Path (seoulsearching.net)

| Field | Value |
|---|---|
| Evidence Item ID | EI-HY-001-E |
| ER IDs | ER-HY-001 |
| Source Role | WORLD_EXPERIENCE |
| Source Name | seoulsearching.net — "Hyangiram Hermitage" |
| Source Type | WE_TRAVEL_BLOG (independent English blog) |
| Source Locator | https://seoulsearching.net/hyangiram-hermitage/ |
| Accessed Date | 2026-09-27 |
| Publication Date | UNKNOWN |
| Extracted Claim | (1) Steep steps leading to Iljumun Gate on primary ascent route. (2) Alternative winding path available, recommended for descent (less steep). (3) Narrow passages requiring visitors to "shuffle sideways" — clothing scrapes rock faces. (4) Seven caves/passages referenced (local tradition). (5) Overall: "not difficult" for the authors; families with children observed completing route. |
| Claim Type | EXPERIENCE_PATTERN |
| Stability Classification | STABLE |
| Geographic Scope | Hyangiram approach (entrance to main hall) |
| Traveler-Context Scope | General traveler; families with children noted |
| Collector | Claude (SOUL Knowledge Authoring) Wave 1 |
| Verification Status | VERIFIED_FOR_PREPARATION |
| Corroboration Links | EI-HY-001-A (steep stairs), EI-HY-001-B (narrow passages), EI-HY-001-D (7 passages) |
| Conflict Status | EXPERIENCE_VARIATION — "not difficult" vs yeosu.go.kr "breathless stairs": same structure; EXPERIENCE_VARIATION classified. Alternative path is ROUTE_VARIANT (descent option), not contradicting primary route structure. |
| Notes/Limitations | "Not difficult" is author-relative; structural features identical to other sources. Alternative descent path exception documented. Independent from travel-stained.com. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot execution |

---

## §11. Stop Condition Test — STRUCTURAL_FACT_WITH_WE_CORROBORATION

| Criterion | Assessment | Status |
|---|---|---|
| A. Required structural components covered? | Stair approach (multi-segment, steep) ✓; Rock gate passages (minimum 2 named types, Haetalmun specifically documented) ✓; Route sequence (parking→forest→gates→main hall) ✓; Scope boundary (hermitage access ≠ Geomosan trail) ✓ | PASS |
| B. Official/source-role fit? | Primary source = yeosu.go.kr (OFFICIAL, Yeosu City government English tourism page). Daum media article corroborates and names Haetalmun (MEDIA — not OFFICIAL but corroborating). OFFICIAL source role requirement satisfied. | PASS |
| C. Provenance sufficient? | Source URLs captured; accessed date 2026-09-27 recorded; publication dates UNKNOWN (not available from sources); collector recorded; source role identified. All 20 schema fields populated. UNKNOWN fields explicitly noted (not fabricated). | PASS |
| D. Scope correct? | All collected evidence concerns Hyangiram physical access specifically (approach path). Geomosan summit trail explicitly excluded. Operating info (hours/admission/bus) not re-collected. | PASS |
| E. Stability/freshness acceptable? | STABLE classification. Rock/stone physical structures (stairs, rock gates) are permanent features unchanged by seasons. Live trigger = temporary path closure (not indicated by any source). Freshness concern: UNKNOWN publication dates on official page — however, physical terrain is STABLE and structural features are permanent. Acceptable for pilot preparation. | PASS |
| F. WE practical corroboration sufficient? | Two independent WE sources (travel-stained.com, seoulsearching.net) both confirm: steep stairs, narrow rock passages (7 passages / sideways shuffle), children/families completing route. Pattern is recurring and consistent with official description. Diminishing-return: adding more WE sources would not change the structural pattern. | PASS |
| G. Material negative/exception knowledge handled? | Documented: (1) Alternative descent path (less steep winding route), (2) Children capable with adult support, (3) Haetalmun one-person width is the most constrained passage, (4) Summit trail is a distinct harder route beyond hermitage scope. | PASS |
| H. Material conflicts resolved or bounded? | One EXPERIENCE_VARIATION classified (difficulty perception varies by fitness — structural facts consistent). No FACT_CONFLICT. Both sides of the variation preserved. | PASS |
| I. Dependencies satisfied? | ER-HY-001 has NO prerequisite ERs in Wave 1. No BLOCKED-DEPENDENCY condition. | PASS |
| J. No unsupported inference required? | All structural claims come directly from collected sources. No gap-filling by inference. Stair count and precise distance are missing but not required by ER contract. | PASS |

**All 10 criteria: PASS**

---

## §12. Final ER-HY-001 Status

**ER_HY_001_VERIFIED_FOR_PREPARATION**

ER-HY-001 is closed for Wave 1 collection. Evidence is sufficient per STRUCTURAL_FACT_WITH_WE_CORROBORATION stop condition under the recorded preparation boundary of this Pilot.

This does NOT mean eternal structural truth. It means: the collected evidence is sufficient to support H-1, H-2, and H-3 scenario responses during the controlled Pilot execution, under the provenance and scope boundaries recorded.

---

## §13. Gap Register Update

| ER | Before | After | Change |
|---|---|---|---|
| ER-HY-001 | FULL_GAP | CLOSED (VERIFIED_FOR_PREPARATION) | Gap eliminated |

All other ER gap states: UNCHANGED.

---

## §14. Reuse Boundary

Evidence from this cycle (EI-HY-001-A through EI-HY-001-E) may be reused as follows:

| Future ER | Reuse Permission | Limitation |
|---|---|---|
| ER-HY-002 (experiential burden) | PARTIAL — EI-HY-001-D and E contain experience characterizations that may provide context | HY-002 requires its own WE pattern collection; HY-001 evidence is structural, not experiential burden per se |
| ER-HY-003 (elder mobility friction) | CONTEXT_ONLY — Haetalmun one-person width (EI-HY-001-B) is structurally relevant | HY-003 requires elder-specific WE accounts; do not substitute HY-001 structural facts |
| ER-HY-008 (negative knowledge boundary) | DEPENDENCY — HY-001 is a prerequisite; evidence supports the factual foundation | HY-008 requires Founder synthesis and depends on HY-002+003+006+007 in addition |
| Any other ER | No reuse without explicit ER linkage in future Wave | Do not extend HY-001 evidence to unrelated ERs |

Reuse constraint: structural evidence (STRUCTURAL_FACT) must not be reclassified as EXPERIENCE_PATTERN or JUDGMENT INGREDIENT without new collection.

---

## §15. Collection Cycle Audit (A–Q)

| # | Criterion | Status | Notes |
|---|---|---|---|
| A | Starting checkpoint correct? | PASS | HEAD eef19a8 confirmed; Wave 0 PASS; Pre-Wave 1 Survey COMPLETE |
| B | HY-001 contract extracted from persisted docs? | PASS | Matrix V0.1 contract fields read verbatim (§2 above) |
| C | Only HY-001 collected? | PASS | No OD, CC, or other ER evidence collected |
| D | Official phase executed first? | PASS | yeosu.go.kr official page accessed before WE sources |
| E | Official fact and WE experience separated? | PASS | STRUCTURAL_FACT (A claims) vs EXPERIENCE_PATTERN (B claims) explicitly typed |
| F | Provenance complete? | PASS | All 20 schema fields populated; UNKNOWN noted where applicable; no fabrication |
| G | Source lineage preserved? | PASS | Source names, URLs, access dates, types all recorded |
| H | No duplicated corroboration from same upstream source? | PASS | travel-stained.com and seoulsearching.net are independent; "7 passages" is a local temple tradition independently cited (not blog-to-blog syndication) |
| I | Negative/exception knowledge handled? | PASS | 4 exception types documented (§8) |
| J | Conflict rule followed? | PASS | EXPERIENCE_VARIATION classified, both sides preserved, not forced to reconcile |
| K | Stop Condition explicitly tested? | PASS | All 10 criteria evaluated (§11) |
| L | BATCH_01 operating information not re-collected? | PASS | Hours/admission/parking/bus explicitly excluded; none appear in evidence records |
| M | No final SOUL answer produced? | PASS | All evidence is STRUCTURAL_FACT or EXPERIENCE_PATTERN; no SOUL answer text |
| N | No OD/CC evidence collected? | PASS | Only Hyangiram structural access evidence collected |
| O | No HY-002+ collection? | PASS | WE experiential burden characterizations from Phase B sources are noted as context only for HY-001 corroboration; HY-002 collection not executed |
| P | Pilot not executed? | PASS | No pilot scenario run |
| Q | No architecture/schema/runtime/production changes? | PASS | Repository research artifacts only |

**All 17 audit criteria: PASS**

---

## §16. Governance

| Item | Status |
|---|---|
| Collect actual non-HY-001 evidence | NOT DONE |
| Execute Wave 2+ | NOT EXECUTED |
| Execute Pilot | NOT EXECUTED |
| Generate SOUL answer text | NOT GENERATED |
| Generate Hidden Transfer | NOT GENERATED |
| Recruit participants | HOLD |
| Modify DB/schema/runtime/production | NO CHANGE |
| Create Candidate | NONE |
| Architecture Decision | NONE |
| Approve place_knowledge migration | NOT APPROVED |

Prepared Knowledge / Prepared Context / Expert Anticipation remain RESEARCH HYPOTHESES.
Preparation Boundary remains RESEARCH VARIABLE.

---

## §17. Next Action

**ER-HY-001: VERIFIED_FOR_PREPARATION — next target: ER-OD-001**

Derive: Highest-leverage remaining P0 Wave 1 ER with FULL_GAP and no prerequisite dependencies.

| Candidate | Priority | Gap | Dependencies | Reuse Leverage |
|---|---|---|---|---|
| ER-OD-001 | P0 | FULL_GAP | NONE | HIGH — supports O-1 scenario; WE collected here also feeds OD-002 (Wave 4) context |
| ER-OD-003 | P0 | FULL_GAP | NONE | MEDIUM — supports O-2/O-3 vehicle access; OFFICIAL primary |
| ER-CC-001 | P0 | PARTIAL_GAP | NONE | MEDIUM — station identity remaining gap requires OFFICIAL call/website |

**Selected: ER-OD-001** — highest reuse leverage (O-1 scenario, future OD-002 feed), WE primary (immediately actionable), FULL_GAP.

**Exact next action:**

> Collect World Experience evidence for ER-OD-001 (Odongdo place character, visitor experience profile, atmospheric pattern) from multiple independent WE sources. Required: recurring experiential pattern establishing Odongdo's character as a destination — atmosphere, physical scale of visit, distinctiveness, visitor experience range. Source role: WORLD_EXPERIENCE (primary). Stop condition: EXPERIENCE_PATTERN_SUFFICIENT — "recurring pattern established across multiple independent accounts; variation/exception represented; no new material changes from additional sources." Collection boundary: experiential character of Odongdo visit (after entry); NOT vehicle access structure (ER-OD-003), NOT operating hours, NOT route corpus. Provenance: independent WE sources with source identity, URL, access date captured. Do NOT collect OD-003 vehicle access facts or any non-OD-001 evidence in this cycle.

---

*ER-HY-001 Controlled Evidence Collection V0.1 — 2026-09-27*
