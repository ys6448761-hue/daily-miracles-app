import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { readSavedStar } from '../lib/utils/starSession.js';
import InviteIntro from './InviteIntro.jsx';
import WishInputScreen from './WishInputScreen.jsx';
import StarDetail from './StarDetail.jsx';

// import.meta.env.BASE_URL: dev='/', prod='/dreamtown/'
const BASE = import.meta.env.BASE_URL;

/**
 * /dreamtown — 공개 입구 (Public Entry)
 *
 * scene 상태 머신:
 *  'intro'     — ?entry=invite 진입 시 단일 인트로 화면 (InviteIntro)
 *  'wish'      — invite CTA → WishInputScreen
 *  'dreamtown' — 직접 진입: 용궁 + 아우룸 비주얼 세계관 시작 화면
 *
 * 정책:
 *  - QR 1개 진입, 상품 선택 화면 없음
 *  - invite 유입: InviteIntro → WishInputScreen
 *  - 일반 진입: 용궁 비주얼 → "내 소원 남기기 ✦" → /wish (케이블카 인트로)
 */
export default function DreamTown() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const isInvite    = searchParams.get('entry') === 'invite';
  const starIdParam = searchParams.get('starId');

  const [hasExistingStar, setHasExistingStar] = useState(false);
  const [scene, setScene] = useState(
    isInvite && !starIdParam ? 'intro' : 'dreamtown'
  );

  useEffect(() => {
    if (isInvite && starIdParam) return;
    localStorage.removeItem('dt_star_id');
    const saved = readSavedStar();
    if (saved) setHasExistingStar(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── invite + starId → 특정 별 상세 바로 표시 ──────────────────────
  if (isInvite && starIdParam) {
    return <StarDetail starId={starIdParam} viewMode="public" />;
  }

  // ── Scene: intro (invite 전용) ─────────────────────────────────────
  if (scene === 'intro') {
    return <InviteIntro onStart={() => setScene('wish')} />;
  }

  // ── Scene: wish (invite 소원 입력) ────────────────────────────────
  if (scene === 'wish') {
    return <WishInputScreen onBack={() => setScene('intro')} />;
  }

  // ── Scene: dreamtown (세계관 시작 / 용궁 + 아우룸 비주얼) ───────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>

      {/* 배경 이미지 — 용궁 + 아우룸 비주얼 */}
      <motion.img
        src={`${BASE}images/intro/intro-03-transform.jpg`}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.88 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* 어두운 그라디언트 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.85) 100%)',
      }} />

      {/* 카피 + CTA — 하단 고정 */}
      <div style={{
        position: 'absolute', bottom: 0,
        width: '100%',
        padding: '0 28px 52px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* 메인 카피 */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{
            fontSize: 'clamp(22px, 5.5vw, 26px)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.95)',
            whiteSpace: 'pre-line',
            lineHeight: 1.78,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 20px rgba(0,0,0,0.7)',
            marginBottom: 40,
          }}
        >
          {'지금,\n당신의 소원이\n별이 되는 순간'}
        </motion.p>

        {/* Primary CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/wish')}
          style={{
            width: '100%',
            maxWidth: 320,
            padding: '17px 0',
            borderRadius: 9999,
            background: '#FFD76A',
            color: '#0D1B2A',
            fontSize: 17,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 32px 10px rgba(255,215,106,0.28)',
            letterSpacing: '0.02em',
            marginBottom: 12,
          }}
        >
          내 소원 남기기 ✦
        </motion.button>

        {/* Secondary CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          onClick={() => navigate('/stars')}
          style={{
            width: '100%',
            maxWidth: 320,
            padding: '14px 0',
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.60)',
            fontSize: 14,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          다른 별 보기
        </motion.button>

        {/* 기존 별 보유자 */}
        {hasExistingStar && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}
          >
            이미 만든 별이 있나요?{' '}
            <button
              onClick={() => navigate('/my-star')}
              style={{ textDecoration: 'underline', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              내 별로 돌아가기
            </button>
          </motion.p>
        )}
      </div>
    </div>
  );
}
