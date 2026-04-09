# /task-start — 작업 시작 로깅

새 작업을 시작할 때 실행. KPI 측정을 위해 task_start 이벤트를 기록한다.

## 사용법
```
/task-start
```
또는 작업 유형과 함께:
```
/task-start feature: AI 업셀 모달 구현
/task-start fix: 결제 오류 수정
/task-start analysis: 전환율 분석
```

## 실행 지시

1. 현재 시간과 랜덤 task_id를 생성한다:
   ```bash
   node -e "console.log(require('crypto').randomUUID())"
   ```

2. 작업 유형을 판단한다 (사용자 입력 기반):
   - 새 기능 → `feature`
   - 버그 수정 → `fix`
   - 분석/조사 → `analysis`
   - 기본값 → `feature`

3. 서버가 실행 중이면 API로 기록, 아니면 로그 파일에 직접 기록:
   ```bash
   # API 방식 (서버 실행 중)
   curl -s -X POST http://localhost:5000/api/ops/metrics \
     -H "Content-Type: application/json" \
     -d '{"task_id":"[생성된UUID]","event_type":"task_start","value":{"type":"[유형]","description":"[작업 설명]"}}'
   
   # 직접 로그 방식 (fallback)
   echo '{"task_id":"[UUID]","event_type":"task_start","value":{"type":"[유형]"},"created_at":"[ISO시간]"}' >> logs/agent_metrics.log
   ```

4. task_id를 사용자에게 보여준다:
   ```
   📊 KPI 추적 시작
   task_id: [UUID]
   type: [유형]
   시작: [현재 시간 KST]
   
   작업 완료 시 /task-complete [UUID] 실행
   ```

5. 이 task_id를 기억하고, 대화 중 재시도가 필요하면 `/task-retry [UUID]`를 제안한다.
