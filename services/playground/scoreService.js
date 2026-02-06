/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AIL-JOB-403: Philosophy Score 계산 로직
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 헌법 v2의 루브릭(A~F)을 코드로 구현
 * - 하드블록/변환/점수/등급 결정
 * - 노출/공유 권한 결정
 */

let db = null;

// ═══════════════════════════════════════════════════════════════════════════
// 하드블록 키워드 (자해/폭력/혐오/불법/성착취/괴롭힘)
// ═══════════════════════════════════════════════════════════════════════════
const HARD_BLOCK_PATTERNS = [
  // 자해/자살
  /자살\s*(방법|하고|할|하자)/i,
  /목숨\s*(끊|버리)/i,
  /죽고\s*싶/i,
  /죽어\s*버리/i,

  // 폭력/협박
  /죽여\s*(버리|줄)/i,
  /때려\s*(죽|패)/i,
  /칼로\s*(찌|베)/i,

  // 혐오 표현
  /(한남|한녀|틀딱|맘충|재기)/i,

  // 불법
  /마약\s*(구|사|팔)/i,
  /대포통장/i,
  /보이스\s*피싱/i
];

// ═══════════════════════════════════════════════════════════════════════════
// 압박/낙인 키워드 (감점 대상)
// ═══════════════════════════════════════════════════════════════════════════
const PRESSURE_PATTERNS = [
  /반드시\s*(해야|이뤄)/i,
  /무조건\s*(성공|해야)/i,
  /실패하면\s*(안|못)/i,
  /꼭\s*(해야만|성공해야)/i,
  /100%\s*(보장|성공)/i
];

const STIGMA_PATTERNS = [
  /게으른/i,
  /무능한/i,
  /찐따/i,
  /루저/i,
  /패배자/i,
  /실패자/i
];

// ═══════════════════════════════════════════════════════════════════════════
// 점수 계산 가중치 (총 100점)
// ═══════════════════════════════════════════════════════════════════════════
const SCORE_WEIGHTS = {
  pressure_zero: 20,   // A 압박0
  respect: 15,         // B 존중/비낙인
  pain_purify: 10,     // C 고통정화
  reality_hint: 15,    // D 현실단서 (필수)
  one_step: 20,        // E 한걸음 (필수)
  blessing: 20         // F 타인을 위한 한 줄 (필수)
};

// ═══════════════════════════════════════════════════════════════════════════
// 등급 기준
// ═══════════════════════════════════════════════════════════════════════════
function calculateGrade(score) {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 점수 계산 함수
// ═══════════════════════════════════════════════════════════════════════════
function computeScore(contentJson) {
  const result = {
    score_total: 0,
    grade: 'D',
    gate_result: 'pass',
    score_breakdown: {},
    reasons: []
  };

  const text = extractAllText(contentJson);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. 하드블록 체크
  // ─────────────────────────────────────────────────────────────────────────
  for (const pattern of HARD_BLOCK_PATTERNS) {
    if (pattern.test(text)) {
      result.gate_result = 'block';
      result.reasons.push({
        type: 'hard_block',
        pattern: pattern.toString(),
        message: '유해 콘텐츠 감지'
      });
      result.grade = 'D';
      return result;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. 필수 필드 체크 (없으면 공개 불가 = D등급)
  // ─────────────────────────────────────────────────────────────────────────
  const requiredFields = ['heart_line', 'reality_hint', 'reality_tag', 'one_step', 'blessing_line'];
  const missingFields = requiredFields.filter(f => !contentJson[f] || contentJson[f].trim() === '');

  if (missingFields.length > 0) {
    result.reasons.push({
      type: 'missing_required',
      fields: missingFields,
      message: '필수 필드 누락'
    });
    // 필수 필드 누락 시 낮은 점수
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. 항목별 점수 계산
  // ─────────────────────────────────────────────────────────────────────────

  // A. 압박0 (20점)
  let pressureScore = SCORE_WEIGHTS.pressure_zero;
  for (const pattern of PRESSURE_PATTERNS) {
    if (pattern.test(text)) {
      pressureScore -= 5;
      result.reasons.push({ type: 'pressure', pattern: pattern.toString() });
    }
  }
  result.score_breakdown.pressure_zero = Math.max(0, pressureScore);

  // B. 존중/비낙인 (15점)
  let respectScore = SCORE_WEIGHTS.respect;
  for (const pattern of STIGMA_PATTERNS) {
    if (pattern.test(text)) {
      respectScore -= 5;
      result.reasons.push({ type: 'stigma', pattern: pattern.toString() });
    }
  }
  result.score_breakdown.respect = Math.max(0, respectScore);

  // C. 고통정화 (10점) - 고통 표현 자체는 허용, 유해 표현만 감점
  // 이미 하드블록에서 처리됨, 기본 만점
  result.score_breakdown.pain_purify = SCORE_WEIGHTS.pain_purify;

  // D. 현실단서 (15점) - reality_hint, reality_tag 존재 여부
  if (contentJson.reality_hint && contentJson.reality_hint.trim() &&
      contentJson.reality_tag && contentJson.reality_tag.trim()) {
    result.score_breakdown.reality_hint = SCORE_WEIGHTS.reality_hint;
  } else {
    result.score_breakdown.reality_hint = 0;
    result.reasons.push({ type: 'missing', field: 'reality_hint' });
  }

  // E. 한걸음 (20점) - one_step 존재 여부 + 구체성
  if (contentJson.one_step && contentJson.one_step.trim()) {
    const stepLength = contentJson.one_step.trim().length;
    // 10자 이상이면 만점, 그 미만은 비례
    result.score_breakdown.one_step = Math.min(SCORE_WEIGHTS.one_step, Math.floor(stepLength / 10 * SCORE_WEIGHTS.one_step));
  } else {
    result.score_breakdown.one_step = 0;
    result.reasons.push({ type: 'missing', field: 'one_step' });
  }

  // F. 타인을 위한 한 줄 (20점) - blessing_line 존재 여부
  if (contentJson.blessing_line && contentJson.blessing_line.trim()) {
    const blessingLength = contentJson.blessing_line.trim().length;
    result.score_breakdown.blessing = Math.min(SCORE_WEIGHTS.blessing, Math.floor(blessingLength / 10 * SCORE_WEIGHTS.blessing));
  } else {
    result.score_breakdown.blessing = 0;
    result.reasons.push({ type: 'missing', field: 'blessing_line' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. 총점 및 등급 계산
  // ─────────────────────────────────────────────────────────────────────────
  result.score_total = Object.values(result.score_breakdown).reduce((a, b) => a + b, 0);
  result.grade = calculateGrade(result.score_total);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. 변환 필요 여부 (transform)
  // ─────────────────────────────────────────────────────────────────────────
  if (result.reasons.some(r => r.type === 'pressure' || r.type === 'stigma')) {
    result.gate_result = 'transform';
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼: 모든 텍스트 추출
// ═══════════════════════════════════════════════════════════════════════════
function extractAllText(contentJson) {
  const fields = ['heart_line', 'reality_hint', 'one_step', 'blessing_line'];
  return fields.map(f => contentJson[f] || '').join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════
// DB 연동 함수들
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 아티팩트 점수 계산 및 저장
 */
async function scoreArtifact(artifactId) {
  if (!db) throw new Error('DB not initialized');

  // 아티팩트 조회
  const artifact = await db.query(
    'SELECT content_json FROM artifacts WHERE artifact_id = $1',
    [artifactId]
  );

  if (artifact.rows.length === 0) {
    throw new Error('Artifact not found');
  }

  const contentJson = artifact.rows[0].content_json;
  const scoreResult = computeScore(contentJson);

  // 점수 저장 (upsert)
  await db.query(`
    INSERT INTO artifact_scores (artifact_id, score_total, grade, score_breakdown, gate_result, reasons, computed_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (artifact_id) DO UPDATE SET
      score_total = EXCLUDED.score_total,
      grade = EXCLUDED.grade,
      score_breakdown = EXCLUDED.score_breakdown,
      gate_result = EXCLUDED.gate_result,
      reasons = EXCLUDED.reasons,
      computed_at = NOW()
  `, [
    artifactId,
    scoreResult.score_total,
    scoreResult.grade,
    JSON.stringify(scoreResult.score_breakdown),
    scoreResult.gate_result,
    JSON.stringify(scoreResult.reasons)
  ]);

  // gate_result가 block이면 아티팩트 상태도 변경
  if (scoreResult.gate_result === 'block') {
    await db.query(
      'UPDATE artifacts SET status = $1, visibility = $2 WHERE artifact_id = $3',
      ['blocked', 'private', artifactId]
    );
  }

  return scoreResult;
}

/**
 * 아티팩트 점수 조회
 */
async function getScore(artifactId) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(
    'SELECT * FROM artifact_scores WHERE artifact_id = $1',
    [artifactId]
  );

  return result.rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 노출 권한 체크
// ═══════════════════════════════════════════════════════════════════════════
function getExposureRights(grade, gateResult) {
  if (gateResult === 'block') {
    return {
      canPublic: false,
      canShare: false,
      canFeed: false,
      canHighlight: false,
      message: '콘텐츠가 차단되었습니다.'
    };
  }

  switch (grade) {
    case 'S':
      return {
        canPublic: true,
        canShare: true,
        canFeed: true,
        canHighlight: true,
        message: '모든 기능 사용 가능'
      };
    case 'A':
      return {
        canPublic: true,
        canShare: true,
        canFeed: true,
        canHighlight: false,
        message: '피드 추천 가능'
      };
    case 'B':
      return {
        canPublic: true,
        canShare: true,
        canFeed: true,
        canHighlight: false,
        message: '기본 노출'
      };
    case 'C':
      return {
        canPublic: false,
        canShare: true,  // 링크 공유만
        canFeed: false,
        canHighlight: false,
        message: '링크 공유만 가능 (피드 제외)'
      };
    case 'D':
    default:
      return {
        canPublic: false,
        canShare: false,
        canFeed: false,
        canHighlight: false,
        message: '비공개 전용 (재작성 권장)'
      };
  }
}

module.exports = {
  init: (database) => { db = database; },
  computeScore,
  scoreArtifact,
  getScore,
  getExposureRights,
  calculateGrade,
  SCORE_WEIGHTS
};
