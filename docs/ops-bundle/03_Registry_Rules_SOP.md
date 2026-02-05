# Registry Rules 월간 업데이트 SOP

> 03_Registry_Rules.json 관리 표준 운영 절차
> 버전: 1.0 | 2026-02-05

---

## 1. 개요

### 1.1 목적
MICE 인센티브 정책 변경사항을 시스템에 반영하고, 일관성 있는 룰 관리를 보장한다.

### 1.2 적용 범위
- `03_Registry_Rules.json` 파일
- 관련 서비스 코드 (miceReportService.js)
- 체크리스트 로직

### 1.3 담당자

| 역할 | 담당 | 연락처 |
|------|------|--------|
| 룰 관리자 | 기술팀 | tech@yeosu-travel.kr |
| 정책 확인 | 관광과 | - |
| 최종 승인 | 총괄 | - |

---

## 2. 월간 업데이트 일정

### 2.1 타임라인

| 일자 | 활동 | 담당 |
|------|------|------|
| 매월 1일 | 정책 변경사항 수집 | 기술팀 |
| 매월 3일 | 변경안 작성 | 기술팀 |
| 매월 5일 | 관광과 검토 요청 | 기술팀 |
| 매월 10일 | 검토 완료/피드백 | 관광과 |
| 매월 15일 | 최종 반영 및 배포 | 기술팀 |

### 2.2 긴급 업데이트

공고 변경 등 긴급 상황 시:
1. 관광과 → 기술팀 요청 (이메일/전화)
2. 24시간 내 반영
3. 배포 후 관계자 통보

---

## 3. 업데이트 절차

### 3.1 변경사항 수집

**수집 채널**
- 여수시 공고문 (새소식)
- 관광과 공문/이메일
- 내부 피드백
- 사용자 문의

**체크 항목**
- [ ] 지원 대상 변경
- [ ] 지원 금액/비율 변경
- [ ] 증빙 요건 변경
- [ ] 제출 기한 변경
- [ ] 양식 변경 (별지)

### 3.2 JSON 파일 수정

**파일 위치**
```
output/ops-bundle/03_Registry_Rules.json
```

**메타 정보 업데이트 (필수)**
```json
{
  "meta": {
    "version": "1.1.0",        // 버전 증가
    "updated_at": "2026-03-15", // 업데이트 날짜
    "next_review": "2026-04-15", // 다음 검토일
    "maintainer": "tech@yeosu-travel.kr"
  }
}
```

**버전 규칙**
- 메이저 (1.x.x): 구조 변경
- 마이너 (x.1.x): 항목 추가/삭제
- 패치 (x.x.1): 값 수정

### 3.3 변경 검증

**검증 스크립트 실행**
```bash
# JSON 문법 검사
node -e "console.log(JSON.parse(require('fs').readFileSync('output/ops-bundle/03_Registry_Rules.json')))"

# 필수 키 확인
node -e "
const rules = require('./output/ops-bundle/03_Registry_Rules.json');
const required = ['meta', 'mice_incentive', 'eligibility', 'support_categories', 'checklist'];
required.forEach(k => {
  if (!rules[k]) console.error('Missing:', k);
  else console.log('OK:', k);
});
"
```

### 3.4 코드 동기화

변경된 룰과 서비스 코드가 일치하는지 확인:

| 룰 섹션 | 관련 파일 | 확인 항목 |
|---------|----------|----------|
| checklist | miceReportService.js | CHECKLIST_ITEMS 배열 |
| photo_requirements | miceReportService.js | 사진 태그/최소 개수 |
| payment_methods | miceService.js | ENUM 정의 |
| evidence_types | miceService.js | 에셋 종류 |

### 3.5 테스트

```bash
# 체크리스트 API 테스트
curl -s "https://app.dailymiracles.kr/api/ops-center/mice/report/checklist?event_id=8a116a08-fa4b-4d5e-9445-acb926795436"

# 기대 결과: 룰 파일과 일치하는 필수/선택 항목
```

### 3.6 배포

```bash
# 커밋
git add output/ops-bundle/03_Registry_Rules.json
git commit -m "chore(rules): 월간 룰 업데이트 v1.1.0

- [변경 내용 요약]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# 푸시
git push
```

### 3.7 통보

**이메일 템플릿**
```
제목: [MICE 시스템] Registry Rules 업데이트 완료 (v1.1.0)

안녕하세요,

MICE 인센티브 시스템 룰 파일이 업데이트되었습니다.

▶ 버전: v1.1.0
▶ 업데이트 일자: 2026-03-15
▶ 다음 검토: 2026-04-15

▶ 변경 내용
- [항목 1]
- [항목 2]

문의사항은 연락 부탁드립니다.

감사합니다.
```

---

## 4. 롤백 절차

### 4.1 롤백 조건
- 배포 후 오류 발생
- 정책 오류 발견
- 관광과 철회 요청

### 4.2 롤백 명령

```bash
# 이전 버전 확인
git log --oneline output/ops-bundle/03_Registry_Rules.json

# 특정 커밋으로 복원
git checkout <commit-hash> -- output/ops-bundle/03_Registry_Rules.json

# 커밋 및 배포
git commit -m "revert(rules): v1.0.0으로 롤백"
git push
```

---

## 5. 연간 검토

### 5.1 검토 시점
- 매년 1월 (신년도 예산 반영)
- 공고 개정 시

### 5.2 검토 항목

- [ ] 지원 프로그램 유효성
- [ ] 금액/비율 현행화
- [ ] 증빙 요건 적정성
- [ ] 양식 버전 확인
- [ ] 연락처/담당자 갱신

---

## 6. 변경 이력 관리

### 6.1 변경 로그 형식

`CHANGELOG_RULES.md` 파일 유지:

```markdown
# Registry Rules 변경 이력

## [1.1.0] - 2026-03-15
### Changed
- 지역업체 정의 기준 명확화
### Added
- 신규 지출 카테고리 'TRANSPORT' 추가

## [1.0.0] - 2026-02-05
### Added
- 초기 버전 생성
```

### 6.2 Git 태그

메이저/마이너 업데이트 시:
```bash
git tag -a rules-v1.1.0 -m "Registry Rules v1.1.0"
git push origin rules-v1.1.0
```

---

## 7. 비상 연락

| 상황 | 연락처 | 대응 시간 |
|------|--------|----------|
| 시스템 오류 | tech@yeosu-travel.kr | 1시간 |
| 정책 문의 | 관광과 담당자 | 업무시간 |
| 긴급 롤백 | 기술팀 직통 | 즉시 |

---

*문서 버전: 1.0*
*최종 수정: 2026-02-05*
