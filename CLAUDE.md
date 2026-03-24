markdown# CLAUDE.md — daily-miracles-mvp

## ⚠️ 프로젝트 구조 (반드시 먼저 읽을 것)

이 프로젝트는 Next.js가 아닙니다.
React + Vite + Express 구조입니다.

### DreamTown 프론트엔드
경로: `dreamtown-frontend/src/`
라우터: React Router v6
주요 파일:
- `Home.jsx`           ← 홈 + 광장
- `MyStar.jsx`         ← 내 별
- `StarDetail.jsx`     ← 별 상세 + 공명
- `StarBirth.jsx`      ← 별 탄생 축하
- `WishGate.jsx`       ← 소원 입력
- `DreamTownIntro.jsx` ← 인트로 3씬
- `AllStars.jsx`       ← 전체 별 목록

### 백엔드
경로: `routes/dreamtown*.js`
API prefix: `/api/dt/`

### 절대 착각 금지
- Next.js App Router 구조 아님
- `pages/` 폴더 없음
- `app/` 폴더 없음
- React Router가 라우팅 담당

---

## ⚡ 세션 시작 시 필수
- 현황: `DREAMTOWN_STATUS.md` (루트)
- 마스터: `docs/00-master/aurora5-master-knowledge-v2.md`
- 팀메모리: `.claude/team-memory/`

## 🚨 절대 규칙
- **코드 수정 권한: Claude Code만** (이 인스턴스는 Antigravity)
- Antigravity 허용: 읽기/분석/조언/docs 작성만
- Antigravity 금지: .js .html .css 수정, 파일 생성, package.json 변경
- 메시지 발송: 반드시 `messageProvider.js` 경유
- 금지 단어: 사주, 점술, 관상, 운세, 대운, 궁합

## 🗂 저장소
- 백엔드: `C:\DEV\daily-miracles-mvp` (이 repo)
- 프론트: `C:\DEV\sowon-dreamtown` (Next.js, 별도 CLAUDE.md)
- 스킬허브: `claude --add-dir C:\DEV\antigravity-notebooklm`

## 🔧 기술 스택 (핵심)
- Node.js 20 / Express / PostgreSQL(운영) / SQLite(로컬)
- AI: OpenAI GPT-4 / DALL-E 3
- 메시징: SENS (알림톡+SMS) | 결제: NicePay
- 호스팅: Render.com (port 5000) / 로컬: port 5100

## 📁 핵심 파일
```
server.js          ← 메인 앱
routes/            ← ~50개 라우트
services/          ← ~100개 서비스
  miracleScoreEngine.js  ← 기적지수 (50~100점)
  messageProvider.js     ← 발송 허브
database/migrations/     ← 22개 마이그레이션
```

## ⚙️ 핵심 로직
- 신호등: RED(자살/자해→관리자SMS즉시) / YELLOW(주의) / GREEN
- 기적지수: 5지표(간절함/구체성/실행력/긍정성/자기인식)
- 추적: Day7/30/90 SMS (SMS전용, 알림톡 미등록)
- DB패턴: UUID v4 PK, append-only 원장, 상태머신(video_jobs)

## 🗄 핵심 테이블
wish_entries, wish_tracking_requests, sowon_profiles,
point_ledger, harbor_wishes, settlement_events, ops_events

## 📐 개발 규칙
1. SSOT: 진실은 GitHub만
2. 환경분기: NODE_ENV (로컬SQLite/운영PostgreSQL)
3. 에러: middleware/errorHandler.js 글로벌
4. 마이그레이션: database/migrations/ 순번 엄수

## 📚 참조 문서 경로
| 문서 | 경로 | 용도 |
|------|------|------|
| DreamTown 현황 | `DREAMTOWN_STATUS.md` | 완료/진행/다음 작업 |
| GPT Knowledge 7종 | `docs/gpt/DT_*.md` | Code Architect GPT 업로드용 |
| SSOT 코어 13개 | `docs/ssot/core/*.md` | 세계관/캐릭터/철학 정본 |
| SSOT 인덱스 | `docs/ssot/INDEX.md` | 전체 SSOT 목록 |
| 드림타운 지식맵 | `docs/dreamtown/DreamTown_Knowledge_Map.md` | 시스템 전체 개요 |
| 마케팅 | `docs/04-marketing/` | 홈페이지 재구성 등 |