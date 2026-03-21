import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getStar, getResonance, postResonance } from '../api/dreamtown.js';
import FeedbackFlow from '../components/FeedbackFlow.jsx';
import { gaResonanceCreated, gaImpactCreated } from '../utils/gtag';

const RESONANCE_OPTIONS = [
  { type: 'relief',  label: '숨이 놓였어요' },
  { type: 'belief',  label: '믿고 싶어졌어요' },
  { type: 'clarity', label: '정리됐어요' },
  { type: 'courage', label: '용기났어요' },
];

const IMPACT_LABEL = {
  gratitude: '감사나눔',
  wisdom:    '지혜나눔',
  miracle:   '기적나눔',
};

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

export default function StarDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [star, setStar] = useState(null);
  const [resonanceData, setResonanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 공명 UI 상태
  const [resonanceOpen, setResonanceOpen] = useState(false);
  const [resonanceSubmitted, setResonanceSubmitted] = useState(false);
  const [resonanceResult, setResonanceResult] = useState(null);
  const [resonancePosting, setResonancePosting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // 내 별 ID (공명 후 연결 CTA에 사용)
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
        for (const imp of result.new_impacts) {
          gaImpactCreated({ starId: id, impactType: imp.type });
        }
      }

      setResonanceResult(result);
      setResonanceSubmitted(true);
      setTimeout(() => setShowFeedback(true), 500);
      getResonance(id).then(setResonanceData).catch(() => {});

    } catch (err) {
      setResonanceResult({ message: err.message });
      setResonanceSubmitted(true);
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
  const impacts = resonanceData?.impacts ?? [];

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => nav(-1)} className="text-white/40 hover:text-white/70">← 뒤로</button>
        <p className="text-white/40 text-xs">별 상세</p>
        <div className="w-8" />
      </div>

      {/* ── 1. 별 이해 섹션 ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-5"
      >
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

          {/* 나눔 뱃지 */}
          {impacts.length > 0 && (
            <div className="flex gap-2 justify-center flex-wrap">
              {impacts.map(imp => (
                <span
                  key={imp.type}
                  className="text-xs bg-dream-purple/15 border border-dream-purple/30 text-purple-300 px-3 py-1 rounded-full"
                >
                  {imp.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 소원 내용 — 별의 의미 */}
        {star.wish_text && (
          <div className="border-t border-white/8 pt-4 mt-1">
            <p className="text-white/30 text-xs mb-2 text-center">이 별의 소원</p>
            <p className="text-white/65 text-sm leading-relaxed text-center italic">
              "{star.wish_text}"
            </p>
          </div>
        )}
      </motion.div>

      {/* ── 2. 공명 섹션 ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-5"
      >
        {/* 공명 전 */}
        {!resonanceOpen && !resonanceSubmitted && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <p className="text-white/45 text-sm text-center leading-relaxed mb-4">
              이 소원이 당신에게<br />어떻게 닿았나요?
            </p>
            <button
              onClick={() => setResonanceOpen(true)}
              className="w-full bg-dream-purple/20 hover:bg-dream-purple/30 border border-dream-purple/30 text-white/80 text-sm font-medium py-3.5 rounded-xl transition-colors"
            >
              공명 남기기
            </button>
          </div>
        )}

        {/* 공명 타입 선택 */}
        {resonanceOpen && !resonanceSubmitted && (
          <div className="bg-white/3 border border-white/10 rounded-2xl p-4">
            <p className="text-white/50 text-xs mb-3 text-center">이 별이 당신에게 어떻게 닿았나요?</p>
            <div className="grid grid-cols-2 gap-2">
              {RESONANCE_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => handleResonance(opt.type)}
                  disabled={resonancePosting}
                  className="bg-white/5 hover:bg-dream-purple/20 border border-white/10 hover:border-dream-purple/40 text-white/70 hover:text-white text-sm py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 공명 완료 */}
        {resonanceSubmitted && resonanceResult && (
          <div>
            <div className="bg-dream-purple/10 border border-dream-purple/20 rounded-2xl p-4 text-center">
              <p className="text-white/70 text-sm">{resonanceResult.message}</p>
              {resonanceResult.new_impacts?.length > 0 && (
                <p className="text-dream-purple text-xs mt-2">
                  ✨ {resonanceResult.new_impacts.map(i => i.label ?? IMPACT_LABEL[i.type]).join(' · ')} 생성됨
                </p>
              )}
            </div>

            {/* 피드백 플로우 */}
            {showFeedback && (
              <FeedbackFlow
                starId={id}
                onComplete={() => setShowFeedback(false)}
              />
            )}
          </div>
        )}
      </motion.div>

      {/* ── 3. 내 별 연결 CTA (공명 후 노출) ──────────────────── */}
      {resonanceSubmitted && myStarId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-3 mb-5"
        >
          <button
            onClick={() => nav(`/my-star/${myStarId}`)}
            className="w-full bg-star-gold/15 hover:bg-star-gold/25 border border-star-gold/30 text-star-gold font-semibold py-4 rounded-2xl transition-colors"
          >
            내 별 보러 가기 ✦
          </button>
          <button
            onClick={() => nav(`/my-star/${myStarId}`)}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-semibold py-4 rounded-2xl transition-colors"
          >
            내 별에 오늘 마음 남기기
          </button>
        </motion.div>
      )}

      {/* ── 광장 복귀 (최하위 우선순위) ───────────────────────── */}
      <div className="mt-auto pt-2">
        <button
          onClick={() => nav('/home')}
          className="w-full text-white/35 text-sm py-3 hover:text-white/55 transition-colors"
        >
          광장으로 돌아가기
        </button>
      </div>
    </div>
  );
}
