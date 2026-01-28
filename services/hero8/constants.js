/**
 * Hero8 Video System Constants V4.2.1 HOTFIX
 *
 * V4.2.1 핵심 변경:
 * - 8.0초 정확히 고정 (2.8+2.8+2.8 - 0.4 = 8.0)
 * - "college student" 제거 → "adult Korean woman" (minors 오해 방지)
 * - 구도 강제 문구: WIDE/MEDIUM/CLOSE 명시적 프레이밍
 */

// ═══════════════════════════════════════════════════════════════
// V4.2.1 공통 고정 문장
// ═══════════════════════════════════════════════════════════════

// CHARACTER_LOCK (V4.2.1 - "college student" 제거)
const CHARACTER_LOCK = `adult Korean woman in her early 20s (20–22, NOT a minor), warm brown eyes, soft youthful face, gentle smile, shoulder-length dark hair with natural waves, pastel cardigan over white tee, light denim, simple sneakers`;

// STYLE_LOCK
const STYLE_LOCK = `2D hand-drawn line art + warm pastel watercolor wash, flat color blocks, subtle paper grain texture, minimal shading`;

// OBJECT_LOCK
const OBJECT_LOCK_TEXT = `blank wish paper airplane with subtle watercolor texture (no text)`;

// NEGATIVE_LOCK (전체)
const NEGATIVE_LOCK = `coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection`;

// CONSISTENCY_TAIL
const CONSISTENCY_TAIL = `Keep the same face, same hairstyle, and same outfit as the reference protagonist.`;

// ═══════════════════════════════════════════════════════════════
// V4.2.1 구도 강제 문구
// ═══════════════════════════════════════════════════════════════
const FRAMING = {
  WIDE: 'full-body small in frame, environment dominant',
  MEDIUM: 'waist-up framing, hands clearly visible',
  CLOSE: 'face and hands close-up, airplane near foreground'
};

// ═══════════════════════════════════════════════════════════════
// HERO 세트 V4.2.1 (완전 복붙 세트)
// ═══════════════════════════════════════════════════════════════
const HEROES = {
  HERO1: {
    id: 'HERO1',
    topic: '오동도 아침',
    location: 'Odongdo Island',
    locationKo: '오동도',
    time: 'sunrise',
    mood: 'calm, hopeful',
    yeosuAnchors: 'sea horizon, Odongdo silhouette, coastal low-rise roofs',
    localDetail: 'camellia petals motif (pattern only, no text)',
    subtitles: ['오동도 아침빛', '소원을 접어', '살짝 띄워요'],
    ambientMotion: 'subtle camellia motif drift and calm sea shimmer',

    // V4.2.1 완전 프롬프트
    kf1: `2D hand-drawn line art + warm pastel watercolor wash, adult Korean woman in her early 20s (20–22, NOT a minor), warm brown eyes, gentle smile, shoulder-length dark wavy hair, pastel cardigan over white tee, light denim, simple sneakers, holding a blank wish paper airplane with subtle watercolor texture (no text), full-body small in frame, environment dominant, on an Odongdo park path at sunrise with sea horizon and Odongdo silhouette and coastal low-rise roofs in the distance, subtle camellia petals motif drifting, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf2: `2D hand-drawn line art + warm pastel watercolor wash, waist-up framing, hands clearly visible, the same adult Korean woman (20–22, NOT a minor) calmly lifts the blank wish paper airplane (no text) slightly while breathing in, sea horizon glowing behind Odongdo silhouette with coastal low-rise roofs, camellia petals motif floating softly, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf3: `2D hand-drawn line art + warm pastel watercolor wash, face and hands close-up, airplane near foreground, the same adult Korean woman (20–22, NOT a minor) softly smiles and steadies the blank wish paper airplane (no text) near her fingertips, sunrise shimmer over the sea horizon with Odongdo silhouette and coastal low-rise roofs softly implied in gentle blur, camellia petals motif passing by, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    m1: `Gentle 2D zoom-in from the wide Odongdo sunrise scene toward the protagonist holding the paper airplane, with subtle camellia motif drift and calm sea shimmer. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m2: `Slow 2D pan following her hands as she lifts the paper airplane slightly, with soft morning light rising on the sea horizon. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m3: `Soft 2D zoom-out on her relaxed smile, then hold the final frame for a warm ending. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`
  },

  HERO2: {
    id: 'HERO2',
    topic: '향일암 숨결',
    location: 'Hyangiram Hermitage',
    locationKo: '향일암',
    time: 'sunrise',
    mood: 'calm, reflective',
    yeosuAnchors: 'sea horizon, rocky cliff coast, coastal low-rise roofs',
    localDetail: 'wooden seaside window frame (unlabeled, no text)',
    subtitles: ['향일암 숨결', '마음을 모아', '조용히 빛나요'],
    ambientMotion: 'soft light rising on the sea horizon with gentle breeze',

    kf1: `2D hand-drawn line art + warm pastel watercolor wash, adult Korean woman in her early 20s (20–22, NOT a minor), holding a blank wish paper airplane (no text), full-body small in frame, environment dominant, near Hyangiram Hermitage at sunrise with rocky cliff coast and a vast sea horizon, coastal low-rise roofs far below, a wooden seaside window frame element nearby, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf2: `2D hand-drawn line art + warm pastel watercolor wash, waist-up framing, hands clearly visible, the same adult Korean woman (20–22, NOT a minor) brings the blank wish paper airplane (no text) gently closer to her chest as a soft breeze moves a few hair strands, sea horizon brightening behind the cliffs with distant coastal low-rise roofs, wooden seaside window frame detail present, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf3: `2D hand-drawn line art + warm pastel watercolor wash, face and hands close-up, airplane near foreground, the same adult Korean woman (20–22, NOT a minor) opens her eyes with a small calm nod while steadying the blank wish paper airplane (no text), sunrise glow reflecting from the sea horizon with rocky cliff shapes and coastal low-rise roofs softly implied, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    m1: `Slow 2D pan across the cliff edge toward the protagonist holding the paper airplane against the sunrise horizon. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m2: `Gentle 2D zoom-in on her hands near her chest as a light breeze moves a few hair strands and the sea shimmers. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m3: `Soft 2D zoom-out to her eyes opening and a calm nod, then hold the final frame for closure. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`
  },

  HERO3: {
    id: 'HERO3',
    topic: '광장 바람결',
    location: 'Yi Sun-sin Square',
    locationKo: '이순신광장',
    time: 'late afternoon',
    mood: 'fresh, uplifting',
    yeosuAnchors: 'sea horizon, harbor breakwater point lights (far), coastal low-rise roofs',
    localDetail: 'wish-exchange postcard (blank, no text)',
    subtitles: ['광장 바람결', '접힌 소원 하나', '오늘이 가벼워요'],
    ambientMotion: 'subtle ambient shimmer from the distant sea',

    kf1: `2D hand-drawn line art + warm pastel watercolor wash, adult Korean woman in her early 20s (20–22, NOT a minor), holding a blank wish paper airplane (no text), full-body small in frame, environment dominant, at Yi Sun-sin Square in late afternoon with a distant sea horizon and faint harbor breakwater point lights far away, coastal low-rise roofs around the waterfront, a blank wish-exchange postcard nearby, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf2: `2D hand-drawn line art + warm pastel watercolor wash, waist-up framing, hands clearly visible, the same adult Korean woman (20–22, NOT a minor) adjusts the folds of the blank wish paper airplane (no text) with careful fingertips while the blank postcard rests beside her, sea horizon and distant breakwater lights subtly present with coastal low-rise roofs, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf3: `2D hand-drawn line art + warm pastel watercolor wash, face and hands close-up, airplane near foreground, the same adult Korean woman (20–22, NOT a minor) smiles softly as she brings the blank wish paper airplane (no text) forward, with sea horizon glow and distant breakwater lights and coastal low-rise roofs implied in soft focus, blank postcard detail still present, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    m1: `Gentle 2D pan from the low-rise waterfront area toward the protagonist holding the paper airplane with the sea horizon behind. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m2: `Slow 2D zoom-in on her hands refining the airplane folds, with a subtle ambient shimmer from the distant sea. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m3: `Soft 2D zoom-out on her smile as she extends the airplane forward, then hold the final frame. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`
  },

  HERO4: {
    id: 'HERO4',
    topic: '노을의 여수',
    location: 'Dolsan Bridge + Marine Cable Car',
    locationKo: '돌산대교 + 케이블카',
    time: 'sunset',
    mood: 'warm, romantic, hopeful',
    yeosuAnchors: 'Dolsan Bridge, Marine Cable Car line, sea horizon, coastal low-rise roofs',
    localDetail: 'Dolsan-gat subtle motif (pattern only, no text)',
    subtitles: ['노을의 여수', '케이블카 아래', '소원이 떠나요'],
    ambientMotion: 'cable car cabins gliding slowly with warm sunset light shimmering on water',

    kf1: `2D hand-drawn line art + warm pastel watercolor wash, adult Korean woman in her early 20s (20–22, NOT a minor), holding a blank wish paper airplane (no text), full-body small in frame, environment dominant, by the waterfront at sunset with Dolsan Bridge and the Marine Cable Car line crossing the sky above a sea horizon, coastal low-rise roofs nearby, a subtle Dolsan-gat motif pattern in the scene, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf2: `2D hand-drawn line art + warm pastel watercolor wash, waist-up framing, hands clearly visible, the same adult Korean woman (20–22, NOT a minor) turns slightly toward the glowing sea horizon while lifting the blank wish paper airplane (no text), cable car cabins visible along the line with Dolsan Bridge behind and coastal low-rise roofs below, Dolsan-gat motif pattern subtly present, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf3: `2D hand-drawn line art + warm pastel watercolor wash, face and hands close-up, airplane near foreground, the same adult Korean woman (20–22, NOT a minor) shows a gentle hopeful smile holding the blank wish paper airplane (no text) poised to release, sunset reflections on the sea horizon with Dolsan Bridge and cable car line softly implied and coastal low-rise roofs distant, Dolsan-gat motif pattern faint, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    m1: `Slow 2D pan revealing Dolsan Bridge and the cable car line at sunset before settling on the protagonist holding the airplane. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m2: `Gentle 2D zoom-in as cable car cabins glide slowly along the line and warm sunset light shimmers on the water. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m3: `Soft 2D zoom-out to her smile and the airplane release-ready pose, then hold the final frame longer. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`
  },

  HERO5: {
    id: 'HERO5',
    topic: '밤바다 불빛',
    location: 'Yeosuhang Port',
    locationKo: '여수항',
    time: 'night',
    mood: 'cozy, comforting',
    yeosuAnchors: 'harbor breakwater point lights, sea horizon, coastal low-rise roofs',
    localDetail: 'guesthouse vibe props (unlabeled, no text)',
    subtitles: ['밤바다 불빛', '조용한 숨결', '괜찮아질 거야'],
    ambientMotion: 'water reflections shimmering subtly from breakwater lights',

    kf1: `2D hand-drawn line art + warm pastel watercolor wash, adult Korean woman in her early 20s (20–22, NOT a minor), holding a blank wish paper airplane (no text), full-body small in frame, environment dominant, at Yeosuhang Port at night with harbor breakwater point lights reflecting toward the sea horizon, coastal low-rise roofs along the waterfront, cozy guesthouse vibe props nearby (unlabeled), coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf2: `2D hand-drawn line art + warm pastel watercolor wash, waist-up framing, hands clearly visible, the same adult Korean woman (20–22, NOT a minor) gently adjusts her grip on the blank wish paper airplane (no text) as the breakwater lights shimmer on the water, coastal low-rise roofs present, cozy unlabeled props remain, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    kf3: `2D hand-drawn line art + warm pastel watercolor wash, face and hands close-up, airplane near foreground, the same adult Korean woman (20–22, NOT a minor) holds the blank wish paper airplane (no text) and smiles comfortingly against soft reflections of breakwater point lights and a calm sea horizon, coastal low-rise roofs softly implied, cozy unlabeled props hinted, coastal low-rise roofs, no metropolis skyline, no readable text, no signs, no labels, no name tags, no visible letters or numbers, ban photorealistic, 3D render, CGI, cinematic lighting, HDR, depth of field, bokeh, lens flare, metallic reflection.`,

    m1: `Gentle 2D pan across the harbor breakwater lights and reflections before landing on the protagonist with the airplane. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m2: `Slow 2D zoom-in on her hands and quiet breath as the water reflections shimmer subtly. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`,
    m3: `Soft 2D zoom-out to her warm smile, then hold the final frame longer for a cozy ending. Keep the same face, same hairstyle, and same outfit as the reference protagonist.`
  }
};

// ═══════════════════════════════════════════════════════════════
// V4.2.1 타이밍 설정 (8.0초 정확히 고정)
// ═══════════════════════════════════════════════════════════════
const TIMING = {
  // 각 클립 2.8초로 통일
  KF1: 2.8,
  KF2: 2.8,
  KF3: 2.8,
  // xfade 0.2초 × 2 = 0.4초 겹침
  crossfade: 0.2,
  // 결과: 2.8 + 2.8 + 2.8 - 0.2 - 0.2 = 8.0초
  total: 8.0,
  fps: 24,
  frames: 67,  // 2.8초 × 24fps ≈ 67프레임
  // xfade 오프셋
  xfadeOffset1: 2.6,  // 2.8 - 0.2
  xfadeOffset2: 5.2   // 2.6 + 2.8 - 0.2
};

// ═══════════════════════════════════════════════════════════════
// Ken Burns 카메라 플랜 (V4.2.1)
// ═══════════════════════════════════════════════════════════════
const CAMERA_PLAN = {
  KF1: {
    effect: 'zoom-in',
    startScale: 1.0,
    endScale: 1.05,
    description: 'gentle 2D zoom-in'
  },
  KF2: {
    effect: 'pan',
    scale: 1.05,
    direction: 'left-to-right',
    description: 'gentle 2D pan'
  },
  KF3: {
    effect: 'zoom-out',
    startScale: 1.08,
    endScale: 1.0,
    holdFrames: 15,  // 약 0.6초 hold
    description: 'slow 2D zoom-out → hold'
  }
};

// ═══════════════════════════════════════════════════════════════
// 캐릭터 DNA V4.2.1 (college student 제거)
// ═══════════════════════════════════════════════════════════════
const CHARACTER_DNA = {
  version: 'v4.2.1',
  name: 'Sowoni',
  nameKo: '소원이',

  // V4.2.1: "college student" 완전 제거
  characterLock: CHARACTER_LOCK,

  // 프롬프트용 간략 설명
  promptDescription: 'adult Korean woman in her early 20s (20–22, NOT a minor)',

  // 금지어 (절대 사용 금지)
  bannedWords: [
    'girl', 'teen', 'teenager', 'student',
    'schoolgirl', 'high school', 'middle school',
    'child', 'kid', 'minor', 'young girl',
    'chibi', 'loli', 'college'  // college도 제거
  ],

  consistencyTail: CONSISTENCY_TAIL
};

// ═══════════════════════════════════════════════════════════════
// 스타일 가드레일
// ═══════════════════════════════════════════════════════════════
const STYLE_GUARDRAIL = {
  styleLock: STYLE_LOCK,
  negativeLock: NEGATIVE_LOCK
};

// ═══════════════════════════════════════════════════════════════
// 기타 상수
// ═══════════════════════════════════════════════════════════════
const TEXT_ZERO_LOCK = {
  promptTail: 'no readable text, no signs, no labels, no name tags, no visible letters or numbers'
};

const OBJECT_LOCK = {
  description: OBJECT_LOCK_TEXT
};

const ANTI_SEOUL_LOCK = {
  required: 'coastal low-rise roofs',
  banned: 'no metropolis skyline'
};

const MOODS = {
  calm: { name: '평온함', atmosphere: 'peaceful, serene' },
  hopeful: { name: '희망찬', atmosphere: 'uplifting, bright' },
  romantic: { name: '로맨틱', atmosphere: 'warm, romantic' },
  cozy: { name: '포근함', atmosphere: 'cozy, comforting' },
  reflective: { name: '성찰적', atmosphere: 'calm, reflective' },
  fresh: { name: '상쾌함', atmosphere: 'fresh, uplifting' }
};

const QA_SETTINGS = {
  minScore: 85,
  imageRequirements: {
    minWidth: 1080,
    minHeight: 1920,
    aspectRatio: '9:16',
    minFileSize: 50 * 1024,
    maxFileSize: 10 * 1024 * 1024
  },
  videoRequirements: {
    duration: 8,
    fps: 24,
    codec: 'h264',
    width: 1080,
    height: 1920
  }
};

const PROHIBITED_WORDS = [
  '죽', '자살', '살인', '폭력', '학대', '테러', '총', '칼', '피',
  '섹스', '야동', '포르노', '음란', '성인',
  '혐오', '차별', '인종', '장애',
  '마약', '도박', '범죄', '해킹',
  '정치', '선거', '종교', '신앙'
];

const TIER_CONFIG = {
  free: { maxGenerations: 1, watermark: true, resolution: '720p' },
  basic: { maxGenerations: 5, watermark: false, resolution: '1080p' },
  premium: { maxGenerations: 20, watermark: false, resolution: '1080p' }
};

module.exports = {
  HEROES,
  FRAMING,
  CHARACTER_LOCK,
  STYLE_LOCK,
  OBJECT_LOCK_TEXT,
  NEGATIVE_LOCK,
  CONSISTENCY_TAIL,
  CHARACTER_DNA,
  STYLE_GUARDRAIL,
  TEXT_ZERO_LOCK,
  OBJECT_LOCK,
  ANTI_SEOUL_LOCK,
  CAMERA_PLAN,
  TIMING,
  MOODS,
  QA_SETTINGS,
  PROHIBITED_WORDS,
  TIER_CONFIG
};
