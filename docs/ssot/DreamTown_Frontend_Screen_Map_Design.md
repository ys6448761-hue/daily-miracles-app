# DreamTown Frontend Screen Map Design

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown MVP 앱 화면 구조 — 디자인/프론트엔드/UX 기준 지도

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 전체 화면 흐름

```
App Launch
    ↓
DreamTown Intro (세계관 소개)
    ↓
Wish Gate (소원 입력)
    ↓
Star Birth Scene (별 탄생 연출)
    ↓
My Star Page (내 별 확인)
    ↓
Galaxy Exploration (은하 탐험)
```

---

## MVP 7개 화면

### Screen 1 — App Launch

앱 첫 진입 스플래시 화면.

| 구성 요소 | 내용 |
|----------|------|
| 배경 | 여수 밤바다 |
| 상징 | 거북 별자리 + 떠오르는 별 |
| 로고 | DreamTown Logo |
| 텍스트 | "여수 바다에서 시작된 하늘." |
| CTA | `[ Enter DreamTown ]` |

---

### Screen 2 — DreamTown Intro

세계관 소개 3장면 (스킵 가능 — 5초 후).

| 장면 | 텍스트 |
|------|--------|
| Scene 1 | 소원은 바다에서 태어납니다 |
| Scene 2 | 아우룸이 소원을 안내합니다 |
| Scene 3 | 소원은 별이 됩니다 |

CTA: `[ Start My Wish ]`

> 연출 상세: `docs/design/DreamTown_Opening_Cinematic_Design.md`

---

### Screen 3 — Wish Gate

소원 입력 화면.

| 입력 요소 | 옵션 |
|----------|------|
| 소원 텍스트 | 자유 입력 |
| 보석 선택 | Ruby / Sapphire / Emerald / Diamond / Citrine |
| 여수 테마 선택 | night_sea / hyangiram / odongdo / dolsan_bridge |

CTA: `[ Create My Star ]`

API: `POST /api/wishes`

---

### Screen 4 — Star Birth Scene

소원이 별이 되는 핵심 연출 화면.

```
빛구슬 등장
    ↓
아우룸 등장
    ↓
거북 별자리
    ↓
별 탄생
```

텍스트: "당신의 소원이 별이 되었습니다."

CTA: `[ View My Star ]`

API: `POST /api/stars/create`

---

### Screen 5 — My Star Page

사용자의 별 페이지.

| 구성 요소 | 내용 |
|----------|------|
| 별 이름 | 사용자 지정 + 아우룸 축복 |
| 소원 내용 | 텍스트 + 소원그림 |
| 별 생성 날짜 | 별 탄생일 |
| 성장 단계 | Day 1 / 7 / 30 / 100 / 365 |
| 소속 은하 | galaxy 코드 + 이름 |
| 소속 별자리 | constellation 이름 (nullable) |

CTA: `[ Explore Galaxy ]`

API: `GET /api/stars/:id`

---

### Screen 6 — Galaxy Exploration

DreamTown 은하 탐험 화면.

| 구성 요소 | 내용 |
|----------|------|
| 은하 지도 | DreamTown Compass (북/동/서/남) |
| 은하 목록 | Challenge / Growth / Relationship / Healing |
| 각 은하 | 대표 별자리 1개 + 대표 별 이야기 3~5개 |

API: `GET /api/galaxies` / `GET /api/galaxies/:code`

---

### Screen 7 — Home

메인 홈 화면.

| 구성 요소 | 내용 |
|----------|------|
| 내 별 미리보기 | 오늘의 별 상태 |
| 오늘의 메시지 | Aurora5 안내 메시지 |
| 추천 별 이야기 | Galaxy Exploration 진입 유도 |

---

## 앱 하단 탭 구조

```
Home  |  Wish  |  Galaxy  |  My Star
```

Travel 탭은 v2에서 추가.

---

## 화면별 API 매핑

| 화면 | API |
|------|-----|
| Wish Gate | POST /api/wishes, POST /api/wish-image/generate |
| Star Birth | POST /api/stars/create |
| My Star | GET /api/stars/:id, GET /api/stars/:id/growth |
| Galaxy | GET /api/galaxies, GET /api/galaxies/:code |
| Home | GET /api/my-star/:user_id |

---

## 비주얼 스타일 원칙

```
2D hand-drawn / Ghibli + 한국 웹툰 혼합
둥근 카드 / 부드러운 그림자 / 큰 여백
배경: 밤하늘 + 바다
색상: Dream Purple #9B87F5 + Star Gold #FFD76A + Ocean Blue #2E5BFF
```

> 상세: `docs/ssot/DreamTown_Visual_Style_SSOT.md`

---

## 참조

- API 스펙: `docs/design/DreamTown_API_Spec_Design.md`
- MVP 범위: `docs/design/DreamTown_MVP_Scope_Design.md`
- 아우룸 UX: `docs/design/DreamTown_Aurum_UX_Design.md`
- 비주얼 스타일: `docs/ssot/DreamTown_Visual_Style_SSOT.md`
- 시네마틱 연출: `docs/design/DreamTown_Opening_Cinematic_Design.md`
