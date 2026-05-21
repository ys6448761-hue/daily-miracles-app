# DISCARD_CLEANUP_PLAN.md

> 작성일: 2026-05-22  
> 기준 커밋: `d6c9683` (chore/ops push 직후)  
> 목적: 남은 DISCARD 후보 로컬 삭제 절차 + docs/patent 보안 이관 계획  
> 상태: **계획 확정 — 미실행**

---

## 요약

| 항목 | 경로 | 크기 | 처리 |
|------|------|-----:|------|
| X1-a | `assets/brand/` | 7.5MB | 🗑 로컬 삭제 (중복본) |
| X1-b | `assets/source/video/` | 3.1MB | 🗑 로컬 삭제 (미사용 소스) |
| X4 | `outputs/prompts/hamel-test5/` | 24KB | 🗑 로컬 삭제 (실험 버전) |
| 🔒 | `docs/patent/` | 20KB | ⛔ 보안 저장소 이관 후보 — 삭제 전 이관 필수 |

> `git rm` 불필요 — 모두 untracked(미추적) 파일이므로 로컬 `rm -rf`로 충분.

---

## X1-a — `assets/brand/` (7.5MB)

**삭제 이유:**
- `assets/brand/core/cablecar-star-intro.png` (4.5MB)  
  → `public/assets/brand/core/cablecar-star-intro.png`로 이미 tracked ✅
- `assets/brand/intro/cablecar-star-intro.mp4.mp4` (3MB)  
  → 이중 확장자(`.mp4.mp4`) 오류 파일. tracked 버전은 `public/assets/brand/intro/cablecar-star-intro.mp4`  
  → 런타임 참조 없음 (서버/routes에서 `assets/brand/` 경로 0건)
- 결론: `public/assets/brand/`의 잘못된 경로 복사본

**삭제 명령:**
```powershell
Remove-Item -Recurse -Force "assets\brand"
```

---

## X1-b — `assets/source/video/cablecar-star-intro_v1.mp4` (3.1MB)

**삭제 이유:**
- 런타임 참조 경로: `complete.html`, `StarBirth.jsx` → `/videos/cablecar-star-intro.mp4` = `public/videos/` (별도 tracked)
- `assets/source/video/`는 소스 원본 보관 경로이나 프로젝트에서 미참조
- 결론: 소스 백업본, git에 불필요

**삭제 명령:**
```powershell
Remove-Item -Recurse -Force "assets\source"
```

---

## X4 — `outputs/prompts/hamel-test5/` (24KB)

**삭제 이유:**
- hamel 감정 프롬프트 실험 버전 5개:
  - `01_confusion_hamel-test5_prompt.txt`
  - `02_pause_hamel-test5_prompt.txt`
  - `03_calm_hamel-test5_prompt.txt`
  - `04_curiosity_hamel-test5_prompt.txt`
  - `05_fragile_hope_hamel-test5_prompt.txt`
- 최종 버전 `outputs/prompts/hamel/` 5개로 이미 커밋됨 (GROUP A)
- 결론: 대체된 실험 버전, 잔류 불필요

**삭제 명령:**
```powershell
Remove-Item -Recurse -Force "outputs\prompts\hamel-test5"
```

---

## 🔒 `docs/patent/` — 보안 저장소 이관 (삭제 전 필수)

**⚠️ 즉시 삭제 금지 — 이관 완료 후 삭제**

| 항목 | 내용 |
|------|------|
| **파일** | `DreamTown_특허출원_준비자료_v1.0 .md.docx` (20KB) |
| **문제점 1** | `.docx` 바이너리 — git에 비적합 (diff 불가, 버전관리 의미 없음) |
| **문제점 2** | 특허 출원 준비 자료 — 영업비밀 포함 가능성 |
| **문제점 3** | `.gitignore`에 미등록 상태 → 향후 실수로 `git add .` 시 커밋될 위험 |

**처리 절차:**

1. **이관 (삭제 전)**: 아래 중 하나로 복사
   - Google Drive 보안 폴더 (권장)
   - 별도 private 레포 (git-crypt 또는 비공개)
   - 로컬 암호화 폴더

2. **이관 확인 후** — `.gitignore`에 추가:
   ```gitignore
   # 특허 문서 (민감 — 보안 저장소에서 관리)
   docs/patent/
   ```

3. **이관 + .gitignore 커밋 확인 후** — 로컬 삭제:
   ```powershell
   Remove-Item -Recurse -Force "docs\patent"
   ```

---

## 실행 체크리스트

```
[ ] docs/patent/ 보안 저장소 이관 완료 확인
[ ] .gitignore에 docs/patent/ 추가 + commit
[ ] Remove-Item "assets\brand"           (X1-a)
[ ] Remove-Item "assets\source"          (X1-b)
[ ] Remove-Item "outputs\prompts\hamel-test5"  (X4)
[ ] Remove-Item "docs\patent"            (이관 완료 후)
[ ] git status 확인 — HOLD 항목만 남아있는지 검증
```

---

## 실행 후 예상 git status (HOLD 항목만)

```
?? config/wish-image/
?? scripts/wish-image/
?? outputs/prompts/wish-image/
?? dreamtown-frontend/src/components/ImpactFlow.jsx
?? dreamtown-frontend/src/components/impact.css
?? public/images/star-cache/_baseline/
?? public/images/star-cache/yeosu_hamel/
```

---

## 주의: 삭제 전 최종 확인

| 파일 | git tracked 버전 존재 여부 |
|------|--------------------------|
| `assets/brand/core/cablecar-star-intro.png` | ✅ `public/assets/brand/core/cablecar-star-intro.png` |
| `assets/brand/intro/cablecar-star-intro.mp4.mp4` | ✅ `public/assets/brand/intro/cablecar-star-intro.mp4` (정상 확장자) |
| `assets/source/video/cablecar-star-intro_v1.mp4` | ✅ `public/videos/cablecar-star-intro.mp4` (런타임 참조 버전) |
| `outputs/prompts/hamel-test5/*.txt` | ✅ `outputs/prompts/hamel/*.txt` (최종 버전 커밋됨) |
