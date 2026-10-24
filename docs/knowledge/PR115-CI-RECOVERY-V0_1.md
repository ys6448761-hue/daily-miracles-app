# PR115-CI-RECOVERY-V0_1
# PR #115 CI 미생성 원인 확정 및 복구 방안

생성일: 2026-10-24
상태: READ-ONLY 진단 완료 — 복구 조치 Founder 승인 대기
근거: Founder Instruction — PR #115 CI Recovery Decision (2026-10-24)

---

## 1. main / PR base / merge-base SHA 확인

| 항목 | SHA |
|------|-----|
| main HEAD | `49e1e2851437e516695ab7563405802bf0a41551` (PR #114 merge) |
| PR #115 base (GitHub) | `49e1e285...` (main HEAD at PR open time) |
| PR #115 HEAD | `52a324a889f9c36d1004914a6ee7296795bdecdb` |
| **merge-base** (`git merge-base main HEAD`) | `4c160529f08616433bb639e0ce153044b998fca5` **(PR #113 SHA)** |

**주의**: merge-base가 PR #114(`49e1e28`)가 아닌 PR #113(`4c16052`)임
→ 브랜치가 `main`이 아닌 `docs/state-sync-pr113-merged`(= PR #113 SHA)에서 생성되었기 때문

---

## 2. 실제 PR 변경 파일 목록 (diff from merge-base)

```
git diff main...fix/full-day-candidate-cap --stat

 DREAMTOWN_STATUS.md                              |  58 +++-
 docs/index/manifest.json                         | 132 ++++++++-   ← hook 자동
 docs/index/tags.json                             |   8 +           ← hook 자동
 docs/knowledge/COURSE-PLANNING-8H-TRACE-V0_1.md | 302 +++++++++   ← 진단 문서
 docs/knowledge/COURSE-PLANNING-FULLDAY-DESIGN-V0_1.md | 329 +++++ ← 설계 문서
 docs/knowledge/COURSE-PLANNING-FULLDAY-IMPL-V0_1.md | 207 +++++   ← 구현 Evidence
 docs/knowledge/COURSE-PLANNING-TIME-FIT-DIAGNOSIS-V0_1.md | 281 + ← 진단 문서
 docs/knowledge/EVIDENCE-B-002_Phase_B_V0_1_Production_QA.md | 176 ← Phase B (dbdc7b5)
 docs/knowledge/RELEASE-PREFLIGHT-B-001_Phase_B_V0_1.md | 144 ++++ ← Phase B (ee914a5)
 services/travelGuideService.js                   |  23 +-           ← BUG 수정 (52a324a)
 tests/soul/soulCoursePlanningFullDay.test.js     | 212 ++++++++++   ← 신규 테스트 (52a324a)
 11 files changed, 1846 insertions(+), 26 deletions(-)
```

**코드 변경**: `services/travelGuideService.js` + `tests/soul/soulCoursePlanningFullDay.test.js` — 모두 `52a324a`에만 포함, Founder 승인 범위 내

**의도치 않은 파일** (Phase B branch에서 상속):
- `EVIDENCE-B-002_Phase_B_V0_1_Production_QA.md` — docs only, 코드 변경 없음
- `RELEASE-PREFLIGHT-B-001_Phase_B_V0_1.md` — docs only, 코드 변경 없음
- `manifest.json` / `tags.json` — git hook 자동 생성, 코드 변경 없음

→ **기능 영향: 없음**

---

## 3. AIL Gate / docker-smoke 실행 기록

### API 조회 (pull_request 이벤트 — 최근 10개)

```
가장 최근 pull_request 트리거 실행:
  AIL Gate     head_sha=ee914a5  2026-10-24T01:37:14Z  success (PR #114)
  docker-smoke head_sha=ee914a5  2026-10-24T01:37:14Z  success (PR #114)
  AIL Gate     head_sha=dbdc7b5  2026-10-24T00:53:29Z  success (PR #114)
  docker-smoke head_sha=dbdc7b5  2026-10-24T00:53:29Z  success (PR #114)

PR #115 HEAD sha=52a324a에 대한 pull_request 트리거 실행: 0건
```

### check_suite 조회 (HEAD SHA `52a324a`)

```
GitHub Actions suite: ID=108594797450, conclusion=failure, status=completed
  → check_runs: 0건 (total_count=0)

Render: queued
Vercel: success (Vercel Preview Comments)
Railway App: queued
```

---

## 4. CI 미실행 원인 확정

### 원인 1 — approve-dec.yml YAML 파싱 실패가 check_suite를 즉시 실패 처리 (CONFIRMED)

```
approve-dec.yml 내용:
  $yml = @'           ← PowerShell here-string 문법 (YAML 아님)
  name: Approve DEC
  ...
  '@
```

- GitHub Actions가 YAML 파싱 불가 → job 실행 없이 check_suite 즉시 failure
- `total_count=0` — check run이 한 건도 생성되지 않음
- 실행 시간: `0s` (파싱 단계 실패)

이 실패가 check_suite를 `completed/failure`로 마킹하지만, 이것이 AIL Gate 미실행의 직접 원인은 아님 (push 이벤트 → AIL Gate는 pull_request 이벤트가 별도로 필요)

### 원인 2 — pull_request.opened 이벤트 미처리 (CONFIRMED)

**확인된 사실:**
- Actions 권한: `enabled=true, allowed_actions=all` → 권한 문제 없음
- AIL Gate workflow state: `active` → 비활성화 아님
- docker-smoke workflow state: `active` → 비활성화 아님
- `pull_request` branches/paths 필터: 없음 → 브랜치 제한 없음
- PR #115 이벤트: `deployed` 1건만 기록됨

**미처리 가능성:**

A. **GitHub 이벤트 전달 실패** (MOST PROBABLE)
   - `gh pr create`로 PR 생성 성공했으나 `pull_request.opened` webhook/event가 Actions 큐에 도달하지 않음
   - 30분+ 경과로 지연 아님
   
B. **malformed approve-dec.yml의 간접 영향** (UNKNOWN)
   - 파싱 실패가 동일 SHA에 대한 이후 이벤트 처리를 방해했을 가능성
   - GitHub 공식 문서에 해당 behavior 명시 없음 — 추정 불가
   
C. **GitHub 일시적 인프라 문제** (PROBABLE)
   - 특정 시간대 Actions 이벤트 처리 지연/누락 사례 존재

**결론: pull_request.opened 이벤트가 GitHub Actions에 의해 처리되지 않음 (원인 A 또는 C, 확정 불가)**

### 원인 3 — PR 본문 [AIL] 섹션 없음 (CONFIRMED)

AIL Gate 판단 로직:
```javascript
const hasAilSection = prBody.includes('[AIL]') ||
                      prBody.includes('AIL:') ||
                      prBody.includes('```ail');
```

PR #115 본문에 위 패턴 없음 → 트리거됐다면 AIL Gate FAIL (core.setFailed)

PR #111/#113은 `[AIL]` 섹션 포함 → AIL Gate PASS (확인됨)

---

## 5. 복구 방안 비교 및 실제 시도 결과

| 방안 | 트리거 이벤트 | 코드 변경 | 위험도 | 실제 결과 |
|------|-------------|---------|--------|---------|
| A. PR close/reopen | pull_request.reopened | 없음 | 낮음 | **Founder 금지** |
| B. 빈 커밋 | pull_request.synchronize | 없음 | 낮음 | **Founder 금지** |
| C. PR 본문 편집 + [AIL] 추가 | pull_request.edited | 없음 | 최소 | **실행됨 → CI 미트리거 (FAILED)** |
| D. check_suite rerequest API | 없음 (push suite 재실행) | 없음 | 낮음 | 효과 없음 — 자동모드 BLOCKED |
| E. workflow_dispatch | 없음 (AIL Gate 미지원) | 없음 | — | 불가 |
| **F. 정상 docs 커밋 push** | **pull_request.synchronize** | **docs only** | **낮음** | **승인 대기** |

### C 실행 결과 (2026-10-24)

**실행:** `gh pr edit 115 --body-file` → `[AIL]` 섹션 추가 성공 (PR 본문 확인)

**결과:** AIL Gate / docker-smoke **미트리거** — 0 runs (52a324a 기준)

**원인 분석:**
- `pull_request.edited`는 SHA를 변경하지 않음 → 기존 check_suite (`108594797450`) 재사용
- check_suite `108594797450`: SHA `52a324a`의 push 이벤트에서 `approve-dec.yml` YAML 파싱 실패로 즉시 `completed/failure` (0 check_runs)
- GitHub는 이미 완료된 check_suite에 `edited` 이벤트로 새 runs를 추가하지 않음
- **실질적으로 `edited` 이벤트로 CI 재트리거 불가**

### 추천: F — 정상 docs 커밋 + push (Founder 조건부 승인)

**근거:**
1. 새 커밋 → 새 SHA → 새 check_suite 생성
2. `pull_request.synchronize` 이벤트 → AIL Gate + docker-smoke 트리거
3. 변경 파일: CI 진단 Evidence docs만 (코드 변경 없음, 빈 커밋 아님)
4. PR 본문에 `[AIL]` 섹션 이미 추가됨 → AIL Gate 통과 예상

**커밋 대상 파일:**
- `docs/knowledge/PR115-CI-DIAG-V0_1.md` — CI 진단 Evidence
- `docs/knowledge/PR115-CI-RECOVERY-V0_1.md` — CI 복구 분석
- `DREAMTOWN_STATUS.md` — Project State 갱신

---

## 6. Workflow 권한 및 조건 최종 확인

| 항목 | 상태 | 판정 |
|------|------|------|
| Actions enabled | true | ✓ 정상 |
| allowed_actions | all | ✓ 정상 |
| AIL Gate state | active | ✓ 정상 |
| docker-smoke state | active | ✓ 정상 |
| pull_request branches filter | 없음 | ✓ 모든 브랜치 |
| pull_request paths filter | 없음 | ✓ 모든 파일 |
| approve-dec.yml YAML | 손상 (PRE-EXISTING) | ✗ 간접 영향 가능 |

---

## 7. Guardian 판정

```
판정: HOLD

CI 미실행 원인 (확정):
  CONFIRMED — pull_request.opened 이벤트: CI 미트리거 (0 runs)
  CONFIRMED — pull_request.edited 이벤트: CI 미트리거 (0 runs)
  ROOT CAUSE (PROBABLE): approve-dec.yml YAML 파싱 실패 → check_suite 즉시 completed/failure
    → 동일 SHA의 edited 이벤트는 기존 completed check_suite에 새 run 추가 불가
  CONFIRMED — PR 본문 [AIL] 섹션: 추가 완료 (2026-10-24)
  PRE-EXISTING — Vercel FAILURE (Node.js 20.x)
  PRE-EXISTING — approve-dec.yml FAILURE (YAML 손상)

PR 변경 범위:
  코드 변경: travelGuideService.js + soulCoursePlanningFullDay.test.js (52a324a, 승인 범위 내)
  추가 파일: EVIDENCE-B-002, RELEASE-PREFLIGHT-B-001 (docs only, 기능 무관)

복구 조건 (갱신):
  → pull_request.edited 실패 확인
  → 정상 docs 커밋 push → 새 SHA → synchronize 이벤트 → CI 재트리거 (Founder 조건부 승인)
  → AIL Gate ✓ + docker-smoke ✓ 확인 후 MERGE_READY

금지 준수:
  ✓ PR close/reopen 미실행
  ✓ 빈 커밋 미생성
  ✓ 강제 push 없음
  ✓ workflow 수정 없음
  ✓ CI 우회 없음
  ✓ Merge 없음
  ✓ Production Deploy 없음
```
