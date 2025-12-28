---
name: 지식 검색
description: docs/ 폴더 기반 통합 검색 스킬
category: knowledge
status: active
created: 2025-12-29
agents:
  - docs-searcher
---

# 지식 검색 스킬

## 개요

docs/ 폴더와 claude/ 폴더에 축적된 지식을 검색하는 스킬입니다.

## 기능

### 1. 키워드 검색
- 제목, 태그, 본문에서 검색
- 한글/영어 모두 지원

### 2. 날짜 필터
- 특정 기간 문서만 검색
- 최근 N일 검색

### 3. 카테고리 필터
- conversations: 대화 기록
- learnings: 학습 내용
- cheatsheets: 치트시트
- decisions: 의사결정
- insights: 인사이트

### 4. 스마트 검색
- 관련 키워드 자동 확장
- 의미적 유사 문서 추천

## 검색 영역

| 영역 | 경로 | 내용 |
|------|------|------|
| 문서 | `docs/` | 대화, 학습, 치트시트 등 |
| 에이전트 | `claude/agents/` | 에이전트 지침 |
| 스킬 | `claude/skills/` | 스킬 정의 |
| 프롬프트 | `prompts/` | 프롬프트 템플릿 |
| 참조 | `claude/references/` | 참조 문서 |

## 사용 예시

```
지식 검색: "컨텍스트 관리"
```

```
지식 검색: scope=learnings "최수민 방식"
```

```
지식 검색: date=7 "이번 주 결정사항"
```

## 관련 에이전트

- **docs-searcher**: 실제 검색 수행
- **context-builder**: 검색 결과를 컨텍스트로 구성

## 출력 형식

```yaml
results:
  - title: 문서 제목
    path: 파일 경로
    excerpt: 관련 발췌문
    date: 작성일
    relevance: 관련도
total: 검색 결과 수
query: 검색어
```

---

## 에이전트 전환 메모

| 항목 | 값 |
|------|-----|
| 현재 사용 횟수 | 0회 |
| 전환 임계값 | 10회/일 |
| 전환 검토 시점 | 주간 리뷰 시 |
| 관련 에이전트 | docs-searcher |
