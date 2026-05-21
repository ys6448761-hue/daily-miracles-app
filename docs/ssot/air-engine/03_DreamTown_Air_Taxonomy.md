# DreamTown Air Taxonomy
## Canonical Air Seed 분류 체계

**문서 코드**: AIR-TAX-003  
**버전**: v1.0  
**작성**: 2026-05-16  
**상태**: LOCKED (분류 기준 변경 시 CEO 승인)

---

## 1. 분류 체계 개요

Air Seed는 4개 클래스로 분류된다.  
분류 기준은 **파생 가능성 × 장소 정체성 기여도** 2축이다.

```
                장소 정체성 기여도
                     HIGH
                      │
    echo_fragment ────┼──── memory_anchor
                      │
LOW ──────────────────┼───────────────── HIGH
         파생 가능성  │
    weak_survival ────┼──── transitional_air
                      │
                     LOW
```

---

## 2. 클래스 정의

### 2.1 `memory_anchor`
**핵심 정의**: 장소의 정체성을 가장 강하게 담고 있는 이미지.  
이 이미지를 보면 "여기가 {location}이다"라는 감각이 즉시 온다.

- **파생 우선도**: 포스트카드, 스토리북 개막 장면
- **감정 대응**: calm (3번 감정) — 장소가 가장 안정적으로 보이는 순간
- **보존 규칙**: 절대 폐기 금지. deprecated 마킹도 CEO만 가능.
- **예시**: `13_calm_emerald_yeosu_cablecar_stage1.png`

**판별 질문**: "이 이미지가 없으면 그 장소의 스토리를 시작할 수 없는가?" → YES면 memory_anchor

---

### 2.2 `echo_fragment`
**핵심 정의**: 파생 결과물(스토리북·기적영상·쇼츠)로 가장 잘 확장되는 이미지.  
감정이 가장 고조된 순간 또는 궁금증이 열리는 순간을 담는다.

- **파생 우선도**: 기적영상, 스토리북 클라이맥스, 쇼츠 썸네일
- **감정 대응**: curiosity (4번), fragile_hope (5번)
- **보존 규칙**: 적극 활용. 파생 기회가 생기면 최우선 선택.
- **추가 가능성**: `echo_potential: high` 마킹 시 즉시 파생 착수 가능
- **예시**: `25_fragile_hope_diamond_yeosu_hotel_stage4.png`

**판별 질문**: "이 이미지로 30초 영상 또는 스토리북 1페이지를 만들 수 있는가?" → YES면 echo_fragment

---

### 2.3 `transitional_air`
**핵심 정의**: 감정 이동의 순간을 담은 이미지. 시작과 변화를 표현한다.  
단독 파생보다 시퀀스(연속 장면)의 첫 프레임으로 효과적이다.

- **파생 우선도**: 스토리북 오프닝, 쇼츠 도입부, 영상 전환 프레임
- **감정 대응**: confusion (1번), pause (2번)
- **보존 규칙**: 파생 시 단독 사용 자제. 시퀀스 문맥 안에서 사용.
- **예시**: `01_confusion_citrine_yeosu_cablecar_stage1.png`

**판별 질문**: "이 이미지가 다음 장면으로 넘어가는 문을 여는가?" → YES면 transitional_air

---

### 2.4 `weak_survival`
**핵심 정의**: 현재로서는 파생 가치가 낮지만, 세트 완성 또는 품질 보완 후  
재분류 가능성이 있는 이미지. 보존하되 즉시 파생에는 사용하지 않는다.

- **파생 우선도**: 없음 (재분류 전까지 보류)
- **주요 케이스**:
  - 세트 미완성 location의 단독 이미지 (hamel 1장)
  - 생성 실패(failed) 기록
  - 감정 표현이 기준 미달인 이미지
- **보존 규칙**: 삭제 금지. `echo_potential: low` 유지.
- **재분류 조건**: CEO가 직접 검수 후 다른 클래스로 승격

**판별 질문**: "지금 바로 이 이미지로 결과물을 만들 수 있는가?" → NO면 weak_survival

---

## 3. 감정-클래스 기본 매핑

| 감정 | 기본 클래스 | 예외 |
|------|------------|------|
| confusion (1) | transitional_air | — |
| pause (2) | transitional_air | hotel: echo_fragment 가능 (강한 밤 대비) |
| calm (3) | memory_anchor | — |
| curiosity (4) | echo_fragment | — |
| fragile_hope (5) | echo_fragment | — |

---

## 4. 보석-클래스 참고 (보조 기준)

보석은 감정의 시각 강화 요소이지 독립 분류 기준은 아니다.  
아래는 참고용 경향성:

| 보석 | 시각 특성 | 파생 친화도 |
|------|----------|------------|
| citrine | 따뜻한 황금빛 | transitional_air 강화 |
| sapphire | 차갑고 깊은 파랑 | memory_anchor 강화 |
| emerald | 안정적인 초록 | memory_anchor 강화 |
| ruby | 강렬한 붉은 | echo_fragment 강화 |
| diamond | 투명하고 밝음 | echo_fragment 최강화 |

---

## 5. 클래스 변경 절차

```
weak_survival → (CEO 검수) → echo_fragment 또는 memory_anchor
echo_fragment → (파생 완료) → 상태 유지 (클래스 변경 없음)
any           → (CEO 승인) → deprecated (사실상 폐기)
```

`deprecated`는 Registry에서 항목을 제거하지 않고  
`class: deprecated`, `reason: {사유}`, `deprecated_at: {날짜}`로 마킹한다.
