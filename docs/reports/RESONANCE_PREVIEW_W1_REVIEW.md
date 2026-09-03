# RESONANCE_PREVIEW_W1_REVIEW.md

> 작성일: 2026-05-22  
> 검수 대상: `outputs/resonance-preview/W1/preview.html`  
> 기준 SSOT: `MEDIA-CHAN-002` / `dreamtown-postcard-emotion-copy-ssot.md` / `config/storybook/page05.json`  
> 상태: **검수 완료 — 수정 후보 분리**  
> 이미지 생성: 금지  
> 영상 렌더링: 금지

---

## 검수 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| Frame Order | ✅ 통과 | SSOT 감정 순서 준수 |
| Subtitle Tone | ❌ **MUST** | F1 자막 SSOT 이중 위반 |
| Duration | ⚠️ SHOULD | 80초 — 5-frame 구조 대비 pacing 과다 (권장 25–35초) |
| Motion Plan | ⚠️ SHOULD | F4 속도 0.2x / 방향 불일치 |
| Sound Cue | ✅ 통과 (-22dB ≤ -20dB 기준) | 파일 소스 미정 (LATER) |
| DreamTown Continuity | ⚠️ SHOULD | page05 프레임 실물 검수 미완 |

**블로커 1건 / SHOULD 4건 / LATER 4건**

---

## 1. Frame Order

### 평가: ✅ 통과

| # | 파일 | 감정 | 위치 | SSOT 순서 |
|---|------|------|------|-----------|
| F1 | F1_pause_cafe.png | pause | 카페 | 2번째 ✅ |
| F2 | F2_afterflow_cafe.png | emotional_afterflow | 카페 | page05 여운 ✅ |
| F3 | F3_calm_cafe.png | calm | 카페 | 3번째 ✅ |
| F4 | F4_reconnection_hamel.png | reality_reconnection | 하멜 | page05 재연결 ✅ |
| F5 | F5_fragile_hope_hamel.png | fragile_hope | 하멜 | 5번째 ✅ |

`MEDIA-CHAN-002 §4 emotion_sequence: confusion → pause → calm → curiosity → fragile_hope`

W1은 pause → calm → fragile_hope 부분집합 선택 — 순서 이탈 없음.  
page05 프레임(F2, F4)이 감정 사이 완충제 역할 수행 — 구조 적합.

**카페(F1–F3) → 하멜(F4–F5) 장소 전환**: F3→F4 cross-dissolve 단일 신호. 실제 렌더 전 판단 보류 → LATER §7 참조.

---

## 2. Subtitle Tone

### 평가: ❌ MUST — F1 자막 SSOT 이중 위반

#### 위반 1: postcard-emotion-copy-ssot.md 미등록 문장

```
F1 자막: "지쳐도 괜찮아요"
```

`dreamtown-postcard-emotion-copy-ssot.md` copy #1–20 전수 확인 — **해당 문장 없음**.

SSOT 원칙: `subtitle source: dreamtown-postcard-emotion-copy-ssot.md`  
SSOT 외 임의 작성 문장 사용 금지.

#### 위반 2: 톤 금지 원칙 위반

```
dreamtown-postcard-emotion-copy-ssot.md §톤 기준:
  위로 ❌
```

"지쳐도 괜찮아요" = 위로형 문장. 명시 금지 톤에 해당.

---

#### 교체 후보 (pause 감정 맥락)

| copy # | 문장 | 판단 |
|--------|------|------|
| #9 | 오늘의 마음을 이 밤에 남겨둘게요 | **권장** — 멈춤/잔류 감각, 위로 없음 |
| #10 | 조용한 바다 위로 작은 별 하나 | 차선 — 정경 묘사, 직접 언급 없음 |
| #5 | 오늘의 바람이 조용히 닿았어요 | 차선 — 접촉 감각, 부드러움 |

**권장: copy #9** — pause 감정의 "멈추고 오늘을 남겨둔다" 맥락과 가장 일치.

---

#### F3 / F5 확인

| 프레임 | 자막 | copy # | 상태 |
|--------|------|--------|------|
| F3 | 마음이 조금 가벼워졌다면 좋겠어요 | #11 | ✅ SSOT 등록 확인 |
| F5 | 작은 소원 하나가 밤하늘에 남았어요 | #2 | ✅ SSOT 등록 확인 |

---

## 3. Duration

### 평가: ⚠️ SHOULD — 5-frame 구조 대비 pacing 과다

**DreamTown Resonance 핵심 철학**

```yaml
DreamTown:
  not_long_attention
  but_long_emotional_residue
```

Resonance는 오래 붙잡는 것이 목적이 아니다.  
짧지만 오래 남는 감정 잔향이 목적이다.

---

**현재 W1 분류: Micro Resonance**

```yaml
duration_model: Micro Resonance
target:         20–35초
frame_count:    5
```

| 모드 | 기준 | 상태 |
|------|------|------|
| **Micro Resonance** | **20–35초** | **현재 기본형** |
| Attraction Shorts | 15–25초 | hook / save / share |
| Deep Resonance | 60–120초 | future expansion only — MVP 적용 금지 |

---

**현재 W1 pacing 진단**

| 프레임 | 현재 | 권장 | |
|--------|------|------|---|
| F1 | 15초 | 5초 | 과다 |
| F2 | 15초 | 5초 | 과다 |
| F3 | 15초 | 5초 | 과다 |
| F4 | 15초 | 5초 | 과다 |
| F5 | 20초 | 7–10초 | 과다 |
| **합계** | **80초** | **27–35초** | **과다** |

---

**"breathing"은 duration 증가가 아니다**

```yaml
해결 방식:
  pause_density:    자막 없는 F2/F4 유지 ✅ (이미 적용)
  subtitle_spacing: fade-in +2s 유지 ✅ (이미 적용)
  motion_restraint: 0.3x 이하 Ken Burns 유지 ✅ (이미 적용)

잘못된 해결:
  duration 늘리기 ❌
```

호흡은 프레임을 길게 늘리는 것이 아니라 밀도로 조절한다.

---

## 4. Motion Plan

### 평가: ⚠️ SHOULD — 속도 미달 + 방향 불일치

#### SHOULD-1: F4 모션 속도 0.2x

```
MEDIA-CHAN-002 §8 motion_rules:
  resonance: "0.3–0.5x, Ken Burns 또는 정적"

F4 현재: pan 0.2x
→ SSOT 하한 0.3x 미만
```

수정: 0.2x → 0.3x

#### SHOULD-2: F4 pan 방향 불일치

```
sequence.json:   "direction": "left_to_right"
preview.html:    "pan ←"  (← = 오른쪽→왼쪽, right_to_left)
```

`FIRST_RESONANCE_FLOW_PROTOTYPE.md` 원문: `"매우 느린 좌→우 pan (0.2x)"` = left_to_right.  
preview.html의 ← 표기가 오기. sequence.json 기준이 정본.

수정: preview.html F4 카드 `pan ←` → `pan → (left_to_right)` 교정.

---

## 5. Sound Cue

### 평가: ✅ 통과

```
MEDIA-CHAN-002 §4 Resonance:
  sound: ambient / soft (-20dB 이하)

W1 설계: -22dB 바다 파도 앰비언트
→ -20dB 기준 충족 ✅

fade-in: F1+2s ✅
fade-out: F5 종료 3s 전 ✅
```

**LATER 항목**: 실제 오디오 파일 소스 / 라이선스 / 파일 경로 미지정 → LATER §8 참조.

---

## 6. DreamTown Continuity

### 평가: ⚠️ SHOULD — page05 프레임 실물 검수 미완

#### ✅ 기존 자산 기반 항목 (확인 완료)

- Sowoni 포즈 기준 (`page05.json` 확인):
  - 카페: `seated at window table, back view` ✅
  - 하멜: `standing at harbor edge, back view` ✅
- 신규 AI 생성: 0건 ✅
- 감정 좌표 이탈: 없음 ✅
- CTA / 훅: 없음 ✅
- 총 길이 7분 초과: 없음 ✅

#### ⚠️ 실물 검수 미완 항목

**F2 cafe_page05_emotional_afterflow_base.png**  
→ page05.json DoD: `pause/inner quiet 필수`  
→ 실제 이미지에서 Sowoni 뒷모습 / 창가 착석 포즈 육안 확인 필요

**F4 hamel_page05_reality_reconnection_base.png**  
→ page05.json DoD: `red lighthouse + star 필수 — 두 요소 모두 반드시 존재`  
→ reality_reconnection 프레임에서 red lighthouse + star 두 요소 포함 여부 육안 확인 필요

두 파일 모두 기존 자산(git tracked)이나, preview.html이 이미지를 표시하므로 **브라우저에서 열어 직접 확인** 가능.

---

## 수정 후보 통합

### MUST — 영상 조립 전 필수 수정 (1건)

| # | 항목 | 위반 SSOT | 수정 내용 |
|---|------|-----------|----------|
| M1 | **F1 자막 교체** | postcard-emotion-copy-ssot.md (미등록 + 위로 금지) | "지쳐도 괜찮아요" → copy #9 "오늘의 마음을 이 밤에 남겨둘게요" |

---

### SHOULD — 조립 전 수정 권장 (4건)

| # | 항목 | 내용 | 수정 위치 |
|---|------|------|----------|
| S1 | **F4 모션 속도** | 0.2x → 0.3x | `sequence.json`, `preview.html` |
| S2 | **F4 pan 방향 불일치** | preview.html `←` → `→` (left_to_right) 교정 | `preview.html` |
| S3 | **page05 프레임 실물 검수** | F2 / F4 이미지 브라우저 직접 확인 — 뒷모습 포즈 + hamel DoD(lighthouse+star) | 육안 검수 |
| S4 | **pacing 조정** | 각 프레임 시간 단축 — F1–F4: 15s→5s, F5: 20s→7–10s (총 80s→27–35s) | `sequence.json`, `preview.html`, `FIRST_RESONANCE_FLOW_PROTOTYPE.md` |

---

### LATER — 다음 이터레이션 검토 (4건)

| # | 항목 | 내용 |
|---|------|------|
| L1 | **카페→하멜 장소 전환 신호** | F3→F4 cross-dissolve만으로 장소 인식 충분한지 — 실제 렌더 후 판단 |
| L2 | **사운드 파일 소스 미정** | 바다 파도 앰비언트 실제 파일 경로 / 라이선스 / 볼륨 정규화 |
| L3 | **hamel DoD 현장 검수** | F4 hamel_reality_reconnection에 red lighthouse + star 육안 확인 (S3와 연계) |
| L4 | **W2/W3 동일 구조 적용** | W1 MUST 수정 확정 후 W2/W3 프레임 설계에 동일 기준 반영 |

---

## 다음 단계 제안 (우선순위)

```
1. M1 — F1 자막 교체 (sequence.json + preview.html)
   "지쳐도 괜찮아요" → "오늘의 마음을 이 밤에 남겨둘게요" (copy #9)

2. S4 — pacing 조정 (FIRST_RESONANCE_FLOW_PROTOTYPE.md + sequence.json)
   F1–F4: 15s → 5s / F5: 20s → 7–10s (목표 27–35초)

3. S1+S2 — F4 모션 속도 0.3x + pan 방향 동기화 (sequence.json + preview.html)

4. S3 — preview.html 브라우저 열기 → F2/F4 프레임 실물 확인
```

---

## 참조 문서

| 문서 | 경로 | 참조 목적 |
|------|------|----------|
| Channel Rendering Rules | `docs/ssot/media/DreamTown_Channel_Rendering_Rules_SSOT.md` | Resonance duration/motion/sound 기준 |
| Postcard Copy SSOT | `docs/ssot/dreamtown-postcard-emotion-copy-ssot.md` | 자막 출처 및 톤 기준 |
| Page05 Config | `config/storybook/page05.json` | 장소별 DoD, Sowoni 포즈 |
| W1 Prototype | `docs/reports/FIRST_RESONANCE_FLOW_PROTOTYPE.md` | 원본 설계 문서 |
| W1 Preview | `outputs/resonance-preview/W1/preview.html` | 검수 대상 |
| W1 Sequence | `outputs/resonance-preview/W1/sequence.json` | 프레임 메타데이터 정본 |
