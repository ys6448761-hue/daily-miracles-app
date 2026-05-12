# scene-system

> DreamTown 장면 문법 (Scene Grammar)

---

## 목적

DreamTown의 장면은 배경이 아니다.  
장면은 감정 흐름을 공간, 빛, 움직임, 상징으로 번역하는 감정 언어다.

이 폴더는 그 번역 문법의 공식 기준이다.  
`emotion-system`이 "무엇을 느끼는가"라면,  
`scene-system`은 "어떤 장면으로 보여주는가"다.

---

## DreamTown 장면 문법 원칙

### 1. 장면은 감정이 먼저다

배경, 구도, 빛은 모두 감정에서 시작한다.  
"여수 밤바다"가 아니라 "고독과 희망이 공존하는 넓은 공간"이 먼저다.  
그 감정을 담을 수 있는 가장 적은 요소로 장면을 구성한다.

### 2. 공간과 빛은 감정의 도구다

공간의 크기 = 감정의 무게  
빛의 방향 = 감정의 방향  
움직임의 속도 = 감정의 흐름  
이 도구들은 감정을 설명하는 것이 아니라 감정이 되도록 배치한다.

### 3. 설명보다 공명이 먼저다

장면은 설명하지 않는다.  
"이것은 희망의 장면입니다"가 아니라  
보는 사람이 스스로 무언가를 느끼게 한다.  
말하지 않고 보여주는 것이 DreamTown 장면의 기본값이다.

### 4. 장면은 성장 흐름과 연결된다

각 장면은 독립적으로 존재하지 않는다.  
소원 → 출발 → 전환 → 성장의 흐름 안에서 위치를 갖는다.  
어떤 흐름 단계에 속하는지 `core_emotion`과 함께 정의한다.

---

## 장면 목록

| 파일 | 장면 | 핵심 감정 | 흐름 단계 |
|------|------|-----------|-----------|
| `SCENE_wish_departure.yaml` | 소원 출발 | quiet_hope | 시작 |
| `SCENE_yeosu_night_sea.yaml` | 여수 밤바다 | loneliness + hope | 몰입 |
| `SCENE_dawn_transition.yaml` | 새벽 전환 | healing | 전환 |
| `SCENE_small_light.yaml` | 작은 빛 | tiny_hope | 유지 |
| `SCENE_growth_path.yaml` | 성장 길 | courage | 전진 |

---

## emotion-system과의 관계

```
emotion-system (감정 정의)
  ↓ visual_mapping 참조
scene-system (장면 문법)
  ↓ 적용
image_generation / sora_scenes / growth_timeline
```

---

## 금지 원칙 (전 장면 공통)

- `over_explanation` — 장면이 스스로 말하게 한다. 내레이션 삽입 금지
- `dramatic_dialogue` — 대사로 감정을 설명하지 않는다
- `forced_symbolism` — 상징은 자연스럽게 배치한다. 억지로 넣지 않는다
