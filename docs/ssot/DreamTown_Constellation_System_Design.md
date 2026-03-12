# DreamTown Constellation 시스템

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: 별자리 생성·구조·UX — DreamTown을 SNS가 아닌 지혜 지도 플랫폼으로 만드는 핵심

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 핵심 정의

```
Constellation = 여러 별(Story)이 연결되어 만들어지는 경험 패턴 지도
```

```
Wish → Story → Star → Constellation → Wisdom
```

---

## 1. Constellation 생성 방식

**초기: 자동 생성 금지** (노이즈 증가)
**확정: 사용자 연결 + 큐레이션 혼합 모델**

### 방식 1 — 사용자 연결 (User Constellation)
```
내 별
    ↓
비슷한 항해 발견
    ↓
"이 별과 연결하기"
    ↓
Constellation 생성
```

예: 카페 창업 준비 ★ → 첫 실패 ★ → 재도전 ★ → 오픈 성공 ★
→ **"창업 항해 별자리"** 탄생

### 방식 2 — 큐레이션 (Aurora5 Curated)
운영팀 또는 Aurora5가 의미 있는 별들을 선별해 별자리 생성.

---

## 2. 큐레이션 별자리 예시

### 첫 창업 항해
```
직장 퇴사 ★ → 창업 준비 ★ → 첫 실패 ★ → 재도전 ★ → 첫 고객 ★
```

### 사랑의 회복
```
이별 ★ → 자기 이해 ★ → 관계 회복 ★ → 새로운 시작 ★
```

### 건강 회복
```
병 발견 ★ → 치료 시작 ★ → 회복 과정 ★ → 다시 일상 ★
```

---

## 3. 데이터 구조 (개념)

```json
{
  "id": "constellation_id",
  "title": "첫 창업 항해",
  "description": "처음 사업을 시작하는 사람들의 항해",
  "type": "curated | user",
  "stars": ["star_id_1", "star_id_2", "star_id_3"]
}
```

---

## 4. UX 구조

별자리는 지도처럼 표현된다.

```
      ★
   ★     ★
      ★
```

탐험 흐름:
```
별자리 클릭
    ↓
스토리 흐름 보기
    ↓
각 별 탐험
```

---

## 5. Wisdom 생성

별자리 = 경험 패턴 → 지혜로 기록

예: 창업 별자리 패턴
```
준비 → 실패 → 재도전 → 성장
```

이 패턴이 쌓이면 **Human Wisdom Network** 형성.

---

## 6. 용궁 연결

```
용궁 → 별씨앗 → 별 → 별자리
```

Constellation = 용궁에서 시작된 소원들의 집합.

---

## 7. 전략 효과

| 효과 | 내용 |
|------|------|
| SNS화 방지 | 이야기 중심, 좋아요 피드 아님 |
| 집단지성 | 패턴이 지혜로 축적 |
| 오프라인 연결 | 오프라인 소원도 별자리로 합류 |
| 투자 스토리 | "인류 경험 지도 플랫폼" 설명 가능 |

---

## 참조

- 세계 아키텍처: `docs/ssot/DreamTown_World_Architecture_SSOT.md`
- 확장 우주: `docs/design/DreamTown_Expansion_Universe_Design.md`
- 별 탄생 정책: `docs/design/DreamTown_Star_Birth_Policy_Design.md`
- 하늘 지도 스타일: `docs/design/DreamTown_Sky_Map_Design.md`
