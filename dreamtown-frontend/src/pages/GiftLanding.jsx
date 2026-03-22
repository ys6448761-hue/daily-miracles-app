import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getGiftCard } from '../api/dreamtown.js';

const GALAXY_STYLE = {
  growth:       { label: '성장 은하', cls: 'bg-blue-500/20 text-blue-300' },
  challenge:    { label: '도전 은하', cls: 'bg-orange-500/20 text-orange-300' },
  healing:      { label: '치유 은하', cls: 'bg-green-500/20 text-green-300' },
  relationship: { label: '관계 은하', cls: 'bg-pink-500/20 text-pink-300' },
};

export default function GiftLanding() {
  const { star_id } = useParams();
  const nav = useNavigate();
  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [aurumVisible, setAurumVisible] = useState(false);

  useEffect(() => {
    getGiftCard(star_id)
      .then(data => {
        if (!data) { setNotFound(true); return; }
        setGift(data);
        // 아우룸은 별 등장 후 2.5초 뒤 조용히 등장
        setTimeout(() => setAurumVisible(true), 2500);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [star_id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/40 text-sm">별을 불러오는 중...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
        <p className="text-5xl">✦</p>
        <p className="text-white/60 text-center text-sm leading-relaxed">
          소원별의 선물을 찾을 수 없어요.<br />링크가 만료됐거나 존재하지 않는 별이에요.
        </p>
        <button
          onClick={() => nav('/wish')}
          className="bg-dream-purple hover:bg-purple-500 text-white font-semibold py-3 px-8 rounded-2xl transition-colors text-sm"
        >
          나도 내 별 만들기 →
        </button>
      </div>
    );
  }

  const galaxyStyle = GALAXY_STYLE[gift.galaxy?.code] ?? {
    label: gift.galaxy?.name_ko ?? '미지의 은하',
    cls: 'bg-white/10 text-white/50',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">

      {/* 별 등장 애니메이션 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          className="text-7xl mb-5"
        >
          ⭐
        </motion.div>

        <h1 className="text-2xl font-bold text-star-gold glow-gold mb-3">
          {gift.star_name}
        </h1>

        <span className={`text-xs px-3 py-1 rounded-full ${galaxyStyle.cls}`}>
          {galaxyStyle.label} ✨
        </span>
      </motion.div>

      {/* 선물 카피 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8 }}
        className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6 w-full max-w-xs text-center"
      >
        <p className="text-white/75 text-base leading-relaxed italic">
          &ldquo;{gift.copy_text}&rdquo;
        </p>
      </motion.div>

      {/* 구분선 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="w-12 h-px bg-white/15 mb-6"
      />

      {/* 아우룸 메시지 */}
      <AnimatePresence>
        {aurumVisible && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 px-4"
          >
            <p className="text-white/35 text-xs mb-2">🐢 Aurum</p>
            <p className="text-white/55 text-sm leading-relaxed italic">
              &ldquo;나는 너에게 별을 따다 줄 수 없어.<br />
              하지만 너의 별을 만들어줄 수 있어.&rdquo;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="w-full max-w-xs"
      >
        <button
          onClick={() => nav('/wish')}
          className="w-full bg-dream-purple hover:bg-purple-500 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          나도 내 별 만들기 →
        </button>
      </motion.div>

      {/* 하단 문구 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="text-white/25 text-xs mt-6 text-center"
      >
        소원별은 이제 두 사람의 하늘에 있어요.
      </motion.p>
    </div>
  );
}
