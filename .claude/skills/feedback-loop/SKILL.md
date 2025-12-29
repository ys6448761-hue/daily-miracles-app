---
name: feedback-loop
purpose: 에러 학습 및 지침 자동 개선
version: 1.0.0
---

# 피드백 루프 스킬

## 역할
- 에러 발생 시 자동 기록
- 원인 분석
- 지침 개선 제안
- 승인 후 반영

## 피드백 흐름

```
에러 발생
    ↓
docs/learnings/errors/에 기록
    ↓
원인 분석 (패턴 파악)
    ↓
해당 에이전트 지침 개선안 작성
    ↓
코미 검토/승인
    ↓
AGENT.md 또는 SKILL.md 업데이트
    ↓
docs/learnings/improvements/에 개선 기록
```

## 에러 기록 형식

**파일:** `docs/learnings/errors/YYYY-MM-DD_agent-name_error.md`

```markdown
---
date: 2025-12-29
agent: image-creator
error_type: API_ERROR
severity: HIGH
---

# 에러 보고서

## 요약
DALL-E 3 API 타임아웃 발생

## 상세
- 시간: 09:23:45
- 요청: 소원그림 생성
- 응답: 30초 타임아웃

## 원인 분석
OpenAI 서버 일시적 과부하

## 제안 조치
1. 재시도 로직 추가 (3회)
2. 타임아웃 시간 45초로 증가
3. Fallback 이미지 준비
```

## 개선 기록 형식

**파일:** `docs/learnings/improvements/YYYY-MM-DD_improvement.md`

```markdown
---
date: 2025-12-29
related_error: 2025-12-29_image-creator_error
applied_to: image-creator
---

# 개선 기록

## 변경 사항
image-creator 에이전트에 재시도 로직 추가

## 적용 전
단일 API 호출 → 실패 시 에러

## 적용 후
API 호출 → 실패 시 3회 재시도 → 여전히 실패 시 Fallback

## 결과
에러율 15% → 2%로 감소
```
