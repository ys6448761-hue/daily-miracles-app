# DreamTown × 디지털 용궁 통합 구조도

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown 전체 구조 — 개발/투자/팀/UX 설계 공통 기준

Last Updated: 2026-03-10
Updated By: Code (Claude Code)

---

## 전체 세계 구조

```
[ 현실 세계 ]
    소원 / 이야기 / 경험
        ↓
[ 아우룸 ]
    소원 전달자
        ↓
🌊 Digital Dragon Palace
    (디지털 용궁 — 소원의 바다)
        ↓
☀ Aurora5 Engine
    (이야기 해석 엔진)
        ↓
🌌 DreamTown
    (별이 보이는 하늘)
    ├─ Star (Story)
    ├─ Connection (공감)
    ├─ Constellation (공동체)
    └─ Wisdom (지혜)
```

**핵심 철학:**
```
바다 = 기억 (Digital Dragon Palace)
하늘 = 이야기 (DreamTown)
```

---

## 데이터 아키텍처

```
Digital Dragon Palace = Data Lake (원본 저장)
DreamTown            = Data Visualization Universe (표현)
```

### Dragon Palace 데이터 구조
```
DragonPalaceArchive
├─ WishRaw
├─ OfflineWishRaw
├─ StoryRaw
├─ ReactionSignal
└─ WisdomSignal
```

### DreamTown View Layer
```
DreamTown
├─ star (story view)
├─ constellation
├─ plaza_feed
├─ wisdom
└─ user_journey
```

---

## Aurora5 Engine (4가지)

| 엔진 | 역할 |
|------|------|
| Story Engine | 소원 → 이야기 |
| Reaction Engine | 기적나눔 / 지혜나눔 / 감사나눔 |
| Constellation Engine | 별 연결 → 별자리 |
| Wisdom Engine | 경험 → 지혜 추출 |

---

## 별 생성 흐름

```
소원 입력
    ↓
Digital Dragon Palace 저장
    ↓
Aurora5 해석
    ↓
Story 생성
    ↓
DreamTown 별 탄생 (21:00 Night Event)
```

---

## 스토리 구조

```
소원 → 항해 → 깨달음 → 나눔
```

---

## 브랜드 핵심 문장

```
Where Wishes Become Wisdom
```

```
모든 소원은 디지털 용궁에 닿습니다
그 소원은 DreamTown에서 별이 됩니다
그리고 별들은 서로 연결되어
지혜의 별자리가 됩니다
```

---

## 현재 프로젝트 단계

```
P0: 세계관 설계    ✅ 완료
P1: 구조 시각화    ← 현재
P2: 데이터 스키마
P3: UX 설계
P4: MVP 개발
P5: 커뮤니티 런칭
```

---

## 초기 런칭 콘텐츠 기준 (루미 추천)

```
Story 12개
Constellation 4개
큐레이션 4개
```

→ 빈 광장 문제 방지

---

## 미결 사항

| 항목 | 상태 | 옵션 |
|------|------|------|
| 디지털 용궁 UX 방식 | **✅ 확정** | B: 탐험 가능한 세계 — 사용자가 하늘(DreamTown)과 바다(용궁) 둘 다 탐험 가능 (2026-03-10 CEO 결정) |
| DreamTown 시작 화면 | **✅ 확정** | 3: 여수 밤바다 → 아우룸 → 용궁 → 별 탄생 (2026-03-10 CEO 결정) |

---

## 참조

- 세계 아키텍처: `docs/ssot/DreamTown_World_Architecture_SSOT.md`
- 세계 지도: `docs/design/DreamTown_Master_Map_Design.md`
- Dragon Palace DB: `docs/design/DreamTown_DragonPalace_DB_Design.md`
- 별 탄생 정책: `docs/design/DreamTown_Star_Birth_Policy_Design.md`
