# Airtable Wishes Inbox 테이블 스키마

## 테이블 정보

| 항목 | 값 |
|------|-----|
| 테이블명 | Wishes Inbox |
| 용도 | 소원 인입 관리 |
| 연동 | webhookRoutes.js |

---

## 필드 정의 (17개)

### 기본 정보

| # | 필드명 | 타입 | 설명 | 예시 |
|---|--------|------|------|------|
| 1 | wish_id | Single line text | 고유 ID (Primary) | WISH-20260103-AB12CD |
| 2 | name | Single line text | 소원이 이름 | 김소원 |
| 3 | phone | Single line text | 전화번호 | 010-1234-5678 |
| 4 | email | Single line text | 이메일 | test@example.com |
| 5 | gem_type | Single select | 보석 타입 | ruby, emerald, sapphire |

### 인입 정보

| # | 필드명 | 타입 | 설명 | 옵션 |
|---|--------|------|------|------|
| 6 | channel | Single select | 인입 채널 | form, kakao, web, api, test |
| 7 | status | Single select | 상태 | NEW, ACK, IN_PROGRESS, APPROVED, STARTED, DONE, ESCALATED |
| 8 | priority | Single select | 우선순위 | P0, P1, P2, P3 |

### 자동 분류

| # | 필드명 | 타입 | 설명 | 옵션 |
|---|--------|------|------|------|
| 9 | type | Single select | 소원 유형 | career, relationship, health, finance, education, travel, spiritual, general |
| 10 | sentiment | Single select | 감정 분석 | urgent, anxious, hopeful, neutral |
| 11 | signal | Single select | 신호등 | green, yellow, red |

### 내용

| # | 필드명 | 타입 | 설명 |
|---|--------|------|------|
| 12 | content | Long text | 소원 전체 내용 |
| 13 | content_summary | Single line text | 요약 (50자) |
| 14 | raw_payload | Long text | 원본 JSON |

### 플래그

| # | 필드명 | 타입 | 설명 |
|---|--------|------|------|
| 15 | is_sensitive | Checkbox | 민감 여부 |
| 16 | requires_human | Checkbox | 인간 개입 필요 |
| 17 | assigned_to | Single line text | 담당자 (재미, 여의보주, auto) |

---

## Single Select 옵션 상세

### channel (인입 채널)
- `form` - 소원 폼
- `kakao` - 카카오톡
- `web` - 웹사이트
- `api` - API 직접
- `test` - 테스트

### status (상태)
- `NEW` - 신규 접수
- `ACK` - 초동응답 완료
- `IN_PROGRESS` - 처리 중
- `APPROVED` - 승인됨
- `STARTED` - 여정 시작
- `DONE` - 완료
- `ESCALATED` - 에스컬레이션

### priority (우선순위)
- `P0` - 긴급 (RED 신호)
- `P1` - 높음 (urgent 감정)
- `P2` - 보통 (anxious 감정)
- `P3` - 일반

### type (소원 유형)
- `career` - 취업/이직/승진
- `relationship` - 연애/결혼/가족
- `health` - 건강/치료
- `finance` - 재정/투자
- `education` - 시험/공부
- `travel` - 여행/관광
- `spiritual` - 마음/성장
- `general` - 일반

### sentiment (감정)
- `urgent` - 급함
- `anxious` - 불안
- `hopeful` - 희망적
- `neutral` - 중립

### signal (신호등)
- `green` - 정상
- `yellow` - 주의
- `red` - 긴급

### gem_type (보석)
- `ruby` - 루비
- `emerald` - 에메랄드
- `sapphire` - 사파이어

---

## 생성 방법

### 방법 1: Airtable 웹 UI

1. https://airtable.com 접속
2. Base 선택 (Daily Miracles ACT)
3. "+ Add a table" 클릭
4. 테이블명: `Wishes Inbox`
5. 위 스키마대로 필드 추가

### 방법 2: CSV Import

```csv
wish_id,name,phone,email,gem_type,channel,status,priority,type,sentiment,signal,content,content_summary,raw_payload,is_sensitive,requires_human,assigned_to
WISH-SAMPLE-001,샘플소원이,010-0000-0000,,ruby,form,NEW,P3,general,neutral,green,샘플 소원입니다,샘플 소원입니다,,false,false,auto
```

### 방법 3: API 자동 생성

Airtable Meta API (Pro 플랜 필요)를 사용하여 자동 생성 가능

---

## 환경변수 설정 (Render)

테이블 생성 후 Render에 환경변수 추가:

```
AIRTABLE_API_KEY=pat.xxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_WISHES_INBOX=Wishes Inbox
```

### API Token 발급

1. https://airtable.com/create/tokens
2. "Create new token"
3. Name: `Daily Miracles Webhook`
4. Scopes:
   - `data.records:read`
   - `data.records:write`
5. Access: Base 선택

---

## 테스트

환경변수 설정 후:

```bash
curl -X POST https://daily-miracles-app.onrender.com/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"wish_content":"test"}'
```

응답에서 `airtable.simulated: false` 확인

---

*Generated: 2026-01-03*
