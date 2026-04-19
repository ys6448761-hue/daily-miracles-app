import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import IntroScene from './IntroScene.jsx';
import { readSavedStar } from '../lib/utils/starSession.js';

export default function AppLaunch() {
  const nav = useNavigate();
  const [showIntro, setShowIntro]       = useState(false);
  const [starCount, setStarCount]       = useState(null);
  const [videoFailed, setVideoFailed]   = useState(false);

  useEffect(() => {
    const pathname = window.location.pathname.replace(/\/+/g, '/');
    const isPublicEntry =
      pathname === '/dreamtown' ||
      new URLSearchParams(window.location.search).get('entry') === 'invite';

    if (isPublicEntry) {
      nav('/dreamtown', { replace: true });
      return;
    }

    const starId = readSavedStar();
    if (starId) {
      nav(`/my-star/${starId}`, { replace: true });
    } else {
      setShowIntro(true);
    }
  }, [nav]);

  useEffect(() => {
    fetch('/api/dt/stars/count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count != null) setStarCount(d.count); })
      .catch(() => {});
  }, []);

  if (showIntro) {
    return <IntroScene onFinish={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* 영상 배경 — 2.5초 fade-in으로 자연스러운 여운 */}
      {!videoFailed ? (
        <motion.video
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.72 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          autoPlay
          muted
          loop
          playsInline
          src="/assets/brand/intro/cablecar-star-intro.mp4"
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <img
          src="/assets/brand/core/cablecar-star-intro.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      {/* 별빛 파티클 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-star-gold star-twinkle"
            style={{
              width:  Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top:    Math.random() * 100 + '%',
              left:   Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center w-full">

        {/* 카피 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1.2 }}
          style={{
            fontSize: 'clamp(22px, 6vw, 30px)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            whiteSpace: 'pre-line',
            lineHeight: 1.75,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 24px rgba(0,0,0,0.7)',
            marginBottom: 56,
          }}
        >
          {'지금,\n당신의 소원이\n별이 되는 순간'}
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.0, duration: 0.8 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => nav('/wish')}
          style={{
            width: '100%',
            maxWidth: 320,
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
          }}
        >
          내 소원 남기기 ✦
        </motion.button>

        {/* 실시간 별 카운터 */}
        {starCount != null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.5, duration: 0.8 }}
            style={{
              marginTop: 28,
              fontSize: 13,
              color: 'rgba(255,215,106,0.75)',
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
          >
            지금까지 <strong style={{ color: '#FFD76A' }}>{starCount.toLocaleString()}</strong>개의 별이 태어났어요 ✨
          </motion.p>
        )}
      </div>
    </div>
  );
}
