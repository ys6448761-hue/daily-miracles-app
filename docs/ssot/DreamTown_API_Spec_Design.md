# DreamTown API Specification Design

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown MVP Backend API 목록 — Express/Node.js REST API 기준

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## API 목록 요약 (11개)

```
GET   /api/health

POST  /api/wishes
GET   /api/wishes/:id

POST  /api/wish-image/generate

POST  /api/stars/create
GET   /api/stars/:id
GET   /api/stars/:id/growth

GET   /api/galaxies
GET   /api/galaxies/:code

GET   /api/my-star/:user_id

POST  /api/events
```

---

## 1. Health Check

### GET `/api/health`

```json
// Response
{
  "status": "ok",
  "service": "dreamtown-api",
  "timestamp": "2026-03-11T12:00:00Z"
}
```

---

## 2. Wish Gate API

### POST `/api/wishes`

소원 생성

```json
// Request
{
  "user_id": "uuid",
  "wish_text": "새로운 시작을 하고 싶어요",
  "gem_type": "ruby",
  "yeosu_theme": "night_sea"
}

// Response
{
  "wish_id": "uuid",
  "status": "submitted"
}
```

**gem_type:** `ruby | sapphire | emerald | diamond | citrine`
**yeosu_theme:** `night_sea | hyangiram | odongdo | dolsan_bridge`

---

### GET `/api/wishes/:id`

소원 조회

```json
// Response
{
  "id": "uuid",
  "wish_text": "새로운 시작을 하고 싶어요",
  "gem_type": "ruby",
  "status": "submitted",
  "created_at": "timestamp"
}
```

---

## 3. Wish Image API

### POST `/api/wish-image/generate`

소원그림 생성 (기존 Aurora5 소원그림 시스템 연결)

```json
// Request
{
  "wish_id": "uuid",
  "gem_type": "ruby",
  "style": "miracle_fusion"
}

// Response
{
  "image_url": "https://...",
  "postcard_url": "https://...",
  "prompt_used": "generated prompt"
}
```

**style:** `miracle_fusion | miracle_ghibli | miracle_korean`

> 기존 시스템: `routes/wishImageRoutes.js` 연동

---

## 4. Star Creation API

### POST `/api/stars/create`

소원을 별로 변환 — Star Birth 핵심 API

```json
// Request
{
  "wish_id": "uuid",
  "user_id": "uuid"
}

// Response
{
  "star_id": "uuid",
  "star_name": "새로운 시작의 별",
  "star_slug": "new-beginning-star",
  "galaxy": "growth",
  "constellation": "restart",
  "birth_scene_version": "v1",
  "star_stage": "day1"
}
```

내부 흐름:
```
wish → star_seed 생성 → galaxy 자동 분류 → star 생성
```

---

### GET `/api/stars/:id`

내 별 조회 — My Star Page 기준 데이터

```json
// Response
{
  "star_id": "uuid",
  "star_name": "새로운 시작의 별",
  "wish_text": "새로운 시작을 하고 싶어요",
  "wish_image_url": "https://...",
  "galaxy": {
    "code": "growth",
    "name_ko": "성장 은하"
  },
  "constellation": {
    "code": "restart",
    "name_ko": "새로운 시작 별자리"
  },
  "star_stage": "day1",
  "created_at": "timestamp"
}
```

---

## 5. Star Growth API

### GET `/api/stars/:id/growth`

별 성장 기록 조회

```json
// Response
{
  "star_id": "uuid",
  "growth_logs": [
    {
      "day": 1,
      "emotion": "relieved",
      "help_tag": "comfort",
      "growth_message": "조금 가벼워졌어요",
      "insight_note": "",
      "logged_at": "timestamp"
    }
  ]
}
```

### POST `/api/stars/:id/growth`

성장 로그 기록 (항해 로그 저장)

```json
// Request
{
  "growth_day": 7,
  "emotion_tag": "hopeful",
  "help_tag": "decision",
  "growth_message": "한 걸음 내딛었어요",
  "insight_note": "작은 것부터 시작하면 된다는 걸 알았어요"
}

// Response
{
  "log_id": "uuid",
  "star_stage": "day7"
}
```

---

## 6. Galaxy Exploration API

### GET `/api/galaxies`

은하 목록 조회 — Galaxy 탭 메인 화면

```json
// Response
{
  "galaxies": [
    { "code": "challenge", "name_ko": "도전 은하", "direction": "north" },
    { "code": "growth",    "name_ko": "성장 은하", "direction": "east" },
    { "code": "relationship", "name_ko": "관계 은하", "direction": "west" },
    { "code": "healing",   "name_ko": "치유 은하", "direction": "south" }
  ]
}
```

---

### GET `/api/galaxies/:code`

특정 은하 조회 — 별자리 + 대표 이야기 포함

```json
// Response
{
  "code": "growth",
  "name_ko": "성장 은하",
  "constellations": [
    {
      "code": "restart",
      "name_ko": "새로운 시작 별자리",
      "stories": [
        {
          "id": "uuid",
          "title": "첫걸음 이야기",
          "story_text": "..."
        }
      ]
    }
  ]
}
```

---

## 7. My Star API

### GET `/api/my-star/:user_id`

사용자의 대표 별 조회

```json
// Response
{
  "star_id": "uuid",
  "star_name": "새로운 시작의 별",
  "galaxy": "growth",
  "constellation": "restart",
  "star_stage": "day7",
  "growth_log_count": 2
}
```

---

## 8. Event Tracking API

### POST `/api/events`

사용자 이벤트 로깅 (앱 분석용)

```json
// Request
{
  "user_id": "uuid",
  "event_name": "star_created",
  "payload": {
    "star_id": "uuid",
    "galaxy": "growth"
  }
}

// Response
{ "status": "logged" }
```

**event_name 예시:**
```
intro_viewed / wish_submitted / star_created
my_star_viewed / galaxy_opened / constellation_opened / story_opened
```

---

## 구현 우선순위

### P0 (MVP 최소 동작)

```
POST /api/wishes
POST /api/stars/create
GET  /api/stars/:id
GET  /api/galaxies
GET  /api/galaxies/:code
```

### P1

```
POST /api/wish-image/generate
GET  /api/my-star/:user_id
GET  /api/stars/:id/growth
```

### P2

```
POST /api/stars/:id/growth
POST /api/events
GET  /api/health
```

---

## 루미 최종 판단

> **11개 API면 MVP 동작한다.**
> P0 5개만 먼저 구현하면 Wish Gate → Star Creation → Galaxy 탐험까지 연결 가능.

---

## 참조

- DB 스키마: `docs/design/DreamTown_DB_Schema_Design.md`
- ERD 요약: `docs/design/DreamTown_ERD_Summary_Design.md`
- MVP 범위: `docs/design/DreamTown_MVP_Scope_Design.md`
- 소원그림 기존 시스템: `routes/wishImageRoutes.js`
