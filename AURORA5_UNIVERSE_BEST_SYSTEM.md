# Aurora 5 UBOS - Universe-Best Operating System
## "하루하루의 기적" 전용 완전 통합 관제 시스템

> **프로젝트:** 하루하루의 기적 (Daily Miracles)
> **시스템명:** Aurora 5 UBOS (Universe-Best Operating System)
> **목표:** 소원이 한 명도 놓치지 않는 완벽한 운영
> **작성일:** 2025-01-01
> **비전:** "우주에서 가장 완벽한 소원 실현 플랫폼"

---

## 6대 핵심 시스템

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            Aurora 5 UBOS - 6대 핵심 시스템

  1. 소원이 통합 관리 (WishMaker Hub)
  2. 비즈니스 운영 (Business Ops)
  3. 기술 인프라 (Infrastructure)
  4. 푸르미르 체크리스트 (CEO Dashboard)
  5. 협력사 관리 (Partner Management)
  6. 자동화 워크플로우 (Automation Engine)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 1. 소원이 통합 관리 (WishMaker Hub)

### 1.1 신호등 시스템

| 신호 | 의미 | 자동 조치 |
|------|------|----------|
| GREEN | 정상 소원 | ACK 자동 발송, 7일 메시지 스케줄 |
| YELLOW | 주의 필요 | 24시간 내 재미(CRO) 검토 |
| RED | 긴급 | 즉시 재미(CRO) SMS 알림 |

### 1.2 소원 처리 파이프라인

```
[소원 접수] → [신호등 분류] → [기적지수 계산] → [ACK 발송]
     │              │               │              │
     ▼              ▼               ▼              ▼
  메트릭스       RED: 알림       50-100점       카카오/SMS
   기록         YELLOW: 큐      동적 산출       우선순위
```

### 1.3 핵심 API

```javascript
// POST /api/wishes - 소원 제출
{
  name: "소원이 이름",
  phone: "01012345678",
  wish: "소원 내용",
  gem: "ruby|sapphire|emerald|diamond|citrine",
  want_message: true
}

// 응답
{
  success: true,
  wishId: "1735654321000",
  miracleScore: 85,
  trafficLight: "GREEN"
}
```

---

## 2. 비즈니스 운영 (Business Ops)

### 2.1 일일 메트릭스

| 지표 | 설명 | 목표 |
|------|------|------|
| 인입 수 | 하루 신규 소원 | 10+ |
| ACK 성공률 | 알림톡/SMS 발송 | 95%+ |
| 평균 응답 시간 | ACK 발송까지 | 10초 이내 |
| RED 비율 | 긴급 소원 비율 | 1% 미만 |

### 2.2 수익 구조

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
단계             가격       전환율 목표
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
무료 체험        0원        100% (인입)
기본 분석        5,000원    30% (1차 전환)
프리미엄         15,000원   10% (업그레이드)
소원항해         35,000원   5% (현장 체험)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2.3 Airtable 연동

```
Wishes Inbox 테이블
├── ID (자동)
├── 이름
├── 연락처
├── 소원 내용
├── 신호등 (GREEN/YELLOW/RED)
├── 기적지수 (50-100)
├── ACK 발송 여부
├── 7일 메시지 진행률
└── 생성일시
```

---

## 3. 기술 인프라 (Infrastructure)

### 3.1 서버 구성

| 서비스 | 플랫폼 | 역할 |
|--------|--------|------|
| API 서버 | Render | Node.js/Express 메인 서버 |
| 이미지 생성 | OpenAI | DALL-E 3 소원그림 |
| 메시지 발송 | Solapi | 카카오 알림톡 + SMS |
| 데이터 저장 | Airtable | 소원 데이터 관리 |
| 모니터링 | Render Logs | 실시간 로그 |

### 3.2 MCP 서버 구성 (4종)

```
mcp-servers/
├── miracle-mcp/        # 기적 분석 서비스
│   └── src/miracle/
├── summarizer-mcp/     # 요약 서비스
│   └── src/summarizer/
├── storybook-mcp/      # 스토리북 서비스
└── wish-image-mcp/     # 소원그림 서비스
```

### 3.3 환경변수

```bash
# 필수
SOLAPI_API_KEY=NCS...
SOLAPI_API_SECRET=...
SOLAPI_SMS_FROM=01038196178
SOLAPI_PFID=KA01PF...

# 선택
OPENAI_API_KEY=sk-...
AIRTABLE_API_KEY=pat...
SENDGRID_API_KEY=SG...
```

---

## 4. 푸르미르 체크리스트 (CEO Dashboard)

### 4.1 일일 체크리스트

```
[ ] 07:00 - Airtable "오늘 인입" 확인
[ ] 09:00 - RED 신호 있으면 재미에게 확인
[ ] 12:00 - 루미 일일 리포트 확인
[ ] 18:00 - 7일 메시지 발송 현황 점검
[ ] 21:00 - 내일 준비사항 확인
```

### 4.2 주간 체크리스트

```
[ ] 월요일 - 주간 목표 설정
[ ] 수요일 - 중간 점검 (전환율 분석)
[ ] 금요일 - 주간 리뷰 & 개선점 도출
[ ] 일요일 - 다음 주 콘텐츠 준비
```

### 4.3 월간 체크리스트

```
[ ] 1일 - 월간 목표 설정
[ ] 15일 - 중간 점검
[ ] 말일 - 월간 리뷰 & 다음 달 계획
```

### 4.4 대시보드 API

```bash
# 일일 메트릭스 조회
curl https://daily-miracles-app.onrender.com/api/notify/status

# 응답 예시
{
  "messageStats": {
    "total": 15,
    "sent": 12,
    "failed": 2,
    "successRate": 80
  },
  "recentMessages": [...]
}
```

---

## 5. 협력사 관리 (Partner Management)

### 5.1 핵심 협력사

| 협력사 | 역할 | 담당자 |
|--------|------|--------|
| 어수여행센터 | 소원항해 현장 운영 | 이세진 대표 |
| Solapi | 메시지 발송 | 고객센터 |
| OpenAI | AI 서비스 | API 지원 |
| Render | 서버 호스팅 | 기술 지원 |

### 5.2 API 연동 상태

```
Solapi      ━━━━━━━━━━━━━━ 연동 완료
OpenAI      ━━━━━━━━━━━━━━ 연동 완료
Airtable    ━━━━━━━━━━━━━━ 연동 진행중
Notion      ━━━━━━━━━━━━━━ 검토 중
```

---

## 6. 자동화 워크플로우 (Automation Engine)

### 6.1 소원이 여정 파이프라인

```
┌─────────────────────────────────────────────────────────┐
│               wish-journey 파이프라인                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [접수] → [분석] → [분류] → [발송] → [추적]              │
│    │        │        │        │        │               │
│    ▼        ▼        ▼        ▼        ▼               │
│  저장    기적지수   신호등    ACK    7일 메시지          │
│         (50-100)   분류     발송     스케줄             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 자동화 스킬 (12종)

| # | 스킬명 | 트리거 | 역할 |
|---|--------|--------|------|
| 1 | miracle-analyzer | 소원 접수 시 | 기적지수 분석 |
| 2 | roadmap-generator | 분석 완료 시 | 30일 PDF 생성 |
| 3 | wish-writer | 분석 완료 시 | 7일 메시지 14개 |
| 4 | message-dispatcher | 메시지 준비 시 | 발송 처리 |
| 5 | comi-orchestrator | 수동 호출 | 전체 현황 보고 |
| 6 | self-checker | 작업 완료 시 | 자가 점검 |
| 7 | blog-writer | 수동 호출 | 블로그 자동 작성 |
| 8 | batch-processor | 스케줄 | 배치 처리 |
| 9 | pipeline-runner | 수동 호출 | 파이프라인 실행 |
| 10 | feedback-loop | 피드백 시 | 개선 제안 |

### 6.3 스케줄러

```javascript
// 일일 작업 스케줄
const DAILY_SCHEDULE = {
  "07:00": "daily-health-check",     // 서버 상태 점검
  "09:00": "morning-wish-report",    // 아침 인입 현황
  "10:00": "morning-message-send",   // 아침 응원 메시지
  "18:00": "evening-message-send",   // 저녁 응원 메시지
  "21:00": "daily-summary-report"    // 일일 요약 보고
};
```

---

## 부록 A: SQL 쿼리 레퍼런스

### A.1 일일 통계

```sql
-- 오늘 인입 수
SELECT COUNT(*) as today_wishes
FROM wishes
WHERE DATE(created_at) = CURRENT_DATE;

-- 신호등별 분포
SELECT traffic_light, COUNT(*) as count
FROM wishes
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY traffic_light;

-- ACK 성공률
SELECT
  COUNT(CASE WHEN ack_sent = true THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM wishes
WHERE want_message = true
  AND DATE(created_at) = CURRENT_DATE;
```

### A.2 주간 트렌드

```sql
-- 주간 인입 추이
SELECT
  DATE(created_at) as date,
  COUNT(*) as wishes,
  AVG(miracle_score) as avg_score
FROM wishes
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

---

## 부록 B: 트러블슈팅

### B.1 일반적인 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| ACK 미발송 | SMS_FROM 미설정 | 환경변수 확인 |
| 404 에러 | 라우터 로드 실패 | 서버 로그 확인 |
| 알림톡 실패 | 템플릿 미승인 | Solapi 콘솔 확인 |

### B.2 진단 명령어

```bash
# 서버 상태 확인
curl https://daily-miracles-app.onrender.com/api/notify/status

# 테스트 발송
curl -X POST https://daily-miracles-app.onrender.com/api/notify/test \
  -H "Content-Type: application/json" \
  -d '{"to":"01012345678","type":"sms"}'

# 로컬 서버 테스트
PORT=5100 node server.js
```

---

## 부록 C: Aurora 5 팀 연락처

| 역할 | 이름 | 담당 |
|------|------|------|
| CEO | 푸르미르 (이세진) | 최종 의사결정 |
| COO | 코미 | 총괄 조율 |
| CRO | 재미 | 소원이 응대, RED 대응 |
| Analyst | 루미 | 데이터 분석 |
| QA | 여의보주 | 품질 검수 |
| Tech | Claude Code | 기술 구현 |

---

## 버전 이력

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0.0 | 2025-01-01 | 최초 생성 - 6대 핵심 시스템 정의 |

---

**"우주에서 가장 완벽한 소원 실현 플랫폼"**

*Aurora 5 UBOS - Universe-Best Operating System*
