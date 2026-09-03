# World Canvas Research Freeze — v1

**결정일**: 2026-05-25
**결정자**: DreamTown 팀
**상태**: FREEZE

---

## 최종 기록 문장

```
DreamTown은 기술 데모가 아니라,
감정과 여운의 세계다.

현재 단계에서 World Canvas 연구는
핵심 감정 문법 검증에 성공했으며,
추가 자동화보다 브랜드 본질 유지가 더 중요하다고 판단한다.

따라서 본 연구는 freeze 상태로 저장하고,
콘텐츠 제작은 수동 운영 체계로 전환한다.
```

---

## 1. 검증 완료 항목

```
✅ cablecar Emotion Grammar 검증
   - 5감정(confusion/pause/calm/curiosity/fragile_hope) 시각 언어 확립
   - 별 여정(없음→탄생→완성 직전) SSOT 준수 확인
   - 감정 간 시각 구분 명확

✅ hamel Emotion Grammar 이식 검증
   - cablecar 문법이 다른 장소에서도 유지됨
   - 장소 고유 감정(방향/기다림/신호)이 자연스럽게 섞임
   - 등대 빔이 감정 표현 도구로 작동 가능

✅ storybook ↔ miracle 거리 분리 검증
   - storybook: 내부 시점 / 인물 중심 / 감정 가까이
   - miracle: 외부 시점 / 세계 중심 / 인물 8% 실루엣
   - "같은 세계, 다른 거리" 개념 체감 가능

✅ DreamTown visual tone 확보
   - 딥 블루-블랙 수채화 기반 색계
   - warm golden drift 없이 감정 표현 가능
   - 2D watercolor + Ghibli tone이 SSOT와 일치

✅ "살아있는 느낌"의 최소 기준 확보
   - sky breath / star pulse / water shimmer / air grain 조합
   - 느껴지는 순간 이미 과하다 기준 내에서 작동 가능
   - presence layer CSS로 개념 검증 완료

✅ 장소가 바뀌어도 세계 유지 가능 확인
   - cablecar → hamel 이식 성공
   - 동일 색계, 동일 감정 구조, 동일 별 여정
   - 장소 특성만 변주됨
```

---

## 2. 현재 한계 / 미해결

```
⚠️ place soul fidelity
   - 등대가 "관광지"처럼 보이지 않기 위한 미세 조정이 어려움
   - "방향/신호"라는 추상 감정을 이미지로 정확히 전달하는 난이도 높음
   - 장소 고유 감정이 Emotion Grammar와 얼마나 자연스럽게 섞이는지 불확실

⚠️ natural motion quality
   - CSS presence layer: 기술 데모 느낌이 감지됨
   - grain / sweep / shimmer 파라미터 튜닝이 끝나지 않음
   - "느껴지는 순간 이미 과하다" 기준을 일관되게 유지하기 어려움
   - endless tweaking loop 발생

⚠️ non-artificial breathing
   - 현재 CSS animation은 주기가 규칙적
   - 실제 "살아있는 느낌"은 비규칙성에서 오는데 CSS로 구현이 제한적

⚠️ automated cinematic coherence
   - AI 생성 이미지를 motion으로 연결할 때 일관성 깨짐
   - img2video 품질이 DreamTown SSOT 수준에 미달
   - 감정보다 "기술 데모"처럼 보이는 결과물 발생

⚠️ Hamel SSOT fidelity
   - warm amber 등대 반사가 SSOT 위반 여부 불명확
   - fragile_hope 4각형 별 형태 팀 검수 미완료
   - "관광지 느낌"과 "DreamTown navigation symbol" 경계 불명확
```

---

## 3. 중단 이유

```
1. 감정보다 기술이 앞서기 시작함
   - presence effect tuning이 주목적이 되어버림
   - 브랜드 감정 검증 → 기술 구현 탐구로 무게중심 이동

2. endless tweaking loop
   - grain opacity: 0.01 → 0.012 → 0.011 → ...
   - sweep angle: ±8° → ±6° → ...
   - 수치 조정이 체감 차이로 이어지지 않음

3. 비용 대비 브랜드 효율
   - AI 자동 motion 품질 < DreamTown SSOT 기준
   - 추가 투자 대비 감정 전달력 향상 미미
   - 수동 제작 대비 통제력 부족

4. MVP 핵심 개발 지연
   - world-canvas 연구에 집중하는 동안 소원 흐름/별 구조 등 핵심 개발 정체
   - 우선순위 재조정 필요
```

---

## 4. 현재 사용 가능한 방식

```
정적 이미지 + ambient music + slow fade + 수동 편집

구체적으로:
  - 생성된 storybook 이미지 5종 (cablecar/hamel) → SNS 카드
  - world-canvas 이미지 2종 → YouTube 썸네일 / 배경
  - 감정 문장 + 이미지 → 포스트카드 형식
  - DaVinci Resolve / CapCut 등으로 수동 ambient 영상 제작
  - 자동 motion 없이 cross-fade + music만으로 DreamTown 톤 유지 가능
```

---

## 5. 보존 아카이브 목록

### World Canvas Validation Archive v1

**cablecar**
```
public/debug/storybook-flow-v1.html
public/debug/miracle-presence-v1.html
public/images/world-canvas/validation/cablecar/cablecar_{confusion|pause|calm|curiosity|fragile_hope}_v1.png
public/images/world-canvas/validation/cablecar/cablecar_world_canvas_v1.png
reports/cablecar-emotion-validation-v1.md
reports/storybook-miracle-separation-v1.md
reports/world-canvas-validation-v1.md
```

**hamel**
```
public/debug/hamel-storybook-v1.html
public/debug/hamel-miracle-v1.html
public/images/world-canvas/validation/hamel/hamel_{confusion|pause|calm|curiosity|fragile_hope}_v1.png
public/images/world-canvas/validation/hamel/hamel_world_canvas_v1.png
reports/hamel-emotion-validation-v1.md
```

**스크립트 (재실행 가능)**
```
scripts/generate-cablecar-validation.js
scripts/generate-cablecar-world-canvas-v1.js
scripts/generate-hamel-validation.js
scripts/generate-hamel-world-canvas-v1.js
```

**SSOT 문서 (영구 유지)**
```
docs/ssot/dreamtown/DreamTown_Emotion_Grammar_v1.md
docs/ssot/dreamtown/DreamTown_Presence_Rule_v1.md
docs/ssot/dreamtown/DreamTown_Asset_Taxonomy_v1.md
```

---

## 6. 향후 재개 조건

아래 중 2개 이상 충족 시 재개 검토:

```
□ img2video 품질 대폭 향상 (DreamTown SSOT 수준 충족)
□ stable subtle motion 가능 (비규칙 breathing 구현)
□ place soul fidelity 개선 (프롬프트 정확도 향상)
□ low-cost rendering 가능 ($0.04/frame 이하)
□ DreamTown SSOT 충돌 없이 자동화 유지 가능
```

재개 전 확인 질문:
```
"자동 motion이 수동 편집보다 DreamTown 감정을 더 잘 전달하는가?"
이 질문에 Yes가 될 때까지 재개하지 않는다.
```

---

## 7. 다음 우선순위

```
1. DreamTown 핵심 UX
2. 소원 흐름 (wish flow)
3. 별 구조 (star structure)
4. 포스트카드 (postcard)
5. Galaxy Route
6. 저장 경험 (save experience)
7. 여행 MVP
8. onboarding
9. 감정 기록 구조
```

World Canvas 연구는 위 9개 항목 이후로 이동한다.

---

## 8. 전략 전환 요약

```
기존 방향 (중단):
  AI 자동 생성 → 자동 motion → 자동 presence → 자동 영상화

변경 방향 (적용):
  DreamTown visual language 확보
  → 정적 이미지 + 수동 편집
  → YouTube / SNS 운영
  → 핵심 MVP 개발 집중
```

DreamTown의 핵심은 영상 기술이 아니라
감정 / 여운 / 작은 문장 / 조용한 연결 / 세계관 일관성이다.

---

*World Canvas Research — FREEZE as of 2026-05-25*
