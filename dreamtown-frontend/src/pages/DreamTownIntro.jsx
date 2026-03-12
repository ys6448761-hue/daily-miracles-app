import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SCENES = [
  { text: '소원은 바다에서 태어납니다', sub: 'Every wish begins in the sea.' },
  { text: '아우룸이 소원을 안내합니다', sub: 'Aurum guides your wish to the stars.' },
  { text: '소원은 별이 됩니다', sub: 'Your wish becomes a star.' },
];

export default function DreamTownIntro() {
  const [scene, setScene] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    if (scene >= SCENES.length) return;
    const timer = setTimeout(() => {
      if (scene < SCENES.length - 1) setScene(s => s + 1);
    }, 2200);
    return () => clearTimeout(timer);
  }, [scene]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12">
      {/* Skip */}
      <button
        onClick={() => nav('/wish')}
        className="self-end text-white/40 text-sm hover:text-white/70 transition-colors"
      >
        Skip
      </button>

      {/* Scene */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            {/* 씬 아이콘 */}
            <div className="text-6xl mb-8">
              {scene === 0 ? '🌊' : scene === 1 ? '🐢' : '⭐'}
            </div>

            <p className="text-2xl font-semibold text-white leading-relaxed mb-3">
              {SCENES[scene].text}
            </p>
            <p className="text-white/50 text-sm">
              {SCENES[scene].sub}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* 씬 인디케이터 */}
        <div className="flex gap-2 mt-12">
          {SCENES.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === scene ? 'bg-star-gold w-5' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: scene === SCENES.length - 1 ? 1 : 0 }}
        onClick={() => nav('/wish')}
        className="w-full max-w-xs bg-star-gold text-night-sky font-bold py-4 rounded-2xl text-lg"
      >
        Start My Wish
      </motion.button>
    </div>
  );
}
