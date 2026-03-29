import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStarDetail, getStar, getResonance, postVoyageLog, postDtResonance } from '../api/dreamtown.js';
import MilestoneBar from '../components/MilestoneBar';
import { gaResonanceCreated } from '../utils/gtag';
import { readSavedStar } from '../lib/utils/starSession.js';

const GALAXY_STYLE = {
  growth:       { label: '성장 은하', cls: 'bg-blue-500/20 text-blue-300' },
  challenge:    { label: '도전 은하', cls: 'bg-orange-500/20 text-orange-300' },
  healing:      { label: '치유 은하', cls: 'bg-green-500/20 text-green-300' },
  relationship: { label: '관계 은하', cls: 'bg-pink-500/20 text-pink-300' },
  miracle:      { label: '기적 은하', cls: 'bg-purple-500/20 text-purple-300' },
};

const GALAXY_RESONANCE_LABEL = {
  challenge:    '용기의 공명',
  growth:       '성장의 공명',
  healing:      '치유의 공명',
  relationship: '연결의 공명',
  miracle:      '기적의 공명',
};

const AURORA5_3LINES = {
  growth:       '성장을 향한 이 마음을 함께 바라고 있어요.\n조금씩 나아가는 것만으로 충분해요.\n같은 마음을 가진 소원이들이 있어요.',
  challenge:    '용기를 낸 이 마음이 여기 있어요.\n두려워도 한 걸음 내딛은 것이 진짜예요.\n같은 두려움을 가진 소원이들이 있어요.',
  healing:      '치유를 바라는 이 마음을 함께 바라고 있어요.\n쉬어가도 괜찮아요. 멈춤도 항해예요.\n같은 아픔을 지나온 소원이들이 있어요.',
  relationship: '연결을 바라는 이 마음이 여기 있어요.\n혼자가 아니라는 걸 이 별이 보여줘요.\n같은 마음을 가진 소원이들이 있어요.',
};

function calcDaysSinceBirth(createdAt) {
  if (!createdAt) return 1;
  return Math.max(
    1,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) + 1
  );
}

// 공명 버튼 정의
const DT_RESONANCE_OPTS = [
  { type: 'miracle', label: '✨ 기적나눔', color: 'rgba(255,215,106,0.15)', border: 'rgba(255,215,106,0.35)', text: '#FFD76A' },
  { type: 'wisdom',  label: '🧠 지혜나눔', color: 'rgba(155,135,245,0.15)', border: 'rgba(155,135,245,0.35)', text: 'rgba(155,135,245,0.9)' },
];

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
  const [animating, setAnimating]       = useState(null); // 'miracle' | 'wisdom'
  const [bounceKey, setBounceKey]       = useState({ miracle: 0, wisdom: 0 });

  const myStarId  = readSavedStar();
  const isOwnStar = !propViewMode && id === myStarId;

  const viewMode    = propViewMode ?? 'resonance';
  const isOwner     = viewMode === 'owner';
  const isResonance = viewMode === 'resonance';
  const isPublic    = viewMode === 'public';
  const canResonate = isResonance || isPublic; // 비오너 모두 공명 가능

  useEffect(() => {
    if (isOwnStar) {
      nav(`/my-star/${id}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOwnStar || !id) return;

    async function loadDetail() {
      try {
        if (isOwner) {
          const d = await getStarDetail(id);
          setDetail(d);
        } else {
          // resonance / public — 소원 본문·항해기록 fetch 금지
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
          });
        }
      } catch (_) { /* detail null → 에러 화면 */ }
      setLoading(false);
    }

    loadDetail();

    // 공명 카운트 로드 (miracle/wisdom impact 포함)
    getResonance(id).then(r => {
      const impacts = r.impacts ?? [];
      setMiracleCount(impacts.find(i => i.type === 'miracle')?.count ?? 0);
      setWisdomCount(impacts.find(i => i.type === 'wisdom')?.count  ?? 0);
    }).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResonance(type) {
    if (submitting || submitted) return;

    // 버튼 클릭 애니메이션
    setAnimating(type);
    setTimeout(() => setAnimating(null), 200);

    // 낙관적 업데이트
    if (type === 'miracle') {
      setMiracleCount(c => c + 1);
      setBounceKey(k => ({ ...k, miracle: k.miracle + 1 }));
    } else {
      setWisdomCount(c => c + 1);
      setBounceKey(k => ({ ...k, wisdom: k.wisdom + 1 }));
    }

    setSubmitting(true);
    try {
      await postDtResonance({ starId: id, type });
      gaResonanceCreated({ starId: id, resonanceType: type });

      // 공명 → 내 별 항해 로그 자동 저장 (fire-and-forget)
      if (myStarId) {
        const label = type === 'miracle' ? '기적나눔' : '지혜나눔';
        postVoyageLog(myStarId, { emotion: label, tag: '공명', growth: label, source: 'resonance' }).catch(() => {});
      }

      setSubmitted(true);
    } catch {
      // 롤백
      if (type === 'miracle') setMiracleCount(c => c - 1);
      else setWisdomCount(c => c - 1);
    } finally {
      setSubmitting(false);
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

  if (!detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/50 text-sm">별을 찾을 수 없어요.</p>
        <button onClick={() => nav(-1)} className="text-white/30 text-xs">← 돌아가기</button>
      </div>
    );
  }

  const galaxyStyle = GALAXY_STYLE[detail.galaxy?.code] ?? {
    label: detail.galaxy?.name_ko ?? '미지의 은하',
    cls: 'bg-white/10 text-white/50',
  };
  const aurora5Text = AURORA5_3LINES[detail.galaxy?.code]
    ?? '이 소원별은 혼자가 아닙니다.\nAurora5가 함께 항해하고 있어요.\n당신의 마음이 이 별에 닿았어요.';
  const resonanceLabel = GALAXY_RESONANCE_LABEL[detail.galaxy?.code] ?? '공명';

  return (
    <div className="min-h-screen flex flex-col px-6 py-10 pb-6">
      {/* 바운스 키프레임 */}
      <style>{`
        @keyframes countBounce {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.35); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .count-bounce { animation: countBounce 0.3s ease; }
      `}</style>

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

      {/* ① 닉네임 — owner 전용 */}
      {isOwner && detail.nickname && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, paddingLeft: 2 }}>
          @{detail.nickname}
        </p>
      )}

      {/* ② 공통: 별 이름 / 은하 / D+N */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-4">
        <div className="text-center">
          <div className="text-5xl mb-4">✦</div>
          <h1 className="text-2xl font-bold text-star-gold mb-3">{detail.star_name}</h1>

          <div className="flex gap-2 justify-center flex-wrap mb-3">
            <span className={`text-xs px-3 py-1 rounded-full ${galaxyStyle.cls}`}>
              {galaxyStyle.label}
            </span>
            <span className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full">
              D+{detail.days_since_birth}
            </span>
          </div>

          {/* resonance 모드: 공명 키워드 + 한 줄 문장 */}
          {isResonance && (
            <>
              <span style={{
                display: 'inline-block', marginBottom: 8, fontSize: 11,
                padding: '2px 10px', borderRadius: 9999,
                background: 'rgba(155,135,245,0.15)',
                border: '1px solid rgba(155,135,245,0.3)',
                color: 'rgba(155,135,245,0.8)',
              }}>
                {resonanceLabel}
              </span>
              <p className="text-white/55 text-sm leading-relaxed mt-1">
                {detail.star_name}의 소원별이 항해 중이에요.
              </p>
            </>
          )}

          {/* owner 전용: 소원 본문 + 변화 문장 */}
          {isOwner && detail.wish_text && (
            <p className="text-white/45 text-xs italic leading-relaxed mb-3 px-2">
              &ldquo;{detail.wish_text}&rdquo;
            </p>
          )}
          {isOwner && (
            <p className="text-white/35 text-xs mt-1">
              {detail.growth_log_text ?? '조금씩 나아가고 있어요'}
            </p>
          )}

          {/* owner: 누적 공명 결과 표시 */}
          {isOwner && (miracleCount > 0 || wisdomCount > 0) && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
              {miracleCount > 0 && (
                <span style={{ fontSize: 12, color: '#FFD76A' }}>
                  ✨ 기적나눔 <span key={`m-${miracleCount}`} className="count-bounce">{miracleCount}</span>
                </span>
              )}
              {wisdomCount > 0 && (
                <span style={{ fontSize: 12, color: 'rgba(155,135,245,0.9)' }}>
                  🧠 지혜나눔 <span key={`w-${wisdomCount}`} className="count-bounce">{wisdomCount}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ③ MilestoneBar — owner 전용 */}
      {isOwner && (
        <MilestoneBar
          milestones={detail.milestone_status}
          createdAt={detail.created_at ?? detail.birth_date}
          daysSinceBirth={detail.days_since_birth}
        />
      )}

      {/* ④ 항해 기록 — owner 전용 */}
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

      {/* ⑤ Aurora5 응원 — owner 전용 */}
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

      {/* ⑥ 공명 버튼 — resonance / public 모두 허용 */}
      {canResonate && (
        <div className="mb-5">
          {!submitted ? (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <p className="text-white/40 text-xs mb-4 text-center">
                이 별의 소원에 마음을 나눠주세요
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DT_RESONANCE_OPTS.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => handleResonance(opt.type)}
                    disabled={submitting}
                    style={{
                      background:     opt.color,
                      border:         `1px solid ${animating === opt.type ? opt.text : opt.border}`,
                      color:          opt.text,
                      borderRadius:   16,
                      padding:        '14px 0',
                      fontSize:       14,
                      fontWeight:     600,
                      cursor:         submitting ? 'not-allowed' : 'pointer',
                      opacity:        submitting ? 0.5 : 1,
                      transform:      animating === opt.type ? 'scale(0.94)' : 'scale(1)',
                      transition:     'transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease',
                      display:        'flex',
                      flexDirection:  'column',
                      alignItems:     'center',
                      gap:            4,
                    }}
                  >
                    <span>{opt.label}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>
                      <span
                        key={opt.type === 'miracle' ? bounceKey.miracle : bounceKey.wisdom}
                        className={
                          (opt.type === 'miracle' ? bounceKey.miracle : bounceKey.wisdom) > 0
                            ? 'count-bounce'
                            : ''
                        }
                        style={{ display: 'inline-block' }}
                      >
                        {opt.type === 'miracle' ? miracleCount : wisdomCount}
                      </span>
                      명이 나눴어요
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 text-center">
              <p className="text-white/70 text-sm mb-1">소원별에 마음이 닿았어요</p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 13, color: '#FFD76A' }}>✨ {miracleCount}</span>
                <span style={{ fontSize: 13, color: 'rgba(155,135,245,0.9)' }}>🧠 {wisdomCount}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ⑦ 공명 후 내 별 CTA (resonance 모드) */}
      {isResonance && submitted && myStarId && (
        <div className="mb-5">
          <button
            onClick={() => nav(`/my-star/${myStarId}`)}
            className="w-full bg-star-gold/15 hover:bg-star-gold/25 border border-star-gold/30 text-star-gold font-semibold py-4 rounded-2xl transition-colors"
          >
            내 별 보러 가기 ✦
          </button>
        </div>
      )}

      {/* ⑧ public 모드: 나도 별 만들기 CTA */}
      {isPublic && (
        <div className="mb-5">
          <button
            onClick={() => nav('/dreamtown')}
            className="w-full bg-star-gold/15 hover:bg-star-gold/25 border border-star-gold/30 text-star-gold font-semibold py-4 rounded-2xl transition-colors"
          >
            나도 별 만들기 ✦
          </button>
        </div>
      )}

      {/* ⑨ 광장 복귀 */}
      <div className="mt-2 mb-4">
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
