## 🔁 코미 세션 시작 루틴 (필수 5단계)

1. docs/MASTER-CONTROL.md 열어 현재 Top3 / Blockers 확인
2. docs/_raw/ 폴더 전체 스캔 (신규 RAW 존재 여부 체크)
3. PROMOTION-RULES.md 기준으로 승격 대상 분류 (L0→L1/L2→L3)
4. L3 승격 시 MASTER-CONTROL 링크 업데이트
## 🔁 코미 세션 시작 루틴 (필수 5단계)

1. docs/MASTER-CONTROL.md 열어 현재 Top3 / Blockers 확인
2. docs/_raw/ 폴더 전체 스캔 (신규 RAW 존재 여부 체크)
3. PROMOTION-RULES.md 기준으로 승격 대상 분류 (L0→L1/L2→L3)
4. L3 승격 시 MASTER-CONTROL 링크 업데이트
5. 공식 결정 발생 시에만 team-memory entries에 기록

⚠️ MASTER-CONTROL에 없는 문서는 팀 공식 문서로 간주하지 않는다.


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
## 운영 원칙

- team-memory는 "결정"과 "정책 변경"만 기록한다.
- 일일 운영 상태는 docs/MASTER-CONTROL.md에서 관리한다.