# REMAINING_CHANGES_COMMIT_SCOPE.md

> 작성일: 2026-05-21  
> 기준 커밋: `af95684` (SSOT hamel archived 마크 직후)  
> 목적: 남은 530+ 변경분을 3개 commit 단위로 정리  
> 상태: **계획 확정 — 미실행**

---

## 요약

| GROUP | 주제 | M | ?? | 합계 | 우선순위 |
|-------|------|---:|---:|-----:|----------|
| A | GATE 6+6b Hamel 썸네일 재생성 | 28 | ~58 | ~86 | ① 먼저 |
| B | Storybook page05 파이프라인 | 0 | ~48 | ~48 | ② |
| C | Cablecar/Cafe/Hotel 썸네일 | 2 | ~134 | ~136 | ③ |
| DEFERRED | 런타임 코드·UI·기타 | 6 | ~345 | ~351 | 별도 검토 |

**총 커밋 예정**: 3개  
**DEFERRED**: 이 문서 범위 밖 — 별도 세션에서 검토

---

## GROUP A — GATE 6+6b Hamel 썸네일 재생성

**커밋 메시지 (안)**:
```
chore(assets/hamel): commit GATE6+6b hamel full25 regeneration

- 25 clean PNG: 2:3 portrait (1024×1536), ~3.5MB each (from ~9MB)
- 25 text PNG: new _text overlay variant added
- base/ 11 files: base05 + 스토리북 5PAGE/ (GATE6 source)
- build-thumbnail.js, gate6b-star-suppression.js scripts
- manifest.json, hamel.json config updated
- GATE6 reports and PLAN docs included
```

### 포함 파일

#### Modified (28)

```
public/images/thumbnails/hamel/generated/full/
  hamel_calm_emerald_base01~05.png         (5)
  hamel_confusion_moonstone_base01~05.png  (5)
  hamel_curiosity_topaz_base01~05.png      (5)
  hamel_fragile_hope_diamond_base01~05.png (5)
  hamel_pause_sapphire_base01~05.png       (5)
  manifest.json                            (1)

config/thumbnail/hamel.json                (1)
scripts/thumbnail/build-thumbnail.js       (1)
```

#### Untracked (~58)

```
public/images/thumbnails/hamel/generated/full/
  hamel_calm_emerald_base01~05_text.png         (5)
  hamel_confusion_moonstone_base01~05_text.png  (5)
  hamel_curiosity_topaz_base01~05_text.png      (5)
  hamel_fragile_hope_diamond_base01~05_text.png (5)
  hamel_pause_sapphire_base01~05_text.png       (5)

public/images/thumbnails/hamel/base/            (11 — base05 PNG ×5 + 스토리북5PAGE/ ×5 + .gitkeep)
public/images/thumbnails/hamel/generated/sample/ (1 — .gitkeep only)

scripts/thumbnail/gate6b-star-suppression.js    (1)
scripts/thumbnail/generate-hamel-base.js        (1)

docs/reports/GATE6_Hamel_Full25_Result_Report.md             (1)
docs/reports/GATE6_Hamel_Regeneration_PromptPack_Report.md   (1)
docs/plans/GATE2_Canonical_Asset_Verification_Report.md      (1)
docs/plans/PLAN_2026_0516_16x9_CANONICAL_MASTER.md           (1)

outputs/prompts/hamel/                          (5)
outputs/prompts/thumbnail/_test/               (5)
outputs/prompts/thumbnail/hamel/               (5)
```

### 제외 파일 (명시적)

```
# 이미 커밋됨 — af95684
public/images/archive/hamel/legacy/
docs/assets/hamel/
docs/ssot/air-engine/REGISTRY_v1_verified_2026-0516.md

# DEFERRED — 이 커밋에 포함 불가
CLAUDE.md
scripts/generate-star-images.js
public/admin/resonance.html
```

### ⚠️ 위험 파일 / 의존 관계

| 파일 | 위험 | 이유 |
|------|------|------|
| `hamel_calm_emerald_base03.png` | **PROTECT** | `server.js:131` OG 이미지 하드코딩 — 파일명 절대 변경 불가 |
| `hamel_*_base{01~05}.png` 패턴 | 런타임 계약 | `starImageRoutes.js:158` 패턴 의존 |
| `manifest.json` | 정합성 의존 | storybook asset-registry (GROUP B)와 파일명 일치 필요 |

### 테스트 요구사항

- [ ] `server.js` 기동 후 `/api/dt/star-image/...` 경로 정상 응답 확인
- [ ] `hamel_calm_emerald_base03.png` 파일 존재 확인
- [ ] OG 이미지 fallback URL 정상 반환 확인

---

## GROUP B — Storybook page05 파이프라인

**커밋 메시지 (안)**:
```
chore(storybook): commit page05 pipeline — asset-registry, scripts, outputs

- config/storybook: asset-registry.json, schema, page05.json
- scripts/storybook: build-asset-registry.js, assemble-storybook-test.js, generate-page05.js
- public/images/storybook/sources/page05/ (16 PNG — 4 locations × 4 images)
- outputs/prompts/storybook/page05/ (16 prompt txt files)
- docs/ssot/air-engine/ pipeline constitution docs (10 files)
```

### 포함 파일

#### Untracked (~48)

```
config/storybook/
  asset-registry.json      (1)
  asset-registry.schema.json (1)
  page05.json              (1)

scripts/storybook/
  assemble-storybook-test.js (1)
  build-asset-registry.js    (1)
  generate-page05.js         (1)

public/images/storybook/sources/page05/
  hamel/                   (4 PNG)
  cablecar/                (4 PNG)
  cafe/                    (4 PNG)
  hotel/                   (4 PNG)
                           총 16 PNG

outputs/prompts/storybook/page05/
  hamel/    (4 .txt)
  cablecar/ (4 .txt)
  cafe/     (4 .txt)
  hotel/    (4 .txt)
             총 16 .txt

docs/ssot/air-engine/
  01_DreamTown_Air_Constitution.md
  02_DreamTown_Echo_Physics.md
  03_DreamTown_Air_Taxonomy.md
  04_DreamTown_Canonical_Air_Registry.md
  05_DERIVATION_PIPELINE.md
  06_OUTPUT_STRATEGY.md
  CODE_TEST_01_CHANNEL_POLICY.md
  CODE_TEST_01_CONTINUITY_GRAMMAR.md
  CODE_TEST_01_PROMPT_BUILDER.md
  CODE_TEST_01_REGISTRY_SCHEMA.md
                             총 10 .md
```

### 제외 파일

```
# 이미 커밋됨
docs/ssot/air-engine/REGISTRY_v1_verified_2026-0516.md

# DEFERRED
outputs/prompts/wish-image/
outputs/wish-image/
```

### ⚠️ 의존 관계

| 의존 | 방향 | 설명 |
|------|------|------|
| GROUP A manifest.json | B가 A에 의존 | asset-registry.json의 file_path는 full/ 폴더 기준 — GROUP A 커밋 후 B를 커밋해야 정합성 유지 |
| page05.json output_path | 내부 일관 | storybook/sources/page05/**/*.png 파일명이 page05.json output_path와 일치해야 함 |

**커밋 순서 제약**: GROUP A 커밋 완료 후 GROUP B 커밋

### 테스트 요구사항

- [ ] `node scripts/storybook/build-asset-registry.js` 오류 없이 실행
- [ ] asset-registry.json에 hamel generated/full/ 50개 entry 존재 확인

---

## GROUP C — Cablecar/Cafe/Hotel 썸네일

**커밋 메시지 (안)**:
```
chore(assets): commit cablecar/cafe/hotel thumbnail generation results

- cablecar: full/ 25 PNG + base/ 10 PNG + manifest + config + lock
- cafe: full/ 25 PNG + base/ 5 PNG + manifest
- hotel: full/ 25 PNG + base/ 4 PNG + manifest
- GATE4 cafe, GATE5 hotel reports included
- prompt outputs: cablecar/cafe/hotel × 5 + thumbnail × 15
```

### 포함 파일

#### Modified (2)

```
config/thumbnail/cablecar.json
reports/yeosu_cablecar-generation-report.md
```

#### Untracked (~134)

```
public/images/thumbnails/cablecar/           (40 파일)
  generated/full/ : 25 PNG + manifest.json
  base/           : 10 PNG (base05 × 5 + 추가)
  generated/      : lock JSON 등

public/images/thumbnails/cafe/               (31 파일)
  generated/full/ : 25 PNG + manifest.json
  base/           : 5 PNG

public/images/thumbnails/hotel/              (29 파일)
  generated/full/ : 25 PNG + manifest.json
  base/           : 4 PNG

docs/reports/GATE4_Cafe_Warmth_Reduction_Report.md        (1)
docs/reports/GATE5_Hotel_Fragile_Hope_Star_Reduction_Report.md (1)

reports/yeosu_cafe-generation-report.md       (1)
reports/stage1-yeosu_cablecar-lock.json       (1)

outputs/prompts/cablecar/                     (5)
outputs/prompts/cafe/                         (5)
outputs/prompts/hotel/                        (5)
outputs/prompts/thumbnail/cablecar/           (5)
outputs/prompts/thumbnail/cafe/               (5)
outputs/prompts/thumbnail/hotel/              (5)
```

### 제외 파일

```
# DEFERRED
public/images/star-cache/yeosu_cablecar/
public/images/star-cache/yeosu_cafe/
public/images/star-cache/yeosu_hotel/
public/images/thumbnails/thumbnails.zip    # 대용량 zip — 용도 불분명
public/images/thumbnails/_test/            # 테스트 결과물
```

### ⚠️ 위험 파일

| 파일 | 위험 | 이유 |
|------|------|------|
| `thumbnails.zip` | **제외 필수** | 용량 미확인, 용도 불명 — 별도 확인 후 처리 |
| `star-cache/yeosu_*` | 제외 권고 | 소원 이미지 생성 캐시 — 런타임 서빙 코드 미완성 상태 |

### 테스트 요구사항

- [ ] cablecar/cafe/hotel generated/full/ 각 25 PNG 파일 수 확인
- [ ] manifest.json 파일명과 실제 PNG 파일명 일치 확인

---

## DEFERRED — 이번 커밋 제외

### 이유별 분류

#### A. 런타임 코드 변경 — 별도 검토 필요

| 파일 | 상태 | 이유 |
|------|------|------|
| `CLAUDE.md` | M | 프로젝트 설정 변경 — 의도 확인 필요 |
| `docs/ssot/INDEX.md` | M | SSOT 인덱스 업데이트 |
| `docs/ssot/core/DreamTown_Visual_Style_SSOT.md` | M | 세계관 문서 변경 |
| `public/admin/resonance.html` | M | 관리자 UI 변경 |
| `public/storybook-share.html` | M | 공유 페이지 변경 |
| `scripts/generate-star-images.js` | M | 런타임 스크립트 변경 |

#### B. 신규 untracked — 검토 필요

| 경로 | 파일 수 | 이유 |
|------|--------:|------|
| `AGENTS.md` | 1 | 에이전트 설정 — 내용 확인 필요 |
| `assets/brand/`, `assets/source/` | ? | 용도/크기 미확인 |
| `config/wish-image/` | ? | 소원 이미지 설정 — 파이프라인 미완성 |
| `docs/archive/decisions/` | ? | 아카이브 결정 문서 |
| `docs/patent/` | ? | 특허 문서 — 민감 가능 |
| `docs/reports/CEO-WEEKLY-2026-W15~W17.md` | 3 | CEO 보고서 |
| `docs/ssot/constitution/` | ? | 헌법 문서 |
| `dreamtown-frontend/src/components/ImpactFlow.jsx` | 1 | 프론트엔드 컴포넌트 — 빌드 필요 |
| `dreamtown-frontend/src/components/impact.css` | 1 | 프론트엔드 CSS |
| `outputs/prompts/wish-image/` | 5 | 소원 이미지 프롬프트 |
| `outputs/wish-image/` | 7 | 소원 이미지 생성 결과물 |
| `public/debug/` | ? | 디버그 파일 |
| `public/fonts/` | ? | 폰트 파일 — 라이선스 확인 필요 |
| `public/images/canonical/` | ? | hamel 이관 후 빈 디렉토리 잔재 |
| `public/images/star-cache/` | ? | 캐시 파일 — 소원 이미지 런타임 미완성 |
| `public/images/thumbnails/ASSET-SSOT.md` | 1 | 에셋 SSOT 문서 |
| `public/images/thumbnails/_test/` | ? | 테스트 결과물 |
| `public/images/thumbnails/thumbnails.zip` | 1 | 대용량 zip |
| `public/qr/` | ? | QR 코드 이미지 |
| `scripts/apply-migration.js` | 1 | 마이그레이션 스크립트 |
| `scripts/wish-image/` | 2 | 소원 이미지 생성 스크립트 |
| `uploads/promise-photos/` | ? | ⛔ 사용자 업로드 — 절대 커밋 불가 |

---

## 실행 체크리스트

```
[ ] GROUP A 스테이징 확인 (generated/full/ 25 clean + 25 text + hamel/base/ + scripts + docs)
[ ] GROUP A 커밋 — DEFERRED 파일 미포함 검증
[ ] GROUP B 스테이징 확인 (config/storybook + scripts/storybook + storybook images + air-engine docs)
[ ] GROUP B 커밋
[ ] GROUP C 스테이징 확인 (cablecar + cafe + hotel, thumbnails.zip 제외)
[ ] GROUP C 커밋
[ ] git status 확인 — DEFERRED 파일만 남았는지 검증
[ ] git push origin main
```

---

## 주의: uploads/promise-photos/ 절대 커밋 불가

`uploads/promise-photos/`는 실제 사용자 업로드 파일이다.  
개인정보 포함 가능성 있음. **어떤 commit에도 포함 금지.**  
필요 시 `.gitignore`에 추가 권고:

```
uploads/
```
