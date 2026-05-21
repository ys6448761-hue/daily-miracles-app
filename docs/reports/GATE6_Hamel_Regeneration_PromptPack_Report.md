# GATE 6 — Hamel Continuity Regeneration Prompt Pack 보고서

**작성일**: 2026-05-17  
**담당**: Code Master  
**상태**: PROMPT PACK 완료 — 생성 실행 대기 (CEO 승인 필요)

---

## 변경 이력 (기존 → GATE 6)

| 항목 | 기존 hamel.json | GATE 6 수정 |
|------|----------------|------------|
| must_include | "Hamel Lighthouse silhouette" | 등대 제거 → "ordinary harbor residue" |
| star brightness | 140% | 60-70% (almost_unnoticed) |
| composition core | "departure — beginning from outside" | "ordinary world continuation" |
| scene description | "near Hamel Lighthouse" | "ordinary harbor area" |
| forbidden | (없음) | lighthouse center, symbolic beam, cinematic, healing, text 등 전체 추가 |
| character pose | "facing the open sea, looking toward star" | "standing passively — not toward anything" |

---

## Prompt Pack 완료 현황

```yaml
GATE_6_PROMPT_PACK:
  config_updated: config/thumbnail/hamel.json
  prompts_built: outputs/prompts/thumbnail/hamel/ (5개)
  generation_script: scripts/thumbnail/generate-hamel-base.js

  files:
    - 01_confusion_hamel_prompt.txt  → 01_confusion_hamel_base.png
    - 02_pause_hamel_prompt.txt      → 02_pause_hamel_base.png
    - 03_calm_hamel_prompt.txt       → 03_calm_hamel_base.png
    - 04_curiosity_hamel_prompt.txt  → 04_curiosity_hamel_base.png
    - 05_fragile_hope_hamel_prompt.txt → 05_fragile_hope_hamel_base.png
```

---

## 핵심 프롬프트 정책

```yaml
scene:
  "ordinary harbor area near Hamel district in Yeosu.
   The harbor is already continuing normally — quietly, without attention."

star:
  brightness: 60-70%
  size: very small — one of many light sources
  position: upper peripheral — NOT centered
  rule: "almost_unnoticed continuity trace"

lighthouse:
  status: SUPPRESS
  allowed: distant background only, smaller than 5% of frame, not lit
  forbidden: center composition, symbolic silhouette, directional beam

character:
  pose: "standing passively — not toward anything"
  view: back view, 85%+ hidden

composition:
  core: "environment precedes character"
  flow: "harbor residue → ordinary continuation → Sowoni inside it"
```

---

## 생성 파이프라인 (2단계)

### Stage 1 — Base 5장 생성 (CEO 시각 검수 필요)

```bash
# 테스트 1장 (승인 확인용 - ~$0.04)
node scripts/thumbnail/generate-hamel-base.js --limit=1

# 전체 5장 생성 (~$0.20)
node scripts/thumbnail/generate-hamel-base.js
```

출력: `public/images/thumbnails/hamel/base/`

### Stage 2 — Full 25장 생성 (Stage 1 CEO 승인 후)

```bash
node scripts/thumbnail/build-thumbnail.js --location hamel --full25
```

출력: `public/images/thumbnails/hamel/generated/full/`

### Stage 3 — Canonical 등록 (Stage 2 CEO 승인 후)

```bash
# canonical/source/hamel/ 에 25장 복사
# MANIFEST.md 업데이트 (75 → 100장)
# REGISTRY 업데이트 (hamel Category D → A)
```

---

## DoD 체크리스트 (생성 후 확인)

| 항목 | 확인 방법 |
|------|----------|
| lighthouse_no_longer_symbolic | 시각 검수 — 등대가 중심 구도 아님 |
| harbor_feels_ordinary | 시각 검수 — 관광지/포스터 느낌 없음 |
| continuity_stronger_than_mood | 시각 검수 — 항구가 감정보다 먼저 읽힘 |
| outside_world_feels_indifferent | 시각 검수 — 소원이 없어도 세계가 계속되는 느낌 |
| no_tourism_reading | 시각 검수 — 여행지 사진 느낌 없음 |
| no_cinematic_drift | 시각 검수 — 극적 구도/하늘 없음 |
| star_almost_unnoticed | 시각 검수 — 별이 배경 요소 수준 |

---

## 예상 비용

| 단계 | 이미지 수 | 비용 |
|------|---------|------|
| Stage 1 테스트 1장 | 1 | ~$0.04 |
| Stage 1 전체 5장 | 5 | ~$0.20 |
| Stage 2 full25 | 0 (recolor, API 없음) | $0 |
| **합계** | **5 API calls** | **~$0.20** |

---

## 대기 상태

```yaml
waiting_for:
  CEO_approval:
    action: "node scripts/thumbnail/generate-hamel-base.js --limit=1"
    description: "Stage 1 테스트 1장 생성 후 시각 확인"
    then: "승인 시 나머지 4장 생성"
```
