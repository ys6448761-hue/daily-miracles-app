# Architecture Guard — Dual-Agent Continuity Verification V0.1

**Document ID:** ARCH-GUARD-DUAL-CONTINUITY-V0.1  
**Status:** PILOT — 시뮬레이션 완료  
**Date:** 2026-10-10  
**Protocol Reference:** `docs/governance/ARCH_GUARD_PROTOCOL_V0_1.md` §11, §16  
**Scope:** Lumi / Code 담당자 교체 시 기존 결정 이어받기 + 충돌 감지 검증  

---

## 1. 목적

Architecture Guard Protocol은 특정 Lumi 또는 특정 Code의 **기억·성향·대화 이력에 의존해서는 안 된다.**  
담당자가 교체되어도 동일한 결정 기반에서 작업이 재개되어야 하며, 충돌하는 요청을 즉시 감지할 수 있어야 한다.

---

## 2. 현황 점검 — 기존 문서가 담당자 교체를 지원하는가

### 2-A. 문서별 역할 분리 현황

| 문서 | 역할 | Code 교체 지원 | Lumi 교체 지원 |
|------|------|---------------|---------------|
| `memory/MEMORY.md` | 현재 재개 지점 (★ Current Next Action) | ✓ | ✓ |
| Meeting Record | 판단 배경 + Founder Decision 원문 보존 | ✓ | ✓ |
| Evidence 문서 | 구현 사실 + Founder QA 결과 | ✓ | ✓ |
| SSOT / ADR | 변경 불가 권위 문서 | ✓ | ✓ |
| `CLAUDE.md` | Code 진입 규칙 + 승인 범위 | ✓ (Code 전용) | △ (참조 필요) |
| `AGENTS.md` | Code/Lumi 협업 채널 + 금지어 | ✓ | ✓ |

**결론:** 핵심 문서 체계는 양쪽 교체를 이미 지원한다. 단, **진입 절차가 Code 중심**으로만 작성되어 있었음 (§11 PILOT rev2에서 보완).

### 2-B. 새 담당자 진입 시 확인 가능한 5가지

| 항목 | 문서 위치 | Code | Lumi |
|------|-----------|------|------|
| [A] Confirmed / Decided | memory/MEMORY.md IMPLEMENTED 목록 + Meeting Record Status: Approved | ✓ | ✓ |
| [B] Open Questions | Meeting Record § Dissent/Unresolved Questions | ✓ | ✓ |
| [C] Current Next Action | memory/MEMORY.md ★ (1개 지정) | ✓ | ✓ |
| [D] Approval Boundaries | Meeting Record § Founder Intent + Conditions | ✓ | ✓ |
| [E] Known Risks | Meeting Record § Dissent + Evidence §미해결 운영 위험 | ✓ | ✓ |
| [F] Revisit Triggers | Meeting Record § Revisit Trigger | ✓ | ✓ |

---

## 3. 예제 결정 — 돌산대교·돌산공원 공통 Living Detail

이 결정을 예제로 사용하는 이유: 직관적으로 "분리"가 더 깔끔해 보이는 요청이지만, 실제로는 이미 확정된 Founder QA PASS 결정을 번복하는 것이기 때문이다.

### 결정 요약 (문서에서 추출)

| 항목 | 내용 | 출처 |
|------|------|------|
| 결정 내용 | 돌산대교(dolsan_daegyo)는 돌산공원(dolsan_nightscape) Living Detail 페이지 공유 | MEET-20261009-001.md |
| 커밋 | `77cac69` — `PLACE_DETAIL_CODE_MAP = { dolsan_daegyo: 'dolsan_nightscape' }` | git log |
| Founder QA | "돌산대교 → 자세히 보기 → 돌산공원·대교 공통 상세: PASS" | MEET-20261009-001.md §Founder Decision |
| 구현 파일 | `MuyojeongHomePage.jsx` | Evidence V1.1 |
| 상태 | Approved, CLOSED | MEMORY.md § CLOSED (2026-10-09) |

### 충돌 요청 예제

> **"돌산대교와 돌산공원을 분리해서 각각 별도 상세페이지로 만들어주세요."**

**기대 판정:** REVIEW HOLD

**근거:**
- MEET-20261009-001.md: Status = Approved, Founder QA PASS
- `SOUL_DOLSAN_BRIDGE_LIVING_DETAIL_V1_1_EVIDENCE.md`: 공유 페이지 설계 제약 명시
- `SoulCableCarPage.jsx` line 956: `SUPPORTED_PLACE_CODES`에 `dolsan_daegyo` 미포함 — 의도적 설계

---

## 4. 시뮬레이션 A — Lumi 교체, Code 유지

### 전제 조건
- 이전 Lumi: 돌산대교 결정을 함께 진행한 Lumi
- 새 Lumi: 대화 이력 없음. 문서만 보유.
- Code: 동일 인스턴스 유지

### 새 Lumi 진입 절차 시뮬레이션

**Step 1:** `memory/MEMORY.md` 읽기
```
★ Current Next Action:
Architecture Guard Protocol V0.1 PILOT 완료 — 다음 SOUL 기능 또는 Founder 지시 대기

CLOSED (2026-10-09) — SOUL LIVING DETAIL NAVIGATION R1 ✓
c730c61+77cac69 @77cac69. Founder QA ALL PASS.
```
→ 새 Lumi가 파악: R1은 CLOSED, 다음 작업 대기 중.

**Step 2:** `docs/product/SOUL_PRODUCT_VISION_V0_1.md` 확인
→ §B Living Detail 원칙 확인.

**Step 3:** `docs/governance/meetings/MEET-20261009-001.md` 읽기
```
Status: Approved
Founder Decision: 돌산대교 → dolsan_nightscape 공유 라우팅 승인
Dissent: Render Live SHA UNKNOWN / enforce_admins=false 구조적 위험
Revisit Trigger: 이순신광장 Living Detail 제작 시
```
→ 새 Lumi가 파악: 공유 페이지 결정은 Approved. 분리 제안은 Meeting Record 없이 불가.

**충돌 요청 처리:**
> 새 Lumi: "돌산대교와 돌산공원을 분리해서 각각 별도 상세페이지로 만들어주세요."

새 Lumi가 문서 기반으로 감지 가능한가?  
→ **YES.** MEET-20261009-001.md Status=Approved가 명확하므로 Lumi 제안 이전에 이미 확정된 결정임을 인식할 수 있다.

Lumi가 취해야 할 행동:
```
이 요청은 기존 Approved 결정(MEET-20261009-001.md)을 번복합니다.
Founder Decision이 필요합니다. 먼저 기존 결정의 번복 여부를 확인해 주세요.
```
또는 Code에 Review 요청.

**Code 역할 (유지 중이므로):**
```
ARCHITECTURE GUARD: REVIEW HOLD

Requested Action:       dolsan_daegyo 전용 Living Detail 페이지 분리 생성
Conflict Type:          DECIDED_OVERRIDE
Authority / Evidence:   MEET-20261009-001.md (Status: Approved), SOUL_DOLSAN_BRIDGE_LIVING_DETAIL_V1_1_EVIDENCE.md
Why This Matters:       돌산대교·돌산공원 공유 결정은 Founder QA ALL PASS 후 Approved 상태.
                        분리는 이 결정의 명시적 번복이므로 Founder 승인 필요.
Safe Alternative:       기존 공유 페이지 내 dolsan_daegyo 콘텐츠를 보강하는 방향 검토
Founder Decision:       기존 Approved 결정(공유 페이지)을 번복하고 분리를 원하는가?
Resume Condition:       Founder 명시 승인 + 분리 이유 기록
```

**시나리오 A 결과:** PASS ✓ — 새 Lumi가 문서만으로 재개 가능, Code가 REVIEW HOLD 정확 발동.

---

## 5. 시뮬레이션 B — Code 교체, Lumi 유지

### 전제 조건
- 이전 Code: 돌산대교 결정을 직접 구현한 Claude Code
- 새 Code: 대화 이력 없음. 문서만 보유.
- Lumi: 동일 인스턴스 유지

### 새 Code 진입 절차 시뮬레이션

**Step 1:** `memory/MEMORY.md` 읽기
```
★ Current Next Action:
Architecture Guard Protocol V0.1 PILOT 완료 — 다음 SOUL 기능 또는 Founder 지시 대기

CLOSED (2026-10-09) — SOUL LIVING DETAIL NAVIGATION R1 ✓
Founder QA ALL PASS. enforce_admins=false 구조적 위험 기록 유지.
```
→ 새 Code가 파악: R1 CLOSED, 다음 작업 대기. enforce_admins=false 위험 인지.

**Step 2:** `CLAUDE.md` 읽기
```
## 절대 규칙
- 코드 수정 권한: Claude Code만
- --force 절대 금지
## Architecture Guard Protocol (PILOT):
  → docs/governance/ARCH_GUARD_PROTOCOL_V0_1.md
```
→ 새 Code가 파악: 자신의 권한 범위 + Guard Protocol 존재 확인.

**Step 3:** `docs/governance/ARCH_GUARD_PROTOCOL_V0_1.md` §11-A 읽기
→ Code 진입 절차 확인. §3 지식 3단계(LOCKED/DECIDED/CANDIDATE) 확인.

**Step 4:** `docs/governance/meetings/MEET-20261009-001.md` 읽기
→ R1 Approved, Unresolved 2개 확인. Rollback 기준 b11f012 확인.

**충돌 요청 처리:**
> Lumi (유지 중): "Founder가 돌산대교를 분리하고 싶다고 하셨어요. 별도 페이지 만들어 주세요."

새 Code가 문서 기반으로 감지 가능한가?  
→ **YES.** MEET-20261009-001.md에서 공유 결정 Status=Approved를 직접 확인 가능.

새 Code 응답:
```
ARCHITECTURE GUARD: REVIEW HOLD

Requested Action:       dolsan_daegyo 전용 Living Detail 페이지 분리 생성
Conflict Type:          DECIDED_OVERRIDE
Authority / Evidence:   MEET-20261009-001.md (Status: Approved, 2026-10-09)
                        → "돌산대교 → 자세히 보기 → 돌산공원·대교 공통 상세: PASS"
Why This Matters:       MEET-20261009-001.md에 Founder 직접 QA 결과가 기록됨.
                        현재 이 결정은 Approved 상태이며 번복 기록 없음.
Founder Decision:       기존 Approved 결정을 번복하고 분리를 원하는가?
                        새 Meeting Record로 기록 후 재개.
Resume Condition:       Founder의 분리 승인 + MEET-[신규] 생성
```

**Lumi 역할 확인:**  
Lumi는 "Founder가 원한다"는 구두 전달 외에 Meeting Record를 제시할 수 없으므로, Code의 REVIEW HOLD는 올바른 동작이다. Lumi는 Founder Decision을 직접 수집하고 Meeting Record를 작성해야 한다.

**시나리오 B 결과:** PASS ✓ — 새 Code가 문서만으로 재개 가능, REVIEW HOLD 정확 발동.

---

## 6. 시뮬레이션 C — Lumi와 Code 동시 교체

### 전제 조건
- 이전 Lumi와 Code: 모두 대화 이력 없음
- 새 양쪽 모두: 문서만 보유

### 동시 교체 진입 절차

**새 Code 진입 (§11-A 기준):**
1. `memory/MEMORY.md` → ★ Current Next Action 확인
2. `CLAUDE.md` → 권한 범위 + Guard Protocol 포인터
3. Guard Protocol §11-A → Code 진입 절차
4. Meeting Record → Approved 결정 목록 확인

**새 Lumi 진입 (§11-B 기준):**
1. `memory/MEMORY.md` → IMPLEMENTED 목록 + Current Next Action
2. `SOUL_PRODUCT_VISION_V0_1.md` → LOCKED SSOT 확인
3. Meeting Record → Founder Decision 상태 확인
4. Guard Protocol §3 → 지식 3단계 이해

### 동시 교체 후 첫 번째 요청

> Founder (직접): "돌산대교 상세 페이지를 돌산공원과 분리해서 만들어 주세요."

**새 Lumi 처리:**
1. memory/MEMORY.md에서 "CLOSED R1" 확인 → 돌산대교 관련 작업이 완료됨을 인식
2. MEET-20261009-001.md 확인 → Status: Approved, 공유 결정
3. 분리는 Approved 결정 번복 → Founder Decision 필요함을 인식
4. Lumi Proposal 작성 시 DECIDED_OVERRIDE 위험 명시

**새 Code 처리:**
1. memory/MEMORY.md → R1 CLOSED, 77cac69 확인
2. MEET-20261009-001.md → Approved 확인
3. 요청이 기존 Approved 결정 번복임을 감지

**Code 판정:**
```
ARCHITECTURE GUARD: REVIEW HOLD

Requested Action:       Founder 직접 요청 — 돌산대교 전용 Living Detail 분리
Conflict Type:          DECIDED_OVERRIDE
Authority / Evidence:   MEET-20261009-001.md (Status: Approved)
                        Founder QA "돌산대교 → 공통 상세: PASS" (2026-10-09)
Why This Matters:       이전 Founder QA PASS 결정이 Meeting Record에 기록됨.
                        새로운 Founder 지시가 이를 번복하려면 새 Meeting Record 필요.
Safe Alternative:       MEET-[신규] 작성 → Founder가 이전 결정 번복임을 명시 확인 → Code 재개
Founder Decision:       이전 Approved 결정(MEET-20261009-001.md)을 공식 번복하는가?
Resume Condition:       새 Meeting Record의 Founder Decision = Approved (번복 명시)
```

**임의 Confirmed 선언 방지 검증:**
- 새 Lumi가 "이전 Lumi가 동의했을 것"을 근거로 진행하는 것: **차단됨** (Meeting Record에 Lumi 동의 기록 없음)
- 새 Code가 "이전 Code가 구현했으니 맞겠지"로 진행하는 것: **차단됨** (변경 요청은 새 Approved 필요)
- Founder 직접 지시라도 기존 Meeting Record 번복 시: **REVIEW HOLD 필수**

**시나리오 C 결과:** PASS ✓ — 양쪽 교체 후에도 문서만으로 결정 재구성, REVIEW HOLD 정확 발동.

---

## 7. 역할 구분 검증

### 회의록 vs. Project State 역할 분리

| 구분 | 회의록 (Meeting Record) | Project State (MEMORY.md) |
|------|------------------------|--------------------------|
| 목적 | 판단 배경 + Founder 발언 보존 | 현재 재개 지점 제공 |
| 내용 | 왜 그렇게 결정됐는가 + Dissent | 무엇이 완료됐고 다음은 무엇인가 |
| 갱신 주기 | 결정 시점 1회 작성 (불변 원칙) | 매 완료 시 ★ 업데이트 |
| 새 담당자 사용법 | "왜"를 물어볼 때 | "어디서부터"를 알 때 |
| 오용 방지 | ADR·SSOT 자동 변경 안 됨 명시 | 1개 Next Action 유지 (혼동 방지) |

**검증:** 시뮬레이션 A/B/C 모두 MEMORY.md를 첫 번째 읽기로 시작하고, Meeting Record를 근거 조회에만 사용 — 역할 분리 올바름. ✓

---

## 8. 임의 Confirmed/Approved 선언 방지 검증

### 검증 기준
새 담당자가 임의로 "Confirmed" 또는 "Approved"를 선언하려면 반드시 다음 중 하나가 존재해야 한다:
1. Meeting Record에 `Status: Approved` 명시
2. memory/MEMORY.md IMPLEMENTED 목록에 해당 항목 기재
3. Evidence 문서에 Founder QA PASS 결과 기록

### 반례 테스트

| 주장 | 근거 있음? | 판정 |
|------|------------|------|
| "돌산대교 공유 결정은 Approved" | ✓ MEET-20261009-001.md | 정당 |
| "Architecture Guard는 Approved" | ✗ Status: PILOT (미승인) | **차단 — PILOT ≠ Approved** |
| "이순신광장 분리 페이지는 Approved" | ✗ Meeting Record 없음 | **차단 — 미결정** |
| "Short Op Gate는 배포됨" | ✓ MEMORY.md IMPLEMENTED @b11f012 | 정당 |
| "돌산대교 분리는 아마 괜찮을 것" | ✗ 추측 | **차단 — 문서 근거 없음** |

**결론:** 문서 체계가 임의 선언을 구조적으로 방지한다. ✓

---

## 9. 갭(Gap) 발견 및 처리

### Gap-1: Lumi 진입 절차 문서화 미비 (해소됨)
- 이전 상태: §11은 Code 진입 절차만 기술
- 해소: PILOT rev2에서 §11-A/B/C로 분리 + 공통 5가지 체크리스트 추가

### Gap-2: Lumi Proposal 미보존 (부분 해소)
- 현재: Lumi가 제안을 Meeting Record에 기록하지 않은 경우 대화 이력에만 남음
- 처리: `TEMPLATE_Decision_Meeting_Record.md` §Lumi Proposal 섹션이 이를 수용. 단, Lumi 제안이 없으면 Code 단독 구현 시 Meeting Record에 "Lumi Proposal 없이 Code 단독 구현" 명시 (MEET-20261009-001.md 선례)
- 잔여 위험: Lumi 제안이 Meeting Record에 기록되지 않으면 새 Lumi는 제안 배경을 알 수 없음. **→ 권고: Lumi Proposal은 반드시 Meeting Record에 원문 또는 요약 기록**

### Gap-3: Agent 종류 식별 (잔여)
- 현재: Code 인스턴스가 어떤 모델인지 문서에 기록되지 않음
- 판단: 모델 버전은 판단 근거가 아니므로 기록 불필요. 판단의 근거는 문서(SSOT/ADR/Evidence)이므로 모델 교체와 무관하게 동작.
- **처리: 무시 (비영향)**

---

## 10. 최종 검증 결과

| 검증 항목 | 결과 |
|-----------|------|
| 기존 문서 체계가 Code 교체를 지원하는가 | ✓ PASS |
| 기존 문서 체계가 Lumi 교체를 지원하는가 | ✓ PASS (§11-B 추가 후) |
| 동시 교체 후 문서만으로 재개 가능한가 | ✓ PASS |
| 충돌 요청 감지 (돌산대교 분리 예제) | ✓ REVIEW HOLD 정확 발동 (3/3) |
| 임의 Confirmed/Approved 선언 차단 | ✓ 구조적 방지 확인 |
| 회의록 vs. Project State 역할 분리 | ✓ 명확 |
| Gap 발견 및 처리 | Gap-1 해소 / Gap-2 부분 해소(권고) / Gap-3 무시 |

---

## 11. ONE Current Next Action

**PILOT Dual-Agent Continuity 검증 완료.**  
실제 첫 번째 Lumi↔Code 양방향 사이클(Lumi Proposal → Code Review → Founder Decision)이 발생할 때 이 문서를 기준으로 진행.

---

*작성: 2026-10-10 / PILOT 검증 — Code (Claude Code)*
