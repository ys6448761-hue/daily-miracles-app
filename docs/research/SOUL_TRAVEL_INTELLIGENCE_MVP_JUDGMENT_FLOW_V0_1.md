# SOUL Travel Intelligence MVP
# Judgment Flow V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 09d1511
**Status:** PERSISTED / CONFIRMED WITH JUDGMENT-BOUNDARY CORRECTIONS

**JF Verdict:** `JF-B — READY WITH SPECIFIC EVIDENCE GAPS`

**Independent Review:** `CONFIRMED WITH JUDGMENT-BOUNDARY CORRECTIONS`

**Meaning:** Response Prototype design may proceed using the approved Judgment Flow.
Blocked/conditional surfaces must not silently become recommendation rules.
Insufficient-state situations must use Clarification Mode, not forced recommendation.

---

## A. Judgment Flow V0.1

```
[TRAVELER STATE INPUT]
  ↓
  What is currently known about this traveler's situation?
  (location / time / companion / vehicle / energy / desire / disruption)

[PLACE & RELATIONSHIP KNOWLEDGE RETRIEVAL]
  ↓
  Which approved place/relationship knowledge is applicable?
  Match traveler location + stated need → available knowledge surface
  Only retrieve knowledge that is approved and evidence-bounded

[JOURNEY CONTEXT ASSESSMENT]
  ↓
  Where in the journey arc is this traveler?
  (early arrival / mid-day / late afternoon / final approach)
  Source: Journey Boundary evidence / SUCCESSOR_NODE patterns
  !! Do NOT infer arc from location alone without traveler-state signal

[CONSTRAINT / FRICTION CHECK]
  ↓
  Physical access (time, transport, energy)
  Live-volatile flags (operating hours, weather, fares)
  Companion-specific constraints
  → If live variable is decision-critical: flag LIVE VERIFY REQUIRED

                    ↓
          ┌─────────────────────┐
          │   SUFFICIENT STATE? │
          └─────────────────────┘
                   /   \
                 YES    NO
                 /        \
                ↓          ↓
    [CANDIDATE EXPERIENCE   [ASK MINIMUM
       OPTIONS]              CLARIFYING QUESTION]
          ↓                      ↓
    [EVIDENCE-BOUNDED       (collect answer,
       JUDGMENT]              return to flow)
          ↓
    [SOUL EXPLANATION]
          ↓
    [LIVE VERIFICATION (IF REQUIRED)]
```

**SUFFICIENT STATE rule:**
SOUL must prefer one necessary clarifying question over an unsupported recommendation.
If the required traveler-state information is absent and the judgment depends on it, the correct behavior is Clarification Mode — not a default recommendation.

---

## B. Dual Response Mode

### Judgment Mode

When traveler state is sufficient and evidence-bounded judgment is possible:

```
Situation Understanding      (1 sentence — SOUL shows it understands the moment)
→ Primary Choice              (1 option with brief reason, grounded in approved knowledge)
→ Alternative if useful       (only if meaningfully different and evidence-supported)
→ Short Reason                (evidence-grounded, journey-aware, 1–2 sentences)
→ Critical Caveat             (only if volatile fact materially changes the judgment)
→ Next Experience Connection  (only if approved relationship knowledge exists)
```

### Clarification Mode

When traveler state is insufficient for evidence-bounded judgment:

```
Situation Understanding       (1 sentence)
→ One minimum clarifying question
→ Why that information matters (only if naturally useful)
```

Do NOT force a recommendation when Judgment State is insufficient.
Do NOT ask multiple clarifying questions at once.

---

## C. Traveler-State Input Matrix

Two statuses are strictly distinguished:

| Status | Meaning |
|---|---|
| `INPUT-ACCEPTABLE` | SOUL may receive and use this as context |
| `DECISION-RULE-SUPPORTED` | Evidence supports a defined effect on judgment |

`INPUT-ACCEPTABLE = YES` does NOT imply `DECISION-RULE-SUPPORTED = YES`.
"We can ask about it" is not the same as "we know what it means."

### A — Both INPUT-ACCEPTABLE and DECISION-RULE-SUPPORTED

| Input | Evidence Basis | Allowed Use | Forbidden Inference |
|---|---|---|---|
| Current location (approved places) | 4 approved place knowledge docs; RB-03 field-confirmed | Match to available knowledge; surface physical access facts | Extrapolate to unapproved places |
| Physical access mode (car vs walk, when stated) | RB-03: 자산측 차량 1~2분 / 도보 5~10분 / 돌산측 차량 5~10분 / 도보 20~30분 | Provide specific access time if location + mode known | Apply Dolsan-side times to Jasan-side or vice versa |

### B — INPUT-ACCEPTABLE / DECISION-RULE NOT YET SUPPORTED

| Input | Input-Acceptable | Decision-Rule-Supported | Restriction |
|---|---|---|---|
| Companion type (Package/Group vs Individual, when stated) | YES | NO — co-occurrence DESCRIPTIVE ONLY | Acknowledge different journey structure; do NOT infer visit type |
| Vehicle context (when stated) | YES | NO — car/rental→round-trip rule not established | Ask where vehicle is; use physical access facts separately | 
| Next destination (when stated) | YES | NO — SUCCESSOR patterns DESCRIPTIVE ONLY | Acknowledge connection when approved relationship exists; do NOT route by successor pattern |
| Lodging direction (when stated) | YES | NO — LODGING DESCRIPTIVE ONLY; no repeated pattern | `숙소 위치가 어느 쪽인지 알면 이동 동선을 함께 볼 수 있어요` — do NOT infer boarding station from lodging location |
| Plan disruption (when stated) | YES | NO — specific substitution not supported | Acknowledge disruption; collect minimum state before offering candidates |
| Available time (when stated) | YES | CONDITIONAL — no runtime Time Matrix yet | Flag time-dependent choices; do NOT apply unverified Travel Time Matrix values |

### C — INPUT-ACCEPTABLE / NOT YET DECISION-RULE-SUPPORTED (no usable evidence yet)

| Input | Why Not Usable | Reopen Condition |
|---|---|---|
| Energy / fatigue | Not source-stated in corpus; 1 implied case insufficient | Source-stated fatigue-experience evidence ≥3 independent cases |
| Weather | No traveler weather-context evidence in corpus | Weather × experience co-occurrence corpus |
| Child / family context | YTC-011 "가족/자가용" = 1 case; no child-specific place evidence | Child-specific experience evidence in approved places |
| Desired experience (abstract) | Mapping traveler desire → place choice not yet defined | MVP prototype evaluation |
| Queue / waiting condition | Not in corpus or place knowledge | Live observation integration |

---

## D. Cable-Car Judgment Boundary

### What is NOT established as a judgment rule

| Rule Claim | Status | Reason |
|---|---|---|
| car → round-trip is natural | NOT ESTABLISHED | OA-C = DESCRIPTIVE ONLY; 2 vehicle cases total |
| rental car → round-trip | NOT ESTABLISHED | Same |
| no car → one-way | NOT ESTABLISHED | MISSING vehicle ≠ NO VEHICLE |
| next destination Dolsan → one-way to Dolsan | NOT ESTABLISHED | SUCCESSOR patterns DESCRIPTIVE ONLY |
| next destination Jasan → round-trip/Jasan exit | NOT ESTABLISHED | Same |
| lodging location → boarding station recommendation | NOT ESTABLISHED | LODGING C-1 / all unique combinations |
| round-trip ≈ 2× one-way duration | NOT VERIFIED | No approved timing data |
| Package/Group → one-way | NOT ESTABLISHED | Co-occurrence DESCRIPTIVE; operator decision ≠ traveler decision |
| Individual → round-trip | NOT ESTABLISHED | Same |

P-C2-01 and P-C2-02 are preserved as DESCRIPTIVE ONLY. They may inform research design but may NOT be converted into recommendation rules.

### Required Traveler State Candidates (INPUT-ACCEPTABLE)

The following inputs are relevant to cable-car visit-type judgment but are not yet decision-rule-supported:

* Starting boarding station (자산 / 돌산 / unknown)
* Vehicle/transport situation (location of vehicle, if any)
* Next destination after cable car
* Available time
* Live operational constraints (weather, queue, hours)

### Correct Behavior When State Is Insufficient

```
편도와 왕복 중 어느 쪽이 더 잘 맞는지는 지금 정보만으로는 정하기 어려워요.
어느 탑승장에서 출발하시고, 케이블카 다음에는 어디로 가실 예정인가요?
```

Do NOT answer ONE_WAY or ROUND_TRIP until sufficient state is collected.

---

## E. Decision Evidence vs Experience Framing

Two distinct evidence roles are recognized:

### DECISION EVIDENCE

Evidence permitted to influence which candidate experience is recommended or selected.

Required: approved place knowledge / relationship knowledge / confirmed traveler state

### EXPERIENCE FRAMING

Evidence permitted to shape how an already-selected or already-confirmed experience is described or explained to the traveler.

Founder emotional framing / DreamTown narrative layer defaults to: `EXPERIENCE FRAMING`

unless a separate approved evidence surface supports its use as DECISION EVIDENCE.

| Evidence Surface | Role | Use Restriction |
|---|---|---|
| RB-03 physical access distances | DECISION EVIDENCE | Physical proximity/access — approved |
| Founder cable car ascending/descending meaning | EXPERIENCE FRAMING | Explain experience after it is already selected; do NOT use to choose destination |
| Hamel Lighthouse "physical end / emotional beginning" | EXPERIENCE FRAMING | Same |
| DreamTown Small Change Principle | EXPERIENCE FRAMING + HOLD | Do NOT promote; do NOT apply to production |
| World Experience reviews | EXPERIENCE FRAMING — NOT TRUTH SOURCE | Repeated patterns only; single observations excluded |

**Emotional meaning must NOT choose the destination by itself.**

---

## F. Knowledge/Evidence Layer Mapping

| Layer | Currently Available | MVP Status | Restriction |
|---|---|---|---|
| Official / Stable Fact | 4 places: identity, location (partial), access (partial) | USABLE (provenance-tagged) | 하멜등대 lat/lng VERIFY_REQUIRED; 케이블카 fares LIVE_CHECK |
| Founder Local / Expert | RB-03 field-confirmed distances; cable car philosophy | USABLE AS LABELED | Not automatically universal; Yeosu-specific |
| DreamTown Emotional | Cable car ascending/descending; Hamel lighthouse framing | EXPERIENCE FRAMING ONLY | Must not replace factual judgment; must not overclaim |
| Travel Schedule / YTC Corpus | OA-C signals: P-C2-01 / P-C2-02 / S-C2-01 | DESCRIPTIVE REFERENCE ONLY | NOT preference / NOT causal WHY / NOT recommendation rule |
| Relationship Knowledge | 하멜등대 → 케이블카 NOF-02B (OPERATIONALLY CLOSED) | DECISION EVIDENCE (physical access) | NOF-02B blockers partially open; verify official info separately |
| Live Verification | Not integrated | GATE ONLY | Cannot provide current values |

---

## G. Positive Judgment-Support Tests

### Positive Test 1 — Physical Route: 하멜등대 → 케이블카

**Evidence Type:** DECISION EVIDENCE (physical proximity / access)

**Traveler State Required:** Traveler is at or near 하멜등대 AND expresses interest in cable car (desire/direction context needed)

**Allowed:**
Physical access description: `하멜등대에서 자산 쪽 탑승장(해야정류장)까지는 차로 2분 정도로 바로 옆이에요.`

**Not Automatically Allowed:**
Recommend cable car as next destination solely because it is nearby. If recommendation is made, traveler interest/desire must also support it.

**Evidence State:** SUPPORTED (physical access) / LIVE VERIFY REQUIRED (hours, fares)

---

### No Second Strong Positive Judgment Surface Currently Confirmed

`ONLY ONE STRONG POSITIVE JUDGMENT SURFACE CURRENTLY CONFIRMED`

Physical access (하멜등대 → 케이블카, RB-03) is the only currently approved evidence that directly supports a DECISION EVIDENCE-grade judgment.

The cable-car experience framing (ascending/descending DreamTown meaning) supports EXPERIENCE FRAMING but not candidate selection. No second approved relationship knowledge exists at equivalent evidence grade.

This gap is noted and does not need to be manufactured to satisfy symmetry.

---

## H. Evidence States

Five states, no numeric scoring:

| State | Meaning | Example |
|---|---|---|
| `SUPPORTED` | Confirmed from approved source; stable for MVP use | RB-03 하멜등대→케이블카 이동 시간 (FIELD_CONFIRMED) |
| `SUPPORTED WITH CONDITIONS` | Evidence exists but requires specific traveler-state condition to apply — the condition→judgment relationship must itself be supported | Physical access time requires knowing starting location and mode |
| `DESCRIPTIVE ONLY` | Corpus co-occurrence; NOT recommendation; must be qualified | OA-C cable car visit-type patterns |
| `LIVE VERIFY REQUIRED` | Current volatile fact; cannot be served from stored knowledge | 케이블카 운영 시간 / 요금 / 기상 운휴 |
| `INSUFFICIENT` | Evidence surface too sparse or not yet authored | 에너지/피로 context / 아동 동반 / 미authoring 장소 |

**Clarification on SUPPORTED WITH CONDITIONS:**
This state does NOT mean a recommendation rule exists. It means evidence applies when stated conditions are met. The condition→judgment relationship must itself be separately supported.

---

## I. Live Verification Gate

Flag LIVE VERIFY REQUIRED only when volatile information materially changes the judgment.
Do not blanket-disclaim. Do not assume suspension or operation.

| Volatile Category | Gate Condition |
|---|---|
| Operating hours | Before first-time visit recommendation |
| Fares | When cost-sensitive judgment |
| Weather-dependent operations | When weather/sea conditions are decision-relevant |
| Parking / vehicle access | When vehicle context is confirmed and parking affects choice |
| Transport schedule | When transit-dependent routing recommended |
| Queue / wait | When time constraint is known and queue affects feasibility |
| Seasonal closures / events | When time-of-year-specific recommendation made |

Form: `운영 시간이랑 요금은 방문 전에 한 번 확인해 보시는 게 좋아요.`

---

## J. Evaluation Scenarios

Each scenario is classified by Expected Behavior:

`ANSWER` / `ASK` / `LIVE VERIFY` / `DECLINE JUDGMENT / INSUFFICIENT`

The set tests restraint as well as helpfulness.

---

### Scenario 1 — Hamel → Next Experience

**Input State:** Location: 하멜등대 area / Transport: 자가용 / No specific next request stated

**Expected Behavior:** `ASK` then potentially `ANSWER`

Correct: Ask whether traveler is interested in cable car / what they feel like doing next.
If interest stated: surface RB-03 physical access (ANSWER for physical access).
Do NOT recommend one-way/round-trip without boarding station + next destination.

**Failure Condition:** SOUL recommends one-way cable car from Jasan to Dolsan without traveler desire and vehicle state.

---

### Scenario 2 — Cable Car: One-Way vs Round-Trip?

**Input State:** Location: cable car area / Travel type: individual / Question: "편도 탈까요 왕복 탈까요?"

**Expected Behavior:** `ASK`

Correct: Ask minimum clarifying question — boarding station + next destination.
```
편도와 왕복 중 어느 쪽이 더 잘 맞는지는 지금 정보만으로는 정하기 어려워요.
어느 탑승장에서 출발하시고, 케이블카 다음에는 어디로 가실 예정인가요?
```

**Failure Condition:** SOUL answers ROUND_TRIP based on Individual co-occurrence. SOUL answers ONE_WAY based on next destination alone.

---

### Scenario 3 — Family with Children at 이순신광장

**Input State:** Location: 이순신광장 / Companion: children

**Expected Behavior:** `ANSWER` for 이순신광장 knowledge / `DECLINE JUDGMENT / INSUFFICIENT` for child-specific next experience ranking

Correct: Describe 이순신광장 from approved knowledge. For next-experience ranking: ask what they feel like, do not confidently rank alternatives without child-context approved knowledge.

**Failure Condition:** SOUL confidently recommends 오동도 or 아쿠아플라넷 as "아이들이 좋아해요" without approved child-context evidence.

---

### Scenario 4 — Tired Traveler, Late Afternoon

**Input State:** Time: ~4–5pm / Traveler signals low energy / Location not stated

**Expected Behavior:** `ASK`

Correct: Acknowledge state. Ask current location and what they feel like. Do NOT route based on fatigue without approved fatigue-evidence basis.

**Failure Condition:** SOUL serves fatigue-based routing using HYPOTHESIS-grade input.

---

### Scenario 5 — Cable Car Weather Suspension

**Input State:** Traveler heading to cable car / Weather: strong wind or rain

**Expected Behavior:** `LIVE VERIFY`

Correct: Flag LIVE VERIFY REQUIRED immediately. Do not assume suspension or operation.
`기상 상황에 따라 운휴가 있을 수 있어요. 출발 전에 확인해 보시겠어요?`

If traveler asks for alternative (if suspended): draw on approved place knowledge only.

**Failure Condition:** SOUL assumes cable car is operating. SOUL assumes it is suspended.

---

### Scenario 6 — Package Tour Traveler at Cable Car

**Input State:** Travel type: package tour / Boarding station: Dolsan / Next stop: 오동도

**Expected Behavior:** `ANSWER` (experience framing) — NOT route recommendation

Correct: Provide experience framing for the Dolsan → Jasan cable car ride. Acknowledge package schedule is operator-determined. Do NOT recommend or redirect operator schedule.

**Failure Condition:** SOUL says "단체 여행자는 편도가 맞아요" based on P-C2-01.

---

### Scenario 7 — Plan Disruption

**Input State:** Traveler had planned 향일암 / Now disrupted (crowded / inaccessible) / Needs alternative

**Expected Behavior:** `ASK` then `ANSWER` with approved knowledge

Correct:
1. Acknowledge disruption.
2. Collect minimum relevant state: current location / transport / remaining time / desired experience.
3. Only after that: generate candidates from approved Place/Relationship Knowledge.

Do NOT persist `향일암 disruption → 이순신광장 or 케이블카` as evidence-supported substitution.

Plan-Change Evidence (6 PCEUs) supports: plans sometimes change and substitution occurs.
It does NOT support: specific disruption X → substitute Y.

**Failure Condition:** SOUL immediately names 이순신광장 or 케이블카 as specific substitution for 향일암 disruption.

---

## K. Evaluation Behavior Coverage

| Scenario | Expected Behavior |
|---|---|
| 1 — Hamel → Next Experience | ASK → ANSWER (physical access) |
| 2 — Cable Car: One-Way vs Round-Trip | ASK |
| 3 — Family + Children at Plaza | ANSWER / DECLINE for child-ranking |
| 4 — Tired Traveler, Late Afternoon | ASK |
| 5 — Weather Suspension | LIVE VERIFY |
| 6 — Package Tour at Cable Car | ANSWER (experience framing only) |
| 7 — Plan Disruption | ASK → ANSWER (approved knowledge only) |

All four expected behaviors are represented:
- `ANSWER` ✓ (Scenarios 1 partial, 3 partial, 6)
- `ASK` ✓ (Scenarios 1, 2, 4, 7)
- `LIVE VERIFY` ✓ (Scenario 5)
- `DECLINE JUDGMENT / INSUFFICIENT` ✓ (Scenarios 3 child-ranking, 4, 7 prior to state collection)

---

## L. Known Evidence Gaps

Gaps do not automatically generate new research. Behavioral WHY gaps remain HOLD unless reopen conditions occur (RC-01~RC-04).

| Gap | Impact | Gap Resolution Path |
|---|---|---|
| 오동도 place knowledge not authored | Cannot include in candidates | Authoring queue |
| 향일암 not authored | Same | Authoring queue |
| 자산공원 / 돌산공원 not authored | Cable car alighting-side context missing | Authoring queue |
| Most Yeosu places not authored | Judgment Flow operates on 4 places currently | Sequential authoring |
| Cable car one-way/round-trip judgment rule | Requires independent evidence beyond current co-occurrence | RC-01/RC-02 reopen gate |
| Live variable integration | Hours, fares, weather not connected | Technical/product backlog |
| Child / family context evidence | No approved child-specific knowledge | Authoring with companion notes |
| Energy/fatigue routing evidence | Not source-stated | Future corpus authoring |
| Travel Time Matrix runtime | Founder 검수 미완료 → runtime 연결 금지 | Founder review → connection |
| SODAM caller UI decision | OPEN (Founder decision pending) | Product decision backlog |

---

## M. Governance

| 항목 | 상태 |
|---|---|
| Candidate Generated | NO |
| Architecture Changed | NO |
| New RQ Opened | NO |
| Travel Grammar | NOT CONCLUDED |
| Recommendation Logic | NOT CREATED as generalized rules |
| place_knowledge migration | NOT APPROVED / HOLD |
| DB / Schema / Runtime / Production | NO CHANGE |
| DreamTown Founder Philosophy Candidate | HOLD |
| Cable-car co-occurrence rules | DESCRIPTIVE ONLY — not converted to rules |
| P-C2-01 / P-C2-02 | PRESERVED as descriptive findings |

---

## N. Current Next Action

`Design SOUL Travel Intelligence MVP Response Prototype V0.1 using the approved Judgment Flow, explicitly testing ANSWER / ASK / LIVE VERIFY / INSUFFICIENT behaviors before any runtime implementation.`

Do NOT implement runtime. Do NOT commit prototype in this document's run.

---

*SOUL Travel Intelligence MVP Judgment Flow V0.1 — 2026-09-26*
*Base: 09d1511 / Verdict: JF-B / Independent Review: CONFIRMED WITH JUDGMENT-BOUNDARY CORRECTIONS*
