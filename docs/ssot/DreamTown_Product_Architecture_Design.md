# DreamTown Product Architecture Design

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: 세계관 → 앱 기능 → 사용자 경험 연결 구조 — DreamTown 제품 설계 기준

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 핵심 원칙

```
세계관 → 앱 기능 → 사용자 경험
```

DreamTown을 실제 앱/서비스/플랫폼으로 구현하는 제품 구조 기준.

---

## 앱 5대 영역

```
1. Wish Gate        — 입장
2. Star Creation    — 별 생성
3. Galaxy Exploration — 탐험
4. Star Growth      — 성장
5. DreamTown Travel — 현실 연결
```

---

## 1. Wish Gate (소원 입장)

사용자가 DreamTown에 들어오는 입구.

### 기능

| 기능 | 설명 |
|------|------|
| 소원 입력 | 텍스트로 소원 작성 |
| 보석 선택 | Ruby/Sapphire/Emerald/Diamond/Citrine — 소원 성격 분류 |
| 소원그림 생성 | AI (DALL-E 3) 소원 이미지 생성 |
| 포스트카드 생성 | 소원그림 기반 공유용 카드 |

### 출력

```
별씨앗 (Star Seed) 생성
```

---

## 2. Star Creation (별 생성)

소원이 별이 되는 단계.

```
Wish (소원 입력)
    ↓
Star Seed (별씨앗 생성)
    ↓
Star Birth Scene (별 탄생 연출)
    ↓
Personal Star Page (개인 별 페이지 생성)
```

### Personal Star Page 구성

- 별 이름 (사용자 지정 + 아우룸 축복 — B+C)
- 소원 내용
- 소원그림
- 항해 로그
- 나눔 반응 (기적나눔✨ / 지혜나눔🧠 / 감사나눔🙏)

---

## 3. Galaxy Exploration (은하 탐험)

사용자가 DreamTown 우주를 탐험하는 커뮤니티 기능.

```
내 별자리 진입
    ↓
은하 탐험 (DreamTown Compass 기준)
    ↓
다른 별자리 발견
    ↓
다른 소원이의 별 이야기 발견
    ↓
나눔 반응 (✨🧠🙏)
```

### 탐험 예시

```
치유 은하 (South)
    ↓
마음 회복 별자리
    ↓
별 이야기 열람
```

---

## 4. Star Growth (별 성장 — 리텐션)

별은 시간이 지나며 성장한다. 사용자 리텐션 시스템.

| 단계 | 기준 | 이벤트 |
|------|------|--------|
| Day 1 | 별 탄생 | 별 페이지 생성 |
| Day 7 | 1주 항해 | 첫 별자리 연결 가능 |
| Day 30 | 한 달 기록 | 은하 탐험 해금 |
| Day 100 | 100일 항해 | 은하 이름 부여 |
| Day 365 | 1년 항해 | 소망이 인증 |

항해 로그 구조 (매일):

```
감정 — 지금 이 순간의 감정
도움 — 나에게 도움이 된 것
성장 — 오늘 조금 더 또렷해진 것
```

---

## 5. DreamTown Travel (현실 연결)

현실 여행과 DreamTown 세계관 연결. 여수 파일럿 기준.

```
여수 여행
    ↓
Wish Harbor (오동도) 방문
    ↓
Star Birth Spot (향일암) 체험
    ↓
소원 입력 (앱 or 오프라인)
    ↓
별 생성
```

### 현실 체험 × 세계관 매핑

| 현실 여행 | 세계관 의미 |
|---------|-----------|
| 여수 밤바다 | Star Birth Scene |
| 케이블카 | Sky Journey |
| 유람선 | Ocean Voyage |
| 향일암 | Wish Gate |
| 소원엽서 | 오프라인 소원 → 용궁 저장 |

---

## 앱 탭 구조

```
Home     — 광장 (오늘의 별 탄생, Night Event)
Wish     — Wish Gate (소원 입력)
Galaxy   — 은하 탐험
My Star  — 내 별 + 항해 로그
Travel   — 현실 연결 (여수 지도)
```

---

## 사용자 핵심 루프

```
소원 생성
    ↓
별 생성 (Star Birth)
    ↓
별 성장 (Voyage Log)
    ↓
은하 탐험
    ↓
새로운 소원 (루프 재시작)
```

---

## 제품 로드맵

```
세계관 설계    ✅ 완료
제품 구조      ← 현재
UX 설계
개발
```

---

## 다음 단계 예정

**DreamTown App UX Map** — 실제 화면 구조

앱 개발로 이어지는 화면별 UX 설계.

---

## 참조

- 핵심 철학: `docs/ssot/DreamTown_Core_Philosophy_SSOT.md`
- 별 항해 시스템: `docs/ssot/DreamTown_Star_Navigation_System_SSOT.md`
- 별 탄생 정책: `docs/design/DreamTown_Star_Birth_Policy_Design.md`
- 통합 파이프라인: `docs/design/DreamTown_Pipeline_Design.md`
- 여수 파일럿: `docs/design/DreamTown_Yeosu_Pilot_Design.md`
- 아우룸 UX: `docs/design/DreamTown_Aurum_UX_Design.md`
- 세계 지도: `docs/ssot/DreamTown_World_Map_SSOT.md`
