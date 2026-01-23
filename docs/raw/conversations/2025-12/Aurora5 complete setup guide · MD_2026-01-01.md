# 🔍 Aurora 5 UBOS - 완전 점검 및 설정 가이드

> **작성일:** 2025-01-01  
> **목적:** Claude Code가 만든 시스템 완전 이해 및 실전 배포  
> **소요 시간:** 30분

---

## 📦 STEP 1: 뭐가 만들어졌는지 확인 (5분)

### 1-1. 파일 구조 확인

```bash
# 프로젝트 루트에서 실행
tree mcp-servers -L 3
```

**예상 결과:**
```
mcp-servers/
├── wishmaker-hub-mcp/           # ✅ Part 1
│   ├── pyproject.toml
│   ├── README.md
│   └── src/wishmaker_hub/
│       ├── __init__.py
│       ├── server.py            # MCP 서버
│       └── tools.py             # 14개 도구
│
├── business-ops-mcp/            # ✅ Part 2
│   ├── pyproject.toml
│   ├── README.md
│   └── src/business_ops/
│       ├── __init__.py
│       ├── server.py
│       └── tools.py             # 4개 도구
│
└── infra-monitor-mcp/           # ✅ Part 3
    ├── pyproject.toml
    ├── README.md
    └── src/infra_monitor/
        ├── __init__.py
        ├── server.py
        └── tools.py             # 4개 도구
```

**체크:**
- [ ] 3개 MCP 서버 폴더 존재
- [ ] 각각 pyproject.toml 있음
- [ ] 각각 src/ 폴더에 server.py, tools.py 있음

---

### 1-2. 설치 상태 확인

```bash
# WishMaker Hub
cd mcp-servers/wishmaker-hub-mcp
uv run wishmaker-hub-mcp --help
cd ../..

# Business Ops
cd mcp-servers/business-ops-mcp
uv run business-ops-mcp --help
cd ../..

# Infrastructure Monitor
cd mcp-servers/infra-monitor-mcp
uv run infra-monitor-mcp --help
cd ../..
```

**체크:**
- [ ] WishMaker Hub 실행됨
- [ ] Business Ops 실행됨
- [ ] Infra Monitor 실행됨

---

## 🎯 STEP 2: 각 도구가 뭘 하는지 파악 (10분)

### 2-1. WishMaker Hub MCP (소원이 관리) - 14개 도구

**신호등 시스템:**
```
1. classify_traffic_light
   → 소원이 상태를 GREEN/YELLOW/RED로 분류
   
   입력: user_id, engagement_rate, satisfaction_score
   출력: { traffic_light: "RED", reason: "3일 미접속" }
   
   활용: 위험 소원이 즉시 파악
```

**가입 퍼널 관리:**
```
2. track_signup_funnel
   → 방문→가입→소원→Day1 전환율 추적
   
   입력: timeRange (1hour, 24hours, 7days)
   출력: {
     visitors: 100,
     email_submitted: 80,
     wish_submitted: 60,
     day1_sent: 50,
     conversion_rates: {...}
   }
   
   활용: 어디서 이탈하는지 파악

3. get_stuck_users
   → 가입 중 멈춘 소원이 찾기
   
   입력: stage (email_input, wish_input, payment_pending)
   출력: [ { user_id, minutes_stuck, recovery_plan } ]
   
   활용: 자동 복구 메시지 발송 대상

4. send_recovery_message
   → 이탈자에게 복구 메시지 자동 발송
   
   입력: user_id, stage, channel (kakao/email/sms)
   출력: { success: true, sent_at: "..." }
   
   활용: 이탈 방지 자동화
```

**7일 메시지 관리:**
```
5. get_message_schedule
   → 오늘 발송할 메시지 스케줄
   
   입력: date, status (pending/sent/failed)
   출력: [ { day_number, user_id, scheduled_at } ]
   
   활용: 발송 전 최종 확인

6. check_message_health
   → 메시지 발송 건강도 (발송률, 열람률, 실패율)
   
   입력: days (기본 7일)
   출력: {
     delivery_rate: 98.5%,
     open_rate: 65.3%,
     failure_rate: 1.5%
   }
   
   활용: 발송 시스템 문제 조기 발견

7. analyze_message_engagement
   → 메시지별 참여도 분석
   
   입력: day_number (1-7)
   출력: {
     day1: { open_rate: 70%, action_rate: 45% },
     day2: { open_rate: 68%, action_rate: 40% }
   }
   
   활용: 어떤 메시지가 효과적인지 파악
```

**이탈 예측 & 방지:**
```
8. predict_satisfaction
   → AI 기반 소원이 만족도 예측
   
   입력: user_id
   출력: {
     score: 8.5/10,
     confidence: 0.85,
     factors: ["높은 참여도", "빠른 피드백"]
   }
   
   활용: 만족도 낮은 소원이 미리 파악

9. detect_churn_risk
   → 이탈 위험 소원이 실시간 감지
   
   입력: threshold (0.7), limit (50)
   출력: [
     { user_id, churn_risk: 0.85, traffic_light: "RED" }
   ]
   
   활용: 빨강 신호등 소원이 즉시 개입

10. generate_intervention_plan
    → 이탈 방지 개입 계획 자동 생성
    
    입력: user_id, urgency (critical/high/medium/low)
    출력: {
      interventions: [
        { priority: "P0", action: "즉시 개인 메시지" },
        { priority: "P1", action: "콘텐츠 스타일 변경" }
      ],
      success_probability: 0.75
    }
    
    활용: 정확한 개입 방법 제시
```

**유료 전환:**
```
11. identify_conversion_ready
    → 유료 전환 준비된 소원이 찾기
    
    입력: minEngagement (0.7), minSatisfaction (8)
    출력: [
      { user_id, engagement: 0.85, satisfaction: 9.2 }
    ]
    
    활용: 최적의 전환 타이밍 포착

12. suggest_conversion_timing
    → 소원이별 최적 전환 제안 타이밍
    
    입력: user_id
    출력: {
      best_timing: "Day 5-7",
      reason: "참여도 최고점",
      conversion_probability: 0.65
    }
    
    활용: 언제 프리미엄 제안할지 결정
```

**대시보드:**
```
13. get_daily_metrics
    → 일일 핵심 지표
    
    출력: {
      active_users: 150,
      new_signups: 12,
      churn_count: 3,
      avg_satisfaction: 8.5
    }
    
    활용: 매일 아침 현황 파악

14. get_traffic_light_summary
    → 신호등 현황 요약
    
    출력: {
      GREEN: 120명,
      YELLOW: 25명,
      RED: 5명
    }
    
    활용: 한눈에 위험 소원이 파악
```

---

### 2-2. Business Ops MCP (비즈니스 운영) - 4개 도구

**실시간 매출:**
```
1. get_revenue_realtime
   → 실시간 매출 현황
   
   입력: breakdown (true/false)
   출력: {
     today: ₩150,000,
     this_week: ₩850,000,
     this_month: ₩3,200,000,
     by_method: { card: 80%, transfer: 20% },
     by_plan: { premium_monthly: 60%, premium_annual: 40% }
   }
   
   활용: 언제든 매출 확인
```

**결제 이상 감지:**
```
2. detect_payment_anomaly
   → 결제 이상 패턴 감지
   
   입력: sensitivity (low/medium/high)
   출력: {
     detected: true,
     current_failure_rate: 15.2%,
     threshold: 10%,
     severity: "critical",
     recommendation: "Toss 게이트웨이 확인 필요"
   }
   
   활용: 결제 문제 즉시 발견
```

**구독 건강도:**
```
3. get_subscription_health
   → 구독 상태 분석
   
   입력: cohort (all/this_month/last_month)
   출력: {
     total: 50,
     active: 45,
     cancelled: 5,
     churn_rate: 10%,
     avg_ltv: ₩250,000
   }
   
   활용: 구독 사업 건강도 모니터링
```

**자동 환불:**
```
4. process_refund_auto
   → 자동 환불 처리
   
   입력: order_id, reason, amount
   출력: {
     success: true,
     refund_amount: 50000,
     refunded_at: "2025-01-01T10:00:00Z"
   }
   
   활용: 7일 이내 환불 자동 처리
```

---

### 2-3. Infrastructure Monitor MCP (기술 인프라) - 4개 도구

**서비스 헬스:**
```
1. check_all_services
   → 모든 서비스 헬스 체크
   
   입력: detailed (true/false)
   출력: {
     overall: "🟢 모두 정상",
     services: [
       { name: "app", status: "healthy", response_time: 250 },
       { name: "api", status: "healthy", response_time: 180 },
       { name: "database", status: "healthy", response_time: 50 }
     ]
   }
   
   활용: 한 번에 전체 시스템 점검
```

**에러 추적:**
```
2. get_recent_errors
   → 최근 에러 로그
   
   입력: hours (24), severity (critical/error/warning/all)
   출력: {
     total_errors: 5,
     unique_errors: 3,
     errors: [
       { type: "DatabaseTimeout", count: 3, last_occurred: "..." }
     ]
   }
   
   활용: 반복되는 에러 패턴 발견
```

**DB 성능:**
```
3. check_database_health
   → DB 성능 점검
   
   입력: includeSlowQueries (true/false)
   출력: {
     database_size: "250 MB",
     active_connections: 12,
     slow_queries: [...]
   }
   
   활용: DB 용량/성능 모니터링
```

**API 성능:**
```
4. monitor_api_performance
   → API 엔드포인트 성능
   
   입력: endpoints (["/api/wishes", "/api/messages"])
   출력: {
     endpoints: [
       { endpoint: "/api/wishes", response_time: 180, status: "healthy" }
     ],
     average_response_time: 180
   }
   
   활용: 느린 API 발견
```

---

## ⚙️ STEP 3: 환경 설정 (10분)

### 3-1. 환경 변수 설정

**파일: `.env`**

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 하루하루의 기적 - 환경 변수
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# === 필수 설정 ===

# 데이터베이스 (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/daily_miracles

# 서비스 URL
APP_URL=https://daily-miracles-app.onrender.com
API_URL=https://daily-miracles-app.onrender.com/api

# === 외부 서비스 API 키 ===

# Solapi (카카오톡 발송)
SOLAPI_API_KEY=your_api_key_here
SOLAPI_API_SECRET=your_api_secret_here

# SendGrid (이메일 발송)
SENDGRID_API_KEY=your_api_key_here

# Toss Payments (결제)
TOSS_SECRET_KEY=your_secret_key_here
TOSS_CLIENT_KEY=your_client_key_here

# === 선택 설정 ===

# 개발/운영 환경
NODE_ENV=production

# 서버 포트
PORT=3000

# 로그 레벨
LOG_LEVEL=info
```

**설정 방법:**

```bash
# 1. 샘플 복사
cp .env.example .env

# 2. 편집기로 열기
code .env  # VS Code
# 또는
notepad .env  # 메모장

# 3. 각 값 입력
# - DATABASE_URL: Render PostgreSQL 연결 문자열
# - API 키들: 각 서비스에서 발급받은 키
```

**체크:**
- [ ] .env 파일 생성됨
- [ ] DATABASE_URL 설정됨
- [ ] APP_URL, API_URL 설정됨
- [ ] (선택) API 키 설정됨

---

### 3-2. DB 연결 테스트

```bash
# Python에서 DB 연결 테스트
python -c "
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute('SELECT 1')
print('✅ DB 연결 성공!')
conn.close()
"
```

**체크:**
- [ ] DB 연결 성공

**만약 실패하면:**
- DATABASE_URL 형식 확인: `postgresql://user:pass@host:port/dbname`
- 방화벽 확인
- Render PostgreSQL 상태 확인

---

### 3-3. Claude Desktop 설정

**위치:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

**내용:**

```json
{
  "mcpServers": {
    "wishmaker-hub": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:/Users/세진/OneDrive/바탕 화면/daily-miracles-mvp/mcp-servers/wishmaker-hub-mcp",
        "wishmaker-hub-mcp"
      ]
    },
    "business-ops": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:/Users/세진/OneDrive/바탕 화면/daily-miracles-mvp/mcp-servers/business-ops-mcp",
        "business-ops-mcp"
      ]
    },
    "infra-monitor": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:/Users/세진/OneDrive/바탕 화면/daily-miracles-mvp/mcp-servers/infra-monitor-mcp",
        "infra-monitor-mcp"
      ]
    }
  }
}
```

**설정 방법:**

1. 파일 열기 (없으면 생성)
2. 위 내용 붙여넣기
3. 경로 수정 (본인 환경에 맞게)
4. Claude Desktop 재시작

**체크:**
- [ ] 설정 파일 생성/수정됨
- [ ] Claude Desktop 재시작됨
- [ ] 코미에게 "사용 가능한 도구 보여줘" 물어보기

---

## 🧪 STEP 4: 실제 테스트 (5분)

### 4-1. WishMaker Hub 테스트

**Claude Desktop에서:**

```
"코미야, 일일 메트릭스 보여줘"
→ get_daily_metrics 도구 실행

"이탈 위험 소원이 누가 있어?"
→ detect_churn_risk 도구 실행

"신호등 현황 보여줘"
→ get_traffic_light_summary 도구 실행
```

**체크:**
- [ ] 도구 실행됨
- [ ] 실제 데이터 반환됨 (또는 샘플 데이터)

---

### 4-2. Business Ops 테스트

```
"오늘 매출 얼마야?"
→ get_revenue_realtime 도구 실행

"구독 건강도 어때?"
→ get_subscription_health 도구 실행
```

**체크:**
- [ ] 도구 실행됨
- [ ] 매출 데이터 표시됨

---

### 4-3. Infrastructure Monitor 테스트

```
"모든 서비스 정상이야?"
→ check_all_services 도구 실행

"최근 에러 있어?"
→ get_recent_errors 도구 실행
```

**체크:**
- [ ] 서비스 상태 확인됨
- [ ] 에러 로그 조회됨

---

## 📊 STEP 5: 일일 체크리스트 실행 (2분)

```bash
# 터미널에서
npm run checklist:daily
```

**예상 출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2025-01-01 푸르미르님 일일 체크리스트

🌅 아침 루틴 (5분)
  ✅ 중앙 관제탑 확인
     활성 소원이: 150명
     어제 가입: 12명
     어제 매출: ₩150,000
     상태: 🟢 모두 정상

  ✅ 오늘의 우선순위 3가지
     1. [P0] 이탈 위험 소원이 5명 개입
     2. [P1] 이번 주 콘텐츠 최종 승인
     3. [P2] 일일 루틴 완료

👥 소원이 관리 (10분)
  ✅ 신규 가입자: 12명
  ⚠️ 이탈 위험: 5명 (🔴 3명, 🟡 2명)
  ✅ 오늘 발송 메시지: 45건

💰 비즈니스 (5분)
  ✅ 어제 매출: ₩150,000
  ✅ 실패한 결제: 0건

🔧 시스템 (2분)
  ✅ 모든 서비스 정상 작동
  ✅ 에러 로그 없음

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 예상 시간: 22분
생성 시각: 2025-01-01 08:00:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**체크:**
- [ ] 체크리스트 생성됨
- [ ] 실제 데이터 반영됨

---

## ✅ 최종 체크리스트

### 파일 확인
- [ ] 3개 MCP 서버 폴더 존재
- [ ] 각 서버 설치 완료
- [ ] 각 서버 실행 가능

### 환경 설정
- [ ] .env 파일 생성
- [ ] DATABASE_URL 설정
- [ ] API 키 설정 (선택)
- [ ] DB 연결 테스트 성공

### Claude Desktop
- [ ] 설정 파일 수정
- [ ] Claude 재시작
- [ ] 도구 사용 가능

### 실제 테스트
- [ ] WishMaker Hub 도구 작동
- [ ] Business Ops 도구 작동
- [ ] Infra Monitor 도구 작동
- [ ] 일일 체크리스트 실행

---

## 🚀 다음 단계

### 즉시 사용 가능
1. Claude Desktop에서 코미와 대화
2. 일일 체크리스트 확인
3. 실시간 모니터링 시작

### 추가 설정 (선택)
1. Slack 알림 연동
2. cron으로 자동화
3. 대시보드 구축

---

## 💬 문제 해결

### Q: MCP 서버가 실행 안 돼요
```bash
# 1. 가상환경 확인
cd mcp-servers/wishmaker-hub-mcp
uv sync

# 2. 실행 테스트
uv run wishmaker-hub-mcp --help

# 3. 로그 확인
uv run wishmaker-hub-mcp 2>&1 | head -20
```

### Q: DB 연결 안 돼요
```bash
# 연결 문자열 형식 확인
echo $DATABASE_URL

# 올바른 형식:
# postgresql://username:password@hostname:5432/database_name
```

### Q: Claude Desktop에서 도구 안 보여요
1. 설정 파일 경로 확인
2. JSON 형식 검증 (쉼표, 중괄호)
3. Claude 완전 재시작 (트레이에서 종료 후 재실행)

---

**완료하셨나요? 다음은 실전 사용입니다! 🎉**