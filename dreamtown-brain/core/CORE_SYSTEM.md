# CORE_SYSTEM

> DreamTown Brain의 핵심 동작 기준

---

## 목적

이 Brain은 두 공간을 반드시 분리해서 저장한다.

- **official/** — OpenClaw의 기본 참조 기억. 항상 자동 참조된다.
- **purmir-lab/** — 푸르미르 개인 사고 공간. 자동 참조하지 않는다. 명시 요청 시에만 탐색한다.

이 분리가 유지될 때 OpenClaw는 신뢰할 수 있는 기억만 자동으로 사용한다.

---

## 접근 모델

| 공간 | 자동 참조 | 탐색 조건 |
|------|-----------|-----------|
| `official/` | **항상** | 기본값. 별도 요청 불필요 |
| `purmir-lab/` | **하지 않음** | 명시 요청 시에만 ("purmir-lab 탐색해줘") |
| `memory/` | 맥락에 따라 | 패턴 학습/조회 시 |
| `workflows/` | 작업 시작 시 | 해당 유형 작업 감지 시 |

---

## 핵심 규칙

1. `official`은 CEO 승인 후에만 변경
2. `purmir-lab`은 초안 상태가 기본값. 완성도를 요구하지 않는다
3. `official`과 `purmir-lab`을 섞지 않는다. 중간 상태는 없다
4. `memory/failures`는 삭제 금지. 실패를 기억하는 것이 성장이다
5. 모든 결정(DEC)은 `official/dec`에 남긴다. 이유 없는 결정은 없다
6. 모든 폴더에는 README 또는 .gitkeep을 둔다

---

## 관계 구조

```
purmir-lab (탐색 — 명시 요청 시에만)
    ↓ 검토 + CEO 승인
official (확정 — OpenClaw 기본 참조)
    ↓ 패턴 학습
memory (패턴화)
    ↓ 실행
workflows / agents
```
