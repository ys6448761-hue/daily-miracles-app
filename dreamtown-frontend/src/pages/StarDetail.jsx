import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStarDetail, getStar, getResonance, postVoyageLog, postDtResonance, getSimilarStars, getRelatedStars, getResonancePeople, logUserEvent, getOrCreateUserId } from '../api/dreamtown.js';
import MilestoneBar from '../components/MilestoneBar';
import { gaResonanceCreated, gaResonanceClick, gaResonanceSuccess, gaResonanceCTAClick, gaSimilarStarClick, gaSquareFallbackClick, gaSimularStarsEmptyView } from '../utils/gtag';
import { readSavedStar } from '../lib/utils/starSession.js';
import { generateResonanceHint } from '../utils/resonanceHint.js';

// ── 스타일 상수 ──────────────────────────────────────────────────
const GALAXY_STYLE = {
  growth:       { label: '성장 은하', cls: 'bg-blue-500/20 text-blue-300' },
  challenge:    { label: '도전 은하', cls: 'bg-orange-500/20 text-orange-300' },
  healing:      { label: '치유 은하', cls: 'bg-green-500/20 text-green-300' },
  relationship: { label: '관계 은하', cls: 'bg-pink-500/20 text-pink-300' },
  miracle:      { label: '기적 은하', cls: 'bg-purple-500/20 text-purple-300' },
};

const AURORA5_3LINES = {
  growth:       '성장을 향한 이 마음을 함께 바라고 있어요.\n조금씩 나아가는 것만으로 충분해요.\n같은 마음을 가진 소원이들이 있어요.',
  challenge:    '용기를 낸 이 마음이 여기 있어요.\n두려워도 한 걸음 내딛은 것이 진짜예요.\n같은 두려움을 가진 소원이들이 있어요.',
  healing:      '치유를 바라는 이 마음을 함께 바라고 있어요.\n쉬어가도 괜찮아요. 멈춤도 항해예요.\n같은 아픔을 지나온 소원이들이 있어요.',
  relationship: '연결을 바라는 이 마음이 여기 있어요.\n혼자가 아니라는 걸 이 별이 보여줘요.\n같은 마음을 가진 소원이들이 있어요.',
};

// 공명 버튼 정의 (type별 색상/glow 분리)
const DT_RESONANCE_OPTS = [
  {
    type:    'miracle',
    label:   '✨ 기적나눔',
    desc:    '조용히 마음을 보낼게요',
    color:   'rgba(255,215,106,0.13)',
    border:  'rgba(255,215,106,0.32)',
    text:    '#FFD76A',
    glow:    '0 0 14px 2px rgba(255,215,106,0.28)',
    feedback:'✨ 따뜻한 마음이 닿았어요',
  },
  {
    type:    'wisdom',
    label:   '🧠 지혜나눔',
    desc:    '작은 생각을 남겨볼게요',
    color:   'rgba(155,135,245,0.13)',
    border:  'rgba(155,135,245,0.32)',
    text:    'rgba(155,135,245,0.92)',
    glow:    '0 0 14px 2px rgba(155,135,245,0.22)',
    feedback:'🧠 작은 지혜가 전해졌어요',
  },
];

// ── 공명 카운트 → 감정 문장 ───────────────────────────────────────
function countToEmotion(count) {
  if (count === 0) return '첫 마음이 되어보세요';
  if (count === 1) return '한 마음이 닿았어요';
  if (count <= 4)  return '작은 마음들이 모이고 있어요';
  if (count <= 10) return '따뜻한 마음들이 모여요';
  if (count <= 30) return '많은 마음이 함께해요';
  return '수많은 마음이 빛나요';
}

// ── 공명 3별 레벨 계산 (백엔드 동일 로직)
function getResonanceLevel(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 4)  return 2;
  return 3;
}

// ── 공명 히스토리 저장 (localStorage) ────────────────────────────
const RESONANCE_HISTORY_KEY = 'dt_resonated_stars';
function saveResonanceHistory(starId, starName) {
  try {
    const existing = JSON.parse(localStorage.getItem(RESONANCE_HISTORY_KEY) || '[]');
    const filtered = existing.filter(e => e.starId !== starId);
    const updated  = [{ starId, starName, ts: Date.now() }, ...filtered].slice(0, 20);
    localStorage.setItem(RESONANCE_HISTORY_KEY, JSON.stringify(updated));
  } catch (_) {}
}

// ── 익명 아바타 색상 (userId 해시 → hsl) ─────────────────────────
function avatarColor(userId) {
  let h = 5381;
  for (let i = 0; i < userId.length; i++) h = ((h << 5) + h) ^ userId.charCodeAt(i);
  return `hsl(${Math.abs(h) % 360}, 52%, 58%)`;
}

// ── 유틸 ────────────────────────────────────────────────────────
function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(
    1,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1
  );
}

// ── CSS keyframes (인라인 <style>) ───────────────────────────────
const KEYFRAMES = `
  /* 카운트 숫자 바운스 — 0.28s */
  @keyframes countBounce {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.4); }
    72%  { transform: scale(0.92); }
    100% { transform: scale(1); }
  }
  .count-bounce { animation: countBounce 0.28s ease; }

  /* 성공 피드백 문구 — 등장 후 자동 소멸 1.3s */
  @keyframes feedbackIn {
    0%   { opacity: 0; transform: translateY(5px); }
    18%  { opacity: 1; transform: translateY(0); }
    72%  { opacity: 1; }
    100% { opacity: 0; transform: translateY(-3px); }
  }
  .feedback-msg { animation: feedbackIn 1.3s ease forwards; }

  /* 별 카드 반짝임 — brightness pulse 0.35s */
  @keyframes starPulse {
    0%   { filter: brightness(1); }
    45%  { filter: brightness(1.45); }
    100% { filter: brightness(1); }
  }
  .star-pulse { animation: starPulse 0.35s ease; }

  /* ✦ 아이콘 scale + glow — 공명 성공 시 0.6s */
  @keyframes starScale {
    0%   { transform: scale(1);   text-shadow: none; }
    35%  { transform: scale(2.0); text-shadow: 0 0 28px 8px rgba(255,215,106,0.7); }
    70%  { transform: scale(1.5); }
    100% { transform: scale(1);   text-shadow: none; }
  }
  .star-icon-pop { animation: starScale 0.65s ease; }

  /* 유사 별 카드 진입 */
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .slide-up { animation: slideUp 0.4s ease forwards; }
`;

// ── 공유 유입 첫 방문 인트로 오버레이 ────────────────────────────
function SharedIntroOverlay({ onFinish }) {
  const BASE = import.meta.env.BASE_URL;
  const [lineIdx, setLineIdx] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLineIdx(1), 700);
    const t2 = setTimeout(() => setLineIdx(2), 2000);
    const t3 = setTimeout(() => setCanSkip(true), 2000);
    const t4 = setTimeout(onFinish, 3500);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onFinish]);

  const LINES = [
    '누군가의 마음이 당신을 여기로 데려왔어요',
    '이곳은, 소원이 별이 되는 곳입니다',
  ];

  return (
    <div
      onClick={canSkip ? onFinish : undefined}
      style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', cursor: canSkip ? 'pointer' : 'default', background: '#060c17' }}
    >
      <img
        src={`${BASE}images/aurum_intro.webp`}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,12,23,0.3), rgba(6,12,23,0.78))' }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 36px', gap: 22 }}>
        {LINES.map((line, i) => (
          <p
            key={i}
            style={{
              opacity: lineIdx > i ? 1 : 0,
              transform: lineIdx > i ? 'translateY(0)' : 'translateY(14px)',
              transition: 'opacity 1.1s ease, transform 1.1s ease',
              color: i === 0 ? 'rgba(255,255,255,0.82)' : 'rgba(255,215,106,0.92)',
              fontSize: 'clamp(16px, 4.5vw, 21px)',
              fontWeight: 300,
              textAlign: 'center',
              lineHeight: 1.75,
              textShadow: '0 2px 20px rgba(0,0,0,0.85)',
              margin: 0,
            }}
          >
            {line}
          </p>
        ))}
      </div>

      {canSkip && (
        <p style={{ position: 'absolute', bottom: 32, right: 24, zIndex: 10, color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          건너뛰기
        </p>
      )}
    </div>
  );
}

// ── 컴포넌트 ─────────────────────────────────────────────────────
export default function StarDetail({ starId: propStarId, viewMode: propViewMode } = {}) {
  const { id: paramId } = useParams();
  const id = propStarId ?? paramId;
  const nav = useNavigate();

  const [detail, setDetail]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [miracleCount, setMiracleCount] = useState(0);
  const [wisdomCount, setWisdomCount]   = useState(0);
  const [submitted, setSubmitted]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  // 애니메이션 상태
  const [animating, setAnimating]       = useState(null);        // 버튼 press 타입
  const [bounceKey, setBounceKey]       = useState({ miracle: 0, wisdom: 0 });
  const [feedbackMsg, setFeedbackMsg]   = useState(null);        // 성공 피드백 문구
  const [starFlash, setStarFlash]       = useState(false);       // 별 카드 반짝
  const [starFlashKey, setStarFlashKey] = useState(0);           // animation 재트리거용
  const [starIconPop, setStarIconPop]   = useState(false);       // ✦ 아이콘 scale pop
  const [starIconKey, setStarIconKey]   = useState(0);
  const [similarStars, setSimilarStars] = useState([]);          // 공명 후 유사 별 목록
  const [storyOpen, setStoryOpen]       = useState(false);       // 이야기 영역 토글
  const [toastMsg, setToastMsg]         = useState(null);        // 공명 즉시 토스트
  const [relatedStars, setRelatedStars] = useState([]);          // 하단 추천 별
  const [shareCopied, setShareCopied]   = useState(false);       // 공유 링크 복사 완료
  const [showStayMsg, setShowStayMsg]   = useState(false);       // 머물기 상태 메시지
  const [resonancePeople, setResonancePeople] = useState({ people: [], total: 0 }); // 공명 참여자
  const [showSharedIntro, setShowSharedIntro] = useState(() => {
    const isShare = typeof window !== 'undefined' && window.location.search.includes('source=share');
    const hasSeen = localStorage.getItem('dt_intro_seen');
    return isShare && !hasSeen;
  });

  const myStarId  = readSavedStar();
  const isOwnStar = !propViewMode && id === myStarId;

  const viewMode    = propViewMode ?? 'resonance';
  const isOwner     = viewMode === 'owner';
  const isResonance = viewMode === 'resonance';
  const isPublic    = viewMode === 'public';
  const canResonate = !isOwner;

  // ── 리다이렉트 + 공유 유입 로그 ────────────────────────────────
  useEffect(() => {
    if (isOwnStar) nav(`/my-star/${id}`, { replace: true });
    if (isShareEntry) {
      logUserEvent({ userId: getOrCreateUserId(), eventType: 'share_link_opened', metadata: { star_id: id } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 머물기 상태 — 4초 후 자동 표시 (1회) ──────────────────────
  useEffect(() => {
    const t = setTimeout(() => setShowStayMsg(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // ── 데이터 로드 ────────────────────────────────────────────────
  useEffect(() => {
    if (isOwnStar || !id) return;

    async function loadDetail() {
      try {
        if (isOwner) {
          const d = await getStarDetail(id);
          setDetail(d);
        } else {
          // resonance/public — 소원 원문·항해기록 fetch 금지
          const star = await getStar(id);
          const daysSinceBirth = calcDaysSinceBirth(star.created_at);
          const MILESTONES = [1, 7, 30, 100, 365];
          const milestoneStatus = MILESTONES.map(day => {
            const d2 = new Date(star.created_at);
            d2.setDate(d2.getDate() + day - 1);
            return {
              day,
              reached: daysSinceBirth >= day,
              date: `${String(d2.getMonth() + 1).padStart(2, '0')}.${String(d2.getDate()).padStart(2, '0')}`,
            };
          });
          setDetail({
            star_id:          star.star_id,
            star_name:        star.star_name,
            galaxy:           star.galaxy,
            days_since_birth: daysSinceBirth,
            created_at:       star.created_at,
            milestone_status: milestoneStatus,
            growth_log_text:  star.growth_log_text ?? null,
            wish_text:        star.wish_text ?? null,
          });
        }
      } catch (_) { /* detail null → 에러 화면 */ }
      setLoading(false);
    }

    loadDetail();
    getResonance(id).then(r => {
      const impacts = r.impacts ?? [];
      setMiracleCount(impacts.find(i => i.type === 'miracle')?.count ?? 0);
      setWisdomCount(impacts.find(i => i.type === 'wisdom')?.count  ?? 0);
    }).catch(() => {});
    getRelatedStars(id).then(r => setRelatedStars(r.stars ?? [])).catch(() => {});
    getResonancePeople(id).then(r => setResonancePeople(r)).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 공명 핸들러 ────────────────────────────────────────────────
  const isInviteEntry = typeof window !== 'undefined' && window.location.search.includes('entry=invite');
  const isShareEntry  = typeof window !== 'undefined' && window.location.search.includes('source=share');

  // ── 공유 핸들러 ────────────────────────────────────────────────
  const SHARE_LEVEL_MSG = [
    '아직 조용한 별이에요',
    '작은 공명이 시작됐어요',
    '별이 조금 밝아졌어요',
    '많은 마음이 모인 별이에요',
  ];

  async function handleShare() {
    const level = getResonanceLevel(miracleCount + wisdomCount);
    const levelMsg = SHARE_LEVEL_MSG[level] ?? SHARE_LEVEL_MSG[0];
    const url = `${window.location.origin}/star/${id}?source=share`;
    const parts = [
      detail.wish_text    ? `"${detail.wish_text}"`  : null,
      detail.wish_emotion ?? null,
      levelMsg,
      '',
      '하루하루의 기적 DreamTown',
      url,
    ].filter(Boolean);
    const text = parts.join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: detail.star_name, text, url });
      } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (_) {}
    }
  }

  function showResonanceToast(type) {
    const msg = type === 'miracle' ? '✨ 작은 마음이 닿았어요' : '🧠 따뜻한 생각이 전해졌어요';
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1000);
  }

  async function handleResonance(type) {
    if (submitting || submitted) return;

    // 0. 즉시 토스트 + resonance_click 이벤트
    showResonanceToast(type);
    gaResonanceClick({ starId: id, type, isInvite: isInviteEntry });
    logUserEvent({ userId: getOrCreateUserId(), eventType: 'resonance_click', metadata: { star_id: id, resonance_type: type, is_invite: isInviteEntry, source: isShareEntry ? 'share' : null } });
    if (isShareEntry) {
      logUserEvent({ userId: getOrCreateUserId(), eventType: 'invite_resonance_started', metadata: { star_id: id, resonance_type: type } });
    }

    // 1. 버튼 press 애니메이션 (scale + glow, 0.2s)
    setAnimating(type);
    setTimeout(() => setAnimating(null), 200);

    // 2. 낙관적 카운트 업데이트
    if (type === 'miracle') {
      setMiracleCount(c => c + 1);
      setBounceKey(k => ({ ...k, miracle: k.miracle + 1 }));
    } else {
      setWisdomCount(c => c + 1);
      setBounceKey(k => ({ ...k, wisdom: k.wisdom + 1 }));
    }

    setSubmitting(true);
    try {
      const dtRes = await postDtResonance({ starId: id, type });
      // 서버 실제 카운트로 동기화 (낙관적 업데이트 오차 보정)
      if (dtRes?.miracleCount != null) setMiracleCount(dtRes.miracleCount);
      if (dtRes?.wisdomCount  != null) setWisdomCount(dtRes.wisdomCount);
      gaResonanceCreated({ starId: id, resonanceType: type });
      gaResonanceSuccess({ starId: id, type, isInvite: isInviteEntry });
      logUserEvent({ userId: getOrCreateUserId(), eventType: 'resonance_created', metadata: { star_id: id, resonance_type: type, is_invite: isInviteEntry } });

      if (myStarId) {
        const label = type === 'miracle' ? '기적나눔' : '지혜나눔';
        postVoyageLog(myStarId, { emotion: label, tag: '공명', growth: label, source: 'resonance' }).catch(() => {});
      }

      // 3. 별 카드 반짝임 (0.35s) + ✦ 아이콘 scale pop
      setStarFlash(true);
      setStarFlashKey(k => k + 1);
      setTimeout(() => setStarFlash(false), 400);

      setStarIconPop(true);
      setStarIconKey(k => k + 1);
      setTimeout(() => setStarIconPop(false), 700);

      // 4. 성공 피드백 문구 (1.5s 자동 소멸) + 히스토리 저장
      setFeedbackMsg('당신의 마음이 닿았어요 ✨');
      saveResonanceHistory(id, detail?.star_name ?? '');
      setSubmitted(true);                           // 버튼 즉시 숨김
      setTimeout(() => setFeedbackMsg(null), 1500);

      // 5. 유사 별 3개 fetch (비동기, 실패 무시)
      getSimilarStars({ starId: id }).then(res => {
        const list = Array.isArray(res) ? res : (res?.stars ?? []);
        const trimmed = list.slice(0, 3);
        setSimilarStars(trimmed);
        logUserEvent({ userId: getOrCreateUserId(), eventType: 'similar_stars_shown', metadata: { star_id: id, count: trimmed.length } });
        if (trimmed.length === 0) {
          gaSimularStarsEmptyView({ starId: id, isInvite: isInviteEntry, hasMyStarId: !!myStarId });
        }
      }).catch(() => {
        gaSimularStarsEmptyView({ starId: id, isInvite: isInviteEntry, hasMyStarId: !!myStarId });
      });

    } catch {
      // 롤백
      if (type === 'miracle') setMiracleCount(c => c - 1);
      else setWisdomCount(c => c - 1);
      logUserEvent({ userId: getOrCreateUserId(), eventType: 'resonance_failed', metadata: { star_id: id, resonance_type: type } });
    } finally {
      setSubmitting(false);
    }
  }

  // ── 이른 반환 ───────────────────────────────────────────────────
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
  if (!detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/50 text-sm">별을 찾을 수 없어요.</p>
        <button
          onClick={() => nav('/dreamtown')}
          className="w-full max-w-xs bg-star-gold/15 border border-star-gold/30 text-star-gold text-sm font-medium py-3 rounded-2xl"
        >
          드림타운 입장 ✦
        </button>
        <button onClick={() => window.history.length > 1 ? nav(-1) : nav('/dreamtown')} className="text-white/25 text-xs">
          ← 돌아가기
        </button>
      </div>
    );
  }

  // ── 파생값 ──────────────────────────────────────────────────────
  const galaxyStyle = GALAXY_STYLE[detail.galaxy?.code] ?? {
    label: detail.galaxy?.name_ko ?? '미지의 은하',
    cls: 'bg-white/10 text-white/50',
  };
  const aurora5Text = AURORA5_3LINES[detail.galaxy?.code]
    ?? '이 소원별은 혼자가 아닙니다.\nAurora5가 함께 항해하고 있어요.\n당신의 마음이 이 별에 닿았어요.';
  const hint = generateResonanceHint({
    wishText:   isOwner ? detail.wish_text : undefined,
    galaxyCode: detail.galaxy?.code,
  });
  const displayText =
    detail?.growth_log_text ??
    detail?.wish_text ??
    hint?.publicLine ??
    '아직 이 별의 이야기가 준비되지 않았어요';

  // ── 렌더 ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col px-6 py-10 pb-6">
      <style>{KEYFRAMES}</style>

      {showSharedIntro && (
        <SharedIntroOverlay onFinish={() => {
          localStorage.setItem('dt_intro_seen', new Date().toISOString().slice(0, 10));
          setShowSharedIntro(false);
        }} />
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => window.history.length > 1 ? nav(-1) : nav('/home')}
          className="text-white/40 hover:text-white/70"
        >
          ← 뒤로
        </button>
        <p className="text-white/40 text-xs">별 상세</p>
        <div className="w-8" />
      </div>

      {/* owner 닉네임 */}
      {isOwner && detail.nickname && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, paddingLeft: 2 }}>
          @{detail.nickname}
        </p>
      )}

      {/* ── ① 별 카드 — 공명 성공 시 starPulse 클래스 적용 ── */}
      <div
        key={starFlashKey}
        className={`bg-white/5 border border-white/10 rounded-3xl p-6 mb-4${starFlash ? ' star-pulse' : ''}`}
      >
        <div className="text-center">
          <div
            key={starIconKey}
            className={`text-5xl mb-4 inline-block${starIconPop ? ' star-icon-pop' : ''}`}
          >✦</div>
          <h1 className="text-2xl font-bold text-star-gold mb-3">{detail.star_name}</h1>

          {/* Public / Resonance: 은하/D+ + 이야기 토글 + 공명 수 */}
          {canResonate && (() => {
            const hasStory = !!(detail.growth_log_text || detail.wish_text);
            return (
              <>
                {/* ① 은하 + D+N 뱃지 */}
                <div className="flex gap-2 justify-center flex-wrap mb-4">
                  <span className={`text-xs px-3 py-1 rounded-full ${galaxyStyle.cls}`}>
                    {galaxyStyle.label}
                  </span>
                  <span className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full">
                    D+{detail.days_since_birth}
                  </span>
                </div>

                {/* ② 이야기 토글 — story 없으면 숨김 */}
                {hasStory && (
                  <div style={{ marginBottom: 12 }}>
                    <button
                      onClick={() => setStoryOpen(o => !o)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: storyOpen ? 'rgba(255,215,106,0.85)' : 'rgba(255,255,255,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        margin: '0 auto',
                        padding: '4px 0',
                        transition: 'color 0.2s',
                      }}
                    >
                      <span style={{
                        display: 'inline-block',
                        transform: storyOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        fontSize: 10,
                      }}>▶</span>
                      이 마음은 어떤 이야기일까요
                    </button>

                    {storyOpen && (
                      <p style={{
                        marginTop: 10,
                        fontSize: 15,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.88)',
                        lineHeight: 1.72,
                        padding: '10px 14px',
                        borderLeft: '3px solid rgba(255,215,106,0.55)',
                        textAlign: 'left',
                        background: 'rgba(255,215,106,0.05)',
                        borderRadius: '0 10px 10px 0',
                      }}>
                        {displayText}
                      </p>
                    )}
                  </div>
                )}

                {/* ③ 공명 수 + 공명 N별 뱃지 — 항상 표시 */}
                <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.65)' }}>
                  {(miracleCount + wisdomCount) > 0
                    ? `✨ ${miracleCount + wisdomCount}개 마음이 닿았어요`
                    : '✨ 아직 마음이 닿지 않은 별이에요'}
                </p>
                {getResonanceLevel(miracleCount + wisdomCount) > 0 && (
                  <p style={{
                    fontSize: 11,
                    color: 'rgba(255,215,106,0.5)',
                    marginTop: 4,
                    letterSpacing: '0.03em',
                  }}>
                    {'✦'.repeat(getResonanceLevel(miracleCount + wisdomCount))}{' '}
                    공명 {getResonanceLevel(miracleCount + wisdomCount)}별
                  </p>
                )}

                {/* ④ 공명 참여자 아바타 */}
                {resonancePeople.total > 0 && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {resonancePeople.people.map((uid, i) => (
                        <div key={uid} style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: avatarColor(uid),
                          border: '2px solid rgba(13,27,42,0.85)',
                          marginLeft: i > 0 ? -9 : 0,
                          flexShrink: 0,
                        }} />
                      ))}
                      {resonancePeople.total > resonancePeople.people.length && (
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.10)',
                          border: '2px solid rgba(13,27,42,0.85)',
                          fontSize: 9, color: 'rgba(255,255,255,0.45)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginLeft: -9, flexShrink: 0,
                        }}>
                          +{resonancePeople.total - resonancePeople.people.length}
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>
                      {resonancePeople.total}명이 이 마음에 함께했어요
                    </p>
                  </div>
                )}
              </>
            );
          })()}

          {/* Owner: 은하/D+ 뱃지 + 소원 원문 + 변화 문장 + 누적 공명 */}
          {isOwner && (
            <>
              {/* 은하 + D+N 뱃지 (owner 전용) */}
              <div className="flex gap-2 justify-center flex-wrap mb-4">
                <span className={`text-xs px-3 py-1 rounded-full ${galaxyStyle.cls}`}>
                  {galaxyStyle.label}
                </span>
                <span className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full">
                  D+{detail.days_since_birth}
                </span>
              </div>
              {detail.wish_text && (
                <p className="text-white/45 text-xs italic leading-relaxed mb-1 px-2 mt-2">
                  &ldquo;{detail.wish_text}&rdquo;
                </p>
              )}
              {detail.wish_emotion && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', marginBottom: 12, paddingLeft: 8, paddingRight: 8, lineHeight: 1.6 }}>
                  {detail.wish_emotion}
                </p>
              )}
              <p className="text-white/35 text-xs">
                {detail.growth_log_text ?? '조금씩 나아가고 있어요'}
              </p>
              {(miracleCount > 0 || wisdomCount > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                    {miracleCount > 0 && (
                      <span style={{ fontSize: 12, color: '#FFD76A' }}>
                        ✨ 기적나눔{' '}
                        <span key={`m-${bounceKey.miracle}`} className="count-bounce" style={{ display: 'inline-block' }}>
                          {miracleCount}
                        </span>
                      </span>
                    )}
                    {wisdomCount > 0 && (
                      <span style={{ fontSize: 12, color: 'rgba(155,135,245,0.9)' }}>
                        🧠 지혜나눔{' '}
                        <span key={`w-${bounceKey.wisdom}`} className="count-bounce" style={{ display: 'inline-block' }}>
                          {wisdomCount}
                        </span>
                      </span>
                    )}
                  </div>
                  {getResonanceLevel(miracleCount + wisdomCount) > 0 && (
                    <span style={{ fontSize: 11, color: 'rgba(255,215,106,0.5)', letterSpacing: '0.03em' }}>
                      {'✦'.repeat(getResonanceLevel(miracleCount + wisdomCount))}{' '}
                      공명 {getResonanceLevel(miracleCount + wisdomCount)}별
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── 머물기 상태 메시지 (4초 후 fade-in) ── */}
      {showStayMsg && (
        <p style={{
          textAlign: 'center', fontSize: 13,
          color: 'rgba(255,255,255,0.32)',
          marginBottom: 16, marginTop: -8,
          animation: 'feedbackIn 1.8s ease forwards',
          animationFillMode: 'forwards',
          opacity: 0,
        }}>
          ✨ 지금은 아무것도 하지 않아도 괜찮아요
        </p>
      )}

      {/* ── 공유 유입 초대 블록 (source=share, 미공명 상태) ── */}
      {isShareEntry && canResonate && !submitted && (
        <div style={{
          marginBottom: 16,
          padding: '16px 18px',
          borderRadius: 18,
          background: 'rgba(155,135,245,0.08)',
          border: '1px solid rgba(155,135,245,0.20)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
            이 마음에 조용히 함께할 수 있어요
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => {
                logUserEvent({ userId: getOrCreateUserId(), eventType: 'invite_cta_clicked', metadata: { star_id: id, cta_type: 'resonance', source: 'share' } });
                document.getElementById('dt-resonance-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                padding: '13px 0', borderRadius: 9999,
                background: 'rgba(255,215,106,0.13)',
                border: '1px solid rgba(255,215,106,0.35)',
                color: '#FFD76A', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              이 별에 마음 남기기
            </button>
            <button
              onClick={() => {
                logUserEvent({ userId: getOrCreateUserId(), eventType: 'invite_cta_clicked', metadata: { star_id: id, cta_type: 'make_star', source: 'share' } });
                nav('/dreamtown?entry=share');
              }}
              style={{
                padding: '11px 0', borderRadius: 9999,
                background: 'none',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer',
              }}
            >
              나도 별 만들기
            </button>
          </div>
        </div>
      )}

      {/* ② MilestoneBar — owner 전용 */}
      {isOwner && (
        <MilestoneBar
          milestones={detail.milestone_status}
          createdAt={detail.created_at ?? detail.birth_date}
          daysSinceBirth={detail.days_since_birth}
        />
      )}

      {/* ③ 항해 기록 — owner 전용 */}
      {isOwner && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-4">
          <p className="text-white/30 text-xs mb-2">항해 기록</p>
          {detail.latest_voyage_log ? (
            <div>
              <p className="text-white/30 text-xs mb-1">
                D+{detail.latest_voyage_log.day_num} · {detail.latest_voyage_log.log_date}
              </p>
              <p className="text-white/65 text-sm leading-relaxed">
                {detail.latest_voyage_log.situation_text}
              </p>
              {detail.latest_voyage_log.wisdom_tag && (
                <span style={{
                  display: 'inline-block', marginTop: 6, fontSize: 10,
                  padding: '1px 8px', borderRadius: 9999,
                  background: 'rgba(155,135,245,0.12)',
                  border: '1px solid rgba(155,135,245,0.2)',
                  color: 'rgba(155,135,245,0.65)',
                }}>
                  {detail.latest_voyage_log.wisdom_tag}
                </span>
              )}
            </div>
          ) : (
            <p className="text-white/30 text-xs text-center py-1">아직 항해 기록이 없어요</p>
          )}
        </div>
      )}

      {/* ④ Aurora5 — owner 전용 */}
      {isOwner && (
        <div className="mb-5 px-1">
          <p style={{ color: '#FFD76A', fontSize: 11, marginBottom: 4 }}>✨ Aurora5</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 6 }}>
            Aurora5가 D+{detail.days_since_birth}째 함께 항해 중이에요 ✨
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {aurora5Text}
          </p>
          {detail.today_aurora5_message && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,215,106,0.5)', fontSize: 10, marginBottom: 3 }}>오늘의 응원</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6 }}>
                {detail.today_aurora5_message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── ⑤ 공명 섹션 — resonance + public ─────────────────── */}
      {canResonate && (
        <div id="dt-resonance-section" className="mb-5">
          {!submitted ? (
            /* 버튼 상태 */
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              {/* 구분 레이블 */}
              <p style={{
                fontSize: 11, color: 'rgba(255,255,255,0.28)',
                textAlign: 'center', marginBottom: 14,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                마음 나누기
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DT_RESONANCE_OPTS.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => handleResonance(opt.type)}
                    disabled={submitting}
                    style={{
                      background:    opt.color,
                      border:        `1px solid ${animating === opt.type ? opt.text : opt.border}`,
                      color:         opt.text,
                      borderRadius:  16,
                      padding:       '14px 0',
                      fontSize:      14,
                      fontWeight:    600,
                      cursor:        submitting ? 'not-allowed' : 'pointer',
                      opacity:       submitting ? 0.5 : 1,
                      // press: scale + glow
                      transform:     animating === opt.type ? 'scale(0.94)' : 'scale(1)',
                      boxShadow:     animating === opt.type ? opt.glow : 'none',
                      transition:    'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.1s ease',
                      display:       'flex',
                      flexDirection: 'column',
                      alignItems:    'center',
                      gap:           4,
                    }}
                  >
                    <span>{opt.label}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: 400 }}>
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 제출 완료 상태 */
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 text-center">
              {/* 성공 피드백 문구 */}
              <p
                className={feedbackMsg ? 'feedback-msg' : ''}
                style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}
              >
                {feedbackMsg ?? '마음이 닿았어요'}
              </p>

              {/* 공명 → 성장 연결 */}
              <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.55)', marginBottom: 12 }}>
                이 마음이 <strong style={{ color: 'rgba(255,215,106,0.8)' }}>{detail.star_name}</strong>의 성장에 힘이 돼요
              </p>

              {/* 최종 카운트 (감정 문장) */}
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: '#FFD76A' }}>
                  ✨ {countToEmotion(miracleCount)}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(155,135,245,0.9)' }}>
                  🧠 {countToEmotion(wisdomCount)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ⑥ 공명 후 CTA + 유사 별 (resonance/public 공통) ──────── */}
      {canResonate && submitted && (
        <>
          {/* 유사 별 섹션 */}
          {similarStars.length > 0 ? (
            <div className="mb-5">
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10, letterSpacing: '0.05em' }}>
                비슷한 마음을 가진 별들이에요
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {similarStars.map((s, i) => (
                  <button
                    key={s.star_id ?? i}
                    onClick={() => {
                      gaSimilarStarClick({ fromStarId: id, toStarId: s.star_id, position: i });
                      logUserEvent({ userId: getOrCreateUserId(), eventType: 'similar_star_click', metadata: { from_star_id: id, to_star_id: s.star_id, position: i } });
                      nav(`/star/${s.star_id}`);
                    }}
                    className="slide-up"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.65)',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ color: '#FFD76A', fontSize: 16, flexShrink: 0 }}>✦</span>
                    <span>{s.star_name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 유사 별 없음 — 광장 fallback */
            <p style={{ textAlign: 'center', marginBottom: 16 }}>
              <button
                onClick={() => {
                  gaSquareFallbackClick({ starId: id, isInvite: isInviteEntry, hasMyStarId: !!myStarId });
                  nav('/stars');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(155,135,245,0.75)', fontSize: 13, fontWeight: 500 }}
              >
                ✨ 다른 별에도 마음을 전해보세요
              </button>
            </p>
          )}

          {/* CTA — !myStarId: full gold (전환 강도 max) / myStarId: 보조 버튼만 */}
          <div
            className="mb-5 flex flex-col gap-3 slide-up"
            style={{ animationDelay: similarStars.length > 0 ? '0.35s' : '0.1s' }}
          >
            {!myStarId ? (
              /* 비로그인 — full gold 버튼 */
              <button
                onClick={() => {
                  gaResonanceCTAClick({ starId: id, ctaType: 'make_star', isInvite: isInviteEntry, hasMyStarId: false });
                  logUserEvent({ userId: getOrCreateUserId(), eventType: 'resonance_cta_click', metadata: { star_id: id, cta_type: 'make_star', has_my_star: false, is_invite: isInviteEntry } });
                  nav('/dreamtown?entry=invite');
                }}
                style={{
                  width: '100%',
                  padding: '16px 0',
                  borderRadius: 9999,
                  background: '#FFD76A',
                  color: '#0D1B2A',
                  fontSize: 16,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 28px 8px rgba(255,215,106,0.22)',
                }}
              >
                나도 별 만들기 ✦
              </button>
            ) : (
              /* 기존 별 있음 — 보조 스타일 */
              <>
                <button
                  onClick={() => {
                    gaResonanceCTAClick({ starId: id, ctaType: 'make_star', isInvite: isInviteEntry, hasMyStarId: true });
                    logUserEvent({ userId: getOrCreateUserId(), eventType: 'resonance_cta_click', metadata: { star_id: id, cta_type: 'make_star', has_my_star: true, is_invite: isInviteEntry } });
                    nav('/dreamtown?entry=invite');
                  }}
                  className="w-full bg-star-gold/15 hover:bg-star-gold/25 border border-star-gold/30 text-star-gold font-semibold py-4 rounded-2xl transition-colors"
                >
                  나도 별 만들기 ✦
                </button>
                <button
                  onClick={() => {
                    gaResonanceCTAClick({ starId: id, ctaType: 'my_star', isInvite: isInviteEntry, hasMyStarId: true });
                    logUserEvent({ userId: getOrCreateUserId(), eventType: 'resonance_cta_click', metadata: { star_id: id, cta_type: 'my_star', has_my_star: true, is_invite: isInviteEntry } });
                    nav(`/my-star/${myStarId}`);
                  }}
                  className="w-full bg-white/5 border border-white/10 text-white/50 text-sm py-3 rounded-2xl hover:bg-white/8 transition-colors"
                >
                  내 별 보러 가기
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ⑦ Public + 미공명 상태: 나도 별 만들기 CTA */}
      {isPublic && !submitted && (
        <div className="mb-5">
          <button
            onClick={() => nav('/dreamtown?entry=invite')}
            className="w-full bg-star-gold/15 hover:bg-star-gold/25 border border-star-gold/30 text-star-gold font-semibold py-4 rounded-2xl transition-colors"
          >
            나도 별 만들기 ✦
          </button>
        </div>
      )}

      {/* ⑧ 이런 마음의 별도 있어요 */}
      {relatedStars.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ marginTop: 28, marginBottom: 8 }}
        >
          <p style={{ fontSize: 13, color: 'rgba(255,215,106,0.65)', marginBottom: 12, textAlign: 'center', letterSpacing: '0.01em' }}>
            ✨ 이런 마음의 별도 있어요
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {relatedStars.map(s => (
              <button
                key={s.star_id}
                onClick={() => nav(`/my-star/${s.star_id}`)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                }}
              >
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.80)', marginBottom: s.wish_emotion ? 4 : 0, lineHeight: 1.5 }}>
                  {s.wish_text?.length > 50 ? s.wish_text.slice(0, 50) + '…' : s.wish_text}
                </p>
                {s.wish_emotion && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>
                    {s.wish_emotion}
                  </p>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── 🌊 공개 항해 장면 (visibility=public 일 때만) ── */}
      {detail.journey_visibility === 'public' && detail.journey_origin_public && (
        <div style={{
          marginBottom: 16, padding: '18px 18px',
          borderRadius: 18,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,215,106,0.55)', marginBottom: 14, letterSpacing: '0.05em' }}>
            🌊 이 별의 항해
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '처음,',   val: detail.journey_origin_public },
              { label: '그 사이,', val: detail.journey_shift_public },
              { label: '지금,',   val: detail.journey_now_public },
            ].filter(r => r.val).map(r => (
              <p key={r.label} style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', lineHeight: 1.7 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginRight: 6 }}>{r.label}</span>
                {r.val}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ⑨ 이 별의 마음 전하기 (공유) */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={handleShare}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 9999,
            background: 'rgba(255,215,106,0.09)',
            border: '1px solid rgba(255,215,106,0.28)',
            color: '#FFD76A',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          이 별의 마음 전하기 ↗
        </button>
        {shareCopied && (
          <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
            링크가 복사됐어요 ✓
          </p>
        )}
      </div>

      {/* ⑩ 광장 복귀 */}
      <div className="mt-2 mb-4">
        <button
          onClick={() => nav('/home')}
          className="w-full bg-white/5 border border-white/10 text-white/60 hover:text-white/80 hover:bg-white/10 text-sm font-medium py-4 rounded-2xl transition-colors"
        >
          광장으로 돌아가기
        </button>
      </div>

      {/* 공명 토스트 */}
      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(155,135,245,0.90)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: 16,
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 999,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        >
          {toastMsg}
        </motion.div>
      )}
    </div>
  );
}
