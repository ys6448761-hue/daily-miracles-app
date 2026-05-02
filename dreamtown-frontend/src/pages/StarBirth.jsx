/**
 * StarBirth.jsx — 4-Scene 별 탄생 흐름
 *
 * Scene 1: aurum     "아우룸이 당신의 소원을 담고 있어요" (2.5s)
 * Scene 2: cablecar  9:16 풀스크린 케이블카 영상 (끝날 때까지 or 10s)
 * Scene 3: starbirth 0.5s 정적 → ✦ 별 등장 (3.5s)
 * Scene 4: result    "이런 별이 만들어졌어요" + 이미지 + CTA
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { gaStarCreated, gaFirstVoyageStart } from '../utils/gtag';
import { readSavedStar } from '../lib/utils/starSession.js';
import { logFlowEvent } from '../api/dreamtown.js';
import { logEvent } from '../lib/events.js';
import { generateShareMessage } from '../lib/emotionMessage.js';
import { initKakao } from '../utils/kakaoShare.js';

const DAY1_DEFAULT = {
  message:    '지금 이 순간이 가장 중요해요',
  prompt:     '오늘 이 소원을 위한 작은 행동 하나를 적어볼까요?',
  cta:        '오늘의 작은 행동 시작',
  action_key: 'first_step',
};

const EMOTION_SENTENCE = {
  tired:    '조금 지쳤던 그 마음이, 이 별이 되었어요.',
  lonely:   '혼자인 것 같던 그 마음이, 이 별이 되었어요.',
  anxious:  '불안했던 그 마음이, 이 별이 되었어요.',
  hopeful:  '기대하던 그 마음이, 이 별이 되었어요.',
};

const EMOTION_SHARE_LABEL = {
  tired:   '조금 지쳤던 마음',
  lonely:  '혼자인 것 같던 마음',
  anxious: '불안했던 마음',
  hopeful: '기대하던 마음',
};

const GALAXY_TO_DIRECTION = {
  growth: 'east', challenge: 'north', healing: 'south', relationship: 'west',
};

const FIRST_VOYAGE_MESSAGE = {
  growth:       '오늘, 이 별이 처음 빛나는 날입니다.',
  challenge:    '오늘, 첫 발걸음이 시작됩니다.',
  healing:      '오늘, 마음이 쉬어도 되는 날입니다.',
  relationship: '오늘, 마음이 닿기 시작하는 날입니다.',
};

// Phase 3 burst 파티클
const BURST = [
  { x: -88, y: -78 }, { x:  88, y: -68 }, { x: -68, y:  58 }, { x:  78, y:  72 },
  { x:   0, y:-102 }, { x:-108, y:  12 }, { x: 108, y:  18 }, { x: -38, y:  88 },
  { x:  48, y: -96 }, { x: -98, y: -28 }, { x:  98, y: -48 }, { x:  28, y:  98 },
  { x: -58, y: -48 }, { x:  58, y: -38 }, { x: -28, y:  68 },
];

const STYLE = `
  @keyframes sb-star-breathe {
    0%, 100% { filter: drop-shadow(0 0 12px rgba(255,215,106,0.45)) brightness(1);   }
    50%       { filter: drop-shadow(0 0 28px rgba(255,215,106,0.75)) brightness(1.15); }
  }
  @keyframes sb-share-feedback {
    0%   { opacity: 0; transform: translateY(4px); }
    15%  { opacity: 1; transform: translateY(0); }
    75%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes sb-aurum-pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.08); }
  }
  @keyframes sb-text-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sb-share-feedback { animation: sb-share-feedback 1.8s ease forwards; }
`;

// ── 클라이언트 사이드 소원그림 fallback ──────────────────────────────────
const GALAXY_TO_STAGE2 = {
  challenge:    'curiosity',
  growth:       'calm',
  healing:      'pause',
  relationship: 'fragile_hope',
  miracle:      'confusion',
};
const EMOTION_BASE = { confusion: 1, pause: 6, calm: 11, curiosity: 16, fragile_hope: 21 };
const GEM_OFFSET   = { citrine: 0, sapphire: 1, emerald: 2, ruby: 3, amethyst: 4 };

function getStarImagePath(galaxy, gemType) {
  const emotion = GALAXY_TO_STAGE2[galaxy];
  if (!emotion) return null;
  const base   = EMOTION_BASE[emotion];
  const offset = GEM_OFFSET[gemType] ?? 0;
  const idx    = String(base + offset).padStart(2, '0');
  return `/images/star-cache/yeosu_cafe/${emotion}_${gemType}_${idx}.png`;
}

const RECENT_STAR_KEY = 'dt_recent_star';
function loadRecentStar() {
  try {
    const raw = sessionStorage.getItem(RECENT_STAR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.starId ? parsed : null;
  } catch (_) { return null; }
}

// ── Scene 1: 아우룸 ─────────────────────────────────────────────────
function AurumScene() {
  // eslint-disable-next-line no-console
  console.log('[AurumScene] mounted');
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 60%, #0c0820 0%, #060410 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 10,
    }}>
      {/* 중앙 아우룸 심볼 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,106,0.18) 0%, transparent 70%)',
          border: '1.5px solid rgba(255,215,106,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: 'rgba(255,215,106,0.8)',
          marginBottom: 28,
          animation: 'sb-aurum-pulse 2s ease-in-out infinite',
        }}
      >
        ✦
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.75)',
          textAlign: 'center',
          lineHeight: 1.65,
          letterSpacing: '0.02em',
        }}
      >
        아우룸이 당신의 소원을<br />담고 있어요
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        style={{
          fontSize: 12,
          color: 'rgba(255,215,106,0.35)',
          marginTop: 14,
          letterSpacing: '0.05em',
        }}
      >
        별이 탄생하고 있습니다...
      </motion.p>
    </div>
  );
}

// ── Scene 2: 케이블카 ────────────────────────────────────────────────
function CablecarScene({ onEnded }) {
  const videoRef = useRef(null);
  // eslint-disable-next-line no-console
  console.log('[CablecarScene] mounted');

  useEffect(() => {
    // 자동재생 실패 시 10s 후 강제 진행
    const t = setTimeout(onEnded, 10000);

    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {
        // autoplay blocked — 즉시 다음 씬으로
        clearTimeout(t);
        onEnded();
      });
    }
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ position: 'fixed', inset: 0, zIndex: 10, background: '#000' }}
    >
      <video
        ref={videoRef}
        src="/videos/cablecar-star-intro.mp4"
        onEnded={onEnded}
        muted
        playsInline
        autoPlay
        style={{
          position: 'absolute', inset: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </motion.div>
  );
}

// ── Scene 3: 별 탄생 ─────────────────────────────────────────────────
function StarBirthScene() {
  const [starVisible, setStarVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStarVisible(true),  500);  // 0.5s 정적 후 별 등장
    const t2 = setTimeout(() => setTextVisible(true), 1600);  // 별 이후 텍스트
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 50%, #0e0c28 0%, #06040f 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 10,
    }}>
      {/* burst 파티클 */}
      <AnimatePresence>
        {starVisible && BURST.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], x: p.x, y: p.y }}
            transition={{ duration: 1.4, delay: i * 0.04, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 5, height: 5,
              borderRadius: '50%',
              background: '#FFD76A',
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>

      {/* 별 */}
      <AnimatePresence>
        {starVisible && (
          <motion.div
            key="star-flash"
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: [0.1, 2.8, 1.4, 1], opacity: [0, 1, 1, 1] }}
            transition={{ duration: 0.88, times: [0, 0.34, 0.65, 1], ease: 'easeOut' }}
            style={{
              fontSize: 88, lineHeight: 1,
              color: '#FFD76A',
              animation: 'sb-star-breathe 2.8s ease-in-out infinite',
              position: 'relative', zIndex: 1,
            }}
          >
            ✦
          </motion.div>
        )}
      </AnimatePresence>

      {/* 텍스트 */}
      <AnimatePresence>
        {textVisible && (
          <motion.p
            key="birth-text"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              marginTop: 24,
              fontSize: 16,
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
              lineHeight: 1.6,
              position: 'relative', zIndex: 1,
            }}
          >
            이 마음이, 하나의 별이 되었어요
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────
export default function StarBirth() {
  const nav       = useNavigate();
  const { state } = useLocation();

  const resolved = (state?.starId ? state : null) ?? loadRecentStar();

  const starId        = resolved?.starId        ?? null;
  const starName      = resolved?.starName      ?? '나의 별';
  const galaxy        = resolved?.galaxy        ?? null;
  const gemType       = resolved?.gemType       ?? null;
  const wishText      = resolved?.wishText      ?? '';
  const userId        = resolved?.userId        ?? null;
  const day1          = resolved?.day1          ?? DAY1_DEFAULT;
  const starRarity    = resolved?.starRarity    ?? 'standard';
  const isLimited     = starRarity === 'limited';
  const emotionChoice = resolved?.emotionChoice ?? null;
  const imageUrl      = resolved?.imageUrl || getStarImagePath(resolved?.galaxy ?? null, resolved?.gemType ?? null) || null;
  const constellation = resolved?.constellation ?? null;
  const sourceEvent   = resolved?.sourceEvent   ?? 'standard';

  const [resonanceCount] = useState(() => Math.floor(Math.random() * 10) + 3);

  // eslint-disable-next-line no-console
  console.log('[StarBirth] sourceEvent:', sourceEvent, '| initialScene will be:', sourceEvent === 'cablecar' ? 'aurum' : 'starbirth');

  // 케이블카 QR → 풀 시네마틱(aurum → cablecar → starbirth → result)
  // 일반 소원 → 별 탄생부터 (starbirth → result)
  const initialScene = sourceEvent === 'cablecar' ? 'aurum' : 'starbirth';
  const [scene,   setScene]   = useState(initialScene);
  const [showCTA, setShowCTA] = useState(false);

  // 공유
  const [shareMsg,      setShareMsg]      = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const shareFeedbackRef = useRef(null);

  // eslint-disable-next-line no-console
  console.log('[StarBirth] scene:', scene);

  // Scene 1 자동 진행 (2.5s)
  useEffect(() => {
    if (scene !== 'aurum') return;
    const t = setTimeout(() => setScene('cablecar'), 2500);
    return () => clearTimeout(t);
  }, [scene]);

  // Scene 3 타임라인 — 0.5s 정적 → 별 → 3.5s 후 result
  useEffect(() => {
    if (scene !== 'starbirth') return;
    const t1 = setTimeout(() => setScene('result'), 3500);
    return () => clearTimeout(t1);
  }, [scene]);

  // Result CTA 지연 노출 (300ms)
  useEffect(() => {
    if (scene !== 'result') return;
    gaStarCreated({ gemType, galaxyType: galaxy });
    const msg = generateShareMessage(wishText);
    setShareMsg(msg);
    logEvent('wish_created', { star_id: starId, galaxy });

    const t = setTimeout(() => setShowCTA(true), 300);
    return () => clearTimeout(t);
  }, [scene]); // eslint-disable-line react-hooks/exhaustive-deps

  // 마운트
  useEffect(() => {
    initKakao();
    logEvent('star_birth_view', { star_id: starId });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 공유 피드백
  function showShareFeedback(text) {
    clearTimeout(shareFeedbackRef.current);
    setShareFeedback(text);
    shareFeedbackRef.current = setTimeout(() => setShareFeedback(''), 1800);
  }

  // 카카오 공유
  const handleKakaoShare = useCallback(() => {
    logEvent('share_clicked', { star_id: starId, message_variant: shareMsg, platform: 'kakao' });
    const baseUrl      = 'https://app.dailymiracles.kr';
    const ogImage      = `${baseUrl}/images/dreamtown-og-v4.jpg`;
    const linkUrl      = `${baseUrl}/star/${starId}?source=share`;
    const emotionLabel = EMOTION_SHARE_LABEL[emotionChoice] ?? '이 마음';
    const shareTitle   = `여수에서 시작된 하루, ${emotionLabel} ✨`;

    const kakaoReady = initKakao();
    try {
      if (kakaoReady && window.Kakao?.Share) {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: shareTitle,
            description: shareMsg,
            imageUrl: ogImage,
            link: { mobileWebUrl: linkUrl, webUrl: linkUrl },
          },
        });
        logEvent('share_completed', { star_id: starId, platform: 'kakao' });
        showShareFeedback('카카오로 공유됐어요 ✨');
      } else {
        if (navigator.share) {
          navigator.share({ title: shareTitle, text: shareMsg, url: linkUrl })
            .then(() => showShareFeedback('공유됐어요 ✨'))
            .catch(() => {});
        } else {
          navigator.clipboard?.writeText(linkUrl)
            .then(() => showShareFeedback('링크가 복사됐어요'))
            .catch(() => showShareFeedback('공유 링크: ' + linkUrl));
        }
      }
    } catch (e) {
      showShareFeedback('공유에 실패했어요');
    }
  }, [starId, shareMsg, emotionChoice]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDay1Start() {
    if (userId || starId) {
      logFlowEvent({
        userId: String(userId ?? starId),
        stage:  'growth',
        action: 'day1_start',
        value:  { starId, action_key: day1.action_key, source: 'click' },
      });
    }
    gaFirstVoyageStart({ starId, galaxyCode: galaxy, direction: GALAXY_TO_DIRECTION[galaxy] ?? 'south' });
    const direction = GALAXY_TO_DIRECTION[galaxy] ?? 'south';
    const message   = FIRST_VOYAGE_MESSAGE[galaxy] ?? '오늘, 첫 항해가 시작됩니다.';
    if (starId) localStorage.setItem('dt_first_voyage_' + starId, 'started');
    nav('/day', { state: { direction, message, starId, isFirstVoyage: true, fromDay1: true }, replace: true });
  }

  // starId 없음 fallback
  if (!starId) {
    const saved = readSavedStar();
    nav(saved ? `/my-star/${saved}` : '/wish/select', { replace: true });
    return null;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#06040f' }}>
      <style>{STYLE}</style>

      {/* ── Scene 1: Aurum ── */}
      <AnimatePresence>
        {scene === 'aurum' && (
          <motion.div key="aurum" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <AurumScene />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scene 2: Cablecar ── */}
      <AnimatePresence>
        {scene === 'cablecar' && (
          <CablecarScene key="cablecar" onEnded={() => setScene('starbirth')} />
        )}
      </AnimatePresence>

      {/* ── Scene 3: Star Birth ── */}
      <AnimatePresence>
        {scene === 'starbirth' && (
          <motion.div
            key="starbirth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <StarBirthScene />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scene 4: Result ── */}
      <AnimatePresence>
        {scene === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'linear-gradient(180deg, #0D1B2A 0%, #060e1a 100%)',
              overflowY: 'auto',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '48px 24px 80px',
            }}
          >
            <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>

              {/* 제목 */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.4 }}
              >
                이런 별이 만들어졌어요
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ fontSize: 13, color: 'rgba(255,215,106,0.65)', marginBottom: 24, lineHeight: 1.7 }}
              >
                이미 당신 안에 있던 마음이,<br />지금 이렇게 보이기 시작했어요.
              </motion.p>

              {/* 별 심볼 */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  fontSize: 56,
                  color: '#FFD76A',
                  marginBottom: imageUrl ? 16 : 24,
                  animation: 'sb-star-breathe 2.8s ease-in-out infinite',
                  display: 'inline-block',
                }}
              >
                ✦
              </motion.div>

              {/* 소원그림 */}
              {imageUrl && (
                <motion.img
                  src={imageUrl}
                  alt="나의 별"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  style={{
                    width: '100%',
                    maxWidth: 240,
                    borderRadius: 16,
                    marginBottom: 20,
                    display: 'block',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 40px rgba(255,215,106,0.2)',
                  }}
                />
              )}

              {/* 감정 문장 */}
              {emotionChoice && EMOTION_SENTENCE[emotionChoice] && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, lineHeight: 1.6, fontStyle: 'italic' }}>
                  {EMOTION_SENTENCE[emotionChoice]}
                </p>
              )}

              {/* 공명 */}
              <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.45)', marginBottom: 22, lineHeight: 1.5 }}>
                지금 이 순간, {resonanceCount}명이 비슷한 마음을 느끼고 있어요
              </p>

              {/* wishText 인용 */}
              {wishText && (
                <p style={{
                  fontSize: 13,
                  color: 'rgba(255,215,106,0.62)',
                  fontStyle: 'italic',
                  padding: '12px 18px',
                  borderRadius: 14,
                  background: 'rgba(255,215,106,0.06)',
                  border: '1px solid rgba(255,215,106,0.16)',
                  lineHeight: 1.65,
                  marginBottom: 28,
                }}>
                  &ldquo;{wishText}&rdquo;
                </p>
              )}

              {/* CTA */}
              <AnimatePresence>
                {showCTA && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}
                  >
                    <button
                      onClick={handleKakaoShare}
                      style={{
                        width: '100%', padding: '16px 0',
                        borderRadius: 9999,
                        background: '#FFD76A', color: '#0D1B2A',
                        fontSize: 16, fontWeight: 700,
                        border: 'none', cursor: 'pointer',
                        boxShadow: '0 0 32px 8px rgba(255,215,106,0.22)',
                        fontFamily: 'sans-serif',
                      }}
                    >
                      이 마음 나누기
                    </button>

                    {shareFeedback && (
                      <p className="sb-share-feedback" style={{ fontSize: 12, color: 'rgba(255,215,106,0.8)', textAlign: 'center', marginTop: 4 }}>
                        {shareFeedback}
                      </p>
                    )}

                    <button
                      onClick={() => nav(`/my-star/${starId}`, { replace: true })}
                      style={{
                        width: '100%', padding: '14px 0',
                        borderRadius: 9999,
                        background: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 15, fontWeight: 500,
                        border: '1px solid rgba(255,255,255,0.12)',
                        cursor: 'pointer',
                        fontFamily: 'sans-serif',
                      }}
                    >
                      조용히 간직하기
                    </button>

                    {constellation && (
                      <button
                        onClick={() => nav(`/constellation/${encodeURIComponent(constellation)}`)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'rgba(255,215,106,0.45)',
                          fontSize: 13, cursor: 'pointer',
                          padding: '6px 0',
                          textDecoration: 'underline',
                          textUnderlineOffset: 3,
                          fontFamily: 'sans-serif',
                        }}
                      >
                        이 감정을 가진 별들 보기
                      </button>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
