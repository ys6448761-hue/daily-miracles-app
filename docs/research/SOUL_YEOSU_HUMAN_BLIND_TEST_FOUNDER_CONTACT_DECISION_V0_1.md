# SOUL Yeosu Human Blind Test — Founder Participant Contact Decision V0.1
# 2026-09-28

---

## 1. Starting State

| Item | Value |
|---|---|
| Branch | staging/storybook-c7a |
| Starting HEAD | b4fea43 |
| RECRUITMENT_PROTOCOL_STATUS | READY_FOR_FOUNDER_CONTACT_DECISION |
| FOUNDER_PARTICIPANT_CONTACT_DECISION | NOT_REQUESTED (prior to this document) |
| Pre-contact blockers | 0 |
| Pre-session blockers | 7 (DR-B-M-001 through DR-B-M-007) |
| COMPENSATION_DECISION | REQUIRES_FOUNDER_DECISION |
| Participant Evidence | NONE |
| BT Verdict | NOT_ASSIGNED |
| HBT Executed | FALSE |

---

## 2. Founder Decision

**FOUNDER_PARTICIPANT_CONTACT_DECISION = GO**

This decision authorizes initiation of participant recruitment contact according to the approved Recruitment Protocol V0.1.

---

## 3. Scope of Contact Authorization

**CONTACT_AUTHORIZATION = GO**

Authorized under this decision:
- Use approved recruitment channels (PREFERRED / ACCEPTABLE per Recruitment Protocol)
- Send approved neutral recruitment invitation (DRAFT framework from Recruitment Protocol)
- Perform approved participant screening
- Determine eligibility per objective ELIGIBLE / INELIGIBLE / REVIEW_REQUIRED rules
- Build candidate pool
- Schedule participants once all pre-session blockers are resolved and operationally appropriate

Compensation must be resolved before participant commitment/session scheduling confirmation. Until compensation is decided, invitation uses honest placeholder: "[보상: 추후 결정 — 현재 미정]"

---

## 4. Scope of Session Execution Authorization

**SESSION_EXECUTION_AUTHORIZATION = BLOCKED**

NOT authorized until Session Addendum V0.1 resolves all 7 PRE_SESSION_BLOCKERs:
- Execute actual HBT session
- Expose frozen stimuli to a real participant
- Collect HBT ratings or responses
- Collect Participant Evidence
- Assign BT Verdict

---

## 5. State Separation (Critical for Handoff)

| State | Value |
|---|---|
| RECRUITMENT_CONTACT_READINESS | AUTHORIZED |
| HBT_SESSION_READINESS | BLOCKED_PRE_SESSION_ADDENDUM |

These two states are explicitly separate. RECRUITMENT_CONTACT_READINESS = AUTHORIZED does NOT imply permission to execute participant testing. This distinction must survive all handoffs.

---

## 6. Compensation Decision

**COMPENSATION_DECISION = REQUIRES_FOUNDER_DECISION**

No compensation amount has been determined. This does not block participant contact — the invitation framework uses honest pending language. Compensation must be resolved before session scheduling confirmation (before participants commit to a session slot).

Possible resolution paths:
- A. NO_COMPENSATION — Founder decides no compensation offered
- B. COMPENSATION_APPROVED — Founder specifies exact amount/form

Until one of these is decided: invitation placeholder remains "[보상: 추후 결정 — 현재 미정]"

---

## 7. Session Addendum Authorization

Creation of ONE controlled operational artifact is authorized for a future run:

**Human Blind Test Session Addendum V0.1**

Purpose: resolve exactly DR-B-M-001 through DR-B-M-007.

This Addendum must remain operational only — it must NOT reopen BTD-A, must NOT redesign EP-A.

The Addendum is NOT created in this run.

---

## 8. DR-B-M-001 through DR-B-M-007 Closure Map

| Issue | Description | Resolution Target | Status |
|---|---|---|---|
| DR-B-M-001 | Stimulus presentation format unspecified | Define exact participant-facing format: medium (screen/print), side-by-side vs sequential, font/size equivalence | PRE_SESSION_BLOCKER — Session Addendum V0.1 |
| DR-B-M-002 | "서로 다른 AI인가요?" clarification not covered | Standardized neutral reply: "두 응답은 모두 같은 AI 시스템에서 나온 것입니다. 같은 질문에 대한 두 가지 다른 방식의 응답입니다." | PRE_SESSION_BLOCKER — Session Addendum V0.1 |
| DR-B-M-003 | "장소를 잘 모른다" clarification not covered | Standardized neutral reply: "괜찮습니다. 응답이 얼마나 도움이 될 것 같은지, 전문가처럼 느껴지는지를 평가해 주시면 됩니다. 해당 장소를 직접 알 필요는 없습니다." | PRE_SESSION_BLOCKER — Session Addendum V0.1 |
| DR-B-M-004 | Single-dimension missing rating handling unspecified | Define: facilitator may request participant rate the skipped dimension; if participant declines, flag as REVIEW item (not automatic INVALID) | PRE_SESSION_BLOCKER — Session Addendum V0.1 |
| DR-B-M-005 | Session break protocol unspecified | Standardized break: after scenario 5 of 9, ~5 min; accessibility breaks always permitted at participant request; validate against BTD-A/EP-A before canonicalizing | PRE_SESSION_BLOCKER — Session Addendum V0.1 |
| DR-B-M-006 | MT-1 incomplete invalidation trigger unspecified | Define: MT-1 with only 2 of 3 turns completed + Forced Choice not recorded = INCOMPLETE_EVALUATION; facilitator may request Turn 3; if participant cannot continue, flag for REVIEW | PRE_SESSION_BLOCKER — Session Addendum V0.1 |
| DR-B-M-007 | ASSIGN_ERR severity classification unspecified | Define: pre-exposure ASSIGN_ERR = correctable (reassign, no flag); post-exposure ASSIGN_ERR = ASSIGNMENT_ERROR → REVIEW → likely INVALID with 1:1 replacement | PRE_SESSION_BLOCKER — Session Addendum V0.1 |

All 7 are PRE_SESSION_BLOCKERs. None are PRE_CONTACT_BLOCKERs.

---

## 9. HBT Session Readiness Gate

**HBT_SESSION_READINESS = BLOCKED_PRE_SESSION_ADDENDUM**

Gate release requires ALL:
1. Session Addendum V0.1 created
2. All 7 DR-B-M issues marked RESOLVED in Addendum
3. Session Addendum validation = PASS
4. Compensation decision resolved (before scheduling confirmation)

No real participant may begin an HBT session until this gate is released.

---

## 10. Explicit Non-Actions

This run did NOT:
- Contact any participant
- Publish any recruitment
- Schedule any participant
- Collect any personal information
- Collect Participant Evidence
- Assign BT Verdict
- Create the Session Addendum
- Modify BTD-A, EP-A, or DR-B
- Execute Human Blind Test
- Invent a compensation amount
- Conduct web research
- Collect new place Evidence
- Create Candidate or Architecture Decision
- Change any schema / runtime / production system

---

## 11. ONE NEXT ACTION

Create Human Blind Test Session Addendum V0.1 to resolve DR-B-M-001 through DR-B-M-007.

Do NOT execute participant contact as canonical Next Action — contact is AUTHORIZED but the canonical pipeline Next Action is the Session Addendum, since session cannot proceed until Addendum is complete.
