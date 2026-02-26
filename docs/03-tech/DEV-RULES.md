# Development Rules

## 1. 티켓 상태

```
TODO → IN_PROGRESS → PR → QA → MERGED
```

## 2. Ownership Strict

- `web/`, `api/`, `worker/`, `tests/` 외 수정 금지
- 범위 밖 파일 수정 필요 시 사전 승인 필수

## 3. Plan Required

아래 경로 수정 전 **반드시 사전 승인** 필요:

| 경로 | 이유 |
|------|------|
| `shared/` | 다수 모듈 의존 |
| `scripts/` | 운영 영향 |
| `workflows/` | CI/CD 파이프라인 |
| `migrations/` | DB 스키마 변경 |

## 4. Refactoring Risk Check

대응 전략 없는 작업 착수 **금지**.

| ID | 영역 | 필수 대응 |
|----|------|-----------|
| R1 | Shared 변경 | 단독 PR + QA 회귀 필수 |
| R2 | AccessPolicy | 권한 판단 단일화, FE 분기 금지 |
| R3 | Rewards Ledger | 원장 기반 + 멱등키 |
| R4 | Payment FSM | 상태 고정, 혜택은 이벤트 기반 |

## 5. PR 필수사항

### 5.1 PR 보고 4줄 (최소)

```
1. Changed files:
2. Tests run:
3. Plan Required? (Y/N)
4. Risk + Mitigation:
```

### 5.2 PR 템플릿

`.github/pull_request_template.md` 사용 필수

### 5.3 E2E

- Scale Build 프로젝트는 E2E 최소 1개 필수

## 6. Release 규칙

- Scale Build 프로젝트는 E2E 최소 1개 필수
- Plan Required 변경은 승인 없으면 머지 금지
- 위험요소 대응 없는 작업 착수 금지
