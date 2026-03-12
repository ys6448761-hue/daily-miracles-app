# DreamTown ERD Summary Design

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown MVP DB 구조 한 장 기준도 — Code DB 설계 및 migration 착수 기준

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 전체 구조

```
users
 └─ user_profiles

users
 └─ wishes
      └─ wish_images
      └─ star_seeds
      └─ stars
           └─ star_growth_logs
           └─ star_story_links
                └─ constellation_stories
                     └─ constellations
                          └─ galaxies
```

---

## 핵심 흐름별 ERD

### A. 사용자 → 소원 → 별 생성

```
users (1)
 └─ wishes (N)
      └─ wish_images (0..N)
      └─ star_seeds (1)
      └─ stars (1)
```

- 사용자는 여러 소원을 가질 수 있음
- 각 소원은 소원그림을 가질 수 있음
- 각 소원은 하나의 별씨 → 하나의 별로 변환됨 (MVP 기준)

---

### B. 별 → 성장 기록

```
stars (1)
 └─ star_growth_logs (N)
```

- Day 1 / 7 / 30 / 100 / 365 성장 기록
- MVP에선 Day 1만 있어도 시작 가능

---

### C. 별 → 은하 소속

```
galaxies (1)
 └─ constellations (N)
      └─ stars (N)
```

MVP Lite 간소화:
```
galaxies (1)
 └─ stars (N)
```

> 별자리 없이 별을 은하에 직접 붙여도 구현 가능. 단 `constellations` 테이블은 세계관 일관성을 위해 생성 권장.

---

### D. 별자리 → 대표 이야기

```
constellations (1)
 └─ constellation_stories (N)
```

- 각 별자리에 대표 이야기 3~5개
- 초기: 운영팀 seed story로 시작

---

### E. 내 별 ↔ 대표 이야기 연결

```
stars (1)
 └─ star_story_links (N)
      └─ constellation_stories (1)
```

UX 예시: "당신의 별은 성장 은하의 첫걸음 별자리와 닿아 있습니다"

---

## 테이블별 PK / FK

| 테이블 | PK | FK |
|--------|----|----|
| users | id | — |
| user_profiles | id | user_id → users.id |
| wishes | id | user_id → users.id |
| wish_images | id | wish_id → wishes.id |
| star_seeds | id | wish_id → wishes.id |
| stars | id | user_id → users.id, wish_id → wishes.id, star_seed_id → star_seeds.id, galaxy_id → galaxies.id, constellation_id → constellations.id (nullable) |
| star_growth_logs | id | star_id → stars.id |
| galaxies | id | — |
| constellations | id | galaxy_id → galaxies.id |
| constellation_stories | id | constellation_id → constellations.id |
| star_story_links | id | star_id → stars.id, constellation_story_id → constellation_stories.id |
| app_events | id | user_id → users.id (nullable) |

---

## 핵심 관계 요약

```
users         1:N  wishes
users         1:N  stars

wishes        1:1  star_seeds
wishes        1:1  stars
wishes        1:N  wish_images

stars         1:N  star_growth_logs

galaxies      1:N  constellations
constellations 1:N  constellation_stories
galaxies      1:N  stars
constellations 1:N  stars

stars         1:N  star_story_links
constellation_stories 1:N star_story_links
```

---

## MVP 핵심 조회 3개

### ① 별 생성 완료 후

```sql
-- user + wish + star_seed + star 조인
SELECT u.*, w.*, ss.*, s.*
FROM users u
JOIN wishes w ON w.user_id = u.id
JOIN star_seeds ss ON ss.wish_id = w.id
JOIN stars s ON s.wish_id = w.id
WHERE u.id = :userId
```

### ② My Star 페이지

```sql
-- star + wish + galaxy + constellation + growth_logs
SELECT s.*, w.*, g.*, c.*, sgl.*
FROM stars s
JOIN wishes w ON s.wish_id = w.id
JOIN galaxies g ON s.galaxy_id = g.id
LEFT JOIN constellations c ON s.constellation_id = c.id
LEFT JOIN star_growth_logs sgl ON sgl.star_id = s.id
WHERE s.id = :starId
```

### ③ Galaxy 화면

```sql
-- galaxies + constellations + constellation_stories
SELECT g.*, c.*, cs.*
FROM galaxies g
JOIN constellations c ON c.galaxy_id = g.id
JOIN constellation_stories cs ON cs.constellation_id = c.id
WHERE g.is_active = true
```

---

## 구현 우선순위

### P0 (첫 번째 Migration)

```
users
wishes
star_seeds
stars
galaxies
```

### P1 (두 번째 Migration)

```
user_profiles
wish_images
constellations
constellation_stories
```

### P2 (세 번째 Migration)

```
star_growth_logs
star_story_links
app_events
```

---

## 루미 최종 판단

> **별이 태어나고, 내 별을 보고, 은하에 들어갈 수 있다**
> — 이 3가지만 보장하는 구조면 MVP는 충분하다.

DB를 크게 만드는 것보다 **소원 → 별 → 은하 탐험이 끊기지 않는 구조**가 핵심.

---

## 다음 단계 예정

**DreamTown API 목록** — Code용 엔드포인트 설계

---

## 참조

- DB 스키마: `docs/design/DreamTown_DB_Schema_Design.md`
- MVP 범위: `docs/design/DreamTown_MVP_Scope_Design.md`
- 제품 구조: `docs/design/DreamTown_Product_Architecture_Design.md`
