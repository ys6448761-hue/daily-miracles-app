# Airtable Wish Intake 스키마

> P0-01: Sessions/Messages SSOT
> 작성일: 2026-01-17

---

## 테이블 1: Wish Intake Sessions

| 필드명 | 타입 | 설명 | 필수 |
|--------|------|------|------|
| session_id | Text (PK) | 세션 고유 ID (`session_yyyymmdd_xxxxx`) | ✅ |
| correlation_id | Text | 전체 추적용 ID (`corr_xxx`) | ✅ |
| idempotency_key | Text | 중복 방지 키 (channel+user+ts 해시) | ✅ |
| user_id | Text | 사용자 ID (선택) | |
| user_name | Text | 사용자 이름 | |
| channel | Single Select | web / kakao / api / test | ✅ |
| source | Text | 유입 경로 (direct/referral 등) | |
| run_status | Single Select | CREATED/IN_PROGRESS/PAUSED/REVIEW_NEEDED/COMPLETED/SUMMARIZED/CANCELLED | ✅ |
| current_question | Number | 현재 질문 번호 (1-7) | |
| answered_count | Number | 답변 완료 수 (0-7) | |
| progress | Number | 진행률 (0.00-1.00) | |
| pause_flow | Checkbox | 🔴 감지 시 true | |
| risk_level | Single Select | GREEN/YELLOW/RED | |
| risk_flags | Long Text | 감지된 리스크 상세 | |
| summary_short | Long Text | 사용자 표시용 요약 (3-5줄) | |
| summary_structured | Long Text | JSON 구조화 요약 | |
| created_at | Date/Time | 생성 시각 | ✅ |
| updated_at | Date/Time | 최종 수정 시각 | |
| completed_at | Date/Time | 완료 시각 | |
| paused_at | Date/Time | 중단 시각 (🔴 시) | |

### 상태 전이 규칙

```
CREATED → IN_PROGRESS → COMPLETED → SUMMARIZED
              ↓
            PAUSED (🔴)
              ↓
         REVIEW_NEEDED (🟡)
              ↓
           CANCELLED
```

---

## 테이블 2: Wish Intake Messages

| 필드명 | 타입 | 설명 | 필수 |
|--------|------|------|------|
| message_id | Text (PK) | 메시지 고유 ID (`msg_xxxxx`) | ✅ |
| session_id | Text (FK) | 세션 연결 | ✅ |
| question_id | Text | 질문 ID (Q1-Q7) | ✅ |
| question_key | Text | 질문 키 (WISH_1L, WHY_NOW 등) | ✅ |
| question_text | Long Text | 질문 원문 | ✅ |
| answer_raw_text | Long Text | 사용자 입력 원문 | |
| answer_final_text | Long Text | 정제된 답변 (MVP=원문) | |
| skipped | Checkbox | 스킵 여부 | |
| risk_level | Single Select | GREEN/YELLOW/RED | |
| risk_flags | Long Text | 감지된 리스크 상세 | |
| created_at | Date/Time | 생성 시각 | ✅ |

---

## 질문 키 매핑 (DEC-002)

| ID | Key | 요약 |
|----|-----|------|
| Q1 | WISH_1L | 소원 한 문장 |
| Q2 | WHY_NOW | 지금 중요한 이유 |
| Q3 | CONTEXT_NOW | 현재 상황/영역 |
| Q4 | BLOCKER | 걸림돌/걱정 |
| Q5 | EMOTION_SCALE | 마음 상태 점수+단어 |
| Q6 | RESOURCE | 도움 자원 |
| Q7 | NEXT_24H | 24시간 내 작은 한 걸음 |

---

## 환경변수

```env
# Airtable 기본 (기존)
AIRTABLE_API_KEY=pat.xxxxx
AIRTABLE_BASE_ID=appXXXXX

# 신규 테이블
AIRTABLE_TABLE_SESSIONS=Wish Intake Sessions
AIRTABLE_TABLE_MESSAGES=Wish Intake Messages
```

---

## 인덱스 권장

- Sessions: `session_id` (Primary), `correlation_id`, `run_status`
- Messages: `message_id` (Primary), `session_id` (FK Index)

---

*Version: 1.0 (2026-01-17)*
