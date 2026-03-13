# DreamTown System Map

Version: v1.0
Purpose: SSOT → API → DB → UI 전체 연결 구조 — GPT Knowledge용
Source: DreamTown_System_Map_v1.md 기반
Last Updated: 2026-03-13

---

## 구현 상태 범례

```
✓  Implemented   — SSOT + API + DB + UI 모두 완료
△  Partial       — 일부만 구현
✗  SSOT only     — 문서만 존재
```

---

## 전체 흐름

```
User
  ↓ AppLaunch → DreamTownIntro
  ↓
Wish Gate (소원 입력 + 보석 선택)
  ↓ POST /api/dt/wishes
dt_wishes (PostgreSQL)
  ↓ POST /api/dt/stars/create
dt_star_seeds → dt_stars
  ↓ navigate('/star-birth')
Star Birth Animation [Aurum 등장]
  ↓ GET /api/dt/stars/:id
My Star Screen [Aurum 메시지]
  ↓ GET /api/dt/galaxies
Galaxy Screen
```

---

## 시스템 1 — Wish System ✓

| 항목 | 내용 |
|------|------|
| SSOT | DreamTown_Wish_System_SSOT.md |
| API | POST /api/dt/wishes |
| DB | dt_wishes (id, user_id, wish_text, gem_type, yeosu_theme, status) |
| UI | /wish → WishGate.jsx |

**핵심 로직**: 소원 텍스트 + 보석 선택 → DB 저장 → wish_id 반환

---

## 시스템 2 — Star Generation System ✓

| 항목 | 내용 |
|------|------|
| SSOT | DreamTown_Star_Birth_Policy_Design.md |
| API | POST /api/dt/stars/create, GET /api/dt/stars/:id |
| DB | dt_star_seeds, dt_stars |
| UI | /star-birth → StarBirth.jsx, /my-star/:id → MyStar.jsx |

**핵심 로직**:
- wish_id UUID → hex → 결정론적 index → 2,000 조합 별 이름 자동 생성
- 보석 유형 → 은하 코드 자동 배정
- star_stage: day1 → day7 → day30 → day100 → day365

**DB 관계**:
```
dt_wishes (1) → dt_star_seeds (1) → dt_stars (1)
dt_stars → dt_galaxies (N:1)
```

---

## 시스템 3 — Galaxy System ✓

| 항목 | 내용 |
|------|------|
| SSOT | DreamTown_Galaxy_Map_SSOT.md |
| API | GET /api/dt/galaxies, GET /api/dt/galaxies/:code |
| DB | dt_galaxies (code, name_ko, name_en, direction, is_active) |
| UI | /galaxy → Galaxy.jsx |

**4대 은하 시드 데이터 (DB에 존재)**:
| code | name_ko | direction |
|------|---------|-----------|
| challenge | 도전 은하 | north |
| growth | 성장 은하 | east |
| relationship | 관계 은하 | west |
| healing | 치유 은하 | south |

---

## 시스템 4 — User System ✓

| 항목 | 내용 |
|------|------|
| SSOT | (Universe Bible 내 포함) |
| API | (전용 엔드포인트 없음 — /wishes 진입 시 자동 생성) |
| DB | dt_users (id, nickname, email, provider) |
| UI | localStorage 기반 — getOrCreateUserId() |

**게스트 자동 생성**: user_id가 없으면 UUID 자동 생성 후 dt_users에 Guest로 삽입

---

## 시스템 5 — Constellation System △

| 항목 | 내용 |
|------|------|
| SSOT | DreamTown_Constellation_System_Design.md |
| API | (미구현 — /galaxies/:code 응답에 빈 배열 graceful fallback) |
| DB | dt_constellations, dt_constellation_stories (P1 — 미생성) |
| UI | Galaxy.jsx에 표시 자리 준비됨 |

---

## 시스템 6 — Aurora5 / Aurum System △

| 항목 | 내용 |
|------|------|
| SSOT | DreamTown_Aurora5_System_SSOT.md, DreamTown_Aurum_UX_Design.md |
| API | (미구현) |
| DB | (미구현) |
| UI | 고정 메시지 3개 적용됨: |
| | Home: 🐢 "당신의 별이 빛나길." |
| | StarBirth: 🐢 "작은 소원이 별이 되었습니다." |
| | MyStar: 🐢 "별은 천천히 자랍니다." |

---

## 시스템 7 — Travel System ✗

| 항목 | 내용 |
|------|------|
| SSOT | DreamTown_Travel_System_SSOT.md, DreamTown_Yeosu_Travel_Routes_SSOT.md |
| API | 미구현 |
| DB | 미구현 |
| UI | 미구현 |

---

## 시스템 8 — Growth Film △

| 항목 | 내용 |
|------|------|
| SSOT | DreamTown_Growth_Film_SSOT.md |
| API | routes/videoJobRoutes.js (별도 서비스, DreamTown 미연결) |
| DB | video_jobs (별도) |
| UI | public/growth-film.html (별도) |

---

## 화면 라우팅 맵

| Route | 컴포넌트 | API | 상태 |
|-------|----------|-----|------|
| / | AppLaunch.jsx | 없음 | ✓ |
| /intro | DreamTownIntro.jsx | 없음 | ✓ |
| /wish | WishGate.jsx | POST /wishes + POST /stars/create | ✓ |
| /star-birth | StarBirth.jsx | 없음 (state 전달) | ✓ |
| /my-star/:id | MyStar.jsx | GET /stars/:id | ✓ |
| /galaxy | Galaxy.jsx | GET /galaxies + /galaxies/:code | ✓ |
| /home | Home.jsx | 없음 (데모 하드코딩) | △ |

---

## 핵심 파일 경로

| 유형 | 경로 |
|------|------|
| API 라우트 | routes/dreamtownRoutes.js |
| DB 마이그레이션 | database/migrations/029_dreamtown_p0.sql |
| DB 연결 | database/db.js |
| API 클라이언트 | dreamtown-frontend/src/api/dreamtown.js |
| 앱 라우팅 | dreamtown-frontend/src/App.jsx |
| 서버 등록 | server.js line 2177–2192 |
| 백엔드 | Express.js (Node.js 20.x) |
| DB | PostgreSQL (Render) — DATABASE_URL |
| 프론트 | React + Vite (base: /dreamtown/) |
| 배포 | Render.com 자동 배포 |
