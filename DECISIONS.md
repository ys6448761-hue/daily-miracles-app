# Decisions Log

> 주요 기술/운영 결정사항 요약

## 2026-02-26

| ID | 결정 | 이유 |
|----|------|------|
| D-001 | Tracking SMS 전용 전환 | betawelcome 템플릿 본문 불일치 (NCP 3016) |
| D-002 | Open Gate 3종 도입 | 오픈 직전 사고 방지 (APP_DISABLED, OUTBOUND, PLAZA) |
| D-003 | Prisma read-only layer (Option C) | 기존 pg 389 API 무변경, 공개 뷰 전용 |
| D-004 | Plaza DB 3컬럼 선반영 | is_public, is_featured, hidden_at |
| D-005 | docs/ 7폴더 재구성 | SSOT 원칙, 문서 체계화 |

## 상세 결정문

→ [docs/decisions/](docs/decisions/)

---

*최종 업데이트: 2026-02-26*
