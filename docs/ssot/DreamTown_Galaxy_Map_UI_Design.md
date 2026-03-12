# DreamTown Galaxy Map UI Design v1

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: 앱 표시용 은하 지도 UX/UI 기준 — 프론트 개발 / 데모 / 시드 데이터 표시 방식

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 1. 지도 목적

> **사용자가 "내 별이 DreamTown 우주 안에 존재한다"는 감각을 느끼게 하는 것**

단순 목록이 아니라 **소원 → 별 → 우주 연결감**을 보여주는 화면.

---

## 2. MVP 지도 구조

4개 은하 카드형 지도 (Compass 배치).

```
           North
    [Challenge Galaxy]

West                      East
[Relationship Galaxy]    [Growth Galaxy]

           South
    [Healing Galaxy]
```

| 방향 | 은하 | 의미 |
|------|------|------|
| 북 (North) | Challenge Galaxy | 도전, 재시작 |
| 동 (East)  | Growth Galaxy    | 성장, 첫걸음 |
| 서 (West)  | Relationship Galaxy | 연결, 관계 |
| 남 (South) | Healing Galaxy   | 회복, 안정 |

---

## 3. 화면 구성

### 상단

```
DreamTown Galaxy Map
Your star is now shining in Growth Galaxy.
```

### 중앙: 은하 카드 4개

각 카드 구성:

```
[은하 이름]
짧은 설명 (1줄)
대표 별자리: xxx Constellation
대표 별: xxx Star
```

예시:

```
Growth Galaxy
새로운 시작과 성장을 담은 은하
대표 별자리: New Beginning Constellation
대표 별: First Wish Star
```

### 하단

```
[ Explore My Star ]    [ Back to My Star ]
```

---

## 4. 은하별 표시 데이터

### Challenge Galaxy

| 항목 | 값 |
|------|-----|
| 의미 | 도전, 재시작 |
| 대표 별자리 | Brave Path Constellation |
| 대표 별 | Courage Star |
| 소원 | "한 번 더 도전해보고 싶어요" |

### Growth Galaxy

| 항목 | 값 |
|------|-----|
| 의미 | 성장, 첫걸음 |
| 대표 별자리 | New Beginning Constellation |
| 대표 별 | First Wish Star |
| 소원 | "조금 더 나아지기를" |

### Healing Galaxy

| 항목 | 값 |
|------|-----|
| 의미 | 회복, 안정 |
| 대표 별자리 | Quiet Heart Constellation |
| 대표 별 | Healing Star |
| 소원 | "마음이 조금 편해지기를" |

### Relationship Galaxy

| 항목 | 값 |
|------|-----|
| 의미 | 연결, 사랑, 관계 |
| 대표 별자리 | (비워둠) |
| 대표 별 | (비워둠 — 첫 사용자의 별을 기다림) |

> **"첫 사용자 별이 Relationship Galaxy의 첫 별이 될 수 있다"**
> 이 감각이 강력한 UX 장치.

---

## 5. 인터랙션 규칙

### 은하 카드 클릭

- 해당 은하 상세 패널 열기
- 대표 별자리 표시
- 대표 별 이야기 1~3개 표시

### 내 별이 있는 은하 강조

- 밝게 강조
- 작은 빛 효과
- "Your Star" 배지 표시

---

## 6. 내 별 표시 방식

사용자가 별 생성 후 Galaxy Map 진입 시:

```
Growth Galaxy ✨
Your Star: 새로운 시작의 별
```

Relationship Galaxy에 첫 별을 만든 경우:

```
Relationship Galaxy ✨
Your Star has become the first light of this galaxy.
```

---

## 7. 디자인 톤 & 컬러

| 요소 | 스타일 |
|------|--------|
| 배경 | 어두운 밤하늘 (#0D1B2A) |
| 별빛 | 부드러운 반짝임 |
| 그라데이션 | 파란색 / 보라색 계열 |

### 은하별 강조 컬러

| 은하 | 컬러 |
|------|------|
| Challenge | 깊은 남보라 |
| Growth | 푸른 청록 |
| Relationship | 부드러운 분홍보라 |
| Healing | 잔잔한 민트블루 |

---

## 8. 프론트 컴포넌트 구조 (React)

```
GalaxyMapPage
 ├─ GalaxyCompass          — 4개 은하 Compass 배치
 ├─ GalaxyCard             — 개별 은하 카드
 ├─ GalaxyDetailPanel      — 클릭 시 상세 패널
 └─ MyStarIndicator        — 내 별 위치 표시
```

---

## 9. 데모용 화면 예시 (전체)

```
DreamTown Galaxy Map

Your star is now shining in Growth Galaxy.

┌─────────────────────────────┐
│     [Challenge Galaxy]      │
│     다시 도전하는 용기의 은하    │
│     대표 별: Courage Star     │
└─────────────────────────────┘

┌──────────────────┐  ┌──────────────────────┐
│ [Relationship    │  │   [Growth Galaxy] ✨  │
│  Galaxy]         │  │   새로운 시작과 성장    │
│  첫 별을 기다리는  │  │   대표 별: First Wish  │
│  은하            │  │   내 별: 새로운 시작의 별│
└──────────────────┘  └──────────────────────┘

┌─────────────────────────────┐
│     [Healing Galaxy]        │
│     마음이 쉬어가는 회복의 은하  │
│     대표 별: Healing Star     │
└─────────────────────────────┘

[ Explore My Star ]   [ Back to My Star ]
```

---

## 10. API 연결

| 화면 | API |
|------|-----|
| 은하 목록 | `GET /api/dt/galaxies` |
| 은하 상세 | `GET /api/dt/galaxies/:code` |
| 내 별 위치 | `GET /api/dt/stars/:id` → galaxy.code 참조 |

---

## 11. 루미 최종 판단

이 Galaxy Map이 들어가면 DreamTown은
**소원 입력 앱**이 아니라

> **별을 탐험하는 세계관형 제품**

으로 보이게 된다.

---

## 참조

- Founding Stars: `docs/design/DreamTown_Founding_Stars_Canon_Design.md`
- Frontend Screen Map: `docs/design/DreamTown_Frontend_Screen_Map_Design.md`
- Galaxy Map SSOT: `docs/ssot/DreamTown_Galaxy_Map_SSOT.md`
- Visual Style: `docs/ssot/DreamTown_Visual_Style_SSOT.md`
