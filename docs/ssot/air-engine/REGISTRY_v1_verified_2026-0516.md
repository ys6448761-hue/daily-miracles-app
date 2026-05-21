# Canonical Asset Registry v1 — Verified
## DreamTown Continuity Source Asset System

**버전**: v1.0 (VERIFIED)  
**작성**: 2026-05-16  
**기준**: GATE 2 물리 실측 + 시각 검증 + CEO 결정 반영  
**상태**: ACTIVE

```yaml
principle:
  NOT: 가장 예쁜 장면
  BUT: 가장 오래 continuity가 살아남는 장면
```

---

## Metadata Schema (확정)

```yaml
asset_id:          # 고유 식별자
source_id:         # AS-{location}-{emotion}-{gemstone}
location:          # yeosu_cablecar | yeosu_cafe | yeosu_hotel | yeosu_hamel
emotion:           # confusion | pause | calm | curiosity | fragile_hope
gemstone:          # 파일명 기준

source_ratio:      # 실측 비율 (2:3 | 1:1 | 9:16)
legacy_ratio:      # true = 3:4 spec 이전 생성자산 (2:3 허용)
ratio_verified:    # 물리 실측 완료 여부

continuity_score:  # high | medium | low
drift_risk:        # low | medium | high | critical
derivation_safe:   # true | partial | false

classification:    # A | B | C | D
class:             # memory_anchor | echo_fragment | transitional_air | weak_survival
echo_potential:    # high | medium | low | pending

upgrade_path:      # (B→A 승격 조건)
pending_fix:       # (A-→A 필요 작업)
review_notes:      # 판단 근거

status:            # selected_v0 | reusable_fragment_v0 | archived_v0 | deprecated_regenerate_required
```

---

## LOCATION 1 — yeosu_cablecar

**물리**: 1024×1536 (2:3 portrait) — legacy_ratio: true  
**CEO 결정**: 2:3 legacy canonical 허용  
**전체 분류**: **Category A — canonical_register_candidate** (25/25)

### 감정별 분류 상세

| 감정 | continuity | drift | class | echo_potential | status |
|------|-----------|-------|-------|---------------|--------|
| confusion (5장) | high | low | transitional_air | medium | selected_v0 |
| pause (5장) | high | low | transitional_air | medium | selected_v0 |
| calm (5장) | **high** | **low** | **memory_anchor** | **high** | **selected_v0 ★** |
| curiosity (5장) | high | low | echo_fragment | high | selected_v0 |
| fragile_hope (5장) | high | low-medium | echo_fragment | high | selected_v0 |

### 대표 자산 상세 기록

```yaml
asset_id: cablecar_calm_013
source_id: AS-cablecar-calm-emerald
file: 13_calm_emerald_yeosu_cablecar_stage1.png
path: public/images/thumbnails/cablecar/generated/full/

source_ratio: 2:3
legacy_ratio: true
ratio_verified: true

continuity_score: high
drift_risk: low
derivation_safe: true

classification: A
class: memory_anchor
echo_potential: high

review_notes: >
  단창 구도. 소원이 측면. 외부 세계(바다/도시/다리) 독립적 진행.
  별이 작고 자연스러움. cablecar 세트 전체 중 strongest memory_anchor.
  실내/외 시간 분리 명확. "현실이 이미 흘러갔다" 감각 강함.

status: selected_v0
```

```yaml
asset_id: cablecar_confusion_001
source_id: AS-cablecar-confusion-citrine
file: 01_confusion_citrine_yeosu_cablecar_stage1.png

continuity_score: high
drift_risk: low

review_notes: >
  양창 프레임 + 소원이 정중앙. 케이블카 내부가 닫힌 공간으로 작동.
  room_lag 강함. 세계는 외부에서 계속 흘러가고 있음.

status: selected_v0
```

### 전체 세트 요약

```yaml
yeosu_cablecar:
  total: 25
  category_A: 25
  category_B: 0
  legacy_canonical: true  # 2:3 portrait, CEO 허용
  derivation_ready: true
  storybook_ready: true
  postcard_ready: true  # calm 5장 즉시 가능
```

---

## LOCATION 2 — yeosu_cafe

**물리**: 1024×1536 (2:3 portrait) — legacy_ratio: true  
**CEO 결정**: warmth 감소 처리 → GATE 4 완료 (2026-05-17)  
**전체 분류**: **Category A — canonical (25/25)**

### 감정별 분류 상세

| 감정 | continuity | drift | class | cat | status |
|------|-----------|-------|-------|-----|--------|
| confusion (5장) | high | low | transitional_air | **A** | selected_v1 |
| pause (5장) | high | low | transitional_air | **A** | selected_v1 |
| calm (5장) | high | low | memory_anchor ★ | **A** | selected_v1 |
| curiosity (5장) | high | low | echo_fragment | **A** | selected_v1 |
| fragile_hope (5장) | high | low | echo_fragment | **A** | selected_v1 |

### GATE 4 처리 기록

```yaml
cafe_gate4:
  completed: 2026-05-17
  method: selective_warmth_reduction_v2
  algorithm: background_preserving_pixel_level
  
  exterior_protection: true  # 창밖 야경 변경 없음
  
  stats_25img_avg:
    warm_pct_before: 41%   # R-B > 50 픽셀
    warm_pct_after:  30%
    warmth_diff_before: 26  # avg R-B
    warmth_diff_after:  11
    reduction: 58%
  
  remaining:
    window_frame: minimal amber (허용)
    star_color: partial warm in some (허용, 외부 요소)
  
  classification: A / selected_v1
  source: public/images/canonical/source/cafe/
  original: public/images/thumbnails/cafe/generated/full/
```

### 전체 세트 요약

```yaml
yeosu_cafe:
  total: 25
  category_A: 25  # GATE 4 완료
  legacy_canonical: true
  storybook_ready: true  # 전 감정 커버
  miracle_video_ready: true  # fragile_hope 세트 포함
  postcard_ready: true  # calm 5장 (memory_anchor)
```

---

## LOCATION 3 — yeosu_hotel

**물리**: 1024×1536 (2:3 portrait) — legacy_ratio: true  
**CEO 결정**: fragile_hope 별 크기 감소 → GATE 5 완료 (2026-05-17)  
**전체 분류**: **Category A 전체 25장**

### 감정별 분류 상세

| 감정 | continuity | drift | star | class | cat | status |
|------|-----------|-------|------|-------|-----|--------|
| confusion (5장) | high | low | 작음 | transitional_air | **A** | selected_v0 |
| pause (5장) | high | low | 작음 | echo_fragment | **A** | selected_v0 |
| calm (5장) | **high** | **low** | 안정 | **memory_anchor** | **A ★** | selected_v0 |
| curiosity (5장) | high | low | 적당 | echo_fragment | **A** | selected_v0 |
| fragile_hope (5장) | high | low | **감소완료** | echo_fragment | **A** | selected_v1 |

### fragile_hope 별 감소 처리 기록 (GATE 5)

```yaml
hotel_fragile_hope_star_issue:
  original_state:
    star_size: very_large (4방향 크로스 스타 + 거대 헤일로)
    drift_effect: "symbolic focus — 별이 목적지처럼 읽힘"
  
  CEO_decision: reduce_star_visibility
  
  gate5_result:
    completed: 2026-05-17
    method: background_preserving_gradient_reduction
    core_reduction: 95%  # excess brightness 기준
    star_after: almost_unnoticed  # 항구 불빛이 시선 주도
    symbolic_risk: low
    continuity: preserved
  
  classification: A / selected_v1
  source_path: public/images/canonical/source/hotel/
  original_preserved: public/images/thumbnails/hotel/generated/full/
```

### 전체 세트 요약

```yaml
yeosu_hotel:
  total: 25
  category_A: 25  # 전체 (GATE 5 완료 후 fragile_hope 5장 승격)
  category_A_minus: 0
  legacy_canonical: true
  
  gate5_note: >
    fragile_hope 5장 — 배경보존 gradient 감소 처리로
    별이 "외부 세계의 일부"로 축소됨. A 승격 완료.
    원본은 thumbnails/hotel/generated/full/에 보존.
  
  miracle_video_ready: true  # fragile_hope A 승격으로 가능
  storybook_ready: true
```

---

## LOCATION 4 — yeosu_hamel

**물리**: 1024×1536 (2:3 portrait) — GATE 6 재생성으로 spec 정렬  
**CEO 결정**: GATE 6 재생성 + GATE 6b halo suppression → **Category A 달성 (2026-05-17)**  
**전체 분류**: **Category A — canonical (25/25)**

### Hamel 자산 현황 (GATE 6 + 6b 완료)

> **⚠️ 2026-05-21 업데이트** — `canonical/source/hamel/` 경로가 archive로 이관됨.  
> **런타임 SSOT**: `public/images/thumbnails/hamel/generated/full/` (변경 없음)  
> 이관 근거: HAMEL_REFERENCE_AUDIT.md — 런타임 참조 0건, generated/full과 byte-identical 중복 확인.  
> 이관 commit: `88899dc`

| 경로 | 수량 | 비율 | 분류 | 상태 |
|------|-----|------|------|------|
| ~~`canonical/source/hamel/`~~ | 25 | 2:3 | ~~A — canonical~~ | ⛔ ARCHIVED 2026-05-21 → `archive/hamel/legacy/canonical_source/` (commit 88899dc) |
| **`thumbnails/hamel/generated/full/`** | 50 | 2:3 | **A — runtime SSOT** ★ | clean 25 + text 25 — 실제 서빙 경로 |
| `thumbnails/hamel/base/` | 5 | 2:3 | A (AI base) | GATE 6 생성 |
| ~~`thumbnails/hamel/generated/sample/`~~ (구) | — | 2:3 | **D — archive** | ⛔ ARCHIVED 2026-05-21 → `archive/hamel/legacy/sample_v1/` (commit 88899dc) |
| ~~`thumbnails/hamel/generated/sample_v2/`~~ (구) | — | 2:3 | **D — archive** | ⛔ ARCHIVED 2026-05-21 → `archive/hamel/legacy/sample_v2/` (commit 88899dc) |
| `outputs/wish-image/hamel/_archive/` | 6+1 | 9:16 | **C — archive_only** | 레퍼런스 보존 |

### 감정별 분류 상세

| 감정 | 보석 | continuity | drift | class | gate6b | status |
|------|------|-----------|-------|-------|--------|--------|
| confusion (5장) | moonstone | high | low | transitional_air | 미적용(자연혼합) | selected_v1 |
| pause (5장) | sapphire | high | low | transitional_air | ★ 적용 | selected_v1 |
| calm (5장) | emerald | **high** | **low** | **memory_anchor** | ★ 적용 | selected_v1 |
| curiosity (5장) | topaz | high | low | echo_fragment | ★ 적용 | selected_v1 |
| fragile_hope (5장) | diamond | high | low | echo_fragment | 미적용(자연혼합) | selected_v1 |

### GATE 6 + 6b 처리 기록

```yaml
hamel_gate6_result:
  completed: 2026-05-17
  
  gate6_stage1:
    method: AI 재생성 (gpt-image-1)
    base_images: 5장 (1024×1536)
    config: config/thumbnail/hamel.json (GATE 6 SSOT 전면 재작성)
    key_changes:
      - lighthouse_as_center: SUPPRESSED
      - star_brightness: 140% → 60-70% (almost_unnoticed)
      - composition_core: departure → ordinary_harbor_continuation
      - character_pose: toward_lighthouse → standing_passively
  
  gate6_stage2:
    method: full25 recolor pipeline (5 base × 5 emotion = 25장, $0)
    output: thumbnails/hamel/generated/full/
  
  gate6b_halo_suppression:
    method: background_preserving_base_blend
    formula: "result = base + (recolored - base) × keepRatio"
    keepInner: 0.05  # 95% of glow restored to original base
    suppress_r_hard: 245px
    suppress_r_outer: 330px
    targets: sapphire/emerald/topaz (15장)
    result: halo_removed / continuity_preserved / artifact_free
  
  canonical_registration:
    path: public/images/canonical/source/hamel/  # ⛔ ARCHIVED 2026-05-21 (commit 88899dc)
    archived_to: public/images/archive/hamel/legacy/canonical_source/
    count: 25장
    runtime_ssot: public/images/thumbnails/hamel/generated/full/  # 실제 서빙 경로
    archive_reason: >
      HAMEL_REFERENCE_AUDIT.md 확인 결과 런타임 참조 0건.
      generated/full과 byte-for-byte identical 중복 사본으로 판명.
      이관 후 런타임 영향 없음.
    
  drift_resolved:
    symbolic_lighthouse: RESOLVED
    cinematic_composition: RESOLVED
    text_overlay: RESOLVED (clean images 텍스트 없음)
    emotional_direction: RESOLVED
    recolor_halo_artifact: RESOLVED (gate6b)
  
  classification: A / selected_v1
```

### 전체 세트 요약

```yaml
yeosu_hamel:
  total: 25
  category_A: 25  # GATE 6+6b 완료
  ratio: 2:3 (1024×1536)
  storybook_ready: true
  postcard_ready: true  # calm 5장 (memory_anchor)
  miracle_video_ready: true  # fragile_hope 5장
```

---

## 전체 Registry 요약

### Category 분포

```
Category A  — canonical (즉시 파생 가능)
  cablecar: 25장 (전체 — GATE 3)
  hotel:    25장 (전체 — GATE 5 완료 2026-05-17)
  cafe:     25장 (전체 — GATE 4 완료 2026-05-17)
  hamel:    25장 (전체 — GATE 6+6b 완료 2026-05-17) ★ NEW
  ─────────────────
  소계:     100장

Category A- — pending_fix
  (없음)

Category B  — reusable_fragment
  (없음)

Category C  — archive_only
  hamel 구버전 wish-image:  7장 (archive, 레퍼런스 보존)
  hamel 구버전 star-cache:  1장
  ─────────────────
  소계:     8장

Category D  — deprecated (실사용 금지)
  hamel 구버전 generated/full (1:1): 25장 (archived — 신버전 2:3으로 대체)
  hamel canonical/source/hamel/:    25장 ⛔ ARCHIVED 2026-05-21 (commit 88899dc) — generated/full 중복
  hamel generated/sample*/:         16장 ⛔ ARCHIVED 2026-05-21 (commit 88899dc) — 구버전 샘플
  ─────────────────
  소계:     66장 (기존 25 + 신규 archived 41)

# 런타임 SSOT (2026-05-21 기준)
# hamel 실제 서빙: thumbnails/hamel/generated/full/ (routes/starImageRoutes.js:158, server.js:131)

TOTAL CANONICAL (A):  100장  ← 4개 장소 전체 완료 ★
ARCHIVE (C):           8장
DEPRECATED (D):       66장 (구 hamel 1:1 + archived legacy)
```

### 즉시 착수 가능한 파생 세트

```
storybook 착수 가능 (Category A 기준):
  → cablecar 25장: 전 감정 커버
  → hotel 25장: 전 감정 커버
  → cafe 25장: 전 감정 커버 (GATE 4 완료)
  → hamel 25장: 전 감정 커버 (GATE 6+6b 완료) ★ NEW
  → 4개 장소 × 5감정 × 5 base = 100장 전체 활용 가능

postcard 즉시 가능:
  → cablecar calm 5장 ★ (memory_anchor 최강)
  → hotel calm 5장 ★ (memory_anchor)
  → cafe calm 5장 ★ (memory_anchor, warmth 감소 후)
  → hamel calm 5장 ★ (memory_anchor, ordinary harbor continuity) NEW
  → 총 20장

miracle_video (fragile_hope 세트):
  → cablecar fragile_hope 5장: 가능
  → hotel fragile_hope 5장: 가능 (GATE 5)
  → cafe fragile_hope 5장: 가능 (GATE 4)
  → hamel fragile_hope 5장: 가능 (GATE 6+6b) NEW

pending:
  → 없음 — 4개 장소 전체 Category A 달성 완료
```

---

## Governance

- **이 Registry 업데이트**: Code Master
- **Category 변경**: CEO 결정 → Code Master 실행
- **Category D → 폐기**: Registry 항목 유지, 파일은 archive/ 이동
- **hamel 재생성**: GATE 6 + 6b 완료 (2026-05-17)
