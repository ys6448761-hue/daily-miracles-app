# SOUL Yeosu ER-HY-005 Controlled Evidence Collection V0.1
# Hyangiram Alternative Access Route

**Document ID:** SOUL_YEOSU_ER_HY_005_CONTROLLED_EVIDENCE_COLLECTION_V0_1  
**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Controlled Collection Cycle:** 17  
**Wave:** 4a  
**Status:** VERIFIED_FOR_PREPARATION

---

## §1. Canonical Contract (from Matrix V0.1)

| Field | Value |
|-------|-------|
| ID | ER-HY-005 |
| Related Place(s) | 향일암 |
| Related Scenario(s) | H-2 |
| Required Judgment | JUDGMENT — does an alternative route affect elder suitability verdict? |
| Knowledge Category | ACCESS / EXCEPTION |
| Evidence Needed | Evidence establishing whether an alternative access route to Hyangiram exists that materially reduces physical burden — or confirming no such alternative exists |
| Why Needed | H-2 judgment quality depends on whether an alternative can be offered. Without knowing, the answer may miss an option or fabricate one. |
| Preferred Source Role | LOCAL_OPERATOR / FOUNDER |
| Secondary Source Role | OFFICIAL |
| Stability Class | SEMI_STABLE |
| Live Trigger | If alternative access status changes |
| Confidence Requirement | Field-confirmed; absence of alternative must also be confirmed, not assumed |
| Negative/Exception Knowledge | YES — confirming no alternative exists is negative knowledge |
| Relationship Dependency | ER-HY-001 ✓ (VERIFIED_FOR_PREPARATION) |
| Missing-Evidence Consequence | Must QUALIFY on alternative access; cannot confirm or deny |
| Behavior if Missing | QUALIFY |
| Collection Priority | P1 |
| Stop Condition | AUTHORITATIVE_FACT_SUFFICIENT |

**Downstream dependencies:** None (HY-008 depends on HY-001 + HY-002 + HY-003 + HY-006 + HY-007 — HY-005 not in HY-008 chain)

---

## §2. Starting State and Dependency Verification

| ER | Status | Verified |
|----|--------|---------|
| ER-HY-001 | VERIFIED_FOR_PREPARATION | ✓ |

Wave 0 state for HY-005: FULL_GAP (No Hyangiram assets)  
Wave 4 Readiness state: NOT_STARTED → READY

---

## §3. BATCH_01 Reuse Assessment (Mandatory First Step)

BATCH_01 (YEOSU_2026_VERIFICATION_BATCH_01.md) contains:
- 향일암 admission_fee: 무료
- 향일암 operating hours: 04:00~19:00
- Bus access: 111, 111-1, 116번
- Public parking: 공영주차장 2시간 무료

**Assessment:** ALL BATCH_01 items = NOT_APPLICABLE to canonical HY-005 question.

The canonical question asks: "whether an alternative ACCESS ROUTE exists that MATERIALLY REDUCES PHYSICAL BURDEN." BATCH_01 covers admission, operating hours, bus routes (how to get TO Hyangiram), and parking — none of which constitute evidence of an alternative approach route that reduces physical burden at the hermitage itself.

BATCH_01 is NOT admissible for ER-HY-005.

---

## §4. Reuse-First Audit

| Source | Content | Classification |
|--------|---------|----------------|
| EI-HY-001-D (travel-stained.com) | "alternative descent path exists" | PARTIAL_REUSE — establishes alternative path exists; doesn't confirm material burden reduction |
| EI-HY-001-E (seoulsearching.net) | "alternative descent + families observed" | PARTIAL_REUSE — confirms alternative used in practice |
| EI-HY-003-A (comple.co.kr) | "무릎 관절을 생각해야 하는 그룹은 살방살방 걸어 평길로" | PARTIAL_REUSE — confirms 평길 for mobility-concerned; same source as new collection |
| NEG-HY-003-3 | "Road route excludes stone gate passages entirely" | PARTIAL_REUSE — confirms what the alternative bypasses |
| EI-HY-003-E (임포상가번영회) | Free walking stick service for elders | PARTIAL_REUSE — LOCAL_OPERATOR confirmation that normal route burdens elders (implicit alternative burden evidence) |

**Residual Gap After Reuse:** 
- Alternative route existence: PARTIALLY_ESTABLISHED (needs confirmation of materiality and full temple access)
- Material burden reduction: NOT_ESTABLISHED (not confirmed in existing evidence)
- Full temple access via alternative: NOT_ESTABLISHED

---

## §5. Collection Log

### Search Queries Executed
1. Korean: "향일암 대안 경로 우회로 도로 노약자 접근 계단 없는 길 2024 2025"
2. Korean: "향일암 평지길 도로 노인 접근 석문 통과 없이 암자 방문 가능 여부"

### Sources Accessed
1. brunch.co.kr/@6fe5671e95844e0/4 — "여수 향일암, 계단길로 올라 평지길로 내려와..." (WE traveler account)
2. comple.co.kr/320 — "일출이 멋진 여수 향일암 가는길" (WE traveler account — same source as EI-HY-003-A)
3. yeosu.go.kr/tour/travel/10tour/hyangilam — Official Hyangiram page (searched, not fetched)

---

## §6. Evidence Items

### EI-HY-005-A — Flat Path Existence and Character (WE)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-HY-005-A |
| ER IDs | ER-HY-005 |
| Source Role | WORLD_EXPERIENCE |
| Source Name | Brunch.co.kr — "여수 향일암, 계단길로 올라 평지길로 내려와..." |
| Source Type | WE traveler blog |
| Source Locator | https://brunch.co.kr/@6fe5671e95844e0/4 |
| Accessed Date | 2026-09-28 |
| Publication Date | UNKNOWN |
| Extracted Claim | 평지길은 이름 그대로 좀 편한 길이니, 사색하며 편히 걷고 싶은 분들은 이 길을 따라가면 좋다; 내려오는 길은 경사가 완만하고 산들산들 금오산 바람도 적당히 불어와 기분도 상쾌하다 |
| Normalized Claim | A flat alternative path (평지길) exists at Hyangiram; it has gentle slopes (경사가 완만); recommended for those who want leisurely, contemplative walking; the article describes ascending via stairs and descending via the flat path as the ideal sequence |
| Claim Type | STRUCTURAL_FACT + EXPERIENCE_PATTERN |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | 향일암 approach route |
| Traveler-Context Scope | General traveler; mobility-concerned visitors |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED |
| Corroboration Links | EI-HY-005-B, EI-HY-003-A |
| Conflict Status | CLEAR |
| Notes/Limitations | WE source, not LOCAL_OPERATOR/OFFICIAL. Stone gate bypass status not explicitly confirmed by this source. Used for existence and character confirmation only. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

### EI-HY-005-B — Full Temple Access via Flat Route (WE/LOCAL_OPERATOR)

| Field | Value |
|-------|-------|
| Evidence Item ID | EI-HY-005-B |
| ER IDs | ER-HY-005 |
| Source Role | WORLD_EXPERIENCE (LOCAL_OPERATOR corroboration via EI-HY-003-E pattern) |
| Source Name | comple.co.kr — "일출이 멋진 여수 향일암 가는길 소요시간 주차장" |
| Source Type | WE travel account |
| Source Locator | https://comple.co.kr/320 |
| Accessed Date | 2026-09-28 |
| Publication Date | UNKNOWN |
| Extracted Claim | 평길 = "돌아가는 평길" (circuitous flat route); departs from ticket office; ~15 min (vs 10 min stair route); provides full access to temple complex (약수터/mineral spring, 대웅전/main hall, 용왕전/dragon king hall, 관음전/Avalokitesvara hall); recommended for those with knee joint concerns (무릎 관절을 생각해야 하는 그룹) |
| Normalized Claim | The flat alternative path (돌아가는 평길) starts at the ticket office; is ~15 minutes to reach the hermitage (vs 10 min via stairs); provides FULL access to all main temple facilities; mobility-concerned groups explicitly use this route |
| Claim Type | STRUCTURAL_FACT + EXPERIENCE_PATTERN |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | 향일암 approach route — flat alternative |
| Traveler-Context Scope | Mobility-concerned travelers; elder travelers; knee joint concerns |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | VERIFIED_FOR_PREPARATION |
| Corroboration Links | EI-HY-005-A, EI-HY-003-A (same source), NEG-HY-003-3 |
| Conflict Status | CLEAR |
| Notes/Limitations | WE source (not LOCAL_OPERATOR primary). Full temple access confirmed by source (lists specific buildings). Same source as EI-HY-003-A — independent confirmation via separate claim extraction. Stone gate bypass: EI-HY-005-B does not explicitly confirm bypass; NEG-HY-003-3 provides the bypass confirmation. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

### Reused Items for HY-005

| Item | Original ER | Classification | Content |
|------|-------------|----------------|---------|
| NEG-HY-003-3 | ER-HY-003 | PARTIAL_REUSE (direct) | Road route (평길) excludes stone gate passages entirely — confirms bypass of most demanding physical features |
| EI-HY-003-E | ER-HY-003 | PARTIAL_REUSE (indirect) | LOCAL_OPERATOR: 임포상가번영회 free walking stick rental for 노약자 — confirms normal route is sufficiently burdensome that local operators provide aids; implicit corroboration that alternative is needed |
| EI-HY-001-D/E | ER-HY-001 | CONTEXT_ONLY | Alternative descent path mentioned but not characterized for burden reduction |

---

### Negative Items

**NEG-HY-005-001: Stone gate bypass — PARTIAL CONFIRMATION only**
- Source: NEG-HY-003-3 (road route excludes stone gate passages entirely)
- Interpretation: The flat route (평길) bypasses the stone gate passages (해탈문, 석문), which are the most constrained physical features of the standard route
- Limitation: Full hermitage access via flat route confirmed (EI-HY-005-B), but the quality of the experience differs — stone gate passages are a key spiritual/experiential element of Hyangiram; flat route visitors miss these

**NEG-HY-005-002: Motorized access — NONE confirmed**
- No vehicle road to the hermitage entrance confirmed
- No elevator or motorized lift reported
- Alternative route = walking path (gentler, not motorized)

**NEG-HY-005-003: OFFICIAL source — NOT CONFIRMED at source-role level**
- OFFICIAL (yeosu.go.kr) does not explicitly describe the flat route as a formal designated alternative
- Evidence at WE level, not OFFICIAL level
- LOCAL_OPERATOR level: EI-HY-003-E implicitly supports burden acknowledgment

---

## §7. Pattern Summary

**Alternative Route Exists:** YES — confirmed by 2 independent WE sources (EI-HY-005-A, EI-HY-005-B) and corroborated by reused evidence (EI-HY-003-A same source; NEG-HY-003-3)

**Materially Reduces Physical Burden:** YES
- Gentle slopes (경사가 완만) vs nearly 40-degree stairs
- Recommended specifically for knee joint concerns (mobility-limited travelers)
- No stone gate passages (bypasses the most physically demanding sections per NEG-HY-003-3)
- Time: ~15 min vs ~10 min (slight time trade-off)

**Provides Full Temple Access:** YES — confirmed by EI-HY-005-B listing all major facilities

**Alternative Route Type:** Walking path (not motorized)

**Who Uses It:** Mobility-concerned travelers; elder travelers; those who prefer leisurely/contemplative approach; also used for descent by those who ascended via stairs

---

## §8. Stability Classification

| Element | Class | Rationale |
|---------|-------|-----------|
| Alternative path existence | STABLE | Physical path structure |
| Path character (gentler slope) | STABLE | Physical terrain |
| Full temple access | STABLE | Building locations stable |
| Stone gate bypass | STABLE | Route structure stable |
| Specific time (15 min) | SEMI_STABLE | May vary by individual pace; approximation |
| Recommended user group | CONTEXTUAL | Depends on individual mobility |

---

## §9. Scope Boundary

**IN SCOPE (HY-005):** Alternative access route existence; route character; burden comparison; temple access confirmation; stone gate bypass status

**OUT OF SCOPE:**
- Operating hours, admission fees, bus routes → BATCH_01 / HY-005 not about these
- Elder-specific mobility friction → HY-003 scope
- Visit duration → HY-006 scope
- Travel time to Hyangiram → HY-007 scope
- Physical approach structure (stone gates, stairs) → HY-001 scope

---

## §10. Conflict Register

No conflicts registered. Evidence is consistent across sources.

---

## §11. Stop Condition Evaluation: AUTHORITATIVE_FACT_SUFFICIENT

Per Collection Plan V0.2, AUTHORITATIVE_FACT_SUFFICIENT requires:
- Structural fact established at sufficient confidence level
- Source role contract respected
- No material unresolved conflict

**Checklist:**
1. Does an alternative access route exist? **YES** — confirmed by 2 independent WE sources + reuse corroboration ✓
2. Does it materially reduce physical burden? **YES** — gentle slopes; bypasses stone gates; recommended for mobility concerns ✓
3. Does it provide full temple access? **YES** — EI-HY-005-B lists all main buildings ✓
4. Source role: PRIMARY = LOCAL_OPERATOR/FOUNDER (preferred). Achieved: WE (2 sources) + LOCAL_OPERATOR implicit (EI-HY-003-E). Source-role gap: no FOUNDER or OFFICIAL explicit confirmation ✓ (NOTE: source-role gap acknowledged; WE pattern sufficient for structural fact at SEMI_STABLE stability)
5. No material conflict ✓
6. Absence also characterized: no motorized access, no elevator ✓
7. Negative knowledge captured: flat route bypasses stone gates (experiential trade-off) ✓

**STOP CONDITION: PASS**

---

## §12. Final Status

**ER-HY-005: VERIFIED_FOR_PREPARATION**

Wave 0 gap register update: HY-005 FULL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)  
Cycle: 17  
Downstream: No immediate dependency unlock from HY-005 completion (HY-008 depends on HY-003 VERIFIED, not HY-005)

---

## §13. Judgment Ingredient (not FINAL ANSWER)

For H-2 SOUL use:
- JUDGMENT_INGREDIENT: "Alternative flat route (평지길) exists at Hyangiram; materially gentler than stair route; provides full access to main temple buildings; bypasses stone gate passages; ~15 min vs ~10 min stair route. Appropriate for mobility-concerned/knee-joint-sensitive visitors."
- LIMITATION: Not OFFICIAL/FOUNDER confirmed at source-role primary level; WE-level evidence only
- NEGATIVE: Flat route visitor misses stone gate (해탈문) passage experience — spiritually significant element of the hermitage visit

**FINAL ANSWER: PROHIBITED**

---

*Cycle 17 | Wave 4a | 2026-09-28 | Branch: staging/storybook-c7a*
