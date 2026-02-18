// ═══════════════════════════════════════════════════════════
// Mode Diagnostic Service — P1-SSOT (ISSUE 2)
//
// 진단 결과는 mode_id만 결정.
// label/tagline/action/keywords는 모두 SSOT(modes.registry.json)에서 조회.
// 모드명/문구 변경 = registry 수정만으로 반영 (코드 수정 불필요).
// ═══════════════════════════════════════════════════════════

const { getModeById, getAllModes } = require('../config/modesLoader');

/**
 * Determine the user's current mode based on symptom signals.
 *
 * @param {{ answers: Object, miracleScores?: Object }} input
 *   - answers: 진단 질문 응답 (key-value)
 *   - miracleScores: 기적지수 5대 지표 점수 (optional, 0~100)
 * @returns {{ mode_id: string, confidence: number }}
 */
function determineMode(input) {
  const { answers = {}, miracleScores = {} } = input;

  const modes = getAllModes();
  const scores = [];

  for (const mode of modes) {
    let score = 0;

    // 1. Symptom keyword matching (answers 텍스트에서 증상 키워드 매칭)
    const answerText = Object.values(answers).join(' ').toLowerCase();
    for (const symptom of mode.symptoms) {
      // 증상의 핵심 키워드 추출 (2글자 이상 단어)
      const keywords = symptom.match(/[가-힣a-z]{2,}/gi) || [];
      for (const kw of keywords) {
        if (answerText.includes(kw.toLowerCase())) {
          score += 1;
        }
      }
    }

    // 2. ad_hook_keywords matching (더 직접적인 매칭)
    for (const kw of mode.ad_hook_keywords) {
      if (answerText.includes(kw)) {
        score += 2; // 광고 키워드는 더 직접적 → 가중치 2
      }
    }

    // 3. Miracle index alignment (기적지수 낮은 영역 → 연결된 모드 가중)
    if (miracleScores[mode.linked_miracle_index] !== undefined) {
      const indexScore = miracleScores[mode.linked_miracle_index];
      if (indexScore < 40) score += 3;       // 매우 낮음
      else if (indexScore < 60) score += 1;  // 낮음
    }

    scores.push({ mode_id: mode.mode_id, score });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const top = scores[0];
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const confidence = totalScore > 0
    ? Math.round((top.score / totalScore) * 100) / 100
    : 0;

  return {
    mode_id: top.score > 0 ? top.mode_id : 'stuck', // fallback: 정체 모드
    confidence,
  };
}

/**
 * Build the full diagnostic result using SSOT registry.
 * mode_id → registry lookup → complete response.
 *
 * @param {string} modeId
 * @param {{ actionIndex?: number }} options
 * @returns {Object|null}
 */
function buildDiagnosticResult(modeId, options = {}) {
  const mode = getModeById(modeId);
  if (!mode) return null;

  const actionIndex = options.actionIndex ?? Math.floor(Math.random() * mode.recommended_action_templates.length);
  const safeIndex = actionIndex % mode.recommended_action_templates.length;

  return {
    mode_id: mode.mode_id,
    mode_label: mode.label_kr,
    tagline: mode.tagline,
    linked_miracle_index: mode.linked_miracle_index,
    symptoms: mode.symptoms,
    recommended_action: mode.recommended_action_templates[safeIndex],
    all_action_templates: mode.recommended_action_templates,
    ad_hook_keywords: mode.ad_hook_keywords,
    marketing_archetypes: mode.marketing_archetypes || [],
  };
}

/**
 * Full diagnostic pipeline: determine mode + build result.
 *
 * @param {{ answers: Object, miracleScores?: Object }} input
 * @returns {{ mode_id, confidence, result: Object }}
 */
function diagnose(input) {
  const { mode_id, confidence } = determineMode(input);
  const result = buildDiagnosticResult(mode_id);

  return {
    mode_id,
    confidence,
    result,
  };
}

module.exports = {
  determineMode,
  buildDiagnosticResult,
  diagnose,
};
