import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRecentStars } from '../api/dreamtown.js';

// ── 은하 감정 클러스터 정의 ───────────────────────────────────────
const GALAXY_CLUSTERS = [
  {
    code:     'challenge',
    headline: '도전하는 마음의 은하',
    subtitle: '두려워도 앞으로 나아가는 별들',
    icon:     '🔥',
    color:    'rgba(251,146,60,0.08)',
    border:   'rgba(251,146,60,0.20)',
    text:     'rgba(251,146,60,0.88)',
    dot:      'rgba(251,146,60,0.55)',
  },
  {
    code:     'growth',
    headline: '다시 시작하는 은하',
    subtitle: '작은 한 걸음을 내딛는 별들',
    icon:     '🌱',
    color:    'rgba(96,165,250,0.07)',
    border:   'rgba(96,165,250,0.18)',
    text:     'rgba(96,165,250,0.88)',
    dot:      'rgba(96,165,250,0.55)',
  },
  {
    code:     'healing',
    headline: '조용히 쉬어가는 은하',
    subtitle: '멈춤도 항해라는 걸 아는 별들',
    icon:     '🌿',
    color:    'rgba(74,222,128,0.07)',
    border:   'rgba(74,222,128,0.18)',
    text:     'rgba(74,222,128,0.88)',
    dot:      'rgba(74,222,128,0.55)',
  },
  {
    code:     'relationship',
    headline: '관계를 회복하는 은하',
    subtitle: '연결을 바라는 마음의 별들',
    icon:     '💫',
    color:    'rgba(244,114,182,0.07)',
    border:   'rgba(244,114,182,0.18)',
    text:     'rgba(244,114,182,0.88)',
    dot:      'rgba(244,114,182,0.55)',
  },
  {
    code:     'miracle',
    headline: '기적을 바라는 은하',
    subtitle: '가장 간절한 마음이 모인 곳',
    icon:     '✨',
    color:    'rgba(255,215,106,0.07)',
    border:   'rgba(255,215,106,0.20)',
    text:     '#FFD76A',
    dot:      'rgba(255,215,106,0.60)',
  },
];

const GALAXY_STYLE = {
  growth:       { label: '성장', cls: 'bg-blue-500/20 text-blue-300' },
  challenge:    { label: '도전', cls: 'bg-orange-500/20 text-orange-300' },
  healing:      { label: '치유', cls: 'bg-green-500/20 text-green-300' },
  relationship: { label: '관계', cls: 'bg-pink-500/20 text-pink-300' },
  miracle:      { label: '기적', cls: 'bg-yellow-500/20 text-yellow-300' },
};

function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1);
}

export default function AllStars() {
  const nav = useNavigate();

  // null = 은하 탐색 모드 / galaxy code = 해당 은하 목록 모드
  const [activeFilter, setActiveFilter] = useState(null);

  // ── 은하 탐색 모드용 클러스터 데이터 ──────────────────────────
  const [clusterStars, setClusterStars]   = useState({});
  const [clusterLoading, setClusterLoading] = useState(true);

  // ── 목록 모드용 데이터 ─────────────────────────────────────────
  const [listStars, setListStars]   = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // 은하 탐색 — 전체 클러스터 병렬 fetch (최초 1회)
  useEffect(() => {
    if (Object.keys(clusterStars).length > 0) return; // 이미 로드됨
    setClusterLoading(true);
    Promise.all(
      GALAXY_CLUSTERS.map(g =>
        getRecentStars(4, g.code)
          .then(r => [g.code, r.stars ?? []])
          .catch(() => [g.code, []])
      )
    ).then(results => {
      const obj = {};
      results.forEach(([code, stars]) => { obj[code] = stars; });
      setClusterStars(obj);
    }).finally(() => setClusterLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 목록 모드 — 필터 변경 시 fetch
  useEffect(() => {
    if (activeFilter === null) return;
    setListLoading(true);
    getRecentStars(100, activeFilter)
      .then(r => setListStars(r.stars ?? []))
      .catch(() => setListStars([]))
      .finally(() => setListLoading(false));
  }, [activeFilter]);

  const activeCfg = GALAXY_CLUSTERS.find(g => g.code === activeFilter);

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-24">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => nav(-1)} className="text-white/40 hover:text-white/70 text-sm">← 뒤로</button>
        <p className="text-white/40 text-xs">은하 탐색</p>
        <div className="w-12" />
      </div>

      {activeFilter === null ? (
        /* ── 은하 탐색 모드 ───────────────────────────────────── */
        <>
          <h1 className="text-xl font-bold text-white mb-1">소원들의 은하</h1>
          <p className="text-white/40 text-xs mb-6">비슷한 마음의 별들이 모여 은하가 됐어요</p>

          {clusterLoading ? (
            <p className="text-white/30 text-xs text-center py-10">은하를 불러오는 중...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {GALAXY_CLUSTERS.map(g => {
                const stars = clusterStars[g.code] ?? [];
                if (stars.length === 0) return null;
                return (
                  <div key={g.code} style={{
                    borderRadius: 18,
                    background: g.color,
                    border: `1px solid ${g.border}`,
                    padding: '16px 16px 12px',
                  }}>
                    {/* 은하 헤더 */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, color: g.text, fontWeight: 600, lineHeight: 1.3 }}>
                          {g.icon} {g.headline}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 3 }}>
                          {g.subtitle}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveFilter(g.code)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 11, color: g.text, flexShrink: 0, marginLeft: 8, paddingTop: 2,
                        }}
                      >
                        더 보기 →
                      </button>
                    </div>

                    {/* 별 목록 */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {stars.map((s, i) => (
                        <Link
                          key={s.star_id}
                          to={`/star/${s.star_id}`}
                          className="no-underline"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 0',
                            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          }}
                        >
                          <span style={{ color: g.dot, fontSize: 12, flexShrink: 0 }}>✦</span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', flex: 1, minWidth: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.star_name}
                          </span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                            D+{calcDaysSinceBirth(s.created_at)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ── 개별 은하 목록 모드 ─────────────────────────────── */
        <>
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setActiveFilter(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}
            >
              ← 은하 탐색으로
            </button>
          </div>

          {activeCfg && (
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: activeCfg.text, marginBottom: 4 }}>
                {activeCfg.icon} {activeCfg.headline}
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{activeCfg.subtitle}</p>
            </div>
          )}

          {/* 다른 은하 필터 */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {GALAXY_CLUSTERS.map(g => (
              <button
                key={g.code}
                onClick={() => setActiveFilter(g.code)}
                style={{
                  flexShrink: 0, fontSize: 11, padding: '6px 14px', borderRadius: 9999,
                  background: activeFilter === g.code ? g.color : 'transparent',
                  border: `1px solid ${activeFilter === g.code ? g.border : 'rgba(255,255,255,0.12)'}`,
                  color: activeFilter === g.code ? g.text : 'rgba(255,255,255,0.40)',
                  cursor: 'pointer',
                }}
              >
                {g.icon} {g.code === 'challenge' ? '도전' : g.code === 'growth' ? '성장' :
                          g.code === 'healing' ? '치유' : g.code === 'relationship' ? '관계' : '기적'}
              </button>
            ))}
          </div>

          {listLoading ? (
            <p className="text-white/30 text-xs text-center py-10">별을 불러오는 중...</p>
          ) : listStars.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-10">아직 이 은하에 별이 없어요</p>
          ) : (
            <div className="bg-white/3 border border-white/8 rounded-3xl p-5">
              <p className="text-white/30 text-xs mb-3">{listStars.length}개의 별</p>
              <div className="flex flex-col">
                {listStars.map((s, i) => {
                  const d = calcDaysSinceBirth(s.created_at);
                  const galaxy = GALAXY_STYLE[s.galaxy_code] ?? { label: '미지', cls: 'bg-white/10 text-white/50' };
                  return (
                    <Link
                      key={s.star_id}
                      to={`/star/${s.star_id}`}
                      className={`flex items-center gap-3 py-3 no-underline hover:bg-white/5 active:bg-white/10 rounded-xl px-1 -mx-1 transition-colors ${
                        i < listStars.length - 1 ? 'border-b border-white/5' : ''
                      }`}
                    >
                      <span style={{ color: activeCfg?.dot ?? '#FFD76A', fontSize: 14 }}>✦</span>
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
        </>
      )}
    </div>
  );
}
