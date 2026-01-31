# SSOT 원문→정본 반영 매핑표

> **Single Source of Truth Index**
> Last updated: 2026-02-01

---

## 원문 소스 목록 (Immutable Sources)

| # | 원문 파일 | 경로 | 생성일 |
|---|----------|------|--------|
| S1 | AURORA5_SORA_FINAL_v1.0.md | docs/ssot/sources/2026-02-01/ | 2026-02-01 |
| S2 | 20260131_파크_2d_기술지원.md | docs/ssot/sources/2026-02-01/ | 2026-01-31 |
| S3 | 20260201_드라이브_공유폴더_마스터가이드.md | docs/ssot/sources/2026-02-01/ | 2026-02-01 |
| S4 | 20260201_노션_DB_구조_3DB.md | docs/ssot/sources/2026-02-01/ | 2026-02-01 |
| S5 | GitHub_저장소_활용_가이드.md | docs/ssot/sources/2026-02-01/ | 2026-02-01 |
| S6 | Code_종합지시서.md | docs/ssot/sources/2026-02-01/ | 2026-02-01 |

---

## 정본 산출물 (Canonical Artifacts)

### 공통 (Common)

| 정본 파일 | 경로 | 참조 원문 | 버전 |
|----------|------|----------|------|
| SOURCES_INDEX.md | docs/ssot/ | S5, S6 | v1.0 |
| CHANGELOG.md | docs/ssot/ | S6 | v1.0 |
| lint_rules.common.json | scripts/lint/ | S1, S2, S6 | v1.0 |

### Sora 트랙 (Cinematic)

| 정본 파일 | 경로 | 참조 원문 | 버전 |
|----------|------|----------|------|
| VIDEO_MASTER.md | docs/sora/v1.1/ | S1 | v1.1 |
| PROMPT_PACK.yaml | prompts/sora/v1.1/ | S1 | v1.1 |
| LINT_REPORT_sora_v1.1.md | scripts/lint/ | S1, S6 | v1.1 |
| sora_cinematic.yaml | profiles/ | S1, S6 | v1.0 |

### 2D 트랙 (Ghibli + Webtoon)

| 정본 파일 | 경로 | 참조 원문 | 버전 |
|----------|------|----------|------|
| MIRACLE_MASTER_GUIDELINES.md | docs/2d/v7.0/ | S2, S3 | v7.0 |
| LINT_REPORT_2d_v7.0.md | scripts/lint/ | S2, S6 | v7.0 |
| 2d_ghibli_webtoon.yaml | profiles/ | S2, S3, S6 | v1.0 |

---

## 원문→정본 매핑 (Traceability Matrix)

| 원문 | 정본 산출물 |
|------|------------|
| S1 (AURORA5_SORA_FINAL_v1.0) | → VIDEO_MASTER.md, PROMPT_PACK.yaml, sora_cinematic.yaml, lint_rules.common.json |
| S2 (파크_2d_기술지원) | → MIRACLE_MASTER_GUIDELINES.md, 2d_ghibli_webtoon.yaml, lint_rules.common.json |
| S3 (드라이브_마스터가이드) | → MIRACLE_MASTER_GUIDELINES.md, 2d_ghibli_webtoon.yaml |
| S4 (노션_DB_구조) | → (참고 문서, 직접 정본 없음) |
| S5 (GitHub_활용_가이드) | → SOURCES_INDEX.md |
| S6 (Code_종합지시서) | → CHANGELOG.md, 모든 LINT_REPORT |

---

## 변경 추적 규칙

1. **원문 수정 금지**: `docs/ssot/sources/` 내 파일은 절대 수정하지 않음
2. **새 버전 생성**: 원문 변경 필요 시 새 날짜 폴더에 새 파일 생성
3. **정본 업데이트**: 원문 변경 시 관련 정본 모두 업데이트
4. **CHANGELOG 기록**: 모든 변경사항 기록 필수

---

## LINT Gate 상태

| 트랙 | LINT 결과 | 최종 검증일 |
|------|----------|------------|
| Sora v1.1 | ✅ **PASS** (40/40) | 2026-02-01 |
| 2D v7.0 | ✅ **PASS** (46/46) | 2026-02-01 |

> **Gate 통과**: 모든 트랙 LINT PASS 확인됨. PR merge 가능.
