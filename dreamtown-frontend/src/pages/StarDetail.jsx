import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getStarDetail, getStar, getResonance, postVoyageLog, postDtResonance, getSimilarStars, getRelatedStars, getResonancePeople, logUserEvent, getOrCreateUserId, getTravelLog, postNextDayHeart, getNextDayHeart, getStarLogs, postStarLog } from '../api/dreamtown.js';
import MilestoneBar from '../components/MilestoneBar';
import { gaResonanceCreated, gaResonanceClick, gaResonanceSuccess, gaResonanceCTAClick, gaSimilarStarClick, gaSquareFallbackClick, gaSimularStarsEmptyView } from '../utils/gtag';
import { readSavedStar } from '../lib/utils/starSession.js';
import { generateResonanceHint } from '../utils/resonanceHint.js';
import { shareStarDetail } from '../utils/kakaoShare.js';

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

// wish_text 키워드 → Aurora5 1문장 코멘트 (우선순위 순)
// ── Aurora5 인큐베이션 문장 — "이미 시작된 변화" 구조 ────────────────
// 카테고리별 키워드 매칭 → pool에서 결정론적 선택 (동일 text → 동일 문장)
const AURORA5_CATEGORIES = [
  {
    kw:   ['쉬', '쉬고', '편해지', '힘들', '지쳐', '외로', '혼자', '쓸쓸', '아프', '회복', '건강', '몸'],
    pool: [
      '마음이 조금 편해지고 싶다는 그 바람,\n이미 당신 안에서 시작되고 있어요.',
      '쉬어야 한다는 걸 느낀 그 순간,\n이미 회복이 시작되고 있어요.',
      '지쳐있다는 걸 알아챈 것만으로도,\n이미 당신은 달라지고 있어요.',
    ],
  },
  {
    kw:   ['용기', '두렵', '무서', '겁나', '도전', '시작하', '새로 시작'],
    pool: [
      '용기를 내고 싶다는 마음이,\n이미 한 걸음 나아간 거예요.',
      '두려움을 느끼면서도 여기까지 온 것,\n그게 이미 용기예요.',
      '겁이 나면서도 이 마음을 꺼낸 순간,\n변화는 이미 시작됐어요.',
    ],
  },
  {
    kw:   ['성장', '배우', '나아가', '방향', '가고 싶은', '다시 시작', '움직이게', '움직이는', '변화'],
    pool: [
      '나아가고 싶다는 마음을 느낀 순간,\n이미 성장은 시작되고 있어요.',
      '방향을 찾고 있다는 것 자체가,\n이미 앞으로 가고 있다는 뜻이에요.',
      '그 마음을 느낀 순간부터,\n이미 변화는 시작되고 있어요.',
    ],
  },
  {
    kw:   ['나다움', '나답게', '자신감', '닮은', '지금 나와', '나 자신'],
    pool: [
      '지금의 나를 바라본 그 시선,\n이미 스스로를 다시 보기 시작한 거예요.',
      '이 마음이 당신 안에 있었다는 걸 안 순간,\n이미 무언가 달라지고 있어요.',
      '자신을 느끼기 시작한 것만으로도,\n이미 충분한 시작이에요.',
    ],
  },
  {
    kw:   ['사랑', '연인', '고백', '관계', '좋아졌으면', '가족', '부모', '엄마', '아빠', '형', '언니', '동생', '남편', '아내'],
    pool: [
      '그 마음을 꺼냈다는 것,\n이미 관계가 달라지기 시작한 거예요.',
      '사랑하는 마음을 느낀 그 순간,\n이미 연결은 시작되고 있어요.',
      '닿고 싶다는 마음이 있다면,\n이미 거리는 좁혀지고 있어요.',
    ],
  },
  {
    kw:   ['꿈', '직업', '취업', '직장', '성공', '카페', '열고', '창업', '돈', '목표', '여행', '떠나', '여수', '바다'],
    pool: [
      '원하는 것을 마음에 담은 그 순간,\n이미 그 방향으로 가고 있어요.',
      '꿈을 꾼다는 것 자체가,\n이미 현실이 바뀌기 시작한 신호예요.',
      '이 소원을 별로 남긴 오늘이,\n그 꿈의 첫 번째 날이에요.',
    ],
  },
];

const AURORA5_FALLBACK = [
  '그 마음을 느낀 순간부터,\n이미 변화는 시작되고 있어요.',
  '이 마음을 알아챈 것만으로도,\n충분히 달라지고 있어요.',
  '별이 된 이 마음,\n이미 당신 안에서 빛나고 있어요.',
];

// wish_text를 해시 → pool 인덱스 결정 (동일 text → 항상 동일 문장)
function hashText(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getAurora5WishComment(wishText) {
  const text = wishText ?? '';
  for (const cat of AURORA5_CATEGORIES) {
    if (cat.kw.some(k => text.includes(k))) {
      return cat.pool[hashText(text) % cat.pool.length];
    }
  }
  return AURORA5_FALLBACK[hashText(text) % AURORA5_FALLBACK.length];
}

// 다음날의 마음 — 선택지별 Aurora5 문장
const NEXT_DAY_AURORA5 = {
  '조금 가벼워졌어요':  '가벼워진 마음이,\n소원을 향한 첫 걸음이 되고 있어요.',
  '아직 그대로예요':    '그대로인 마음도,\n이미 별이 되어 빛나고 있어요.',
  '조금 또렷해졌어요':  '또렷해진 소원은,\n이미 현실 가까이 다가오고 있어요.',
  '용기가 생겼어요':    '생겨난 용기가,\n당신의 별을 더 밝히고 있어요.',
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

const ORIGIN_PLACE_LABEL = {
  'lattoa':           '라또아 카페',
  'forestland':       '더 포레스트랜드',
  'paransi':          '파란시',
  'yeosu-cablecar':   '여수 해상 케이블카',
};

// 은하 → 별자리 이름 (비슷한 별 섹션용)
const GALAXY_CONSTELLATION = {
  growth:       '성장의 별자리',
  challenge:    '도전의 별자리',
  healing:      '치유의 별자리',
  relationship: '관계의 별자리',
  miracle:      '기적의 별자리',
};

// 은하 → 감정 선택 매핑 (별 생성 CTA prefill 용)
const GALAXY_TO_EMOTION = {
  growth:       'hopeful',
  challenge:    'anxious',
  healing:      'tired',
  relationship: 'lonely',
};

// ── 익명 아바타 색상 (userId 해시 → hsl) ─────────────────────────
function avatarColor(userId) {
  let h = 5381;
  for (let i = 0; i < userId.length; i++) h = ((h << 5) + h) ^ userId.charCodeAt(i);
  return `hsl(${Math.abs(h) % 360}, 52%, 58%)`;
}

// ── 유틸 ────────────────────────────────────────────────────────
function formatLogTime(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const d = new Date(createdAt);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

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
  const [shareCopied, setShareCopied]   = useState(false);       // fallback 복사 완료 (Kakao 미지원 환경)
  const [travelLog, setTravelLog]       = useState(null);        // 여행 선택 기록
  const [nextDayHeart, setNextDayHeart] = useState(null);        // 다음날의 마음 (이미 답변 여부)
  const [heartResult, setHeartResult]   = useState(null);        // 선택 직후 로컬 결과
  const [showStayMsg, setShowStayMsg]   = useState(false);       // 머물기 상태 메시지
  const [resonancePeople, setResonancePeople] = useState({ people: [], total: 0 }); // 공명 참여자
  const [showSharedIntro] = useState(false); // 새 감정 랜딩으로 대체됨
  const [viralClicked, setViralClicked] = useState(false);
  const [galaxyResonated, setGalaxyResonated] = useState({}); // { [starId]: { done, count } }
  const [starLogs, setStarLogs]               = useState([]);
  const [detailRevealed, setDetailRevealed] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (!window.location.search.includes('source=share')) return true;
    const vMode = propViewMode ?? 'resonance';
    if (vMode === 'owner') return true;
    // 이미 공명한 별이면 랜딩 스킵
    try {
      const history = JSON.parse(localStorage.getItem(RESONANCE_HISTORY_KEY) || '[]');
      const sid = propStarId ?? paramId;
      if (history.some(e => e.starId === sid)) return true;
    } catch (_) {}
    return false;
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

  // ── 여행 기록 로드 ────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getTravelLog(id).then(({ log }) => { if (log) setTravelLog(log); }).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 다음날의 마음 로드 (owner + days >= 1) ────────────────────
  useEffect(() => {
    if (!id || !isOwner) return;
    getNextDayHeart(id).then(({ heart }) => { if (heart) setNextDayHeart(heart); }).catch(() => {});
  }, [id, isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 이 별의 흐름 로그 로드 ────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getStarLogs(id).then(({ logs }) => setStarLogs(logs ?? [])).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 데이터 로드 ────────────────────────────────────────────────
  useEffect(() => {
    if (isOwnStar || !id) return;

    async function loadDetail() {
      try {
        if (isOwner) {
          const d = await getStarDetail(id);
          setDetail(d);
          getRelatedStars(id, d.galaxy?.code ?? null).then(r => setRelatedStars(r.stars ?? [])).catch(() => {});
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
            wish_emotion:     star.wish_emotion ?? null,
            origin_place:     star.origin_place ?? null,
          });
          getRelatedStars(id, star.galaxy?.code ?? null).then(r => setRelatedStars(r.stars ?? [])).catch(() => {});
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
    getResonancePeople(id).then(r => setResonancePeople(r)).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 공유 유입 랜딩: 나도그래요 클릭 후 2초 뒤 상세 자동 reveal ──
  useEffect(() => {
    if (viralClicked && !detailRevealed) {
      const t = setTimeout(() => setDetailRevealed(true), 2000);
      return () => clearTimeout(t);
    }
  }, [viralClicked]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 공명 핸들러 ────────────────────────────────────────────────
  const isInviteEntry = typeof window !== 'undefined' && window.location.search.includes('entry=invite');
  const isShareEntry  = typeof window !== 'undefined' && window.location.search.includes('source=share');
  const showLanding   = isShareEntry && canResonate && !detailRevealed;

  // ── 비슷한 별 공명 핸들러 ──────────────────────────────────────
  async function handleSimilarResonance(targetStarId) {
    if (galaxyResonated[targetStarId]?.done) return;
    setGalaxyResonated(prev => ({ ...prev, [targetStarId]: { done: true, count: 0 } }));
    try {
      const r = await postDtResonance({ starId: targetStarId, type: 'miracle' });
      const total = (r.miracleCount ?? 1) + (r.wisdomCount ?? 0);
      setGalaxyResonated(prev => ({ ...prev, [targetStarId]: { done: true, count: total } }));
      logUserEvent({ userId: getOrCreateUserId(), eventType: 'similar_star_resonance', metadata: { from_star_id: id, to_star_id: targetStarId } });
    } catch (_) {}
  }

  // ── 공유 핸들러 ────────────────────────────────────────────────
  const SHARE_LEVEL_MSG = [
    '아직 조용한 별이에요',
    '작은 공명이 시작됐어요',
    '별이 조금 밝아졌어요',
    '많은 마음이 모인 별이에요',
  ];

  async function handleShare() {
    const starUrl = `https://app.dailymiracles.kr/star/${id}`;
    const truncated = (detail.wish_text ?? '').slice(0, 40);
    const shareText = truncated ? `"${truncated}"` : '이 순간이 별로 남았습니다.';

    // navigator.share (모바일 시스템 공유 시트)
    if (navigator.share) {
      try {
        await navigator.share({
          title: '여수에서 시작된 하나의 마음 ✨',
          text:  shareText,
          url:   starUrl,
        });
        return; // 사용자가 공유 완료 — 토스트 불필요
      } catch (_) { /* 취소 또는 지원 안 함 → clipboard fallback */ }
    }

    // clipboard fallback
    try { await navigator.clipboard.writeText(starUrl); } catch (_) {}
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 3000);
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

    } catch (err) {
      // 롤백
      if (type === 'miracle') setMiracleCount(c => c - 1);
      else setWisdomCount(c => c - 1);
      logUserEvent({ userId: getOrCreateUserId(), eventType: 'resonance_failed', metadata: { star_id: id, resonance_type: type } });
      // 에러 토스트 (3초 자동 소멸) — JSON 화면 노출 방지
      setFeedbackMsg('잠시 후 다시 시도해주세요 🌙');
      setTimeout(() => setFeedbackMsg(null), 3000);
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

  // ── 공유 유입 감정 랜딩 ─────────────────────────────────────────
  if (showLanding) {
    const galaxyLabel = detail.galaxy?.name_ko ?? '별의 마음';
    const emotionLine = detail.wish_emotion
      || (detail.galaxy?.code ? AURORA5_3LINES[detail.galaxy.code]?.split('\n')[0] : null)
      || '이 별에 담긴 마음이에요';
    const totalCount = miracleCount + wisdomCount;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', background: '#0D1B2A' }}>
        <style>{KEYFRAMES}</style>

        {!viralClicked ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}
          >
            <p style={{ fontSize: 44, marginBottom: 18, lineHeight: 1 }}>✦</p>
            <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.6)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {galaxyLabel}
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 10, lineHeight: 1.4 }}>
              이 마음, 당신도<br />느껴본 적 있나요?
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', marginBottom: 36, lineHeight: 1.75 }}>
              {emotionLine}
            </p>
            <button
              onClick={() => {
                setViralClicked(true);
                localStorage.setItem('dt_intro_seen', new Date().toISOString().slice(0, 10));
                logUserEvent({ userId: getOrCreateUserId(), eventType: 'viral_nado_clicked', metadata: { star_id: id, source: 'share_landing' } });
                if (!submitted && !submitting) handleResonance('miracle');
              }}
              style={{
                width: '100%', padding: '17px 0', borderRadius: 9999,
                background: 'linear-gradient(135deg, rgba(255,215,106,0.22) 0%, rgba(255,215,106,0.10) 100%)',
                border: '1px solid rgba(255,215,106,0.55)',
                color: '#FFD76A', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 0 32px 6px rgba(255,215,106,0.18)',
                letterSpacing: '0.01em',
              }}
            >
              나도 그래요
            </button>
            <button
              onClick={() => {
                localStorage.setItem('dt_intro_seen', new Date().toISOString().slice(0, 10));
                setDetailRevealed(true);
              }}
              style={{ marginTop: 18, background: 'none', border: 'none', color: 'rgba(255,255,255,0.22)', fontSize: 13, cursor: 'pointer' }}
            >
              별 보러 가기 →
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}
          >
            <p style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>✨</p>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#FFD76A', marginBottom: 8, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {`지금 이 순간,\n${totalCount > 0 ? `${totalCount}명이 같은 마음을 느꼈어요` : '마음이 닿았어요'}`}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginBottom: 28, lineHeight: 1.6 }}>
              잠시 후 별을 보여드릴게요
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.35 }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,215,106,0.65)' }}
                />
              ))}
            </div>
          </motion.div>
        )}
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

          {/* 소원 감정 한 줄 */}
          <p style={{ fontSize: 13, color: 'rgba(255,215,106,0.65)', marginBottom: 12, letterSpacing: '0.01em' }}>
            {detail.wish_emotion || '이 마음은 아직 말을 찾고 있어요'}
          </p>

          {/* Public / Resonance: 은하/D+ + 이야기 토글 + 공명 수 */}
          {canResonate && (() => {
            const hasStory = !!(detail.growth_log_text || detail.wish_text);
            return (
              <>
                {/* ① 은하 + D+N + 장소 뱃지 */}
                <div className="flex gap-2 justify-center flex-wrap mb-4">
                  <span className={`text-xs px-3 py-1 rounded-full ${galaxyStyle.cls}`}>
                    {galaxyStyle.label}
                  </span>
                  <span className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full">
                    D+{detail.days_since_birth}
                  </span>
                  {detail.origin_place && ORIGIN_PLACE_LABEL[detail.origin_place] && (
                    <span className="text-xs bg-star-gold/10 text-star-gold/70 px-3 py-1 rounded-full">
                      📍 {ORIGIN_PLACE_LABEL[detail.origin_place]}
                    </span>
                  )}
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

      {/* ── 바이럴 랜딩 블록 (직접 유입 비로그인 방문자 전용) ── */}
      {canResonate && !isShareEntry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            marginBottom: 16,
            padding: '20px 18px',
            borderRadius: 20,
            background: viralClicked
              ? 'rgba(255,215,106,0.07)'
              : 'rgba(255,255,255,0.05)',
            border: viralClicked
              ? '1px solid rgba(255,215,106,0.25)'
              : '1px solid rgba(255,255,255,0.10)',
            textAlign: 'center',
            transition: 'background 0.4s, border 0.4s',
          }}
        >
          {!viralClicked ? (
            <>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 6, lineHeight: 1.5 }}>
                이 마음, 당신도 느껴본 적 있나요?
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', marginBottom: 16, lineHeight: 1.6 }}>
                {detail.wish_emotion || '이 별의 마음이 닿았나요'}
              </p>
              <button
                onClick={() => {
                  setViralClicked(true);
                  logUserEvent({ userId: getOrCreateUserId(), eventType: 'viral_nado_clicked', metadata: { star_id: id, source: isShareEntry ? 'share' : 'direct' } });
                  if (!submitted && !submitting) handleResonance('miracle');
                }}
                style={{
                  width: '100%',
                  padding: '15px 0',
                  borderRadius: 9999,
                  background: 'linear-gradient(135deg, rgba(255,215,106,0.20) 0%, rgba(255,215,106,0.10) 100%)',
                  border: '1px solid rgba(255,215,106,0.45)',
                  color: '#FFD76A',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  boxShadow: '0 0 20px 2px rgba(255,215,106,0.12)',
                }}
              >
                나도 그래요
              </button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <p style={{ fontSize: 22, marginBottom: 8 }}>✨</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#FFD76A', marginBottom: 4, lineHeight: 1.5 }}>
                {(miracleCount + wisdomCount) > 0
                  ? `${miracleCount + wisdomCount}명이 같은 마음이에요`
                  : '마음이 닿았어요'}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18, lineHeight: 1.6 }}>
                당신의 마음이 이 별에 조용히 닿았어요
              </p>
              <button
                onClick={() => {
                  if (myStarId) {
                    logUserEvent({ userId: getOrCreateUserId(), eventType: 'viral_add_to_star_clicked', metadata: { star_id: id, my_star_id: myStarId } });
                    postStarLog(id, { action_type: 'connected', message: '마음이 이어졌어요 🌙' });
                    nav(`/my-star/${myStarId}`);
                  } else {
                    logUserEvent({ userId: getOrCreateUserId(), eventType: 'viral_make_star_clicked', metadata: { star_id: id } });
                    const emotionChoice = GALAXY_TO_EMOTION[detail.galaxy?.code] ?? null;
                    nav('/wish?new=1', { state: { emotionChoice } });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 9999,
                  background: 'rgba(255,215,106,0.15)',
                  border: '1px solid rgba(255,215,106,0.35)',
                  color: '#FFD76A',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}
              >
                {myStarId ? '이 마음, 내 별에도 닿게 하기 →' : '나도 별 하나 남기기 →'}
              </button>
            </motion.div>
          )}
        </motion.div>
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

      {/* ⑤ 다음날의 마음 — owner + D+1 이상 */}
      {isOwner && (detail.days_since_birth ?? 0) >= 1 && (() => {
        const done = nextDayHeart || heartResult;
        if (done) {
          const choice = done.choice;
          return (
            <div style={{
              marginBottom: 16, padding: '16px 18px', borderRadius: 18,
              background: 'rgba(91,200,192,0.06)',
              border: '1px solid rgba(91,200,192,0.20)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 11, color: 'rgba(91,200,192,0.6)', marginBottom: 6, letterSpacing: '0.06em' }}>✨ 다음날의 마음</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                이 별은, 여수에서 한 번 더 빛났어요 ✨
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, whiteSpace: 'pre-line', marginBottom: heartResult ? 12 : 0 }}>
                {NEXT_DAY_AURORA5[choice]}
              </p>
              {heartResult && (
                <>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
                    {heartResult.resonance}명이 비슷한 마음이에요
                  </p>
                  <button
                    onClick={() => {
                      const text = `여수에서 보낸 하루, ${choice} ✨`;
                      if (navigator.share) navigator.share({ text }).catch(() => {});
                      else navigator.clipboard?.writeText(text);
                    }}
                    style={{
                      padding: '10px 24px', borderRadius: 9999,
                      background: 'rgba(91,200,192,0.12)',
                      border: '1px solid rgba(91,200,192,0.30)',
                      color: '#5BC8C0', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    공유하기 →
                  </button>
                </>
              )}
            </div>
          );
        }
        return (
          <div style={{
            marginBottom: 16, padding: '16px 18px', borderRadius: 18,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 10, letterSpacing: '0.06em', textAlign: 'center' }}>
              어제의 소원, 오늘은 어때요?
            </p>
            {['조금 가벼워졌어요', '아직 그대로예요', '조금 또렷해졌어요', '용기가 생겼어요'].map(choice => (
              <button
                key={choice}
                onClick={async () => {
                  const resonance = Math.floor(Math.random() * 10) + 3;
                  setHeartResult({ choice, resonance });
                  postNextDayHeart(id, choice).catch(() => {});
                }}
                style={{
                  display: 'block', width: '100%',
                  padding: '11px 16px', marginBottom: 8,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: 14, textAlign: 'left', cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                {choice}
              </button>
            ))}
          </div>
        );
      })()}

      {/* ── Aurora5 코멘트 — canResonate 뷰어 (별 카드↓, 마음 나누기↑) ── */}
      {canResonate && (
        <div style={{
          marginBottom: 16,
          padding: '14px 16px',
          borderRadius: 16,
          background: 'rgba(255,215,106,0.05)',
          border: '1px solid rgba(255,215,106,0.15)',
        }}>
          <p style={{ fontSize: 10, color: 'rgba(255,215,106,0.5)', marginBottom: 6, letterSpacing: '0.06em' }}>
            ✨ Aurora5
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
            {getAurora5WishComment(detail.wish_text, detail.galaxy?.code)}
          </p>
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

      {/* ⑧ 비슷한 별 — 동일 은하 기반 */}
      {relatedStars.length > 0 && (() => {
        const galaxyCode    = detail.galaxy?.code;
        const constellation = GALAXY_CONSTELLATION[galaxyCode] ?? '이 별자리';
        const ownerLabel    = isOwner ? '당신의' : '이';
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ marginTop: 32, marginBottom: 8 }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,215,106,0.80)', marginBottom: 4, textAlign: 'center' }}>
              이 별과 닮은 마음들이 있어요 ✨
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginBottom: 16, textAlign: 'center', lineHeight: 1.6 }}>
              {ownerLabel} 별은, {constellation}와 연결되어 있어요 ✨
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {relatedStars.map((s, i) => {
                const res = galaxyResonated[s.star_id];
                return (
                  <motion.div
                    key={s.star_id ?? i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: res?.done ? 'rgba(255,215,106,0.07)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${res?.done ? 'rgba(255,215,106,0.22)' : 'rgba(255,255,255,0.08)'}`,
                      transition: 'background 0.35s, border 0.35s',
                    }}
                  >
                    <p style={{
                      fontSize: 13, color: 'rgba(255,255,255,0.68)',
                      marginBottom: 12, lineHeight: 1.65,
                    }}>
                      {s.wish_emotion || (s.wish_text?.length > 45 ? s.wish_text.slice(0, 45) + '…' : s.wish_text) || '이 마음은 아직 말을 찾고 있어요'}
                    </p>
                    {!res?.done ? (
                      <button
                        onClick={() => handleSimilarResonance(s.star_id)}
                        style={{
                          width: '100%', padding: '10px 0', borderRadius: 9999,
                          background: 'rgba(255,215,106,0.10)',
                          border: '1px solid rgba(255,215,106,0.32)',
                          color: '#FFD76A', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                      >
                        나도 이 마음이에요
                      </button>
                    ) : (
                      <p style={{ fontSize: 12, color: 'rgba(255,215,106,0.72)', textAlign: 'center', lineHeight: 1.5 }}>
                        지금 이 순간, {res.count > 0 ? `${res.count}명이 같은 마음을 느꼈어요` : '마음이 닿았어요'} ✨
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

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

      {/* ⑨ 이 별의 흐름 (타임라인) */}
      {starLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ marginBottom: 24 }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,215,106,0.72)', marginBottom: 14, textAlign: 'center' }}>
            이 별의 흐름
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {starLogs.map((log, i) => (
              <div
                key={log.id ?? i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  paddingBottom: i < starLogs.length - 1 ? 14 : 0,
                  position: 'relative',
                }}
              >
                {/* 타임라인 라인 */}
                {i < starLogs.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: 7,
                    top: 18,
                    bottom: 0,
                    width: 1,
                    background: 'rgba(255,255,255,0.08)',
                  }} />
                )}
                {/* 도트 */}
                <div style={{
                  width: 15, height: 15, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  background: log.action_type === 'star_resonance_level_up'
                    ? 'rgba(255,215,106,0.55)'
                    : log.action_type === 'connected'
                      ? 'rgba(155,135,245,0.55)'
                      : 'rgba(255,255,255,0.18)',
                  border: '2px solid rgba(255,255,255,0.10)',
                }} />
                {/* 내용 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.5, marginBottom: 2 }}>
                    {log.message}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                    {formatLogTime(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ⑩ 이 별의 마음 전하기 (공유) */}
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
          이 마음 나누기
        </button>
        {shareCopied && (
          <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
            링크가 복사됐어요 ✓
          </p>
        )}
      </div>

      {/* ── 여수에서 이어가기 — 조건부 노출 ── */}
      {/* 별 생성 완료(isOwner) OR 공명 발생 OR Day 1 이상 중 하나 충족 시에만 표시 */}
      {(isOwner || resonancePeople.total > 0 || (detail.days_since_birth ?? 0) >= 1) && (
        <div style={{ marginBottom: 12 }}>
          {/* 여행 완료 + 반성 완료 → "한 번 더 빛났어요" */}
          {travelLog?.has_reflection && (
            <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(91,200,192,0.85)', marginBottom: 10, lineHeight: 1.7 }}>
              이 별은, 여수에서 한 번 더 빛났어요 ✨<br />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{travelLog.place} · {travelLog.emotion}</span>
            </div>
          )}
          {/* 여행 완료 + 1일 경과 + 반성 미완료 → 재방문 유도 배너 */}
          {travelLog && travelLog.needs_reflection && !travelLog.has_reflection && (
            <button
              onClick={() => nav(`/voyage-reflect?starId=${id}`)}
              style={{
                display: 'block', width: '100%',
                padding: '13px 0', marginBottom: 8,
                borderRadius: 9999,
                background: 'rgba(91,200,192,0.10)',
                border: '1.5px solid rgba(91,200,192,0.35)',
                color: '#5BC8C0', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              여수에서의 이야기를 들려주세요 →
            </button>
          )}
          {/* 여행 이동 CTA — 아직 미선택이거나 반성 완료된 경우 */}
          {!travelLog?.needs_reflection && (
            <button
              onClick={() => nav(`/voyage-select?starId=${id}`)}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 9999,
                background: 'rgba(91,200,192,0.07)',
                border: '1px solid rgba(91,200,192,0.22)',
                color: '#5BC8C0', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              이 마음을, 여수에서 이어가 볼까요?
            </button>
          )}
        </div>
      )}

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
