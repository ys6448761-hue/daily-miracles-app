# Team Memory

> Aurora5 팀의 의사결정과 맥락을 기록하는 SSOT 저장소

## 디렉토리 구조

```
team-memory/
├── README.md                    # 이 문서
├── meta.schema.yaml             # 메타데이터 스키마 정의
├── decisions-log.md             # 레거시 (마이그레이션 예정)
└── entries/
    └── 2026/
        └── 2026-02-06_ail-gate-setup.md
```

## 파일명 규칙

```
{YYYY-MM-DD}_{slug}.md
```

예: `2026-02-06_ail-gate-setup.md`

## Front Matter 필수 필드

```yaml
---
source_id: "Issue #42"          # 필수: 출처 ID
title: "제목"                    # 필수: 항목 제목
owner: "@username"              # 필수: 담당자
date: "2026-02-06"              # 필수: 날짜
case_type: "CASE-D"             # 필수: CASE 유형
status: "done"                  # 선택: open/in_progress/done/archived
---
```

## CASE 유형

| 유형 | 설명 |
|------|------|
| CASE-A | 기능 추가/변경 |
| CASE-B | 버그 수정 |
| CASE-C | 리팩토링/성능 개선 |
| CASE-D | 문서/설정 변경 |
| CASE-E | 긴급 핫픽스 |

## SSOT 원칙

1. **GitHub이 SSOT** - 모든 결정/맥락의 원본
2. **Notion은 읽기 전용** - 자동 동기화된 요약 뷰
3. **개인정보 금지** - Drive 링크로만 참조
4. **AIL Gate** - AIL 없는 PR 머지 불가

## 새 항목 추가 방법

1. `entries/{YYYY}/` 폴더에 파일 생성
2. 파일명: `{YYYY-MM-DD}_{slug}.md`
3. Front Matter 필수 필드 작성
4. PR 제출 (AIL 섹션 필수)

## 관련 워크플로우

- `team-memory-lint.yml` - 스키마 검증
- `team-memory-digest.yml` - 다이제스트 생성
- `ail-gate.yml` - PR AIL 체크
