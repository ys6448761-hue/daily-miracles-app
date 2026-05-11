# ROLE_SYSTEM

> DreamTown Brain 내 역할 정의

---

## 목적

누가 무엇을 담당하는지 명확히 한다.
역할이 겹치면 책임이 사라진다.

---

## 역할 구분

| 역할 | 담당자 | 공간 |
|------|--------|------|
| 세계관 설계 / 최종 결정 | 푸르미르 (CEO) | purmir-lab + official 승인 |
| 코드 구현 / 기술 실행 | Code (Claude Code) | routes/, services/ |
| 분석 / 조언 / 읽기 | Antigravity | 읽기 전용 |
| Brain 기록 관리 | Code (위임) | dreamtown-brain/ |

---

## 금지 사항

- Code는 purmir-lab 내용을 임의로 official로 이동하지 않는다
- Antigravity는 코드 파일을 수정하지 않는다
- official 변경은 푸르미르 지시 없이 불가

---

## 에이전트 정의 위치

`agents/` 폴더에 각 에이전트별 역할 파일을 둔다.
