# DreamTown Echo Physics
## 공기 기반 파생 관계 정의

**문서 코드**: AIR-ECHO-002  
**버전**: v1.0  
**작성**: 2026-05-16  
**상태**: DRAFT (Registry 완성 후 LOCKED)

---

## 1. Echo란 무엇인가

"Echo"는 Canonical Air Seed 이미지 1장에서  
스토리북·기적영상·쇼츠·포스트카드 등 파생 결과물이 울려 퍼지는 현상을 말한다.

원천 공기 1개 → 복수 파생물. 이 관계를 Echo라 부른다.  
파생물은 원천의 감정 좌표를 유지해야 한다.

---

## 2. Echo 관계 구조

```
Canonical Air Seed
  source_id: AS-cablecar-calm-emerald
  location: yeosu_cablecar
  emotion: calm
  gemstone: emerald
  class: memory_anchor
        │
        ├──► Storybook Scene   (echo_type: storybook)
        │      위치: config/storybook/locations/
        │      조건: emotion 일치, location 일치
        │
        ├──► 기적영상 프레임   (echo_type: miracle_video)
        │      위치: assets/source/video/ 파생
        │      조건: fragile_hope 또는 calm 클래스만 가능
        │
        ├──► 쇼츠 썸네일       (echo_type: shorts_thumbnail)
        │      위치: public/images/thumbnails/{location}/
        │      조건: echo_fragment 클래스 우선
        │
        └──► 포스트카드        (echo_type: postcard)
               위치: public/images/thumbnails/{location}/
               조건: memory_anchor 클래스 우선
```

---

## 3. Echo 타입 정의

### 3.1 storybook
- **원천 클래스**: memory_anchor, echo_fragment
- **원천 감정**: calm, curiosity, fragile_hope 우선
- **비율**: 세로 9:16 (모바일 최적화)
- **파생 방식**: 원천 이미지 + 내레이션 텍스트 오버레이
- **config 연결**: `config/storybook/locations/{location}.json`

### 3.2 miracle_video
- **원천 클래스**: echo_fragment만
- **원천 감정**: fragile_hope 전용 (가장 강한 감정 고조)
- **비율**: 16:9 또는 9:16
- **파생 방식**: 원천 이미지 시퀀스 + 별빛 파티클 애니메이션
- **조건**: 해당 location의 5감정 세트 완성 시만 착수 가능

### 3.3 shorts_thumbnail
- **원천 클래스**: echo_fragment, transitional_air
- **원천 감정**: curiosity, confusion (움직임 있는 감정)
- **비율**: 16:9 (쇼츠 표지)
- **파생 방식**: 원천 이미지 크롭 + 텍스트 오버레이

### 3.4 postcard
- **원천 클래스**: memory_anchor 우선, echo_fragment 가능
- **원천 감정**: calm, fragile_hope
- **비율**: 가로 4:3
- **파생 방식**: 원천 이미지 + "저 별은 당신을 기억합니다" 오버레이
- **현황**: cablecar/cafe/hotel 포스트카드 이미 공개 경로 존재

---

## 4. Echo 불가 조건

| 조건 | 이유 |
|------|------|
| `weak_survival` 클래스 → 즉시 파생 착수 불가 | 품질 미검증 |
| `deprecated` 마킹 → 모든 파생 금지 | 폐기 처리됨 |
| 세트 미완성(< 25장) location → miracle_video 착수 불가 | 시퀀스 불완전 |
| Registry 미등록 이미지 → 어떤 파생도 불가 | Constitution 원칙 2 |

---

## 5. Echo Fragment 추가 가능성 마킹

Registry에서 `echo_potential` 필드로 표시:

| 값 | 의미 |
|----|------|
| `high` | 즉시 파생 착수 가능 |
| `medium` | 기술 보완 후 착수 가능 |
| `low` | 참조용 보존 |
| `pending` | 미분류 (감사 중) |

---

## 6. 파생 우선순위 (2026 Q2 기준)

```
1순위: storybook     ← hamel 제외 3개 location echo_fragment 세트
2순위: postcard      ← 기존 포스트카드 경로 활용
3순위: miracle_video ← cablecar + hotel (완성 세트, fragile_hope 25장)
4순위: shorts        ← curiosity 세트 (confusion은 2차)
```

hamel는 세트 완성 후 순위 재배정.

---

## 7. 감정 → 파생 친화도 매트릭스

| 감정 | storybook | miracle_video | shorts | postcard |
|------|-----------|--------------|--------|----------|
| confusion | ○ (오프닝) | ✗ | ○ | ✗ |
| pause | ○ | ✗ | ○ | ○ |
| calm | ◎ | ○ | ✗ | ◎ |
| curiosity | ◎ | ○ | ◎ | ○ |
| fragile_hope | ◎ | ◎ | ○ | ◎ |

◎ 최우선 / ○ 가능 / ✗ 불가
