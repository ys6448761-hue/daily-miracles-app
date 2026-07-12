---
title: Constitution Governance
status: Active
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-12
---

# Constitution Governance

## 목적

DreamTown의 Constitution은 선언으로 만들어지지 않는다.

모든 원칙은 실제 운영에서 반복 검증된 후 Candidate에서 Constitution으로 승격된다.

이번 문서는 그 승격이 **어떻게 검증되고 언제 일어나는지**를 관리하는 운영체계(Governance)다.

---

## Constitution Lifecycle

```
Research
  ↓
Candidate
  ↓
Constitution
```

### Research

아이디어, 가설, 실험 전.

### Candidate

실제 서비스 적용 중. MVP 검증 단계. 반복 관찰 단계.

### Constitution

여러 환경, 여러 프로젝트, 반복 검증 완료. 장기 유지 원칙.

---

## Candidate Template

모든 Candidate 문서는 아래 메타데이터를 포함한다.

```markdown
Status:
Owner:
Created:
Related SSOT:
Evidence:
Validation Progress:
Promotion Criteria:
Last Review:
Next Review:
```

---

## Validation Progress

체크리스트를 사용한다.

예시:

```
□ MVP Test
□ Hotel Pilot
□ Open Beta
□ User Interview
□ Operator Feedback
```

---

## Promotion Criteria

예시:

```
Candidate → Constitution

Requires:
- MVP Validation Complete
- Minimum 3 independent validations
- No critical contradiction
- Team approval
```

---

## Review Policy

모든 Candidate는 정기적으로 리뷰한다.

- 기본 간격: **30일**
- 또는 MVP 종료 시 자동 리뷰

---

## Constitution Rule

Constitution은 새로운 아이디어가 아니라 검증된 경험만 저장한다.

---

## SSOT Rule

SSOT는 정답을 저장하지 않는다.

반복 검증된 진실만 저장한다.

---

## Candidate 운영 원칙

Candidate는 삭제하지 않는다.

Rejected도 역사의 일부이다.

Rejected Candidate는 Archive(`docs/constitution/archive/`)로 이동한다.

---

## 관련 문서

- `docs/constitution/candidate/` — 현재 검증 중인 Candidate 문서
- `docs/constitution/archive/` — Rejected Candidate 보관
- `docs/CONSTITUTION.md` — DreamTown Constitution v1(CEO 승인, 2026-05-11)
- `docs/ssot/constitution/` — 기존 Layer 1 Constitution 문서군(HUMAN_FIRST 등)
