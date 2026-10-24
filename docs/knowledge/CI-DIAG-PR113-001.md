# CI-DIAG-PR113-001 — PR #113 AIL Gate & docker-smoke 미실행 진단

생성일: 2026-10-24
갱신일: 2026-10-24 v3 (Root-cause CONFIRMED: merge conflict dirty state)
진단자: Claude Code
대상: PR #113 (feat: Nighttime Walk SOUL Answer Phase B V0.1)
상태: **Root-cause CONFIRMED** — PR #113 mergeable_state=dirty → Founder 복구 결정 대기

---

## 1. 진단 대상 Workflow

| Workflow 파일 | 트리거 조건 | PR #113 실행 여부 |
|---------------|------------|-----------------|
| `ail-gate.yml` | `pull_request: [opened, edited, synchronize, reopened]` + `push: branches: [main]` | **미실행** |
| `videojob-docker-smoke.yml` | `pull_request:` (types 필터 없음) + `push: branches: [main]` | **미실행** |
| `approve-dec.yml` | `workflow_dispatch:` only (YAML 파싱 불가) | push마다 "workflow file issue" (PRE-EXISTING) |

---

## 2. 수집된 Facts (GitHub API 실측)

### PR #113 커밋별 Workflow Runs

| 커밋 SHA | 이벤트 | Workflow 이름 | 결과 |
|----------|--------|---------------|------|
| `ae93bba` (PR 생성 SHA) | push | `.github/workflows/approve-dec.yml` | failure |
| `ae93bba` | **pull_request** | (없음) | **0 runs** |
| `6a01f52` (빈 커밋) | push | `.github/workflows/approve-dec.yml` | failure |
| `6a01f52` | pull_request | (없음) | **0 runs** |
| `cb6954b` (최신 HEAD) | push | `.github/workflows/approve-dec.yml` | failure |
| `cb6954b` | pull_request | (없음) | **0 runs** |

쿼리: `gh api "repos/.../actions/runs?head_sha=<sha>"` — 각 SHA에서 직접 실측

### 비교 대상 PR #111 (정상 케이스)

| 커밋 SHA | 이벤트 | Workflow 이름 | 결과 |
|----------|--------|---------------|------|
| `982fe971` | pull_request | `ail-gate.yml` | success |
| `982fe971` | pull_request | `videojob-docker-smoke.yml` | success |
| `982fe971` | push | `approve-dec.yml` | failure (PRE-EXISTING) |

### PR #113 메타데이터

```
baseRefName: main
headRefName: feat/soul-nighttime-walk-phase-b-v0-1
headRefOid: cb6954bcd80872887d572ec3c1e5878baad2aea4
isDraft: false
state: OPEN
required_checks: "no required checks reported"
```

---

## 3. 항목별 진단 결과 (v3 — Root-Cause Verification 포함)

### (1) PR #113 실제 GitHub Actions 실행 기록
**CONFIRMED**: PR #113의 모든 커밋에 대해
- `push` 이벤트: `approve-dec.yml` 실행 (failure) — 정상
- `pull_request` 이벤트: **0개 workflow run** — 차단됨 (원인: dirty state, 하단 참고)

### (2) AIL Gate / docker-smoke trigger 조건
**CONFIRMED**: 두 workflow 모두 branch filter 없음, path filter 없음.
- `ail-gate.yml`: `pull_request: types: [opened, edited, synchronize, reopened]`
- `docker-smoke`: `pull_request:` (types 필터 없음)
PR #113 조건(main 대상, non-draft, OPEN) 모두 충족. 조건 자체는 문제 없음.

### (3) pull_request 이벤트 발화 vs GitHub Actions 처리 구분
**CONFIRMED (NEW)**:
- PR #113의 check-runs API 조회: `Vercel Preview Comments` (success) → Vercel은 pull_request webhook에 반응함
- GitHub Actions (github-actions app) check run: 0건
- **결론**: pull_request webhook은 발화됐으나, GitHub Actions만 처리하지 않았음.

### (4) GitHub Actions pull_request workflow 차단 원인
**CONFIRMED (ROOT CAUSE)**:
```
PR #113 mergeable: false
PR #113 mergeable_state: "dirty"
```
GitHub Actions는 pull_request 이벤트 처리 시 merge commit을 생성하여 실행함.
`dirty` 상태(merge conflict)에서는 merge commit 생성 불가 → workflow 전체 미실행.

**충돌 경위:**
- main 최신: `d0b5acc` (PR #112 — DREAMTOWN_STATUS.md 수정)
- PR #113 브랜치: `cb6954b` (DREAMTOWN_STATUS.md 수정)
- PR #113 브랜치의 base: `55f2417` (main과 merge하기 전) — d0b5acc 미포함
- 충돌 파일: `DREAMTOWN_STATUS.md`

### (5) approve-dec.yml 파싱 오류 인과관계
**CONFIRMED: 원인 아님.**
- approve-dec.yml 최근 변경: `28edb56` (2026-02-21) — PR #111 merge 훨씬 이전
- PR #111과 PR #113 사이 변경 없음
- PR #111에서 동일한 approve-dec.yml 오류 상태에서 AIL Gate + docker-smoke 정상 실행됨
- 인과관계 증거 없음

### (6) PR #111과 PR #113 트리거 조건 차이
**CONFIRMED (KEY DIFFERENCE)**:
| 항목 | PR #111 | PR #113 |
|------|---------|---------|
| mergeable | true (clean) | false (dirty) |
| AIL Gate 실행 | ✅ | ❌ |
| docker-smoke 실행 | ✅ | ❌ |
| Vercel check | ✅ | ✅ |
| approve-dec.yml | failure (PRE-EXISTING) | failure (PRE-EXISTING) |

### (7) 레포지터리 workflow 활성 상태
**CONFIRMED**: AIL Gate(id: 231253564, state: active), docker-smoke(id: 236406987, state: active).
Actions enabled: true, allowed_actions: all. 레포 설정 문제 없음.

### (8) Vercel FAILURE PRE-EXISTING
**CONFIRMED**: PR #109/#111과 동일한 Node.js 20.x 빌드 이슈. 독립적.

---

## 4. 원인 분류 (최종)

| 항목 | 원인 | 분류 |
|------|------|------|
| AIL Gate 미실행 | PR #113 mergeable_state=dirty → GitHub Actions merge commit 생성 불가 | **CONFIRMED** |
| docker-smoke 미실행 | 동일 원인 | **CONFIRMED** |
| pull_request webhook | Vercel 정상 반응 — 발화됨 | **CONFIRMED** |
| approve-dec.yml failure | YAML 파싱 오류 (PowerShell here-string), PR #111과 동일 | **CONFIRMED (PRE-EXISTING, 무관)** |
| dirty 원인 | main의 d0b5acc(DREAMTOWN_STATUS.md) ↔ PR #113 브랜치 동일 파일 충돌 | **CONFIRMED** |
| Vercel FAILURE | Node.js 20.x 빌드 이슈 | **CONFIRMED (PRE-EXISTING)** |

---

## 5. Close → Reopen 시도 결과 (2026-10-24, Founder 승인)

```bash
gh pr close 113   # ✓ CLOSED
gh pr reopen 113  # ✓ REOPENED → OPEN 복귀 확인
```

| 항목 | 결과 | 설명 |
|------|------|------|
| PR #113 state | OPEN 복귀 | ✓ |
| pull_request: reopened 이벤트 | workflow 0건 | dirty state 지속 — 동일 원인으로 차단 |
| 추가 복구 | 중단 | Founder 지시 준수 |

**Close → Reopen 효과 없는 이유:**
dirty state가 해소되지 않았으므로 `reopened` 이벤트에도 GitHub Actions가 동일하게 차단됨.
dirty state 자체를 해소해야 workflow 실행 가능.

---

## 6. 최소 복구 방안 (PR #113에만 적용, v3)

**PR #113 브랜치에서 main을 merge (또는 rebase)하여 DREAMTOWN_STATUS.md conflict 해소 → push**

```bash
git checkout feat/soul-nighttime-walk-phase-b-v0-1
git merge main   # DREAMTOWN_STATUS.md conflict 발생 → 수동 해결 필요
# conflict 해결 후:
git add DREAMTOWN_STATUS.md
git merge --continue
git push origin feat/soul-nighttime-walk-phase-b-v0-1
```

- **충돌 파일**: `DREAMTOWN_STATUS.md` (main d0b5acc ↔ PR #113 cb6954b)
- **해결 방법**: main의 d0b5acc 내용을 기반으로 PR #113 변경사항 병합
- **commit + push 필요** → **Founder 승인 필요**
- **코드 변경 없음** — DREAMTOWN_STATUS.md(docs) conflict만 해결

**복구 후 예상:**
push 완료 → `pull_request: synchronize` 이벤트 발화 → AIL Gate + docker-smoke 실행

---

## 7. AIL Gate / docker-smoke 검증 방법

복구(merge+push) 후:
1. `gh api "repos/.../actions/runs?head_sha=<new_sha>"` — pull_request 이벤트 run 확인
2. AIL Gate: [AIL] 섹션 PR body에 포함됨 → 코드 변경 파일(quoteContextService.js, soyeowoolService.js) → docs-only 아님 → AIL 섹션 검사 진행
3. docker-smoke: `npm run` 실행 확인

---

## 8. Guardian Merge 판정

**HOLD (dirty state 해소 전)**

- PR #113 mergeable_state: dirty → merge 자체 불가 (GitHub가 차단)
- dirty 해소(commit+push) 후 AIL Gate PASS → Merge 가능
- 코드 변경 자체: 509/510 PASS, EVIDENCE-B-001 완료
- **권고**: main merge → conflict 해소 → AIL Gate PASS → Merge 순서로 진행

---

## 8. 관련 문서

| 문서 | 경로 |
|------|------|
| Phase B Preflight | `docs/knowledge/PREFLIGHT-PHASE-B-001_Hotel_Nighttime_Walk.md` |
| Phase B 구현 계획 | `docs/knowledge/IMPL-PLAN-B-001_Hotel_Nighttime_Walk_V0_1.md` |
| Phase B 테스트 Evidence | `docs/knowledge/EVIDENCE-B-001_Hotel_Nighttime_Walk_V0_1_Implementation.md` |
