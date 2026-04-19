import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { readSavedStar } from '../lib/utils/starSession.js';
import InviteIntro from './InviteIntro.jsx';
import WishInputScreen from './WishInputScreen.jsx';
import StarDetail from './StarDetail.jsx';

/**
 * /dreamtown — 공개 입구 (Public Entry)
 *
 * scene 상태 머신:
 *  'cablecar'  — 직접 진입 시 케이블카 인트로 영상 화면
 *  'intro'     — ?entry=invite 진입 시 단일 인트로 화면 (InviteIntro)
 *  'wish'      — "시작하기 ✦" CTA → WishInputScreen (즉시 전환)
 *  'dreamtown' — 광장 화면 (인트로 건너뛰기)
 *
 * 정책:
 *  - localStorage 있어도 자동 복귀 금지
 *  - invite 유입: 인트로 → 입력, 단계 없음
 *  - 일반 진입: 케이블카 인트로 → /wish
 */
export default function DreamTown() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const isInvite    = searchParams.get('entry') === 'invite';
  const starIdParam = searchParams.get('starId');

  const [hasExistingStar, setHasExistingStar] = useState(false);
  const [scene, setScene] = useState(
    isInvite && !starIdParam ? 'intro' : 'cablecar'
  );
  const [videoFailed, setVideoFailed] = useState(false);

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

  // ── Scene: wish (소원 입력) ────────────────────────────────────────
  if (scene === 'wish') {
    return <WishInputScreen onBack={() => setScene('intro')} />;
  }

  // ── Scene: cablecar (케이블카 인트로 — 직접 진입 기본 화면) ─────────
  if (scene === 'cablecar') {
    return (
      <div className="relative w-full min-h-screen overflow-hidden bg-black flex flex-col items-center justify-end pb-16 px-6">

        {/* 영상 배경 */}
        {!videoFailed ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            src="/assets/brand/intro/cablecar-star-intro.mp4"
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.72 }}
          />
        ) : (
          <img
            src="/assets/brand/core/cablecar-star-intro.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-black/48 pointer-events-none" />

        {/* 건너뛰기 */}
        <button
          onClick={() => setScene('dreamtown')}
          className="absolute top-5 right-5 text-xs px-3 py-1.5 z-10"
          style={{ color: 'rgba(255,255,255,0.30)' }}
        >
          건너뛰기
        </button>

        {/* 카피 + CTA */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-xs">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9 }}
            style={{
              fontSize: 'clamp(22px, 6vw, 28px)',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.95)',
              textAlign: 'center',
              whiteSpace: 'pre-line',
              lineHeight: 1.75,
              letterSpacing: '-0.01em',
              textShadow: '0 2px 24px rgba(0,0,0,0.7)',
              marginBottom: 48,
            }}
          >
            {'지금,\n당신의 소원이\n별이 되는 순간'}
          </motion.p>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/wish')}
            style={{
              width: '100%',
              padding: '18px 0',
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

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            onClick={() => navigate('/stars')}
            style={{
              width: '100%',
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

          {hasExistingStar && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
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

  // ── Scene: dreamtown (광장 — 건너뛰기 후) ─────────────────────────
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0D1B2A] px-6">
      <div className="mb-14 text-center">
        <div
          className="mx-auto mb-6 h-3 w-3 rounded-full bg-[#9B87F5]"
          style={{ boxShadow: '0 0 18px 5px rgba(155,135,245,0.4)' }}
        />
        <h1 className="text-lg font-medium text-white/80">
          드림타운에 오신 걸 환영해요
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/40">
          소원을 품은 별들이 모이는 곳이에요.
          <br />
          당신의 별을 만들어보세요.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => navigate('/wish')}
          className="w-full rounded-full bg-[#9B87F5] py-3.5 text-sm font-medium text-white"
        >
          내 소원 남기기 ✦
        </button>
      </div>

      {hasExistingStar && (
        <p className="mt-10 text-xs text-white/25">
          이미 만든 별이 있나요?{' '}
          <button
            onClick={() => navigate('/my-star')}
            className="underline underline-offset-4 hover:text-white/40 transition-colors"
          >
            내 별로 돌아가기
          </button>
        </p>
      )}
    </main>
  );
}
