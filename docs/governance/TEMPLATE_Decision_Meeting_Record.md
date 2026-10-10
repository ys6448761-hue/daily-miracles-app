# Phoenix Decision Meeting Record — Template

> **사용법:** 이 파일을 복사하여 `docs/governance/meetings/MEET-[YYYYMMDD]-[ID].md`로 저장.
> ADR·SSOT 자동 변경 안 됨. 결정 확정 후 관련 문서에 수동 연결.
> 변경 이력 = git commit 단위 추적.

---

# Phoenix Decision Meeting Record

**Meeting ID:** MEET-[YYYYMMDD]-[XXX]  
**Date:** YYYY-MM-DD  
**Topic:** (한 줄 요약)  
**Session Context:** (세션 파일 경로 또는 대화 맥락)  
**Status:** Pending / Approved / Rejected / Deferred

---

## Founder Intent

> (Founder가 실제로 말한 것 — 직접 인용 blockquote 사용)
> AI 요약이면 "[요약]" 접두사 사용

---

## Lumi Proposal

*(Lumi의 제안 원문 또는 요약. AI 해석 포함 시 "[AI 해석]" 접두사)*

**Goal:**  
**Founder Intent Reference:**  
**Relevant SSOT/ADR:**  
**Proposed Change:**  
**Expected Benefit:**  
**Risk:**  
**Approval Scope:**  
**Candidate Notice:** (Candidate에 의존하면 명시. 없으면 "없음")

---

## Code Review

**Status:** Complete / Pending

**Verdict:** [ PASS / ADVISORY / REVIEW HOLD / HARD HOLD ]

**Evidence:**
- (검토에 사용한 파일·커밋·테스트 결과)

**Conflict / Risk:**  
(없으면 "없음")

**Affected Scope:**
- 파일:
- DB/Schema:
- 사용자 흐름:

**Alternative:**  
(대안이 있으면 기술. 없으면 "없음")

**Questions for Lumi:**
1.

**Founder Decision Required:**  
(Founder가 결정해야 할 질문)

---

## Lumi Response

**Status:** Pending / Received

**Decision:** Accept / Revise / Challenge  
**Reason:**  
**Evidence:**  
**Updated Proposal:**  
*(Accept이면 생략)*

---

## Evidence References

- (파일 경로 / 커밋 해시 / 테스트 결과)
- (추가)

---

## Alternatives Considered

*(검토했지만 기각된 대안 — Founder 결정 후에도 삭제하지 않음)*

1. **[대안명]:** 내용 — 기각 이유:

---

## Conflict Classification

`NONE` / `LOCKED_SSOT_VIOLATION` / `DECIDED_OVERRIDE` / `APPROVAL_SCOPE_EXCEEDED` / `PRODUCTION_RISK` / `DOMAIN_COUPLING` / `EVIDENCE_CONTRADICTION` / `CANDIDATE_MISUSE`

---

## Founder Decision

**Status:** Pending / Approved / Rejected / Deferred

**Scope:**  
*(승인된 경우 명시. Pending이면 생략)*

**Conditions:**  
*(조건. 없으면 "없음")*

**Rationale:**
> (Founder가 밝힌 이유 — 직접 인용 우선. AI 해석이면 "[요약]" 접두사)

---

## Dissent / Unresolved Questions

*(반론·미해결 질문 — Founder 결정 후에도 삭제하지 않음)*

-

---

## Revisit Trigger

*(이 결정을 재검토해야 하는 조건 — "Pilot 데이터 N건 확보 후", "Phase 2 시작 시" 등)*

-

---

## Related Documents

- **ADR:** (해당 없으면 "없음")
- **SSOT:** 
- **Candidate:** (해당 없으면 "없음")
- **Evidence:** 
- **Decision Record:** `docs/decisions/`

---

## ONE Current Next Action

*(이 회의록 기준 다음 행동 — 구체적으로 1개만)*
