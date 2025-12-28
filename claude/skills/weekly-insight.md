---
name: 주간 인사이트
description: 주간 대화에서 인사이트 자동 추출
category: knowledge
status: active
created: 2025-12-29
schedule: 매주 월요일
agents:
  - docs-searcher
  - knowledge-analyzer
---

# 주간 인사이트 스킬

## 개요

이번 주 대화 기록을 분석하여 주요 인사이트를 자동 추출하고 정리하는 스킬입니다.

## 기능

### 1. 주간 대화 수집
- `docs/conversations/` 폴더에서 이번 주 문서 수집
- 날짜 기반 자동 필터링

### 2. 주요 결정사항 추출
- 확정된 의사결정 목록
- 결정 근거 포함

### 3. 배운 점 정리
- 새로 배운 개념/기술
- 실수와 교훈

### 4. 다음 주 TODO 제안
- 미완료 작업
- 후속 조치 필요 사항

## 실행 흐름

```
1. docs-searcher로 이번 주 대화 수집
      ↓
2. knowledge-analyzer로 패턴/인사이트 추출
      ↓
3. 주간 인사이트 문서 생성
      ↓
4. docs/insights/에 저장
```

## 출력 위치

```
docs/insights/YYYY-WW_주간인사이트.md
예: docs/insights/2025-52_주간인사이트.md
```

## 출력 형식

```markdown
---
title: 2025년 52주차 인사이트
date: 2025-12-29
week: 52
---

# 주간 인사이트

## 1. 이번 주 하이라이트
- [주요 성과/이벤트]

## 2. 주요 결정사항
| 결정 | 날짜 | 근거 |
|------|------|------|

## 3. 배운 점
- [새로 배운 것]
- [실수와 교훈]

## 4. 발견된 패턴
- [반복되는 문제/성공]

## 5. 다음 주 TODO
- [ ] [미완료 작업]
- [ ] [후속 조치]
```

## 관련 에이전트

| 에이전트 | 역할 |
|----------|------|
| docs-searcher | 주간 대화 검색 |
| knowledge-analyzer | 패턴/인사이트 분석 |

## 사용 예시

```
@weekly-insight 이번 주 인사이트 생성해줘
```

```
@weekly-insight week=51 지난주 인사이트 다시 생성해줘
```

---

## 에이전트 전환 메모

| 항목 | 값 |
|------|-----|
| 현재 사용 횟수 | 0회 |
| 전환 임계값 | 자동 실행 (주 1회) |
| 전환 검토 시점 | 월간 리뷰 시 |
| 관련 에이전트 | docs-searcher, knowledge-analyzer |
