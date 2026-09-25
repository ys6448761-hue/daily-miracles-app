# Package Cable Car Conditional Directionality
# Independent WHY Research V0.1 — Source & Provenance Audit

**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Base Checkpoint:** ef1813a  
**Status:** AUDIT PERSISTENCE ONLY — Founder + Lumi Review Passed  
**Audit Type:** Source & Provenance Audit

---

## Audit Scope

**Research Question:**  
"여수 패키지 일정에서 케이블카 편도 운용과 탑승 방향(돌산→자산 vs 자산→돌산)은 전후 목적지 순서, 버스 이동/주차 동선, 숙박 위치 중 어떤 운영 조건에 가장 종속적인가?"

**Audit Principle:**  
이번 Audit은 새로운 Research가 아니다.  
이미 검토된 Source들의 재현 가능성과 Provenance를 확인하여,  
WHY 판단에 사용할 수 없는 Evidence를 제외하는 것이 목적이다.

---

## Section 1 — Evidence Discipline

다음 구분을 이 문서 전체에서 유지한다:

| 구분 | 설명 |
|---|---|
| Official / Physical Fact | 공식 기관이 확인한 사실 (요금, 운영 구조 등) |
| Corpus Observation | YTC canonical corpus에서 직접 관찰된 패턴 |
| Source-stated Operational WHY | Source가 직접 이유를 명시한 경우 |
| Operator Inference | 운영 로직에서 추론한 것 — Source 미확인 |

**핵심 원칙:**  
Official operating possibility가 존재한다고 해서 그것이 package decision의 causal WHY라는 뜻은 아니다.  
`편도 단체요금 존재` ≠ `여행사가 왜 편도를 선택하는가`

---

## Section 2 — DIR Source Audit Results

### DIR-01 ~ DIR-05

| 항목 | Audit Result |
|---|---|
| DIR-01 | SOURCE_NOT_REPRODUCIBLE / EXCLUDED |
| DIR-02 | SOURCE_NOT_REPRODUCIBLE / EXCLUDED |
| DIR-03 | SOURCE_NOT_REPRODUCIBLE / EXCLUDED |
| DIR-04 | SOURCE_NOT_REPRODUCIBLE / EXCLUDED |
| DIR-05 | SOURCE_NOT_REPRODUCIBLE / EXCLUDED |

**처리:**  
DIR-01~05는 재현 불가능한 Source에 해당하며, WHY 판단 Evidence에서 제외한다.  
기존 Corpus (YTC-001~014)에는 영향을 주지 않는다.

---

### Unidentified Package Manual

| 항목 | Audit Result |
|---|---|
| Unidentified package manual | SOURCE_NOT_REPRODUCIBLE |

재현 불가능. WHY Evidence로 사용하지 않는다.

---

### Unidentified Bus-Driver / Community Evidence

| 항목 | Audit Result |
|---|---|
| Unidentified bus-driver/community evidence | UNVERIFIED COMMUNITY CLAIM / EXCLUDED |

검증되지 않은 커뮤니티 주장. WHY Evidence에서 제외한다.

---

## Section 3 — Removed Claims

다음 주장들은 이번 Audit에서 제거되었다.

| 주장 | Audit Result |
|---|---|
| Through-pass standard protocol | UNVERIFIED / REMOVED |
| Zero-buffer operation | UNVERIFIED / REMOVED |
| Legal prohibition of large buses entering Jasan summit road | UNVERIFIED / CLAIM REMOVED |

**처리:**  
이 주장들은 Source 재현 불가 또는 검증 불가 상태이며, WHY 판단 근거로 사용할 수 없다.  
제거 후에도 Corpus Observation (YTC canonical)은 유지된다.

---

## Section 4 — Variable Assessments (Final, Post-Audit)

### 4-1. Candidate WHY Variables

| Variable | Assessment | Evidence Basis |
|---|---|---|
| Previous Destination | **EARLY SUPPORT** | Corpus Observation — 일부 사례에서 이전 목적지와 케이블카 방향 연관 관찰 |
| Next Destination | **EARLY SUPPORT** | Corpus Observation — 오동도 후행/선행 구조와 방향 연관 신호 존재 |
| Bus Repositioning | **EARLY SUPPORT** | Corpus Observation — 버스가 반대편 탑승장으로 이동하는 패턴 관찰 (YTC-007 등) |
| Parking | **INSUFFICIENT** | Corpus에서 주차 직접 원인으로 연결되는 Evidence 부족 |
| Accommodation | **MIXED** | 광양 숙박 4건 vs 여수 숙박 다수 — 방향과 직접 연결 불분명 |
| Schedule / Time | **INSUFFICIENT** | 일정 제약과 방향 선택 직접 연결 Evidence 부족 |

### 4-2. Ticket / Operating Policy — Minor Correction Applied

**Before (제거된 표현):** `EARLY SUPPORT`

**After (최종):** `NOT TESTABLE`

**Correction Note:**  
`VERIFIED OPERATING CONDITION — Official one-way group fare exists for eligible group tickets. This verifies operational possibility, not the causal WHY for package one-way selection.`

공식 편도 단체요금 존재는 Official Fact다.  
이것은 패키지가 편도를 선택하는 WHY의 Evidence가 아니다.  
Official Fact → WHY Evidence 승격하지 않는다.

### 4-3. Founder Rationale

| 항목 | Assessment |
|---|---|
| Founder Rationale | **PARTIALLY SUPPORTED** |

Founder의 운영 경험에서 제시된 설명(버스 동선, 목적지 방향 등)은  
일부 Corpus Observation과 방향이 일치한다.  
그러나 현재 Corpus만으로 Founder Rationale를 완전히 검증하지 않는다.  
Provenance: `FOUNDER_LOCAL / EXPERT_RATIONALE` 유지.

---

## Section 5 — WHY Assessment (Final)

**WHY Assessment:** `WHY REMAINS MIXED`

**이유:**

1. DIR-01~05 + unidentified sources 제외 후 남은 WHY Evidence는 YTC canonical corpus observation에 한정됨.
2. Corpus Observation은 방향과 일부 변수 사이의 신호를 보여주지만 causal weight를 확정하기 부족함.
3. `Previous/Next Destination`과 `Bus Repositioning`은 EARLY SUPPORT이지만 confounding factors 존재.
4. `Ticket / Operating Policy`는 NOT TESTABLE로 WHY 판단에서 제외됨.
5. Founder Rationale는 PARTIALLY SUPPORTED이지만 Independent Evidence로 검증되지 않음.

**결론:**  
현재 재현 가능한 Evidence만으로는 "어떤 운영 조건이 가장 종속적인가"라는 질문에 답할 수 없다.  
WHY는 MIXED 상태를 유지한다.

---

## Section 6 — Governance Boundaries

| 항목 | 상태 |
|---|---|
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Candidate Generated | NO |
| Architecture Changed | NO |
| Recommendation Rule | NOT CREATED |
| SSOT Promotion | NOT DONE |
| Production / Runtime / DB / Schema 변경 | PROHIBITED |

**특히:**
- `Package One-way Cable Car` → `EARLY SUPPORT / SAMPLE-BOUNDED / NOT GENERALIZED`
- `Conditional Cable Car Directionality` → `EARLY SUPPORT / NOT RULE / NOT CANDIDATE`

---

## Section 7 — Next Research Guardrails

Next Research (YTC Package Direction Correlation Matrix V0.1)에서:

| 항목 | 규칙 |
|---|---|
| Web search | NO |
| New Corpus | NO |
| Founder rationale 사용 | NO |
| External DIR cases 사용 | NO |
| Missing direction inference | NO |
| WHY inference | NO |

**Canonical YTC evidence만 사용.**

특히 다음 값은 그대로 유지:

| ID | Cable Car | Direction |
|---|---|---|
| YTC-002 | One-way | MISSING_DATA — 추정하지 않음 |
| YTC-006 | One-way | MISSING_DATA — 추정하지 않음 |

---

## Section 8 — Audit Summary

| 항목 | 결과 |
|---|---|
| DIR-01~05 | EXCLUDED (SOURCE_NOT_REPRODUCIBLE) |
| Unidentified package manual | EXCLUDED (SOURCE_NOT_REPRODUCIBLE) |
| Unidentified bus-driver/community evidence | EXCLUDED (UNVERIFIED COMMUNITY CLAIM) |
| Through-pass standard protocol | REMOVED (UNVERIFIED) |
| Zero-buffer operation | REMOVED (UNVERIFIED) |
| Legal prohibition claim | REMOVED (UNVERIFIED) |
| Ticket / Operating Policy | NOT TESTABLE (Official Fact ≠ WHY Evidence) |
| Founder Rationale | PARTIALLY SUPPORTED |
| WHY Assessment | WHY REMAINS MIXED |

---

*Package Cable Car Conditional Directionality — Source & Provenance Audit V0.1 — 2026-09-25*
