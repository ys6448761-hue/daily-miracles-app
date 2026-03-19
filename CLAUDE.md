# CLAUDE.md — 하루하루의 기적 (Daily Miracles) 프로젝트 컨텍스트

## ⚡ 새 세션 시작 시 — 이것 먼저 읽을 것
**현재 진행 상태 → `DREAMTOWN_STATUS.md` (이 repo 루트)**
지금 Phase가 몇인지, 뭐가 완료됐는지, 다음 작업이 뭔지 → 전부 거기에 있음.

---

## 🗂 프로젝트 구성 (2개 저장소)

| 저장소 | 로컬 경로 | GitHub | 역할 |
|--------|----------|--------|------|
| **이 저장소** | `C:\DEV\daily-miracles-mvp` | `ys6448761-hue/daily-miracles-app` | Express 백엔드 + 정적 결과 화면 |
| DreamTown 프론트 | `C:\DEV\sowon-dreamtown` | `ys6448761-hue/sowon-dreamtown` | Next.js 광장/커뮤니티 |

> sowon-dreamtown 작업 시 → 해당 repo의 `CLAUDE.md` 참조.
> 단, 브랜드/팀 공통 규칙은 **이 파일이 정본**.

## 🔗 공용 스킬 허브
스킬 파일은 antigravity-notebooklm에서 관리됩니다.
```bash
claude --add-dir C:\DEV\antigravity-notebooklm
```

## 🚨 절대 규칙: 코드 수정 금지

이 프로젝트의 코드 수정 권한은 Claude Code에게만 있다.
나(Antigravity)는 다음만 가능하다:

✅ 허용:
- 코드 읽기/분석/조언
- 버그 원인 추정
- 개선 아이디어 제안
- 문서(docs/) 작성/수정

❌ 절대 금지:
- .js, .html, .css 파일 직접 수정
- 새 코드 파일 생성
- package.json 변경
- DB 마이그레이션 생성

코드 수정이 필요하면 "Code 지시서"를 작성하여 Claude Code에게 전달한다

> 이 파일은 Antigravity(Claude)가 매 대화마다 자동으로 읽는 프로젝트 지침서입니다.
> 최종 업데이트: 2026-02-27 | 정본: `docs/00-master/aurora5-master-knowledge-v2.md`


---


## 1. 서비스 개요


- **서비스명**: 하루하루의 기적 (Daily Miracles)
- **미션**: 과학적/심리학적 접근으로 사람들의 소원 실현을 돕는 서비스
- **CEO**: 푸르미르 (이세진)
- **카카오 채널**: @dailymiracles
- **홈페이지**: dailymiracles.kr (Wix) / 앱: app.dailymiracles.kr (Render)
- **GitHub**: ys6448761-hue/daily-miracles-app


### 핵심 가치
- 따뜻하지만 전문적
- 희망적이지만 현실적
- **사주/점술 절대 배제**, 심리학/뇌과학 기반


---


## 2. Aurora 5 팀


| 역할 | 이름 | 담당 |
|------|------|------|
| CEO | 푸르미르 (이세진) | 총괄 의사결정 |
| COO | 코미 | 총괄 조율, 지시서 작성 |
| CRO | 재미 | 소원이 응대, RED 신호 대응 |
| Analyst | 루미 | 데이터 분석, 마케팅 전략 |
| QA | 여의보주 | 품질 검수, 브랜드 일관성 |
| Tech | **Antigravity (Claude)** | 기술 구현, 배포, 문서화 |


---


## 3. 기술 스택


| 계층 | 기술 |
|------|------|
| 런타임 | Node.js 20.x |
| 프레임워크 | Express.js |
| 데이터베이스 | PostgreSQL (Render 운영), SQLite (로컬 개발) |
| AI | OpenAI GPT-4 / DALL-E 3 |
| 메시징 | Naver Cloud SENS (알림톡 + SMS) |
| 호스팅 | Render.com (Web Service) |
| 결제 | NicePay |


---


## 4. 프로젝트 구조 (핵심)


```
daily-miracles-mvp/
├── server.js                 ← 메인 Express 앱
├── routes/                   ← API 라우트 (~50개 파일)
│   ├── wishRoutes.js         ← 소원실현 API + 신호등 + ACK
│   ├── wishTrackingRoutes.js ← 소원 추적 (day7/30/90)
│   ├── wishIntakeRoutes.js   ← 소원 7문항 수집
│   └── ...
├── services/                 ← 비즈니스 로직 (100개+ 파일)
│   ├── miracleScoreEngine.js ← 기적지수 계산
│   ├── messageProvider.js    ← 메시지 발송 허브 (SENS)
│   └── ...
├── config/                   ← 설정 (constants, database, featureFlags)
├── middleware/                ← errorHandler, requestId, alertCooldown
├── database/migrations/      ← SQL 마이그레이션 (22개)
├── public/                   ← 정적 프론트엔드
├── docs/00-master/           ← 마스터 지식 문서
└── .claude/team-memory/      ← 팀 메모리 (세션 간 연속)
```


---


## 5. 핵심 비즈니스 로직


### 신호등 시스템
| 레벨 | 조건 | 액션 |
|------|------|------|
| RED | 자살/자해 키워드 | 관리자 SMS 즉시 발송, ACK 미발송 |
| YELLOW | 우울/힘듦 등 주의 키워드 | ACK 발송 + 모니터링 |
| GREEN | 정상 | ACK 발송 |


### 기적지수 (miracleScoreEngine.js)
- 3가지 경로: 소원 텍스트 / 문제 카테고리 / 12질문 인테이크
- 5대 지표: 간절함, 구체성, 실행력, 긍정성, 자기인식 (50~100점)


### 소원 추적 (Wish Tracking)
- Day 7 / Day 30 / Day 90에 SMS 발송 (SMS 전용, 알림톡 미등록)
- 고유 토큰 기반 응답 수집 → wish_success_patterns 분석


### 메시지 발송 채널
```
messageProvider.js
├── Primary:  SENS 알림톡 (카카오 @dailymiracles)
├── Fallback: SENS SMS
└── Tracking: SMS 전용
```


---


## 6. 데이터베이스 (핵심 테이블)


| 도메인 | 주요 테이블 |
|--------|------------|
| 소원 | wish_entries, wish_tracking_requests, wish_tracking_responses |
| 사용자 | sowon_profiles, wu_sessions, wu_results, ef_daily_snapshots |
| 포인트 | point_ledger (append-only), referral |
| 커뮤니티 | harbor_wishes, harbor_reactions |
| 정산 | settlement_events (SSOT), settlement_payouts |
| 운영 | ops_events (SSOT), ops_audit_log |


### 설계 패턴
- **SSOT**: sowon_profiles, settlement_events, ops_ssot_items
- **원장(Ledger)**: point_ledger, wu_events (append-only)
- **상태머신**: video_jobs, wu_sessions
- **UUID v4 PK**: sowon_profiles, wu_results, ops_events


---


## 7. 배포 & 인프라


| 항목 | 내용 |
|------|------|
| 호스팅 | Render.com (자동 배포) |
| DB | Render PostgreSQL (DATABASE_URL) |
| 포트 | 5000 (운영), 5100 (로컬 개발) |
| CORS | dailymiracles.kr, app.dailymiracles.kr, daily-miracles-app.onrender.com |
| 환경변수 | Render Dashboard 관리 |


---


## 8. 브랜드 & 디자인


| 항목 | 값 |
|------|-----|
| Primary | #9B87F5 (메인 퍼플) |
| Secondary | #F5A7C6 (핑크/코랄) |
| Accent | #6E59A5 (딥퍼플) |
| Background | #FFF5F7 (연핑크) |
| Gradient | linear-gradient(135deg, #9B87F5, #F5A7C6) |


**절대 금지 단어**: 사주, 점술, 관상, 운세, 대운, 궁합


---


## 9. 개발 규칙


1. **SSOT 원칙**: 모든 진실은 GitHub 저장소에만 존재. 문서 중복 금지.
2. **환경 분기**: `NODE_ENV`로 로컬(SQLite) / 운영(PostgreSQL) 분리
3. **에러 핸들링**: `middleware/errorHandler.js` 글로벌 핸들러 사용
4. **메시지 발송**: 반드시 `messageProvider.js` 경유 (직접 SENS 호출 금지)
5. **마이그레이션**: `database/migrations/` 순번 관리 엄수


---


## 10. 참조 문서


- **마스터 지식**: `docs/00-master/aurora5-master-knowledge-v2.md`
- **프로젝트 현황**: `.claude/AURORA_STATUS.md`
- **팀 메모리**: `.claude/team-memory/`



