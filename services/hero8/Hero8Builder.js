/**
 * Hero8Builder V4.2.1 - 스토리 카드, 프롬프트, 자막 생성
 * 정확히 8.0초 영상의 3막 구조 스토리 설계
 *
 * V4.2.1 HOTFIX:
 * - HERO1~5 완전 프롬프트 세트 직접 사용
 * - 구도 강제: WIDE → MEDIUM → CLOSE (FRAMING 상수)
 * - "college student" 제거 → "adult Korean woman" (minors 오해 방지)
 * - 타이밍: 2.8+2.8+2.8-0.4 = 8.0초
 */

const {
  HEROES,
  FRAMING,
  CHARACTER_DNA,
  STYLE_GUARDRAIL,
  TEXT_ZERO_LOCK,
  OBJECT_LOCK,
  ANTI_SEOUL_LOCK,
  CAMERA_PLAN,
  TIMING,
  MOODS,
  PROHIBITED_WORDS
} = require('./constants');

class Hero8Builder {
  constructor() {
    this.storyCard = null;
    this.kfPrompts = [];
    this.motionPrompts = [];
    this.subtitles = null;
    this.hero = null;
  }

  /**
   * 금지어 체크 (신호 검증)
   * @param {string} topic - 주제
   * @returns {{ valid: boolean, blocked: string[] }}
   */
  validateSignal(topic) {
    if (!topic || typeof topic !== 'string') {
      return { valid: false, blocked: ['empty_topic'] };
    }

    const lowerTopic = topic.toLowerCase();
    const blockedWords = PROHIBITED_WORDS.filter(word =>
      lowerTopic.includes(word.toLowerCase())
    );

    return {
      valid: blockedWords.length === 0,
      blocked: blockedWords
    };
  }

  /**
   * HERO 세트 로드
   * @param {string} heroId - HERO1~HERO5
   * @returns {Object} hero 데이터
   */
  loadHero(heroId) {
    const hero = HEROES[heroId];
    if (!hero) {
      throw new Error(`유효하지 않은 HERO ID: ${heroId}. 가능한 값: ${Object.keys(HEROES).join(', ')}`);
    }
    this.hero = hero;
    return hero;
  }

  /**
   * 3막 구조 스토리 카드 생성 (V4.2.1)
   * @param {Object} input - { hero_id, topic, mood, tier }
   * @returns {Object} storyCard
   */
  buildStoryCard(input) {
    const { hero_id = 'HERO1', topic, mood = 'calm', tier = 'free' } = input;

    // 신호 검증
    const signal = this.validateSignal(topic);
    if (!signal.valid) {
      throw new Error(`금지된 내용이 포함되어 있습니다: ${signal.blocked.join(', ')}`);
    }

    // HERO 세트 로드
    const hero = this.loadHero(hero_id);

    // 무드 데이터 조회
    const moodData = MOODS[mood] || MOODS.calm;

    // V4.2.1: 3막 구조 (FRAMING 상수 사용)
    const acts = {
      act1: {
        name: 'Establishing',
        shot: 'WIDE',
        framing: FRAMING.WIDE,
        duration: TIMING.KF1,
        camera: CAMERA_PLAN.KF1
      },
      act2: {
        name: 'Action',
        shot: 'MEDIUM',
        framing: FRAMING.MEDIUM,
        duration: TIMING.KF2,
        camera: CAMERA_PLAN.KF2
      },
      act3: {
        name: 'Resolve',
        shot: 'CLOSE',
        framing: FRAMING.CLOSE,
        duration: TIMING.KF3,
        camera: CAMERA_PLAN.KF3
      }
    };

    // 스토리 카드 조합
    this.storyCard = {
      id: `story_${Date.now()}`,
      heroId: hero.id,
      topic,
      location: hero.location,
      locationKo: hero.locationKo,
      time: hero.time,
      mood: moodData,
      character: CHARACTER_DNA,
      tier,
      acts,
      timing: TIMING,
      totalDuration: TIMING.total,
      guardrails: {
        style: STYLE_GUARDRAIL.styleLock,
        character: CHARACTER_DNA.characterLock,
        textZero: TEXT_ZERO_LOCK.promptTail,
        antiSeoul: ANTI_SEOUL_LOCK.banned
      },
      createdAt: new Date().toISOString()
    };

    return this.storyCard;
  }

  /**
   * KF1~KF3 프롬프트 생성 (V4.2.1 - HERO 직접 프롬프트)
   * @returns {Array} kfPrompts
   */
  generateKFPrompts() {
    if (!this.storyCard || !this.hero) {
      throw new Error('스토리 카드가 없습니다. buildStoryCard()를 먼저 호출하세요.');
    }

    const hero = this.hero;

    // V4.2.1: HERO에서 직접 프롬프트 사용 (완전 복붙 세트)
    this.kfPrompts = [
      {
        id: 'kf1',
        role: 'establishing',
        shot: 'WIDE',
        framing: FRAMING.WIDE,
        prompt: hero.kf1,
        duration: TIMING.KF1,
        camera: CAMERA_PLAN.KF1
      },
      {
        id: 'kf2',
        role: 'action',
        shot: 'MEDIUM',
        framing: FRAMING.MEDIUM,
        prompt: hero.kf2,
        duration: TIMING.KF2,
        camera: CAMERA_PLAN.KF2
      },
      {
        id: 'kf3',
        role: 'resolve',
        shot: 'CLOSE',
        framing: FRAMING.CLOSE,
        prompt: hero.kf3,
        duration: TIMING.KF3,
        camera: CAMERA_PLAN.KF3
      }
    ];

    return this.kfPrompts;
  }

  /**
   * Motion 프롬프트 생성 (V4.2.1 - HERO 직접 프롬프트)
   * @returns {Array} motionPrompts
   */
  generateMotionPrompts() {
    if (!this.hero) {
      throw new Error('HERO가 로드되지 않았습니다.');
    }

    const hero = this.hero;

    // V4.2.1: HERO에서 직접 모션 프롬프트 사용
    this.motionPrompts = [
      {
        id: 'm1',
        effect: 'zoom-in',
        prompt: hero.m1
      },
      {
        id: 'm2',
        effect: 'pan',
        prompt: hero.m2
      },
      {
        id: 'm3',
        effect: 'zoom-out+hold',
        prompt: hero.m3
      }
    ];

    return this.motionPrompts;
  }

  /**
   * 자막 생성 (V4.2.1 - HERO별 자막)
   * @returns {Object} { txt, srt, json }
   */
  generateSubtitles() {
    if (!this.storyCard || !this.hero) {
      throw new Error('스토리 카드가 없습니다. buildStoryCard()를 먼저 호출하세요.');
    }

    const hero = this.hero;

    // HERO별 자막 사용 (없으면 기본값)
    const subtitleLines = hero.subtitles || [
      `${hero.locationKo}에서`,
      '소원을 담아',
      '살짝 띄워요'
    ];

    // V4.2.1 타이밍 적용 (crossfade 겹침 고려)
    const lines = [
      {
        id: 1,
        start: 0,
        end: TIMING.KF1,
        text: subtitleLines[0]
      },
      {
        id: 2,
        start: TIMING.KF1,
        end: TIMING.KF1 + TIMING.KF2,
        text: subtitleLines[1]
      },
      {
        id: 3,
        start: TIMING.KF1 + TIMING.KF2,
        end: TIMING.total,
        text: subtitleLines[2]
      }
    ];

    // TXT 형식
    const txt = lines.map(line => line.text).join('\n');

    // SRT 형식
    const srt = lines.map(line => {
      const startTime = this._formatSrtTime(line.start);
      const endTime = this._formatSrtTime(line.end);
      return `${line.id}\n${startTime} --> ${endTime}\n${line.text}\n`;
    }).join('\n');

    // JSON 형식
    const json = {
      version: '4.2.1',
      heroId: hero.id,
      totalDuration: TIMING.total,
      lines
    };

    this.subtitles = { txt, srt, json };
    return this.subtitles;
  }

  /**
   * SRT 시간 형식 변환
   * @param {number} seconds
   * @returns {string} HH:MM:SS,mmm
   */
  _formatSrtTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.round((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  /**
   * 전체 빌드 프로세스 실행 (V4.2.1)
   * @param {Object} input - { hero_id, topic, mood, tier }
   * @returns {Object} { storyCard, kfPrompts, motionPrompts, subtitles }
   */
  build(input) {
    const storyCard = this.buildStoryCard(input);
    const kfPrompts = this.generateKFPrompts();
    const motionPrompts = this.generateMotionPrompts();
    const subtitles = this.generateSubtitles();

    return {
      storyCard,
      kfPrompts,
      motionPrompts,
      subtitles,
      hero: this.hero
    };
  }

  /**
   * 입력 유효성 검사 (V4.2.1)
   * @param {Object} input
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateInput(input) {
    const errors = [];

    // hero_id 검증
    if (input.hero_id && !HEROES[input.hero_id]) {
      errors.push(`유효하지 않은 hero_id: ${input.hero_id}. 가능한 값: ${Object.keys(HEROES).join(', ')}`);
    }

    // topic 검증
    if (!input.topic || typeof input.topic !== 'string') {
      errors.push('topic은 필수 문자열입니다');
    } else if (input.topic.length < 2) {
      errors.push('topic은 최소 2자 이상이어야 합니다');
    } else if (input.topic.length > 100) {
      errors.push('topic은 100자를 초과할 수 없습니다');
    }

    // mood 검증
    if (input.mood && !MOODS[input.mood]) {
      errors.push(`유효하지 않은 mood: ${input.mood}. 가능한 값: ${Object.keys(MOODS).join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 사용 가능한 HERO 목록 반환
   */
  static getAvailableHeroes() {
    return Object.entries(HEROES).map(([id, hero]) => ({
      id,
      location: hero.location,
      locationKo: hero.locationKo,
      time: hero.time,
      mood: hero.mood
    }));
  }

  /**
   * V4.2.1 가드레일 정보 반환
   */
  static getGuardrails() {
    return {
      character: CHARACTER_DNA,
      framing: FRAMING,
      style: STYLE_GUARDRAIL,
      textZero: TEXT_ZERO_LOCK,
      object: OBJECT_LOCK,
      antiSeoul: ANTI_SEOUL_LOCK
    };
  }
}

module.exports = Hero8Builder;
