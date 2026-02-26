# Aurora 5 마스터 통합 문서 v2.0

> **최종 업데이트**: 2026-02-26
> **작성**: Code (기술 실사 기반)
> **승인**: 푸르미르님

---

## PART 1: 서비스 개요

### 서비스명
**하루하루의 기적 (Daily Miracles)**

### 미션
과학적/심리학적 접근으로 사람들의 소원 실현을 돕는 서비스

### 핵심 가치
- 따뜻하지만 전문적
- 희망적이지만 현실적
- 사주/점술 배제, 심리학/뇌과학 기반

### CEO
푸르미르 (이세진)

### 카카오 채널
@dailymiracles

---

## PART 2: Aurora 5 팀

| 역할 | 이름 | 담당 |
|------|------|------|
| CEO | 푸르미르 (이세진) | 총괄 의사결정 |
| COO | 코미 | 총괄 조율, 지시서 작성, 팀 운영 |
| CRO | 재미 | 소원이 응대, RED 신호 대응 |
| Analyst | 루미 | 데이터 분석, 마케팅 전략 |
| QA | 여의보주 | 품질 검수, 브랜드 일관성 |
| Tech | Claude Code | 기술 구현, 배포, 문서화 |

---

## PART 3: 기술 아키텍처 (Product & Tech)

### 3.1 기술 스택

| 계층 | 기술 |
|------|------|
| 런타임 | Node.js 20.x |
| 프레임워크 | Express.js |
| 데이터베이스 | PostgreSQL (Render), SQLite (로컬 개발) |
| AI | OpenAI GPT-4 / DALL-E 3 |
| 메시징 | Naver Cloud SENS (알림톡 + SMS) |
| 호스팅 | Render.com (Web Service) |
| 코드 저장소 | GitHub (ys6448761-hue/daily-miracles-app) |
| 홈페이지 | Wix (dailymiracles.kr) |

### 3.2 프로젝트 디렉토리 구조

```
daily-miracles-mvp/
├── server.js                 ← 메인 Express 앱 (라우트 통합, 부팅)
├── CLAUDE.md                 ← 프로젝트 컨텍스트 / 작업 지침
│
├── routes/                   ← API 라우트 (50개 파일)
│   ├── wishRoutes.js         ← 소원실현 API + 신호등 + ACK 발송
│   ├── wishTrackingRoutes.js ← 소원 추적 (day7/30/90 SMS 발송)
│   ├── wishIntakeRoutes.js   ← 소원 7문항 수집 API
│   ├── wishImageRoutes.js    ← 소원 이미지(DALL-E) 생성
│   ├── authRoutes.js         ← 인증 (JWT, 회원가입/로그인)
│   ├── financeRoutes.js      ← 재무관리 (기적 금고)
│   ├── settlementRoutes.js   ← 정산 시스템
│   ├── playgroundRoutes.js   ← 소원놀이터 (게임화)
│   ├── harborRoutes.js       ← 소원항해단 (익명 커뮤니티)
│   ├── yeosuOpsRoutes.js     ← 여수여행센터 운영 OS
│   ├── quoteRoutes.js        ← 여수 여행 견적
│   ├── wuRoutes.js           ← Aurora5 WU(소원이해) 세션
│   ├── videoJobRoutes.js     ← 영상 자동화 상태머신
│   ├── pointRoutes.js        ← 포인트 적립/조회
│   ├── agentRoutes.js        ← Aurora5 에이전트 오케스트레이션
│   └── ... (50개 전체)
│
├── services/                 ← 비즈니스 로직 (100개+ 파일)
│   ├── miracleScoreEngine.js ← 기적지수 통합 계산 (3경로)
│   ├── messageProvider.js    ← 메시지 발송 (SENS 알림톡/SMS)
│   ├── analysisEngine.js     ← 텍스트 분석 엔진
│   ├── openaiService.js      ← OpenAI API (GPT-4, DALL-E)
│   ├── wishTrackingService.js← 소원 추적 관리
│   ├── harbor/               ← 소원항해단 서브시스템 (9파일)
│   ├── yeosu-ops-center/     ← 여수 운영 OS (12파일)
│   ├── settlement/           ← 정산 엔진 (5파일)
│   ├── hero8/                ← 영상 빌더 (7파일)
│   ├── playground/           ← 소원놀이터 (7파일)
│   ├── maltbot/              ← AI 고객응대 (4파일)
│   └── ... (100개+ 전체)
│
├── middleware/               ← Express 미들웨어 (4개)
│   ├── errorHandler.js       ← 글로벌 에러 핸들러
│   ├── requestId.js          ← 요청 ID 추적
│   ├── alertCooldown.js      ← 알림 쿨다운
│   └── entitlement.js        ← 권한 검증
│
├── config/                   ← 설정 (9개)
│   ├── constants.js          ← 앱 상수
│   ├── database.js           ← DB 연결
│   ├── messageTemplates.js   ← 메시지 템플릿
│   └── featureFlags.js       ← 기능 플래그
│
├── utils/                    ← 유틸리티 (12개)
│   ├── reverseOrderPrompt.js ← 역순 프롬프트 전략
│   ├── inquiryClassifier.js  ← 문의 분류기
│   ├── validation.js         ← 입력 검증
│   └── kstDate.js            ← KST 시간대
│
├── database/                 ← DB 관리
│   ├── db.js                 ← 연결 관리
│   └── migrations/           ← SQL 마이그레이션 (22개)
│
├── public/                   ← 정적 프론트엔드
│   ├── index.html            ← 메인 페이지
│   ├── js/                   ← 프론트엔드 JS
│   ├── css/                  ← 스타일시트
│   ├── images/               ← 이미지 에셋
│   └── admin/                ← 관리자 UI
│
├── tests/                    ← 테스트 스위트
├── scripts/                  ← 운영 스크립트
├── docs/                     ← 기술 문서
└── .claude/                  ← Claude Code 메모리
    ├── AURORA_STATUS.md      ← 프로젝트 현황판
    └── team-memory/          ← 팀 메모리 (세션 간 연속)
```

### 3.3 API 엔드포인트 (주요 그룹)

전체 **389개** 엔드포인트. 카테고리별 주요 API:

#### 소원 시스템

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/wishes | 소원 제출 + 신호등 판정 + ACK 발송 | N |
| POST | /api/wish-intake/start | 7문항 인테이크 시작 | N |
| POST | /api/wish-intake/:sessionId/answer | 인테이크 답변 제출 | N |
| POST | /api/wish-image/generate | DALL-E 소원 이미지 생성 | N |
| POST | /api/wish-tracking/batch/send | 추적 메시지 배치 발송 (day7/30/90) | Y |
| GET | /api/wish-tracking/stats | 추적 통계 | Y |

#### 인증 & 관리

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/auth/signup | 회원가입 | N |
| POST | /api/auth/login | 로그인 | N |
| GET | /api/admin/test-wish-entry | 테스트 소원 생성 | Y |
| GET | /api/admin/SENS/result | SENS 발송 결과 조회 | Y |

#### 여수 여행

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/v2/quote/calculate | 견적 계산 | N |
| POST | /api/v2/itinerary/generate | 일정 자동 생성 | N |
| GET | /api/ops-center/health | 여수 운영 OS 상태 | N |

#### 커뮤니티 & 게임화

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /harbor/wishes | 익명 소원 공유 | N |
| GET | /api/playground/feed | 소원놀이터 피드 | N |
| GET | /api/points/balance | 포인트 잔액 | Y |
| POST | /api/referral/apply | 친구추천 적용 | Y |

#### 결제 & 정산

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/settlement/events | 정산 이벤트 생성 | Y |
| POST | /api/settlement/batches | 정산 배치 생성 | Y |
| GET | /api/finance/dashboard | 재무 대시보드 | Y |

#### 시스템

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/health | 서버 헬스 체크 | N |
| POST | /api/notify/test | 메시지 테스트 발송 | Y |
| POST | /webhooks/wish-form | 소원 폼 웹훅 | N |
| GET | /api/live/stats | 실시간 통계 | N |

### 3.4 데이터베이스 스키마

22개 마이그레이션, 약 **80개 테이블**, 6개 도메인 그룹:

#### 도메인 1: 소원 시스템

| 테이블 | 주요 컬럼 | 관계 | 용도 |
|--------|----------|------|------|
| wish_entries | id, name, phone_hash, wish_text, miracle_score, traffic_light, image_filename | has_many tracking_requests | 소원 접수 데이터 |
| wish_tracking_requests | id, wish_entry_id, stage, response_token, sent_at | belongs_to wish_entries, has_one response | day7/30/90 추적 발송 |
| wish_tracking_responses | id, tracking_request_id, wish_status, message | belongs_to tracking_request | 추적 응답 |
| wish_success_patterns | id, stage, total_sent, responded, success_rate | - | 성공률 집계 |

#### 도메인 2: 사용자 & Aurora5

| 테이블 | 주요 컬럼 | 관계 | 용도 |
|--------|----------|------|------|
| sowon_profiles | id(UUID), phone_hash, nickname, badges | has_many wu_events, wu_results | Aurora5 통합 프로필 |
| wu_sessions | id, profile_id, wu_type, status | belongs_to sowon_profiles | WU(소원이해) 세션 |
| wu_events | id, profile_id, event_type, payload | belongs_to sowon_profiles | WU 이벤트 로그 (원장) |
| wu_results | id, profile_id, keywords, ef_snapshot, ai_response | belongs_to sowon_profiles | WU 완료 결과 |
| ef_daily_snapshots | id, profile_id, snapshot_date, ef_scores | belongs_to sowon_profiles | EF 일일 스냅샷 |
| daily_checks | id, subject_type, subject_id, check_type | - | 출석/실행/기록 |

#### 도메인 3: 포인트 & 추천

| 테이블 | 주요 컬럼 | 관계 | 용도 |
|--------|----------|------|------|
| point_ledger | id, user_id, amount, event_type, balance_after | - | 포인트 원장 (append-only) |
| point_daily_cap | id, user_id, cap_date, earned_today | - | 일일 적립 상한 |
| referral | id, referrer_id, referee_id, code | - | 친구추천 |

#### 도메인 4: 커뮤니티 (소원항해단)

| 테이블 | 주요 컬럼 | 관계 | 용도 |
|--------|----------|------|------|
| users_anon | id, nickname, avatar_seed | has_many harbor_wishes | 익명 사용자 |
| harbor_wishes | id, user_id, content, visibility | has_many reactions, comments | 익명 소원 |
| harbor_reactions | id, wish_id, user_id, type(FIRE/ME_TOO) | belongs_to harbor_wishes | 반응 |
| temperature_logs | id, delta, reason | - | 온도(활성도) 추적 |

#### 도메인 5: 정산 & 결제

| 테이블 | 주요 컬럼 | 관계 | 용도 |
|--------|----------|------|------|
| settlement_events | id(UUID), event_type, amount, status | SSOT 중심 | 정산 이벤트 |
| settlement_creator_shares | id, creator_id, amount, hold_until | belongs_to settlement_events | 크리에이터 정산 |
| settlement_payouts | id, batch_id, creator_id, amount | belongs_to batches | 지급 내역 |
| nicepay_payments | id, order_id, amount, status | - | 나이스페이 결제 |

#### 도메인 6: 운영 (여수여행센터)

| 테이블 | 주요 컬럼 | 관계 | 용도 |
|--------|----------|------|------|
| ops_events | id(UUID), title, status, event_date | SSOT 중심 | 행사/축제 |
| ops_ssot_items | id, event_id, category, value, status | belongs_to ops_events | SSOT 항목 |
| ops_approvals | id, event_id, requester, status | belongs_to ops_events | 승인 워크플로우 |
| ops_audit_log | id, action, actor, details | - | 감사 로그 |

#### 주요 설계 패턴

| 패턴 | 적용 테이블 |
|------|-----------|
| SSOT (Single Source of Truth) | sowon_profiles, settlement_events, ops_ssot_items |
| 원장 (Append-only Ledger) | point_ledger, wu_events, ops_audit_log |
| 상태머신 | video_jobs, wu_sessions, ops_ssot_items |
| Feature Flag | feature_flags |
| UUID v4 PK | sowon_profiles, wu_results, ops_events, video_jobs |
| JSONB 유연성 | payload, ef_scores, content_json, metadata |

### 3.5 외부 서비스 연동

| 서비스 | 용도 | 관련 환경변수 | 상태 |
|--------|------|-------------|------|
| **OpenAI** | GPT-4 텍스트 생성, DALL-E 3 이미지 | OPENAI_API_KEY | 운영 중 |
| **Naver Cloud SENS** | 알림톡/SMS 메시지 발송 | SENS_ACCESS_KEY, SENS_SECRET_KEY, SENS_SERVICE_ID, SENS_SMS_SERVICE_ID, SENS_CHANNEL_ID | 운영 중 |
| **Airtable** | 운영 관제탑 (ACT) | AIRTABLE_API_KEY, AIRTABLE_BASE_ID | 운영 중 |
| **Slack** | 팀 알림, 하트비트 | OPS_SLACK_WEBHOOK, SLACK_BOT_TOKEN | 운영 중 |
| **GitHub** | 코드 저장소, Drive 동기화 | GITHUB_TOKEN | 운영 중 |
| **Google Drive/Sheets** | 문서 저장, Export Pipeline | DRIVE_FOLDER_ID, GOOGLE_SHEET_ID | 운영 중 |
| **SendGrid** | 이메일 발송 (폴백) | SENDGRID_API_KEY | 준비 완료 |
| **Toss Payments** | 결제 게이트웨이 | - | 설정 필요 |
| **NicePay** | 결제 연동 | - | 운영 중 |

### 3.6 메시지 발송 플로우

#### 발송 채널 구조

```
messageProvider.js (중앙 허브)
├── Primary:  SENS 알림톡 (카카오 채널 @dailymiracles)
├── Fallback: SENS SMS
└── Secondary: Email (SendGrid, 미사용)
```

#### 소원 접수 ACK 발송

```
사용자 소원 입력
  → POST /api/wishes
  → classifyWish() 신호등 판정
    ├─ RED   → RED Alert SMS (관리자 즉시 알림, ACK 미발송)
    ├─ YELLOW → ACK 발송
    └─ GREEN  → ACK 발송
  → sendWishAckMessage()
    ├─ [1차] SENS 알림톡 (betawelcome 템플릿)
    └─ [2차] SENS SMS (실패 시 자동 전환)
```

#### Tracking 메시지 (day7/day30/day90)

```
POST /api/wish-tracking/batch/send (관리자)
  → getTrackingTargets(stage)
  → 각 대상별:
    ├─ createTrackingRequest() → response_token 생성
    ├─ buildTrackingMessage(stage, name, url)
    └─ sendSensSMS(phone, message) ← SMS 전용 (2026-02-26~)
```

#### SMS vs 알림톡 분기 조건

| 상황 | 알림톡 | SMS |
|------|--------|-----|
| 소원 ACK | 우선 (betawelcome) | Fallback |
| 기적 결과 | 우선 | Fallback |
| Tracking (Day7/30/90) | - | 전용 |
| RED 신호 | - | 전용 |
| 견적 접수 | 우선 | Fallback |

### 3.7 배포/인프라 구성

| 항목 | 내용 |
|------|------|
| **호스팅** | Render.com (Web Service, Node.js 20.x) |
| **DB** | Render PostgreSQL (DATABASE_URL) |
| **도메인** | app.dailymiracles.kr → Render |
| **홈페이지** | dailymiracles.kr → Wix |
| **SSL** | 자동 (Render) |
| **환경변수** | Render Dashboard에서 관리 |
| **포트** | 5000 (프로덕션), 5100 (개발) |
| **CORS** | dailymiracles.kr, app.dailymiracles.kr, daily-miracles-app.onrender.com |
| **GitHub Actions** | 없음 (Render 자동 배포) |
| **Docker** | Dockerfile.cron (크론 작업 전용) |

---

## PART 4: 신호등 시스템

소원 입력 시 위험도 자동 분류:

| 레벨 | 조건 | 액션 |
|------|------|------|
| RED | 자살/자해 관련 키워드 | 즉시 관리자 SMS 발송, ACK 미발송 |
| YELLOW | 주의 키워드 (우울, 힘듦 등) | ACK 발송 + 모니터링 |
| GREEN | 정상 | ACK 발송 |

---

## PART 5: 기적지수

3가지 경로로 계산 (miracleScoreEngine.js):

| 경로 | 입력 | 점수 범위 |
|------|------|----------|
| 소원 경로 | 소원 텍스트 분석 | 50~100점 |
| 문제 경로 | 문제 카테고리 + 분석 | 50~100점 |
| 12질문 경로 | 심층 인테이크 응답 | 50~100점 |

5대 지표: 간절함, 구체성, 실행력, 긍정성, 자기인식

---

## PART 6: 7일 응원 메시지

- 소원 접수 후 7일간 매일 아침(8시)/저녁(8시) 맞춤 응원 메시지 발송
- 총 14개 메시지 (아침 7개 + 저녁 7개)
- 기적지수와 소원 내용 기반 개인화

---

## PART 7: 소원 추적 시스템

| Stage | 시점 | 목적 |
|-------|------|------|
| Day 7 | 소원 후 7일 | 초기 변화 확인 |
| Day 30 | 소원 후 30일 | 중간 점검 |
| Day 90 | 소원 후 90일 | 장기 변화 확인 |

- 발송 채널: SMS (전용 알림톡 템플릿 미등록)
- 응답 수집: 고유 토큰 기반 웹 폼
- 데이터 활용: 성공 패턴 분석 → wish_success_patterns

---

## PART 8: 여수 기적여행

- 여수 소원빌기 체험 상품
- 자동 견적 시스템 (quoteEngine)
- AI 일정 빌더 (itineraryService)
- MICE 인센티브 결과보고

---

## PART 9: 소원항해단 & 소원놀이터

### 소원항해단 (Harbor)
- 익명 소원 공유 커뮤니티
- 반응 시스템 (FIRE, ME_TOO)
- 온도(활성도) 시스템
- 등대(추천) 시스템

### 소원놀이터 (Playground)
- 게임화 피드 엔진
- 철학점수 기반 아티팩트 평가
- 공유/리워드 시스템
- 10가지 창작 템플릿

---

## PART 10: 정산 시스템

- 풀 분배: 55% 플랫폼 / 30% 크리에이터 / 10% 성장 / 5% 리스크
- 14일 보류 후 지급
- 배치 정산 처리

---

## PART 11: 브랜드 가이드

### 디자인 시스템

| 항목 | 값 |
|------|-----|
| Primary | #9B87F5 (메인 퍼플) |
| Secondary | #F5A7C6 (핑크/코랄) |
| Accent | #6E59A5 (딥퍼플) |
| Background | #FFF5F7 (연핑크) |
| Gradient | linear-gradient(135deg, #9B87F5, #F5A7C6) |

### 톤앤매너
- 따뜻하지만 전문적
- 희망적이지만 현실적
- 과학적/심리학적 언어 사용

### 절대 금지
- 사주, 점술, 관상, 운세, 대운, 궁합 용어
- 과도한 약속 ("100% 성공" 등)

---

## PART 12: 운영 원칙

### SSOT 원칙
- 모든 진실(Truth)은 GitHub 저장소에만 존재
- 문서 중복 금지, 단일 정본 유지

### 양자 기획법
1. 양자 중첩: 결정 전 모든 옵션 동시 검토
2. 양자 얽힘: 연결 작업 동기화
3. 관찰자 효과: 25%/50%/75%/100% 검수
4. 확률적 리스크: 임계점 기반 선제 대응
5. 파동 함수 붕괴: 명확한 결정 선언

### 문서 승격 체계
- L1 (team-memory): 세션 간 반복 참조 지식
- L2 (docs 정본): 프로젝트 공식 문서
- L3 (MASTER-CONTROL): 허브 링크 등록

---

*이 문서는 Code가 실제 코드베이스 분석을 통해 작성한 기술 실사 기반 문서입니다.*
