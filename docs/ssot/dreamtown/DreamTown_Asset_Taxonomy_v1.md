# DreamTown Asset Taxonomy v1

**버전**: v1.0
**생성일**: 2026-05-24
**단계**: Phase 0 — SSOT 고정
**다음 단계**: cablecar MVP 검증

---

## 이 문서의 목적

taxonomy는 제작 도구다. 사용자 경험이 아니다.

이 분류 체계는 제작자가 에셋을 찾기 위한 언어이고,
구현자가 라우팅을 결정하기 위한 기준이다.
사용자에게 노출되지 않는다.

---

## 5개 필드

```
place        — 어디인가
emotion      — 어떤 감정인가
purpose      — 무엇을 위한 에셋인가
distance     — 얼마나 가까이 보는가
motion_safe  — Presence 시스템 적용 가능한가
```

이 5개 외에 추가하지 않는다.
Phase 0에서 좌표, pixel offset, 복잡한 파라미터 taxonomy는 금지한다.

---

## place — 원천 소스

**확정 (4종)**

| place | 한국어 | 특성 |
|-------|--------|------|
| `cablecar` | 케이블카 | 내부 시점, 창문 프레임, 도시+바다 |
| `cafe` | 카페 | 내부 시점, 창가, 항구 반사 |
| `hamel_lighthouse` | 하멜 등대 | 실내+실외, 수면, 물빛 있음 |
| `stay_room` | 방 | 내부, 창문, 가장 사적인 공간 |

**선택 (1종 — MVP 이후)**

| place | 한국어 | 특성 |
|-------|--------|------|
| `yeosu_night_sea` | 여수 밤바다 | 외부, 와이드샷, miracle 전용 |

`yeosu_night_sea`는 miracle world-canvas에만 쓴다.
storybook 클로즈업 에셋으로 사용하지 않는다.

---

## emotion — 감정

```
confusion     — 혼란
pause         — 멈춤
calm          — 고요함
curiosity     — 호기심
fragile_hope  — 연약한 희망
```

시각 언어 상세: `DreamTown_Emotion_Grammar_v1.md`

---

## purpose — 용도

```
storybook  — 감정 클로즈업. star-cache 소스.
miracle    — 세계 와이드샷. world-canvas 소스.
```

**storybook과 miracle은 동일한 에셋을 공유하지 않는다.**

| purpose | 카메라 | 인물 비중 |
|---------|--------|----------|
| storybook | close | 프레임의 1/3 |
| miracle | wide | 실루엣 (5-10%) |

---

## distance — 거리

```
close  — 인물 중심. 별과의 친밀감.
wide   — 환경 중심. 인물은 실루엣.
```

storybook → close. miracle → wide.

---

## motion_safe — Presence 적용 여부

```
true   — 인물 영역 명확. Presence 시스템 적용 가능.
false  — Presence 미적용. (world-canvas wide shot 포함)
```

Presence는 인물이 프레임에 명확히 있는 close 에셋에만 적용한다.

---

## 절대 금지

```
모든 조합 선생성 금지
  필요할 때 생성한다. 미리 만들지 않는다.

대량 world-canvas 생성 금지
  cablecar MVP 검증 통과 후 확장한다.

복잡한 taxonomy 추가 금지
  5개 필드만. 더 이상 추가하지 않는다.

3D / 실사 / 과한 VFX 금지

사람 움직임 / 립싱크 / 연기 금지
```

---

## 현재 에셋 현황

| place | storybook | miracle | 상태 |
|-------|-----------|---------|------|
| cablecar | ✅ | ⏳ | **MVP 검증 대상** |
| cafe | ✅ | ⏳ | Phase 1 대기 |
| hamel_lighthouse | ✅ | ⏳ | Phase 1 대기 |
| stay_room | ⏳ | ⏳ | Phase 2 대기 |
| yeosu_night_sea | — | ⏳ | Phase 1 대기 |

---

## 다음 단계

> **cablecar MVP 검증**

cablecar 하나만 먼저 검증한다.

검증 질문:
- storybook 에셋에서 Presence가 자연스럽게 작동하는가
- miracle 에셋이 세계를 주인공으로 보여주는가
- 두 에셋이 나란히 놓였을 때 즉시 구분되는가

검증 통과 후 cafe → hamel_lighthouse 순서로 확장한다.
