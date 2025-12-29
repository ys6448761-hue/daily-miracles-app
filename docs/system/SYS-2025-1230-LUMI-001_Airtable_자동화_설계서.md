# SYS-2025-1230-LUMI-001: Airtable 자동화 설계서

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서번호 | SYS-2025-1230-LUMI-001 |
| 제목 | Airtable 자동화 설계서 |
| 작성자 | 루미 (Data Analyst) |
| 날짜 | 2025-12-30 |
| 관련 결정 | DEC-2025-1230-003 |

## 테이블 설계

### 1. Wishes Inbox (소원 인입)

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| wish_id | Autonumber | 고유 ID | WISH-001 |
| created_at | Created time | 접수 시간 | 2025-12-30 10:30 |
| channel | Single select | 인입 채널 | kakao, form, web |
| status | Single select | 상태 | NEW, ACK, IN_PROGRESS, APPROVED, STARTED, DONE |
| priority | Single select | 우선순위 | P0, P1, P2, P3 |
| type | Single select | 소원 유형 | career, relationship, health, etc |
| sentiment | Single select | 감정 분석 | hopeful, anxious, urgent |
| assigned_to | Link to Users | 담당자 | auto, 코미, 재미 |
| sla_deadline | Formula | SLA 마감 | created_at + 30분 |
| content | Long text | 소원 내용 | - |
| content_summary | Single line | 요약 | - |
| is_sensitive | Checkbox | 민감 여부 | true/false |
| requires_human | Checkbox | 인간 개입 필요 | true/false |
| signal | Single select | 신호등 | green, yellow, red |

### 2. Users (팀원)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| name | Single line | 이름 |
| role | Single select | 역할 |
| slack_id | Single line | Slack ID |
| kakao_id | Single line | 카카오 ID |

### 3. Decisions (결정)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| decision_id | Single line | 결정 번호 |
| title | Single line | 제목 |
| status | Single select | 상태 |
| approved_by | Link to Users | 승인자 |
| date | Date | 날짜 |

## 자동화 설계

### Automation 1: 신규 소원 접수

```
트리거: When record is created in Wishes Inbox
조건: -
액션:
  1. 자동 분류 (type, sentiment, priority)
  2. 신호등 판정 (signal)
  3. 담당자 배정 (assigned_to)
  4. SLA 계산 (sla_deadline)
  5. Slack 알림 발송
```

### Automation 2: 빨간불 알림

```
트리거: When signal = red
조건: -
액션:
  1. Slack #긴급 채널 알림
  2. CEO/CRO 카카오톡 알림
  3. status → ESCALATED
```

### Automation 3: SLA 임박 알림

```
트리거: 10분 전 sla_deadline
조건: status NOT IN (DONE, APPROVED)
액션:
  1. 담당자 DM 알림
  2. 운영채널 알림
```

### Automation 4: 초동응답 발송

```
트리거: status = ACK
조건: -
액션:
  1. 템플릿 메시지 생성
  2. 채널별 발송 (카카오/이메일)
```

## 웹훅 연동

### 인입 채널 → Airtable

| 채널 | 엔드포인트 | 메서드 |
|------|-----------|--------|
| 소원 폼 | /webhooks/wish-form | POST |
| 카카오톡 | /webhooks/kakao | POST |
| 웹사이트 | /webhooks/web | POST |

### 웹훅 페이로드

```json
{
  "channel": "form",
  "name": "김소원",
  "phone": "010-1234-5678",
  "gem_type": "ruby",
  "wish_content": "...",
  "created_at": "2025-12-30T10:30:00Z"
}
```

## 대시보드

### 실시간 모니터링

| 위젯 | 내용 |
|------|------|
| 오늘 접수 | 총 건수, 시간대별 |
| 신호등 현황 | 초록/노랑/빨강 비율 |
| SLA 현황 | 준수율, 임박 건수 |
| 처리 현황 | 상태별 건수 |

---

*설계: 루미 (Data Analyst)*
*검토: 코미 (COO)*
*날짜: 2025-12-30*
