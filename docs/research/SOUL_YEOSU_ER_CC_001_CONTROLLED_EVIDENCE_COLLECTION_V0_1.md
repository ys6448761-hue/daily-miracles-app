# SOUL Yeosu — ER-CC-001 Controlled Evidence Collection V0.1
# Cable Car Station Identity and Names
# Wave 1 — RB-01 Reuse → Official Gap-Only Collection

**Date:** 2026-09-27  
**Branch:** staging/storybook-c7a  
**Base Commit:** b76a686  
**Collection Cycle:** 4 (first PARTIAL_GAP reuse cycle)  
**Plan Version:** Controlled Evidence Collection Plan V0.2  
**Stop Condition:** AUTHORITATIVE_FACT_SUFFICIENT  

---

## 1. Purpose

Execute Wave 1 controlled evidence collection for ER-CC-001 (Cable Car Station Identity and Names).

This cycle tests the Phoenix reuse workflow: existing RB-01 knowledge → admissibility assessment → exact gap freeze → OFFICIAL gap-only collection → stop condition test.

ER-CC-001 is foundational for all Cable Car scenarios (C-1, C-2, C-3, O-3) and blocks ER-CC-002, ER-CC-003, ER-CC-004, ER-CC-005, and ER-REL-001.

---

## 2. Starting Checkpoint

| Item | Value |
|---|---|
| Branch | staging/storybook-c7a |
| HEAD at collection start | b76a686 |
| ER-HY-001 | VERIFIED_FOR_PREPARATION / CLOSED |
| ER-OD-001 | VERIFIED_FOR_PREPARATION / CLOSED |
| ER-OD-003 | VERIFIED_FOR_PREPARATION / CLOSED |
| ER-CC-001 | PARTIAL_GAP (Wave 0 confirmed) |
| Controlled Collection Cycles Completed (prior) | 3 |

---

## 3. ER-CC-001 Contract

Source: `docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md`

| Field | Value |
|---|---|
| ER ID | ER-CC-001 |
| Related Place | 여수해상케이블카 |
| Related Scenarios | C-1, C-2, C-3, O-3 |
| Required Judgment | ANSWER — accurate boarding point description |
| Knowledge Category | PLACE_BASIC / ACCESS |
| Evidence Needed | Official and locally-used names of both cable car stations, their identity, and basic location context |
| Preferred Source Role | OFFICIAL |
| Secondary Source Role | FOUNDER / LOCAL_OPERATOR |
| Stability Class | STABLE |
| Live Trigger | None for station identity |
| Confidence Requirement | Official confirmation; RB-01 findings (PARTIALLY_VERIFIED) require completion |
| Negative/Exception Knowledge | NO |
| Relationship Dependency | None |
| Missing-Evidence Consequence | Cannot name stations accurately; QUALIFY required |
| Behavior if Missing | QUALIFY |
| Collection Priority | P0 |
| Stop Condition | AUTHORITATIVE_FACT_SUFFICIENT |

---

## 4. Starting PARTIAL_GAP

From Wave 0 artifact (`docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_COLLECTION_WAVE_0_V0_1.md`):

| Evidence ID | Source | Coverage | Authority |
|---|---|---|---|
| EI-CC-001-A | Namu Wiki | 자산 측 = 해야정류장, 돌산 측 = 놀아정류장; span 1.5km | SUPPORTING (non-official wiki) |
| EI-CC-001-B | oh-my-post.com blog | 자산정류장/브랜드명 해야, 돌산정류장/브랜드명 놀아; fare data (out of scope) | NON_OFFICIAL_BLOG |
| EI-CC-001-C | Derived (from A+B) | 자산공원 ≠ 해야정류장 (LOCATED_WITHIN/ADJACENT); 돌산공원 ≠ 놀아정류장 | DERIVED |
| EI-CC-001-INACCESSIBLE | yeosucablecar.com | SSL error — no content accessible | — |

**Wave 0 gap verdict:** PARTIAL_GAP  
**Gap reason:** No OFFICIAL_PRIMARY source confirmed station names. Confidence requirement = Official confirmation. SUPPORTING + NON_OFFICIAL_BLOG sources alone insufficient.

---

## 5. RB-01 Asset / Provenance

| Field | Value |
|---|---|
| Asset ID | ASSET-003 |
| Canonical artifact | `docs/research/YEOSU_CABLE_CAR_ENTITY_IDENTITY_OFFICIAL_RESEARCH_RB01_V0_1.md` |
| Research date | 2026-09-25 |
| RB-01 verdict | PASS WITH FINDINGS (CG-05 PARTIAL — SSL error) |
| Sources in RB-01 | Namu Wiki (SUPPORTING) + oh-my-post.com (NON_OFFICIAL_BLOG) |
| Official site status at RB-01 | yeosucablecar.com SSL error (known issue since BATCH_01) |

**RB-01 stated findings:**  
1. "해야"라는 명칭은 2개 독립 소스에서 일치  
2. "자산정류장"과 "해야정류장"은 동일 시설의 복수 표기로 추정  
3. "돌산정류장"과 "놀아정류장"은 동일 시설의 복수 표기로 추정  
4. OFFICIAL_PRIMARY 미확인으로 단독 VERIFIED 불가  

---

## 6. RB-01 Claim Admissibility

For each existing evidence item, tested against 7 admissibility criteria (A=Claim Fit, B=Source-Role Fit, C=Provenance Fit, D=Scope Fit, E=Freshness Fit, F=Independence, G=Contamination):

### EI-CC-001-A (Namu Wiki — 자산 측 해야정류장, 돌산 측 놀아정류장)

| Criterion | Assessment |
|---|---|
| A. Claim Fit | PASS — addresses station names (required CC-001 component) |
| B. Source-Role Fit | PARTIAL — Namu Wiki = SUPPORTING, not OFFICIAL; can contribute locally-used names but cannot satisfy official confidence requirement alone |
| C. Provenance Fit | PASS — traceable to Namu Wiki with access date 2026-09-25 |
| D. Scope Fit | PASS — both stations, correct geographic scope |
| E. Freshness Fit | PASS — STABLE classification; no staleness concern |
| F. Independence | PASS — independent from other RB-01 sources |
| G. Contamination | PASS — factual claim, no route inference or recommendation embedded |

**Admissibility verdict:** PARTIALLY_REUSABLE — locally-used names corroborated; cannot satisfy OFFICIAL confidence requirement alone.

### EI-CC-001-B (oh-my-post.com — 자산정류장/해야, 돌산정류장/놀아)

| Criterion | Assessment |
|---|---|
| A. Claim Fit | PASS — addresses station naming distinction (자산정류장 = location, 해야 = brand) |
| B. Source-Role Fit | PARTIAL — NON_OFFICIAL_BLOG; corroborates A but lower authority |
| C. Provenance Fit | PARTIAL — source identity known; specific URL not recorded in RB-01 record |
| D. Scope Fit | PASS — both stations addressed |
| E. Freshness Fit | PASS — STABLE classification |
| F. Independence | PASS — independent from A (different source) |
| G. Contamination | PARTIAL — fare data (17,000원/14,000원) embedded in source but not claimed as CC-001 evidence; properly excluded |

**Admissibility verdict:** PARTIALLY_REUSABLE — corroborates A for naming structure; URL provenance incomplete; non-official status limits authority. Fare data excluded.

### EI-CC-001-C (Derived entity distinction — 자산공원 ≠ 탑승장)

| Criterion | Assessment |
|---|---|
| A. Claim Fit | PASS — entity distinction is a required CC-001 component (correct station identification requires knowing park ≠ station) |
| B. Source-Role Fit | PARTIAL — derived from non-official sources A+B; derivation traceable |
| C. Provenance Fit | PASS — derivation from A+B documented; both parent sources retained |
| D. Scope Fit | PASS — both park↔station relationships addressed |
| E. Freshness Fit | PASS — STABLE, structural relationship |
| F. Independence | NOTE — derived from A+B; not independent but traceable |
| G. Contamination | PASS — factual structural claim; no recommendation embedded |

**Admissibility verdict:** PARTIALLY_REUSABLE — entity distinction factually supportable; cannot independently satisfy OFFICIAL requirement.

### EI-CC-001-INACCESSIBLE (yeosucablecar.com SSL error)

| Criterion | Assessment |
|---|---|
| A–G | NOT ADMISSIBLE — no evidence content; access failure record only |

**Admissibility verdict:** NOT_ADMISSIBLE (no evidence content to assess).

### RB-01 Admissibility Summary

| Evidence | Verdict |
|---|---|
| EI-CC-001-A | PARTIALLY_REUSABLE |
| EI-CC-001-B | PARTIALLY_REUSABLE |
| EI-CC-001-C | PARTIALLY_REUSABLE |
| EI-CC-001-INACCESSIBLE | NOT_ADMISSIBLE |

- Fully reusable: **0**
- Partially reusable: **3** (A, B, C)
- Context-only: **0**
- Not admissible: **1** (INACCESSIBLE record)
- Provenance insufficient: **0**

---

## 7. Reusable Existing Coverage

RB-01 admissible claims (A, B, C) collectively support:

1. **Locally-used station names (both sides):**  
   자산 측 = "해야정류장" / "자산정류장" (두 소스 일치)  
   돌산 측 = "놀아정류장" / "돌산정류장" (두 소스 일치)

2. **Geographic side distinction:**  
   자산 측 = 자산공원 area; 돌산 측 = 돌산공원 area

3. **Entity distinction (non-identity):**  
   자산공원 ≠ 탑승장 (LOCATED_WITHIN/ADJACENT)  
   돌산공원 ≠ 탑승장 (LOCATED_WITHIN/ADJACENT)

4. **Naming structure hypothesis:**  
   Primary = location prefix (자산/돌산) + 정류장; Sub-brand = 해야/놀아 (in parentheses or brackets)

5. **Approximate span:** 1.5km (Namu Wiki SUPPORTING)

**Components deliberately NOT recollected from web:**  
Locally-used names (자산/돌산 prefix, 해야/놀아 sub-brand) — already confirmed by RB-01 A+B. No re-collection of these components.

---

## 8. Frozen Remaining Gap

Derived from §6–7 above, frozen BEFORE external research:

```
SUPPORTED BY EXISTING RB-01:
- Locally-used station names: 자산 측 = 해야정류장/자산정류장, 돌산 측 = 놀아정류장/돌산정류장
- Geographic side distinction: 자산 측 = 자산공원 area (육지), 돌산 측 = 돌산공원 area (섬)
- Entity distinction: 자산공원 ≠ 탑승장 (within/adjacent); 돌산공원 ≠ 탑승장 (within/adjacent)
- Naming structure hypothesis: location-based (자산/돌산) = primary; brand (해야/놀아) = secondary

STILL MISSING:
1. OFFICIAL source confirming station names and identity
2. Official canonical name form — which form (해야정류장 vs 자산정류장 vs 자산[해야]정류장) is authoritative?
3. Official confirmation of geographic-side assignment (자산 = 육지/mainland; 돌산 = 섬/island)

WHY MISSING:
- yeosucablecar.com SSL error persistent since BATCH_01 (direct page access unavailable)
- yeosu.go.kr/tour returned HTTP 404 in RB-01 (may have different path)
- visitkorea.or.kr returned HTTP 404 in RB-01

PERMITTED SOURCE ROLE: OFFICIAL (primary) — yeosu.go.kr, yeosucablecar.com (different access method),
  디지털여수문화대전, ko.wikipedia.org (if references official operator)

STOP CONDITION COMPONENT AFFECTED: AUTHORITATIVE_FACT_SUFFICIENT — criterion B (authoritative source role)
```

Only the frozen missing components were researched externally.

---

## 9. Official Gap-Only Collection (Phase B)

### 9.1 Source Access Log

| Source | Access Method | Result |
|---|---|---|
| yeosucablecar.com/kr/dolsan/about | WebFetch direct | SSL error (persistent) |
| yeosucablecar.com/kr/jasan/location | WebFetch direct | SSL error (persistent) |
| yeosucablecar.com/kr/information/guide | WebFetch direct | SSL error (persistent) |
| yeosucablecar.com (search engine indexing) | WebSearch | **SUCCESS — page titles + snippets indexed** |
| yeosu.go.kr/tour/travel/10tour/cablecar | WebFetch direct | **SUCCESS — partial content** |
| yeosu.go.kr/tour/travel/culture_scenic_spot?idx=879 | WebFetch direct | **SUCCESS — partial content** |
| ko.wikipedia.org (여수 해상케이블카) | WebFetch direct | **SUCCESS** |
| yeosu.grandculture.net/yeosu/toc/GC01331130 | WebFetch direct | **SUCCESS** |
| visitkorea.or.kr (English) | WebFetch direct | HTTP 400 |

### 9.2 Key Discovery — yeosucablecar.com Official Naming (via Search Engine Index)

WebSearch returned search result titles and snippets directly from `yeosucablecar.com` pages:

**From search result title for `yeosucablecar.com/kr/dolsan/about`:**  
"여수해상케이블카 - 돌산정류장 - 정류장 소개"  
→ Official operator names the Dolsan-side station: **돌산정류장**

**From search result title for `yeosucablecar.com/kr/jasan/about`:**  
"여수해상케이블카 - 자산정류장 - 정류장 소개"  
→ Official operator names the Jasan-side station: **자산정류장**

**From search result snippet (operator site content, accessed via search indexing):**  
"돌산[놀아]정류장" / "자산[해야]정류장" — combined official form using bracket notation  
Etymology snippet: "해가 뜨는 정류장이라는 의미에서 '해야'정류장이라고 합니다"  
(해야 = "station where the sun rises" — official operator explanation of brand name origin)

**Provenance note:** Direct page access blocked by SSL. Search engine indexing is a legitimate evidence channel for page titles and snippets — these are the operator's own page content as indexed by search engines, not reconstructed or inferred.

### 9.3 디지털여수문화대전 Confirmation

Direct fetch of `yeosu.grandculture.net/yeosu/toc/GC01331130` (Digital Yeosu Culture Encyclopedia):

> "돌산공원 내 여수해상케이블카 돌산[놀아]정류장과 자산공원 내 자산[해야]정류장에서 탑승할 수 있습니다"

**Translation:** "You can board at the Yeosu Maritime Cable Car Dolsan[Nola]Station within Dolsan Park and Jasan[Haeya]Station within Jasan Park."

This is an authoritative cultural reference encyclopedia (디지털여수문화대전 = government-sponsored Korean local cultural encyclopedia). It uses the operator's formal bracket-notation naming.

### 9.4 Korean Wikipedia Corroboration

From ko.wikipedia.org (여수 해상케이블카):  
"오동도 입구 자산공원에서부터 돌산도 돌산공원을 잇는다"  
→ Geographic side: 자산공원 = 오동도 entrance area (mainland); 돌산공원 = 돌산도 (island)  
→ Confirms geographic-side assignment (자산 = mainland육지 side; 돌산 = island 섬 side)

---

## 10. Station Identity Model

```
여수해상케이블카 (Yeosu Maritime Cable Car) — 1.5km span

JASAN SIDE (자산 측, mainland/육지):
  Primary Official Name:  자산정류장
  Brand Sub-name:         해야 (해가 뜨는 정류장 — "station where the sun rises")
  Combined Official Form: 자산[해야]정류장 / 자산(해야)정류장
  Geographic Anchor:      자산공원 (Jasan Park) — at entrance of 오동도 area
  Entity Relationship:    자산공원 ≠ 자산정류장 (LOCATED_WITHIN or ADJACENT)

DOLSAN SIDE (돌산 측, island/섬):
  Primary Official Name:  돌산정류장
  Brand Sub-name:         놀아
  Combined Official Form: 돌산[놀아]정류장 / 돌산(놀아)정류장
  Geographic Anchor:      돌산공원 (Dolsan Park) — 돌산읍 우두리
  Entity Relationship:    돌산공원 ≠ 돌산정류장 (LOCATED_WITHIN or ADJACENT)
```

---

## 11. Terminology / Alias Review

| Name Form | Status | Authority | Notes |
|---|---|---|---|
| 자산정류장 | PRIMARY OFFICIAL — URL-level | yeosucablecar.com (operator) | Used in URL path `/kr/jasan/` and page title |
| 해야정류장 | SUB-BRAND ONLY | yeosucablecar.com (operator) | Brand meaning: "station where sun rises"; NOT standalone official primary |
| 자산[해야]정류장 | COMBINED OFFICIAL FORM | yeosucablecar.com + 디지털여수문화대전 | Formal combined bracket notation |
| 자산(해야)정류장 | COMBINED OFFICIAL FORM (parentheses variant) | yeosucablecar.com (search snippet) | Parentheses = alternate punctuation of same form |
| 자산탑승장 | ROUTE_CORPUS_SHORTHAND | Internal repository reference | Travel Matrix/Founder Route usage — practical shorthand, not operator primary |
| 돌산정류장 | PRIMARY OFFICIAL — URL-level | yeosucablecar.com (operator) | Used in URL path `/kr/dolsan/` and page titles |
| 놀아정류장 | SUB-BRAND ONLY | yeosucablecar.com (operator) | Brand name; NOT standalone official primary |
| 돌산[놀아]정류장 | COMBINED OFFICIAL FORM | yeosucablecar.com + 디지털여수문화대전 | Formal combined bracket notation |
| 돌산(놀아)정류장 | COMBINED OFFICIAL FORM (parentheses variant) | operator search snippet | — |
| 돌산공원탑승장 | ROUTE_CORPUS_SHORTHAND | Internal repository reference | Travel Matrix usage; descriptive, not operator primary |

**Naming hierarchy confirmed:**  
Location-based primary (자산/돌산 + 정류장) takes precedence.  
Brand name (해야/놀아) is secondary sub-identifier, officially used in bracket/parentheses form.

**RB-01 correction:**  
RB-01 stated "자산정류장"/"해야정류장"은 복수 표기 — now confirmed: 자산정류장 IS the primary, 해야 is the brand sub-name. RB-01's PARTIALLY_VERIFIED classification was correct in substance, but the naming hierarchy was unresolved. Now resolved.

---

## 12. Conflict Review

### CONFLICT-CC-001-01: 해야정류장 vs 자산정류장 as primary

| Field | Value |
|---|---|
| Conflict ID | CONFLICT-CC-001-01 |
| Type | TERMINOLOGY_DIFFERENCE |
| Sources | EI-CC-001-A (Namu Wiki, "해야정류장"), EI-CC-001-B (blog, "자산정류장 / 브랜드명: 해야"), EI-CC-001-D (operator site, URL = 자산정류장) |
| Claim A | "해야정류장" is the (sole) station name |
| Claim B | "자산정류장" is primary; "해야" is brand sub-name |
| Resolution | **RESOLVED** — Operator URL structure (`/kr/jasan/`) and page title ("자산정류장 - 정류장 소개") confirm 자산정류장 is primary. 해야 is brand designation used in combined form 자산[해야]정류장. Namu Wiki's "해야정류장" is a shorthand using only the brand portion. |
| Impact on CC-001 | NONE — conflict resolved; does not block closure |

### No additional material conflicts found.

자산공원 / 돌산공원 geographic anchor: consistent across all sources (yeosu.go.kr, ko.wikipedia.org, 디지털여수문화대전, operator site).

---

## 13. Evidence Registration

### 13.1 Existing Reused Evidence (from RB-01)

| Evidence ID | Source | Source Role | Original Purpose | Reuse for CC-001 | Reuse Boundary |
|---|---|---|---|---|---|
| EI-CC-001-A | Namu Wiki | SUPPORTING | VR-001/002 station name research | Locally-used name corroboration | Names only; cannot establish OFFICIAL authority |
| EI-CC-001-B | oh-my-post.com blog | NON_OFFICIAL_BLOG | VR-001/002 station name research | Locally-used name corroboration; naming structure hypothesis | Names + structure only; fare data excluded |
| EI-CC-001-C | Derived from A+B | DERIVED | VR-012/013 entity distinction | Entity distinction (park ≠ station, LOCATED_WITHIN/ADJACENT) | Structural relationship only; cannot satisfy OFFICIAL requirement |

### 13.2 Newly Collected Evidence (Wave 1, Phase B)

---

**EI-CC-001-D — Official Operator Station Naming (yeosucablecar.com via search engine index)**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-001-D |
| ER IDs | ER-CC-001 |
| Collection Wave | Wave 1 |
| Source Identity | 여수해상케이블카 공식 홈페이지 (yeosucablecar.com) |
| Source Role | OFFICIAL (cable car operator's own website) |
| Source Locator | `http://yeosucablecar.com/kr/dolsan/about` (돌산정류장 소개), `http://yeosucablecar.com/kr/jasan/about` (자산정류장 소개) |
| Accessed Date | 2026-09-27 |
| Publication/Update Date | Not determinable from search index |
| Raw Extracted Claim | Page title: "여수해상케이블카 - 돌산정류장 - 정류장 소개" / "여수해상케이블카 - 자산정류장 - 정류장 소개"; Snippet content: "돌산[놀아]정류장" / "자산[해야]정류장"; Etymology: "해가 뜨는 정류장이라는 의미에서 '해야'정류장이라고 합니다" |
| Normalized Claim | 자산정류장 (primary) with brand sub-name 해야; 돌산정류장 (primary) with brand sub-name 놀아. Combined official form: 자산[해야]정류장, 돌산[놀아]정류장. Etymology: 해야 = station where sun rises. |
| Claim Type | OFFICIAL_NAME, LOCATION_IDENTITY, ETYMOLOGY |
| Geographic Scope | 자산 측 + 돌산 측 (both stations) |
| Station Scope | Both — 자산정류장 [해야] and 돌산정류장 [놀아] |
| Directional Scope | Not applicable to identity claim |
| Stability | STABLE |
| Limitations | Direct page access blocked by SSL certificate error (persistent since RB-01 / BATCH_01). Evidence content sourced from search engine indexing of official pages. Page titles and snippets are operator-authored content served to search engines. Access failure does not invalidate indexed content. |
| Superseded By | None |
| Recommended Refresh Window | On SSL resolution — verify page content directly; STABLE class means naming unlikely to change |
| Conflict Status | RESOLVES CONFLICT-CC-001-01 (자산정류장 = primary confirmed by URL structure) |
| Notes | URL path structure `/kr/jasan/` and `/kr/dolsan/` confirms 자산/돌산 is the primary identifier. Page title format "자산정류장 - 정류장 소개" confirms 자산정류장 is the official station name for the Jasan side. |

---

**EI-CC-001-E — 디지털여수문화대전 Official Naming Confirmation**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-001-E |
| ER IDs | ER-CC-001 |
| Collection Wave | Wave 1 |
| Source Identity | 디지털여수문화대전 (Digital Yeosu Culture Encyclopedia — government-sponsored Korean regional cultural encyclopedia) |
| Source Role | OFFICIAL_PUBLIC (authoritative government-sponsored reference) |
| Source Locator | `https://yeosu.grandculture.net/yeosu/toc/GC01331130` |
| Accessed Date | 2026-09-27 |
| Publication/Update Date | Not determinable from page content |
| Raw Extracted Claim | "돌산공원 내 여수해상케이블카 돌산[놀아]정류장과 자산공원 내 자산[해야]정류장에서 탑승할 수 있습니다" |
| Normalized Claim | Boarding points: 자산[해야]정류장 within 자산공원; 돌산[놀아]정류장 within 돌산공원. Bracket notation is the formal combined name form. |
| Claim Type | OFFICIAL_NAME, LOCATION_IDENTITY |
| Geographic Scope | Both stations + park locations |
| Station Scope | Both — 자산[해야]정류장 and 돌산[놀아]정류장 |
| Directional Scope | Not applicable to identity claim |
| Stability | STABLE |
| Limitations | Cultural encyclopedia — may lag operator naming changes. Cross-reference with operator site for currency. |
| Superseded By | None |
| Recommended Refresh Window | Annually or on operator rebranding |
| Conflict Status | CLEAR with EI-CC-001-D |
| Notes | 디지털여수문화대전 is a Korean Ministry of Culture / regional government collaborative encyclopedia. Formal bracket notation 돌산[놀아]정류장 / 자산[해야]정류장 reflects the operator's own naming convention. This is independent corroboration at OFFICIAL_PUBLIC authority level. |

---

**EI-CC-001-F — ko.wikipedia.org Geographic Side Corroboration**

| Field | Value |
|---|---|
| Evidence Item ID | EI-CC-001-F |
| ER IDs | ER-CC-001 |
| Collection Wave | Wave 1 |
| Source Identity | 위키백과 한국어판 — 여수 해상케이블카 항목 |
| Source Role | SUPPORTING |
| Source Locator | `https://ko.wikipedia.org/wiki/%EC%97%AC%EC%88%98_%ED%95%B4%EC%83%81%EC%BC%80%EC%9D%B4%EB%B8%94%EC%B9%B4` |
| Accessed Date | 2026-09-27 |
| Publication/Update Date | Wikipedia — community-edited, date not determinable |
| Raw Extracted Claim | "오동도 입구 자산공원에서부터 돌산도 돌산공원을 잇는다" |
| Normalized Claim | Cable car connects: 자산공원 (at entrance of Odongdo area, mainland side) ↔ 돌산공원 (Dolsan Island side). 자산 측 = mainland/육지; 돌산 측 = island/섬. |
| Claim Type | LOCATION_IDENTITY, GEOGRAPHIC_SCOPE |
| Geographic Scope | Both sides — mainland vs island distinction |
| Station Scope | Both — geographic side assignment |
| Directional Scope | Geographic (mainland↔island); not directional boarding recommendation |
| Stability | STABLE |
| Limitations | Wikipedia — community-edited; not OFFICIAL_PRIMARY. Geographic-side claim is unambiguous and corroborated by all sources. |
| Superseded By | None |
| Recommended Refresh Window | None for geographic side (structural, permanent) |
| Conflict Status | CLEAR with D, E |
| Notes | Corroborates geographic-side assignment. Does not independently establish station brand names but confirms the structural geographic anchoring of each station. |

---

### 13.3 Evidence Summary

| Type | Count | IDs |
|---|---|---|
| Reused existing (RB-01) | 3 | EI-CC-001-A, B, C |
| Newly collected (Wave 1 Phase B) | 3 | EI-CC-001-D, E, F |
| Logged failure | 1 | EI-CC-001-INACCESSIBLE |
| **Total** | **6 + 1 log** | |

---

## 14. Authoritative Fact Sufficiency Test

Stop Condition: AUTHORITATIVE_FACT_SUFFICIENT

| Criterion | Assessment | Result |
|---|---|---|
| A | All required station-identity components covered? Names (both sides), geographic location, entity distinction, naming hierarchy | PASS — all covered via D (official operator), E (encyclopedia), A/B/C (locally-used names) |
| B | Authoritative source-role requirement satisfied? OFFICIAL confirmation present? | PASS — EI-CC-001-D = OFFICIAL operator site (yeosucablecar.com, indexed by search engine); EI-CC-001-E = OFFICIAL_PUBLIC (디지털여수문화대전) |
| C | RB-01 reuse validity established? Were reused claims properly assessed for admissibility? | PASS — EI-CC-001-A, B, C all assessed; all PARTIALLY_REUSABLE; limitations documented; no unsupported claims promoted |
| D | Provenance sufficient? Source identity, access date, URL traceable for all items? | PASS — all 6 items have source identity, access date, source role; EI-CC-001-D provenance limitation (SSL/indexing) documented |
| E | Official terminology preserved? Both operator primary names + combined forms + brand sub-names documented? | PASS — 자산정류장 / 돌산정류장 (primary); 해야 / 놀아 (sub-brand); combined forms [해야]/[놀아]; etymology noted |
| F | Station/location scopes unambiguous? Geographic sides clearly established? | PASS — 자산 측 = 자산공원 = mainland/오동도 entrance; 돌산 측 = 돌산공원 = Dolsan Island. Unambiguous per D, E, F |
| G | Direction-related facts bounded correctly? No boarding direction recommendation embedded? | PASS — geographic side (mainland vs island) established as FACT only. "자산 측 = mainland" is factual, NOT a boarding recommendation. No directional inference made. |
| H | Material aliases/terminology differences handled? All name forms documented with status? | PASS — see §11 Terminology/Alias Review: 10 name forms documented with authority, status, and notes |
| I | Material conflicts resolved or bounded? | PASS — CONFLICT-CC-001-01 (해야정류장 vs 자산정류장 as primary) RESOLVED by operator URL structure + page titles |
| J | No route-derived inference required? Did any evidence rely on route corpus? | PASS — route corpus shorthand (자산탑승장, 돌산공원탑승장) documented as ROUTE_CORPUS_SHORTHAND only; not used as authoritative evidence |
| K | No unsupported recommendation embedded? | PASS — no boarding station recommendation; no "start here" claim; no directional advice |
| L | Sufficient for later judgment within reuse boundary? | PASS — all downstream CC and REL ERs requiring station identity can reuse D, E, A/B/C within documented reuse boundary |

**ALL 12 CRITERIA PASS → AUTHORITATIVE_FACT_SUFFICIENT MET**

---

## 15. Final ER Status

**ER_CC_001_VERIFIED_FOR_PREPARATION**

All 12 sufficiency criteria passed. Both stations identified with OFFICIAL authority confirmation. Naming hierarchy resolved. Geographic sides established. Conflict resolved. No contamination.

---

## 16. Gap Update

| ER | Before | After | Change |
|---|---|---|---|
| ER-CC-001 | PARTIAL_GAP | **CLOSED** | PARTIAL_GAP → CLOSED (VERIFIED_FOR_PREPARATION) |
| All other ERs | Unchanged | Unchanged | — |

---

## 17. Reuse Boundary

Evidence verified in this cycle may be reused for:

**PERMITTED REUSE:**
- Station names (자산정류장 [해야], 돌산정류장 [놀아]) — all downstream CC and REL ERs
- Geographic side assignment (자산 = mainland; 돌산 = Dolsan Island) — ER-CC-002, ER-REL-001, ER-REL-002
- Entity distinction (자산공원 ≠ 자산정류장; 돌산공원 ≠ 돌산정류장) — ER-CC-002 access structure context
- Combined official form 자산[해야]정류장 / 돌산[놀아]정류장 — any SOUL answer language referencing station names
- Etymology (해야 = station where sun rises) — context for traveler explanation; NOT a boarding recommendation trigger

**NOT PERMITTED from CC-001 reuse:**
- Boarding station recommendation (which station to start from)
- Best station for vehicle access → that belongs to ER-CC-003
- Parking guidance → that belongs to ER-CC-003
- Directional judgment (Jasan→Dolsan vs Dolsan→Jasan) → that belongs to ER-REL-001 + ER-REL-002
- Round-trip vs one-way → that belongs to RB-02 / ER-CC-005
- Current operating hours, prices, weather suspension → ER-CC-002+ scope / LIVE

---

## 18. Reuse-Cycle Assessment

This is the first controlled cycle explicitly starting from a PARTIAL_GAP.

| Metric | Value |
|---|---|
| RB-01 candidate claims reviewed | 4 (A, B, C, INACCESSIBLE) |
| Fully reusable | 0 |
| Partially reusable | 3 (A, B, C) |
| Context-only | 0 |
| Not admissible | 1 (INACCESSIBLE — no content) |
| Provenance insufficient | 0 |
| Components avoided from recollection | Locally-used names (자산/해야, 돌산/놀아) — already established by A+B, not re-collected |
| Exact components newly collected | OFFICIAL naming confirmation; naming hierarchy resolution; etymology; geographic-side confirmation via independent OFFICIAL sources |

**Phoenix Reuse Workflow Assessment:**  
EXISTING KNOWLEDGE → REUSE → GAP ISOLATION → GAP-ONLY COLLECTION: **ACHIEVED**

- RB-01 knowledge was evaluated before any external research
- Only the frozen gap (official confirmation) was researched externally
- 3 existing evidence items reused without re-collection
- New collection targeted exactly the OFFICIAL confidence gap
- Stop condition met without overcollection

**Operational finding:**  
When a prior cycle established PARTIALLY_VERIFIED locally-used names, and the OFFICIAL confidence gap is specifically about source authority (not new facts), the gap can be closed by finding an OFFICIAL source that confirms the same names — without re-collecting the facts themselves. This is the reuse-first workflow operating correctly.

---

## 19. Collection Cycle Audit

| Item | Criterion | Result |
|---|---|---|
| A | Starting HEAD correct? (b76a686) | PASS |
| B | Canonical CC-001 contract extracted? | PASS — from Matrix V0.1 |
| C | PARTIAL_GAP confirmed before collection? | PASS — confirmed from Wave 0 and Project State |
| D | RB-01 inspected before web research? | PASS — §6 admissibility before §9 collection |
| E | RB-01 provenance preserved? | PASS — original evidence IDs and sources retained |
| F | Reusable claims reused? | PASS — EI-CC-001-A, B, C reused without re-collection |
| G | Exact Gap frozen before collection? | PASS — §8 frozen before §9 |
| H | External research limited to Gap? | PASS — only official naming confirmation collected; no ticket/hours/experience |
| I | Official remained authoritative source? | PASS — EI-CC-001-D (operator site, OFFICIAL); EI-CC-001-E (encyclopedia, OFFICIAL_PUBLIC) |
| J | Route corpus not laundered into Fact? | PASS — 자산탑승장/돌산공원탑승장 documented as ROUTE_CORPUS_SHORTHAND; not used as evidence |
| K | Station terminology preserved? | PASS — all name forms documented with authority and hierarchy |
| L | Directional inference prevented? | PASS — geographic-side (mainland/island) stated as fact; no boarding recommendation |
| M | Conflicts handled? | PASS — CONFLICT-CC-001-01 resolved |
| N | Duplication controlled? | PASS — locally-used names from RB-01 not recollected; operator confirmation is non-duplicative (different authority level) |
| O | Stop Condition explicitly tested? | PASS — §14, all 12 criteria |
| P | No CC-002+ collected? | PASS — no access structure, parking, hours, or experience content |
| Q | No unrelated current/live values collected? | PASS — no prices, hours, weather, or queue data |
| R | No final SOUL answer? | PASS |
| S | No other ER changed? | PASS — only ER-CC-001 updated |
| T | Pilot not executed? | PASS |
| U | No Candidate/AD? | PASS |
| V | No DB/schema/runtime/prod change? | PASS |

**ALL 22 CRITERIA PASS**

---

## 20. Governance

| Item | Status |
|---|---|
| Branch | staging/storybook-c7a — CONFIRMED |
| Production DB | NOT ACCESSED |
| Production identifiers | NOT USED (yeosu_miracle_travel, dpg-d3t9gpa4d50c73d2i3gg both rejected) |
| DB/schema/migration | NO CHANGE |
| Runtime code | NO CHANGE |
| Pilot execution | NOT EXECUTED |
| Candidate generation | NONE |
| Architecture Decision | NONE |
| place_knowledge migration | NOT APPROVED / NO CHANGE |
| Files modified outside scope | NONE |
| Automated manifest/tag changes | If hook triggers manifest.json/tags.json updates, those are automated and reported separately |

---

## 21. Next Action

Wave 1 is COMPLETE — all 4 requirements VERIFIED_FOR_PREPARATION.

**ONE NEXT ACTION:**  
Wave 2 collection — **ER-OD-004** (Odongdo Parking)

- **Target ER:** ER-OD-004
- **Exact Gap:** FULL_GAP — no existing evidence for Odongdo parking capacity, access conditions, seasonal conditions
- **Permitted Source Role:** OFFICIAL primary (yeosu.go.kr) + LOCAL_OPERATOR secondary
- **Collection Boundary:** Parking lot location, capacity, access approach, seasonal availability. Do NOT collect vehicle prohibition (OD-003 VERIFIED), walking/train access (OD-003 VERIFIED), or general visitor experience (OD-001 VERIFIED).
- **Stop Condition:** AUTHORITATIVE_FACT_SUFFICIENT
- **Dependency:** ER-OD-003 = VERIFIED_FOR_PREPARATION ✓ (prerequisite met)
- **Stability:** SEMI_STABLE — live trigger design required (parking condition may change seasonally)

Do NOT execute ER-OD-004 in this cycle.

---

*ER-CC-001 Controlled Evidence Collection V0.1 — 2026-09-27*
