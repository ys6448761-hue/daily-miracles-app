import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import IntroScene from './IntroScene.jsx';
import { readSavedStar } from '../lib/utils/starSession.js';

export default function AppLaunch() {
  const nav = useNavigate();
  const [showIntro, setShowIntro]       = useState(false);
  const [starCount, setStarCount]       = useState(null);   // null = 로딩 중
  const [brightestStar, setBrightestStar] = useState(null); // 오늘의 빛난 별 이름

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

  // 별 카운터 + 오늘의 빛난 별 로드
  useEffect(() => {
    fetch('/api/dt/stars/count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count != null) setStarCount(d.count); })
      .catch(() => {});

    fetch('/api/dt/stars/today')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const stars = d?.stars ?? [];
        if (stars.length > 0) setBrightestStar(stars[0].star_name);
      })
      .catch(() => {});
  }, []);

  if (showIntro) {
    return <IntroScene onFinish={() => setShowIntro(false)} />;
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/dreamtown-main.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/45 pointer-events-none" />

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

      {/* 콘텐츠 — 오버레이 위 */}
      <div className="relative z-10 flex flex-col items-center w-full">

        {/* 거북 별자리 상징 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="mb-8 text-7xl"
        >
          🐢
        </motion.div>

        {/* 로고 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-3xl font-bold text-star-gold glow-gold text-center mb-3"
        >
          DreamTown
        </motion.h1>

        {/* 슬로건 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-white/70 text-sm text-center mb-16"
        >
          여수 바다에서 시작된 하늘.
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
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
            transition={{ delay: 1.6, duration: 0.6 }}
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

        {/* 오늘의 빛난 별 (선택) */}
        {brightestStar && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.6 }}
            style={{
              marginTop: 8,
              fontSize: 11,
              color: 'rgba(255,255,255,0.38)',
              textAlign: 'center',
            }}
          >
            오늘 가장 빛난 별 — {brightestStar}
          </motion.p>
        )}
      </div>
    </div>
  );
}
