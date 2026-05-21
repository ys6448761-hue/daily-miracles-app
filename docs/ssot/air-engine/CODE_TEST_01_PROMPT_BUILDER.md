# CODE_TEST_01 — Prompt Builder
## DreamTown 공기 이미지 프롬프트 빌더 템플릿

**문서 코드**: AIR-PROMPT-009  
**레이어**: Operational SSOT (Layer 2)  
**작성**: 2026-05-17  
**의존 문서**: AIR-GRAM-007 (Continuity Grammar), AIR-CONST-001  
**상태**: ACTIVE

```yaml
purpose: >
  DreamTown 공기 이미지 생성을 위한 프롬프트 빌더 필드를 정의한다.
  각 필드는 continuity grammar의 어느 요소를 담당하는지 명시한다.
  config/thumbnail/{location}.json 구조와 연결된다.

source_asset_master: 3:4_portrait
resolution: 1536x2048 (standard) | 1024x1536 (legacy canonical)
model_policy: gpt-image-1 (기본)
```

---

## 1. 프롬프트 빌더 7개 필드

### Field 1 — temporal_frame

```yaml
temporal_frame:
  grammar: temporal_asymmetry
  purpose: "이미지의 시간적 좌표 설정 — 언제인가 아니라 어떤 시간의 결인가"
  
  structure:
    time_of_day: "late afternoon | early evening | night | overcast day"
    world_state: "already continuing | has been going | will continue"
    sowoni_state: "stopped | still present | waiting without knowing"
    
  rules:
    - "시간이 '시작'이 아니라 '중간 어딘가'처럼 보여야 한다"
    - "낮→밤 전환 같은 드라마틱 순간 금지"
    - "세계는 이미 이 시간에 있었고, 소원이는 그 안에 도착했을 뿐"
    
  examples:
    PASS: "humid late afternoon, harbor already carrying evening traffic"
    PASS: "overcast evening — the kind that has been overcast all day"
    FAIL: "golden hour sunset breaking through clouds for dramatic effect"
    FAIL: "night just falling — transitional moment"
    
  config_field: "scene.description (시간 부분)"
```

---

### Field 2 — room_lag_anchor

```yaml
room_lag_anchor:
  grammar: room_lag
  purpose: "공간이 소원이보다 먼저 멈춰 있음을 고정하는 장치"
  
  structure:
    anchor_type: "object | light | surface | sound_visual_equivalent"
    anchor_state: "ongoing | unattended | indifferent"
    anchor_source: "unfinished_object_residue set에서 선택"
    
  rules:
    - "anchor는 소원이의 서사를 설명하지 않는다"
    - "anchor는 소원이가 오기 전부터 있었고, 소원이가 떠나도 있을 것이다"
    - "anchor는 1-2개 명시 — 너무 많으면 연출처럼 보임"
    
  per_location:
    yeosu_cablecar:
      anchors: ["cable mechanism in motion outside", "condensation on inner glass", "empty seat gap"]
      preferred: "cable mechanism in motion outside"
    yeosu_cafe:
      anchors: ["half-filled cup on table", "ambient lamp still on", "receipt on counter"]
      preferred: "half-filled cup on table"
    yeosu_hotel:
      anchors: ["room lamp still on", "open curtain edge", "unmade corner"]
      preferred: "room lamp still on"
    yeosu_hamel:
      anchors: ["dock rope still tied", "wet pavement from earlier rain", "bollard shadow", "boat outline at rest"]
      preferred: "dock rope still tied | wet pavement"
      
  config_field: "scene.must_include (물체 항목)"
```

---

### Field 3 — object_residue_set

```yaml
object_residue_set:
  grammar: unfinished_object_residue
  purpose: "미완성 물체 집합 — continuity가 진행 중임을 증명하는 요소들"
  
  structure:
    objects: list of 2-4 items
    each_object:
      state: "unfinished | ongoing | abandoned | ordinary"
      meaning: null  # 의미 없어야 함
      
  selection_rules:
    - "각 물체는 그 자체로 의미를 가지지 않는다"
    - "물체들이 서사를 형성하면 안 된다 (연출된 세트처럼 보이면 실패)"
    - "물체는 그 장소에 원래 있을 법한 것들이어야 한다"
    - "감정 표현을 위한 상징적 선택 금지"
    
  forbidden_objects:
    - "편지 / 쪽지 (서사 암시)"
    - "핀 꽂힌 지도 (목적지 암시)"
    - "시든 꽃 (슬픔 상징)"
    - "촛불 (희망 상징)"
    - "깨진 유리 (갈등 상징)"
    
  config_field: "scene.must_include (항목들)"
```

---

### Field 4 — exterior_activity

```yaml
exterior_activity:
  grammar: exterior_indifference
  purpose: "외부 세계가 소원이와 무관하게 진행 중임을 명시"
  
  structure:
    exterior_type: "sea | harbor | city | mountain | sky"
    activity_level: "ongoing | indifferent | already in motion"
    response_to_sowoni: "none — exterior does not know she is there"
    
  rules:
    - "외부 활동은 소원이의 감정과 correlation 없음"
    - "외부가 소원이를 향하거나 소원이에 반응하는 묘사 금지"
    - "날씨/빛/파도가 소원이 감정의 은유로 작동하면 실패"
    - "'세계는 이미 진행하고 있었다'가 읽혀야 함"
    
  per_location:
    yeosu_cablecar:
      exterior: "city lights below continuing, sea visible in distance, cable movement"
      anti_pattern: "city lights turning on 'for' the moment"
    yeosu_cafe:
      exterior: "street activity through window, night city continuing outside"
      anti_pattern: "rain starting as emotional signal"
    yeosu_hotel:
      exterior: "harbor lights at distance, ordinary night activity below"
      anti_pattern: "harbor quieting down to match Sowoni's stillness"
    yeosu_hamel:
      exterior: "harbor operating as usual, boats at rest or moving, ordinary coast lights"
      anti_pattern: "harbor becoming peaceful 'with' Sowoni"
      
  config_field: "composition.flow, scene.description"
```

---

### Field 5 — light_condition

```yaml
light_condition:
  grammar: suppression_rules (cinematic drift 억제)
  purpose: "빛 조건 — 드라마틱하지 않고 continuity를 강화하는 빛"
  
  structure:
    source: "ambient | harbor lights | ordinary interior | overcast diffuse"
    quality: "flat | muted | utility | ordinary"
    direction: "non-directional | scattered | already there"
    
  pass_conditions:
    - "빛이 '이미 켜져 있었다'는 느낌"
    - "빛의 방향이 소원이를 향하지 않음"
    - "빛이 분위기 연출용이 아닌 기능적 빛"
    
  fail_conditions:
    - "god-ray / volumetric light / 빛줄기 강조"
    - "따뜻한 amber 빛이 healing/cozy 분위기 생성"
    - "빛이 소원이를 '조명'하는 것처럼 배치"
    - "sunrise/sunset 전환 순간의 드라마틱한 빛"
    
  per_location:
    yeosu_cablecar:
      preferred: "external city lights (cool, scattered), interior ambient (neutral)"
      forbidden: "warm golden interior glow"
    yeosu_cafe:
      preferred: "exterior neon/city cold light dominates, minimal interior warmth"
      forbidden: "amber lamp cozy atmosphere"
    yeosu_hotel:
      preferred: "harbor lights from distance, room lamp ordinary utility"
      forbidden: "warm bedside lamp creating safe feeling"
    yeosu_hamel:
      preferred: "overcast diffuse, harbor utility lights (amber/white scattered)"
      forbidden: "lighthouse beam, dramatic cloud break"
      
  star_light_policy:
    visibility: "almost_unnoticed"
    brightness: "60-70% relative to surrounding light sources"
    position: "upper peripheral, NOT centered"
    color: "gemstone color (location config에서 정의)"
    rule: "별이 빛 계층에서 주도적이면 안 된다"
    
  config_field: "color, star"
```

---

### Field 6 — suppression_rules (inline)

```yaml
suppression_rules_inline:
  grammar: suppression_rules (전체)
  purpose: "프롬프트 Do NOT 섹션 — 생성 시 금지 항목 명시"
  
  always_include_in_prompt:
    format: "Do NOT: [항목들]"
    items:
      - "photorealistic"
      - "3D render"
      - "tourism poster or travel brochure aesthetic"
      - "inspirational or healing atmosphere"
      - "symbolic lighthouse at center of frame"
      - "cinematic fog or dramatic weather"
      - "face visible from front or side"
      - "facial detail or expression readable"
      - "text, letters, numbers, captions, watermarks, logos"
      - "seated pose for Sowoni (outdoor locations)"
      - "star as symbolic focal point"
      - "childlike body proportions"
      
  location_specific_additions:
    yeosu_hamel:
      - "lighthouse centered in composition"
      - "Sowoni walking toward anything"
    yeosu_cafe:
      - "healing warmth or nostalgic coziness"
      - "cozy amber interior dominant"
    yeosu_hotel:
      - "giant star halo or cross-star beam"
      - "star as destination"
    yeosu_cablecar:
      - "dramatic city panorama as postcard"
      - "wide vista as tourism shot"
      
  config_field: "style.forbidden, scene.must_NOT_include"
```

---

### Field 7 — output_policy

```yaml
output_policy:
  grammar: (all — final output verification)
  purpose: "생성 결과물이 continuity grammar를 준수하는지 출력 전 최종 체크"
  
  pre_output_checklist:
    size: "1024×1536 (현행 canonical) | 1536×2048 (target spec)"
    format: "PNG"
    text_in_image: "NONE — 모든 텍스트는 post-processing 레이어로만"
    
  visual_check:
    - "harbor/location reads before Sowoni"
    - "Sowoni is back view, 85%+ hidden"
    - "no symbolic focal point in star or lighthouse"
    - "no tourism reading"
    - "no cinematic composition"
    
  file_naming:
    pattern: "{location}_{emotion}_{gemstone}_{base_id}.png"
    examples:
      - "hamel_calm_emerald_base03.png"
      - "cablecar_fragile_hope_diamond_base05.png"
      
  output_paths:
    base:      "public/images/thumbnails/{location}/base/"
    full25:    "public/images/thumbnails/{location}/generated/full/"
    canonical: "public/images/canonical/source/{location}/"
    
  post_generation_pipeline:
    step1: "CEO 시각 검수 (base 5장)"
    step2: "full25 recolor pipeline"
    step3: "drift check (suppression rules 재확인)"
    step4: "canonical 복사 (CEO 승인 후)"
    step5: "MANIFEST + REGISTRY 업데이트"
```

---

## 2. 프롬프트 빌더 출력 구조

```yaml
prompt_template:
  header: "DreamTown {location} thumbnail illustration."
  
  sections:
    - "Scene: {temporal_frame.description}"
    - "Must include: {room_lag_anchor} + {object_residue_set} + {exterior_activity}"
    - "Style: {style.required}"
    - "Do NOT: {suppression_rules_inline}"
    - "Color: {light_condition.color_spec}"
    - "Star: {light_condition.star_light_policy}"
    - "Composition: {exterior_activity.flow}"
    - "Character: {character_spec}"
    - "Pose for {emotion}: {poses[emotion]}"
    - "Camera: {camera[emotion]}"
    - "Emotion: {emotion}"
    - "Consistency requirements: {consistency_block}"
    
  config_source: "config/thumbnail/{location}.json"
  builder_script: "scripts/thumbnail/build-thumbnail.js --location {location}"
```

---

## 3. 프롬프트 검수 체크리스트

```yaml
prompt_review:
  before_generation:
    - "temporal_frame이 드라마틱 전환점을 피하는가?"
    - "room_lag_anchor가 서사를 설명하지 않는가?"
    - "exterior_activity가 소원이에 반응하지 않는 방식으로 기술되었는가?"
    - "light_condition이 healing/cinematic 요소를 포함하지 않는가?"
    - "suppression_rules_inline에 위치별 추가 항목이 포함되었는가?"
    
  red_flags_in_prompt:
    - "toward" + 목적지
    - "light breaks through"
    - "revealing"
    - "hopeful"
    - "warm glow of"
    - "perfectly"
    - "beautiful"
    - "dramatic"
    - "healing"
```
