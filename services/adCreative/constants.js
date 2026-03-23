/**
 * Ad Creative Constants — gpt-video-production.md 원문 기반
 *
 * 모든 Lock 블록은 가이드 원문 그대로 저장.
 * 한 글자도 수정하면 안 됩니다.
 */

// ═══════════════════════════════════════════════════════════════
// §2-1 STYLE LOCK (원문 그대로)
// ═══════════════════════════════════════════════════════════════
const STYLE_LOCK = `[STYLE LOCK]
Strict 2D hand-drawn animation style.
Ink line art + warm watercolor wash + paper grain texture.
Ghibli-inspired warmth mixed with Korean manhwa linework.
Lighting: Flat lighting (No heavy shadows).

Negative Constraints:
- NO 3D, NO photoreal, NO CGI look
- NO volumetric light, NO glossy highlights
- NO metallic reflections, NO heavy depth of field`;

// ═══════════════════════════════════════════════════════════════
// §2-1 BASE 3줄 (원문 그대로)
// ═══════════════════════════════════════════════════════════════
const BASE_LINE1 = `9:16 vertical, pure 2D animation, Ghibli+Korean webtoon fusion style, NO 3D elements, cel animation aesthetic, hand-drawn line art with visible brush strokes.`;
const BASE_LINE2 = `Color: warm pastel watercolor, flat color blocks with subtle paper texture, NO gradients resembling 3D shading, edge-lit style like Studio Ghibli background paintings.`;
const BASE_LINE3 = `Main: Sowoni(20–22, warm smile, pastel casual clothes, consistent 2D face, simple anime eye style), object: wish paper airplane(origami-style flat rendering), SAFE SPACE action + Yeosu sea background (painted backdrop style).`;

const BASE_LINES = `[BASE]\n${BASE_LINE1}\n${BASE_LINE2}\n${BASE_LINE3}`;

// ═══════════════════════════════════════════════════════════════
// §2-3 SOWONI LOCK v2 (원문 그대로)
// ═══════════════════════════════════════════════════════════════
const SOWONI_LOCK = `[SOWONI LOCK v2]
- adult Korean college student, early 20s (20–22), NOT a minor
- No school uniform, avoid teen/child cues
- No readable text on clothing/objects
- Simple anime line art, large expressive eyes (웹툰 스타일 큰 눈)
- Minimal nose (small dot or simple line), soft rounded face
- NO realistic facial anatomy, NO motion capture fluidity
- Flat cel-shaded clothes (no 3D cloth sim wrinkles)`;

// ═══════════════════════════════════════════════════════════════
// §2-3 AURUM TURTLE LOCK v2 (원문 그대로)
// ═══════════════════════════════════════════════════════════════
const AURUM_LOCK = `[AURUM TURTLE LOCK v2]
- Rounded shell-orb body with simple scute plates (6–10 only)
- Minimal turtle face: two small eyes, tiny beak-like mouth, two dot nostrils
- Short little limbs with tiny claws/flippers visible
- Subtle watercolor halo ring (NOT volumetric light rays)
- One small crescent-rune mark on the shell (fixed position)
- No jewelry, no clothing-like patterns, no human face, no eyelashes, no teeth`;

// ═══════════════════════════════════════════════════════════════
// §2-2 TEXT ZERO (원문 그대로)
// ═══════════════════════════════════════════════════════════════
const TEXT_ZERO = `[TEXT ZERO]
- NO readable text, NO subtitles, NO logos, NO watermark
- NO 간판, NO UI 텍스트
- 폰 화면: ONLY abstract soft color blocks + bubble shapes
- 모든 텍스트는 후편집 자막으로만 처리`;

// ═══════════════════════════════════════════════════════════════
// §8 NEGATIVE 프롬프트 (전량)
// ═══════════════════════════════════════════════════════════════
const NEGATIVE_PROMPT = `[NEGATIVE]
photorealistic, 3D render, CGI, Unreal Engine, Unity, Blender, cinematic lighting, lens flare, depth of field, PBR materials, realistic shading, subsurface scattering, ambient occlusion, ray tracing, global illumination, volumetric fog, HDR, bloom effect, chromatic aberration, motion blur, camera shake, handheld camera, live-action, real camera, bokeh, DSLR, film grain, vignette, color grading, LUT, physically-based rendering, metallic, chrome, reflective surface, glossy, wet surface, glass material, mirror, specular highlights, caustics, refraction, translucent, photoreal skin, realistic hair physics, cloth simulation, particle effects, dynamic lighting, shadow mapping, normal mapping, bump mapping, displacement, tessellation`;

// ═══════════════════════════════════════════════════════════════
// §11 SORA I2V 공통 지침
// ═══════════════════════════════════════════════════════════════
const SORA_I2V_COMMON = `[SORA I2V COMMON]
Use the provided keyframe image as the only visual reference.
Keep 2D style and character identity perfectly consistent.
Duration: 5 seconds. One continuous shot (NO hard cuts).
Motion Scale: "Minimal motion"
- Micro-expression, Blink, Hair flutter, Wind/Light 변화 위주
Camera: Gentle Push-in / Slow Pan / Hold
9:16 vertical (1080×1920).`;

// ═══════════════════════════════════════════════════════════════
// §7 스타일 토큰 (허용 목록 10종)
// ═══════════════════════════════════════════════════════════════
const STYLE_TOKENS = [
  'Studio Ghibli background painting style',
  'Korean webtoon character design',
  'Hayao Miyazaki soft color palette',
  'Naver webtoon flat rendering',
  'Spirited Away ambient mood',
  'True Beauty character proportion',
  'My Neighbor Totoro nature aesthetic',
  'Lore Olympus pastel blocking',
  "Kiki's Delivery Service cozy atmosphere",
  'Solo Leveling action clarity with 2D lines'
];

// ═══════════════════════════════════════════════════════════════
// §4 컬러 스크립트
// ═══════════════════════════════════════════════════════════════
const COLOR_SCRIPT = {
  PAIN: 'Cool grey, desaturated watercolors, blue shadows.',
  SOLUTION: 'Warm golden wash, bright pastel watercolors, soft hand-painted glow (NOT volumetric light).'
};

// ═══════════════════════════════════════════════════════════════
// 의상 / 아우룸 / 배경 프리셋
// ═══════════════════════════════════════════════════════════════
const COSTUMES = ['SPRING_CASUAL', 'SUMMER_SEASIDE', 'AUTUMN_COZY', 'WINTER_COAT', 'NIGHT_WALK'];
const AURUM_STATES = ['BASE', 'OBSERVE', 'GUIDE', 'SPARKLE', 'COZY_BREEZE', 'NIGHT_CALM'];

const BACKGROUNDS = {
  GENERIC: {
    GN01: { name: '바닷가 산책로', mood: '산책, 일상' },
    GN02: { name: '조용한 골목', mood: '고요, 사색' },
    GN03: { name: '카페 창가', mood: '여유, 관조' },
    GN04: { name: '공원 벤치', mood: '일상, 쉼' },
    GN05: { name: '밤 거리', mood: '고독, 전환' },
    GN06: { name: '일출/일몰 해변', mood: '희망, 새 시작' }
  },
  YEOSU: {
    YS01: { name: '오동도 해안길', mood: '설렘, 시작', type: 'landmark' },
    YS02: { name: '해상케이블카', mood: '이동, 여정', type: 'landmark' },
    YS03: { name: '돌산공원 야경', mood: '여운, 마무리', type: 'landmark' },
    YS04: { name: '돌산대교 야경', mood: '흐름, 전환', type: 'landmark' },
    YS05: { name: '향일암 일출', mood: '기적, 소원', type: 'anchor' },
    YS06: { name: '빅오 (Big-O)', mood: '시스템, 정답', type: 'landmark' },
    YS07: { name: '아쿠아플라넷', mood: '호기심, 발견', type: 'landmark' },
    YS08: { name: '진남관', mood: '역사, 무게감', type: 'landmark' },
    YS09: { name: '종포해양공원', mood: '산책, 일상', type: 'landmark' },
    YS10: { name: '여수수산시장', mood: '활기, 군중', type: 'landmark' }
  }
};

// ═══════════════════════════════════════════════════════════════
// §9 금지 키워드
// ═══════════════════════════════════════════════════════════════
const TIER1_BANNED = ['realistic', 'photorealistic', '3D', 'CGI', 'render', 'Unreal', 'Unity', 'cinema 4D', 'octane render'];

const TIER2_REPLACEMENTS = {
  'light': 'hand-painted glow / watercolor wash',
  'shadow': 'cel-shaded shadow / flat shadow',
  'reflection': 'painted highlight / simple shine mark',
  'depth': 'layered planes / painted distance',
  'camera move': '2D pan / 2D zoom'
};

// ═══════════════════════════════════════════════════════════════
// 4종 크리에이티브 설정
// ═══════════════════════════════════════════════════════════════
const CREATIVE_CONFIGS = {
  'healing-high': {
    archetype: 'healing_seeker',
    ltv: 'high',
    title: 'Healing-High — "괜찮은 척, 오늘도 했죠?"',
    tone: '깊은 공감, 내면 여정',
    costume: 'AUTUMN_COZY',
    backgroundMode: 'GENERIC',
    cta: '7일 회복 여정',
    musicBpm: '60–70',
    musicInstrument: 'soft piano + subtle ambient pad',
    musicRef: 'Ghibli OST — "A Town with an Ocean View" (Kiki\'s Delivery Service)',
    units: [
      {
        id: 'U1', time: '0–5s', phase: 'PAIN',
        emotion: 'Quiet Exhaustion (조용한 지침)',
        bg: 'GN03', bgDesc: 'Café window seat overlooking Yeosu sea at dusk.',
        aurumState: 'BASE', aurumDesc: '테이블 위 작게 앉아있음, halo 어둡게',
        scene: 'Sowoni sits alone by the window, chin resting on hand, eyes half-closed with quiet fatigue. A cold cup of tea sits untouched on the table (no readable text on cup). Aurum sits small on the table corner in BASE state — still, dim halo ring barely visible. Outside the window: painted grey-blue evening sea, muted coastal silhouette. Sea painted as flat backdrop (no 3D water simulation). No readable text anywhere. No signage. No UI.',
        styleTokens: [0, 1, 8], // Studio Ghibli, Korean webtoon, Kiki's
        beatA: 'Sowoni sits still. Slow single eye blink. A quiet exhale — lips part slightly then close. Camera: Gentle push-in toward her face. Aurum on the table, motionless, dim halo.',
        beatB: 'Her fingers tap once on the table absently. Her gaze shifts to the window. Aurum does a single slow blink — tiny eyes close and open. Outside: painted evening sea light dims slightly, subtle color shift. SFX cue: soft ambient hum.',
        beatC: '0.8s hold on Sowoni\'s profile against the window. Still frame. Painted sea backdrop visible behind her. Space reserved for post-edit subtitle overlay.',
        musicCue: 'single sparse piano note, cool reverb, quiet'
      },
      {
        id: 'U2', time: '5–10s', phase: 'SOLUTION',
        emotion: 'Inner Recognition (내면 인식)',
        bg: 'GN03', bgDesc: 'Same café interior. Color temperature shifting — desaturated grey gives way to soft golden undertones.',
        aurumState: 'OBSERVE', aurumDesc: '폰 쪽으로 고개 기울임',
        scene: 'Sowoni holds her phone in one hand. Phone screen shows ONLY abstract soft color blocks and gentle bubble shapes — no text, no UI, no numbers, no icons. Her eyes are slightly wider, a quiet flicker of curiosity. Aurum on the table, head tilted toward the phone (OBSERVE state). Watercolor halo ring faintly visible, slightly warmer than U1. Soft painted warm light begins to seep through the café window. Outside: painted sea backdrop, dusk transitioning to warmer tones. No readable text anywhere.',
        styleTokens: [0, 1, 2], // Studio Ghibli, Korean webtoon, Miyazaki
        beatA: 'Sowoni\'s hand lifts the phone slightly from the table. Abstract soft color blocks on phone screen shift gently — warm pastel hues pulse. Camera: Slow 2D pan from phone screen up to her eyes.',
        beatB: 'Soft bubble shapes on phone screen pulse with warmth. Sowoni\'s eyes widen slightly — a quiet flicker of recognition crosses her face. Aurum tilts head toward the phone (OBSERVE). Halo ring becomes faintly visible, warmer. Color temperature of the entire frame warms: cool grey washes transition to soft golden undertones. SFX cue: gentle rising tone.',
        beatC: '0.8s hold on Sowoni looking up from phone. Hint of softness in her expression — not yet a smile, but tension releasing. Aurum\'s halo ring holds steady warm glow. Space reserved for post-edit subtitle overlay.',
        musicCue: 'gentle chords added, warmth increasing, soft pad enters'
      },
      {
        id: 'U3', time: '10–15s', phase: 'SOLUTION',
        emotion: 'Hopeful Calm (평온한 희망)',
        bg: 'GN06', bgDesc: 'Painted sunrise beach backdrop (GN06). Warm golden wash, bright pastel watercolors, soft hand-painted glow on the horizon (NOT volumetric light).',
        aurumState: 'SPARKLE', aurumDesc: 'halo ring 밝아짐',
        scene: 'Sowoni stands at the shore, shoulders relaxed, gentle warm smile. Wind softly moves her hair (simple 2D flutter, not realistic hair physics). She holds a wish paper airplane (origami-style flat rendering) lightly in one hand. Aurum floats beside her at shoulder height in SPARKLE state — halo ring glowing soft gold, tiny limbs slightly spread. Painted ocean: flat watercolor sea wash, simple wave lines (no 3D water simulation). Sea painted as flat backdrop. Warm pastel sky with hand-painted clouds. No readable text anywhere.',
        styleTokens: [0, 1, 6], // Studio Ghibli, Korean webtoon, Totoro
        beatA: 'Sunrise painted beach. Sowoni stands, hair fluttering gently in wind (simple 2D flutter). Camera: Slow 2D pan from painted sea to Sowoni.',
        beatB: 'Sowoni lifts the wish paper airplane gently with one hand. Her expression softens into a warm smile — the first clear smile in the sequence. Aurum floats up to shoulder height (SPARKLE state). Halo ring glows soft gold. Tiny limbs slightly spread. Simple wave lines move on the painted sea backdrop. SFX cue: gentle ascending piano phrase.',
        beatC: '1.0s hold — Sowoni and Aurum together in frame against the sunrise backdrop. Sowoni holds the paper airplane at her side. Aurum hovers beside her, steady glow. Painted sea and sky fill the background. Warm, still, open. Space reserved for post-edit CTA subtitle overlay.',
        musicCue: 'soft upward arpeggio + ambient swell, open feel'
      }
    ],
    subtitles: [
      { time: '0–3s', text: '괜찮은 척, 오늘도 했죠?', font: '손글씨체', pos: '하단 중앙', color: 'White + soft shadow' },
      { time: '5–8s', text: '당신은 회복이 먼저 필요한 시기예요.', font: '손글씨체', pos: '하단 중앙', color: 'White → warm gold' },
      { time: '10–13s', text: '지금, 당신만을 위한 7일 회복 여정', font: '세리프체', pos: '중앙', color: '#9B87F5' },
      { time: '13–15s', text: '하루 3분이면 충분해요.', font: '손글씨체', pos: '하단 CTA 위', color: '#F5A7C6' }
    ]
  },

  'growth-high': {
    archetype: 'growth_builder',
    ltv: 'high',
    title: 'Growth-High — "매일 같은 하루, 어디로 가야 할지 모르겠죠?"',
    tone: '도전, 전진',
    costume: 'SPRING_CASUAL',
    backgroundMode: 'GENERIC',
    cta: '7일 성장 여정',
    musicBpm: '70–80',
    musicInstrument: 'soft piano + light rhythmic pad',
    musicRef: 'Ghibli OST — "Carrying You" (Laputa: Castle in the Sky)',
    units: [
      {
        id: 'U1', time: '0–5s', phase: 'PAIN',
        emotion: 'Stagnation (막막함)',
        bg: 'GN02', bgDesc: 'Quiet alley at night (GN02). Single painted streetlamp casting flat cel-shaded light pool.',
        aurumState: 'NIGHT_CALM', aurumDesc: '발밑 작게, 희미한 halo',
        scene: 'Sowoni stands still in the middle of the alley, looking ahead at a fork in the path. Her expression is contemplative — not sad, but directionless. Hands at her sides. A wish paper airplane is folded in her pocket (partially visible, origami-style flat rendering). Aurum sits near her feet in NIGHT_CALM state — small, still, halo ring dim blue. Painted backdrop: grey-blue buildings, muted alley walls, no readable signage. Distant painted sea horizon barely visible between buildings. No readable text anywhere. No shop signs. No posters.',
        styleTokens: [0, 1, 4], // Studio Ghibli, Korean webtoon, Spirited Away
        beatA: 'Sowoni stands still in the quiet alley. A slow blink. Night breeze gently moves her hair (simple 2D flutter). Camera: Gentle push-in from mid-shot to closer frame. Streetlamp light pool stays flat and still.',
        beatB: 'Sowoni shifts her weight slightly, tilts her head as if considering which path to take. Her hand moves to touch the paper airplane in her pocket — a small, uncertain gesture. Aurum at her feet does a slow blink, then turns head slightly toward one direction. Painted sky: a faint, barely perceptible warm edge appears on the horizon. SFX cue: distant soft ambient tone.',
        beatC: '0.8s hold on Sowoni from behind, facing the fork in the alley. Streetlamp, painted buildings, and faint sea horizon in view. Space reserved for post-edit subtitle overlay.',
        musicCue: 'single low piano note, sparse, cool reverb, quiet night atmosphere'
      },
      {
        id: 'U2', time: '5–10s', phase: 'SOLUTION',
        emotion: 'Inner Direction (방향 인식)',
        bg: 'GN02', bgDesc: 'Same quiet alley. Pre-dawn light enters from one end — cool grey softening to pale warm tones.',
        aurumState: 'GUIDE', aurumDesc: '산책로 방향으로 고개 돌림',
        scene: 'Sowoni holds her phone in one hand. Phone screen shows ONLY abstract soft color blocks shifting in a gentle directional flow (left to right) — no text, no UI, no numbers, no icons. Bubble shapes pulse softly on screen, as if suggesting a path. Her eyes are focused, a subtle shift from lost to attentive. Aurum at her feet turns head toward the lit end of the alley (GUIDE state). Halo ring shifts from dim blue to faint warm gold. Painted pre-dawn sky visible at the end of the alley — first warm tones appearing. No readable text anywhere.',
        styleTokens: [0, 1, 2], // Studio Ghibli, Korean webtoon, Miyazaki
        beatA: 'Sowoni\'s expression softens — eyes become slightly less tense, small head tilt. Camera: Gentle push-in toward the phone at her chest. Phone screen: abstract soft color blocks, static at first.',
        beatB: 'Abstract color blocks on phone screen softly rearrange into a directional flow (no text, no arrows, no icons). Bubble shapes pulse gently. Sowoni\'s gaze sharpens with quiet recognition. Aurum moves 2–3cm closer to the phone (GUIDE state), head tilted toward screen. Halo ring transitions from dim blue to faint warm gold. SFX cue: gentle ascending tone.',
        beatC: '1.0s hold. Sowoni lowers phone slightly, gaze lifting ahead. Warm golden wash increases subtly. Space reserved for post-edit subtitle overlay.',
        musicCue: 'gentle ascending chords, subtle rhythmic pulse enters'
      },
      {
        id: 'U3', time: '10–15s', phase: 'SOLUTION',
        emotion: 'First Step Forward (첫 걸음)',
        bg: 'GN01', bgDesc: 'Seaside walking path at dawn (GN01). Warm golden wash, bright pastel watercolors, soft hand-painted glow on the horizon (NOT volumetric light).',
        aurumState: 'SPARKLE', aurumDesc: '소원이 옆에서 함께 이동',
        scene: 'Sowoni walks forward along the path, mid-stride, one foot ahead. Her expression is calm and determined — a quiet confident smile. She holds the wish paper airplane (origami-style flat rendering) up in one hand, arm extended forward as if about to release it toward the sea. Aurum floats beside her at hip height in SPARKLE state — halo ring glowing warm gold, tiny limbs slightly spread, moving with her. Painted ocean: flat watercolor sea wash, simple wave lines. Sea painted as flat backdrop (no 3D water simulation). Dawn sky: warm pastel gradation, hand-painted clouds with pink and gold edges. No readable text anywhere.',
        styleTokens: [0, 1, 6], // Studio Ghibli, Korean webtoon, Totoro
        beatA: 'Dawn seaside walking path. Warm golden light. Sowoni walks forward, mid-stride. Hair and clothes flutter gently (simple 2D motion). Camera: Slow 2D pan alongside her walking direction.',
        beatB: 'Sowoni raises the wish paper airplane — arm extending forward. She releases it gently. The paper airplane glides ahead along the painted sea horizon (origami-style flat rendering, simple trajectory, no physics simulation). Her expression: calm confident smile. Aurum floats up to hip height (SPARKLE state), halo ring glows warm gold. SFX cue: soft upward piano phrase + gentle wind sound.',
        beatC: '1.0s hold — Sowoni mid-walk, paper airplane gliding ahead in the distance. Aurum beside her, warm dawn sea and sky behind them. Open, forward-facing composition. Space reserved for post-edit CTA subtitle overlay.',
        musicCue: 'confident arpeggio + ambient swell, forward momentum feel'
      }
    ],
    subtitles: [
      { time: '0–3s', text: '매일 같은 하루, 어디로 가야 할지 모르겠죠?', font: '손글씨체', pos: '하단 중앙', color: 'White + soft shadow' },
      { time: '5–8s', text: '당신 안에 이미 방향이 있어요.', font: '손글씨체', pos: '하단 중앙', color: 'White → warm gold' },
      { time: '10–13s', text: '지금, 당신의 7일 성장 여정이 시작됩니다', font: '세리프체', pos: '중앙', color: '#9B87F5' },
      { time: '13–15s', text: '하루 3분이면 충분해요.', font: '손글씨체', pos: '하단 CTA 위', color: '#F5A7C6' }
    ]
  },

  'healing-mid': {
    archetype: 'healing_seeker',
    ltv: 'mid',
    title: 'Healing-Mid — "오늘도 괜찮다고 말했죠?"',
    tone: '일상 공감, 나만 그런 게 아님',
    costume: 'SPRING_CASUAL',
    backgroundMode: 'GENERIC',
    cta: '3분 진단 시작',
    musicBpm: '55–65',
    musicInstrument: 'soft acoustic guitar + gentle ambient pad',
    musicRef: 'Ghibli OST — "Stroll" (My Neighbor Totoro)',
    units: [
      {
        id: 'U1', time: '0–5s', phase: 'PAIN',
        emotion: 'Pretending to be Fine (괜찮은 척)',
        bg: 'GN04', bgDesc: 'Park bench in the evening (GN04). Single painted streetlamp casting flat cel-shaded light.',
        aurumState: 'BASE', aurumDesc: '벤치 팔걸이 위 작게 앉아있음',
        scene: 'Sowoni sits on the bench, phone face-down on her lap, staring ahead. A faint forced smile on her face — the expression of someone who said "I\'m fine" all day. Hands resting loosely on the bench. Posture slightly slumped but not dramatic. Aurum sits small on the bench armrest in BASE state — still, halo ring dim. Painted backdrop: grey-blue park trees, muted evening sky, distant painted sea horizon. Other bench nearby is empty — she is alone in the frame. No readable text anywhere. No park signage. No posters.',
        styleTokens: [0, 1, 8],
        beatA: 'Sowoni on the park bench, still. A slow blink. Her forced faint smile fades into a neutral, tired expression — the mask dropping. Camera: Gentle push-in from mid-shot toward her face. Streetlamp light pool remains flat and still.',
        beatB: 'A light evening breeze moves her hair gently (simple 2D flutter). Her hand moves slightly on the bench — fingers uncurl, a small release of tension. Aurum on the armrest does a slow blink, then shifts weight. Painted park trees sway minimally. SFX cue: soft evening ambient.',
        beatC: '0.8s hold on Sowoni\'s profile, streetlamp and empty park behind her. Phone still face-down on her lap. Aurum small and still beside her. Space reserved for post-edit subtitle overlay.',
        musicCue: 'single soft guitar pluck, sparse, cool reverb'
      },
      {
        id: 'U2', time: '5–10s', phase: 'SOLUTION',
        emotion: 'Discovery — Not Alone (나만 그런 게 아님)',
        bg: 'GN04', bgDesc: 'Same park bench. Color temperature shifting — desaturated grey warming to soft golden tones.',
        aurumState: 'OBSERVE', aurumDesc: '하늘 쪽으로 고개 올림',
        scene: 'Sowoni holds her phone in one hand. Phone screen shows ONLY abstract soft color blocks and gentle bubble shapes — no text, no UI, no numbers, no icons. Her eyes lift from the phone and look upward at the sky. In the painted evening sky above: several small wish paper airplanes (origami-style flat rendering) float gently at different heights — visual metaphor for others already on this journey. 3–5 small paper airplanes, each a slightly different pastel tone, drifting slowly. Aurum on the armrest lifts head upward toward the paper airplanes (OBSERVE state). Halo ring shifts from dim to faintly warm. Sowoni\'s expression: quiet surprise, softening. No readable text anywhere.',
        styleTokens: [0, 1, 2],
        beatA: 'Sowoni picks up the phone from her lap. Abstract soft color blocks appear on screen, pulsing gently in warm tones. Camera: Slow 2D pan from phone up to her face, then continues upward to the sky.',
        beatB: 'Sowoni\'s gaze lifts from the phone to the sky. 3–5 small paper airplanes drift gently at different heights, each a slightly different pastel tone. Sowoni\'s eyes widen slightly — quiet surprise. Aurum lifts head upward (OBSERVE state), halo ring warms. Color temperature shifts: cool grey gives way to warm undertones. SFX cue: gentle wind chime.',
        beatC: '0.8s hold — Sowoni looking up at the paper airplanes, phone lowered. Small genuine expression of recognition. Paper airplanes continue slow drift above. Space reserved for post-edit subtitle overlay.',
        musicCue: 'gentle finger-picked chords, light wind chime, warmth entering'
      },
      {
        id: 'U3', time: '10–15s', phase: 'SOLUTION',
        emotion: 'Gentle Relief (가벼운 안도)',
        bg: 'GN01', bgDesc: 'Seaside walking path at sunset (GN01). Warm golden wash, bright pastel watercolors, soft hand-painted glow on the horizon (NOT volumetric light).',
        aurumState: 'COZY_BREEZE', aurumDesc: '소원이 옆에서 바람에 살랑',
        scene: 'Sowoni walks gently along the path — not striding, just an easy stroll. Her expression is a small, genuine, relaxed smile — not determined, just relieved. She holds her own wish paper airplane (origami-style flat rendering) loosely at her side. Above her: the same cluster of paper airplanes from U2 still float in the warm sky, now bathed in sunset gold — she is joining them, not leading alone. Aurum floats beside her at waist height in COZY_BREEZE state — tiny limbs relaxed, halo ring soft warm gold, gentle sway as if carried by breeze. Painted ocean: flat watercolor sea wash, simple wave lines. Sea painted as flat backdrop (no 3D water simulation). No readable text anywhere.',
        styleTokens: [0, 1, 6],
        beatA: 'Sunset seaside walking path. Warm golden light. Sowoni walks gently — easy stroll. Paper airplanes float in the warm sky above. Camera: Slow 2D pan alongside her.',
        beatB: 'Sowoni lifts her own paper airplane from her side, holds it loosely — not launching, just ready. A gesture of willingness. Her expression: small genuine relaxed smile. Aurum floats beside her (COZY_BREEZE state), halo ring soft warm gold, gentle sway. Simple wave lines shift on sea backdrop. Paper airplanes above drift alongside her. SFX cue: soft warm pad + gentle ascending tone.',
        beatC: '1.0s hold — Sowoni walking, paper airplane ready in hand, Aurum beside her, sunset sea behind, paper airplanes above. Open, warm composition. Invitation, not destination. Space reserved for post-edit CTA subtitle overlay.',
        musicCue: 'warm acoustic strum + soft ambient swell, comforting'
      }
    ],
    subtitles: [
      { time: '0–3s', text: '오늘도 괜찮다고 말했죠?', font: '손글씨체', pos: '하단 중앙', color: 'White + soft shadow' },
      { time: '5–8s', text: '혼자가 아니에요. 많은 분들이 여기서 시작했어요.', font: '손글씨체', pos: '하단 중앙', color: 'White → warm gold' },
      { time: '10–13s', text: '3분 진단으로, 나를 위한 첫 걸음', font: '세리프체', pos: '중앙', color: '#9B87F5' },
      { time: '13–15s', text: '지금 바로 시작해 보세요.', font: '손글씨체', pos: '하단 CTA 위', color: '#F5A7C6' }
    ]
  },

  'growth-mid': {
    archetype: 'growth_builder',
    ltv: 'mid',
    title: 'Growth-Mid — "멈춰 있는 기분, 익숙하죠."',
    tone: '방향 제시 + 낮은 진입장벽',
    costume: 'NIGHT_WALK',
    backgroundMode: 'YEOSU',
    cta: '3분 진단 시작',
    musicBpm: '65–75',
    musicInstrument: 'warm piano + light acoustic guitar + gentle chime',
    musicRef: 'Ghibli OST — "Carrying You" (Laputa) + 여수 밤바다 ambient',
    units: [
      {
        id: 'U1', time: '0–5s', phase: 'PAIN',
        emotion: 'Stuck / Hesitation (막막한 정지)',
        bg: 'YS02', bgDesc: 'YEOSU YS02 Sea Cable Car station area at night, painted backdrop style with layered flat planes.',
        aurumState: 'NIGHT_CALM', aurumDesc: '어깨 높이 부유, halo 어둡게',
        scene: 'Sowoni stands still, shoulders slightly tense, holding a flat origami wish paper airplane close to her palm — gripping it, not ready to let go. Her gaze is forward but unsure. Expression: quiet hesitation, not despair. Aurum floats near her shoulder level in NIGHT_CALM state — still, halo ring dim blue, barely visible against the night sky. Painted night sea visible behind the cable car silhouette. Sea painted as flat backdrop (no 3D water simulation). No readable text anywhere. No station signage. No UI.',
        styleTokens: [0, 1, 4],
        beatA: 'Sowoni stands still at the cable car station. A slow micro blink + small inhale. Her fingers grip the paper airplane a little tighter. Camera: Gentle push-in toward her face and the airplane in her hand.',
        beatB: 'Aurum\'s halo ring pulses once — very subtle, dim blue glow. Sowoni\'s gaze shifts slightly. Night breeze moves her hair gently (simple 2D flutter). Painted sea: simple wave lines shift minimally. SFX cue: quiet night ambient — distant sea, soft air.',
        beatC: '0.9s hold on Sowoni and Aurum, cable car station behind them. Still frame. Paper airplane in her hand, night sea beyond. Space reserved for post-edit subtitle overlay.',
        musicCue: 'single low piano note, sparse, cool reverb, night stillness'
      },
      {
        id: 'U2', time: '5–10s', phase: 'SOLUTION',
        emotion: 'Direction Appears (길이 보이기 시작)',
        bg: 'YS06', bgDesc: 'YEOSU YS06 Big-O area as painted backdrop. Pre-dawn light entering — cool grey softening.',
        aurumState: 'GUIDE', aurumDesc: '폰 쪽 접근, 방향 cue',
        scene: 'Sowoni holds her phone at chest height. Phone screen shows ONLY abstract soft color blocks + bubble shapes; blocks softly align into a gentle "flow" feeling — smooth directional arrangement, left to right (no arrows, no icons, no letters, no numbers). Her eyes are focused, gaze sharpening subtly. Aurum floats slightly closer to the phone in GUIDE state, subtle head tilt toward the screen, halo ring shifting from dim blue to faint warm gold. Big-O structure in painted backdrop — circular silhouette suggesting wholeness/direction. Color temperature: warm golden wash begins to enter. No readable text anywhere.',
        styleTokens: [3, 9, 0], // Naver webtoon, Solo Leveling, Studio Ghibli
        beatA: 'Sowoni\'s expression softens — eyes become slightly less tense, small head tilt. Camera: Gentle push-in toward the phone. Phone screen: abstract soft color blocks, static at first.',
        beatB: 'Abstract color blocks on phone screen softly rearrange into a directional flow. Bubble shapes pulse gently. Sowoni\'s gaze sharpens with quiet recognition. Aurum moves closer to the phone (GUIDE state), halo ring transitions from dim blue to faint warm gold. SFX cue: gentle ascending tone.',
        beatC: '1.0s hold. Sowoni lowers phone slightly, gaze lifting ahead. Warm golden wash increases subtly. Big-O silhouette in backdrop. Space reserved for post-edit subtitle overlay.',
        musicCue: 'gentle chords enter, light guitar texture, warmth building'
      },
      {
        id: 'U3', time: '10–15s', phase: 'SOLUTION',
        emotion: 'Confident First Step (작은 전진 확신)',
        bg: 'YS05', bgDesc: 'YEOSU YS05 Hyangiram sunrise (ANCHOR). Warm golden wash, bright pastel watercolors, soft hand-painted glow on the horizon (NOT volumetric light).',
        aurumState: 'SPARKLE', aurumDesc: '함께 전진',
        scene: 'Sowoni takes one small step forward (SAFE SPACE action) — not striding, a gentle first step. She gently releases the flat origami wish paper airplane forward; it drifts slightly ahead in simple 2D trajectory (no physics simulation). Her expression: calm quiet confidence — a small sure smile, not dramatic. Aurum floats beside her in SPARKLE state — halo ring glowing warm gold, tiny limbs slightly spread, moving with her step. Painted ocean: flat watercolor sea wash, simple wave lines. Sea painted as flat backdrop (no 3D water simulation). Sunrise sky: warm pastel wash, hand-painted golden clouds. Clean empty space in upper-right area for post-edit CTA. No readable text anywhere.',
        styleTokens: [2, 8, 5], // Miyazaki, Kiki's, True Beauty
        beatA: 'Hyangiram sunrise. Warm golden wash spreading. Sowoni stands, a small calm smile forming. Camera: Slow 2D pan from the sunrise sea to Sowoni.',
        beatB: 'Sowoni takes one small step forward — gentle, not dramatic. She releases the paper airplane gently; it drifts ahead in simple 2D trajectory. Aurum floats beside her in SPARKLE state, halo ring warm gold, moving with her. Simple wave lines shift on sea. SFX cue: soft piano phrase ascending + gentle paper-in-wind sound.',
        beatC: '1.0s hold — Sowoni mid-step, paper airplane drifting ahead. Aurum beside her, sunrise sea and sky behind. Wide open composition. Upper-right clean for CTA. Space reserved for post-edit subtitle overlay.',
        musicCue: 'confident ascending piano + ambient swell, paper-in-wind SFX'
      }
    ],
    subtitles: [
      { time: '0–2s', text: '멈춰 있는 기분, 익숙하죠.', font: '손글씨체', pos: '하단 중앙', color: 'White + soft shadow' },
      { time: '2–5s', text: '그런데 \'첫 방향\'은 생각보다 쉬워요.', font: '손글씨체', pos: '하단 중앙', color: 'White + soft shadow' },
      { time: '5–8.5s', text: '3분이면, 나에게 맞는 흐름이 보여요.', font: '손글씨체', pos: '하단 중앙', color: 'White → warm gold' },
      { time: '8.5–12s', text: '오늘은 \'딱 한 걸음\'만.', font: '세리프체', pos: '중앙', color: '#9B87F5' },
      { time: '12–15s', text: '지금 3분 진단 시작', font: '세리프체, bold', pos: '하단 CTA 위', color: '#F5A7C6' }
    ]
  }
};

module.exports = {
  STYLE_LOCK, BASE_LINES, BASE_LINE1, BASE_LINE2, BASE_LINE3,
  SOWONI_LOCK, AURUM_LOCK, TEXT_ZERO, NEGATIVE_PROMPT,
  SORA_I2V_COMMON, STYLE_TOKENS, COLOR_SCRIPT,
  COSTUMES, AURUM_STATES, BACKGROUNDS,
  TIER1_BANNED, TIER2_REPLACEMENTS,
  CREATIVE_CONFIGS
};
