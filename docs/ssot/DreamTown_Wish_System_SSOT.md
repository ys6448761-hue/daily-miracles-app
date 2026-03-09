# DreamTown Wish System SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Define the core wish transformation system of DreamTown.

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 규칙

- 이 파일은 소원 시스템의 유일한 기준이다
- 소원 생성·여정·기적 카드·별 성장 관련 모든 개발은 이 파일을 먼저 읽는다
- 변경 시 이 파일을 먼저 수정하고 코드 작업한다

---

## 1. 핵심 개념

DreamTown은 인간의 소원을 **우주적 여정**으로 변환한다.
개인의 의도(intention)를 눈에 보이는 성장으로 만든다.

```
Wish (소원)
      ↓
Light Orb (빛 구슬)
      ↓
Digital Dragon Palace (디지털 용궁)
      ↓
Star Seed (별의 씨앗)
      ↓
StarLink (별과의 연결)
      ↓
DreamTown Star (드림타운의 별)
```

---

## 2. 소원 생성 (Wish Creation)

여정은 소원이(Sowoni)가 소원을 쓰는 순간 시작된다.

### 입력 필드
| 필드 | 필수 | 설명 |
|------|------|------|
| `wish_text` | O | 소원 텍스트 (50자 권장, 100자 제한) |
| `gem_type` | O | 보석 유형 (ruby / sapphire / emerald / diamond / citrine) |
| `intention_tag` | X | 의도 태그 (선택) |

### 출력
소원은 **소원 이미지(Wish Image)** 라는 시각적 산출물이 된다.
이미지는 소원의 감정적 본질을 표현한다.

---

## 3. 소원 이미지 시스템 (Wish Image System)

소원 이미지는 AI 시각 합성으로 생성된다.

### 입력 → 출력
```
wish_text + gem_type
        ↓
DALL-E 3 생성
        ↓
wish_image_url (영구 저장)
```

이미지는 서버에 영구 보관되며 해당 소원의 **시각적 정체성**이 된다.

### 보석별 색감 (gem_type)
| 보석 | 주색 | 키워드 |
|------|------|--------|
| `ruby` | Deep red + Golden | 열정과 용기 |
| `sapphire` | Deep blue + Silver | 안정과 지혜 |
| `emerald` | Emerald green + Golden | 성장과 치유 |
| `diamond` | White crystal + Rainbow | 명확한 결단 |
| `citrine` | Warm yellow + Orange | 긍정 에너지 |

> 소원 이미지 API: `POST /api/wish-image/generate`
> 이미지 스타일 상세: `DreamTown_Visual_Style_SSOT.md`

---

## 4. 여정 활성화 (Journey Activation)

소원 생성 후 여정이 시작된다.

### 두 가지 경로
| 경로 | 기간 | 의미 |
|------|------|------|
| **7일 챌린지** | 7일 | 씨앗에서 꽃까지의 첫 여정 |
| **30일 여정** | 30일 | 지속적 성장과 실현 |

### 7일 성장 서사
```
Day 1 — Seed  (씨앗): 소원을 처음 품다
Day 3 — Sprout (새싹): 첫 행동이 싹트다
Day 7 — Bloom  (꽃):  소원이 피어나다
```

### 30일 응원 메시지 목표
| Day | 목표 |
|-----|------|
| 1 | 따뜻한 환영 |
| 2 | 첫 행동 유도 |
| 3 | 작은 성취 인정 |
| 4~6 | 지속 응원 |
| 7 | 7일 완주 + 다음 단계 안내 |
| 8~29 | 꾸준한 동행 |
| 30 | 30일 완주 축하 |

---

## 5. 기적의 순간 (Miracle Moments)

소원이가 의미 있는 변화를 경험하는 순간.

### 기적 유형 (4종)
| 유형 | 설명 | 예시 |
|------|------|------|
| **Action (행동)** | 실제로 한 행동 | "향일암에서 소원을 다시 썼다." |
| **Realization (깨달음)** | 내면의 인식 변화 | "내가 원하는 게 처음으로 분명해졌다." |
| **Connection (연결)** | 사람·장소·기억과의 연결 | "오동도에서 오래된 친구를 떠올렸다." |
| **Transformation (변화)** | 관점 또는 태도의 전환 | "케이블카 위에서 두려움이 사라졌다." |

### 출처 분류
| 출처 | 설명 |
|------|------|
| `daily_life` | 일상에서 발생한 기적 |
| `galaxy_exploration` | 은하 탐험(여행) 중 발생한 기적 |

---

## 6. 기적 카드 (Miracle Card)

기적의 순간은 **기적 카드**로 저장된다.
기적 카드는 별의 성장을 눈에 보이게 한다.

### 카드 필드
| 필드 | 타입 | 설명 |
|------|------|------|
| `date` | date | 기적 발생 날짜 |
| `miracle_type` | enum | action / realization / connection / transformation |
| `description` | text | 짧은 성찰 메시지 |
| `source` | enum | daily_life / galaxy_exploration |

---

## 7. 별 성장 단계 (Star Growth)

모든 소원은 DreamTown에서 하나의 별이 된다.

### 성장 5단계
| 단계 | 이름 | 의미 |
|------|------|------|
| 1 | **Star Seed** (별의 씨앗) | 소원을 처음 품은 상태 |
| 2 | **New Light** (새빛) | 첫 기적 카드 기록 |
| 3 | **Bright Star** (밝은 별) | 여정 진행 중 |
| 4 | **Guide Star** (길잡이 별) | 여정 완주 |
| 5 | **Somangi ✨** | 커뮤니티에서 다른 소원을 밝히는 존재 |

### 성장에 영향을 주는 요소
| 요소 | 영향 |
|------|------|
| 기적 카드 기록 | 별 성장의 핵심 |
| 커뮤니티 인터랙션 (응원) | 성장 가속 |
| 여정 완주 (7일/30일) | 단계 전환 |

---

## 8. 아우룸 인터랙션

아우룸은 핵심 전환점에 조용히 등장한다.

### 등장 시점
| 시점 | 상황 |
|------|------|
| 소원 생성 | Light Orb 탄생 순간 |
| 기적 기록 | 기적 카드 저장 후 |
| 코스 탐험 | Galaxy 코스 시작·종료 |
| 별 성장 | 단계 전환 순간 |

### 아우룸 원칙
- 경험을 지배하지 않는다
- 짧게 나타났다가 사라진다
- 말보다 존재로 신뢰를 전달한다

> 아우룸 외형·상태 프리셋: `DreamTown_Character_SSOT.md`

---

## 9. 커뮤니티 연동 (Community Integration)

별은 고립되지 않는다.

```
Star (개인의 별)
      ↓ 여러 별이 모이면
Constellation (별자리)
      ↓ 별자리가 모이면
Galaxy (은하)
```

이것이 **공유 지혜 네트워크**를 형성한다.

### 커뮤니티 공간
- **소원꿈터 광장 (DreamTown Plaza)**: 소원 카드가 전시되는 공간
- **응원 (Cheer)**: 다른 소원에 빛을 더하는 행동 (ON CONFLICT DO NOTHING — 중복 방지)

---

## 10. 장기 기억 (Long-Term Memory)

각 별은 역사적 로그를 보관한다.

### 기억 예시
| 항목 | 예시 |
|------|------|
| 1년 회고 | "1년 전 오늘, 향일암에서 소원을 다시 썼습니다." |
| 기적 카드 수 | "지금까지 12개의 기적을 기록했습니다." |
| 별자리 연결 | "3개의 별자리와 연결되어 있습니다." |

---

## 글로벌 확장을 위한 기초

이 시스템은 여수에서 시작하지만 **전 세계로 확장**될 수 있도록 설계된다.

| 계층 | 여수 | 글로벌 |
|------|------|--------|
| Star | 소원이의 소원 | 모든 인간의 소원 |
| Galaxy | 여수 은하 | 서울·부산·제주·교토·발리·산토리니 |
| 시스템 | 한국어 | 다국어 지원 |
| 아우룸 | 여수 용궁 수호자 | 전 세계 드림타운 안내자 |

> 은하 확장 로드맵: `DreamTown_Galaxy_Mode_SSOT.md`

---

## 참조

- 세계관: `DreamTown_Universe_Bible.md`
- 캐릭터: `DreamTown_Character_SSOT.md`
- 은하 구조: `DreamTown_Galaxy_Mode_SSOT.md`
- 비주얼 스타일: `DreamTown_Visual_Style_SSOT.md`
- 상품 구조: `DreamTown_Product_Structure_SSOT.md`
- 소원 이미지 API: `routes/wishImageRoutes.js`

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-03-09 | 최초 생성 — 소원 시스템 전체 구조 정의 |
