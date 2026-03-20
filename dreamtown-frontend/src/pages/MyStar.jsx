import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getStar, getGalaxyStars, getResonance, postResonance } from '../api/dreamtown.js';
import { useDreamtownStore } from '../store/dreamtownStore';
import AURUM_MESSAGES from '../constants/aurumMessages';
import { sharePostcard } from '../utils/kakaoShare';

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

  // 공명 & 나눔 상태
  const [resonanceData, setResonanceData] = useState(null); // { resonance, impacts }
  const [resonanceOpen, setResonanceOpen] = useState(false);
  const [resonanceSubmitted, setResonanceSubmitted] = useState(false);
  const [resonanceResult, setResonanceResult] = useState(null); // { message, new_impacts }
  const [resonancePosting, setResonancePosting] = useState(false);

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
        // 공명/나눔 현황 조회
        getResonance(data.star_id)
          .then(r => setResonanceData(r))
          .catch(() => {});
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

  async function handleResonance(resonanceType) {
    if (resonancePosting || resonanceSubmitted) return;
    setResonancePosting(true);
    try {
      // anonymous_token: localStorage에서 일관된 토큰 사용
      let token = localStorage.getItem('dt_resonance_token');
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem('dt_resonance_token', token);
      }
      const result = await postResonance({
        starId: star.star_id,
        resonanceType,
        anonymousToken: token,
      });
      setResonanceResult(result);
      setResonanceSubmitted(true);
      // 나눔 데이터 갱신
      getResonance(star.star_id).then(r => setResonanceData(r)).catch(() => {});
    } catch (err) {
      // 409 중복 → 이미 공명한 것으로 처리
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

      {/* 공명 & 나눔 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        {/* 나눔 표시 — impact 있을 때만 */}
        {resonanceData?.impacts?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {resonanceData.impacts.map(imp => (
              <span
                key={imp.type}
                className="text-xs bg-dream-purple/15 border border-dream-purple/30 text-purple-300 px-3 py-1 rounded-full"
              >
                {imp.label}
              </span>
            ))}
          </div>
        )}

        {/* 공명 버튼 / 선택 UI / 결과 */}
        {!resonanceOpen && !resonanceSubmitted && (
          <button
            onClick={() => setResonanceOpen(true)}
            className="w-full border border-white/15 text-white/60 text-sm py-3 rounded-2xl hover:border-white/30 hover:text-white/80 transition-colors"
          >
            공명 남기기
          </button>
        )}

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

        {resonanceSubmitted && resonanceResult && (
          <div className="bg-dream-purple/10 border border-dream-purple/20 rounded-2xl p-4 text-center">
            <p className="text-white/70 text-sm">{resonanceResult.message}</p>
            {resonanceResult.new_impacts?.length > 0 && (
              <p className="text-dream-purple text-xs mt-2">
                ✨ {resonanceResult.new_impacts.map(i => i.label).join(' · ')} 생성됨
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* CTA */}
      <div className="flex flex-col gap-3 mt-auto">
        <button
          onClick={() => sharePostcard({
            starName:   star.star_name,
            galaxyName: star.galaxy?.name_ko ?? '미지의 은하',
            dayCount:   daysSinceBirth,
          })}
          className="w-full bg-dream-purple hover:bg-purple-500 text-white font-semibold py-4 rounded-2xl transition-colors"
        >
          카톡으로 보내기
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => nav('/galaxy')}
            className="flex-1 bg-white/5 border border-white/10 text-white/70 font-semibold py-4 rounded-2xl hover:bg-white/10 transition-colors"
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
    </div>
  );
}
