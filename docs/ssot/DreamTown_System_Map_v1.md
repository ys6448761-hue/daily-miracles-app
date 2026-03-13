# DreamTown System Map v1

Version: v1.0
Owner: Aurora5 / Code
Status: Confirmed
Purpose: SSOT → API → DB → UI 연결 관계를 한 장의 구조로 정리

Last Updated: 2026-03-13
Updated By: Code (Claude Code)

---

## 구현 상태 범례

```
✓  Implemented   — SSOT + API + DB + UI 모두 연결 완료
△  Partial       — 일부만 구현
✗  SSOT only     — 문서만 존재, 코드 없음
```

---

## 전체 흐름 다이어그램

```
User (브라우저)
  ↓
AppLaunch → DreamTownIntro
  ↓
Wish Gate (소원 입력 + 보석 선택)
  ↓  POST /api/dt/wishes
dt_wishes (PostgreSQL)
  ↓  POST /api/dt/stars/create
dt_star_seeds → dt_stars
  ↓  navigate('/star-birth')
Star Birth Animation
  ↓  GET /api/dt/stars/:id
My Star Screen
  ↓  GET /api/dt/galaxies + /api/dt/galaxies/:code
Galaxy Screen
```

---

## 시스템 1 — Wish System

**Status: ✓ Implemented**

```
SSOT       DreamTown_Wish_System_SSOT.md
           DreamTown_Star_Birth_Policy_Design.md

API        POST /api/dt/wishes
           Body: { user_id, wish_text, gem_type, yeosu_theme }
           Response: { wish_id, status }

DB         dt_wishes
           ├── id (UUID PK)
           ├── user_id (FK → dt_users)
           ├── wish_text (TEXT)
           ├── gem_type (ENUM: ruby/sapphire/emerald/diamond/citrine)
           ├── yeosu_theme (TEXT, nullable)
           └── status (ENUM: drafted/submitted/converted_to_star/archived)

UI         /wish → WishGate.jsx
           ├── 소원 텍스트 입력 (최대 200자)
           └── 보석 선택 5종 (ruby/sapphire/emerald/diamond/citrine)
```

---

## 시스템 2 — Star Generation System

**Status: ✓ Implemented**

```
SSOT       DreamTown_Star_Birth_Policy_Design.md
           DreamTown_Star_Navigation_System_SSOT.md

API        POST /api/dt/stars/create
           Body: { wish_id, user_id }
           Response: { star_id, star_name, star_slug, galaxy, star_stage }

           GET /api/dt/stars/:id
           Response: { star_id, star_name, wish_text, galaxy, star_stage, created_at }

DB         dt_star_seeds
           ├── id (UUID PK)
           ├── wish_id (FK → dt_wishes)
           ├── seed_name (TEXT)
           └── seed_state (ENUM: born/waiting_starlink/promoted)

           dt_stars
           ├── id (UUID PK)
           ├── user_id (FK → dt_users)
           ├── wish_id (FK → dt_wishes)
           ├── star_seed_id (FK → dt_star_seeds)
           ├── star_name (TEXT — 조합형 2000가지 자동 생성)
           ├── star_slug (TEXT UNIQUE)
           ├── galaxy_id (FK → dt_galaxies)
           ├── constellation_id (nullable — P1에서 연결 예정)
           └── star_stage (ENUM: day1/day7/day30/day100/day365)

UI         /star-birth → StarBirth.jsx (4단계 애니메이션)
           /my-star/:id → MyStar.jsx (별 상세 + 성장 단계)

Logic      별 이름 자동 생성:
           wish_id UUID → hex 변환 → 결정론적 index
           NATURE_WORDS[50] × ACTION_WORDS[40] = 2,000 조합
           한국어 받침 → 을/를 자동 선택
           DB 중복 체크 후 offset 증가
```

---

## 시스템 3 — Galaxy System

**Status: ✓ Implemented**

```
SSOT       DreamTown_Galaxy_Map_SSOT.md
           DreamTown_Galaxy_Evolution_SSOT.md

API        GET /api/dt/galaxies
           Response: { galaxies: [{ code, name_ko, name_en, direction }] }

           GET /api/dt/galaxies/:code
           Response: { code, name_ko, name_en, direction, description, constellations }

DB         dt_galaxies (시드 데이터 4개 포함)
           ├── id (UUID PK)
           ├── code (TEXT UNIQUE — challenge/growth/relationship/healing)
           ├── name_ko / name_en
           ├── direction (north/east/west/south)
           ├── sort_order
           └── is_active (BOOLEAN)

UI         /galaxy → Galaxy.jsx
           ├── 4대 은하 목록
           ├── 은하 클릭 → 상세 + constellations
           └── Founding Stars 고정 표시

보석-은하 매핑:
           ruby      → challenge (도전 은하)
           sapphire  → growth (성장 은하)
           emerald   → healing (치유 은하)
           diamond   → growth (성장 은하)
           citrine   → relationship (관계 은하)
```

---

## 시스템 4 — User System

**Status: ✓ Implemented (게스트 자동 생성)**

```
SSOT       (전용 SSOT 없음 — Universe Bible 내 포함)

API        (전용 엔드포인트 없음)
           POST /api/dt/wishes 진입 시 user_id 없으면 자동 생성

DB         dt_users
           ├── id (UUID PK)
           ├── nickname (TEXT)
           ├── email (TEXT, nullable)
           └── provider (TEXT, nullable)

UI         AppLaunch.jsx → 첫 진입
           localStorage 기반 user_id 생성 (getOrCreateUserId)
           localStorage 키: dt_user_id, dt_star_id
```

---

## 시스템 5 — Constellation System

**Status: △ Partial (DB FK 준비, API 미구현)**

```
SSOT       DreamTown_Constellation_System_Design.md

API        (미구현 — P1 예정)
           GET /api/dt/galaxies/:code 응답에 constellations 포함하나
           dt_constellations 테이블 미생성 시 빈 배열 반환 (graceful fallback)

DB         dt_constellations (P1 — 미생성)
           dt_constellation_stories (P1 — 미생성)
           dt_stars.constellation_id (nullable FK — 컬럼은 존재, 연결 대기)

UI         Galaxy.jsx → constellations 섹션 표시 준비됨
```

---

## 시스템 6 — Aurora5 / Aurum System

**Status: ✗ SSOT only**

```
SSOT       DreamTown_Aurora5_System_SSOT.md
           DreamTown_Aurum_System_Design.md
           DreamTown_Aurum_UX_Design.md

API        (미구현)
DB         (미구현)
UI         StarBirth.jsx — 아우룸 등장 애니메이션 텍스트만 표시
           ('🐢 아우룸이 나타났습니다.' 하드코딩)
```

---

## 시스템 7 — Travel System

**Status: ✗ SSOT only**

```
SSOT       DreamTown_Travel_System_SSOT.md
           DreamTown_Yeosu_Travel_Routes_SSOT.md

API        (미구현)
DB         (미구현)
UI         (미구현)
```

---

## 시스템 8 — Growth Film

**Status: △ Partial (별도 서비스 존재, DreamTown 미연결)**

```
SSOT       DreamTown_Growth_Film_SSOT.md
           DreamTown_Growth_Film_Architecture_SSOT.md

API        routes/videoJobRoutes.js (별도 — DreamTown과 미연결)
DB         video_jobs 테이블 (별도)
UI         public/growth-film.html (별도)
```

---

## 화면 라우팅 맵

| Route | 컴포넌트 | API 호출 | 상태 |
|-------|----------|---------|------|
| `/` | AppLaunch.jsx | 없음 | ✓ |
| `/intro` | DreamTownIntro.jsx | 없음 | ✓ |
| `/wish` | WishGate.jsx | POST /wishes, POST /stars/create | ✓ |
| `/star-birth` | StarBirth.jsx | 없음 (state로 데이터 전달) | ✓ |
| `/my-star/:id` | MyStar.jsx | GET /stars/:id | ✓ |
| `/galaxy` | Galaxy.jsx | GET /galaxies, GET /galaxies/:code | ✓ |
| `/home` | Home.jsx | 없음 (하드코딩 데모) | △ |

---

## DB 테이블 관계도

```
dt_users (1)
  └─── dt_wishes (N)
         └─── dt_star_seeds (1)
                └─── dt_stars (1)
                       └─── dt_galaxies (N:1)
                       └─── dt_constellations (N:1) ← P1 예정
```

---

## 구현 완료 vs 미구현 요약

| 시스템 | 상태 | 비고 |
|--------|------|------|
| Wish System | ✓ | 전체 구현 |
| Star Generation | ✓ | 별 이름 2000조합 포함 |
| Galaxy System | ✓ | 4개 은하 시드 포함 |
| User System | ✓ | 게스트 자동 생성 |
| Constellation System | △ | DB FK 준비 / P1 |
| Aurora5 / Aurum | ✗ | SSOT만 존재 |
| Travel System | ✗ | SSOT만 존재 |
| Growth Film | △ | 별도 서비스, 미연결 |

---

## 참조 파일 경로

| 유형 | 경로 |
|------|------|
| API 라우트 | `routes/dreamtownRoutes.js` |
| DB 마이그레이션 | `database/migrations/029_dreamtown_p0.sql` |
| DB 연결 | `database/db.js` |
| API 클라이언트 | `dreamtown-frontend/src/api/dreamtown.js` |
| 앱 라우팅 | `dreamtown-frontend/src/App.jsx` |
| 서버 등록 | `server.js` line 2177–2192 |
