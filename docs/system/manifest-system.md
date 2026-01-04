# Manifest 자동 생성 시스템

> 루미 규칙 v1.0 기반 문서 인덱싱 시스템

## 개요

docs/ 폴더의 모든 문서를 스캔하여 `manifest.json` 인덱스를 자동 생성합니다.

## 파일 구조

```
docs/
├── index/
│   ├── manifest.json    ← 문서 인덱스
│   └── tags.json        ← 태그별 문서 매핑
├── decisions/
├── specs/
└── ...
```

## 사용법

### 수동 생성

```bash
node scripts/generate-manifest.js
```

### 자동 생성 (Git Hook)

```bash
# hook 설치 (최초 1회)
node scripts/install-hooks.js

# 이후 docs/ 변경 커밋 시 자동 갱신
git add docs/some-file.md
git commit -m "docs 업데이트"
# → manifest.json 자동 갱신 및 커밋 포함
```

## manifest.json 스키마

```json
{
  "schema_version": "1.0",
  "generated_at": "2026-01-04T...",
  "total_count": 63,
  "documents": [
    {
      "id": "DEC-2026-0103-001",
      "path": "docs/decisions/...",
      "type": "decision",
      "project": "aurora5",
      "priority": "P0",
      "topic": "storybook",
      "tags": ["kpi", "automation"],
      "owner": "rumi",
      "status": "active",
      "title": "제목",
      "created_at": "2026-01-03",
      "checksum": "abc123"
    }
  ]
}
```

## 담당자

- **설계**: 루미 (Data Analyst)
- **구현**: Code (Claude Code)
- **승인**: 푸르미르 CEO

---

*작성일: 2026-01-04*
