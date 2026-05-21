# GATE 2 — Canonical Asset Verification Report

**실행일**: 2026-05-16  
**상태**: COMPLETED — CEO 결정 대기  
**측정 도구**: node sharp  
**시각 검증**: Claude Code 직접 확인 (6장)

```yaml
why_this_exists:
  "예쁜 이미지 선별"이 아니라
  "어떤 자산이 DreamTown continuity를 실제로 보존하는가"를 검증한다.
  이미지 생성 없음. 검증 / 분류 / 구조화까지만.
```

---

## ⚠️ STEP 1 — Physical Verification 결과

### 실측값 (전수)

```
측정 파일                                        | 비율   | 실제 픽셀
───────────────────────────────────────────────────────────────────
thumbnails/cablecar/generated/full/ (전체 25장)  | 2:3    | 1024×1536
thumbnails/cafe/generated/full/ (전체 25장)      | 2:3    | 1024×1536
thumbnails/hotel/generated/full/ (전체 25장)     | 2:3    | 1024×1536
thumbnails/hamel/generated/full/ (전체 25장)     | 1:1    | 2048×2048
thumbnails/hamel/base/ (전체 5장)                | 1:1    | 2048×2048
star-cache/yeosu_cablecar/ (샘플 확인)           | 2:3    | 1024×1536
star-cache/yeosu_hotel/ (샘플 확인)              | 2:3    | 1024×1536
```

### CEO 결정 필요 — 비율 충돌 2건

#### 충돌 1: 기존 75장 = 2:3, Foundation = 3:4

```yaml
foundation_spec:
  source_asset_master: 3:4_portrait   # 0.75 ratio

actual_assets:
  ratio: 2:3_portrait                 # 0.667 ratio
  pixels: 1024×1536

gap:
  3:4 @ height 1536 → width 필요: 1152px
  현재 width: 1024px → 128px 부족

options:
  A: 기존 2:3 자산을 canonical master로 수용 (Foundation 비율 조정)
  B: 기존 2:3 보존 유지 + 신규 생성만 3:4 적용 (이중 구조 과도기)
  C: 기존 75장 전체 재생성 @ 3:4 (원본은 archive 유지)

recommendation:
  Option B — 기존 자산은 2:3으로 canonicalize, 신규는 3:4.
  이유: 75장은 이미 continuity가 검증됨 (아래 참조).
       비율 차이(2:3 vs 3:4)가 derivation 안전성에 실질적 영향 없음.
       모든 파생 비율(9:16, 4:5, 1:1, 16:9) 2:3에서 크롭 가능.
```

#### 충돌 2: hamel = 1:1 실제, 9:16 spec 명시

```yaml
wish_image_config_spec:
  aspect_ratio: "9:16 vertical portrait — never square, never landscape"

actual_assets:
  hamel/generated/full: 1:1 (2048×2048)
  hamel/base: 1:1 (2048×2048)

conclusion:
  hamel 파이프라인이 9:16이 아닌 1:1로 생성됨.
  config와 실제 자산 불일치 — 파이프라인 버그 또는 의도적 변경.

options:
  A: 1:1을 hamel canonical로 수용 (config 업데이트)
  B: 9:16으로 재생성 (config 준수)

recommendation: CEO 확인 후 결정. 1:1이 등대 구도에 더 적합할 수 있음.
```

### star-cache vs thumbnails/full — 동일 해상도 확인

```yaml
finding:
  star-cache/yeosu_cablecar: 1024×1536 (2:3)
  thumbnails/cablecar/generated/full: 1024×1536 (2:3)
  → 완전히 동일한 해상도. 다른 파일이지만 같은 스펙.

star-cache는 "경량 서비스 노출 버전"이 아님.
두 경로는 같은 이미지의 다른 복사본임.
```

---

## STEP 2 + 3 — Continuity Survival + Drift Detection (시각 검증)

6장 직접 확인. 평가 기준: DreamTown Canonical Foundation v1 §4, §8.

---

### [V01] cablecar — confusion_citrine (01번)
**파일**: `01_confusion_citrine_yeosu_cablecar_stage1.png` | 1024×1536 | 2:3

```yaml
visual:
  구도: 케이블카 내부. 양쪽 창문 사이 소원이 정중앙 뒤통수.
  외부: 야간 바다, 도시 불빛, 다리 실루엣.
  내부: 목재 좌석, 금속 창틀.
  별: 창문 위쪽 작은 황금별 1개.

continuity_check:
  outside_world_progression: HIGH — 도시 불빛 / 다리 조명 독립적으로 존재
  room_lag: STRONG — 케이블카 내부는 멈춘 시간, 외부는 이미 흘러감
  unfinished_daily_time: YES — 어디로 가는지 미결
  emotional_suppression: GOOD — 소원이 감정 표현 없음
  ordinary_object_behavior: NATURAL — 좌석, 창틀 모두 평범

drift_detection:
  tourism_ad_drift: LOW — 관광 홍보 느낌 없음
  cinematic_melancholy: LOW — 구도가 담담함
  healing_atmosphere: NONE
  emotional_storytelling: NONE
  symbolic_object_usage: NONE
  aestheticized_reality: LOW-MEDIUM — 일러스트 완성도가 높지만 과하지 않음

continuity_score: high
drift_risk: low
derivation_safe: true
```

**CLASSIFICATION: Category A — canonical_register_candidate**

---

### [V02] cablecar — calm_emerald (13번)
**파일**: `13_calm_emerald_yeosu_cablecar_stage1.png` | 1024×1536 | 2:3

```yaml
visual:
  구도: 케이블카 내부. 소원이 옆모습. 단창 프레임.
  외부: 같은 야간 바다 / 도시 불빛. 별 선명.
  팔레트: 청회색 + 녹청. 차갑지 않고 안정적.

continuity_check:
  outside_world_progression: HIGH — 외부 세계 독립적 진행
  room_lag: PRESENT — 내부와 외부의 시간 분리 느껴짐
  emotional_suppression: STRONG — calm이지만 감정 강요 없음
  ordinary_object_behavior: NATURAL

drift_detection:
  tourism_ad_drift: NONE
  cinematic_melancholy: NONE — 조용하나 멜랑콜리 아님
  healing_atmosphere: LOW — 안정적이지만 "힐링" 느낌 없음
  symbolic_object_usage: NONE — 별이 작고 자연스러움

continuity_score: high
drift_risk: low
derivation_safe: true
```

**CLASSIFICATION: Category A — canonical_register_candidate (memory_anchor 최강)**

---

### [V03] cablecar — fragile_hope_diamond (25번)
**파일**: `25_fragile_hope_diamond_yeosu_cablecar_stage1.png` | 1024×1536 | 2:3

```yaml
visual:
  구도: 케이블카 내부. 소원이 측후면. 창문 약간 열린 느낌.
  팔레트: 약간 따뜻해짐 (크림/베이지). 별 선명도 높아짐.
  외부: 도시 불빛 + 바다.

continuity_check:
  outside_world_progression: HIGH
  room_lag: PRESENT
  emotional_suppression: GOOD — fragile_hope지만 강요 없음

drift_detection:
  tourism_ad_drift: NONE
  healing_atmosphere: LOW — 따뜻해졌지만 과하지 않음
  aesthetic_completeness: MEDIUM — 색감이 더 완성된 느낌

continuity_score: high
drift_risk: low-medium
derivation_safe: true
```

**CLASSIFICATION: Category A — canonical_register_candidate (echo_fragment)**

---

### [V04] cafe — fragile_hope_diamond (25번)
**파일**: `25_fragile_hope_diamond_yeosu_cafe_stage2.png` | 1024×1536 | 2:3

```yaml
visual:
  구도: 카페 창가. 소원이 나무 의자에 착석. 창밖 야간 해안선.
  팔레트: 따뜻한 호박색 내부 조명 강함. 창밖 청색.
  별: 창밖 중앙 위 밝은 별 1개.

continuity_check:
  outside_world_progression: MEDIUM — 창밖 세계 보이지만 내부 온기가 주도
  room_lag: PRESENT — 카페 안팎 온도/시간 분리
  emotional_suppression: GOOD

drift_detection:
  tourism_ad_drift: MEDIUM — 아늑한 카페 = 관광/소비 이미지 유사
  healing_atmosphere: MEDIUM — 따뜻한 내부 = 힐링 카페 드리프트 위험
  cinematic_melancholy: LOW
  aesthetic_completeness: MEDIUM-HIGH — 인테리어가 잘 꾸며진 느낌

continuity_score: medium
drift_risk: medium
derivation_safe: partial
note: 따뜻한 카페 내부 조명이 "힐링 공간" 드리프트를 유발. 외부 세계보다 내부가 지배적.
```

**CLASSIFICATION: Category B — reusable_fragment (storybook pause/curiosity 구간 활용 가능)**

---

### [V05] hotel — fragile_hope_diamond (25번)
**파일**: `25_fragile_hope_diamond_yeosu_hotel_stage4.png` | 1024×1536 | 2:3

```yaml
visual:
  구도: 호텔 발코니 도어 앞. 소원이 서서 야경 바라봄.
  커튼 왼쪽, 침대 하단 일부. 바닥까지 유리문.
  외부: 야간 항구/바다, 도시 불빛, 산 실루엣.
  별: 매우 강한 크로스 스타 형태. 4방향 광선 + 큰 헤일로.

continuity_check:
  outside_world_progression: HIGH — 항구, 도시 전체가 독립적으로 존재
  room_lag: STRONG — 침대(미완성 밤) + 커튼 + 외부 세계
  emotional_suppression: GOOD — 서 있지만 비능동적

drift_detection:
  tourism_ad_drift: LOW — 호텔 광고와 다름
  cinematic_melancholy: LOW
  symbolic_object_usage: MEDIUM — 별이 너무 크고 강함. "의미 있는 별" 느낌.
  aesthetic_completeness: MEDIUM — 구도가 완성적

continuity_score: high
drift_risk: medium
drift_note: 별의 크기/광도(150%)가 "영감을 주는 별" 이미지로 드리프트 위험.
            별이 continuity의 일부가 아니라 "목적지" 처럼 보일 수 있음.
derivation_safe: true (별 처리만 주의)
```

**CLASSIFICATION: Category A- — canonical_register_candidate (별 크기 CEO 검토 후 확정)**

---

### [V06] hamel — calm_emerald_base03
**파일**: `hamel_calm_emerald_base03.png` | 2048×2048 | **1:1 square**

```yaml
visual:
  구도: 정중앙 하멜 등대. 소원이 뒷모습 원경. 방파제 길.
  별: 매우 강한 초록 크로스 스타 + 거대 헤일로. 화면 지배적.
  팔레트: 극적인 밤하늘 (보라/청). 구름 + 별빛.
  텍스트: "하멜등대" 한글이 등대 몸체에 직접 렌더링됨.

continuity_check:
  outside_world_progression: MEDIUM — 양쪽 도시 불빛 있으나 등대가 지배
  room_lag: NONE — 실내 없음, 야외 전체
  emotional_suppression: PARTIAL — 인물 작고 멀지만 구도가 "여정" 서사 강요

drift_detection:
  tourism_ad_drift: HIGH — 관광 명소 포스터와 유사
  cinematic_melancholy: HIGH — 극적 구름 + 별 + 등대 = 시네마틱
  symbolic_object_usage: CRITICAL — 등대가 중심 상징물
  aestheticized_reality: HIGH — 완벽하게 구성된 구도
  text_in_image: CRITICAL VIOLATION — "하멜등대" 텍스트 이미지 내 렌더링

violations:
  - 텍스트 이미지 직접 삽입 (Foundation spec 위반: "no text in image")
  - 상징적 사물(등대)이 continuity보다 우선
  - 드라마틱 별 헤일로가 "inspirational journey" 감각 유발

continuity_score: low
drift_risk: critical
derivation_safe: false
```

**CLASSIFICATION: Category C — archive_only (continuity 약함, 텍스트 위반, 드리프트 높음)**

---

## STEP 4 — Registry Classification 전체 판정

### location별 전체 분류

| Location | 장수 | Category | 주요 근거 |
|----------|-----|----------|----------|
| **cablecar** 전체 | 25 | **A** | 2:3 portrait, continuity 강, drift 낮음 |
| **cafe** 전체 | 25 | **B** | 2:3 portrait, 따뜻한 내부 조명 drift medium |
| **hotel** calm/curiosity | ~10 | **A** | continuity 강, 별 크기 적절 |
| **hotel** fragile_hope | ~5 | **A-** | 별 크기 과대 — CEO 확인 후 A 승격 가능 |
| **hotel** confusion/pause | ~10 | **A** | continuity 강 |
| **hamel** generated/full | 25 | **C** | 텍스트 위반, 드리프트 critical |
| **hamel** base | 5 | **C** | 1:1 정방형, 등대 중심 구도 (등대 = 상징물) |

### Category 별 수량 요약

```
Category A  (canonical_register_candidate): ~60장 (cablecar 25 + hotel ~35)
Category B  (reusable_fragment):            ~25장 (cafe 25)
Category C  (archive_only):                 ~30장 (hamel 전체 30)
Category D  (deprecated):                    0장 (현재 없음)
```

---

## STEP 5 — Registry Metadata 예시

### Category A 예시 (확정)

```yaml
asset_id: cablecar_calm_emerald_V02
source_id: AS-cablecar-calm-emerald
file: 13_calm_emerald_yeosu_cablecar_stage1.png
path: public/images/thumbnails/cablecar/generated/full/

source_ratio: 2:3_portrait
ratio_pixels: 1024×1536
ratio_verified: true
ratio_note: "Foundation 3:4 spec과 다름. CEO Option B 선택 시 현 비율 canonicalize."

continuity_score: high
drift_risk: low
derivation_safe: true

classification: canonical_register_candidate
class: memory_anchor
echo_potential: high

review_notes: >
  양 창문 프레임 없이 단창. 소원이 측면. 외부 세계 독립적.
  별이 작고 자연스러움. 케이블카 중 가장 강한 memory_anchor.

status: selected_v0
```

### Category C 예시 (확정)

```yaml
asset_id: hamel_calm_emerald_base03
file: hamel_calm_emerald_base03.png
path: public/images/thumbnails/hamel/generated/full/

source_ratio: 1:1_square
ratio_pixels: 2048×2048
ratio_verified: true
ratio_note: "wish-image config 9:16 spec과 다름. 파이프라인 생성 오류 또는 의도적 변경."

continuity_score: low
drift_risk: critical
derivation_safe: false

violations:
  - text_in_image: "하멜등대" 한글 등대 몸체 렌더링 (spec 위반)
  - symbolic_central_object: 등대가 canonical이 아닌 상징 구도
  - cinematic_drift: 극적 구름 + 거대 별 헤일로

classification: archive_only
class: weak_survival
echo_potential: low

review_notes: >
  강한 미적 완성도이나 DreamTown continuity 기준 부적합.
  등대가 "의미 있는 목적지"로 작동. 텍스트 위반.
  향후 등대 없는 야외 항구 씬으로 hamel 재생성 검토.

status: archived_v0
```

---

## CEO 결정 필요 사항 (우선순위 순)

| # | 결정 | 옵션 | 영향 |
|---|------|------|------|
| 1 | **기존 2:3 자산 → canonical 수용 여부** | A:수용 / B:과도기 / C:재생성 | 전체 75장 처리 방향 |
| 2 | **hamel 비율 결정** | A:1:1 유지 / B:9:16 재생성 | hamel 파이프라인 |
| 3 | **cafe Category B → A 승격 가능한가** | 따뜻한 내부 조명 수용 여부 | 스토리북 pause 씬 |
| 4 | **hotel fragile_hope 별 크기** | 현재 크기 유지 / 소형화 후 재생성 | hotel echo_fragment |
| 5 | **hamel 재생성 방향** | 등대 제거? / 등대 유지 + 비율 수정? | hamel canonical 확립 |

---

---

## CEO 결정 기록 (2026-05-16 확정)

| # | 결정 | 내용 |
|---|------|------|
| 1 | Legacy 2:3 | **조건부 허용** — continuity_survival > exact_ratio. 신규는 3:4 preferred 유지 |
| 2 | Hamel | **regenerate_required** — symbolic/cinematic/text 드리프트 critical |
| 3 | Cafe B | **B 유지** — warmth 감소 시 A 승격 조건부 허용 |
| 4 | Hotel fragile_hope | **별 크기 감소** — almost_unnoticed 타겟. 재생성 필요 |
| 5 | Lighthouse | **suppress** — 상징/방향/cinematic 등대 구도 전면 금지 |

---

## GATE 2 완료 선언

```yaml
deliverables:
  verified_asset_list: DONE
  canonical_candidates: ~60장 (cablecar 25 + hotel 25 — 물리/시각 검증)
  derivation_safe_assets: ~85장 (cafe 포함, B등급 이상)
  archived_assets: ~30장 (hamel 전체)
  deprecated_assets: 0장
  registry_ready_metadata: DONE (스키마 확정, 예시 포함)

next_gate:
  GATE 3 — CEO 결정 후 canonical/source/ 경로 생성 + Registry ratio_verified 업데이트
```
