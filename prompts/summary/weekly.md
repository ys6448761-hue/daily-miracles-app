# Weekly Summary Prompt Template

## 메타데이터
```yaml
name: weekly-summary
version: 1.0.0
category: summary
variables:
  - date: 기준 날짜
  - conversations: 대화 원문
  - team: 팀명 (optional)
```

## 프롬프트

```
당신은 주간 업무 요약 전문가입니다.

다음 대화/문서를 분석하여 주간 요약 리포트를 작성해주세요.

---
📅 기간: {{date}} 기준 최근 7일
👥 팀: {{team}}
---

## 요약 형식

### 📊 이번 주 하이라이트
가장 중요한 성과, 이슈, 변화 3가지를 bullet point로 정리합니다.

### 📁 프로젝트별 진행 상황
각 프로젝트/업무 영역별 상태를 표로 정리합니다.

| 프로젝트 | 상태 | 진행률 | 비고 |
|---------|-----|-------|------|
| ... | 🟢/🟡/🔴 | 80% | ... |

### ✅ 결정 사항
이번 주에 확정된 결정들을 나열합니다.

### 📝 Action Items
해야 할 일 목록을 담당자, 기한과 함께 정리합니다.

| 업무 | 담당자 | 기한 | 우선순위 |
|-----|-------|------|---------|
| ... | ... | ... | 🔴/🟡/🟢 |

### 📅 다음 주 계획
예정된 일정, 목표, 마일스톤을 정리합니다.

### ⚠️ 주의 사항
리스크, 블로커, 지연 요인을 명시합니다.

---
원문:
{{conversations}}
```

## 변수 설명

| 변수 | 타입 | 필수 | 설명 |
|-----|------|-----|------|
| `{{date}}` | string | ✅ | YYYY-MM-DD 형식 |
| `{{conversations}}` | string | ✅ | 분석할 대화 원문 |
| `{{team}}` | string | ❌ | 팀명 (기본값: "전체") |

## 사용 예시

### JavaScript에서 사용
```javascript
const template = await loadPrompt('summary/weekly');
const prompt = template
  .replace('{{date}}', '2024-12-28')
  .replace('{{team}}', '개발팀')
  .replace('{{conversations}}', slackMessages);
```

### CLI에서 사용
```bash
claude prompt render summary/weekly \
  --date="2024-12-28" \
  --team="개발팀" \
  --conversations="$(cat weekly-log.txt)"
```

## 출력 품질 가이드

### 좋은 예시 ✅
```markdown
### 📊 이번 주 하이라이트
- MVP 1차 배포 완료 (12/27) - 사용자 피드백 수집 시작
- 결제 시스템 PG사 계약 체결 - 1월 중 연동 예정
- 디자인 시스템 v2 확정 - 컴포넌트 라이브러리 업데이트 진행 중
```

### 나쁜 예시 ❌
```markdown
### 이번 주 하이라이트
- 여러 가지 일을 했습니다
- 미팅이 많았습니다
- 열심히 일했습니다
```

## 커스터마이징

### 간략 버전
```yaml
sections:
  - highlights (3개)
  - action_items (상위 5개)
max_length: 500
```

### 상세 버전
```yaml
sections:
  - highlights
  - project_status
  - decisions
  - action_items
  - next_week
  - risks
  - metrics
max_length: 2000
```
