# DreamTown Screen Map v1

Version: v1.0
Owner: Aurora5 / Code
Status: Confirmed
Purpose: DreamTown 앱 전체 화면 구조 정의 — 개발 기준

Last Updated: 2026-03-12
Updated By: Code (Claude Code)

---

## 전체 화면 흐름

```
첫 방문
─────────────────────────────────────────────
Intro
    ↓
Wish Gate
    ↓
Star Birth
    ↓
My Star          ← 첫 방문 최종 도착
─────────────────────────────────────────────

재방문
─────────────────────────────────────────────
앱 열기
    ↓
My Star          ← 기본 진입 화면 (CEO 확정)
─────────────────────────────────────────────
```

---

## 화면 목록

### S01 — Intro

| 항목 | 내용 |
|------|------|
| 진입 조건 | 첫 방문 1회만 |
| 표시 요소 | DreamTown 오프닝 + 아우룸 등장 |
| 메시지 | "여수 바다에서 시작된 하늘." |
| 다음 화면 | Wish Gate |
| 반복 | 없음 (재방문 시 스킵) |

---

### S02 — Wish Gate

| 항목 | 내용 |
|------|------|
| 진입 조건 | 첫 방문 / 새 별 만들기 버튼 |
| 표시 요소 | 소원 텍스트 입력 + 보석 선택 |
| CTA | "소원 보내기" |
| 다음 화면 | Star Birth |
| 아우룸 | 화면 구석에 조용히 등장 |

**입력 필드:**
```
wish_text   (필수)
gem_type    (선택: ruby / sapphire / emerald / diamond / citrine)
```

---

### S03 — Star Birth

| 항목 | 내용 |
|------|------|
| 진입 조건 | Wish Gate 소원 제출 후 자동 실행 |
| 표시 요소 | 빛 → 아우룸 → 별 탄생 애니메이션 |
| 아우룸 | 말 없이 목격 (핵심 감정 순간) |
| DB 작업 | 별 생성 (star 레코드) |
| 다음 화면 | My Star |

**연출 순서:**
```
1. 빛구슬 등장
2. 아우룸 등장 (말 없음)
3. 빛 상승
4. 별 생성 확정
5. My Star 이동
```

---

### S04 — My Star (기본 진입 화면)

| 항목 | 내용 |
|------|------|
| 진입 조건 | Star Birth 완료 / 재방문 시 기본 |
| 역할 | DreamTown Home 역할 |

**화면 구조 (위 → 아래):**

```
[상단 인사 메시지]
오늘도 별이 기다리고 있어요

[내 별 — 중심, 가장 크게]
⭐ First Wish Star
(glow 애니메이션 3~5초 반짝임)

[별 정보 카드]
소원: 조금 더 나아지기를
은하: Growth Galaxy
성장 단계: Day 1
탄생일: 2026-03-12

[오늘의 문장 — Today Message]
작은 소원도 별이 됩니다.

[행동 버튼 — 하단, 최대 2개]
[ 새 별 만들기 ]  [ 은하 탐험 ]
```

---

### S05 — Galaxy Map

| 항목 | 내용 |
|------|------|
| 진입 조건 | My Star "은하 탐험" 버튼 |
| 표시 요소 | 4대 은하 나침반 구조 |
| 아우룸 | 짧은 은하 설명 |

**은하 구조:**
```
        Challenge (North)
Relationship  ·  Growth
        Healing (South)
```

---

### S06 — Galaxy Detail

| 항목 | 내용 |
|------|------|
| 진입 조건 | Galaxy Map 은하 선택 |
| 표시 요소 | 별자리 + 별 목록 |
| 기능 | 별 탐색 |

---

## 화면 전환 구조

```
Intro (첫 방문)
    ↓
Wish Gate ←──────────────┐
    ↓                    │ "새 별 만들기"
Star Birth               │
    ↓                    │
My Star ─────────────────┘
    │
    └──→ Galaxy Map
              ↓
         Galaxy Detail
```

---

## 구현 우선순위

| 우선순위 | 화면 | Sprint |
|---------|------|--------|
| P0 | Wish Gate (S02) | 현재 |
| P0 | Star Birth (S03) | 현재 |
| P0 | My Star (S04) | 현재 |
| P1 | Intro (S01) | 현재 |
| P1 | Galaxy Map (S05) | 현재 |
| P2 | Galaxy Detail (S06) | 다음 |

---

## 참조

- My Star UX: `docs/design/DreamTown_My_Star_UX_Master_Design.md`
- Aurum System: `docs/design/DreamTown_Aurum_System_Design.md`
- First User Journey: `docs/design/DreamTown_First_User_Journey_SSOT.md`
- Current Sprint: `docs/design/DreamTown_Current_Sprint_v1.md`
- Galaxy Evolution: `docs/ssot/DreamTown_Galaxy_Evolution_SSOT.md`
