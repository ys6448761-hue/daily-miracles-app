# DreamTown Product Core Loop SSOT

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown 제품 핵심 반복 구조 — 제품 성장 엔진 정의

Last Updated: 2026-03-12
Updated By: Code (Claude Code)

---

## 핵심 선언

> **DreamTown은 소원을 별로 남기고 다시 그 별을 보러 돌아오는 루틴형 위로 서비스이다.**

---

## 1. Core Loop 구조

```
소원 (Wish)
    ↓
별 탄생 (Star Birth)
    ↓
내 별 (My Star)
    ↓
다시 보기 (Return)
    ↓
새 소원 (New Wish)
    ↓
(반복)
```

이 반복이 DreamTown 제품의 **성장 엔진**이다.

---

## 2. 감정 흐름

DreamTown은 콘텐츠 소비 서비스가 아니다.
**사용자의 마음을 작은 별로 남기는 서비스**이다.

```
마음의 생각
    ↓
소원
    ↓
빛
    ↓
별
    ↓
시간 경과
    ↓
다시 바라보기
    ↓
(반복)
```

---

## 3. Loop 단계별 설명

### 1단계 — Wish (소원)

사용자는 자신의 마음 속 작은 바람을 입력한다.

예시:
- "조금 더 나아지기를"
- "마음이 조금 편해지기를"
- "다시 시작할 용기를 얻기를"

소원은 DreamTown 경험의 **출발점**이다.

---

### 2단계 — Star Birth (별 탄생)

```
소원 → 빛 → 아우룸 → 별
```

이 장면은 DreamTown의 **첫 감정 경험**이다.

> 상세: `docs/design/DreamTown_Star_Birth_Policy_Design.md`

---

### 3단계 — My Star (내 별)

사용자는 자신의 별을 보게 된다.

표시 요소:
| 요소 | 내용 |
|------|------|
| 별 이름 | 소원 기반 명명 |
| 소원 원문 | 처음 남긴 소원 |
| 은하 | 소속 은하 |
| 성장 단계 | Day N |

My Star는 DreamTown의 **중심 공간**이다.

> 상세: `docs/design/DreamTown_My_Star_UX_Master_Design.md`

---

### 4단계 — Return (다시 보기)

시간이 흐른 뒤 사용자는 다시 DreamTown을 연다.

```
앱 열기 → 내 별 보기
```

이 순간 DreamTown은 **위로 서비스**가 된다.

> 이 순간이 Key Moment: `docs/ssot/DreamTown_Key_Moment_SSOT.md`

---

### 5단계 — New Wish (새 소원)

사용자는 때때로 새로운 소원을 남긴다.

```
새 소원 → 새 별
```

이렇게 DreamTown의 별이 늘어난다.

---

## 4. Core Loop 특징

| 특징 | 설명 |
|------|------|
| 강요 없음 | 소원 입력은 선택이다 |
| 조용한 반복 | 매일 강한 행동 불필요 |
| 감정 중심 | 기능보다 감정 경험 우선 |

---

## 5. Daily Loop (일상 반복)

Daily Loop는 Core Loop의 작은 반복이다.

```
앱 열기
    ↓
내 별 보기
    ↓
짧은 위로 메시지
    ↓
종료
```

부담 없이 매일 반복된다. 30초~1분으로 충분하다.

---

## 6. DreamTown 성장 구조

Core Loop가 반복되면:

```
별 증가
    ↓
별 성장 (에너지 축적)
    ↓
은하 형성
    ↓
세계관 확장
```

DreamTown 세계관은 **사용자 별로 성장**한다.

---

## 7. 루프 확장 구조

현재 v1은 **개인 루프**이다.

```
개인 루프 (v1)
소원 → 별 → 다시 보기
```

이후 확장:

```
세계관 루프 (v2)
별 → 별자리 → 은하
```

세계관 루프가 생기면 DreamTown은 **앱 → 세계관 플랫폼**으로 성장한다.

---

## 8. DreamTown 핵심 구조 요약

```
Core Emotion     위로
Core Experience  별 탄생
Core Action      내 별 보기
Key Moment       내 별 다시 보기
Core Loop        소원 → 별 → 다시 보기
```

이 5개가 맞물리면 제품 방향은 흔들리지 않는다.

---

## 참조

- Core Action: `docs/ssot/DreamTown_Core_Action_SSOT.md`
- Key Moment: `docs/ssot/DreamTown_Key_Moment_SSOT.md`
- My Star UX: `docs/design/DreamTown_My_Star_UX_Master_Design.md`
- 핵심 철학: `docs/ssot/DreamTown_Core_Philosophy_SSOT.md`
- 별 탄생 정책: `docs/design/DreamTown_Star_Birth_Policy_Design.md`
