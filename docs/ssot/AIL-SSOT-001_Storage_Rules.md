# AIL-SSOT-001: DreamTown SSOT 저장 규칙

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown 세계관, 설계, 작업 기록을 혼란 없이 관리하기 위한 저장 규칙

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 1. 기본 원칙

코드는 대화 내용을 그대로 저장하지 않는다.

```
대화 → 핵심 내용 추출 → 문서 분류 → 기존 문서와 병합 → SSOT 저장
```

```
대화 = 기록
문서 = 정리된 진실
```

---

## 2. 문서 분류 체계

```
docs/
 ├── ssot/       ← 프로젝트의 진짜 기준 (변하지 않는 진실)
 ├── design/     ← 설계 문서
 ├── tasks/      ← 실행 작업 기록
 └── archive/    ← 미확정 아이디어 보관
```

---

## 3. Core SSOT 규칙

경로: `docs/ssot/`

- 프로젝트의 진짜 기준만 저장
- 중복 금지 — 주제당 문서 1개
- 기존 문서에 병합 (새 문서 생성 지양)
- **목표: 10~15개** — 이상 늘어나면 통합 정리

---

## 4. Design Document 규칙

경로: `docs/design/`

설계 문서 저장. 예:
```
Yeosu_Galaxy_Map_Design.md
Aurum_UX_Guide_Design.md
Wish_Image_System_Design.md
Miracle_Video_System_Design.md
```

---

## 5. Task Document 규칙

경로: `docs/tasks/`

```
형식: TASK-YYYY-MM-DD-Subject.md
예:   TASK-2026-03-09-GalaxyMap.md
```

---

## 6. Archive 규칙

경로: `docs/archive/`

미확정 아이디어 보관. 예:
```
ARCHIVE-Idea-Constellation.md
ARCHIVE-Story-Concept.md
```

---

## 7. 문서 상태 태그

모든 문서 상단에 반드시 표시:

```
Status: Draft | Review | Confirmed | Archived
Owner: Aurora5
```

---

## 8. 중복 방지 규칙

저장 전 반드시 확인:
- 같은 주제 문서 존재 여부
- 존재하면: 새 문서 생성 ❌ → 기존 문서 업데이트 ⭕

---

## 9. 저장 금지 항목

아래는 저장하지 않는다:
- 감정 대화, 칭찬, 동기부여, 잡담

저장 대상:
- 확정된 설계, 결론, 규칙, 구조

---

## 10. 핵심 원칙

```
SSOT = Single Source of Truth
한 문서 = 한 진실

대화는 많아도 괜찮다
SSOT는 적어야 한다
```

SSOT는 프로젝트의 헌법이다.
