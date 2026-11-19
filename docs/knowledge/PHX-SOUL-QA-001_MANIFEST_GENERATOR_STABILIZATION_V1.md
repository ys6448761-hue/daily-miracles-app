# PHX-SOUL-QA-001 — Manifest Generator Final Stabilization (V1, 2026-11-19)

> 목적: Manifest 재발 방지를 위한 최소 범위 수정. 이후 Manifest 개선은 중단하고 SOUL 고객 응답 품질 개선으로 복귀한다.
> 선행: §53 (`PHX-SOUL-QA-001_MANIFEST_SELECTIVE_RECOVERY_V1.md`, 커밋 `aebb55e`).
> 금지: 공유 Git Hook 수정·우회, History 재작성, Hybrid·Privacy Guard·Route Gate 수정, 실제 LLM 호출, 운영 DB, push·PR·merge, Render 배포, Hybrid 활성화, 다른 Workstream 변경, docs 문서 커밋(검증 전).

## Guardian Preflight Report (변경 전 발행)

```
### Guardian Preflight Report

Requested Change:
  생성기 scan 정책을 Git Index 기준으로 전환 (추적·신규 stage 포함, 미추적·백업 복사본·타 Workstream unstaged 제외,
  stage 삭제 반영, 부분 stage 는 Index 콘텐츠). checksum 은 점진적 Git Blob 기준: 기존 563 기록 보존,
  실제 staged 콘텐츠 변경만 갱신, 신규는 Index Blob 콘텐츠 md5. 기존 created_at 보존.

Existing Assets Found:
  aebb55e: 4f96e21 생성일 보존 로직 (resolveCreatedAt, loadPreviousCreatedAt) 이 이미 scripts/generate-manifest.js 에 적용됨
  tests/unit/generateManifest.test.js: M01~M11 (임시 디렉터리, git 없음 + M10 임시 git 저장소의 훅 실행)
  §53 검증: generateTagsJson(base documents) 가 ad3503a tags.json 과 정확히 일치 (재현성 확인됨)
  §53 검증: 기존 563 checksum 분포 — LF 일치 198 / CRLF 일치 332 / 불일치 33 (stale)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — feat/phx-soul-hybrid-v1, HEAD aebb55e
  공유 Hook: C:/DEV/daily-miracles-mvp/.git/hooks/pre-commit (읽기만, 수정 없음)
  Hook 동작 (확인됨): docs/ 중 docs/index/ 가 아닌 파일이 staged 일 때만 generator 실행 후 docs/index/manifest.json, tags.json 자동 git add

Relevant Files:
  scripts/generate-manifest.js (수정 대상, 최소 변경), tests/unit/generateManifest.test.js (유지),
  tests/unit/generateManifestIndex.test.js (신규 회귀 테스트, 임시 git 저장소만 사용)

Relevant Databases:
  없음.

Change Classification:
  REPAIR (생성기 재발 방지). 신규 설계 아님. 기존 인터페이스(node scripts/generate-manifest.js, 출력 경로) 유지.

Connection Opportunity:
  기존 createDocItem / resolveCreatedAt / generateTagsJson 재사용. 입력 소스만 Index 로 치환.

Duplication Risk:
  낮음. 기존 worktree 스캔 경로는 git 저장소가 아닐 때 그대로 유지 (테스트 호환).

Data Risk:
  중간 → 통제. 기존 manifest 엔트리는 유지 객체로 보존 (필드 재추출 없음 → 대량 churn 방지).
  기존 checksum 은 Blob 불일치(stale)·CRLF 차이 모두 보존. 삭제는 stage 된 삭제만 반영.

Recommended Approach:
  A. Index 목록: git ls-files -s (stage 0, .md, docs 하위, EXCLUDE 디렉터리 제외)
  B. 기존 엔트리(prev manifest 에 있는 path): stage 된 문서(Index blob ≠ HEAD blob)만 검토, 그 외에는 엔트리 그대로 유지
     - 기록 checksum 이 HEAD blob 과 일치(LF 또는 CRLF)하고 Index 콘텐츠가 실제 변경된 경우에만 md5(Index) 로 갱신
     - 기록 checksum 이 HEAD 와 불일치(stale)면 보류 (감사 대상, 변경 없음)
  C. 신규(prev 에 없음): stage 된 문서만 등록. 백업 경로(/backups/) 제외. created_at 은 resolveCreatedAt. checksum = md5(Index 콘텐츠)
  D. 기존 approved 4건 등 prev 엔트리는 항상 유지. stage 삭제는 목록에서 제외.
  E. tags 는 최종 documents 로 generateTagsJson 재생성 (재현성 확인됨).
  F. 격리 Git 저장소에서 필수 테스트 및 기존 11 테스트 실행.

Questions Requiring Decision:
  없음 (Founder Decision 1·2 명시). 기존 checksum 계약 호환성 확인 결과는 §54 에 기록.
  호환 문제가 발견되면 해당 범위만 BLOCKED 로 보고.

Implementation Status: READY
```

## §54 — 구현 및 검증 결과 (2026-11-19)

**로컬 커밋: `3f20aef`** (생성기 `scripts/generate-manifest.js` +237행, 테스트 `tests/unit/generateManifestIndex.test.js` 신규 16개). 선행 커밋 `aebb55e`·`7b7c866`·`79a40af`·`ad3503a` 보존. History 재작성 없음. docs/index 변경 없음.

### 54.1 Scan 정책 (Decision 1)

| 규칙 | 구현 |
|---|---|
| 기존 추적 문서 | `git ls-files -s -- docs` (stage 0). 추적 문서는 Index 기준으로 판정 |
| 신규 stage 문서 | Index blob ≠ HEAD blob 인 신규 문서만 등록 |
| 미추적 문서 | 목록에 없음 → 제외 (작업 트리 스캔 안 함) |
| stage 된 삭제 | Index 에서 사라지면 manifest 에서 제거 |
| 다른 추적 문서의 unstaged 수정 | Index 콘텐츠 사용 → 무시 |
| 부분 stage 문서 | Index blob 콘텐츠 사용 |
| 백업 복사본 | 신규 등록 시 `/backups/` 경로 제외 |
| 추적되었으나 이번 커밋에 stage 되지 않은 문서 | 신규 등록하지 않음 (타 Workstream 의도하지 않은 등록 방지) |
| Ignore 대상 | Index 에 없으므로 자연 제외. EXCLUDE_DIRS(index, raw, node_modules, .git) 유지 |
| 저장소가 아닌 환경 | 기존 작업 트리 경로 유지 (기존 11 테스트 호환) |

- 공유 Git Hook (`C:/DEV/daily-miracles-mvp/.git/hooks/pre-commit`): 수정하지 않음. 호출 방식 동일 (`node scripts/generate-manifest.js`).
- 생성기 CLI 인터페이스 유지 (인자 없음, 출력 경로 동일).

### 54.2 Checksum 계약 및 호환성 (Decision 2)

- **기존 계약 확인 (§53 재사용)**: 기준 ad3503a 563건 중 LF blob 일치 198, 작업 트리 CRLF 일치 332, 불일치 33 (stale).
- **호환성 확인**:
  - `grep` 확인 (2026-11-19): `checksum` 필드를 읽거나 검증하는 코드는 생성기와 그 테스트뿐이다.
  - `docs/index/manifest.json` 을 읽는 다른 코드는 없다. 다른 manifest 도구 (`manifest-verify.js`, `manifest-rebuild.js`, `dec-approve.js`, `search-docs.js`) 는 결정 로그 매니페스트 `docs/manifest.json` 과 `docs/decisions/index.md` 를 대상으로 하며, `docs/index/` 를 읽거나 쓰지 않는다.
  - CI (`.github/workflows/manifest-verify.yml`) 는 `docs/**` 변경 시 `docs/manifest.json` 과 `docs/decisions/index.md` 만 검증한다. `docs/index/` 는 검증 대상이 아니다.
  - 따라서 기존 값을 바꾸지 않는 한 소비자 호환 문제는 없다.
- **적용 규칙 (점진적 Blob 기준)**:
  - 기존 엔트리 객체는 그대로 보존 (created_at·checksum·기타 필드 모두).
  - stage 된 문서이고, 기록 checksum 이 HEAD 콘텐츠(LF 또는 CRLF 형태)와 일치하며, Index 콘텐츠가 실제로 다를 때만 `md5(Index 콘텐츠)` 로 갱신.
  - CRLF/LF 차이만 있으면 갱신하지 않음.
  - 기록 checksum 이 HEAD 와 불일치(stale 33건 포함)하면 보류 (감사 대상, 변경 없음).
  - 신규 문서: `md5(Index blob 콘텐츠)`. Blob 내용 기준이며 git blob SHA 자체는 아니다 (문서 콘텐츠 md5 형식 유지).
- **전체 재계산 없음**: 기존 563 checksum 전체를 다시 계산하지 않는다.
- **BLOCKED 항목**: 없음. 호환 문제가 발견되지 않았다.

### 54.3 Git 저장소 재현 검증 (격리 clone)

격리 위치: `C:/DEV/_phx_soul_test_harness/manifest-iso` (HEAD `aebb55e` 의 clone, 실제 저장소 미변경).

| 검증 | 결과 |
|---|---|
| 변경 없이 재생성 | manifest 가 HEAD 와 바이트 동일 (generated_at 제외). tags 도 바이트 동일 |
| 재실행 안정성 | 두 번 실행 결과 동일 (generated_at 제외) |
| S1 미추적 문서 + 백업 복사본 + 작업 트리 EOL 만 변경 + 추적 미등록 sowonpass 문서 | manifest 변경 없음. 백업·sowonpass 미등록 |
| S2 stage 된 신규 문서 | 포함. checksum = md5(Index 콘텐츠). 기존 엔트리 불변 |
| S3 stage 된 내용 변경 (기록 checksum 이 HEAD 와 일치) | 해당 checksum 만 Index 기준으로 갱신. created_at 보존. 타 엔트리 불변 |
| S4 stage 된 삭제 | 해당 엔트리 제거. 타 엔트리 불변 |
| S5 반복 실행 | 동일 |
| S6 훅 경로 (clone 에 기존 훅 파일을 복사해 검증) | 커밋 파일 = 문서 + manifest + tags 3개. 커밋 후 작업 트리 깨끗함 |

### 54.4 테스트 결과

| 테스트 | 결과 |
|---|---|
| 기존 Manifest 생성일 테스트 (M01~M11) | 11/11 통과 |
| 신규 Git Index 테스트 (`generateManifestIndex.test.js`) | 16/16 통과 |
| 합계 | 27/27 통과 |

신규 16개 목록: 미추적 제외, stage 신규 포함(checksum = Index md5), stage 삭제 반영, 추적 unstaged 수정 무시, 부분 stage Index 콘텐츠 사용, 추적 미등록 문서 미등록, 백업 복사본 미등록, created_at 보존(stage 변경 후), CRLF 작업 트리에서 checksum 불변, CRLF 기록 checksum 유지, stale 기록 보류, stage 변경 시 checksum 갱신, LF/CRLF 작업 트리와 무관한 신규 checksum 동일, 반복 실행 안정, manifest·tags 일관성, 부분 필드 엔트리에서 tags 실패 없음.

### 54.5 기존 Manifest 보존 여부

- 기존 563 엔트리 (aebb55e 기준) 는 변경 없음. 격리 재생성 결과가 HEAD manifest 와 바이트 동일 (generated_at 제외).
- 실제 저장소 `docs/index/` 는 이번 단계에서 재생성하지 않았다 (변경 없음 확인: `git diff HEAD -- docs/index` 0).

### 54.6 커밋 범위 확인

- 커밋 전 stage: `scripts/generate-manifest.js`, `tests/unit/generateManifestIndex.test.js` 두 개. docs 스테이징 0건 (Hook 미실행).
- 커밋 후 파일: 위 두 개. 추가 Hook 변경 없음. 작업 트리 상태는 문서 미추적 파일과 `DREAMTOWN_STATUS.md` 만 남음 (커밋 제외 대상).
- Hybrid 서비스, Privacy Guard, Route Gate 변경: 0 (`git diff HEAD --name-only -- services routes database utils` 0, privacy·routeSkeletonGate 0).

### 54.7 후속 과제 (이번 범위 제외, 기록만)

1. 기존 checksum 불일치 33건 감사 및 필요 시 재계산 (별도 결정).
2. 기존 중복 ID 9건 (ID 40자 절단 원인) 수정.
3. Status 추출 오류 2건 (`RC3_SELECTIVE_RECOVERY`: `내용`, `REAL_LLM_FINAL_RETRY`: `superseded`).
4. 문서 분류 체계 재설계, Knowledge Operating System 개선 — 별도 과제.
5. 신규 문서 `created_at` 은 등록일 (경로·frontmatter 에 날짜 없을 때). 작성일이 필요하면 문서에 날짜 메타데이터를 두는 규칙 필요.

### 54.8 원격 브랜치 준비 상태

- 로컬 커밋 (미push): `ad3503a`, `79a40af`, `7b7c866`, `aebb55e`, `3f20aef`. 모두 `feat/phx-soul-hybrid-v1` 위.
- 원격 상태 (확인됨): `origin/feat/phx-soul-hybrid-v1` 은 `5c36837` 을 가리킨다. 로컬은 그보다 5 커밋 앞서 있고 (`git rev-list --count @{u}..HEAD` = 5), 원격에서 뒤처진 커밋은 없다 (0).
- 원격 보존 준비: 로컬 커밋 5개는 원격에 없다. 보존하려면 push 가 필요하며, 이 단계에서는 push 하지 않았다 (금지 사항).
- push, PR, merge 하지 않았다.

### 54.9 정본 SOUL Evidence 연결

- 정본 (`daily-miracles-mvp`, 다른 체크아웃): 읽기만. 미수정.
- 본 워크트리 Evidence: §47·§48 (`PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md`), §49 (`RC3_FINDINGS_S49_V1.md`), §50 (`RC3_SELECTIVE_RECOVERY_V1.md`), §51·§52 (`RC3_ROUTE_GATE_V1.md`), §53 (`MANIFEST_SELECTIVE_RECOVERY_V1.md`), §54 (이 문서).
- 이 문서들은 docs 커밋 금지 조건에 따라 커밋하지 않았다. 외부 SHA256 백업으로 보존.

### 54.10 Current Next Action (exactly 1)

**SOUL 고객 응답 품질 개선으로 복귀한다. 첫 과제는 H06·H14·H19 (걷기·첫 방문 추천) 의 Clarify 정책 설계 Preflight 발행이며, 그 전까지 docs 문서 커밋은 하지 않고 로컬 커밋 5개를 push하지 않는다.**
