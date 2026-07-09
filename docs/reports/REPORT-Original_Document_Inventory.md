---
Document: REPORT-Original_Document_Inventory
Purpose: 저장소 내 Original(Level 0) 분류 후보 문서 조사. 실제 이동은 수행하지 않음(권장만).
Date: 2026-07-09
Related: docs/originals/README.md, SSOT-DOC-001_Document_Governance.md
---

# REPORT — Original Document Inventory

> 조사 범위: `docs/raw/conversations/`, `docs/processed/`, `docs/gpt/`, `docs/lumi/`, `docs/decisions/`, `docs/00-master/`, `docs/ssot/core/`, `docs/experiments/`, `docs/plans/`, `docs/2d/`, 그리고 파일명에 "원본/Original/Idea/GPTS/Instructions/Prompt" 등이 포함된 전체 docs/ 하위 파일.
> 읽기 전용 조사이며 **실제 파일 이동은 수행하지 않았다.**

---

## 1. 즉시 Original(Level 0) 인정 — 이동 검토 대상

| 현재 위치 | Original 여부 | 사유 |
|---|---|---|
| `docs/raw/conversations/2025-12/루미 GPTS Instructions v1_2025-12-30.md` | 예 | "너는 '루미(Lumi)'다"로 시작하는 2인칭 페르소나 정의 — 실제 커스텀 GPT의 system-prompt 원문. GPT Builder Instructions의 전형적 사례. |
| `docs/raw/conversations/2025-12/코미업그레이드오퍼스_2025-12-30` | 예 | AI 페르소나를 특정 모드로 전환시키는 원본 프롬프트 그대로 저장됨. |
| `docs/raw/conversations/2026-01/기타/2026-01-04_완주소원이MVP구현스펙v1.0.md` | 예(가능성 높음) | "Claude Code 실행용" 비정형 스펙 원문 — 대표/코미가 직접 작성한 최초 스펙으로 추정. |
| `docs/raw/conversations/` 폴더 전체(템플릿 제외) | 예 | 코미/루미/재미 등 팀 페르소나가 대표와 나눈 실제 대화·지시서·기획 원문. 가공(processed) 이전 상태 그대로. 개별 이동보다 **폴더 단위 인정**을 권장. |

---

## 2. Original 아님 (명확)

| 위치 | 사유 |
|---|---|
| `docs/processed/` 전체 | 프론트매터에 `source: raw/conversations/...` 명시된 파생/가공 문서. 정의상 Level 1 이상. |
| `docs/gpt/` 전체 | "GPT 입력용 참고자료"로 스스로 명시(예: `DreamTown_GPT_Knowledge_Pack.md`) — GPT의 instructions 원문이 아니라 GPT에게 먹이는 레퍼런스. |
| `docs/decisions/` 전체 | 토론엔진(DEB-ID 참조) 산출물이거나 이미 "결정 정보 표+실행계획"으로 구조화된 처리 문서. |
| `docs/00-master/aurora5-master-knowledge-v2.md` | 문서 자체에 "작성: Code, 승인: 푸르미르님" 명시 — Code가 취합한 컴파일 마스터. |
| `docs/ssot/core/` 대부분, `docs/ssot/support/*` | Version/Owner/Status 메타로 통일된 정본 SSOT 포맷. |
| `docs/experiments/`, `docs/plans/` 대부분 | "담당: Claude Code" 명시된 실험/계획 문서. |

---

## 3. 애매 — 추가 확인 필요 (플래그만, 임의 판단하지 않음)

| 위치 | 이슈 |
|---|---|
| `docs/ssot/core/DreamTown_Universe_Bible.md` (v4.0) | 문서 스스로 "저작자: 이세진(푸르미르)", "최초 창작일: 2025년", "저작권 등록용 완성본"이라 명시 — **원본 창작자는 대표가 맞으나, 이 파일 자체는 2026-03-24에 재정리된 사후 컴파일본**이지 초고가 아니다. 대표의 2025년 최초 구상 원문(초안)이 별도로 존재하는지는 이번 조사 범위에서 발견하지 못했다. |
| `docs/ssot/core/DreamTown_Origin_Myth_SSOT.md` | "Updated By: Code" — 대표의 아이디어(여수 금오설화 재해석) 기반이나 텍스트 자체는 Code가 서사화. 최초 구상 메모의 별도 존재 여부 미확인. |
| `docs/ssot/core/DreamTown_Core_Philosophy_SSOT.md` | 핵심 선언 문구는 대표의 오리지널일 가능성이 높으나, 문서 전체는 Code가 구조화. 최초 발화/대화록 교차 확인 필요. |
| `docs/raw/conversations/2026-01/기타/2025-12-29_최수민님원본자료.md` | 파일명은 "원본"이나 실제 내용은 이미 AI가 요약·재구성한 해설에 가까움 — 진짜 원본 전사가 따로 있는지 확인 필요. |
| `docs/lumi/설계구조-루미기획-충돌분석.md` | "루미기획"이라는 더 이른 원본 기획의 존재를 시사하나, 그 원본 자체는 이번 조사에서 발견되지 않음. |
| `docs/2d/v7.0/MIRACLE_MASTER_GUIDELINES.md`가 인용하는 `20260131_파크_2d_기술지원.md`, `20260201_드라이브_공유폴더_마스터가이드.md` | 저장소 내에서 발견되지 않음 — Drive 등 외부 소재일 가능성. |

---

## 4. 종합 판단

- 명확한 Original 후보는 대부분 `docs/raw/conversations/`에 이미 모여 있다 — 이 폴더는 사실상 이미 "raw" 원칙으로 운영되고 있었다.
- 가장 민감한 이슈는 **`DreamTown_Universe_Bible.md` 등 3편이 "대표의 원본 창작 비전"과 "Code가 재정리한 SSOT 정본"이 한 파일 안에 섞여 있다**는 점이다. 저작권 등록 문서라는 점에서 지배구조상 중요하나, **이번 조사에서는 파일을 옮기지 않았고, 판단도 내리지 않았다** — 대표의 확인이 선행되어야 한다.
- 실제 이동은 수행하지 않았다. 위 표는 권장 사항일 뿐이다.
