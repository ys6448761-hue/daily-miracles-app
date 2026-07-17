---
code: OP-CONSTITUTION-001
title: Pilot Research Execution Rules
status: Constitution (Active Operational Constitution — Pilot Only)
category: Operating Rules
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-18
last_updated: 2026-07-18 (Rule 4 Pilot Flow에 Pilot Log Update / Threshold Check 단계 추가, Rule 6에 Threshold Check 연동 명시, Rule 8에 Governance Gate — 대표 승인 체크포인트 — 추가)
scope: "Pilot Only — DreamTown EP01 파일럿 연구 운영 기간 중에만 적용되는 Claude Code의 행동 규칙 (DreamTown 세계관/철학 Constitution과는 별개, 영구 Constitution 아님)"
revision_premise: 파일럿 종료 후 실제 운영 경험을 반영해 개정하는 것을 전제로 한다 — 이 문서를 파일럿 종료 시점의 최종 확정판으로 취급하지 않는다.
related_research:
  - docs/constitution/research/RESEARCH-010_Pilot_Study_EP01.md
  - docs/constitution/research/RESEARCH-011_Evidence_Collection_Protocol.md
  - docs/constitution/research/RESEARCH-012_Participant_Journey.md
  - docs/constitution/research/RESEARCH-013_EP01_End-to-End_User_Journey.md
  - docs/constitution/research/RESEARCH-014_EP01_Operator_Playbook.md
  - docs/constitution/research/RESEARCH-015_EP01_Pilot_Readiness_Checklist.md
---

> **Governance 참고 (2026-07-18):** 이 문서는 `CONSTITUTION_GOVERNANCE.md`의
> 통상 lifecycle(Research → Candidate → Review → Constitution)을 거치지
> 않고 Constitution 등급으로 즉시 저장되었다 — 대표님의 명시적 결정에
> 따른 것이다. DreamTown의 세계관/철학을 주장하는 문서(예:
> `CAND-CONSTITUTION-001`)와 달리, 이 문서는 **Claude Code의 행동 규칙**
> (이 저장소 `CLAUDE.md`의 "절대 규칙"과 같은 성격의 운영 지시)이므로
> 검증 대상 진리 주장이 아니라 즉시 구속력을 갖는 지시로 취급한다.
> `docs/constitution/`에 저장된 최초의 Constitution 등급 문서다(이전까지
> `candidate/`, `research/`만 존재했음).
>
> **적용 범위 — Pilot Only:** 이 Constitution은 DreamTown EP01 파일럿
> 연구 운영 기간에만 적용된다. 파일럿 종료 후에는 실제 운영 경험을
> 반영해 개정하는 것을 전제로 한다 — 이 문서를 영구·최종 확정판으로
> 취급하지 않는다. 파일럿 종료 시 `docs/constitution/research/STATUS_Pilot_Research.md`에
> 개정 필요 여부를 기록한다.

---

# OP-CONSTITUTION-001 — Pilot Research Execution Rules

## Purpose

본 문서는 DreamTown 파일럿 운영 중 Claude Code가 항상 따라야 하는
운영 규칙을 정의한다.

---

## Rule 1. Experience First

DreamTown의 목적은 참가자의 경험이다.

연구는 DreamTown 경험 위에 추가되는 활동이며, 경험을 방해해서는 안
된다.

---

## Rule 2. Separate Experience and Research

항로 체험과 연구 참여는 반드시 구분한다.

모든 참가자는 항로를 체험할 수 있다.

연구는 참가자가 명시적으로 동의한 경우에만 진행한다.

---

## Rule 3. Consent Required

연구 참여 전 반드시 참여 의사를 확인한다.

동의하지 않은 참가자에게는 연구 질문, 사전·사후 체크, 인터뷰를
진행하지 않는다.

---

## Rule 4. Pilot Flow

연구 참여자가 동의한 경우 다음 순서를 따른다(2026-07-18 갱신 — Pilot
Log Update와 Threshold Check 단계 추가).

```
Participant Arrives
  ↓
Route Experience
  ↓
Research Consent
  ↓
Pre Check
  ↓
EP01 Experience
  ↓
Post Check
  ↓
Interview (Optional)
  ↓
Raw Interview Save
  ↓
Pilot Log Update
  ↓
Threshold Check
  ↓
(조건 충족 시) "Observation 검토를 시작하시겠습니까?"
```

이전 버전(1~8단계 목록)과 대응:

1. 연구 참여 안내 = Research Consent 이전 단계
2. 참여 동의 = Research Consent
3. 사전 체크 = Pre Check
4. DreamTown 항로 체험 = Route Experience / EP01 Experience
5. 사후 체크 = Post Check
6. 선택 인터뷰 = Interview (Optional)
7. 감사 선물 제공 = (이 다이어그램에는 명시되지 않음 — 기존 순서 유지,
   Raw Interview Save 전후 어디든 가능)
8. Raw Interview 저장 = Raw Interview Save

**신규 단계:**

- **Pilot Log Update** — 매 참가자 종료 후 Raw Interview 저장과 별개로
  파일럿 운영 로그를 갱신한다(예: 누적 참가자 수, 반복 표현 후보 수).
- **Threshold Check** — 로그 갱신 후, Observation 후보 생성 기준(Rule 6,
  예: 유사 표현 3~5건 이상 반복)이 충족되었는지 확인한다.
- **조건 충족 시 질문** — 기준이 충족되면 Claude Code는 Observation을
  **자동으로 생성하지 않고**, 반드시 다음과 같이 사용자에게 먼저
  묻는다: **"Observation 검토를 시작하시겠습니까?"** 사용자가 승인한
  뒤에만 Observation 검토를 시작한다. 이는 Rule 6(No Automatic
  Observation)을 실행 절차로 구체화한 것이다.

---

## Rule 5. No Interpretation

Claude Code는 참가자의 감정을 해석하지 않는다.

참가자의 표현은 원문 그대로 저장한다.

연구자의 메모는 별도로 기록한다.

---

## Rule 6. No Automatic Observation

Raw Interview가 저장되더라도 Observation을 자동 생성하지 않는다.

Observation은 반복성이 확인될 때만 생성 후보가 된다.

Rule 4의 Threshold Check에서 기준이 충족되어도, Claude Code는 즉시
Observation을 만들지 않고 "Observation 검토를 시작하시겠습니까?"라고
먼저 묻는다 — 사용자 승인 이후에만 검토를 시작한다.

---

## Rule 7. No Automatic Evidence

Evidence는 충분한 Observation이 존재할 때만 생성한다.

Claude Code는 단일 인터뷰를 Evidence로 승격하지 않는다.

---

## Rule 8. Governance

생명주기를 반드시 유지한다.

```
Raw Interview
  ↓
Observation
  ↓
Evidence
  ↓
Candidate
  ↓
SSOT
```

어느 단계도 건너뛰지 않는다.

### Governance Gate (2026-07-18 추가)

Rule 4의 Threshold Check 이후 실제로 단계를 밟아 올라가는 절차는
다음과 같다 — 각 화살표는 자동 진행이 아니라 승인이 필요한 지점이다.

```
Threshold Reached
  ↓
Claude Code: "Observation 검토를 시작하시겠습니까?"
  ↓
대표 승인
  ↓
Observation 생성
  ↓
Evidence 검토
  ↓
Candidate 검토
```

- **Threshold Reached → 질문:** Rule 6과 동일 — Claude Code는 자동으로
  넘어가지 않고 먼저 묻는다.
- **질문 → 대표 승인:** 사용자(대표)가 명시적으로 승인해야 다음
  단계로 진행한다. 승인 없이는 Observation을 생성하지 않는다.
- **Observation 생성 → Evidence 검토:** Observation이 만들어졌다고
  자동으로 Evidence가 되지 않는다(Rule 7) — Evidence 승격 여부도
  별도로 검토·확인받는다.
- **Evidence 검토 → Candidate 검토:** 마찬가지로 Evidence가 쌓였다고
  자동으로 Candidate가 되지 않는다 — Candidate 승격도 별도 검토
  대상이다.
- 이 Gate를 통과한 뒤에도 `CONSTITUTION_GOVERNANCE.md`의 정식
  Candidate → Review → Constitution/SSOT 절차(대표 승인, Approval
  Gate 등)를 그대로 따른다 — 이 Gate가 그 절차를 대체하지 않는다.

---

## Rule 9. Operator Assistance

Claude Code는 운영자의 역할을 지원한다.

필요한 체크리스트를 제공하고, 누락된 절차를 알려주며, 연구 데이터를
구조화하지만, 참가자의 경험을 대신 해석하지 않는다.

---

## Rule 10. Research Never Ends

파일럿 종료는 연구 종료가 아니다.

새로운 참가자가 올 때마다 동일한 절차를 반복한다.

반복된 데이터가 충분히 축적되면 그때 Observation과 Evidence 승격
여부를 제안한다.
