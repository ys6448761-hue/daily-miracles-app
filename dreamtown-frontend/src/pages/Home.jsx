import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Founding Star #0001 데모용 고정 ID
const FIRST_STAR_ID = '00000000-0000-0000-0000-000000000004';

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-24">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-white/40 text-xs">DreamTown</p>
        <h1 className="text-2xl font-bold text-white mt-1">안녕하세요 ✨</h1>
        <p className="text-white/50 text-sm mt-1">당신의 소원은 혼자가 아닙니다.</p>
      </motion.div>

      {/* 내 별 미리보기 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => nav(`/my-star/${FIRST_STAR_ID}`)}
        className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-4 cursor-pointer hover:border-star-gold/50 transition-colors"
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-3xl"
          >
            ⭐
          </motion.span>
          <div>
            <p className="text-star-gold font-semibold text-sm">내 별</p>
            <p className="text-white/40 text-xs">Origin Star</p>
          </div>
          <span className="ml-auto text-white/30 text-sm">→</span>
        </div>
        <p className="text-white/60 text-sm">"조금 더 나아지기를"</p>
        <div className="flex gap-2 mt-3">
          <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full">성장 은하</span>
          <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded-full">Day 1</span>
        </div>
      </motion.div>

      {/* Aurum 메시지 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-dream-purple/10 border border-dream-purple/20 rounded-3xl p-5 mb-4"
      >
        <p className="text-white/40 text-xs mb-2">🐢 Aurum</p>
        <p className="text-white text-sm leading-relaxed">
          "당신의 별이 빛나길."
        </p>
      </motion.div>

      {/* Galaxy 진입 유도 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => nav('/galaxy')}
        className="bg-white/5 border border-white/10 rounded-3xl p-5 cursor-pointer hover:border-white/20 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-white/60 text-xs mb-1">추천 탐험</p>
            <p className="text-white font-semibold text-sm">드림타운 은하지도</p>
          </div>
          <span className="text-2xl">🌌</span>
        </div>
        <p className="text-white/40 text-xs">4개 은하에서 별 이야기를 만나보세요 →</p>
      </motion.div>

      {/* 탭 바 */}
      <BottomTab active="home" />
    </div>
  );
}

function BottomTab({ active }) {
  const nav = useNavigate();
  const tabs = [
    { key: 'home',   label: 'Home',   path: '/home',   emoji: '🏠' },
    { key: 'wish',   label: 'Wish',   path: '/wish',   emoji: '✨' },
    { key: 'galaxy', label: 'Galaxy', path: '/galaxy', emoji: '🌌' },
    { key: 'mystar', label: 'My Star',path: `/my-star/${FIRST_STAR_ID}`, emoji: '⭐' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-night-sky/90 backdrop-blur border-t border-white/10 flex">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => nav(t.path)}
          className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
            active === t.key ? 'text-star-gold' : 'text-white/30 hover:text-white/60'
          }`}
        >
          <span className="text-lg">{t.emoji}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
