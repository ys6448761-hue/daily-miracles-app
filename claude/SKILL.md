# Daily Miracles - Claude 스킬 가이드

> 하루하루의 기적 프로젝트 Claude 에이전트/스킬 종합 가이드

---

## 폴더 구조

```
claude/
├── SKILL.md              # 이 파일 (전체 가이드)
├── settings.local.json   # 로컬 설정
│
├── agents/               # 에이전트 정의
│   ├── summarizer.md
│   ├── decision-extractor.md
│   ├── action-extractor.md
│   └── skill-creator.md
│
├── skills/               # 스킬 정의
│   └── miracle-analysis.md
│
├── pipelines/            # 파이프라인 정의
│   └── weekly-summary.md
│
├── assets/               # 공통 리소스
│   └── README.md
│
└── references/           # 참고 문서
    └── README.md
```

---

## 에이전트 목록

| 에이전트 | 모델 | 용도 | 호출 예시 |
|---------|------|------|----------|
| **Summarizer** | sonnet | 대화/문서 요약 | `@summarizer 오늘 대화 요약` |
| **Decision Extractor** | haiku | 결정 사항 추출 | `@decision-extractor 회의록 분석` |
| **Action Extractor** | haiku | Action Item 추출 | `@action-extractor 해야할 일 정리` |
| **Skill Creator** | opus | 에이전트/스킬 생성 | `@skill-creator 새 에이전트 만들기` |

---

## 스킬 목록

| 스킬 | 설명 | 트리거 |
|------|------|--------|
| **miracle-analysis** | 12질문 기적지수 분석 | `/miracle-analyze` |

---

## 파이프라인 목록

| 파이프라인 | 설명 | 실행 주기 |
|-----------|------|----------|
| **weekly-summary** | 주간 리포트 생성 | 매주 일요일 |

---

## 모델 선택 가이드

| 모델 | 비용 | 속도 | 용도 |
|------|------|------|------|
| **haiku** | 저렴 | 빠름 | 단순 추출, 분류 |
| **sonnet** | 중간 | 중간 | 분석, 요약 |
| **opus** | 비쌈 | 느림 | 창작, 복잡한 추론 |

---

## 에이전트 작성 템플릿

```markdown
---
name: [에이전트명]
description: [한 줄 설명]
model: haiku | sonnet | opus
tools:
  - file_read
  - file_write
---

## 역할
[에이전트가 하는 일]

## 입력
- param1: 설명
- param2: 설명

## 출력 형식
[예시 출력]

## 사용 예시
```
@에이전트명 명령어
```
```

---

## MCP 서버 목록

| 서버 | 경로 | 도구 수 | 용도 |
|------|------|--------|------|
| **summarizer-mcp** | `mcp-servers/summarizer-mcp/` | 2 | 대화 요약 |
| **miracle-mcp** | `mcp-servers/miracle-mcp/` | 3 | 기적지수 분석 |
| **storybook-mcp** | `mcp-servers/storybook-mcp/` | 12 | 스토리북 생성 |

---

## 빠른 시작

### 1. 에이전트 호출
```
@summarizer 이 대화 요약해줘
```

### 2. 스킬 실행
```
/miracle-analyze
```

### 3. 파이프라인 실행
```
node scripts/run-pipeline.ts weekly-summary
```

---

## 기여 가이드

1. 새 에이전트/스킬 추가 시 `@skill-creator` 사용
2. YAML frontmatter 필수 (name, description, model)
3. 사용 예시 반드시 포함
4. 이 문서 업데이트

---

**마지막 업데이트**: 2025-12-28
