# DEC 운영 매뉴얼

> DEC(Decision) 문서 자동화 시스템 운영 가이드

## 1. 개요

DEC 시스템은 의사결정 문서를 자동으로 생성하고 관리합니다.

### 파이프라인 흐름

```
[Nightly 자동화]
configs/dec-queries.json
        ↓
scripts/ops/nightly-dec-candidates.js
        ↓
docs/decisions/DEC-DRAFT-*.md (DRAFT 생성)
        ↓
artifacts/reports/nightly-run-YYYYMMDD.json

[리포트 생성]
scripts/ops/daily-dec-report.js
        ↓
artifacts/reports/daily-dec-report-YYYYMMDD.md

[수동 승인]
scripts/debate-trigger.js --promote
        ↓
docs/decisions/DEC-YYYY-MMDD-###.md (정식 DEC)
```

### 운영 원칙

#### (A) 자동화 범위

| 단계 | 실행 방식 | 설명 |
|------|----------|------|
| Nightly | 자동 | DEC 후보(DRAFT) 생성 + 리포트 생성까지만 |
| Promote | 수동 | 사람이 직접 실행 + 토큰 필요 |

**핵심 규칙**:
- GitHub Actions에는 `DEC_PROMOTE_TOKEN`을 **절대 넣지 않는다** (자동 승인 방지)
- 모든 정식 DEC 발행은 승인자가 직접 토큰과 함께 실행

#### (B) 수동 승인 표준 커맨드

```bash
DEC_PROMOTE_TOKEN=secret node scripts/debate-trigger.js \
  --query "쿼리" \
  --generate-dec-draft \
  --promote \
  --decider "푸르미르" \
  --delete-draft \
  --log
```

#### (C) 장애 대응 Quick Reference

| 상황 | 확인 파일 | 조치 |
|------|----------|------|
| Nightly 실패 | `artifacts/reports/nightly-run-YYYYMMDD.json` | 실패 쿼리 수동 재실행 |
| DRAFT 누락 | `docs/decisions/DEC-DRAFT-*.md` | debate-trigger 수동 실행 |
| 승인 실패 | 콘솔 에러 메시지 | 토큰/파일 경로 확인 |

### 쿼리 우선순위 정책

| Priority | 실행 주기 | 설명 |
|----------|----------|------|
| `high` | Nightly (매일) | 핵심 의사결정 영역 - 자동 실행 |
| `medium` | Weekly (주간) | 보조 영역 - 주 1회 수동/예약 |
| `low` | Manual (수동) | 필요시에만 수동 실행 |

```bash
# High만 실행 (Nightly 기본)
node scripts/ops/nightly-dec-candidates.js --priority high

# Medium 포함 (Weekly)
node scripts/ops/nightly-dec-candidates.js --priority medium

# 전체 실행
node scripts/ops/nightly-dec-candidates.js --priority all
```

## 2. 일일 운영 체크리스트

### 아침 (09:00)

1. Daily 리포트 확인
   ```bash
   cat artifacts/reports/daily-dec-report-$(date +%Y%m%d).md
   ```

2. 실패한 쿼리 확인
   - 리포트의 "실패한 쿼리 목록" 섹션 확인
   - 필요시 수동 재실행

3. 승인 대기 DRAFT 검토
   - TOP3 추천 항목 우선 검토
   - 내용 확인 후 승인 결정

### 승인 시

```bash
# 환경변수 설정 (필수)
export DEC_PROMOTE_TOKEN=your-secret-token

# 방법 1: 원클릭 승인
node scripts/debate-trigger.js \
  --query "쿼리명" \
  --generate-dec-draft \
  --promote \
  --decider "푸르미르" \
  --delete-draft \
  --log

# 방법 2: DRAFT 직접 승인
node scripts/dec-approve.js \
  --in "docs/decisions/DEC-DRAFT-xxx.md" \
  --decider "푸르미르" \
  --delete \
  --log
```

## 3. 승인 게이트

### 토큰 인증 (A안 적용)

`--promote` 옵션 사용 시 `DEC_PROMOTE_TOKEN` 환경변수가 필요합니다.

```bash
# 일시적 설정
DEC_PROMOTE_TOKEN=secret node scripts/debate-trigger.js --promote ...

# 영구 설정 (.bashrc 또는 .zshrc)
export DEC_PROMOTE_TOKEN=your-secret-token
```

### 토큰 없이 시도할 경우

```
❌ --promote 사용 시 DEC_PROMOTE_TOKEN 환경변수가 필요합니다.
   설정 방법: export DEC_PROMOTE_TOKEN=your-secret-token
```

## 4. 쿼리 설정 관리

### 설정 파일 위치

```
configs/dec-queries.json
```

### 쿼리 추가/수정

```json
{
  "queries": [
    {
      "id": "unique-id",
      "query": "검색 쿼리",
      "scopes": "decisions,system",
      "mode": "decision",
      "priority": "high",
      "enabled": true
    }
  ]
}
```

### 필드 설명

| 필드 | 설명 | 필수 | 기본값 |
|------|------|------|--------|
| id | 고유 식별자 | O | - |
| query | 검색할 쿼리 문자열 | O | - |
| scopes | 검색 범위 (decisions,system,execution,team,all) | O | - |
| mode | 요약 모드 (general,decision,action) | O | - |
| priority | 우선순위 (high,medium,low) | X | medium |
| enabled | 활성화 여부 | X | true |
| notes | 비고/메모 (운영용) | X | - |

### 우선순위별 실행 정책

- `priority: "high"` → Nightly 자동 실행 대상
- `priority: "medium"` → Weekly(주간) 수동/예약 실행
- `priority: "low"` → 필요시에만 수동 실행

## 5. 실패 대응

### Nightly 실패 시

1. 로그 확인
   ```bash
   cat artifacts/reports/nightly-run-YYYYMMDD.json | jq '.items[] | select(.status=="failed")'
   ```

2. 수동 재실행
   ```bash
   node scripts/debate-trigger.js \
     --query "실패한 쿼리" \
     --scopes "해당 스코프" \
     --generate-dec-draft \
     --log
   ```

3. 원인 분석
   - 쿼리가 너무 광범위하면 스코프 축소
   - 결과가 없으면 쿼리 수정

### 승인 실패 시

1. DRAFT 파일 존재 확인
   ```bash
   ls docs/decisions/DEC-DRAFT-*.md
   ```

2. 파일 내용 검증
   ```bash
   head -50 docs/decisions/DEC-DRAFT-xxx.md
   ```

3. 수동 승인 시도
   ```bash
   node scripts/dec-approve.js \
     --in "docs/decisions/DEC-DRAFT-xxx.md" \
     --decider "승인자" \
     --log
   ```

## 6. 수동 실행

### Nightly 후보 생성 (로컬)

```bash
# 전체 실행
node scripts/ops/nightly-dec-candidates.js

# DRY-RUN (실제 실행 없이 계획만)
node scripts/ops/nightly-dec-candidates.js --dry-run

# 테스트용 설정 사용
node scripts/ops/nightly-dec-candidates.js --config configs/test-queries.json
```

### 리포트 생성

```bash
# 오늘 리포트
node scripts/ops/daily-dec-report.js

# 특정 날짜 리포트
node scripts/ops/daily-dec-report.js --date 20260105

# 커스텀 출력 경로
node scripts/ops/daily-dec-report.js --out artifacts/reports/my-report.md
```

## 7. GitHub Actions

### 워크플로우 목록

| 워크플로우 | 파일 | 트리거 | 용도 |
|-----------|------|--------|------|
| Nightly DEC | `nightly-dec.yml` | 매일 02:00 KST | high priority 자동 실행 |
| Weekly DEC | `weekly-dec.yml` | 매주 일 20:00 KST | medium priority 자동 실행 |
| Monthly DEC | `monthly-dec.yml` | 매월 1일 10:00 KST | low priority 자동 실행 |
| Manual DEC | `manual-dec.yml` | 수동 (workflow_dispatch) | Ad-hoc 1회 실행 |
| Approve DEC | `approve-dec.yml` | 수동 (workflow_dispatch) | 승인 커맨드 생성 (Safe) |
| PR DEC Check | `pr-dec-check.yml` | PR 열림/업데이트 | dry-run + 코멘트 |
| PR DEC Comment | `pr-dec-comment.yml` | workflow_run | 리포트 PR 코멘트 |
| Label DEC Status | `label-dec-status.yml` | workflow_call | 라벨 관리 (reusable) |
| DEC Approve Label | `dec-approve-label.yml` | issue_comment | `/dec approved` 트리거 |
| Comment DEC Report | `comment-dec-report.yml` | workflow_call | 코멘트 + 라벨 (reusable) |
| Upload Artifacts | `upload-dec-artifacts.yml` | workflow_call | 재사용 가능 업로드 |

### 스케줄 요약

```
Nightly (high)   : 매일 02:00 KST  → cron: '0 17 * * *'
Weekly (medium)  : 매주 일 20:00 KST → cron: '0 11 * * 0'
Monthly (low)    : 매월 1일 10:00 KST → cron: '0 1 1 * *'
```

### 수동 실행 (Manual DEC)

GitHub Actions 탭 → "Manual DEC Run" → "Run workflow" 클릭

입력 가능 옵션:
- `query`: 검색/토론 쿼리 (필수)
- `scopes`: 검색 범위 (기본: all)
- `mode`: 요약 모드 (general/decision/action)
- `k`: 상위 결과 개수 (기본: 5)
- `decider`: 승인자 메타 (기본: 미정)
- `notify`: 알림 발송 여부

### 아티팩트 보관 정책

| 워크플로우 | Results 보관 | Drafts 보관 |
|-----------|-------------|------------|
| Nightly | 30일 | 7일 |
| Weekly | 30일 | 14일 |
| Monthly | 90일 | 30일 |
| Manual | 7일 | 7일 |

### PR 자동화

1. **PR DEC Check** (`pr-dec-check.yml`)
   - `docs/decisions/**` 변경 시 자동 실행
   - dry-run 결과 + 파일 카운트 PR 코멘트
   - 기존 코멘트 업데이트 지원

2. **PR DEC Comment** (`pr-dec-comment.yml`)
   - DEC 워크플로우 완료 후 트리거
   - Daily 리포트를 최신 PR에 자동 첨부

### PR 라벨 자동화 (P6-4)

DEC 승인 상태를 PR 라벨로 자동 표시합니다.

#### 라벨 종류

| 라벨 | 색상 | 설명 |
|------|------|------|
| `DEC-PENDING` | 🟡 #FBCA04 | 승인 대기 중 |
| `DEC-APPROVED` | 🟢 #0E8A16 | 승인 완료 |

#### 자동화 흐름

```
1. 리포트 코멘트/승인 워크플로우 실행
         ↓
   🏷️ DEC-PENDING 라벨 자동 부착
         ↓
2. 승인자가 로컬에서 승격 커맨드 실행
         ↓
3. PR에 코멘트: /dec approved
         ↓
   🏷️ DEC-APPROVED 부착 + DEC-PENDING 제거
```

#### 승인 완료 표시

PR에 아래 코멘트를 남기면 자동으로 라벨이 전환됩니다:

```
/dec approved
```

#### 관련 워크플로우

- `label-dec-status.yml`: 라벨 관리 (reusable)
- `dec-approve-label.yml`: `/dec approved` 코멘트 감지
- `approve-dec.yml`: 승인 커맨드 생성 + PENDING 라벨
- `comment-dec-report.yml`: 리포트 코멘트 + PENDING 라벨

### 알림 설정 (Secrets)

```
DISCORD_WEBHOOK_URL  - Discord 웹훅 URL (선택)
SLACK_WEBHOOK_URL    - Slack 웹훅 URL (선택)
```

**주의**: `DEC_PROMOTE_TOKEN`은 GitHub Secrets에 **절대 등록하지 않음** (자동 승인 방지)

## 8. 디렉토리 구조

```
daily-miracles-mvp/
├── .github/
│   └── workflows/
│       ├── nightly-dec.yml           # Nightly 자동 실행 (high)
│       ├── weekly-dec.yml            # Weekly 자동 실행 (medium)
│       ├── monthly-dec.yml           # Monthly 자동 실행 (low)
│       ├── manual-dec.yml            # Ad-hoc 수동 실행
│       ├── approve-dec.yml           # 승인 커맨드 생성 (Safe)
│       ├── pr-dec-check.yml          # PR 체크 + 코멘트
│       ├── pr-dec-comment.yml        # 리포트 PR 첨부
│       ├── label-dec-status.yml      # 라벨 관리 (reusable)
│       ├── dec-approve-label.yml     # /dec approved 트리거
│       ├── comment-dec-report.yml    # 코멘트 + 라벨 (reusable)
│       └── upload-dec-artifacts.yml  # 재사용 가능 업로드
├── configs/
│   └── dec-queries.json        # 쿼리 설정
├── scripts/
│   ├── ops/
│   │   ├── nightly-dec-candidates.js  # Nightly 후보 생성
│   │   └── daily-dec-report.js        # Daily 리포트 생성
│   ├── debate-trigger.js       # 통합 오케스트레이터
│   ├── dec-generate.js         # DRAFT 생성
│   └── dec-approve.js          # DRAFT → DEC 승격
├── docs/
│   ├── decisions/
│   │   ├── DEC-DRAFT-*.md      # 승인 대기 DRAFT
│   │   ├── DEC-YYYY-MMDD-###.md  # 정식 DEC
│   │   └── index.md            # DEC 인덱스
│   ├── manifest.json           # 문서 매니페스트
│   └── ops/
│       └── DEC_OPERATIONS.md   # 이 파일
└── artifacts/
    └── reports/
        ├── nightly-run-YYYYMMDD.json    # Nightly 실행 결과
        └── daily-dec-report-YYYYMMDD.md # Daily 리포트
```

## 9. 문의

- 기술 문제: Claude Code 호출
- 운영 정책: 코미 (COO)
- 최종 승인: 푸르미르 (CEO)

---

*마지막 업데이트: 2026-01-05 (P6-4.1)*
