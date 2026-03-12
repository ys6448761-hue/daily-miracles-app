# DreamTown First User Journey SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Define the first-time user experience journey in DreamTown.

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 개요

신규 소원이의 첫 경험은 **호기심과 고요함**으로 시작된다.

```
소원 입력
    ↓
빛구슬 (Light Orb)
    ↓
용궁 도착 (Dragon Palace)
    ↓
별씨앗 (Star Seed)
    ↓
여정 시작 (Journey)
    ↓
기적 기록 (Miracle)
    ↓
첫 번째 별 탄생 (Star)
```

---

## 1. 진입 순간 (Entry Moment)

### 비주얼
- 어두운 우주 하늘
- 작은 빛이 천천히 나타난다

### 메시지
> **"Your wish is not alone."**
> "당신의 작은 빛을 남겨두세요."

### CTA
```
[ 소원 시작하기 ]
```

---

## 2. 소원 게이트 (Wish Gate)

소원이가 소원을 적는다.

### 입력
| 필드 | 필수 여부 |
|------|----------|
| `wish_text` | 필수 |
| `gem_type` | 선택 |

### 보석 선택
| 보석 | 코드 | 감성 |
|------|------|------|
| 루비 | `ruby` | 열정·용기 |
| 사파이어 | `sapphire` | 안정·지혜 |
| 에메랄드 | `emerald` | 성장·치유 |
| 다이아몬드 | `diamond` | 명확한 결단 |
| 시트린 | `citrine` | 긍정 에너지 |

### 제출 후
소원이 **빛구슬(Light Orb)**로 변환된다.

---

## 3. 용궁 도착 (Dragon Palace Arrival)

빛구슬이 디지털 용궁으로 이동한다.

아우룸이 잠깐 등장한다.

> **"소원이 안전하게 도착했습니다."**

소원은 **별씨앗(Star Seed)**이 된다.

---

## 4. 소원그림 생성 (Wish Image Creation)

시스템이 소원그림을 생성한다.

| 입력 | 출력 |
|------|------|
| `wish_text` + `gem_type` | `wish_image` (DALL-E 3) |

이 이미지는 소원의 **시각적 정체성**이 된다.

> 상세 스펙: `DreamTown_Wish_Image_SSOT.md`

---

## 5. 여정 시작 (Journey Activation)

소원이가 여정을 선택한다.

| 옵션 | 내용 |
|------|------|
| **7일 여정** | 기본 챌린지 |
| **30일 여정** | 심화 추적 |

메시지:
> **"당신의 별이 자라기 시작했습니다."**

---

## 6. 첫 번째 기적 순간 (First Miracle Moment)

시스템이 간단한 성찰을 유도한다.

예시 질문:
> "오늘 내딛을 수 있는 작은 한 걸음은 무엇인가요?"

소원이는 **기적 카드(Miracle Card)**를 기록할 수 있다.

---

## 7. 소원꿈터 광장 (Dream Plaza)

소원이가 공유된 하늘에 입장한다.

### 광장에서 볼 수 있는 것
| 탭 | 내용 |
|----|------|
| 오늘의 숨결 | 다른 소원이들의 소원그림 |
| 오늘의 울림 | 공명된 기적 카드 |
| 오늘의 기적 | 오늘 기록된 기적들 |
| 오늘의 지혜 | 공유된 통찰 |

다른 소원이들의 별이 보인다.

---

## 8. 은하 발견 (Galaxy Discovery)

소원이가 첫 번째 은하를 발견한다.

### 여수 은하 (Yeosu Galaxy)

아우룸 메시지:
> "많은 소원들이 다시 시작되는 곳이 있습니다."

### 등장 코스
- 향일암 일출 코스
- 오동도 숨결 코스
- 케이블카 시야 코스
- 돌산 별빛 코스

> 상세 구조: `DreamTown_Yeosu_Galaxy_SSOT.md`

---

## 9. 첫 번째 기적 기록 (First Miracle Record)

탐험 중, 소원이가 첫 번째 기적을 기록한다.

예시:
> "다시 시작하기로 결심했다."

결과:
- **기적 카드** 생성
- 별 에너지 +1

---

## 10. 첫 번째 별 탄생 (Birth of the First Star)

소원이 눈에 보이는 **별(Star)**로 변환된다.

메시지:
> **"DreamTown에 새로운 별이 나타났습니다."**

소원이는 이제 갖게 된다:
- **나의 별 공간 (My Star Space)**

---

## 여정 요약

```
소원 (Wish)
    ↓
빛구슬 (Light Orb)
    ↓
용궁 (Dragon Palace)
    ↓
별씨앗 (Star Seed)
    ↓
여정 (Journey)
    ↓
기적 (Miracle)
    ↓
별 (Star) ✨
```

---

## 참조

- 철학 기반: `DreamTown_Core_Philosophy_SSOT.md`
- 용어 정의: `DreamTown_Naming_System_SSOT.md`
- 소원 시스템: `DreamTown_Wish_System_SSOT.md`
- 소원그림: `DreamTown_Wish_Image_SSOT.md`
- 은하 구조: `DreamTown_Yeosu_Galaxy_SSOT.md`
- 기적 시스템: `DreamTown_Miracle_System_SSOT.md`
- 캐릭터 (아우룸): `DreamTown_Character_SSOT.md`
