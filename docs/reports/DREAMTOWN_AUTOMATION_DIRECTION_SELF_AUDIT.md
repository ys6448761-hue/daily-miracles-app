# DREAMTOWN_AUTOMATION_DIRECTION_SELF_AUDIT.md

> 작성일: 2026-05-22  
> 대상: 2026-05-16 이후 Emotional Translation / Media Rendering 작업 전체  
> 기준: "여수 오리진 기반 자동 스토리북·기적영상·홍보영상 생성"  
> commit 금지

---

## 평가 대상 작업 목록 (이번 세션 체인)

| 순서 | 작업 | 산출물 | 역할 |
|------|------|--------|------|
| 1 | Asset Governance | air-engine SSOT 6개 | 이미지 재사용 원칙 고정 |
| 2 | Media Architecture | Micro Resonance / Attraction Shorts 스펙 | 두 채널 렌더 규격 정의 |
| 3 | Resonance Preview W1 → v3 | sequence.json × 3 + preview.html × 3 | 위로형 소원 30초 렌더 검증 |
| 4 | Attraction Preview W1-S | sequence.json + preview.html | 위로형 소원 21초 쇼츠 검증 |
| 5 | Wish-to-Render Prototype | W1/W2/W3 × resonance+attraction = 6 시퀀스 | 3 wish_type 파이프라인 검증 |
| 6 | Gravity Interpreter Prototype | interpreter-rules.json + 12-wish corpus | 12개 소원 규칙 기반 분류 검증 |
| 7 | Emotional Translation SSOT | EMOT-TRANS-001 (280줄) | 번역 규칙 정본 확립 |

---

## 최초 목표 재확인

```
목표: 여수 오리진 기반 자동 스토리북·기적영상·홍보영상 생성

세부 조건:
- 비용 절감: AI 호출 최소화, 사전 생성 이미지 재사용
- 자산 재사용: 기존 이미지 → 다중 채널 파생
- 소원별 자동 매칭: wish text → 이미지 선택 자동화
- 스토리북 자동화: wish → 5페이지 스토리북 조립
- 영상 조립 자동화: sequence.json → 렌더링 실행
- 홍보용 채널 확장: YouTube 롱폼 + Shorts 쇼츠 양쪽
```

---

## 4분류 평가

### ✅ ON TRACK

**1. 비용 절감 — 사전 생성 이미지 재사용 구조**

wish-to-render 프로토타입이 신규 AI 이미지 없이 기존 자산만으로 6개 시퀀스를 완성했다.  
gravity-palette 매핑이 완성됐으므로, `assemble-miracle-video.js`가 DALL-E 3 없이 star-cache 이미지만으로 렌더링 결정을 내릴 수 있는 이론적 기반이 갖춰진 상태.

**2. 소원별 자동 매칭 — 규칙 엔진 완성**

```
wish_text → keyword scoring → wish_type tiebreak → primary_gravity
         → gem_palette + location + pacing + render_fit
```

이 파이프라인의 모든 단계가 `interpreter-rules.json`에 정의됐다.  
LLM 없이 keyword matching만으로 12/12 소원 처리 완료 (tiebreak 3건 포함).

**3. 두 채널 스펙 확정**

| 채널 | 길이 | 비율 | 자막 offset | 사용 목적 |
|------|------|------|-------------|---------|
| Micro Resonance | 30s | 3:4 | 1.0s | 감정 여운, 스토리북 |
| Attraction Shorts | 21s | 9:16 | 0.3s | 발견, 유입, 쇼츠 |

이 스펙이 없으면 조립 스크립트는 타이밍 기준을 갖지 못한다.  
→ 스펙 존재 = assembler 구현 가능 상태.

**4. sequence.json 포맷 확정**

W1-v3, W1-S, W2/W3 총 6개 sequence.json이 동일한 구조를 사용한다.  
`assemble-miracle-video.js`가 읽을 입력 포맷이 안정화됐다.

---

### ⚠️ DRIFT RISK

**5. W1 3버전 반복 — 검증 루프 길이 문제**

W1(위로형) 단일 소원에 대해 v1 → v2 → v3 → W1-S 순서로 4번 반복했다.  
각 버전이 실제로 다른 이미지와 카피를 사용했으므로 단순 반복은 아니지만,  
**automation 관점에서는 W1 하나의 파이프라인 검증에 너무 많은 시간을 썼다.**

> 위험: W2/W3 위로형 외 wish_type이 아직 v1 수준의 프레임 검증도 안 됐다.

**6. 12개 소원 corpus — 필요 이상의 선제 사양화**

v1 automation에는 3 wish_type × 2 채널 = 6 시퀀스면 충분하다.  
12개 소원 corpus는 미래 v2(종결어미 파싱, 복합 gravity blend)를 위한 기반이지만,  
**지금 단계에서는 실제 코드 없이 분류 규칙만 정교해지는 패턴**이다.

> 위험: 인터프리터가 더 정확해질수록 assembler 없이 "설계만 완성"되는 상태가 고착화.

**7. confusion → fragile_hope 강제 규칙 — 코드 반영 미정**

SSOT에서 명확히 정의했지만, 이 규칙을 실제로 실행하는 코드가 없다.  
문서가 정교해질수록 구현 빚(implementation debt)이 쌓인다.

---

### ❌ MISSING

**8. `assemble-miracle-video.js` — 핵심 부재**

이 세션 체인의 모든 작업이 이 스크립트를 전제로 설계됐지만, 파일이 존재하지 않는다.

```
[현재 상태]
sequence.json → (없음) → 렌더링 결과물

[목표 상태]
sequence.json → assemble-miracle-video.js → HTML5 animation or FFmpeg video
```

있어야 할 것:
- `sequence.json` 읽기
- 각 프레임: 이미지 파일 경로 + duration + ken_burns_speed + subtitle
- 출력: 정적 HTML 애니메이션 (v1) 또는 FFmpeg mp4 (v2)

**9. wish_text → sequence.json 함수 미존재**

interpreter-rules.json이 완성됐지만, 이를 실제로 실행하는 코드가 없다.

```
[현재]
wish_text → (사람이 수동으로 해석) → sequence.json

[필요]
wish_text → interpretGravity(text) → sequence.json → assemble()
```

`interpretGravity()` 함수 = 12개 키워드 가중합 + tiebreak 적용 + sequence template 선택.  
구현 난이도: 낮음 (순수 rule-based, 외부 의존성 없음).

**10. videoJobRoutes.js ↔ assembler 연결 없음**

서버에서 "기적영상 생성 요청"을 받아도 실행할 assembler가 없다.  
`videoJobRoutes.js`가 어떤 파이프라인도 트리거하지 못하는 상태.

**11. 오디오 레이어 미정**

모든 sequence.json에 `"music": "ambient_calm"` 같은 참조가 있지만,  
실제 오디오 파일 경로와 음악 선택 기준이 정의된 곳이 없다.  
영상 조립 시 이 필드를 어떻게 처리할지 미결.

---

### ⚡ NEXT ACTION

**즉시 — `interpretGravity(wishText)` 함수 작성**

```javascript
// scripts/video/interpretGravity.js
// inputs:  wish_text (string), wish_type (string, optional)
// outputs: { primary_gravity, secondary_gravity, gem_palette, location, pacing, render_fit }
// method:  keyword scoring from interpreter-rules.json + tiebreak from type_heuristics
```

구현 조건:
- `interpreter-rules.json` 직접 참조 (규칙 파일 이중화 금지)
- LLM 호출 없음
- wish_type 미제공 시 keyword score 상위 gravity로 type 추정 후 tiebreak

**즉시 — `buildSequence(gravityResult, wishText)` 함수 작성**

gravity 결과 + wish_text → 5프레임 sequence.json 자동 생성.  
자막은 카피 SSOT에서 gravity별 기본 세트 선택.

**이번 주 내 — `assemble-miracle-video.js` v1 (HTML5)**

FFmpeg 불필요한 정적 HTML 애니메이션 버전.
- `sequence.json` 읽기
- 5개 이미지 + ken_burns CSS animation
- 자막 fade-in timing
- 출력: `outputs/assembled/{wish_id}/preview.html`

---

## 핵심 판단

### "지금 깊게 파는 것이 자동화에 도움이 되는가?"

**대답: 이 세션 이전까지는 YES, 이 시점부터는 NO.**

지금까지 완성된 것:
- EMOT-TRANS-001 (번역 규칙 정본)
- interpreter-rules.json (실행 가능한 keyword → gravity 매핑)
- sequence.json 포맷 (6개 검증 완료)
- 두 채널 타이밍 스펙 (30s/21s, 비율, offset)

이것으로 `assemble-miracle-video.js` v1을 짜는 데 필요한 스펙은 **이미 충분하다.**

만약 지금 추가 사양 작업(종결어미 파싱, 복합 gravity, v2 corpus 확장)을 계속하면:
```
설계 ↑ / 구현 ↓ = 무기한 prototype 상태
```
이 패턴이 지금 가장 큰 위험이다.

---

### "어디서 멈추고 실제 결과물 검증으로 돌아가야 하는가?"

**지금 멈춰야 한다.**

구체적 기준:

| 상태 | 판단 |
|------|------|
| EMOT-TRANS-001 STATUS: Review | → 추가 정의 없이 CEO 검토 대기 |
| interpreter-rules.json v1 | → 종결어미/복합 blend는 v1.1 이후. 지금은 구현 우선 |
| W1-v3 approved | → 더 이상의 resonance preview 반복 없음 |
| 12 corpus 분류 완료 | → 분류 정확도 개선은 구현 이후 |

**다음 검증 대상은 HTML이 아니라 실행 가능한 파이프라인이다.**

```
목표 검증 시나리오:
1. "지쳐있는 나를 보듬어주고 싶어요" (위로형 W01)
2. interpretGravity("지쳐있는 나를 보듬어주고 싶어요")
   → primary: pause, gem: citrine, location: cafe, pacing: slow
3. buildSequence(result, text)
   → W1-v3 sequence.json 자동 생성 (기존 수동 작업과 동일 결과)
4. assemble(sequence.json)
   → outputs/assembled/W01/preview.html 생성

이 4단계가 자동으로 실행되면 자동화 목표의 핵심 루프 달성.
```

---

## 구조 요약

```
완성된 레이어 (설계)
┌─────────────────────────────────────────────────┐
│ EMOT-TRANS-001  →  interpreter-rules.json       │
│ sequence.json format  →  two-channel spec       │
│ 76 canonical images  →  asset registry          │
└─────────────────────────────────────────────────┘
                    ↓ 연결 미완성
비어있는 레이어 (실행)
┌─────────────────────────────────────────────────┐
│ interpretGravity()   → 미구현                    │
│ buildSequence()      → 미구현                    │
│ assemble-miracle-video.js  → 미구현              │
│ videoJobRoutes.js 트리거  → 미연결               │
└─────────────────────────────────────────────────┘
```

**설계 레이어는 완성됐다. 실행 레이어가 비어 있다.**  
이 간극을 좁히는 것이 다음 작업의 전부다.

---

## 연관 문서

| 문서 | 경로 |
|------|------|
| 이전 정렬 감사 | `docs/reports/DREAMTOWN_PLAN_ALIGNMENT_AUDIT.md` |
| 번역 SSOT | `docs/ssot/emotion/DreamTown_Emotional_Translation_SSOT.md` |
| 인터프리터 규칙 | `outputs/gravity-interpreter/interpreter-rules.json` |
| W1-v3 최종 검수 | `docs/reports/RESONANCE_W1_V3_FINAL_REVIEW.md` |
| 파이프라인 설계 | `docs/ssot/air-engine/05_DERIVATION_PIPELINE.md` |
| 출력 전략 | `docs/ssot/air-engine/06_OUTPUT_STRATEGY.md` |
