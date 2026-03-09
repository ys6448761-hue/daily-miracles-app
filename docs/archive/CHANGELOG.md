# SSOT 변경 로그 (CHANGELOG)

> **Single Source of Truth Change Log**
> 모든 정본 변경사항을 기록합니다.

---

## [Unreleased]

---

## [2026-02-01] - SSOT 초기 구축

### Added
- 원문 소스 6개 저장 (docs/ssot/sources/2026-02-01/)
  - AURORA5_SORA_FINAL_v1.0.md
  - 20260131_파크_2d_기술지원.md
  - 20260201_드라이브_공유폴더_마스터가이드.md
  - 20260201_노션_DB_구조_3DB.md
  - GitHub_저장소_활용_가이드.md
  - Code_종합지시서.md

- 공통 정본 생성
  - docs/ssot/SOURCES_INDEX.md (원문→정본 매핑표)
  - docs/ssot/CHANGELOG.md (본 문서)
  - scripts/lint/lint_rules.common.json (공통 린트 규칙)

- Sora 트랙 정본 생성 (v1.1)
  - docs/sora/v1.1/VIDEO_MASTER.md
  - prompts/sora/v1.1/PROMPT_PACK.yaml
  - scripts/lint/LINT_REPORT_sora_v1.1.md
  - profiles/sora_cinematic.yaml

- 2D 트랙 정본 생성 (v7.0)
  - docs/2d/v7.0/MIRACLE_MASTER_GUIDELINES.md
  - scripts/lint/LINT_REPORT_2d_v7.0.md
  - profiles/2d_ghibli_webtoon.yaml

### Changed
- N/A (초기 구축)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## 변경 유형 가이드

| 유형 | 설명 | 버전 증가 |
|------|------|----------|
| Added | 새로운 기능/문서 추가 | Minor |
| Changed | 기존 기능 변경 | Minor |
| Deprecated | 향후 제거 예정 표시 | Minor |
| Removed | 기능/문서 제거 | Major |
| Fixed | 버그 수정 | Patch |
| Security | 보안 취약점 수정 | Patch |

---

## 버전 관리 규칙

- **Major (X.0.0)**: 호환성 깨지는 변경, 원칙 삭제/대폭 수정
- **Minor (0.X.0)**: 기능 추가, 프롬프트 보완, 원칙 추가
- **Patch (0.0.X)**: 오타 수정, 포맷 정리, 문서 보완

---

## 기여자

| 역할 | 담당 |
|------|------|
| 원문 작성 | 루미, 파크, 노트, 재미 |
| 정본 생성 | Code |
| 검수 | 코미, CEO (푸르미르) |
