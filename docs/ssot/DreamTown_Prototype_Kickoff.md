# DreamTown Prototype Kickoff — Code 실행 지시서

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown 3일 Prototype 개발 착수 기준 — Code 1페이지 지시서

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 목적

DreamTown 핵심 UX를 **실제로 동작**하도록 만드는 3일 Prototype.

```
소원 입력 (Wish Gate)
    ↓
별 생성 (Star Creation)
    ↓
내 별 페이지 (My Star Page)
    ↓
은하 미리보기 (Galaxy Preview)
```

---

## 개발 범위

### 포함 (3일 Prototype)

| # | 기능 |
|---|------|
| 1 | App Launch / Intro 화면 |
| 2 | Wish Gate (소원 입력 + 보석 선택) |
| 3 | Star Creation (별 생성 연출) |
| 4 | My Star Page |
| 5 | Galaxy Preview (은하 4개 목록) |

### 제외 (MVP v2 이후)

```
복잡한 은하 지도 / 항로 시스템 / 여행 기능
커뮤니티 상호작용 / 실시간 별자리 생성 / AI 별 추천
```

---

## 기술 스택

| 계층 | 기술 |
|------|------|
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Frontend | React + TailwindCSS + Framer Motion |

---

## Day별 개발 계획

### Day 1 — Backend

**Migration (P0):**
```sql
CREATE TABLE users ...
CREATE TABLE wishes ...
CREATE TABLE star_seeds ...
CREATE TABLE stars ...
CREATE TABLE galaxies ...  -- seed 데이터 포함
```

**API P0 구현:**
```
POST /api/wishes
POST /api/stars/create
GET  /api/stars/:id
GET  /api/galaxies
GET  /api/galaxies/:code
```

---

### Day 2 — Frontend

**화면 구현 (7개):**
```
App Launch → DreamTown Intro → Wish Gate → Star Birth Scene
→ My Star Page → Galaxy Exploration → Home
```

**Wish Gate 입력 요소:**
- 소원 텍스트 입력
- 보석 선택: Ruby / Sapphire / Emerald / Diamond / Citrine
- CTA: `[ Create My Star ]`

**Star Birth Scene 애니메이션 (Framer Motion):**
```
빛구슬 등장 → 아우룸 등장 → 거북 별자리 → 별 탄생
```

---

### Day 3 — 연결 + 검증

**API-Frontend 연결:**
```
Wish Gate → POST /api/wishes
Star Birth → POST /api/stars/create
My Star   → GET  /api/stars/:id
Galaxy    → GET  /api/galaxies
```

**완료 기준 (DoD):**
- [ ] 소원 입력 → 별 생성 동작
- [ ] My Star 페이지에 별 이름/소원/은하 표시
- [ ] Galaxy 화면에서 은하 4개 표시
- [ ] 대표 별 이야기 1개 이상 열람 가능

---

## 핵심 데이터 흐름

```
POST /api/wishes
    → wish 생성
    → POST /api/stars/create
        → star_seed 생성
        → galaxy 자동 분류 (gem_type 기준)
        → star 생성
    → GET /api/stars/:id
        → My Star Page 렌더링
```

### gem_type → galaxy 분류 기준 (초안)

| gem_type | galaxy |
|----------|--------|
| ruby | challenge |
| sapphire | growth |
| emerald | healing |
| diamond | growth |
| citrine | relationship |

---

## 비주얼 기준

```
배경: 밤하늘 + 바다 (Night Sky #0D1B2A)
포인트: Star Gold #FFD76A + Dream Purple #9B87F5
폰트: 둥글고 따뜻한 계열
카드: 둥근 모서리 + 부드러운 그림자
```

> 상세: `docs/ssot/DreamTown_Visual_Style_SSOT.md`

---

## 참조 문서 (Code 필독)

| 문서 | 경로 |
|------|------|
| MVP 범위 | `docs/design/DreamTown_MVP_Scope_Design.md` |
| DB 스키마 | `docs/design/DreamTown_DB_Schema_Design.md` |
| ERD 요약 | `docs/design/DreamTown_ERD_Summary_Design.md` |
| API 스펙 | `docs/design/DreamTown_API_Spec_Design.md` |
| 화면 구조 | `docs/design/DreamTown_Frontend_Screen_Map_Design.md` |
| 비주얼 | `docs/ssot/DreamTown_Visual_Style_SSOT.md` |
| 별 탄생 정책 | `docs/design/DreamTown_Star_Birth_Policy_Design.md` |
