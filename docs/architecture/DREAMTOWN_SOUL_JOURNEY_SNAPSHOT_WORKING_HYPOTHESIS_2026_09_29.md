# DreamTown / SOUL Handover
## Sowon Dream Space · Yeouiju · SOUL · Journey Memory Integration
Status: PRODUCT / ARCHITECTURE WORKING HYPOTHESIS
Promotion: NOT Candidate / NOT SSOT
Migration: NONE
Production Change: NONE
Date: 2026-09-29

---

## 1. Purpose

이번 논의의 목적은 SOUL 개인화 상세페이지가 여행 종료 후 어떻게 남는지,
기존 소원꿈터 및 여의보주 역할과 어떻게 연결되는지를 정리하는 것이었다.

새로운 SSOT를 확정하는 작업이 아니다.

기존에 논의되어 있던:

- 소원꿈터 = 소원이의 개인 공간 / 개인 홈페이지
- 여행뿐 아니라 일상도 축적
- 여의보주 = 소원이의 일상을 장기적으로 기억하는 역할
- SOUL = 현재 여행 영역을 담당

이라는 방향과,
이번에 논의한 Personalized SOUL Page / Journey Snapshot을 연결한
현재 판단 위치를 인수인계하기 위한 문서다.

---

## 2. Core Role Separation

### 소원꿈터

소원꿈터는 여행 기록함이 아니다.

소원이의:

- 일상
- 소원
- 소원그림
- 기억에 남은 장면
- 여행
- Journey Snapshot

등이 지속적으로 쌓이는 개인 공간이다.

Working Definition:

> 소원꿈터는 소원이의 삶이 쌓이는 집이다.

사용자가 여러 개의 독립된 보관함을 찾아다니게 하지 않는다.

`나의 여정` 역시 별도의 독립 목적지보다는
소원꿈터 안의 핵심 영역으로 보는 방향이 현재 판단이다.

---

### 여의보주

여의보주는 여행 전문 AI가 아니다.

소원꿈터에 축적되는 소원이의 일상과 삶의 기억을
장기적으로 바라보는 역할이다.

Working Definition:

> 여의보주는 소원꿈터에서 소원이의 삶을 기억한다.

여행뿐 아니라 Daily Moment / Wish / Wish Image /
Memory Scene / Journey Snapshot 등과 연결될 수 있다.

단, 기억된 과거 상태를 현재 사실로 자동 가정하지 않는다.

예:
지난 여행이 부모님 동행이었다고 해서
현재 여행도 부모님 동행이라고 단정하지 않는다.

---

### SOUL

SOUL은 현재 여행 영역의 전문 역할이다.

SOUL이 다루는 핵심 범위:

- Traveler State
- Place
- Relationship
- Prepared Travel Knowledge
- Journey Decision
- Live Information
- Experience Outcome

Working Definition:

> SOUL은 소원이가 여행을 떠날 때 함께 걷는 여행친구다.

SOUL을 소원이의 모든 일상과 삶을 장기 기억하는
범용 AI로 확장하지 않는다.

그렇게 할 경우 기존 여의보주의 역할이 흐려진다.

---

## 3. Personalized SOUL Page

SOUL Place Detail Page는 단순 Chat Answer가 아니다.

Public Place Page에 Traveler State가 더해지면서
현재 여행자에게 맞게 recomposition되는 살아있는 상세페이지다.

질문에 따라 전체 페이지를 새로 생성하는 것이 아니라:

- Text
- Priority
- Module Order
- Relevant Cards
- Journey
- Context Image
- Action

등 필요한 부분만 변화한다.

원칙:

> 고정되는 것은 장소이고,
> 변하는 것은 여행자의 관점이다.

Runtime에서 매번 전체 페이지를 생성하기보다
Prepared Knowledge / reusable asset / context routing을 우선한다.

---

## 4. Journey Persistence

개인화 SOUL Page 전체를 여행 종료 후 그대로 영구 저장하는 방향은
현재 권장하지 않는다.

반대로 Traveler State 값만 남겨
여행의 의미를 잃는 것도 피한다.

Current Working Hypothesis:

> 살아있는 SOUL Page는 여행 종료 후
> 의미 있는 상태를 압축한 Journey Snapshot으로 남긴다.

Journey Snapshot은 거대한 자동 여행기가 아니다.

최소한 다음과 같은 의미 있는 기억을 보존하는 방향이다:

- 어떤 여행이었는지
- 어떤 장소를 연결했는지
- 무엇을 고민했는지
- 무엇을 선택했는지
- 확인된 실제 경험
- 기억에 남은 장면
- 관련 소원
- 대표 이미지/사진 reference

모든 Prompt / Chat transcript / Live Data /
당시 페이지 전체 HTML을 영구 보존하는 개념이 아니다.

Working Principle:

> 살아있을 때는 풍부하게.
> 지나간 뒤에는 의미 있게 압축한다.

---

## 5. Journey Snapshot Home

Journey Snapshot의 사용자 관점 저장공간은
별도의 `나의 여정` 서비스가 아니라
`소원꿈터` 안으로 통합하는 방향이다.

즉:

소원꿈터
├─ 일상의 흔적
├─ 나의 소원
├─ 소원그림
├─ 남은 장면
└─ 나의 여정
   └─ Journey Snapshot

내부 데이터 객체는 분리할 수 있다.

UI Home을 하나로 만드는 것과
DB 객체를 하나로 합치는 것은 다른 문제다.

현재 단계에서 새로운 DB Schema를 확정하거나
migration을 수행하지 않는다.

---

## 6. Journey Snapshot ↔ Wish

Journey와 Wish는 같은 데이터가 아니다.

Journey Snapshot:
> 내가 무엇을 했는지를 기억한다.

Wish:
> 그 경험이 내 마음에 무엇을 남겼는지를 기억한다.

두 객체는 서로 연결될 수 있다.

Example:

소원꿈터
→ Wish
→ "이 소원이 태어난 여정 보기"
→ Journey Snapshot

그리고 반대로:

Journey Snapshot
→ "이 여행에서 남긴 소원"
→ Wish

양방향 연결을 가설로 둔다.

---

## 7. Journey Snapshot as Bridge

Journey Snapshot은 SOUL과 여의보주의 경계에서
중요한 Bridge 역할을 한다.

SOUL 관점:
> 여행의 종료 기록

여의보주 관점:
> 소원이의 삶에 새롭게 들어온 기억

Flow:

여의보주 / 소원꿈터
→ 여행 의도 발생
→ SOUL
→ Personalized Place Page
→ Journey
→ 실제 여행
→ Outcome
→ Journey Snapshot
→ 소원꿈터
→ 여의보주의 장기 기억

따라서 여행이 끝나도 SOUL의 모든 Session State를
여의보주에 그대로 전달하는 것이 아니다.

의미 있는 Journey Memory로 압축하여 연결하는 방향이다.

---

## 8. Daily Life Is Important

소원꿈터는 여행할 때만 방문하는 공간이 되어서는 안 된다.

기존 방향대로 일반 일상도 축적될 수 있어야 한다.

Example:

- 사진 한 장
- 짧은 일상 기록
- 작은 소원
- 특별한 순간
- 가족의 기억
- 소원그림
- 여행

경험의 크기에 따라 표현의 깊이는 달라질 수 있다.

작은 일상: Photo + Short Text + Date
소원: Wish Record
특별한 순간: Memory Scene
여행: Journey Snapshot

모든 일상 기록을 거대한 상세페이지로 만들지 않는다.

---

## 9. Return Motivation

소원꿈터의 재방문 동기는
포인트나 인위적 리텐션 장치만으로 만들지 않는다.

핵심 가설:

> 내 삶과 소원이 계속 쌓이기 때문에 다시 돌아온다.

사용자는 소원꿈터에서:

- 오늘의 흔적을 남기고
- 지난 기억을 보고
- 소원을 다시 만나고
- 지난 여정을 보고
- 새로운 소원을 남기고
- 필요하면 새로운 여행을 시작할 수 있다.

따라서 소원꿈터는 과거의 Archive이면서
새로운 경험의 출발점이 될 수 있다.

---

## 10. Yeouiju → SOUL Handoff

소원꿈터의 장기 기억 역할은 여의보주가 담당한다.

사용자가 여행 의도를 표현하면
여의보주와 SOUL 사이에 역할 전환이 가능하다.

Example:

User: "어디 좀 다녀오고 싶어."

Yeouiju:
과거 기억을 현재 사실로 단정하지 않고,
필요한 맥락을 사용자에게 확인.
→ SOUL과 여행 시작

SOUL:
여행 전문 판단 시작.

Important:
여의보주가 여행 전문가 역할까지 모두 수행하거나,
SOUL이 Life Memory 역할까지 모두 흡수하지 않는다.

---

## 11. Phoenix Experience Is Separate

소원꿈터에 저장된 일상 / Wish / Journey가
자동으로 Phoenix Knowledge가 되어서는 안 된다.

다음은 서로 다른 권한이다:

1. 개인 소원꿈터에 저장
2. 다른 사람에게 공개
3. Phoenix Experience Knowledge 활용 동의

공개했다고 자동으로 AI Knowledge 활용 동의가 되는 것도 아니다.

동의된 여행 경험도 즉시 Truth가 되지 않는다.

Experience
→ repeated signal
→ verification if required
→ human review
→ Prepared Knowledge

기존 Experience Pipeline 원칙을 유지한다.

---

## 12. Current Product Loop

Daily Life
→ Sowon Dream Space
→ Yeouiju Memory
→ Wish / Memory
→ Travel Intent
→ SOUL
→ Living SOUL Detail Page
→ Journey
→ Real Experience
→ Journey Outcome
→ Journey Snapshot
→ Sowon Dream Space
→ Yeouiju Memory
→ Daily Life / Next Wish / Next Journey

Working Interpretation:

> 여행이 소원꿈터를 만드는 것이 아니다.
> 소원꿈터라는 나의 공간 안에서 여행도 살아간다.

---

## 13. Current Status

This is NOT:
- Approved Architecture
- SSOT
- Candidate
- DB Schema
- Production Decision

This IS:
- Product/Architecture Working Hypothesis
- Handover-worthy current judgment position
- Existing Sowon Dream Space / Yeouiju concept와
  Journey Snapshot 논의를 연결한 continuity record

Do NOT create:
- new large DB schema
- migration
- place_knowledge migration
- production change

from this document alone.

---

## 14. Current Next Action

Do not replace the existing Vertical Slice Next Action.

Current implementation priority remains:

여수해상케이블카 SOUL Detail Page V0.1
→ actual mobile screen
→ Founder + Lumi UX Review

Journey Snapshot / Sowon Dream Space integration is the next connected
prototype subject AFTER the living detail page behavior is observed.

When that stage begins, prototype only the smallest flow:

Living SOUL Detail Page
→ 내 여정에 담기
→ Journey Snapshot
→ 소원꿈터
→ 지난 여정 보기
→ 필요 시 SOUL로 새 여정 시작

No architecture promotion before prototype evidence.
