import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { gaStarCreated } from '../utils/gtag';

const STAGES = [
  { key: 'seed',           emoji: '✨', text: '빛구슬이 떠오릅니다...',         sub: 'A light is rising from the sea.' },
  { key: 'aurum',          emoji: '🐢', text: '아우룸이 나타났습니다.',         sub: 'Aurum has appeared.' },
  { key: 'constellation',  emoji: '🌌', text: '황금 거북 별자리가 빛납니다.',   sub: 'The Golden Turtle Constellation shines.' },
  { key: 'star',           emoji: '⭐', text: '소원이 별이 되었습니다',         sub: 'Your wish is now a star.' },
];

const GALAXY_LABEL = {
  growth:       '성장 은하',
  challenge:    '도전 은하',
  healing:      '치유 은하',
  relationship: '관계 은하',
};

// 고정 파티클 좌표 (Math.random 제거 → 렌더 일관성 보장)
const PARTICLES = [
  { x: -90, y: -80 }, { x:  90, y: -70 }, { x: -70, y:  60 }, { x:  80, y:  75 },
  { x:   0, y:-100 }, { x:-110, y:  10 }, { x: 110, y:  20 }, { x: -40, y:  90 },
  { x:  50, y: -95 }, { x:-100, y: -30 }, { x: 100, y: -50 }, { x:  30, y: 100 },
];

export default function StarBirth() {
  const nav = useNavigate();
  const { state } = useLocation();
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);

  const starId    = state?.starId;
  const starName  = state?.starName  || '나의 별';
  const galaxy    = state?.galaxy    ?? null;
  const gemType   = state?.gemType   ?? null;

  useEffect(() => {
    if (stage >= STAGES.length - 1) {
      const t = setTimeout(() => setDone(true), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [stage]);

  // 별 생성 완료 → GA4 star_created (1회)
  useEffect(() => {
    if (!done) return;
    gaStarCreated({ gemType, galaxyType: galaxy });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 배경 파티클 — 고정 좌표, Math.random 없음 */}
      <AnimatePresence>
        {done && PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: p.x, y: p.y }}
            transition={{ duration: 1.5, delay: i * 0.06 }}
            className="absolute w-2 h-2 rounded-full bg-star-gold pointer-events-none"
          />
        ))}
      </AnimatePresence>

      {/* 메인 아이콘 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-8xl mb-6"
        >
          {STAGES[stage].emoji}
        </motion.div>
      </AnimatePresence>

      {/* 단계 텍스트 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${stage}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5"
        >
          <p className="text-xl font-semibold text-white mb-2">{STAGES[stage].text}</p>
          <p className="text-white/40 text-sm">{STAGES[stage].sub}</p>
        </motion.div>
      </AnimatePresence>

      {/* 진행 바 — 애니메이션 중에만 노출, done 후 사라짐 */}
      {!done && (
        <div className="flex gap-2 mb-8">
          {STAGES.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= stage ? 'bg-star-gold w-8' : 'bg-white/20 w-4'
              }`}
            />
          ))}
        </div>
      )}

      {/* 완료 — 별 이름 + CTA (자동 이동 없음, 사용자가 직접 선택) */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center w-full"
          >
            <p className="text-star-gold text-2xl font-bold glow-gold mb-1">{starName}</p>
            {galaxy && (
              <p className="text-white/40 text-xs mb-2">
                {GALAXY_LABEL[galaxy] ?? galaxy} · D+1
              </p>
            )}
            <p className="text-white/50 text-sm mb-6">오늘부터 이 별이 빛나기 시작합니다</p>

            <p className="text-white/40 text-xs mb-8">
              🐢 &quot;오늘 밤, 새로운 별이 태어났습니다.&quot;
            </p>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => nav(`/my-star/${starId}`)}
                className="w-full max-w-xs bg-star-gold text-night-sky font-bold py-4 rounded-2xl text-lg"
              >
                내 별 만나러 가기 ✦
              </button>
              <button
                onClick={() => nav('/home', { state: { newStarId: starId, newStarName: starName } })}
                className="text-white/30 text-xs hover:text-white/50 transition-colors py-2"
              >
                광장 구경하기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
