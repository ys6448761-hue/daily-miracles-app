# DreamTown DB Schema Design

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown MVP 개발용 데이터베이스 스키마 기준 — PostgreSQL + Node.js/Express 기반

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 설계 원칙

- 세계관 구조를 DB에서 그대로 추적 가능해야 함
- MVP는 가볍게, v2 확장은 자연스럽게
- "내 별 생성"과 "Lite Galaxy Exploration"이 바로 구현 가능해야 함
- 기존 Aurora5 사용자/소원 흐름과 충돌하지 않아야 함

---

## 핵심 엔티티 흐름

```
users
    ↓
wishes
    ↓
star_seeds
    ↓
stars
    ↓
star_growth_logs
    ↓
galaxies / constellations
    ↓
constellation_stories
```

---

## MVP 핵심 테이블 12개

### ① users

사용자 기본 정보 (DreamTown 소원이 계정)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| nickname | text | |
| email | text | |
| provider | text | oauth 제공자 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### ② user_profiles

앱 표시용 프로필 (닉네임, 테마, 출신 도시)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK → users.id | |
| display_name | text | |
| preferred_language | text | |
| theme_preference | text | |
| origin_city | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### ③ wishes

소원 원문 저장 (Wish Gate 핵심 데이터)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK → users.id | |
| wish_text | text | 소원 내용 |
| gem_type | enum | ruby / sapphire / emerald / diamond / citrine |
| yeosu_theme | text | 배경 테마 |
| status | enum | drafted / submitted / converted_to_star / archived |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### ④ wish_images

소원그림 / 포스트카드 결과물

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| wish_id | uuid FK → wishes.id | |
| image_url | text | DALL-E 3 생성 이미지 |
| postcard_url | text | 포스트카드 URL |
| prompt_text | text | AI 프롬프트 |
| style_type | text | miracle_fusion 등 |
| created_at | timestamptz | |

---

### ⑤ star_seeds

별이 되기 전 단계 (세계관: 빛구슬/별씨)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| wish_id | uuid FK → wishes.id | |
| seed_name | text | |
| seed_state | enum | born / waiting_starlink / promoted |
| created_at | timestamptz | |

---

### ⑥ stars

개인 별 엔티티 — **My Star Page의 핵심 테이블**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK → users.id | |
| wish_id | uuid FK → wishes.id | |
| star_seed_id | uuid FK → star_seeds.id | |
| star_name | text | 별 이름 (사용자+아우룸 B+C) |
| star_slug | text | URL용 슬러그 |
| galaxy_id | uuid FK → galaxies.id | |
| constellation_id | uuid FK → constellations.id, nullable | |
| birth_scene_version | text | 연출 버전 |
| star_stage | enum | day1 / day7 / day30 / day100 / day365 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### ⑦ star_growth_logs

별 성장 기록 (항해 로그)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| star_id | uuid FK → stars.id | |
| growth_day | int | 1 / 7 / 30 / 100 / 365 |
| emotion_tag | text | relieved / hopeful / clear / brave |
| help_tag | text | comfort / decision / rest / connection / action |
| growth_message | text | 감정 기록 |
| insight_note | text | 깨달음 메모 |
| created_at | timestamptz | |

---

### ⑧ galaxies

은하 마스터 (DreamTown Compass 기준)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| code | text UNIQUE | challenge / growth / relationship / healing |
| name_ko | text | |
| name_en | text | |
| direction | text | north / east / west / south |
| description | text | |
| sort_order | int | |
| is_active | boolean | |
| created_at | timestamptz | |

**초기 Seed 데이터:**

| code | name_ko | direction |
|------|---------|-----------|
| challenge | 도전 은하 | north |
| growth | 성장 은하 | east |
| relationship | 관계 은하 | west |
| healing | 치유 은하 | south |

---

### ⑨ constellations

별자리 마스터 (MVP: 은하당 1개 대표 별자리)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| galaxy_id | uuid FK → galaxies.id | |
| code | text UNIQUE | |
| name_ko | text | |
| name_en | text | |
| description | text | |
| is_featured | boolean | 대표 별자리 여부 |
| created_at | timestamptz | |

**초기 예시:** restart / healing / relationship / growth constellation

---

### ⑩ constellation_stories

대표 별 이야기 (MVP: 운영팀 seed story 3~5개로 시작)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| constellation_id | uuid FK → constellations.id | |
| title | text | |
| story_text | text | |
| story_type | enum | official / seed / user_story |
| is_seed_content | boolean | 초기 운영 콘텐츠 여부 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### ⑪ star_story_links

별 ↔ 스토리 연결

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| star_id | uuid FK → stars.id | |
| constellation_story_id | uuid FK → constellation_stories.id | |
| relation_type | text | |
| created_at | timestamptz | |

---

### ⑫ app_events

탐험/진입 이벤트 로깅

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK → users.id, nullable | |
| event_name | text | |
| event_payload | jsonb | |
| request_id | text | |
| created_at | timestamptz | |

**이벤트 예시:**
```
intro_viewed / wish_submitted / star_created
my_star_viewed / galaxy_opened / constellation_opened / story_opened
```

---

## 관계 구조

```
users        1:N  wishes
wishes       1:1  star_seeds
wishes       1:1  stars
users        1:N  stars
stars        1:N  star_growth_logs
galaxies     1:N  constellations
constellations 1:N constellation_stories
galaxies     1:N  stars
constellations 1:N stars
```

---

## MVP 핵심 조회 흐름

### A. 소원 입력 → 별 생성

```
users → wishes → star_seeds → stars
```

### B. My Star Page 조회

```
stars + wishes + star_growth_logs + galaxies + constellations
```

### C. 은하 탐험 조회

```
galaxies → constellations → constellation_stories
```

---

## v2 이후 추가 테이블 (MVP 제외)

```
galaxy_routes          — 항로 시스템
star_friends           — 소원이 연결
star_reactions         — 기적나눔/지혜나눔/감사나눔 반응
live_constellation     — 별자리 자동 생성
travel_spots           — 여행 레이어
ticketing              — 결제/예약
aurum_dialogues        — 아우룸 대화
```

---

## PostgreSQL 네이밍 규칙

```
snake_case 테이블명/컬럼명
uuid primary key (gen_random_uuid())
created_at / updated_at 기본 포함
enum → app enum 또는 CHECK constraint
jsonb → event_payload 한정 사용
```

---

## 루미 최종 판단

> **1차 개발은 12개 테이블로 시작 → 실제 사용 데이터 축적 후 별자리 자동 분류 / 여행 레이어 / 커뮤니티 반응 확장**

테이블 수를 늘리는 것보다 **별 생성과 은하 탐험이 자연스럽게 이어지는 최소 구조**가 핵심.

---

## 참조

- MVP 범위: `docs/design/DreamTown_MVP_Scope_Design.md`
- 제품 구조: `docs/design/DreamTown_Product_Architecture_Design.md`
- 별 항해 시스템: `docs/ssot/DreamTown_Star_Navigation_System_SSOT.md`
- Galaxy 지도: `docs/ssot/DreamTown_Galaxy_Map_SSOT.md`
- 파이프라인: `docs/design/DreamTown_Pipeline_Design.md`
