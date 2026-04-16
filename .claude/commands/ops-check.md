# /ops-check — 운영 상태 즉시 점검

새 대화 시작 시 또는 작업 전 실행. 3가지를 순서대로 확인한다.

## 실행 지시

다음 3단계를 순서대로 실행하고 결과를 표로 정리해서 보고하라.

### Step 1. 컨텍스트 로드
Read these files in order:
1. `CLAUDE.md` — 스택 + 절대 규칙 확인
2. `CONTEXT_RULES.md` — 금지 파일 + 마이그레이션 번호 확인

### Step 2. 현재 상태 점검
Run these commands:
```bash
# 최신 migration 번호
ls database/migrations/*.sql | sort | tail -3

# 미커밋 변경사항
git status --short

# 최근 커밋
git log --oneline -5
```

### Step 3. 보고 형식
아래 형식으로 출력:

```
── 운영 점검 결과 ───────────────────────────
스택:      React+Vite+Express / PostgreSQL
최신 마이그레이션: XXX_*.sql
미커밋 파일: N개
마지막 커밋: [hash] [message]

⚠️  주의사항: (있으면 기재, 없으면 "없음")
🚫 건드리면 안 되는 파일: (CONTEXT_RULES.md §2 참조)
────────────────────────────────────────────
```

보고 후 사용자의 다음 지시를 기다린다.
