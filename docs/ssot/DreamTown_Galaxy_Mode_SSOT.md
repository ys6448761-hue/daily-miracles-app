# DreamTown Galaxy Mode SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Canonical reference for Galaxy Mode — the DreamTown travel product recommendation system

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 개념

Galaxy Mode는 DreamTown 여행 상품을 **항로(Route)** 개념으로 재분류하고 추천하는 기능이다.
사용자의 여행 목적·인원·날짜에 맞는 항로를 제안하고 견적을 생성한다.

---

## 1. 항로 체계 (4종)

### 1-1. 주중 항로 (Weekday Route)
**대상 요일**: 월~목, 일 (`mon-thu`, `sun`)

| 레저 | 판매가/인 | 특징 |
|------|----------|------|
| 케이블카 | ₩16,000 | 평일 동일 |
| 유람선 (일반) | ₩13,000 | 한적한 바다 |
| 요트 (일반) | ₩35,000 | 여유로운 항해 |
| 아쿠아플라넷 | ₩32,000 | 해양 탐험 |

**포지션**: 가성비, 한적함, 커플·소그룹

---

### 1-2. 별빛 항로 (Starlight Route)
**대상 요일**: 금·토·일·공휴일 (`fri`, `sat`, `holiday`)

| 레저 | 판매가/인 | 특징 |
|------|----------|------|
| 케이블카 | ₩16,000 | 동일 |
| 불꽃유람선 | ₩35,000 | 불꽃 야경 |
| 불꽃요트 | ₩55,000 | 프리미엄 야경 |

**포지션**: 프리미엄, 불꽃 감성, 기념일

---

### 1-3. 소망 항로 (Wish Route)
**대상**: 소원항해단 체험 상품

| 상품 | 판매가 |
|------|--------|
| Online (소원의 씨앗) | ₩24,900 |
| Basic (현장) | ₩34,900 |
| Experience (작가 동반) | ₩35,000 |

**포지션**: Daily Miracles 고유 상품, 소원 실현 체험, DreamTown 차별화 핵심

**장소 정책**: 주말/공휴일 → gallery_or_mongdol / 평일 → ship_or_gallery

---

### 1-4. 패밀리 항로 (Family Route)
**대상**: 3~4인 가족

| 구성 | 판매가 |
|------|--------|
| 오동재 호텔 4인 (주중) | ₩100,000 |
| 아쿠아플라넷 4인 | ₩128,000 |
| 유람선 4인 | ₩52,000 |
| 운영비 4인 | ₩40,000 |
| **합계** | **₩320,000** |

---

## 2. 호텔 포지셔닝

```
가성비 ──── 케니 ─── 라마다 ─── 유탑마리나 ─── 오동재 ──── 프리미엄
           2~3인     2~4인     2~4인 (마리나)   2~4인 (공휴일 특화)
```

| 호텔 | 강점 | 적합 항로 |
|------|------|----------|
| 케니 | 소규모, 단가 최저 | 주중 항로 |
| 라마다 | 균형형, 무난한 선택 | 주중·별빛 |
| 유탑마리나 | 마리나 뷰, 금요일 특화 | 별빛 항로 |
| 오동재 | 공휴일 프리미엄 | 별빛·패밀리 |

---

## 3. 무료 혜택 연동

| 혜택 | 가치 | 연동 항로 |
|------|------|----------|
| 여수3합 패스 | ₩15,000 | 전 항로 자동 |
| 달빛혜택 | ₩6,000 | 소망 항로 구매 시 |

---

## 4. 견적 시스템 연동

- **엔진**: `services/quoteEngine.js`
- **가격 데이터**: `config/quotePriceData.js`
- **요일 구분**: sun / mon-thu / fri / sat / holiday (5단계)
- **견적 유효기간**: 7일
- **견적 ID 형식**: `SW-YYYYMMDD-NNN`
- **리드 분류**: HOT(60점+) 즉시 연락 / WARM(40점+) 10분 내

---

## 5. 개발 현황

| 기능 | 상태 |
|------|------|
| 견적 계산 API | ✅ 완료 (`routes/quoteRoutes.js`) |
| 가격 데이터 | ✅ 완료 (`config/quotePriceData.js` v1.2) |
| 일정 자동 생성 | ✅ 완료 (`services/itineraryService.js`) |
| 항로 번들 UI | ⬜ 미개발 |
| DreamTown 연동 | ⬜ 미개발 |

---

## 참조

- 상품 구조: `DreamTown_Product_Structure_SSOT.md`
- 세계관: `DreamTown_Universe_Bible.md`
- 가격 원본: `config/quotePriceData.js`
