# D2_D3_FUNCTIONAL_REVIEW.md

> 작성일: 2026-05-21  
> 기준 커밋: `635abd2` (.gitignore 보호 완료 직후)  
> 목적: D2/D3 변경분을 기능 기준으로 분류 — commit / hold / discard  
> 상태: **분류 완료 — git add/commit/push 미실행**

---

## 요약

| 후보 | 파일 수 | 처리 |
|------|--------:|------|
| **COMMIT 후보** | 5 항목 (~16 파일) | ✅ 즉시 커밋 가능 |
| **HOLD** | 6 항목 | ⏸ 파이프라인/빌드 완성 후 |
| **DISCARD** | 4 항목 | 🗑 .gitignore 추가 또는 삭제 |

---

## COMMIT 후보

### 1. `scripts/generate-star-images.js` (M)

| 항목 | 내용 |
|------|------|
| **변경 범위** | 675 diff lines — Stage1/2 파이프라인 대폭 개선 |
| **런타임 참조** | ❌ server.js에서 require/import 없음 — CLI 단독 실행 스크립트 |
| **변경 내용** | `--validate-only`, `--retry-queue`, `--parallel=N`, `--skip-validate` 플래그 추가; `FAILED_DIR`, `RETRY_QUEUE` 경로; 병렬 처리 로직; summary/report 리팩토링 |
| **MVP 영향** | 없음 — 이미지 생성 전용 CLI 도구, 서버 런타임 독립 |
| **위험도** | 낮음 |
| **추천** | ✅ commit |

### 2. `scripts/apply-migration.js` (새 파일)

| 항목 | 내용 |
|------|------|
| **크기** | 2.6KB |
| **역할** | DB 마이그레이션 단독 실행 도구 — `DATABASE_URL=... node scripts/apply-migration.js migrations/file.sql` |
| **기능** | SQL 출력 → 5초 대기(Ctrl-C 가능) → BEGIN/COMMIT 단일 트랜잭션 실행 |
| **런타임 참조** | ❌ 없음 — 수동 운영 도구 |
| **MVP 영향** | 없음 |
| **추천** | ✅ commit (운영 필수 도구) |

### 3. `public/admin/resonance.html` (M)

| 항목 | 내용 |
|------|------|
| **변경 범위** | 55 diff lines |
| **변경 내용** | `.result-line` CSS 추가; "이 별의 결과" 내러티브 카드 추가 (impact/conversion/action count 표시) |
| **런타임 참조** | 관리자 UI — `server.js`에서 `/admin/` 경로로 serve됨. `/api/impact` stats API 사용 |
| **의존 관계** | 독립적 — 별도 빌드 불필요 |
| **MVP 영향** | 관리자 전용, 사용자 흐름 무관 |
| **추천** | ✅ commit |

### 4. `public/storybook-share.html` (M)

| 항목 | 내용 |
|------|------|
| **변경 범위** | 34 diff lines |
| **변경 내용** | `.impact-flow.revealed` 애니메이션 CSS; CTA 노출 시 `impact-flow` reveal 자동 실행 JS 추가 |
| **구현 방식** | 바닐라 JS — React 컴포넌트(`ImpactFlow.jsx`) 미의존 (독립 구현) |
| **런타임 참조** | 공유 스토리북 페이지 — 공개 URL |
| **ImpactFlow.jsx와 관계** | ❌ 참조 없음 — 동일 기능의 바닐라 JS 버전 |
| **추천** | ✅ commit (`ImpactFlow.jsx`와 독립) |

### 5. `public/qr/` (12 QR PNG 파일, 39KB)

| 항목 | 내용 |
|------|------|
| **파일 목록** | QR_라또아, QR_케이블카_별만들기, QR_파란시, QR_포레스트랜드, QR_항해선택, QR_cablecar, QR_lattoa, QR_paransi, QR_yeosu_cablecar_workshop 등 |
| **크기** | 총 39KB — git 부담 없음 |
| **용도** | 파트너 현장 운영용 QR 코드 |
| **런타임 참조** | `express.static('public')` 에 의해 자동 서빙 |
| **추천** | ✅ commit (`_archive/` 제외 검토 후) |

---

## HOLD

### H1. `config/wish-image/` + `scripts/wish-image/`

| 항목 | 내용 |
|------|------|
| **파일** | `config/wish-image/hamel.json` (6KB), `hamel-copy.json` (0KB); `scripts/wish-image/generate-hamel-wish-image.js` (6KB), `build-hamel-wish-image.js` (4KB) |
| **서버 참조** | `wishImageRoutes.js`가 `/api/wish-image/generate` API 운영 중이나, 이 scripts는 서버 routes에서 `require` 되지 않음 — 독립 CLI |
| **현재 상태** | 파이프라인 준비 완료, 서버 통합 미연결 |
| **HOLD 이유** | star-cache 서빙 라우트 미완성 상태에서 커밋해도 동작하지 않음. 서빙 파이프라인 완성 후 통합 커밋 권고 |

### H2. `outputs/prompts/wish-image/` (5 txt)

| 항목 | 내용 |
|------|------|
| **파일** | hamel 감정별 소원이미지 생성 프롬프트 5개 |
| **HOLD 이유** | wish-image 파이프라인(H1)과 묶어서 함께 커밋 권고 |

### H3. `outputs/wish-image/` (7 파일, ~16MB)

| 항목 | 내용 |
|------|------|
| **파일** | `wish_hamel_*.png` ×5 + `_contact_sheet.png` + 중복1 |
| **런타임 참조** | ❌ 없음 — star-cache 서빙 라우트 미완성 |
| **HOLD 이유** | 16MB 생성 결과물. `.gitignore` 추가 후 로컬 보관이 더 적합할 수 있음 |
| **권고** | HOLD 또는 `.gitignore outputs/wish-image/` 추가 검토 |

### H4. `dreamtown-frontend/src/components/ImpactFlow.jsx` + `impact.css`

| 항목 | 내용 |
|------|------|
| **파일** | `ImpactFlow.jsx` 3.4KB, `impact.css` 0.9KB |
| **역할** | React 임팩트 플로우 컴포넌트 — journeyId prop 기반 |
| **런타임 참조** | ❌ 현재 어떤 컴포넌트에서도 `import ImpactFlow` 없음 |
| **storybook-share.html과 관계** | 독립 — html은 바닐라 JS 구현, jsx는 React 구현 |
| **HOLD 이유** | 미사용 컴포넌트. 어떤 화면에 통합할지 결정 후 커밋 |

### H5. `public/images/star-cache/yeosu_hamel/` (2 파일, 3.2MB)

| 항목 | 내용 |
|------|------|
| **파일** | `.gitkeep` + `01_confusion_sapphire_yeosu_hamel.png` |
| **런타임 참조** | ❌ 소원이미지 서빙 라우트 미완성 |
| **HOLD 이유** | star-cache 서빙 파이프라인 완성 후 결정 |

### H6. `public/images/star-cache/_baseline/` (.gitkeep)

| 항목 | 내용 |
|------|------|
| **내용** | `.gitkeep` 1개 — 비어있는 디렉토리 플레이스홀더 |
| **HOLD 이유** | 기능 확정 후 필요성 판단 |

---

## DISCARD

### X1. `assets/brand/` — tracked 파일과 중복, 잘못된 경로

| 항목 | 내용 |
|------|------|
| **파일** | `assets/brand/core/cablecar-star-intro.png` (4.5MB), `assets/brand/intro/cablecar-star-intro.mp4.mp4` (3MB) |
| **문제** | `public/assets/brand/core/cablecar-star-intro.png` — **이미 tracked** (git ls-files 확인) |
| **문제** | `assets/brand/intro/cablecar-star-intro.mp4.mp4` — **이중 확장자** 오류; tracked 버전은 `.mp4` |
| **런타임 경로** | `AppLaunch.jsx`는 `/assets/brand/` 경로를 참조 = `public/assets/brand/` (이미 tracked) |
| **결론** | `assets/brand/`는 `public/assets/brand/`의 잘못된 경로 복사본 + 이름 오류 |
| **추천** | 🗑 discard (로컬 삭제 가능) |

### X2. `assets/source/video/cablecar-star-intro_v1.mp4` (3MB)

| 항목 | 내용 |
|------|------|
| **런타임 경로** | `complete.html`, `StarBirth.jsx`는 `/videos/cablecar-star-intro.mp4`를 참조 = `public/videos/` (별도 tracked) |
| **결론** | 소스 파일, 런타임 미사용 경로 |
| **추천** | 🗑 discard 또는 로컬 아카이브 |

### X3. `outputs/aurum_f0s~f4s.jpg` + `public/debug/aurum_intro_frames.jpg`

| 항목 | 내용 |
|------|------|
| **내용** | Aurum 인트로 영상 프레임 캡처 5개 + 합성 디버그 이미지 |
| **런타임 참조** | ❌ 없음 (`aurum_f` 패턴 서버/routes 참조 0건) |
| **추천** | 🗑 discard — 디버깅용 임시 캡처물 |

### X4. `outputs/prompts/hamel-test5/` (5 txt)

| 항목 | 내용 |
|------|------|
| **내용** | hamel-test5 감정 프롬프트 5개 (실험 버전) |
| **비교** | GROUP A에서 이미 `outputs/prompts/hamel/` 5개 커밋됨 (최종 버전) |
| **추천** | 🗑 discard — GROUP A로 대체된 실험 버전 |

---

## 기타 항목

| 경로 | 분류 | 이유 |
|------|------|------|
| `docs/patent/` | ⚠️ 별도 처리 | `.docx` 바이너리 + 특허 민감. git 비적합 — 보안 저장소 이동 권고 |
| `public/qr/_archive/` | HOLD | QR 아카이브 — 확인 후 포함 여부 결정 |

---

## 추천 다음 커밋 (D2/D3 중)

**커밋 단위 1 — 운영 도구 + 관리자 UI**

```
chore(ops): add migration script, generate-star-images improvements,
            resonance admin UI, storybook share impact-flow, QR assets
```

포함 파일:
- `scripts/generate-star-images.js`
- `scripts/apply-migration.js`
- `public/admin/resonance.html`
- `public/storybook-share.html`
- `public/qr/` (12 PNG, 39KB — _archive 제외 여부 결정 후)

**이후 커밋 — wish-image 파이프라인 완성 시**
- `config/wish-image/`, `scripts/wish-image/`, `outputs/prompts/wish-image/`

**빌드 후 커밋 — DreamTown frontend 통합 시**
- `ImpactFlow.jsx`, `impact.css`

---

## .gitignore 추가 권고

```gitignore
# wish-image 생성 결과물 (large, regenerable)
outputs/wish-image/
# Aurum 디버그 캡처물
outputs/aurum_*.jpg
public/debug/
```
