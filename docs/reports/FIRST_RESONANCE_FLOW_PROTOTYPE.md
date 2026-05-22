# FIRST_RESONANCE_FLOW_PROTOTYPE.md

> 작성일: 2026-05-22  
> 상태: prototype / no commit  
> 목적: asset-registry 기반 최초 end-to-end 감정 흐름 프로토타입  
> 기준 자산: `config/storybook/asset-registry.json` (161개) + `page05.json` (4 types × 4 locations)

---

## 전제 원칙

```
영상을 만드는 것이 아니다.
감정 흐름을 조립하는 것이다.

신규 AI 이미지 생성: 0건
기존 자산 재사용: 100%
render_mode: resonance
```

---

## 테스트 소원 3개

| # | 유형 | 소원 문장 | 핵심 감정 | 주 장면 |
|---|------|-----------|-----------|---------|
| W1 | 위로형 | "지쳐있는 나를 보듬어주고 싶어요" | pause → calm → fragile_hope | 카페 → 하멜 |
| W2 | 결심형 | "하고 싶은 일을 드디어 시작하고 싶어요" | confusion → curiosity → fragile_hope | 케이블카 → 카페 |
| W3 | 회복형 | "오랫동안 멈춰있던 나를 다시 움직이게 하고 싶어요" | pause → calm → curiosity | 하멜 → 호텔 |

---

## W1 — 위로형: "지쳐있는 나를 보듬어주고 싶어요"

### 감정 흐름 설계

```
지침: 지친 상태 인정 → 잠시 멈춤 → 조용한 회복
감정 아크: pause → calm → fragile_hope
장면 순서: 카페(pause) → 카페(calm) → 하멜(fragile_hope)
```

### 프레임 시퀀스 (5장)

| 순서 | 파일 | 감정 | 장면 | 역할 |
|------|------|------|------|------|
| F1 | `public/images/thumbnails/cafe/generated/full/02_pause_citrine_yeosu_cafe_stage2.png` | pause | 카페 창가 | 지침: 지쳐있음 인정 |
| F2 | `public/images/storybook/sources/page05/cafe/cafe_page05_emotional_afterflow_base.png` | 감정 여운 | 카페 | 지침: 감정이 흘러간 잔류 |
| F3 | `public/images/thumbnails/cafe/generated/full/03_calm_citrine_yeosu_cafe_stage2.png` | calm | 카페 | 지침: 내면 고요 시작 |
| F4 | `public/images/storybook/sources/page05/hamel/hamel_page05_reality_reconnection_base.png` | 현실 재연결 | 하멜 등대 | 지침: 현실과 다시 닿음 |
| F5 | `public/images/thumbnails/hamel/generated/full/hamel_fragile_hope_diamond_base03.png` | fragile_hope | 하멜 등대 | 지침: 작고 조심스러운 희망 |

### 선택 이유

- 카페 = `emotional_pause` 역할 — "멈춤과 내면 고요" (page05.json)
- `pause` → `calm` 전환은 카페 안에서 자연스럽게 이루어짐
- 하멜 등대는 `fragile_hope`의 가장 강한 visual anchor — 빨간 등대 빛
- `hamel_fragile_hope_diamond_base03.png` 선택 이유: base03은 OG 이미지 보호 파일 이웃, 검증된 안정 자산

### Subtitle Plan

```
F1 (0:00–0:15)  →  "지쳐도 괜찮아요"
F2 (0:15–0:30)  →  (자막 없음 — 감정 여운 프레임은 여백 유지)
F3 (0:30–0:45)  →  "마음이 조금 가벼워졌다면 좋겠어요"  (copy #11)
F4 (0:45–1:00)  →  (자막 없음 — 현실 재연결은 침묵)
F5 (1:00–1:20)  →  "작은 소원 하나가 밤하늘에 남았어요"  (copy #2)
```

### Motion Plan

```
render_mode: resonance / breathing

F1: Ken Burns — 매우 느린 위→아래 pan (0.3x), 15초
F2: 완전 정적 (still), 15초 — 여운은 움직이지 않는다
F3: cross-dissolve in (2초), 정적 유지, 15초
F4: cross-dissolve in (2초), 매우 느린 좌→우 pan (0.2x), 15초
F5: cross-dissolve in (2초), 정적, 20초 → fade-out 5초
```

### Sound Cue

```
전체: 무음 기준
F1 시작 2초 후: 조용한 바다 파도 앰비언트 fade-in (볼륨 -22dB)
F5 종료 3초 전: 앰비언트 fade-out
```

### Continuity Check

- [ ] Sowoni 뒷모습 유지 (카페: seated back view / 하멜: standing back view) ✅ 기존 자산
- [ ] 감정 좌표 이탈 없음 — pause→calm→fragile_hope 순서 준수 ✅
- [ ] 신규 AI 이미지 생성: 0건 ✅
- [ ] registry 외부 자산 직접 삽입: 없음 ✅
- [ ] 7분 초과: 없음 (총 1분 20초) ✅

---

## W2 — 결심형: "하고 싶은 일을 드디어 시작하고 싶어요"

### 감정 흐름 설계

```
지침: 막막함/혼란 인정 → 탐색 시작 → 행동 가능성
감정 아크: confusion → curiosity → fragile_hope
장면 순서: 케이블카(confusion) → 케이블카(curiosity) → 카페(fragile_hope)
```

### 프레임 시퀀스 (5장)

| 순서 | 파일 | 감정 | 장면 | 역할 |
|------|------|------|------|------|
| F1 | `public/images/thumbnails/cablecar/generated/full/01_confusion_citrine_yeosu_cablecar_stage1.png` | confusion | 케이블카 | 지침: 지금 막막한 상태 |
| F2 | `public/images/storybook/sources/page05/cablecar/cablecar_page05_widened_continuation_base.png` | 시야 확장 | 케이블카 | 지침: 더 넓은 가능성이 보이기 시작 |
| F3 | `public/images/thumbnails/cablecar/generated/full/04_curiosity_topaz_yeosu_cablecar_stage1.png` | curiosity | 케이블카 | 지침: 탐색 욕구 시작 |
| F4 | `public/images/storybook/sources/page05/cafe/cafe_page05_wish_signal_continuation_base.png` | 소원 신호 이어짐 | 카페 | 지침: 소원이 아직 유효하다 |
| F5 | `public/images/thumbnails/cafe/generated/full/05_fragile_hope_diamond_yeosu_cafe_stage2.png` | fragile_hope | 카페 | 지침: 조심스럽지만 시작할 수 있다 |

### 선택 이유

- 케이블카 = `widened_perspective` 역할 — 시야가 열리는 장소 (page05.json)
- confusion → curiosity 전환에 케이블카의 "넓어진 시야" 시각이 자연스럽게 대응
- `page05_widened_continuation` 사용 — "이전보다 더 넓은 시야" 정의와 결심형 소원 일치
- 카페 마무리: `wish_signal_continuation` — "소원이 별이 되었고 그 별은 여전히 빛난다"

### Subtitle Plan

```
F1 (0:00–0:15)  →  (자막 없음 — confusion은 먼저 침묵으로 인정)
F2 (0:15–0:30)  →  "아주 작은 마음도 빛이 될 수 있어요"  (copy #14)
F3 (0:30–0:45)  →  (자막 없음)
F4 (0:45–1:00)  →  "당신의 소원은 아직 끝나지 않았어요"  (copy #12)
F5 (1:00–1:20)  →  "오늘의 용기를 별에 담아두었어요"  (copy #13)
```

### Motion Plan

```
render_mode: resonance / breathing

F1: 완전 정적, 15초 — confusion은 움직이지 않는다
F2: cross-dissolve in (2초), 매우 느린 아래→위 pan (0.3x) — 시야가 올라감, 15초
F3: cross-dissolve in (2초), 정적, 15초
F4: cross-dissolve in (2초), 매우 느린 중앙 정렬 pan (0.2x), 15초
F5: cross-dissolve in (2초), 정적, 20초 → fade-out 5초
```

### Sound Cue

```
F1: 무음
F2 시작 1초 후: 매우 조용한 바람 앰비언트 fade-in (-22dB)
F5 종료 3초 전: fade-out
```

### Continuity Check

- [ ] Sowoni 뒷모습 유지 (케이블카: aerial view back / 카페: window seated back) ✅ 기존 자산
- [ ] 감정 좌표 이탈 없음 — confusion→curiosity→fragile_hope ✅
- [ ] 신규 AI 이미지 생성: 0건 ✅
- [ ] registry 외부 자산: 없음 ✅
- [ ] 총 길이: 약 1분 20초 ✅

---

## W3 — 회복형: "오랫동안 멈춰있던 나를 다시 움직이게 하고 싶어요"

### 감정 흐름 설계

```
지침: 멈춰있음 인정 → 조용한 재시동 → 다시 보이기 시작하는 것들
감정 아크: pause → calm → curiosity
장면 순서: 하멜(pause) → 하멜(calm) → 호텔(curiosity)
```

### 프레임 시퀀스 (5장)

| 순서 | 파일 | 감정 | 장면 | 역할 |
|------|------|------|------|------|
| F1 | `public/images/thumbnails/hamel/generated/full/hamel_pause_sapphire_base02.png` | pause | 하멜 등대 | 지침: 오래 멈춰있었음 |
| F2 | `public/images/storybook/sources/page05/hamel/hamel_page05_emotional_afterflow_base.png` | 감정 여운 | 하멜 | 지침: 멈춤이 잘못된 것이 아니다 |
| F3 | `public/images/thumbnails/hamel/generated/full/hamel_calm_emerald_base04.png` | calm | 하멜 등대 | 지침: 내면이 고요해짐 |
| F4 | `public/images/storybook/sources/page05/hotel/hotel_page05_reality_reconnection_base.png` | 현실 재연결 | 호텔 | 지침: 일상과 다시 접촉 |
| F5 | `public/images/thumbnails/hotel/generated/full/04_curiosity_topaz_yeosu_hotel_stage4.png` | curiosity | 호텔 | 지침: 다시 보이기 시작하는 것들 |

### 선택 이유

- 하멜 `pause` 시작: 등대 앞에 조용히 서있는 장면 — "멈춰있음"의 가장 강한 시각
- `hamel_pause_sapphire_base02` — base02는 base03(OG 고정 파일) 바로 이전, 안전한 인접 자산
- 호텔 마무리: `stage4` = 4번째 여정. "오래된 멈춤에서 다시 움직임" 서사 마무리에 적합
- `curiosity`로 마무리 — 결심(fragile_hope)이 아닌 탐색 재시작 — 회복형 소원에 맞는 열린 결말

### Subtitle Plan

```
F1 (0:00–0:18)  →  "오늘의 마음을 이 밤에 남겨둘게요"  (copy #9)
F2 (0:18–0:33)  →  (자막 없음 — 여운 프레임 침묵)
F3 (0:33–0:48)  →  "당신의 마음은 사라지지 않아요"  (copy #3)
F4 (0:48–1:03)  →  (자막 없음)
F5 (1:03–1:25)  →  "작은 빛 하나가 길이 되어줄 거예요"  (copy #17)
```

### Motion Plan

```
render_mode: resonance / breathing

F1: 완전 정적, 18초 — 긴 정적으로 멈춤 인정
F2: cross-dissolve in (3초), 완전 정적, 15초
F3: cross-dissolve in (2초), 매우 느린 pan (0.3x, 우→좌), 15초
F4: cross-dissolve in (2초), 정적, 15초
F5: cross-dissolve in (2초), 매우 느린 위→아래 pan (0.2x), 22초 → fade-out 5초
```

### Sound Cue

```
F1: 무음 (멈춤 강조)
F2 끝 → F3 시작: 바다 파도 앰비언트 매우 조용히 fade-in (-24dB)
F5 종료 4초 전: fade-out
```

### Continuity Check

- [ ] Sowoni 뒷모습 유지 (하멜: standing back / 호텔: back view) ✅ 기존 자산
- [ ] 감정 좌표 이탈 없음 — pause→calm→curiosity ✅
- [ ] 신규 AI 이미지 생성: 0건 ✅
- [ ] registry 외부 자산: 없음 ✅
- [ ] 총 길이: 약 1분 25초 ✅

---

## 공통 Render 사양

```yaml
render_mode: resonance
ratio: "3:4 portrait (원본 유지)"
resolution: "1024×1536"
frame_duration: "15–22초"
transition: cross-dissolve (2–3초)
motion_speed: "0.2–0.3x (Ken Burns 또는 정적)"
subtitle_font: "Noto Sans KR / thin weight"
subtitle_opacity: 70%
subtitle_position: "하단 1/4 중앙"
subtitle_max_chars: 20
sound: "무음 또는 -22dB 이하 앰비언트"
total_duration:
  W1: "약 1분 20초"
  W2: "약 1분 20초"
  W3: "약 1분 25초"
```

---

## 자산 사용 현황 요약

| 유형 | 사용 파일 수 | 출처 |
|------|------------:|------|
| thumbnails/generated/full/ | 9장 | asset-registry (tracked) |
| storybook/sources/page05/ | 6장 | asset-registry (tracked) |
| 신규 AI 생성 이미지 | **0장** | — |

총 15장 사용. 모두 기존 자산. registry 등록 확인 완료.

---

## 구현 gap 확인 (현재 → 실제 영상 조립에 필요한 것)

| 항목 | 현재 상태 | 필요 작업 |
|------|-----------|-----------|
| frame sequence 설계 | ✅ 이 문서 | — |
| 실제 파일 존재 확인 | ✅ git ls-files 확인됨 | — |
| motion 렌더링 엔진 | ❌ 없음 | `scripts/video/assemble-miracle-video.js` 구현 |
| subtitle 번인 | ❌ 없음 | sharp 기반 텍스트 오버레이 또는 FFmpeg |
| 영상 조립 (MP4 출력) | ❌ 없음 | FFmpeg 또는 remotion 파이프라인 |
| videoJobRoutes.js 연결 | ❌ 미연결 | 조립 스크립트 → 큐 등록 |

**이 문서는 조립 설계도다. 다음 단계는 `assemble-miracle-video.js` 구현.**

---

## 다음 단계 제안 (우선순위)

1. **W1 단일 프레임 조립 테스트** — 5장 PNG를 slideshow로 조립 (FFmpeg 또는 canvas)
2. **subtitle 번인 검증** — `sharp` 기반 텍스트 오버레이 (기존 `overlayService.js` 구조 참고)
3. **motion 추가** — Ken Burns를 FFmpeg `zoompan` 필터로 구현
4. **W2/W3 순차 적용** — W1 파이프라인 검증 후
