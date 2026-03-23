# DreamTown Knowledge Map

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown 프로젝트 전체 지식 구조를 한눈에 보여주는 최상위 네비게이션 문서

Last Updated: 2026-03-13

---

## Purpose

DreamTown 프로젝트의 **지식 구조 전체를 한눈에 보여주는 지도**.

이 문서는 다음을 안내한다.

- 세계관
- 제품
- UX
- 시스템
- IP
- 문서 위치

이 문서는 **DreamTown Knowledge Entry Point**다.

GPT / NotebookLM / Claude / 개발자 / 새 팀원 — 누구든 이 문서 하나로 DreamTown 전체를 5분 안에 이해할 수 있어야 한다.

---

## 1. DreamTown Core Definition

DreamTown은 다음으로 정의된다.

> **DreamTown은 인간의 소원으로 만들어진 하늘이다.**

### 소원 → 별 구조

```
Wish
↓
Star Seed
↓
Star
↓
Constellation
↓
Galaxy
```

### 사용자 경험 흐름

```
Wish Gate
↓
Star Birth
↓
My Star
↓
Galaxy
```

---

## 2. Core SSOT Structure

DreamTown의 절대 기준 문서는 **13개 Core SSOT**로 구성된다.

위치: `docs/ssot/` (T1 Tier)

인덱스: `docs/ssot/INDEX.md`

| 문서 | 내용 |
|------|------|
| `DreamTown_Core_Philosophy_SSOT.md` | 철학 선언 — 모든 작업의 0번 문서 |
| `DreamTown_Universe_Bible.md` | 세계관, 핵심 개념, Galaxy 구조 |
| `DreamTown_Origin_Myth_SSOT.md` | 여수 금오설화, Golden Nine, 용궁 구조 |
| `DreamTown_Character_SSOT.md` | 소원이·아우룸 캐릭터 상세 정의 |
| `DreamTown_Naming_System_SSOT.md` | 공식 용어 정의 (Sowoni/Somangi 등) |
| `DreamTown_Visual_Style_SSOT.md` | 색상, 스타일 잠금, 기술 스펙 |
| `DreamTown_Key_Visuals_SSOT.md` | 핵심 비주얼 3장면 (KV-01/02/03) |
| `DreamTown_Wish_System_SSOT.md` | 소원 시스템 전체 구조 |
| `DreamTown_Miracle_System_SSOT.md` | 기적 카드, 기적지수, 신호등, 별 성장 |
| `DreamTown_Aurora5_System_SSOT.md` | Aurora5 팀 역할, 메시지 시스템 |
| `DreamTown_Safety_Ethics_SSOT.md` | 신호등, 금지 조언, 위기 대응 |
| `DreamTown_World_Architecture_SSOT.md` | 디지털 용궁 × DreamTown 통합 구조 |
| `AIL-SSOT-001_Storage_Rules.md` | 문서 분류·중복 방지 규칙 |

**변경 권한: T1은 CEO 확정 필요**

---

## 3. Support Docs

Support Docs는 Core SSOT를 기반으로 한 **실행 및 설계 문서**다.

위치: `docs/ssot/` (T2~T4 Tier)

레지스트리: `docs/ssot/SSOT_Registry.md`

| 분류 | 예시 |
|------|------|
| Product | Galaxy Map, Product Structure, Star Birth Policy |
| UX | My Star Screen, Galaxy Map UI, Frontend Screen Map |
| Tech | DB Schema, API Spec, Growth Film Architecture |
| Strategy | Launch Strategy, First 100 Users, MVP Dev Plan |
| Operations | Current Sprint, Prototype Kickoff |

Support Docs는 **구현 참고 문서**다.

---

## 4. Archive Docs

Archive Docs는 다음을 포함한다.

- 중복 문서
- 구버전 문서
- 실험 설계
- 흡수된 문서

위치: `docs/archive/`

삭제하지 않고 보관한다.

---

## 5. DreamTown Product Structure

### 앱 화면 구조

```
Home
Wish
Galaxy
My Star
```

### 핵심 UX 흐름

```
Wish Gate → Wish Input → Star Birth → My Star → Galaxy
```

### 프론트엔드 라우트

| 경로 | 화면 |
|------|------|
| `/` | AppLaunch |
| `/intro` | DreamTown Intro |
| `/wish` | Wish Gate |
| `/star-birth` | Star Birth Animation |
| `/my-star/:id` | My Star |
| `/galaxy` | Galaxy |
| `/home` | Home |

코드 위치: `dreamtown-frontend/src/pages/`

---

## 6. DreamTown System Structure

### 기술 스택

| 계층 | 기술 |
|------|------|
| Frontend | React (Vite) |
| Backend | Express.js |
| Database | PostgreSQL (Render) |
| Hosting | Render.com |

### 핵심 API

```
POST /api/dt/wishes
POST /api/dt/stars/create
GET  /api/dt/stars/:id
GET  /api/dt/galaxies
```

코드 위치: `routes/dreamtownRoutes.js`

DB 마이그레이션: `database/migrations/029_dreamtown_p0.sql`

---

## 7. DreamTown Universe

### 우주 구조 (아래로 깊어짐)

```
Yeosu Sea (여수 바다)
↓
Dragon Palace (디지털 용궁)
↓
Shell Observatory (조가비 천문대)
↓
Dream Plaza (소원 광장)
↓
Aurora Path (오로라 길)
↓
Four Galaxies (4개 은하)
```

### Four Galaxies

| 코드 | 이름 |
|------|------|
| `challenge` | 도전 은하 |
| `growth` | 성장 은하 |
| `healing` | 치유 은하 |
| `relationship` | 관계 은하 |

---

## 8. DreamTown Characters

| 캐릭터 | 역할 |
|--------|------|
| **Aurum (아우룸)** | 소원을 듣는 황금 거북 — AI 동행자 |
| **Sowoni (소원이)** | 소원을 가진 사람 — 서비스 사용자 호칭 |
| **Somangi (소망이)** | DreamTown을 지키는 존재 |
| **Constellation Keepers** | 별자리를 관리하는 존재들 |

캐릭터 상세: `docs/ssot/DreamTown_Character_SSOT.md`

---

## 9. DreamTown Symbols

| 상징 | 의미 |
|------|------|
| Golden Turtle (황금 거북) | 기억 — 모든 소원을 기억한다 |
| Star Seed (별 씨앗) | 가능성 — 소원이 별로 자라기 전 상태 |
| Aurora (오로라) | 연결 — 별들이 서로 이어지는 빛 |
| Paper Bird (종이새) | 소원을 날려 보내는 상징 |

---

## 10. DreamTown Core Philosophy

> **당신의 소원은 혼자가 아닙니다.**

> **당신의 별이 빛나길.**

DreamTown은 경쟁의 우주가 아니라 **연결의 우주**다.

철학 원문: `docs/ssot/DreamTown_Core_Philosophy_SSOT.md`

---

## 11. Document Navigation

### 전체 docs/ 구조

```
docs/
 ├── ssot/          ← Core SSOT (T1~T5) — 절대 기준
 ├── dreamtown/     ← 이 파일 위치 — 최상위 지도
 ├── design/        ← 설계 가이드
 ├── gpt/           ← GPT Knowledge Pack
 ├── tasks/         ← 실행 작업 기록
 └── archive/       ← 구버전 보관
```

### 문서 읽기 순서 (신규 진입자용)

1. 이 파일 (Knowledge Map) — 전체 조감
2. `docs/ssot/DreamTown_Core_Philosophy_SSOT.md` — 철학
3. `docs/ssot/DreamTown_Universe_Bible.md` — 세계관
4. `docs/ssot/DreamTown_Character_SSOT.md` — 캐릭터
5. `docs/ssot/DreamTown_Wish_System_SSOT.md` — 소원 시스템
6. `docs/ssot/DreamTown_World_Architecture_SSOT.md` — 기술 구조
7. `docs/ssot/SSOT_Registry.md` — 전체 문서 목록

---

## Final Statement

DreamTown은

> 여수 바다에서 시작된 소원이
> 별이 되어 서로를 만나고
> 결국 자신에게 돌아오는 우주다.

DreamTown의 모든 문서는 이 세계를 설명하기 위해 존재한다.
