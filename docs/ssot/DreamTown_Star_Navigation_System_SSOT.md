# DreamTown Star Navigation System SSOT

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown 별 항해 시스템 — 앱 UX + 커뮤니티 + 게임화 구조의 핵심 기준

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 시스템 목적

소원이들이 DreamTown 우주를 **자연스럽게 탐험하도록 만드는 시스템**.

핵심 흐름:

```
소원
    ↓
별 생성
    ↓
별 성장
    ↓
별자리 발견
    ↓
은하 탐험
```

---

## Step 1 — Wish Gate (소원 입장)

소원이가 소원을 입력하고 별씨앗이 생성되는 단계.

```
소원 입력
    ↓
보석 선택
    ↓
소원그림 생성
    ↓
별씨앗 생성
```

### 보석 5종 (Gem Type)

| 보석 | 의미 | 색상 |
|------|------|------|
| Ruby (루비) | 열정 | 레드 |
| Sapphire (사파이어) | 지혜 | 블루 |
| Emerald (에메랄드) | 치유 | 그린 |
| Diamond (다이아몬드) | 결단 | 화이트 |
| Citrine (시트린) | 긍정 | 골드 |

보석 선택 → 소원의 성격을 분류하는 첫 번째 신호.

---

## Step 2 — Star Birth (별 탄생)

소원이 별이 되는 핵심 장면.

```
여수 밤바다
    ↓
빛구슬 (소원)
    ↓
아우룸 등장
    ↓
StarLink (Aurora Path)
    ↓
별 생성
```

> 연출 세부: `docs/design/DreamTown_Opening_Cinematic_Design.md`
> 별 탄생 정책: `docs/design/DreamTown_Star_Birth_Policy_Design.md`

---

## Step 3 — First Voyage (첫 항해)

별이 생성되면 소원이는 첫 항해를 시작한다.

### 항해 로그 구조

| 항목 | 내용 |
|------|------|
| 감정 | 지금 이 순간의 감정 |
| 도움 | 나에게 도움이 된 것 |
| 성장 | 오늘 조금 더 또렷해진 것 |

### 항해 로그 예시

```
감정 — 숨이 놓였어요
도움 — 위로
성장 — 조금 또렷해졌어요
```

---

## Step 4 — Constellation Discovery (별자리 발견)

비슷한 항해가 모이면 별자리가 발견된다.

사용자가 별자리를 **발견하는** 경험 — 발견의 감동이 중요.

```
내 별
    ↓
비슷한 여정의 별 발견
    ↓
별자리 연결 제안
    ↓
별자리 탄생
```

> 별자리 운영 상세: `docs/design/DreamTown_Constellation_System_Design.md`

---

## Step 5 — Galaxy Exploration (은하 탐험)

사용자가 DreamTown 하늘 전체를 탐험한다.

```
내 별자리
    ↓
은하 진입 (Healing Galaxy 등)
    ↓
다른 별자리 탐험
    ↓
다른 소원이의 별 이야기 발견
```

### Navigation UI — DreamTown Compass

```
          North — 도전 은하 (Challenge)
               ↑
West — 관계  ←  →  East — 성장
               ↓
          South — 치유 은하 (Healing)
```

---

## Star Growth (별 성장 시스템)

별은 항해 기록과 함께 성장한다.

### 성장 단계

| 단계 | 기준 | 의미 |
|------|------|------|
| Day 1 | 별 탄생 | 빛구슬 → 별 |
| Day 7 | 1주 항해 완주 | 첫 별 성장 |
| Day 30 | 한 달 기록 | 별자리 연결 가능 |
| Day 100 | 100일 항해 | 은하 이름 부여 |
| Day 365 | 1년 항해 | 소망이 인증 |

이 기록은 별 페이지에 영구 저장된다.

---

## DreamTown 탐험 루프

DreamTown의 핵심 순환 구조:

```
소원 생성
    ↓
별 생성 (Star Birth)
    ↓
항해 기록 (Voyage Log)
    ↓
별자리 발견
    ↓
은하 탐험
    ↓
다른 별 이야기 발견
    ↓
새로운 소원 (루프 재시작)
```

---

## DreamTown Trinity IP

DreamTown의 핵심 IP 3요소:

```
여수 바다
+
황금 거북 별자리 (Golden Turtle Constellation)
+
아우룸
```

이 3요소가 **DreamTown Trinity IP**다.

- **여수 바다** — 현실 지형 기반 세계관의 뿌리
- **황금 거북 별자리** — 바다와 하늘을 잇는 신화 상징
- **아우룸** — 소원 전달자, 브랜드 캐릭터

---

## 전략 포지셔닝

| 요소 | 역할 |
|------|------|
| 디즈니 | 세계관 — 몰입형 우주 이야기 |
| 포켓몬 | 탐험 시스템 — 별자리/은하 발견 게임화 |
| 여행 플랫폼 | 현실 연결 — 여수 지형 기반 체험 |

---

## 다음 설계 예정

**DreamTown World Map** — 여수 실제 지도 + 우주 지도 결합

현실 지도 + 우주 지도가 결합된 구조.

```
여수 현실 지도 (Golden Turtle Field)
    +
DreamTown 우주 지도 (Galaxy Compass)
    =
DreamTown World Map
```

---

## 참조

- Galaxy 지도: `docs/ssot/DreamTown_Galaxy_Map_SSOT.md`
- Cosmic 구조: `docs/ssot/DreamTown_Cosmic_Map_SSOT.md`
- 별 탄생 정책: `docs/design/DreamTown_Star_Birth_Policy_Design.md`
- 별자리 시스템: `docs/design/DreamTown_Constellation_System_Design.md`
- 아우룸 UX: `docs/design/DreamTown_Aurum_UX_Design.md`
- 핵심 철학: `docs/ssot/DreamTown_Core_Philosophy_SSOT.md`
