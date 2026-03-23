/**
 * Aurora Collision Validator — Build Gate
 *
 * validateUnitCollision(unit) → string[]   (에러 목록, 0개 = OK)
 * validateSpec(spec)          → void       (에러 있으면 Error throw → 빌드 hard fail)
 */

const VALID_MOTION_BASES      = ['ZIN2', 'ZOUT2', 'PANL2', 'PANT2', 'BRTH'];
const VALID_CONTINUITY_MODES  = ['NONE', 'DISSOLVE_300', 'MATCH_CUT_LIGHT', 'HOLD_THEN_DISSOLVE'];
const VALID_KEYFRAME_MODES    = ['SOFT_REVEAL', 'BLINK_FAST', 'GRADUAL_FADE'];

/**
 * 단일 유닛 충돌 규칙 검증
 *
 * @param {object} unit  - AuroraSpec v1.2 unit
 * @returns {string[]}   errors (empty = pass)
 */
function validateUnitCollision(unit) {
  const errors = [];
  const id = unit.unitId || '(unitId missing)';

  // ── anchor 필수 ───────────────────────────────────────────────────────────
  if (!unit.anchor || typeof unit.anchor !== 'string' || !unit.anchor.trim()) {
    errors.push(`[${id}] anchor is required (non-empty string)`);
  }

  // ── keyframe 검증 ─────────────────────────────────────────────────────────
  if (unit.keyframe !== undefined) {
    const kf = unit.keyframe;

    // mode
    if (!VALID_KEYFRAME_MODES.includes(kf.mode)) {
      errors.push(
        `[${id}] keyframe.mode "${kf.mode}" invalid. Valid: ${VALID_KEYFRAME_MODES.join(', ')}`
      );
    }

    // alt 이미지 경로
    if (!kf.alt || typeof kf.alt !== 'string' || !kf.alt.trim()) {
      errors.push(`[${id}] keyframe.alt image path is required`);
    }

    // start >= 0.5
    if (typeof kf.start !== 'number' || kf.start < 0.5) {
      errors.push(`[${id}] keyframe.start must be >= 0.5 (got ${kf.start})`);
    }

    // 0.15 <= duration <= 1.5
    if (typeof kf.duration !== 'number' || kf.duration < 0.15 || kf.duration > 1.5) {
      errors.push(`[${id}] keyframe.duration must be 0.15~1.5 (got ${kf.duration})`);
    }

    // BLINK_FAST: 0.10~0.25
    if (kf.mode === 'BLINK_FAST') {
      if (typeof kf.duration !== 'number' || kf.duration < 0.10 || kf.duration > 0.25) {
        errors.push(
          `[${id}] BLINK_FAST keyframe.duration must be 0.10~0.25 (got ${kf.duration})`
        );
      }
    }

    // start + duration <= 4.6
    if (typeof kf.start === 'number' && typeof kf.duration === 'number') {
      const end = kf.start + kf.duration;
      if (end > 4.6) {
        errors.push(
          `[${id}] keyframe.start(${kf.start}) + duration(${kf.duration}) = ` +
          `${end.toFixed(3)} > 4.6`
        );
      }
    }
  }

  // ── motion 검증 ───────────────────────────────────────────────────────────
  if (unit.motion !== undefined) {
    const dslRaw = (unit.motion.dsl || '').trim();
    const parts  = dslRaw.split('+').map(p => p.trim()).filter(Boolean);
    const base   = parts[0];
    const opts   = parts.slice(1);

    // base 유효성
    if (!VALID_MOTION_BASES.includes(base)) {
      errors.push(
        `[${id}] motion.dsl base "${base}" invalid. Valid: ${VALID_MOTION_BASES.join(', ')}`
      );
    }

    // base는 정확히 1개
    const baseCount = parts.filter(p => VALID_MOTION_BASES.includes(p)).length;
    if (baseCount > 1) {
      errors.push(`[${id}] motion.dsl must have exactly 1 base (got ${baseCount})`);
    }

    // option은 HOLD_FADE만 허용
    for (const opt of opts) {
      if (opt !== 'HOLD_FADE') {
        errors.push(`[${id}] motion.dsl option "${opt}" unknown. Only HOLD_FADE is allowed`);
      }
    }
  }

  // ── continuityToNext 검증 ─────────────────────────────────────────────────
  if (unit.continuityToNext !== undefined) {
    const mode = unit.continuityToNext.mode;
    if (!VALID_CONTINUITY_MODES.includes(mode)) {
      errors.push(
        `[${id}] continuityToNext.mode "${mode}" invalid. ` +
        `Valid: ${VALID_CONTINUITY_MODES.join(', ')}`
      );
    }
  }

  // ── TEXT ZERO 강제 (VID-003) ───────────────────────────────────────────────
  // 생성 모델(Sora)에 텍스트 직접 삽입 금지 — 자막은 후처리 파이프라인만 허용
  if (unit.textOverlay !== undefined) {
    errors.push(
      `[${id}] TEXT_EMBEDDED 위반: unit.textOverlay 금지. ` +
      `자막은 subtitlePipeline.js 후처리만 허용 (TEXT ZERO 정책)`
    );
  }

  return errors;
}

/**
 * 전체 spec 유닛 배열 검증
 * 에러 1개라도 있으면 Error throw → 빌드 hard fail
 *
 * @param {{ units: object[] }} spec
 */
function validateSpec(spec) {
  if (!spec || !Array.isArray(spec.units) || spec.units.length === 0) {
    throw new Error('[AURORA GATE] spec.units is missing or empty');
  }

  const allErrors = [];

  // ── TEXT ZERO: spec 레벨 검사 ──────────────────────────────────────────────
  if (spec.textOverlay !== undefined) {
    allErrors.push(
      '[spec] TEXT_EMBEDDED 위반: spec.textOverlay 금지. ' +
      '자막은 subtitlePipeline.js 후처리만 허용 (TEXT ZERO 정책)'
    );
  }

  for (const unit of spec.units) {
    const errs = validateUnitCollision(unit);
    allErrors.push(...errs);
  }

  if (allErrors.length > 0) {
    throw new Error(
      `[AURORA GATE] Collision validation FAILED (${allErrors.length} error(s)):\n` +
      allErrors.map(e => `  • ${e}`).join('\n')
    );
  }
}

module.exports = { validateUnitCollision, validateSpec };
