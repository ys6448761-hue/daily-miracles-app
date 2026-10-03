# SOUL Taxonomy Provenance — Re-Audit V0.2

**Status:** AUDIT_COMPLETE  
**Date:** 2026-10-03  
**Prior audit:** `SOUL_TAXONOMY_PROVENANCE_AUDIT_V0_1.md` @ 50f2315  
**New source analyzed:** `docs/research/founder-source/무여정 초기 버전.docx`  
**Branch:** `integration/soul-cablecar-port-v0-1`  
**Code modified:** NONE (read-only audit)

---

## Trigger

Founder identified "무여정 초기 버전.docx" as a potentially new primary source not included in V0.1 audit corpus. V0.2 task: locate, read, determine whether this source changes any V0.1 verdicts.

---

## Source Identity

| Field | Value |
|---|---|
| File | `docs/research/founder-source/무여정 초기 버전.docx` |
| Git status at audit start | `??` (untracked) |
| Document type | **LUMI_AUTHORED_HANDOVER** |
| Author | Lumi |
| Date | 2026-10-01 |
| Checkpoint | `c8a5aed`, `staging/storybook-c7a` |
| Character | Lumi → Next Lumi Conversation Handover |
| Addressee | "네 대표님" (CEO) |

**Document is NOT a Founder-authored original design document.**  
"무여정 초기 버전" (Muyeojeong Early Version) refers to the "early version" of the Muyeojeong system, not an original product specification. The document was authored by Lumi as a handover to the next session.

---

## Document Structure (16 Sections + Data)

| # | Title | Taxonomy relevance |
|---|---|---|
| 0 | 인수인계 기준점 (c8a5aed) | None |
| 1 | 이번 대화가 시작된 문제 (Golden Question failure) | None |
| 2 | Golden Question 01 확인 사실 (parseContext limits) | None |
| 3 | Lumi Self-Audit (Phoenix Knowledge → Detail Runtime gap) | None |
| 4 | Founder 제품 원칙 (rich basic info, re-edit for traveler) | **New Founder statement (§ Founder Principles)** |
| 5 | SOUL 핵심 차별화 — 장소 간 관계 | **New Founder statement (§ Founder Principles)** |
| 6 | Phoenix 비용/효율 방향 + **12-item Prepared Module candidates** | **Key finding (§ 12-Item List)** |
| 7 | Quick Context ↔ Natural Language (not yet implemented) | None |
| 8 | Failure Safety 4 modes | None |
| 9 | Image state (3 places confirmed) | None |
| 10 | SOUL / 여의보주 / 소원꿈터 role boundary | None |
| 11 | Context Bridge hypothesis | None |
| 12 | Conversation / Memory ownership (not yet designed) | None |
| 13 | Wish Ownership (not yet fixed) | None |
| 14 | HOLD items | None |
| 15 | Do NOT do list | None |
| 16 | Current Next Action = SOUL Readiness Audit V0.1 | None |
| + | Yeosu knowledge research data | None |

---

## Key Finding 1 — 12-Item Prepared Module Candidate List (Section 6)

From document pos ~4058:

```
필요한 Prepared Module 후보:
- Hero
- Place Basics
- Experience
- FOR ME
- SOUL Judgment
- Schedule
- Cost
- Journey
- Relationship
- Context Visual
- Depth
- Action
```

Document text verbatim: `"이것들의 실제 준비 상태는 아직 Audit 전이다."`  
(Their actual readiness has not yet been audited.)

**Classification:** CANDIDATE_PRE_AUDIT — NOT a final taxonomy.  
**Author:** Lumi (not Founder).  
**Source:** Same handover document, Section 6.

This is a 12-item candidate list of Living Detail Page modules as of 2026-10-01. It predates staging's 9-element implementation. Items are labeled CANDIDATE — Lumi explicitly flagged they had not been audited.

**Correlation to staging 9:**

| Candidate (V0.1 handover) | Staging 9 (c7a) | Status |
|---|---|---|
| Hero | PLACE_HERO | IMPLEMENTED |
| Place Basics | ESSENTIAL_INFO | IMPLEMENTED (subset) |
| Experience | (no direct match) | NOT_IMPLEMENTED |
| FOR ME | FOR_ME | IMPLEMENTED |
| SOUL Judgment | SOUL_JUDGMENT | IMPLEMENTED |
| Schedule | JOURNEY | PARTIALLY (journey as schedule) |
| Cost | COST | IMPLEMENTED |
| Journey | JOURNEY | IMPLEMENTED (merged w/ Schedule) |
| Relationship | (no direct match) | NOT_IMPLEMENTED |
| Context Visual | (no direct match) | NOT_IMPLEMENTED |
| Depth | DEPTH | IMPLEMENTED |
| Action | (no direct match) | NOT_IMPLEMENTED |

Staging 9 implemented 8 of 12 candidate concepts (some merged), did not implement 4 (Experience, Relationship, Context Visual, Action). QUESTION_COMPOSER was added in staging not in this candidate list.

---

## Key Finding 2 — Founder Product Principles (Sections 4 & 5)

**Section 4 — Rich Basic Info Principle:**

Founder stated (verbatim per handover):
> "좋은 기능을 많이 붙이는 것보다 기본정보가 풍부하고 확실하게 준비되어 있어야 한다."

Expected content structure (Founder-stated, Section 4):
- Place Attraction / Identity
- 핵심 경험
- 요금
- 운영시간
- 소요시간
- 위치
- 탑승/이용 구조
- 주차
- 접근성
- Experience Basics
- 주변 장소 관계
- 더 깊은 Knowledge

**Note:** This is a 12-item content structure for the basic info SECTION, not a product module taxonomy.

**Section 5 — SOUL Differentiation:**

Founder stated:
> "SOUL의 차별점은 장소 하나를 아는 것이 아니라 장소 간 연관관계를 이해하는 것이다."

---

## Human Experience Layer — Search Results

| Term | Result |
|---|---|
| "Human Experience" | NOT FOUND |
| "Human Voice" | NOT FOUND |
| "여수를 아는 사람들의 시선" | NOT FOUND |
| "먼저 다녀간 소원이" | NOT FOUND |
| "다음 소원이에게 한마디" | NOT FOUND |
| "시선" (gaze/perspective) | NOT FOUND |
| "다녀간" | NOT FOUND |
| "소원이에게 한마디" | NOT FOUND |

**Verdict: HUMAN_EXPERIENCE_ABSENT_FROM_THIS_SOURCE**

Human Experience Layer concepts are absent from this document. This source provides no provenance for the HEL structure in Canonical 10.

---

## Original 10 — Search Results

| Term | Result |
|---|---|
| "10개" | NOT FOUND |
| "10가지" | NOT FOUND |
| "열 가지" | NOT FOUND |
| "Taxonomy" | NOT FOUND |
| "Product Role" | NOT FOUND |
| Any enumerated 10-item list | NOT FOUND |

**Verdict: ORIGINAL_10_STILL_NOT_FOUND**

This source does not contain an original 10-item SOUL detail-page taxonomy. V0.1 verdict unchanged.

---

## V0.2 Verdict Matrix

| Finding | V0.1 | V0.2 | Change? |
|---|---|---|---|
| Document identity | N/A (not in corpus) | LUMI_AUTHORED_HANDOVER | **New finding** |
| Original 10 recovery | ORIGINAL_10_NOT_FOUND | ORIGINAL_10_STILL_NOT_FOUND | No change |
| Canonical 10 provenance | CANONICAL_10_NEEDS_FOUNDER_REVIEW | UNCHANGED | No change |
| Human Experience provenance | SEPARATE_CONCEPTS_NO_CONFIRMED_HIERARCHY | ABSENT_FROM_THIS_SOURCE (confirms V0.1) | Confirms |
| "9+2" status | Analytical only, not Founder-approved | Unchanged | No change |
| 0503ed8 port alignment | FOUNDER_TAXONOMY_DECISION_REQUIRED | UNCHANGED | No change |
| New pre-staging evidence | — | 12-item candidate list (2026-10-01, pre-audit) | **New finding** |
| Founder product principles | — | Sections 4+5 provide Founder-stated design intent | **New finding** |

---

## Taxonomy Timeline (Updated)

```
[2026-10-01] — docs/research/founder-source/무여정 초기 버전.docx (c8a5aed)
  └─ 12-item Prepared Module candidates (Lumi-authored, pre-audit, pre-staging)
  └─ Founder-stated principles: rich basic info + inter-place relationships

[2026-10-01 onward] — staging/storybook-c7a (c8a5aed → 37031ec)
  └─ 9 staging elements (QUESTION_COMPOSER / SOUL_MESSAGE / PLACE_HERO /
     ESSENTIAL_INFO / FOR_ME / SOUL_JUDGMENT / JOURNEY / COST / DEPTH)
  └─ Selection/merge/rename from 12-item candidate list
  └─ QUESTION_COMPOSER added (not in candidate list)

[2026-10-03] — main @ 1e030bf
  └─ Canonical 10 constructed by Lumi from staging 9 + Founder task input
  └─ Human Experience Layer (A+B) added analytically from Founder task input
  └─ CANONICAL_10_NEEDS_FOUNDER_REVIEW

[2026-10-03] — integration/soul-cablecar-port-v0-1 @ 0503ed8
  └─ 9 staging elements ported to main-track code
  └─ PROMOTION_HOLD pending Canonical 10 Founder confirmation
```

---

## Founder Questions — Still Required

V0.2 does not resolve the open questions from V0.1. They stand unchanged:

**Q1:** Is the Canonical 10 role list complete and correctly structured?  
**Q2:** Human Experience Layer = ONE role with TWO sub-concepts (not two separate top-level roles)?  
**Q3:** "10 minimum" = pre-existing Founder count, or recovery task minimum constraint?

**Additional Q4 (from V0.2):**  
Q4: Should "Experience", "Relationship", "Context Visual", or "Action" (unimplemented 12-item candidates) be scoped into a future phase?

---

## Source Registration

File `docs/research/founder-source/무여정 초기 버전.docx` was untracked at audit start.  
Action: registered via `git add` and committed with this audit document.  
Commit convention: `docs(soul):` prefix, no force-push, no main merge.

---

## Audit Scope Prohibitions Verified

| Prohibition | Status |
|---|---|
| NO code modification | CONFIRMED |
| NO main merge | CONFIRMED |
| NO production deployment | CONFIRMED |
| NO DB/schema/migration | CONFIRMED |
| NO 0503ed8 modification | CONFIRMED |
| NO Product Vision modification | CONFIRMED |
| NO D2 Decision modification | CONFIRMED |
| NO external research | CONFIRMED |
| NO manufactured findings | CONFIRMED |
| V0.1 not overwritten | CONFIRMED — V0.1 audit file preserved at 50f2315 |

---

## Implementation Status

**FOUNDER_TAXONOMY_DECISION_REQUIRED** — unchanged from V0.1.

V0.2 adds new pre-staging context (12-item candidate list) and confirms HEL is absent from all discovered sources. It does not recover Original 10 or resolve Q1–Q3. Founder decision on Canonical 10 required before port promotion.
