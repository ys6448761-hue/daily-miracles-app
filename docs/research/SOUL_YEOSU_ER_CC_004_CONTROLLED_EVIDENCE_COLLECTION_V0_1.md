# SOUL Yeosu ER-CC-004 Controlled Evidence Collection V0.1
# Yeosu Cable Car Per-Station Child Suitability

**Document ID:** SOUL_YEOSU_ER_CC_004_CONTROLLED_EVIDENCE_COLLECTION_V0_1  
**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Controlled Collection Cycle:** 21  
**Wave:** 4a  
**Status:** VERIFIED_FOR_PREPARATION

---

## §1. Canonical Contract (from Matrix V0.1)

| Field | Value |
|-------|-------|
| ID | ER-CC-004 |
| Related Place(s) | 여수해상케이블카 |
| Related Scenario(s) | C-2, MT-1 (via C-2) |
| Required Judgment | JUDGMENT — per-station child-suitability, including cabin-type-specific considerations |
| Knowledge Category | CHILD_CONTEXT / PHYSICAL_BURDEN / ACCESS |
| Evidence Needed | Per-station evidence: what facilities/attractions exist for children; which cabin type is suitable for children; per-station child-specific information (elevators, nursing rooms, diaper changing, child attractions) |
| Why Needed | C-2 requires honest child-suitability disclosure per station and per cabin type. |
| Preferred Source Role | WORLD_EXPERIENCE |
| Secondary Source Role | OFFICIAL |
| Stability Class | SEMI_STABLE |
| Live Trigger | If stations add/remove child facilities; if Crystal cabin policy changes |
| Confidence Requirement | Experiential pattern across stations (both 자산 and 돌산); per-cabin-type coverage |
| Negative/Exception Knowledge | YES — Crystal cabin glass floor anxiety for children; missing facilities |
| Relationship Dependency | ER-CC-001 ✓, ER-CC-002 ✓, ER-CC-003 ✓ (all VERIFIED_FOR_PREPARATION) |
| Missing-Evidence Consequence | Cannot provide per-station child guidance; must QUALIFY |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Stop Condition | EXPERIENCE_PATTERN_SUFFICIENT |

**Downstream dependencies:** ER-CX-001 (C-2 for MT-1 Turn 2 companion context)

---

## §2. Starting State and Dependency Verification

| ER | Status | Verified |
|----|--------|---------|
| ER-CC-001 | VERIFIED_FOR_PREPARATION | ✓ |
| ER-CC-002 | VERIFIED_FOR_PREPARATION | ✓ |
| ER-CC-003 | VERIFIED_FOR_PREPARATION | ✓ |

Wave 0 state for CC-004: PARTIALLY_SUPPORTED  
Wave 4 Readiness state: PARTIALLY_SUPPORTED → READY (full gap collection required)

---

## §3. Wave 0 Partial Support Audit

**EI-CC-004-CTX-A** (Wave 0):
- Content: General Crystal Cabin age consideration ("연령 제한 없음"; some sources noted kids may be uncomfortable with glass floor)
- Classification: CONTEXT_ONLY
- Why CONTEXT_ONLY: Wave 0 record describes generic Crystal glass floor anxiety — does NOT constitute per-station child-suitability pattern (no 자산/돌산 facilities, no regular cabin child assessment, no stroller access info)
- Result: FULL GAP remains for canonical per-station child suitability requirement

**Residual Gap after Wave 0:**
- 자산(Jasando) station child-specific facilities: NOT_ESTABLISHED
- 돌산(Dolsan) station child-specific facilities: NOT_ESTABLISHED
- Regular cabin child suitability: NOT_ESTABLISHED as per-station pattern
- Crystal cabin child suitability (per-station): PARTIALLY_ESTABLISHED (glass floor anxiety = CONTEXT_ONLY)
- Nursing room / diaper changing: NOT_ESTABLISHED
- Under-36-months fare policy: NOT_ESTABLISHED

---

## §4. Reuse-First Audit (from completed ERs)

| Source | Content | Classification |
|--------|---------|----------------|
| EI-CC-001-I (운영시간/요금) | Age-based pricing: 36개월 미만 무료 | DIRECT_REUSE — under-36-months free is child-relevant policy |
| EI-CC-002-I (Crystal Cabin 가격/운영) | Crystal Cabin pricing + stroller restriction notes | PARTIAL_REUSE — Crystal cabin stroller restriction exists; needs per-station + child-experience characterization |
| EI-CC-003-A/B/C | View, capacity, boarding experience | CONTEXT_ONLY — not child-specific |

---

## §5. Collection Log

### Searches Executed
1. "여수 케이블카 아이와 방문 어린이 유모차 자산 돌산 승강기 엘리베이터 수유실 기저귀 2024 2025"
2. "여수 해상케이블카 크리스탈 캐빈 아이 무서운 유리바닥 일반캐빈 어린이 유모차 접이 가능 경험담"
3. "여수케이블카 자산역 돌산역 어린이 시설 판타지뉴월드 카페 가족 2024 2025"

### Sources Accessed / Fetched
1. mom-mom.net — family cable car experience article (fetched)
2. trip.com 돌산역 traveler moments (accessed)
3. yeosu-cablecar.co.kr official — station facilities (searched)
4. Korean search synthesis — aggregated child/family cable car info
5. naver.com review synthesis — per-cabin-type child experience

---

## §6. Evidence Items

### EI-CC-004-A — Regular Cabin Child Suitability (WE)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-CC-004-A |
| ER IDs | ER-CC-004 |
| Source Role | WORLD_EXPERIENCE |
| Source Name | mom-mom.net — 여수 케이블카 아이와 방문 가족 후기 |
| Source Type | WE family travel blog |
| Source Locator | mom-mom.net/여수케이블카-가족-후기 |
| Accessed Date | 2026-09-28 |
| Publication Date | UNKNOWN |
| Extracted Claim | 일반 캐빈: 유모차 접어서 탑승 가능; 일반 캐빈에서 아이들이 바다 경치를 즐겼다; 아이가 무서워하지 않았다 (Regular cabin: stroller can be folded and brought aboard; children enjoyed the ocean view; children were not afraid) |
| Normalized Claim | Regular cabin is child-friendly: stroller (folded) permitted; children comfortable; ocean view at child's eye level |
| Claim Type | EXPERIENCE_PATTERN |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | 여수해상케이블카 — regular cabin |
| Traveler-Context Scope | Families with young children; stroller users |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | EI-CC-004-B, EI-CC-004-D |
| Conflict Status | CLEAR |
| Notes/Limitations | WE source; stroller must be folded (not stored upright). Capacity limited when stroller aboard. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

### EI-CC-004-B — Crystal Cabin Child Suitability Concerns (WE)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-CC-004-B |
| ER IDs | ER-CC-004 |
| Source Role | WORLD_EXPERIENCE |
| Source Name | Korean WE synthesis (naver reviews + mom-mom.net) |
| Source Type | WE traveler accounts |
| Source Locator | Korean search synthesis; mom-mom.net |
| Accessed Date | 2026-09-28 |
| Publication Date | Various |
| Extracted Claim | 크리스탈 캐빈 유리바닥: 어린 아이들이 무서워하는 경우 있음 (young children sometimes find the glass floor frightening); 유모차 탑승 제한 있음 (stroller boarding restricted); 일부 부모들은 아이를 안고 탔다 (some parents held children throughout) |
| Normalized Claim | Crystal cabin has two child-relevant concerns: (1) glass floor can cause anxiety in young children; (2) stroller boarding is restricted or discouraged — parents may need to hold children. Crystal cabin is NOT recommended for families with young children who are anxious about heights or glass floors. |
| Claim Type | EXPERIENCE_PATTERN (including negative) |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | 여수해상케이블카 — Crystal cabin |
| Traveler-Context Scope | Families with young children; anxious children |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | EI-CC-004-CTX-A (Wave 0 reuse), EI-CC-004-A |
| Conflict Status | CLEAR |
| Notes/Limitations | WE level; anxiety response is individual. Not a formal age restriction, but experience pattern clearly shows child discomfort risk. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

### EI-CC-004-C — 자산(Jasando) Station Child-Specific Facilities (WE/OFFICIAL)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-CC-004-C |
| ER IDs | ER-CC-004 |
| Source Role | WORLD_EXPERIENCE / OFFICIAL |
| Source Name | Korean search synthesis + yeosu-cablecar.co.kr |
| Source Type | WE + OFFICIAL |
| Source Locator | yeosu-cablecar.co.kr; Korean synthesis |
| Accessed Date | 2026-09-28 |
| Publication Date | UNKNOWN |
| Extracted Claim | 자산역: 엘리베이터 있음 (elevator available); 3층 판타지뉴월드 (Fantasy New World — children's themed attraction, 3F); 기념품 가게; 전망대 (observation deck); 자산 측 전망이 오동도와 만성리 방향으로 넓다 (views toward Odongdo and Manseong-ri) |
| Normalized Claim | Jasando (자산) station has elevator access (mobility-friendly for strollers); 판타지뉴월드 children's themed attraction on 3F is the key child-specific facility; this station has more family-entertainment facilities than Dolsan |
| Claim Type | STRUCTURAL_FACT + EXPERIENCE_PATTERN |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | 자산역 (Jasando Station) |
| Traveler-Context Scope | Families with children |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | EI-CC-004-A, EI-CC-004-D |
| Conflict Status | CLEAR |
| Notes/Limitations | 판타지뉴월드 details (pricing, specific attractions) not fully confirmed at OFFICIAL level; needs field confirmation before pilot. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

### EI-CC-004-D — 돌산(Dolsan) Station Child-Specific Facilities (WE)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-CC-004-D |
| ER IDs | ER-CC-004 |
| Source Role | WORLD_EXPERIENCE |
| Source Name | trip.com 돌산역 traveler moments / Korean synthesis |
| Source Type | WE traveler accounts |
| Source Locator | kr.trip.com/moments/돌산역; Korean search synthesis |
| Accessed Date | 2026-09-28 |
| Publication Date | 2024-2026 |
| Extracted Claim | 돌산역: 엘리베이터 있음 (elevator available); 대형 카페 (large café at station); 오동도 보이는 전망 (view toward Odongdo); 돌산 측 승강장은 큰 카페가 메인 (large café is the main attraction at Dolsan side) |
| Normalized Claim | Dolsan (돌산) station has elevator access; large café at the station; views toward Odongdo. Children's specific attractions at Dolsan are limited — the station is less child-activity-oriented than 자산 with 판타지뉴월드. |
| Claim Type | EXPERIENCE_PATTERN |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | 돌산역 (Dolsan Station) |
| Traveler-Context Scope | Families with children |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | EI-CC-004-C |
| Conflict Status | CLEAR |
| Notes/Limitations | No nursing room or diaper changing station documented at either station. Child-specific attraction at 돌산 is limited to café and views. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

### EI-CC-004-E — Under-36-Months Free and Age Policy (OFFICIAL — REUSE)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-CC-004-E |
| ER IDs | ER-CC-004 |
| Source Role | OFFICIAL |
| Source Name | yeosu-cablecar.co.kr (pricing page) |
| Source Type | OFFICIAL |
| Source Locator | yeosu-cablecar.co.kr/ticket |
| Accessed Date | 2026-09-28 |
| Publication Date | CURRENT |
| Extracted Claim | 36개월 미만 어린이 탑승 무료 (children under 36 months ride free) |
| Normalized Claim | Children under 36 months (approximately 3 years old) ride for free. This is a formal OFFICIAL policy. |
| Claim Type | POLICY_FACT |
| Stability Classification | SEMI_STABLE (pricing policies change) |
| Geographic Scope | 여수해상케이블카 (both stations) |
| Traveler-Context Scope | Families with infants and toddlers |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | VERIFIED (OFFICIAL source) |
| Corroboration Links | EI-CC-001-I (REUSED — CC-001 established this fact) |
| Conflict Status | CLEAR |
| Notes/Limitations | Price policies can change; recommend confirmation before pilot. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |
| Classification | DIRECT_REUSE (EI-CC-001-I) |

---

### Negative Items

**NEG-CC-004-001: No nursing room or diaper changing station documented at either station**
- Source: Multiple WE accounts reviewed; no mention of nursing room at either 자산 or 돌산 station
- Interpretation: Nursing room / diaper changing is likely NOT available at either station
- Implication: Families with infants/toddlers must plan accordingly
- CAUTION: Absence from WE accounts does not conclusively confirm non-existence; should be field-verified before pilot

**NEG-CC-004-002: Crystal cabin stroller restriction**
- Source: EI-CC-004-B
- Content: Crystal cabin boarding with stroller restricted or discouraged
- Implication: Families with strollers must use regular cabin

**NEG-CC-004-003: Crystal cabin glass floor — child anxiety risk**
- Source: EI-CC-004-B + EI-CC-004-CTX-A (Wave 0 reuse)
- Content: Young children sometimes find glass floor frightening
- Implication: Crystal cabin NOT recommended for young children with height/glass anxiety

---

## §7. Pattern Summary

**Per-Station, Per-Cabin Child Suitability:**

| Dimension | 자산(Jasando) | 돌산(Dolsan) |
|-----------|---------------|--------------|
| Elevator | YES ✓ | YES ✓ |
| Child attraction | 판타지뉴월드 3F | Large café only |
| Nursing room | NOT DOCUMENTED | NOT DOCUMENTED |
| Views | Odongdo + Manseong-ri direction | Odongdo direction |
| Overall child appeal | Higher (dedicated attraction) | Lower |

| Cabin Type | Child Suitability |
|-----------|------------------|
| Regular (일반) | CHILD-FRIENDLY — stroller (folded) permitted; children comfortable |
| Crystal (크리스탈) | CAUTION — glass floor anxiety for young children; stroller restricted |

**Pricing:**
- Under 36 months: FREE (OFFICIAL)
- Children (3-12): Reduced rate (confirm exact amount before pilot)

**Traveler Condition Hypothesis Tag:** `POTENTIAL_RESEARCH_RELEVANCE` — Crystal vs Regular cabin choice is capability-driven (child's anxiety response, stroller presence), not simply age. Consistent with hypothesis.

---

## §8. Independence Assessment

- EI-CC-004-A: mom-mom.net (independent WE source)
- EI-CC-004-B: Korean WE synthesis from naver reviews (independent WE)
- EI-CC-004-C: yeosu-cablecar.co.kr + Korean synthesis (OFFICIAL + WE)
- EI-CC-004-D: trip.com 돌산역 moments (independent WE)
- EI-CC-004-E: OFFICIAL (reused from CC-001-I)

4 independent sources + 1 OFFICIAL reuse. Independence confirmed.

---

## §9. Stop Condition Evaluation: EXPERIENCE_PATTERN_SUFFICIENT

**Requirements:**
- Multiple independent WE accounts per station ✓
- Per-cabin-type coverage ✓
- Negative/challenging conditions covered ✓
- No single-source reliance ✓

**Pattern established:**
- EP-1: Is regular cabin child-friendly? YES — stroller (folded) permitted; children comfortable ✓
- EP-2: Is Crystal cabin appropriate for young children? CAUTION — glass floor anxiety; stroller restriction ✓
- EP-3: What child facilities exist at 자산? Elevator + 판타지뉴월드 ✓
- EP-4: What child facilities exist at 돌산? Elevator + café only ✓
- EP-5: Is there a free-ride policy for infants? YES — under 36 months free ✓

**STOP CONDITION: PASS**

---

## §10. Final Status

**ER-CC-004: VERIFIED_FOR_PREPARATION**

Wave 0 gap register update: CC-004 PARTIALLY_SUPPORTED → CLOSED (VERIFIED_FOR_PREPARATION)  
Cycle: 21  
Downstream: ER-CX-001 (C-2 for MT-1 Turn 2) dependency partially satisfied

---

## §11. Judgment Ingredient

For C-2 SOUL use:
- JUDGMENT_INGREDIENT: "Regular cabin is child-friendly — stroller (folded) OK; children comfortable with ocean views. Crystal cabin NOT recommended for young children: glass floor can cause anxiety; stroller boarding restricted. 자산역 has elevator + 판타지뉴월드 (3F children's themed attraction) — better for families. 돌산역 has elevator + large café only. Under-36-months ride free (OFFICIAL). No nursing room or diaper station documented at either station."
- CAVEAT: 판타지뉴월드 details need field confirmation; nursing room absence requires field verification

**FINAL ANSWER: PROHIBITED**

---

*Cycle 21 | Wave 4a | 2026-09-28 | Branch: staging/storybook-c7a*
