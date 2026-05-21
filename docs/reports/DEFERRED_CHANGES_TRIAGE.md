# DEFERRED_CHANGES_TRIAGE.md

> 작성일: 2026-05-21  
> 기준 커밋: `ba11501` (GROUP A/B/C push 직후)  
> 목적: 남은 DEFERRED 변경분 전체를 분류해 다음 작업 범위를 안전하게 정한다.  
> 상태: **분류 완료 — git add/commit/push 미실행**

---

## 요약

| 그룹 | 주제 | 파일 수 | 추천 처리 |
|------|------|--------:|-----------|
| **D1** | SSOT/운영 문서 | ~15 | ✅ **다음 커밋 후보 (1개)** |
| **D2** | Wish-image/Aurum/실험 파이프라인 | ~30 | ⏸ HOLD — 파이프라인 완성 후 |
| **D3** | UI/Frontend 변경 | 4 | ⏸ HOLD — 기능 검증 후 |
| **X** | 절대 커밋 금지 | ~250+ | ⛔ 커밋 금지 |

**추천 다음 커밋: D1 1개** — D2/D3/X는 이번 범위 밖.

---

## GROUP D1 — SSOT/운영 문서 ✅ 커밋 후보

### 포함 파일 (~15개)

| 상태 | 파일 | 크기 | 내용 |
|------|------|-----:|------|
| M | `CLAUDE.md` | ~8KB | 금지어 17개 목록 확장, AGENTS.md §15 참조 추가, 저장소 테이블 재구성 |
| ?? | `AGENTS.md` | 27KB | Codex 협업 가이드 v5.0 — §15-24 SSOT 가드레일 포함 |
| M | `docs/ssot/INDEX.md` | ~5KB | SSOT 인덱스 v5.0 업데이트 |
| M | `docs/ssot/core/DreamTown_Visual_Style_SSOT.md` | ~12KB | §8 장소별 Visual SSOT 섹션 추가 (하멜등대 정의) |
| ?? | `docs/archive/decisions/DEC_2026_0516_CANONICAL_RATIO_3x4.md` | 2KB | 캐노니컬 3:4 비율 결정 기록 |
| ?? | `docs/archive/decisions/DEC_2026_0516_OUTPUT_STRATEGY.md` | 2KB | 출력 전략 결정 기록 |
| ?? | `docs/reports/CEO-WEEKLY-2026-W15.md` | 1KB | CEO 주간 보고 W15 |
| ?? | `docs/reports/CEO-WEEKLY-2026-W16.md` | 1KB | CEO 주간 보고 W16 |
| ?? | `docs/reports/CEO-WEEKLY-2026-W17.md` | 1KB | CEO 주간 보고 W17 |
| ?? | `docs/ssot/constitution/DreamTown_Canonical_Foundation_v1.md` | 14KB | DreamTown 철학 헌법 |
| ?? | `docs/ssot/constitution/HUMAN_FIRST.md` | 2KB | 인간 우선 원칙 |
| ?? | `docs/ssot/constitution/NO_EMOTIONAL_ADDICTION.md` | 2KB | 감정 중독 방지 원칙 |
| ?? | `docs/ssot/constitution/REALITY_RECONNECTION.md` | 2KB | 현실 재연결 원칙 |
| ?? | `docs/ssot/constitution/UNFINISHED_TIME.md` | 2KB | 미완의 시간 원칙 |
| ?? | `public/images/thumbnails/ASSET-SSOT.md` | ~2KB | 썸네일 에셋 구조 SSOT |

### 제외 파일 (D1에서 별도 처리)

| 파일 | 이유 |
|------|------|
| `docs/patent/DreamTown_특허출원_준비자료_v1.0 .md.docx` | ⚠️ **.docx 바이너리 파일** — git에 부적합 + 특허 민감 문서. 별도 보안 저장소 권고 |

### 위험도 — 낮음

- 전부 마크다운/텍스트 변경
- 런타임 코드 영향 없음
- `CLAUDE.md` 변경은 프로젝트 설정 문서이며 동작에 영향 없음
- `AGENTS.md` 신규 — 협업 가이드 문서, 코드 변경 없음

### 의존 관계

- CLAUDE.md ↔ AGENTS.md: CLAUDE.md가 `AGENTS.md §15` 를 참조하므로 함께 커밋 권고
- SSOT docs: 독립적 (코드 의존 없음)

### 추천 커밋 메시지 (안)

```
docs(ssot): update project config, AGENTS guide v5, constitution docs

- CLAUDE.md: expand forbidden words to 17, add AGENTS.md reference
- AGENTS.md: v5.0 — Codex 협업 가이드, §15-24 SSOT guardrails
- docs/ssot/INDEX.md: v5.0 update
- docs/ssot/core/DreamTown_Visual_Style_SSOT.md: add §8 place-specific
  Visual SSOT (Hamel Lighthouse definition)
- docs/ssot/constitution/: 5 core principle docs
- docs/archive/decisions/: 2 canonical decision records
- docs/reports/CEO-WEEKLY-W15~W17.md: 3 weekly reports
- public/images/thumbnails/ASSET-SSOT.md: thumbnail structure SSOT

EXCLUDE: docs/patent/*.docx (binary, sensitive — separate handling)
```

---

## GROUP D2 — Wish-image / Aurum / 실험 파이프라인 ⏸ HOLD

### 포함 파일

| 상태 | 파일/경로 | 크기 | 내용 | 처리 |
|------|-----------|-----:|------|------|
| M | `scripts/generate-star-images.js` | ~40KB diff | Stage1/2 처리, retry-queue, validate-only, --parallel 플래그 추가 | ⏸ hold (테스트 먼저) |
| ?? | `config/wish-image/` (2파일) | 6KB | 소원 이미지 생성 설정 | ⏸ hold (파이프라인 미완성) |
| ?? | `scripts/wish-image/` (2파일) | 11KB | 소원 이미지 생성 스크립트 | ⏸ hold |
| ?? | `outputs/prompts/hamel-test5/` (5파일) | 5KB | hamel-test5 감정 프롬프트 | ⏸ hold (GROUP A 확장분) |
| ?? | `outputs/prompts/wish-image/` (5파일) | 24KB | 소원 이미지 프롬프트 | ⏸ hold |
| ?? | `outputs/wish-image/` (7파일) | 16MB | wish hamel 5장 + contact_sheet + 중복1 | ⏸ hold (대용량) |
| ?? | `outputs/aurum_f0s~f4s.jpg` (5파일) | ~245KB | Aurum 인트로 영상 프레임 캡처 | ⏸ hold |
| ?? | `public/debug/aurum_intro_frames.jpg` | 245KB | 디버그 프레임 | ⏸ hold or discard |
| ?? | `assets/brand/core/cablecar-star-intro.png` | 4.5MB | 케이블카 인트로 브랜드 PNG | ⏸ hold (용도 확인) |
| ?? | `assets/brand/intro/cablecar-star-intro.mp4.mp4` | 3MB | ⚠️ 이중 확장자 (.mp4.mp4) — 동영상 | ⏸ hold (확장자 검토 필요) |
| ?? | `assets/source/video/cablecar-star-intro_v1.mp4` | 3MB | 케이블카 인트로 영상 소스 | ⏸ hold (git-lfs 검토) |

### HOLD 이유

- `generate-star-images.js`: 런타임 스크립트 변경 — `--retry-queue`, `--validate-only` 플래그 추가. 운영 환경에서 동작 검증 필요.
- `wish-image/` 파이프라인: 서빙 코드 미완성 상태 (config만 있고 라우트 없음)
- `.mp4.mp4` 파일: 이중 확장자 — 명칭 오류 가능성 있음, 확인 후 커밋
- 영상 파일 (`.mp4`): `git-lfs` 없이 커밋하면 리포 크기 영구 증가 → LFS 설정 먼저 검토
- `outputs/wish-image/` 7파일 16MB: 생성 결과물 — 크기 재확인 필요, `.gitignore` 추가 검토

---

## GROUP D3 — UI/Frontend 변경 ⏸ HOLD

### 포함 파일 (4개)

| 상태 | 파일 | 크기 | 내용 |
|------|------|-----:|------|
| M | `public/admin/resonance.html` | 55 diff lines | `.result-line` CSS 추가, 공명 관리자 UI 개선 |
| M | `public/storybook-share.html` | 34 diff lines | `impact-flow revealed` 애니메이션, `display:none→block` 전환 |
| ?? | `dreamtown-frontend/src/components/ImpactFlow.jsx` | 3.4KB | 새 임팩트 플로우 컴포넌트 |
| ?? | `dreamtown-frontend/src/components/impact.css` | 0.9KB | 임팩트 플로우 CSS |

### 의존 관계

- `storybook-share.html` ↔ `ImpactFlow.jsx/impact.css`: `storybook-share.html`의 impact-flow reveal 애니메이션이 ImpactFlow 컴포넌트와 연관된 것으로 추정
- `resonance.html`: 관리자 UI 변경 — 독립적, 별도 커밋 가능

### HOLD 이유

- UI 변경은 브라우저 실제 렌더링 확인 필요
- `ImpactFlow.jsx`는 새 컴포넌트 — `dreamtown-frontend` 빌드 실행 후 `dist/` 반영 필요
- `storybook-share.html` + ImpactFlow 3개 파일이 하나의 기능 단위 — 함께 확인 후 커밋

---

## GROUP X — 절대 커밋 금지 ⛔

### 파일 목록

| 파일/경로 | 크기 | 금지 이유 |
|-----------|-----:|-----------|
| `uploads/promise-photos/` (1파일) | 807KB | ⛔ **사용자 업로드 파일 — 개인정보/UUID 파일명** |
| `public/images/thumbnails/thumbnails.zip` | **632MB** | ⛔ 대용량 zip — git 히스토리 영구 오염 |
| `public/images/star-cache/_backup/` (101파일) | **309MB** | ⛔ 대용량 백업 — 생성 가능한 캐시 |
| `public/images/star-cache/sowonpicture.zip` | **227MB** | ⛔ 대용량 zip |
| `public/images/canonical/` (76파일) | **255MB** | ⛔ cablecar/cafe/hotel canonical source — GROUP C generated/full의 원본 사본, 중복 |
| `public/images/star-cache/yeosu_cafe/` (26파일) | **79MB** | ⛔ 대용량 캐시 — 서빙 파이프라인 미완성 |
| `public/images/star-cache/yeosu_hotel/` (26파일) | **77MB** | ⛔ 대용량 캐시 |
| `public/images/star-cache/yeosu_hamel/` (2파일) | 3.2MB | ⚠️ 1 PNG + .gitkeep — 보류 검토 (.gitkeep만 커밋 가능) |
| `public/images/star-cache/_baseline/` (1파일) | ~0KB | ⚠️ .gitkeep만 — 커밋해도 무해하나 불필요 |
| `public/images/thumbnails/_test/codex-imagegen-test.png` | 2.7MB | ⚠️ 테스트 결과물 — 커밋 불필요 |
| `public/qr/` (12파일) | 39KB | ⚠️ QR 코드 이미지 — 운영용이나 별도 검토 필요 |
| `public/qr/_archive/` (1파일) | 4KB | ⚠️ QR 아카이브 |

### 최우선 조치 필요 항목

```
⛔ uploads/promise-photos/ → .gitignore에 추가 강력 권고
   현재 git-untracked이지만 실수로 git add . 하면 포함 위험
   파일명: 9f6e31e1-960c-4d51-92bb-74a43f094285.jpg (UUID 기반, 실 사용자 업로드)
```

### .gitignore 추가 권고

```gitignore
# 사용자 업로드 (개인정보)
uploads/

# 대용량 캐시/백업
public/images/star-cache/_backup/
public/images/star-cache/sowonpicture.zip
public/images/thumbnails/thumbnails.zip

# 테스트 결과물
public/images/thumbnails/_test/
```

---

## 전체 파일 매핑 (빠짐없음 체크)

| git status 항목 | 분류 |
|-----------------|------|
| M `CLAUDE.md` | D1 ✅ |
| M `docs/ssot/INDEX.md` | D1 ✅ |
| M `docs/ssot/core/DreamTown_Visual_Style_SSOT.md` | D1 ✅ |
| M `public/admin/resonance.html` | D3 ⏸ |
| M `public/storybook-share.html` | D3 ⏸ |
| M `scripts/generate-star-images.js` | D2 ⏸ |
| ?? `AGENTS.md` | D1 ✅ |
| ?? `assets/brand/` | D2 ⏸ |
| ?? `assets/source/` | D2 ⏸ |
| ?? `config/wish-image/` | D2 ⏸ |
| ?? `docs/archive/decisions/` | D1 ✅ |
| ?? `docs/patent/` | D1 별도 — `.docx` 바이너리 제외 |
| ?? `docs/reports/CEO-WEEKLY-W15~W17.md` | D1 ✅ |
| ?? `docs/ssot/constitution/` | D1 ✅ |
| ?? `dreamtown-frontend/src/components/ImpactFlow.jsx` | D3 ⏸ |
| ?? `dreamtown-frontend/src/components/impact.css` | D3 ⏸ |
| ?? `outputs/aurum_f0s~f4s.jpg` | D2 ⏸ |
| ?? `outputs/prompts/hamel-test5/` | D2 ⏸ |
| ?? `outputs/prompts/wish-image/` | D2 ⏸ |
| ?? `outputs/wish-image/` | D2 ⏸ |
| ?? `public/debug/` | D2 ⏸ |
| ?? `public/fonts/` | D1 (FONTS.md만, 1KB) ✅ |
| ?? `public/images/canonical/` | X ⛔ |
| ?? `public/images/star-cache/_backup/` | X ⛔ |
| ?? `public/images/star-cache/_baseline/` | X ⚠️ |
| ?? `public/images/star-cache/sowonpicture.zip` | X ⛔ |
| ?? `public/images/star-cache/yeosu_cafe/` | X ⛔ |
| ?? `public/images/star-cache/yeosu_hamel/` | X ⚠️ |
| ?? `public/images/star-cache/yeosu_hotel/` | X ⛔ |
| ?? `public/images/storybook/` | — 이미 GROUP B에서 커밋됨 ✅ |
| ?? `public/images/thumbnails/ASSET-SSOT.md` | D1 ✅ |
| ?? `public/images/thumbnails/_test/` | X ⚠️ |
| ?? `public/images/thumbnails/thumbnails.zip` | X ⛔ |
| ?? `public/qr/` | X ⚠️ (별도 검토) |
| ?? `reports/stage1-yeosu_cablecar-lock.json` | — 이미 GROUP C에서 커밋됨 ✅ |
| ?? `scripts/apply-migration.js` | D2 ⏸ (마이그레이션 스크립트, 별도 검토) |
| ?? `scripts/storybook/` | — 이미 GROUP B에서 커밋됨 ✅ |
| ?? `scripts/wish-image/` | D2 ⏸ |
| ?? `uploads/promise-photos/` | X ⛔ **절대 금지** |

---

## 다음 커밋 추천

### ✅ 추천 1개: GROUP D1 커밋

**이유:**
- 전체 텍스트/마크다운, 바이너리 없음
- 런타임 동작 변경 없음
- `CLAUDE.md` ↔ `AGENTS.md` 가 논리적 1단위 (금지어 목록 + 협업 가이드)
- `docs/ssot/constitution/` + `DreamTown_Visual_Style_SSOT.md` = 같은 SSOT 레이어

**제외 필수 (D1 커밋에서):**
- `docs/patent/*.docx` — `.docx` 바이너리, 특허 민감 자료
- `public/fonts/FONTS.md` — 내용 확인 후 포함 여부 결정

**D2/D3는 HOLD 유지:**
- `scripts/generate-star-images.js` 테스트 완료 후 별도 커밋
- UI 변경 3파일은 빌드 + 렌더링 확인 후 별도 커밋

---

## 완료 기준 체크

- [x] DEFERRED 전체 40개 항목 분류 완료 (빠짐없음)
- [x] 절대 커밋 금지 파일 명확히 표시 (uploads, 대용량 zip, canonical)
- [x] 다음 커밋 후보 1개 (D1)
- [x] git add/commit/push 미실행
