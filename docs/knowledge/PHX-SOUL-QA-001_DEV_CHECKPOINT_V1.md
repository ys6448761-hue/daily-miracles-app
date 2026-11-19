# PHX-SOUL-QA-001 — 개발 체크포인트 보존 준비 (V1, 2026-11-19)

> 범위: 원격 보존 준비와 판정. 이번 단계에서 push, PR, merge, Render 배포, Hybrid 활성화, 실제 LLM 호출, 운영 DB 연결을 수행하지 않았다.
> 원격 개발 자산 보존은 운영 출시와 별개다. 운영 Release HOLD 유지. 개인정보 법률 검토 BLOCKED 유지.

## Guardian Preflight Report (확인 전 기록)

```
### Guardian Preflight Report

Requested Change:
  개발 체크포인트 보존 준비. 로컬 5 커밋의 최종 범위·비밀/개인정보 점검, 회귀 재확인, Evidence 보존 상태 정리, 원격 보존 READY/BLOCKED 판정.
  push 는 실행하지 않는다.

Existing Assets Found:
  원격 브랜치 origin/feat/phx-soul-hybrid-v1 = 5c36837 (git ls-remote 로 실시간 확인)
  로컬 HEAD 3f20aef, 미보존 커밋 5개: ad3503a, 79a40af, 7b7c866, aebb55e, 3f20aef
  Evidence: §47~§54 (커밋 4개 문서 + 미추적 문서 3개 + 본 §55)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 (읽기 전용 검사, fetch 는 ls-remote 확인용)

Relevant Files:
  범위 16개 파일 (origin..HEAD 누적 diff), 추가 줄 2,317개 비밀·개인정보 패턴 스캔

Relevant Databases:
  없음.

Change Classification:
  검증 및 보존 준비 (코드·문서 변경 없음).

Connection Opportunity:
  없음.

Duplication Risk:
  없음.

Data Risk:
  낮음 — 스캔 결과 실제 Key·개인정보 없음 (아래 점검표). 원격 push 는 이번 단계 금지.

Recommended Approach:
  1) 원격 대비 fast-forward 여부와 누적 파일 범위 확인
  2) 추가 줄 전체 비밀·개인정보 패턴 스캔 (값은 마스킹하여 보고)
  3) 회귀: Hybrid flag unset/0/1 전체 suite + Privacy·Hybrid 7 suite + Route·Gate + Manifest
  4) 기준선은 동일 조건으로 pre-RC3(5c36837) 아카이브를 같은 명령으로 실행
  5) Evidence 분류 (원격 보존 대상 / 로컬 유지 대상), 외부 SHA256 백업 갱신

Questions Requiring Decision:
  Q-C1. 미커밋 Evidence (§51~§55) 를 원격 보존용 문서 커밋으로 추가할지 여부 (6절). 원격 push 판정에는 필수가 아님.

Implementation Status: READY (검증 단계, 코드 변경 없음)
```

## 1. 로컬 및 원격 HEAD

| 구분 | 값 |
|---|---|
| 원격 origin/feat/phx-soul-hybrid-v1 (ls-remote 실시간) | 5c368371eaab4d26be25942528b48500cebe1b4c |
| 로컬 HEAD | 3f20aef |
| 원격이 로컬의 조상인가 | 예. fast-forward push 가능 |
| 앞선 커밋 수 (@{u}..HEAD) | 5 |
| 뒤처진 커밋 수 (HEAD..@{u}) | 0 |

## 2. 보존 대상 커밋 (push 범위 5c36837..3f20aef)

| SHA | 제목 | 주요 파일 |
|---|---|---|
| ad3503a | feat(soul): RC3 selective recovery | routeSkeletonService.js, soyeowoolService.js, routeSkeletonTests.test.js, soulRc3SelectiveRecovery.test.js |
| 79a40af | docs(soul): RC3 recovery evidence §47–§50 | PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md, RC3_RECOVERY_PLAN_V1.md, RC3_FINDINGS_S49_V1.md, RC3_SELECTIVE_RECOVERY_V1.md, docs/index (manifest·tags) |
| 7b7c866 | feat(soul): route exposure gate | routeSkeletonGate.js, soyeowoolService.js, routeSkeletonGate.test.js, routeSkeletonGateHandler.test.js, soulRc3SelectiveRecovery.test.js |
| aebb55e | fix(docs): restore manifest created_at and checksum | docs/index/manifest.json, tags.json, scripts/generate-manifest.js, generateManifest.test.js |
| 3f20aef | fix(docs): generator scans the git index | scripts/generate-manifest.js, generateManifestIndex.test.js |

- 누적: 16개 파일, +2,301 / -28. 승인 범위 밖 파일 0개.
- 누적 파일: services 3개 (routeSkeletonGate.js, routeSkeletonService.js, soyeowoolService.js), scripts 1개 (generate-manifest.js), docs/index 2개, tests/unit 6개, docs/knowledge 4개 (Evidence).
- Hybrid 서비스 변경은 soyeowoolService.js 한 파일이며, 내용은 RC3 복구와 Route Gate 호출 조건이다. soulHybridFlag.js 는 변경되지 않았다. Privacy Guard 는 변경되지 않았다. 타 Workstream 파일 변경 없음.

## 3. 비밀정보 및 개인정보 점검 (추가 줄 2,317개 전체)

| 점검 항목 | 결과 |
|---|---|
| 실제 API Key (sk-…) | 없음. 테스트 파일의 플레이스홀더 sk-test-placeholder 2건만 존재 (실키 아님) |
| Bearer·토큰·비밀번호·개인 키 블록 | 없음 |
| .env, *.key, *.pem, results/, *.db, *.log, *.csv 파일 | 없음 (범위 내 파일 목록 확인) |
| 실제 LLM 결과 파일 | Git 에 없음. 결과 JSON 은 저장소 밖 (C:\DEV\_phx_soul_test_harness\results\) |
| 운영 .env·운영 설정 | 변경·추가 없음. render.yaml 변경 없음 |
| 휴대폰·주민번호·이메일 패턴 | 실제 개인정보 없음. test@example.invalid (예약 도메인, 테스트용 git 설정) 만 존재 |
| 사업자 전화 | 061-664-7301 1건 (§48 문서). 여수 케이블카 운영 번호로 프로젝트 문서에 이미 기재된 업체 번호이며 개인 번호가 아님 |
| 운영자 개인 이름 | 0건 |
| 고객 데이터 | 없음. §48 질문은 합성 문장 20개이며 모델 응답은 테스트 출력 |

## 4. 최종 회귀 (동일 조건 기준선 비교)

기준선은 pre-RC3 5c36837 아카이브(저장소 밖)에서 같은 명령으로 실행했다. 실제 외부 LLM 호출 없음.

| 조건 | 현재 3f20aef (pass / fail) | 기준선 5c36837 (pass / fail) | 실패 suite 집합 |
|---|---|---|---|
| Hybrid flag unset | 838 / 1 (R20) | 731 / 1 (R20) | 동일 7 suite |
| Hybrid flag = 0 | 838 / 1 | unset 과 동일 조건 | unset 과 동일 |
| Hybrid flag = 1 | 836 / 3 (LB-I7, R4, R20) | 729 / 3 (동일 3건) | 동일 9 suite |

- 증가분 검증: unset 838 − 731 = 107, flag 1 836 − 729 = 107. 신규 테스트 107개 = 복구 24 + RC3 9 + 게이트 매트릭스 40 + 게이트 핸들러 7 + Manifest 27.
- 기존 실패 원인 (기준선과 동일): supertest 미설치 4 suite, 테스트 0개 2 suite (placeBasicInfoFormatters, privacyHotfix), R20 (돌산대교 보행 검증) 1건. flag 1 에서는 SOUL 기존 실패 LB-I7, R4 가 추가로 나타난다.
- privacyHotfix: 단독 Node 실행 시 13/13 통과 (현재·기준선 동일). Jest 안에서 실행하면 내부 점검 3건이 실패하고 process.exit(1) 문구가 출력된다. 단독 Jest 실행 결과 (10 통과 / 3 실패) 는 현재와 기준선이 같다. 이번 변경과 무관한 기존 현상이다.
- Privacy·Hybrid 명시 7 suite (soulPrivacyGuard, soulPrivacyWire, soulHybridV1Guard, soulHybridV1Direct/Fast/Adaptive/Repair01): 7 suite 75 테스트 통과.
- Route Skeleton·Route Gate·RC3·Manifest 명시 실행: 6 suite 107 테스트 통과.
- Manifest Generator 27개 (기존 11 + 신규 16): 통과.

## 5. 기능 상태 확인

| 항목 | 확인 |
|---|---|
| Route Gate 기본값 (환경변수 없음) | BLOCK (OFF). API route 는 null (기존 계약) |
| ROUTE 플래그만 / QA 식별자만 | BLOCK |
| 두 값 ON + QA 하네스 | ALLOW |
| 두 값 ON + NODE_ENV=production | BLOCK |
| 두 값 ON + Render 식별 변수 | BLOCK |
| 잘못된 값 (true 등) | BLOCK |
| Manifest 복구 결과 | docs/index/manifest.json 567 문서. 원격 대비 추가는 승인된 Evidence 4건뿐, 제거 0건. tags 107 key 동일 |

## 6. Evidence 보존 상태 및 문서별 분류

| 문서 | 상태 | 분류 |
|---|---|---|
| docs/knowledge/PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md (§47·§48) | 커밋 79a40af (원격 push 범위 포함) | 원격 보존 |
| docs/knowledge/PHX-SOUL-QA-001_RC3_RECOVERY_PLAN_V1.md (§49 계획) | 커밋 79a40af | 원격 보존 |
| docs/knowledge/PHX-SOUL-QA-001_RC3_FINDINGS_S49_V1.md (§49) | 커밋 79a40af | 원격 보존 |
| docs/knowledge/PHX-SOUL-QA-001_RC3_SELECTIVE_RECOVERY_V1.md (§50) | 커밋 79a40af | 원격 보존 |
| docs/knowledge/PHX-SOUL-QA-001_RC3_ROUTE_GATE_V1.md (§51·§52) | 미추적 | 로컬 유지 (Q-C1) |
| docs/knowledge/PHX-SOUL-QA-001_MANIFEST_SELECTIVE_RECOVERY_V1.md (§53) | 미추적 | 로컬 유지 (Q-C1) |
| docs/knowledge/PHX-SOUL-QA-001_MANIFEST_GENERATOR_STABILIZATION_V1.md (§54) | 미추적 | 로컬 유지 (Q-C1) |
| docs/knowledge/PHX-SOUL-QA-001_DEV_CHECKPOINT_V1.md (§55, 본 문서) | 미추적 | 로컬 유지 (Q-C1) |
| DREAMTOWN_STATUS.md (SOUL Project State) | 수정됨. 커밋 전부터 타 세션 변경 포함 | 원격 제외 (타 세션 변경과 분리 유지) |
| docs/knowledge/PHX-SOUL-QA-001_TEST_ENV_PREFLIGHT_V1.md | 미추적 (타 세션 산출물) | 보호 (변경·커밋 금지) |
| docs/knowledge/backups/, tests/fixtures/certificate/, tests/fixtures/postcard/ | 미추적 (백업 사본·타 세션) | 보호 (삭제·커밋 금지) |
| 외부 백업 C:\DEV\_phx_soul_evidence_backup\… | 저장소 밖 | 보존 (SHA256 검증) |

- 정본 SOUL Evidence (daily-miracles-mvp/docs/knowledge/PHX-SOUL-QA-001_RESPONSE_ROUTING_INVESTIGATION.md, 다른 체크아웃): 읽기만. 수정 없음. 본 워크트리 Evidence 는 정본 §15·§19.1·§36.3 을 참조한다.
- 미추적 Evidence 4개를 원격에 올리려면 문서 커밋이 필요하다. 이 커밋은 Git Index 기준 생성기를 거치며, 검증된 생성기 기준으로 새 문서 4개만 manifest 에 추가된다 (§54 검증). 실제 staged 범위는 커밋 직전에 확인한다.

Q-C1 (Founder 결정): §51~§55 문서를 원격 보존용 6번째 커밋으로 추가할지 여부.
- 추가 시: push 범위는 6 커밋. 파일 4개 추가와 manifest 4건 추가 (훅 자동 생성).
- 미추가 시: 원격에는 코드와 §47~§50 문서만 올라가고, §51~§55 는 외부 SHA256 백업과 로컬에만 남는다.
- 원격 보존 판정은 두 경우 모두 READY 이다 (7절).

## 7. 원격 보존 판정

판정: READY (5 커밋 fast-forward push 준비 완료. 실제 push 는 이번 단계에서 실행하지 않음)

- 근거: 원격 조상 관계 확인, 누적 범위 16개 파일 모두 승인 범위 내, 비밀·개인정보 점검 이상 없음, 기준선 대비 회귀 증가 없음, Route Gate 기본 OFF 및 Production 차단 확인, Manifest 복구 확인.
- 조건: push 는 승인 후 git push origin feat/phx-soul-hybrid-v1 (fast-forward, force 없음) 로만 수행한다.
- 원격 보존 READY 는 운영 출시 승인이 아니다. 운영 배포는 별도 승인 사항이다.

## 8. Current Next Action (exactly 1)

Founder가 Q-C1 (§51~§55 문서 커밋 여부)을 결정하고 5 커밋 fast-forward push 를 승인하면 실행한다. 그 전까지는 push 하지 않는다.
