# DreamTown Character Style Guide SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Define the visual character and scene style standards for all DreamTown content.

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 용도

이 문서는 다음 모든 작업의 기준이다.

- DALL-E 이미지 생성
- Sora 영상
- 웹툰 제작
- 앱 UI
- 굿즈
- 광고 영상

**이미지·영상·웹툰 생성 전 반드시 이 문서를 읽는다.**

---

## 1. 전체 스타일 잠금 (STYLE LOCK)

### 허용 스타일
```
Strict 2D hand-drawn animation
Ink line art
Warm watercolor wash
Paper grain texture
Ghibli warmth + Korean manhwa linework
Soft pastel palette
Flat lighting
```

### 금지 스타일
```
NO 3D
NO photorealism
NO CGI look
NO metallic reflections
NO glossy highlights
NO volumetric lighting
NO realistic animal textures
```

### 한 줄 정의
> **지브리 감성 + 한국 웹툰 선 + 수채화 동화책**

---

## 2. 캐릭터 1 — 아우룸 (Aurum)

DreamTown의 주인공 안내자

### 기본 설정
| 항목 | 내용 |
|------|------|
| 이름 | 아우룸 (Aurum) |
| 종류 | 황금 거북 정령 |
| 역할 | 소원 전달자 / DreamTown 안내자 |
| 성격 | 조용하고 따뜻한 안내자 |

### 외형 (TURTLE LOCK)
```
small golden turtle spirit
round shell
one crescent moon mark on shell
small soft eyes
tiny beak mouth
short legs
```

### 색상
| 요소 | 색 | HEX |
|------|-----|-----|
| 몸 | Warm Gold | `#F4C542` |
| 등껍질 | Golden + Soft highlight | — |
| 문양 | Crescent moon | — |

### 상태 프리셋
| 코드 | 설명 |
|------|------|
| `BASE` | 기본 자세 |
| `OBSERVE` | 관찰 중 |
| `GUIDE` | 안내 중 |
| `SPARKLE` | 반짝임 |
| `COZY_BREEZE` | 바람 속 편안함 |
| `NIGHT_CALM` | 밤의 고요함 |

### 금지
```
NO teeth
NO eyelashes
NO accessories
NO metallic texture
NO realistic turtle skin
```

> 상세 정의: `DreamTown_Character_SSOT.md`

---

## 3. 캐릭터 2 — 소원이 (Sowoni)

DreamTown 이야기의 주인공

### 기본 설정
| 항목 | 내용 |
|------|------|
| 연령 | 20~22세 |
| 국적 | 한국 |
| 직업 | 대학생 / 청년 |
| 성격 | 순수함 / 호기심 |

### 외형 스타일
```
large expressive eyes
soft rounded face
simple nose
small mouth
shoulder length hair
natural expression
```

### 의상 프리셋
| 코드 | 계절/상황 |
|------|----------|
| `SPRING_CASUAL` | 봄 캐주얼 |
| `SUMMER_SEASIDE` | 여름 바닷가 |
| `AUTUMN_COZY` | 가을 코지 |
| `WINTER_COAT` | 겨울 코트 |
| `NIGHT_WALK` | 밤 산책 |

### 금지
```
NO school uniform
NO child look
NO text on clothes
```

> 상세 정의: `DreamTown_Character_SSOT.md`

---

## 4. 캐릭터 3 — 여의보주 (North Star)

DreamTown의 북극성

### 형태
```
bright guiding star
soft glowing light
simple 4 or 5 point star
watercolor glow
```

### 의미
| 상징 |
|------|
| 방향 |
| 희망 |
| 중심 |

---

## 5. 환경 스타일

### 바다
```
gentle watercolor waves
soft gradients
simple curved lines
```

### 하늘
```
soft pastel night sky
tiny scattered stars
paper texture
```

---

## 6. 대표 장면 구성

DreamTown의 정석 장면:

```
        ⭐
    North Star

        🐢
       Aurum

    〰〰〰〰〰
     Yeosu Sea
```

---

## 7. DreamTown 공식 문장

**한국어**
> 여수 바다에서 시작된 하늘

**영문**
> A Sky Born from the Sea of Yeosu

---

## 8. 핵심 상징

| 상징 | 의미 |
|------|------|
| 🌊 여수 바다 | 시작 |
| 🐢 아우룸 | 여정 |
| ⭐ 여의보주 | 방향 |

---

## 9. Style Anchor — 기준 이미지 3장

DreamTown 스타일을 완전히 고정하기 위한 **기준 레퍼런스**.
아래 3장이 모든 이미지·영상 생성의 시각적 앵커가 된다.

| 번호 | 이름 | 내용 |
|------|------|------|
| SA-01 | 아우룸 기본 캐릭터 | 아우룸 단독 / BASE 상태 |
| SA-02 | 소원이 기본 캐릭터 | 소원이 단독 / 자연스러운 표정 |
| SA-03 | 아우룸 + 북극성 장면 | 여수 바다 위 대표 장면 구성 |

> Status: PENDING — 프롬프트 생성 후 DALL-E/Sora로 제작 예정

---

## 참조

- 전체 스타일 잠금: `DreamTown_Visual_Style_SSOT.md`
- 캐릭터 상세 정의: `DreamTown_Character_SSOT.md`
- 철학 기반: `DreamTown_Core_Philosophy_SSOT.md`
- 여수 은하 배경: `DreamTown_Yeosu_Galaxy_SSOT.md`
