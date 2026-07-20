---
code: CAND-CONSTITUTION-002
title: DreamTown Experience Constitution — Companion Growth Platform
status: Candidate
priority: Level 4 (Constitution / Experience / Product Direction)
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-20
related_ssot:
  - daily-miracles-mvp/docs/ssot/core/SSOT-LOOP-001_Seal_Return_Unlock_Loop_Guide.md (봉인-재방문-해제 루프와 "성장 영양분" 개념이 정합적 — 충돌 아님, §Conflict Check 참조)
  - daily-miracles-mvp/docs/ssot/core/DreamTown_Character_SSOT.md (§105 "아우룸은 여행을 안내하고, 소원이는 여행을 살아간다" — 이번 문서 Core Principle 3과 정합적)
  - daily-miracles-mvp/docs/ops/DreamTown_KPI_Checklist.md ("push: 푸시 알림 미구현 — 0이 정상" — Core Principle 4와 충돌 없이 일치)
promotion_path: Research → Candidate → Review → Constitution (본 저장소 CONSTITUTION_GOVERNANCE.md 절차를 따른다, 아직 승격하지 않음)
---

> 본 문서는 기존 Constitution/SSOT/Manifesto를 대체하지 않는다. 실제
> 콘텐츠/기능 설계에 반복 적용되어 검증된 이후에만 승격을 검토한다.
>
> **Claude Code 행동 지침 (문서 마지막 지시 반영):** 새로운 기능을
> 설계할 때마다 "이 기능이 이야기를 풍성하게 하는가?"를 가장 먼저
> 판단 기준으로 삼는다. 이 지침은 Candidate 상태이므로 구속력 있는
> 규칙(OP-CONSTITUTION류)은 아니지만, 이후 DreamTown 관련 작업에서
> 우선적으로 참고한다.

---

# CAND-CONSTITUTION-002 — DreamTown Experience Constitution: Companion Growth Platform

## Why

DreamTown은 여행 예약 서비스가 아니다.

DreamTown은 여행 이후에도 사용자와 함께 성장하는 동반 성장
플랫폼이다.

여행은 끝나지만 관계는 시작된다.

## Core Principle 1

사용자는 콘텐츠를 소비하지 않는다.

사용자는 자신의 별이 자라는 이야기를 경험한다.

## Core Principle 2

새싹은 시간만으로 성장하지 않는다.

다음 요소들이 성장의 영양분이다.

- 여수의 계절
- 여수의 바다
- 햇빛
- 바람
- 비
- 별공방
- 소원이의 하루
- 사용자의 삶
- 재회의 약속

모든 콘텐츠는 이 영양분 중 하나 이상을 전달해야 한다.

## Core Principle 3

소원이는 NPC가 아니다.

소원이는 자신의 삶을 살아가는 캐릭터다.

사용자가 앱을 열면 소원이가 오늘 무엇을 했는지, 오늘 무엇을
느꼈는지, 오늘 여수에서 무슨 일이 있었는지가 이야기로 이어진다.

## Core Principle 4

DreamTown은 Push Notification을 보내지 않는다.

DreamTown은 이야기의 다음 장을 전달한다.

## Core Principle 5

사용자가 다시 앱을 여는 이유는 기능이 아니다.

호기심이다.

오늘은 소원이가 어떻게 지냈을까?

## Core Principle 6

모든 콘텐츠는 새싹을 성장시키는 영양분이어야 한다.

만약 콘텐츠가 새싹도, 사용자도, 소원이도 성장시키지 못한다면 그
콘텐츠는 만들지 않는다.

## 최종 고정 문장

DreamTown은 여행 서비스를 만드는 프로젝트가 아니다.

DreamTown은 사용자와 소원이가 1년 동안 함께 살아가는 이야기를 만드는
프로젝트다.

모든 기능은 이 이야기를 더 풍성하게 만들기 위해 존재한다.

새로운 기능을 설계할 때마다 "이 기능이 이야기를 풍성하게 하는가?"를
가장 먼저 판단한다.

---

## Conflict Check (2026-07-20)

`daily-miracles-mvp/docs/` 전체에서 다음을 확인했다 — 직접 충돌하는
기존 SSOT/Constitution 없음:

- **Push Notification** — `docs/ops/DreamTown_KPI_Checklist.md:71`이
  "push: 푸시 알림 (미구현 — 0이 정상)"이라고 이미 기록하고 있다.
  이 문서의 Core Principle 4("Push Notification을 보내지 않는다")와
  **일치**한다 — 다만 KPI 체크리스트는 "아직 미구현"이라는 뉘앙스이고
  이 문서는 "의도적으로 보내지 않는다"는 원칙 선언이라는 점에서
  근거의 성격이 다르다(사실 vs 의도) — 충돌은 아니되 이 차이는
  기록해 둔다.
- **소원이 캐릭터 철학** — `docs/ssot/core/DreamTown_Character_SSOT.md:110`의
  핵심 문장 "아우룸은 여행을 안내하고, 소원이는 여행을 살아간다"가
  이미 이 문서의 Core Principle 3("소원이는 자신의 삶을 살아가는
  캐릭터")과 정확히 같은 방향이다 — **중복이 아니라 기존 철학의
  자연스러운 확장**으로 판단된다.
- **"Companion Growth Platform" 브랜드 표현** — 저장소 전체 검색
  결과 이 정확한 표현은 신규(0건 매치)다.
- **"성장의 영양분" 목록(Core Principle 2)** — `SSOT-LOOP-001`의
  장소별 역할 표(여수엑스포역=도착, 하멜등대=소원, 호텔=안식 등)와
  개념적으로 인접하지만, `SSOT-LOOP-001`은 "장소" 단위이고 이 문서는
  "계절·날씨·별공방·소원이의 하루·재회의 약속" 등 더 넓은 범주를
  다룬다 — 중복 아님, 상위 프레이밍으로 볼 수 있다.

## Governance

`CONSTITUTION_GOVERNANCE.md`(Research → Candidate → Constitution)를
따른다. 다음을 하지 않는다: 신규 SSOT 생성/수정, 기존 Character
SSOT/SSOT-LOOP-001 수정, Candidate 자동 승격.

## Validation Progress

```
□ 실제 콘텐츠 제작 시 "영양분 판단 기준"(Core Principle 2, 6) 적용 사례 축적
□ Push Notification 미사용 원칙이 실제 운영 결정에서 유지되는지 확인
□ "소원이의 하루" 형태의 콘텐츠가 실제로 제작·노출된 사례 확인
□ 최소 2회 이상 신규 기능 설계 시 "이야기를 풍성하게 하는가?" 기준 적용 기록
```

## Evidence

(이번 세션에 구두로 제시된 원칙을 최초 기록. 실제 콘텐츠/기능 설계에
적용된 사례가 쌓이면 이 절에 링크를 추가한다.)

## Last Review

2026-07-20 (최초 작성)

## Next Review

위 Validation Progress 중 최소 1개 항목이 실제로 충족되는 시점
