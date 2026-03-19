# DreamTown Folder Responsibility Index

Version: v1.0
Created: 2026-03-16
Purpose: 저장소 내 각 폴더/파일의 역할과 수정 규칙 안내

---

## daily-miracles-mvp

### 루트 파일

| 파일 | 역할 | 수정 빈도 |
|------|------|----------|
| `server.js` | Express 앱 진입점, 라우트 마운트, coreAnalyzeHandler | 낮음 |
| `package.json` | 의존성 관리 | 낮음 |
| `CLAUDE.md` | Claude Code 프로젝트 지침 | 중간 |

---

### routes/ — API 라우트 (54개)

| 파일 | 마운트 경로 | 역할 |
|------|------------|------|
| `wishRoutes.js` | `POST /api/wishes` | 소원 접수, 신호등 판정, current_stage, summary_line |
| `wishIntakeRoutes.js` | `POST /api/wish-intake` | 소원 7문항 인테이크 |
| `wishTrackingRoutes.js` | `/api/wish-tracking` | D7/D30/D90 SMS 추적 |
| `wishImageRoutes.js` | `POST /api/wish-image` | DALL-E 소원 이미지 생성 |
| `wishVoyageRoutes.js` | `/api/wish-voyage` | 소원 항해 |
| `dreamtownRoutes.js` | `GET /api/dt/stars/:id` | DreamTown 별 상세 조회 |
| `authRoutes.js` | `/api/auth` | 인증 |
| `harborRoutes.js` | `/api/harbor` | 커뮤니티 항구 |
| `pointRoutes.js` | `/api/point` | 포인트 |
| `settlementRoutes.js` | `/api/settlement` | 정산 |
| `nicepayRoutes.js` | `/api/nicepay` | 결제 (NicePay) |
| `opsRoutes.js` | `/ops`, `/api/ops` | 운영 콘솔 |
| `adminPointRoutes.js` | `/api/admin/point` | 관리자 포인트 |
| `videoJobRoutes.js` | `/api/video-job` | 영상 작업 |
| `auroraJobRoutes.js` | `/api/aurora-job` | Aurora 작업 |
| `challengeRoutes.js` | `/api/challenge` | 성장 챌린지 |
| `wuRoutes.js` | `/api/wu` | 소원 분석 세션 (WU) |
| `storyRoutes.js` | `/api/story` | 스토리 조회 |
| `programRoutes.js` | `/api/program` | 프로그램 |
| `referralRoutes.js` | `/api/referral` | 추천인 |
| `shortLinkRoutes.js` | `/r` | 단축 링크 |
| `certificateRoutes.js` | `/api/certificate` | 수료증 |
| (기타 34개) | 다양 | 부가 기능 |

**수정 규칙**: 기존 라우트 수정 시 하위 호환성 유지. 신규 라우트는 server.js에 마운트 추가 필요.

---

### services/ — 비즈니스 로직 (100+개)

| 파일/폴더 | 역할 | 중요도 |
|-----------|------|--------|
| `miracleScoreEngine.js` | 기적지수 계산 (3경로: 텍스트/카테고리/12질문) | ⭐⭐⭐ 핵심 |
| `analysisEngine.js` | 사용자 프로파일 분석, 8단계 컨설팅 생성 | ⭐⭐⭐ 핵심 |
| `messageProvider.js` | 메시지 발송 허브 (SENS 알림톡 + SMS fallback) | ⭐⭐⭐ 핵심 |
| `eventLogger.js` | 이벤트 로깅 SSOT (`logEvent`, `EVENT_TYPES`) | ⭐⭐ 중요 |
| `metricsService.js` | 메트릭 기록 (recordWishInbox, recordTrafficLight 등) | ⭐⭐ 중요 |
| `wishTrackingService.js` | D7/D30/D90 추적 SMS 발송 | ⭐⭐ 중요 |
| `wishIntakeService.js` | 7문항 수집 처리 | ⭐⭐ 중요 |
| `openaiService.js` | OpenAI GPT-4 / DALL-E 호출 | ⭐⭐ 중요 |
| `pointService.js` | 포인트 원장 (append-only ledger) | ⭐ 보통 |
| `settlementService.js` | 정산 처리 | ⭐ 보통 |
| `videoJob/` | 영상 생성 작업 관리 | ⭐ 보통 |
| `adCreative/` | 광고 소재 생성 | ⭐ 보통 |
| `harbor/` | 커뮤니티 항구 기능 | ⭐ 보통 |
| `aurora/` | Aurora 영상 엔진 | ⭐ 보통 |

**수정 규칙**: 반드시 `messageProvider.js` 경유로 메시지 발송. 직접 SENS 호출 금지.

---

### config/ — 설정

| 파일 | 역할 |
|------|------|
| `database.js` | DB 연결 (NODE_ENV로 PG/SQLite 분기) |
| `constants.js` | 공통 상수 |
| `featureFlags.js` | 피처 플래그 |
| `logger.js` | 로거 설정 |
| `messageTemplates.js` | 알림톡/SMS 템플릿 |
| `modes.registry.json` | 8가지 모드 SSOT |
| `modesLoader.js` | 모드 레지스트리 로더 |

---

### middleware/ — Express 미들웨어

| 파일 | 역할 |
|------|------|
| `requestId.js` | X-Request-Id 헤더 주입 |
| `errorHandler.js` | 글로벌 에러 핸들러 (Slack 알림 포함) |
| `alertCooldown.js` | 알림 중복 방지 쿨다운 |
| `gateMiddleware.js` | `APP_DISABLED` 환경변수로 서비스 게이트 |
| `entitlement.js` | 권한 검증 |

---

### database/migrations/ — SQL 마이그레이션 (35개)

순번 관리 엄수. 파일명 형식: `NNN_description.sql`
최신 번호: `029_dreamtown_p0.sql`

---

### public/ — 정적 프론트엔드

| 파일 | 역할 |
|------|------|
| `daily-miracles.html` | 소원 입력 폼 (메인 진입점) |
| `questions.html` | 12질문 인테이크 |
| `daily-miracles-result.html` | 분석 결과 화면 |
| `red-support.html` | RED 신호등 분기 페이지 |
| `index.html` | 랜딩 페이지 |
| `js/shareCardGenerator.js` | 공유 카드 생성 |

---

### docs/ — 문서

| 폴더 | 내용 |
|------|------|
| `docs/gpt/` | GPT Knowledge 업로드용 문서 (이 파일 포함) |
| `docs/ssot/core/` | Core SSOT 13개 (CEO 승인 필요) |
| `docs/ssot/support/` | Support SSOT 25개 |
| `docs/ssot/archive/` | Archive SSOT 47개 |
| `docs/notebooklm/` | NotebookLM 참조 팩 |
| `docs/00-master/` | 마스터 지식 문서 |

---

## sowon-dreamtown

### 구조 원칙

- `src/app/` — Next.js App Router (페이지 + API 라우트)
- `src/lib/` — 서버 사이드 유틸리티 (Prisma, 인증, KST, 워커)
- `src/components/` — 공통 React 컴포넌트
- `prisma/` — DB 스키마 및 마이그레이션

### src/lib/ 핵심 파일

| 파일 | 역할 |
|------|------|
| `prisma.ts` | Prisma 클라이언트 싱글톤 |
| `auth.ts` | NextAuth 설정 및 헬퍼 |
| `kst.ts` | KST 시간대 변환 (날짜 기반 기능 필수) |
| `sanitize.ts` | 입력 정제 |
| `slack.ts` | Slack 알림 |
| `worker/index.ts` | 알림 워커 진입점 |
| `worker/notificationWorker.ts` | 알림 발송 (Outbox 패턴) |
| `worker/reaperWorker.ts` | 만료 작업 정리 |

### src/components/ 현재 파일

| 파일 | 역할 |
|------|------|
| `Header.tsx` | 공통 헤더 |
| `MiracleShareButton.tsx` | 기적 공유 버튼 |
| `Providers.tsx` | React Context 프로바이더 래퍼 |
