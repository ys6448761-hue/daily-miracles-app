// services/yeosu-ops-center/rulesLoader.js
// Rules JSON 로딩 + Ajv 스키마 검증 + 캐시 + 메타 스냅샷

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

let cached = null;
let cacheLoadedAt = null;
const CACHE_TTL_MS = parseInt(process.env.RULES_CACHE_TTL || '3600') * 1000; // 기본 1시간

/**
 * SHA-256 해시 생성
 */
function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * JSON 파일 읽기
 */
function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return { raw, json: JSON.parse(raw) };
}

/**
 * 메타데이터 생성
 */
function buildMeta(bundle) {
  const now = new Date().toISOString();
  const material = JSON.stringify(bundle, null, 2);
  return {
    loaded_at: now,
    hash: sha256(material).substring(0, 16), // 앞 16자만 사용
    hash_full: sha256(material)
  };
}

/**
 * 캐시 유효성 검사
 */
function isCacheValid() {
  if (!cached || !cacheLoadedAt) return false;
  return (Date.now() - cacheLoadedAt) < CACHE_TTL_MS;
}

/**
 * 룰 파일 로드 (메인 함수)
 *
 * @param {Object} options
 * @param {string} options.baseDir - rules 디렉토리 경로
 * @param {boolean} options.useCache - 캐시 사용 여부 (기본 true)
 * @returns {{ rules: Object, meta: Object }}
 */
function loadRules(options = {}) {
  const baseDir = options.baseDir ||
    path.resolve(__dirname, '../../docs/dev-bundle/03_Rules');

  const useCache = options.useCache !== false;

  // 캐시 유효하면 반환
  if (useCache && isCacheValid()) {
    return cached;
  }

  const schemaPath = path.join(baseDir, 'schema.json');
  const files = {
    mice: path.join(baseDir, 'mice_rules.json'),
    evidence: path.join(baseDir, 'evidence_rules.json'),
    checklist: path.join(baseDir, 'checklist_rules.json')
  };

  // 스키마 로드
  const { json: schema } = readJson(schemaPath);

  // Ajv 인스턴스 생성
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const loaded = {};
  const versions = {};

  for (const [key, fp] of Object.entries(files)) {
    const { json } = readJson(fp);
    loaded[key] = json;

    // 각 룰 파일의 스키마 키 결정
    const schemaKey = `${key}_rules`;

    // 스키마 검증 (해당 스키마가 있는 경우만)
    if (schema[schemaKey]) {
      const validate = ajv.compile(schema[schemaKey]);
      const ok = validate(json);

      if (!ok) {
        const err = new Error(
          `Rule validation failed: ${path.basename(fp)}\n` +
          ajv.errorsText(validate.errors, { separator: '\n' })
        );
        err.validationErrors = validate.errors;
        err.file = path.basename(fp);
        throw err;
      }
    }

    // 버전 정보 수집
    if (json.meta) {
      versions[key] = {
        version: json.meta.version,
        updated_at: json.meta.updated_at
      };
    }
  }

  const result = {
    rules: loaded,
    meta: {
      ...buildMeta(loaded),
      versions,
      cache_ttl_ms: CACHE_TTL_MS
    }
  };

  // 캐시 저장
  cached = result;
  cacheLoadedAt = Date.now();

  return result;
}

/**
 * 캐시 클리어
 */
function clearRulesCache() {
  cached = null;
  cacheLoadedAt = null;
}

/**
 * MICE 룰만 가져오기
 */
function getMiceRules() {
  const { rules } = loadRules();
  return rules.mice;
}

/**
 * 증빙 룰만 가져오기
 */
function getEvidenceRules() {
  const { rules } = loadRules();
  return rules.evidence;
}

/**
 * 체크리스트 룰만 가져오기
 */
function getChecklistRules() {
  const { rules } = loadRules();
  return rules.checklist;
}

/**
 * 스냅샷 메타만 가져오기 (리포트 저장용)
 */
function getRulesSnapshot() {
  const { meta } = loadRules();
  return {
    hash: meta.hash,
    loaded_at: meta.loaded_at,
    versions: meta.versions
  };
}

/**
 * 룰 버전 정보 조회 (API용)
 */
function getRulesVersion() {
  const { rules, meta } = loadRules();
  return {
    mice: rules.mice?.meta || {},
    evidence: rules.evidence?.meta || {},
    checklist: rules.checklist?.meta || {},
    snapshot: {
      hash: meta.hash,
      loaded_at: meta.loaded_at
    }
  };
}

module.exports = {
  loadRules,
  clearRulesCache,
  getMiceRules,
  getEvidenceRules,
  getChecklistRules,
  getRulesSnapshot,
  getRulesVersion
};
