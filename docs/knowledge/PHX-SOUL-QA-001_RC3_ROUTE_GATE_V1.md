# PHX-SOUL-QA-001 — RC3 Route Exposure Gate 및 Manifest 변경 조사 (V1, 2026-11-19)

> 범위: 조사와 BLOCKED 보고. 코드 변경 없음. push, PR, merge, Production·main 변경, Render 배포, Hybrid 활성화, 실제 LLM 호출, 운영 DB 연결 없음.
> 선행: `PHX-SOUL-QA-001_RC3_SELECTIVE_RECOVERY_V1.md` (§50, 커밋 `ad3503a`), `PHX-SOUL-QA-001_RC3_FINDINGS_S49_V1.md` (§49), `PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md` (§47·§48).

## Guardian Preflight Report — 작업 A: Route Exposure Gate

```
### Guardian Preflight Report

Requested Change:
  SOUL_ROUTE_SKELETON_ENABLED 플래그로 Route Skeleton 실행과 route.days 노출을 제어.
  기본 OFF, 명시적 활성화 값만 허용, 격리 확인된 로컬·QA에서만 허용, Production 차단, 환경 미확인·잘못된 값 Fail-Closed.
  NODE_ENV 단독 판단 금지. 기존 API 계약·Privacy Guard·Hybrid Architecture 불변.

Existing Assets Found:
  services/soulHybridFlag.js — SOUL_HYBRID_V1 === '1' 단일 플래그 (환경 판단 없음)
  render.yaml — NODE_ENV=production 명시 (운영 Render 서비스)
  .env.example — NODE_ENV, PORT, APP_DISABLED, OUTBOUND_ENABLED, PLAZA_ENABLED 등 (격리 마커 없음)
  Render 런타임 제공 변수: RENDER_SERVICE_ID, RENDER_SERVICE_NAME, RENDER_GIT_BRANCH, RENDER_EXTERNAL_URL (운영 판별 근거로만 사용 가능)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — feat/phx-soul-hybrid-v1, HEAD 79a40af (코드 ad3503a)
  코드·설정 검색: services, routes, server.js, utils, middleware, config, render.yaml, .env.example
  이름 충돌 검색: SOUL_ROUTE_SKELETON* / ROUTE_SKELETON* → 코드·설정에 없음 (문서·백업의 로그 문자열만 존재)

Relevant Files:
  services/soulHybridFlag.js, services/soyeowoolService.js (route 노출: L3671 payload 구성, _buildClientPayload route 키), render.yaml, .env.example

Relevant Databases:
  없음 (조사만). 운영 DB 연결 없음.

Change Classification:
  NEW (격리 식별 체계) — 기존 자산 없음 확인. Founder 지시: 격리 신뢰 구분 설정이 없으면 BLOCKED.

Connection Opportunity:
  기존 SOUL_HYBRID_V1 플래그 패턴 재사용 가능 (플래그 함수 1개). 단 격리 판별은 새 설정이 필요함.

Duplication Risk:
  낮음 (플래그 이름 미사용 확인).

Data Risk:
  높음 — 격리 판별이 잘못되면 운영 Render에서 route.days가 노출됨. 운영 차단 근거가 NODE_ENV(production 값 설정됨)와 RENDER_* 변수뿐이며 격리 QA를 양성 확인할 설정이 없음.

Recommended Approach:
  격리 식별 방식을 Founder가 정한 뒤 별도 Preflight로 구현. 그 전에는 구현하지 않는다 (임의 구현 금지 지시 준수).

Questions Requiring Decision:
  Q-A1. 격리 QA 양성 식별 방식 (아래 §51.2 옵션)
  Q-A2. 격리 QA 식별 설정을 어디에 둘지 (저장소 밖 로컬 파일 / 개인 셸 환경 / QA 전용 배포 설정)

Implementation Status: BLOCKED
```

---

## §51 — Route Exposure Gate 조사 결과 및 Manifest 변경 분석 (2026-11-19)

### 51.1 작업 A 결론: BLOCKED (구현 안 함)

Founder 지시: "격리 환경을 신뢰할 수 있게 구분할 기존 설정이 없다면 임의 구현하지 말고 BLOCKED로 보고한다."

확인 결과:

| 확인 항목 | 결과 |
|---|---|
| 이름 충돌 (`SOUL_ROUTE_SKELETON_ENABLED`) | 없음 |
| 기존 격리·QA 마커 (코드, render.yaml, .env.example) | 없음. `isolat`, `APP_ENV`, `DEPLOY_STAGE`, `QA_MODE`, `STAGING` 검색 0건 |
| NODE_ENV | 44곳 사용. `render.yaml`은 `production` 명시. 로컬 값은 파일에 없음 → 단독 판단 불가 (Founder 조건 6) |
| RENDER_* 변수 | Render 런타임 식별 근거. 운영 차단에는 쓸 수 있으나 "QA 격리 확인"은 불가 |
| SOUL_HYBRID_V1 | 기능 플래그일 뿐 환경 판별 아님 |

따라서 "격리 QA에서만 ON" 조건을 충족하는 신뢰 가능한 기존 설정이 없다. 임의로 식별 설정을 만들면 Founder 지시에 어긋나므로 구현하지 않았다.

### 51.2 Founder 결정 옵션 (택 1)

1. **QA 전용 식별 토큰 방식**: 로컬 셸 또는 저장소 밖 파일에만 존재하는 격리 토큰(예: `SOUL_QA_ISOLATION_ID`)을 요구. 운영 Render에는 설정하지 않음. Render 변수(`RENDER_SERVICE_ID` 존재)가 보이면 무조건 차단. 값이 없거나 형식이 다르면 차단.
2. **Render 차단 + 명시적 로컬 허용**: Render 런타임 변수가 하나라도 보이면 차단. 그 외에는 `SOUL_ROUTE_SKELETON_ENABLED=1`일 때만 허용. 격리 증명은 하지 않으므로 Founder가 "로컬 머신 = 격리"로 수용해야 함 (Founder 조건 3 위반 소지).
3. **보류**: 격리 체계 확정 전까지 `ad3503a`를 배포하지 않는다는 운영 규칙만 유지.

권장: 옵션 1. 운영과 로컬을 구분하는 신뢰 근거가 저장소 밖 토큰이므로 Founder 조건 3·5를 가장 잘 충족한다.

### 51.3 현재 상태의 위험 (중요)

- `ad3503a` 이후 `route` 키는 **모든 환경**의 API 응답에 포함될 수 있다 (`_buildClientPayload`의 `route: routeSkeleton || null`).
- 게이트가 없으므로 이 커밋을 배포하면 Production에 route.days가 노출된다.
- 따라서 **Route Gate 구현 전까지 `ad3503a`와 `79a40af`는 배포·push 대상이 아니다.**
- 비활성 상태의 "기존 API 응답 계약 비교"는 게이트가 없어 수행할 수 없었다 (현재 코드는 항상 활성). 비교는 게이트 구현 후 수행.

### 51.4 작업 B: Manifest 변경 조사 (읽기 전용)

대상: `79a40af`의 `docs/index/manifest.json` (1,595행 변경) 및 `docs/index/tags.json` (+52).

**발생 경로 (확인됨)**

- Hook 파일: `C:/DEV/daily-miracles-mvp/.git/hooks/pre-commit` (공유 git 디렉터리이므로 이 워크트리에도 적용). `docs/` 파일이 스테이징되면 `node scripts/generate-manifest.js` 실행 후 `docs/index/manifest.json`과 `tags.json`을 **자동으로 git add**한다.
- 생성기는 `scripts/generate-manifest.js`의 **현재 브랜치 버전**을 사용한다 (HEAD 기준, 4f96e21 미포함).
- 생성기는 `readdirSync`로 **작업 트리 전체**를 스캔한다 (`git ls-files`가 아님). 미추적 파일도 포함된다.

**변경 분해 (manifest 이전 `HEAD~1` 대비, 기존 563 → 신규 578 문서)**

| 구분 | 건수 | 내용 | 판정 |
|---|---|---|---|
| 신규 등록 — 본 세션 Evidence | 4 | `docs/knowledge/PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md`, `…_RC3_RECOVERY_PLAN_V1.md`, `…_RC3_FINDINGS_S49_V1.md`, `…_RC3_SELECTIVE_RECOVERY_V1.md` | **정상 변경** (이번 커밋 `79a40af`의 목적) |
| 신규 등록 — 백업 사본 | 9 | `docs/knowledge/backups/` 하위 (DREAMTOWN_STATUS 사본 5, RC3·REAL 사본 4). 본 세션 생성분 + 이전 세션 생성분 혼재. 미추적 디렉터리 | **불필요** (백업 사본은 Evidence 등록 대상 아님) |
| 신규 등록 — 타 세션 문서 | 1 | `docs/knowledge/PHX-SOUL-QA-001_TEST_ENV_PREFLIGHT_V1.md` (미추적, 다른 세션 산출물) | **불필요·범위 밖** |
| 신규 등록 — 타 Workstream 문서 | 1 | `docs/research/sowonpass/PHX-BENEFIT-001_Checklist_본부장대조.md` (추적 파일, 소원패스 Workstream). 이전 manifest에 없었음 | **범위 밖** (다른 Workstream 문서 등록) |
| 기존 문서 `created_at` 변경 | 430 | 전부 `2026-11-12 → 2026-11-19` (생성 실행일로 덮어씀) | **불필요** (메타데이터 손상) |
| 기존 문서 `checksum` 변경 | 229 | 내용 변경 없음. 작업 트리 파일이 CRLF, 커밋 blob은 LF. `.gitattributes`의 `* text=auto` 영향. 229건 전부 CRLF 확인 | **불필요** (체크아웃 환경 의존 해시) |

**4f96e21과의 관계**

- `4f96e21` "fix(docs): preserve manifest created_at across regeneration"은 `created_at` 덮어쓰기를 막는 `resolveCreatedAt` 로직을 추가한다. 430건 변경의 직접 원인을 막는 커밋이다.
- 그러나 `4f96e21`은 **`fix/phx-manifest-created-at-repair` 브랜치에만 있고 이 브랜치 HEAD의 조상이 아니다** (`git merge-base --is-ancestor` 확인). 그래서 이 브랜치의 생성기는 덮어쓰기 로직이 없다.
- `4f96e21`은 checksum 문제를 다루지 않는다 (커밋 메시지·변경 범위 기준). checksum 229건은 별도 원인이며 미해결.

### 51.5 자동 Hook의 추가 커밋 영향과 사전 확인 절차

- Hook은 `docs/` 파일이 스테이징되면 **항상** manifest를 재생성하고 자동 스테이징한다. 우회 금지 지시 준수.
- 따라서 **`docs/`를 포함한 모든 추가 커밋은 manifest 1,600행 규모의 같은 변경을 다시 포함한다.** `created_at`·`checksum` 손상이 계속 쌓인다.
- 사전 확인 명령 (커밋 전 필수):
  ```
  git diff --cached --name-only | grep '^docs/' | grep -v '^docs/index/'
  ```
  결과가 비어 있지 않으면 Hook이 manifest를 재생성한다. 승인 범위 밖이면 커밋하지 않는다.
- 코드 전용 커밋(`services/`, `tests/`)은 Hook이 실행되지 않는다 (`docs/` 미포함).

### 51.6 Manifest 처리 옵션 (Founder 승인 필요, 이번 단계 미실행)

1. `4f96e21`을 이 브랜치에 cherry-pick (새 커밋으로 추가, 히스토리 재작성 없음) → `created_at` 보존. checksum은 별도 수정 필요.
2. `79a40af` 이전 manifest(`79a40af^`)의 `docs/index/`를 복원하는 새 커밋 → 이전 메타데이터 복원. 다음 docs 커밋에서 다시 손상됨.
3. 생성기에서 checksum을 LF 정규화 후 계산 + 미추적·타 Workstream 파일 제외 (생성기 변경은 별도 Preflight 필요).

권장: 3을 포함한 1 (생성기 수정 + 기존 수정 커밋 cherry-pick). 이번 단계에서는 실행하지 않는다.

### 51.7 Evidence 및 상태

- 정본 SOUL Evidence (`daily-miracles-mvp` 다른 체크아웃): 읽기만. 미수정.
- §47~§50: `PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md`, `PHX-SOUL-QA-001_RC3_FINDINGS_S49_V1.md`, `PHX-SOUL-QA-001_RC3_SELECTIVE_RECOVERY_V1.md`, 커밋 `ad3503a`·`79a40af` 보존 (amend·reset·rebase 없음).
- 이 문서(§51): **미커밋**. 커밋하면 Hook이 manifest를 다시 바꾸므로, 51.6 결정 전까지 보류. 워킹트리에 존재.
- `DREAMTOWN_STATUS.md`: SOUL 상태 갱신 (워킹트리, 커밋 제외 — 커밋 전부터 타 세션 변경 포함).

### 51.8 남은 Release Blocker

1. Route Exposure Gate 미구현 (Q-A1 결정 필요). `route` 키가 모든 환경에 노출 가능.
2. Manifest 손상 (created_at 430, checksum 229, 타 세션·타 Workstream 문서 등록). 처리 방식 결정 필요.
3. H06·H14·H19 Clarify 정책, H09 반나절 (별도 과제).
4. 실제 관광 데이터 기반 코스 품질 검증 (미실행).
5. 개인정보 법률 검토 (BLOCKED 유지). 운영 Release HOLD 유지.

### 51.9 Current Next Action (exactly 1)

**Founder가 Q-A1(격리 QA 양성 식별 방식, 권장 옵션 1)을 결정하면 Route Exposure Gate를 별도 Guardian Preflight로 구현한다. 그 전까지 `ad3503a`·`79a40af`는 push·배포하지 않고, 새 docs 커밋은 51.5 사전 확인을 거친다.**

---

## SHA256 백업

- 백업 디렉터리: `docs/knowledge/backups/` (목록은 `PHX-SOUL-QA-001_RC3_ROUTE_GATE_2026-11-19.sha256.txt`)

---

## §52 — Route Exposure Gate 구현 (2026-11-19, Founder 승인: §51.2 옵션 1)

### 52.0 Guardian Preflight Report (코드 수정 전 발행)

```
### Guardian Preflight Report

Requested Change:
  SOUL_ROUTE_SKELETON_ENABLED=1 AND SOUL_QA_ISOLATED=1 이 모두 정확히 "1"일 때만 Route Skeleton 실행과
  route.days 노출을 허용. 그 외 모든 경우 차단 (Fail-Closed). Production·Render 실행은 무조건 차단.
  기존 SOUL_HYBRID_V1과 독립. HEAD 79a40af 및 ad3503a 보존 (재작성 없음).

Existing Assets Found:
  services/soulHybridFlag.js (SOUL_HYBRID_V1 플래그 패턴)
  services/routeSkeletonService.js (ad3503a 복구본), services/soyeowoolService.js 호출부 3곳
    - L2823 날짜 확정 흐름 (try/catch), L2908 날짜 확정 흐름 2
    - L3552 MY ROUTE 블록 (_isJourneyPlanningIntent && quoteCtx)
  Render 실행 식별 변수 (운영 판별 근거): RENDER, RENDER_SERVICE_ID, RENDER_SERVICE_NAME, RENDER_EXTERNAL_URL, RENDER_GIT_COMMIT, RENDER_GIT_BRANCH

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — feat/phx-soul-hybrid-v1, HEAD 79a40af (코드 ad3503a)
  이름 충돌 검색: SOUL_QA_ISOLATED, SOUL_ROUTE_SKELETON_ENABLED → 코드·설정·env 예시에 없음 (0건, 2026-11-19 확인)

Relevant Files:
  services/routeSkeletonGate.js (신규, 판정 함수 1개)
  services/soyeowoolService.js (호출부 3곳에 게이트 조건 추가, 게이트 OFF 시 기존 pre-RC3 동작과 동일하게 건너뜀)
  tests/unit/routeSkeletonGate.test.js (신규, 환경 매트릭스)
  tests/unit/soulRc3SelectiveRecovery.test.js (기존 파일: 게이트 ON 환경에서 실행하도록 조정 + OFF 케이스 추가)

Relevant Databases:
  없음. 테스트는 DB 가짜 Pool·세션 mock. 운영 DB 미접속.

Change Classification:
  NEW (실행 식별자 게이트) — 기존 격리 식별 설정 없음 (§51.1). Founder 승인 옵션 1.

Connection Opportunity:
  기존 soulHybridFlag 패턴(플래그 함수 1개) 재사용. 판정 로직은 새 모듈에 한정.

Duplication Risk:
  낮음. 두 환경변수 이름 미사용 확인.

Data Risk:
  중간 → 낮음으로 완화. 게이트는 실행 식별자이며 DB 격리의 증거가 아니다 (Founder 정책 7).
  SOUL_QA_ISOLATED는 실제 격리가 검증된 테스트 하네스(가짜 pg Pool·세션 stub)에서만 설정한다.
  Render 및 NODE_ENV=production 은 무조건 차단. 운영 환경 설정·render.yaml·운영 .env 변경 없음.

Recommended Approach:
  1) routeSkeletonGate.js: enabled = (SOUL_ROUTE_SKELETON_ENABLED === '1') && (SOUL_QA_ISOLATED === '1')
     차단 우선순위: NODE_ENV==='production'(대소문자 무시) → Render 식별 변수 존재 → 나머지 판정.
  2) 3개 호출부를 게이트로 감쌈. OFF 시 buildSkeleton 미호출, MY ROUTE 블록 전체 건너뜀 (pre-RC3 HEAD와 동일 경로).
  3) API 키 구조·route 필드 값(OFF=null) 비교: pre-RC3(5c36837) 대비 Mock 재생으로 확인.
  4) 신규 환경 매트릭스 테스트 + 기존 RC3·Privacy·Hybrid 회귀.
  5) 코드·테스트만 커밋. 문서 커밋은 하지 않음 (Hook 재생성 방지, Founder 지시).

Questions Requiring Decision:
  없음 (Founder 정책 1~12 명시).

Implementation Status: READY
```

### 52.1 구현 전 검증 목표 (Founder 검증 목록 매핑)

| 검증 | 방법 |
|---|---|
| 모든 env 미설정 → 차단 | 게이트 단위 테스트 |
| ROUTE만 ON → 차단 / QA만 ON → 차단 | 게이트 단위 테스트 |
| 두 값 ON인 QA 하네스 → 허용 | 게이트 단위 + 핸들러 통합 (H20 1n2d) |
| Production + 두 값 ON → 차단 | 게이트 단위 |
| Render + 두 값 ON → 차단 | 게이트 단위 (RENDER, RENDER_SERVICE_ID 각각) |
| 잘못된 값 → 차단 | 게이트 단위 (true, yes, 0, '1 ', '01', 'on' 등) |
| Hybrid flag OFF/ON | 기존 Hybrid 테스트 + 게이트 ON 시 Hybrid 독립 확인 |
| 비활성 API 계약 비교 | pre-RC3(5c36837) vs 게이트 OFF, H01~H20 Mock 재생 |
| H10 당일 보호 / H20 숙박 골격 / 후보 0건 보호 | 기존 RC3 테스트 + 재생 |
| Privacy·Hybrid 회귀 | 기존 suite 실행 |

### 52.2 구현 결과

- **구현 위치**: `services/routeSkeletonGate.js` (판정 함수 `isRouteSkeletonEnabled`, 1개). 호출부는 `services/soyeowoolService.js` 3곳 (날짜 확정 흐름 2곳 `if (isRouteSkeletonEnabled()) try {…}`, MY ROUTE 블록 조건 `&& isRouteSkeletonEnabled()`).
- **판정 규칙**: `SOUL_ROUTE_SKELETON_ENABLED === '1'` 과 `SOUL_QA_ISOLATED === '1'` 이 모두 정확히 `'1'` 일 때만 허용. 이후 차단 우선: `NODE_ENV`가 production(대소문자·공백 무시) → 차단. Render 식별 변수 `RENDER`, `RENDER_SERVICE_ID`, `RENDER_SERVICE_NAME`, `RENDER_EXTERNAL_URL`, `RENDER_GIT_COMMIT`, `RENDER_GIT_BRANCH` 중 하나라도 비어 있지 않으면 차단.
- **이름 충돌**: 두 환경변수 이름은 저장소 전체에서 미사용 (구현 전 확인).
- **Hybrid 독립**: `SOUL_HYBRID_V1`을 읽지 않음. 테스트로 확인.

### 52.3 환경별 검증 결과 (`tests/unit/routeSkeletonGate.test.js`, 40개 + `routeSkeletonTests` 24)

| Founder 검증 항목 | 결과 |
|---|---|
| 모든 환경변수 미설정 → 차단 | PASS |
| ROUTE 플래그만 ON → 차단 | PASS |
| QA 식별자만 ON → 차단 | PASS |
| 두 값 ON 격리 하네스 → 허용 | PASS (NODE_ENV 미설정, development, test) |
| Production + 두 값 ON → 차단 | PASS |
| Production + 비활성 (OFF) → 차단 | PASS (OFF 판정) |
| Render + 두 값 ON → 차단 | PASS (RENDER_RUNTIME_VARS 6개 각각 검사) |
| 로컬 + Route OFF → 차단 | PASS (기본값) |
| 잘못된 값 → 차단 | PASS (`true`, `yes`, `on`, `0`, 빈 문자열, `' 1'`, `'1 '`, `'01'`, `'1.0'`, `'TRUE'`, `'2'`, `'y'` 를 두 변수 각각에 대해 검사) |
| env 객체 없음 → 차단 | PASS |
| Hybrid 값 변화와 무관 | PASS |

### 52.4 핸들러 통합 결과 (`tests/unit/routeSkeletonGateHandler.test.js`, 7개 + RC3 9개)

- 게이트 OFF (env 미설정, ROUTE만, QA만, Production+두 값, 잘못된 값): 명시적 1박 2일도 route 없음, `buildSkeleton` 미호출, journey_ctx에 route_id 미기록. **PASS**
- 게이트 ON (격리 하네스): 명시적 1박 2일 → 1n2d. **PASS**
- RC3 기존 9개 (H10 당일 보호, H09, H20 숙박 골격, 후보 0건 골격 차단, M4 문구): 격리 하네스로 QA 식별자를 설정하도록 조정 후 **PASS**.

### 52.5 Mock 재생 기반 API 계약 비교 (실제 LLM 호출 없음)

비교 대상: pre-RC3 `5c36837` (git archive, 저장소 밖), 현재 게이트 OFF, 현재 게이트 ON. 각 설정에서 기록된 실제 모델 응답 20개를 재생.

| 시나리오 | 게이트 OFF vs pre-RC3 | 게이트 ON |
|---|---|---|
| A (고정 stub 4행) | 응답 키 집합 20/20 동일. route 노출 0. status·presentation 동일. 메시지 차이는 H04·H17 (M3), H10 (M4) 뿐 | route 생성 H20 1n2d만. H10·H09 route 없음. 키 집합 OFF와 동일 |
| B (후보 0건) | 키 집합 20/20 동일. route 노출 0. 메시지 차이는 H04·H17 (M3) | route 없음. H20도 골격 차단 |

- 메시지 차이는 §50에서 승인된 M3·M4 수정이며, 이번 게이트와 무관하다. 게이트 OFF에서도 유지된다. 이는 "기존 응답 동작 보존"에 대한 예외로 명시한다.
- 재생 결과: `C:/DEV/_phx_soul_test_harness/results/replay-{A,B}-{pre-rc3,gate-off,gate-on}.json`.

### 52.6 전체 회귀 (Jest 30.5.2, 저장소 밖)

| 구분 | 수정 전 기준선 (HEAD `5c36837`) | 현재 `7b7c866` | 실패 suite 집합 |
|---|---|---|---|
| Hybrid 플래그 unset | 731 pass / 1 fail (R20) | **811 pass / 1 fail (R20)** | 기준선과 동일 (7 suite: supertest 4, 테스트 0개 2, R20 1) |
| Hybrid 플래그 = 1 | 729 pass / 3 fail (LB-I7, R4, privacyHotfix) | **809 pass / 3 fail** | 기준선과 동일 |
| Hybrid 플래그 = 0 | (unset과 동일) | **811 pass / 1 fail** | 기준선과 동일 |

- 증분 확인: 811 = 731 + 24 (복구) + 9 (RC3) + 40 (게이트 매트릭스) + 7 (게이트 핸들러). 신규 실패 0건.
- Privacy·Hybrid 회귀 (`tests/privacy`, `soulPrivacyGuard`, `soulPrivacyWire`, `soulHybridV1*`): 전체 실행에 포함되어 실패 목록에 없음.

### 52.7 커밋·범위 확인

- 로컬 코드 커밋: **`7b7c866`** (`services/routeSkeletonGate.js`, `services/soyeowoolService.js`, `tests/unit/routeSkeletonGate.test.js`, `tests/unit/routeSkeletonGateHandler.test.js`, `tests/unit/soulRc3SelectiveRecovery.test.js`).
- 커밋 전 사전 확인: `docs/` 스테이징 0건 → 자동 Hook 미실행. Manifest·tags 미변경. 기존 커밋 amend·reset·rebase 없음.
- 미변경: `render.yaml`, 운영 `.env`, Privacy Guard, Hybrid 아키텍처, 고객 UI, 다른 Workstream 문서.
- 이 문서(§51·§52)는 커밋하지 않았다. Founder 지시에 따라 검증된 로컬 SHA256 백업으로 보존.

### 52.8 정본 Evidence 연결 상태

- 정본 SOUL Evidence (`daily-miracles-mvp` 다른 체크아웃): 읽기만. 미수정.
- 본 워크트리 Evidence: §47·§48 (`REAL_LLM_FINAL_RETRY_V1.md`), §49 (`RC3_FINDINGS_S49_V1.md`), §50 (`RC3_SELECTIVE_RECOVERY_V1.md`), §51·§52 (이 문서). 커밋: `ad3503a`, `79a40af`, `7b7c866`.

### 52.9 남은 Release Blocker

1. **운영 배포 전 격리 식별의 한계**: `SOUL_QA_ISOLATED`는 실행 식별자이지 DB·세션 격리 증거가 아니다 (정책 7). 격리 하네스 밖에서 두 값이 설정되면 노출된다. 운영 설정에 두 값을 두지 않는다는 운영 절차가 필요하다 (이번 단계는 운영 설정 변경 금지).
2. Manifest 손상 (created_at 430, checksum 229, 타 세션·타 Workstream 문서 등록): 별도 승인 대상. 4f96e21 미병합 상태 유지.
3. H06·H14·H19 Clarify 정책, H09 반나절 (별도 과제).
4. 실제 관광 데이터 기반 코스 품질 검증 (미실행).
5. 개인정보 법률 검토 (BLOCKED 유지). 운영 Release HOLD 유지.

### 52.10 Current Next Action (exactly 1)

**Manifest 복구 방식(§51.6)에 대한 Founder 승인을 받는다. 그 전까지 `7b7c866`·`79a40af`·`ad3503a`는 push하지 않으며, 문서 커밋은 Hook 사전 확인 없이 진행하지 않는다.**
