# 소원놀이터 이벤트 스키마

> AIL-JOB-402: 이벤트 스키마 (추적) — "성장/철학"만 찍기

## 원칙

- 로그는 지표로 연결되는 이벤트만
- 개인정보/원문 텍스트는 이벤트에 직접 저장 금지 (artifact_id로 참조)
- 이벤트 이름은 `snake_case` 형식

---

## 이벤트 목록

### 1. artifact_created

아티팩트(창작물) 생성 시 발생

```json
{
  "event": "artifact_created",
  "timestamp": "2026-02-06T12:00:00Z",
  "data": {
    "artifact_id": 12345,
    "user_id": 100,
    "type": "wish_card",
    "visibility": "public",
    "has_parent": false,
    "remix_depth": 0
  }
}
```

### 2. artifact_scored

아티팩트 점수 계산 완료 시 발생

```json
{
  "event": "artifact_scored",
  "timestamp": "2026-02-06T12:00:01Z",
  "data": {
    "artifact_id": 12345,
    "user_id": 100,
    "score_total": 85,
    "grade": "A",
    "gate_result": "pass",
    "score_breakdown": {
      "pressure_zero": 20,
      "respect": 15,
      "pain_purify": 10,
      "reality_hint": 15,
      "one_step": 15,
      "blessing": 10
    }
  }
}
```

### 3. artifact_shared

아티팩트 공유 링크 생성 시 발생

```json
{
  "event": "artifact_shared",
  "timestamp": "2026-02-06T12:05:00Z",
  "data": {
    "artifact_id": 12345,
    "share_id": 500,
    "sharer_user_id": 100,
    "visibility": "public"
  }
}
```

### 4. share_viewed

공유 링크 조회 시 발생

```json
{
  "event": "share_viewed",
  "timestamp": "2026-02-06T13:00:00Z",
  "data": {
    "share_id": 500,
    "artifact_id": 12345,
    "viewer_user_id": 200,
    "is_member": true
  }
}
```

### 5. remix_started

리믹스 시작 시 발생 (부모 아티팩트 선택)

```json
{
  "event": "remix_started",
  "timestamp": "2026-02-06T14:00:00Z",
  "data": {
    "parent_id": 12345,
    "user_id": 200
  }
}
```

### 6. remix_completed

리믹스 완료 시 발생

```json
{
  "event": "remix_completed",
  "timestamp": "2026-02-06T14:10:00Z",
  "data": {
    "artifact_id": 12346,
    "parent_id": 12345,
    "root_id": 12345,
    "remix_depth": 1,
    "user_id": 200
  }
}
```

### 7. reaction_added

반응 추가 시 발생

```json
{
  "event": "reaction_added",
  "timestamp": "2026-02-06T15:00:00Z",
  "data": {
    "artifact_id": 12345,
    "user_id": 300,
    "reaction_type": "thanks"
  }
}
```

### 8. reward_granted

보상(배지/크레딧) 지급 시 발생

```json
{
  "event": "reward_granted",
  "timestamp": "2026-02-06T16:00:00Z",
  "data": {
    "user_id": 100,
    "type": "badge",
    "key": "warm_one_liner",
    "amount": 0,
    "trigger": "reaction_threshold"
  }
}
```

---

## 지표 연결

| 이벤트 | 연결 지표 |
|--------|----------|
| artifact_created | WAC (Weekly Active Creators), 창작물 수 |
| artifact_scored | 등급 분포, 평균 점수 |
| artifact_shared | 공유율, 바이럴 계수 |
| share_viewed | 유입율, 전환율 |
| remix_completed | Remix Rate, 계보 깊이 |
| reaction_added | Help Score 변화, 반응률 |
| reward_granted | 배지 획득률, 크레딧 분배 |

---

## 개인정보 보호

- `user_id`: 내부 ID만 사용 (이메일/전화번호 X)
- `content_json`: 이벤트에 포함 X (artifact_id로 참조)
- `ip_address`: 해시 처리 후 저장
- `user_agent`: 해시 처리 후 저장

---

## 이벤트 발송 위치

| 이벤트 | 발송 서비스/파일 |
|--------|-----------------|
| artifact_created | artifactService.createArtifact() |
| artifact_scored | scoreService.scoreArtifact() |
| artifact_shared | shareService.createShareLink() |
| share_viewed | shareService.recordView() |
| remix_started | (클라이언트) |
| remix_completed | artifactService.createArtifact() (parent_id 있을 때) |
| reaction_added | artifactService.addReaction() |
| reward_granted | rewardService.grantCredit(), checkAndGrantBadges() |

---

## 구현 상태

- [x] 이벤트 스키마 정의
- [ ] 이벤트 발송 로직 추가
- [ ] 분석 대시보드 연동
