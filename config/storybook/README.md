# config/storybook/

> DreamTown Storybook Engine 설정

---

## 목적

스토리북 엔진이 각 장소를 어떻게 연출할지 결정하는 설정 파일 모음.  
`config/thumbnail/`은 이미지 생성 파이프라인 설정이고,  
`config/storybook/`은 스토리 경험 설계 설정이다.  
두 폴더는 독립적이며 서로 덮어쓰지 않는다.

---

## 구조

```
config/storybook/
├── storybook-location.schema.json   ← 공통 스키마 (모든 location이 따름)
├── README.md
└── locations/
    ├── hamel-storybook.json         ← 기준 샘플 (Memory Route)
    ├── cablecar-storybook.json      ← 예정 (Star Route)
    ├── cafe-storybook.json          ← 예정 (Pause Route)
    ├── hotel-storybook.json         ← 예정 (Night Route)
    ├── jangdo-storybook.json        ← 예정 (Art Healing Route)
    ├── odongdo-storybook.json       ← 예정 (Hope Light Route)
    ├── hyangiram-storybook.json     ← 예정 (Horizon Route)
    └── dolsan-storybook.json        ← 예정 (Connection Route)
```

---

## thumbnail config와 차이

| 항목 | `config/thumbnail/` | `config/storybook/` |
|------|---------------------|---------------------|
| 목적 | DALL-E 이미지 생성 프롬프트 | 스토리북 엔진 연출 설계 |
| 주 사용처 | `build-thumbnail.js` | Storybook Engine |
| 감정 표현 방식 | 프롬프트 텍스트 | 구조화된 시각/서사 문법 |
| 카메라 규칙 | 없음 | 감정별 정의 |
| 페이지 구조 | 없음 | page_templates 정의 |
| 전환 카피 | hamel-copy.json 별도 | transition_copy 내장 |

---

## 장소별 감정 역할 (Route Map)

| 장소 | Route | 감정 역할 | hope_intensity |
|------|-------|-----------|----------------|
| hamel | Memory Route | 회고 / 연결 / 기억 | ascending |
| cablecar | Star Route | 상승 / 전환 / 떠오름 | ascending |
| cafe | Pause Route | 머무름 / 정리 / 쉼 | stable |
| hotel | Night Route | 혼자 있는 밤 / 기다림 | low |
| jangdo | Art Healing Route | 회복 / 색이 스며듦 | ascending |
| odongdo | Hope Light Route | 작은 희망 / 불빛 | medium |
| hyangiram | Horizon Route | 결심 / 다시 항해 | high |
| dolsan | Connection Route | 연결 / 다시 이어짐 | stable |

---

## 스키마 사용

새 장소 config 작성 시:
1. `storybook-location.schema.json`의 required 필드를 모두 채운다
2. `hamel-storybook.json`을 참고하되 복사하지 않는다
3. 각 장소의 `emotional_role`이 고유한지 확인한다
4. `location_id`는 `config/thumbnail/*.json`의 location 값과 일치해야 한다
