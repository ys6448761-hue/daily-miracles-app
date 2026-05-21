# HAMEL_REFERENCE_AUDIT.md

> 작성일: 2026-05-21  
> 목적: 하멜 자산 각 경로의 실제 참조 현황 조사 — 삭제/이관 위험 판단  
> 규칙: 파일 이동 금지 / 삭제 금지 / rename 금지 — 조사 전용

---

## 핵심 결론 (요약)

| 경로 | 분류 | 런타임 코드 참조 | 삭제 위험 |
|---|---|---|---|
| `thumbnails/hamel/generated/full/` | **actively_used** | ✅ 3곳 (route, server, manifest) | ❌ 절대 삭제 불가 |
| `storybook/sources/page05/hamel/` | **actively_used** | ✅ config + registry | ❌ 삭제 불가 |
| `thumbnails/hamel/base/스토리북 5PAGE/` | **indirectly_referenced** | registry만 (스크립트 단계) | ⚠️ 저위험 (registry에만 등재) |
| `thumbnails/hamel/base/` | **indirectly_referenced** | registry만 (스크립트 단계) | ⚠️ 저위험 |
| `star-cache/yeosu_hamel/` | **indirectly_referenced** | config/생성 스크립트 참조 | ⚠️ 생성 타겟 경로 |
| `canonical/source/hamel/` | **unreferenced** | ❌ 런타임 코드 0건 | ✅ 삭제 검토 가능 |
| `thumbnails/hamel/generated/sample/` | **unreferenced** | ❌ 0건 | ✅ 삭제 검토 가능 |
| `thumbnails/hamel/generated/sample_v2/` | **unreferenced** | ❌ 0건 | ✅ 삭제 검토 가능 |
| `thumbnails/hamel/실험_archive/` | **unreferenced** | ❌ 0건 | ✅ 삭제 검토 가능 |

---

## 1. actively_used

### 1-A. `thumbnails/hamel/generated/full/`

이 경로는 **라이브 런타임 코드 3곳에서 직접 참조**된다.

#### 참조 1 — 런타임 URL 생성 (패턴 기반)
```
routes/starImageRoutes.js:158
```
```javascript
return `/images/thumbnails/hamel/generated/full/hamel_${hamelEmotion}_${gemstone}_base${baseNum}.png`;
```
- 경로 하드코딩: **부분** (폴더 경로는 고정, 파일명은 emotion/gem/base번호 조합으로 생성)
- 참조 파일명 의존: `hamel_{emotion}_{gem}_base{01~05}.png` 패턴 25종 전체

#### 참조 2 — OG 이미지 기본값 (서버)
```
server.js:131
```
```javascript
const _DEFAULT_IMG = `${_BASE}/images/thumbnails/hamel/generated/full/hamel_calm_emerald_base03.png`;
```
- 경로 하드코딩: **완전** — `hamel_calm_emerald_base03.png` 파일명 직접 명시
- filename dependency: `hamel_calm_emerald_base03.png` 삭제 시 OG 이미지 깨짐

#### 참조 3 — manifest.json (50개 파일 개별 명시)
```
public/images/thumbnails/hamel/generated/full/manifest.json
```
- 25개 clean + 25개 _text 이미지 URL 전체 명시
- 이 manifest를 참조하는 코드: `starImageRoutes.js:134` 주석에 명시 (실제 파일은 패턴 직접 사용)

#### 참조 4 — storybook asset-registry.json
```
config/storybook/asset-registry.json
```
- 50개 파일 전체 `file_path`로 등재됨
- `assemble-storybook-test.js`가 registry를 통해 간접 참조

---

### 1-B. `storybook/sources/page05/hamel/`

config + registry 레벨에서 활성 참조. 아직 스토리북 런타임 API는 없으나 파이프라인 핵심 경로.

| 참조 위치 | 파일 | 역할 |
|---|---|---|
| `config/storybook/page05.json:162~180` | output_path로 4번 명시 | 생성 스크립트 출력 경로 |
| `config/storybook/asset-registry.json:3820~3892` | 4개 file_path 등재 | 조립 엔진 소스 |
| `scripts/storybook/build-asset-registry.js:118` | 폴더 스캔 대상 | registry 재빌드 시 스캔 |
| `scripts/storybook/assemble-storybook-test.js` | registry 통해 간접 사용 | continuity_connector 선택 |

---

## 2. indirectly_referenced

### 2-A. `thumbnails/hamel/base/스토리북 5PAGE/`

| 참조 위치 | 파일 | 역할 |
|---|---|---|
| `config/storybook/asset-registry.json:3508~3604` | 5개 file_path 등재 | base_master 역할로 registry에 등재 |
| `scripts/storybook/build-asset-registry.js:98` | 폴더 스캔 대상 | registry 재빌드 시 스캔 |

- 런타임 API 또는 라우트에서 이 파일들을 직접 serve하는 코드 없음
- 조립 엔진 점수 계산 시 base_master (+50점)으로 간접 활용될 수 있음 (현재는 assemble-storybook-test.js만 사용)

### 2-B. `thumbnails/hamel/base/` (base 루트 5장)

| 참조 위치 | 파일 | 역할 |
|---|---|---|
| `config/storybook/asset-registry.json:3388~3484` | 5개 file_path 등재 | base_master 역할 |
| `scripts/storybook/build-asset-registry.js:90` | 폴더 스캔 대상 | |
| `scripts/thumbnail/lib/starPosition.js:29` | 파일명 패턴 주석 | `hamel_base_02_left.png` 타입 감지 로직 |

- `starPosition.js`는 썸네일 생성 스크립트 (서버 런타임 아님)
- `hamel_base_02_left` 등의 파일명은 좌/우/low/wide 방향 정보를 담고 있어 스크립트 로직에 의미 있음

### 2-C. `star-cache/yeosu_hamel/`

| 참조 위치 | 파일 | 역할 |
|---|---|---|
| `config/wish-image/hamel.json:111` | `"final_dir": "public/images/star-cache/yeosu_hamel"` | 소원 이미지 생성 출력 경로 |
| `scripts/wish-image/generate-hamel-wish-image.js` | 생성 스크립트 출력 타겟 | 파일 생성 시 이 경로에 저장 |

- 현재 1장(confusion/sapphire)만 존재. 나머지 24 조합 미생성.
- **생성 완료 후 서빙 코드는 아직 없음** — 생성 준비 경로로 예약된 상태

---

## 3. unreferenced

### 3-A. `canonical/source/hamel/` ← 핵심 판단 대상

**런타임 .js/.ts/.jsx/.tsx 참조: 0건**

검색 결과 (`canonical/source/hamel` 패턴):

| 파일 | 내용 | 성격 |
|---|---|---|
| `docs/ssot/air-engine/REGISTRY_v1_verified_2026-0516.md` | 경로 나열 | 문서 |
| `docs/reports/GATE6_Hamel_Regeneration_PromptPack_Report.md` | 복사 이력 기록 | 문서 |
| `docs/reports/GATE6_Hamel_Full25_Result_Report.md` | canonical_path 기재 | 문서 |
| `public/images/canonical/source/MANIFEST.md` | source_origin = thumbnails/hamel/generated/full/ 명시 | 매니페스트 |

`MANIFEST.md`에 명시된 내용:
```yaml
source_origin: public/images/thumbnails/hamel/generated/full/
notes: 원본 thumbnails/hamel/ 보존.
```
즉, **canonical/source/hamel은 generated/full에서 복사한 백업이며,**  
MANIFEST.md 자체가 이를 명시함.

#### 생성 경위 추정
GATE6 보고서 기록:
```
# canonical/source/hamel/ 에 25장 복사
```
→ GATE6 완료 시점에 "원천 보관" 목적으로 복사. 이후 어떤 파이프라인도 이 경로를 소비하지 않음.

#### dead asset 여부
- ✅ **dead asset 확정**: 런타임 참조 0건, config 참조 0건, registry 미등재
- `generated/full/`이 실제 SSOT로 기능 중

---

### 3-B. `thumbnails/hamel/generated/sample/`

| 상태 | 근거 |
|---|---|
| 런타임 참조 0건 | grep 결과 없음 |
| config/registry 참조 없음 | build-asset-registry.js 스캔 대상 아님 |
| 계획 문서 명시 | `docs/plans/PLAN_2026_0516_16x9_CANONICAL_MASTER.md:213` — "구버전, 실사용 금지" |

포함 파일: 구버전 샘플 3장 + test/ 5장 (총 8장, ~74 MB)

---

### 3-C. `thumbnails/hamel/generated/sample_v2/`

| 상태 | 근거 |
|---|---|
| 런타임 참조 0건 | grep 결과 없음 |
| config/registry 참조 없음 | 스캔 대상 아님 |
| 계획 문서 명시 | `PLAN_2026_0516_16x9_CANONICAL_MASTER.md:214` — "최종 v2 + DEBUG 3장" 아카이브 표시 |

포함 파일: 샘플 5장 + DEBUG 3장 (총 8장, ~67 MB)

---

### 3-D. `thumbnails/hamel/실험_archive/`

- 파일 1장: `hamel_base_04_curiosity_NEW.png`
- 런타임 참조 0건, 스캔 대상 아님
- 폴더명 자체가 "실험_archive" — 아카이브 의도 명확

---

## 4. SSOT 판단

### 어느 경로가 SSOT인가?

| 역할 | SSOT 경로 | 근거 |
|---|---|---|
| 하멜 썸네일 런타임 서빙 | `thumbnails/hamel/generated/full/` | `starImageRoutes.js:158`, `server.js:131` 직접 참조 |
| 스토리북 page05 | `storybook/sources/page05/hamel/` | `page05.json`, `asset-registry.json` 등재 |
| 소원 이미지 생성 출력 | `star-cache/yeosu_hamel/` | `config/wish-image/hamel.json:111` |
| 원천 base (재생성 시) | `thumbnails/hamel/base/스토리북 5PAGE/` | GATE 6 최종 원천, registry 등재 |

**`canonical/source/hamel/`은 SSOT 아님.** generated/full의 복사본이며, 어떤 파이프라인도 이 경로를 소비하지 않는다.

---

## 5. 경로 하드코딩 현황

| 하드코딩 위치 | 파일 | 내용 |
|---|---|---|
| `server.js:131` | 완전 하드코딩 | `hamel_calm_emerald_base03.png` — OG 기본 이미지 |
| `starImageRoutes.js:158` | 부분 하드코딩 | 폴더 경로 고정, 파일명 패턴 조합 |
| `generated/full/manifest.json` | 50개 파일 전체 명시 | 재생성 시 manifest도 갱신 필요 |
| `config/storybook/asset-registry.json` | 50개 file_path | `build-asset-registry.js` 재실행으로 갱신 가능 |

---

## 6. 위험 판단 요약

### `canonical/source/hamel/` 삭제 시 발생하는 일

- 런타임 코드 영향: **없음** (0건 참조)
- 도큐멘테이션 링크 단절: docs 3개 파일에서 경로 언급 (보고서/SSOT 문서)
- 데이터 손실: **없음** — 모든 파일이 `thumbnails/hamel/generated/full/`과 바이트 단위 동일

→ **삭제 안전성: 높음.** 단, 삭제 전 docs 보고서의 경로 기재를 "archived" 처리하거나 별도 메모 권고.

### `thumbnails/hamel/generated/sample*/` 삭제 시

- 런타임 영향: 없음
- PLAN 문서에서 이미 "구버전, 실사용 금지"로 분류됨
- 절약 가능 용량: ~141 MB

→ **삭제 안전성: 높음.**

---

## 7. 파일명 의존성 목록

런타임에서 파일명을 직접 의존하는 경우:

| 파일명 패턴 | 의존 코드 | 설명 |
|---|---|---|
| `hamel_{emotion}_{gem}_base{01~05}.png` | `starImageRoutes.js:158` | emotion/gem/base번호 패턴 — 파일명 변경 시 URL 깨짐 |
| `hamel_calm_emerald_base03.png` | `server.js:131` | OG 기본 이미지 — 이 파일 삭제/이름 변경 시 OG 이미지 깨짐 |
| `hamel_page05_{type}_base.png` (4개) | `config/storybook/page05.json` | page05 스크립트 출력 파일명 — 변경 시 config 수정 필요 |

---

## 부록 — 검색 대상 및 결과

### 검색한 파일 유형
- `.js`, `.ts`, `.jsx`, `.tsx` — 런타임/스크립트 코드
- `.json` — config, registry
- `.html`, `.css` — 프론트엔드 정적 파일

### `canonical/source/hamel` 패턴 검색 결과 (runtime .js 기준)
```
결과: 0건
```
모든 참조는 `.md` 문서 파일에만 존재.

### `thumbnails/hamel` 패턴 검색 결과 (runtime .js 기준)
```
routes/starImageRoutes.js  — URL 생성 로직 (LINE 158)
server.js                  — OG 기본 이미지 (LINE 131)
scripts/storybook/build-asset-registry.js — 폴더 스캔
```
