# DreamTown Emotional Translation SSOT

**문서 코드**: EMOT-TRANS-001  
**Version**: v1.0  
**Owner**: Aurora5  
**Status**: Review — CEO 확인 후 Confirmed 전환  
**작성일**: 2026-05-22  
**상위 SSOT**: `docs/ssot/constitution/UNFINISHED_TIME.md` · `docs/ssot/core/DreamTown_Core_Philosophy_SSOT.md`  
**근거 프로토타입**: `docs/reports/EMOTIONAL_GRAVITY_INTERPRETER_V1.md`

---

## 읽기 전 필수

이 문서는 **소원 문장을 DreamTown 영상 경험으로 번역하는 규칙**을 정의한다.  
영상 제작 · 렌더 파이프라인 · 시퀀스 생성 코드 작업 전 반드시 읽는다.

> **핵심 명제**  
> gravity는 감정 라벨이 아니다.  
> gravity는 어떤 장면을, 어떤 보석으로, 어떤 속도로, 어떤 채널로 렌더링할지 결정하는 **DreamTown 장면 물리값**이다.

---

## 1. 5대 핵심 원칙

### 1-1. wish_text → wish_type → gravity 2단계 구조

소원 텍스트를 바로 gravity로 해석하지 않는다.  
**반드시 wish_type을 먼저 분류한 뒤, wish_type의 tiebreak 규칙을 적용해 gravity를 확정한다.**

```
[1단계] wish_text
  → keyword scoring (각 키워드 × weight 합산)
  → 최고점 gravity 2–3개 후보 추출

[2단계] wish_type 확인
  → tiebreak_favor (gravity 동점 시 wish_type이 우선순위 결정)
  → primary_gravity 확정
```

이 순서를 건너뛰면 동점 케이스(전체의 약 25%)에서 오분류가 발생한다.

**wish_type과 gravity tiebreak 대응:**

| wish_type | tiebreak_favor | 이유 |
|-----------|---------------|------|
| 위로형 | pause | 위로 = 지금 멈춰야 하는 상태 |
| 결심형 | curiosity | 결심 = 새로운 에너지로의 진입 |
| 회복형 | calm | 회복의 목적지는 calm (현재 상태가 아닌 원하는 상태) |
| 관계형 | reality_reconnection | 관계 = 연결 욕구 |
| 불안형 | confusion | 불안 = 혼란 상태 |
| 희망형 | fragile_hope | 희망 = 조심스러운 작은 믿음 |

---

### 1-2. 종결어미/말끝이 gravity 강도와 방향에 영향을 준다

keyword 점수가 같아도 **종결어미의 성질**이 gravity 해석을 분기한다.

| 종결어미 패턴 | gravity 영향 | 예시 |
|-------------|------------|------|
| `~것 같아요` | fragile_hope 강화 (유보적 확신) | "꼭 해낼 수 있을 것 같아요" |
| `~고 싶어요` | 욕구형 — 관련 gravity 1.0× | "시작해보고 싶어요" |
| `~바라요` / `~면 좋겠어요` | fragile_hope 강화 (조용한 소망) | "나아지길 바라요" |
| `~거예요` / `~될 거예요` | curiosity 보정 +1 (미래 그림) | "나은 내가 되어있을 거예요" |
| `~해요` / `~이에요` (현재 진술) | pause 또는 confusion 강화 | "너무 힘들었어요" |
| `~막막해요` / `~해요` (상태 진술) | confusion 강화 | "앞날이 막막해요" |

**미래 시제 신호** (`내년`, `언젠가`, `될 거예요`, `되어있을`):
- curiosity +1 보정 / fragile_hope +1 보정
- 적극적 미래 그림 → attraction_fit +10~15

---

### 1-3. confusion primary는 resonance first

confusion이 primary_gravity인 소원은 **attraction 렌더링을 권장하지 않는다**.

```
confusion primary_gravity
  → resonance_fit: 88–92
  → attraction_fit: 25–35  ← 비권장
  → 이유: 혼란은 공간(시간)이 필요.
           attraction의 21초 pacing은 confusion을 압축하여
           감정 과부하 발생 위험
```

attraction이 절대 불가한 것은 아니지만, 명시적 사용자 요청이 없는 한 resonance를 기본으로 배정한다.

---

### 1-4. confusion은 confusion으로 끝내지 않는다 — F5 fragile_hope 강제

confusion primary_gravity 소원의 **F5(마지막 프레임)는 반드시 fragile_hope 감정으로 마감**한다.

```
confusion primary
  → F1: confusion (moonstone gem)
  → F2: emotional_afterflow (breathing gap, page05)
  → F3: calm
  → F4: reality_reconnection (breathing gap, page05)
  → F5: fragile_hope (diamond gem) ← 강제
```

이 규칙의 근거: DreamTown은 감정의 착취 없이 작은 빛을 남기는 서비스다 (`NO_EMOTIONAL_ADDICTION.md`).  
혼란으로 시작하더라도 작은 희망의 흔적이 마지막 장면에 반드시 존재해야 한다.

---

### 1-5. gravity는 DreamTown 장면 물리값이다

gravity는 "이 소원이 슬프다" 같은 **감정 라벨이 아니다**.  
gravity는 다음 4가지 물리값을 동시에 결정하는 **렌더 파라미터**다.

```
gravity → {
  gem_palette    (어떤 보석 색으로 렌더링하는가),
  lead_location  (카페/하멜/케이블카/호텔 중 어디서 시작하는가),
  pacing         (프레임 속도, 자막 offset, dissolve 길이),
  render_fit     (resonance / attraction 중 어느 채널에 더 적합한가)
}
```

"gravity = 감정 설명서"가 아니라 "gravity = 4중 물리값 묶음"으로 다뤄야 한다.

---

## 2. 7가지 Gravity Type 정의

| gravity | 한국어 의미 | DreamTown 장면 성질 | F5 가능 여부 |
|---------|-----------|---------------------|------------|
| `pause` | 멈춤 · 정지 | 지쳐서 움직이지 못하는 순간. 실내 warmth가 안전을 제공 | ✓ (→ calm/fragile_hope로 마감) |
| `emotional_afterflow` | 감정 여운 | 감정이 흘러간 뒤 남은 조용한 흔적. **F2/F4 전용, primary 불가** | ✗ |
| `calm` | 고요 · 안착 | 회복 또는 이완이 완성된 상태. 내부와 외부 모두 안정 | ✓ |
| `curiosity` | 호기심 · 설레임 | 새로운 가능성을 향해 열린 에너지. 전진하는 방향감 | ✓ |
| `fragile_hope` | 작고 조심스러운 희망 | 아직 이루어지지 않은, 그러나 존재하는 작은 빛. **F5 기본 마감** | ✓ (선호) |
| `reality_reconnection` | 현실 재연결 | 감정 처리 후 현실로 돌아오는 착지. **F4 전용** | ✗ |
| `confusion` | 혼란 · 불확실 | 방향을 모르는 상태. 안전한 공간에서의 처리가 필요 | ✗ (F5는 fragile_hope 강제) |

> `emotional_afterflow`와 `reality_reconnection`은 소원 텍스트의 primary gravity가 될 수 없다.  
> 두 gravity는 항상 구조적 역할(F2 breathing gap / F4 breathing gap)을 담당한다.

---

## 3. Gravity → 물리값 매핑

### 3-1. Gem Palette

| gravity | cafe gem | hamel gem | 색감 의미 |
|---------|---------|-----------|---------|
| pause | citrine | sapphire or diamond | 따뜻한 멈춤 → 차분한 전환 |
| calm | sapphire | emerald | 차분한 청색 → 싱그러운 회복 |
| curiosity | citrine | topaz | 따뜻한 설레임 → 탐구 에너지 |
| fragile_hope | diamond | diamond | 맑고 투명한 작은 빛 |
| confusion | moonstone | moonstone | 희뿌연 불확실성 |

> **보석 혼합 금지**: 같은 프레임에서 두 보석의 색을 혼합하지 않는다.  
> **hamel gem 우선**: F5 마감 장면은 hamel gem을 적용한다.

### 3-2. Lead Location

| gravity | 1차 장소 | 이유 |
|---------|---------|------|
| pause | cafe | 실내 따뜻함이 멈춤과 안전을 제공 |
| calm | cafe → hamel | 실내 고요 → 야외 고요로 확장 |
| curiosity | cafe → hamel | 내면(cafe) → 지평선(hamel)으로 에너지 발산 |
| fragile_hope | hamel | 항구 밤하늘 = 작은 희망의 자연 배경 |
| reality_reconnection | hamel | page05 자산 고정. 등대 = 방향 신호 |
| confusion | cafe | 안전한 실내에서 혼란을 처리 |

### 3-3. Pacing

| gravity | resonance pacing | attraction pacing |
|---------|-----------------|------------------|
| pause | very slow (F1–F4: 5s, F5: 10s) | slow (F1: 4s, F2–F4: 3s, F5: 8s) |
| calm | slow | medium-slow |
| curiosity | medium | medium-fast |
| fragile_hope | slow (F5 최소 8s 확보) | medium |
| confusion | **very slow** (breathing gap 최대화) | **비권장** |

### 3-4. Render Fit

| gravity | resonance | attraction | 비고 |
|---------|-----------|------------|------|
| pause | 90 | 50 | 긴 정적 필요 |
| emotional_afterflow | 85 | 48 | 여운은 속도와 반비례 |
| calm | 82 | 65 | attraction 가능, F5 길이 확보 필요 |
| curiosity | 72 | 85 | 에너지는 짧은 화면에서 더 강하게 |
| fragile_hope | 85 | 65 | fragile = 여유 필요 |
| reality_reconnection | 78 | 72 | 장소 전환 서프라이즈는 양 채널 유효 |
| confusion | 92 | 28 | **resonance first 원칙 적용** |

---

## 4. Keyword Scoring 규칙

소원 텍스트에서 키워드를 스캔하여 각 gravity 점수를 합산한다.

```
gravity_score[X] = Σ(matched_keyword_weight)
primary_gravity  = argmax(gravity_score)
secondary_gravity = 2nd highest (score > 0인 경우)
```

**주요 키워드 테이블:**

| gravity | 키워드 | weight |
|---------|-------|--------|
| pause | 지쳐/지친/힘들/쉬고싶/피곤/무거 | 2–3 |
| emotional_afterflow | 보듬/위로/그립/생각나/보고싶 | 2–3 |
| calm | 회복/치유/나아/안정/평온/가벼워 | 2–3 |
| curiosity | 시작/도전/새로운/해보고/설레/변화 | 2–3 |
| fragile_hope | 이루/소원/바라/해낼/나은/좋겠/희망 | 1–3 |
| reality_reconnection | 가까워/연락/다시/만나/돌아/함께 | 1–3 |
| confusion | 불확실/막막/의심/불안/걱정/두려/헷갈 | 2–3 |

> 전체 키워드 목록: `outputs/gravity-interpreter/interpreter-rules.json`

---

## 5. 감정 호(Emotion Arc) 조립 규칙

### 5-1. 5프레임 구조 (Micro Resonance 기준)

```
F1: primary_gravity         ← 소원에서 추출한 감정으로 시작
F2: emotional_afterflow     ← 고정. breathing gap #1. page05
F3: calm                    ← 고정 또는 secondary에서 선택
F4: reality_reconnection    ← 고정. breathing gap #2. page05
F5: fragile_hope (권장)     ← 마감 감정. confusion 시 강제.
```

### 5-2. Hope Curve 방향

| wish_type | 허용 방향 | 금지 |
|-----------|---------|------|
| 위로형/회복형 | 완만한 상승 (0.50→0.62) | 하강 |
| 결심형 | 상승 또는 순환 (0.55→0.70) | 하강 |
| 불안형 | 완만한 상승 (0.48→0.60) | 0.50 미만 마감 |
| 희망형 | 상승 (0.55→0.70+) | 하강 |

> hope_curve의 마지막 값이 첫 값보다 낮으면 렌더링을 중단하고 재검토한다.

---

## 6. 금지 규칙

```
❌ emotional_afterflow와 reality_reconnection을 primary_gravity로 사용하지 않는다
❌ confusion primary 소원에 attraction render를 기본 배정하지 않는다
❌ confusion 소원의 F5를 confusion이나 pause로 끝내지 않는다
❌ wish_type 분류 없이 바로 gravity를 단독으로 추출하지 않는다
❌ hope_curve가 마지막에 하강하는 시퀀스를 승인하지 않는다
❌ gravity를 "이 소원이 슬프다/기쁘다" 같은 감정 라벨로 취급하지 않는다
❌ 신규 gravity 타입을 임의로 추가하지 않는다 (CEO 승인 필요)
```

---

## 7. 연관 문서

| 문서 | 경로 | 관계 |
|------|------|------|
| 헌법 — 미완성의 시간 | `constitution/UNFINISHED_TIME.md` | fragile_hope = weak hope 정의 근거 |
| 헌법 — 감정 의존 금지 | `constitution/NO_EMOTIONAL_ADDICTION.md` | confusion → fragile_hope 마감 근거 |
| 헌법 — 현실 재연결 | `constitution/REALITY_RECONNECTION.md` | F4 reality_reconnection 원칙 근거 |
| 미디어 아키텍처 SSOT | `media/DreamTown_Media_Architecture_SSOT.md` | resonance / attraction 채널 정의 |
| 채널 렌더링 규칙 SSOT | `media/DreamTown_Channel_Rendering_Rules_SSOT.md` | pacing 규격 |
| 소원 시스템 SSOT | `core/DreamTown_Wish_System_SSOT.md` | wish_type 분류 기준 |
| 카피 SSOT | `dreamtown-postcard-emotion-copy-ssot.md` | F1/F3/F5 자막 소스 |
| 인터프리터 규칙 | `outputs/gravity-interpreter/interpreter-rules.json` | keyword 전체 목록 · weight · palette map |
| 프로토타입 보고서 | `docs/reports/EMOTIONAL_GRAVITY_INTERPRETER_V1.md` | 12 wish 실증 결과 |

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-05-22 | 최초 작성 — gravity-interpreter v1 12개 소원 실증에서 승격 |
