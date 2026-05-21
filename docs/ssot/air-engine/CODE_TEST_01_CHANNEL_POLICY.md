# CODE_TEST_01 — Channel Policy
## DreamTown 채널별 공기 운영 정책

**문서 코드**: AIR-CHAN-008  
**레이어**: Operational SSOT (Layer 2)  
**작성**: 2026-05-17  
**의존 문서**: AIR-CONST-001, AIR-PIPE-005  
**상태**: ACTIVE

```yaml
purpose: >
  채널별 결과물 생성 정책을 고정한다.
  어떤 채널이 canonical이고, 어떤 채널이 파생인지 명확히 한다.
  16:9를 canonical으로 쓰는 사고를 차단한다.

master_rule:
  source_asset_master: 3:4_portrait
  all_channels_derive_from: canonical_source (public/images/canonical/source/)
  exception: hamel wish-image (9:16 portrait — 별도 시스템)
```

---

## 1. 채널 분류표

| 채널 | 역할 | 비율 | 원천 | canonical 여부 |
|------|------|------|------|---------------|
| Storybook | primary output | 3:4 | canonical master 직접 | **YES — CANONICAL** |
| YouTube Long | derived projection | 16:9 | 3:4에서 cinematic crop | NO — 파생 |
| Shorts / Reels | invitation fragment | 9:16 | 3:4에서 세로 crop | NO — 파생 |
| Postcard | residual memory surface | 4:3 | 3:4에서 가로 crop | NO — 파생 |
| Ambient Live | continuity container | flexible | 3:4 루프 / 실시간 | NO — 파생 |

---

## 2. Storybook (Primary — Canonical)

```yaml
storybook:
  role: primary
  function: "DreamTown continuity의 1차 결과물. 모든 파생의 기준."
  ratio: 3:4_portrait
  resolution_min: 1536×2048
  
  content_selection:
    primary_class:  ["memory_anchor", "echo_fragment"]
    primary_emotion: ["calm", "curiosity", "fragile_hope"]
    minimum_continuity_score: high
    
  structure:
    pages_per_location: 5  # 5감정 × 1장 기준
    order: "confusion → pause → calm → curiosity → fragile_hope"
    text_layer: separate (썸네일 텍스트 오버레이, not AI-generated)
    
  grammar_requirements:
    temporal_asymmetry: required
    room_lag: required
    exterior_indifference: required
    suppression_pass: required
    
  file_source: "public/images/canonical/source/{location}/"
  
  output_path: "outputs/storybook/{location}/"
  
  notes: >
    Storybook이 canonical이다. YouTube, Shorts, Postcard는 모두
    Storybook 결과물을 후처리하거나 잘라낸 파생이다.
    Storybook 장면을 만들기 위해 16:9로 생성하는 행위 금지.
```

---

## 3. YouTube Long (Derived Projection)

```yaml
youtube_long:
  role: derived_projection
  function: >
    Storybook 스토리를 16:9 화면으로 변환한 영상 결과물.
    "DreamTown의 공기를 영상으로 경험" — 새 시각 언어가 아닌 기존 공기의 확장.
  ratio: 16:9
  
  derivation_source: storybook (3:4 canonical)
  crop_method: "3:4 master에서 중앙 크롭 또는 cinematic pan"
  
  content_selection:
    allowed_class: ["memory_anchor", "echo_fragment"]
    minimum_continuity_score: high
    preferred_emotion: ["calm", "fragile_hope"]
    
  grammar_requirements:
    inherits_from_source: true
    additional_drift_check:
      - "cinematic 편집이 continuity를 훼손하지 않는가"
      - "BGM이 healing/inspirational 분위기를 유발하지 않는가"
    
  forbidden:
    - "16:9로 새로 AI 생성하는 행위"
    - "YouTube용 별도 프롬프트 사용"
    - "16:9를 canonical로 취급하는 사고"
    
  notes: >
    YouTube 영상은 "파생 투영"이다.
    3:4 master가 없으면 YouTube 영상도 없다.
```

---

## 4. Shorts / Reels (Invitation Fragment)

```yaml
shorts_reels:
  role: invitation_fragment
  function: >
    DreamTown 공기의 한 조각을 외부에 노출.
    "소원이와 함께 15초 동안 항구에 있었다" — 가입 전 경험.
  ratio: 9:16
  duration_max: 60s
  
  derivation_source: "3:4 canonical → 9:16 세로 crop"
  
  content_selection:
    primary_class: ["echo_fragment", "transitional_air"]
    primary_emotion: ["confusion", "curiosity", "fragile_hope"]
    continuity_score: medium_or_above
    
  grammar_requirements:
    exterior_indifference: required
    suppression_pass: required
    temporal_asymmetry: preferred
    
  forbidden:
    - "스토리 결말 공개 (curiosity 유지 필수)"
    - "inspirational ending 편집"
    - "healing 분위기 BGM"
    - "소원이 얼굴 노출"
    
  hook_grammar:
    open: "소원이 등장 — 배경부터 읽힌다"
    middle: "외부 세계가 계속 진행됨"
    close: "미완성 상태로 끝남 — 결론 없음"
    
  notes: >
    Shorts는 "招待狀(초대장)"이지 "완결된 이야기"가 아니다.
    보고 나서 DreamTown에 가보고 싶어야 한다.
    해결/결말/치유로 끝나면 안 된다.
```

---

## 5. Postcard (Residual Memory Surface)

```yaml
postcard:
  role: residual_memory_surface
  function: >
    "그 공간에 있었던 기억의 잔여면."
    소원이의 여정이 지나간 자리에 남은 공기를 정지 화면으로 담는다.
    카카오 공유 / 인쇄 / SNS 배포용.
  ratio: 4:3
  
  derivation_source: "3:4 canonical → 4:3 가로 crop"
  
  content_selection:
    primary_class: ["memory_anchor"]
    primary_emotion: ["calm"]  # memory_anchor × calm = 최강 postcard
    minimum_continuity_score: high
    
  grammar_requirements:
    room_lag: required
    unfinished_object_residue: preferred
    exterior_indifference: required
    
  immediate_candidates:
    cablecar: "calm 5장 (memory_anchor 최강)"
    hotel:    "calm 5장"
    cafe:     "calm 5장"
    hamel:    "calm 5장 (GATE 6 완료)"
    total:    "20장 즉시 파생 가능"
    
  text_policy:
    allowed: "location name, short copy"
    forbidden: "inspirational quote, healing message"
    copy_source: "config/thumbnail/{location}-copy.json"
    
  notes: >
    Postcard는 기억의 "표면"이다.
    그 안에 드라마나 결말이 없어야 한다.
    공간이 먼저, 소원이는 그 안에 있는 흔적.
```

---

## 6. Ambient Live (Continuity Container)

```yaml
ambient_live:
  role: continuity_container
  function: >
    DreamTown 공기가 실시간으로 흐르는 컨테이너.
    YouTube Live 또는 앱 내 배경 루프.
    "공기가 계속 흐른다" — 이벤트가 아닌 상태.
  ratio: flexible (16:9 for YouTube Live, variable for app)
  
  derivation_source: "canonical 이미지 루프 또는 슬라이드쇼"
  
  content_selection:
    all_classes_allowed: true
    sequence_rule: "emotion order 준수 (confusion→pause→calm→curiosity→fragile_hope)"
    loop: true
    
  grammar_requirements:
    suppression_pass: required
    no_climax_editing: true  # 감정 고조 편집 금지
    
  forbidden:
    - "특정 이미지를 클라이맥스로 배치"
    - "BGM이 continuity를 깨는 전환점"
    - "소원이의 성장/해결을 암시하는 순서"
    
  notes: >
    Ambient Live는 "DreamTown이 지금 이 순간도 존재한다"는 신호다.
    보는 사람이 언제 들어와도, 언제 나가도 공기가 흐르고 있다.
    끝이 없는 것이 정상이다.
```

---

## 7. 채널 간 관계 규칙

```yaml
inter_channel_rules:

  canonical_hierarchy:
    1st: "Storybook (3:4) — 원본"
    2nd: "Postcard (4:3 crop)"
    3rd: "Shorts (9:16 crop)"
    4th: "YouTube (16:9 crop)"
    5th: "Ambient Live (루프)"
    
  derivation_direction:
    allowed: "상위 → 하위 (3:4 → 9:16, 4:3, 16:9)"
    forbidden: "하위 → 상위 재가공 (9:16 crop을 3:4 canonical로 역추적)"
    
  consistency_check:
    rule: "같은 source_id에서 파생된 결과물은 emotion/location 좌표가 동일해야 함"
    check_field: "source_id, emotion, location"
    
  drift_propagation:
    rule: "원천에 drift가 있으면 모든 파생물에 drift가 전파됨"
    implication: "Category A 원천만 파생 착수 가능 (GATE 3 이후)"
```
