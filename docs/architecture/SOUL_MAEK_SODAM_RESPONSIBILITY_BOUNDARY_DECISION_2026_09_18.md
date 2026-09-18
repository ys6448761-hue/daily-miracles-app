# SOUL × MAEK × SODAM Responsibility Boundary Decision

**Status:** CONFIRMED — Founder Approved (2026-09-18)
**Authority:** Founder Decision (2026-09-18)
**Candidate Updated:** `docs/constitution/candidate/CAND-CHAR-001_Character_Channel_Identity.md` Section 0A

---

## Decision

### 1. MAEK owns continuity persistence

SOYEOWOOL-MAEK (소여울-맥) is the continuity layer.
MAEK's canonical question: **"우리는 이 소원이와 어디까지 함께 왔는가?"**

MAEK holds: WHO / NOW / STORY / OPEN / NEXT / CONFIRMED / INFERRED / UNKNOWN / MOMENTS.

**Current runtime status:** DESIGNED_ONLY — not yet implemented.
`travel_guide_sessions` remains the short-term memory layer (D1, PRESERVE).

---

### 2. SOUL reads continuity; SOUL does not own persistence

SOUL (소울) / SOYEOWOOL (소여울) is the orchestrator.
SOUL's canonical question: **"지금 이 소원이에게 누가 일해야 하는가?"**

SOUL reads MAEK's context packet on each turn.
SOUL is stateless between turns — it does not store context itself.

**Risk prevented:** Without this boundary, SOUL becomes a stateful god-object,
contradicting the core Phoenix architecture principle:
> "SOYEOWOOL은 기억을 독점하지 않고, 판단을 독점하지 않고,
> 실행을 독점하지 않는다."

---

### 3. SODAM is hospitality judgment, not orchestration

SODAM (소담) is a Domain Worker.
SODAM's canonical question: **"이 소원이를 어떤 조건으로 모시는 것이 가장 좋은가?"**

SODAM proposes and judges. SODAM does not execute payment or booking.
Commerce / Domain executes.

Current implementation: `sodamDecisionService.js` (Kenny accommodation vertical only).
Broader SODAM (multi-resource Deal Decision): DESIGNED_ONLY.

---

### 4. Founder phrase is preserved with precision note

Founder language (brand — preserved verbatim):
> "소울은 우리가 어디까지 왔는지를 알고,
> 소담은 지금 무엇을 드리면 좋을지를 살핀다."

Technical precision (added as Section 0A in CAND-CHAR-001, NOT a replacement):
> 소울이 직접 기억하는 것이 아니다.
> 소여울-맥(MAEK)이 기억을 보관하고,
> 소울이 그 맥락을 불러와 이해·조율·연결·설명한다.

---

### 5. D1–D5 remain valid

All five Protocol V0.1 locked decisions remain valid.
Evidence: full D1–D5 readiness review completed 2026-09-18.
See: `docs/architecture/SOYEOWOOL_PROTOCOL_CONTRACT_V0_1.md`

---

### 6. Multi-trip is V0.2 scope

V0.1 Phase 1 baseline = single-intent.
Multi-trip / multi-intent explicitly deferred to Protocol V0.2.
No segments[], no multiple REQUEST envelopes in Phase 1.

---

## Responsibility Map

| Layer | Canonical Question | Responsibility | Current Status |
|---|---|---|---|
| MAEK (소여울-맥) | 우리, 어디까지 왔지? | 기억 / 연속성 | DESIGNED_ONLY |
| SOUL / SOYEOWOOL | 지금 누구에게 맡길까? | 이해 / 조율 / 라우팅 / 통합 / 설명 | DESIGNED_ONLY |
| SODAM (소담) | 지금 무엇을 드리면 좋을까? | 환대 판단 / 제안 | IMPLEMENTED (Kenny 숙박) |
| 무여정 (MUYEOJEONG) | 이 소원이에게 무엇이 좋은가? | Travel Intelligence | IMPLEMENTED |
| FLOW | 지금 실제로 무엇을 사용할 수 있는가? | Availability | IMPLEMENTED (Kenny) |
| Commerce | 거래를 어떻게 실행할 것인가? | 실제 거래 실행 | IMPLEMENTED |

---

## What Does NOT Change

- `sodamDecisionService.js` name, location, contract — PRESERVE
- `travelGuideService.js` 8-filter cascade — PRESERVE
- `travel_guide_sessions` short-term memory layer (D1) — PRESERVE
- `sessionService.js` — PRESERVE
- Aurum in WishGate — PRESERVE
- D1–D5 locked decisions — PRESERVE

---

## Implementation Gate

Phase 1 implementation gate has NOT yet passed:

| Gate | Status |
|---|---|
| Protocol V0.1 LOCK | COMPLETE (2026-09-12) |
| Phase 1 Scope Finalization | NOT DONE |
| Adapter strategy approved | NOT DONE |
| Team assignment / timeline | NOT DONE |

**CURRENT NEXT ACTION:**
SOYEOWOOL PHASE 1 SCOPE FINALIZATION — define minimum runtime scope without implementing it.

---

## Evidence References

| Claim | Source |
|---|---|
| MAEK = memory custodian | SOYEOWOOL_PROTOCOL_CONTRACT_V0_1.md, Line 45 |
| SOUL = stateless orchestrator | SOYEOWOOL_PROTOCOL_CONTRACT_V0_1.md, Authority table |
| D1–D5 LOCKED | SOYEOWOOL_PROTOCOL_CONTRACT_V0_1.md, Lines 1951–1957 |
| Implementation gate not passed | SOYEOWOOL_PROTOCOL_CONTRACT_V0_1.md, Lines 1985–1990 |
| SODAM = Kenny accommodation only | CAND-CHAR-001_Character_Channel_Identity.md, Lines 163–167 |
| travelGuideService PRESERVE | SOYEOWOOL_CORE_CONTRACT_MAPPING_V0_1.md, Lines 200–205 |
| Multi-trip = V0.2 | SOYEOWOOL_PROTOCOL_CONTRACT_V0_1.md (all 6 routing cases single-intent) |

---

*Created: 2026-09-18*
*Trigger: SOUL × SODAM Character Definition + D1–D5 Implementation Readiness Review*
