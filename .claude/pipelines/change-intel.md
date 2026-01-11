# Change→Insight 파이프라인 (change-intel)

> **name**: change-intel
> **description**: 커밋/PR 변경사항을 "요약 + 영향도 + QA + 문서갱신 액션"으로 자동 가공
> **trigger**: manual / PR 생성 시 / main merge 직후
> **goal**: 자료 축적 → 지식 갱신 자동화
> **version**: 2.0

---

## 1. 개요

### 목적
- Code가 변경사항을 올릴 때마다 **문서가 자동으로 '정보 형태'로 갱신**
- 캐릭터 일관성 관련 변경은 **무조건 QA 게이트**를 거침
- 운영 원칙: "95% 자동 + 4% 검토 + 1% 개입" 신호등

### 산출물 (5종)
1. `change-summary-YYYY-MM-DD.md` - 핵심 요약 (What/Why/Impact + 근거)
2. `impact-map-YYYY-MM-DD.json` - 영향도 매핑
3. `qa-gate-YYYY-MM-DD.md` - QA 게이트 결과 (PASSED/NEEDS_REVIEW/SKIPPED/FAILED)
4. `intel-report-YYYY-MM-DD.md` - 최종 통합 보고서
5. `doc-update-actions-YYYY-MM-DD.md` - 자동 액션 티켓 (**v2.0 추가**)

---

## 2. 트리거 (Trigger)

### Manual 실행
```
"@change-intel 실행해줘"
"변경사항 분석해줘"
"오늘 작업 정리해줘"
```

### 자동 실행 (권장)
- PR 생성 시
- main 브랜치 merge 직후
- 대규모 커밋 (10+ 파일) 시

---

## 3. 파이프라인 단계

```
┌─────────────────────────────────────────────────────────────┐
│              Change→Insight Pipeline v2.0                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Step 1] 변경사항 입력 수집                                │
│     ↓                                                       │
│  [Step 2] 핵심 요약 생성 (@change-summarizer)              │
│     ↓                                                       │
│  [Step 3] 영향도 매핑 (@impact-mapper)                     │
│     ↓                                                       │
│  [Step 4] 나노바나나 QA 게이트 (@nanobanana-qa-gate v2)    │
│     ↓                                                       │
│  [Step 5] 액션 티켓 생성 (@doc-update-actions) ← v2.0 추가 │
│     ↓                                                       │
│  [Step 6] 문서 자동 갱신                                   │
│     ↓                                                       │
│  [Step 7] 최종 보고서 생성                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 단계별 상세

### Step 1: 변경사항 입력 수집

**입력**:
- `git diff` 요약
- 커밋 메시지 목록
- 변경 파일 리스트
- 변경 유형 (feat/fix/docs/chore)

**출력**:
- `changeset.json` (임시)

**실행**:
```bash
# 변경 파일 목록
git diff --name-only HEAD~1

# 커밋 메시지
git log --oneline -5

# diff 통계
git diff --stat HEAD~1
```

---

### Step 2: 핵심 요약 생성

**호출**: `@change-summarizer`

**입력**: Step 1의 changeset.json

**출력**: `reports/change-summary-YYYY-MM-DD.md`

**내용**:
```markdown
# 변경 요약 (YYYY-MM-DD)

## What (무엇이 바뀌었나)
- ...

## Why (왜 바꿨나)
- ...

## Impact (어디에 영향을 주나)
- ...

## Files Changed
- ...
```

---

### Step 3: 영향도 매핑

**호출**: `@impact-mapper`

**입력**: Step 2의 change-summary

**출력**: `reports/impact-map-YYYY-MM-DD.json`

**매핑 대상**:
| 변경 영역 | 영향 받는 자산 |
|----------|---------------|
| brand/characters/ | 캐릭터 바이블, 레퍼런스 이미지 |
| prompts/nanobanana/ | 씬 템플릿, 가드, 골든 프롬프트 |
| assets/characters/ | 캐릭터 이미지, QA 체크리스트 |
| docs/ | AURORA_STATUS, 가이드 문서 |
| routes/ | API 문서, 테스트 |

---

### Step 4: 나노바나나 QA 게이트

**호출**: `@nanobanana-qa-gate`

**조건**: 캐릭터/이미지/브랜드 관련 변경이 있을 때만 실행

**입력**: impact-map.json

**출력**: QA 결과 (초록/노랑/빨강)

**판정 기준**:
```
🟢 초록불: 일관성 영향 없음 또는 자동 통과
🟡 노란불: 리뷰 필요 (캐릭터 바이블 변경 등)
🔴 빨간불: 즉시 개입 필요 (일관성 깨짐)
```

---

### Step 5: 문서 자동 갱신 지시

**영향도에 따른 자동 액션**:

| 영향 대상 | 자동 액션 |
|----------|----------|
| AURORA_STATUS.md | 최근 완료 작업 섹션 업데이트 |
| 캐릭터 바이블 | 변경 이력 추가 |
| 씬 템플릿 | 버전 범프 |
| API 변경 | API 문서 업데이트 지시 |

---

### Step 6: 최종 보고서 생성

**출력**: `reports/intel-report-YYYY-MM-DD.md`

**내용**:
```markdown
# Change Intelligence Report

**날짜**: YYYY-MM-DD
**커밋 수**: N
**변경 파일**: M

## 요약
[Step 2 결과]

## 영향도
[Step 3 결과]

## QA 게이트
[Step 4 결과]

## 자동 갱신된 문서
- [x] AURORA_STATUS.md
- [ ] 캐릭터 바이블 (수동 확인 필요)

## 다음 액션
1. ...
2. ...
```

---

## 5. 호출 예시

### CLI 호출
```
"@change-intel 실행해줘"
```

### 결과 예시
```
📊 Change→Insight 분석 완료!

📝 요약: NanoBananaSkill SSOT 시스템 구축 (40 files)
📁 영향: 캐릭터 바이블 6종, 씬 템플릿 4종
🟢 QA: 초록불 (신규 생성, 기존 일관성 영향 없음)
📄 갱신: AURORA_STATUS.md 업데이트 완료

📋 보고서: reports/intel-report-2026-01-11.md
```

---

## 6. 관련 에이전트

| 에이전트 | 역할 | 파일 |
|----------|------|------|
| @change-summarizer | 변경 요약 생성 | `.claude/agents/change-summarizer.md` |
| @impact-mapper | 영향도 매핑 | `.claude/agents/impact-mapper.md` |
| @nanobanana-qa-gate | 캐릭터 QA 게이트 | `.claude/agents/nanobanana-qa-gate.md` |

---

## 7. 저장 규칙

### 보고서 저장 위치
```
reports/
├── change-summary-YYYY-MM-DD.md    ← 변경 요약
├── impact-map-YYYY-MM-DD.json      ← 영향도 맵
└── intel-report-YYYY-MM-DD.md      ← 최종 보고서
```

### 파일명 규칙
- 날짜 기반: `YYYY-MM-DD`
- 같은 날 여러 번 실행 시: `YYYY-MM-DD-HHmm`

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-11 | 1.0 | 최초 생성 |

---

*작성자: 코미 (운영 총괄 AI)*
*승인: 푸르미르 CEO*
