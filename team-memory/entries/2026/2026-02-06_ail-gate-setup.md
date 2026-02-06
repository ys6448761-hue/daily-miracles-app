---
source_id: "PR #TBD"
title: "AIL/SSOT/Gate 운영 체계 도입"
owner: "@code"
date: "2026-02-06"
case_type: "CASE-D"
status: "in_progress"
summary: "PR 머지 전 AIL 섹션 필수화, SSOT를 GitHub으로 확정"
decision: |
  1. 자연어↔AIL 분리: 논의는 자연어, 실행은 AIL로
  2. SSOT는 GitHub: Notion은 읽기 전용
  3. AIL Gate: AIL 없는 PR은 머지 불가
  4. 개인정보/민감 데이터 GitHub 저장 금지
next_actions:
  - "Branch protection 설정 (AIL Gate 필수 체크)"
  - "팀 온보딩 진행"
  - "Notion 연동 워크플로우 (2차)"
links:
  drive: ""
  notion: ""
  github: ""
tags:
  - "process"
  - "automation"
  - "aurora5"
---

# AIL/SSOT/Gate 운영 체계 도입

## 배경

Aurora5 오픈에 맞춰 체계적인 운영 프로세스 필요.
자연어 논의와 실행 지시의 분리, SSOT 확립 필요.

## 결정 사항

### 핵심 원칙 (변경 금지)

1. **자연어↔AIL 분리**: 논의는 자연어 가능, 실행/변경은 AIL로 고정
2. **SSOT는 GitHub**: Notion은 편집 불가 요약 뷰 전용
3. **AIL Gate**: AIL 없는 PR은 머지 불가
4. **이벤트 기반 자동화**: LLM 호출 최소화
5. **개인정보 금지**: GitHub에 민감 데이터 저장 금지 (Drive 링크만)

### 산출물

- `.github/pull_request_template.md` - PR 템플릿 (AIL 섹션 포함)
- `.github/workflows/ail-gate.yml` - AIL Gate 워크플로우
- `.github/ISSUE_TEMPLATE/ail_request.yml` - AIL 요청 폼
- `team-memory/meta.schema.yaml` - team-memory 스키마

## 다음 단계

1. Branch protection 설정
2. 팀 온보딩
3. Notion 연동 (2차)
