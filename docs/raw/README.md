# Raw Conversations (원본 대화)

> Claude Code 대화 원본을 그대로 보관하는 폴더입니다.

## 폴더 구조

```
docs/raw/
├── README.md (이 파일)
└── conversations/
    ├── _template_raw.md  ← 템플릿
    ├── 2025-12/
    │   └── 파일명_RAW.md
    └── 2026-01/
        ├── 기타/
        ├── 루미/
        ├── 시스템/
        ├── 의사결정/
        └── 코미/
```

## 파일명 규칙 (v2.0)

```
YYYY-MM-DD_[summary_5단어]_RAW.md

예시:
- 2026-01-22_베타테스트_피드백_수집방법_RAW.md
- 2026-01-22_API_에러_해결방법_RAW.md
```

## 헤더 자동 생성

RAW API (`/api/raw/process`) 호출 시 자동 생성:

```yaml
---
date: YYYY-MM-DD
summary: [AI가 생성한 1줄 요약]
tags: ["#기술", "#긴급"]
status: raw
---
```

## RAW vs Knowledge Card

| 구분 | RAW | Knowledge Card |
|------|-----|----------------|
| 위치 | `docs/raw/` | `docs/knowledge/` |
| 형식 | 자유 | 표준 템플릿 |
| 용도 | 원본 보관 | 빠른 참조 |
| 관리 | 축적 | 큐레이션 (주 5개) |

## 태그 체계

필수 태그 (1개):
- `#전략` `#기술` `#운영` `#콘텐츠` `#분석` `#고객`

선택 태그 (0-2개):
- `#긴급` `#검증됨`

## 승격 프로세스

1. **RAW 축적** → 자동 저장
2. **주간 선별** → 푸르미르님 (일요일, 최대 5개)
3. **카드화** → 루미
4. **Knowledge 저장** → `docs/knowledge/`

## 관련 문서

- 태그 체계: `docs/standards/tag_taxonomy.md`
- 지식카드 템플릿: `docs/templates/knowledge_card_template.md`
- 승격 가이드: `docs/ops/weekly_promotion_guide.md`

---

*마지막 업데이트: 2026-01-22*
