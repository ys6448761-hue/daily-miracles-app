/**
 * generateResonanceHint
 *
 * 소원 텍스트(wishText) 또는 은하 코드(galaxyCode)로부터
 * 공명 힌트 4종을 생성한다.
 *
 * 우선순위: wishText 키워드 분석 → fallback: galaxyCode 매핑
 *
 * 반환값:
 *   emotionTag   — 감정 방향 (한 단어)
 *   growthMessage — 성장 묘사 한 문장
 *   supportType  — 공명 방향 유형
 *   publicLine   — 외부 노출용 한 줄 (원문 소원 미포함)
 */

// ── 키워드 → emotionKey ──────────────────────────────────────────
const EMOTION_KEYWORDS = [
  { key: 'courage',    re: /무서|두려|겁나|도전|해내|이겨|극복|용기/ },
  { key: 'healing',   re: /아프|힘들|치유|쉬고|위로|회복|지쳐|상처/ },
  { key: 'connection', re: /가족|친구|관계|사랑|연결|함께|사람|혼자/ },
  { key: 'miracle',   re: /기적|간절|꼭|바라|이루어|소원/ },
];

function getEmotionKey(wishText) {
  if (!wishText) return null;
  for (const { key, re } of EMOTION_KEYWORDS) {
    if (re.test(wishText)) return key;
  }
  return null;
}

// ── galaxyCode → emotionKey ──────────────────────────────────────
const GALAXY_EMOTION = {
  growth:       'growth',
  challenge:    'courage',
  healing:      'healing',
  relationship: 'connection',
  miracle:      'miracle',
};

// ── emotionKey → 각 필드 ─────────────────────────────────────────
const EMOTION_TAG = {
  growth:     '성장',
  courage:    '용기',
  healing:    '위로',
  connection: '연결',
  miracle:    '기적',
};

const GROWTH_MESSAGE = {
  growth:     '조금씩 나아가고 있어요',
  courage:    '두려움 속에서도 버티고 있어요',
  healing:    '천천히 회복해가고 있어요',
  connection: '마음을 이어가고 있어요',
  miracle:    '기적을 향해 나아가고 있어요',
};

const SUPPORT_TYPE = {
  growth:     '응원',
  courage:    '공감',
  healing:    '위로',
  connection: '연결',
  miracle:    '기적',
};

const PUBLIC_LINE = {
  growth:     '성장을 향해 나아가는 별이에요.',
  courage:    '용기를 내어 도전 중인 별이에요.',
  healing:    '치유를 바라는 마음이 담긴 별이에요.',
  connection: '연결을 원하는 마음의 별이에요.',
  miracle:    '간절한 소원을 품은 별이에요.',
};

/**
 * @param {{ wishText?: string, galaxyCode?: string }} param
 * @returns {{ emotionTag: string, growthMessage: string, supportType: string, publicLine: string }}
 */
export function generateResonanceHint({ wishText, galaxyCode } = {}) {
  const emotionKey =
    getEmotionKey(wishText) ??
    GALAXY_EMOTION[galaxyCode] ??
    'growth';

  return {
    emotionTag:    EMOTION_TAG[emotionKey]    ?? '성장',
    growthMessage: GROWTH_MESSAGE[emotionKey] ?? '조금씩 나아가고 있어요',
    supportType:   SUPPORT_TYPE[emotionKey]   ?? '응원',
    publicLine:    PUBLIC_LINE[emotionKey]    ?? '소원을 향해 나아가는 별이에요.',
  };
}
