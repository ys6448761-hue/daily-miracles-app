# DreamTown System Architecture Map Design

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown 세계관 + 제품 + 기술 + 운영 통합 구조도 — 투자자/팀 설명용 한 장 지도

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 전체 구조 한 장

```
현실 세계
    ↓
여수 바다 (Origin)
    ↓
Wish Gate
    ↓
Star Birth
    ↓
My Star
    ↓
Galaxy Exploration
    ↓
Star Growth
    ↓
DreamTown Platform
    ↓
Travel / Community / IP Expansion
```

---

## Layer A — World Layer (세계관)

IP와 브랜드 정체성 담당.

```
현실 세계 → 여수 바다 → Golden Turtle Constellation
    → DreamTown 하늘 → 별 → 별자리 → 은하 → 은하군
```

핵심 상징 Trinity IP:
- 아우룸 (황금 거북 안내자)
- 황금 거북 별자리 (Golden Turtle Constellation)
- Star Birth Scene (소원이 별이 되는 핵심 장면)

---

## Layer B — Experience Layer (사용자 경험)

감정 몰입과 첫 사용 경험 담당.

```
App Launch → DreamTown Intro → Wish Gate
    → Star Creation → My Star Page → Galaxy Preview
```

> 핵심 UX 질문: **"내 소원이 정말 별이 되었는가?"**

---

## Layer C — Product Layer (기능 구조)

제품 가치를 실제 기능으로 구현.

| # | 기능 | 역할 |
|---|------|------|
| 1 | Intro | 세계관 몰입 |
| 2 | Wish Gate | 소원 입력 |
| 3 | Star Creation | 별 생성 |
| 4 | My Star | 별 소유감 |
| 5 | Galaxy Exploration Lite | 탐험 시작 |

**핵심 루프:**
```
소원 입력 → 별 생성 → 내 별 확인 → 은하 진입 → 재방문
```

---

## Layer D — Data Layer (데이터 구조)

개인 소원 데이터와 세계관 구조 연결.

```
users → wishes → stars → galaxies → constellations → stories
```

핵심 관계:
```
user → wish → star
star → galaxy → constellation → story
```

> 상세: `docs/design/DreamTown_DB_Schema_Design.md`

---

## Layer E — API Layer (백엔드 인터페이스)

프론트와 DB를 연결하는 관문.

```
POST /api/wishes           — 소원 저장
POST /api/stars/create     — 별 생성
GET  /api/stars/:id        — 내 별 조회
GET  /api/galaxies         — 은하 목록
GET  /api/galaxies/:code   — 은하 상세
```

> 상세: `docs/design/DreamTown_API_Spec_Design.md`

---

## Layer F — Interface Layer (프론트엔드)

사용자가 실제로 만지는 DreamTown.

```
7개 화면: Launch / Intro / Wish Gate / Star Birth / My Star / Galaxy / Home
4개 탭: Home | Wish | Galaxy | My Star
```

> 상세: `docs/design/DreamTown_Frontend_Screen_Map_Design.md`

---

## Layer G — Growth Layer (리텐션/성장)

단발성 사용을 루틴으로 전환.

```
Day 1 → Day 7 → Day 30 → Day 100 → Day 365
```

- 별 성장 기록 축적
- 재방문 이유 생성
- Day 365 → 소망이 인증

---

## Layer H — Expansion Layer (확장 사업)

MVP → 플랫폼 + 관광 + IP 구조.

```
Galaxy Exploration
    ↓
Community Stars (커뮤니티)
    ↓
DreamTown Travel (여행 연결)
    ↓
Postcards / Goods (굿즈)
    ↓
Animation / Story IP (IP 확장)
```

---

## 운영 역할 분화

| 역할 | 담당 |
|------|------|
| 루미 | SSOT / 구조 / 전략 |
| Code | DB / API / 개발 구현 |
| 코미 | 일정 / 실행 관리 |
| 재미 | 비주얼 / 감성 연출 |
| 여의보주 | 톤 / 철학 / 진정성 검수 |

---

## 확정 문서 목록

### SSOT (`docs/ssot/`)

```
Universe Bible / Cosmic Map / Galaxy Map / World Map
Star Navigation System / Visual Style / Character / Origin Myth
Core Philosophy / Cosmic Map
```

### Design (`docs/design/`)

```
Product Architecture / MVP Scope / DB Schema / ERD Summary
API Spec / Frontend Screen Map / System Architecture Map
Prototype Kickoff / Star Birth Policy / Opening Cinematic
Pipeline / Aurum UX / Constellation System / Yeosu Pilot
```

---

## CEO용 DreamTown 정의 한 줄

```
여수 기반 세계관 + 소원을 별로 바꾸는 앱 + 은하 탐험 구조
+ 장기 성장 시스템 + 관광/IP 확장성
```

---

## Code에게 보낼 한 줄 요약

> DreamTown은 여수 Origin 세계관 위에
> Wish Gate → Star Creation → My Star → Lite Galaxy Exploration
> 흐름을 가진 세계관형 앱이며,
> 현재는 Prototype 구현을 우선합니다.

---

## 다음 단계 예정

**DreamTown Build Order v1** — Code 개발 착수 순서표

```
1. DB migration (P0)
2. API scaffold
3. Seed data
4. Screen scaffold
5. Integration
```

---

## 참조

- 전체 SSOT: `docs/ssot/`
- 전체 Design: `docs/design/`
- Kickoff 지시서: `docs/design/DreamTown_Prototype_Kickoff.md`
- API 스펙: `docs/design/DreamTown_API_Spec_Design.md`
- DB 스키마: `docs/design/DreamTown_DB_Schema_Design.md`
