# CODE_TEST_01 — Continuity Grammar
## DreamTown 공기 생성 문법 정의

**문서 코드**: AIR-GRAM-007  
**레이어**: Operational SSOT (Layer 2)  
**작성**: 2026-05-17  
**의존 문서**: AIR-CONST-001 (Air Constitution), AIR-TAX-003 (Taxonomy)  
**상태**: ACTIVE

```yaml
purpose: >
  Anti-Gravity Test 1-4 및 GPTS 채널 테스트 결과를 바탕으로
  "continuity grammar"를 코드 구조로 번역한다.
  이 문서는 이미지 선택/거부/생성 판단의 1차 기준이 된다.

core_question:
  NOT: "이 이미지가 예쁜가?"
  BUT: "이 이미지에서 continuity가 살아남는가?"
```

---

## 1. Continuity Grammar 5가지

### 1.1 Temporal Asymmetry (시간 비대칭)

```yaml
temporal_asymmetry:
  definition: >
    이미지 안에서 소원이의 시간과 외부 세계의 시간이 다른 속도로 흐른다.
    소원이는 멈춰 있거나 느리게 존재하고,
    외부 세계(바다/하늘/항구/거리)는 이미 진행하고 있다.
  
  pass_condition:
    - 소원이: 정지 / 응시 / 수동적 기다림
    - 외부: 구름 이동 / 파도 / 흘러가는 빛 / 움직이는 도시
    - 두 시간이 같은 속도로 느껴지지 않는다
  
  fail_condition:
    - 소원이가 세계와 함께 역동적으로 움직임
    - 소원이가 세계를 이끌거나 변화의 중심
    - 이미지 전체가 단일 시간 속에 얼어있음 (내부 세계조차 정지)
  
  code_signal:
    character_motion: "stationary"
    world_motion: "continuing"
    asymmetry_readable: true

  detection:
    check_foreground: "소원이 움직임 / 포즈 변화 여부"
    check_background: "외부 요소의 시간 흐름 신호 (빛 방향, 파도, 구름)"
    pass_if: foreground_stationary AND background_continuing
```

---

### 1.2 Room Lag (공간 지연)

```yaml
room_lag:
  definition: >
    공간이 사람보다 먼저 멈춘다.
    소원이가 아직 그 공간 안에 있어도,
    공간 자체는 이미 이전 순간에 속해 있다.
    공간은 소원이를 기다리지 않았다 — 공간도 그냥 있었을 뿐이다.
  
  pass_condition:
    - 공간 내 물건들이 "아직 어제"에 속함
    - 아무도 치우지 않은 잔, 꺼지지 않은 불빛, 닫히지 않은 창
    - 소원이가 없어도 공간이 동일하게 존재할 것이라는 감각
  
  fail_condition:
    - 공간이 소원이의 감정에 반응함 (날씨가 소원이 기분과 일치)
    - 공간이 소원이를 위해 "준비된" 느낌
    - 인테리어가 감정 연출용으로 배치된 느낌
  
  code_signal:
    space_prepared_for_character: false
    objects_indifferent_to_arrival: true
    room_would_exist_without_sowoni: true
  
  detection:
    primary: "공간이 소원이의 존재를 인지하고 있는가?"
    secondary: "물건/빛/구조가 소원이에 '맞게' 배치되어 있는가?"
    pass_if: both_NO
```

---

### 1.3 Exterior Indifference (외부 무관심)

```yaml
exterior_indifference:
  definition: >
    외부 세계(창 밖, 항구, 하늘, 거리)는
    소원이의 존재 여부에 관계없이 계속 진행된다.
    소원이가 떠나도, 오지 않아도, 바다는 그냥 있었을 것이다.
  
  pass_condition:
    - 창밖/항구/하늘이 소원이를 향해 있지 않음
    - 외부 요소가 소원이의 감정과 무관하게 존재
    - "외부 세계가 이미 계속되고 있다"는 감각
  
  fail_condition:
    - 하늘/바다가 소원이의 감정을 반영 (기분 = 날씨)
    - 외부 세계가 소원이를 위해 멈추거나 기다림
    - 외부 요소가 소원이를 향해 구성됨
  
  code_signal:
    exterior_responsive_to_sowoni: false
    exterior_continuous_independent: true
    world_indifference_readable: true
  
  detection:
    check: "외부 요소가 소원이 감정과 correlation이 있는가?"
    pass_if: correlation_low
    
  examples:
    PASS: "비 오는 항구 — 소원이는 calm 상태. 비는 소원이 감정과 무관."
    FAIL: "구름이 걷히며 빛이 들어옴 — 소원이 희망이 커지는 순간과 일치."
```

---

### 1.4 Unfinished Object Residue (미완성 물체 잔여)

```yaml
unfinished_object_residue:
  definition: >
    이미지 안에 "아직 끝나지 않은 것"의 흔적이 있다.
    이 물체들은 소원이의 서사를 설명하지 않는다 — 그냥 거기 있다.
    그것이 continuity의 증거다: 세계는 끝나지 않았고 계속된다.
  
  pass_condition:
    - 반쯤 마신 음료
    - 접히지 않은 영수증
    - 꺼지지 않은 카페 조명
    - 로프가 아직 묶여 있는 배
    - 열려 있는 창문
  
  fail_condition:
    - 물체가 서사를 설명하는 도구로 작동 (촛불 = 희망)
    - 물체 배치가 감정 연출을 위해 의도됨
    - "이 물체가 의미를 전달하고 있다"고 느껴짐
  
  code_signal:
    object_serves_narrative: false
    object_exists_independently: true
    residue_type: "unfinished | ongoing | indifferent"
  
  object_registry:
    yeosu_cablecar:  ["cable mechanism", "fogged window interior", "seat gap"]
    yeosu_cafe:      ["half-filled cup", "receipt", "ambient lamp still on"]
    yeosu_hotel:     ["unmade area", "room lamp", "open curtain"]
    yeosu_hamel:     ["dock rope", "bollard", "boat outline", "wet pavement"]
```

---

### 1.5 Suppression Rules (억제 규칙)

```yaml
suppression_rules:
  definition: >
    DreamTown continuity를 파괴하는 요소들의 목록.
    이 요소가 이미지에 존재하면 drift 위험.
    생성/선택/파생 전 체크리스트로 사용.
  
  suppress_always:
    symbolic_hope:
      - "star as focal point or goal"
      - "lighthouse as directional symbol"
      - "sunrise/sunset as emotional climax"
      - "rainbow or dramatic weather as emotion"
    
    cinematic_drift:
      - "dramatic wide sky composition"
      - "god-ray or volumetric light"
      - "perfectly symmetrical composition"
      - "cinematic fog with emotional intent"
    
    healing_warmth:
      - "warm amber interior that feels 'safe'"
      - "glowing nostalgia atmosphere"
      - "comforting cozy framing"
    
    tourism_reading:
      - "postcard-ready scenic composition"
      - "travel brochure framing"
      - "location identity as selling point"
    
    character_agency:
      - "Sowoni walking toward something with purpose"
      - "Sowoni reaching, gesturing, acting"
      - "Sowoni as emotional center of composition"
    
    text_in_image:
      - "any Korean or Latin characters rendered by AI"
      - "captions, watermarks, signs as focal"
  
  suppress_contextual:
    star_visibility:
      rule: "star must NOT exceed surrounding light sources in prominence"
      threshold: "almost_unnoticed — viewer may miss on first look"
      allowed: "peripheral trace in upper non-center area"
    
    lighthouse:
      rule: "may exist only as background — <5% of frame, unlit, off-center"
      forbidden: "center composition, directional beam, Sowoni toward it"
  
  detection_keywords:
    high_risk:
      - "inspirational"
      - "healing"
      - "cinematic"
      - "hopeful light"
      - "toward"
      - "symbolic"
      - "dramatic"
    
    continuity_signal:
      - "already continuing"
      - "residue"
      - "indifferent"
      - "ordinary"
      - "was already there"
      - "will continue after"
```

---

## 2. Continuity Score 산출 기준

```yaml
continuity_score:
  method: "5개 grammar 각각 pass/fail 판정 → 통합 점수"
  
  weights:
    temporal_asymmetry:       20%
    room_lag:                 25%
    exterior_indifference:    25%
    unfinished_object_residue: 15%
    suppression_pass:          15%
  
  classification:
    high:   "4-5개 PASS"
    medium: "2-3개 PASS"
    low:    "0-1개 PASS"
  
  gate_threshold:
    canonical_A:  "continuity_score: high + drift_risk: low"
    canonical_B:  "continuity_score: medium + drift_risk: medium"
    deprecated:   "suppression_fail ≥ 2개"
```

---

## 3. Grammar vs. Aesthetic 우선순위

```yaml
priority_order:
  1: suppression_pass          # 금지 요소 없어야 함 — 절대 조건
  2: exterior_indifference     # 세계가 소원이에 반응하지 않는가
  3: room_lag                  # 공간이 소원이보다 먼저 멈췄는가
  4: temporal_asymmetry        # 시간 비대칭이 읽히는가
  5: unfinished_object_residue # 미완성 흔적이 있는가
  6: aesthetic_quality         # (마지막 — 예쁜 것은 bonus)

rule: >
  aesthetic_quality가 높아도 suppression_fail이 있으면 Category A 불가.
  continuity_score가 낮아도 suppression_pass이면 weak_survival 유지.
```
