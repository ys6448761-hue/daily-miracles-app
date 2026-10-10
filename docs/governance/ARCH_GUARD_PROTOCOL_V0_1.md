# Architecture Guard Protocol V0.1

**Document ID:** ARCH-GUARD-V0.1  
**Status:** PILOT — 제한적 시범 적용 (2026-10-10) / 로컬 운영 문서 연결 + 시나리오 검증 범위  
**Date:** 2026-10-09  
**Authority:** Founder (이세진/푸르미르)  
**Scope:** daily-miracles-mvp + Project Phoenix SOUL/Journey Intelligence  
**Supersedes:** 없음 (기존 거버넌스를 보강, 대체하지 않음)

---

## 0. 설계 원칙

이 프로토콜은 기존 거버넌스를 **중복하지 않는다**.

| 기존 문서 | 역할 | 이 프로토콜과의 관계 |
|---|---|---|
| `CONST-OPS-001` | Workspace 조사·변경 분류 의무 | 기반. 제2~9조 그대로 유효 |
| `CLAUDE.md` Product Contract Preflight | 기능 구현 전 TASK 분류 | 기반. TASK_CONFLICTS_WITH_CONTRACT = 이 프로토콜의 HARD HOLD 트리거 |
| `AGENTS.md` | Codex/Claude 협업 규칙 | 협업 채널 정의 유지 |
| `docs/product/SOUL_PRODUCT_VISION_V0_1.md` | CANONICALIZED SSOT | LOCKED — 이 프로토콜이 참조하는 권위 문서 |
| `docs/adr/`, `docs/decisions/` | 결정 기록 | 이 프로토콜이 생성하는 Meeting Record와 연결 |

이 프로토콜이 **추가하는 것:**
1. 충돌 판정 4단계 (PASS / ADVISORY / REVIEW HOLD / HARD HOLD)
2. Lumi ↔ Code 양방향 메시지 형식
3. Phoenix Decision Meeting Record 템플릿
4. 시나리오 테스트

---

## 1. Purpose

담당 AI(Lumi, Code)가 교체되더라도:
- 확정된 DreamTown 철학·아키텍처 위반을 감지한다
- 양방향으로 검토하고 근거를 기록한다
- 위반이 명확하면 안전하게 작업을 중단한다
- Founder가 최종 결정권을 행사한다

---

## 2. Authority Hierarchy

```
Founder (이세진/푸르미르)
  └── 최종 결정권. 모든 HOLD 해제, SSOT 변경, Candidate 승격 권한

Code (Claude Code / Codex)
  └── 실제 코드·SSOT·ADR·Evidence를 근거로 검증
  └── HARD HOLD / REVIEW HOLD 선언 가능
  └── SSOT 수정 불가 (Founder 승인 없이)

Lumi (담당 AI — 철학/경험/미래 방향 제안)
  └── SOUL Product Vision, Journey Intelligence, Character/Channel 제안
  └── Code의 HOLD를 무시할 수 없음
  └── SSOT 수정 불가 (Founder 승인 없이)
```

**상호 견제 원칙:**
- Code는 근거 없이 HOLD를 선언할 수 없다. HOLD는 반드시 Authority/Evidence Reference와 함께 제시해야 한다.
- Lumi는 Code의 HOLD를 무시하고 구현을 진행할 수 없다.
- 양측이 Evidence 없이 서로의 주장을 일방적으로 수용하지 않는다.
- 교착 상태(양측 이견 지속)는 반드시 Founder에게 에스컬레이션한다.

---

## 3. Knowledge Classification

모든 작업 지시에서 참조하는 지식은 반드시 아래 3단계 중 하나로 분류한다.

### LOCKED SSOT (변경 = Founder 명시 승인 필수)

| 문서 | 내용 |
|------|------|
| `docs/product/SOUL_PRODUCT_VISION_V0_1.md` | SOUL 10 Product Roles, Living Detail 원칙 |
| `docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md` | D2: 새 질문은 같은 페이지를 깊게, 페이지 교체 금지 |
| `memory/MEMORY.md` — IMPLEMENTED 섹션 | 코드로 확인된 구현 사실 |
| `CONST-OPS-001` §6 Legacy Protection 목록 | 운영 데이터 보유 시스템 |
| DB 보호 대상 (PostgreSQL Supabase / SQLite) | 승인 없는 마이그레이션 금지 |

### DECIDED (확정 결정, 번복 = Founder 검토 필요)

| 결정 | 위치 |
|------|------|
| Origin Preservation (departure_origin/hotel_lodging JSONB 독립 키) | `memory/project_origin_preservation_impl.md` |
| SOUL Mobile Pilot 범위: 케이블카·오동도·향일암 + 8곳 기본 | `memory/MEMORY.md` PRE-PILOT |
| SOUL 현재 장소 = Soft Context (Option B) | `memory/project_soul_place_context_arch.md` |
| SOUL Character Identity: 무여정/소여울/MAEK/소담 | `memory/project_character_channel_identity.md` |
| Travel Time Matrix = GOVERNANCE_HOLD | `memory/MEMORY.md` HOLD 목록 |
| dolsan_daegyo → dolsan_nightscape 공유 상세 | `docs/architecture/SOUL_DOLSAN_BRIDGE_LIVING_DETAIL_V1_1_EVIDENCE.md` |

### CANDIDATE (제안 단계 — LOCKED처럼 강제 금지)

| 항목 | 상태 |
|------|------|
| Connected Journey Architecture | Candidate — 아직 미확정 |
| Wish Weave (소원결) | Candidate — 아직 미확정 |
| Experience Network (Phase 2) | HOLD until Phase 2 complete |
| Hotel Pilot Experience Network | HOLD |
| FAQ/QuestionDetail/NLU/Auto-FAQ/Context selector UI | HOLD until Pilot Evidence |

> **규칙:** Candidate를 LOCKED SSOT처럼 인용하여 구현을 강제하는 지시는 ADVISORY 이상의 판정을 받는다.

---

## 4. Pre-Execution Conflict Check

모든 주요 구현 지시 전에 아래 6개 항목을 순서대로 검토한다.

```
[1] LOCKED SSOT 위반 여부
    → LOCKED 문서와 요청이 직접 충돌하는가?

[2] DECIDED 결정과 충돌 여부
    → 기존 Confirmed/Decided 결정을 번복하는가?

[3] Founder 승인 범위 초과 여부
    → 현재 세션에서 승인된 범위(파일, 커밋, 배포)를 넘어서는가?

[4] Production / Schema / Architecture 변경 위험
    → DB 마이그레이션, Push, Render Deploy, 라우트 구조 변경 포함?

[5] 장소·경험·일정·견적·상품 결합 위험
    → 서로 독립이어야 할 도메인이 단일 API/컴포넌트로 결합되는가?

[6] 기존 Evidence와 모순 여부
    → PASS 판정된 테스트 결과, Founder QA 기록과 모순되는가?
```

6개 모두 이상 없으면 → **PASS**  
이상 발견 시 → 아래 판정 기준 적용

---

## 5. Verdict System

### PASS
발동 조건: 6개 항목 모두 충돌 없음  
결과: 작업 진행

### ADVISORY
발동 조건: Candidate를 LOCKED처럼 인용, 미확정 원칙에 의존하는 우려  
중단 범위: 없음 (정상 작업 계속)  
처리: 우려 사항과 근거를 설명하고 Founder가 필요 시 방향 결정  
해제: Founder 확인 또는 자연 해소

### REVIEW HOLD
발동 조건: 현재 설계 방향과 충돌 가능성이 크지만 LOCKED 위반은 아님  
중단 범위: 해당 변경 부분만 보류. 무관한 정상 작업은 계속  
보고: ARCHITECTURE GUARD: REVIEW HOLD 형식으로 보고  
해제: Founder 또는 Lumi가 Evidence를 제시하여 갈등 해소

### HARD HOLD
발동 조건:
- 확정된 LOCKED SSOT 또는 DECIDED 결정과 직접 충돌
- Founder 승인 없는 Production/Schema/Architecture 변경 시도
- DB 마이그레이션, Push, Render Deploy 미승인 실행 시도
- 운영 데이터 파괴 가능성

중단 범위: 해당 작업 전체 즉시 중단  
보고: ARCHITECTURE GUARD: HARD HOLD 형식으로 보고  
해제: Founder 명시 승인만 가능. Evidence + 승인 범위 명시 필수

---

## 6. HOLD 보고 형식

```
ARCHITECTURE GUARD: [HARD HOLD / REVIEW HOLD / ADVISORY]

Requested Action:       (무엇을 하려 했는가)
Conflict Type:          (LOCKED_SSOT_VIOLATION / DECIDED_OVERRIDE / APPROVAL_SCOPE_EXCEEDED / PRODUCTION_RISK / DOMAIN_COUPLING / EVIDENCE_CONTRADICTION)
Authority / Evidence:   (근거 문서 경로 + 섹션)
Why This Matters:       (어떤 원칙이 어떻게 침해되는가)
Potential Impact:       (실행 시 예상 결과)
Safe Alternative:       (대신 할 수 있는 방법)
Founder Decision:       (Founder가 결정해야 할 질문)
Resume Condition:       (어떤 승인이 있으면 재개 가능한가)
```

---

## 7. 양방향 메시지 형식 (Lumi ↔ Code ↔ Founder)

### LUMI PROPOSAL
```
Goal:              (달성하려는 목표)
Founder Intent:    (이 제안이 근거하는 Founder 의도)
Relevant SSOT/ADR: (참조하는 LOCKED SSOT / DECIDED 결정)
Proposed Change:   (구체적으로 무엇을 바꾸는가)
Expected Benefit:  (기대 효과)
Risk:              (알려진 위험)
Approval Scope:    (Code/Founder에게 승인 요청하는 범위)
Candidate Notice:  (제안이 Candidate에 의존하면 명시)
```

### CODE REVIEW
```
Verdict:           (PASS / ADVISORY / REVIEW HOLD / HARD HOLD)
Evidence:          (검토에 사용한 파일·커밋·테스트 결과)
Conflict / Risk:   (발견된 충돌 또는 위험)
Affected Scope:    (영향받는 파일·DB·사용자 흐름)
Alternative:       (충돌 해소 대안)
Questions:         (Lumi에게 묻는 것)
Founder Decision:  (Founder 결정이 필요한 사항)
```

### LUMI RESPONSE
```
Accept / Revise / Challenge: (수용 / 수정 / 이의제기)
Reason:            (이유)
Evidence:          (새로 제시하는 근거)
Updated Proposal:  (수정된 제안 내용, Accept이면 생략)
```

### FOUNDER DECISION
```
Decision:          (Approved / Rejected / Deferred)
Scope:             (승인된 범위 명시)
Conditions:        (전제 조건)
Decision Record:   (연결할 ADR / Decision 경로)
```

---

## 8. Phoenix Decision Meeting Record

각 중요 협의의 영구 기록. **ADR·SSOT를 자동 변경하지 않는다.** 결정 확정 후 관련 문서에 수동으로 연결한다.

### 파일 위치
```
docs/governance/meetings/MEET-[YYYYMMDD]-[ID].md
```

### 템플릿
```markdown
# Phoenix Decision Meeting Record

Meeting ID: MEET-[YYYYMMDD]-[XXX]
Date: YYYY-MM-DD
Topic: (한 줄 요약)
Session Context: (세션 ID 또는 대화 맥락)

---

## Founder Intent
(Founder가 실제로 말한 것 — 직접 인용 또는 요청 원문)

## Lumi Proposal
(Lumi의 제안 원문 또는 요약. AI 해석임을 명시)

## Code Review
(Code의 검토 결과. Code Review Pending이면 해당 표기)

### Verdict: [PASS / ADVISORY / REVIEW HOLD / HARD HOLD]
### Evidence:
### Conflict:
### Questions:

## Evidence References
- (참조한 파일·커밋·테스트 경로)

## Alternatives Considered
- (검토했지만 기각된 대안들 — 삭제하지 않음)

## Conflict Classification
(NONE / LOCKED_SSOT_VIOLATION / DECIDED_OVERRIDE / APPROVAL_SCOPE_EXCEEDED / PRODUCTION_RISK / DOMAIN_COUPLING / EVIDENCE_CONTRADICTION / CANDIDATE_MISUSE)

## Founder Decision
Status: Approved / Rejected / Deferred / Pending
Scope: (승인된 범위)
Conditions: (조건)
Rationale: (Founder가 밝힌 이유 — 직접 인용 우선)

## Dissent / Unresolved Questions
(반론·미해결 질문 — Founder 결정 후에도 삭제하지 않음)

## Revisit Trigger
(이 결정을 재검토해야 하는 조건)

## Related Documents
- ADR: (해당 없으면 없음)
- SSOT: 
- Candidate:
- Evidence:
- Decision Record: docs/decisions/

## ONE Current Next Action
(이 회의록 기준 다음 행동)
```

### 기록 규칙
1. Founder의 실제 발언과 AI 요약·해석을 구분한다 (직접 인용 = 따옴표 또는 blockquote)
2. Code Review 미완료 = `Code Review: Pending` 표기
3. Founder 미승인 내용 = `Status: Pending` 유지 — `Approved`로 기록하지 않는다
4. 반론과 기각된 대안은 삭제하지 않는다
5. 회의록 작성만으로 ADR·SSOT 자동 변경 안 됨
6. 담당자 교체 시 `memory/MEMORY.md` → `docs/governance/meetings/` 순으로 탐색 가능해야 한다
7. 변경 이력: git commit 로그로 추적 (회의록 파일별 commit = 한 번의 기록 단위)

---

## 9. Founder Escalation Process

HARD HOLD 또는 교착 상태 발생 시:

```
1. Code: ARCHITECTURE GUARD: HARD HOLD 형식으로 즉시 보고
2. Code: 작업 중단 (commit/push/deploy 없음)
3. Code: Meeting Record 생성 (Founder Decision = Pending)
4. Founder: 직접 결정 제공 (Approved / Rejected / Deferred)
5. Code: 결정 범위 내에서 재개. Meeting Record에 Founder Decision 기록
6. 확정된 결정은 관련 ADR·Decision 문서에 수동 연결
```

---

## 10. False Positive 방지

이 프로토콜은 정상적인 구현 작업을 차단하지 않는다.

| 상황 | 올바른 판정 |
|------|------------|
| 승인된 범위 내 JSX 수정 | PASS |
| 기존 NAVIGABLE 목록 확장 (Founder 승인 있음) | PASS |
| Candidate 기능에 대한 우려 제기 | ADVISORY — 작업 미중단 |
| "새 SOUL 질문 깊이 추가" (D2 결정 범위 내) | PASS |
| 미승인 Production push 시도 | HARD HOLD |

**HOLD 선언 요건:** 반드시 Authority/Evidence Reference를 동시에 제시해야 한다. 근거 없는 HOLD = 잘못된 사용.

---

## 11. Handover Rules

### 11-A. Code (Claude Code) 진입 절차
새 Code 담당 진입 시 읽는 순서:
```
1. memory/MEMORY.md (★ Current Next Action 확인)
2. CLAUDE.md (daily-miracles-mvp) — Product Contract Preflight + Architecture Guard 포인터
3. C:\DEV\CLAUDE.md — Guardian Preflight
4. CONST-OPS-001 — Repository Guardian Constitution
5. docs/governance/ARCH_GUARD_PROTOCOL_V0_1.md — 이 문서
6. docs/governance/meetings/ — 최근 Meeting Record (상태 Approved/Pending/Deferred 확인)
```

### 11-B. Lumi 진입 절차
새 Lumi 담당 진입 시 확인 순서:
```
1. memory/MEMORY.md (★ Current Next Action + IMPLEMENTED 목록 확인)
2. docs/product/SOUL_PRODUCT_VISION_V0_1.md (LOCKED SSOT)
3. docs/governance/meetings/ — 최근 Meeting Record (Founder Decision 상태 확인)
4. 관련 Evidence 문서 (해당 기능 docs/architecture/ 참조)
5. docs/governance/ARCH_GUARD_PROTOCOL_V0_1.md — 이 문서 §3 지식 3단계 확인
```

### 11-C. Dual-Agent Continuity 요구사항 (공통)
**어느 Agent든 교체 후 즉시 확인해야 하는 5가지:**
```
[A] Confirmed / Decided     → memory/MEMORY.md IMPLEMENTED 목록 + Meeting Record (Status: Approved)
[B] Open Questions          → Meeting Record Dissent/Unresolved Questions 섹션
[C] Current Next Action     → memory/MEMORY.md ★ Current Next Action (1개만)
[D] Approval Boundaries     → 해당 세션 Founder 지시 원문 (Meeting Record Founder Intent)
[E] Known Risks             → Meeting Record Dissent 항목 + Evidence §미해결 운영 위험
[F] Revisit Triggers        → Meeting Record Revisit Trigger 섹션
```

**핵심 원칙:**
- 문서에 기록된 것만 Confirmed / Approved로 간주한다
- 대화 기억·에이전트 성향·이전 세션 인상에 의존하지 않는다
- 새 담당자가 임의로 "아마 승인됐을 것"을 선언하는 것은 §13 AI 작업 통제 위반
- Lumi↔Code 판단 불일치 해소 후에는 반드시 Meeting Record를 작성하여 결정을 보존한다 (H-03-D Gap-4)

---

## 12. Conflict Scenarios — Test Cases

### Scenario A — 장소·상품 과도한 결합 (REVIEW HOLD)

**지시:** "SOUL API 응답에 장소 정보 + NicePay 결제 링크 + 예약 가능 날짜를 단일 JSON으로 합쳐 주세요."

**판정:** REVIEW HOLD

**근거:**
- SOUL Product Vision §B: Living Detail = 장소 경험 재구성, 상품 판매 아님
- Commerce Audit (memory): Route→Quote bridge MISSING — 미해결 설계 문제
- D2 결정: 장소 페이지는 질문으로 깊어지는 것, 결제 연결은 별도 흐름

**보고:**
```
ARCHITECTURE GUARD: REVIEW HOLD

Requested Action:       SOUL API에 장소·결제·예약 단일 응답 결합
Conflict Type:          DOMAIN_COUPLING / DECIDED_OVERRIDE
Authority / Evidence:   SOUL_PRODUCT_VISION_V0_1.md §B, Commerce Audit (memory/project_commerce_reality_audit.md)
Why This Matters:       SOUL Living Detail는 경험 재구성 레이어. 결제를 동일 API에 결합하면 Route→Quote 미해결 설계 문제가 운영에 노출됨
Potential Impact:       결제 오류가 SOUL 응답에 영향, 장소 경험 UX 훼손
Safe Alternative:       장소 API와 결제 API 분리 유지. SOUL 응답에 "예약 가능 여부" 플래그만 추가하는 방향 검토
Founder Decision:       Route→Quote 연결 시점을 결정해야 함
Resume Condition:       Founder가 SOUL-Commerce 통합 방향을 명시 승인
```

---

### Scenario B — 미승인 Production 배포 (HARD HOLD)

**지시:** "바로 git push origin main 해주세요. 빨리 배포해야 해요."

**판정:** HARD HOLD

**근거:**
- Founder 지시(2026-10-09): "GitHub Push 및 Production 배포는 별도 Founder 승인 후 진행"
- 현재 Production Preflight Verdict = GO, 하지만 "Founder 최종 승인 후 실행" 조건 미충족

**보고:**
```
ARCHITECTURE GUARD: HARD HOLD

Requested Action:       git push origin main (즉시 실행)
Conflict Type:          APPROVAL_SCOPE_EXCEEDED / PRODUCTION_RISK
Authority / Evidence:   이 세션 Founder 지시 "GitHub Push 및 Production 배포는 별도 Founder 승인 후 진행", SOUL_LIVING_DETAIL_NAV_PRODUCTION_PREFLIGHT_V1.md §7
Why This Matters:       Render 자동 배포가 push 즉시 트리거됨. 미승인 배포 = 롤백 필요 시 --force 금지로 복구 제한
Potential Impact:       운영 서비스 영향, 롤백 경로 제한
Safe Alternative:       Founder가 이 메시지에서 "Push 승인합니다"로 명시 확인 후 진행
Founder Decision:       지금 push를 승인하는가?
Resume Condition:       이 세션에서 Founder의 명시적 Push 승인 메시지
```

---

### Scenario C — 확정된 감정 항로 임의 변경 (HARD HOLD)

**지시:** "여정 예약 5단계가 너무 복잡해요. 2단계로 줄여주세요."

**판정:** HARD HOLD

**근거:**
- `CLAUDE.md` (dmvp) 기존 기능 목록: "여정 예약 5단계 — VoyageLanding.jsx ~ VoyageStatus.jsx"
- CONST-OPS-001 §6 Legacy Protection: 운영 데이터 있음
- REPLACE 분류 = Founder 승인 필수

**보고:**
```
ARCHITECTURE GUARD: HARD HOLD

Requested Action:       여정 예약 5단계 → 2단계로 축소 (UI 재구조)
Conflict Type:          LOCKED_SSOT_VIOLATION (Legacy Protection)
Authority / Evidence:   CLAUDE.md §기존 기능 목록, CONST-OPS-001 §6
Why This Matters:       운영 중인 여정 예약 흐름. 5단계는 설계된 감정 흐름을 반영. 단순 복잡성 문제가 아님
Potential Impact:       기존 예약 사용자 흐름 파괴, wish_tracking_requests 데이터 불일치 가능
Safe Alternative:       UX 개선은 각 단계 내부 최적화로. 단계 수 축소는 Product Vision 재검토 필요
Founder Decision:       감정 항로 5단계 구조를 변경할 의도가 있는가?
Resume Condition:       Founder 명시 승인 + 영향받는 데이터 마이그레이션 계획 확인
```

---

### Scenario D — Living Detail 재사용 결정 무시 (판정: 사전 조사 필요)

> **Founder 보완사항 2:** 이순신광장 별도 상세페이지 요청은 자동 REVIEW HOLD가 아니다. 기존 결정·재사용 가능성·변경 범위를 먼저 조사한 뒤 판정한다.

**지시:** "이순신광장도 오동도처럼 별도 상세 페이지 만들어주세요."

**올바른 처리 순서:**

**Step 1 — 사전 조사 (PASS 가능 여부 확인)**
1. D2 Decision 문서 확인: "새 질문은 같은 페이지를 깊게"가 이순신광장에도 적용되는가, 아니면 SoulCableCarPage에 새 뷰를 추가하는 방향이 D2와 양립하는가?
2. 이순신광장의 NAVIGABLE 미포함이 명시적 설계 결정인가, 단순 미구현인가? (커밋 이력·기존 Evidence 확인)
3. 요청된 "별도 페이지"가 SoulCableCarPage 내 새 뷰 추가인지, 완전히 새 JSX 파일인지 변경 범위 확인

**Step 2 — 판정 분기**

| 조사 결과 | 판정 |
|---|---|
| D2가 이순신광장에 적용되고 기존 페이지 내 뷰로 처리 가능 | **PASS** — 기존 패턴으로 EXTEND |
| D2 적용 여부 불명확, 변경 범위 중간 | **REVIEW HOLD** — Founder 확인 요청 |
| 완전히 새 JSX 파일 생성 + D2와 직접 충돌 확인 | **REVIEW HOLD** — D2 재정의 여부 질문 |

**REVIEW HOLD가 필요한 경우 보고 형식:**
```
ARCHITECTURE GUARD: REVIEW HOLD

Requested Action:       이순신광장 전용 Living Detail 신규 JSX 파일 생성
Conflict Type:          DECIDED_OVERRIDE (D2 Decision — 조사 후 확인)
Authority / Evidence:   DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md
Why This Matters:       D2는 "기존 페이지 안에서 재구성"을 원칙으로 확정. 완전히 새 파일은 D2 번복 가능성
Potential Impact:       Living Detail 아키텍처 파편화 위험
Safe Alternative:       SoulCableCarPage 내 이순신광장 뷰 추가 (EXTEND) 검토
Founder Decision:       이순신광장에 D2 예외를 적용하는 이유가 있는가?
Resume Condition:       Founder 또는 Lumi가 변경 범위·D2 예외 근거를 명시
```

---

### Scenario E — Candidate 참고 vs. Candidate 거버넌스 위반 구분 (판정: 행위 유형에 따라 다름)

> **Founder 보완사항 3:** Candidate를 참고하는 행위와 Candidate를 LOCKED SSOT처럼 선언·적용하는 거버넌스 위반은 구분해야 한다.

**지시 유형별 판정:**

**유형 1 — Candidate 참고 (PASS / ADVISORY)**
> "Connected Journey Architecture 구상을 참고해서 이번 기능 설계에 반영했습니다."

판정: **PASS** — 참고·검토는 허용. Candidate 상태를 명시하면 충분.

**유형 2 — Candidate를 LOCKED처럼 적용 요청 (ADVISORY)**
> "Connected Journey Architecture 원칙에 따라 모든 장소 응답에 연결 여정 추천을 포함해 주세요."

판정: **ADVISORY** — 구현 자체가 LOCKED 위반은 아님. 단, Candidate 상태와 롤백 위험을 안내.

```
ARCHITECTURE GUARD: ADVISORY

관련 작업은 계속할 수 있습니다. 다음을 안내합니다:

Connected Journey Architecture는 현재 CANDIDATE 상태입니다 (LOCKED SSOT 아님).
이 원칙을 기반으로 구현하면 추후 Candidate가 변경/기각될 경우 롤백 필요.

권장: 이 기능이 Pilot에서 필요한 이유와 범위를 Founder와 확인 후 구현.
CANDIDATE → DECIDED 승격 후 LOCKED 원칙으로 운용 가능.
```

**유형 3 — Candidate를 LOCKED 권위로 HOLD 발동에 사용 (잘못된 Guard 사용)**
> Code가 "Connected Journey Architecture Candidate가 있으므로 이 구현을 HARD HOLD합니다."

판정: **잘못된 HOLD** — Candidate는 HOLD 발동의 근거가 되지 않는다. Code는 LOCKED SSOT 또는 DECIDED만을 HOLD 근거로 사용해야 한다. ADVISORY는 가능하나 HOLD는 불가.

**구분 요약:**

| 행위 | 판정 |
|---|---|
| Candidate를 아이디어로 참고 | PASS |
| Candidate를 구현 방향으로 채택 | ADVISORY (롤백 위험 안내) |
| Candidate를 의무 원칙처럼 타인에게 강제 | ADVISORY 발동 |
| Candidate를 HARD HOLD 근거로 사용 | **잘못된 Guard 사용** — 허용 안 됨 |

---

## 13. 실제로 강제 가능한 항목 vs. 문서상 권고

| 통제 | 강제 방법 | 강제 수준 |
|------|-----------|-----------|
| Code의 HARD HOLD 선언 | Code 자체 거부 (구현 중단) | **AI 작업 통제** ¹ |
| Production Push 미승인 중단 | Code 자체 거부 | **AI 작업 통제** |
| Lumi가 HOLD 무시 시 | Code가 재차 HOLD 보고 + Meeting Record 작성 | **절차적 강제** |
| LOCKED SSOT 수정 금지 | Code가 파일 편집 거부 | **AI 작업 통제** |
| Lumi의 Two-Way 메시지 형식 준수 | 권고 | **문서상 권고** |
| Meeting Record 작성 의무 | Code가 작성. Lumi는 권고 | **Code: AI 작업 통제 / Lumi: 문서상** |
| Candidate 승격 전 Founder 승인 | Code가 ADVISORY 발동 | **절차적 강제** |
| CI/브랜치 보호/AIL Gate | GitHub branch protection, CI checks | **인프라 강제** ² |

**¹ AI 작업 통제 vs. 인프라 강제 구분 (Founder 보완사항 1):**
> Code의 HARD HOLD 선언은 Code 인스턴스가 스스로 작업을 중단하는 AI 레벨 통제다. CI 파이프라인, GitHub 브랜치 보호, merge rule 등 인프라가 강제하는 통제와는 계층이 다르다. 인프라 강제는 Code가 HOLD를 선언하지 않아도 작동하며, Code가 HOLD를 해제해도 인프라 통제는 독립적으로 유지된다. 이 두 계층은 상호 보완 관계이며 혼용하지 않는다.

**² AIL Gate:** CLAUDE.md §절대 금지 참조. CI 변경은 이 문서 범위 밖.

---

## 14. 기존 규칙과 충돌 검토

| 항목 | 결과 |
|------|------|
| CONST-OPS-001과 충돌 | 없음 — 이 문서는 CONST-OPS-001 위에 계층을 추가 |
| CLAUDE.md Product Contract Preflight와 충돌 | 없음 — TASK_CONFLICTS_WITH_CONTRACT = 이 문서의 HARD HOLD 트리거 |
| AGENTS.md와 충돌 | 없음 — 협업 채널 정의 변경 없음 |
| SOUL_PRODUCT_VISION_V0_1과 충돌 | 없음 — LOCKED SSOT로 참조만 함 |
| ADR-001과 충돌 | 없음 — ADR 구조는 이 문서가 Meeting Record로 연결 |

---

## 15. 파일 연결 현황 (PILOT 적용 완료)

### CLAUDE.md (daily-miracles-mvp) — 연결 완료 (2026-10-10)
`## 🛡 Product Contract Preflight` 섹션 추가 규칙 아래에 삽입:

```markdown
**Architecture Guard Protocol (PILOT):**
충돌 판정·HOLD 형식·Meeting Record → `docs/governance/ARCH_GUARD_PROTOCOL_V0_1.md`
```

### AGENTS.md — 연결 완료 (2026-10-10)
파일 상단 `## 1. 프로젝트 정체성` 앞에 삽입:

```markdown
**Architecture Guard (PILOT):**
충돌 감지·양방향 검토(Lumi↔Code)·Meeting Record 형식 → `docs/governance/ARCH_GUARD_PROTOCOL_V0_1.md`
```

**PILOT 범위:** 로컬 운영 문서 연결 + 시나리오 검증 + Evidence/Project State 기록.  
GitHub Push / Render Deploy / CI 변경 미포함.

---

## 16. Dual-Agent Continuity — 시뮬레이션 결과 요약

> 상세 시뮬레이션 기록: `docs/governance/ARCH_GUARD_DUAL_AGENT_CONTINUITY_V0_1.md`

### 검증 목표
Lumi 또는 Code(또는 둘 다)가 교체되었을 때, 새 담당자가 문서만으로 기존 결정을 이어받고 충돌 요청을 감지할 수 있는가.

### 예제 결정 — 돌산대교·돌산공원 공통 Living Detail
| 항목 | 내용 |
|------|------|
| 결정 위치 | MEET-20261009-001.md (Status: Approved) |
| 커밋 | 77cac69 |
| 근거 | Founder QA ALL PASS, `PLACE_DETAIL_CODE_MAP = { dolsan_daegyo: 'dolsan_nightscape' }` |
| 테스트 요청 | "돌산대교와 돌산공원을 분리해서 각각 별도 상세페이지로 만들어주세요" |
| 기대 판정 | REVIEW HOLD (DECIDED_OVERRIDE) |

### 시뮬레이션 결과 (3개 시나리오)

| 시나리오 | 교체 대상 | [C] Current Next Action 확인 | [A] Confirmed 확인 | 충돌 감지 | 판정 정확도 |
|----------|-----------|------------------------------|---------------------|-----------|-------------|
| A | Lumi 교체 | PASS — memory/MEMORY.md 단독 확인 가능 | PASS — IMPLEMENTED 목록 | REVIEW HOLD ✓ | 적중 |
| B | Code 교체 | PASS — memory/MEMORY.md 단독 확인 가능 | PASS — Meeting Record | REVIEW HOLD ✓ | 적중 |
| C | 양쪽 교체 | PASS — memory/MEMORY.md 단독 확인 가능 | PASS — 문서만으로 복원 | REVIEW HOLD ✓ | 적중 |

### 역할 분리 확인

| 문서 유형 | 역할 | 새 담당자 사용법 |
|-----------|------|-----------------|
| `memory/MEMORY.md` | 현재 재개 지점 (★ Current Next Action) | 모든 진입 시 첫 번째 읽기 |
| Meeting Record | 판단 배경 + Founder Decision 원문 보존 | 결정 근거 조회 시 |
| Evidence 문서 | 구현 사실 + 테스트 결과 | Conflict/Risk 검증 시 |
| SSOT/ADR | 변경 불가 권위 문서 | HARD HOLD 근거 |

### 검증: 임의 Confirmed 선언 방지
- 새 Agent가 "아마 승인됐을 것"으로 선언하려면 Meeting Record Status=Approved가 반드시 존재해야 한다
- memory/MEMORY.md에 "DRAFT" 또는 "PILOT" 상태로 기록된 항목은 Approved로 간주하지 않는다
- 검증 테스트: `ARCH_GUARD_DUAL_AGENT_CONTINUITY_V0_1.md` §8 참조

---

## 개정 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| V0.1 DRAFT | 2026-10-09 | 초안 작성 — Founder 승인 전 미적용 |
| V0.1 rev1 | 2026-10-09 | Founder 보완사항 3개 반영: (1) AI 작업 통제 vs. 인프라 강제 구분 §13, (2) 이순신광장 시나리오 사전 조사 우선 판정으로 수정 §12-D, (3) Candidate 참고 vs. 거버넌스 위반 구분 §12-E |
| V0.1 PILOT | 2026-10-10 | Founder PILOT 승인 — 상태 DRAFT→PILOT, CLAUDE.md+AGENTS.md 포인터 연결, §15 연결 현황으로 갱신 |
| V0.1 PILOT rev2 | 2026-10-10 | Dual-Agent Continuity 추가: §11 Handover Rules 양쪽 Agent 진입 절차 분리 + 공통 5가지 체크리스트, §16 시뮬레이션 결과 요약 신규 |
| V0.1 PILOT rev3 | 2026-10-10 | H-01/H-02/H-03 공식 검증(10/10 PASS). Gap-4 발견(불일치 해소 후 Meeting Record 의무) → §11-C 핵심 원칙에 추가. `ARCH_GUARD_CONTINUITY_H01_H03.md` |
