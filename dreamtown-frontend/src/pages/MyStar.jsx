import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getStar, getGalaxyStars } from '../api/dreamtown.js';
import { useDreamtownStore } from '../store/dreamtownStore';
import AURUM_MESSAGES from '../constants/aurumMessages';

const STAGE_DAYS = {
  day1:   'Day 1',
  day7:   'Day 7',
  day30:  'Day 30',
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

function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(
    1,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1,
  );
}

function getAurumMessage(daysSinceBirth) {
  return AURUM_MESSAGES.find(m => m.day === daysSinceBirth)
    ?? AURUM_MESSAGES[AURUM_MESSAGES.length - 1];
}

export default function MyStar() {
  const { id } = useParams();
  const nav = useNavigate();
  const [star, setStar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galaxyStars, setGalaxyStars] = useState([]);
  const { setStarData } = useDreamtownStore();

  useEffect(() => {
    getStar(id)
      .then((data) => {
        setStar(data);
        setStarData({
          starName:       data.star_name,
          starGalaxyName: data.galaxy?.name_ko ?? null,
          starCreatedAt:  data.created_at,
        });
        // 같은 은하 별 목록 (자신 제외, 최대 5개)
        if (data.galaxy?.code) {
          getGalaxyStars(data.galaxy.code, { limit: 5, exclude: data.star_id })
            .then(r => setGalaxyStars(r.stars ?? []))
            .catch(() => setGalaxyStars([]));
        }
      })
      .catch(() => {
        setStar(DEMO_STAR);
        setStarData({
          starName:       DEMO_STAR.star_name,
          starGalaxyName: DEMO_STAR.galaxy?.name_ko ?? null,
          starCreatedAt:  DEMO_STAR.created_at,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">별을 불러오는 중...</p>
      </div>
    );
  }

  const daysSinceBirth = calcDaysSinceBirth(star.created_at);
  const aurumMsg = getAurumMessage(daysSinceBirth);

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

        {/* 아우룸 메시지 — 별 이름 바로 위 */}
        <p style={{ fontSize: 12, color: '#9B87F5', fontStyle: 'italic', marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>🐢</span> {aurumMsg.text}
        </p>

        <h1 className="text-2xl font-bold text-star-gold glow-gold mb-2">
          {star.star_name}
        </h1>

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
              {new Date(star.created_at).toLocaleDateString('ko-KR')} (D+{daysSinceBirth})
            </p>
          </div>
        </div>
      </motion.div>

      {/* 같은 은하 별들 — 2개 이상일 때만 표시 */}
      {galaxyStars.length >= 2 && (
        <div className="mb-6">
          <p className="text-white/40 text-xs mb-3">같은 은하 별들</p>

          {/* 가로 스크롤 카드 */}
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {galaxyStars.map((s) => {
              const d = calcDaysSinceBirth(s.created_at);
              return (
                <div
                  key={s.star_id}
                  className="flex-shrink-0 bg-white/5 border border-white/8 rounded-2xl px-4 py-3 text-center"
                  style={{ minWidth: 120 }}
                >
                  <p className="text-white/80 text-xs font-medium leading-tight mb-1">
                    {s.star_name}
                  </p>
                  <p className="text-white/35 text-[11px]">D+{d}</p>
                </div>
              );
            })}
          </div>

          {/* 은하 전체 보기 */}
          <button
            onClick={() => nav(`/galaxy?highlight=${star.galaxy.code}`)}
            className="mt-3 text-white/35 text-xs hover:text-white/55 transition"
          >
            은하 전체 보기 →
          </button>
        </div>
      )}

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
