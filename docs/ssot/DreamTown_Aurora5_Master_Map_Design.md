# Aurora5 + DreamTown Master Map

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: Aurora5 팀 + DreamTown 플랫폼 전체 통합 지도 — 투자자/팀/개발/전략 설명용 최상위 구조도

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## §1 — 전체 시스템 한 장

```
현실 세계 (소원을 가진 사람)
    ↓
여수 바다 (Origin — 세계관의 시작점)
    ↓
Aurora5 팀 (운영 시스템)
    ↓
DreamTown 플랫폼 (제품)
    ↓
Wish Gate → Star Birth → My Star → Galaxy Exploration
    ↓
성장 / 커뮤니티 / 여행 / IP
```

---

## §2 — Aurora5 Core System

소원 실현을 운영하는 5인 AI 팀.

| 역할 | 에이전트 | 담당 |
|------|----------|------|
| 전략/구조 | 루미 | SSOT 설계, 제품 구조, 마케팅 전략 |
| 개발/구현 | 코드 | DB / API / 프론트엔드 구현 |
| 운영/조율 | 코미 | 일정 관리, 실행 조율, 지시서 작성 |
| 감성/비주얼 | 재미 | UI/UX 감성 연출, 캐릭터 비주얼 |
| 검수/철학 | 여의보주 | 브랜드 일관성, 진정성 검수 |

**Aurora5 운영 원칙:**
- 루미가 SSOT를 설계하고 승인
- 코드가 구현 실행
- 코미가 실행 조율
- 여의보주가 최종 검수

---

## §3 — DreamTown Platform

Aurora5가 운영하는 세계관형 소원 실현 앱.

```
DreamTown = 여수 기반 세계관 + 소원을 별로 바꾸는 앱 + 은하 탐험 구조
           + 장기 성장 시스템 + 관광/IP 확장성
```

**핵심 명제:**
> "소원은 혼자가 아닙니다."

**Trinity IP:**
- 여수 바다 (Origin)
- 황금 거북 별자리 (Golden Turtle Constellation)
- 아우룸 (황금 거북 안내자)

---

## §4 — User Journey

사용자가 DreamTown에서 경험하는 전체 여정.

```
App Launch
    ↓
DreamTown Intro (세계관 몰입)
    ↓
Wish Gate (소원 입력 + 보석 선택)
    ↓
Star Birth Scene (소원이 별이 되는 핵심 장면)
    ↓
My Star Page (내 별 확인)
    ↓
Galaxy Exploration (은하 탐험)
    ↓
Star Growth (Day 1 → 365)
    ↓
Community / Travel / IP
```

**핵심 UX 질문:** "내 소원이 정말 별이 되었는가?"

---

## §5 — Technology Layer

| 계층 | 기술 |
|------|------|
| Frontend | React + TailwindCSS + Framer Motion |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| AI | 별 이름 생성, 소원그림 생성 |
| 연출 | Framer Motion 애니메이션 |

**Star Birth Scene 기술 흐름:**
```
Framer Motion 빛구슬 등장
    → 아우룸 캐릭터 등장
    → 황금 거북 별자리 등장
    → 별 탄생 (fade + scale 트랜지션)
```

---

## §6 — Data Layer

```
users → wishes → star_seeds → stars
stars → galaxies → constellations → constellation_stories
stars → star_growth_logs
wishes → wish_images
stars → star_story_links → constellation_stories
```

**핵심 분류 로직:**

| gem_type | galaxy |
|----------|--------|
| ruby | challenge (도전 은하) |
| sapphire | growth (성장 은하) |
| emerald | healing (치유 은하) |
| diamond | growth (성장 은하) |
| citrine | relationship (관계 은하) |

> 상세: `docs/design/DreamTown_DB_Schema_Design.md`

---

## §7 — Experience Layer

사용자의 감정·이야기·탐험을 연결하는 구조.

```
감정 (Emotion)
    → 소원 텍스트 + 보석 선택
    → 별 생성 장면 (Star Birth Scene)

이야기 (Story)
    → 별자리 이야기 (Seed Content)
    → 다른 소원이들의 항해 기록

탐험 (Exploration)
    → 은하 4종 탐험
    → 별자리 발견
    → 별 이야기 열람
```

---

## §8 — Growth Layer

별의 성장 = 사용자의 소원 여정.

```
Day 1   → 별 탄생 (Star Birth)
Day 7   → 첫 항해 기록
Day 30  → 성장 확인
Day 100 → 별자리 진입
Day 365 → 소망이 인증 (Wish Fulfilled)
```

**항해 로그 3종:**
- 감정 태그 (오늘의 감정)
- 도움 태그 (어떤 도움이 필요한가)
- 성장 메시지 (한 줄 기록)

---

## §9 — Expansion Layer

MVP → 플랫폼 → 관광 → IP.

```
MVP (Prototype)
    ↓
Galaxy Exploration (은하 탐험 고도화)
    ↓
Community Stars (다른 소원이들과 연결)
    ↓
DreamTown Travel (여수 현장 여행)
    ↓
Postcards / Goods (실물 굿즈)
    ↓
Animation / Story IP (IP 확장)
```

**여수 Tourism Layer 연결:**

| 여수 장소 | DreamTown 세계관 |
|-----------|-----------------|
| 향일암 | Star Birth Gate |
| 오동도 | Wish Harbor |
| 돌산대교 | Star Bridge |
| 여수밤바다 | Wish Ocean |

---

## §10 — DreamTown IP Core

DreamTown의 핵심 IP 자산.

| IP 요소 | 설명 |
|---------|------|
| 여수 바다 | Origin — 모든 소원의 시작점 |
| 황금 거북 별자리 | Golden Turtle Constellation — 세계관 상징 |
| 아우룸 | 황금 거북 안내자 — 소원 여정 동반자 |
| 별 탄생 장면 | Star Birth Scene — 핵심 감동 장면 |

**IP 확장 가능성:**
- 캐릭터 굿즈 (아우룸)
- 황금 거북 별자리 애니메이션
- 여수 현장 체험 프로그램
- DreamTown 스토리 웹툰/애니메이션

---

## §11 — Product Loop

사용자 재방문을 만드는 핵심 루프.

```
소원 입력
    ↓
별 생성 (감동)
    ↓
내 별 확인 (소유감)
    ↓
은하 탐험 (발견)
    ↓
항해 기록 (성장)
    ↓
재방문 (Day 7 / 30 / 100 / 365)
```

---

## §12 — Aurora5 운영 구조

```
푸르미르 CEO
    ↓
Aurora5 팀 (루미/코드/코미/재미/여의보주)
    ↓
DreamTown Platform
    ↓
소원이 (사용자)
```

**의사결정 흐름:**
```
CEO 방향 결정
    ↓
루미 SSOT 설계
    ↓
코미 실행 계획
    ↓
코드 구현
    ↓
여의보주 검수
    ↓
재미 감성 완성
```

---

## §13 — 현재 프로젝트 상태

```
SSOT 설계:      완료 ✓
Design 문서:    완료 ✓
DB 스키마:      확정 ✓
API 스펙:       확정 ✓
프론트 구조:    확정 ✓
개발 착수:      준비 완료 ✓
```

**다음 단계:**
1. DB Migration 실행 (P0 테이블 4개)
2. API P0 구현 (5개)
3. 프론트엔드 화면 구현 (7개)
4. Integration 연결
5. Prototype Test

---

## §14 — CEO용 DreamTown 정의

```
DreamTown =
  여수 기반 세계관
  + 소원을 별로 바꾸는 앱
  + 은하 탐험 구조
  + 장기 성장 시스템 (Day 1~365)
  + 관광/IP 확장성
```

> "첫 번째 실제 별이 생성되는 순간"
> — 이게 나오면 DreamTown은 아이디어 → 제품으로 전환된다.

---

## 참조 문서 전체 목록

### SSOT (`docs/ssot/`)

| 문서 | 내용 |
|------|------|
| `DreamTown_Universe_Bible.md` | 세계관 전체 기준 |
| `DreamTown_Cosmic_Map_SSOT.md` | 우주 구조 지도 |
| `DreamTown_Galaxy_Map_SSOT.md` | 은하 분류 체계 |
| `DreamTown_World_Map_SSOT.md` | 여수-세계관 연결 지도 |
| `DreamTown_Star_Navigation_System_SSOT.md` | 별 항법 시스템 |
| `DreamTown_Visual_Style_SSOT.md` | 비주얼 스타일 기준 |
| `DreamTown_Core_Philosophy_SSOT.md` | 핵심 철학 |
| `DreamTown_Character_SSOT.md` | 캐릭터 기준 |
| `DreamTown_Origin_Myth_SSOT.md` | 기원 신화 |

### Design (`docs/design/`)

| 문서 | 내용 |
|------|------|
| `DreamTown_Product_Architecture_Design.md` | 제품 구조 |
| `DreamTown_MVP_Scope_Design.md` | MVP 범위 |
| `DreamTown_DB_Schema_Design.md` | DB 스키마 |
| `DreamTown_ERD_Summary_Design.md` | ERD 요약 |
| `DreamTown_API_Spec_Design.md` | API 스펙 |
| `DreamTown_Frontend_Screen_Map_Design.md` | 화면 구조 |
| `DreamTown_Prototype_Kickoff.md` | 개발 착수 지시서 |
| `DreamTown_Build_Order_Design.md` | 개발 착수 순서 |
| `DreamTown_System_Architecture_Map_Design.md` | 시스템 구조 지도 |
| `DreamTown_Aurora5_Master_Map_Design.md` | 이 문서 |
