# DEV Bundle (개발 전달용)

> 여수 MICE 운영 컨트롤타워 개발 문서 패키지
> 버전: 1.0 | 2026-02-05

---

## 포함 문서

| # | 경로 | 용도 | 대상 |
|---|------|------|------|
| 03 | [03_Rules/](./03_Rules/) | 룰 파일 3종 + 스키마 | 백엔드 개발자 |
| 03-SOP | [03_Rules/UPDATE_SOP.md](./03_Rules/UPDATE_SOP.md) | 월간 업데이트 절차 | 운영/개발팀 |
| 05 | [05_Deal_Registration.md](./05_Deal_Registration.md) | 딜 보호 정책 | 비즈니스 로직 담당 |
| INT | [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) | 통합 가이드 | 전체 개발자 |

---

## 룰 파일 3종

```
03_Rules/
├── mice_rules.json      # MICE 인센티브 규정 (지원 카테고리, 자격요건)
├── evidence_rules.json  # 증빙 규정 (증빙 유형, 결제수단)
├── checklist_rules.json # 체크리스트 규정 (필수/선택 항목)
├── schema.json          # JSON Schema (검증용)
└── UPDATE_SOP.md        # 월간 업데이트 절차
```

---

## 개발 체크리스트 (요약)

### 1. Rules JSON 로딩/검증

```javascript
// 권장 패턴
const Ajv = require('ajv');
const ajv = new Ajv();

const schema = require('./03_Rules/schema.json');
const miceRules = require('./03_Rules/mice_rules.json');

const validate = ajv.compile(schema.mice_rules);
if (!validate(miceRules)) {
  throw new Error('Invalid mice_rules.json: ' + JSON.stringify(validate.errors));
}
```

### 2. 체크리스트 계산

```javascript
// missing/blockers/warnings 산출
function evaluateChecklist(eventData, rules) {
  const result = {
    missing: [],      // 필수 미충족
    blockers: [],     // 진행 불가 사유
    warnings: [],     // 권장 미충족
    score: 0          // 충족 점수 (0-100)
  };

  // 필수 항목 체크
  for (const item of rules.checklist.required_items) {
    if (!eventData[item.id] || eventData[item.id].count === 0) {
      result.missing.push(item);
      result.blockers.push({
        id: item.id,
        reason: `${item.label} 미등록`
      });
    }
  }

  // 선택 항목 체크
  for (const item of rules.checklist.optional_items) {
    if (!eventData[item.id] || eventData[item.id].count === 0) {
      result.warnings.push(item);
    }
  }

  // 점수 계산
  const totalRequired = rules.checklist.required_items.length;
  const fulfilled = totalRequired - result.missing.length;
  result.score = Math.round((fulfilled / totalRequired) * 100);

  return result;
}
```

### 3. 스냅샷 메타데이터

```javascript
// 결과물 생성 시 룰 버전 포함
function generateReportPackage(eventId, data) {
  const miceRules = require('./03_Rules/mice_rules.json');

  return {
    meta: {
      generated_at: new Date().toISOString(),
      generator_version: '1.0.0',
      rules_snapshot: {
        version: miceRules.meta.version,
        updated_at: miceRules.meta.updated_at,
        checksum: computeChecksum(miceRules)  // MD5/SHA256
      }
    },
    event_id: eventId,
    data: data
  };
}
```

---

## 핵심 데이터 플로우

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Rules JSON  │────>│ Validation   │────>│ Checklist   │
│ (3종)       │     │ (Schema)     │     │ Evaluation  │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                v
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Report      │<────│ Snapshot     │<────│ Missing/    │
│ Package     │     │ + Metadata   │     │ Blockers    │
└─────────────┘     └──────────────┘     └─────────────┘
```

---

## API 엔드포인트 참조

| 엔드포인트 | 메서드 | 용도 |
|-----------|--------|------|
| `/api/ops-center/mice/checklist/:eventId` | GET | 체크리스트 상태 |
| `/api/ops-center/mice/report/generate/:eventId` | POST | 패키지 생성 |
| `/api/ops-center/mice/rules/version` | GET | 룰 버전 조회 |

---

## 환경 변수

```env
# 필수
DATABASE_URL=postgresql://...
DEMO_RESET_TOKEN=yeosu-ops-demo-2026

# 선택
RULES_CACHE_TTL=3600        # 룰 캐시 시간 (초)
REPORT_OUTPUT_DIR=./output  # 리포트 출력 경로
```

---

## 의존성

```json
{
  "dependencies": {
    "ajv": "^8.x",           // JSON Schema 검증
    "archiver": "^6.x",       // ZIP 생성
    "multer": "^1.x"          // 파일 업로드
  }
}
```

---

## 문의

| 역할 | 연락처 |
|------|--------|
| 기술 문의 | tech@yeosu-travel.kr |
| 룰 변경 요청 | ops@yeosu-travel.kr |

---

*최종 수정: 2026-02-05*
