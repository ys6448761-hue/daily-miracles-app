# 주요 결정사항 (Decisions)

> 팀의 주요 결정사항을 날짜순으로 기록합니다.

---

## 2025-01-30

### 기억 시스템 구조 결정

- **결정**: 기억 시스템을 GitHub 기반 단순 구조로 결정
- **결정자**: 푸르미르
- **이유**: Drive 연동보다 직접 저장이 더 단순하고 효과적
- **구조**:
  ```
  .claude/team-memory/
  ├── context.md    ← 현재 맥락
  ├── decisions.md  ← 주요 결정
  └── learnings.md  ← 배운 것들
  ```

### Google Drive 백업 시스템 구축

- **결정**: team-memory 파일을 Google Drive에 수동 백업하는 스크립트 구현
- **결정자**: 푸르미르
- **실행 명령**: `npm run backup-memory`
- **백업 위치**: `G:\내 드라이브\하루하루의기적\team-memory\`
- **파일명 규칙**:
  - 날짜별: `2025-01-30_context.md`
  - 최신본: `context_latest.md` (항상 덮어쓰기)
- **장점**: 스마트폰/PC에서 Google Drive 앱으로 언제든 열람 가능

---

<!-- 새로운 결정은 위에 추가 -->
