import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getStar, getGalaxyStars, getResonance, postGrowthLog, getVoyageLogs, createGift, getOrCreateUserId, postAurora5Message, getTodaySchedule, getStarStats, getStarDetail } from '../api/dreamtown.js';
import MilestoneBar from '../components/MilestoneBar';
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
  growth:       '오늘도, 소원별과 함께 나아갑니다.',
  challenge:    '오늘도, 도전을 이어갑니다.',
  healing:      '오늘도, 마음이 쉬어갑니다.',
  relationship: '오늘도, 마음이 닿아갑니다.',
};

// Aurora5 메시지는 현재 은하 기반 로컬 생성
// 추후 K-지혜 파이프라인 연결 예정
// wisdom_tag 기준 패턴 분석 → K-지혜 문장 생성
const AURORA5_MESSAGES = {
  growth: [
    '오늘도 한 걸음 움직였군요.\n성장은 방향이 아니라 움직임에서 시작돼요.\n지금 이 방향이 맞는지 몰라도 괜찮아요.',
    '어떤 날은 앞이 아니라 옆으로 가기도 해요.\n그것도 성장이에요.\n오늘 어디로든 한 발 내딛어봐요.',
    '결과보다 과정이 쌓이고 있어요.\n보이지 않아도 분명히요.\n오늘 한 가지, 완벽하지 않아도 시작해봐요.',
    '움직임이 곧 방향을 만들어요.\n멈춰 있을 때보다 조금 나아갈 때 길이 보여요.\n오늘 가장 작은 것 하나를 해봐요.',
    '성장은 느리게 오는 것 같아도,\n돌아보면 이미 멀리 와 있어요.\n오늘도 그 길 위에 있어요.',
  ],
  challenge: [
    '두려워도 여기까지 왔어요.\n두려움은 약함이 아니라 진지함의 증거예요.\n오늘 딱 하나만 더 해봐요.',
    '도전은 결과가 아니라 시작 자체로 완성돼요.\n시작했다는 것, 그게 이미 대단한 거예요.\n오늘도 그 용기를 기억해봐요.',
    '무서운 건 당연해요.\n두려움이 있다는 건 그만큼 원한다는 뜻이에요.\n오늘 그 마음을 그대로 안고 한 발만요.',
    '실패도 하나의 데이터예요.\n틀린 게 아니라 알게 된 거예요.\n오늘 무엇을 알게 됐나요?',
    '아직 안 됐다고 멈출 필요 없어요.\n여기까지 온 것 자체가 이미 성공이에요.\n오늘도 그 흐름 위에 있어요.',
  ],
  healing: [
    '스스로에게 다정해지는 연습,\n가장 오래 걸리는 항해예요.\n오늘도 한 번 더 해봤나요?',
    '치유는 고치는 게 아니라 받아들이는 거예요.\n지금 이 상태도 괜찮아요.\n오늘 자신에게 한 마디 건네봐요.',
    '아프다고 말하는 것도 용기예요.\n외면하지 않았다는 것, 그것만으로도 충분해요.\n오늘 하나, 자신에게 쉬는 시간을 줘요.',
    '서두르지 않아도 돼요.\n마음은 각자의 속도로 회복해요.\n오늘 가장 편한 방식으로 쉬어봐요.',
    '버텼다는 게 얼마나 대단한 일인지,\n본인은 잘 모를 거예요.\n오늘은 그냥 그 자체로 잘 했어요.',
  ],
  relationship: [
    '관계는 가까워지려는 마음에서 시작돼요.\n그 마음이 있다는 것만으로도 이미 연결돼 있어요.\n오늘 한 사람에게 먼저 말 걸어봐요.',
    '말하지 않아도 전해지는 게 있어요.\n하지만 말했을 때 더 잘 닿아요.\n오늘 전하지 못한 한 마디를 꺼내봐요.',
    '연결은 거리가 아니라 방향으로 가까워져요.\n지금 그 마음의 방향이 맞아요.\n오늘 작은 손짓 하나를 해봐요.',
    '혼자가 편한 날도 있어요.\n그럼에도 닿고 싶은 마음이 있다면,\n그 마음 자체가 소중한 거예요.',
    '관계에서 용기는 먼저 다가가는 것이에요.\n어색해도 괜찮아요.\n오늘 그 한 발을 내딛어봐요.',
  ],
};

const AURORA5_WISDOM_TAGS = {
  growth:       '실천',
  challenge:    '버팀',
  healing:      '자기다스림',
  relationship: '관계',
};

function getAurora5Message(galaxyCode, daysSinceBirth) {
  const pool = AURORA5_MESSAGES[galaxyCode] ?? AURORA5_MESSAGES.growth;
  return pool[(daysSinceBirth - 1) % pool.length];
}

// ── Day 7 의미 메시지 (은하별) ────────────────────────────────────
// 규칙: 성공/실패 금지 · 평가/판단 금지 · 감정 압박 금지
// 핵심: "변화가 완성된 순간"이 아니라 "처음 알아차리는 순간"
const DAY7_MESSAGES = {
  growth:       {
    headline: '소원별이 처음으로 의미를 갖기 시작했어요.',
    body:     '7일이 쌓였어요. 변화는 보이지 않아도 조용히 일어나고 있어요.',
  },
  challenge:    {
    headline: '소원별이 처음으로 의미를 갖기 시작했어요.',
    body:     '7일이 지났어요. 여기까지 왔다는 것, 그것 자체가 이미 달라진 거예요.',
  },
  healing:      {
    headline: '소원별이 처음으로 의미를 갖기 시작했어요.',
    body:     '7일이 흘렀어요. 버텨온 하루하루가 당신 안에 조금씩 쌓이고 있어요.',
  },
  relationship: {
    headline: '소원별이 처음으로 의미를 갖기 시작했어요.',
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

  // 오늘의 Aurora5 스케줄
  const [todaySchedule, setTodaySchedule] = useState(null);

  // My Star 통계 (카드/마일스톤/차트)
  const [stats, setStats] = useState(null);

  // 닉네임
  const [nickname, setNickname] = useState('');

  // 선물하기 상태
  const [showGift, setShowGift] = useState(false);
  const [giftCopyType, setGiftCopyType] = useState(null);
  const [giftPosting, setGiftPosting] = useState(false);
  const [giftDone, setGiftDone] = useState(false);

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

        // 오늘의 Aurora5 스케줄 + 닉네임 조회 (getStarDetail 통합 호출)
        getStarDetail(data.star_id)
          .then(detail => {
            setTodaySchedule(detail.today_aurora5_day != null ? {
              message_text: detail.today_aurora5_message,
              day_number:   detail.today_aurora5_day,
            } : null);
            setNickname(detail.nickname || '소원이');
          })
          .catch(() => {
            // 폴백: 기존 개별 호출
            getTodaySchedule(data.star_id)
              .then(r => setTodaySchedule(r.schedule ?? null))
              .catch(() => setTodaySchedule(null));
          });

        // My Star 통계
        getStarStats(data.star_id)
          .then(s => setStats(s))
          .catch(() => setStats(null));

        // Aurora5 메시지 저장 — 세션당 1회 fire-and-forget
        const aurora5Key = `dt_aurora5_saved_${data.star_id}_${new Date().toISOString().slice(0, 10)}`;
        if (!sessionStorage.getItem(aurora5Key)) {
          const days = Math.max(1, Math.floor((Date.now() - new Date(data.created_at).getTime()) / 86400000) + 1);
          const galaxyCode = data.galaxy?.code;
          const msg = getAurora5Message(galaxyCode, days);
          const tag = AURORA5_WISDOM_TAGS[galaxyCode] ?? null;
          postAurora5Message(data.star_id, {
            userId:    getOrCreateUserId(),
            message:   msg,
            wisdomTag: tag,
          }).catch(() => {});
          sessionStorage.setItem(aurora5Key, '1');
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
  const today = new Date().toISOString().slice(0, 10);
  const doneTodayFlag = !!localStorage.getItem('dt_voyage_today_' + star.star_id + '_' + today);

  const GIFT_COPIES = {
    lover:  '별을 따다 주고 싶었는데, 네 별을 만들었어',
    parent: '당신이 걷는 모든 길에 빛이 있기를 바라요',
    friend: '넌 이미 별을 닮았어. 소원별이 너한테 어울려',
  };
  const GIFT_LABELS = { lover: '연인에게', parent: '부모님께', friend: '친구에게' };

  async function handleGift() {
    if (!giftCopyType || giftPosting) return;
    setGiftPosting(true);
    try {
      const { gift_card } = await createGift(star.star_id, {
        userId: getOrCreateUserId(),
        giftCopyType,
      });
      const shareUrl = window.location.origin + '/dreamtown/gift/' + star.star_id;
      if (navigator.share) {
        await navigator.share({
          title: `${gift_card.star_name}을 선물받으세요 ✨`,
          text:  `"${gift_card.copy_text}"`,
          url:   shareUrl,
        }).catch(() => {}); // AbortError 무시
      } else {
        await navigator.clipboard.writeText(shareUrl).catch(() => {});
        setGiftDone(true);
      }
      setGiftDone(true);
    } catch (err) {
      console.error('[Gift]', err.message);
    } finally {
      setGiftPosting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => window.history.length > 1 ? nav(-1) : nav('/home')} className="text-white/40 hover:text-white/70">← 뒤로</button>
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

        {nickname && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
            @{nickname}
          </p>
        )}

        <p style={{ fontSize: 12, color: '#9B87F5', fontStyle: 'italic', marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>🐢</span> {aurumMsg.text}
        </p>

        <h1 className="text-2xl font-bold text-star-gold glow-gold mb-2">
          {star.star_name}
        </h1>

        {star.wish_text && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>
            &ldquo;{star.wish_text.length > 40 ? star.wish_text.slice(0, 40) + '…' : star.wish_text}&rdquo;
          </p>
        )}

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

      {/* ── 요약 카드 3개 ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          {
            label: '항해 일수',
            value: `D+${daysSinceBirth}`,
            sub: daysSinceBirth < 30
              ? `D+30까지 ${30 - daysSinceBirth}일`
              : daysSinceBirth < 100
                ? `D+100까지 ${100 - daysSinceBirth}일`
                : 'D+100 달성',
          },
          {
            label: '변화 지수',
            value: stats ? String(stats.current_score) : '–',
            sub: stats?.change_score_history?.length > 0 ? '오늘 기준' : '기록 후 갱신',
          },
          {
            label: '공명 받음',
            value: `${stats?.resonance_count ?? 0}회`,
            sub: `${stats?.resonance_users_count ?? 0}명이 응원`,
          },
        ].map(card => (
          <div
            key={card.label}
            className="rounded-2xl p-3 text-center"
            style={{ background: '#1e3248', border: '1px solid rgba(255,215,106,0.15)' }}
          >
            <p style={{ color: 'rgba(232,228,217,0.5)', fontSize: 11, marginBottom: 4 }}>{card.label}</p>
            <p style={{ color: '#FFD76A', fontSize: 20, fontWeight: 500, lineHeight: 1 }}>{card.value}</p>
            <p style={{ color: 'rgba(232,228,217,0.35)', fontSize: 10, marginTop: 4 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── 마일스톤 진행바 ───────────────────────────────── */}
      <MilestoneBar createdAt={star.created_at} daysSinceBirth={daysSinceBirth} />

      {/* ── Aurora5 케어 현황 카드 ─────────────────────── */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <span style={{ fontSize: 12 }}>✨</span>
          <p style={{ color: 'rgba(232,228,217,0.55)', fontSize: 11 }}>Aurora5 케어 현황</p>
        </div>
        <p style={{ color: 'rgba(255,215,106,0.75)', fontSize: 12, marginBottom: 8 }}>
          D+{todaySchedule?.day_number ?? daysSinceBirth} /{' '}
          {daysSinceBirth <= 7 ? '7일' : daysSinceBirth <= 30 ? '30일' : daysSinceBirth <= 100 ? '100일' : '365일'} 케어 진행 중
        </p>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6 }}>
          {todaySchedule?.message_text
            ?? getAurora5Message(star.galaxy?.code, daysSinceBirth).split('\n')[0]}
        </p>
      </div>

      {/* ── 변화 지수 차트 (로그 2개 이상일 때만) ─────────── */}
      {stats?.change_score_history?.length >= 2 && (
        <ChangeScoreChart history={stats.change_score_history} />
      )}

      {/* 내 별 이야기 — 항해 로그 기반 (daily만, resonance 제외) */}
      {(() => {
        const displayLogs = voyageLogs.filter(log => log.source === 'daily' || !log.source);
        if (displayLogs.length === 0) return null;
        return (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/3 border border-white/8 rounded-3xl p-5 mb-6"
        >
          <p className="text-white/40 text-xs mb-3">내 별 이야기</p>
          <div className="flex flex-col">
            {displayLogs.slice(0, 3).map((log, i) => (
              <div
                key={log.id ?? i}
                className={`flex items-start gap-3 py-2.5 ${
                  i < Math.min(displayLogs.length, 3) - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <span className="text-white/30 text-xs flex-shrink-0 mt-0.5 w-10">
                  D+{log.day_number}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-white/65 text-sm leading-relaxed">{log.growth}</p>
                  {log.tag && (
                    <span style={{
                      display: 'inline-block', fontSize: 10,
                      padding: '1px 8px', borderRadius: 9999,
                      background: 'rgba(155,135,245,0.12)',
                      border: '1px solid rgba(155,135,245,0.2)',
                      color: 'rgba(155,135,245,0.65)',
                      alignSelf: 'flex-start',
                    }}>
                      {log.tag}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        );
      })()}

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
        </div>
      )}

      {/* 성장 질문 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/3 border border-white/8 rounded-3xl p-5 mb-6"
      >
        <p className="text-white/50 text-xs mb-3">오늘 나는 어떻게 달라졌나요?</p>
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

      {/* ✨ Aurora5 */}
      <div className="border border-white/8 rounded-2xl p-4 mb-4">
        <p className="text-white/25 text-xs mb-2">
          ✨ Aurora5{todaySchedule ? ` · D+${todaySchedule.day_number}` : ''}
        </p>
        <p className="text-white/55 text-sm leading-relaxed whitespace-pre-line">
          {todaySchedule?.message_text ?? getAurora5Message(star.galaxy?.code, daysSinceBirth)}
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 mt-6">
        {/* PRIMARY — 이 별 이어가기 (오늘 완료 시 안내 표시) */}
        {doneTodayFlag ? (
          <div className="w-full bg-white/5 border border-white/10 text-white/40 text-sm font-medium py-4 rounded-2xl text-center">
            오늘 항해는 완료했어요 ✦
          </div>
        ) : (
          <button
            onClick={() => nav(`/wish?from=gift&star_id=${star.star_id}`)}
            className="w-full bg-dream-purple hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-colors"
          >
            소원별 이어가기 ✨
          </button>
        )}
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

        {/* ── 별 선물하기 (카카오 키 있을 때만 노출) ──── */}
        {import.meta.env.VITE_KAKAO_JS_KEY && (
          !giftDone ? (
            !showGift ? (
              <button
                onClick={() => setShowGift(true)}
                className="w-full bg-white/5 border border-white/10 text-white/60 font-medium py-4 rounded-2xl hover:bg-white/10 transition-colors"
              >
                별 선물하기 🎁
              </button>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/40 text-xs mb-3 text-center">누구에게 선물할까요?</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['lover', 'parent', 'friend'].map(type => (
                    <button
                      key={type}
                      onClick={() => setGiftCopyType(type)}
                      className={`py-2.5 rounded-xl text-sm border transition-colors ${
                        giftCopyType === type
                          ? 'border-star-gold/60 bg-star-gold/10 text-star-gold'
                          : 'border-white/10 text-white/50 hover:border-white/25'
                      }`}
                    >
                      {GIFT_LABELS[type]}
                    </button>
                  ))}
                </div>
                {giftCopyType && (
                  <>
                    <p className="text-white/50 text-xs text-center italic mb-3 leading-relaxed">
                      &ldquo;{GIFT_COPIES[giftCopyType]}&rdquo;
                    </p>
                    <button
                      onClick={handleGift}
                      disabled={giftPosting}
                      className="w-full bg-star-gold/15 hover:bg-star-gold/25 border border-star-gold/40 text-star-gold font-semibold py-3 rounded-xl transition-colors disabled:opacity-40"
                    >
                      {giftPosting ? '준비 중...' : '소원별 선물하기 ✨'}
                    </button>
                  </>
                )}
              </div>
            )
          ) : (
            <div className="bg-dream-purple/8 border border-dream-purple/20 rounded-2xl p-4 text-center">
              <p className="text-white/60 text-sm">소원별이 두 사람의 하늘에 닿았어요 ✦</p>
            </div>
          )
        )}

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

// ── 변화 지수 SVG 차트 ──────────────────────────────────────
function ChangeScoreChart({ history }) {
  if (!history || history.length < 2) return null;
  const W = 300, H = 72, PAD = 6;
  const scores = history.map(h => h.score);
  const minS   = Math.min(...scores);
  const maxS   = Math.max(...scores);
  const rangeS = Math.max(maxS - minS, 10);

  const pts = scores.map((s, i) => {
    const x = PAD + (i / (scores.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (s - minS) / rangeS) * (H - PAD * 2 - 8);
    return [x, y];
  });

  const linePath = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ');
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]} ${H - PAD} L ${pts[0][0]} ${H - PAD} Z`;
  const last = pts[pts.length - 1];

  return (
    <div className="mb-5">
      <p style={{ color: 'rgba(232,228,217,0.5)', fontSize: 11, marginBottom: 8, paddingLeft: 4 }}>
        변화 지수 추이
      </p>
      <div style={{
        borderRadius: 16, overflow: 'hidden',
        background: '#1e3248',
        border: '1px solid rgba(255,215,106,0.1)',
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          <defs>
            <linearGradient id="sgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#FFD76A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFD76A" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#sgGrad)" />
          <path d={linePath} fill="none" stroke="#FFD76A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last[0]} cy={last[1]} r="4" fill="#FFD76A" />
          <circle cx={last[0]} cy={last[1]} r="7" fill="#FFD76A" fillOpacity="0.15" />
        </svg>
      </div>
    </div>
  );
}
