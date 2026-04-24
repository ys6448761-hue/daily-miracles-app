/**
 * StarBirth.jsx — 3-phase 변환 애니메이션
 *
 * Phase 1  (0 → 0.8s)   wishText glow 표시 + 배경 파티클
 * Phase 2  (0.8 → 1.8s) 텍스트 blur 분해 → 중앙 ✦ flash 등장 + 배경 이미지 fade-in
 * Phase 3  (1.8 → 3.5s) "당신의 소원이 별이 되었어요 ✨" + wishText 재표시
 * CTA      (2.3s~)       첫 항해 시작(primary) / 이 순간 간직하기(secondary) — delay 0.5s 자연 노출
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

// ── 감정 선택 → 감정 문장 맵 ────────────────────────────────────────
const EMOTION_SENTENCE = {
  tired:    '조금 지쳤던 그 마음이, 이 별이 되었어요.',
  lonely:   '혼자인 것 같던 그 마음이, 이 별이 되었어요.',
  anxious:  '불안했던 그 마음이, 이 별이 되었어요.',
  hopeful:  '기대하던 그 마음이, 이 별이 되었어요.',
};

const BASE = import.meta.env.BASE_URL;

const GALAXY_LABEL = {
  growth:       '성장 은하',
  challenge:    '도전 은하',
  healing:      '치유 은하',
  relationship: '관계 은하',
};

const GALAXY_TO_DIRECTION = {
  growth:       'east',
  challenge:    'north',
  healing:      'south',
  relationship: 'west',
};

const FIRST_VOYAGE_MESSAGE = {
  growth:       '오늘, 이 별이 처음 빛나는 날입니다.',
  challenge:    '오늘, 첫 발걸음이 시작됩니다.',
  healing:      '오늘, 마음이 쉬어도 되는 날입니다.',
  relationship: '오늘, 마음이 닿기 시작하는 날입니다.',
};

// ── Phase 1 배경 파티클 (고정 좌표, Math.random 없음) ──
const BG_PARTICLES = [
  { top: '18%', left: '10%', size: 3, dur: 2.0, delay: 0.0 },
  { top: '12%', left: '80%', size: 2, dur: 1.8, delay: 0.4 },
  { top: '72%', left: '6%',  size: 4, dur: 2.2, delay: 0.8 },
  { top: '78%', left: '84%', size: 3, dur: 1.9, delay: 0.2 },
  { top: '42%', left: '3%',  size: 2, dur: 2.4, delay: 1.1 },
  { top: '48%', left: '92%', size: 2, dur: 2.1, delay: 0.6 },
  { top: '28%', left: '87%', size: 3, dur: 2.3, delay: 0.9 },
  { top: '88%', left: '38%', size: 2, dur: 1.7, delay: 0.3 },
  { top: '8%',  left: '45%', size: 2, dur: 2.0, delay: 0.7 },
];

// ── Phase 3 burst 파티클 (중앙 → 방사) ──
const BURST = [
  { x: -88, y: -78 }, { x:  88, y: -68 }, { x: -68, y:  58 }, { x:  78, y:  72 },
  { x:   0, y:-102 }, { x:-108, y:  12 }, { x: 108, y:  18 }, { x: -38, y:  88 },
  { x:  48, y: -96 }, { x: -98, y: -28 }, { x:  98, y: -48 }, { x:  28, y:  98 },
  { x: -58, y: -48 }, { x:  58, y: -38 }, { x: -28, y:  68 },
];

const STYLE = `
  @keyframes sb-float {
    0%, 100% { transform: translateY(0);     opacity: 0.5; }
    50%       { transform: translateY(-10px); opacity: 1;   }
  }
  @keyframes sb-glow-pulse {
    0%, 100% { box-shadow: 0 0 20px 4px rgba(255,215,106,0.16); }
    50%       { box-shadow: 0 0 52px 16px rgba(255,215,106,0.36); }
  }
  /* Phase 3 이후 별 living-state — 은은한 glow breathing */
  @keyframes sb-star-breathe {
    0%, 100% { filter: drop-shadow(0 0 12px rgba(255,215,106,0.45)) brightness(1);   }
    50%       { filter: drop-shadow(0 0 28px rgba(255,215,106,0.75)) brightness(1.15); }
  }
  /* 공유 성공 피드백 — fade-in → hold → fade-out */
  @keyframes sb-share-feedback {
    0%   { opacity: 0; transform: translateY(4px); }
    15%  { opacity: 1; transform: translateY(0); }
    75%  { opacity: 1; }
    100% { opacity: 0; }
  }
  .sb-share-feedback { animation: sb-share-feedback 1.8s ease forwards; }
`;

// ── sessionStorage 복원 헬퍼 ──────────────────────────────────────
const RECENT_STAR_KEY = 'dt_recent_star';

function loadRecentStar() {
  try {
    const raw = sessionStorage.getItem(RECENT_STAR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.starId ? parsed : null;
  } catch (_) { return null; }
}

export default function StarBirth() {
  const nav          = useNavigate();
  const { state }    = useLocation();

  // 복원 우선순위: location.state → sessionStorage → fallback
  const resolved = (state?.starId ? state : null) ?? loadRecentStar();

  const starId        = resolved?.starId        ?? null;
  const starName      = resolved?.starName      ?? '나의 별';
  const galaxy        = resolved?.galaxy        ?? null;
  const gemType       = resolved?.gemType       ?? null;
  const wishText      = resolved?.wishText      ?? '';
  const userId        = resolved?.userId        ?? null;
  const day1          = resolved?.day1          ?? DAY1_DEFAULT;
  const starRarity    = resolved?.starRarity    ?? 'standard';
  const sourceEvent   = resolved?.sourceEvent   ?? 'standard';
  const isLimited     = starRarity === 'limited';
  // galaxyDisplay: 항해(voyage) 등 외부 유입 시 '북은하' 등 커스텀 노출 가능
  const galaxyDisplay = resolved?.galaxyDisplay ?? null;
  const emotionChoice = resolved?.emotionChoice ?? null;

  const [resonanceCount] = useState(() => Math.floor(Math.random() * 10) + 3); // 3~12

  // phase: 1 → 2 → 3 → 'done'
  const [phase,      setPhase]      = useState(1);
  const [showCTA,    setShowCTA]    = useState(false);
  // 공유
  const [shareMsg,        setShareMsg]        = useState('');
  const [shareFeedback,   setShareFeedback]   = useState(''); // 공유 완료 피드백 텍스트
  const shareFeedbackRef = useRef(null);

  // ── 마운트 시 Kakao SDK 선제 초기화 ────────────────────────
  useEffect(() => {
    const ready = initKakao();
    console.log('[StarBirth] 마운트 — Kakao initKakao:', ready,
      '| window.Kakao:', !!window.Kakao,
      '| Kakao.Share:', !!window.Kakao?.Share,
      '| isInitialized:', window.Kakao?.isInitialized?.());
    logEvent('star_birth_view', { star_id: starId });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 타임라인 ────────────────────────────────────────────
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(2),       800),   // Phase 2: 텍스트 분해 + 별 flash
      setTimeout(() => setPhase(3),      1800),   // Phase 3: 결과 메시지
      setTimeout(() => setPhase('done'), 3500),   // done: GA 발화
      setTimeout(() => setShowCTA(true), 2300),   // CTA: 0.5s delay (1800+500)
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  // ── GA + 공유 메시지 초기화 ──────────────────────────────
  useEffect(() => {
    if (phase === 'done') {
      gaStarCreated({ gemType, galaxyType: galaxy });
      const msg = generateShareMessage(wishText);
      setShareMsg(msg);
      // wish_created 이벤트
      logEvent('wish_created', { star_id: starId, galaxy });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 공유 피드백 헬퍼 ────────────────────────────────────
  function showShareFeedback(text) {
    clearTimeout(shareFeedbackRef.current);
    setShareFeedback(text);
    shareFeedbackRef.current = setTimeout(() => setShareFeedback(''), 1800);
  }

  // ── 카카오 공유 ─────────────────────────────────────────
  const handleKakaoShare = useCallback(() => {
    logEvent('share_clicked', { star_id: starId, message_variant: shareMsg, platform: 'kakao' });

    const baseUrl = 'https://app.dailymiracles.kr';
    const imageUrl = `${baseUrl}/images/dreamtown-og-v4.jpg`;
    const linkUrl  = `${baseUrl}/my-star/${starId}`;

    const kakaoReady = initKakao();
    console.log('[StarBirth] Kakao 공유 시도 — initKakao:', kakaoReady,
      '| Kakao.Share:', !!window.Kakao?.Share,
      '| isInitialized:', window.Kakao?.isInitialized?.());

    try {
      if (kakaoReady && window.Kakao?.Share) {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '내 별이 탄생했어요 ✨',
            description: shareMsg,
            imageUrl,
            link: { mobileWebUrl: linkUrl, webUrl: linkUrl },
          },
        });
        logEvent('share_completed', { star_id: starId, platform: 'kakao' });
        showShareFeedback('카카오로 공유됐어요 ✨');
      } else {
        // 카카오 SDK 미초기화 → navigator.share 또는 링크 복사 fallback
        console.warn('[StarBirth] Kakao 미준비 — native share / clipboard fallback');
        if (navigator.share) {
          navigator.share({ title: '내 별이 탄생했어요 ✨', text: shareMsg, url: linkUrl })
            .then(() => {
              logEvent('share_completed', { star_id: starId, platform: 'native' });
              showShareFeedback('공유됐어요 ✨');
            })
            .catch(() => {});
        } else {
          navigator.clipboard?.writeText(linkUrl).then(() => {
            logEvent('share_completed', { star_id: starId, platform: 'copy_fallback' });
            showShareFeedback('링크가 복사됐어요 (카카오 준비 중)');
          }).catch(() => showShareFeedback('공유 링크: ' + linkUrl));
        }
      }
    } catch (e) {
      console.warn('[StarBirth] 카카오 공유 실패:', e.message);
      showShareFeedback('공유에 실패했어요');
    }
  }, [starId, shareMsg]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 링크 복사 (저장하기) ────────────────────────────────
  const handleCopyLink = useCallback(() => {
    const linkUrl = `https://app.dailymiracles.kr/my-star/${starId}`;
    logEvent('share_clicked', { star_id: starId, message_variant: shareMsg, platform: 'copy' });
    navigator.clipboard?.writeText(linkUrl).then(() => {
      logEvent('share_completed', { star_id: starId, platform: 'copy' });
      showShareFeedback('링크가 복사됐어요 ✨');
    }).catch(() => showShareFeedback('복사를 지원하지 않는 환경이에요'));
  }, [starId, shareMsg]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDay1Start(source = 'click') {
    // day1_start 로그 — fire-and-forget
    if (userId || starId) {
      logFlowEvent({
        userId: String(userId ?? starId),
        stage:  'growth',
        action: 'day1_start',
        value:  { starId, action_key: day1.action_key, source },
      });
    }
    gaFirstVoyageStart({ starId, galaxyCode: galaxy, direction: GALAXY_TO_DIRECTION[galaxy] ?? 'south' });
    const direction = GALAXY_TO_DIRECTION[galaxy] ?? 'south';
    const message   = FIRST_VOYAGE_MESSAGE[galaxy] ?? '오늘, 첫 항해가 시작됩니다.';
    if (starId) localStorage.setItem('dt_first_voyage_' + starId, 'started');
    nav('/day', { state: { direction, message, starId, isFirstVoyage: true, fromDay1: true }, replace: true });
  }

  // starId 없음 — state + sessionStorage 모두 유실
  // 기존 별 있으면 my-star로, 없으면 wish/select로 자연 이동 (막힌 화면 없음)
  if (!starId) {
    const saved = readSavedStar();
    nav(saved ? `/my-star/${saved}` : '/wish/select', { replace: true });
    return null;
  }

  const isDone      = phase === 'done';
  const bgVisible   = phase === 2 || phase === 3 || isDone;
  const showResult  = phase === 3 || isDone;
  const showStar    = phase !== 1;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#0D1B2A',
        padding: '40px 24px',
      }}
    >
      <style>{STYLE}</style>

      {/* ── 배경 이미지 — Phase 2부터 fade-in ── */}
      <motion.img
        src={`${BASE}images/dreamtown-main.jpg`}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
        animate={{ opacity: bgVisible ? 0.38 : 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      {/* 어두운 그라디언트 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(13,27,42,0.5) 0%, rgba(13,27,42,0.82) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Phase 1 배경 파티클 ── */}
      {BG_PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: p.top, left: p.left,
            width: p.size + 'px', height: p.size + 'px',
            borderRadius: '50%',
            background: '#FFD76A',
            animation: `sb-float ${p.dur}s ${p.delay}s ease-in-out infinite`,
            pointerEvents: 'none',
            opacity: phase === 1 ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
      ))}

      {/* ── Phase 3 burst 파티클 ── */}
      <AnimatePresence>
        {showResult && BURST.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], x: p.x, y: p.y }}
            transition={{ duration: 1.4, delay: i * 0.04, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: isLimited ? 6 : 5,
              height: isLimited ? 6 : 5,
              borderRadius: '50%',
              // 한정 별: 홀수 인덱스는 골드(#E8A000), 짝수는 기존 퍼플/옐로
              background: isLimited
                ? (i % 2 === 0 ? '#FFD76A' : '#E8A000')
                : '#FFD76A',
              boxShadow: isLimited ? `0 0 6px 2px ${i % 2 === 0 ? 'rgba(255,215,106,0.6)' : 'rgba(232,160,0,0.7)'}` : 'none',
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 340, textAlign: 'center' }}>

        {/* Phase 1: wishText glow 박스 */}
        <AnimatePresence>
          {phase === 1 && (
            <motion.div
              key="wish-glow"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(14px)', scale: 1.18 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{
                padding: '22px 24px',
                borderRadius: 20,
                background: 'rgba(255,215,106,0.07)',
                border: '1px solid rgba(255,215,106,0.28)',
                animation: 'sb-glow-pulse 2s ease-in-out infinite',
                marginBottom: 24,
              }}
            >
              {wishText ? (
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', lineHeight: 1.65, fontStyle: 'italic' }}>
                  &ldquo;{wishText}&rdquo;
                </p>
              ) : (
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>소원이 별이 되고 있어요...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 중앙 ✦ 별 아이콘 — Phase 2에 flash, 이후 glow 유지 ── */}
        <AnimatePresence>
          {showStar && (
            <motion.div
              key="star-icon"
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{
                scale:   [0.1, 2.8, 1.4, 1],
                opacity: [0,   1,   1,   1],
              }}
              transition={{ duration: 0.88, times: [0, 0.34, 0.65, 1], ease: 'easeOut' }}
              style={{
                fontSize: 76,
                lineHeight: 1,
                marginBottom: 16,
                display: 'inline-block',
                color: '#FFD76A',
                // Phase 3 이후: sb-star-breathe living-state 유지
                // Phase 2: flash는 framer-motion scale keyframe이 담당
                animation: showResult
                  ? 'sb-star-breathe 2.8s ease-in-out infinite'
                  : 'none',
              }}
            >
              ✦
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 3 + done: 결과 메시지 + wishText 재표시 */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* 메인 타이틀 */}
              <p style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8, lineHeight: 1.4 }}>
                이 마음이, 하나의 별이 되었어요 ✨
              </p>

              {/* Aurora5 고정 문장 */}
              <p style={{ fontSize: 13, color: 'rgba(255,215,106,0.75)', marginBottom: 6, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {'이미 당신 안에 있던 마음이,\n지금 이렇게 보이기 시작했어요.'}
              </p>

              {/* 감정 선택 반영 문장 */}
              {emotionChoice && EMOTION_SENTENCE[emotionChoice] && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, lineHeight: 1.6, fontStyle: 'italic' }}>
                  {EMOTION_SENTENCE[emotionChoice]}
                </p>
              )}

              {/* 공명 문장 */}
              <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.5)', marginBottom: 22, lineHeight: 1.5 }}>
                지금 이 순간, {resonanceCount}명이 비슷한 마음을 느끼고 있어요
              </p>

              {/* wishText 인용 재표시 */}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTA — 2.3s 후 자연 노출 (별 만들기 체험 / 별의 약속 분기) ── */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}
            >
              {/* ── 이 마음 나누기 ── */}
              <button
                onClick={handleKakaoShare}
                style={{
                  width: '100%',
                  padding: '16px 0',
                  borderRadius: 9999,
                  background: '#FFD76A',
                  color: '#0D1B2A',
                  fontSize: 16,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 32px 8px rgba(255,215,106,0.22)',
                  letterSpacing: '0.01em',
                }}
              >
                이 마음 나누기
              </button>

              {shareFeedback && (
                <p className="sb-share-feedback" style={{ fontSize: 12, color: 'rgba(255,215,106,0.8)', textAlign: 'center', marginTop: 4 }}>
                  {shareFeedback}
                </p>
              )}

              {/* ── 조용히 간직하기 ── */}
              <button
                onClick={() => nav(`/my-star/${starId}`, { replace: true })}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 9999,
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 15,
                  fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}
              >
                조용히 간직하기
              </button>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
