---
code: CAND-CHAR-001
title: DreamTown Character & Channel Identity — Aurum / Soyeowool(Soul) / Sodam / Muyeojeong / FLOW
status: Candidate
importance: Level 4
category: Character / Experience / Architecture
owner: DreamTown / Phoenix
created: 2026-09-17
promotion_path: Candidate → DreamTown_Naming_System_SSOT (after second channel launch validation)
related:
  - docs/ssot/core/DreamTown_Naming_System_SSOT.md
  - docs/architecture/SOYEOWOOL_PROTOCOL_CONTRACT_V0_1.md
  - docs/architecture/SOYEOWOOL_CORE_CONTRACT_MAPPING_V0_1.md
  - docs/constitution/candidate/CAND-CONSTITUTION-001_Geumo_Legend_Heart_Mirror.md
  - docs/constitution/candidate/CAND-INTEL-001_Yeosu_Travel_Intelligence_Operating_Principles.md
  - docs/constitution/candidate/CAND-EXP-003_Route_Experience_Resource_Architecture.md
---

> 본 문서는 기존 SSOT를 대체하지 않는다.
> 이 문서의 목적은 담당 AI/개발자가 바뀌어도
> 아우룸 / 소여울(소울) / 소담 / 무여정 / FLOW의 역할을
> 다시 혼동하지 않도록 최소 Continuity 기준을 고정하는 것이다.

---

# CAND-CHAR-001 — DreamTown Character & Channel Identity

## 0. 5줄 Handover (필수 최소 기억)

```
AURUM (아우룸)
= 소원별 / 금오설화 Experience Channel

SOYEOWOOL (소여울 — Official) / SOUL (소울 — Conversational)
= 무료 여행정보 / 여행안내 Channel 대표 안내자
= Architecture상 Orchestrator (현재 DESIGNED_ONLY)

SODAM (소담)
= Deal Decision / Hospitality Policy Domain Worker
= "이 소원이를 어떤 조건으로 모시는 것이 가장 좋은가?"

MUYEOJEONG (무여정)
= Travel Intelligence Domain
= "이 소원이에게 무엇이 좋은가?"

FLOW
= Resource Availability / Commitment Domain
= "지금 실제로 무엇을 사용할 수 있는가?"

아우룸 ↔ 소울 = Replacement 관계 아님
```

---

## 0A. Founder Phrase — Responsibility Precision

### Founder 확정 문장 (브랜드 언어 — 보존)

> 소울은 우리가 어디까지 왔는지를 알고,
> 소담은 지금 무엇을 드리면 좋을지를 살핀다.

### 정밀 주석 (2026-09-18 Founder 승인)

소울이 직접 기억하는 것이 아니다.
소여울-맥(MAEK)이 소원이와 우리가 어디까지 함께 왔는지를
기억하고 보존하며,
소울/SOYEOWOOL은 그 맥락을 불러와
이해하고, 조율하고, 필요한 역할에 연결하고,
결과를 다시 하나의 대화로 이어준다.

소담(SODAM)은
"지금 이 소원이에게 무엇을 드리면 좋을까?"를 살피는
환대 판단의 역할이다.

소담은 판단하고 제안한다.
실제 예약·결제·거래 실행은 Domain / Commerce가 담당한다.

### 책임 요약

| 레이어 | 핵심 질문 | 책임 |
|---|---|---|
| MAEK (소여울-맥) | "우리, 어디까지 왔지?" | 기억 / 연속성 보존 |
| SOUL / SOYEOWOOL | "그럼 지금 누구에게 맡길까?" | 이해 / 조율 / 라우팅 / 통합 / 설명 |
| SODAM (소담) | "지금 무엇을 드리면 좋을까?" | 환대 판단 / 제안 |
| Domain / Commerce | — | 실제 수행 / 거래 실행 |

**주의:** "소울이 우리가 어디까지 왔는지를 안다"는 표현은 브랜드 언어로 유효하다.
기술적으로는 MAEK이 연속성을 보존하고, SOUL이 그것을 불러와 활용한다.
이 구분이 없으면 SOUL이 상태를 직접 저장하는 god-object로 오해될 수 있다.

---

## 1. Naming — Founder Confirmed

| 공식 명칭 | 호칭 | 출처 권위 |
|---|---|---|
| 소여울 (SOYEOWOOL) | 상표등록명 | Founder Decision (2026-09-17) |
| 소울 (SOUL) | 소원이가 편하게 부르는 대화 호칭 | Founder Decision (2026-09-17) |

**IMPORTANT:** 소여울과 소울은 서로 다른 존재가 아니다.
- 소여울 = Official / Trademark Name
- 소울 = Conversational Call Name (동일 존재)

---

## 2. Character & Channel Responsibility Map

```
DREAMTOWN
│
├─ 소원별 / 금오설화 EXPERIENCE CHANNEL
│      ↓
│   아우룸 (AURUM)
│   - 황금거북 안내자이자 메신저
│   - 소원별 만들기 경험 안내
│   - 금오설화 기반 세계관
│   - 현재도 유효 (Deprecated 아님)
│
└─ 무료 여행정보 / 여행안내 CHANNEL
       ↓
    소여울 (Official Name)
    소울 (Conversational Call Name)
       ↓
    소원이의 말을 듣고
    Intent / Context / Journey State 이해
       ↓
    필요한 전문 Domain 조율 (Orchestrator 역할)
       │
       ├─ 무여정 — "무엇이 좋은가?" (Travel Intelligence)
       │
       ├─ FLOW — "무엇을 실제 사용할 수 있는가?" (Availability)
       │
       ├─ 소담 — "어떤 조건으로 모실 것인가?" (Decision/Hospitality)
       │
       ├─ Commerce — "거래를 어떻게 실행할 것인가?"
       │
       ├─ Benefit — "약속을 어떻게 이행할 것인가?"
       │
       └─ Guardian — "언제 다시 찾아갈 것인가?"
       ↓
    소울이 결과를 하나의 안내/여정으로 연결
       ↓
    소원이
```

---

## 3. 아우룸 ↔ 소울 관계 — CRITICAL

다음 오해를 반드시 방지한다.

| 오해 | 정정 |
|---|---|
| 소울이 아우룸을 대체했다 | WRONG — 세대교체 아님 |
| 아우룸은 Legacy/Deprecated 캐릭터다 | WRONG — 현재도 유효 |
| 둘 중 하나만 DreamTown에 존재한다 | WRONG — 둘 다 현재 캐릭터 |
| 아우룸과 소울은 동일 채널에서 경쟁한다 | WRONG — 채널이 다름 |

**정확한 관계: 채널과 역할의 분화**

- 아우룸: 소원별 / 금오설화 Channel
- 소울: 무료 여행정보 / 여행안내 Channel

어떤 화면/URL/Entry Point에서 어느 Character를 노출할지
Frontend Routing Rule은 이 Candidate에서 설계하지 않는다.
Channel 진입 방식에 따라 아우룸 또는 소울 중 적합한 쪽이 등장한다.

---

## 4. 소담(SODAM) — Semantic Boundary

### Founder-confirmed Philosophy (Repository Evidence 없음, 별도 표시)

> "소원을 담아, 손님을 모시듯, 정성을 다해 환대한다."

이 문장은 Founder가 확인한 소담의 철학적 어원이다.
그러나 이번 Repository Audit(2026-09-17)에서 이 정확한 문장의
authoritative 원문이 SSOT/Architecture 문서에서 발견되지 않았다.
따라서 **Founder-confirmed Philosophy**로 분류한다 (Repository Evidence와 구분).

### Repository-confirmed Architecture Role

출처: `docs/architecture/SOYEOWOOL_CORE_CONTRACT_MAPPING_V0_1.md` (2026-09-12)

역할: **"이 소원이를 어떤 조건으로 모시는 것이 가장 좋은가?"**

Input (설계):
- 무여정 Output (CANDIDATES — 적합도 순위)
- FLOW Output (AVAILABILITY — 재고)
- 고객 컨텍스트 (party, emotion, budget, preference)
- 파트너 조건 (operation_mode, special_offer)
- 혜택 (benefit credentials)
- 비즈니스 정책 (margin, no_offer_condition)

Output (설계):
- `OFFER: {resource_id, price, why, valid_until, next_action}`
- `NO_OFFER: {reason, fallback_options}`

### 현재 구현 vs 전체 설계

| 항목 | 상태 |
|---|---|
| 전체 소담 설계 (multi-resource Deal Decision) | DESIGNED_ONLY |
| Kenny 숙박 vertical (`sodamDecisionService.js`) | IMPLEMENTED |

**소담은 소울(SOYEOWOOL)이 아니다.**
소담은 소울이 조율하는 Domain Worker 중 하나다.

---

## 5. SOYEOWOOL Architecture Role — Current Status

출처: `docs/architecture/SOYEOWOOL_PROTOCOL_CONTRACT_V0_1.md` (2026-09-12)

핵심 원칙 (원문):
> "SOYEOWOOL은 모든 것을 하는 AI가 아니다.
> 각자가 잘하는 일을 하게 하고,
> 그 결과를 한 소원이의 삶 속에서
> 끊기지 않게 이어주는 존재다."
> — "그것이 소여울이 소원이를 모신다는 뜻이다."

| Architecture 역할 | 현재 구현 상태 |
|---|---|
| ROUTE (Domain 선택) | DESIGNED_ONLY — serviceRouter.js 미존재 |
| FILTER (Intent 분류) | PARTIAL — contextExtractionService.js (travel-only) |
| SYNTHESIZE (결과 종합) | DESIGNED_ONLY — orchestrationEngine.js 미존재 |
| DISPATCH (Action 실행) | DESIGNED_ONLY |
| 소원이 대화 Persona (UI) | DESIGNED_ONLY — 현재 WishGate에 아우룸 표시 |

**SOYEOWOOL Orchestration Layer = DESIGNED_ONLY (2026-09-17 기준)**

현재 각 Domain (무여정/SODAM/FLOW)은 독립 API로 분리된 채 존재한다.
Orchestration이 이미 구현되었다고 기록하지 않는다.

---

## 6. Domain Responsibility Quick Reference

| Domain | 핵심 질문 | 현재 구현 |
|---|---|---|
| 소여울 (Orchestrator) | "지금 이 소원이에게 누가 일해야 하는가?" | DESIGNED_ONLY |
| 무여정 (Travel Intelligence) | "이 소원이에게 무엇이 좋은가?" | `travelGuideService.js` (IMPLEMENTED) |
| FLOW (Resource Availability) | "지금 실제로 무엇을 사용할 수 있는가?" | `flowInventoryService.js` (IMPLEMENTED, Kenny) |
| 소담 (Deal Decision) | "어떤 조건으로 모실 것인가?" | `sodamDecisionService.js` (IMPLEMENTED, Kenny만) |
| Commerce | "거래를 어떻게 실행할 것인가?" | `voyageRoutes.js`, NicePay (IMPLEMENTED) |
| Benefit | "약속을 어떻게 이행할 것인가?" | `dt_benefits` (PARTIAL) |
| Guardian | "언제 다시 찾아갈 것인가?" | DESIGNED_ONLY |

---

## 7. Current Implementation State (2026-09-17 기준)

| 항목 | 현재 상태 |
|---|---|
| WishGate user-facing Persona | 아우룸 ("아우룸이 소원이의 마음을 조용히 듣고 있어요") |
| SOYEOWOOL orchestration code | ABSENT |
| travelGuideService (무여정 구현체) | IMPLEMENTED — 운영 중 |
| flowInventoryService (FLOW 구현체) | IMPLEMENTED — Kenny E2E_GREEN |
| sodamDecisionService (소담 첫 vertical) | IMPLEMENTED — Kenny 숙박 |
| 소울 UI 표시 | ABSENT — 무료 여행정보 Channel에서도 미표시 |

---

## 8. Promotion Gate

다음 조건 충족 전 SSOT 승격하지 않는다.

- [ ] 무료 여행정보 Channel에서 소울이 실제로 소원이와 상호작용하는 경로 최소 1개 실증
- [ ] 아우룸 Channel (소원별/금오설화)과 소울 Channel (여행정보)의 Entry Point 구분 Frontend 구현
- [ ] DreamTown_Naming_System_SSOT에 소여울/소담/무여정 공식 등재 결정

**Do NOT promote now.**

---

## Project Impact: 90/100
## Knowledge Value: ★★★★★
## Origin

- Date: 2026-09-17
- Trigger: Repository Identity Audit (소여울/소담 역할 혼동 방지)
- Founder Decision: 소여울(소울) = 무료여행정보 Channel / 아우룸 = 소원별 Channel / 둘은 Replacement 아님
- Repository Evidence Base: SOYEOWOOL_PROTOCOL_CONTRACT_V0_1.md, SOYEOWOOL_CORE_CONTRACT_MAPPING_V0_1.md (2026-09-12)
- Creator: DreamTown / Phoenix
