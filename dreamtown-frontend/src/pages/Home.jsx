import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getRecentStars, getStar, getFeaturedStars } from '../api/dreamtown.js';
import { readSavedStar } from '../lib/utils/starSession.js';

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

// ── 내 별 카드 ────────────────────────────────────
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

// ── 광장 별 카드 (compact) ──────────────────────
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

// ── 공명 수 → 짧은 감정 레이블 ─────────────────────
function resonanceLabel(count) {
  if (count === 0) return null;
  if (count === 1) return '한 마음';
  if (count <= 4)  return `${count}개 마음`;
  if (count <= 10) return '따뜻한 마음들';
  return '많은 마음';
}

// ── Hot 별 카드 (공명 가중 상위) ────────────────────
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
        {label && (
          <span style={{ fontSize: 11, color: 'rgba(255,215,106,0.75)', flexShrink: 0 }}>
            ✨ {label}
          </span>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <span className={`text-xs px-2 py-0.5 rounded-full ${galaxy.cls}`}>{galaxy.label}</span>
        <span className="text-white/30 text-xs">D+{daysSince}</span>
      </div>
    </Link>
  );
}

export default function Home() {
  const nav = useNavigate();
  const { state } = useLocation();

  const newStarId = state?.newStarId ?? null;

  const [stars, setStars]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [myStarData, setMyStarData] = useState(null);
  const [featured, setFeatured] = useState({ hot: [], fresh: [] });

  const myStarId = readSavedStar();

  useEffect(() => {
    const recentPromise = getRecentStars(20)
      .then(r => setStars(r.stars ?? []))
      .catch(() => setStars([]));

    const featuredPromise = getFeaturedStars()
      .then(f => setFeatured(f))
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
          .catch(() => {
            // getStar 실패 시 recent 목록에서 폴백
            setMyStarData(prev => prev); // recent 로드 후 아래서 처리
          })
      : Promise.resolve();

    Promise.all([recentPromise, myStarPromise, featuredPromise]).finally(() => setLoading(false));
  }, [myStarId]);

  const otherStars = stars.filter(s => s && s.star_id && s.star_id !== myStarId);

  // getStar 실패 시 recent 목록에서 내 별 데이터 폴백
  const effectiveMyStarData = myStarData ?? (
    myStarId ? (stars.find(s => s.star_id === myStarId) ?? null) : null
  );
  const isNewStar = !!(newStarId && myStarId === newStarId);

  // 오늘(KST) 탄생 별 — 별도 API 없이 recent 데이터에서 파생
  const todayKstMidnight = (() => {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    kst.setUTCHours(0, 0, 0, 0);
    return new Date(kst.getTime() - 9 * 60 * 60 * 1000); // UTC로 환산
  })();
  const todayStars = stars.filter(s => s && new Date(s.created_at) >= todayKstMidnight);

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-24">
      {/* 헤더 */}
      <div className="mb-6">
        <p className="text-white/40 text-xs">DreamTown</p>
        <h1 className="text-2xl font-bold text-white mt-1">
          {isNewStar ? '별이 탄생했어요 ⭐' : '안녕하세요 ✨'}
        </h1>
        <p className="text-white/50 text-sm mt-1">당신의 소원은 혼자가 아닙니다.</p>
      </div>

      {/* 내 별 카드 */}
      {effectiveMyStarData && (
        <MyStarCard
          star={effectiveMyStarData}
          isNew={isNewStar}
          nav={nav}
        />
      )}

      {/* 오늘의 탄생 별 — 오늘 생성된 별이 있을 때만 표시 */}
      {todayStars.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/50 text-xs">✨ 오늘 탄생한 소원별</p>
            <button
              onClick={() => nav('/stars')}
              className="text-dream-purple/80 text-xs hover:text-dream-purple transition-colors"
            >
              전체보기 →
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {todayStars.map(s => (
              <button
                key={s.star_id}
                onClick={() => nav(`/star/${s.star_id}`)}
                className="bg-star-gold/10 border border-star-gold/30 text-star-gold text-xs px-3 py-1.5 rounded-full hover:bg-star-gold/20 active:scale-95 transition-all"
              >
                ⭐ {s.star_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 지금 빛나는 별 (hot top 3) — 공명 가중 자동 정렬 ── */}
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

      {/* ── 새로 태어난 별 (0공명 48h) — 첫 공명 진입점 ── */}
      {featured.fresh.length > 0 && (
        <div className="mb-4">
          <p className="text-white/35 text-xs mb-2">
            🌱 새로 태어난 별 · 첫 마음을 나눠주세요
          </p>
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

      {/* 광장 — 다른 별들 */}
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
          <div>
            {otherStars.map(s => <StarItem key={s.star_id} star={s} />)}
          </div>
        )}
      </div>

      {/* Aurum 메시지 */}
      <div className="bg-dream-purple/10 border border-dream-purple/20 rounded-3xl p-5 mb-4">
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
