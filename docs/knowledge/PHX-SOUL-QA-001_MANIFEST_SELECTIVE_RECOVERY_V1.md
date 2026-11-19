# PHX-SOUL-QA-001 — Manifest Selective Recovery (V1, 2026-11-19)

> 범위: `docs/index/manifest.json`, `docs/index/tags.json` 선별 복구와 생성기(`scripts/generate-manifest.js`)의 생성일 보존 로직 이식.
> 금지: amend, reset, rebase, force push, 기존 Git History 재작성, Manifest Repair 브랜치 병합, Git Hook 우회·변경, 타 Workstream 문서 수정, Hybrid·Route Gate 코드 변경, 실제 LLM 호출, 운영 DB 연결, push·PR·merge, Render 배포.
> Manifest 복구 완료는 운영 출시 승인이 아니다.

## Guardian Preflight Report (변경 전 발행)

```
### Guardian Preflight Report

Requested Change:
  79a40af 의 manifest 1,595행 손상 복구 (Founder 승인 2026-11-19).
  (1) 기존 문서 created_at 원복, (2) 기존 checksum 원복, (3) 백업 사본·타 세션·타 Workstream 문서 등록 제거,
  (4) 승인된 신규 Evidence 4건 등록 유지 + 해당 tags 유지, (5) 생성기에 4f96e21 생성일 보존 로직 선별 이식.

Existing Assets Found:
  4f96e21 "fix(docs): preserve manifest created_at across regeneration" (브랜치 fix/phx-manifest-created-at-repair, HEAD 조상 아님)
    변경: scripts/generate-manifest.js (+isValidIsoDate, todayInSeoul, loadPreviousCreatedAt, resolveCreatedAt, 통계 출력)
          tests/unit/generateManifest.test.js (M01~M11, 임시 저장소만 사용)
  기준 manifest: ad3503a:docs/index/manifest.json (563 문서, 107 tag key) — 손상 전 상태
  손상 manifest: 79a40af:docs/index/manifest.json (578 문서, 109 tag key)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — feat/phx-soul-hybrid-v1, HEAD 7b7c866
  git show로 ad3503a, 79a40af, 4f96e21 의 파일 조회 (브랜치 병합 없음)

Relevant Files:
  docs/index/manifest.json, docs/index/tags.json, scripts/generate-manifest.js, tests/unit/generateManifest.test.js (복사)

Relevant Databases:
  없음.

Change Classification:
  REPAIR (manifest 메타데이터 복구) + CONNECT (4f96e21 로직 선별 이식). 신규 설계 없음.

Connection Opportunity:
  4f96e21의 resolveCreatedAt 이 기존 생성 경로에 직접 연결됨 (이전 manifest 값 보존).

Duplication Risk:
  중간 — 생성기 출력 ID가 40자로 잘려 docs/knowledge 와 docs/knowledge/backups 의 동일 접두 파일이 같은 ID를 가질 수 있음.
  복구 후 ID 중복 검사로 확인.

Data Risk:
  낮음 — 운영 데이터 없음. 기존 문서 본문 미변경. 타 Workstream 문서 미변경 (등록 목록에서만 제외).
  checksum 은 기존 값을 그대로 보존 (해시 조작 없음). 기존 checksum 계약이 혼재 (LF 198 / CRLF 332 / 불일치 33) 하므로
  계약 자체의 변경은 별도 결정으로 보고.

Recommended Approach:
  1) 격리 위치 (C:/DEV/_phx_soul_test_harness/manifest-verify)에서 이식된 생성기로 승인 신규 4건의
     필드·tags 를 생성 (입력 = git 저장소의 LF blob, 기존 manifest 를 previous 로 사용). 두 번 실행해 결과 안정성 확인.
  2) 기준 manifest(ad3503a)의 기존 문서 객체를 바이트 수준으로 보존 + 신규 4건만 추가. tags 는 기준 + 신규 4건 참조만 추가.
  3) 생성기에 4f96e21 변경(scripts/generate-manifest.js)을 적용하고, 4f96e21 테스트 파일을 복사해 재실행.
  4) 검증: created_at·checksum 원복 건수, 중복 ID, 백업·타 Workstream 미등록, tags 일관성, 재생성 안정성, Hybrid·Route Gate·Privacy 변경 0건.
  5) 코드·테스트·manifest 만 로컬 커밋 (docs/index 는 Hook 조건상 자동 재생성 대상 아님을 사전 확인).

Questions Requiring Decision:
  Q-M1. 신규 4건 checksum 기준: 본 복구는 git 저장소 LF 내용 기준으로 계산 (checkout 환경과 무관한 재현성).
        기존 checksum 계약 통일(LF 또는 CRLF) 과 stale 33건·CRLF 332건 처리는 별도 결정 (본 단계 미변경).

Implementation Status: READY (Q-M1 은 판단 사항으로 명시, 기존 값은 변경하지 않음)
```

## §53 — Manifest 복구 결과 (2026-11-19)

**로컬 정정 커밋: `aebb55e`** (기존 커밋 `ad3503a`·`79a40af`·`7b7c866` 재작성 없음. amend·reset·rebase·force push 없음.)

이 복구 완료는 운영 출시 승인이 아니다.

### 53.1 4f96e21 재사용 범위

- 재사용: `scripts/generate-manifest.js`의 생성일 보존 로직 전체 (`isValidIsoDate`, `todayInSeoul`, `loadPreviousCreatedAt`, `resolveCreatedAt`, 생성 통계 출력, 오류 경로 날짜 처리). 4f96e21의 생성기 파일은 HEAD 생성기에 이 변경만 더한 것임을 확인한 뒤 그대로 적용했다.
- 재사용: `tests/unit/generateManifest.test.js` (M01~M11). 임시 저장소만 사용하며 실제 저장소 파일을 건드리지 않는다.
- 미사용: 4f96e21 브랜치 병합 없음. 다른 변경 없음.
- 검증: 테스트 11/11 통과 (M10 hook 테스트 포함, 격리된 임시 저장소에서만 실행).

### 53.2 Manifest 복구 전후 비교 (`79a40af` → `aebb55e`)

| 항목 | 79a40af (손상 전 HEAD) | aebb55e (복구) | 기준 ad3503a (손상 이전) |
|---|---|---|---|
| 문서 수 | 578 | 567 | 563 |
| 기존 문서 created_at 변경 | 430건 (2026-11-12 → 2026-11-19) | **430건 원복** (2026-11-12) | — |
| 기존 문서 checksum 변경 | 229건 (CRLF 작업 트리 값) | **229건 원복** (기록된 값) | — |
| 등록 제거 | — | **11건 제거** | — |
| 신규 Evidence 등록 | 4 | **4 유지** | — |

- 기존 563개 문서는 ad3503a와 **바이트 단위로 동일** (`changed existing: 0`).
- 신규 4건 checksum은 79a40af 값과 동일 (`8ebad9c8`, `e11ebf38`, `050d6e34`, `a099821d`).
- 제거된 11건:
  - 백업 사본 9건 (`docs/knowledge/backups/` 하위, 미추적 파일)
  - 타 세션 문서 1건 (`docs/knowledge/PHX-SOUL-QA-001_TEST_ENV_PREFLIGHT_V1.md`, 미추적)
  - 타 Workstream 문서 1건 (`docs/research/sowonpass/PHX-BENEFIT-001_Checklist_본부장대조.md`, 추적 파일이지만 manifest 등록 대상 아님)
- 문서 본문 변경: 없음. 타 Workstream 문서 수정: 없음 (등록 목록에서만 제외).

### 53.3 Tags 복구

- 기준 tag key 107개 유지. 제거된 문서 참조만 제거 (백업·타 세션·타 Workstream).
- 추가 참조는 승인된 신규 4건에 대한 것만 (8건 참조). 댕글링 참조 0건.
- 제거된 참조 0건 (기준 대비). 새 key 없음 (`backups`, `sowonpass` key 제거됨).

### 53.4 checksum 변경 원인 및 처리

- 원인 (확인됨): `.gitattributes`의 `* text=auto` 와 Windows 작업 트리의 CRLF. 생성기는 작업 트리 바이트로 md5를 계산한다. 79a40af 생성 시 229건이 CRLF 값으로 바뀌었다. 내용 변경은 없다.
- 기존 계약 확인 결과 (기준 ad3503a의 563건): 작업 트리 CRLF 값과 일치 332건, LF(git blob) 값과 일치 198건, 어느 쪽과도 불일치 33건 (기록 이후 내용 변경으로 보이는 stale 값).
- 처리: **기존 checksum은 한 건도 수정하지 않았다** (해시 조작 없음). 229건은 기록된 값으로 원복했다. 33건 stale 값도 그대로 둔다.
- 신규 4건: 격리 생성기가 git blob 내용(LF)으로 계산한 값. 79a40af 값과 같다.
- **결정 필요 (Q-M1)**: checksum 계약을 LF 또는 CRLF 중 하나로 통일할지, stale 33건을 현재 내용으로 재계산할지. 본 단계는 계약을 변경하지 않았다.

### 53.5 신규 Evidence 등록 상태

- 등록 유지 (4건, `docs/knowledge/`):
  - `PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md`
  - `PHX-SOUL-QA-001_RC3_RECOVERY_PLAN_V1.md`
  - `PHX-SOUL-QA-001_RC3_FINDINGS_S49_V1.md`
  - `PHX-SOUL-QA-001_RC3_SELECTIVE_RECOVERY_V1.md`
- 신규 4건의 created_at은 2026-11-19 (경로와 frontmatter에 날짜가 없어 등록일로 기록됨. 4f96e21 정책: 근거 없는 값은 작성일로 확정하지 않음).
- **생성된 status 값 이상 (보고 사항)**: `RC3_SELECTIVE_RECOVERY`는 status `내용`(본문 표 헤더 추출), `REAL_LLM_FINAL_RETRY`는 `superseded`(본문 문구 "대체됨" 추출). 생성기 status 추출 로직의 한계이며 4f96e21 범위 밖. 문서 본문은 수정하지 않았다.

### 53.6 불필요 문서 등록 정리 결과

- 백업 사본 9건: 제거 완료. 복구 후 manifest에 `backups/` 경로 0건.
- 타 세션 문서 `PHX-SOUL-QA-001_TEST_ENV_PREFLIGHT_V1.md`: 제거 완료 (미추적, 해당 세션 산출물).
- 타 Workstream 문서 `PHX-BENEFIT-001_Checklist…`: 제거 완료. 파일 자체는 변경하지 않음.

### 53.7 테스트 및 검증 결과

| 검증 | 결과 |
|---|---|
| 4f96e21 생성일 보존 테스트 (M01~M11) | 11/11 통과 |
| 격리 위치 생성기 2회 실행 안정성 | 문서·tags 동일 (generated_at 제외) |
| 기존 563 문서 바이트 동일성 (ad3503a 대비) | 563/563 |
| 신규 등록 확인 | 4건 정확 |
| 타 Workstream·백업 미등록 | 0건 |
| 중복 ID | 9건 — 기준 ad3503a에 이미 존재하던 것과 동일 집합 (본 복구로 새로 생기지 않음) |
| tags 일관성 | 댕글링 0건 |
| Hybrid·Route Gate·Privacy Guard 코드 변경 | 0건 (`git diff HEAD --name-only -- services routes database utils` 0, privacy 0) |
| 커밋 파일 | 4개 (`docs/index/manifest.json`, `docs/index/tags.json`, `scripts/generate-manifest.js`, `tests/unit/generateManifest.test.js`) |
| 커밋 후 Hook 추가 변경 | 없음 (커밋 파일 4개 그대로, 스테이징 잔여 0) |

- 격리 위치: `C:/DEV/_phx_soul_test_harness/manifest-verify/` (생성기 실행, 병합 스크립트 `merge-manifest.js`).
- 전체 Jest 회귀는 이번 단계에서 재실행하지 않았다 (코드 변경 없음, 생성기 테스트 11/11 통과). 필요 시 별도 실행.

### 53.8 Hook 조건과 잔여 위험

- Hook (`C:/DEV/daily-miracles-mvp/.git/hooks/pre-commit`, 공유)은 `docs/` 중 `docs/index/`가 **아닌** 파일이 스테이징될 때만 manifest를 재생성한다. 이번 커밋은 `docs/index/` 4개만 포함하므로 Hook이 실행되지 않았다.
- **잔여 위험**: 생성기는 여전히 작업 트리 전체를 스캔한다 (미추적 파일 포함). 다음 `docs/` 커밋에서 Hook이 실행되면 백업 사본·타 세션 문서가 다시 등록될 수 있다. 이 위험은 Founder 결정 전까지 **docs 커밋 금지**로 관리한다.
- Hook 설정과 우회 금지 지시를 준수했다. Hook 파일은 변경하지 않았다.

### 53.9 정본 SOUL Evidence 연결 상태

- 정본 (`daily-miracles-mvp/docs/knowledge/PHX-SOUL-QA-001_RESPONSE_ROUTING_INVESTIGATION.md`, 다른 체크아웃): 읽기만. 미수정.
- 본 워크트리 Evidence: §47·§48 (`PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md`), §49 (`RC3_FINDINGS_S49_V1.md`), §50 (`RC3_SELECTIVE_RECOVERY_V1.md`), §51·§52 (`RC3_ROUTE_GATE_V1.md`), §53 (이 문서).
- 커밋: `ad3503a` (RC3 코드), `79a40af` (§47~§50 Evidence), `7b7c866` (Route Gate), `aebb55e` (Manifest 정정).
- 이 문서와 §51·§52 문서는 커밋하지 않았다 (docs 커밋 금지 조건). 외부 SHA256 백업으로 보존.

### 53.10 남은 미해결 항목

1. **Q-M1 checksum 계약**: LF/CRLF 통일 여부, stale 33건 재계산 여부. 별도 결정.
2. **미추적 파일 스캔 정책**: 생성기 제외 규칙 (백업·타 세션 파일). 별도 Preflight 필요. 결정 전까지 docs 커밋 금지.
3. **status 추출 오류**: 신규 2건의 status 값 (`내용`, `superseded`). 생성기 개선 또는 문서 표현 정리는 별도 결정.
4. **중복 ID 9건**: ID 40자 절단으로 발생한 기존 문제. 별도 결정.
5. **운영 출시**: 이 복구는 운영 출시 승인이 아니다. 개인정보 법률 검토 BLOCKED 유지. Route Exposure Gate 운영 승인 없음.

### 53.11 Current Next Action (exactly 1)

**Founder가 미추적 파일 스캔 정책과 checksum 계약(Q-M1)을 결정할 때까지 `docs/` 커밋을 하지 않는다. 결정 후 생성기 제외 규칙을 별도 Guardian Preflight로 적용한다.**
