# RESONANCE_W1_V2_FINAL_CHECK.md

> 작성일: 2026-05-22  
> 검수 방법: 5개 프레임 이미지 직접 시각 확인 (Read tool — multimodal)  
> 기준: `outputs/resonance-preview/W1-v2/preview.html` + `sequence.json`  
> 상태: **검수 완료 — 블로커 1건 / SHOULD 2건 / PASS 다수**

---

## 검수 요약

| 항목 | 결과 | 비고 |
|------|------|------|
| F2 page05 실물 확인 | ✅ PASS | DoD 충족 |
| F4 page05 실물 확인 | ✅ PASS | lighthouse + star 모두 확인 |
| 자막 위치 (핵심 오브젝트 차단 여부) | ✅ PASS | 전 프레임 안전 |
| 30초 흐름 (끊김 / 속도) | ⚠️ SHOULD | F4→F5 조명 불연속 |
| hope_curve 자연스러움 | ❌ **MUST** | F5 시각-자막 불일치 + 희망 시각 신호 없음 |

---

## 1. F2 page05 실물 확인

### 판정: ✅ PASS

**확인 항목**

| DoD 항목 | 기준 (page05.json) | 실물 확인 |
|----------|-------------------|----------|
| Sowoni 뒷모습 | seated at window table, back view | ✅ 완전한 뒷모습, 얼굴 불노출 |
| pause/inner quiet 필수 | emotional_pause 역할 | ✅ 커피컵 + 정적 자세 — 감정 잔류 구현 |
| 별 가시성 | visible through window, soft and steady | ✅ 창 너머 별 1개 중앙 상단 확인 |
| 색감 | warm interior amber + cool night sea | ✅ 따뜻한 실내 + 창 너머 청색 야경 |

**F1 vs F2 시각 비교**

- F1: 좌석에 앉아 창 밖을 보는 장면. 커피컵 없음. 창틀 전체 노출. 별은 우측 상단.
- F2: 동일 자리이나 커피컵/소서가 테이블에 추가됨. 창 중앙 별로 시선 수렴. 더 정착된 느낌.

`emotional_afterflow` 정의: "감정이 흘러간 뒤의 정서적 잔류 — 무거운 감정이 아닌, 이미 지나간 감정의 조용한 흔적"  
커피컵이 "잠시 멈춤, 정착" 시각으로 자연스럽게 구현됨. ✅

---

## 2. F4 page05 실물 확인

### 판정: ✅ PASS (DoD 완전 충족)

**확인 항목**

| DoD 항목 | 기준 (page05.json) | 실물 확인 |
|----------|-------------------|----------|
| Sowoni 뒷모습 | standing at harbor edge, back view | ✅ 부두 정면 뒷모습, 완전한 백뷰 |
| red lighthouse | REQUIRED — 배경 실루엣, 중앙 X | ✅ 우측 배경에 붉은 등대 존재, 중앙 아님 ✅ |
| star | 하늘에 별, 140% brightness | ✅ 좌측 상단 하늘에 밝은 별 1개 |
| reality reconnection | grounded presence, return without loss | ✅ 어선, 부두, 도시 불빛 — 현실감 있는 장면 |
| 색감 | deep navy harbor night + city lights + red lighthouse | ✅ 딥 네이비 야경 + 도시 불빛 반영 |

**특이사항**: 등대는 우측에 위치하고 Sowoni는 정면을 바라봄 — page05.json의 `"Sowoni does NOT face it or move toward it"` 원칙 ✅

---

## 3. 자막 위치 — 핵심 오브젝트 차단 여부

### 판정: ✅ PASS (전 프레임)

자막 위치: `하단 1/4 중앙` (preview.html spec 기준)

| 프레임 | 자막 | 핵심 오브젝트 위치 | 차단 여부 |
|--------|------|------------------|----------|
| F1 | "오늘의 마음을 이 밤에 남겨둘게요" | Sowoni 상반신(중앙), 별(우측 상단) | ✅ 안전 — 하단 테이블/의자 다리 영역 |
| F2 | (자막 없음) | — | ✅ — |
| F3 | "마음이 조금 가벼워졌다면 좋겠어요" | Sowoni 측면(중앙-우), 별(상단) | ✅ 안전 — 하단 테이블 면 영역 |
| F4 | (자막 없음) | lighthouse(우), star(좌 상단) | ✅ — |
| F5 | "작은 소원 하나가 밤하늘에 남았어요" | Sowoni 전신(중앙), 부두 장비(좌) | ✅ 안전 — 하단 발/부두면 영역 |

**F3 주의**: Sowoni가 살짝 좌측을 바라보는 3/4 측면 포즈로 약간의 얼굴 윤곽이 보임.  
뒷모습 원칙 위반 수준은 아님 (얼굴 정면 미노출) — 단, 향후 이 프레임 교체 시 참고.

---

## 4. 30초 흐름 평가

### 판정: ⚠️ SHOULD — F4→F5 조명 불연속

**프레임별 분위기 확인**

| # | 프레임 | 시간대 | 팔레트 | 분위기 |
|---|--------|--------|--------|--------|
| F1 | pause_cafe | 심야 | 따뜻한 호박색(실내) + 진청색(창 밖) | 지쳐있음, 조용히 앉아있음 |
| F2 | afterflow_cafe | 심야 | F1과 동일 — 정착된 느낌 | 감정 잔류, 커피컵 추가 |
| F3 | calm_cafe | 심야 | 따뜻한 주황-호박색, 더 밝아짐 | 내면 고요, 약간 이완된 자세 |
| F4 | reconnection_hamel | 심야 | 딥 네이비, 항구 불빛 | 현실과 재연결, 등대+별 뚜렷 |
| F5 | fragile_hope_hamel | **회색 안개/흐린 낮** | 무채색 회색 안개, 세피아 | 불확실, 정적, 안개 속 |

**문제**: F4(딥 네이비 심야) → F5(회색 안개) 전환이 조명/색온도/시간대 모두 불일치.  
cross-dissolve 1초만으로는 이 격차를 메우기 어려움.

```
F1–F4: 일관된 심야 팔레트 (cool navy + warm amber)
F5:    완전히 다른 회색 안개 (무채색, 주간 또는 안개)
→ 30초 흐름 중 마지막 10초에서 시각적 단절 발생 가능
```

---

## 5. Hope Curve 자연스러움 + F5 시각-자막 불일치

### 판정: ❌ MUST — 자막-이미지 불일치

#### MUST: F5 자막 "밤하늘에" — 이미지에 밤하늘 없음

```
F5 자막: "작은 소원 하나가 밤하늘에 남았어요"  (copy #2)
F5 이미지: 회색 안개 / 흐린 낮 분위기 — 별 없음, 밤하늘 없음
```

자막이 묘사하는 시각(밤하늘)과 이미지 실물이 일치하지 않음.  
DreamTown resonance 원칙상 자막은 이미지를 설명하는 것이 아니라 감정을 레이블링하는 것이나,  
"밤하늘에 남았어요"는 시각 묘사를 포함 — 이미지와 충돌할 경우 몰입이 깨진다.

#### hope_curve 시각 진단

| 프레임 | 설계값 | 실물 시각 | 일치 여부 |
|--------|--------|----------|----------|
| F1 | 0.50 | 지쳐있음, 야경 응시 | ✅ |
| F2 | 0.50 | 정착, 커피컵, 조용한 잔류 | ✅ |
| F3 | 0.52 | 이완, 손 테이블에 안착 | ✅ |
| F4 | 0.55 | 항구 귀환, 별+등대 뚜렷 | ✅ (hope 시각 신호 명확) |
| F5 | 0.62 | **회색 안개, 무채색, 별 없음** | ❌ (hope 시각 신호 없음) |

F4에서 별 + 빨간 등대가 선명하게 보인 후 F5에서 별이 사라지고 안개로 가득 찬 장면으로 전환되면,  
시각적으로 "희망이 다시 흐려졌다"는 역방향 메시지를 줄 위험이 있다.

**`fragile_hope`는 작고 조심스러운 희망이지 "사라진 희망"이 아니다.**

---

#### 대안 검토 (신규 AI 생성 금지 전제)

현재 asset-registry에 등록된 hamel fragile_hope 자산 확인:

```
hamel_fragile_hope_diamond_base01.png  (미확인)
hamel_fragile_hope_diamond_base02.png  (미확인)
hamel_fragile_hope_diamond_base03.png  ← 현재 F5 (회색 안개)
```

base01 / base02가 야간 씬이라면 교체로 해결 가능.  
→ **다음 단계: base01/base02 실물 확인 후 교체 여부 결정**

---

## 전체 검수 결론

### MUST (1건) — 영상 조립 전 필수

| # | 항목 | 내용 |
|---|------|------|
| M1 | **F5 자산 교체 검토** | `hamel_fragile_hope_diamond_base03.png`의 회색 안개 분위기가 "밤하늘" 자막과 충돌. base01/base02 야간 씬 확인 후 교체 |

---

### SHOULD (2건)

| # | 항목 | 내용 |
|---|------|------|
| S1 | **F4→F5 조명 연속성** | F4 딥 네이비 → F5 회색 안개 불연속. M1 자산 교체로 함께 해결될 가능성 높음 |
| S2 | **F3 Sowoni 측면 포즈** | 약간의 얼굴 윤곽 노출. 뒷모습 원칙 위반 수준 아님. 향후 프레임 교체 시 참고 |

---

### PASS (확인 완료)

| 항목 | 결과 |
|------|------|
| F2 page05 DoD | ✅ seated back, star, inner quiet 충족 |
| F4 page05 DoD | ✅ red lighthouse + star 두 요소 모두 확인 |
| 자막 위치 전 프레임 | ✅ 핵심 오브젝트 차단 없음 |
| Sowoni 뒷모습 (F1/F2/F4/F5) | ✅ 완전한 백뷰 |
| 신규 AI 이미지 생성 | ✅ 0건 |
| 감정 순서 F1→F4 | ✅ 자연스러운 흐름 |
| 자막 density (F1/F3/F5) | ✅ copy SSOT 전수 등록 확인 |

---

## 다음 단계 (우선순위)

```
1. [MUST] hamel_fragile_hope_diamond base01/base02 이미지 확인
   → 야간 씬이면 F5를 base01 또는 base02로 교체
   → W1-v3 preview 출력

2. [SHOULD — M1 연동] F4→F5 조명 연속성 자동 해결 여부 확인
   → base01/base02 야간 씬이면 딥 네이비 연속성 복구됨

3. [SHOULD] F3 포즈 — 향후 프레임 교체 후보 목록에 기록 (현재 blocking 아님)
```

---

## 참조

| 항목 | 경로 |
|------|------|
| W1-v2 preview | `outputs/resonance-preview/W1-v2/preview.html` |
| W1-v2 sequence | `outputs/resonance-preview/W1-v2/sequence.json` |
| F4 DoD 기준 | `config/storybook/page05.json` — hamel.dod |
| hamel 자산 목록 | `public/images/thumbnails/hamel/generated/full/` |
