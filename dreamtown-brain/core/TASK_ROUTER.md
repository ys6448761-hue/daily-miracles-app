# TASK_ROUTER

> 작업 유형별 올바른 저장 위치 안내

---

## 목적

작업이 들어왔을 때 어디에 저장하고 어떤 흐름으로 처리할지 결정한다.

---

## 라우팅 테이블

| 작업 유형 | 저장 위치 | 비고 |
|-----------|-----------|------|
| 새 아이디어 / 직관 | `purmir-lab/dream-seeds/` | 초안 OK |
| 날것의 감정 메모 | `purmir-lab/emotional-notes/` | 완성 불필요 |
| 미래 세계관 스케치 | `purmir-lab/future-worlds/` | 자유 형식 |
| 미해결 질문 | `purmir-lab/unresolved/` | 답 없어도 기록 |
| 승인된 SSOT | `official/ssot/` | CEO 승인 필수 |
| 결정 기록 | `official/dec/` | 이유 포함 |
| 확정 비주얼 규칙 | `official/visual-rules/` | CEO 승인 필수 |
| 승인된 프롬프트 | `official/approved-prompts/` | 테스트 통과 후 |
| 이미지 생성 워크플로 | `workflows/image-generation/` | |
| Sora 장면 기획 | `workflows/sora-scenes/` | |
| 성공한 패턴 | `memory/successful-patterns/` | |
| 실패 기록 | `memory/failures/` | 삭제 금지 |
| 생성 결과물 | `output/images|videos|reports/` | |

---

## 처리 흐름

```
입력
  ↓
유형 판단 (위 테이블)
  ↓
저장
  ↓
필요 시 official 이동 (CEO 승인 후)
```
