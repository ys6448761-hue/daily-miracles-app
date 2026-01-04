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

### 워크플로우 위치

```
.github/workflows/nightly-dec.yml
```

### 수동 트리거

GitHub Actions 탭에서 "Run workflow" 버튼 클릭

### 스케줄

- 매일 새벽 2시 (KST) = 17:00 UTC (전날)
- Cron: `0 17 * * *`

## 8. 디렉토리 구조

```
daily-miracles-mvp/
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

*마지막 업데이트: 2026-01-05 (P6-3.1)*
