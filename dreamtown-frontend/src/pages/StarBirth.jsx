import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const STAGES = [
  { key: 'seed',        emoji: '✨', text: '빛구슬이 떠오릅니다...',          sub: 'A light is rising from the sea.' },
  { key: 'aurum',       emoji: '🐢', text: '아우룸이 나타났습니다.',          sub: 'Aurum has appeared.' },
  { key: 'constellation', emoji: '🌌', text: '황금 거북 별자리가 빛납니다.',  sub: 'The Golden Turtle Constellation shines.' },
  { key: 'star',        emoji: '⭐', text: '당신의 소원이',                sub: '별이 되어 빛나기 시작했습니다' },
];

export default function StarBirth() {
  const nav = useNavigate();
  const { state } = useLocation();
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);

  const starId   = state?.starId;
  const starName = state?.starName || '나의 별';
  const galaxy   = state?.galaxy   || 'growth';

  useEffect(() => {
    if (stage >= STAGES.length - 1) {
      setTimeout(() => setDone(true), 1000);
      return;
    }
    const t = setTimeout(() => setStage(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [stage]);

  // 애니메이션 완료 후 My Star로 자동 이동
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      nav(starId ? `/my-star/${starId}` : '/home');
    }, 3000);
    return () => clearTimeout(t);
  }, [done, starId, nav]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 배경 파티클 */}
      <AnimatePresence>
        {done && [...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: (Math.random() - 0.5) * 200,
              y: (Math.random() - 0.5) * 200,
            }}
            transition={{ duration: 1.5, delay: i * 0.08 }}
            className="absolute w-2 h-2 rounded-full bg-star-gold"
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
          className="text-8xl mb-8"
        >
          {STAGES[stage].emoji}
        </motion.div>
      </AnimatePresence>

      {/* 텍스트 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${stage}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >
          <p className="text-xl font-semibold text-white mb-2">
            {STAGES[stage].text}
          </p>
          <p className="text-white/40 text-sm">
            {STAGES[stage].sub}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* 별 이름 표시 (마지막 단계) */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-4 mb-12"
          >
            <p className="text-star-gold text-2xl font-bold glow-gold">{starName}</p>
            <p className="text-white/50 text-sm mt-1">이 별의 이름입니다</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 진행 바 */}
      <div className="flex gap-2 mb-12">
        {STAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i <= stage ? 'bg-star-gold w-8' : 'bg-white/20 w-4'
            }`}
          />
        ))}
      </div>

      {/* Aurum 메시지 */}
      <AnimatePresence>
        {done && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-white/40 text-xs mb-6 text-center"
          >
            🐢 "작은 소원이 별이 되었습니다."
          </motion.p>
        )}
      </AnimatePresence>

      {/* View My Star 버튼 */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <button
              whileTap={{ scale: 0.97 }}
              onClick={() => nav(starId ? `/my-star/${starId}` : '/home')}
              className="w-full max-w-xs bg-star-gold text-night-sky font-bold py-4 rounded-2xl text-lg"
            >
              View My Star ⭐
            </button>
            <p className="text-white/30 text-xs">잠시 후 자동으로 이동합니다</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
