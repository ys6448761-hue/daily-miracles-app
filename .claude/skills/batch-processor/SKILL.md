---
name: batch-processor
purpose: 대량 작업 배치 분할 및 병렬 처리
version: 1.0.0
---

# 배치 프로세서 스킬

## 역할
- 대량 작업을 적절한 크기의 배치로 분할
- 서브 에이전트 병렬 호출 조율
- 결과 수집 및 통합

## 사용 시점
- 10개 이상의 동일 유형 작업
- 독립적으로 실행 가능한 작업들
- 시간이 오래 걸리는 대량 처리

## 배치 분할 기준
| 작업 수 | 배치 크기 | 이유 |
|---------|----------|------|
| 1-10 | 전체 1개 | 오버헤드 방지 |
| 11-50 | 5개씩 | 적당한 병렬 |
| 51-200 | 10개씩 | 효율적 병렬 |
| 200+ | 20개씩 | 최대 병렬 |

## 병렬 처리 흐름

```
입력 (100개 작업)
    ↓
배치 분할 (10개 × 10)
    ↓
병렬 호출 [배치1] [배치2] ... [배치10]
    ↓
결과 수집
    ↓
통합 출력
```

## 구현 예시

```javascript
async function processBatch(tasks, batchSize = 10) {
  const batches = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    batches.push(tasks.slice(i, i + batchSize));
  }

  const results = await Promise.all(
    batches.map(batch => processTaskBatch(batch))
  );

  return results.flat();
}
```
