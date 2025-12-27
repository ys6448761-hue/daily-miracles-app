# Aurora5 API Guide

## 1. Webhook URL

```
POST {BASE_URL}/webhooks/wix/inbox-created
```

**예시:**
- 개발: `http://localhost:5100/webhooks/wix/inbox-created`
- 프로덕션: `https://your-domain.com/webhooks/wix/inbox-created`

---

## 2. API Key 설정

### 필수 환경변수 (.env)

```env
# Wix Webhook 인증
WIX_WEBHOOK_API_KEY=your-secure-api-key-here

# Cron Job 인증
CRON_SECRET=your-cron-secret-here

# Admin 접근 (선택)
ADMIN_API_KEY=your-admin-key-here
```

### Wix 자동화 설정
Wix Automations에서 HTTP 요청 설정 시:
- **Method:** POST
- **URL:** `https://your-domain.com/webhooks/wix/inbox-created`
- **Headers:**
  - `Content-Type: application/json`
  - `X-API-KEY: your-secure-api-key-here`

---

## 3. 테스트 방법

### 3-1. Webhook 테스트 (폼 제출 시뮬레이션)

```bash
# Windows PowerShell
curl -X POST "http://localhost:5100/webhooks/wix/inbox-created" `
  -H "Content-Type: application/json" `
  -H "X-API-KEY: your-secure-api-key-here" `
  -d '{
    "sourceId": "test-001",
    "productType": "problem",
    "title": "테스트 문의",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "region": "서울",
    "schedule": "2박3일",
    "groupSize": "2인",
    "request": "AI 분석 테스트입니다"
  }'
```

```bash
# Linux/Mac
curl -X POST "http://localhost:5100/webhooks/wix/inbox-created" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-secure-api-key-here" \
  -d '{
    "sourceId": "test-001",
    "productType": "problem",
    "title": "테스트 문의",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "region": "서울",
    "schedule": "2박3일",
    "groupSize": "2인",
    "request": "AI 분석 테스트입니다"
  }'
```

**성공 응답:**
```json
{
  "success": true,
  "message": "Inbox created",
  "data": {
    "inboxId": 1,
    "status": "NEW"
  }
}
```

**멱등성 응답 (중복 요청 시):**
```json
{
  "success": true,
  "message": "Already exists (idempotent)",
  "data": {
    "duplicate": true,
    "existingId": 1,
    "existingStatus": "NEW"
  }
}
```

### 3-2. Cron Job 테스트 (수동 실행)

```bash
# Windows PowerShell
curl -X POST "http://localhost:5100/jobs/daily-9am" `
  -H "Content-Type: application/json" `
  -H "X-CRON-SECRET: your-cron-secret-here"
```

```bash
# Linux/Mac
curl -X POST "http://localhost:5100/jobs/daily-9am" \
  -H "Content-Type: application/json" \
  -H "X-CRON-SECRET: your-cron-secret-here"
```

**또는 Query Parameter로:**
```bash
curl -X POST "http://localhost:5100/jobs/daily-9am?key=your-cron-secret-here"
```

### 3-3. Admin 대시보드 조회

```bash
# 오늘 대기열 조회
curl "http://localhost:5100/admin/queue" \
  -H "X-ADMIN-KEY: your-admin-key-here"

# 특정 날짜 조회
curl "http://localhost:5100/admin/queue?date=2024-01-15" \
  -H "X-ADMIN-KEY: your-admin-key-here"

# 발송 통계
curl "http://localhost:5100/admin/stats" \
  -H "X-ADMIN-KEY: your-admin-key-here"

# 실패 목록
curl "http://localhost:5100/admin/failures" \
  -H "X-ADMIN-KEY: your-admin-key-here"

# 전체 대시보드
curl "http://localhost:5100/admin/dashboard" \
  -H "X-ADMIN-KEY: your-admin-key-here"
```

### 3-4. 재발송 테스트

```bash
curl -X POST "http://localhost:5100/admin/resend" \
  -H "Content-Type: application/json" \
  -H "X-ADMIN-KEY: your-admin-key-here" \
  -d '{"logId": 1}'
```

---

## 4. 전체 플로우 테스트

### Step 1: Webhook으로 신규 인박스 생성
```bash
curl -X POST "http://localhost:5100/webhooks/wix/inbox-created" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key" \
  -d '{"sourceId": "flow-test-001", "name": "테스트", "phone": "010-0000-0000", "request": "7일간의 기적 테스트"}'
```

### Step 2: 대기열 확인
```bash
curl "http://localhost:5100/admin/queue" -H "X-ADMIN-KEY: your-admin-key"
```

### Step 3: Daily Job 수동 실행
```bash
curl -X POST "http://localhost:5100/jobs/daily-9am" \
  -H "X-CRON-SECRET: your-cron-secret"
```

### Step 4: 발송 결과 확인
```bash
curl "http://localhost:5100/admin/dashboard" -H "X-ADMIN-KEY: your-admin-key"
```

---

## 5. GitHub Secrets 설정

저장소 Settings > Secrets and variables > Actions:

| Secret Name | 설명 | 예시 값 |
|------------|------|--------|
| `API_BASE_URL` | 서버 URL | `https://your-domain.com` |
| `SCHEDULER_SECRET` | Cron 인증 키 | `aurora5-cron-secret-key` |

---

## 6. 에러 코드

| Status | 의미 |
|--------|------|
| 200 | 성공 |
| 401 | API Key 누락 |
| 403 | API Key 불일치 |
| 500 | 서버 오류 |

---

## 7. 개발 모드

개발 환경에서는 API Key가 설정되지 않으면 인증을 건너뜁니다:

```env
# 개발 시 (.env에 설정하지 않으면 인증 skip)
# WIX_WEBHOOK_API_KEY=
# CRON_SECRET=
```

프로덕션에서는 반드시 모든 키를 설정하세요!
