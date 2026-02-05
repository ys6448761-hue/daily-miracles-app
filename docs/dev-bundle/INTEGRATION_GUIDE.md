# 통합 가이드 (Integration Guide)

> 여수 MICE 운영 컨트롤타워 개발 통합 가이드
> 버전: 1.0 | 2026-02-05

---

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  public/yeosu-ops-center/*.html (Vanilla JS)                │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
                          v
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  routes/yeosuOpsRoutes.js                                   │
│  - /api/ops-center/*                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          v               v               v
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Services   │  │   Rules     │  │  Database   │
│  /services/ │  │  03_Rules/  │  │  PostgreSQL │
│  yeosu-ops- │  │  *.json     │  │             │
│  center/    │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## 2. Rules JSON 통합

### 2.1 로딩 패턴

```javascript
// services/yeosu-ops-center/rulesLoader.js
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class RulesLoader {
  constructor() {
    this.rulesDir = path.join(__dirname, '../../docs/dev-bundle/03_Rules');
    this.cache = new Map();
    this.cacheTTL = parseInt(process.env.RULES_CACHE_TTL) || 3600; // 1시간
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);

    // 스키마 로드
    this.schema = this._loadJSON('schema.json');
  }

  _loadJSON(filename) {
    const filePath = path.join(this.rulesDir, filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  _getCacheKey(name) {
    return `rules:${name}`;
  }

  _isCacheValid(entry) {
    return entry && (Date.now() - entry.loadedAt) < this.cacheTTL * 1000;
  }

  load(name) {
    const cacheKey = this._getCacheKey(name);
    const cached = this.cache.get(cacheKey);

    if (this._isCacheValid(cached)) {
      return cached.data;
    }

    const data = this._loadJSON(`${name}.json`);

    // 스키마 검증
    const schemaKey = name.replace('_rules', '_rules');
    if (this.schema[schemaKey]) {
      const validate = this.ajv.compile(this.schema[schemaKey]);
      if (!validate(data)) {
        throw new Error(`Invalid ${name}.json: ${JSON.stringify(validate.errors)}`);
      }
    }

    this.cache.set(cacheKey, {
      data,
      loadedAt: Date.now()
    });

    return data;
  }

  getMiceRules() {
    return this.load('mice_rules');
  }

  getEvidenceRules() {
    return this.load('evidence_rules');
  }

  getChecklistRules() {
    return this.load('checklist_rules');
  }

  getSnapshot() {
    const miceRules = this.getMiceRules();
    return {
      version: miceRules.meta.version,
      updated_at: miceRules.meta.updated_at,
      loaded_at: new Date().toISOString()
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new RulesLoader();
```

### 2.2 사용 예시

```javascript
// services/yeosu-ops-center/miceService.js
const rulesLoader = require('./rulesLoader');

class MiceService {
  validateParticipantCount(domesticCount, foreignCount) {
    const rules = rulesLoader.getMiceRules();
    const { min_participants } = rules.eligibility;

    if (min_participants.logic === 'OR') {
      return domesticCount >= min_participants.domestic ||
             foreignCount >= min_participants.foreign;
    } else {
      return domesticCount >= min_participants.domestic &&
             foreignCount >= min_participants.foreign;
    }
  }

  getSupportCategories() {
    const rules = rulesLoader.getMiceRules();
    return Object.values(rules.support_categories);
  }

  getEvidenceRequirements(categoryCode) {
    const miceRules = rulesLoader.getMiceRules();
    const evidenceRules = rulesLoader.getEvidenceRules();

    const category = miceRules.support_categories[categoryCode];
    if (!category) return null;

    return category.evidence_required.map(code => ({
      code,
      ...evidenceRules.evidence_types[code]
    }));
  }
}
```

---

## 3. 체크리스트 평가

### 3.1 평가 함수

```javascript
// services/yeosu-ops-center/checklistEvaluator.js
const rulesLoader = require('./rulesLoader');
const db = require('../../database/db');

class ChecklistEvaluator {
  async evaluate(eventId) {
    const rules = rulesLoader.getChecklistRules();
    const result = {
      event_id: eventId,
      evaluated_at: new Date().toISOString(),
      rules_snapshot: rulesLoader.getSnapshot(),

      required: {
        total: rules.checklist.required_items.length,
        fulfilled: 0,
        items: []
      },
      optional: {
        total: rules.checklist.optional_items.length,
        fulfilled: 0,
        items: []
      },

      missing: [],
      blockers: [],
      warnings: [],

      score: 0,
      can_generate: false
    };

    // 필수 항목 평가
    for (const item of rules.checklist.required_items) {
      const count = await this._getItemCount(eventId, item);
      const fulfilled = count >= item.min_count;

      result.required.items.push({
        ...item,
        count,
        fulfilled
      });

      if (fulfilled) {
        result.required.fulfilled++;
      } else {
        result.missing.push(item);
        if (item.blocking) {
          result.blockers.push({
            id: item.id,
            label: item.label,
            message: item.error_message,
            current: count,
            required: item.min_count
          });
        }
      }
    }

    // 선택 항목 평가
    for (const item of rules.checklist.optional_items) {
      const count = await this._getItemCount(eventId, item);
      const fulfilled = count >= (item.min_count || 1);

      result.optional.items.push({
        ...item,
        count,
        fulfilled
      });

      if (fulfilled) {
        result.optional.fulfilled++;
      } else {
        result.warnings.push({
          id: item.id,
          label: item.label,
          message: item.warning_message
        });
      }
    }

    // 점수 및 생성 가능 여부
    result.score = Math.round(
      (result.required.fulfilled / result.required.total) * 100
    );
    result.can_generate = result.blockers.length === 0;

    return result;
  }

  async _getItemCount(eventId, item) {
    const { data_source, filter } = item;

    let query = `SELECT COUNT(*) as count FROM ${data_source} WHERE event_id = $1`;
    const params = [eventId];

    if (filter) {
      Object.entries(filter).forEach(([key, value], index) => {
        query += ` AND ${key} = $${index + 2}`;
        params.push(value);
      });
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = new ChecklistEvaluator();
```

### 3.2 API 연동

```javascript
// routes/yeosuOpsRoutes.js
const checklistEvaluator = require('../services/yeosu-ops-center/checklistEvaluator');

router.get('/mice/checklist/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await checklistEvaluator.evaluate(eventId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 4. 리포트 패키지 생성

### 4.1 스냅샷 메타데이터 포함

```javascript
// services/yeosu-ops-center/miceReportService.js
const crypto = require('crypto');
const rulesLoader = require('./rulesLoader');

class MiceReportService {
  generatePackageMeta(eventId, checklistResult) {
    const miceRules = rulesLoader.getMiceRules();

    return {
      package_version: '1.0.0',
      generated_at: new Date().toISOString(),
      generator: 'yeosu-ops-center/miceReportService',

      event_id: eventId,

      rules_snapshot: {
        mice_rules: {
          version: miceRules.meta.version,
          updated_at: miceRules.meta.updated_at,
          checksum: this._computeChecksum(miceRules)
        },
        evidence_rules: {
          version: rulesLoader.getEvidenceRules().meta.version,
          updated_at: rulesLoader.getEvidenceRules().meta.updated_at
        },
        checklist_rules: {
          version: rulesLoader.getChecklistRules().meta.version,
          updated_at: rulesLoader.getChecklistRules().meta.updated_at
        }
      },

      checklist_snapshot: {
        score: checklistResult.score,
        required_fulfilled: `${checklistResult.required.fulfilled}/${checklistResult.required.total}`,
        optional_fulfilled: `${checklistResult.optional.fulfilled}/${checklistResult.optional.total}`,
        blockers: checklistResult.blockers.length,
        warnings: checklistResult.warnings.length
      }
    };
  }

  _computeChecksum(data) {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 8);
  }

  async generatePackage(eventId) {
    const checklistResult = await checklistEvaluator.evaluate(eventId);

    if (!checklistResult.can_generate) {
      throw new Error('체크리스트 미충족: ' +
        checklistResult.blockers.map(b => b.message).join(', '));
    }

    const meta = this.generatePackageMeta(eventId, checklistResult);

    // ... 패키지 생성 로직

    return {
      meta,
      // ... 패키지 데이터
    };
  }
}
```

---

## 5. 에러 처리

### 5.1 커스텀 에러 클래스

```javascript
// utils/errors.js
class RulesValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'RulesValidationError';
    this.errors = errors;
  }
}

class ChecklistBlockedError extends Error {
  constructor(blockers) {
    super('체크리스트 필수 항목 미충족');
    this.name = 'ChecklistBlockedError';
    this.blockers = blockers;
  }
}

class EvidenceGradeError extends Error {
  constructor(required, provided) {
    super(`증빙 등급 부족: ${required}급 필요, ${provided}급 제공`);
    this.name = 'EvidenceGradeError';
    this.required = required;
    this.provided = provided;
  }
}

module.exports = {
  RulesValidationError,
  ChecklistBlockedError,
  EvidenceGradeError
};
```

### 5.2 에러 미들웨어

```javascript
// middleware/errorHandler.js
function opsErrorHandler(err, req, res, next) {
  console.error(`[OPS Error] ${err.name}: ${err.message}`);

  if (err.name === 'RulesValidationError') {
    return res.status(400).json({
      success: false,
      error: 'rules_validation_error',
      message: err.message,
      details: err.errors
    });
  }

  if (err.name === 'ChecklistBlockedError') {
    return res.status(400).json({
      success: false,
      error: 'checklist_blocked',
      message: err.message,
      blockers: err.blockers
    });
  }

  if (err.name === 'EvidenceGradeError') {
    return res.status(400).json({
      success: false,
      error: 'evidence_grade_insufficient',
      message: err.message,
      required: err.required,
      provided: err.provided
    });
  }

  // 기본 에러
  res.status(500).json({
    success: false,
    error: 'internal_error',
    message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류'
  });
}

module.exports = opsErrorHandler;
```

---

## 6. 테스트 가이드

### 6.1 단위 테스트

```javascript
// tests/rules.test.js
const rulesLoader = require('../services/yeosu-ops-center/rulesLoader');

describe('RulesLoader', () => {
  beforeEach(() => {
    rulesLoader.clearCache();
  });

  test('should load mice_rules.json', () => {
    const rules = rulesLoader.getMiceRules();
    expect(rules.meta.type).toBe('mice_rules');
    expect(rules.meta.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('should validate against schema', () => {
    expect(() => rulesLoader.getMiceRules()).not.toThrow();
    expect(() => rulesLoader.getEvidenceRules()).not.toThrow();
    expect(() => rulesLoader.getChecklistRules()).not.toThrow();
  });

  test('should cache rules', () => {
    const rules1 = rulesLoader.getMiceRules();
    const rules2 = rulesLoader.getMiceRules();
    expect(rules1).toBe(rules2); // 동일 참조
  });

  test('should return snapshot', () => {
    const snapshot = rulesLoader.getSnapshot();
    expect(snapshot.version).toBeDefined();
    expect(snapshot.updated_at).toBeDefined();
    expect(snapshot.loaded_at).toBeDefined();
  });
});
```

### 6.2 통합 테스트

```javascript
// tests/checklist.test.js
const checklistEvaluator = require('../services/yeosu-ops-center/checklistEvaluator');

describe('ChecklistEvaluator', () => {
  const testEventId = '8a116a08-fa4b-4d5e-9445-acb926795436';

  test('should evaluate checklist', async () => {
    const result = await checklistEvaluator.evaluate(testEventId);

    expect(result.event_id).toBe(testEventId);
    expect(result.rules_snapshot).toBeDefined();
    expect(result.required.total).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test('should identify blockers', async () => {
    const result = await checklistEvaluator.evaluate(testEventId);

    if (result.blockers.length > 0) {
      expect(result.can_generate).toBe(false);
    } else {
      expect(result.can_generate).toBe(true);
    }
  });
});
```

---

## 7. 환경 설정

### 7.1 환경 변수

```env
# .env

# 필수
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DEMO_RESET_TOKEN=yeosu-ops-demo-2026

# 선택 (기본값 있음)
RULES_CACHE_TTL=3600           # 룰 캐시 시간 (초), 기본 1시간
REPORT_OUTPUT_DIR=./output     # 리포트 출력 경로
MAX_FILE_SIZE_MB=10            # 최대 파일 크기

# 개발용
NODE_ENV=development
DEBUG=ops:*
```

### 7.2 의존성

```json
{
  "dependencies": {
    "ajv": "^8.12.0",
    "ajv-formats": "^2.1.1",
    "archiver": "^6.0.1",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

---

## 8. 디버깅

### 8.1 로깅

```javascript
const debug = require('debug')('ops:rules');

// 사용
debug('Loading rules: %s', filename);
debug('Cache hit: %s', cacheKey);
debug('Validation errors: %O', validate.errors);
```

### 8.2 헬스체크 엔드포인트

```javascript
router.get('/health', async (req, res) => {
  try {
    // DB 연결 체크
    await db.query('SELECT 1');

    // 룰 로딩 체크
    const snapshot = rulesLoader.getSnapshot();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      rules: snapshot,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

## 9. 체크리스트

### 개발 시작 전

- [ ] Node.js 18+ 설치
- [ ] PostgreSQL 연결 확인
- [ ] 환경 변수 설정
- [ ] `npm install` 완료

### 룰 변경 시

- [ ] 스키마 검증 통과 (`npm run validate:rules`)
- [ ] 테스트 통과 (`npm test`)
- [ ] 버전 번호 업데이트
- [ ] CHANGELOG 작성
- [ ] 캐시 갱신 (서버 재시작)

### 배포 전

- [ ] 모든 테스트 통과
- [ ] 헬스체크 정상
- [ ] 룰 스냅샷 확인
- [ ] 리포트 생성 테스트

---

*최종 수정: 2026-02-05*
