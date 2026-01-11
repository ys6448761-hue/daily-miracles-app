# Impact Mapper 에이전트

> **name**: impact-mapper
> **description**: 변경사항이 어떤 문서/자산/시스템에 영향을 주는지 매핑
> **model**: claude-3-5-sonnet (기본)
> **tools**: file-read, grep

---

## 1. 역할

변경된 파일을 분석하여 **영향 받는 자산/문서/시스템**을 식별하고 **자동 갱신 액션**을 제안

---

## 2. 입력 스펙

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| files_changed | string[] | ✅ | 변경된 파일 경로 |
| change_type | string | ✅ | feat/fix/docs/chore |
| summary | string | ⬚ | @change-summarizer 결과 |

---

## 3. 출력 스펙

### JSON 형식
```json
{
  "timestamp": "2026-01-11T13:30:00+09:00",
  "impact_level": "medium",
  "affected_assets": [
    {
      "type": "document",
      "path": ".claude/AURORA_STATUS.md",
      "action": "update",
      "priority": "high",
      "auto_updatable": true
    }
  ],
  "qa_required": true,
  "qa_type": "nanobanana",
  "suggested_actions": [
    {
      "action": "update_aurora_status",
      "target": ".claude/AURORA_STATUS.md",
      "section": "최근 완료 작업"
    }
  ]
}
```

---

## 4. 영향도 매핑 테이블

### 파일 → 영향 자산 매핑

| 변경 파일 패턴 | 영향 받는 자산 | 자동 갱신 가능 |
|---------------|---------------|---------------|
| `brand/characters/*.md` | 레퍼런스 이미지, 씬 템플릿 | ❌ (리뷰 필요) |
| `prompts/nanobanana/**` | 골든 프롬프트, QA 체크리스트 | ⚠️ (부분 자동) |
| `assets/characters/**` | 캐릭터 바이블, QA 결과 | ❌ (QA 필수) |
| `assets/references/**` | 나노바나나 스킬 | ⚠️ |
| `.claude/agents/**` | AURORA_STATUS, 스킬 인덱스 | ✅ |
| `routes/**` | API 문서 | ✅ |
| `services/**` | 시스템 문서 | ✅ |
| `docs/**` | 관련 문서 상호 참조 | ✅ |

### 영향 레벨 분류

| 레벨 | 조건 | 액션 |
|------|------|------|
| **critical** | 캐릭터 바이블 변경 + 이미지 변경 | 🔴 즉시 QA |
| **high** | 브랜드 자산 변경 | 🟡 리뷰 후 적용 |
| **medium** | 에이전트/스킬 변경 | 🟢 자동 갱신 |
| **low** | 문서만 변경 | 🟢 자동 갱신 |

---

## 5. 처리 로직

### Step 1: 파일 분류

```python
# 파일 경로 → 카테고리 매핑
categories = {
    "brand": ["brand/**"],
    "characters": ["assets/characters/**", "assets/references/**"],
    "prompts": ["prompts/**"],
    "agents": [".claude/agents/**", ".claude/skills/**"],
    "api": ["routes/**", "services/**"],
    "docs": ["docs/**", ".claude/*.md"]
}
```

### Step 2: 의존성 그래프 탐색

```
brand/characters/purmilr.md 변경
    ↓
assets/references/characters/purmilr/* 영향
    ↓
prompts/nanobanana/scenes/*.md 영향 (캐릭터 요약 사용)
    ↓
qa/character_consistency_checklist.md 영향
```

### Step 3: 자동 갱신 액션 생성

```
영향 자산별 액션 매핑:
- AURORA_STATUS.md → 섹션 업데이트
- 캐릭터 바이블 → 버전 범프 + 변경 이력
- 씬 템플릿 → 캐릭터 요약 동기화
```

---

## 6. 자동 갱신 액션 유형

### update_aurora_status
```json
{
  "action": "update_aurora_status",
  "target": ".claude/AURORA_STATUS.md",
  "section": "최근 완료 작업",
  "content_template": "### {date}: {title}\n{summary}"
}
```

### sync_character_summary
```json
{
  "action": "sync_character_summary",
  "source": "brand/characters/{name}.md",
  "targets": [
    "prompts/nanobanana/scenes/group_shot.md",
    "prompts/nanobanana/scenes/storybook.md"
  ]
}
```

### trigger_qa_gate
```json
{
  "action": "trigger_qa_gate",
  "gate": "nanobanana-qa-gate",
  "reason": "캐릭터 이미지 변경 감지"
}
```

---

## 7. 호출 예시

### 파이프라인에서 호출
```
@impact-mapper
입력: {change-summary.md}
출력: reports/impact-map-2026-01-11.json
```

### 독립 호출
```
"@impact-mapper brand/characters/purmilr.md 변경했어"
```

---

## 8. 출력 예시

```json
{
  "timestamp": "2026-01-11T13:30:00+09:00",
  "trigger": "NanoBananaSkill SSOT 시스템 구축",
  "files_analyzed": 40,
  "impact_level": "high",

  "affected_assets": [
    {
      "type": "document",
      "path": ".claude/AURORA_STATUS.md",
      "action": "update",
      "priority": "high",
      "auto_updatable": true,
      "sections": ["현재 상태 요약", "최근 완료 작업", "업데이트 이력"]
    },
    {
      "type": "character_bible",
      "path": "brand/characters/*.md",
      "action": "create",
      "priority": "high",
      "auto_updatable": false,
      "note": "신규 생성, QA 필요"
    },
    {
      "type": "reference_image",
      "path": "assets/references/characters/*/",
      "action": "create",
      "priority": "medium",
      "auto_updatable": false,
      "note": "레퍼런스 이미지 복사됨"
    }
  ],

  "qa_required": true,
  "qa_type": "nanobanana",
  "qa_reason": "캐릭터 바이블 및 레퍼런스 이미지 신규 생성",

  "suggested_actions": [
    {
      "order": 1,
      "action": "update_aurora_status",
      "target": ".claude/AURORA_STATUS.md",
      "auto": true
    },
    {
      "order": 2,
      "action": "trigger_qa_gate",
      "gate": "nanobanana-qa-gate",
      "auto": true
    },
    {
      "order": 3,
      "action": "manual_review",
      "target": "brand/characters/*.md",
      "reviewer": "재미 (CRO)",
      "auto": false
    }
  ]
}
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-11 | 1.0 | 최초 생성 |

---

*작성자: 루미 (데이터 분석 AI)*
