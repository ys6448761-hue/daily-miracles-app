# CODE_TEST_01 — Registry Schema
## DreamTown Canonical Asset Registry 스키마 정의

**문서 코드**: AIR-SCHEMA-010  
**레이어**: Operational SSOT (Layer 2)  
**작성**: 2026-05-17  
**의존 문서**: AIR-TAX-003, AIR-GRAM-007, REGISTRY_v1_verified_2026-0516.md  
**상태**: ACTIVE

```yaml
purpose: >
  Canonical Asset Registry의 모든 필드를 코드 수준에서 정의한다.
  향후 GATE 3-6 운영 및 자동화 스크립트에서 참조한다.
  새로운 asset이 등록될 때 이 스키마를 기준으로 메타데이터를 채운다.

schema_version: v1.1
compatible_with: REGISTRY_v1_verified_2026-0516.md
```

---

## 1. 전체 스키마 정의

```yaml
asset_schema:

  # ── 식별 필드 ────────────────────────────────────────────
  
  asset_id:
    type: string
    format: "{location_short}_{emotion}_{index:03d}"
    examples: ["cablecar_calm_013", "hamel_pause_003", "cafe_curiosity_021"]
    unique: true
    required: true
    
  source_id:
    type: string
    format: "AS-{location}-{emotion}-{gemstone}"
    examples: ["AS-cablecar-calm-emerald", "AS-hamel-pause-sapphire"]
    description: "3축 식별자 — 장소 × 감정 × 보석"
    unique: true
    required: true
    
  location:
    type: enum
    values: ["yeosu_cablecar", "yeosu_cafe", "yeosu_hotel", "yeosu_hamel"]
    locked: true  # Air Constitution 원칙 3
    required: true
    
  emotion:
    type: enum
    values: ["confusion", "pause", "calm", "curiosity", "fragile_hope"]
    locked: true  # Air Constitution 원칙 4
    order: [1, 2, 3, 4, 5]
    required: true
    
  gemstone:
    type: enum
    description: "emotion별 보석 색 — emotion-gem-map.json 기준"
    mapping:
      confusion:    "moonstone"
      pause:        "sapphire"
      calm:         "emerald"
      curiosity:    "topaz"
      fragile_hope: "diamond"
    required: true

  # ── 물리적 속성 ──────────────────────────────────────────

  source_ratio:
    type: enum
    values: ["3:4", "2:3", "9:16", "1:1"]
    canonical_target: "3:4"
    description: "파일의 실제 비율 (width:height)"
    required: true
    
  resolution:
    type: string
    format: "{width}×{height}"
    examples: ["1536×2048", "1024×1536"]
    canonical_min: "1536×2048"
    required: true
    
  legacy_ratio:
    type: boolean
    description: "3:4 spec 이전 생성 자산 (2:3 legacy canonical 허용)"
    default: false
    note: "true인 경우 CEO 결정으로 허용된 legacy asset"
    
  ratio_verified:
    type: boolean
    description: "물리 실측으로 비율 확인 완료 여부"
    required: true

  # ── Continuity Grammar 점수 ──────────────────────────────

  continuity_score:
    type: enum
    values: ["high", "medium", "low"]
    description: "AIR-GRAM-007 5개 grammar 종합 점수"
    grammar_components:
      temporal_asymmetry:        {weight: 0.20}
      room_lag:                  {weight: 0.25}
      exterior_indifference:     {weight: 0.25}
      unfinished_object_residue: {weight: 0.15}
      suppression_pass:          {weight: 0.15}
    scoring:
      high:   "4-5개 PASS"
      medium: "2-3개 PASS"
      low:    "0-1개 PASS"
    required: true
    
  drift_risk:
    type: enum
    values: ["low", "medium", "high", "critical"]
    description: "continuity grammar 위반 위험도"
    signals:
      low:      "suppression 모두 통과, grammar 안정"
      medium:   "일부 요소 경계선 (별 크기, warmth 수준)"
      high:     "suppression 1개 이상 위반"
      critical: "symbolic_lighthouse + text_overlay 등 복합 위반"
    required: true

  # ── 감정/공기 역할 ────────────────────────────────────────

  emotion_role:
    type: object
    description: "이 이미지가 감정 여정에서 어디에 위치하는가"
    fields:
      position:
        type: enum
        values: ["opening", "transition", "climax", "residue", "continuation"]
        mapping:
          confusion:    "opening"
          pause:        "transition"
          calm:         "residue"
          curiosity:    "continuation"
          fragile_hope: "climax"
      narrative_weight:
        type: enum
        values: ["heavy", "medium", "light"]
        description: "이 이미지가 서사에서 얼마나 많은 감정을 담는가"
    required: false  # 자동 추론 가능

  echo_type:
    type: enum
    values: ["storybook", "miracle_video", "shorts_thumbnail", "postcard", "ambient"]
    description: "이 asset이 가장 적합한 파생 용도"
    mapping:
      memory_anchor:    ["postcard", "storybook"]
      echo_fragment:    ["miracle_video", "storybook", "shorts_thumbnail"]
      transitional_air: ["storybook", "ambient"]
      weak_survival:    ["ambient"]
    required: false  # classification에서 추론 가능

  # ── 공기 품질 지표 ────────────────────────────────────────

  air:
    type: object
    description: "이 이미지의 공기(atmosphere) 품질 측정값"
    fields:
      continuity_readable:
        type: boolean
        description: "첫 인상에서 continuity가 읽히는가 (harbor/space reads first)"
      character_submissive:
        type: boolean
        description: "소원이가 공간에 복종적인가 (공간이 소원이보다 먼저 읽힘)"
      world_indifferent:
        type: boolean
        description: "외부 세계가 소원이에 무관심한가"
      suppression_clean:
        type: boolean
        description: "모든 suppression rule을 통과했는가"
    required: false

  # ── 분류 시스템 ──────────────────────────────────────────

  classification:
    type: enum
    values: ["A", "A-", "B", "C", "D"]
    definition:
      A:  "canonical_register_candidate — 즉시 파생 가능"
      A-: "pending_fix — 소규모 수정 후 A 승격 가능"
      B:  "reusable_fragment — 파생 가능하나 조건 있음"
      C:  "archive_only — 참조용 보존, 파생 금지"
      D:  "deprecated_regenerate_required — 실사용 금지"
    promotion_rules:
      D_to_C: "CEO 결정 필요"
      C_to_B: "drift 수정 완료 + CEO 확인"
      B_to_A: "drift 전체 해결 + CEO 검수 통과"
      A_minus_to_A: "pending_fix 완료 (GATE 처리)"
    required: true

  class:
    type: enum
    values: ["memory_anchor", "echo_fragment", "transitional_air", "weak_survival"]
    definition:
      memory_anchor:    "장소 정체성 × 파생 가능성 HIGH — 포스트카드/스토리북 개막"
      echo_fragment:    "파생 가능성 HIGH — 기적영상/쇼츠/스토리북 클라이맥스"
      transitional_air: "장소 정체성 기여 — 스토리북 중간 장면"
      weak_survival:    "보존 필요 최소 공기 — Ambient 전용"
    required: true

  echo_potential:
    type: enum
    values: ["high", "medium", "low", "pending"]
    description: "파생 결과물로 확장 가능성"
    high_criteria:
      - "class: memory_anchor 또는 echo_fragment"
      - "continuity_score: high"
      - "drift_risk: low"
    required: true

  # ── 상태 관리 ────────────────────────────────────────────

  derivation_safe:
    type: enum
    values: ["true", "partial", "false"]
    definition:
      true:    "파생 결과물에 drift가 전파되지 않음"
      partial: "특정 채널에서만 파생 안전"
      false:   "파생 금지 (drift가 전파됨)"
    required: true

  status:
    type: enum
    values:
      - "selected_v0"      # 초기 선정
      - "selected_v1"      # GATE 처리 후 업그레이드
      - "reusable_fragment_v0"  # B 클래스 보존
      - "archived_v0"      # C 클래스 보존
      - "deprecated_regenerate_required"  # D 클래스 폐기 대기
    required: true

  # ── GATE 이력 ────────────────────────────────────────────

  gate_history:
    type: array
    description: "이 asset에 적용된 GATE 처리 기록"
    item_schema:
      gate: "string (e.g., GATE_5, GATE_6b)"
      date: "YYYY-MM-DD"
      action: "string"
      method: "string"
      result: "enum: PASS | FAIL | PARTIAL"
    required: false

  upgrade_path:
    type: string
    description: "현재 classification에서 A로 승격하기 위한 조건"
    required: false  # A 등급이면 null

  pending_fix:
    type: string
    description: "A- 상태에서 A로 승격하기 위한 잔여 작업"
    required: false

  review_notes:
    type: string
    description: "분류 판단 근거 — 육안 검수 소견"
    required: false
```

---

## 2. 완성 예시

```yaml
# 완성 예시 — hamel calm emerald (GATE 6+6b 처리)
example_asset:
  asset_id: hamel_calm_003
  source_id: AS-hamel-calm-emerald
  location: yeosu_hamel
  emotion: calm
  gemstone: emerald
  
  source_ratio: "2:3"
  resolution: "1024×1536"
  legacy_ratio: true
  ratio_verified: true
  
  continuity_score: high
  drift_risk: low
  
  emotion_role:
    position: residue
    narrative_weight: heavy
    
  echo_type: ["storybook", "postcard"]
  
  air:
    continuity_readable: true
    character_submissive: true
    world_indifferent: true
    suppression_clean: true
    
  classification: A
  class: memory_anchor
  echo_potential: high
  
  derivation_safe: true
  status: selected_v1
  
  gate_history:
    - gate: GATE_6
      date: 2026-05-17
      action: "AI 재생성 (ordinary harbor continuity)"
      method: "gpt-image-1 prompt rebuild"
      result: PASS
    - gate: GATE_6b
      date: 2026-05-17
      action: "recolor halo suppression"
      method: "base-blend (result = base + (recolored - base) × 0.05)"
      result: PASS
      
  review_notes: >
    항구가 소원이보다 먼저 읽힘. 등대 비중심. 별 거의 보이지 않음.
    에메랄드 halo GATE 6b로 제거. harbor continuity 강함.
    calm memory_anchor 역할 수행.
```

---

## 3. 스키마 활용 규칙

```yaml
schema_rules:

  new_asset_registration:
    required_fields:
      - asset_id
      - source_id
      - location
      - emotion
      - gemstone
      - source_ratio
      - ratio_verified
      - continuity_score
      - drift_risk
      - classification
      - class
      - echo_potential
      - derivation_safe
      - status
    optional_fields:
      - emotion_role
      - echo_type
      - air
      - gate_history
      - review_notes
      
  classification_decision_tree:
    step1: "suppression_pass? → NO → D 또는 C"
    step2: "continuity_score? → low → C 또는 D"
    step3: "drift_risk? → critical → D"
    step4: "drift_risk? → high → C"
    step5: "ratio_verified? → false → A-"
    step6: "all checks pass → A"
    
  gate_trigger_conditions:
    GATE_4: "drift_risk: medium (warmth over threshold)"
    GATE_5: "drift_risk: medium (star_size over threshold)"
    GATE_6: "classification: D (regenerate_required)"
    GATE_6b: "recolor_halo_artifact detected after full25"
    
  auto_fields:
    echo_type: "classification + class에서 추론 가능"
    emotion_role: "emotion enum에서 추론 가능"
    
  immutable_after_registration:
    - asset_id
    - source_id
    - location
    - emotion
    - gemstone
    
  mutable:
    - classification (GATE 처리 후 변경)
    - status (GATE 처리 후 변경)
    - drift_risk (처리 후 재측정)
    - gate_history (추가만 가능, 삭제 금지)
```

---

## 4. Registry 파일 연결

```yaml
registry_files:

  primary:
    path: "docs/ssot/air-engine/REGISTRY_v1_verified_2026-0516.md"
    format: Markdown (인간 가독 SSOT)
    update_trigger: "GATE 완료 또는 CEO 결정 시"
    
  manifest:
    path: "public/images/canonical/source/MANIFEST.md"
    format: Markdown
    update_trigger: "canonical 등록/해제 시"
    
  future_machine_readable:
    path: "public/images/canonical/source/registry.json (예정)"
    format: JSON
    schema: "이 문서 AIR-SCHEMA-010"
    status: PLANNED (현재 Markdown으로 관리)
    
  config_source:
    thumbnails: "config/thumbnail/{location}.json"
    copy:       "config/thumbnail/{location}-copy.json"
    gem_map:    "config/thumbnail/emotion-gem-map.json"
    star_color: "config/thumbnail/star-color-map.json"
```
