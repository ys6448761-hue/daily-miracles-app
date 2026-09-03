---
code: CAND-OS-001
title: Lumi OS v2 – Phase 1 운영 정리 로드맵 (Proposal)
status: Candidate
priority: Level 5 (Candidate Constitution)
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-16
related_ssot:
  - docs/lumi/설계구조-루미기획-충돌분석.md
  - docs/lumi/소원이야기-책-구조-설명.md
  - docs/lumi/operations/README.md (Phase 1.1/1.2에서 구축된 운영 기록 구조)
  - docs/lumi/operations/MILESTONE-001_Phase1_Operating_Foundation.md (세션 요약/Milestone)
  - docs/constitution/candidate/CAND-OS-002_Lumi_OS_v2.1_Memory_Engine.md (§2의 "03 Memory Engine"을 구체화한 하위 Candidate)
  - sowon-dreamtown/CLAUDE.md (YAKB Knowledge Governance)
  - sowon-dreamtown/docs/YAKB/Governance/GOV-001_Governance_Lifecycle.md
promotion_path: Research → Candidate → Constitution (본 문서는 Candidate 단계, 실제 파일럿 100명 대화 관찰 전까지 구조를 확정하지 않는다)
---

> 본 문서는 기존 Constitution/SSOT/Manifesto를 대체하지 않는다. 실제
> 운영(파일럿 대화 관찰)에서 반복 검증된 이후에만 승격을 검토한다.
>
> Candidate Lifecycle는 `CONSTITUTION_GOVERNANCE.md`(Research → Candidate →
> Constitution)를 따른다.
>
> **이 문서는 계획 문서다. 이 문서가 설명하는 00~07 폴더 구조는 아직 실제
> 파일/폴더로 생성되지 않았다.** 구조 생성 여부는 §6, §7의 조건이
> 충족된 뒤 별도로 결정한다.

---

# CAND-OS-001 — Lumi OS v2 Phase 1 운영 정리 로드맵 (Candidate)

## 1. 목적과 범위

Lumi OS를 개발하기 전에 운영체계를 먼저 안정적으로 정리한다. 이 Phase
1 단계에서는 **새로운 기능을 추가하지 않는다** — 목적은 실제 소원이들과의
대화를 통해 검증할 수 있는 기반을 만드는 것이다.

핵심 원칙: **운영이 설계를 검증하고, 검증된 설계만 코드가 된다.**

범위: 이 문서는 Lumi OS의 상위 구조 제안과 파일럿 운영 계획을 다룬다.
실제 코드 구현, 프롬프트 작성, 폴더 생성은 이 문서의 범위 밖이며, Phase 1
성공 기준이 충족된 이후 별도 문서/작업으로 다룬다.

## 2. 00 Origin ~ 07 Changelog 각 책임

제안된 상위 구조:

```
Lumi OS

00 Origin
01 Constitution
02 Knowledge Engine
03 Memory Engine
04 Runtime
05 Prompt Library
06 Asset System
07 Changelog
```

| 계층 | 책임 | 변경 빈도 |
|---|---|---|
| 00 Origin | 존재 이유와 철학 | 매우 낮음 |
| 01 Constitution | 운영 원칙 | 낮음 |
| 02 Knowledge Engine | 지식 성장 정책 | 운영 결과에 따라 개선 |
| 03 Memory Engine | 기억 정책(무엇을 기억/망각할지) | 운영 결과에 따라 개선 |
| 04 Runtime | AI가 실제로 실행하는 규칙 | 중간 |
| 05 Prompt Library | 도메인별 실행 프롬프트(DreamTown, WishArt, Call To Wish 등) | 도메인 추가 시 |
| 06 Asset System | 자산 연동 체계 | 운영 결과에 따라 개선 |
| 07 Changelog | 모든 중요한 변경 기록 | 매 변경 시 |

이 구조는 운영 중에도 쉽게 변경하지 않는 것을 원칙으로 제안하나, Candidate
단계이므로 파일럿 관찰 결과에 따라 조정될 수 있다.

## 3. 기존 `daily-miracles-mvp/docs/lumi` 자료와의 관계

현재 `docs/lumi/`에는 다음 문서가 있다:

- `설계구조-루미기획-충돌분석.md` — 루미 기획과 기존 구조 간 충돌 분석
- `소원이야기-책-구조-설명.md` — 소원이야기 책 구조 설명

이 두 문서는 이미 존재하는 **개별 설계/분석 산출물**이며, Lumi OS v2가
제안하는 8단 구조 중 어디에 속할지는 아직 결정하지 않는다. 예를 들어
"설계구조-루미기획-충돌분석"은 `01 Constitution`(운영 원칙 충돌 분석)에
가까울 수도, `00 Origin`(존재 이유 재정의)에 가까울 수도 있다 — 이 분류
자체도 파일럿 운영을 거친 뒤 결정할 문제로 남긴다.

**지금 하지 않는 것:** 이 두 문서를 Lumi OS 폴더 구조로 이동하거나
재분류하지 않는다.

## 4. `sowon-dreamtown` YAKB 거버넌스와의 연결 방식

`sowon-dreamtown/CLAUDE.md`는 YAKB(Idea → Draft → Review → Approved →
LOCKED) 거버넌스를 사용하고, 본 저장소(`daily-miracles-mvp`)는
`CONSTITUTION_GOVERNANCE.md`(Research → Candidate → Constitution)를
사용한다. 두 체계는 이름은 다르지만 "운영으로 검증된 뒤에만 승격한다"는
사상은 동일하다.

Lumi OS v2는 다음 원칙으로 두 체계와 관계를 맺는다:

- Lumi OS v2 자체는 **이 저장소의 Candidate 체계**를 따른다(본 문서가 그
  첫 사례, `CAND-OS-001`).
- Lumi의 지식/기억 정책(`02 Knowledge Engine`, `03 Memory Engine`)이
  DreamTown의 지식 자산과 겹치는 지점이 생기면, YAKB의 Candidate
  (`docs/YAKB/02_SEEDS/Candidates/`)와 별도로 이 저장소의 Candidate가
  각자 자기 영역에서 성장하고, 실제로 통합이 필요해지는 시점에만 두
  체계 간 RFC/교차 참조를 만든다 — 지금 미리 통합 구조를 설계하지 않는다.

## 5. 중복·충돌 가능성

- `docs/lumi/설계구조-루미기획-충돌분석.md`가 이미 "충돌 분석"이라는
  이름으로 존재한다 — Lumi OS v2의 `01 Constitution`이 다루려는 내용과
  주제가 겹칠 가능성이 있다. 지금은 병합하지 않고 별개 문서로 둔다.
- `docs/ssot/core/*`(SSOT 코어 13개, 세계관/캐릭터/철학 정본)와 Lumi OS의
  `00 Origin`이 "존재 이유"를 다룬다는 점에서 주제가 겹칠 수 있다.
- `sowon-dreamtown`의 YAKB `00_MANIFESTO`, `CORE-PRINCIPLES-001`도 "존재
  이유/불변 원칙"을 다루므로, Lumi(캐릭터/어시스턴트)의 Origin과
  Project Phoenix(DreamTown 전체)의 Manifesto가 서로 다른 대상(어시스턴트
  vs 프로젝트 전체)을 가리키는지 명확히 구분할 필요가 있다 — 이 구분이
  안 되면 두 "존재 이유" 문서가 충돌하는 것처럼 보일 위험이 있다.

## 6. 독립 저장소 또는 편입 여부를 결정할 조건

다음 중 최소 2개 이상이 확인되면 저장소 위치(독립 저장소 신설 vs
`daily-miracles-mvp/docs/lumi` 편입 vs 별도 결정)를 다시 논의한다:

- [ ] 파일럿 100명 대화 관찰 완료(§5 참조)로 Runtime/Memory Engine의
      실제 책임 범위가 구체화됨
- [ ] `02 Knowledge Engine`/`03 Memory Engine`이 YAKB 또는
      `docs/ssot/`와 실제로 데이터를 공유해야 하는 지점이 발견됨(공유
      필요성이 확인되면 편입 쪽에 무게, 없으면 독립 쪽에 무게)
- [ ] `05 Prompt Library`에 실제 도메인(DreamTown, WishArt, Call To
      Wish)별 프롬프트가 3개 이상 축적되어 구조의 유용성이 검증됨
- [ ] `01 Constitution` 초안이 `설계구조-루미기획-충돌분석.md`와 실제로
      충돌하는지 검토가 끝남

## 7. 실제 구조 생성 전 검증해야 할 운영 항목

Step 5(파일럿 운영)에서 관찰할 항목, 그대로 인용:

- 어떤 질문이 반복되는가
- 어떤 응답이 만족도를 높였는가
- 어떤 기억이 실제 도움이 되었는가
- 어떤 기억은 오히려 방해가 되었는가
- 어떤 순간에 사용자가 행동으로 이어졌는가

매일 기록할 항목(Step 3):

- 오늘 가장 많이 받은 질문
- 가장 좋은 대화
- 가장 어려운 대화
- 기억했으면 좋았던 정보
- 기억하지 말았어야 했던 정보
- 반복적으로 수정한 답변
- 새롭게 발견한 패턴

## Phase 1 성공 기준 (원문 인용)

다음 질문에 답할 수 있으면 성공이다.

- Lumi는 어떤 원칙으로 판단하는가?
- 무엇을 기억하고 무엇을 잊는가?
- 어떤 아이디어를 Candidate로 남기는가?
- 실제 운영에서 반복되는 패턴은 무엇인가?
- 어떤 기능을 자동화해야 하는지가 명확해졌는가?

---

## 8. Phase 1.2 Update (2026-07-16)

이번 세션에서는 Lumi OS Phase 1의 목표를 변경하지 않고, 운영 기록
체계의 품질을 높이는 방향으로 개선했다. 새로운 Runtime, Engine,
Governance는 추가하지 않았다. Repository 구조 변경은 `highlight/`
폴더 추가만 허용했으며, 이는 Observation 이전 단계의 운영 메모를
관리하기 위한 최소한의 구조 변경이다. 실제 산출물은
`docs/lumi/operations/`에 있다.

### 8.1 운영 흐름 개선

기존 `Conversation → Observation → Evidence → Candidate`를 다음과 같이
개선했다:

```
Conversation
  ↓
Highlight
  ↓
Observation
  ↓
Evidence
  ↓
Candidate
  ↓
Review
  ↓
Constitution / SSOT
```

Highlight는 Observation 이전의 운영 메모이며, Observation은 Highlight를
분석하여 작성한다.

### 8.2 Highlight의 역할

Highlight는 운영 중 다시 검토할 가치가 있는 순간을 기록한다. 분석
문서가 아니라 Observation 생성을 위한 입력 데이터다. 다음 중 하나
이상에 해당하면 Highlight를 생성한다:

- 반복될 가능성이 보이는 경우
- 예상과 다른 사용자 반응
- 매우 효과적인 응답 방식
- 운영 정책에 영향을 줄 가능성
- 향후 재검토 가치가 있는 경우

### 8.3 Observation 생성 기준 강화

Observation은 Conversation을 직접 요약하지 않는다. 동일 유형의
Highlight가 충분히 축적된 이후 운영 관찰을 작성한다.

권장 기준:

- 동일 유형 Highlight 3~5개 이상
- 반복성 확인
- 운영 의미 확인

### 8.4 Knowledge Compression Principle

Phase 1에서는 운영 데이터의 양보다 의미의 압축을 우선한다.

```
Conversation   100
  ↓
Highlight      15~25
  ↓
Observation    5~10
  ↓
Evidence       2~5
  ↓
Candidate      0~2
```

이 비율은 운영 건강성을 점검하기 위한 참고 지표이며, 현재는 Candidate
수준의 운영 가설이다. 운영 경험을 통해 검증한 이후에만 표준으로
승격할 수 있다.

### 8.5 운영 철학 명확화

- Conversation은 기록이다.
- Highlight는 운영 메모이다.
- Observation은 운영 분석이다.
- Evidence는 운영 근거이다.
- Candidate는 운영 검증의 결과이다.

### 8.6 Next Validation (Phase 1.2)

파일럿 운영을 통해 다음을 확인한다:

1. Highlight 단계가 Observation 품질을 높이는가?
2. Knowledge Compression Ratio가 현실적인가?
3. Candidate 생성 수가 적절하게 유지되는가?
4. 운영 데이터를 기반으로 개발 우선순위를 도출할 수 있는가?

### 8.7 Session Conclusion

이번 Phase 1.2의 핵심 성과는 새로운 기능을 추가한 것이 아니라, 운영
데이터를 보다 체계적으로 압축하고 검증할 수 있는 흐름을 마련한
것이다. Project Phoenix는 데이터를 많이 저장하는 운영체계가 아니라,
운영 경험을 의미 있는 지식으로 성장시키는 운영체계를 지향한다.

## 9. Research Note (2026-07-16): Lumi OS와 Collective Intelligence 개념 구분

> 저장 위치 참고: 이 저장소에는 `docs/constitution/research/` 폴더나
> `RES-*` 문서 컨벤션이 아직 존재하지 않는다(확인 완료, 2026-07-16). 이
> 지시서는 그 경우 새 폴더를 만들지 않고 본 문서에 추가하도록 명시했으므로,
> 아래 내용은 별도 Research 문서를 만들지 않고 이 섹션에 직접 기록한다.
> 이 절은 Research 성격의 메모이며, CAND-OS-001의 Phase 1 범위·구조(§1~8)를
> 변경하지 않는다.

### 9.1 Core Distinction

```
Lumi OS
= 사고하고 운영하는 방법

Collective Intelligence
= 여러 운영 경험에서 공통 지식을 배우는 방법
```

Lumi OS는 다음을 정의한다:

- 판단 순서
- Truth Rule
- Knowledge Lifecycle
- Memory Policy
- 운영과 검증 원칙
- Observation, Evidence, Candidate의 처리 방식

Collective Intelligence는 다음을 다룰 수 있다(아직 미검증 개념):

- 여러 사용자의 Observation 비교
- 반복되는 공통 패턴 발견
- 상충하는 경험 분석
- 개인 경험에서 공통 지식 추출
- 운영 근거를 Phoenix Knowledge 후보로 성장시키는 과정

### 9.2 Layer Relationship

```
Lumi OS
  ↓
각 소원이와의 운영
  ↓
Conversation
  ↓
Highlight
  ↓
Observation
  ↓
Evidence
====================
Collective Intelligence 후보 영역 (검증 전 개념 모델)
  ↓
사용자 간 Evidence 비교
  ↓
공통 패턴과 반례 분석
  ↓
Collective Evidence
  ↓
Candidate
  ↓
Review
  ↓
Constitution / SSOT
```

구분선 아래의 Collective Intelligence 영역은 아직 공식 운영 흐름이
아니라 **검증 전 개념 모델**이다.

### 9.3 Privacy Boundary

집단지성은 개인 대화나 개인 기억을 공동 지식으로 복사하는 시스템이
아니다.

- 개인 대화 원문을 집단지성 자산으로 직접 승격하지 않는다.
- 개인을 식별할 수 있는 정보는 공통 지식에 포함하지 않는다.
- 사용자별 Memory는 분리한다.
- 공통 지식에는 비식별화된 패턴과 검증된 근거만 반영한다.
- 한 사람의 경험을 전체 사용자의 특성으로 일반화하지 않는다.

### 9.4 Key Difference Table

| 구분 | Lumi OS | Collective Intelligence |
|---|---|---|
| 핵심 질문 | 어떻게 사고하고 운영할 것인가? | 여러 경험에서 무엇을 배울 것인가? |
| 역할 | 사고·운영 체계 | 집단 학습 체계 후보 |
| 입력 | 질문, 지식, 기억, 운영 상황 | 다수의 Observation과 Evidence |
| 출력 | 판단, 응답, 운영 기록 | 공통 패턴, 반례, 집단 Evidence |
| 적용 범위 | 개별 대화와 전체 운영 | 여러 사용자 경험의 교차 분석 |
| 현재 상태 | Phase 1 운영 후보 체계 | Research 수준의 미검증 개념 |
| 승격 조건 | 기존 거버넌스에 따름 | 파일럿 운영 근거 축적 후 재검토 |

### 9.5 Important Clarification

Lumi OS와 Collective Intelligence는 경쟁하거나 대체하는 관계가 아니다.
Lumi OS가 집단지성을 처리하는 사고·운영 기준을 제공하고, 집단지성은
Lumi OS를 통해 수집된 다수의 검증된 운영 경험에서 공통 지식을 추출하는
관계이다.

### 9.6 Validation Required

집단지성 계층을 공식적으로 설계하기 전에 다음을 검증한다:

- 실제 사용자별 Observation이 충분히 축적되는가?
- 개인 패턴과 공통 패턴을 구분할 수 있는가?
- 반례와 사용자 차이를 함께 보존할 수 있는가?
- 비식별화 후에도 운영 가치가 유지되는가?
- Collective Evidence라는 별도 단계가 실제로 필요한가?
- 기존 Evidence와 Candidate 체계만으로 충분하지 않은가?

### 9.7 Current Decision

- Collective Intelligence Engine을 만들지 않는다.
- 새로운 최상위 계층이나 폴더를 만들지 않는다.
- 기존 Lumi OS 00~07 구조를 변경하지 않는다.
- 집단지성은 Research 수준의 개념으로만 기록한다(본 섹션).
- 약 100명의 파일럿 운영 후 실제 필요성을 다시 평가한다.
- 기존 Observation과 Evidence 체계를 먼저 운영한다.

### 9.8 Final Principle

```
Lumi OS는 사고와 운영의 기준이다.

Collective Intelligence는
다수의 검증된 경험에서
공통 지식을 발견하는 학습 개념이다.

개인의 기억은 분리하고,
공통 지식은 근거를 통해 성장시킨다.
```

---

## Validation Progress

```
Phase 1
■ Phase 1 운영 구조 정리
□ MVP Test
□ Hotel Pilot
□ Open Beta
□ User Interview
□ Operator Feedback
□ 파일럿 100명 대화 관찰 (Step 5)

Phase 1.1 / 1.2
■ Observation Template 개선
■ Evidence Template 개선
■ Weekly Review Template 구축
■ Highlight 단계 추가
■ Knowledge Compression 운영 가설 정의

아직 검증되지 않은 항목 (파일럿 운영에서 검증 예정)
□ Highlight 단계의 실제 효과
□ Knowledge Compression Ratio의 적절성
□ Observation 생성 기준(3~5 Highlight)의 타당성
```

## Promotion Criteria

- 파일럿 100명 대화 관찰이 완료되고, Phase 1 성공 기준 5개 질문에 실제
  데이터로 답할 수 있을 것
- §6의 저장소 위치 결정 조건 중 최소 2개 이상 충족
- §5에서 식별한 중복·충돌 가능성이 실제로 해소되었거나, 해소 불필요로
  판단될 것

## Evidence

(파일럿 운영 시작 전 — 아직 없음. 운영 기록이 축적되면 이 절에 실제
데이터 링크를 추가한다.)

## Last Review

2026-07-16 — Phase 1.2 Update (§8 반영: Highlight 단계 추가, Knowledge
Compression Principle 정의) + Research Note 추가 (§9: Lumi OS와
Collective Intelligence 개념 구분, Research 수준 미확정). 최초 작성도
2026-07-16.

## Next Review

파일럿 운영 데이터가 최초로 축적된 시점(예: 첫 10~20명 대화 관찰 후) —
§8.6 Next Validation 4개 항목을 그 시점에 확인한다.
