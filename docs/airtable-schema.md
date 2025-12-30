# Airtable 테이블 스키마 (ACT 관제탑)

## 1. Daily Health (일일 스냅샷)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| date | Single line text | 날짜 (YYYY-MM-DD, Primary) |
| wishes_total | Number | 총 소원 인입 |
| wishes_new | Number | NEW 상태 |
| wishes_processed | Number | 처리 완료 |
| red | Number | 🔴 RED 건수 |
| yellow | Number | 🟡 YELLOW 건수 |
| green | Number | 🟢 GREEN 건수 |
| alimtalk_sent | Number | 알림톡 발송 |
| alimtalk_success | Number | 알림톡 성공 |
| alimtalk_failed | Number | 알림톡 실패 |
| alimtalk_fallbackSms | Number | SMS 폴백 |
| ack_sent | Number | ACK 발송 |
| ack_avgTimeMs | Number | 평균 응답시간 (ms) |
| ack_duplicateAttempts | Number | 중복 시도 |
| errors_count | Number | 에러 건수 |
| report_text | Long text | 전체 리포트 |

### CSV Import용 헤더
```csv
date,wishes_total,wishes_new,wishes_processed,red,yellow,green,alimtalk_sent,alimtalk_success,alimtalk_failed,alimtalk_fallbackSms,ack_sent,ack_avgTimeMs,ack_duplicateAttempts,errors_count,report_text
```

---

## 2. Alerts (이상 감지 로그)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| created_at | Date/Time | 생성 시각 |
| severity | Single select | 🟡 / 🔴 |
| type | Single select | ALIMTALK_FAIL / ACK_SLA / RED_CASE / ERROR / DUPLICATE |
| message | Single line text | 요약 메시지 |
| payload_json | Long text | 추가 데이터 (JSON) |

### CSV Import용 헤더
```csv
created_at,severity,type,message,payload_json
```

---

## 설정 방법

### 1. Airtable Base 생성
1. https://airtable.com 접속
2. "Add a base" → "Start from scratch"
3. Base 이름: `Daily Miracles ACT`

### 2. 테이블 생성
위 스키마대로 2개 테이블 생성:
- `Daily Health`
- `Alerts`

### 3. API Token 발급
1. https://airtable.com/create/tokens
2. "Create new token"
3. Scopes: `data.records:read`, `data.records:write`
4. Access: 해당 Base 선택

### 4. 환경변수 설정 (Render)
```
AIRTABLE_API_KEY=pat.xxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

Base ID는 Airtable URL에서 확인:
`https://airtable.com/appXXXXXXXXXXXXXX/...`

---

*Generated: 2025-12-30*
