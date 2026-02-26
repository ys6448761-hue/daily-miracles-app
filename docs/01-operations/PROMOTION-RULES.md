# 문서 승격 규칙 (Promotion Rules)

> RAW → 정본 승격의 판단 기준, 중복 방지, 역할 분담을 정의합니다.
>
> **확정일**: 2026-02-21
> **결정자**: 푸르미르 (CEO)

---

## 1. 승격 레벨 정의

```
L0  docs/_raw/            ← CEO가 자유롭게 투입
 ↓
L1  .claude/team-memory/  ← 세션 간 팀 지식 (context/decisions/learnings)
L2  docs/주제별 폴더/      ← 프로젝트 공식 정본
 ↓
L3  docs/MASTER-CONTROL.md ← 정본 허브 (링크만 관리)
```

| 레벨 | 위치 | 성격 | 승격 책임 |
|------|------|------|-----------|
| **L0** | `docs/_raw/` | 미가공 원본 | CEO 투입 |
| **L1** | `.claude/team-memory/` | 팀 운영 지식 | 코미 자율 |
| **L2** | `docs/decisions/`, `docs/api/` 등 | 프로젝트 정본 | 코미 자율 |
| **L3** | `docs/MASTER-CONTROL.md` | 허브 링크 | 코미 자율 |

---

## 2. 승격 기준 (Promotion Criteria)

### L0 → L1 (team-memory)

**대상**: 세션 간 반복 참조될 팀 지식

| 조건 | 필수 여부 |
|------|-----------|
| 결정사항/학습/맥락 중 하나에 해당 | 필수 |
| 특정 세션에서만 유효한 게 아님 | 필수 |
| 한줄 요약 작성 | 필수 |
| 주제 태그 (context/decisions/learnings) | 필수 |

**예시**:
- "결제 시스템에서 PG 수수료 3.5%로 확정" → `team-memory/decisions/`
- "FFmpeg Windows 경로 이슈 해결법" → `team-memory/learnings/technical.md`

### L0 → L2 (docs 정본)

**대상**: 프로젝트 공식 문서로 보존할 가치가 있는 것

| 조건 | 필수 여부 |
|------|-----------|
| 요약 3~7줄 | 필수 |
| 해당 주제 폴더 존재 (또는 신규 생성) | 필수 |
| 기존 정본과 내용 충돌 없음 | 필수 |
| 파일명 규칙 준수 | 필수 |

**주제별 폴더 매핑**:

| RAW 내용이... | 승격 대상 폴더 |
|---------------|---------------|
| API 설계/스펙 | `docs/api/` |
| 의사결정 + 근거 | `docs/decisions/` |
| 실행 계획/패키지 | `docs/actions/` 또는 `docs/execution/` |
| 탐색/리서치 | `docs/explores/` |
| 마케팅/영상 | `docs/marketing/` |
| 운영 런북 | `docs/runbook/` |
| 시스템 설계 | `docs/system/` |
| 배포/인프라 | `docs/deployment/` |
| 기타 | `docs/processed/` (임시, 나중에 분류) |

### L2 → L3 (MASTER-CONTROL 등록)

**대상**: 모든 L2 정본

| 조건 | 필수 여부 |
|------|-----------|
| MASTER-CONTROL.md의 적절한 섹션에 링크 추가 | 필수 |
| 중복 링크 없음 확인 | 필수 |

---

## 3. 중복 방지 규칙

### 규칙 D1: 1원본 1정본

하나의 RAW 파일은 **최대 1개** 정본으로만 승격됩니다.
- 여러 주제가 섞인 RAW → 분리 후 각각 승격
- 분리 시 원본 RAW에 분리 마커 추가

```markdown
<!-- SPLIT: 2개로 분리됨 -->
<!-- PROMOTED: L2 → docs/decisions/DEC-2026-0221-001.md -->
<!-- PROMOTED: L1 → .claude/team-memory/learnings/technical.md (append) -->
```

### 규칙 D2: 경로 기준 유니크

같은 대상 경로에 이미 정본이 있으면 **업데이트**(append/edit)하지 **신규 생성하지 않습니다**.
- `team-memory/learnings/technical.md` → 기존 파일에 항목 추가
- `docs/decisions/` → 날짜가 다르면 신규 OK

### 규칙 D3: MASTER-CONTROL 링크 유니크

MASTER-CONTROL.md에서 같은 파일 경로가 2번 이상 등장하면 안 됩니다.

### 규칙 D4: promoted 마커로 재처리 방지

승격 완료된 RAW 파일 상단에 `<!-- PROMOTED: ... -->` 마커를 추가합니다.
이 마커가 있는 파일은 코미가 **스킵**합니다.

---

## 4. 역할 분담

### CEO (푸르미르)

```
할 일: docs/_raw/에 파일 넣기
안 할 일: 분류, 승격, MASTER-CONTROL 업데이트
```

- `docs/_raw/YYYY-MM-DD_제목.md` 형식으로 파일 생성
- 내용 형식 자유 (메모, 회의록, 복붙 등)
- 브랜치: `docs/raw-YYYY-MM-DD` → push → PR → merge

### 코미 (오케스트레이터)

```
할 일: 분류, 승격, MASTER-CONTROL 업데이트
안 할 일: RAW 내용 작성
```

세션 시작 루틴:
1. `docs/_raw/` 스캔 — promoted 마커 없는 파일 확인
2. 각 파일의 승격 레벨 판단 (L1/L2/L3)
3. 승격 실행:
   - L1: team-memory에 추가/업데이트
   - L2: 해당 폴더에 정본 생성
   - L3: MASTER-CONTROL.md에 링크 추가
4. RAW 원본에 promoted 마커 추가
5. MASTER-CONTROL.md의 "RAW 대기열" 섹션 업데이트

### Claude Code (기술)

```
할 일: 코드 관련 문서의 정합성 검증
안 할 일: 비기술 문서의 승격 판단
```

---

## 5. 자동화 로드맵

| 단계 | 시기 | 내용 |
|------|------|------|
| **v0 (현재)** | 지금 | 수동. 코미가 매 세션 스캔 |
| v1 | 필요 시 | GitHub Action: `docs/_raw/` 변경 감지 → PR 코멘트로 알림 |
| v2 | 나중에 | 자동 분류 제안 (AI 기반 주제 태깅) |
| v3 | 훨씬 나중에 | 자동 승격 PR 생성 (코미 승인만 클릭) |

**현재 판단: v0으로 충분.**
- 문서 투입 빈도가 일 1~3건 수준
- 코미가 매 세션 시작 시 스캔하면 지연 최대 1세션
- 자동화 비용 > 수동 비용인 단계

---

## 6. 특수 케이스

### AURORA_STATUS.md 업데이트

AURORA_STATUS는 L2이지만 특수 취급:
- 프로젝트 현황 변경 시 코미가 **직접 편집** (별도 RAW 불필요)
- 변경 후 MASTER-CONTROL의 "마지막 업데이트" 날짜만 갱신

### 대화 기록 승격

`docs/processed/`에 이미 34개 가공 문서 존재:
- 이 파일들은 기존 processed 파이프라인으로 생성된 것
- 신규 RAW는 `docs/_raw/`를 사용 (processed는 레거시)
- 점진적으로 processed 중 활성 문서만 MASTER-CONTROL에 링크

---

*확정일: 2026-02-21*
