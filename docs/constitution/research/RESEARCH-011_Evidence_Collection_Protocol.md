---
code: RESEARCH-011
title: Evidence Collection Protocol
status: Research
category: Research
topic: 인터뷰 원자료 수집·저장 형식 표준화 (Observation/Evidence 생성 이전 단계)
related_research:
  - RESEARCH-010_Pilot_Study_EP01
  - RESEARCH-009_User_Validation_Protocol
verification_required: true
created: 2026-07-18
---

> `RESEARCH-009_User_Validation_Protocol`은 여전히 이 저장소에 존재하지
> 않는다(`RESEARCH-010`과 동일하게 미확인 의존성 — 2026-07-18 재확인).
> 다만 이번 문서(011)가 010을 뒷받침하는 후속 프로토콜이라는 점에서,
> 009 → 010 → 011로 이어지는 순번 기반 연구 계열이 이 저장소 밖에 이미
> 존재할 가능성이 높아졌다. 여전히 임의로 만들어 채우지 않는다.

---

# RESEARCH-011 — Evidence Collection Protocol

- Category: Research
- Status: Research
- Topic: 인터뷰 원자료 수집·저장 형식 표준화
- Related Research: RESEARCH-010_Pilot_Study_EP01, RESEARCH-009_User_Validation_Protocol (미확인)
- Verification Required: Yes

---

## 1. Purpose

이번 문서의 목적은 매우 단순하다.

좋은 인터뷰보다 좋은 데이터가 중요하다.

사람들의 이야기가 쌓여도 기록 방식이 제각각이면 나중에 비교할 수
없다. 그래서 모든 인터뷰를 동일한 형식으로 저장하는 기준을 만든다.

---

## 2. 수집 단위

인터뷰 1명 = Evidence 1개가 아니다.

인터뷰는 원자료(Raw Data)다.

예를 들어

```
Interview-001
참가자 A
```

이것은 아직 Observation도 Evidence도 아니다.

---

## 3. 인터뷰 저장 형식

모든 인터뷰는 동일한 메타데이터를 가진다.

| 항목 | 내용 |
|---|---|
| Interview ID | INT-001 |
| 날짜 | YYYY-MM-DD |
| EP | EP01 |
| 참가자 유형 | 여수 첫 방문 / 재방문 / 지역 주민 등 |
| 진행 방식 | 현장 / 온라인 / 영상 시청 |
| 소요 시간 | 예: 12분 |
| 진행자 | 연구자 |

### 반드시 분리해서 저장할 것

#### 1. Raw Quote

참가자가 실제로 말한 문장.

예)

> "등대를 보고 나니까 생각이 조금 정리됐어요."

수정하지 않는다.

#### 2. Research Memo

연구자의 메모.

예)

> 답변 전에 10초 정도 침묵함.

이것은 Quote와 절대 섞지 않는다.

#### 3. Coding (후속 작업)

반복되는 표현만 나중에 코딩한다.

예)

- "생각이 정리됐다"
- "숨이 쉬어졌다"
- "다시 시작하고 싶다"

이 단계에서도 해석은 최소화한다.

---

## 4. Observation 생성 기준

Observation은 반복성이 확인될 때만 생성한다.

예시

```
INT-001  생각이 정리됐다
INT-004  생각이 정리됐다
INT-007  머리가 맑아졌다
INT-009  생각이 정리되는 느낌
```

이처럼 유사한 표현이 반복될 때, 그때 비로소 Observation 후보가 된다.

---

## 5. Evidence 생성 기준

Evidence는 Observation을 뒷받침하는 근거다.

예를 들어,

**Observation:** 하멜등대에서 '생각이 정리됐다'는 반응이 반복된다.

**Evidence:**

- 인터뷰 4건의 원문
- 발생 빈도
- 참가자 특성
- 인터뷰 날짜

Evidence는 항상 원자료로 추적 가능해야 한다.

---

## 현재 거버넌스 상태

이 문서 역시 Research 단계다.

| 단계 | 상태 |
|---|---|
| Raw Interview | 수집 대상 |
| Observation | 아직 생성 안 함 |
| Evidence | 아직 생성 안 함 |
| Candidate | 생성 안 함 |
