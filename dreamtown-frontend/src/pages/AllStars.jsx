import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRecentStars } from '../api/dreamtown.js';

const GALAXY_STYLE = {
  growth:       { label: '성장 은하', cls: 'bg-blue-500/20 text-blue-300' },
  challenge:    { label: '도전 은하', cls: 'bg-orange-500/20 text-orange-300' },
  healing:      { label: '치유 은하', cls: 'bg-green-500/20 text-green-300' },
  relationship: { label: '관계 은하', cls: 'bg-pink-500/20 text-pink-300' },
};

const FILTERS = [
  { key: null,           label: '전체' },
  { key: 'growth',       label: '성장' },
  { key: 'challenge',    label: '도전' },
  { key: 'healing',      label: '치유' },
  { key: 'relationship', label: '관계' },
];

function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1);
}

export default function AllStars() {
  const nav = useNavigate();
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    setLoading(true);
    getRecentStars(100, activeFilter)
      .then(r => setStars(r.stars ?? []))
      .catch(() => setStars([]))
      .finally(() => setLoading(false));
  }, [activeFilter]);

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-24">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => nav(-1)} className="text-white/40 hover:text-white/70 text-sm">← 뒤로</button>
        <p className="text-white/40 text-xs">전체 별 탐색</p>
        <div className="w-12" />
      </div>

      <h1 className="text-xl font-bold text-white mb-1">우주의 소원별들</h1>
      <p className="text-white/40 text-xs mb-5">드림타운에 빛나는 모든 별을 탐색해보세요</p>

      {/* 은하 필터 탭 */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f.key ?? 'all'}
            onClick={() => setActiveFilter(f.key)}
            className={`flex-shrink-0 text-xs px-4 py-2 rounded-full border transition-colors ${
              activeFilter === f.key
                ? 'bg-dream-purple border-dream-purple text-white'
                : 'border-white/15 text-white/50 hover:border-white/30 hover:text-white/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 별 목록 */}
      {loading ? (
        <p className="text-white/30 text-xs text-center py-10">별을 불러오는 중...</p>
      ) : stars.length === 0 ? (
        <p className="text-white/30 text-xs text-center py-10">아직 이 은하에 별이 없어요</p>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-3xl p-5">
          <p className="text-white/30 text-xs mb-3">{stars.length}개의 별</p>
          <div className="flex flex-col">
            {stars.map((s, i) => {
              const d = calcDaysSinceBirth(s.created_at);
              const galaxy = GALAXY_STYLE[s.galaxy_code] ?? { label: s.galaxy_name_ko ?? '미지의 은하', cls: 'bg-white/10 text-white/50' };
              return (
                <Link
                  key={s.star_id}
                  to={`/star/${s.star_id}`}
                  className={`flex items-center gap-3 py-3 no-underline hover:bg-white/5 active:bg-white/10 rounded-xl px-1 -mx-1 transition-colors ${
                    i < stars.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <span className="text-lg">✦</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium truncate">{s.star_name}</p>
                    <p className="text-white/35 text-xs">D+{d}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${galaxy.cls}`}>
                    {galaxy.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
