# 피드백 루프 가이드라인

## 원칙
> "실수는 학습의 기회다. 같은 실수를 두 번 하지 마라."

## 프로세스

```
1. 에러 발생 → 즉시 기록
2. 패턴 분석 → 근본 원인
3. 지침 개선 → 코미 승인
4. 반영 → 숙련도 향상
```

## 기록 위치

- 에러: `docs/learnings/errors/`
- 개선: `docs/learnings/improvements/`

## 파일명 규칙

```
errors/YYYY-MM-DD_agent-name_error-type.md
improvements/YYYY-MM-DD_improvement-summary.md
```

## 에이전트 숙련도 추적

매주 에이전트별 성공률 추적:
- 성공률 95%+ → 숙련
- 성공률 90-95% → 양호
- 성공률 85-90% → 개선 필요
- 성공률 85%- → 집중 점검
