# SOUL Yeosu 3-Place Evidence Collection
# Wave 0: Infrastructure + Existing RB Asset Mapping
# V0.1

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 99f839e
**Execution Basis:** `docs/research/SOUL_YEOSU_3_PLACE_CONTROLLED_EVIDENCE_COLLECTION_PLAN_V0_2.md`
**Matrix Basis:** `docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md`
**Status:** WAVE_0_PASS

---

## 0. Wave 0 Execution Summary

Wave 0 establishes the collection infrastructure and maps all existing pre-collection RB assets to Evidence Requirements. No new Odongdo, Hyangiram, or Cable Car evidence is collected in this wave.

**Files read in Wave 0 execution (prescribed read order):**

| # | File | Role |
|---|---|---|
| 1 | `docs/research/SOUL_YEOSU_3_PLACE_CONTROLLED_EVIDENCE_COLLECTION_PLAN_V0_2.md` | Governing plan (V0.2) — all rules |
| 2 | `docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md` | All 29 ER definitions |
| 3 | `docs/research/YEOSU_CABLE_CAR_ENTITY_IDENTITY_OFFICIAL_RESEARCH_RB01_V0_1.md` | RB-01 |
| 4 | `docs/research/YEOSU_CABLE_CAR_ONE_WAY_ROUNDTRIP_RESEARCH_RB02_V0_1.md` | RB-02 |
| 5 | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` | RB-03 |
| 6 | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` | Cable Car WE |
| 7 | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` | Cable Car Founder |

**Associated files noted (NOT fully read in Wave 0 — flagged for pre-Wave 1 review):**

| File | Note |
|---|---|
| `docs/knowledge/YEOSU_RELATIONSHIP_KNOWLEDGE_HAMEL_TO_CABLE_CAR_V0_1.md` | Hamel→Cable Car — out-of-scope for 29 ERs |
| `docs/knowledge/YEOSU_RELATIONSHIP_HAMEL_CABLE_CAR_PHYSICAL_ROUTE_VERIFICATION_DECISION_V0_1.md` | NOF-02B decision — out-of-scope |
| `docs/knowledge/YEOSU_RELATIONSHIP_HAMEL_CABLE_CAR_NOF02B_CLOSURE_DECISION_V0_1.md` | NOF-02B closure — out-of-scope |
| `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_01.md` through `BATCH_06.md` | General Yeosu batches — not in RB corpus; requires separate asset survey before Wave 1+ |
| `docs/knowledge/YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md` | Not in RB corpus |
| `docs/knowledge/YEOSU_ROUTE_CORPUS_V0_1.md` | Not in RB corpus |
| `docs/knowledge/YEOSU_TIME_KNOWLEDGE_V0_1.md` | Not in RB corpus |
| `docs/knowledge/YEOSU_TRAVEL_TIME_MATRIX_V0_1.md` | Not in RB corpus |

**Wave 0 scope boundary:** RB assets = RB-01, RB-02, RB-03, Cable Car WE, Cable Car Founder. General Yeosu knowledge batches require a separate pre-collection asset survey (flagged in §12).

---

## 1. Provenance Capture Mechanism

**Status: READY**

The 20-field provenance schema below is the authoritative template for all evidence items created in Waves 1–5.

### 1.1 Evidence Item Template

```
Evidence Item ID:          [EI-{PLACE_CODE}-{SEQUENCE_NUMBER}]
ER IDs:                    [{ER-XX-XXX}, ...]
Source Role:               [OFFICIAL / MAP_ROUTE / WORLD_EXPERIENCE / LOCAL_OPERATOR / FOUNDER / LIVE]
Source Name:               [{source name, e.g., 나무위키 여수해상케이블카 항목}]
Source Type:               [OFFICIAL_PRIMARY / SUPPORTING / NON_OFFICIAL_BLOG / FOUNDER_LOCAL / MAP_DATA / ...]
Source Locator:            [{URL or file path}]
Accessed Date:             [{YYYY-MM-DD}]
Publication Date:          [{YYYY-MM-DD or UNKNOWN}]
Extracted Claim:           [{Exact claim extracted. No paraphrase without marking.}]
Claim Type:                [STRUCTURAL_FACT / OPERATIONAL_FACT / EXPERIENCE_PATTERN / JUDGMENT / LIVE_VARIABLE / RELATIONSHIP_FACT]
Stability Classification:  [STABLE / SEMI_STABLE / VOLATILE / CONTEXTUAL]
Geographic Scope:          [{Station name / place_code / access point / etc.}]
Traveler-Context Scope:    [{General traveler / family with children / vehicle arrival / etc.}]
Collector:                 [Claude (SOUL Knowledge Authoring) / Founder / ...]
Verification Status:       [NOT_VERIFIED / PARTIALLY_VERIFIED / VERIFIED_FOR_PREPARATION / CONFLICTED / LIVE_ONLY]
Corroboration Links:       [{EI IDs that corroborate, or NONE}]
Conflict Status:           [CLEAR / CONFLICT-{ID}: {description}]
Notes/Limitations:         [{Any limitations on use}]
Superseded By:             [{EI ID that supersedes this, or NONE}]
Recommended Refresh Window:[{e.g., before pilot execution / after 6 months / always live-verify}]
```

### 1.2 Evidence Item ID Convention

```
EI-{place_code_abbreviated}-{ER_abbreviated}-{sequence}
Examples:
  EI-CC-001-A   Cable Car, ER-CC-001, item A
  EI-OD-001-A   Odongdo, ER-OD-001, item A
  EI-REL-001-A  Relationship, ER-REL-001, item A
  EI-CC-RB02-A  Cable Car, RB-02 asset (no direct ER), item A
```

### 1.3 Collection Lifecycle Status Values (V0.2)

| Status | Meaning |
|---|---|
| NOT_STARTED | No evidence collected for this ER |
| IN_COLLECTION | Evidence gathering has begun; not yet sufficient |
| PROVISIONALLY_SUPPORTED | Evidence gathered; under review |
| CONFLICTED | Evidence collected but unresolved conflict exists |
| BLOCKED | Collection blocked by external dependency (e.g., no source available) |
| BLOCKED-DEPENDENCY | Prerequisite ER is BLOCKED/CONFLICTED/UNKNOWN; may collect independently but MUST NOT advance to VERIFIED_FOR_PREPARATION |
| VERIFIED_FOR_PREPARATION | Collection complete; evidence sufficient per stop condition |
| LIVE_ONLY | Evidence inherently requires real-time verification; cannot be pre-collected |
| UNKNOWN | Status cannot be determined from available information |
| SYSTEM_TEST_DEFERRED | ER-CX-001 only; outside evidence collection waves |

---

## 2. Existing Asset Inventory

The following assets constitute the existing RB corpus available for ER mapping. All assets are from the Cable Car domain. No existing assets exist for Odongdo or Hyangiram domains.

| Asset ID | File | Domain | Primary Source Role | Status | Date |
|---|---|---|---|---|---|
| ASSET-001 | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` | Cable Car | WORLD_EXPERIENCE | WE REVIEW V0.1 SAVED | 2026-09-24 |
| ASSET-002 | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` | Cable Car | FOUNDER_INTENT | FOUNDER REVIEW V0.1 SAVED | 2026-09-24 |
| ASSET-003 | `docs/research/YEOSU_CABLE_CAR_ENTITY_IDENTITY_OFFICIAL_RESEARCH_RB01_V0_1.md` | Cable Car | SUPPORTING (OFFICIAL inaccessible) | PARTIALLY_VERIFIED | 2026-09-25 |
| ASSET-004 | `docs/research/YEOSU_CABLE_CAR_ONE_WAY_ROUNDTRIP_RESEARCH_RB02_V0_1.md` | Cable Car | SUPPORTING | PARTIALLY_VERIFIED | 2026-09-25 |
| ASSET-005 | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` | Hamel→Cable Car | FOUNDER_LOCAL / FIELD_CONFIRMATION | VERIFIED_BY_FIELD_CONFIRMATION | 2026-09-25 |

**Note on ASSET-005 scope:** RB-03 is about Hamel Lighthouse → Cable Car access. Hamel Lighthouse is NOT one of the 3 pilot places (Odongdo, Hyangiram, Cable Car). RB-03 evidence maps to ER-CC-002 (자산 side access from one specific approach point) as PARTIAL coverage only.

**Out-of-scope asset (noted, not counted):**
- Relationship Knowledge (Hamel→Cable Car): out-of-scope for all 29 ERs because it addresses a non-pilot place relationship.

---

## 3. Existing Evidence Item Records

Evidence items extracted from existing assets. Items are written in the 20-field schema.

---

### 3.1 From ASSET-003 (RB-01)

**EI-CC-001-A — 자산 side station names (Namu Wiki)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-001-A |
| ER IDs | ER-CC-001 |
| Source Role | SUPPORTING |
| Source Name | 나무위키 — 여수해상케이블카 항목 |
| Source Type | SUPPORTING (encyclopedic, non-official) |
| Source Locator | Namu Wiki (URL inaccessible from RB-01 record; accessed via 나무위키) |
| Accessed Date | 2026-09-25 |
| Publication Date | UNKNOWN |
| Extracted Claim | 자산 측 탑승 지점은 브랜드명 "해야정류장" 및 지역-접두어명 "자산정류장"으로 표기됨 |
| Claim Type | STRUCTURAL_FACT |
| Stability Classification | STABLE |
| Geographic Scope | 자산 측 케이블카 탑승 시설 |
| Traveler-Context Scope | All travelers |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PARTIALLY_VERIFIED (OFFICIAL_PRIMARY inaccessible) |
| Corroboration Links | EI-CC-001-B (blog) |
| Conflict Status | CLEAR within source; OFFICIAL_PRIMARY not yet corroborated |
| Notes/Limitations | Official site (yeosucablecar.com) SSL error — cannot confirm. Two non-official sources agree. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot; official site access required |

---

**EI-CC-001-B — 자산 side station names (blog)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-001-B |
| ER IDs | ER-CC-001 |
| Source Role | WORLD_EXPERIENCE |
| Source Name | oh-my-post.com 블로그 |
| Source Type | NON_OFFICIAL_BLOG |
| Source Locator | oh-my-post.com (specific URL not recorded in RB-01) |
| Accessed Date | 2026-09-25 |
| Publication Date | UNKNOWN |
| Extracted Claim | 자산 측 탑승 지점은 "해야정류장"/"자산정류장"으로 불림; 돌산 측은 "놀아정류장"/"돌산정류장" |
| Claim Type | STRUCTURAL_FACT |
| Stability Classification | STABLE |
| Geographic Scope | 자산 측 + 돌산 측 |
| Traveler-Context Scope | All travelers |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PARTIALLY_VERIFIED |
| Corroboration Links | EI-CC-001-A |
| Conflict Status | CLEAR with EI-CC-001-A |
| Notes/Limitations | Single blog source; no independent editorial review |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

**EI-CC-001-C — Entity distinction: 자산공원 ≠ 해야정류장**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-001-C |
| ER IDs | ER-CC-001 |
| Source Role | SUPPORTING |
| Source Name | 나무위키 — 여수해상케이블카 항목 |
| Source Type | SUPPORTING |
| Accessed Date | 2026-09-25 |
| Publication Date | UNKNOWN |
| Extracted Claim | 자산공원과 해야정류장(자산정류장)은 별개 Entity; 해야정류장은 자산공원 내부 또는 인접 위치 (LOCATED_WITHIN/ADJACENT 관계) |
| Claim Type | STRUCTURAL_FACT |
| Stability Classification | STABLE |
| Geographic Scope | 자산공원 / 해야정류장 |
| Traveler-Context Scope | All travelers |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PARTIALLY_VERIFIED |
| Corroboration Links | EI-CC-001-A |
| Conflict Status | CLEAR |
| Notes/Limitations | Exact relationship (LOCATED_WITHIN vs ADJACENT) not confirmed from official source |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

**EI-CC-001-INACCESSIBLE — Official site SSL error record**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-001-INACCESSIBLE |
| ER IDs | ER-CC-001 |
| Source Role | OFFICIAL |
| Source Name | yeosucablecar.com |
| Source Type | OFFICIAL_PRIMARY |
| Source Locator | yeosucablecar.com |
| Accessed Date | 2026-09-25 |
| Publication Date | N/A |
| Extracted Claim | ACCESS FAILED — SSL error. No evidence extracted. |
| Claim Type | N/A |
| Stability Classification | N/A |
| Geographic Scope | Both stations |
| Traveler-Context Scope | N/A |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | NOT_VERIFIED |
| Corroboration Links | NONE |
| Conflict Status | CLEAR (no data extracted) |
| Notes/Limitations | Persistent SSL error noted in RB-01 and RB-02. Official confirmation remains blocked unless site recovers. |
| Superseded By | NONE |
| Recommended Refresh Window | Retry before Wave 1 CC collection |

---

### 3.2 From ASSET-004 (RB-02)

**Note on RB-02 ER mapping:** RB-02 addresses 편도/왕복 ticket choice structure (VR-006). After reviewing all 29 ERs, no ER requires ticket-structure evidence as a primary need. ER-REL-001 references "one-way trip" as a conceptual framing but requires directional geography evidence, not ticket availability evidence. RB-02 evidence is therefore recorded as CONTEXT_ONLY — it does not satisfy or partially satisfy any ER's sufficiency requirement.

**EI-CC-RB02-A — 편도/왕복 both available (Namu Wiki)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-RB02-A |
| ER IDs | NONE (context only — does not address any ER's primary evidence need) |
| Source Role | SUPPORTING |
| Source Name | 나무위키 — 여수해상케이블카 항목 |
| Source Type | SUPPORTING |
| Accessed Date | 2026-09-25 |
| Publication Date | UNKNOWN |
| Extracted Claim | 편도 및 왕복 탑승 모두 판매; 여행자 자유 선택 가능. 요금표: 일반 대인 왕복 17,000원 / 편도 14,000원. 크리스탈 캐빈 왕복 24,000원 / 편도 19,000원. |
| Claim Type | OPERATIONAL_FACT |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | Both stations (ticket structure) |
| Traveler-Context Scope | General traveler |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PARTIALLY_VERIFIED (OFFICIAL_PRIMARY inaccessible) |
| Corroboration Links | EI-CC-RB02-B |
| Conflict Status | CLEAR within sources; OFFICIAL_PRIMARY unconfirmed |
| Notes/Limitations | No ER maps to this evidence as primary need. Held as context. May become relevant if ER scope is later extended. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot (price especially volatile) |

---

**EI-CC-RB02-B — 편도/왕복 confirmation (blog)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-RB02-B |
| ER IDs | NONE (context only) |
| Source Role | WORLD_EXPERIENCE |
| Source Name | oh-my-post.com 블로그 |
| Source Type | NON_OFFICIAL_BLOG |
| Accessed Date | 2026-09-25 |
| Publication Date | UNKNOWN |
| Extracted Claim | 왕복 17,000원 / 편도 14,000원 (일반 캐빈 대인) — 나무위키 요금표 일치. 편도/왕복 모두 판매 확인. |
| Claim Type | OPERATIONAL_FACT |
| Stability Classification | SEMI_STABLE |
| Geographic Scope | Both stations |
| Traveler-Context Scope | General traveler |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PARTIALLY_VERIFIED |
| Corroboration Links | EI-CC-RB02-A |
| Conflict Status | CLEAR with EI-CC-RB02-A |
| Notes/Limitations | No ER maps to this evidence as primary need. Context only. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

### 3.3 From ASSET-005 (RB-03)

**EI-CC-002-A — 자산 side access by car from Hamel (Founder field)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-A |
| ER IDs | ER-CC-002 (partial — one approach direction only) |
| Source Role | FOUNDER |
| Source Name | Founder (푸르미르) — 직접 현장 경험 |
| Source Type | FOUNDER_LOCAL / FIELD_CONFIRMATION |
| Source Locator | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` §4 FFE-01 |
| Accessed Date | 2026-09-25 |
| Publication Date | 2026-09-25 |
| Extracted Claim | 하멜등대 방파제 입구 → 자산 측 케이블카 탑승 시설: 차량 이동 약 1~2분 ("바로 옆"). Founder experienced approximate range. |
| Claim Type | RELATIONSHIP_FACT |
| Stability Classification | STABLE (구조) / SEMI_STABLE (정확한 시간) |
| Geographic Scope | 하멜등대 방파제 입구 → 자산 측 탑승 시설 |
| Traveler-Context Scope | Vehicle travelers approaching from Hamel Lighthouse direction |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PARTIALLY_VERIFIED (single Founder field experience; not officially confirmed) |
| Corroboration Links | EI-CC-002-B |
| Conflict Status | CLEAR |
| Notes/Limitations | Scope: Hamel → 자산 side ONLY. Does not address general 자산 side access structure or 돌산 side. Time = Founder experienced approximate range; not official/map measurement. Traffic conditions not controlled. |
| Superseded By | NONE |
| Recommended Refresh Window | Stable for approach feasibility; time range requires field re-confirmation before pilot |

---

**EI-CC-002-B — 자산 side access by walking from Hamel (Founder field)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-B |
| ER IDs | ER-CC-002 (partial — one approach direction, walking mode) |
| Source Role | FOUNDER |
| Source Name | Founder (푸르미르) — 직접 현장 경험 |
| Source Type | FOUNDER_LOCAL / FIELD_CONFIRMATION |
| Source Locator | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` §4 FFE-02 |
| Accessed Date | 2026-09-25 |
| Publication Date | 2026-09-25 |
| Extracted Claim | 하멜등대 방파제 입구 → 자산 측 케이블카 탑승 시설: 도보 약 5~10분. 평지 (Founder Local 기준). |
| Claim Type | RELATIONSHIP_FACT |
| Stability Classification | STABLE (접근 가능 여부) / SEMI_STABLE (시간) |
| Geographic Scope | 하멜등대 방파제 입구 → 자산 측 탑승 시설 |
| Traveler-Context Scope | Pedestrian travelers from Hamel Lighthouse direction |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PARTIALLY_VERIFIED |
| Corroboration Links | EI-CC-002-A |
| Conflict Status | CLEAR |
| Notes/Limitations | Hamel approach only. Walking route geometry not confirmed. Accessibility not verified. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

**EI-CC-002-C — 돌산 side access by car from Hamel (Founder field, secondary)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-C |
| ER IDs | ER-CC-002 (supplementary — 돌산 side, Hamel approach only) |
| Source Role | FOUNDER |
| Source Name | Founder (푸르미르) — 직접 현장 경험 |
| Source Type | FOUNDER_LOCAL / FIELD_CONFIRMATION |
| Source Locator | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` §4 FFE-03 |
| Accessed Date | 2026-09-25 |
| Publication Date | 2026-09-25 |
| Extracted Claim | 하멜등대 방파제 입구 → 돌산 측 케이블카 탑승 시설: 차량 약 5~10분. |
| Claim Type | RELATIONSHIP_FACT |
| Stability Classification | STABLE (구조) / SEMI_STABLE (시간) |
| Geographic Scope | 하멜등대 방파제 입구 → 돌산 측 탑승 시설 |
| Traveler-Context Scope | Vehicle travelers from Hamel direction |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PARTIALLY_VERIFIED |
| Corroboration Links | NONE |
| Conflict Status | CLEAR |
| Notes/Limitations | Secondary evidence from RB-03 (RC-02 required 자산 side only). Captured as conditional branch knowledge per RB-03 §7. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

**EI-CC-002-D — 돌산 side access by walking from Hamel (Founder field, secondary)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-002-D |
| ER IDs | ER-CC-002 (supplementary — 돌산 side, walking, Hamel approach) |
| Source Role | FOUNDER |
| Source Name | Founder (푸르미르) — 직접 현장 경험 |
| Source Type | FOUNDER_LOCAL / FIELD_CONFIRMATION |
| Source Locator | `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md` §4 FFE-04 |
| Accessed Date | 2026-09-25 |
| Publication Date | 2026-09-25 |
| Extracted Claim | 하멜등대 방파제 입구 → 돌산 측 케이블카 탑승 시설: 도보 약 20~30분. |
| Claim Type | RELATIONSHIP_FACT |
| Stability Classification | STABLE (접근 가능) / SEMI_STABLE (시간) |
| Geographic Scope | 하멜등대 방파제 입구 → 돌산 측 탑승 시설 |
| Traveler-Context Scope | Pedestrian travelers from Hamel direction |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PARTIALLY_VERIFIED |
| Corroboration Links | NONE |
| Conflict Status | CLEAR |
| Notes/Limitations | Walking route geometry not confirmed. Accessibility not verified. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

### 3.4 From ASSET-001 (Cable Car WE) — Context Items

**Note:** WE document provides experience pattern evidence. No ER has WORLD_EXPERIENCE as the primary confidence source for the specific claims mapped here; these are CONTEXT_ONLY items that do not satisfy any ER's sufficiency requirement on their own.

**EI-CC-005-CTX-A — Operating volatility pattern (WE)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-005-CTX-A |
| ER IDs | ER-CC-005 (context — volatility pattern mentioned but not classified) |
| Source Role | WORLD_EXPERIENCE |
| Source Name | YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md |
| Source Type | WE_SYNTHESIS |
| Source Locator | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` §12 |
| Accessed Date | 2026-09-27 (Wave 0 read) |
| Publication Date | 2026-09-24 |
| Extracted Claim | 강풍 등 운행 변수 = MODERATE friction. Weather suspension criteria = VERIFY_REQUIRED. Strong-wind interruption procedure = VERIFY_REQUIRED. |
| Claim Type | OPERATIONAL_FACT |
| Stability Classification | VOLATILE (live operating factors) |
| Geographic Scope | Both stations / operations |
| Traveler-Context Scope | All travelers |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | NOT_VERIFIED (VERIFY_REQUIRED from WE) |
| Corroboration Links | NONE |
| Conflict Status | CLEAR |
| Notes/Limitations | WE notes that volatility factors exist but does not produce a formal volatility classification. ER-CC-005 requires official + operational pattern classification. This item establishes context only. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot; live-verify required each use |

---

**EI-CC-003-CTX-A — Parking friction context (WE)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-003-CTX-A |
| ER IDs | ER-CC-003 (context — conflict documented) |
| Source Role | WORLD_EXPERIENCE |
| Source Name | YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md |
| Source Type | WE_SYNTHESIS |
| Source Locator | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` §12, §15 (CONFLICT-F), §16 |
| Accessed Date | 2026-09-27 |
| Publication Date | 2026-09-24 |
| Extracted Claim | 주차 = MODERATE friction (§12). 주차 무료/유료/시간별 요금 등 CONFLICT-F OPEN (§15). Parking location / fee / capacity = VERIFY_REQUIRED (§16). |
| Claim Type | OPERATIONAL_FACT |
| Stability Classification | VOLATILE |
| Geographic Scope | Both stations |
| Traveler-Context Scope | Vehicle arrival travelers |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | CONFLICTED |
| Corroboration Links | NONE |
| Conflict Status | CONFLICT-F (OPEN — parking free/paid conflict, per WE §15) |
| Notes/Limitations | WE documents CONFLICT-F but does not resolve it. ER-CC-003 requires field-confirmed vehicle access and parking conditions. This item contributes only conflict documentation. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot; CONFLICT-F must be resolved |

---

**EI-CC-004-CTX-A — Child/age situation context (WE)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-004-CTX-A |
| ER IDs | ER-CC-004 (context only) |
| Source Role | WORLD_EXPERIENCE |
| Source Name | YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md |
| Source Type | WE_SYNTHESIS |
| Source Locator | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` §7, §13 |
| Accessed Date | 2026-09-27 |
| Publication Date | 2026-09-24 |
| Extracted Claim | Age / 어린이 listed as Situation Knowledge input (§13). Crystal Cabin: 고소공포/어린이 안전 mentioned (§7). SOUL rule: Crystal Cabin not universally recommended; age/thrill preference needed. |
| Claim Type | EXPERIENCE_PATTERN |
| Stability Classification | STABLE |
| Geographic Scope | Cable car (both stations implied) |
| Traveler-Context Scope | Family with children; Crystal Cabin consideration |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | PROVISIONALLY_SUPPORTED (experience pattern; Preferred Source = WORLD_EXPERIENCE for ER-CC-004) |
| Corroboration Links | NONE |
| Conflict Status | CLEAR |
| Notes/Limitations | ER-CC-004 requires per-station child suitability (boarding process, waiting area, physical access per station). WE provides general experience pattern but does not differentiate by station. Gap: station-specific child suitability not addressed. |
| Superseded By | NONE |
| Recommended Refresh Window | Before pilot |

---

### 3.5 From ASSET-002 (Cable Car Founder) — Context Items

**EI-REL-005-CTX-A — Founder philosophy context (directional judgment frame)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-REL-005-CTX-A |
| ER IDs | ER-REL-005 (context frame only — no directional geography evidence) |
| Source Role | FOUNDER |
| Source Name | YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md |
| Source Type | FOUNDER_INTENT |
| Source Locator | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` |
| Accessed Date | 2026-09-27 |
| Publication Date | 2026-09-24 |
| Extracted Claim | 케이블카 = "상승의 항로" (Founder). Core experience: 거리두기 → 성찰 → 희망 → 귀환. Working Founder Core Identity defined (§11). Note: Founder doc does NOT address cable car direction selection judgment or which direction better serves Odongdo connection. |
| Claim Type | JUDGMENT |
| Stability Classification | STABLE |
| Geographic Scope | Cable car (both stations implied; no directional geography) |
| Traveler-Context Scope | All travelers; DreamTown context |
| Collector | Claude (SOUL Knowledge Authoring) |
| Verification Status | NOT_VERIFIED for ER-REL-005 purposes (FOUNDER_INTENT ≠ directional evidence) |
| Corroboration Links | NONE |
| Conflict Status | CLEAR |
| Notes/Limitations | Founder Preferred Source Role for ER-REL-005. However, this Founder document addresses philosophical meaning, not directional geography or Odongdo connection judgment. ER-REL-005 evidence need remains open. |
| Superseded By | NONE |
| Recommended Refresh Window | STABLE; no refresh needed for Founder philosophy |

---

## 4. Asset → ER Forward Mapping

| Asset | ER Addressed | Coverage Level |
|---|---|---|
| ASSET-003 (RB-01) | ER-CC-001 | PRIMARY — PARTIALLY_VERIFIED |
| ASSET-003 (RB-01) | ER-REL-001 | CONTEXT_ONLY (station identity prerequisite confirmed; directional geography NOT addressed) |
| ASSET-004 (RB-02) | ER-CC-001 | SUPPLEMENTARY_CORROBORATION (station names mentioned in RB-01 §6 ticket context) |
| ASSET-004 (RB-02) | NONE | Context only; no ER primary need satisfied |
| ASSET-005 (RB-03) | ER-CC-002 | PARTIAL — 자산 side from Hamel approach (car + walking). Not general access structure. |
| ASSET-001 (WE) | ER-CC-003 | CONFLICT_DOCUMENTATION only (CONFLICT-F) |
| ASSET-001 (WE) | ER-CC-004 | PARTIAL_PATTERN (experience pattern; not per-station) |
| ASSET-001 (WE) | ER-CC-005 | CONTEXT_ONLY (volatility factors noted; not classified) |
| ASSET-001 (WE) | ER-REL-001 | CONTEXT_ONLY |
| ASSET-002 (Founder) | ER-REL-005 | CONTEXT_FRAME only; directional judgment evidence MISSING |

---

## 5. ER → Asset Reverse Mapping + Sufficiency Assessment

For each of 29 ERs: which assets cover it, and is existing coverage sufficient?

**Sufficiency levels:**
- VERIFIED_FOR_PREPARATION: existing evidence meets stop condition
- PARTIALLY_SUPPORTED: some evidence exists; gap remains
- CONTEXT_ONLY: existing evidence is tangential; ER evidence need not addressed
- NOT_ADDRESSED: zero relevant evidence

### Odongdo ERs (ER-OD-001 through ER-OD-007)

| ER | Asset Coverage | Sufficiency |
|---|---|---|
| ER-OD-001 | NONE | NOT_ADDRESSED |
| ER-OD-002 | NONE | NOT_ADDRESSED |
| ER-OD-003 | NONE | NOT_ADDRESSED |
| ER-OD-004 | EI-OD-004-A/B/C/D/E | **VERIFIED_FOR_PREPARATION (Wave 2, 2026-09-27)** |
| ER-OD-005 | NONE | NOT_ADDRESSED |
| ER-OD-006 | NONE | NOT_ADDRESSED |
| ER-OD-007 | NONE | NOT_ADDRESSED |

**Finding:** No existing assets exist for any Odongdo ER. All 7 Odongdo ERs require collection from scratch.

### Hyangiram ERs (ER-HY-001 through ER-HY-009)

| ER | Asset Coverage | Sufficiency |
|---|---|---|
| ER-HY-001 | NONE | NOT_ADDRESSED |
| ER-HY-002 | NONE | NOT_ADDRESSED |
| ER-HY-003 | NONE | NOT_ADDRESSED |
| ER-HY-004 | NONE | NOT_ADDRESSED |
| ER-HY-005 | NONE | NOT_ADDRESSED |
| ER-HY-006 | NONE | NOT_ADDRESSED |
| ER-HY-007 | NONE | NOT_ADDRESSED |
| ER-HY-008 | NONE | NOT_ADDRESSED |
| ER-HY-009 | NONE | NOT_ADDRESSED |

**Finding:** No existing assets exist for any Hyangiram ER. All 9 Hyangiram ERs require collection from scratch.

### Cable Car ERs (ER-CC-001 through ER-CC-005)

| ER | Asset Coverage | Sufficiency | Gap |
|---|---|---|---|
| ER-CC-001 | EI-CC-001-A, EI-CC-001-B, EI-CC-001-C (ASSET-003) | PARTIALLY_SUPPORTED | Official confirmation (yeosucablecar.com) remains inaccessible. Two non-official sources agree on names but cannot replace OFFICIAL_PRIMARY. |
| ER-CC-002 | EI-CC-002-A, EI-CC-002-B (ASSET-005, Hamel→자산 only) | PARTIALLY_SUPPORTED — scope-limited | Full per-station access structure required (Map/Official level). Current evidence covers Hamel→자산 approach only, founder-level. 돌산 side general access not covered. Bus access VERIFY_REQUIRED for both. |
| ER-CC-003 | EI-CC-003-CTX-A (ASSET-001, conflict documentation only) | CONTEXT_ONLY | No field-confirmed vehicle access/parking per station. CONFLICT-F (parking) OPEN. |
| ER-CC-004 | EI-CC-004-CTX-A (ASSET-001, experience pattern only) | PARTIALLY_SUPPORTED — pattern level | Per-station physical child suitability (boarding process, waiting area) not evidenced. WE provides general Crystal Cabin age context only. |
| ER-CC-005 | EI-CC-005-CTX-A (ASSET-001, VERIFY_REQUIRED context) | CONTEXT_ONLY | No formal volatility classification. Official + operational pattern evidence required. |

### Relationship ERs (ER-REL-001 through ER-REL-006)

| ER | Asset Coverage | Sufficiency | Gap |
|---|---|---|---|
| ER-REL-001 | EI-CC-001-A~C (station identity context); EI-CC-RB02-A (one-way option confirmed) | CONTEXT_ONLY | Directional geography (which exit station = which physical location, Cable Car ↔ Odongdo direction) NOT addressed by any existing asset. |
| ER-REL-002 | NONE | NOT_ADDRESSED | Exit station → Odongdo route connection: zero evidence. |
| ER-REL-003 | NONE | NOT_ADDRESSED | Combined time estimate: zero evidence. |
| ER-REL-004 | NONE | NOT_ADDRESSED | Sequence friction: zero evidence. |
| ER-REL-005 | EI-REL-005-CTX-A (Founder philosophy, no directional content) | CONTEXT_ONLY | Direction selection judgment for Cable Car → Odongdo: Founder Philosophy does not address directional geography. |
| ER-REL-006 | NONE | NOT_ADDRESSED | Vehicle impact on direction choice: zero evidence. |

### Context System Requirement

| ER | Status | Note |
|---|---|---|
| ER-CX-001 | SYSTEM_TEST_DEFERRED | Outside evidence collection waves per V0.2 §15. No collection action. |

---

## 6. Gap Register

**Definition:** An ER is in the Gap Register if it cannot advance to VERIFIED_FOR_PREPARATION from existing assets alone. ERs are listed by Wave assignment per V0.2.

### Priority Classification Key
- **FULL GAP:** Zero relevant evidence; collect from scratch
- **PARTIAL GAP:** Some evidence exists; specific gap identified; targeted collection required

---

### Wave 1 ERs (P0 Foundation)

| ER | Priority | Gap Type | Specific Gap |
|---|---|---|---|
| ER-OD-001 | P0 | **CLOSED — VERIFIED_FOR_PREPARATION (Wave 1, 2026-09-27)** | Stop condition EXPERIENCE_PATTERN_SUFFICIENT MET. EI-OD-001-A/B/C/D/E. See: `docs/research/SOUL_YEOSU_ER_OD_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| ER-OD-003 | P0 | FULL GAP | No Odongdo assets exist |
| ER-OD-004 | P0 | **CLOSED — VERIFIED_FOR_PREPARATION (Wave 2, 2026-09-27)** | Stop conditions AUTHORITATIVE_FACT_SUFFICIENT + LIVE_TRIGGER_DESIGN_COMPLETE MET. EI-OD-004-A/B/C/D/E registered. Operator: 여수시도시관리공단; 237 spaces; always paid; camellia season congestion pattern established. See: `docs/research/SOUL_YEOSU_ER_OD_004_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| ER-HY-001 | P0 | **CLOSED — VERIFIED_FOR_PREPARATION (Wave 1, 2026-09-27)** | Stop condition STRUCTURAL_FACT_WITH_WE_CORROBORATION MET. EI-HY-001-A/B/C/D/E. See: `docs/research/SOUL_YEOSU_ER_HY_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| ER-HY-002 | P0 | **CLOSED — VERIFIED_FOR_PREPARATION (Wave 2, 2026-09-27)** | Stop condition EXPERIENCE_PATTERN_SUFFICIENT MET. 4 reused from HY-001-WE + 5 new items (EI-HY-002-A/B/C/D/E). Core burden pattern: steep sustained staircase → breathlessness/sweat; fitness-dependent variation preserved; summer heat multiplier; flat road ascent alternative; mobility-impaired exception. See: `docs/research/SOUL_YEOSU_ER_HY_002_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| ER-HY-006 | P0 | FULL GAP | No Hyangiram assets exist |
| ER-CC-001 | P0 | **CLOSED — VERIFIED_FOR_PREPARATION (Wave 1, 2026-09-27)** | Stop condition AUTHORITATIVE_FACT_SUFFICIENT MET. Reused EI-CC-001-A/B/C (RB-01). New: EI-CC-001-D (yeosucablecar.com OFFICIAL, search-indexed), EI-CC-001-E (디지털여수문화대전 OFFICIAL_PUBLIC), EI-CC-001-F (ko.wikipedia.org SUPPORTING). Official naming: 자산[해야]정류장 / 돌산[놀아]정류장. CONFLICT-CC-001-01 resolved. See: `docs/research/SOUL_YEOSU_ER_CC_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md` |
| ER-REL-001 | P0 | FULL GAP | Directional geography (cable car direction → physical exit location relationship) not addressed by any asset. Station identity (ER-CC-001 partial) is prerequisite context but distinct evidence. |
| ER-REL-002 | P0 | FULL GAP | Exit-to-Odongdo connection not addressed |
| ER-REL-005 | P0 | FULL GAP | Direction selection judgment (cable car direction for Odongdo access) not addressed. Founder preference required. |

### Wave 2 ERs (First-Level Dependents)

| ER | Priority | Gap Type | Specific Gap |
|---|---|---|---|
| ER-OD-002 | P1 | FULL GAP | No Odongdo assets |
| ER-OD-006 | P1 | FULL GAP | No Odongdo assets |
| ER-HY-003 | P1 | FULL GAP | No Hyangiram assets |
| ER-HY-009 | P1 | FULL GAP | No Hyangiram assets |
| ER-CC-002 | P0 | PARTIAL GAP | General per-station access structure (MAP_ROUTE/OFFICIAL level) missing. Existing evidence covers Hamel→자산 side (FOUNDER_LOCAL, one approach direction only). 돌산 side general access not covered. |
| ER-CC-005 | P1 | FULL GAP | Operating volatility classification not established. WE confirms volatility factors exist (weather, wind) but no formal classification from OFFICIAL or LOCAL_OPERATOR source. |

### Wave 3 ERs

| ER | Priority | Gap Type | Specific Gap |
|---|---|---|---|
| ER-OD-005 | P1 | FULL GAP | No Odongdo assets |
| ER-HY-007 | P1 | FULL GAP | No Hyangiram assets |
| ER-HY-008 | P1 | FULL GAP | No Hyangiram assets |
| ER-REL-003 | P1 | FULL GAP | No combined time estimate evidence |
| ER-REL-004 | P1 | FULL GAP | No sequence friction evidence |

### Wave 4a ERs (Independent)

| ER | Priority | Gap Type | Specific Gap |
|---|---|---|---|
| ER-OD-007 | P1 | FULL GAP | No Odongdo assets |
| ER-HY-004 | P1 | FULL GAP | No Hyangiram assets |
| ER-HY-005 | P1 | FULL GAP | No Hyangiram assets |
| ER-CC-004 | P1 | PARTIAL GAP | General child/age context from WE (EI-CC-004-CTX-A). Per-station child suitability (boarding process, waiting area, physical access) not differentiated. Station-specific evidence gap. |
| ER-CC-003 | P0 | FULL GAP | No vehicle access / parking evidence per station. CONFLICT-F OPEN. |
| ER-REL-006 | P1 | FULL GAP | Vehicle impact on direction judgment: zero evidence |

### Wave 4b ERs (Intra-wave gated — see dependency states §7)

| ER | Priority | Gap Type | Specific Gap |
|---|---|---|---|
| ER-HY-008 | P1 | FULL GAP | No Hyangiram assets (also gated by ER-HY-001) |
| ER-REL-003 | P1 | FULL GAP (see Wave 3) | Also gated by ER-REL-001/002 |
| ER-REL-004 | P1 | FULL GAP | Gated by ER-REL-001/002/003 |
| ER-REL-006 | P1 | FULL GAP | Gated by ER-REL-001/002/005 |

### Wave 5 ERs (Supporting Depth)

| ER | Priority | Gap Type | Specific Gap |
|---|---|---|---|
| ER-OD-005 | P1 | FULL GAP (also Wave 3) | No Odongdo assets |
| ER-HY-007 | P1 | FULL GAP | No Hyangiram assets |

### Deferred

| ER | Status |
|---|---|
| ER-CX-001 | SYSTEM_TEST_DEFERRED — outside evidence collection waves |

### Gap Register Summary

| Category | Count |
|---|---|
| FULL GAP | 22 |
| PARTIAL GAP | 3 (ER-CC-001, ER-CC-002, ER-CC-004) |
| CONTEXT_ONLY — not sufficient | 2 (ER-CC-003, ER-CC-005; full gap in practice) |
| NOT_ADDRESSED (zero evidence) | 0 additional (all captured above) |
| VERIFIED_FOR_PREPARATION | 0 |
| SYSTEM_TEST_DEFERRED | 1 (ER-CX-001) |
| **Total ERs assessed** | **29** |

---

### Pre-Wave 1 Asset Survey Flag

The following general knowledge batch files exist in `docs/knowledge/` and were NOT read in Wave 0 (outside RB corpus scope). They MUST be inspected in a pre-Wave 1 asset survey before Wave 1 collection begins. They may contain evidence relevant to OD, HY, or CC ERs that could upgrade Gap Register status:

- `YEOSU_2026_VERIFICATION_BATCH_01.md`
- `YEOSU_2026_VERIFICATION_BATCH_02.md`
- `YEOSU_2026_VERIFICATION_BATCH_03_TRANSPORT.md` (potential ER-CC-002 / ER-REL-002 relevance)
- `YEOSU_2026_VERIFICATION_BATCH_04_ISLAND_ACCESS.md` (potential ER-OD-003 relevance — Odongdo island access)
- `YEOSU_2026_VERIFICATION_BATCH_05_CRUISE.md`
- `YEOSU_2026_VERIFICATION_BATCH_06_RESTAURANT_PILOT.md`
- `YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md`
- `YEOSU_ROUTE_CORPUS_V0_1.md` (potential ER-REL-001/002/003 relevance)
- `YEOSU_TIME_KNOWLEDGE_V0_1.md` (potential time matrix relevance)
- `YEOSU_TRAVEL_TIME_MATRIX_V0_1.md` (potential ER-REL-003 relevance)

**Action required before Wave 1:** Designated reader must inspect these files and report any ER-relevant content to the Wave 0 record. If any file yields PARTIAL or better coverage for any GAP ER, update this Gap Register before Wave 1 begins.

---

## 7. Dependency State Initialization

All 29 ERs initialized with current status per V0.2 lifecycle.

### Odongdo

| ER | Initial Status | Dependency Met? | Note |
|---|---|---|---|
| ER-OD-001 | **VERIFIED_FOR_PREPARATION** | N/A (no deps) | P0; Wave 1 COMPLETE (2026-09-27) |
| ER-OD-002 | NOT_STARTED | Awaits ER-OD-001 | P1; Wave 2 |
| ER-OD-003 | NOT_STARTED | N/A (no deps) | P0; Wave 1 |
| ER-OD-004 | **VERIFIED_FOR_PREPARATION** | N/A (no deps) | P0; Wave 2 COMPLETE (2026-09-27) |
| ER-OD-005 | NOT_STARTED | Awaits ER-OD-001, ER-OD-003 | P1; Wave 3/4a |
| ER-OD-006 | NOT_STARTED | Awaits ER-OD-001 | P1; Wave 2 |
| ER-OD-007 | NOT_STARTED | N/A | P1; Wave 4a |

### Hyangiram

| ER | Initial Status | Dependency Met? | Note |
|---|---|---|---|
| ER-HY-001 | **VERIFIED_FOR_PREPARATION** | N/A (no deps) | P0; Wave 1 COMPLETE (2026-09-27) |
| ER-HY-002 | **VERIFIED_FOR_PREPARATION** | N/A | P0; Wave 2 COMPLETE (2026-09-27) |
| ER-HY-003 | NOT_STARTED | Awaits ER-HY-001 | P1; Wave 2 |
| ER-HY-004 | NOT_STARTED | N/A | P1; Wave 4a |
| ER-HY-005 | NOT_STARTED | N/A | P1; Wave 4a |
| ER-HY-006 | NOT_STARTED | N/A | P0; Wave 1 |
| ER-HY-007 | NOT_STARTED | Awaits ER-HY-001 | P1; Wave 3/5 |
| ER-HY-008 | NOT_STARTED | Awaits ER-HY-001 (Wave 4b gated) | P1; Wave 4b |
| ER-HY-009 | NOT_STARTED | Awaits ER-HY-001 | P1; Wave 2 |

### Cable Car

| ER | Initial Status | Dependency Met? | Note |
|---|---|---|---|
| ER-CC-001 | **VERIFIED_FOR_PREPARATION** | N/A (no deps) | P0; Wave 1 CLOSED 2026-09-27 — AUTHORITATIVE_FACT_SUFFICIENT. Official naming confirmed: 자산[해야]정류장 / 돌산[놀아]정류장. Unlocks CC-002, CC-005, REL-001. |
| ER-CC-002 | NOT_STARTED | **ER-CC-001 VERIFIED ✓** — prerequisite met | P0; Wave 2 — may now proceed |
| ER-CC-003 | NOT_STARTED | Awaits ER-CC-001, ER-CC-002 | P0; Wave 4a |
| ER-CC-004 | NOT_STARTED | Awaits ER-CC-001, ER-CC-002, ER-CC-003 | P1; Wave 4a |
| ER-CC-005 | NOT_STARTED | Awaits ER-CC-001 | P1; Wave 2 |

**BLOCKED-DEPENDENCY trigger assessment:** ER-CC-001 is IN_COLLECTION (not BLOCKED/CONFLICTED/UNKNOWN). Therefore BLOCKED-DEPENDENCY does not propagate to ER-CC-002 at this stage. Per V0.2 §5: BLOCKED-DEPENDENCY triggers only when prerequisite is BLOCKED/CONFLICTED/UNKNOWN.

### Relationship

| ER | Initial Status | Dependency Met? | Note |
|---|---|---|---|
| ER-REL-001 | NOT_STARTED | Awaits ER-CC-001 (IN_COLLECTION, not BLOCKED) | P0; Wave 1 |
| ER-REL-002 | NOT_STARTED | Awaits ER-REL-001, ER-CC-001, ER-OD-003 | P0; Wave 2 (gated) |
| ER-REL-003 | NOT_STARTED | Awaits ER-REL-001, ER-REL-002, ER-OD-002, ER-CC-005 | P1; Wave 3/4b |
| ER-REL-004 | NOT_STARTED | Awaits ER-REL-001, ER-REL-002, ER-REL-003 | P1; Wave 4b |
| ER-REL-005 | NOT_STARTED | Awaits ER-REL-001, ER-REL-002 | P0; Wave 4a |
| ER-REL-006 | NOT_STARTED | Awaits ER-REL-001, ER-REL-002, ER-REL-005, ER-OD-003 | P1; Wave 4b |

### System Test

| ER | Status |
|---|---|
| ER-CX-001 | SYSTEM_TEST_DEFERRED |

---

## 8. Conflict Tracking Register

All existing conflicts from WE and RB assets are inherited here. New conflicts discovered during Waves 1–5 will be appended.

| Conflict ID | Origin Asset | ERs Affected | Description | Resolution Status |
|---|---|---|---|---|
| CONFLICT-A | ASSET-001 (WE §15) | ER-CC-005 (indirectly) | Price conflict — multiple sources disagree on exact fares | OPEN |
| CONFLICT-B | ASSET-001 (WE §15) | None (outside 29 ERs) | Crystal Cabin capacity: 5인 vs 6인 | OPEN |
| CONFLICT-C | ASSET-001 (WE §15) | None | Crystal Cabin count: sources disagree | OPEN |
| CONFLICT-D | ASSET-001 (WE §15) | ER-CC-005 (operating access) | Reservation method: 현장 vs 온라인 conflict | OPEN |
| CONFLICT-E | ASSET-001 (WE §15) | None | Premium ticket price: multiple values | OPEN |
| CONFLICT-F | ASSET-001 (WE §15) | ER-CC-003 | Parking: 무료/유료/시간별 요금 conflict | OPEN — blocks ER-CC-003 |
| CONFLICT-G | ASSET-001 (WE §15) | ER-CC-005 | Ride duration: ~12분 vs ~15분 | OPEN |
| CONFLICT-H | ASSET-001 (WE §15) | ER-CC-005 | Operating start time: conflict | OPEN |

**Escalation trigger check:** CONFLICT-F (parking) is directly material to ER-CC-003 collection. Per V0.2 §16 escalation rules, if CONFLICT-F remains unresolved when ER-CC-003 collection is attempted in Wave 4a, escalation outcome = MORE_EVIDENCE_REQUIRED (resolve parking conflict first).

---

## 9. Reuse Tracking

Documents which evidence items or asset groups are shared dependencies across multiple ERs.

| Evidence Item / Asset | Primary ER | Secondary ERs (reuse context) | Reuse Note |
|---|---|---|---|
| EI-CC-001-A, EI-CC-001-B, EI-CC-001-C | ER-CC-001 | ER-CC-002, ER-CC-003, ER-CC-004, ER-CC-005, ER-REL-001 | Station identity is dependency-level input for all downstream CC and REL ERs |
| EI-CC-002-A, EI-CC-002-B | ER-CC-002 | ER-CC-003, ER-CC-004 (prerequisite chain) | 자산 side access (Hamel approach); reused as partial access evidence |
| EI-CC-RB02-A | NONE | ER-REL-001 (contextual) | One-way option availability informs REL-001 framing |
| EI-CC-004-CTX-A (WE child context) | ER-CC-004 | None | Limited to CC-004; not general enough for reuse |
| EI-CC-005-CTX-A (WE volatility) | ER-CC-005 | ER-REL-001, ER-REL-002, ER-REL-003 (all reference CC-005 as live trigger) | Volatility context informs live trigger design for REL dependencies |

---

## 10. SEMI_STABLE Live Trigger Designs — From V0.2 §17

The following live trigger designs are pre-established for SEMI_STABLE ERs (from V0.2 §17). These are recorded here as infrastructure, not new collection.

| ER | Stability | Trigger Design |
|---|---|---|
| ER-OD-003 | SEMI_STABLE | Stale condition: access policy change. Verification source: OFFICIAL / LOCAL_OPERATOR. Fallback: QUALIFY on access point details. |
| ER-OD-004 | SEMI_STABLE | Stale condition: service hours change. Verification source: OFFICIAL. Fallback: LIVE_VERIFY before use. |
| ER-CC-002 | SEMI_STABLE | Stale condition: route/access disruption (construction, closure). Verification source: OFFICIAL / LOCAL_OPERATOR. Fallback: QUALIFY on specific access route. |
| ER-CC-003 | SEMI_STABLE | Stale condition: current parking availability volatile. Verification source: LIVE (real-time status). Fallback: warn traveler of parking uncertainty. |
| ER-HY-004 | SEMI_STABLE | Stale condition: shuttle route change. Verification source: LOCAL_OPERATOR. Fallback: QUALIFY. |
| ER-HY-005 | SEMI_STABLE | Stale condition: crowd pattern shift (e.g., holiday changes, new attraction). Verification source: WORLD_EXPERIENCE re-check. Fallback: QUALIFY on crowd estimate. |
| ER-HY-007 | SEMI_STABLE | Stale condition: service or operating change. Verification source: OFFICIAL. Fallback: LIVE_VERIFY. Starting points: identified in V0.2. |
| ER-REL-003 | SEMI_STABLE | Stale condition: cable car operating status change; Odongdo access change. Verification source: ER-CC-005 live check + ER-OD-003 check. Fallback: QUALIFY on time estimate. |
| ER-HY-009 | SEMI_STABLE | Stale condition: operating hours or access change. Verification source: OFFICIAL. Fallback: LIVE_VERIFY. |

---

## 11. Wave 0 Exit Conditions Verification

Per V0.2 §15, Wave 0 is PASS when all 6 exit conditions are met.

| # | Exit Condition | Status | Evidence |
|---|---|---|---|
| 1 | Provenance capture mechanism ready (20-field template created and documented) | PASS | §1 of this document |
| 2 | ER-to-Evidence linkage complete (all 29 ERs mapped to existing assets or GAP) | PASS | §5 of this document |
| 3 | Conflict tracking ready (existing conflicts inherited; new conflict procedure defined) | PASS | §8 of this document |
| 4 | Reuse tracking complete (cross-ER asset sharing documented) | PASS | §9 of this document |
| 5 | Dependency state initialized (all 29 ERs have initial collection lifecycle status) | PASS | §7 of this document |
| 6 | Gap Register complete (all gaps identified, classified, and wave-assigned) | PASS | §6 of this document |

**All 6 conditions: PASS**

---

## 12. Wave 1 Scope (Next Action)

Wave 1 collects evidence for P0 ERs with no dependency blockers.

**Eligible Wave 1 ERs (per V0.2 §15 Wave 1 definition):**

| ER | Status | Wave 1 Action |
|---|---|---|
| ER-OD-001 | **VERIFIED_FOR_PREPARATION** | Wave 1 COMPLETE (2026-09-27) — visitor experience profile established. EI-OD-001-A/B/C/D/E registered. |
| ER-OD-003 | NOT_STARTED | Collect from scratch — Odongdo access structure |
| ER-OD-004 | **VERIFIED_FOR_PREPARATION** | Wave 2 COMPLETE (2026-09-27) — parking evidence established. EI-OD-004-A/B/C/D/E registered. |
| ER-HY-001 | **VERIFIED_FOR_PREPARATION** | Wave 1 COMPLETE (2026-09-27) — physical access structure established. EI-HY-001-A/B/C/D/E registered. |
| ER-HY-002 | **VERIFIED_FOR_PREPARATION** | Wave 2 COMPLETE (2026-09-27) — experiential burden pattern established. 4 reused + 5 new EI-HY-002-A/B/C/D/E registered. |
| ER-HY-006 | NOT_STARTED | Collect from scratch — Hyangiram third P0 ER |
| ER-CC-001 | IN_COLLECTION | Gap completion — official site retry; alternate OFFICIAL source; LOCAL_OPERATOR if needed |
| ER-REL-001 | NOT_STARTED | Collect directional geography (which cable car direction → which exit station → what geography) |

**Pre-Wave 1 prerequisite (mandatory before Wave 1 begins):**
Inspect the general knowledge batch files identified in §6 (Pre-Wave 1 Asset Survey Flag). If any batch file yields partial or better coverage for any Wave 1 ER, update this Gap Register before beginning Wave 1 collection. This prevents redundant collection and respects the Diminishing-Return Rule.

**ER-CC-001 gap completion strategy:**
1. Retry yeosucablecar.com (SSL error may be transient)
2. Search for OFFICIAL alternate sources (e.g., Yeosu city tourism official, Korea tourism association)
3. If official primary remains inaccessible: escalation outcome = LOCAL_OPERATOR_REVIEW_REQUIRED per V0.2 §16

**ER-REL-001 collection approach:**
- Primary: MAP_ROUTE source — establish directional geography from map evidence
- Secondary: FOUNDER confirmation of directional geography
- NOT sufficient: WORLD_EXPERIENCE alone (directional geography is STRUCTURAL_FACT requiring MAP_ROUTE or OFFICIAL confirmation)

---

## 13. Wave 0 Verdict

| Item | Value |
|---|---|
| **Wave 0 Verdict** | **WAVE_0_PASS** |
| Provenance mechanism | READY |
| ER linkage | COMPLETE |
| Conflict tracking | READY |
| Reuse tracking | COMPLETE |
| Dependency states | INITIALIZED |
| Gap Register | COMPLETE |
| ERs VERIFIED_FOR_PREPARATION | 0 of 28 (ER-CX-001 deferred) |
| ERs with existing coverage | 5 (ER-CC-001 PARTIAL, ER-CC-002 PARTIAL, ER-CC-004 PATTERN, ER-CC-003/005 CONTEXT_ONLY) |
| ERs fully NOT_ADDRESSED | 23 (all OD + all HY + ER-REL-001~006 minus context items) |
| Wave 1 ready to begin | YES — after pre-Wave 1 batch file survey |

**Wave 0 does not block Wave 1.** Infrastructure is in place. Gap Register is the authoritative input for Wave 1 collection planning.

---

*Wave 0 Artifact V0.1 — 2026-09-27 — Branch: staging/storybook-c7a*
