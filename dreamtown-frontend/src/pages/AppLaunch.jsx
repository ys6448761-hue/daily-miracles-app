import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import IntroScene from './IntroScene.jsx';

export default function AppLaunch() {
  const nav = useNavigate();
  // 최초 방문자에게만 IntroScene 노출 (재방문은 즉시 /my-star 진입)
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const starId = localStorage.getItem('dt_star_id');
    if (starId) {
      // 재방문: 즉시 My Star로
      nav(`/my-star/${starId}`, { replace: true });
    } else {
      // 최초 방문: IntroScene 실행
      setShowIntro(true);
    }
  }, [nav]);

  if (showIntro) {
    return <IntroScene onFinish={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 배경 별빛 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-star-gold star-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

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
        className="text-white/60 text-sm text-center mb-16"
      >
        여수 바다에서 시작된 하늘.
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => nav('/intro')}
        className="w-full max-w-xs bg-dream-purple hover:bg-purple-500 text-white font-semibold py-4 rounded-2xl text-lg transition-colors"
      >
        Enter DreamTown
      </motion.button>
    </div>
  );
}
