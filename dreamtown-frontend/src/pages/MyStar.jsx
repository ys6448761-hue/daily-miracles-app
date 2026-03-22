import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getStar, getGalaxyStars, getResonance, postGrowthLog, getVoyageLogs } from '../api/dreamtown.js';
import { useDreamtownStore } from '../store/dreamtownStore';
import AURUM_MESSAGES from '../constants/aurumMessages';
import { sharePostcard } from '../utils/kakaoShare';
import { gaGrowthLogged, gaMilestoneDay7, gaResonanceReceived } from '../utils/gtag';

// 은하 → 항해 방향 (StarBirth와 동일 매핑)
const GALAXY_TO_DIRECTION = {
  growth:       'east',
  challenge:    'north',
  healing:      'south',
  relationship: 'west',
};

// 이어가기 항해 메시지 (첫 항해와 구분)
const CONTINUE_VOYAGE_MSG = {
  growth:       '오늘도, 이 별과 함께 나아갑니다.',
  challenge:    '오늘도, 도전을 이어갑니다.',
  healing:      '오늘도, 마음이 쉬어갑니다.',
  relationship: '오늘도, 마음이 닿아갑니다.',
};

// 이 우주의 지혜 1줄 (은하별)
const GALAXY_WISDOM = {
  growth:       '성장은 방향이 아니라 움직임에서 시작됩니다.',
  challenge:    '도전은 결과가 아니라 시작 자체에서 완성됩니다.',
  healing:      '치유는 고치는 것이 아니라 받아들이는 것입니다.',
  relationship: '관계는 거리가 아니라 방향으로 가까워집니다.',
};

// ── Day 7 의미 메시지 (은하별) ────────────────────────────────────
// 규칙: 성공/실패 금지 · 평가/판단 금지 · 감정 압박 금지
// 핵심: "변화가 완성된 순간"이 아니라 "처음 알아차리는 순간"
const DAY7_MESSAGES = {
  growth:       {
    headline: '이 별이 처음으로 의미를 갖기 시작했어요.',
    body:     '7일이 쌓였어요. 변화는 보이지 않아도 조용히 일어나고 있어요.',
  },
  challenge:    {
    headline: '이 별이 처음으로 의미를 갖기 시작했어요.',
    body:     '7일이 지났어요. 여기까지 왔다는 것, 그것 자체가 이미 달라진 거예요.',
  },
  healing:      {
    headline: '이 별이 처음으로 의미를 갖기 시작했어요.',
    body:     '7일이 흘렀어요. 버텨온 하루하루가 당신 안에 조금씩 쌓이고 있어요.',
  },
  relationship: {
    headline: '이 별이 처음으로 의미를 갖기 시작했어요.',
    body:     '7일이 지났어요. 마음은 천천히, 그러나 분명하게 변해가고 있어요.',
  },
};

const DAY7_DEFAULT = {
  headline: '이 별이 처음으로 의미를 갖기 시작했어요.',
  body:     '7일이 지났어요. 작은 변화들이 조용히 쌓이고 있는 시간이에요.',
};

const STAGE_DAYS = {
  day1:   'Day 1',
  day7:   'Day 7',
  day30:  'Day 30',
  day100: 'Day 100',
  day365: 'Day 365',
};

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

const GROWTH_STORAGE_KEY = (starId) => `dt_growth_reflection_${starId}`;

export default function MyStar() {
  const { id } = useParams();
  const nav = useNavigate();
  const [star, setStar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galaxyStars, setGalaxyStars] = useState([]);
  const { setStarData } = useDreamtownStore();

  // 항해 로그
  const [voyageLogs, setVoyageLogs] = useState([]);

  // 성장 질문 상태
  const [growthText, setGrowthText] = useState('');
  const [growthSaved, setGrowthSaved] = useState(false);

  useEffect(() => {
    getStar(id)
      .then((data) => {
        setStar(data);
        setStarData({
          starName:       data.star_name,
          starGalaxyName: data.galaxy?.name_ko ?? null,
          starCreatedAt:  data.created_at,
        });
        if (data.galaxy?.code) {
          getGalaxyStars(data.galaxy.code, { limit: 5, exclude: data.star_id })
            .then(r => setGalaxyStars(r.stars ?? []))
            .catch(() => setGalaxyStars([]));
        }

        // 내 별 항해 로그 조회
        getVoyageLogs(data.star_id)
          .then(r => setVoyageLogs(r.logs ?? []))
          .catch(() => setVoyageLogs([]));
        // 공명 카운트 조회 → resonance_received GA4 이벤트 (세션 1회)
        getResonance(data.star_id).then(r => {
          const total = Object.values(r.resonance ?? {})
            .reduce((s, v) => s + (v.count || 0), 0);
          if (total > 0) gaResonanceReceived({ starId: data.star_id });
        }).catch(() => {});

        // 기존 성장 기록 불러오기
        const saved = localStorage.getItem(GROWTH_STORAGE_KEY(data.star_id));
        if (saved) {
          setGrowthText(saved);
          setGrowthSaved(true);
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

  function handleGrowthSave() {
    if (!growthText.trim() || !star) return;
    localStorage.setItem(GROWTH_STORAGE_KEY(star.star_id), growthText.trim());
    setGrowthSaved(true);
    gaGrowthLogged({ starId: star.star_id });
    // 서버에도 저장 (CASE 2: connection_completed 트리거 — fire-and-forget)
    postGrowthLog(star.star_id, growthText.trim()).catch(() => {});
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

        <button
          onClick={() => nav(`/star/${star.star_id}`)}
          className="mt-4 w-full bg-white/8 hover:bg-white/15 border border-white/15 hover:border-white/30 text-white/70 hover:text-white text-sm font-medium py-3 rounded-2xl transition-colors"
        >
          내 별 자세히 보기 ✦
        </button>
      </motion.div>

      {/* 내 별 이야기 — 항해 로그 기반 */}
      {voyageLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/3 border border-white/8 rounded-3xl p-5 mb-6"
        >
          <p className="text-white/40 text-xs mb-3">내 별 이야기</p>
          <div className="flex flex-col">
            {voyageLogs.slice(0, 3).map((log, i) => (
              <div
                key={log.id ?? i}
                className={`flex items-start gap-3 py-2.5 ${
                  i < Math.min(voyageLogs.length, 3) - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <span className="text-white/30 text-xs flex-shrink-0 mt-0.5 w-10">
                  D+{log.day_number}
                </span>
                <p className="text-white/65 text-sm leading-relaxed">{log.growth}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Day 7 의미 생성 — 7일 이상 경과 시 노출 */}
      {daysSinceBirth >= 7 && (() => {
        const msg = DAY7_MESSAGES[star.galaxy?.code] ?? DAY7_DEFAULT;
        gaMilestoneDay7({ starId: star.star_id }); // sessionStorage 중복 방지 내장
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6 border border-star-gold/20 rounded-3xl p-5"
            style={{ background: 'rgba(255,215,106,0.04)' }}
          >
            <p className="text-star-gold/60 text-[11px] mb-2 tracking-wide">D+{daysSinceBirth}</p>
            <p className="text-white/80 text-sm font-medium mb-1">{msg.headline}</p>
            <p className="text-white/45 text-xs leading-relaxed">{msg.body}</p>
          </motion.div>
        );
      })()}

      {/* 같은 은하 별들 — 2개 이상일 때만 표시 */}
      {galaxyStars.length >= 2 && (
        <div className="mb-6">
          <p className="text-white/40 text-xs mb-3">같은 은하 별들</p>
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {galaxyStars.map((s) => {
              const d = calcDaysSinceBirth(s.created_at);
              return (
                <div
                  key={s.star_id}
                  onClick={() => nav(`/star/${s.star_id}`)}
                  className="flex-shrink-0 bg-white/5 border border-white/8 rounded-2xl px-4 py-3 text-center cursor-pointer hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all"
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
          <button
            onClick={() => nav(`/galaxy?highlight=${star.galaxy.code}`)}
            className="mt-3 text-white/35 text-xs hover:text-white/55 transition"
          >
            은하 전체 보기 →
          </button>
        </div>
      )}

      {/* 성장 질문 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/3 border border-white/8 rounded-3xl p-5 mb-6"
      >
        <p className="text-white/50 text-xs mb-3">이 별 이후 당신은 어떻게 달라졌나요?</p>
        {growthSaved ? (
          <div>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{growthText}</p>
            <button
              onClick={() => setGrowthSaved(false)}
              className="mt-3 text-white/25 text-xs hover:text-white/45 transition"
            >
              수정하기
            </button>
          </div>
        ) : (
          <div>
            <textarea
              value={growthText}
              onChange={e => setGrowthText(e.target.value)}
              placeholder="오늘의 작은 변화를 기록해보세요."
              rows={3}
              className="w-full bg-transparent text-white/70 text-sm placeholder-white/20 outline-none resize-none leading-relaxed"
            />
            {growthText.trim() && (
              <button
                onClick={handleGrowthSave}
                className="mt-2 text-dream-purple text-xs hover:text-purple-300 transition"
              >
                저장하기
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* 이 우주의 지혜 */}
      <div className="border border-white/8 rounded-2xl p-4 mb-4">
        <p className="text-white/25 text-xs mb-1">이 우주의 지혜</p>
        <p className="text-white/55 text-sm">
          {GALAXY_WISDOM[star.galaxy?.code] ?? '작은 변화들이 조용히 쌓이고 있는 시간이에요.'}
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 mt-6">
        {/* PRIMARY — 이 별 이어가기 */}
        <button
          onClick={() => {
            const direction = GALAXY_TO_DIRECTION[star.galaxy?.code] ?? 'south';
            const message   = CONTINUE_VOYAGE_MSG[star.galaxy?.code] ?? '오늘도, 이 별과 함께합니다.';
            nav('/day', { state: { direction, message } });
          }}
          className="w-full bg-dream-purple hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-colors"
        >
          이 별 이어가기 ✦
        </button>
        <button
          onClick={() => sharePostcard({
            starName:   star.star_name,
            galaxyName: star.galaxy?.name_ko ?? '미지의 은하',
            dayCount:   daysSinceBirth,
          })}
          className="w-full bg-white/5 border border-white/10 text-white/70 font-semibold py-4 rounded-2xl hover:bg-white/10 transition-colors"
        >
          카톡으로 보내기
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => nav('/home')}
            className="flex-1 bg-white/5 border border-white/10 text-white/60 font-semibold py-4 rounded-2xl hover:bg-white/10 transition-colors"
          >
            광장으로 가기
          </button>
          <button
            onClick={() => nav('/wish')}
            className="flex-1 bg-white/5 border border-white/10 text-white/60 font-semibold py-4 rounded-2xl hover:bg-white/10 transition-colors"
          >
            새 소원 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
