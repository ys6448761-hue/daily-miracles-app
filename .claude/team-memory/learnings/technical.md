# Learnings - Technical

> 기술 관련 학습 기록

---

## GitHub-기반-기억-시스템

**일자**: 2025-01-30
**태그**: Infra

### 배움

Drive 연동보다 GitHub 직접 저장이 더 단순하고 효과적

### 이유

- 추가 API 설정 불필요
- 버전 관리 자동
- 코드와 함께 관리 가능
- 세션 간 연속성 유지 용이

### 적용

`.claude/team-memory/` 폴더 구조로 팀 기억 시스템 운영

---

## Puppeteer-로컬-크롬

**일자**: 2025-01-30
**태그**: Tools

### 배움

puppeteer-core + 로컬 Chrome 경로 지정으로 PDF 생성 가능

### 세부사항

- puppeteer 대신 puppeteer-core 사용
- `findChromePath()` 함수로 로컬 Chrome 탐지
- Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`

---

## Windows-Python-인코딩

**일자**: 2025-01-30
**태그**: Tools

### 배움

Windows에서 Python 스크립트 실행 시 UTF-8 인코딩 명시 필요

### 해결 방법

```python
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
```

### 적용 파일

- tools/lint_team_memory.py
- tools/rebuild_team_memory_indexes_simple.py

---

<!-- New technical learnings go above this line -->
