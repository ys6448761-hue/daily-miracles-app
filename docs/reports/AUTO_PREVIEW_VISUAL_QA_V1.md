# AUTO_PREVIEW_VISUAL_QA_V1.md

> 작성일: 2026-05-22  
> 검수 대상: auto-preview 3건 (wish_W01_res / wish_W03_att / wish_W09_res)  
> 검수 방법: sequence.json + 이미지 메타데이터 + SSOT 대조 (텍스트 기반 정적 분석)  
> commit 금지

---

## 한계 명시

이 검수는 **sequence.json 기반 텍스트 정적 분석**이다.  
실제 브라우저 렌더링(폰트 렌더링, 레이아웃 픽셀, 이미지 실제 표시, 애니메이션 타이밍)은 **CEO/운영자 직접 육안 확인 필요**.

```
확인 방법:
cd C:\DEV\daily-miracles-mvp
python -m http.server 8080
# → http://localhost:8080/outputs/auto-preview/wish_W01_res/preview.html
```

---

## 검수 결과 요약

| 소원 | 자막-이미지 | gravity 적합성 | arc 자연스러움 | 렌더 차이 | confusion override | 종합 |
|------|-----------|----------------|--------------|-----------|-------------------|------|
| W01 위로형/resonance | ✅ | ✅ | ✅ | — | — | **PASS** |
| W03 결심형/attraction | ✅ | ✅ | ✅ | ✅ | — | **PASS (SHOULD 1)** |
| W09 불안형/resonance | ⚠️ F1 | ⚠️ F1 이미지 | ✅ | — | ✅ | **PASS (SHOULD 2)** |

---

## W01 — 위로형 / resonance_personal

**입력**: "지쳐있는 나를 보듬어주고 싶어요"  
**출처 프레임셋**: wish-render-prototype/W1

### Frame 검수

| Frame | 이미지 | 자막 | 판단 |
|-------|--------|------|------|
| F1 (0–5s) | 심야 카페 창가, 별 우측 상단 (pause/citrine) | "오늘의 마음을 이 밤에 남겨둘게요" | ✅ "이 밤에" = 밤 이미지 일치 |
| F2 (5–10s) | 착석 뒷모습, 커피컵, 창 너머 별 (page05) | 없음 (breathing gap) | ✅ |
| F3 (10–15s) | 이완된 자세, 호박색 카페 (calm/citrine) | "마음이 조금 가벼워졌다면 좋겠어요" | ✅ "조금…면 좋겠어요" = 조건형. 이완 이미지와 일치 |
| F4 (15–20s) | 하멜 page05, 빨간 등대 + 별 (page05) | 없음 (breathing gap) | ✅ |
| F5 (20–30s) | 어두운 밤 항구, 수면 불빛 반사, Sowoni 실루엣 (fragile_hope/diamond) | "작은 소원 하나가 밤하늘에 남았어요" | ✅ "밤하늘" = 밤 항구 이미지 완전 일치 (v3 수동 수정 효과) |

### Gravity 해석 적합성

```
"지쳐있는" → pause +3 (지쳐 키워드)
"보듬어주고 싶어요" → emotional_afterflow +3 (보듬 키워드)
→ primary: pause (단독 최고점)
→ wish_type: 위로형
```

✅ "지쳐있는 나" = 멈춤 필요 상태. pause → cafe 실내 안전이 적합.  
✅ F5 fragile_hope/diamond/hamel = 작고 조용한 희망으로 마무리.

### Resonance 모드 파라미터

| 항목 | 값 | 기준 | 판단 |
|------|-----|------|------|
| total_sec | 30s | 30s | ✅ |
| F1–F4 duration | 5s each | 5s each | ✅ |
| F5 duration | 10s | 10s | ✅ |
| breathing_gap_ratio | 40% (F2+F4 = 10/25s) | 40% | ✅ |
| subtitle_opacity | 0.7 | 0.7 | ✅ |
| subtitle_weight | thin | thin | ✅ |
| ratio | 3:4 | 3:4 | ✅ |
| subtitle_offset | 1.0s | 1.0s | ✅ |

### 결론

**PASS — 전항목 이상 없음.**  
W1-v3 수동 검수 결과와 자막·이미지·아크·타이밍 모두 일치.  
자막-이미지 충돌 0건.

---

## W03 — 결심형 / attraction_social

**입력**: "새로운 일을 시작해보고 싶어요"  
**출처 프레임셋**: wish-render-prototype/W2

### Frame 검수

| Frame | 이미지 | 자막 | 판단 |
|-------|--------|------|------|
| F1 (0–4s) | curiosity/citrine 카페 | "오늘의 용기를 별에 담아두었어요" (#13) | ⚠️ SHOULD — 아래 설명 |
| F2 (4–7s) | cafe page05 | 없음 (breathing gap) | ✅ |
| F3 (7–10s) | calm/citrine 카페 | "조금은 믿고 싶어졌어요" (#6) | ✅ calm 이미지 + 조건형 믿음 = 자연스러운 중간 전환 |
| F4 (10–13s) | hamel page05 | 없음 (breathing gap) | ✅ |
| F5 (13–21s) | curiosity/topaz 하멜 | "작은 빛 하나가 길이 되어줄 거예요" (#17) | ✅ topaz 하멜 (항구 지평선) + 미래 시제 = 결심형 마무리 적합 |

### SHOULD — F1 copy 어조 강도 경미한 불일치

```
wish_text: "새로운 일을 시작해보고 싶어요"
  → "해보고 싶어요" = 조심스러운 탐색 (fragile curiosity)

F1 copy #13: "오늘의 용기를 별에 담아두었어요"
  → "용기" = 이미 결단한 듯한 선언 어조
```

**현상**: 소원자는 "해보고 싶은" 희망 단계인데, F1 자막이 "용기를 담아두었어요"라고 완료형으로 표현.  
**위험도**: 낮음. 주제적으로 틀리지 않음(새로운 일 시작 = 용기 필요).  
**권장**: 결심형 F1 전용 copy 추가 시 "새로운 마음을 별에 담아두었어요" 또는 "오늘 첫 발걸음을 별에 담아두었어요" 검토. 현재 SSOT copy 내에서 대안 없음 → v1 허용.

### Attraction 모드 파라미터

| 항목 | 값 | 기준 | 판단 |
|------|-----|------|------|
| total_sec | 21s | 21s | ✅ |
| F1 duration | 4s | 4s | ✅ |
| F2–F4 duration | 3s each | 3s each | ✅ |
| F5 duration | 8s | 8s | ✅ |
| breathing_gap_ratio | 28.6% (6/21s) | 28.5% | ✅ |
| subtitle_opacity | 0.9 | 0.9 | ✅ |
| subtitle_weight | regular | regular | ✅ |
| ratio | 9:16 | 9:16 | ✅ |
| subtitle_offset | 0.3s | 0.3s | ✅ |

### Resonance vs Attraction 렌더 차이 명확성

W01(resonance) vs W03(attraction) 비교:

| 파라미터 | W01 resonance | W03 attraction | 차이 |
|---------|--------------|---------------|------|
| total_sec | 30s | 21s | −30% |
| F2–F4 각 duration | 5s | 3s | −40% |
| subtitle_offset | 1.0s | 0.3s | ×3 빠름 |
| subtitle_opacity | 0.7 | 0.9 | +29% 진함 |
| subtitle_weight | thin | regular | 굵기 변화 |
| ken_burns_speed | 0.3x | 0.4x | +33% 빠름 |
| ratio | 3:4 | 9:16 | 비율 전환 |

✅ **7개 파라미터 모두 명확히 다름.** 두 채널의 성격(emotional_residue vs save_share_follow) 차이가 타이밍과 시각 무게감으로 명확히 표현됨.

### 결론

**PASS (SHOULD 1건).**  
구조적으로 이상 없음. F1 copy 어조 강도만 v2 copy SSOT 확장 시 조정 권장.

---

## W09 — 불안형 / resonance_personal

**입력**: "앞날이 너무 불확실하고 막막해요"  
**출처 프레임셋**: wish-render-prototype/W3 (F5만 W1 override)

### Frame 검수

| Frame | 이미지 | 자막 | 판단 |
|-------|--------|------|------|
| F1 (0–5s) | W3/F1_pause_cafe.png (회복형의 sapphire 카페) | "별빛은 아주 작은 마음에서 시작돼요" (#8) | ⚠️ SHOULD (2건) — 아래 설명 |
| F2 (5–10s) | cafe page05 | 없음 (breathing gap) | ✅ |
| F3 (10–15s) | W3/F3_calm_cafe.png | "마음이 조금 가벼워졌다면 좋겠어요" (#11) | ✅ "면 좋겠어요" = 조건형, confusion→calm 전환에 적합 |
| F4 (15–20s) | hamel page05 | 없음 (breathing gap) | ✅ |
| F5 (20–30s) | W1/F5_fragile_hope_hamel.png (override) | "작은 소원 하나가 밤하늘에 남았어요" (#2) | ✅ EMOT-TRANS-001 §1-4 준수 — 아래 상세 |

### SHOULD 1 — F1 이미지가 confusion을 시각적으로 표현 못 함

```
emotion label: confusion (moonstone)
실제 사용 이미지: W3/F1_pause_cafe.png (회복형의 sapphire cafe = 차분한 회복 분위기)
```

confusion 전용 이미지(moonstone cafe)가 현재 자산에 없음. 결과적으로 "불확실하고 막막한" 소원에 "차분한 회복 분위기" 이미지가 사용됨.

**위험도**: 중간.  
**근거**: 육안으로 보면 이미지가 소원의 불안 감정과 시각적으로 매칭되지 않는다. 그러나 DreamTown은 불안한 감정을 그대로 반영하는 이미지보다 **안전한 공간**을 제공하는 것이 원칙이므로, cafe 이미지 자체는 원칙에 부합.  
**해결 방향**: moonstone cafe 전용 이미지 생성 (v2 작업). 현재는 v1 known limitation.

### SHOULD 2 — F1 copy가 confusion 감정 인정 단계를 건너뜀

```
wish_text: "앞날이 너무 불확실하고 막막해요"
  → 소원자의 현재 상태: 방향 없음, 막막함, 혼란

F1 copy #8: "별빛은 아주 작은 마음에서 시작돼요"
  → 이미 희망(fragile_hope) 방향의 언어
  → 막막함을 먼저 인정하지 않고 바로 "시작"을 언급
```

**DreamTown 철학 충돌 가능성**:  
`NO_EMOTIONAL_ADDICTION.md` — 감정을 착취하거나 강요하지 않는다.  
confusion 소원자에게 F1에서 바로 "별빛이 시작된다"고 말하는 것은 감정을 앞서가는 구조일 수 있다.  
이상적인 confusion F1 copy: "막막한 마음도 별에 담길 수 있어요" 형태 (validate → hope).

**위험도**: 중간.  
**현재 상태**: 불안형 전용 copy가 copy SSOT에 없어 회복형 copy를 차용. 신규 copy 생성 금지 조건으로 v1에서 해결 불가.  
**해결 방향**: copy SSOT에 confusion 전용 F1 copy 추가 (CEO 확인 후).

### confusion → fragile_hope override 검수 (§1-4)

```
[F5 override 발동 조건]
  wish_type = 불안형 (primary_gravity = confusion)
  
[결과]
  F5 emotion: fragile_hope ✅
  F5 image: W1/F5_fragile_hope_hamel.png (어두운 밤 항구, 수면 불빛, Sowoni 실루엣)
  F5 subtitle: "작은 소원 하나가 밤하늘에 남았어요" (#2)
```

**자연스러움 평가**:

"앞날이 너무 불확실하고 막막해요"  
→ F5: "작은 소원 하나가 밤하늘에 남았어요"

- "작은" — confusion 소원자에게 큰 변화가 아닌 하나의 작은 것이 남는다는 구조 ✅
- "밤하늘에 남았어요" — 사라지지 않았다. 막막함 속에서도 소원이 지속된다 ✅
- "남았어요" — 완료형이 아닌 존재형. 해결됐다고 하지 않는다 ✅
- F5 이미지 (어두운 밤 항구, 희미한 불빛) — 밝은 희망이 아닌 조용한 잔존감. confusion 종결로 적합 ✅

**confusion F5 palette 전환 주의**:
- W3 프레임셋 전체 (sapphire/pale 계열) → F5만 W1 (diamond/dark night)
- 팔레트 전환이 육안으로 어색하지 않은지 **직접 확인 필요**
- 예상: F4(하멜 night)→F5(하멜 night)의 야간 연속성은 유지될 것으로 판단

**override 결론**: ✅ 구조적으로 EMOT-TRANS-001 §1-4 완전 준수. 자막-이미지 충돌 없음.

### Arc 자연스러움

```
confusion → emotional_afterflow → calm → reality_reconnection → fragile_hope
   막막    →      잠깐 숨쉬기     →  안정  →      현실 착지     →   작은 희망
```

✅ "막막한 상태에서 시작 → 잠깐 숨쉬기 → 마음이 조금 가벼워지길 → 현실로 돌아오기 → 작은 것 하나가 남아있다"  
이 아크 자체는 자연스럽다. confusion을 강조하거나 고착시키지 않고, 천천히 fragile_hope로 이동하는 구조.

### 결론

**PASS (SHOULD 2건).**  
confusion F5 override 작동 확인. 아크 자연스러움 확인.  
F1 이미지/copy 불일치는 v1 자산 한계 — v2 copy SSOT 확장 + moonstone cafe 이미지 생성으로 해결.

---

## 종합 이슈 분류

### MUST (blocking) — 없음

현재 auto-preview 3건에서 즉시 차단이 필요한 이슈 없음.  
파이프라인 자체의 구조적 오류 없음.

---

### SHOULD (권장 수정, non-blocking)

| 번호 | 대상 | 이슈 | 해결 방향 |
|------|------|------|----------|
| S-01 | W09 F1 copy | "별빛은 아주 작은 마음에서 시작돼요"가 confusion 감정 인정 단계를 건너뜀 | copy SSOT에 confusion 전용 F1 copy 추가. 예: "막막한 마음도 별에 담길 수 있어요" |
| S-02 | W09 F1 이미지 | confusion 이미지 없어 회복형 pause_cafe 사용 | moonstone cafe 이미지 생성(v2). 현재 v1 known limitation |
| S-03 | W03 F1 copy | "용기"가 "해보고 싶어요" 어조보다 약간 강함 | 결심형 탐색 단계 전용 copy 추가 검토. 현재 SSOT 내에서 대안 없음 |
| S-04 | W09 F5 palette | W3(sapphire pale) → W1(diamond dark night) 팔레트 전환. 육안 확인 필요 | 직접 브라우저에서 F4→F5 전환 시 어색함 확인 |

---

### PASS (이상 없음)

| 항목 | 근거 |
|------|------|
| W01 전체 | 자막-이미지 10/10 일치, W1-v3와 구조 동일 |
| W03 구조 전체 | attraction 파라미터 7개 모두 기준값 일치 |
| W09 confusion→fragile_hope override | §1-4 완전 준수, 자막 적합 |
| resonance/attraction 렌더 차이 | 7개 파라미터 명확 차이, 채널 철학 반영 |
| W09 arc 자연스러움 | confusion→calm→fragile_hope 이행 자연스러움 |
| 신규 이미지 0건 | 전 preview new_ai_images: 0 확인 |

---

## CEO/운영자 직접 육안 확인 요청 항목

이 검수에서 정적 분석만으로 확인 불가한 항목:

| 항목 | 확인 대상 |
|------|---------|
| 1 | W09 F4→F5 palette 전환 — W3 sapphire에서 W1 diamond dark로의 전환이 어색하지 않은지 |
| 2 | HTML5 player 자막 타이밍 — 실제 브라우저에서 1s/0.3s offset이 체감 가능한지 |
| 3 | ken_burns 0.3x vs 0.4x — 실제 속도 차이가 두 채널 사이에서 눈에 보이는지 |
| 4 | 자막 thin vs regular weight — 폰트 렌더링 환경(Noto Sans KR 설치 여부)에 따른 차이 |
| 5 | W03 9:16 레이아웃 — attraction preview의 모바일 비율이 브라우저에서 올바르게 표시되는지 |

---

## 다음 작업 우선순위

| 우선순위 | 작업 | 근거 |
|---------|------|------|
| 1 | CEO 직접 육안 확인 (5개 항목) | 정적 분석으로 대체 불가 |
| 2 | copy SSOT에 confusion F1 전용 copy 추가 (S-01) | W09 감정 인정 단계 완성 |
| 3 | moonstone cafe 이미지 1장 생성 (S-02) | 불안형 F1 전용 이미지 |
| 4 | `videoJobRoutes.js` 연결 | pipeline → 실제 서버 트리거 |

---

## 참조

| 문서 | 경로 |
|------|------|
| 파이프라인 보고서 | `docs/reports/WISH_TEXT_TO_PREVIEW_PIPELINE_V1.md` |
| W1-v3 최종 검수 | `docs/reports/RESONANCE_W1_V3_FINAL_REVIEW.md` |
| 번역 SSOT | `docs/ssot/emotion/DreamTown_Emotional_Translation_SSOT.md` |
| 방향 감사 | `docs/reports/DREAMTOWN_AUTOMATION_DIRECTION_SELF_AUDIT.md` |
