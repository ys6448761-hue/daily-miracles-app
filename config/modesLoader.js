// ═══════════════════════════════════════════════════════════
// 8-Mode SSOT Loader + Validator — P1-SSOT (ISSUE 1)
// Single source of truth for mode definitions.
// Any mode change MUST happen in modes.registry.json only.
// ═══════════════════════════════════════════════════════════

const path = require('path');
const fs = require('fs');

const REGISTRY_PATH = path.join(__dirname, 'modes.registry.json');

// ── Required fields per mode entry ──
const REQUIRED_FIELDS = [
  'mode_id',
  'label_kr',
  'tagline',
  'linked_miracle_index',
  'symptoms',
  'recommended_action_templates',
  'ad_hook_keywords',
  'marketing_archetypes',
];

// ── Valid linked_miracle_index values ──
const VALID_MIRACLE_INDICES = ['자기효능감', '감사', '회복탄력성', '관계', '목표'];

/**
 * Validate a single mode entry. Returns array of error strings.
 */
function validateEntry(entry, index) {
  const errors = [];
  const prefix = `modes[${index}]`;

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (entry[field] === undefined || entry[field] === null) {
      errors.push(`${prefix}: 필수 필드 '${field}' 누락`);
    }
  }

  if (!entry.mode_id) return errors; // can't validate further

  // mode_id format: lowercase slug
  if (typeof entry.mode_id !== 'string' || !/^[a-z_]+$/.test(entry.mode_id)) {
    errors.push(`${prefix}: mode_id는 소문자+언더스코어만 허용 (got: '${entry.mode_id}')`);
  }

  // Array fields: minimum length
  if (Array.isArray(entry.symptoms) && entry.symptoms.length < 1) {
    errors.push(`${prefix} (${entry.mode_id}): symptoms는 최소 1개 필요`);
  }
  if (Array.isArray(entry.recommended_action_templates) && entry.recommended_action_templates.length < 2) {
    errors.push(`${prefix} (${entry.mode_id}): recommended_action_templates는 최소 2개 필요`);
  }
  if (Array.isArray(entry.ad_hook_keywords) && entry.ad_hook_keywords.length < 1) {
    errors.push(`${prefix} (${entry.mode_id}): ad_hook_keywords는 최소 1개 필요`);
  }
  if (Array.isArray(entry.marketing_archetypes) && entry.marketing_archetypes.length < 2) {
    errors.push(`${prefix} (${entry.mode_id}): marketing_archetypes는 최소 2개 필요`);
  }

  // linked_miracle_index must be one of 5 기적지수 categories
  if (entry.linked_miracle_index && !VALID_MIRACLE_INDICES.includes(entry.linked_miracle_index)) {
    errors.push(`${prefix} (${entry.mode_id}): linked_miracle_index '${entry.linked_miracle_index}'는 유효하지 않음. 허용: ${VALID_MIRACLE_INDICES.join(', ')}`);
  }

  return errors;
}

/**
 * Load and validate the modes registry.
 * @param {{ failFast?: boolean }} options — failFast=true → throw on error (default: true)
 * @returns {{ modes: Array, modeMap: Map<string, Object>, errors: string[] }}
 */
function loadRegistry(options = {}) {
  const failFast = options.failFast !== false;

  // 1. File exists?
  if (!fs.existsSync(REGISTRY_PATH)) {
    const msg = `[ModeRegistry] 파일 없음: ${REGISTRY_PATH}`;
    if (failFast) throw new Error(msg);
    return { modes: [], modeMap: new Map(), errors: [msg] };
  }

  // 2. Parse JSON
  let rawData;
  try {
    const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    rawData = JSON.parse(content);
  } catch (e) {
    const msg = `[ModeRegistry] JSON 파싱 실패: ${e.message}`;
    if (failFast) throw new Error(msg);
    return { modes: [], modeMap: new Map(), errors: [msg] };
  }

  // 3. Must be array
  if (!Array.isArray(rawData)) {
    const msg = '[ModeRegistry] 루트가 배열이 아닙니다';
    if (failFast) throw new Error(msg);
    return { modes: [], modeMap: new Map(), errors: [msg] };
  }

  // 4. Validate each entry
  const allErrors = [];
  for (let i = 0; i < rawData.length; i++) {
    const entryErrors = validateEntry(rawData[i], i);
    allErrors.push(...entryErrors);
  }

  // 5. Duplicate mode_id check
  const ids = rawData.map(m => m.mode_id).filter(Boolean);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) {
      allErrors.push(`[ModeRegistry] 중복 mode_id: '${id}'`);
    }
    seen.add(id);
  }

  if (allErrors.length > 0 && failFast) {
    const msg = `[ModeRegistry] 검증 실패:\n  ${allErrors.join('\n  ')}`;
    throw new Error(msg);
  }

  // 6. Build lookup map
  const modeMap = new Map();
  for (const mode of rawData) {
    if (mode.mode_id) modeMap.set(mode.mode_id, mode);
  }

  return { modes: rawData, modeMap, errors: allErrors };
}

// ── Singleton: load once at require time ──
let _registry = null;

function getRegistry() {
  if (!_registry) {
    _registry = loadRegistry({ failFast: false });
  }
  return _registry;
}

/**
 * Get a mode by its ID.
 * @param {string} modeId
 * @returns {Object|null}
 */
function getModeById(modeId) {
  return getRegistry().modeMap.get(modeId) || null;
}

/**
 * Get all mode IDs.
 * @returns {string[]}
 */
function getAllModeIds() {
  return getRegistry().modes.map(m => m.mode_id);
}

/**
 * Get all modes as array.
 * @returns {Object[]}
 */
function getAllModes() {
  return getRegistry().modes;
}

module.exports = {
  loadRegistry,
  getModeById,
  getAllModeIds,
  getAllModes,
  REQUIRED_FIELDS,
  VALID_MIRACLE_INDICES,
};
