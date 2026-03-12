# DreamTown Galaxy Map Wireframe Copy v1

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: MVP Galaxy Map 화면용 문구 세트 — 프론트 개발 / 데모 / UX 기준

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 1. 화면 제목

| 버전 | 문구 |
|------|------|
| 기본 (EN) | DreamTown Galaxy Map |
| 한국어 | 드림타운 은하지도 |
| 서브카피 | 당신의 별이 머무는 은하를 탐험해보세요. |

---

## 2. 상단 안내 문구

| 버전 | 문구 |
|------|------|
| 기본형 | Your star is now shining in Growth Galaxy. |
| 한국어형 | 당신의 별은 지금 성장 은하에서 빛나고 있어요. |
| 감성형 | 당신의 소원은 이제 하나의 별이 되어 은하에 닿았습니다. |
| MVP 단축형 | 내 별이 있는 은하를 확인해보세요. |

**MVP 추천:** 한국어형 — `당신의 별은 지금 {galaxy_name}에서 빛나고 있어요.`

---

## 3. 은하 카드 공통 구조

```
[은하 이름]
짧은 설명 (1줄)
대표 별자리: xxx Constellation
대표 별: xxx Star
```

---

## 4. 은하별 문구

### Challenge Galaxy (도전 은하)

| 항목 | 문구 |
|------|------|
| 이름 (KO) | 도전 은하 |
| 설명 | 다시 시작하는 용기와 첫 발걸음이 모이는 은하 |
| 대표 별자리 | Brave Path Constellation |
| 대표 별 | Courage Star |
| 버튼 (EN) | Explore Challenge Galaxy |
| 버튼 (KO) | 도전 은하 보기 |

---

### Growth Galaxy (성장 은하)

| 항목 | 문구 |
|------|------|
| 이름 (KO) | 성장 은하 |
| 설명 | 작은 변화와 새로운 시작이 자라는 은하 |
| 대표 별자리 | New Beginning Constellation |
| 대표 별 | First Wish Star |
| 강조 문구 (EN) | Your Star is shining here. |
| 강조 문구 (KO) | 내 별이 이곳에서 빛나고 있어요. |
| 버튼 (EN) | Explore Growth Galaxy |
| 버튼 (KO) | 성장 은하 보기 |

---

### Relationship Galaxy (관계 은하)

| 항목 | 문구 |
|------|------|
| 이름 (KO) | 관계 은하 |
| 설명 | 연결과 마음의 다리가 만들어지는 은하 |
| 대표 별자리 | Waiting for the First Constellation |
| 대표 별 | The first light is waiting |
| 비어 있음 (EN) | This galaxy is waiting for its first star. |
| 비어 있음 (KO) | 이 은하는 첫 번째 별을 기다리고 있어요. |
| 첫 별 유도 (EN) | Your star could become the first light of this galaxy. |
| 첫 별 유도 (KO) | 당신의 별이 이 은하의 첫 빛이 될 수 있어요. |
| 버튼 (EN) | Explore Relationship Galaxy |
| 버튼 (KO) | 관계 은하 보기 |

---

### Healing Galaxy (치유 은하)

| 항목 | 문구 |
|------|------|
| 이름 (KO) | 치유 은하 |
| 설명 | 조용한 회복과 쉼의 빛이 모이는 은하 |
| 대표 별자리 | Quiet Heart Constellation |
| 대표 별 | Healing Star |
| 버튼 (EN) | Explore Healing Galaxy |
| 버튼 (KO) | 치유 은하 보기 |

---

## 5. 내 별 배지

| 버전 | 문구 |
|------|------|
| 기본형 | Your Star |
| 한국어형 | 내 별 |
| 감성형 | 내 소원의 별 |

---

## 6. 은하 상세 패널 문구

은하 카드 클릭 시 표시되는 패널.

| 항목 | 문구 (예: Growth Galaxy) |
|------|------|
| 패널 제목 (EN) | Inside Growth Galaxy |
| 패널 제목 (KO) | 성장 은하 안에서 |
| 소개 (EN) | Here, small wishes become steady light. |
| 소개 (KO) | 이곳에서는 작은 소원들이 오래 빛나는 별이 됩니다. |
| 별자리 소개 (EN) | A constellation for those taking their first step again. |
| 별자리 소개 (KO) | 다시 첫걸음을 내딛는 이들을 위한 별자리 |

### 대표 별 이야기 제목 예시

| EN | KO |
|----|----|
| The First Wish | 첫 번째 소원 |
| A Small Brave Step | 작은 용기의 걸음 |
| When the Heart Became Lighter | 마음이 조금 가벼워진 날 |

---

## 7. 빈 상태(Empty State) 문구

| 상황 | EN | KO |
|------|----|----|
| 스토리 없음 | More star stories will appear here soon. | 곧 더 많은 별 이야기가 이곳에 채워질 거예요. |
| 내 별 없음 | Create your first star to begin your journey. | 첫 번째 별을 만들어 여정을 시작해보세요. |
| 관계 은하 비어 있음 | No star has arrived here yet. | 아직 이곳에 도착한 별은 없어요. |

---

## 8. 버튼 문구 세트

| EN | KO |
|----|----|
| Explore Galaxy | 은하 탐험하기 |
| View My Star | 내 별 보기 |
| Back to My Star | 내 별로 돌아가기 |
| Create My Star | 내 별 만들기 |

---

## 9. 화면 하단 감성 문구 (3 옵션)

| 옵션 | EN | KO |
|------|----|----|
| A | Every wish can become a star. | 모든 소원은 별이 될 수 있습니다. |
| B | Your wish is not alone. | 당신의 소원은 혼자가 아닙니다. |
| C | From the sea of Yeosu, your star begins. | 여수 바다에서 당신의 별이 시작됩니다. |

**MVP 추천:** 옵션 B — `당신의 소원은 혼자가 아닙니다.` (DreamTown North Star 문장)

---

## 10. MVP 추천 문구 조합

```
[상단]
드림타운 은하지도
당신의 별은 지금 성장 은하에서 빛나고 있어요.

[카드: Growth Galaxy]
성장 은하
작은 변화와 새로운 시작이 자라는 은하
대표 별자리: New Beginning Constellation
대표 별: First Wish Star

[하단]
당신의 소원은 혼자가 아닙니다.
```

---

## 11. 문구 적용 원칙

```
✓ 짧고 따뜻하게
✓ 세계관 몰입 유지
✓ 설명보다 감각 우선
✓ 내 별 위치를 가장 먼저 보여주기
```

---

## 참조

- Galaxy Map UI: `docs/design/DreamTown_Galaxy_Map_UI_Design.md`
- Founding Stars: `docs/design/DreamTown_Founding_Stars_Canon_Design.md`
- Visual Style: `docs/ssot/DreamTown_Visual_Style_SSOT.md`
- Core Philosophy: `docs/ssot/DreamTown_Core_Philosophy_SSOT.md`
