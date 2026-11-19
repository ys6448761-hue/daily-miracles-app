# PHX-SOUL-QA-001 — RC3 Selective Recovery (V1, 2026-11-19)

> 범위: 로컬 커밋까지. push, PR, merge, Render 배포, Hybrid 운영 활성화 없음. Production 및 main 변경 없음.
> 선행 조사: `PHX-SOUL-QA-001_RC3_RECOVERY_PLAN_V1.md`, `PHX-SOUL-QA-001_RC3_FINDINGS_S49_V1.md` (§49).

## Guardian Preflight Report (코드 수정 전 발행)

```
### Guardian Preflight Report

Requested Change:
  RC3 선별 복구. M1 routeSkeletonService.js 복구 (staging 원본), M2 routeSkeletonTests.test.js 24개 복구·재검증,
  M3 H04·H17 관람 소요시간/운영시간 모순 제거 (시간 값 불변), M4 추천 완료 표현을 실제 후보가 있을 때만 사용,
  M5 숙박 조건 없는 요청에서 2일 일정 생성 차단.
  Founder 결정 2026-11-19: Q1 route.days는 로컬·격리 테스트에서만 허용 (Production API 노출·고객 UI 변경 금지).
  Q2 H10: 성인 가족 3명·도보 조건 유지, 숙박 미명시 시 1박2일 생성 금지, 도보 연결 미검증 시 후보로 구분.

Existing Assets Found:
  origin/staging/storybook-c7a: services/routeSkeletonService.js (164줄), tests/unit/routeSkeletonTests.test.js (289줄)
  Hybrid 호출부: services/soyeowoolService.js L2810, L2895 (날짜 확정), L3549 (MY ROUTE 블록, try/catch)
  기존 테스트 기준선: tests/soul, tests/unit, tests/privacy (아래 Baseline 참조)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — feat/phx-soul-hybrid-v1, HEAD 5c36837, 엔진 변경 0
  origin/staging/storybook-c7a — 파일 조회·복사만 (merge 없음)

Relevant Files:
  services/routeSkeletonService.js (신규 복구), services/soyeowoolService.js (M3·M4·M5 수정 지점: L586, _generateSoulMessage PARTIAL, MY ROUTE 블록)
  tests/unit/routeSkeletonTests.test.js (신규 복구), tests/unit/soulRc3SelectiveRecovery.test.js (신규 검증)

Relevant Databases:
  없음. 운영 DB·sowon DB 미접속. 테스트는 DB 가짜 Pool.

Change Classification:
  M1·M2: CONNECT (기존 staging 모듈 선별 연결, 신규 설계 아님)
  M3·M4·M5: REPAIR (기존 문구·조건 보정). 신규 키워드 규칙 추가 없음.

Connection Opportunity:
  기존 호출부 3곳이 이미 모듈을 require하므로 파일 복구만으로 연결된다.

Duplication Risk:
  낮음. 새 Route Engine·POC 설계 없음. staging 전체 merge 금지 (파일 단위 복구만).

Data Risk:
  낮음. 실제 LLM 호출 없음 (기록된 실제 응답 재생 Mock 사용). 운영 데이터 미사용.
  Privacy Guard 및 Hybrid Privacy Wire 코드 변경 없음 (회귀 검증 대상).
  미검증 이동시간·장소 연결성을 생성하지 않는다.

Recommended Approach:
  1) M1·M2 파일 복구 → 24개 테스트 실행
  2) M3 1줄 제거
  3) M5 명시적 N박 조건에서만 skeleton 생성, write-back 유지
  4) M4 후보 0건이면 "골라봤어요" 금지, 후보는 있으나 연결 미검증이면 구분 문구
  5) 신규 테스트 파일로 H04·H17·H10·H20·H09 시나리오 검증
  6) 기준선 대비 전체 회귀 (플래그 off/on), 기록된 실제 응답 재생으로 H01~H20 Mock 재실행
  7) 로컬 커밋 (push 없음)

Questions Requiring Decision:
  없음 (Founder 결정 Q1·Q2 반영). H06·H14·H19 Clarify 정책과 H09 반나절은 별도 과제로 유지.

Implementation Status: READY
```

## Baseline (수정 전, 2026-11-19)

- 실행: `node C:/DEV/_phx_soul_test_harness/jest-tools/node_modules/jest/bin/jest.js tests/soul tests/unit tests/privacy` (jest 30.5.2, 저장소 밖 설치, package.json 미변경)
- 결과: Test Suites 39 passed / 7 failed (46). Tests 731 passed / 1 failed / 2 todo (734).
- 기존 실패 원인 (수정과 무관):
  - supertest 미설치 → `flowTicket`, `flowHoldSodamDecision`, `flowConfirm`, `soulCustomRouteV01HttpGate` (4 suite)
  - 테스트 0개 → `placeBasicInfoFormatters`, `privacyHotfix` (2 suite)
  - R20 "돌산대교 걸어서 건너갈 수 있어?" 1건 (기존 R20 FAIL)
- 로그: `C:/DEV/_phx_soul_test_harness/baseline-jest.txt`

## §50 — RC3 선별 복구 구현 및 검증 결과 (2026-11-19, 로컬 커밋)

> 로컬 커밋 `ad3503a`. push, PR, merge, 배포, Hybrid 활성화 없음. Production·main 변경 없음.
> 실제 LLM 점수(8 성공 / 8 부분 / 4 실패, §48) 보존. 이번 Mock 재현은 점수를 갱신하지 않는다.
> 정본 연결: 정본 SOUL Evidence (`daily-miracles-mvp` 다른 체크아웃) 는 읽기만 했고 쓰지 않았다.

### 50.1 변경 파일 (커밋 `ad3503a`)

| 파일 | 상태 | 내용 |
|---|---|---|
| `services/routeSkeletonService.js` | 신규 (복구) | staging 원본, blob `86d4a70` 일치 (M1) |
| `tests/unit/routeSkeletonTests.test.js` | 신규 (복구) | staging 원본, blob `c450a6c` 일치 (M2) |
| `services/soyeowoolService.js` | 수정 36행 (+29 / -7) | M3 문구 1줄, M4 후보·구분 문구, M5 명시적 N박 게이트 + 표지만 골격 차단 |
| `tests/unit/soulRc3SelectiveRecovery.test.js` | 신규 | 9개 시나리오 (H04·H17·H10·H09·H20·후보 0건) |

- 제외: `DREAMTOWN_STATUS.md` (커밋 전부터 다른 세션 변경 포함), `docs/knowledge/backups/`, `tests/fixtures/*` (기존 미추적).
- 이 §50 문서와 §49 문서들은 별도 커밋으로 기록한다 (아래 50.7).

### 50.2 M1·M2 — 기존 Route Skeleton 복구 결과

- `routeSkeletonTests.test.js` 24/24 통과 (`jest tests/unit/routeSkeletonTests.test.js`).
- 복구 파일은 staging과 바이트 단위로 동일 (`git hash-object` 일치). staging 전체 merge 없음.

### 50.3 M3 — H04·H17 시간 의미 구분

- 제거: `운영시간은 …예요. (관람 소요시간이 아니라 운영시간이에요.)` 의 괄호 문구 (`soyeowoolService.js` STAY 분기).
- 불변: 120분 평균 체류, 운영시간 값(09:00~17:00), "운영 상황은 방문 전에 한 번 더 확인" 문구.
- 확인 (Mock 재현, 기록된 실제 응답 사용): H04·H17 응답에서 모순 문구 제거, 나머지 문장 동일.

### 50.4 M4 — 추천 완료 표현

- 후보 0건 + 장소 문맥 없음 → "골라봤어요" 금지. "확인된 장소 후보가 없어요" 계열 문구 (또는 기존 "찾지 못했어요" 응답).
- 후보 있음 + 일정 없음 (일정 요청) → "확인된 장소 후보를 알려드릴게요. 장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요."
- 장소 문맥(현재 장소 페이지)이 있는 흐름은 기존 문구 유지 (영향 최소화).
- 고정 stub 데이터는 harness에서 "stub"으로 별도 표기. 코드에서 stub을 구분하지 않는다 (프로덕션 데이터와 분리).

### 50.5 M5 — 숙박 조건 없는 당일 요청

- 골격 생성 조건: 요청 문장에 `N박` 명시. 미명시이면 골격을 만들지 않고 `journey_ctx.nights`를 임의로 1로 기록하지 않는다 (null 유지).
- 골격이 있어도 실제 장소 항목(추천 장소 또는 선택 레저)이 하나도 없으면 코스로 제시하지 않는다 (`ROUTE_READY` 아님).

### 50.6 검증 결과

**단위·회귀 (Jest 30.5.2, 저장소 밖 설치, package.json 무변경)**

| 구분 | 기준선 (수정 전, HEAD, flag unset) | 수정 후 (ad3503a, flag unset) | 수정 후 flag=0 | 수정 후 flag=1 | HEAD flag=1 기준선 |
|---|---|---|---|---|---|
| Tests passed | 731 | 764 (+33) | 764 | 762 | 729 |
| Tests failed | 1 (R20) | 1 (R20) | 1 (R20) | 3 | 3 |
| Suites failed | 7 (supertest 4, 테스트 없음 2, R20 1) | 7 (동일) | 7 (동일) | 9 | 9 |
| 실패 테스트 이름 | R20 | R20 | R20 | LB-I7, R4, privacyHotfix exit | 동일 |

- flag=1 실패 3건은 수정 전 HEAD에서도 동일하게 실패 (HEAD 사본 `baseline-head` 로 대조). 신규 실패 0건.
- +33 = 신규 `routeSkeletonTests` 24 + `soulRc3SelectiveRecovery` 9.
- 신규 9개 시나리오 전부 통과: H04·H17 모순 제거, H10 당일 요청 route 없음, H10 nights 미기록, H09 다일 일정 없음, H20 명시적 1n2d 유지, H20 후보 0건 route 없음, 후보 0건 "골라봤어요" 금지, 후보 있음 연결 미검증 구분.

**Privacy 및 Hybrid 회귀 (명시 실행)**

- `soulPrivacyGuard`, `soulPrivacyWire`, `soulHybridV1Guard`(unit), `soulHybridV1Direct`, `soulHybridV1Fast`, `soulHybridV1Adaptive`, `soulHybridV1Repair01` → 7 suites, 75 tests 전부 통과.
- Privacy Guard 파일 변경: 0건 (`git status`로 확인).

**Mock 재현 (기록된 실제 LLM 응답 재생, 네트워크 호출 없음)**

- 스크립트: `C:/DEV/_phx_soul_test_harness/replay-mock.js` (저장소 밖). 입력은 `results/real-run-2026-11-19.json`의 실제 모델 응답.
- 시나리오 A (고정 stub 4행, 실제 런과 동일 조건): 질문당 호출 수는 기록과 동일, 재생 소진 0, 콘솔 오류 0.
  - 변경된 응답 4건: H04, H17 (모순 제거), H10 (추천 완료 표현 제거 + 연결 미검증 구분, 골격 없음), H20 (`PARTIAL → SUCCESS`, `ROUTE_READY`, 1n2d 2일, 항목은 stub의 오동도·하멜등대·향일암·표지만. 숙소 임의 추가 없음).
  - 나머지 16건은 응답·상태 동일.
- 시나리오 B (후보 0건): H10 → `NO_RESULT`, "찾지 못했어요" 응답, 골격 없음. H20 → `DISCOVERING`, 골격 없음 (표지만 있던 골격 차단 확인). H09 → 변화 없음.
- 주의: 시나리오 A의 H10·H20 카드와 H20 코스 항목은 stub 고정 데이터이며 실제 관광지 품질 평가가 아니다. 코스 품질 성공 판정 없음 (Founder 지시).

### 50.7 미해결 및 Blocker

1. **Production 노출 게이트 (중요)**: 이 커밋은 `route` 키를 모든 환경의 API 응답에 포함시킨다. Founder는 로컬·격리 환경에서만 허용했다. 운영 배포 전에 환경 게이트가 필요하다. 이번 단계에서는 구현하지 않았다. 배포 전 별도 승인 필요.
2. H06·H14·H19: Clarify 정책 별도 과제 (게이트 없음). 변경 없음.
3. H09 반나절 구성: 별도 과제 (Phase 2). 변경 없음.
4. 실제 관광지 데이터 기반 코스 품질 검증 불가 (travelGuide 실데이터 미사용). 재검증은 별도 승인.
5. H04 "체류 120분" 자체의 Founder 확인 (정본 §15 Q3) 은 여전히 열려 있다. 값은 변경하지 않았다.

### 50.8 Evidence 연결

- §47: `PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md` §5 · §48: 같은 파일 §10 (H10 정정 반영) · §49: `PHX-SOUL-QA-001_RC3_FINDINGS_S49_V1.md` · §50: 이 문서.
- SHA256 백업: `docs/knowledge/backups/PHX-SOUL-QA-001_RC3_SELECTIVE_RECOVERY_2026-11-19.sha256.txt`.
- DREAMTOWN_STATUS.md: 워킹트리 갱신 (커밋 제외, 기존 변경과 분리 유지).

### 50.9 Current Next Action (exactly 1)

**Founder가 Production 노출 게이트 방식을 승인하면 해당 게이트를 별도 Guardian Preflight로 구현한다. 그 전까지 `ad3503a`는 push하지 않는다.**

