# 하루하루의 기적 - 지식 저장소

> AI와의 대화에서 얻은 지식을 체계적으로 저장하고 활용하는 공간입니다.

---

## 핵심 규칙

> **"raw는 각자 자유롭게, docs는 팀 정본만. 결정/액션은 docs에만 남긴다."**

---

## 폴더 구조

| 폴더 | 용도 | 예시 |
|------|------|------|
| `conversations/` | **정본** (팀 공유) | 승격된 대화 요약, 결정/액션 |
| `raw/conversations/` | **원문** (개인 기록) | 원본 대화, 메모 |
| `learnings/` | 학습 내용 | 새로 배운 개념, 방법론 |
| `cheatsheets/` | 치트시트 | 빠른 참조용 요약 |
| `decisions/` | 의사결정 | 중요 결정과 근거 |
| `insights/` | 인사이트 | 주간/월간 인사이트 |
| `system/` | 시스템 문서 | 워크플로우, 에이전트 인덱스 |

---

## 파일 명명 규칙

### conversations/
```
YYYY-MM/YYYY-MM-DD_주제.md
예: 2025-12/2025-12-29_최수민방식적용.md
```

### learnings/
```
주제_완전정리.md
예: 최수민방식_완전정리.md
```

### cheatsheets/
```
주제_치트시트.md
예: 최수민방식_치트시트.md
```

### decisions/
```
YYYY-MM-DD_결정내용.md
예: 2025-12-29_스타일시스템결정.md
```

### insights/
```
YYYY-WW_주간인사이트.md
예: 2025-52_주간인사이트.md
```

---

## Raw → 정본 승격 프로세스

### 승격 경로
```
docs/_raw/ (CEO 투입)
     ↓  코미 판단
L1: .claude/team-memory/   ← 세션 간 팀 지식
L2: docs/주제별 폴더/       ← 프로젝트 정본
L3: docs/MASTER-CONTROL.md ← 허브에 링크 등록
```

### 역할
| 역할 | 담당자 | 할 일 |
|------|--------|-------|
| 투입 | 푸르미르 (CEO) | `docs/_raw/`에 파일 넣기만 |
| 승격 | 코미 (COO) | 분류 + 승격 + MASTER-CONTROL 업데이트 |

### 정본 완료 조건
- [ ] 요약 3~7줄 존재
- [ ] 결정 사항 섹션 존재 (해당 시)
- [ ] RAW 원본에 promoted 마커 추가

👉 상세 규칙: [PROMOTION-RULES.md](./PROMOTION-RULES.md)
👉 마스터 허브: [MASTER-CONTROL.md](./MASTER-CONTROL.md)
👉 대화 워크플로우: [conversation-workflow.md](./system/conversation-workflow.md)

---

## 활용 방법

### 1. 검색하기
```
@docs-searcher "컨텍스트 관리" 검색해줘
```

### 2. 분석하기
```
@knowledge-analyzer 이번 달 대화에서 패턴 분석해줘
```

### 3. 컨텍스트 빌드
```
@context-builder "소원그림 기능 개발" 관련 히스토리 정리해줘
```

---

## 관련 에이전트

| 에이전트 | 역할 |
|----------|------|
| `docs-searcher` | 문서 검색 |
| `knowledge-analyzer` | 지식 분석/패턴 도출 |
| `context-builder` | 작업 전 컨텍스트 수집 |

---

## 관련 스킬

| 스킬 | 역할 |
|------|------|
| `knowledge-retrieval` | 지식 검색 |
| `weekly-insight` | 주간 인사이트 생성 |

---

## 핵심 원칙

1. **저장만으론 부족, 활용이 핵심**
   - 검색 + 분석 + 컨텍스트 빌드

2. **구조화된 형식으로 저장**
   - YAML frontmatter 필수
   - 태그로 분류

3. **정기적 정리**
   - 주간: 인사이트 정리
   - 월간: 폴더 정리

---

## 관련 시스템 문서

| 문서 | 내용 |
|------|------|
| [대화 워크플로우](./system/conversation-workflow.md) | Raw → 정본 승격 프로세스 |
| [에이전트 인덱스](./system/agents-index.md) | 에이전트 목록/역할/입출력 |
| [Raw 템플릿](./raw/conversations/_template_raw.md) | 원문 기록 템플릿 |
| [정본 템플릿](./conversations/_template_canonical.md) | 정본 문서 템플릿 |

---

*마지막 업데이트: 2025-12-30*
