# SOUL Yeosu Human Blind Test — Participant Recruitment Protocol V0.1
# 2026-09-28

**Authority:** BTD-A V0.1 (design) / EP-A V0.1 (execution) / DR-B V0.1 (operability evidence)  
**Status:** PROTOCOL_DESIGN_ONLY  
**Branch:** staging/storybook-c7a  
**Starting HEAD:** cda7e81

---

## 1. Starting State

| Item | Value |
|---|---|
| BTD-A | CREATED / READY_FOR_EP_A |
| EP-A | CREATED / READY_FOR_DR_B |
| DR-B | COMPLETED / READY_FOR_RECRUITMENT |
| RECRUITMENT_READINESS | READY |
| BLOCKING issues | NONE |
| MAJOR issues | NONE |
| HBT Executed | FALSE |
| Participant Evidence | NONE |
| BT Verdict | NOT_ASSIGNED |
| FOUNDER_PARTICIPANT_CONTACT_DECISION | NOT_REQUESTED |
| Controlled Collection Cycles | 25 (unchanged) |
| DB / Schema / Runtime / Production | NO CHANGE |

---

## 2. Recruitment Objective

Recruit a sufficiently varied early-stage participant pool to evaluate human experience of the blinded SOUL responses under BTD-A.

This is **exploratory human validation only.**

**Do NOT claim:**
- Population representativeness
- Demographic representativeness
- Statistical generalization to all Yeosu travelers

**Sample contract (from BTD-A — unchanged):**
- Minimum: 8 valid participants (directional patterns)
- Target: 16 valid participants (reliable distributions)
- Maximum: 24 valid participants (only if signals conflicting at 16)

Invalid sessions are replaced 1:1 and do not count toward these numbers.

---

## 3. Participant Profile — Operational Screening Form

### REQUIRED fields (INELIGIBLE if any = N)

| Field | Question (Korean) | Eligible value |
|---|---|---|
| 한국어 읽기 가능 | 한국어로 작성된 텍스트를 읽고 이해하실 수 있나요? | Y |
| 디지털 메시징/AI 어시스턴트 사용 경험 | 카카오톡, 네이버, AI 챗봇 등 디지털 메시징 또는 AI 어시스턴트를 사용해 보신 적 있나요? | Y |
| 국내 여행 계획 또는 경험 | 국내 여행을 계획하거나 다녀오신 경험이 있나요? | Y |
| 만 18세 이상 | 현재 만 18세 이상이신가요? | Y |

### USEFUL fields (record; do not use to exclude)

| Field | Question (Korean) | Values |
|---|---|---|
| 여수 방문 경험 | 여수를 방문해 보신 적 있나요? | Y / N |
| 부모님/어르신 동반 여행 경험 | 부모님이나 어르신을 모시고 여행하신 경험이 있나요? | Y / N |
| 어린이 동반 여행 경험 | 어린이(초등학생 이하)와 함께 여행하신 경험이 있나요? | Y / N |
| 연령대 | 연령대를 선택해 주세요 | 25–34 / 35–44 / 45–54 / 55–65 / 기타 |
| 차량 보유/운전 경험 | 자가용을 보유하거나 운전하시나요? | Y / N |

### NOT_REQUIRED / EXCLUDE IF POSSIBLE

| Field | Question (Korean) | Action |
|---|---|---|
| 여행업 종사자 여부 | 현재 여행업(여행사, 관광안내 등)에 종사하고 계신가요? | Exclude if Y |

---

## 4. Eligibility / Exclusion Rules

### INELIGIBLE (automatic exclusion)
- Fails any REQUIRED field (N response)
- 여행업 종사자 = Y
- Direct knowledge of internal A/B hypothesis (participated in BTD-A / EP-A / DR-B creation)
- Prior exposure to frozen HBT stimulus pairs (e.g., seen internal Pilot responses)
- Direct project team member (researchers, facilitators currently assigned to this HBT)

### REVIEW_REQUIRED (researcher leakage-risk assessment required)
- Strong prior SOUL product familiarity — assess: what has this person seen? Was Condition A/B discussed? If no A/B knowledge confirmed: ELIGIBLE
- DreamTown internal user/tester — case-by-case: assess which features tested and whether any proximity to stimulus content

### ELIGIBLE
Passes all REQUIRED fields + not INELIGIBLE + REVIEW_REQUIRED resolved in favor of inclusion.

**Never select participants according to expected A/B preference.**  
**Do not over-exclude ordinary travel experience or DreamTown familiarity.**

---

## 5. Recruitment Channels

### PREFERRED

| Channel | Likely Profile | Selection Bias Risk | Leakage Risk | Operational Burden | Privacy |
|---|---|---|---|---|---|
| Founder personal network (acquaintances, colleagues) | Mixed age/experience; direct scheduling | Moderate (Founder's circle) | LOW if not briefed on A/B hypothesis | Low | Low — personal relationship |
| Travel community referrals (Naver Cafe, Kakao travel groups — NOT yet contacted) | Strong travel interest; relevant planning profile | Low | LOW | Moderate | Medium — requires neutral approach |
| Korean domestic travel planners (online acquaintance referrals) | Active trip planning experience | Low | LOW | Low | Low |

### ACCEPTABLE

| Channel | Assessment |
|---|---|
| DreamTown/SOUL existing users | REVIEW_REQUIRED per candidate — assess A/B hypothesis exposure; useful diversity but leakage risk if previously in internal testing |
| General social network referral (Facebook, Instagram — referral only, NOT advertising) | Lower profile control; higher diversity variation; low leakage if study not described in detail |

### AVOID

| Channel | Reason |
|---|---|
| Anyone who has seen BTD-A / EP-A / DR-B artifacts | Direct leakage risk |
| Paid panel recruitment | Introduces demand characteristics; premature for exploratory stage |
| Direct advertising on public platforms | Premature for exploratory study; privacy implications |
| Anyone briefed on "Condition A vs Condition B" or "Prepared Context" | Automatic INELIGIBLE |

**Channel design only — do NOT post or contact anyone before FOUNDER_PARTICIPANT_CONTACT_DECISION = GO.**

---

## 6. Pool Diversity / Balance Goals

These are **BALANCE_GOALS**, not statistical quotas. Feasibility drives final composition. Document actual pool composition before analysis.

| Dimension | Balance Goal |
|---|---|
| 여수 경험 유/무 | Mix preferred — not all visited, not all never visited |
| 여행 계획 빈도 | Mix occasional and frequent trip planners |
| 차량 유/무 | Both represented in pool |
| 부모/어르신 동반 경험 | At least some YES — important for H-2 diagnostic relevance |
| 연령대 | Avoid concentration in single decade |
| 어린이 동반 경험 | Some variation useful for O-series scenarios |

---

## 7. Screening Flow

```
Step 1:  Candidate identified via recruitment channel
Step 2:  Study-neutral invitation extended (Section 8 framework — DRAFT, not yet authorized)
Step 3:  Candidate completes screening form (REQUIRED + USEFUL fields only)
Step 4:  Eligibility determination → ELIGIBLE / INELIGIBLE / REVIEW_REQUIRED
Step 5:  If REVIEW_REQUIRED → researcher performs leakage-risk assessment
Step 6:  Profile-balance review → check pool composition vs. BALANCE_GOAL table
Step 7:  Add to candidate pool if ELIGIBLE + balance supports inclusion
Step 8:  Candidate waits in pool pending Founder contact authorization
Step 9:  ══ GATE: FOUNDER_PARTICIPANT_CONTACT_DECISION = GO required ══
Step 10: Contact / scheduling executed in later authorized phase
```

**IMPORTANT:** Steps 1–3 involve a study-neutral initial invitation only. No disclosure of internal study details. No study materials shared. No sessions scheduled until Step 9 GATE is cleared.

---

## 8. Participant-Facing Invitation Framework

> **DRAFT — NOT AUTHORIZED FOR SENDING**

---

**제목:** 여수 여행 안내 AI 응답 평가 연구 참여 안내

**내용 (초안):**

안녕하세요.

저희는 현재 여수 여행 안내 AI 응답의 품질을 평가하는 소규모 연구를 진행 중입니다.

이 연구에서 참여자분께서는 동일한 여행 질문에 대한 두 가지 가능한 AI 응답을 비교하고 평가하시게 됩니다. 여수에 대한 전문 지식이 없어도 참여하실 수 있습니다.

- **예상 소요 시간:** 약 60–80분 (추정치, 실측값 아님)
- **참여 방식:** 1:1 세션 (온라인 또는 대면 — 추후 협의)
- **보상:** [추후 결정 — 현재 미정]
- **자발적 참여:** 언제든지 중단하실 수 있습니다

관심 있으신 분은 아래 간단한 사전 정보를 알려주시면 감사드리겠습니다.

---

> **DRAFT — NOT AUTHORIZED FOR SENDING**

**This draft must NOT reveal:**
- Model A / Model B distinction
- Prepared Knowledge / Prepared Context / Expert Anticipation terminology
- Expected winner
- Pilot result or Integrity Gate result
- Founder preference
- H-2 diagnostic purpose

---

## 9. Session Burden Disclosure

**DR-B finding:** SESSION BURDEN = MODERATE–HIGH / estimated 60–80 minutes.  
This is a Dry Run structural estimate, **NOT** measured participant completion time.

**Participant-facing disclosure requirements:**
- State exactly: "약 60–80분 소요 예상 (추정치)"
- Do NOT describe as "간단한 설문" or minimize burden
- Allow participant to ask about session structure before committing
- Mention mid-session break availability

---

## 10. Consent Framework

**Classification: RESEARCH CONSENT FRAMEWORK — NOT LEGAL COUNSEL.**  
Legal review should occur before actual participant contact at Founder's discretion.

### Required consent elements

| # | Element | Content |
|---|---|---|
| 1 | 목적 (Purpose) | AI 여행 안내 응답의 사용자 경험 평가 연구 (neutral — no A/B mention) |
| 2 | 활동 (Activities) | 두 AI 응답 비교 평가, 6개 항목 평가, 선택 질문, 자유 의견 제공 |
| 3 | 소요 시간 (Duration) | 약 60–80분 (추정치) — 중간 휴식 가능 |
| 4 | 자발성 (Voluntary) | 언제든 중단 가능, 불이익 없음 |
| 5 | 응답 선택 중립성 | 어떤 응답을 선택해도 불이익 없음 |
| 6 | 데이터 기록 | 익명 참여 ID(P01 등) 사용, 이름/연락처는 연구 데이터셋에 포함되지 않음 |
| 7 | 활용 방법 | AI 서비스 개선 연구 목적, 개인 식별 정보 포함 없이 분석 |
| 8 | 녹음/녹화 | 없음 (no recording — default unless Founder explicitly authorizes otherwise) |
| 9 | 문의 | 연구 담당자 연락처 [Founder must specify before actual contact] |
| 10 | 철회 | 동의 후에도 참여 철회 가능 — 데이터 삭제 가능 여부는 연구 단계에 따라 협의 |

---

## 11. Minimum Data / Privacy Design

### Data separation

**CONTACT DATA** (separate system, NOT in research dataset):
- Candidate name / preferred contact method
- Used only for scheduling and session logistics
- Accessible only to study coordinator
- Deletion/retention review: after HBT data collection closes and participant IDs are assigned — no specific legal retention period invented; Founder decides if legal requirement applies

**RESEARCH RESPONSE DATA** (main dataset):
- Participant ID only (P01...P24) — matches EP-A data capture template
- No name, no contact info, no identifying detail
- Condition mapping kept researcher-side per EP-A instructions

**Mapping table:** Participant ID ↔ Contact information kept in a separate document accessible only to study coordinator. Never merged into research response dataset.

---

## 12. Scheduling Framework

Procedure only — no real dates, no real participants scheduled.

| Parameter | Specification |
|---|---|
| Session slot | ~90 minutes per session (60–80 min session + 10 min buffer) |
| Format | 1:1 (facilitator + participant); online or in-person — Founder/facilitator decides |
| Cancellation | 24h advance notice requested; facilitator reschedules without penalty |
| Rescheduling | Up to 2 attempts before candidate returned to pool |
| No-show | 2 no-shows → candidate removed from pool; replacement recruited |
| Replacement | EP-A 1:1 replacement rule / BTD-A sample contract — matches profile where possible |
| Participant ID assignment | Assigned at session start (not at screening), using next available sequential ID |
| Session ordering | Multiple participants may be scheduled concurrently; each assignment determined at ID time per EP-A counterbalancing table |
| Session logging | Session completion recorded in recruitment tracker (Section 13) |

---

## 13. Blank Recruitment Tracker

**Do NOT populate with real people. Do NOT store PII here.**

| Field | Description / Allowed Values |
|---|---|
| Candidate_ID | Internal temp ID: C001, C002... |
| Recruitment_Channel | Which channel (e.g., "Founder network", "Naver Cafe referral") |
| Screening_Status | NOT_STARTED / IN_PROGRESS / COMPLETE |
| Eligibility | ELIGIBLE / INELIGIBLE / REVIEW_REQUIRED |
| Ineligibility_Reason | If INELIGIBLE — specify which rule |
| Yeosu_Visit | Y / N |
| Companion_Elder | Y / N |
| Companion_Child | Y / N |
| Car_Experience | Y / N |
| Age_Band | 25–34 / 35–44 / 45–54 / 55–65 / 기타 |
| Balance_Review | INCLUDED / DEFERRED / DECLINED |
| Invitation_Status | NOT_SENT / DRAFT_READY / SENT (requires Founder GO) |
| Consent_Status | NOT_OBTAINED / OBTAINED (requires Founder GO) |
| Scheduling_Status | NOT_SCHEDULED / SCHEDULED / COMPLETE |
| Participant_ID | Assigned at session start — blank until then |
| Session_Status | NOT_STARTED / COMPLETE / INVALID / REPLACED |
| Replacement_For | Candidate_ID of replaced participant if applicable |
| Notes | Operational notes only — no research response data |

---

## 14. Founder Contact Gate

### FOUNDER_PARTICIPANT_CONTACT_DECISION

| State | Meaning |
|---|---|
| NOT_REQUESTED | Protocol not yet reviewed by Founder |
| GO | Founder explicitly authorized participant contact |
| HOLD | Founder requested pause |

**Current state: NOT_REQUESTED**

**No participant contact is allowed until ALL of:**
1. Recruitment Protocol = READY_FOR_FOUNDER_CONTACT_DECISION
2. All PRE_CONTACT_BLOCKER issues resolved (see Section 19 — currently none)
3. Founder reviews this protocol
4. Founder explicitly says GO

---

## 15. DR-B Minor Issue Disposition

### All 7 DR-B MINOR Issues

**Classification scale:**
- PRE_CONTACT_BLOCKER: must resolve before any participant contact
- PRE_SESSION_BLOCKER: must resolve before first real session
- NONBLOCKING_OBSERVATION: no resolution required before contact or session

---

**DR-B-M-001: Stimulus presentation format unspecified**  
Classification: **PRE_SESSION_BLOCKER**  
Ownership: Stimulus Presentation Addendum (separate operational note — not an EP-A modification)  
Required resolution before first session:
- Define whether responses shown simultaneously side-by-side or sequentially
- Define display medium (screen / printed)
- Define font/size equivalence requirement between 응답 가 and 응답 나
- Define whether participant reads silently or aloud

---

**DR-B-M-002: "서로 다른 AI인가요?" clarification uncovered in EP-A**  
Classification: **PRE_SESSION_BLOCKER**  
Ownership: Facilitator Clarification Addendum  
Pre-approved neutral reply:  
> "두 응답은 모두 같은 AI 시스템에서 나온 것입니다. 같은 질문에 대한 두 가지 다른 방식의 응답입니다."

---

**DR-B-M-003: "장소를 잘 모른다" clarification uncovered in EP-A**  
Classification: **PRE_SESSION_BLOCKER**  
Ownership: Facilitator Clarification Addendum  
Pre-approved neutral reply:  
> "괜찮습니다. 응답이 얼마나 도움이 될 것 같은지, 전문가처럼 느껴지는지를 평가해 주시면 됩니다. 해당 장소를 직접 알 필요는 없습니다."

---

**DR-B-M-004: Single-dimension missing-value handling unspecified**  
Classification: **PRE_SESSION_BLOCKER**  
Ownership: Facilitator Completeness Addendum  
Pre-approved procedure:  
- If participant skips one dimension rating: facilitator may gently request before proceeding
- If participant declines: flag row as REVIEW item — not automatic INVALID
- Facilitator does not interpret or suggest a rating value

---

**DR-B-M-005: Session break protocol unspecified**  
Classification: **PRE_SESSION_BLOCKER**  
Ownership: Session Flow Addendum (partially addressed here in Section 16)  
Pre-approved break framework:
- Standard break: after scenario 5 of 9 (mid-point), ~30–35 min into single-turn block
- Duration: ~5 min standardized
- Accessibility/comfort break: always permitted at participant request, no restriction
- Exact procedure must be formally fixed before first real session

---

**DR-B-M-006: MT-1 incomplete trigger not specified**  
Classification: **PRE_SESSION_BLOCKER**  
Ownership: Facilitator Completeness Addendum  
Pre-approved procedure:
- MT-1 with only 2 of 3 turns completed AND Forced Choice not recorded = INCOMPLETE_EVALUATION
- Facilitator may request Turn 3 before closing
- If participant cannot continue: flag for REVIEW (not automatic INVALID)
- Decision tree: REVIEW → VALID (if Turn 3 data sufficient for comparison) / INVALID (if turns insufficient for meaningful evaluation)

---

**DR-B-M-007: ASSIGN_ERR severity classification unspecified**  
Classification: **PRE_SESSION_BLOCKER**  
Ownership: Invalid Session Procedure Addendum  
Pre-approved severity classification:
- ASSIGN_ERR discovered **before** stimulus shown to participant → correctable: reassign using correct counterbalancing entry, no session flag required
- ASSIGN_ERR discovered **after** participant sees stimulus → ASSIGNMENT_ERROR → REVIEW → likely INVALID with 1:1 replacement

---

### Summary

| Issue | Classification | Ownership |
|---|---|---|
| DR-B-M-001 | PRE_SESSION_BLOCKER | Stimulus Presentation Addendum |
| DR-B-M-002 | PRE_SESSION_BLOCKER | Facilitator Clarification Addendum |
| DR-B-M-003 | PRE_SESSION_BLOCKER | Facilitator Clarification Addendum |
| DR-B-M-004 | PRE_SESSION_BLOCKER | Facilitator Completeness Addendum |
| DR-B-M-005 | PRE_SESSION_BLOCKER | Session Flow Addendum |
| DR-B-M-006 | PRE_SESSION_BLOCKER | Facilitator Completeness Addendum |
| DR-B-M-007 | PRE_SESSION_BLOCKER | Invalid Session Procedure Addendum |

**PRE_CONTACT_BLOCKERS: 0**  
**PRE_SESSION_BLOCKERS: 7** (all must be resolved in Session Addendum before first real session)  
**NONBLOCKING: 0**

---

## 16. Fatigue / Break Framework

DR-B observed **MODERATE–HIGH** session burden (~60–80 min structural estimate).

**Recruitment-level expectations:**
- All candidates informed: "세션은 약 60–80분 소요 예정이며, 중간 휴식이 가능합니다"
- Standard break position: after scenario 5 of 9 (mid-point, ~30–35 min into single-turn block)
- Break duration: ~5 min
- Accessibility/comfort break: always permitted at participant request — no time restriction
- Facilitators must NOT improvise per-participant break timing, except for accessibility requests
- Exact break timing procedure: must be formally fixed in Session Flow Addendum before first real session (this resolves DR-B-M-005 ownership)

**Fatigue mitigation note:** Late scenarios (7–9) and MT-1 carry higher fatigue risk. Facilitator should maintain consistent neutral pace and not rush. No shortcutting instructions.

---

## 17. Compensation

No canonical compensation decision exists in the repository.

**COMPENSATION_DECISION = REQUIRES_FOUNDER_DECISION**

- Do NOT choose an amount in this protocol
- Do NOT promise compensation in invitation materials until Founder decides
- Invitation draft uses placeholder: "[보상: 추후 결정 — 현재 미정]"
- Founder decision inputs: amount / type (gift card, cash, none) / disclosure timing

---

## 18. Recruitment Success Criteria

**RECRUITMENT_PROTOCOL_STATUS = READY_FOR_FOUNDER_CONTACT_DECISION** requires ALL:

| Criterion | Status |
|---|---|
| Recruitment channels defined (PREFERRED/ACCEPTABLE/AVOID) | ✓ DONE (Section 5) |
| Screening procedure executable | ✓ DONE (Section 7) |
| Eligibility rules objective | ✓ DONE (Section 4) |
| Pool balance goals defined | ✓ DONE (Section 6) |
| Invitation framework neutral and drafted | ✓ DONE (Section 8) |
| Session burden accurately disclosed (estimate, not measured) | ✓ DONE (Section 9) |
| Consent framework defined | ✓ DONE (Section 10) |
| Minimum-data principle applied | ✓ DONE (Section 11) |
| Contact/research data separated | ✓ DONE (Section 11) |
| Scheduling framework defined | ✓ DONE (Section 12) |
| Blank tracker defined | ✓ DONE (Section 13) |
| Founder contact gate explicit with NOT_REQUESTED state | ✓ DONE (Section 14) |
| All 7 DR-B MINOR issues dispositioned | ✓ DONE (Section 15) |
| Compensation decision status documented | ✓ DONE (Section 17) |
| No participant contact occurred | ✓ CONFIRMED |

**RECRUITMENT_PROTOCOL_STATUS = READY_FOR_FOUNDER_CONTACT_DECISION**

---

## 19. Pre-Contact Blockers

**PRE_CONTACT_BLOCKERS: NONE**

None of the 7 DR-B MINOR issues require resolution before participant contact. All are PRE_SESSION_BLOCKER, resolvable before the first real session.

---

## 20. Pre-Session Blockers

**PRE_SESSION_BLOCKERS: 7** — all DR-B MINOR issues (DR-B-M-001 through DR-B-M-007)

These must all be resolved in operational addenda before the first real participant session begins. They do not block participant contact or consent.

---

## 21. Explicit Non-Actions

This protocol design did NOT:
- Contact any participant
- Publish or distribute any recruitment materials
- Schedule any real session
- Collect any name, email, phone, or other PII
- Assign any real participant IDs
- Obtain any informed consent
- Execute any Human Blind Test
- Create any Participant Evidence
- Assign any BT Verdict
- Modify BTD-A, EP-A, or DR-B
- Rerun DR-B
- Collect new place Evidence
- Conduct web research
- Perform YTC Coverage Check, Traveler Reaction Corpus, Flawless Travel Loop work
- Create any Candidate or Architecture Decision
- Make any DB / schema / runtime / production change
