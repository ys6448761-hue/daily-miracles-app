import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStar, getResonance, postResonance } from '../api/dreamtown.js';
import { gaResonanceCreated, gaImpactCreated } from '../utils/gtag';

// 감정 선택형 공명 옵션 (좀 ~ 계열)
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

// 은하별 지혜 1줄
const GALAXY_WISDOM = {
  growth:       '성장은 방향이 아니라 움직임에서 시작됩니다.',
  challenge:    '도전은 결과가 아니라 시작 자체에서 완성됩니다.',
  healing:      '치유는 고치는 것이 아니라 받아들이는 것입니다.',
  relationship: '관계는 거리가 아니라 방향으로 가까워집니다.',
};

function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1);
}

export default function StarDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [star, setStar] = useState(null);
  const [resonanceData, setResonanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 공명
  const [resonanceSubmitted, setResonanceSubmitted] = useState(false);
  const [resonancePosting, setResonancePosting] = useState(false);

  // 이야기 섹션 토글
  const [showStory, setShowStory] = useState(false);

  const myStarId = localStorage.getItem('dt_star_id');

  useEffect(() => {
    Promise.all([
      getStar(id).then(setStar),
      getResonance(id).then(setResonanceData).catch(() => {}),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  async function handleResonance(resonanceType) {
    if (resonancePosting || resonanceSubmitted) return;
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

      setResonanceSubmitted(true);
      getResonance(id).then(setResonanceData).catch(() => {});
    } catch {
      setResonanceSubmitted(true); // 실패해도 UI는 완료 처리
    } finally {
      setResonancePosting(false);
    }
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

  // 공명 합산
  const resonanceTotal = Object.values(resonanceData?.resonance ?? {})
    .reduce((s, v) => s + (v.count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => nav(-1)} className="text-white/40 hover:text-white/70">← 뒤로</button>
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
          onClick={() => setShowStory(v => !v)}
          className="w-full mt-1 border border-white/12 hover:border-white/25 bg-white/3 hover:bg-white/8 text-white/55 hover:text-white/75 text-sm py-3 rounded-2xl transition-colors"
        >
          {showStory ? '이야기 닫기' : '이 별의 이야기 보기 ✦'}
        </button>
      </div>

      {/* ── 2. 이야기/변화/지혜 섹션 (토글) ────────────────────── */}
      {showStory && (
        <div className="bg-white/3 border border-white/8 rounded-3xl p-5 mb-3">
          {/* 이야기 — 소원 */}
          {star.wish_text && (
            <div className="mb-4">
              <p className="text-white/30 text-xs mb-2">이야기</p>
              <p className="text-white/65 text-sm leading-relaxed italic">
                &quot;{star.wish_text}&quot;
              </p>
            </div>
          )}

          {/* 변화 — 성장 기록 */}
          {star.growth_log_text && (
            <div className="border-t border-white/8 pt-4 mb-4">
              <p className="text-white/30 text-xs mb-2">변화</p>
              <p className="text-white/60 text-sm leading-relaxed">
                {star.growth_log_text}
              </p>
            </div>
          )}

          {/* 지혜 */}
          <div className={star.wish_text || star.growth_log_text ? 'border-t border-white/8 pt-4' : ''}>
            <p className="text-white/30 text-xs mb-2">지혜</p>
            <p className="text-white/50 text-sm italic">
              {GALAXY_WISDOM[star.galaxy?.code] ?? '작은 변화들이 조용히 쌓이고 있어요.'}
            </p>
          </div>
        </div>
      )}

      {/* ── 3. 공명 섹션 ──────────────────────────────────────── */}
      <div className="mb-5">
        {/* 감정 선택형 — 중간 버튼 없이 바로 노출 */}
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

        {/* 공명 완료 — 고정 문구 */}
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
      <div className="mt-auto pt-2">
        <button
          onClick={() => nav('/home')}
          className="w-full text-white/30 text-sm py-3 hover:text-white/50 transition-colors"
        >
          광장으로 돌아가기
        </button>
      </div>
    </div>
  );
}
