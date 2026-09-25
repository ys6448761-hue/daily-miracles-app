# Package Direction Association — Evidence Sufficiency Decision V0.1

**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Base Checkpoint:** 4bcff53  
**Status:** DECISION PERSISTENCE ONLY — Founder + Lumi Review PASS WITH MINOR REVISION  
**Decision:** COLLECT MORE EVIDENCE

---

## 1. Current Evidence State

| 항목 | 값 |
|---|---|
| Package cases in matrix | 7 |
| Direction-known cases | 5 |
| Direction MISSING_DATA | 2 (YTC-002, YTC-006) |
| DOLSAN → JASAN + Odongdo AFTER | 3 (YTC-001, YTC-007, YTC-008) |
| JASAN → DOLSAN + Odongdo BEFORE | 2 (YTC-009, YTC-013) |
| Contradictory direction-known cases | 0 |
| Current Assessment | `EARLY ASSOCIATION SIGNAL — SAMPLE BOUNDED` |

---

## 2. What We Can Say

현재 direction-known 5건에서는 cable-car direction과 Odongdo timing이 반례 없이 함께 관찰된다.

---

## 3. What We Cannot Say

| 항목 | 상태 |
|---|---|
| Universal package rule | CANNOT SAY |
| Causal determination | CANNOT SAY |
| WHY | NOT ASSESSED |
| Optimization rule | CANNOT SAY |
| Travel Grammar | NOT CONCLUDED |
| Mental Map confirmation | NOT CONFIRMED |

---

## 4. Option Evaluation

### STOP
**Status:** NOT SELECTED

**이유:**  
5건 중 반례 0건이라는 clean association이 추가 replication을 정당화한다.  
현재 상태에서 멈추기에는 signal이 유의미하다.

---

### COLLECT MORE EVIDENCE
**Status:** SELECTED ✓

**이유:**  
현재 association은 추가 replication을 정당화하지만 causal WHY investigation을 정당화할 만큼 충분하지 않다.  
방향이 확인된 독립 package 사례를 추가 수집하면 현재 불확실성을 의미 있게 줄일 수 있다.

**Collection Target:**  
`3–5 additional independent package-product cases with canonically confirmed cable-car direction and Odongdo sequence.`

**IMPORTANT — Minor Revision #2 Applied:**  
`3–5 additional independent cases are an operational collection target for the next replication pass, not a predefined sufficiency threshold.`

- sufficiency threshold 아님
- validation threshold 아님
- statistical significance threshold 아님
- promotion threshold 아님
- rule confirmation threshold 아님

반례가 1건이라도 나오면 중요한 Evidence로 보존한다.  
3–5건 모두 기존 association과 일치해도 자동으로 Rule / Travel Grammar / Mental Map으로 승격하지 않는다.

---

### OPEN LIMITED WHY TEST
**Status:** NOT SELECTED

**이유:**  
현재 5건의 association만으로는 WHY investigation을 여는 것이 premature하다.  
먼저 replication으로 association 자체를 강화해야 한다.

---

## 5. Minor Revision #1 — Evidence Sufficiency Language

**제거된 표현:** `Evidence Sufficiency: HIGH`

**이유:**  
현재 evidence 자체가 HIGH sufficiency라는 오해를 방지한다.

**대체 허용 표현:**
- `Expected Evidence Gain: HIGH` (추가 수집 시 기대 정보량)
- `Suitability for Reducing Current Uncertainty: HIGH` (현재 불확실성 감소 적합도)

현재 evidence sufficiency 자체는 아직 제한적이다.

---

## 6. Third Sample Collection Target

**목적:** 케이블카 direction과 Odongdo sequence를 검증할 수 있는 독립 package-product 사례 수집

**Collection Target:** 3–5 cases (operational target — not a threshold)

**Required fields per case:**
- Canonical Source (재현 가능)
- Cable Car Direction (명시적으로 확인 가능)
- Odongdo Timing (선행 / 후행 / 없음)
- Bus Repositioning (EXPLICIT / NOT EXPLICIT)

**Excluded from Third Sample:**
- Sources without reproducible canonical raw evidence
- Direction inferred from context
- Individual / non-package cases

---

## 7. Governance

| 항목 | 상태 |
|---|---|
| WHY | NOT ASSESSED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Candidate Generated | NO |
| Architecture Changed | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |

---

*Package Direction Association — Evidence Sufficiency Decision V0.1 — 2026-09-25*
