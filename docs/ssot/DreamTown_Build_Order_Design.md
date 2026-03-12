# DreamTown Build Order Design

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown Prototype 개발 착수 순서표 — Code 실행 가이드

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 전체 개발 흐름

```
1. Project Setup
2. Database Migration
3. Seed Data
4. Backend API
5. Frontend Screens
6. Integration
7. Prototype Test
```

---

## Step 1 — Project Setup

### Backend 구조

```
backend/
 ├─ src/
 │   ├─ routes/
 │   ├─ controllers/
 │   ├─ services/
 │   ├─ models/
 │   ├─ middleware/
 │   └─ utils/
 ├─ migrations/
 └─ seed/
```

### Frontend 구조

```
frontend/
 ├─ src/
 │   ├─ pages/
 │   ├─ components/
 │   ├─ services/
 │   ├─ hooks/
 │   └─ styles/
```

---

## Step 2 — Database Migration

P0 테이블 4개 우선 생성.

### users

```sql
id          UUID PK DEFAULT gen_random_uuid()
nickname    TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### wishes

```sql
id          UUID PK
user_id     UUID FK → users.id
wish_text   TEXT
gem_type    TEXT  -- ruby|sapphire|emerald|diamond|citrine
status      TEXT DEFAULT 'submitted'
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### stars

```sql
id                  UUID PK
user_id             UUID FK → users.id
wish_id             UUID FK → wishes.id
star_name           TEXT
galaxy_id           UUID FK → galaxies.id
star_stage          TEXT DEFAULT 'day1'
created_at          TIMESTAMPTZ DEFAULT NOW()
```

### galaxies

```sql
id          UUID PK
code        TEXT UNIQUE
name_ko     TEXT
name_en     TEXT
direction   TEXT
sort_order  INT
is_active   BOOLEAN DEFAULT TRUE
created_at  TIMESTAMPTZ DEFAULT NOW()
```

> 전체 12테이블 스펙: `docs/design/DreamTown_DB_Schema_Design.md`

---

## Step 3 — Seed Data

galaxies 테이블 초기 데이터 삽입.

```sql
INSERT INTO galaxies (code, name_ko, name_en, direction, sort_order) VALUES
  ('challenge',     '도전 은하',  'Challenge Galaxy',     'north', 1),
  ('growth',        '성장 은하',  'Growth Galaxy',        'east',  2),
  ('relationship',  '관계 은하',  'Relationship Galaxy',  'west',  3),
  ('healing',       '치유 은하',  'Healing Galaxy',       'south', 4);
```

constellations seed (은하당 1개):

```sql
-- 예: growth 은하의 대표 별자리
INSERT INTO constellations (galaxy_id, code, name_ko, name_en, is_featured)
VALUES (:growth_id, 'restart', '새로운 시작 별자리', 'Restart Constellation', true);
```

constellation_stories seed (별자리당 3~5개):

```sql
INSERT INTO constellation_stories (constellation_id, title, story_text, story_type, is_seed_content)
VALUES (:const_id, '첫걸음 이야기', '...', 'seed', true);
```

---

## Step 4 — Backend API (구현 순서)

### ① POST /api/wishes

```js
// 소원 저장
router.post('/wishes', async (req, res) => {
  const { user_id, wish_text, gem_type, yeosu_theme } = req.body;
  // DB insert → wish_id 반환
});
```

### ② POST /api/stars/create

```js
// wish → star_seed → star 변환
// gem_type 기준 galaxy 자동 분류
const GEM_GALAXY_MAP = {
  ruby: 'challenge',
  sapphire: 'growth',
  emerald: 'healing',
  diamond: 'growth',
  citrine: 'relationship'
};
```

### ③ GET /api/stars/:id

```js
// My Star 페이지 데이터 (star + wish + galaxy + constellation)
```

### ④ GET /api/galaxies

```js
// 은하 목록 4개
```

### ⑤ GET /api/galaxies/:code

```js
// 은하 상세 + constellations + stories
```

---

## Step 5 — Frontend Screens (구현 순서)

| 순서 | 화면 | 연결 API |
|------|------|----------|
| 1 | App Launch | — |
| 2 | DreamTown Intro | — |
| 3 | Wish Gate | POST /api/wishes |
| 4 | Star Birth Scene | POST /api/stars/create |
| 5 | My Star Page | GET /api/stars/:id |
| 6 | Galaxy Preview | GET /api/galaxies |
| 7 | Home | GET /api/my-star/:user_id |

**Star Birth Scene 애니메이션 (Framer Motion):**

```jsx
// 빛구슬 → 아우룸 → 거북 별자리 → 별 탄생
// 각 단계 0.8~1.2초 fade + scale 트랜지션
```

---

## Step 6 — Integration

연결 확인 흐름:

```
Wish Gate (입력)
    ↓ POST /api/wishes
DB: wishes 레코드 생성
    ↓ POST /api/stars/create
DB: star_seeds + stars 레코드 생성
    ↓ redirect to My Star
GET /api/stars/:id
    ↓
My Star Page 렌더링
```

---

## Step 7 — Prototype Test

### 테스트 시나리오

```
1. 앱 접속 → App Launch 화면 표시
2. Intro 재생 → Skip 동작
3. 소원 입력 + 보석 선택 → Create My Star
4. Star Birth 애니메이션 재생
5. My Star 페이지 → 별 이름 / 소원 / 은하 표시
6. Galaxy 탭 → 은하 4개 목록 표시
```

### Prototype 완료 기준 (DoD)

- [ ] 소원 입력 → DB 저장 확인
- [ ] 별 생성 → star 레코드 생성 확인
- [ ] My Star 페이지 → 별 이름/소원/은하 표시
- [ ] Galaxy 화면 → 은하 4개 표시
- [ ] 별 이야기 1개 이상 열람 가능

---

## 루미 최종 판단

> **"첫 번째 실제 별이 생성되는 순간"** — 이게 나오면 DreamTown은 아이디어 → 제품으로 전환된다.

지금 개발 착수 준비 완료 상태.

---

## 참조 문서 (Code 필독)

| 문서 | 경로 |
|------|------|
| MVP 범위 | `docs/design/DreamTown_MVP_Scope_Design.md` |
| DB 스키마 | `docs/design/DreamTown_DB_Schema_Design.md` |
| ERD 요약 | `docs/design/DreamTown_ERD_Summary_Design.md` |
| API 스펙 | `docs/design/DreamTown_API_Spec_Design.md` |
| 화면 구조 | `docs/design/DreamTown_Frontend_Screen_Map_Design.md` |
| Kickoff 지시서 | `docs/design/DreamTown_Prototype_Kickoff.md` |
| 비주얼 기준 | `docs/ssot/DreamTown_Visual_Style_SSOT.md` |
