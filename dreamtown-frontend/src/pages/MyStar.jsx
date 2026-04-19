import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getStar, getGalaxyStars, getResonance, postGrowthLog, getVoyageLogs, createGift, getOrCreateUserId, postAurora5Message, getTodaySchedule, getStarStats, getStarDetail, getArtifactJob, getGrowthSummary, getRouteRecommendation, startJourneyFromRecommendation, getWisdom, logFlowEvent, getJourneyStory, putJourneyStory } from '../api/dreamtown.js';
import { saveStarId, clearStarId, readSavedStar } from '../lib/utils/starSession.js';
import MilestoneBar from '../components/MilestoneBar';
import { useDreamtownStore } from '../store/dreamtownStore';
import AURUM_MESSAGES from '../constants/aurumMessages';
import { sharePostcard } from '../utils/kakaoShare';
import { gaGrowthLogged, gaMilestoneDay7, gaResonanceReceived } from '../utils/gtag';
import { logEvent } from '../lib/events.js';
import StarDetail from './StarDetail';

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

const STAR_LEVEL_CONFIG = [
  { level: 0, msg: '아직 조용한 별이에요',     color: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.08)' },
  { level: 1, msg: '작은 공명이 시작됐어요',   color: 'rgba(155,135,245,0.08)', text: 'rgba(155,135,245,0.75)', border: 'rgba(155,135,245,0.18)' },
  { level: 2, msg: '별이 조금 밝아졌어요',     color: 'rgba(99,210,255,0.08)',  text: 'rgba(99,210,255,0.80)',  border: 'rgba(99,210,255,0.20)' },
  { level: 3, msg: '많은 마음이 모인 별이에요', color: 'rgba(255,215,106,0.10)', text: '#FFD76A',               border: 'rgba(255,215,106,0.25)' },
];

function getStarLevel(resonanceUsersCount) {
  const n = resonanceUsersCount ?? 0;
  if (n < 1)  return STAR_LEVEL_CONFIG[0];
  if (n < 3)  return STAR_LEVEL_CONFIG[1];
  if (n < 10) return STAR_LEVEL_CONFIG[2];
  return STAR_LEVEL_CONFIG[3];
}

function getStarCTA(level) {
  switch (level) {
    case 0: return '첫 마음을 남겨보세요';
    case 1: return '조금 더 밝혀볼까요';
    case 2: return '이 별을 더 빛나게 해주세요';
    case 3: return '다른 별에도 마음을 전해보세요';
    default: return '';
  }
}

function getAurumMessage(daysSinceBirth) {
  return AURUM_MESSAGES.find(m => m.day === daysSinceBirth)
    ?? AURUM_MESSAGES[AURUM_MESSAGES.length - 1];
}

const GROWTH_STORAGE_KEY = (starId) => `dt_growth_reflection_${starId}`;

export default function MyStar() {
  const { id } = useParams();
  const myStarId = readSavedStar();
  const isOwner = myStarId === id;

  // ── 모든 훅을 조건 분기 이전에 선언 (Rules of Hooks) ──────────────
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

  // 성장 요약 집계
  const [growthSummary, setGrowthSummary] = useState(null);

  // 항로 추천
  const [recommendation, setRecommendation]     = useState(null);
  const [journeyStarting, setJourneyStarting]   = useState(false);
  const [journeyStarted, setJourneyStarted]     = useState(false);

  // K-지혜 (30% 확률, 별 페이지)
  const [wisdom, setWisdom] = useState(null);

  // 이용권 탭
  const [myCredentials, setMyCredentials] = useState(null);   // null=미조회, []=없음

  // 여수 미션 요약
  const [missionSummary, setMissionSummary] = useState(null); // { completed_count, total_count, total_points }

  // 닉네임
  const [nickname, setNickname] = useState('소원이');

  // 결제 완료 배너 (?paid=true 진입 시)
  const [showPaidBanner, setShowPaidBanner] = useState(
    () => new URLSearchParams(window.location.search).get('paid') === 'true'
  );

  // 선물하기 상태
  const [showGift, setShowGift] = useState(false);
  const [giftCopyType, setGiftCopyType] = useState(null);
  const [giftPosting, setGiftPosting] = useState(false);
  const [giftDone, setGiftDone] = useState(false);
  // ── AI 트리거 (Day3/Day7 리텐션) ────────────────────────────
  const [lumi, setLumi] = useState(null);
  const [showMore, setShowMore] = useState(false);

  // ── 공개용 항해 장면 ──────────────────────────────────────────
  const [journeyStory, setJourneyStory]   = useState(null);   // 서버 저장값
  const [journeyEditing, setJourneyEditing] = useState(false);
  const [journeyDraft, setJourneyDraft]   = useState({ origin: '', shift: '', now: '', visibility: 'private' });
  const [journeySaving, setJourneySaving] = useState(false);
  const [journeySaved, setJourneySaved]   = useState(false);
  const [journeyWarn, setJourneyWarn]     = useState(null);

  // ── AI 트리거 체크 (Day3/Day7 리텐션 — 앱 진입 시 1회) ──────
  useEffect(() => {
    if (!isOwner) return;
    const userId = getOrCreateUserId();
    fetch(`/api/dt/ai-trigger/check?userId=${encodeURIComponent(userId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.lumi) setLumi(data.lumi); })
      .catch(() => {});
  }, [isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 소유자 전용 데이터 로드 (isOwner=false 시 즉시 반환) ──────────
  useEffect(() => {
    if (!isOwner) return;
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

        // 성장 요약 집계
        getGrowthSummary(data.star_id)
          .then(s => setGrowthSummary(s))
          .catch(() => setGrowthSummary(null));

        // 항로 추천
        getRouteRecommendation(data.star_id)
          .then(r => setRecommendation(r))
          .catch(() => setRecommendation(null));

        // K-지혜 (30% 확률, star context)
        getWisdom({ starId: data.star_id, context: 'star' })
          .then(w => w?.show ? setWisdom(w.message) : null)
          .catch(() => null);

        // 공개용 항해 장면 로드
        getJourneyStory(data.star_id).then(s => {
          setJourneyStory(s);
          setJourneyDraft({ origin: s.origin ?? '', shift: s.shift ?? '', now: s.now ?? '', visibility: s.visibility ?? 'private' });
        }).catch(() => {});

        // 여수 미션 요약
        Promise.all([
          fetch(`/api/yeosu-missions?star_id=${encodeURIComponent(data.star_id)}`).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`/api/yeosu-missions/points?star_id=${encodeURIComponent(data.star_id)}`).then(r => r.ok ? r.json() : null).catch(() => null),
        ]).then(([mData, pData]) => {
          if (mData?.success && pData?.success) {
            setMissionSummary({
              completed_count: mData.completed_count ?? 0,
              total_count:     mData.total_count ?? 5,
              total_points:    pData.total_points ?? 0,
            });
          }
        }).catch(() => {});

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
        // 별 조회 실패 → 로컬 세션 초기화 후 소원 선택 화면으로 복구
        clearStarId();
        nav('/wish/select', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── 소원그림 폴링 — artifact_status가 pending/processing인 동안 10초마다 갱신 ──
  useEffect(() => {
    if (!isOwner || !star?.star_id) return;
    const status = star.artifact_status;
    if (status !== 'pending' && status !== 'processing') return;

    const timer = setInterval(async () => {
      try {
        const data = await getStar(star.star_id);
        setStar(prev => ({
          ...prev,
          wish_image_url:  data.wish_image_url  ?? prev.wish_image_url,
          artifact_status: data.artifact_status ?? prev.artifact_status,
        }));
      } catch (_) {}
    }, 10000);

    return () => clearInterval(timer);
  }, [star?.artifact_status, star?.star_id, isOwner]);

  function handleGrowthSave() {
    if (!growthText.trim() || !star) return;
    localStorage.setItem(GROWTH_STORAGE_KEY(star.star_id), growthText.trim());
    setGrowthSaved(true);
    gaGrowthLogged({ starId: star.star_id });
    // 서버에도 저장 (CASE 2: connection_completed 트리거 — fire-and-forget)
    postGrowthLog(star.star_id, growthText.trim()).catch(() => {});
  }

  // ── 비소유자 → StarDetail public/resonance 위임 ────────────────────
  // 모든 훅 선언·useEffect 이후에 위치 (Rules of Hooks 준수)
  if (!isOwner) {
    const fromResonance =
      new URLSearchParams(window.location.search).get('from');
    const mode = fromResonance ? 'resonance' : 'public';
    return <StarDetail starId={id} viewMode={mode} />;
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
    logEvent('conversion_action', { action_type: 'share', value: null });
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
      {/* 결제 완료 배너 */}
      {showPaidBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
          <div className="bg-indigo-600 text-white text-sm text-center rounded-xl px-4 py-3 shadow-lg flex items-center justify-between gap-3">
            <span>✨ 여정이 시작됐어요. 별이 당신을 기다리고 있어요.</span>
            <button onClick={() => setShowPaidBanner(false)} className="shrink-0 opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}
      {/* ── 루미 카드 (Day3/Day7 리텐션 트리거) ── */}
      {lumi && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
            zIndex: 40, width: '90%', maxWidth: 360,
            background: 'linear-gradient(135deg, rgba(13,27,42,0.97) 0%, rgba(20,38,58,0.97) 100%)',
            border: '1px solid rgba(255,215,106,0.28)',
            borderRadius: 18, padding: '18px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.7)', marginBottom: 6, letterSpacing: '0.04em' }}>
            ✨ 루미의 발견
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 14 }}>
            &ldquo;{lumi.message}&rdquo;
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                logFlowEvent({
                  userId: getOrCreateUserId(),
                  stage: 'recommendation', action: 'click',
                  value: { trigger: lumi.trigger },
                });
                setLumi(null);
                // 성장 입력 화면으로 자연 이동
                nav('/day', { state: { isDay3Resume: true } });
              }}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 9999,
                background: '#FFD76A', color: '#0D1B2A',
                fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
              }}
            >
              {lumi.cta}
            </button>
            <button
              onClick={() => setLumi(null)}
              style={{
                padding: '11px 16px', borderRadius: 9999,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer',
              }}
            >
              나중에
            </button>
          </div>
        </motion.div>
      )}

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

        {/* 한정 별 뱃지 — 섬박람회 등 이벤트 기간 탄생 별만 표시 */}
        {star.star_rarity === 'limited' && star.source_event === 'island_expo_2026' && (
          <div style={{
            display: 'inline-block',
            border: '1px solid rgba(232,160,0,0.55)',
            borderRadius: 8,
            padding: '3px 10px',
            fontSize: 12,
            color: '#E8A000',
            background: 'rgba(232,160,0,0.08)',
            marginBottom: 8,
            letterSpacing: '0.03em',
          }}>
            ✦ 2026 세계섬박람회 탄생
          </div>
        )}

        {star.wish_text && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>
            &ldquo;{star.wish_text.length > 40 ? star.wish_text.slice(0, 40) + '…' : star.wish_text}&rdquo;
          </p>
        )}

        {/* ── 각성 상태 문구 (케이블카 캐빈 등 장소 기반) ── */}
        {star.status && star.status !== 'created' && (
          <div style={{
            margin: '4px 0 16px',
            padding: '10px 14px',
            borderRadius: 10,
            background: star.status === 'unified'
              ? 'rgba(255,215,0,0.08)'
              : 'rgba(155,135,245,0.08)',
            border: `1px solid ${star.status === 'unified' ? 'rgba(255,215,0,0.2)' : 'rgba(155,135,245,0.18)'}`,
            fontSize: 13,
            color: star.status === 'unified' ? '#FFD700' : '#9B87F5',
            lineHeight: 1.6,
          }}>
            {{
              awakened: '당신의 이야기가 시작되었습니다',
              growing:  '다시 이곳에 오셨네요. 당신의 별이 더 밝아집니다',
              unified:  '지금까지의 순간이 하나로 이어졌어요',
            }[star.status] || ''}
            {star.awakened_place === 'yeosu_cablecar_cabin' && (
              <span style={{ display: 'block', fontSize: 11, color: '#7A6E9C', marginTop: 4 }}>
                여수 케이블카 캐빈에서
              </span>
            )}
          </div>
        )}

        {/* status === 'created' → 아직 연결 전 */}
        {(!star.status || star.status === 'created') && star.origin_type === null && (
          <div style={{
            margin: '4px 0 16px',
            fontSize: 12,
            color: '#5a5370',
            fontStyle: 'italic',
          }}>
            아직 연결되지 않은 이야기
          </div>
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
          {stats != null && (() => {
            const { level, msg, color, text, border } = getStarLevel(stats.resonance_users_count);
            const cta = getStarCTA(level);
            return (
              <div className="col-span-2" style={{ background: color, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 3, letterSpacing: '0.04em' }}>별 성장</p>
                <p style={{ fontSize: 13, color: text, fontWeight: 500 }}>Lv.{level} · {msg}</p>
                {cta && (
                  <p style={{ marginTop: 6, fontSize: 14, color: '#9B87F5', fontWeight: 500 }}>{cta}</p>
                )}
              </div>
            );
          })()}
        </div>

      </motion.div>

      {/* 감정 메시지 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{ textAlign: 'center', fontSize: 16, fontWeight: 300, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em', marginBottom: 24, marginTop: 4 }}
      >
        조금 또렷해졌어요
      </motion.p>

      {/* 핵심 행동 2개 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => nav(`/promise/create?starId=${star.star_id}`)}
          style={{ width: '100%', padding: '16px 0', borderRadius: 9999, background: 'rgba(255,215,106,0.12)', border: '1px solid rgba(255,215,106,0.3)', color: '#FFD76A', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}
        >
          약속 이어가기 ✦
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => nav('/stars')}
          style={{ width: '100%', padding: '16px 0', borderRadius: 9999, background: 'rgba(155,135,245,0.1)', border: '1px solid rgba(155,135,245,0.25)', color: '#9B87F5', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          공명해보기
        </motion.button>
      </div>

      {/* 더 보기 토글 */}
      <button
        onClick={() => setShowMore(v => !v)}
        style={{ width: '100%', padding: '12px 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer', letterSpacing: '0.01em', marginBottom: 8 }}
      >
        {showMore ? '접기 ▲' : '더 보기 ▾'}
      </button>

      {showMore && (
      <div>

      {/* ── 🌊 공개용 항해 장면 편집 ─────────────────────────── */}
      {(() => {
        const PRESETS = {
          origin: ['작은 마음 하나에서 시작했어요', '막막했지만 시작해야 했어요', '오래된 꿈이 다시 떠올랐어요', '누군가의 한 마디가 시작이었어요'],
          shift:  ['조금 더 또렷해졌어요', '생각보다 많이 흔들렸어요', '작은 진전이 생겼어요', '예상과 다르게 흘러가고 있어요'],
          now:    ['여전히 조용히 이어가고 있어요', '조금씩 나아가고 있어요', '다시 첫 마음으로 돌아왔어요', '아직 안개 속이지만 계속해요'],
        };
        const WARN_PHRASES = ['쓸모없어', '나는 최악', '내가 문제야', '못난이야'];
        const hasStory = journeyStory?.origin || journeyStory?.shift || journeyStory?.now;

        async function saveJourneyStory() {
          const texts = [journeyDraft.origin, journeyDraft.shift, journeyDraft.now];
          const warned = WARN_PHRASES.some(p => texts.some(t => t?.includes(p)));
          if (warned) { setJourneyWarn('이 표현은 자신에게 너무 가혹할 수 있어요. 조금 부드럽게 바꿔볼까요?'); return; }
          setJourneyWarn(null);
          setJourneySaving(true);
          try {
            const res = await putJourneyStory(star.star_id, { ...journeyDraft, userId: getOrCreateUserId() });
            if (res.error === 'blocked') { setJourneyWarn(res.message); return; }
            setJourneyStory({ origin: journeyDraft.origin, shift: journeyDraft.shift, now: journeyDraft.now, visibility: journeyDraft.visibility });
            setJourneyEditing(false);
            setJourneySaved(true);
            setTimeout(() => setJourneySaved(false), 2000);
          } catch { setJourneyWarn('저장에 실패했어요. 잠시 후 다시 시도해주세요.'); }
          finally { setJourneySaving(false); }
        }

        function SentencePicker({ field, label }) {
          const isCustom = journeyDraft[field] && !PRESETS[field].includes(journeyDraft[field]);
          return (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{label}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {PRESETS[field].map(s => (
                  <button key={s} onClick={() => setJourneyDraft(d => ({ ...d, [field]: s }))}
                    style={{
                      textAlign: 'left', padding: '8px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                      background: journeyDraft[field] === s ? 'rgba(155,135,245,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${journeyDraft[field] === s ? 'rgba(155,135,245,0.40)' : 'rgba(255,255,255,0.08)'}`,
                      color: journeyDraft[field] === s ? 'rgba(155,135,245,0.95)' : 'rgba(255,255,255,0.55)',
                    }}
                  >{s}</button>
                ))}
                <input
                  placeholder="직접 입력..."
                  value={isCustom ? journeyDraft[field] : ''}
                  onChange={e => setJourneyDraft(d => ({ ...d, [field]: e.target.value }))}
                  style={{
                    padding: '8px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                    background: isCustom ? 'rgba(255,215,106,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isCustom ? 'rgba(255,215,106,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                />
              </div>
            </div>
          );
        }

        return (
          <div style={{ marginBottom: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: journeyEditing ? 16 : 0 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>🌊 항해 장면</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {journeyStory?.visibility === 'public' && (
                  <span style={{ fontSize: 10, color: 'rgba(155,135,245,0.70)', background: 'rgba(155,135,245,0.10)', border: '1px solid rgba(155,135,245,0.20)', borderRadius: 9999, padding: '2px 8px' }}>공개 중</span>
                )}
                {journeySaved && <span style={{ fontSize: 11, color: 'rgba(74,222,128,0.8)' }}>저장됨 ✓</span>}
                <button onClick={() => setJourneyEditing(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  {journeyEditing ? '닫기' : (hasStory ? '편집' : '설정하기')}
                </button>
              </div>
            </div>

            {/* 미편집 상태: 현재 장면 미리보기 */}
            {!journeyEditing && hasStory && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {[{ label: '처음,', val: journeyStory.origin }, { label: '그 사이,', val: journeyStory.shift }, { label: '지금,', val: journeyStory.now }]
                  .filter(r => r.val)
                  .map(r => (
                    <p key={r.label} style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 1.6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.28)', marginRight: 6 }}>{r.label}</span>
                      {r.val}
                    </p>
                  ))}
              </div>
            )}
            {!journeyEditing && !hasStory && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 8 }}>
                이 별의 항해를 장면으로 남겨보세요
              </p>
            )}

            {/* 편집 모드 */}
            {journeyEditing && (
              <div>
                <SentencePicker field="origin" label="처음," />
                <SentencePicker field="shift"  label="그 사이," />
                <SentencePicker field="now"    label="지금," />

                {journeyWarn && (
                  <p style={{ fontSize: 12, color: 'rgba(255,165,0,0.85)', marginBottom: 10, padding: '8px 10px', background: 'rgba(255,165,0,0.08)', borderRadius: 8, border: '1px solid rgba(255,165,0,0.18)' }}>
                    ⚠️ {journeyWarn}
                  </p>
                )}

                {/* 공개 설정 */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {[{ val: 'private', label: '🔒 나만 보기' }, { val: 'public', label: '🌐 함께 나누기' }].map(opt => (
                    <button key={opt.val} onClick={() => setJourneyDraft(d => ({ ...d, visibility: opt.val }))}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 9999, fontSize: 12, cursor: 'pointer',
                        background: journeyDraft.visibility === opt.val ? 'rgba(155,135,245,0.12)' : 'transparent',
                        border: `1px solid ${journeyDraft.visibility === opt.val ? 'rgba(155,135,245,0.35)' : 'rgba(255,255,255,0.10)'}`,
                        color: journeyDraft.visibility === opt.val ? 'rgba(155,135,245,0.90)' : 'rgba(255,255,255,0.38)',
                      }}
                    >{opt.label}</button>
                  ))}
                </div>

                <button onClick={saveJourneyStory} disabled={journeySaving}
                  style={{ width: '100%', padding: '12px 0', borderRadius: 9999, fontSize: 14, fontWeight: 600, cursor: journeySaving ? 'not-allowed' : 'pointer', background: 'rgba(155,135,245,0.15)', border: '1px solid rgba(155,135,245,0.35)', color: '#9B87F5', opacity: journeySaving ? 0.6 : 1 }}>
                  {journeySaving ? '저장 중...' : '장면 저장하기'}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 여수 미션 진입 배너 ──────────────────────────────── */}
      {missionSummary !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          onClick={() => nav(`/missions?star_id=${star.star_id}`)}
          style={{
            marginBottom: 16,
            background: 'linear-gradient(135deg, rgba(155,135,245,0.1) 0%, rgba(255,215,106,0.05) 100%)',
            border: '1px solid rgba(155,135,245,0.22)',
            borderRadius: 18,
            padding: '14px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E8E4F0', marginBottom: 3 }}>
              🚡 여수 미션
            </div>
            <div style={{ fontSize: 11, color: '#7A6E9C' }}>
              {missionSummary.completed_count}/{missionSummary.total_count} 완료 · {missionSummary.total_points}P 획득
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFD76A', lineHeight: 1 }}>
              {missionSummary.total_points.toLocaleString()}P
            </div>
            <div style={{ fontSize: 10, color: '#7A6E9C', marginTop: 2 }}>미션 바로가기 →</div>
          </div>
        </motion.div>
      )}

      {/* ── 100일 이벤트 배너 (days >= 100) ── */}
      {daysSinceBirth >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => {
            console.info(JSON.stringify({
              requestId: `100d-entry-${Date.now().toString(36)}`,
              user_id:   getOrCreateUserId(),
              star_id:   star.star_id,
              action:    'story_100day_entry',
            }));
            nav(`/my-star/${star.star_id}/100days`);
          }}
          className="mb-4 bg-star-gold/8 border border-star-gold/25 rounded-2xl px-5 py-4 cursor-pointer hover:bg-star-gold/12 transition-all"
        >
          <p className="text-star-gold font-semibold text-sm mb-0.5">🌟 100일의 이야기</p>
          <p className="text-white/50 text-xs">당신의 이야기가 100일을 넘었습니다 →</p>
        </motion.div>
      )}

      {/* ── 내 이야기 초안 보기 (별 카드 바로 아래, 항상 노출) ── */}
      <button
        onClick={() => {
          const uid = getOrCreateUserId();
          console.info(JSON.stringify({
            requestId: `book-entry-${Date.now().toString(36)}`,
            user_id:   uid,
            star_id:   star.star_id,
            action:    'book_entry_click',
          }));
          nav(`/my-star/${star.star_id}/book`);
        }}
        className="w-full mb-4 bg-white/5 border border-star-gold/25 text-star-gold/75 font-semibold py-3.5 rounded-2xl hover:bg-star-gold/8 hover:border-star-gold/45 hover:text-star-gold transition-all text-sm"
      >
        📖 나의 이야기 초안 보기
      </button>

      {/* ── 6개월 작품 게이트 (days >= 180) ── */}
      {daysSinceBirth >= 180 && (
        <button
          onClick={() => {
            console.info(JSON.stringify({
              requestId: `masterpiece-${Date.now().toString(36)}`,
              user_id:   getOrCreateUserId(),
              star_id:   star.star_id,
              action:    'book_masterpiece_impression',
            }));
            nav(`/my-star/${star.star_id}/masterpiece`);
          }}
          className="w-full mb-6 bg-gradient-to-r from-dream-purple/20 to-violet-500/20 border border-violet-400/30 text-violet-300/80 font-semibold py-3.5 rounded-2xl hover:border-violet-400/50 hover:text-violet-300 transition-all text-sm"
        >
          내 이야기를 작품으로 만들기 ✦
        </button>
      )}

      {/* ── 소원그림 카드 ──────────────────────────────────── */}
      {star.artifact_status && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          {star.artifact_status === 'done' && star.wish_image_url ? (
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <img
                src={star.wish_image_url}
                alt="소원그림"
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : star.artifact_status === 'pending' || star.artifact_status === 'processing' ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="text-2xl mb-3 inline-block"
              >✨</motion.div>
              <p className="text-white/60 text-sm">소원그림을 그리는 중이에요...</p>
              <p className="text-white/30 text-xs mt-1">잠시 후 자동으로 나타납니다</p>
            </div>
          ) : star.artifact_status === 'failed' ? (
            <div className="bg-white/5 border border-red-500/20 rounded-2xl p-4 text-center">
              <p className="text-red-400/60 text-xs">소원그림 생성에 실패했어요</p>
            </div>
          ) : null}
        </motion.div>
      )}

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

      {/* 성장 요약 카드 */}
      {growthSummary && growthSummary.total_logs > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5 space-y-3"
        >
          {/* 대표 성장 문장 */}
          {growthSummary.summary_line && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/35 text-[11px] mb-1">✦ 내 별의 대표 성장 문장</p>
              <p className="text-white/85 text-sm leading-relaxed font-medium">
                &ldquo;{growthSummary.summary_line}&rdquo;
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {/* 최근 변화 */}
            {growthSummary.latest && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-3">
                <p className="text-white/30 text-[10px] mb-1">최근 변화</p>
                <p className="text-white/70 text-xs leading-snug line-clamp-2">
                  {growthSummary.latest.growth_message ?? '—'}
                </p>
              </div>
            )}

            {/* 누적 변화 */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-3">
              <p className="text-white/30 text-[10px] mb-1">누적 기록</p>
              <p className="text-white/70 text-xs">{growthSummary.total_logs}번의 성장</p>
            </div>
          </div>

          {/* 감정 / 도움 태그 배지 */}
          {(growthSummary.top_emotion || growthSummary.top_help) && (
            <div className="flex gap-2 flex-wrap">
              {growthSummary.top_emotion && (
                <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300/80 text-[11px]">
                  # {growthSummary.top_emotion}
                </span>
              )}
              {growthSummary.top_help && (
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300/80 text-[11px]">
                  # {growthSummary.top_help}
                </span>
              )}
            </div>
          )}
          {/* K-지혜 — 하단 조용한 영역 (30% 확률 등장) */}
          {wisdom && (
            <p className="text-white/25 text-[11px] leading-relaxed text-center pt-1 italic">
              {wisdom}
            </p>
          )}
        </motion.div>
      )}

      {/* 항로 추천 카드 */}
      {recommendation?.routes?.length > 0 && !journeyStarted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-5"
        >
          {/* reason — 현재 흐름 문장 */}
          <p className="text-white/45 text-xs leading-relaxed mb-3 whitespace-pre-line px-1">
            {recommendation.reason}
          </p>

          <div className="space-y-2">
            {recommendation.routes.map((route, idx) => {
              const isPrimary = route.route_code === recommendation.primary;
              return (
                <button
                  key={route.route_code}
                  disabled={journeyStarting}
                  onClick={async () => {
                    setJourneyStarting(true);
                    try {
                      const userId = getOrCreateUserId();
                      await startJourneyFromRecommendation(userId, route.route_code);
                      setJourneyStarted(true);
                    } catch (_) {}
                    setJourneyStarting(false);
                  }}
                  className={[
                    'w-full text-left rounded-2xl px-4 py-3 transition',
                    isPrimary
                      ? 'bg-white/8 border border-white/15 hover:bg-white/12'
                      : 'bg-white/3 border border-white/6 hover:bg-white/6',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={isPrimary ? 'text-white/85 text-sm font-medium' : 'text-white/50 text-sm'}>
                        {route.route_name}
                      </p>
                      {!isPrimary && (
                        <p className="text-white/25 text-[11px] mt-0.5">다른 방향도 괜찮아요</p>
                      )}
                    </div>
                    <span className={isPrimary ? 'text-white/50 text-xs' : 'text-white/20 text-xs'}>
                      {journeyStarting ? '...' : '→'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {journeyStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-5 bg-white/3 border border-white/8 rounded-2xl px-4 py-3"
        >
          <p className="text-white/55 text-sm">항해가 시작됐어요 ✦</p>
        </motion.div>
      )}

      {/* ── 내 이용권 탭 ─────────────────────────────────── */}
      {isOwner && (
        <MyCredentialsSection
          starId={star.star_id}
          credentials={myCredentials}
          onLoad={setMyCredentials}
          onNavigate={nav}
        />
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

      {/* ✨ 공명 상세 — 1회 이상일 때만 노출 */}
      {stats?.resonance_breakdown?.total >= 1 && (() => {
        const bd = stats.resonance_breakdown;
        const rows = [
          { label: '✨ 기적나눔', count: bd.miracle ?? 0 },
          { label: '🧠 지혜나눔', count: bd.wisdom  ?? 0 },
        ];
        return (
          <div style={{
            background: 'rgba(255,215,106,0.06)',
            border: '1px solid rgba(255,215,106,0.15)',
            borderRadius: 16,
            padding: '16px',
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
              ✨ 당신의 별에 닿은 마음들
            </p>
            {rows.map(({ label, count }) => count > 0 && (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                <span style={{ fontSize: 13, color: '#FFD76A' }}>{count}명</span>
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 10 }}>
              &ldquo;{bd.total}명의 마음이 이 별에 닿았어요 ✨&rdquo;
            </p>
          </div>
        );
      })()}

      {/* CTA */}
      <div className="flex flex-col gap-3 mt-6">
        {/* PRIMARY — 소원별 이어가기 */}
        <button
          onClick={() => nav(`/wish?from=mystar&star_id=${star.star_id}`)}
          className="w-full bg-dream-purple hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-colors"
        >
          소원별 이어가기 ✨
        </button>

        {/* 오늘 완료 시 안내 표시 */}
        {doneTodayFlag && (
          <div className="w-full bg-white/5 border border-white/10 text-white/40 text-sm font-medium py-4 rounded-2xl text-center">
            오늘 항해는 완료했어요 ✦
          </div>
        )}
        <button
          onClick={() => {
            logEvent('conversion_action', { action_type: 'share', value: null });
            sharePostcard({
              starName:   star.star_name,
              galaxyName: star.galaxy?.name_ko ?? '미지의 은하',
              dayCount:   daysSinceBirth,
            });
          }}
          className="w-full bg-white/5 border border-white/10 text-white/70 font-semibold py-4 rounded-2xl hover:bg-white/10 transition-colors"
        >
          카톡으로 보내기
        </button>

        {/* ── 별 선물하기 (카카오 키 있을 때만 노출) ──── */}
        {import.meta.env.VITE_KAKAO_JS_KEY && (
          !giftDone ? (
            !showGift ? (
              <div>
                <button
                  onClick={() => setShowGift(true)}
                  className="w-full bg-white/5 border border-white/10 text-white/60 font-medium py-4 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  별 선물하기 🎁
                </button>
                {(() => {
                  if (!star.created_at) return null;
                  const d = new Date(star.created_at);
                  d.setDate(d.getDate() + 7);
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  return (
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 6 }}>
                      D+7 기념일 {mm}.{dd}에 선물해보세요
                    </p>
                  );
                })()}
              </div>
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
            onClick={() => {
              const existingStarId = localStorage.getItem('dt_active_star_id');
              if (existingStarId) {
                localStorage.setItem('dt_prev_star_id', existingStarId);
              }
              clearStarId();
              localStorage.removeItem('dt_current_star');
              window.location.href = window.location.origin + '/wish';
            }}
            className="flex-1 bg-white/5 border border-white/10 text-white/60 font-semibold py-4 rounded-2xl hover:bg-white/10 transition-colors"
          >
            새 소원 만들기
          </button>
        </div>
        <button
          onClick={() => nav('/stars')}
          style={{ width: '100%', padding: '13px 0', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', marginTop: 4 }}
        >
          다른 별 보기
        </button>
      </div>

      </div>
      )}

    </div>
  );
}

// ── 내 이용권 섹션 ──────────────────────────────────────────
const CRED_STATUS = {
  ISSUED:    { label: '사용 가능', color: '#6AE8B8', bg: 'rgba(106,232,184,0.10)' },
  ACTIVE:    { label: '사용 가능', color: '#6AE8B8', bg: 'rgba(106,232,184,0.10)' },
  VERIFIED:  { label: '확인 완료', color: '#FFD76A', bg: 'rgba(255,215,106,0.10)' },
  REDEEMED:  { label: '이용 완료', color: '#9B87F5', bg: 'rgba(155,135,245,0.10)' },
  EXPIRED:   { label: '기간 만료', color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
  CANCELLED: { label: '취소됨',   color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)' },
};

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

function MyCredentialsSection({ starId, credentials, onLoad, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchCredentials() {
    if (credentials !== null) return;   // 이미 조회함
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/dt/credentials/my?star_id=${starId}`);
      const d = await r.json();
      onLoad(d.credentials || []);
    } catch (_) {
      onLoad([]);
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    if (!open) fetchCredentials();
    setOpen(v => !v);
  }

  const activeCount = (credentials || []).filter(c => c.status === 'ISSUED' || c.status === 'ACTIVE').length;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* 탭 버튼 */}
      <button
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 16px',
          background: open ? 'rgba(155,135,245,0.1)' : 'rgba(255,255,255,0.03)',
          border: open ? '1px solid rgba(155,135,245,0.3)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: open ? '14px 14px 0 0' : 14,
          color: '#E8E4F0',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span>
          🎫 내 이용권
          {activeCount > 0 && (
            <span style={{
              marginLeft: 8, fontSize: 11, fontWeight: 800,
              background: '#6AE8B8', color: '#0D1B2A',
              padding: '2px 7px', borderRadius: 10,
            }}>
              {activeCount}
            </span>
          )}
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
      </button>

      {/* 이용권 목록 */}
      {open && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(155,135,245,0.15)',
          borderTop: 'none',
          borderRadius: '0 0 14px 14px',
          padding: 12,
        }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '16px 0' }}>
              불러오는 중...
            </p>
          ) : !credentials || credentials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 6 }}>
                아직 이용권이 없어요
              </p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
                항해 예약 후 자동 발급됩니다
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {credentials.map(c => {
                const s   = CRED_STATUS[c.status] || CRED_STATUS.ISSUED;
                const exp = new Date(c.valid_until);
                const dLeft = Math.max(0, Math.ceil((exp - new Date()) / 86400000));
                const isUsable = c.status === 'ISSUED' || c.status === 'ACTIVE';
                return (
                  <button
                    key={c.credential_code}
                    onClick={() => isUsable && onNavigate(`/ticket/${c.credential_code}`)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: s.bg,
                      border: `1px solid ${s.color}44`,
                      borderRadius: 12,
                      padding: '12px 14px',
                      cursor: isUsable ? 'pointer' : 'default',
                      opacity: c.status === 'EXPIRED' || c.status === 'CANCELLED' ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#E8E4F0' }}>
                        {c.benefit_name}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: s.color,
                        background: s.bg, border: `1px solid ${s.color}55`,
                        padding: '2px 8px', borderRadius: 8, whiteSpace: 'nowrap',
                        marginLeft: 8,
                      }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      <span>{c.credential_code}</span>
                      <span>
                        {c.status === 'REDEEMED'
                          ? `${new Date(c.redeemed_at).toLocaleDateString('ko-KR')} 사용`
                          : dLeft > 0
                            ? `${dLeft}일 남음`
                            : '만료'}
                      </span>
                    </div>
                    {isUsable && (
                      <p style={{ fontSize: 10, color: s.color, marginTop: 6, opacity: 0.75 }}>
                        탭하면 QR 화면으로 이동해요 →
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
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
