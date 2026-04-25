import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecentStars, getStar, getFeaturedStars, getTrendingStars, getTopTodayStars } from '../api/dreamtown.js';
import { readSavedStar } from '../lib/utils/starSession.js';

// ── 상수 ──────────────────────────────────────────
const GALAXY_STYLE = {
  growth:       { label: '성장 은하', cls: 'bg-blue-500/20 text-blue-300' },
  challenge:    { label: '도전 은하', cls: 'bg-orange-500/20 text-orange-300' },
  healing:      { label: '치유 은하', cls: 'bg-green-500/20 text-green-300' },
  relationship: { label: '관계 은하', cls: 'bg-pink-500/20 text-pink-300' },
};

const HERO_CHOICES = ['조금 가벼웠어요', '조금 지쳤어요', '조금 또렷했어요', '그냥 흘러갔어요'];

const HERO_AURORA5 = {
  '조금 가벼웠어요':  '가벼워진 마음이,\n이미 변화의 시작이에요.',
  '조금 지쳤어요':   '지쳐있다는 걸 알아챈 것만으로도,\n이미 돌아봄이 시작됐어요.',
  '조금 또렷했어요': '또렷한 마음은,\n이미 방향을 찾고 있어요.',
  '그냥 흘러갔어요': '흘러가는 하루도,\n당신 안에서 천천히 쌓이고 있어요.',
};

const HERO_PREFILL = {
  '조금 가벼웠어요': '오늘, 조금 가벼워진 그 마음을...',
  '조금 지쳤어요':  '오늘, 조금 지쳤던 그 마음을...',
  '조금 또렷했어요':'오늘, 조금 또렷해진 그 마음을...',
  '그냥 흘러갔어요':'오늘, 그냥 흘러간 그 하루를...',
};

// ── 유틸 ──────────────────────────────────────────
function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1);
}

function resonanceLabel(count) {
  if (count === 0) return null;
  if (count === 1) return '한 마음';
  if (count <= 4)  return `${count}개 마음`;
  if (count <= 10) return '따뜻한 마음들';
  return '많은 마음';
}

// ── 서브 컴포넌트 ─────────────────────────────────

function MyStarCard({ star, isNew, nav }) {
  if (!star || !star.star_id) return null;
  const daysSince = calcDaysSinceBirth(star.created_at);
  const galaxy = GALAXY_STYLE[star.galaxy_code] ?? { label: star.galaxy_name_ko ?? '미지의 은하', cls: 'bg-white/10 text-white/50' };
  return (
    <div className="relative mb-4">
      {isNew && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-star-gold text-night-sky text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap z-10 pointer-events-none">
          여기예요 ✨
        </div>
      )}
      <div
        onClick={() => nav(`/my-star/${star.star_id}`)}
        className="bg-white/5 border border-star-gold/40 rounded-3xl p-5 cursor-pointer hover:border-star-gold/70 active:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">⭐</span>
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
      </div>
    </div>
  );
}

function StarItem({ star }) {
  if (!star || !star.star_id) return null;
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

const TOP_RANK_STYLE = [
  { border: 'rgba(255,215,106,0.35)', bg: 'rgba(255,215,106,0.07)', badge: '#FFD76A' },
  { border: 'rgba(255,255,255,0.15)', bg: 'rgba(255,255,255,0.04)', badge: 'rgba(255,255,255,0.45)' },
  { border: 'rgba(255,255,255,0.10)', bg: 'rgba(255,255,255,0.03)', badge: 'rgba(255,255,255,0.30)' },
];

function TopTodayStarCard({ star, rank }) {
  const s = TOP_RANK_STYLE[rank] ?? TOP_RANK_STYLE[2];
  return (
    <Link
      to={`/star/${star.star_id}`}
      className="block rounded-2xl p-4 cursor-pointer no-underline transition-colors hover:brightness-110"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="flex items-start gap-3">
        <span style={{ fontSize: 13, color: s.badge, fontWeight: 700, flexShrink: 0, lineHeight: '20px' }}>
          {rank === 0 ? '✨' : `0${rank + 1}`}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white/85 text-sm font-semibold truncate">{star.star_name}</p>
          {star.wish_text && (
            <p className="text-white/45 text-xs truncate mt-0.5">{star.wish_text}</p>
          )}
          {star.wish_emotion && (
            <p style={{ fontSize: 11, color: 'rgba(255,215,106,0.55)', marginTop: 3 }} className="truncate">
              {star.wish_emotion}
            </p>
          )}
        </div>
        <span style={{ fontSize: 11, color: s.badge, flexShrink: 0 }}>
          {star.resonance_users}명
        </span>
      </div>
    </Link>
  );
}

function TrendingStarCard({ star }) {
  return (
    <Link
      to={`/star/${star.star_id}`}
      className="block rounded-2xl p-4 cursor-pointer no-underline transition-colors hover:brightness-110"
      style={{ background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.18)' }}
    >
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-white/85 text-sm font-semibold truncate mr-2">{star.star_name}</p>
        <span style={{ fontSize: 11, color: 'rgba(155,135,245,0.80)', flexShrink: 0 }}>
          🔥 {star.recent_resonance}명
        </span>
      </div>
      {star.wish_text && <p className="text-white/45 text-xs truncate mb-1">{star.wish_text}</p>}
      {star.wish_emotion && (
        <p style={{ fontSize: 11, color: 'rgba(155,135,245,0.55)' }} className="truncate">
          {star.wish_emotion}
        </p>
      )}
    </Link>
  );
}

function HotStarCard({ star }) {
  const daysSince = calcDaysSinceBirth(star.created_at);
  const galaxy    = GALAXY_STYLE[star.galaxy_code] ?? { label: star.galaxy_name_ko ?? '미지의 은하', cls: 'bg-white/10 text-white/50' };
  const label     = resonanceLabel(star.resonance_count ?? 0);
  return (
    <Link
      to={`/star/${star.star_id}`}
      className="block bg-white/4 border border-star-gold/25 rounded-2xl p-4 cursor-pointer hover:border-star-gold/50 active:bg-white/8 transition-colors no-underline"
      style={{ boxShadow: '0 0 18px 2px rgba(255,215,106,0.06)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-white/85 text-sm font-semibold truncate mr-2">{star.star_name}</p>
        {label && <span style={{ fontSize: 11, color: 'rgba(255,215,106,0.75)', flexShrink: 0 }}>✨ {label}</span>}
      </div>
      <div className="flex gap-2 items-center">
        <span className={`text-xs px-2 py-0.5 rounded-full ${galaxy.cls}`}>{galaxy.label}</span>
        <span className="text-white/30 text-xs">D+{daysSince}</span>
      </div>
    </Link>
  );
}

// ── 히어로 섹션 ───────────────────────────────────
function HeroSection({ myStarId, nav }) {
  const [choice, setChoice]     = useState(null);
  const [resonance, setResonance] = useState(null);
  const [showCta, setShowCta]   = useState(false);

  const handleChoice = (c) => {
    setShowCta(false);
    setChoice(c);
    setResonance(Math.floor(Math.random() * 16) + 5);
    setTimeout(() => setShowCta(true), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        marginBottom: 20,
        padding: '20px 18px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <AnimatePresence mode="wait">
        {!choice ? (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p style={{ fontSize: 10, color: 'rgba(255,215,106,0.55)', letterSpacing: '0.08em', marginBottom: 10 }}>
              ✨ 오늘의 마음
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 16 }}>
              오늘 하루, 가장 오래<br />남아있는 마음은 무엇인가요?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HERO_CHOICES.map(c => (
                <button
                  key={c}
                  onClick={() => handleChoice(c)}
                  style={{
                    padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.60)',
                    fontSize: 14, cursor: 'pointer',
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,215,106,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,215,106,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; }}
                >
                  {c}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p style={{ fontSize: 10, color: 'rgba(255,215,106,0.55)', letterSpacing: '0.08em', marginBottom: 8 }}>
              ✨ Aurora5
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,215,106,0.85)', marginBottom: 6 }}>
              {choice}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, whiteSpace: 'pre-line', marginBottom: 12 }}>
              {HERO_AURORA5[choice]}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', marginBottom: 16 }}>
              {resonance}명이 오늘 같은 마음이에요
            </p>
            <AnimatePresence>
              {showCta && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={() => nav('/wish?new=1', {
                      state: { prefillText: HERO_PREFILL[choice], emotionChoice: choice },
                    })}
                    style={{
                      display: 'block', width: '100%',
                      padding: '13px 0', borderRadius: 9999,
                      background: 'linear-gradient(135deg, rgba(255,215,106,0.18) 0%, rgba(255,215,106,0.08) 100%)',
                      border: '1px solid rgba(255,215,106,0.35)',
                      color: '#FFD76A', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    이 마음을 별로 남기기 →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => { setChoice(null); setShowCta(false); }}
              style={{
                display: 'block', width: '100%', marginTop: 8,
                padding: '9px 0', borderRadius: 9999,
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.25)', fontSize: 12, cursor: 'pointer',
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              다시 선택하기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── 여행 연결 섹션 ────────────────────────────────
function TravelSection({ myStarId, nav }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      style={{
        marginBottom: 16,
        padding: '16px 18px',
        borderRadius: 18,
        background: 'rgba(91,200,192,0.06)',
        border: '1px solid rgba(91,200,192,0.18)',
        cursor: 'pointer',
      }}
      onClick={() => nav(myStarId ? `/voyage-select?starId=${myStarId}` : '/voyage-select')}
    >
      <p style={{ fontSize: 10, color: 'rgba(91,200,192,0.6)', letterSpacing: '0.08em', marginBottom: 6 }}>
        ⚓ 여수에서 이어가기
      </p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
        별이 시작된 곳에서 하룻밤 더
      </p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
        숙소 선택 → 별에 기록됩니다 ✨
      </p>
    </motion.div>
  );
}

// ── 메인 ──────────────────────────────────────────
export default function Home() {
  const nav = useNavigate();
  const { state } = useLocation();
  const newStarId = state?.newStarId ?? null;

  const [stars, setStars]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [myStarData, setMyStarData] = useState(null);
  const [featured, setFeatured]   = useState({ hot: [], fresh: [] });
  const [trending, setTrending]   = useState([]);
  const [topToday, setTopToday]   = useState([]);

  const myStarId = readSavedStar();

  useEffect(() => {
    const recentPromise = getRecentStars(20)
      .then(r => setStars(r.stars ?? []))
      .catch(() => setStars([]));

    const featuredPromise = getFeaturedStars()
      .then(f => setFeatured(f))
      .catch(() => {});

    const trendingPromise = getTrendingStars(5)
      .then(r => setTrending(r.stars ?? []))
      .catch(() => {});

    const topTodayPromise = getTopTodayStars()
      .then(r => setTopToday(r.stars ?? []))
      .catch(() => {});

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

    Promise.all([recentPromise, myStarPromise, featuredPromise, trendingPromise, topTodayPromise])
      .finally(() => setLoading(false));
  }, [myStarId]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveMyStarData = myStarData ?? (myStarId ? (stars.find(s => s.star_id === myStarId) ?? null) : null);
  const isNewStar = !!(newStarId && myStarId === newStarId);
  const otherStars = stars.filter(s => s && s.star_id && s.star_id !== myStarId);

  return (
    <div className="min-h-screen flex flex-col px-5 pt-8 pb-24">

      {/* ① 히어로 섹션 — 오늘의 마음 */}
      <HeroSection myStarId={myStarId} nav={nav} />

      {/* ② 내 별 카드 */}
      {effectiveMyStarData && (
        <MyStarCard star={effectiveMyStarData} isNew={isNewStar} nav={nav} />
      )}

      {/* ③ 여행 연결 섹션 */}
      <TravelSection myStarId={myStarId} nav={nav} />

      {/* ④ 공명 피드 — 오늘 가장 마음이 모인 별 */}
      {topToday.length > 0 && (
        <div className="mb-4">
          <p className="text-white/55 text-xs mb-2" style={{ letterSpacing: '0.05em' }}>
            ✨ 오늘 가장 마음이 모인 별
          </p>
          <div className="flex flex-col gap-2">
            {topToday.map((s, i) => <TopTodayStarCard key={s.star_id} star={s} rank={i} />)}
          </div>
        </div>
      )}

      {/* ⑤ 지금 공명 중인 별 */}
      {trending.length > 0 && (
        <div className="mb-4">
          <p className="text-white/50 text-xs mb-2" style={{ letterSpacing: '0.05em' }}>
            ✨ 지금 마음이 모이고 있어요
          </p>
          <div className="flex flex-col gap-2">
            {trending.map(s => <TrendingStarCard key={s.star_id} star={s} />)}
          </div>
        </div>
      )}

      {/* ⑥ 지금 빛나는 별 */}
      {featured.hot.length > 0 && (
        <div className="mb-4">
          <p className="text-white/50 text-xs mb-2" style={{ letterSpacing: '0.05em' }}>
            💫 지금 가장 많은 공명
          </p>
          <div className="flex flex-col gap-2">
            {featured.hot.map(s => <HotStarCard key={s.star_id} star={s} />)}
          </div>
        </div>
      )}

      {/* ⑦ 새로 태어난 별 */}
      {featured.fresh.length > 0 && (
        <div className="mb-4">
          <p className="text-white/35 text-xs mb-2">🌱 새로 태어난 별 · 첫 마음을 나눠주세요</p>
          <div className="flex gap-2 flex-wrap">
            {featured.fresh.map(s => (
              <Link
                key={s.star_id}
                to={`/star/${s.star_id}`}
                className="bg-white/4 border border-white/12 text-white/55 text-xs px-3 py-1.5 rounded-full hover:bg-white/8 active:scale-95 transition-all no-underline"
              >
                ✦ {s.star_name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ⑧ 광장 — 다른 별들 */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/60 text-sm font-medium">광장의 별들</p>
          <div className="flex items-center gap-2">
            <p className="text-white/30 text-xs">{stars.length}개</p>
            <button
              onClick={() => nav('/stars')}
              className="text-dream-purple/80 text-xs hover:text-dream-purple transition-colors"
            >
              전체보기 →
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-white/30 text-xs text-center py-4">별을 불러오는 중...</p>
        ) : otherStars.length === 0 ? (
          <p className="text-white/30 text-xs text-center py-4">아직 광장에 별이 없어요</p>
        ) : (
          <div>{otherStars.map(s => <StarItem key={s.star_id} star={s} />)}</div>
        )}
      </div>

      <BottomTab active="home" myStarId={myStarId} />
    </div>
  );
}

function BottomTab({ active, myStarId }) {
  const nav = useNavigate();
  const tabs = [
    { key: 'home',   label: 'Home',    path: '/home',                                emoji: '🏠' },
    { key: 'wish',   label: 'Wish',    path: '/wish',                                emoji: '✨' },
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
