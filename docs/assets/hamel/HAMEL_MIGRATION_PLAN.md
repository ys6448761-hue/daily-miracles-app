# HAMEL_MIGRATION_PLAN.md

> 작성일: 2026-05-21  
> 근거: HAMEL_ASSET_INVENTORY.md + HAMEL_REFERENCE_AUDIT.md  
> 상태: **계획 확정 (미실행)** — 실제 이동은 별도 승인 후  
> 규칙: 이 문서는 실행 계획만 기술. 파일 이동/삭제는 금지.

---

## 목표

1. 런타임 SSOT(`thumbnails/hamel/generated/full/`)는 원위치 보존
2. dead asset 3개 경로를 `archive/hamel/legacy/`로 이관
3. 하드코딩된 파일명(`hamel_calm_emerald_base03.png`)은 어떤 단계에서도 보호
4. 전 단계 rollback 가능하도록 설계

---

## 섹션 1 — KEEP (런타임 SSOT / 이동 금지)

### 1-A. `public/images/thumbnails/hamel/generated/full/` ← 절대 보존

| 이유 | 코드 위치 |
|---|---|
| 런타임 URL 패턴 생성 | `routes/starImageRoutes.js:158` |
| OG 이미지 기본값 | `server.js:131` |
| manifest.json 참조 | `generated/full/manifest.json` |
| asset-registry 등재 | `config/storybook/asset-registry.json` |

**포함 파일 (이동 금지):**
- `hamel_{emotion}_{gem}_base{01~05}.png` × 25 (클린)
- `hamel_{emotion}_{gem}_base{01~05}_text.png` × 25 (텍스트 오버레이)
- `manifest.json` × 1

### 1-B. ⚠️ PROTECT — 파일명 변경 금지 대상

```
public/images/thumbnails/hamel/generated/full/hamel_calm_emerald_base03.png
```

- `server.js:131`에 완전 하드코딩
- 이 파일명 변경 또는 이동 시 → **라이브 OG 이미지 404**
- 이관 실행 시 어떤 단계에서도 이 파일을 건드려선 안 됨

### 1-C. `public/images/thumbnails/hamel/base/` — 보존

- `config/storybook/asset-registry.json` base_master로 등재
- `scripts/thumbnail/lib/starPosition.js` 파일명 의존 (`hamel_base_02_left` 방향 감지)
- 보존 파일: 5 PNG (hamel_base_02_left ~ hamel_pause_sapphire_01)

### 1-D. `public/images/thumbnails/hamel/base/스토리북 5PAGE/` — 보존

- GATE 6 최종 원천 base 5장
- registry 등재, 재생성 시 원천소스로 사용
- 보존 파일: 5 PNG (01_confusion ~ 05_fragile_hope)

### 1-E. `public/images/storybook/sources/page05/hamel/` — 보존

- `config/storybook/page05.json` output_path로 명시
- `config/storybook/asset-registry.json` continuity_connector로 등재
- 보존 파일: 4 PNG (page05 4타입)

### 1-F. `public/images/star-cache/yeosu_hamel/` — 보존

- `config/wish-image/hamel.json:111` final_dir로 지정된 생성 타겟
- 현재 1장 존재, 향후 생성 추가 예정
- 보존 파일: 1 PNG + .gitkeep

---

## 섹션 2 — MOVE TO ARCHIVE (이관 대상)

### archive 목적지

```
public/images/archive/hamel/legacy/
```

서브구조:

```
public/images/archive/hamel/legacy/
├── canonical_source/          ← canonical/source/hamel/ 25장
├── sample_v1/                 ← generated/sample/ 3장
│   └── test/                  ← generated/sample/test/ 5장
├── sample_v2/                 ← generated/sample_v2/ 8장
└── silheum_archive/           ← 실험_archive/ 1장
```

---

### 2-A. `public/images/canonical/source/hamel/` → `archive/hamel/legacy/canonical_source/`

| 항목 | 내용 |
|---|---|
| 파일 수 | 25 PNG |
| 총 용량 | ~88 MB |
| 런타임 참조 | **0건** (audit 확인) |
| 이관 이유 | generated/full과 바이트 단위 완전 동일 사본. MANIFEST.md 자체가 source_origin = thumbnails/generated/full 명시. |
| 삭제 위험 | 없음 |

**이관 대상 파일 전체 (25개):**

```
hamel_calm_emerald_base01.png
hamel_calm_emerald_base02.png
hamel_calm_emerald_base03.png  ← 이름은 generated/full 것과 같지만 다른 경로. 이관 무방.
hamel_calm_emerald_base04.png
hamel_calm_emerald_base05.png
hamel_confusion_moonstone_base01.png ~ base05.png
hamel_curiosity_topaz_base01.png ~ base05.png
hamel_fragile_hope_diamond_base01.png ~ base05.png
hamel_pause_sapphire_base01.png ~ base05.png
```

> ⚠️ 주의: `canonical/source/hamel/hamel_calm_emerald_base03.png`는 이관해도 무방.  
> 런타임이 참조하는 것은 `thumbnails/hamel/generated/full/hamel_calm_emerald_base03.png`이며,  
> 이 파일은 KEEP 경로에 있어 영향 없음.

---

### 2-B. `public/images/thumbnails/hamel/generated/sample/` → `archive/hamel/legacy/sample_v1/`

| 항목 | 내용 |
|---|---|
| 파일 수 | 3 PNG + 5 PNG(test/) = 8장 |
| 총 용량 | ~74 MB |
| 런타임 참조 | 0건 |
| 이관 이유 | GATE 6 이전 구버전. 계획 문서에서 "구버전, 실사용 금지" 명시. generated/full로 대체됨. |

**이관 파일:**
```
sample/hamel_calm_emerald_base03_v2.png
sample/hamel_curiosity_topaz_base04_v2.png
sample/hamel_fragile_hope_diamond_base05_v2.png
sample/test/hamel_calm_emerald_base03.png
sample/test/hamel_confusion_moonstone_base01.png
sample/test/hamel_curiosity_topaz_base04.png
sample/test/hamel_fragile_hope_diamond_base05.png
sample/test/hamel_pause_sapphire_base02.png
```

---

### 2-C. `public/images/thumbnails/hamel/generated/sample_v2/` → `archive/hamel/legacy/sample_v2/`

| 항목 | 내용 |
|---|---|
| 파일 수 | 5 PNG + 3 DEBUG = 8장 |
| 총 용량 | ~67 MB |
| 런타임 참조 | 0건 |
| 이관 이유 | 2라운드 샘플 실험 산출물. DEBUG 파일 포함. 계획 문서에서 아카이브 분류됨. |

**이관 파일:**
```
DEBUG_direct_tint.png
DEBUG_final.png
DEBUG_masked_crop.png
hamel_calm_emerald_base03_v2.png
hamel_confusion_moonstone_base01_v2.png
hamel_curiosity_topaz_base04_v2.png
hamel_fragile_hope_diamond_base05_v2.png
hamel_pause_sapphire_base02_v2.png
```

---

### 2-D. `public/images/thumbnails/hamel/실험_archive/` → `archive/hamel/legacy/silheum_archive/`

| 항목 | 내용 |
|---|---|
| 파일 수 | 1 PNG |
| 총 용량 | 2.1 MB |
| 런타임 참조 | 0건 |
| 이관 이유 | 폴더명 자체가 "실험_archive". 초기 실험 스냅샷. |

**이관 파일:**
```
hamel_base_04_curiosity_NEW.png
```

---

## 섹션 3 — 이관 전 확인 체크리스트 (Pre-flight)

실제 이동 전 반드시 확인:

- [ ] `routes/starImageRoutes.js:158` 경로 패턴이 `thumbnails/hamel/generated/full/` 고정인지 재확인
- [ ] `server.js:131` `hamel_calm_emerald_base03.png`이 `thumbnails/hamel/generated/full/`에 존재하는지 확인
- [ ] `config/storybook/asset-registry.json`에 `canonical/source/hamel` 경로가 등재되지 않은지 확인 (등재 없음 — audit 확인됨)
- [ ] `public/images/archive/hamel/legacy/` 디렉토리 생성 가능 여부 확인
- [ ] git status가 clean한 상태인지 확인 (uncommitted 변경 없음)
- [ ] 이관 전 `git log` 기록 (rollback 기준점)

---

## 섹션 4 — 실행 순서 (이동 단계)

> ⚠️ 이 섹션은 계획서. 승인 전 실행 금지.

### Step 0 — 디렉토리 생성

```powershell
New-Item -ItemType Directory -Path "public/images/archive/hamel/legacy/canonical_source" -Force
New-Item -ItemType Directory -Path "public/images/archive/hamel/legacy/sample_v1/test" -Force
New-Item -ItemType Directory -Path "public/images/archive/hamel/legacy/sample_v2" -Force
New-Item -ItemType Directory -Path "public/images/archive/hamel/legacy/silheum_archive" -Force
```

### Step 1 — canonical_source 이관 (25장, ~88 MB)

```powershell
Move-Item -Path "public/images/canonical/source/hamel/*" `
          -Destination "public/images/archive/hamel/legacy/canonical_source/" `
          -Force
```

### Step 2 — sample_v1 이관 (8장, ~74 MB)

```powershell
Move-Item -Path "public/images/thumbnails/hamel/generated/sample/*.png" `
          -Destination "public/images/archive/hamel/legacy/sample_v1/" `
          -Force
Move-Item -Path "public/images/thumbnails/hamel/generated/sample/test/*.png" `
          -Destination "public/images/archive/hamel/legacy/sample_v1/test/" `
          -Force
```

### Step 3 — sample_v2 이관 (8장, ~67 MB)

```powershell
Move-Item -Path "public/images/thumbnails/hamel/generated/sample_v2/*" `
          -Destination "public/images/archive/hamel/legacy/sample_v2/" `
          -Force
```

### Step 4 — 실험_archive 이관 (1장)

```powershell
Move-Item -Path "public/images/thumbnails/hamel/실험_archive/*" `
          -Destination "public/images/archive/hamel/legacy/silheum_archive/" `
          -Force
```

### Step 5 — 이관 후 런타임 검증

```powershell
# 1. OG 이미지 파일 존재 확인
Test-Path "public/images/thumbnails/hamel/generated/full/hamel_calm_emerald_base03.png"
# → True 여야 함

# 2. generated/full 파일 수 확인 (50 PNG + manifest.json + .gitkeep = 52)
(Get-ChildItem "public/images/thumbnails/hamel/generated/full" -File).Count
# → 52 여야 함

# 3. canonical/source/hamel 비어있는지 확인
(Get-ChildItem "public/images/canonical/source/hamel" -File -ErrorAction SilentlyContinue).Count
# → 0 여야 함

# 4. archive 파일 수 확인 (25 + 8 + 8 + 1 = 42)
(Get-ChildItem "public/images/archive/hamel/legacy" -Recurse -File).Count
# → 42 여야 함
```

---

## 섹션 5 — Rollback 절차

이관 후 문제 발생 시 원상복구:

### Rollback Step 1 — canonical_source 복원

```powershell
Move-Item -Path "public/images/archive/hamel/legacy/canonical_source/*" `
          -Destination "public/images/canonical/source/hamel/" `
          -Force
```

### Rollback Step 2 — sample_v1 복원

```powershell
Move-Item -Path "public/images/archive/hamel/legacy/sample_v1/test/*" `
          -Destination "public/images/thumbnails/hamel/generated/sample/test/" `
          -Force
Move-Item -Path "public/images/archive/hamel/legacy/sample_v1/*.png" `
          -Destination "public/images/thumbnails/hamel/generated/sample/" `
          -Force
```

### Rollback Step 3 — sample_v2 복원

```powershell
Move-Item -Path "public/images/archive/hamel/legacy/sample_v2/*" `
          -Destination "public/images/thumbnails/hamel/generated/sample_v2/" `
          -Force
```

### Rollback Step 4 — 실험_archive 복원

```powershell
Move-Item -Path "public/images/archive/hamel/legacy/silheum_archive/*" `
          -Destination "public/images/thumbnails/hamel/실험_archive/" `
          -Force
```

### git 기반 완전 롤백

```powershell
# 이관을 git commit하지 않은 경우 — 모든 변경 취소
git restore .
```

> 권장: 이관 실행 직전 별도 commit하여 rollback 기준점 확보.

---

## 섹션 6 — 이관 후 docs 업데이트 필요 사항

이관 실행 후 다음 문서에 상태 갱신 필요:

| 문서 | 업데이트 내용 |
|---|---|
| `docs/ssot/air-engine/REGISTRY_v1_verified_2026-0516.md` | `canonical/source/hamel/` 경로 → archived로 표기 |
| `docs/reports/GATE6_Hamel_Full25_Result_Report.md` | canonical_path 항목 → archive 이동 기록 |
| `docs/assets/hamel/HAMEL_ASSET_INVENTORY.md` | 이관 완료 상태 반영 |
| `config/storybook/asset-registry.json` | 재빌드 불필요 (canonical/source는 미등재) |

---

## 섹션 7 — 이관 효과

| 항목 | 수치 |
|---|---|
| 이관 대상 파일 수 | 42장 |
| 절약 용량 | ~231 MB |
| 런타임 영향 | 없음 (0건 참조 경로만 이관) |
| 보존 파일 수 | 52장 (generated/full 전체) |
| 하드코딩 보호 파일 | 1장 (hamel_calm_emerald_base03.png) |

---

## 섹션 8 — 완료 기준

- [ ] `thumbnails/hamel/generated/full/` 50 PNG + manifest.json 모두 원위치 유지
- [ ] `server.js:131` OG 이미지 URL 정상 응답 (200)
- [ ] `starImageRoutes.js` 패턴 URL 정상 응답 (25종 × 5 base = 전체)
- [ ] archive 경로에 42장 존재
- [ ] `canonical/source/hamel/` 디렉토리 비어있음 (또는 제거됨)
- [ ] rollback 명령어 1회 테스트 완료

---

## 최종 판단 요약

```
KEEP (runtime SSOT):
  thumbnails/hamel/generated/full/          ← 실제 서빙 경로. 절대 이동 금지.

KEEP (pipeline):
  thumbnails/hamel/base/                    ← registry + starPosition.js 의존
  thumbnails/hamel/base/스토리북 5PAGE/     ← GATE 6 원천, registry 의존
  storybook/sources/page05/hamel/           ← page05.json + registry 의존
  star-cache/yeosu_hamel/                   ← wish-image 생성 타겟

PROTECT (파일명 변경 금지):
  thumbnails/hamel/generated/full/hamel_calm_emerald_base03.png
  ※ server.js OG 이미지 완전 하드코딩

MOVE TO ARCHIVE:
  canonical/source/hamel/              → archive/hamel/legacy/canonical_source/
  thumbnails/hamel/generated/sample/  → archive/hamel/legacy/sample_v1/
  thumbnails/hamel/generated/sample_v2/ → archive/hamel/legacy/sample_v2/
  thumbnails/hamel/실험_archive/       → archive/hamel/legacy/silheum_archive/
```
