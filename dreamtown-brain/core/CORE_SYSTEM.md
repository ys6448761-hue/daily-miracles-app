# CORE_SYSTEM

> DreamTown Brain의 핵심 동작 기준

---

## 목적

이 Brain은 두 가지를 분리해서 저장한다.

- **official/** — 합의되고 승인된 것. 흔들리지 않는 기준.
- **purmir-lab/** — 아직 합의되지 않은 것. 자유롭게 탐색하는 공간.

이 둘이 섞이지 않을 때 DreamTown은 일관성을 유지한다.

---

## 핵심 규칙

1. official은 CEO 승인 후에만 변경
2. purmir-lab은 초안 상태가 기본값. 완성도를 요구하지 않는다
3. memory/failures는 삭제 금지. 실패를 기억하는 것이 성장이다
4. 모든 결정(DEC)은 official/dec에 남긴다. 이유 없는 결정은 없다

---

## 관계 구조

```
purmir-lab (탐색)
    ↓ 검토 + 승인
official (확정)
    ↓ 학습
memory (패턴화)
    ↓ 활용
workflows / agents (실행)
```
