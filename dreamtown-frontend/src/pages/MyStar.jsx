import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getStar } from '../api/dreamtown.js';

const STAGE_DAYS = {
  day1: 'Day 1',
  day7: 'Day 7',
  day30: 'Day 30',
  day100: 'Day 100',
  day365: 'Day 365',
};

// Founding Stars fallback (API 실패 시 데모용)
const DEMO_STAR = {
  star_id:    '00000000-0000-0000-0000-000000000004',
  star_name:  'Origin Star',
  wish_text:  '조금 더 나아지기를',
  galaxy:     { code: 'growth', name_ko: '성장 은하' },
  constellation: null,
  star_stage: 'day1',
  created_at: '2026-03-11T00:00:00Z',
};

export default function MyStar() {
  const { id } = useParams();
  const nav = useNavigate();
  const [star, setStar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStar(id)
      .then(setStar)
      .catch(() => setStar(DEMO_STAR))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">별을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => nav(-1)} className="text-white/40 hover:text-white/70">← 뒤로</button>
        <p className="text-white/40 text-xs">내 별</p>
        <div className="w-8" />
      </div>

      {/* 별 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-6xl mb-4"
        >
          ⭐
        </motion.div>

        <h1 className="text-2xl font-bold text-star-gold glow-gold mb-2">
          {star.star_name}
        </h1>

        <div className="bg-white/5 rounded-2xl p-4 mb-4">
          <p className="text-white/40 text-xs mb-1">소원</p>
          <p className="text-white text-base leading-relaxed">"{star.wish_text}"</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-white/40 text-xs mb-1">은하</p>
            <p className="text-white text-sm font-medium">{star.galaxy.name_ko}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-white/40 text-xs mb-1">성장 단계</p>
            <p className="text-white text-sm font-medium">{STAGE_DAYS[star.star_stage] || star.star_stage}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 col-span-2">
            <p className="text-white/40 text-xs mb-1">탄생일</p>
            <p className="text-white text-sm">
              {new Date(star.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 감성 문구 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-white/40 text-sm mb-8"
      >
        당신의 소원은 혼자가 아닙니다.
      </motion.p>

      {/* CTA */}
      <div className="flex gap-3 mt-auto">
        <button
          onClick={() => nav('/galaxy')}
          className="flex-1 bg-dream-purple hover:bg-purple-500 text-white font-semibold py-4 rounded-2xl transition-colors"
        >
          은하 탐험하기
        </button>
        <button
          onClick={() => nav('/wish')}
          className="flex-1 bg-white/5 border border-white/10 text-white/70 font-semibold py-4 rounded-2xl hover:bg-white/10 transition-colors"
        >
          새 소원 만들기
        </button>
      </div>
    </div>
  );
}
