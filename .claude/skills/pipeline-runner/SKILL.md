---
name: pipeline-runner
purpose: 파이프라인 자동 실행
version: 1.0.0
---

# 파이프라인 러너 스킬

## 역할
- 파이프라인 .md 파일 읽기
- 단계별 자동 실행
- 성공/실패 판단 및 다음 단계 진행
- Registry 기록

## 실행 흐름

```
파이프라인 파일 로드
    ↓
현재 단계 확인
    ↓
해당 에이전트 호출
    ↓
결과 검증 (성공/실패)
    ↓ 성공
다음 단계 자동 진행
    ↓ 실패
재시도 (최대 3회) → 실패 시 코미 알림
```

## 단계 정의 형식

```yaml
step:
  id: 1
  name: "단계 이름"
  agent: agent-name
  input: { ... }
  output: { ... }
  success_condition: "조건"
  next_step: 2  # 또는 [2, 3] 병렬
  on_failure: "retry" | "skip" | "alert"
```

## 실행 결과 기록

```json
{
  "pipeline": "wish-journey",
  "run_id": "run_20251229_001",
  "started_at": "2025-12-29T10:00:00Z",
  "completed_at": "2025-12-29T10:00:45Z",
  "status": "success",
  "steps": [
    {"step": 1, "status": "success", "duration": "2s"},
    {"step": 2, "status": "success", "duration": "25s"}
  ]
}
```
