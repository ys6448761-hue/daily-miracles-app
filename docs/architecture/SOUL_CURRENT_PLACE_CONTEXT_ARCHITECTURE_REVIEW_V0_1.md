# SOUL Current Place Context Architecture Review V0.1

**Type:** Architecture Decision / Project State Continuity
**Date:** 2026-10-06
**Status:** DECIDED — Implementation GO for Place-Specific Query V0.1

This is NOT a new SSOT. This records the current architecture decision and continuity for the next Lumi/developer handover.

---

## 1. Background

**Founder question:** 메인과 장소 Living Detail에 있는 질문창은 서로 다른 SOUL인가?

**Decision: NO.**

사용자 입장에서는 하나의 SOUL이다.

Main / Place Living Detail / future Question Detail은 동일한 SOUL Conversation을 사용한다.

차이는 질문창 자체가 아니라 SOUL이 가지고 있는 Context다.

| 화면 | Context |
|---|---|
| Main | question + traveler context |
| Place Living Detail | question + traveler context + current place context |
| (future) Question Detail | same SOUL, deeper place context |

---

## 2. Verified Problem

Open-Ended Place Question Trace V0.1에서 확인.
Evidence: `docs/architecture/SOUL_OPEN_ENDED_PLACE_QUESTION_TRACE_V0_1.md`

현재 routing은 3개 경로만 존재:
- Discovery
- Journey Planning
- Journey Decision

세 경로 이후 명확한 Current Place 질문을 처리할 경로가 없어 CLARIFICATION으로 빠진다.

**Failing examples (production confirmed):**

| 질문 | 실제 결과 | 기대 결과 |
|---|---|---|
| 왕복이 나아 편도가 나아? | CLARIFICATION | B: JUDGMENT |
| 비 오면 못 타? | CLARIFICATION | B/D |
| 휠체어 타셔도 탈 수 있어? | CLARIFICATION | A (hedged) |
| 얼마나 걸려? | CLARIFICATION | A: ANSWER (12~13분 VERIFIED) |
| 포토존 알려 줘 | CLARIFICATION | E: TRUE_KNOWLEDGE_GAP |
| 얼마야? | Hotel 견적 오라우팅 | A (hedged) |

**Root cause:** Missing Current-Place Question handling gate.

---

## 3. Team Review

**Claude Code:**
- 조건부 찬성
- 새 taxonomy가 아니라 gate 하나
- Option B 권장 (`_isPlaceSpecificQuery`, place_code 존재 시만 활성화)
- existing routing/Journey Continuity 보존
- Pilot 전에 구현 (파일럿 신뢰 손상 방지)

**Komi (운영/확장성):**
- Current Place는 기본값이지 울타리가 아님
- Silent mis-scope 위험 주의
- 답변에서 어느 장소 기준인지 자연스럽게 드러낼 것
- Knowledge가 없으면 정직한 UNKNOWN/VERIFY

**Jaemi (UX/대화 자연스러움):**
- 하나의 SOUL + Soft Context
- 내부 분류는 사용자에게 보이지 않아야 함
- Context Trap 방지
- 명확한 장소 단문은 재질문 없이 답변

**Park (실제 여행자 질문 유형):**
- Current Place / Outward Discovery / Journey 전환 패턴 제시
- 실제 질문 로그 기반 FAQ 발전 제안
- 단, 보고서의 빈도/비율 수치는 Pilot Evidence가 아니므로 canonical fact로 사용하지 않음
- Dynamic FAQ / NLU clustering / automatic fallback은 현재 구현 결정으로 채택하지 않음

---

## 4. Current Architecture Decision

**Core Principle:**

> "사용자는 하나의 SOUL에게 그냥 묻는다.
> SOUL은 현재 화면의 장소를 기본 Context로 이해하되,
> 사용자의 명시적 질문 의도가 언제나 화면 Context보다 우선한다."

**Safety Principle:**

> "Context는 답의 범위를 정하는 힌트이지,
> Knowledge가 없을 때 다른 답을 만들어내는 허가가 아니다."

**Operating interpretation:**

```
Current Place Context = DEFAULT
NOT BOUNDARY / NOT PRISON.

Explicit user intent can override Current Place.
```

---

## 5. V0.1 Implementation Decision

**GO: Option B**

Existing gates preserved:
```
Discovery
Journey Planning
Journey Decision
↓
if unresolved + place_code exists
↓
Place-Specific Query  ← NEW
↓
Clarification (only when genuinely required)
```

**Do NOT build:**
- Large intent taxonomy
- Context Engine
- New Recommendation Engine
- NLU clustering system
- Dynamic FAQ generator
- New schema / migration / seed
- Automatic Knowledge creation

---

## 6. Knowledge Safety

Current Place question does NOT authorize invention.

| Situation | Action |
|---|---|
| Canonical Phoenix Knowledge supports answer | → answer |
| Knowledge exists but not connected | → connect existing knowledge |
| Volatile / current operation status | → VERIFY boundary |
| Unsupported / unknown | → UNKNOWN / VERIFY |

**Never:** unsupported current-place question → silently change scope → answer a different Discovery question.

---

## 7. Context Mis-Scope Risk

Future Pilot must observe:

- Generic clarification rate
- Wrong-place assumption / user correction rate
- Questions that explicitly name another place
- Multi-place / Journey questions
- Questions that leave Current Place scope
- UNKNOWN / VERIFY questions
- Repeated real-user questions
- Answer → next-question / abandonment behavior

Do not assume frequency before Pilot evidence.

---

## 8. FAQ / Question Detail Status

Direction is promising but **NOT DECIDED.**

Potential future model:

```
SOUL Conversation
Living Detail
FAQ / Question Detail
```

All may present the same Phoenix Knowledge / Judgment through different entry/depth.

FAQ must NOT become a second Knowledge source.
Do not create FAQ architecture from assumed questions.
First collect real Pilot questions.

Question logs may become Evidence for:
```
Repeated Question
→ Review
→ Verified Answer representation
→ Possible FAQ / Question Detail
```

No automatic promotion.

---

## 9. HOLD (until Pilot Evidence)

- FAQ / Question Detail architecture
- Dynamic Question Mining
- Auto-FAQ
- NLU clustering
- Context selector UI
- Page-to-page context policy expansion
- Large intent taxonomy

---

## 10. Current Next Action (exactly 1)

**SOUL PLACE-SPECIFIC QUERY V0.1**
implementation + regression verification.

After PASS: Pre-Pilot Readiness Check.

Do not start FAQ architecture before this blocker closes.

---

## 11. Continuity Note

**Future Lumi must NOT restart this discussion from zero.**

Start from:
1. This Architecture Review
2. `docs/architecture/SOUL_OPEN_ENDED_PLACE_QUESTION_TRACE_V0_1.md`
3. Place-Specific Query V0.1 implementation/evidence (when created)
4. Latest Project State
5. Current Next Action

Re-open architecture only if:
- Production evidence conflicts
- Pilot shows significant mis-scope
- New routing architecture appears
- Phoenix Knowledge model changes
