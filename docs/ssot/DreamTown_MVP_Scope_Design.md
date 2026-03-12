# DreamTown MVP Scope Design

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown MVP 개발 범위 기준 — Code 실행 문서

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 1. MVP 목표

> **사용자가 소원을 별로 만들고 DreamTown 우주 탐험이 시작된다는 경험을 제공하는 것**

### 핵심 경험 흐름

```
세계관 경험 (Intro)
    ↓
소원 입력 (Wish Gate)
    ↓
별 생성 (Star Creation)
    ↓
내 별 확인 (My Star Page)
    ↓
은하 탐험 시작 (Lite Galaxy Exploration)
```

---

## 2. MVP 핵심 기능 (필수 5종)

### ① DreamTown Intro

앱 시작 시 세계관 장면 — 최초 1회 자동 재생.

```
DreamTown 로고
    ↓
여수 밤바다
    ↓
빛구슬
    ↓
아우룸 등장
    ↓
별 탄생
```

목적: 사용자가 DreamTown 세계관을 느끼도록 함.

> 연출 세부: `docs/design/DreamTown_Opening_Cinematic_Design.md`

---

### ② Wish Gate

사용자가 소원을 입력하는 진입 화면.

| 기능 | 설명 |
|------|------|
| 소원 입력 | 텍스트 소원 작성 |
| 보석 선택 | Ruby / Sapphire / Emerald / Diamond / Citrine |
| 여수 테마 선택 | 배경 설정 |
| 소원그림 생성 | AI (DALL-E 3) 소원 이미지 생성 |

출력: **Star Seed 생성**

---

### ③ Star Creation

소원이 별이 되는 핵심 연출.

```
빛구슬
    ↓
아우룸 등장
    ↓
거북 별자리 (Golden Turtle Constellation)
    ↓
별 생성
```

출력: **Personal Star 생성**

---

### ④ My Star Page

사용자의 별 페이지.

| 구성 요소 | 내용 |
|----------|------|
| 별 이름 | 사용자 지정 + 아우룸 축복 (B+C) |
| 소원 내용 | 텍스트 + 소원그림 |
| 생성 날짜 | 별 탄생일 |
| 성장 단계 | Day 1 / 7 / 30 / 100 / 365 |

### 성장 단계

```
Day 1   → 별 탄생
Day 7   → 첫 별자리 연결 가능
Day 30  → 은하 탐험 해금
Day 100 → 은하 이름 부여
Day 365 → 소망이 인증
```

---

### ⑤ Lite Galaxy Exploration

사용자가 DreamTown 은하를 탐험하는 커뮤니티 기능 (MVP 경량 버전).

**은하 구조:**

| 은하 | 방향 |
|------|------|
| Challenge Galaxy | 북쪽 |
| Growth Galaxy | 동쪽 |
| Relationship Galaxy | 서쪽 |
| Healing Galaxy | 남쪽 |

**각 은하 구성:**
- 대표 별자리 1개
- 대표 별 이야기 3~5개
- 내 별이 속한 은하 표시

---

## 3. MVP 제외 기능 (v2 이후)

```
실시간 별자리 생성
사용자 별 자동 분류
복잡한 은하 지도
항로 시스템
AI 별 추천
DreamTown Travel 탭
```

---

## 4. 앱 탭 구조 (MVP)

```
Home     — 광장 (오늘의 별 탄생, 21:00 Night Event)
Wish     — Wish Gate
Galaxy   — Lite Galaxy Exploration
My Star  — My Star Page
```

Travel 탭은 v2에서 추가.

---

## 5. 핵심 UX 루프

```
세계관 경험 (Intro)
    ↓
소원 생성 (Wish Gate)
    ↓
별 생성 (Star Creation)
    ↓
내 별 확인 (My Star Page)
    ↓
은하 탐험 (Galaxy)
    ↓
다른 별 이야기 발견
    ↓
(루프 재시작)
```

---

## 6. 기술 구현 최소 구조

```
users
wishes
stars
galaxies
constellations
star_logs
```

> DB 상세 설계: DreamTown DB Schema (다음 단계)

---

## 7. 완료 기준 (Definition of Done)

MVP 완료 조건:

- [ ] 사용자가 소원을 입력할 수 있다
- [ ] 소원이 별로 생성된다
- [ ] My Star 페이지가 생성된다
- [ ] Galaxy 화면에서 은하 4개가 보인다
- [ ] 대표 별 이야기를 볼 수 있다

---

## 다음 단계

**DreamTown DB Schema** — 개발용 데이터베이스 구조 상세 설계

```
users / wishes / stars / galaxies / constellations / star_logs
```

이 문서 완성 시 서버 구조 설계 시작 가능.

---

## 참조

- 제품 구조: `docs/design/DreamTown_Product_Architecture_Design.md`
- 별 항해 시스템: `docs/ssot/DreamTown_Star_Navigation_System_SSOT.md`
- Galaxy 지도: `docs/ssot/DreamTown_Galaxy_Map_SSOT.md`
- 별 탄생 정책: `docs/design/DreamTown_Star_Birth_Policy_Design.md`
- 파이프라인: `docs/design/DreamTown_Pipeline_Design.md`
- 아우룸 UX: `docs/design/DreamTown_Aurum_UX_Design.md`
