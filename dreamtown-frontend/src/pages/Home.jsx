import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getRecentStars, getStar } from '../api/dreamtown.js';

const GALAXY_STYLE = {
  growth:       { label: '성장 은하', cls: 'bg-blue-500/20 text-blue-300' },
  challenge:    { label: '도전 은하', cls: 'bg-orange-500/20 text-orange-300' },
  healing:      { label: '치유 은하', cls: 'bg-green-500/20 text-green-300' },
  relationship: { label: '관계 은하', cls: 'bg-pink-500/20 text-pink-300' },
};

function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1);
}

// ── 내 별 카드 (옵션 A + B 동시 구현) ────────────
function MyStarCard({ star, isNew, nav }) {
  // 옵션 B: "여기예요 ✨" 툴팁 — 1.5초 후 자동 사라짐
  const [showHere, setShowHere] = useState(isNew);
  useEffect(() => {
    if (!isNew) return;
    const t = setTimeout(() => setShowHere(false), 1500);
    return () => clearTimeout(t);
  }, [isNew]);

  const daysSince = calcDaysSinceBirth(star.created_at);
  const galaxy = GALAXY_STYLE[star.galaxy_code] ?? { label: star.galaxy_name_ko ?? '미지의 은하', cls: 'bg-white/10 text-white/50' };

  return (
    <div className="relative mb-4">
      {/* 옵션 B: 툴팁 */}
      <AnimatePresence>
        {showHere && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-star-gold text-night-sky text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap z-10"
          >
            여기예요 ✨
          </motion.div>
        )}
      </AnimatePresence>

      {/* 옵션 A: 진입 시 1회 펄스 + 카드 */}
      <motion.div
        // 옵션 A pulse: isNew일 때 0.8초 딜레이 후 한 번 커졌다 돌아옴
        animate={isNew ? { scale: [1, 1.06, 1] } : {}}
        transition={isNew ? { duration: 1.0, delay: 0.6, ease: 'easeInOut' } : {}}
        onClick={() => nav(`/my-star/${star.star_id}`)}
        className="bg-white/5 border border-star-gold/40 rounded-3xl p-5 cursor-pointer hover:border-star-gold/70 transition-colors"
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
            <p className="text-white/70 text-sm font-medium">{star.star_name}</p>
          </div>
          <span className="ml-auto text-white/30 text-sm">→</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs px-2 py-1 rounded-full ${galaxy.cls}`}>{galaxy.label}</span>
          <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded-full">D+{daysSince}</span>
        </div>
      </motion.div>
    </div>
  );
}

// ── 광장 별 카드 (compact) ──────────────────────
function StarItem({ star }) {
  const daysSince = calcDaysSinceBirth(star.created_at);
  const galaxy = GALAXY_STYLE[star.galaxy_code] ?? { label: star.galaxy_name_ko ?? '미지의 은하', cls: 'bg-white/10 text-white/50' };

  return (
    <Link
      to={`/star/${star.star_id}`}
      className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/10 active:bg-white/15 rounded-xl px-1 -mx-1 transition-colors no-underline"
    >
      <span className="text-lg">✦</span>
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-sm font-medium truncate">{star.star_name}</p>
        <p className="text-white/35 text-xs">D+{daysSince}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${galaxy.cls}`}>
        {galaxy.label}
      </span>
    </Link>
  );
}

export default function Home() {
  const nav = useNavigate();
  const { state } = useLocation();

  const newStarId   = state?.newStarId   ?? null;
  const newStarName = state?.newStarName ?? null;

  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myStarData, setMyStarData] = useState(null);

  // 사용자 본인의 star_id (localStorage)
  const myStarId = localStorage.getItem('dt_star_id');

  useEffect(() => {
    // 광장 목록 + 내 별 독립 조회 병렬 실행
    const recentPromise = getRecentStars(13)
      .then(r => setStars(r.stars ?? []))
      .catch(() => setStars([]));

    const myStarPromise = myStarId
      ? getStar(myStarId)
          .then(data => setMyStarData({
            star_id:        data.star_id,
            star_name:      data.star_name,
            star_stage:     data.star_stage,
            galaxy_code:    data.galaxy?.code ?? null,
            galaxy_name_ko: data.galaxy?.name_ko ?? null,
            created_at:     data.created_at,
          }))
          .catch(() => {})
      : Promise.resolve();

    Promise.all([recentPromise, myStarPromise]).finally(() => setLoading(false));
  }, [myStarId]);

  // 내 별 / 다른 별 분리
  const otherStars = stars.filter(s => s.star_id !== myStarId);
  const myStarDisplay = myStarData;

  const isNewStar = !!(newStarId && myStarId === newStarId);

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-24">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-white/40 text-xs">DreamTown</p>
        <h1 className="text-2xl font-bold text-white mt-1">
          {isNewStar ? '별이 탄생했어요 ⭐' : '안녕하세요 ✨'}
        </h1>
        <p className="text-white/50 text-sm mt-1">당신의 소원은 혼자가 아닙니다.</p>
      </motion.div>

      {/* 내 별 카드 */}
      {myStarDisplay && (
        <div className="relative z-10 mb-0">
          <MyStarCard
            star={myStarDisplay}
            isNew={isNewStar}
            nav={nav}
          />
        </div>
      )}

      {/* 광장 — 다른 별들 */}
      <div className="relative z-10 bg-white/3 border border-white/8 rounded-3xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/60 text-sm font-medium">광장의 별들</p>
          <p className="text-white/30 text-xs">{stars.length}개</p>
        </div>

        {loading ? (
          <p className="text-white/30 text-xs text-center py-4">별을 불러오는 중...</p>
        ) : otherStars.length === 0 ? (
          <p className="text-white/30 text-xs text-center py-4">아직 광장에 별이 없어요</p>
        ) : (
          <div>
            {otherStars.map(s => <StarItem key={s.star_id} star={s} />)}
          </div>
        )}
      </div>

      {/* Aurum 메시지 */}
      <div className="bg-dream-purple/10 border border-dream-purple/20 rounded-3xl p-5 mb-4 pointer-events-none">
        <p className="text-white/40 text-xs mb-2">🐢 Aurum</p>
        <p className="text-white text-sm leading-relaxed">
          "당신의 소원은 이미 별이 되고 있어요."
        </p>
      </div>

      {/* 탭 바 */}
      <BottomTab active="home" myStarId={myStarId} />
    </div>
  );
}

function BottomTab({ active, myStarId }) {
  const nav = useNavigate();
  const tabs = [
    { key: 'home',   label: 'Home',    path: '/home',                              emoji: '🏠' },
    { key: 'wish',   label: 'Wish',    path: '/wish',                              emoji: '✨' },
    { key: 'mystar', label: 'My Star', path: myStarId ? `/my-star/${myStarId}` : '/wish', emoji: '⭐' },
  ];
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
      <nav className="max-w-md mx-auto bg-night-sky border-t border-white/10 flex pointer-events-auto">
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
      </nav>
    </div>
  );
}
