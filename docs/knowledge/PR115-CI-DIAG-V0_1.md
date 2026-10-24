# PR115-CI-DIAG-V0_1
# PR #115 AIL Gate / docker-smoke 미트리거 원인 진단

생성일: 2026-10-24
상태: READ-ONLY 진단 완료
근거: Founder Instruction — PR #115 CI Trigger Diagnosis (2026-10-24)

---

## 1. PR #115 HEAD SHA 및 Base 확인

| 항목 | 값 |
|------|-----|
| HEAD SHA | `52a324a889f9c36d1004914a6ee7296795bdecdb` |
| Base SHA | `49e1e2851437e516695ab7563405802bf0a41551` (main HEAD = PR #114 merge) |
| PR 오픈 시각 | 2026-10-24T04:50:xx KST |

---

## 2. AIL Gate / docker-smoke 실행 기록 확인

### API 조회 결과 (pull_request 이벤트)

```
가장 최근 pull_request 트리거 실행 목록:
  AIL Gate         head_sha=ee914a5  created_at=2026-10-24T01:37:14Z  conclusion=success
  docker-smoke     head_sha=ee914a5  created_at=2026-10-24T01:37:14Z  conclusion=success
  AIL Gate         head_sha=dbdc7b5  created_at=2026-10-24T00:53:29Z  conclusion=success
  docker-smoke     head_sha=dbdc7b5  created_at=2026-10-24T00:53:29Z  conclusion=success
```

- `ee914a5`, `dbdc7b5` — PR #114의 커밋들 (Phase B State Sync)
- **PR #115 HEAD `52a324a`에 대한 pull_request 트리거 실행: 0건**

### 판정

| CI | 상태 | 근거 |
|----|------|------|
| AIL Gate | **생성되지 않음** | `52a324a` 기준 Actions run 없음 |
| docker-smoke | **생성되지 않음** | 동일 — pull_request 이벤트 미처리 |

---

## 3. Workflow 조건 확인

### AIL Gate (`ail-gate.yml`)

```yaml
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
  push:
    branches: [ "main" ]
```

- `branches` 필터: 없음 — 모든 브랜치의 pull_request에 반응
- `paths` 필터: 없음

### docker-smoke (`videojob-docker-smoke.yml`)

```yaml
on:
  pull_request:
  push:
    branches: [ "main" ]
```

- 필터 없음 — 모든 pull_request에 반응

**결론**: 두 워크플로우 모두 PR #115에 트리거되어야 하는 조건임 → 조건 문제 아님

---

## 4. PR #111 / #113과 이벤트 비교

| 항목 | PR #111 / #113 | PR #115 |
|------|---------------|---------|
| AIL Gate 실행 | ✓ 실행됨 | ✗ 생성되지 않음 |
| PR 본문 `[AIL]` | ✓ 있음 | ✗ 없음 |
| pull_request 이벤트 처리 | ✓ 정상 | ✗ 미처리 |
| 브랜치 생성 기점 | main | docs/state-sync-pr113-merged |

**차이점 1** — PR 본문: PR #111/#113은 `[AIL]` 섹션 포함. PR #115는 미포함.
→ AIL Gate가 트리거됐다면 FAIL이 발생했을 것

**차이점 2** — pull_request.opened 이벤트 자체가 미처리:
→ `gh api ".../actions/runs?event=pull_request"` 조회 결과, `52a324a`에 대한 run이 없음
→ GitHub Actions가 PR #115의 `pull_request.opened` 이벤트를 처리하지 않음

---

## 5. 미트리거 원인 분석

### 원인 A — GitHub Actions 이벤트 미전달 (PROBABLE)

- PR #115 오픈 시각: ~04:50 KST
- 30분+ 경과 후에도 `pull_request` 트리거 실행 없음
- GitHub Actions 일시적 이벤트 전달 실패 가능성

**증거:**
- `gh pr create`로 PR 생성 성공 (PR #115 OPEN 확인)
- `gh run list --branch fix/full-day-candidate-cap` → `approve-dec.yml` (push 이벤트)만 표시
- push 이벤트는 처리되었으나 pull_request 이벤트는 처리 안 됨

### 원인 B — 말형 approve-dec.yml 개입 가능성 (UNKNOWN)

- `approve-dec.yml`: YAML이 아닌 PowerShell here-string으로 작성됨 → GitHub Actions 파싱 실패
- push 이벤트에서 0초 만에 failure
- 이것이 다른 워크플로우의 pull_request 이벤트 처리를 차단했을 가능성 — **확인 불가**

### 원인 C — check_suite 미생성 (PROBABLE)

- GitHub PR 오픈 시 HEAD SHA에 대한 `check_suite`가 자동 생성되어야 함
- `gh api ".../commits/52a324a/check-runs"` → "Vercel Preview Comments"만 반환
  (AIL Gate / docker-smoke check run 없음)
- GitHub가 `check_suite`를 생성하지 않았거나 실패

### 원인 D — Actions 동시 실행 제한 (UNLIKELY)

- 무료 계정의 경우 동시 실행 제한 있음
- 04:50 시점에 다른 실행이 있었는지 확인 불가 — 30분 후에도 미실행이므로 제한 아님

**판정: 원인 A (GitHub 이벤트 전달 실패) + 원인 C (check_suite 미생성) — PROBABLE. 원인 확정 불가 = UNKNOWN**

---

## 6. PR #115 변경 범위 이상 여부

### PR에 포함된 3개 커밋

| SHA | 제목 | 의도 |
|-----|------|------|
| `dbdc7b5` | docs(state): PR #113 MERGED — State sync | 의도치 않게 포함 |
| `ee914a5` | docs(state): Phase B V0.1 DEPLOYED_AND_VERIFIED | 의도치 않게 포함 |
| `52a324a` | fix(soul): respect full-day candidate count | **이번 BUG fix** |

**원인**: `fix/full-day-candidate-cap` 브랜치가 `main`이 아닌 `docs/state-sync-pr113-merged`에서 생성됨
→ PR #114 merge 이전의 2개 커밋이 base(main)보다 앞서 있었음

### 의도치 않게 포함된 파일

| 파일 | 종류 | 위험도 |
|------|------|--------|
| `docs/knowledge/EVIDENCE-B-002_Phase_B_V0_1_Production_QA.md` | Phase B 증거 문서 | **없음** — docs only |
| `docs/knowledge/RELEASE-PREFLIGHT-B-001_Phase_B_V0_1.md` | Phase B 릴리즈 체크 | **없음** — docs only |
| `docs/index/manifest.json` | Git hook 자동 생성 | **없음** — auto-generated |
| `docs/index/tags.json` | Git hook 자동 생성 | **없음** — auto-generated |

**코드 변경: `services/travelGuideService.js` 1개 (`52a324a`에만 포함)**
→ 승인 범위 내 변경만 포함됨 — 기능적 이상 없음

### docs-only check 영향

AIL Gate docs-only 판정:
- `services/travelGuideService.js` → NOT docs-safe
- `tests/soul/soulCoursePlanningFullDay.test.js` → NOT docs-safe
→ **docs-only = false → `[AIL]` 섹션 필수**

그러나 PR #115 본문에는 `[AIL]` 섹션 없음 → 트리거됐다면 FAIL 발생

---

## 7. 기존 실패 vs 신규 문제 구분

| 항목 | 판정 | 기존/신규 |
|------|------|---------|
| Vercel FAILURE (2종) | PRE-EXISTING | 이전 모든 PR 동일 (Node.js 20.x) |
| approve-dec.yml FAILURE | PRE-EXISTING | YAML 파일 손상 |
| AIL Gate 미트리거 | **신규 문제** | PR #115에서 처음 발생 |
| docker-smoke 미트리거 | **신규 문제** | PR #115에서 처음 발생 |
| PR 본문 `[AIL]` 누락 | **신규 문제** | PR 생성 시 누락 |

---

## 8. 최소 조치 1개 제안

**PR 본문 편집 — `[AIL]` 섹션 추가**

근거:
- PR body 편집 → `pull_request.edited` 이벤트 발생
- AIL Gate / docker-smoke 모두 `pull_request` 이벤트에 반응 → **재트리거**
- `[AIL]` 섹션 존재 → AIL Gate 통과 가능

추가할 내용 예시:
```
## [AIL] 지시서

[CONTEXT]
- 배경: _applyClusterDiversity hardcoded cap=3 → 8h course = 5h course
- Founder Decision: 2026-10-24 코드 수정 승인

[INSTRUCTION]
1. cap=3 → context-aware maxCount 파라미터화
2. 신규 테스트 C-NEW-1~C-NEW-7 작성
3. 2h/5h 기존 동작 보존, 8h → 5stops 활성화
```

**조치 후 예상 결과:**
- `pull_request.edited` 이벤트 → AIL Gate + docker-smoke 재트리거
- AIL Gate: `[AIL]` 섹션 있음 → 통과 (docs-only=false, hasAilSection=true)
- docker-smoke: `npm run` → 통과

**Founder 승인 필요**: PR body 편집은 READ-ONLY 범위를 벗어남 → 본 진단에서는 제안만 함

---

## 9. Guardian 판정

```
판정: HOLD

근거:
  - AIL Gate: 생성되지 않음 (pull_request 이벤트 미처리 — GitHub 문제 PROBABLE)
  - docker-smoke: 생성되지 않음 (동일 원인)
  - PR 본문: [AIL] 섹션 없음 → 트리거 시 FAIL 예상
  - PR 변경 범위: 기능 코드 변경은 승인 범위 내 1개 커밋만 (extra는 docs only)
  - Vercel FAILURE: PRE-EXISTING (이번 변경 무관)
  - approve-dec.yml FAILURE: PRE-EXISTING (이번 변경 무관)

복구 조건:
  - PR 본문 [AIL] 섹션 추가 (Founder 승인 필요) → pull_request.edited → CI 재트리거
  - AIL Gate ✓ + docker-smoke ✓ 확인 후 MERGE_READY 판정 가능
```

---

## 10. 금지 항목 준수 확인

| 항목 | 결과 |
|------|------|
| workflow YAML 수정 | ✓ 없음 |
| 빈 커밋 또는 강제 push | ✓ 없음 |
| CI 우회 | ✓ 없음 |
| PR Merge | ✓ 없음 |
| Production Deploy | ✓ 없음 |
| 코드 변경 | ✓ 없음 |
