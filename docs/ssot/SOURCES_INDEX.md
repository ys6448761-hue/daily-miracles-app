# SOURCES_INDEX — DreamTown SSOT 원본 출처 인덱스

Version: v1.0
Owner: Aurora5
Status: Active
Created: 2026-10-16

---

## 목적

`docs/ssot/sources/` 하위 원본 자료의 출처·날짜·연결 SSOT를 인덱싱한다.
원본 자료는 불변(Immutable)이며, 새 버전은 새 날짜 폴더에 추가한다.

---

## LINT Gate 상태

| 트랙 | 상태 | 보고서 |
|------|------|--------|
| Sora | PASS | `scripts/lint/LINT_REPORT_sora_v1.1.md` |
| 2D | PASS | `scripts/lint/LINT_REPORT_2d_v7.0.md` |

---

## 원본 소스 목록 (2026-02-01)

| 파일 | 설명 | 연결 SSOT |
|------|------|----------|
| `AURORA5_SORA_FINAL_v1.0.md` | Aurora5 Sora 최종 지시서 | SSOT-ROUTE-001 / SSOT-LOC-001 |
| `20260131_파크_2d_기술지원.md` | 파크 2D 기술지원 원본 | — |
| `20260201_드라이브_공유폴더_마스터가이드.md` | 공유폴더 마스터가이드 | — |
| `20260201_노션_DB_구조_3DB.md` | 노션 DB 구조 원본 | — |
| `GitHub_저장소_활용_가이드.md` | GitHub 저장소 가이드 원본 | — |
| `Code_종합지시서.md` | Code 종합지시서 원본 | — |

---

## 변경 규칙

- `docs/ssot/sources/` 내 파일은 수정 금지 (Immutable Source Protection 적용)
- 새 원본 추가 시 새 날짜 폴더(`YYYY-MM-DD/`)에 배치
- 인덱스 갱신은 이 파일만 수정
