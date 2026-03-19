# DreamTown Codebase System Map

Version: v1.0
Created: 2026-03-16
Purpose: DreamTown Code Architect GPT — 전체 시스템 구조 한눈에 파악

---

## 1. 서비스 구성 (2개 저장소)

| 저장소 | 역할 | 스택 | 배포 |
|--------|------|------|------|
| `daily-miracles-mvp` | 백엔드 API + 정적 프론트엔드 | Node.js / Express | Render.com |
| `sowon-dreamtown` | 커뮤니티 프론트엔드 (Next.js) | Next.js 16 App Router | Render.com |

두 저장소는 독립 배포. daily-miracles-mvp가 메인 API 서버이며,
sowon-dreamtown은 `/api/plaza/wish/[wishId]`를 통해 daily-miracles-mvp 데이터를 참조.

---

## 2. daily-miracles-mvp 시스템 구조

```
[사용자 브라우저]
    │
    ├── public/daily-miracles.html      (소원 입력 폼)
    ├── public/questions.html           (12질문 인테이크)
    ├── public/daily-miracles-result.html  (결과 화면)
    │       ↕ fetch
    │
[Express 서버 — server.js : 5000(운영) / 5100(로컬)]
    │
    ├── middleware/
    │   ├── requestId.js        (X-Request-Id 주입)
    │   ├── errorHandler.js     (글로벌 에러 핸들링)
    │   ├── alertCooldown.js    (알림 중복 방지)
    │   ├── gateMiddleware.js   (APP_DISABLED 게이트)
    │   └── entitlement.js     (권한 검증)
    │
    ├── routes/ (54개 라우트 파일)
    │   ├── wishRoutes.js           POST /api/wishes (핵심 소원 접수)
    │   ├── wishIntakeRoutes.js     POST /api/wish-intake (7문항)
    │   ├── wishTrackingRoutes.js   소원 추적 (D7/D30/D90)
    │   ├── wishImageRoutes.js      소원 이미지 생성 (DALL-E)
    │   ├── dreamtownRoutes.js      GET /api/dt/stars/:id
    │   └── ... (50개 추가 라우트)
    │
    ├── services/ (100+ 서비스 파일)
    │   ├── miracleScoreEngine.js   기적지수 계산 (핵심)
    │   ├── analysisEngine.js       사용자 프로파일 분석
    │   ├── messageProvider.js      메시지 발송 허브 (SENS)
    │   ├── eventLogger.js          이벤트 로깅 SSOT
    │   └── metricsService.js       메트릭 기록
    │
    ├── config/
    │   ├── database.js             DB 연결 (PG/SQLite 분기)
    │   ├── constants.js            공통 상수
    │   ├── featureFlags.js         피처 플래그
    │   └── messageTemplates.js     메시지 템플릿
    │
    └── database/migrations/        SQL 마이그레이션 (35개)
```

---

## 3. sowon-dreamtown 시스템 구조

```
[사용자 브라우저]
    │
[Next.js App Router — src/app/]
    │
    ├── 페이지
    │   ├── app/page.tsx            홈
    │   ├── app/plaza/page.tsx      광장 (커뮤니티 메인)
    │   ├── app/plaza/new/page.tsx  글쓰기
    │   ├── app/my/posts/page.tsx   내 글 목록
    │   └── app/admin/             관리자 대시보드
    │
    ├── API 라우트 (src/app/api/)
    │   ├── auth/[...nextauth]     NextAuth 5 인증
    │   ├── post/                  게시글 CRUD
    │   ├── like/                  좋아요
    │   ├── plaza/                 광장 API
    │   └── admin/                 관리자 API
    │
    ├── src/lib/                   유틸리티 (15개)
    │   ├── prisma.ts              Prisma 싱글톤
    │   ├── auth.ts                인증 헬퍼
    │   ├── kst.ts                 KST 시간 변환
    │   └── worker/               알림 워커 (Outbox 패턴)
    │
    └── prisma/schema.prisma       DB 스키마 (9개 모델)
```

---

## 4. 데이터 흐름 (핵심 경로)

### 소원 접수 흐름
```
daily-miracles.html
    → POST /api/daily-miracles/analyze (server.js coreAnalyzeHandler)
    → analysisEngine.analyzeUserProfile()
    → current_stage / traffic_light_level / summary_line / today_action 생성
    → global.latestStore 저장
    → daily-miracles-result.html (GET /api/story/latest 로 읽기)
```

### 신호등 분기
```
소원 텍스트 → classifyWish()
    RED   → red-support.html (관리자 SMS 발송)
    YELLOW → 결과 화면 진입 (주의 카드 표시)
    GREEN  → 결과 화면 진입 (초록 카드 표시)
```

### 메시지 발송
```
모든 발송 → messageProvider.js
    Primary:  SENS 알림톡 (@dailymiracles)
    Fallback: SENS SMS
    Tracking: SMS 전용 (D7/D30/D90)
```

---

## 5. 환경 분기

| 항목 | 로컬 | 운영 |
|------|------|------|
| DB | SQLite | PostgreSQL (Render) |
| 포트 | 5100 | 5000 |
| NODE_ENV | development | production |
| 환경변수 | .env 파일 | Render Dashboard |

---

## 6. 브랜드 컬러

| 명칭 | 값 |
|------|-----|
| Primary | `#9B87F5` (메인 퍼플) |
| Secondary | `#F5A7C6` (핑크/코랄) |
| Accent | `#6E59A5` (딥퍼플) |
| Background | `#FFF5F7` (연핑크) |
| Gradient | `linear-gradient(135deg, #9B87F5, #F5A7C6)` |

**절대 금지 표현**: 사주, 점술, 관상, 운세, 대운, 궁합
