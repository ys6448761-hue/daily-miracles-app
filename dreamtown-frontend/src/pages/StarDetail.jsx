import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStar, getResonance, postResonance, getVoyageLogs, postVoyageLog } from '../api/dreamtown.js';
import { gaResonanceCreated, gaImpactCreated } from '../utils/gtag';

// 감정 선택형 공명 옵션
const RESONANCE_OPTIONS = [
  { type: 'relief',  label: '좀 편해졌어요' },
  { type: 'courage', label: '좀 용기났어요' },
  { type: 'clarity', label: '좀 정리됐어요' },
  { type: 'belief',  label: '좀 믿고 싶어졌어요' },
];

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

function formatBirthDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function StarDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [star, setStar] = useState(null);
  const [resonanceData, setResonanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [resonanceSubmitted, setResonanceSubmitted] = useState(false);
  const [resonancePosting, setResonancePosting] = useState(false);

  // 항해 로그 섹션
  const [showLogs, setShowLogs] = useState(false);
  const [voyageLogs, setVoyageLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const myStarId = localStorage.getItem('dt_star_id');
  const isOwnStar = id === myStarId;

  // 내 별을 /star/:id로 직접 접근하면 MyStar 페이지로 리다이렉트
  useEffect(() => {
    if (isOwnStar) {
      nav(`/my-star/${id}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOwnStar) return;
    Promise.all([
      getStar(id).then(setStar),
      getResonance(id).then(setResonanceData).catch(() => {}),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 항해 로그 섹션 열릴 때 fetch
  useEffect(() => {
    if (!showLogs || voyageLogs.length > 0) return;
    setLogsLoading(true);
    getVoyageLogs(id)
      .then(r => setVoyageLogs(r.logs ?? []))
      .catch(() => setVoyageLogs([]))
      .finally(() => setLogsLoading(false));
  }, [showLogs]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResonance(resonanceType) {
    if (resonancePosting || resonanceSubmitted) return;
    const opt = RESONANCE_OPTIONS.find(o => o.type === resonanceType);
    setResonancePosting(true);
    try {
      let token = localStorage.getItem('dt_resonance_token');
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem('dt_resonance_token', token);
      }
      const result = await postResonance({ starId: id, resonanceType, anonymousToken: token });

      gaResonanceCreated({ starId: id, resonanceType });
      if (result.new_impacts?.length > 0) {
        for (const imp of result.new_impacts) gaImpactCreated({ starId: id, impactType: imp.type });
      }

      // 공명 → 내 별 항해 로그 자동 저장 (fire-and-forget)
      if (myStarId && opt) {
        postVoyageLog(myStarId, {
          emotion: opt.label,
          tag:     '공명',
          growth:  opt.label,
          source:  'resonance',
        }).catch(() => {});
      }

      setResonanceSubmitted(true);
      getResonance(id).then(setResonanceData).catch(() => {});
    } catch {
      setResonanceSubmitted(true);
    } finally {
      setResonancePosting(false);
    }
  }

  if (isOwnStar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">내 별로 이동 중...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">별을 불러오는 중...</p>
      </div>
    );
  }

  if (!star) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/50 text-sm">별을 찾을 수 없어요.</p>
        <button onClick={() => nav(-1)} className="text-white/30 text-xs">← 돌아가기</button>
      </div>
    );
  }

  const daysSince = calcDaysSinceBirth(star.created_at);
  const galaxyStyle = GALAXY_STYLE[star.galaxy?.code] ?? {
    label: star.galaxy?.name_ko ?? '미지의 은하',
    cls: 'bg-white/10 text-white/50',
  };
  const resonanceTotal = Object.values(resonanceData?.resonance ?? {})
    .reduce((s, v) => s + (v.count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col px-6 py-10 pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => window.history.length > 1 ? nav(-1) : nav('/home')} className="text-white/40 hover:text-white/70">← 뒤로</button>
        <p className="text-white/40 text-xs">별 상세</p>
        <div className="w-8" />
      </div>

      {/* ── 1. 별 정보 카드 (클릭 불가 안내판) ──────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-3">
        <div className="text-center mb-4">
          <div className="text-5xl mb-4">✦</div>
          <h1 className="text-2xl font-bold text-star-gold mb-3">{star.star_name}</h1>

          <div className="flex gap-2 justify-center flex-wrap mb-3">
            <span className={`text-xs px-3 py-1 rounded-full ${galaxyStyle.cls}`}>
              {galaxyStyle.label}
            </span>
            <span className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full">
              D+{daysSince}
            </span>
          </div>

          {/* 사회성 문구 — 3명 이상일 때만 */}
          {resonanceTotal >= 3 && (
            <p className="text-white/30 text-xs mt-1">
              이 별에 {resonanceTotal}명의 마음이 닿았어요
            </p>
          )}
        </div>

        {/* 이 별의 이야기 보기 버튼 */}
        <button
          onClick={() => setShowLogs(v => !v)}
          className="w-full mt-1 border border-white/12 hover:border-white/25 bg-white/3 hover:bg-white/8 text-white/55 hover:text-white/75 text-sm py-3 rounded-2xl transition-colors"
        >
          {showLogs ? '이야기 닫기' : '이 별의 이야기 보기 ✦'}
        </button>
      </div>

      {/* ── 2. 항해 로그 기반 이야기 섹션 ──────────────────────── */}
      {showLogs && (
        <div className="bg-white/3 border border-white/8 rounded-3xl p-5 mb-3">
          <p className="text-white/30 text-xs mb-3">탄생일 · {formatBirthDate(star.created_at)}</p>
          {logsLoading ? (
            <p className="text-white/30 text-xs text-center py-2">불러오는 중...</p>
          ) : voyageLogs.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-2">아직 항해 기록이 없어요</p>
          ) : (
            <div className="flex flex-col gap-0">
              {voyageLogs.slice(0, 3).map((log, i) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 py-3 ${
                    i < Math.min(voyageLogs.length, 3) - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <span className="text-white/30 text-xs flex-shrink-0 mt-0.5 w-10">
                    D+{log.day_number}
                  </span>
                  <p className="text-white/60 text-sm leading-relaxed">{log.growth}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 3. 공명 섹션 ──────────────────────────────────────── */}
      <div className="mb-5">
        {!resonanceSubmitted && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <p className="text-white/40 text-xs mb-3 text-center">
              이 별이 당신에게 어떻게 닿았나요?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {RESONANCE_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => handleResonance(opt.type)}
                  disabled={resonancePosting}
                  className="bg-white/5 hover:bg-dream-purple/20 border border-white/10 hover:border-dream-purple/40 text-white/65 hover:text-white text-sm py-3.5 rounded-xl transition-colors disabled:opacity-40"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {resonanceSubmitted && (
          <div className="bg-dream-purple/8 border border-dream-purple/20 rounded-2xl p-4 text-center">
            <p className="text-white/70 text-sm">이 별에 마음이 닿았어요</p>
          </div>
        )}
      </div>

      {/* ── 4. 내 별 연결 CTA (공명 후) ──────────────────────── */}
      {resonanceSubmitted && myStarId && (
        <div className="flex flex-col gap-2 mb-5">
          <button
            onClick={() => nav(`/my-star/${myStarId}`)}
            className="w-full bg-star-gold/15 hover:bg-star-gold/25 border border-star-gold/30 text-star-gold font-semibold py-4 rounded-2xl transition-colors"
          >
            내 별 보러 가기 ✦
          </button>
        </div>
      )}

      {/* ── 5. 광장 복귀 ────────────────────────────────────── */}
      <div className="mt-4 mb-4">
        <button
          onClick={() => nav('/home')}
          className="w-full bg-white/5 border border-white/10 text-white/60 hover:text-white/80 hover:bg-white/10 text-sm font-medium py-4 rounded-2xl transition-colors"
        >
          광장으로 돌아가기
        </button>
      </div>
    </div>
  );
}
