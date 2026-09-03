# WISH_TO_RENDER_PROTOTYPE.md

> 작성일: 2026-05-22  
> 상태: prototype / no commit  
> 산출물: `outputs/wish-render-prototype/`

---

## 목적

DreamTown 최초의 "소원 → 감정 render" 자동 흐름 설계.  
같은 소원이 두 채널(resonance / attraction)에서 어떻게 다르게 번역되는지 시각화.

```
wish text
  → emotional gravity 추출
  → asset-registry 기반 frame 선택
  → resonance (30s) / attraction (21s) 출력
```

---

## 테스트 소원 3개

| ID | 유형 | 텍스트 | 리드 감정 | 클로징 감정 |
|----|------|--------|----------|------------|
| W1 | 위로형 | 지쳐있는 나를 보듬어주고 싶어요 | pause | fragile_hope |
| W2 | 결심형 | 새로운 일을 시작해보고 싶어요 | curiosity | curiosity |
| W3 | 회복형 | 지친 몸과 마음을 회복하고 싶어요 | pause | calm |

---

## 감정 중력 추출 결과

### W1 위로형

```
키워드 감지: 지쳐, 보듬
→ gravity: pause → emotional_afterflow → calm → reality_reconnection → fragile_hope
→ hope_curve: 0.50 → 0.50 → 0.52 → 0.55 → 0.62
→ gem: citrine(cafe) + diamond(hamel)
→ direction: gentle rise from stillness to small hope
```

### W2 결심형

```
키워드 감지: 시작, 해보고싶다
→ gravity: curiosity → emotional_afterflow → calm → reality_reconnection → curiosity
→ hope_curve: 0.55 → 0.55 → 0.58 → 0.62 → 0.70
→ gem: citrine(cafe) + topaz(hamel)
→ direction: curiosity loop — 열린 에너지가 시작과 끝을 감쌈
```

### W3 회복형

```
키워드 감지: 회복, 치유, 지쳐서
→ gravity: pause → emotional_afterflow → calm → reality_reconnection → calm
→ hope_curve: 0.48 → 0.50 → 0.53 → 0.57 → 0.63
→ gem: sapphire(cafe) + emerald(hamel)
→ direction: recovery arc — fragile_hope 아닌 grounded calm으로 완결
```

---

## Asset 선택 결과

### Asset Selection Rules

| 슬롯 | 선택 기준 | page05 가능 |
|------|----------|------------|
| F1 | emotion[0] + gem_cafe + location[cafe] | ✗ |
| F2 | 고정: cafe_page05_emotional_afterflow_base.png | ✓ |
| F3 | calm + gem_cafe + location[cafe] | ✗ |
| F4 | 고정: hamel_page05_reality_reconnection_base.png | ✓ |
| F5 | emotion[4] + gem_hamel + location[hamel] | ✗ |

### 선택된 자산

| wish | F1 | F3 | F5 |
|------|----|----|-----|
| W1 | 02_pause_citrine_cafe | 03_calm_citrine_cafe | hamel_fragile_hope_diamond_base02 |
| W2 | 04_curiosity_citrine_cafe | 03_calm_citrine_cafe | hamel_curiosity_topaz_base01 |
| W3 | 07_pause_sapphire_cafe | 08_calm_sapphire_cafe | hamel_calm_emerald_base01 |

F2/F4: 3개 소원 모두 동일한 page05 자산 사용.

---

## 자막 매핑

| wish | F1 copy | F3 copy | F5 copy |
|------|---------|---------|---------|
| W1 위로형 | #9 오늘의 마음을 이 밤에 남겨둘게요 | #11 마음이 조금 가벼워졌다면 좋겠어요 | #2 작은 소원 하나가 밤하늘에 남았어요 |
| W2 결심형 | #13 오늘의 용기를 별에 담아두었어요 | #6 조금은 믿고 싶어졌어요 | #17 작은 빛 하나가 길이 되어줄 거예요 |
| W3 회복형 | #8 별빛은 아주 작은 마음에서 시작돼요 | #11 마음이 조금 가벼워졌다면 좋겠어요 | #7 당신의 오늘도 충분히 반짝였어요 |

9개 카피 전부 `postcard-emotion-copy-ssot.md` 정본 등록 확인.

---

## Render Mode 차이

| 항목 | Resonance | Attraction |
|------|-----------|------------|
| duration | 30s | 21s |
| aspect ratio | 3:4 | 9:16 |
| subtitle_offset | +1.0s | +0.3s |
| subtitle_opacity | 0.7 | 0.9 |
| subtitle_weight | thin | regular |
| dissolve | 1.0s | 0.7s |
| Ken Burns | 0.3x | 0.4x |
| breathing_gap_ratio | 40% (10s) | 28.5% (6s) |
| F1 role | open | HOOK |
| F5 role | closure | curiosity_ending |
| viewer_intent | emotional_residue | save / share / follow |

**핵심**: 구조(5프레임 / breathing gap / subtitle 패턴 60%)는 동일. 타이밍과 의도만 다름.

---

## Pacing 차이

### Resonance (30s)

```
F1 5s ─── F2 5s ─── F3 5s ─── F4 5s ─── F5 10s
 sub        gap        sub        gap        sub
```

### Attraction (21s)

```
F1 4s ── F2 3s ── F3 3s ── F4 3s ── F5 8s
 sub       gap      sub       gap      sub
```

변화: F1 −1s / F2 −2s / F3 −2s / F4 −2s / F5 −2s = 전체 −9s

---

## Continuity Check (3개 소원 공통)

| 항목 | 결과 |
|------|------|
| 신규 AI 이미지 생성 | ✅ 0건 |
| SSOT 카피 준수 | ✅ 9개 전부 정본 등록 |
| 카피 톤 (위로/코칭 금지) | ✅ 전부 통과 |
| Sowoni 뒷모습 원칙 | ✅ F1/F2/F4/F5 백뷰 |
| breathing gap 유지 | ✅ F2/F4 자막 없음 |
| Ken Burns 상한 | ✅ 최대 0.4x (SSOT 상한 0.5x 이하) |
| 금지 효과 | ✅ cross-dissolve 전용 |
| hope_curve 방향 | ✅ 단조증가 (3개 소원 모두) |

---

## 산출물 구조

```
outputs/wish-render-prototype/
  gravity-engine.json          ← 매핑 엔진 정의
  preview.html                 ← 마스터 비교 뷰 (3 wishes × 2 modes)
  W1/
    frames/F1_pause_cafe.png         (02_pause_citrine)
    frames/F2_afterflow_cafe.png     (page05)
    frames/F3_calm_cafe.png          (03_calm_citrine)
    frames/F4_reconnection_hamel.png (page05)
    frames/F5_fragile_hope_hamel.png (fragile_hope_diamond_base02)
    resonance.json
    attraction.json
  W2/
    frames/F1_curiosity_cafe.png     (04_curiosity_citrine)
    frames/F2_afterflow_cafe.png     (page05, 동일)
    frames/F3_calm_cafe.png          (03_calm_citrine, 동일)
    frames/F4_reconnection_hamel.png (page05, 동일)
    frames/F5_curiosity_hamel.png    (curiosity_topaz_base01)
    resonance.json
    attraction.json
  W3/
    frames/F1_pause_cafe.png         (07_pause_sapphire)
    frames/F2_afterflow_cafe.png     (page05, 동일)
    frames/F3_calm_cafe.png          (08_calm_sapphire)
    frames/F4_reconnection_hamel.png (page05, 동일)
    frames/F5_calm_hamel.png         (calm_emerald_base01)
    resonance.json
    attraction.json
```

총 파일: 15개 이미지 + 6개 JSON + 1개 gravity-engine.json + 1개 preview.html

---

## 핵심 발견

### 1. 보석 팔레트가 감정 번역의 핵심 변수

같은 `pause` 감정이 W1(citrine)에서는 따뜻한 위안으로, W3(sapphire)에서는 차분한 회복으로 번역된다. 구조는 동일하지만 팔레트가 완전히 다른 감정 온도를 만든다.

### 2. 결심형은 구조가 다르다

W1/W3는 `pause→…→hope/calm`로 선형 상승하지만, W2는 `curiosity→…→curiosity`로 **순환**한다. 결심은 "희망 달성"이 아니라 "열린 에너지의 유지"라는 감정 구조.

### 3. F2/F4 page05 공유는 설계된 연속성

세 소원 모두 동일한 F2/F4를 사용한다. 이 공유는 "DreamTown의 시공간적 연속성" — 소원의 종류와 무관하게 여수 카페와 하멜전시관은 모든 소원이 지나가는 공간이다.

### 4. render_mode는 채널 번역, 감정 번역이 아님

resonance/attraction의 차이는 타이밍과 채널 의도만 다를 뿐, 감정 중력 · 자산 · 카피는 동일하다. **같은 감정을 다른 채널에서 다르게 전달하는 것** — 감정을 바꾸는 것이 아님.

---

## 다음 단계

```
1. [READY] W1-v3 + W1-S 승인 시 W2/W3 resonance 빌드
   → gravity-engine.json이 W2/W3 sequence.json 생성 기준

2. [NEXT] assemble-miracle-video.js 구현
   → sequence.json (resonance 또는 attraction) → FFmpeg 파이프라인
   → gravity-engine.json + sequence.json → 실제 영상 조립

3. [LATER] wish_type 자동 분류
   → 소원 텍스트 입력 → gravity_engine keywords match → type 결정
   → 현재: 수동 / 다음: 간단한 keyword matching 함수

4. [LATER] 추가 유형 설계
   → 성장형 / 관계형 / 평온형 등 추가 wish_type
   → gravity-engine.json에 새 유형 추가만으로 확장 가능
```

---

## 참조

| 항목 | 경로 |
|------|------|
| gravity-engine.json | `outputs/wish-render-prototype/gravity-engine.json` |
| preview.html | `outputs/wish-render-prototype/preview.html` |
| W1 resonance 승인본 | `outputs/resonance-preview/W1-v3/` |
| W1 attraction 참조 | `outputs/attraction-preview/W1-S/` |
| 카피 SSOT | `docs/ssot/dreamtown-postcard-emotion-copy-ssot.md` |
| page05 DoD | `config/storybook/page05.json` |
| Micro Resonance 철학 | `docs/reports/FIRST_RESONANCE_FLOW_PROTOTYPE.md` |
