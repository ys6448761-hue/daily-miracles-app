# CLAUDE.md — daily-miracles-mvp

## 스택
React + Vite + Express (Next.js 아님)
프론트: `dreamtown-frontend/src/` — React Router v6
백엔드: `routes/` — API prefix `/api/dt/`
DB: SQLite(로컬) / PostgreSQL(운영) — NODE_ENV 분기

## 절대 규칙
- 메시지 발송: `messageProvider.js` 경유 필수
- 금지 단어: 사주, 점술, 관상, 운세, 대운, 궁합
- 마이그레이션: `database/migrations/` 순번 엄수
- 에러: `middleware/errorHandler.js` 글로벌

## 핵심 로직
- 신호등: RED(자살/자해→관리자SMS즉시) / YELLOW / GREEN
- 기적지수: 5지표 50~100점 (`miracleScoreEngine.js`)

## 마이그레이션 현황
- 최신 번호: `089_ab_experiment_assignments.sql`
- 다음: `090_*.sql`

## 참조 (필요 시 직접 Read)
- 현황: `DREAMTOWN_STATUS.md`
- SSOT: `docs/ssot/core/`
- 컨텍스트 규칙: `CONTEXT_RULES.md` ← 새 대화 시작 시 필독
- 운영 점검 스킬: `/ops-check`
