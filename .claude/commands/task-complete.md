# /task-complete — 작업 완료 로깅

작업이 완료됐을 때 실행. KPI 측정을 위해 task_complete + response_metrics 이벤트를 기록한다.

## 사용법
```
/task-complete [task_id]
```
예:
```
/task-complete a1b2c3d4-...
```
task_id를 모르면 `/task-complete` 만 입력 → 가장 최근 task_id 사용.

## 실행 지시

1. task_id 확인 (인자로 받거나 이번 대화의 마지막 task_start task_id 사용)

2. 이번 대화의 통계를 계산한다:
   - **turns**: 이번 작업 관련 사용자-AI 메시지 교환 횟수 (대략 추정)
   - **duration_sec**: 작업 시작부터 지금까지 초 (모르면 null)
   - **success**: true (완료) / false (미완료/포기)
   - **response_length**: 이번 마지막 응답의 글자 수 (대략 추정)

3. API 또는 파일로 기록:
   ```bash
   # task_complete 이벤트
   curl -s -X POST http://localhost:5000/api/ops/metrics \
     -H "Content-Type: application/json" \
     -d '{"task_id":"[UUID]","event_type":"task_complete","value":{"turns":[턴수],"duration_sec":[초],"success":true}}'
   
   # response_metrics 이벤트
   curl -s -X POST http://localhost:5000/api/ops/metrics \
     -H "Content-Type: application/json" \
     -d '{"task_id":"[UUID]","event_type":"response_metrics","value":{"response_length":[길이]}}'
   ```

4. 완료 메시지 출력:
   ```
   ✅ KPI 기록 완료
   task_id: [UUID]
   턴 수: [N]턴
   응답 길이: [N]자
   
   📊 /admin/kpi 에서 누적 지표 확인 가능
   ```

## 재시도 기록 (/task-retry)
작업 중 같은 요청을 다시 해야 할 때:
```bash
curl -s -X POST http://localhost:5000/api/ops/metrics \
  -H "Content-Type: application/json" \
  -d '{"task_id":"[UUID]","event_type":"task_retry","value":{"retry_count":1,"reason":"컨텍스트 손실"}}'
```

## 판정 기준 (루미 SSOT)
- 재시도율 ≥30% 감소 → ✓
- 평균 턴 수 20~40% 감소 → ✓
- 평균 응답 길이 30~50% 감소 → ✓
- 3개 모두 → 성공. 1개만 → 부분 성공. 0개 → 규칙 미적용.
