# DreamTown Current Sprint v1

Version: v1.1
Owner: Aurora5 / 루미
Status: Active
Purpose: 현재 스프린트 실행 문서 — 지금 해야 할 일만

Last Updated: 2026-03-12
Updated By: Code (Claude Code)

---

## 스프린트 목표

> **DreamTown Prototype을 실제로 동작하는 상태로 완성**

핵심 경험 흐름:

```
첫 방문:  Intro → Wish Gate → Star Birth → My Star
재방문:   앱 열기 → My Star (기본 진입 화면)
```

> CEO 확정 (2026-03-12): 재방문 기본 진입 화면 = My Star
> Today Message + 행동 버튼은 My Star 화면 안에 배치

---

## P0 — 반드시 이번 스프린트 완료

### 1. Wish Gate 입력 기능

**목적:** 사용자가 소원을 입력할 수 있어야 한다.

결과물:
- 텍스트 입력창
- "소원 보내기" 버튼
- 기본 validation

검증 기준:
```
소원 입력 → Star Birth 실행
```

---

### 2. Star Birth 애니메이션

**목적:** DreamTown 핵심 감정 장면 구현

연출 순서:
```
빛 등장
    ↓
아우룸 등장 (말 없음)
    ↓
빛 상승
    ↓
별 생성
```

검증 기준:
- 애니메이션 정상 실행
- 별 DB 생성 확인

---

### 3. My Star 화면

**목적:** DreamTown Core Action 구현

표시 정보:
```
별 이름
소원 원문
은하
탄생일
성장 단계 (Day N)
```

추가 배치 요소 (CEO 확정):
- Today Message (상단)
- 새 소원 남기기 버튼
- 은하 탐험 버튼

검증 기준:
```
Star Birth → My Star 이동 → 별 정보 표시
재방문 → 앱 열기 → My Star 바로 진입
```

---

## P1 — 가능하면 이번 스프린트

### 4. Today Message

**목적:** Daily Loop 형성 — 루틴 진입점

기능:
- 1일 1 메시지 (랜덤 위로 문장)
- My Star 화면 안에 배치

예시:
- "작은 소원도 별이 됩니다."
- "오늘도 괜찮습니다."
- "당신의 소원은 혼자가 아닙니다."

---

### 5. Galaxy Map Lite

**목적:** DreamTown 세계관 체험

표시 은하:
```
Growth Galaxy
Challenge Galaxy
Relationship Galaxy
Healing Galaxy
```

기능:
- 은하 선택
- 별 위치 표시 (기본)

---

## P2 — 다음 스프린트

### 6. Anonymous User System

**목적:** 로그인 없이 사용 가능

구조:
```
anonymous_id + local storage
```

---

### 7. Star Growth System

**목적:** 별 성장 구조 구현

초기 단계:
```
Day 1 → Day 7 → Day 30
```

---

## 스프린트 완료 기준

다음 흐름이 전체 동작하면 성공:

```
앱 실행
    ↓
Wish Gate (소원 입력)
    ↓
Star Birth (별 탄생)
    ↓
My Star (별 보기)
    ↓
앱 종료
    ↓
다시 방문
    ↓
My Star (재진입)   ← 핵심 검증 포인트
```

---

## 핵심 판단

```
지금 진짜 중요한 것은 2개:

Star Birth  — 감정 순간
My Star     — 돌아오는 공간

이 두 화면이 작동하면 DreamTown은 이미 제품이다.
```

---

## 참조

- Roadmap: `docs/design/DreamTown_Product_Roadmap_v1.md`
- My Star UX: `docs/design/DreamTown_My_Star_UX_Master_Design.md`
- Aurum System: `docs/design/DreamTown_Aurum_System_Design.md`
- Build Order: `docs/design/DreamTown_Build_Order_Design.md`
- Core Loop: `docs/ssot/DreamTown_Product_Core_Loop_SSOT.md`
