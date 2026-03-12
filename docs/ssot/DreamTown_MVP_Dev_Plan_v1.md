# DreamTown MVP Dev Plan v1

Version: v1.0
Owner: Aurora5 / Code
Status: Active
Purpose: DreamTown Prototype → MVP 개발 실행 계획

Last Updated: 2026-03-12
Updated By: Code (Claude Code)

---

## 목표

> **DreamTown Prototype을 실제로 동작하는 상태로 완성한다**

핵심 흐름:
```
Wish Gate → Star Birth → My Star → 재방문 → My Star
```

---

## 개발 원칙

- My Star가 Home이다 (재방문 기본 진입 화면)
- Star Birth는 감정 연출이 핵심이다
- 로그인 없이 익명 흐름으로 먼저 동작한다
- 기능보다 감정 경험 우선

---

## Day 1 — Wish Gate + 데이터 구조

### 목표
소원 입력 → DB 저장까지 동작

### 작업
| # | 항목 | 내용 |
|---|------|------|
| 1 | Star 테이블 생성 | `star_id`, `wish_text`, `gem_type`, `galaxy`, `born_at`, `day` |
| 2 | Wish Gate 화면 | 텍스트 입력 + 보석 선택 + 제출 버튼 |
| 3 | POST /api/stars | 소원 저장 API |
| 4 | 기본 validation | wish_text 필수 검증 |

### 완료 기준
```
소원 입력 → POST /api/stars → DB 저장 확인
```

---

## Day 2 — Star Birth 애니메이션

### 목표
별 탄생 감정 장면 구현

### 작업
| # | 항목 | 내용 |
|---|------|------|
| 1 | Star Birth 화면 | 전체 화면 어두운 배경 |
| 2 | 빛구슬 등장 | 중앙에서 작은 빛 등장 |
| 3 | 아우룸 등장 | 화면 구석에 황금 거북 (말 없음) |
| 4 | 빛 상승 애니메이션 | 빛이 위로 올라가며 별이 됨 |
| 5 | 별 생성 확정 | 애니메이션 완료 → My Star 이동 |

### 연출 타이밍
```
0.0s  어두운 화면
0.5s  빛구슬 등장 (fade in)
1.5s  아우룸 등장 (corner, fade in)
2.5s  빛 상승 시작
3.5s  별 생성 (glow burst)
4.5s  My Star로 전환
```

### 완료 기준
```
Star Birth 애니메이션 정상 실행 → My Star 이동
```

---

## Day 3 — My Star 화면

### 목표
재방문 기본 진입 화면 구현

### 작업
| # | 항목 | 내용 |
|---|------|------|
| 1 | My Star 화면 구조 | 상단 메시지 / 별 / 정보 카드 / 오늘의 문장 / 버튼 |
| 2 | GET /api/stars/:id | 별 정보 조회 API |
| 3 | 별 glow 애니메이션 | 3~5초 반짝임 반복 |
| 4 | Today Message | 위로 문장 랜덤 표시 |
| 5 | 행동 버튼 2개 | "새 별 만들기" / "은하 탐험" |
| 6 | 재방문 진입 처리 | local storage star_id → My Star 바로 진입 |

### My Star 화면 구조
```
[상단] 오늘도 별이 기다리고 있어요
[중심] ⭐ First Wish Star  (glow 애니메이션)
[카드] 소원 / 은하 / Day N / 탄생일
[문장] 작은 소원도 별이 됩니다.
[버튼] [ 새 별 만들기 ]  [ 은하 탐험 ]
```

### 완료 기준
```
재방문 → 앱 열기 → My Star 바로 표시 (Wish Gate 거치지 않음)
```

---

## Day 4 — 익명 사용자 + 전체 흐름 연결

### 목표
로그인 없이 전체 흐름 동작

### 작업
| # | 항목 | 내용 |
|---|------|------|
| 1 | anonymous_id 생성 | UUID v4, local storage 저장 |
| 2 | 별 소유권 연결 | star.anonymous_id |
| 3 | 첫 방문 / 재방문 분기 | local storage star_id 존재 여부로 분기 |
| 4 | 전체 흐름 E2E 테스트 | 첫 방문 + 재방문 전체 확인 |

### 완료 기준
```
첫 방문:  Intro → Wish Gate → Star Birth → My Star
재방문:   앱 열기 → My Star (star_id local storage 기반)
```

---

## Day 5 — Galaxy Map Lite + 버퍼

### 목표
은하 탐험 기본 뷰 + 전체 Prototype 안정화

### 작업
| # | 항목 | 내용 |
|---|------|------|
| 1 | Galaxy Map 화면 | 4대 은하 나침반 구조 표시 |
| 2 | 은하 선택 | 은하 탭 or 버튼 |
| 3 | 아우룸 메시지 | 짧은 은하 소개 1문장 |
| 4 | Prototype 전체 검수 | 흐름 / 감정 / 버그 확인 |

### 완료 기준
```
My Star "은하 탐험" → Galaxy Map → 은하 선택 가능
Prototype 전체 흐름 동작
```

---

## Prototype 완료 기준 (Day 5 이후)

다음 전체 흐름이 동작하면 Prototype 성공:

```
첫 방문
앱 실행 → Intro → Wish Gate → 소원 입력 → Star Birth → My Star

재방문
앱 실행 → My Star (바로 진입) → 별 정보 확인 → 은하 탐험 가능
```

---

## 다음 단계 (MVP)

Prototype 완료 후:

| 항목 | 내용 |
|------|------|
| Star Growth | Day N 성장 단계 |
| 간편 로그인 | Apple / Google |
| 다중 별 관리 | 별 여러 개 |
| Galaxy 상세 | 별자리 탐험 |

---

## 참조

- Screen Map: `docs/design/DreamTown_Screen_Map_v1.md`
- Current Sprint: `docs/design/DreamTown_Current_Sprint_v1.md`
- My Star UX: `docs/design/DreamTown_My_Star_UX_Master_Design.md`
- Aurum System: `docs/design/DreamTown_Aurum_System_Design.md`
- DB Schema: `docs/design/DreamTown_DB_Schema_Design.md`
