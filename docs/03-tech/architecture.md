# 시스템 아키텍처

> 마스터 문서(PART 3)의 기술 세부사항을 빠른 참조용으로 분리한 문서입니다.
> 전체 맥락은 [마스터 문서](../00-master/aurora5-master-knowledge-v2.md)를 참조하세요.

**최종 업데이트**: 2026-02-26

---

## 1. 기술 스택

| 계층 | 기술 |
|------|------|
| 런타임 | Node.js 20.x |
| 프레임워크 | Express.js |
| 데이터베이스 | PostgreSQL (Render), SQLite (로컬) |
| AI | OpenAI GPT-4 / DALL-E 3 |
| 메시징 | Naver Cloud SENS (알림톡 + SMS) |
| 호스팅 | Render.com |
| 코드 저장소 | GitHub |
| 홈페이지 | Wix (dailymiracles.kr) |

---

## 2. 디렉토리 구조

```
daily-miracles-mvp/
├── server.js               ← 메인 Express 앱
├── routes/                 ← API 라우트 (50개 파일)
│   ├── wishRoutes.js       ← 소원 API + 신호등 + ACK 발송
│   ├── wishTrackingRoutes  ← 추적 (day7/30/90 SMS)
│   ├── financeRoutes.js    ← 재무관리 (기적 금고)
│   ├── settlementRoutes.js ← 정산
│   ├── playgroundRoutes.js ← 소원놀이터
│   ├── harborRoutes.js     ← 소원항해단
│   ├── yeosuOpsRoutes.js   ← 여수 운영 OS
│   └── ...
├── services/               ← 비즈니스 로직 (100개+)
│   ├── miracleScoreEngine  ← 기적지수 통합 계산
│   ├── messageProvider.js  ← 메시지 발송 (SENS)
│   ├── harbor/             ← 소원항해단 (9파일)
│   ├── yeosu-ops-center/   ← 여수 운영 OS (12파일)
│   ├── settlement/         ← 정산 엔진 (5파일)
│   ├── playground/         ← 소원놀이터 (7파일)
│   └── ...
├── middleware/              ← 미들웨어 (4개)
├── config/                  ← 설정 (9개)
├── utils/                   ← 유틸리티 (12개)
├── database/migrations/     ← SQL 마이그레이션 (22개)
├── public/                  ← 정적 프론트엔드
└── tests/                   ← 테스트
```

---

## 3. API 엔드포인트 (주요)

전체 **389개** 엔드포인트. 20개 카테고리:

| 카테고리 | 엔드포인트 수 | 기본 경로 |
|----------|-------------|----------|
| 소원 시스템 | 32 | /api/wishes, /api/wish-* |
| 여수 여행 | 13 | /api/yeosu/* |
| 견적 & 결제 | 43 | /api/v2/quote/* |
| 포인트 & 리워드 | 21 | /api/points/*, /api/rewards/* |
| 어드민 | 13 | /api/admin/* |
| 일일 체크 | 6 | /api/daily/* |
| 비디오 & 미디어 | 13 | /api/video/* |
| 금융 | 33 | /api/finance/* |
| 프로그램 & 상품 | 24 | /api/program/*, /api/storybook/* |
| 소원놀이터 | 18 | /api/playground/* |
| 간편 접수 | 4 | /api/inquiry/* |
| 토론 자동화 | 12 | /api/debate/* |
| 에이전트 | 21 | /api/agents/*, /api/batch/* |
| 실시간 | 5 | /api/live/* |
| 운영 | 12 | /ops/*, /api/ops/* |
| 여수 운영 OS | 67 | /api/ops-center/* |
| 웹훅 | 5 | /webhooks/* |

---

## 4. DB 스키마 요약

22개 마이그레이션, **약 80개 테이블**, 6개 도메인:

| 도메인 | 핵심 테이블 | 마이그레이션 |
|--------|-----------|------------|
| 소원 시스템 | wish_entries, wish_tracking_requests/responses, wish_success_patterns | 013, 022 |
| 사용자 & Aurora5 | sowon_profiles, wu_sessions/events/results, ef_daily_snapshots | 017, 018, 019 |
| 포인트 & 추천 | point_ledger, point_daily_cap, referral | 005 |
| 커뮤니티 | users_anon, harbor_wishes/reactions/comments, temperature_logs | 009 |
| 정산 & 결제 | settlement_events, settlement_*_shares, nicepay_payments | 008, 016 |
| 운영 (여수) | ops_events, ops_ssot_items, ops_approvals, ops_mice_* | 010, 011 |

**설계 패턴**: SSOT, Append-only Ledger, State Machine, UUID v4 PK, JSONB, Feature Flags

---

## 5. 외부 서비스 연동

| 서비스 | 용도 | 상태 |
|--------|------|------|
| OpenAI | GPT-4 텍스트, DALL-E 3 이미지 | 운영 중 |
| Naver SENS | 알림톡/SMS 발송 | 운영 중 |
| Airtable | 운영 관제탑 | 운영 중 |
| Slack | 팀 알림, 하트비트 | 운영 중 |
| GitHub | 코드 저장소 | 운영 중 |
| Google Drive/Sheets | Export Pipeline | 운영 중 |
| SendGrid | 이메일 (폴백) | 준비 완료 |
| NicePay | 결제 | 운영 중 |

---

## 6. 메시지 발송 플로우

```
소원 접수 → ACK 발송
  ├─ [1차] 알림톡 (betawelcome 템플릿)
  └─ [2차] SMS (실패 시 자동 전환)

Tracking (day7/30/90)
  └─ SMS 전용 (알림톡 템플릿 미등록)

RED 신호 감지
  └─ SMS 즉시 (관리자 긴급 알림)
```

---

## 7. 배포/인프라

| 항목 | 내용 |
|------|------|
| 호스팅 | Render.com (자동 배포) |
| DB | Render PostgreSQL |
| 도메인 | app.dailymiracles.kr → Render |
| 홈페이지 | dailymiracles.kr → Wix |
| SSL | 자동 (Render) |
| 환경변수 | Render Dashboard |
| 포트 | 5000 (prod), 5100 (dev) |
| CORS | dailymiracles.kr, app.dailymiracles.kr |
| CI/CD | Render 자동 배포 (GitHub push 트리거) |

---

*전체 기술 상세는 [마스터 문서 PART 3](../00-master/aurora5-master-knowledge-v2.md#part-3-기술-아키텍처-product--tech)를 참조하세요.*
