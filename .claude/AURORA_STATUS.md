# AURORA_STATUS.md
## 하루하루의 기적 - 프로젝트 현황판

**마지막 업데이트**: 2026-01-11 11:15 KST
**업데이트 담당**: Claude Code

---

## 서비스 개요

| 항목 | 내용 |
|------|------|
| **서비스명** | 하루하루의 기적 (Daily Miracles) |
| **CEO** | 푸르미르 (이세진) |
| **핵심 가치** | 소원이들의 기적 실현을 돕는 AI 기반 서비스 |
| **기술 스택** | Node.js, Express, OpenAI (DALL-E 3, GPT-4) |
| **저장소** | https://github.com/ys6448761-hue/daily-miracles-app |

---

## Aurora 5 팀 구성

| 역할 | 담당 | 주요 업무 |
|------|------|----------|
| **코미** | COO | 총괄 조율, 의사결정 문서화, 토론 종합 |
| **재미** | CRO | 소원이 응대, 창의적 아이디어 |
| **루미** | Data Analyst | 데이터 분석, 대시보드 |
| **여의보주** | 품질 검수 | 콘텐츠 품질, 소원이 관점 |
| **Claude Code** | 기술 구현 | 코드 작성, API 개발 |

---

## 현재 상태 요약

```
🟢 운영 중: MVP 서비스 (소원 등록, 문제 해결, 소원실현)
🟢 완료: 기적지수 통합 엔진 v2.0 (결정론적 + 캐싱 + 에너지 스무딩)
🟢 완료: 토론 자동화 시스템 v3.2 (DECISION/EXPLORE 모드)
🟢 완료: GitHub Actions CI/CD 파이프라인 정상화
🟢 완료: Aurora5 DB 스키마 (4개 테이블)
🟢 완료: MCP 서버 7종 (신규 2종 추가)
🟢 완료: P1 Airtable 웹훅 연동 + WishRouter 자동 분류
🟢 완료: P3 wish-journey 파이프라인 (신호등 연동)
🟢 완료: P3 Aurora 5 서브에이전트 자동화 API
🟢 완료: P3 배치 처리 시스템 (9종 배치 유형)
🟢 완료: P1 아우룸 재배치 정책 전수 점검 (0개 발견)
🟢 완료: conversations 폴더 구조 정리 (팀원별/주제별 7개 폴더)
🟢 완료: Aurora 5 캐릭터 프롬프트 v3.0 (디지털 용궁 에디션)
```

---

## 최근 완료 작업

### 2026-01-11: Aurora 5 캐릭터 프롬프트 v3.0

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 디지털 용궁 컨셉 설계 | ✅ | 용궁/바다/별빛 테마 |
| 공통 스타일 LOCK 정의 | ✅ | 지브리 + 웹툰 스타일 |
| 6명 개별 프롬프트 작성 | ✅ | Sora 최적화 영문 프롬프트 |
| 단체샷 프롬프트 작성 | ✅ | 6명 함께 구도 |
| 후처리 가이드 작성 | ✅ | 배경 제거, 크기 조정 |

### Aurora 5 캐릭터 (디지털 용궁 에디션)

| 캐릭터 | 역할 | 메인 컬러 | 상징 |
|--------|------|----------|------|
| 푸르미르 | CEO, 인간 리더 | 로열 퍼플 + 골드 | 기적 나침반 |
| 여의보주 | 철학/영감 AI | 제이드 그린 + 진주빛 | 여의주 |
| 코미 | 운영 총괄 AI | 오션 블루 + 실버 | 클립보드 물고기 |
| 루미 | 데이터 분석 AI | 민트 틸 + 크리스탈 | 별자리 차트 |
| 재미 | 크리에이티브 AI | 코랄 핑크 + 선샤인 | 붓 물고기 |
| 코드 | 기술 실행 AI | 사이언 + 딥 네이비 | 회로 산호 |

### 커밋 이력

```
7d2b870 - docs: Aurora 5 캐릭터 프롬프트 패키지 v3.0 (디지털 용궁 에디션)
```

---

### 2026-01-11: conversations 폴더 구조 정리

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 하위 폴더 7개 생성 | ✅ | 코미, 루미, 재미, 여의보주, 의사결정, 시스템, 기타 |
| 2026-01-01 → 2026-01 폴더명 변경 | ✅ | 월별 폴더 형식 통일 |
| 30개 파일 분류 및 이동 | ✅ | 팀원별/주제별 분류 완료 |
| 파일명 형식 통일 | ✅ | `YYYY-MM-DD_주제.md` 형식 |
| .gitignore 수정 | ✅ | conversations/ 추적 허용 |

### 새 폴더 구조

```
docs/raw/conversations/
├── 2025-12/                    (기존 유지)
└── 2026-01/
    ├── 코미/ (7개)             ← 코미, 코드활용, 마케팅자동화 관련
    ├── 루미/ (4개)             ← 루미, 캐릭터, 아우룸 관련
    ├── 재미/ (0개)             ← 재미, 디자인, 이미지 관련
    ├── 여의보주/ (0개)         ← 여의보주, 메시지, 철학 관련
    ├── 의사결정/ (5개)         ← 가격, 결제, 결정, OS, 정책 관련
    ├── 시스템/ (7개)           ← 시스템, 스토리북, 엔진, API 관련
    └── 기타/ (8개)             ← 분류 외 파일
```

### 커밋 이력

```
6e31006 - refactor(docs): conversations 폴더 구조 정리 (팀원별/주제별 분류)
```

---

### 2026-01-08: 기적지수 통합 엔진 v2.0 + 아우룸 점검

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 기적지수 통합 엔진 구현 (P0) | ✅ | `services/miracleScoreEngine.js` |
| 에너지 타입 한글 키워드 매칭 수정 | ✅ | Unicode NFC 정규화 적용 |
| 프로덕션 로그 정리 | ✅ | DEBUG_SCORE 환경변수 제어 |
| 아우룸 재배치 정책 전수 점검 (P1) | ✅ | 0개 발견, 브랜드 통일 확인 |

### 기적지수 통합 엔진 v2.0 주요 기능

| 기능 | 설명 |
|------|------|
| 결정론적 base_score | 동일 입력 → 동일 점수 (랜덤 제거) |
| 24시간 캐시 | MD5 서명 기반, 동일 입력 재계산 방지 |
| 일일 3회 제한 | 사용자당 하루 최대 3회 신규 분석 |
| 에너지 스무딩 | 최근 3회 다수결로 에너지 타입 결정 |
| confidence level | low/medium/high 신뢰도 표시 |
| 5대 점수 요인 | 현재상황, 개선의지, 환경지원, 실행가능성, 구체성 |

### 에너지 타입 (5종)

| 타입 | 이름 | 의미 | 핵심 키워드 |
|------|------|------|------------|
| ruby | 루비 | 열정과 용기 | 열정, 용기, 도전, 행동 |
| sapphire | 사파이어 | 안정과 지혜 | 안정, 지혜, 평화, 신뢰 |
| emerald | 에메랄드 | 성장과 치유 | 성장, 치유, 회복, 건강 |
| diamond | 다이아몬드 | 명확한 결단 | 결단, 목표, 성공, 합격 |
| citrine | 시트린 | 긍정과 소통 | 긍정, 소통, 대화, 이해 |

### 커밋 이력

```
8a8238f - feat(score): 기적지수 통합 엔진 v2.0 구현
70a1150 - fix(score): Unicode NFC 정규화로 한글 키워드 매칭 수정
1f6908e - chore(score): 프로덕션용 로그 정리
```

---

### 2026-01-03: P3 배치 처리 시스템 완료

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 배치 API 라우터 구현 | ✅ | `routes/batchRoutes.js` |
| 9종 배치 유형 정의 | ✅ | 소원분석, 이미지, 메시지 등 |
| 큐 기반 비동기 처리 | ✅ | 동시 실행 + 재시도 로직 |
| 배치 상태 추적 | ✅ | 6단계 상태 관리 |

### Batch API 엔드포인트

```
GET  /api/batch/types        - 배치 유형 목록
POST /api/batch/create       - 배치 생성
POST /api/batch/:id/start    - 배치 시작 (sync/async)
GET  /api/batch/:id/status   - 배치 상태 조회
POST /api/batch/run-quick    - 즉시 생성 및 실행
GET  /api/batch/stats        - 통계
POST /api/batch/:id/cancel   - 배치 취소
```

### 배치 유형 (9종)

| 유형 | 이름 | 설명 | 동시 실행 |
|------|------|------|----------|
| WISH_ANALYSIS | 소원 분석 | 대기 중인 소원 일괄 분석 | 5 |
| WISH_IMAGE | 소원그림 생성 | 소원그림 일괄 생성 | 3 |
| MESSAGE_ACK | ACK 발송 | 초동응답 메시지 일괄 발송 | 10 |
| MESSAGE_7DAY | 7일 메시지 | 7일 응원 메시지 발송 | 10 |
| MESSAGE_CAMPAIGN | 캠페인 발송 | 마케팅 캠페인 메시지 발송 | 20 |
| DAILY_REPORT | 일일 리포트 | 일일 메트릭스 리포트 생성 | 1 |
| SIGNAL_SCAN | 신호등 스캔 | 전체 소원 신호등 재판정 | 10 |
| DATA_CLEANUP | 데이터 정리 | 오래된 데이터 정리 | 1 |
| SYNC_AIRTABLE | Airtable 동기화 | Airtable 데이터 동기화 | 5 |

---

### 2026-01-03: P3 Aurora 5 서브에이전트 자동화 완료

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 에이전트 API 라우터 구현 | ✅ | `routes/agentRoutes.js` |
| 4종 에이전트 정의 | ✅ | 코미, 재미, 루미, 여의보주 |
| 12종 작업 유형 정의 | ✅ | SYNTHESIZE, RED_ALERT 등 |
| 다중 에이전트 오케스트레이션 | ✅ | Phase 1 병렬 → Phase 2 종합 |
| RED 신호 대응 API | ✅ | 재미 + 여의보주 협업 |

### Agent API 엔드포인트

```
GET  /api/agents              - 에이전트 목록
GET  /api/agents/:id          - 에이전트 상세
POST /api/agents/:id/execute  - 개별 작업 실행
POST /api/agents/orchestrate  - 다중 오케스트레이션
POST /api/agents/red-response - RED 신호 대응
GET  /api/agents/tasks/recent - 최근 작업 목록
GET  /api/agents/task-types   - 작업 유형 목록
```

### Aurora 5 에이전트 목록

| 에이전트 | 역할 | 주요 작업 |
|---------|------|----------|
| 코미 | COO | SYNTHESIZE, DECISION, ACTION_ITEMS |
| 재미 | CRO | CUSTOMER_RESPONSE, RED_ALERT, COMMUNICATION |
| 루미 | Analyst | DATA_ANALYSIS, CREATIVE_IDEA, TREND_REPORT |
| 여의보주 | QA | SAFETY_CHECK, QUALITY_REVIEW, RISK_ASSESSMENT |

---

### 2026-01-03: P3 wish-journey 파이프라인 완료

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 여정 파이프라인 API 구현 | ✅ | `routes/journeyRoutes.js` |
| 신호등 연동 로직 구현 | ✅ | RED/YELLOW/GREEN 분기 처리 |
| RED 보류 + CRO 재개 기능 | ✅ | `/api/journey/:id/resume` |
| 파이프라인 상태 추적 | ✅ | 12단계 상태 관리 |

### Journey API 엔드포인트

```
POST /api/journey/start        - 새 여정 시작
GET  /api/journey/:id          - 여정 상태 조회
POST /api/journey/:id/resume   - RED 보류 여정 재개 (CRO 승인)
GET  /api/journey/list/pending - 보류 중 목록
GET  /api/journey/stats/summary - 통계
```

### 파이프라인 단계

```
1. INTAKE (접수)
   ↓
1.5 SIGNAL_CHECK (신호등 판정)
   ↓ RED → ON_HOLD (CRO 개입 대기)
   ↓ YELLOW/GREEN → 계속
2. ANALYSIS (기적 분석)
   ↓
3. IMAGE (소원그림 생성)
   ↓
5. SEND (결과 전달)
   ↓
6. SCHEDULE (7일 메시지 예약)
   ↓
COMPLETED (완료)
```

---

### 2026-01-03: P1 Airtable 웹훅 연동 완료

| 작업 | 상태 | 산출물 |
|------|------|--------|
| Airtable Wishes Inbox 테이블 생성 | ✅ | Airtable "인입함" 테이블 (17개 필드) |
| WishRouter 자동 분류 구현 | ✅ | `routes/webhookRoutes.js` |
| 웹훅 엔드포인트 3종 | ✅ | `/webhooks/wish-form`, `/kakao`, `/web` |
| 한글 필드명 매핑 | ✅ | `services/airtableService.js` |
| 신호등 분류 개선 (anxious→yellow) | ✅ | `determineSignal()` 함수 |

### 웹훅 엔드포인트

```
POST /webhooks/wish-form  - 소원 폼 (웹사이트)
POST /webhooks/kakao      - 카카오톡 채널
POST /webhooks/web        - 웹사이트 일반
POST /webhooks/test       - 테스트용
GET  /webhooks/status     - 상태 확인
```

### WishRouter 자동 분류

| 분류 항목 | 옵션 |
|----------|------|
| 유형 | career, relationship, health, finance, education, travel, spiritual, general |
| 감정 | urgent, anxious, hopeful, neutral |
| 신호등 | red (긴급), yellow (주의), green (정상) |
| 우선순위 | P0 (RED), P1 (urgent), P2 (anxious), P3 (일반) |

---

### 2026-01-03: 토론 시스템 v3.2 + CI/CD 정상화

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 토론 API DECISION/EXPLORE 모드 분기 | ✅ | `routes/debateRoutes.js` |
| EXPLORE 가드레일 2종 (Lint + Hard) | ✅ | `scripts/lint-exp-guardrail.js` |
| GitHub Actions 3종 워크플로우 정상화 | ✅ | `.github/workflows/*.yml` |
| Aurora5 DB 스키마 적용 | ✅ | `database/run-aurora5-schema.js` |
| MCP 서버 2종 신규 구축 | ✅ | `ceo-checklist-mcp`, `dashboard-mcp` |
| 토론 에이전트 5종 정의 | ✅ | `.claude/agents/debate-system/` |

### GitHub Actions 워크플로우 상태

| 워크플로우 | 상태 | 용도 |
|-----------|------|------|
| **Daily Scheduler** | ✅ 정상 | 일일 스냅샷 + 메시지 발송 |
| **Deploy Health Check** | ✅ 정상 | Render 배포 후 헬스체크 |
| **Lint Guardrails** | ✅ 정상 | EXP 파일 가드레일 검사 |

### GitHub Secrets

| Secret | 상태 |
|--------|------|
| `API_BASE_URL` | ✅ 설정됨 |
| `SCHEDULER_SECRET` | ✅ 설정됨 |

### 토론 API 엔드포인트

```
POST /api/debate/run     - 토론 실행 (DECISION/EXPLORE)
GET  /api/debate/list    - 토론 목록
GET  /api/debate/:id     - 토론 상세
GET  /api/debate/explores - EXPLORE 목록
PUT  /api/debate/actions/:id - Action 상태 변경
```

### Aurora5 DB 테이블 (Render PostgreSQL)

| 테이블 | 용도 |
|--------|------|
| `mvp_inbox` | 인입 데이터 |
| `mvp_results` | 분석 결과 + 매직링크 |
| `trials` | 7일 여정 관리 |
| `send_log` | 발송 이력 |

---

### 2026-01-01: Aurora 5 UBOS & WishMaker Hub MCP

| 작업 | 상태 | 산출물 |
|------|------|--------|
| Aurora 5 UBOS 6대 시스템 정의 | ✅ | `AURORA5_UNIVERSE_BEST_SYSTEM.md` |
| WishMaker Hub MCP 서버 구축 | ✅ | `mcp-servers/wishmaker-hub-mcp/` |
| 시스템 상태 보고서 생성 | ✅ | `SYSTEM_STATUS_REPORT.md` |
| /api/wishes 404 오류 수정 | ✅ | `services/solapiService.js` 문법 오류 해결 |

---

## 진행 중 / 다음 할 일

### P1 (완료!)

| 작업 | 담당 | 상태 |
|------|------|------|
| Airtable Wishes Inbox 테이블 생성 | 루미 | ✅ |
| WishRouter 에이전트 기본 구현 | Code | ✅ |
| 인입 채널 → Airtable 웹훅 연동 | Code | ✅ |

### P2 (완료!)

| 작업 | 담당 | 상태 |
|------|------|------|
| 신호등 시스템 (RED/YELLOW/GREEN 자동 분류) | Code | ✅ |
| Solapi 연동 (SMS + 카카오 알림톡) | Code | ✅ |
| 토론 자동화 시스템 v3.2 | Code | ✅ |
| CI/CD 파이프라인 정상화 | Code | ✅ |

### P3 (에이전틱 워크플로우 고도화) - 완료!

| 작업 | 담당 | 상태 |
|------|------|------|
| wish-journey 파이프라인 신호등 연동 | Code | ✅ |
| Aurora 5 서브에이전트 자동화 | Code | ✅ |
| 배치 처리 시스템 구현 | Code | ✅ |

---

## 핵심 결정 문서

| 문서번호 | 제목 | 상태 |
|----------|------|------|
| DEC-2026-0103-615 | 2026년 1분기 마케팅 전략 | 조건부 승인 |
| DEC-2025-1230-001 | 소원그림 문구 시스템 | 승인 |
| DEC-2025-1230-002 | 소원그림 인스타 광고 | 조건부 승인 |
| DEC-2025-1230-003 | 소원이 실시간 대응 시스템 | 승인 |

---

## 핵심 파일 위치

### 코드
```
services/miracleScoreEngine.js  - 기적지수 통합 엔진 v2.0 (결정론적 계산)
routes/batchRoutes.js           - 배치 처리 시스템 (9종 유형)
routes/agentRoutes.js           - Aurora 5 서브에이전트 자동화 API
routes/journeyRoutes.js         - 소원 여정 파이프라인 (신호등 연동)
routes/webhookRoutes.js         - 소원 인입 웹훅 (WishRouter 자동 분류)
routes/debateRoutes.js          - 토론 자동화 API v3.2
routes/wishRoutes.js            - 소원실현 API (신호등 + 기적지수)
routes/wishImageRoutes.js       - 소원그림 API (DALL-E 3 + 워터마크)
services/airtableService.js     - Airtable 연동 (Wishes Inbox 저장)
services/solapiService.js       - Solapi 연동 (SMS + 카카오 알림톡)
server.js                       - 메인 서버
database/aurora5_schema.sql     - DB 스키마
database/run-aurora5-schema.js  - 스키마 마이그레이션
```

### MCP 서버 (7종)
```
mcp-servers/miracle-mcp/        - 기적 분석 서비스
mcp-servers/summarizer-mcp/     - 요약 서비스
mcp-servers/storybook-mcp/      - 스토리북 서비스
mcp-servers/wish-image-mcp/     - 소원그림 서비스
mcp-servers/wishmaker-hub-mcp/  - 소원이 통합 관리
mcp-servers/ceo-checklist-mcp/  - CEO 일일 체크리스트 (NEW!)
mcp-servers/dashboard-mcp/      - 실시간 대시보드 (NEW!)
```

### 토론 시스템
```
.claude/agents/debate-system/   - 토론 에이전트 5종
.claude/pipelines/              - 파이프라인 정의
scripts/lint-exp-guardrail.js   - EXP 가드레일 린트
docs/decisions/                 - 결정문서 (DEC-*)
docs/actions/                   - 액션아이템 (ACTIONS-*)
docs/explores/                  - 탐색문서 (EXP-*)
```

### CI/CD
```
.github/workflows/daily-scheduler.yml   - 일일 스케줄러
.github/workflows/deploy-check.yml      - 배포 헬스체크
.github/workflows/lint-guardrails.yml   - 가드레일 린트
```

### 대화 로그 (팀원별/주제별)
```
docs/raw/conversations/2026-01/
├── 코미/           - COO 대화 기록
├── 루미/           - Data Analyst 대화 기록
├── 재미/           - CRO 대화 기록
├── 여의보주/       - QA 대화 기록
├── 의사결정/       - 가격, 정책, OS 관련
├── 시스템/         - 기술 시스템 관련
└── 기타/           - 미분류 파일
```

---

## 빠른 시작 가이드

### 서버 실행
```bash
cd daily-miracles-mvp
npm install
npm start
# 또는 특정 포트로
PORT=5100 node server.js
```

### 토론 실행 (DECISION 모드)
```bash
curl -X POST http://localhost:5100/api/debate/run \
  -H "Content-Type: application/json" \
  -d '{"topic":"주제","context":"배경","urgency":"medium","mode":"DECISION"}'
```

### 토론 실행 (EXPLORE 모드)
```bash
curl -X POST http://localhost:5100/api/debate/run \
  -H "Content-Type: application/json" \
  -d '{"topic":"주제","context":"배경","urgency":"low","mode":"EXPLORE"}'
```

---

## 블로커 / 주의사항

| 항목 | 상태 | 설명 |
|------|------|------|
| OpenAI API Key | ✅ | 환경변수 설정 필요 |
| DALL-E 3 Rate Limit | ⚠️ | 분당 5회 제한 주의 |
| Render 배포 | ✅ | Auto-deploy 활성화 |
| DB 스키마 | ✅ | 4개 테이블 생성 완료 |

---

## 연락처

- **기술 이슈**: Claude Code (이 창에서)
- **운영 이슈**: 코미 (COO)
- **의사결정**: 푸르미르 (CEO)

---

## 업데이트 이력

| 날짜 | 담당 | 내용 |
|------|------|------|
| 2026-01-11 11:15 | Code | Aurora 5 캐릭터 프롬프트 v3.0 (디지털 용궁 에디션, 6명 + 단체샷) |
| 2026-01-11 10:45 | Code | conversations 폴더 구조 정리 (팀원별/주제별 7개 폴더, 30개 파일 분류) |
| 2026-01-08 07:45 | Code | P0 완료: 기적지수 통합 엔진 v2.0, 에너지 키워드 매칭, 아우룸 점검 |
| 2026-01-03 21:20 | Code | P3 완료: 배치 처리 시스템 (9종 유형, 큐 기반 비동기 처리) |
| 2026-01-03 20:40 | Code | P3 완료: Aurora 5 서브에이전트 자동화 API |
| 2026-01-03 20:10 | Code | P3 완료: wish-journey 파이프라인 API, 신호등 연동 |
| 2026-01-03 14:56 | Code | P1 완료: Airtable 웹훅 연동, WishRouter 자동 분류 |
| 2026-01-03 11:20 | Code | 토론 시스템 v3.2, CI/CD 정상화, DB 스키마 적용 |
| 2026-01-01 00:30 | Code | Aurora 5 UBOS + WishMaker Hub MCP 서버 추가 |
| 2025-12-31 22:30 | Code | 시스템 상태 보고서, /api/wishes 404 수정 |
| 2025-12-30 07:15 | Code | 최초 생성 (P0 완료 반영) |

---

*이 문서는 새 작업 세션 시작 시 "AURORA_STATUS.md 읽어봐"로 즉시 상황 파악 가능*
