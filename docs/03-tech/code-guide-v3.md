# Claude Code 작업 지침 v3.0

> 이 파일은 Claude Code가 프로젝트 작업 시 참조하는 기술 지침입니다.
> 프로젝트 전체 컨텍스트는 [CLAUDE.md](../../CLAUDE.md)를 참조하세요.

**최종 업데이트**: 2026-02-26

---

## 1. 프로젝트 기본 정보

- **서비스명**: 하루하루의 기적 (Daily Miracles)
- **기술 스택**: Node.js 20.x, Express, OpenAI, SENS
- **호스팅**: Render.com (자동 배포)
- **DB**: PostgreSQL (Render)
- **저장소**: github.com/ys6448761-hue/daily-miracles-app

## 2. 세션 시작 체크리스트

1. `.claude/AURORA_STATUS.md` 읽기 (현황 파악)
2. `.claude/team-memory/context.md` 확인 (우선순위)
3. `git status` 확인 (현재 브랜치 상태)

## 3. 작업 규칙

### 코드 수정 시
- 수정 전 해당 파일 반드시 읽기
- 기존 코드 스타일/패턴 유지
- 에러 핸들링 포함
- console.log에 `[모듈명]` 프리픽스 사용

### 메시지/콘텐츠 생성 시
- 역순 프롬프트 전략 적용 (`utils/reverseOrderPrompt.js`)
- 금지어 체크 (`skills/design-system/forbidden-words.json`)
- 브랜드 톤 준수 (`skills/design-system/brand-voice.md`)

### 커밋 규칙
- 커밋 전 사용자 확인
- 의미 있는 커밋 메시지 (fix/feat/refactor 등)
- 민감정보 포함 여부 확인

## 4. 핵심 파일 참조

| 파일 | 역할 |
|------|------|
| `routes/wishRoutes.js` | 소원 API + 신호등 |
| `services/messageProvider.js` | 메시지 발송 (SENS) |
| `services/miracleScoreEngine.js` | 기적지수 계산 |
| `config/messageTemplates.js` | 메시지 템플릿 |
| `middleware/errorHandler.js` | 에러 핸들링 |

## 5. 가디언 모드

모든 작업 완료 후 자동 점검:
- 코드 품질 (누락/연결/일관/품질)
- 시스템 헬스 (용량/임시파일)
- 선제적 제안 (최소 2개)

상세: [CLAUDE.md](../../CLAUDE.md) 가디언 모드 섹션

---

*이 문서는 CLAUDE.md의 기술 작업 지침을 별도 파일로 분리한 것입니다.*
