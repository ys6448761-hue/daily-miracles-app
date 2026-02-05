# 룰 파일 월간 업데이트 SOP

> 03_Rules JSON 파일 관리 표준 운영 절차
> 버전: 1.0 | 2026-02-05

---

## 1. 개요

### 1.1 대상 파일

| 파일 | 내용 | 변경 빈도 |
|------|------|----------|
| `mice_rules.json` | MICE 인센티브 규정 | 연 1~2회 |
| `evidence_rules.json` | 증빙 규정 | 분기 1회 |
| `checklist_rules.json` | 체크리스트 규정 | 월 1회 |

### 1.2 담당자

| 역할 | 담당 | 권한 |
|------|------|------|
| 규정 관리자 | 운영팀 | 변경 요청 |
| 기술 담당자 | 개발팀 | 파일 수정 |
| 승인자 | PM | 최종 승인 |

---

## 2. 월간 업데이트 프로세스

### 2.1 일정

```
매월 1일: 변경 요청 마감
매월 1~3일: 검토 및 수정
매월 5일: 배포 (next_review 갱신)
```

### 2.2 단계별 절차

#### Step 1: 변경 요청 수집

```markdown
# 룰 변경 요청서

## 요청자
- 이름:
- 부서:
- 날짜:

## 변경 대상
- [ ] mice_rules.json
- [ ] evidence_rules.json
- [ ] checklist_rules.json

## 변경 내용
- 현재 값:
- 변경 후 값:
- 변경 사유:

## 영향 범위
- 기존 데이터 영향:
- 시스템 변경 필요:
```

#### Step 2: 기술 검토

```bash
# 1. 현재 버전 확인
cat 03_Rules/mice_rules.json | jq '.meta.version'

# 2. 스키마 검증 (변경 전)
npm run validate:rules

# 3. 변경 적용

# 4. 스키마 검증 (변경 후)
npm run validate:rules

# 5. 테스트 실행
npm run test:rules
```

#### Step 3: 버전 업데이트

```json
{
  "meta": {
    "version": "1.1.0",        // 마이너 버전 증가
    "updated_at": "2026-03-05", // 오늘 날짜
    "next_review": "2026-04-05" // 다음 달 5일
  }
}
```

**버전 규칙:**
- `MAJOR.MINOR.PATCH`
- MAJOR: 호환성 깨지는 변경 (구조 변경)
- MINOR: 기능 추가/변경 (규칙 변경)
- PATCH: 버그 수정/오타 수정

#### Step 4: 배포

```bash
# 1. Git 커밋
git add docs/dev-bundle/03_Rules/
git commit -m "chore(rules): v1.1.0 - [변경 요약]"

# 2. 태그 생성
git tag rules-v1.1.0

# 3. 푸시
git push && git push --tags

# 4. 서버 재시작 (캐시 갱신)
pm2 restart all
```

---

## 3. 스키마 검증

### 3.1 검증 스크립트

```javascript
// scripts/validateRules.js
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const rulesDir = './docs/dev-bundle/03_Rules';
const schema = require(path.join(rulesDir, 'schema.json'));

const files = [
  { name: 'mice_rules.json', schemaKey: 'mice_rules' },
  { name: 'evidence_rules.json', schemaKey: 'evidence_rules' },
  { name: 'checklist_rules.json', schemaKey: 'checklist_rules' }
];

let hasError = false;

files.forEach(({ name, schemaKey }) => {
  const filePath = path.join(rulesDir, name);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const validate = ajv.compile(schema[schemaKey]);
  const valid = validate(data);

  if (valid) {
    console.log(`✅ ${name}: Valid`);
  } else {
    console.log(`❌ ${name}: Invalid`);
    console.log(validate.errors);
    hasError = true;
  }
});

process.exit(hasError ? 1 : 0);
```

### 3.2 package.json 스크립트

```json
{
  "scripts": {
    "validate:rules": "node scripts/validateRules.js",
    "test:rules": "jest tests/rules.test.js"
  }
}
```

---

## 4. 변경 이력 관리

### 4.1 CHANGELOG 형식

```markdown
# Rules Changelog

## [1.1.0] - 2026-03-05

### Changed (evidence_rules.json)
- TAX_INVOICE max_size_mb: 10 → 15

### Added (checklist_rules.json)
- 새 선택 항목: consent_form

### Fixed (mice_rules.json)
- 오타 수정: "여수시" → "여수시"
```

### 4.2 Git 커밋 메시지 규칙

```
chore(rules): v{VERSION} - {SUMMARY}

- {FILE}: {CHANGE_DESCRIPTION}
- {FILE}: {CHANGE_DESCRIPTION}

Refs: {ISSUE_NUMBER}
```

---

## 5. 롤백 절차

### 5.1 긴급 롤백

```bash
# 1. 이전 버전 태그 확인
git tag -l "rules-*"

# 2. 롤백
git checkout rules-v1.0.0 -- docs/dev-bundle/03_Rules/

# 3. 커밋
git commit -m "revert(rules): 롤백 to v1.0.0 - [사유]"

# 4. 서버 재시작
pm2 restart all
```

### 5.2 롤백 판단 기준

| 상황 | 조치 |
|------|------|
| 스키마 검증 실패 | 즉시 롤백 |
| 테스트 실패 | 즉시 롤백 |
| 운영 이슈 발생 | 영향도 평가 후 결정 |
| 사용자 피드백 | 다음 릴리즈에서 수정 |

---

## 6. 체크리스트

### 배포 전

- [ ] 변경 요청서 작성 완료
- [ ] 스키마 검증 통과
- [ ] 테스트 통과
- [ ] 버전 번호 업데이트
- [ ] updated_at 갱신
- [ ] next_review 설정
- [ ] CHANGELOG 작성
- [ ] PM 승인 완료

### 배포 후

- [ ] Git 푸시 완료
- [ ] 태그 생성 완료
- [ ] 서버 재시작 완료
- [ ] 운영 환경 검증
- [ ] 관련 팀 공지

---

## 7. 문의

| 유형 | 연락처 |
|------|--------|
| 규정 문의 | ops@yeosu-travel.kr |
| 기술 문의 | tech@yeosu-travel.kr |
| 긴급 상황 | Slack #ops-emergency |

---

*최종 수정: 2026-02-05*
