# DreamTown DB Schema Summary

Version: v1.0
Created: 2026-03-16
Purpose: DreamTown Code Architect GPT — 데이터베이스 스키마 빠른 참조

---

## daily-miracles-mvp (PostgreSQL / SQLite)

### DB 연결

- **운영**: `DATABASE_URL` 환경변수 → Render PostgreSQL
- **로컬**: SQLite (`config/database.js`에서 `NODE_ENV`로 분기)
- **마이그레이션**: `database/migrations/NNN_description.sql` 순번 관리

---

### 핵심 테이블 목록

#### 소원 도메인

| 테이블 | 역할 | 설계 패턴 |
|--------|------|----------|
| `wish_entries` | 소원 원본 데이터 | 일반 |
| `wish_tracking_requests` | D7/D30/D90 추적 발송 기록 | 일반 |
| `wish_tracking_responses` | 추적 응답 수집 | 일반 |
| `wish_success_patterns` | 소원 성공 패턴 분석 | 일반 |

#### 사용자 / 세션

| 테이블 | 역할 | 설계 패턴 |
|--------|------|----------|
| `sowon_profiles` | 사용자 마스터 | SSOT / UUID v4 PK |
| `wu_sessions` | 소원 분석 세션 | 상태머신 |
| `wu_results` | 세션 결과 | UUID v4 PK |
| `wu_events` | 세션 이벤트 | Ledger (append-only) |
| `ef_daily_snapshots` | 일별 EF 스냅샷 | 일반 |

#### 포인트 / 추천

| 테이블 | 역할 | 설계 패턴 |
|--------|------|----------|
| `point_ledger` | 포인트 원장 | Ledger (append-only) |
| `referral` | 추천인 관계 | 일반 |

#### 커뮤니티

| 테이블 | 역할 | 설계 패턴 |
|--------|------|----------|
| `harbor_wishes` | 항구 소원 공유 | 일반 |
| `harbor_reactions` | 항구 반응 | 일반 |

#### 정산 / 운영

| 테이블 | 역할 | 설계 패턴 |
|--------|------|----------|
| `settlement_events` | 정산 이벤트 | SSOT |
| `settlement_payouts` | 정산 지출 | 일반 |
| `ops_events` | 운영 이벤트 | SSOT / UUID v4 PK |
| `ops_ssot_items` | 운영 SSOT 아이템 | SSOT |
| `ops_audit_log` | 운영 감사 로그 | 일반 |

#### 영상 / 미디어

| 테이블 | 역할 | 설계 패턴 |
|--------|------|----------|
| `video_jobs` | 영상 생성 작업 | 상태머신 |
| `aurora_video_jobs` | Aurora 영상 작업 | 상태머신 |
| `growth_film_events` | 성장 필름 이벤트 | 일반 |

#### 챌린지

| 테이블 | 역할 |
|--------|------|
| `wish_challenges` | 소원 챌린지 |
| `challenge_social_temp` | 챌린지 소셜 임시 |

#### 세션 / 로그

| 테이블 | 역할 |
|--------|------|
| `request_log_hourly` | 시간별 요청 로그 집계 |

---

### 설계 패턴 설명

| 패턴 | 설명 | 주의사항 |
|------|------|----------|
| **SSOT** | `sowon_profiles`, `settlement_events`, `ops_events` — 단일 진실 원천 | 직접 수정 시 SSOT 원칙 검토 |
| **Ledger** | `point_ledger`, `wu_events` — append-only, 삭제/수정 금지 | INSERT만, UPDATE/DELETE 금지 |
| **상태머신** | `video_jobs`, `wu_sessions` — status 컬럼으로 상태 전이 | 상태 전이 순서 엄수 |
| **UUID v4 PK** | `sowon_profiles`, `wu_results`, `ops_events` | 숫자 ID 아님 |

---

### 마이그레이션 목록 (순번 기준)

| 번호 | 파일 | 주요 내용 |
|------|------|----------|
| 001-002 | (기본) | 초기 스키마 |
| 003 | `003_finance_tables.sql` | 금융 테이블 |
| 005 | `005_points_referral_schema.sql` | 포인트/추천 |
| 009 | `009_harbor_schema.sql` | 커뮤니티 항구 |
| 013 | `013_wish_tracking.sql` | 소원 추적 D7/D30/D90 |
| 015 | `015_settlement_engine.sql` | 정산 엔진 |
| 016 | `016_aurora5_unified_engine.sql` | Aurora5 통합 엔진 |
| 017-019 | `017~019_wu_sessions.sql` | WU 세션 |
| 021 | `021_video_jobs.sql` | 영상 작업 |
| 022 | `022_aurora_video_jobs.sql` | Aurora 영상 작업 |
| 025 | `025_wish_challenges.sql` | 소원 챌린지 |
| 029 | `029_dreamtown_p0.sql` | DreamTown P0 |

**신규 마이그레이션**: 파일명은 `030_description.sql` 형식 (현재 029가 최신)

---

## sowon-dreamtown (Prisma / PostgreSQL)

### 모델 목록 (9개)

#### User
```
id        String   @id @default(cuid())
email     String   @unique
name      String?
image     String?
role      String   @default("user")  // "user" | "admin"
createdAt DateTime @default(now())
posts     Post[]
likes     Like[]
participations EventParticipation[]
adminLogs AdminLog[]
```

#### Post
```
id          String   @id @default(cuid())
content     String
type        String   @default("TEXT")  // "TEXT" | "WISH" | "FILM"
aiSummary   String?
showcaseBadge String?
author      User
authorId    String
likes       Like[]
createdAt   DateTime @default(now())
```

#### Like
```
id        String  @id @default(cuid())
user      User
post      Post
@@unique([userId, postId])  // 중복 좋아요 방지
```

#### Event
```
id             String   @id @default(cuid())
title          String
description    String?
startAt        DateTime
endAt          DateTime?
participations EventParticipation[]
```

#### EventParticipation
```
user    User
event   Event
@@unique([userId, eventId])
```

#### DailyCuration
```
id      String  @id @default(cuid())
dateKst String  @unique  // "2026-03-16" 형식
content String
source  String?
```

#### Schedule
```
id         String         @id @default(cuid())
title      String
triggerAt  DateTime       // UTC
status     ScheduleStatus @default(PENDING)
// ScheduleStatus: PENDING | ACTIVE | PAUSED | DONE | CANCELED
```

#### NotificationJob (Outbox 패턴)
```
id          String    @id @default(cuid())
scheduleId  String
status      JobStatus @default(PENDING)
// JobStatus: PENDING | PROCESSING | SENT | FAILED | DEAD | CANCELED
triggeredAt DateTime
processedAt DateTime?
retryCount  Int       @default(0)
@@index([status, triggeredAt])  // 워커 스캔용
```

#### AdminLog
```
id       String  @id @default(cuid())
admin    User
postId   String
action   String
note     String?
```

---

### Prisma 마이그레이션 이력

| 폴더명 | 내용 |
|--------|------|
| `20260302000000_init_pg` | 초기 PostgreSQL 스키마 |
| `20260303000001_add_post_summary` | AI 요약 필드 추가 |
| `20260303000002_add_daily_curation` | 일별 큐레이션 캐시 |
| `20260303000003_add_post_showcase_fields` | 쇼케이스/배지 필드 |

**신규 마이그레이션 명령**: `npx prisma migrate dev --name description`

---

## 연동 포인트

```
sowon-dreamtown /api/plaza/wish/[wishId]
    → daily-miracles-mvp GET /api/dt/stars/:wishId
    → wish_entries 테이블 조회
```
