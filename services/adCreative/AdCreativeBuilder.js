/**
 * AdCreativeBuilder — 가이드 준수 프롬프트 자동 조립
 *
 * Hero8Builder 패턴 확장.
 * archetype × ltv_segment → 6단계 완성 크리에이티브 출력.
 */

const {
  STYLE_LOCK, BASE_LINES, SOWONI_LOCK, AURUM_LOCK,
  TEXT_ZERO, NEGATIVE_PROMPT, SORA_I2V_COMMON,
  STYLE_TOKENS, COLOR_SCRIPT, CREATIVE_CONFIGS
} = require('./constants');

class AdCreativeBuilder {
  /**
   * 크리에이티브 ID 생성
   * @param {string} archetype - 'healing_seeker' | 'growth_builder'
   * @param {string} ltv - 'high' | 'mid' | 'low'
   * @returns {string} 'healing-high' 등
   */
  static getConfigId(archetype, ltv) {
    const prefix = archetype === 'healing_seeker' ? 'healing' : 'growth';
    return `${prefix}-${ltv}`;
  }

  /**
   * 전체 크리에이티브 빌드
   * @param {string} configId - 'healing-high' 등
   * @returns {Object} 6단계 완성 크리에이티브
   */
  static build(configId) {
    const config = CREATIVE_CONFIGS[configId];
    if (!config) {
      throw new Error(`Unknown config: ${configId}. Available: ${Object.keys(CREATIVE_CONFIGS).join(', ')}`);
    }

    return {
      configId,
      productionSummary: AdCreativeBuilder.buildProductionSummary(config),
      scenePlan: AdCreativeBuilder.buildScenePlan(config),
      keyframePrompts: config.units.map((unit, i) =>
        AdCreativeBuilder.buildKeyframePrompt(unit, config, i)
      ),
      soraPrompts: config.units.map((unit, i) =>
        AdCreativeBuilder.buildSoraPrompt(unit, config, i)
      ),
      subtitles: config.subtitles,
      logoSongBrief: AdCreativeBuilder.buildSoundBrief(config)
    };
  }

  /**
   * 1단계: PRODUCTION SUMMARY
   */
  static buildProductionSummary(config) {
    return {
      title: config.title,
      objective: `${config.archetype} × ${config.ltv} LTV`,
      format: '9:16 Vertical',
      resolution: '1080×1920',
      duration: '15초 (5s × 3 유닛)',
      characters: `Sowoni (${config.costume}), Aurum (${config.units.map(u => u.aurumState).join(' → ')})`,
      colorArc: `PAIN(${COLOR_SCRIPT.PAIN}) → SOLUTION(${COLOR_SCRIPT.SOLUTION})`,
      backgroundMode: config.backgroundMode,
      textRule: 'TEXT ZERO — 영상 내 읽을 수 있는 텍스트 0개',
      phoneUI: 'ONLY abstract soft color blocks + bubble shapes',
      tone: config.tone,
      cta: config.cta
    };
  }

  /**
   * 2단계: SCENE PLAN (표)
   */
  static buildScenePlan(config) {
    return config.units.map(unit => ({
      unitId: unit.id,
      time: unit.time,
      phase: unit.phase,
      emotion: unit.emotion,
      background: `${unit.bg} — ${unit.bgDesc}`,
      aurumState: `${unit.aurumState} — ${unit.aurumDesc}`
    }));
  }

  /**
   * 3단계: KEYFRAME PROMPT (이미지 생성용)
   */
  static buildKeyframePrompt(unit, config, _index) {
    const tokenNames = unit.styleTokens.map(i => STYLE_TOKENS[i]);
    const colorLine = unit.phase === 'PAIN' ? COLOR_SCRIPT.PAIN : COLOR_SCRIPT.SOLUTION;

    const prompt = [
      STYLE_LOCK,
      '',
      BASE_LINES,
      '',
      `${SOWONI_LOCK}\n- Costume: ${config.costume}`,
      '',
      `${AURUM_LOCK}\n- State: ${unit.aurumState}`,
      '',
      TEXT_ZERO,
      '',
      `[SCENE]`,
      `${unit.bgDesc}`,
      `Color: ${colorLine}`,
      unit.scene,
      '',
      `Style tokens: ${tokenNames.join(', ')}.`,
      '',
      NEGATIVE_PROMPT
    ].join('\n');

    return {
      unitId: unit.id,
      phase: unit.phase,
      emotion: unit.emotion,
      prompt
    };
  }

  /**
   * 4단계: SORA I2V PROMPT (영상 생성용)
   */
  static buildSoraPrompt(unit, config, _index) {
    const prompt = [
      SORA_I2V_COMMON,
      '',
      STYLE_LOCK,
      '',
      TEXT_ZERO,
      '',
      `[3-BEAT MOTION]`,
      '',
      `Beat A (0–2s): 시선 고정 (Hook)`,
      unit.beatA,
      '',
      `Beat B (2–4s): 마법의 순간 (Action)`,
      unit.beatB,
      '',
      `Beat C (4–5s): 연결 & 여백 (Hold)`,
      unit.beatC,
      '',
      NEGATIVE_PROMPT
    ].join('\n');

    return {
      unitId: unit.id,
      phase: unit.phase,
      emotion: unit.emotion,
      prompt
    };
  }

  /**
   * 6단계: LOGO SONG BRIEF
   */
  static buildSoundBrief(config) {
    return {
      instrument: config.musicInstrument,
      bpm: config.musicBpm,
      moodArc: config.units.map(u => `${u.id}: ${u.musicCue}`),
      reference: config.musicRef
    };
  }

  /**
   * 사용 가능한 크리에이티브 목록
   */
  static listConfigs() {
    return Object.entries(CREATIVE_CONFIGS).map(([id, config]) => ({
      id,
      title: config.title,
      archetype: config.archetype,
      ltv: config.ltv,
      costume: config.costume,
      backgroundMode: config.backgroundMode
    }));
  }
}

module.exports = AdCreativeBuilder;
