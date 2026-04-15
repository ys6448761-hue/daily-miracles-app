/**
 * MissionPage.jsx — 여수 미션 + 일일 감정 로그
 * 경로: /missions?star_id=xxx
 *
 * 원칙: 1초 행동 / 감정 중심 / 반복 유도
 * - 5개 장소 미션 (각 100P) + 전체 완료 보너스 500P
 * - 오늘의 기록 (50P, 1일 1회)
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrCreateUserId } from '../api/dreamtown.js';
import { readSavedStar } from '../lib/utils/starSession.js';

const C = {
  bg:     '#0D1B2A',
  purple: '#9B87F5',
  gold:   '#FFD76A',
  muted:  '#7A6E9C',
  text:   '#E8E4F0',
  green:  '#4ade80',
};

// ── 답변 버튼 그리드 ─────────────────────────────────────────────
function AnswerGrid({ answers, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
      {answers.map(a => (
        <button
          key={a}
          onClick={() => onSelect(a)}
          style={{
            padding: '9px 16px',
            borderRadius: 20,
            border: selected === a
              ? `1px solid ${C.purple}`
              : '1px solid rgba(155,135,245,0.28)',
            background: selected === a
              ? 'rgba(155,135,245,0.22)'
              : 'rgba(155,135,245,0.06)',
            color: selected === a ? '#fff' : C.purple,
            fontSize: 14,
            fontWeight: selected === a ? 700 : 400,
            cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
            transition: 'all 0.12s',
          }}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

// ── 완료 축하 오버레이 (전체 5개 + 보너스 500P) ───────────────────
function AllCompleteOverlay({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(13,27,42,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        style={{
          background: 'linear-gradient(135deg, rgba(155,135,245,0.15) 0%, rgba(255,215,106,0.1) 100%)',
          border: '1px solid rgba(255,215,106,0.4)',
          borderRadius: 24,
          padding: '40px 28px',
          textAlign: 'center',
          width: '100%',
          maxWidth: 360,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{ fontSize: 52, marginBottom: 16 }}
        >
          🌟
        </motion.div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.gold, marginBottom: 8 }}>
          여수 5개 미션 완료!
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
          여수의 모든 순간을 기록했어요
        </div>
        <div style={{
          background: 'rgba(255,215,106,0.12)',
          border: '1px solid rgba(255,215,106,0.3)',
          borderRadius: 14,
          padding: '16px',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,215,106,0.7)', marginBottom: 4 }}>보너스 지급</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.gold }}>+500P</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>5,000원 상당 혜택</div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg, ${C.purple}, #7B67D5)`,
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          내 별 보러 가기 ✨
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── 포인트 헤더 ──────────────────────────────────────────────────
function PointHeader({ totalPoints, completedCount, totalCount, bonusGiven }) {
  const maxMissionPoints = totalCount * 100 + (bonusGiven ? 500 : 0);
  const progressPct = totalCount > 0
    ? Math.min(100, Math.round((completedCount / totalCount) * 100))
    : 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20,35,55,0.9) 0%, rgba(18,30,50,0.9) 100%)',
      border: '1px solid rgba(255,215,106,0.18)',
      borderRadius: 18,
      padding: '18px 20px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>내 여수 포인트</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.gold, lineHeight: 1 }}>
            {totalPoints.toLocaleString()}P
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
            {(totalPoints * 10).toLocaleString()}원 상당
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>미션</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
            {completedCount}
            <span style={{ fontSize: 13, color: C.muted }}>/{totalCount}</span>
          </div>
          {bonusGiven && (
            <div style={{ fontSize: 10, color: C.gold, marginTop: 2 }}>🌟 보너스 획득</div>
          )}
        </div>
      </div>
      {/* 진행바 */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${C.purple}, ${C.gold})` }}
        />
      </div>
      {!bonusGiven && completedCount < totalCount && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: 'center' }}>
          {totalCount - completedCount}개 더 하면 보너스 +500P
        </div>
      )}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function MissionPage() {
  const nav             = useNavigate();
  const [params]        = useSearchParams();
  const starIdFromQuery = params.get('star_id');
  const starId          = starIdFromQuery || readSavedStar();

  const [loading,       setLoading]       = useState(true);
  const [missions,      setMissions]      = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalPoints,   setTotalPoints]   = useState(0);
  const [bonusGiven,    setBonusGiven]    = useState(false);
  const [allComplete,   setAllComplete]   = useState(false);
  const [todayLogDone,  setTodayLogDone]  = useState(false);
  const [todayEmotion,  setTodayEmotion]  = useState(null);

  // 열린 미션 패널
  const [expandedId,    setExpandedId]    = useState(null);
  const [picked,        setPicked]        = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitErr,     setSubmitErr]     = useState('');

  // 오늘 기록 패널
  const [logOpen,       setLogOpen]       = useState(false);
  const [logPicked,     setLogPicked]     = useState(null);
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logErr,        setLogErr]        = useState('');

  // 전체 완료 오버레이
  const [showAllComplete, setShowAllComplete] = useState(false);

  // ── 데이터 로드 ──────────────────────────────────────────────
  const load = async (silent = false) => {
    if (!starId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        fetch(`/api/yeosu-missions?star_id=${encodeURIComponent(starId)}`),
        fetch(`/api/yeosu-missions/points?star_id=${encodeURIComponent(starId)}`),
      ]);
      const mData = mRes.ok ? await mRes.json() : null;
      const pData = pRes.ok ? await pRes.json() : null;

      if (mData?.success) {
        setMissions(mData.missions ?? []);
        setCompletedCount(mData.completed_count ?? 0);
        setTodayLogDone(!!mData.today_log_done);
        setTodayEmotion(mData.today_log?.emotion ?? null);
        setBonusGiven(!!mData.bonus_given);
        setAllComplete(!!mData.all_complete);
      }
      if (pData?.success) {
        setTotalPoints(pData.total_points ?? 0);
      }
    } catch (_) {}
    if (!silent) setLoading(false);
  };

  useEffect(() => { load(); }, [starId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 미션 완료 제출 ────────────────────────────────────────────
  const handleMissionSubmit = async () => {
    if (!expandedId || !picked || submitting) return;
    setSubmitting(true);
    setSubmitErr('');
    try {
      const r = await fetch('/api/yeosu-missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          star_id:    starId,
          user_id:    getOrCreateUserId(),
          mission_id: expandedId,
          emotion:    picked,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setSubmitErr(data.error === 'ALREADY_COMPLETED' ? '이미 완료한 미션이에요.' : (data.message || '오류가 발생했어요.'));
        return;
      }
      setExpandedId(null);
      setPicked(null);
      await load(true);
      // 전체 완료 + 새 보너스 지급 시 축하 오버레이
      if (data.all_complete && data.bonus_awarded > 0) {
        setShowAllComplete(true);
      }
    } catch (_) {
      setSubmitErr('네트워크 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 일일 로그 제출 ────────────────────────────────────────────
  const handleLogSubmit = async () => {
    if (!logPicked || logSubmitting) return;
    setLogSubmitting(true);
    setLogErr('');
    try {
      const r = await fetch('/api/yeosu-missions/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          star_id: starId,
          user_id: getOrCreateUserId(),
          emotion: logPicked,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        setLogErr(data.error === 'ALREADY_LOGGED' ? '오늘은 이미 기록했어요.' : (data.message || '오류가 발생했어요.'));
        return;
      }
      setLogOpen(false);
      setLogPicked(null);
      await load(true);
    } catch (_) {
      setLogErr('네트워크 오류가 발생했어요.');
    } finally {
      setLogSubmitting(false);
    }
  };

  const LOG_ANSWERS = ['좋았어', '평온했어', '설레었어', '감동받았어', '그리웠어', '행복했어', '새로웠어', '치유받았어'];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Noto Sans KR', sans-serif" }}>불러오는 중...</div>
      </div>
    );
  }

  if (!starId) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚡</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>별이 없어요</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>케이블카 QR을 스캔해서 별을 먼저 탄생시켜주세요</div>
          <button
            onClick={() => nav('/cablecar')}
            style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${C.purple}, #7B67D5)`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            별 탄생시키러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${C.bg} 0%, #0A2240 100%)`, fontFamily: "'Noto Sans KR', sans-serif", color: C.text, paddingBottom: 80 }}>
      {/* 전체 완료 오버레이 */}
      <AnimatePresence>
        {showAllComplete && (
          <AllCompleteOverlay
            onClose={() => {
              setShowAllComplete(false);
              const sid = starId;
              if (sid) nav(`/my-star/${sid}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 0' }}>
        <button
          onClick={() => nav(-1)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', padding: '8px 0', fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          ← 뒤로
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: C.muted }}>여수 미션</div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* 타이틀 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.purple, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
            Yeosu Missions
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.35, marginBottom: 6 }}>
            여수의 순간을<br />별에 담아요
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            장소마다 한 가지 질문 · 1초 선택 · 포인트 적립
          </div>
        </div>

        {/* 포인트 헤더 */}
        <PointHeader
          totalPoints={totalPoints}
          completedCount={completedCount}
          totalCount={missions.length}
          bonusGiven={bonusGiven}
        />

        {/* ── 미션 5개 ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10 }}>
            5개 장소 미션
          </div>

          {missions.map((m, idx) => {
            const isExpanded = expandedId === m.id && !m.completed;
            const isDone     = m.completed;

            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  if (isDone) return;
                  if (isExpanded) { setExpandedId(null); setPicked(null); return; }
                  setExpandedId(m.id);
                  setPicked(null);
                  setSubmitErr('');
                }}
                style={{
                  background: isDone
                    ? 'rgba(74,222,128,0.05)'
                    : isExpanded
                      ? 'rgba(155,135,245,0.08)'
                      : 'rgba(255,255,255,0.03)',
                  border: isDone
                    ? '1px solid rgba(74,222,128,0.2)'
                    : isExpanded
                      ? `1px solid rgba(155,135,245,0.35)`
                      : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 10,
                  cursor: isDone ? 'default' : 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                {/* 미션 상단 행 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{m.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: isDone ? C.green : C.text }}>
                        {m.title}
                      </span>
                      {isDone
                        ? <span style={{ fontSize: 11, color: C.green, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.22)', borderRadius: 10, padding: '2px 8px' }}>✓ 완료</span>
                        : <span style={{ fontSize: 11, color: C.gold, background: 'rgba(255,215,106,0.08)', border: '1px solid rgba(255,215,106,0.18)', borderRadius: 10, padding: '2px 8px' }}>+100P</span>
                      }
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {isDone
                        ? (m.completion?.emotion ? `"${m.completion.emotion}"` : '완료')
                        : m.description
                      }
                    </div>
                  </div>
                  {!isDone && (
                    <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                      {isExpanded ? '↑' : '↓'}
                    </div>
                  )}
                </div>

                {/* 답변 패널 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                          {m.question}
                        </div>
                        <AnswerGrid answers={m.answers} selected={picked} onSelect={setPicked} />
                        {submitErr && (
                          <div style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{submitErr}</div>
                        )}
                        <button
                          onClick={handleMissionSubmit}
                          disabled={!picked || submitting}
                          style={{
                            display: 'block', width: '100%', padding: '13px 0',
                            borderRadius: 12, border: 'none', marginTop: 14,
                            background: picked && !submitting
                              ? `linear-gradient(135deg, ${C.purple}, #7B67D5)`
                              : 'rgba(155,135,245,0.15)',
                            color: picked && !submitting ? '#fff' : C.muted,
                            fontSize: 14, fontWeight: 700, cursor: picked && !submitting ? 'pointer' : 'default',
                            fontFamily: "'Noto Sans KR', sans-serif",
                            transition: 'all 0.15s',
                          }}
                        >
                          {submitting ? '기록 중...' : '이 순간 기록하기 ✨'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ── 오늘의 기록 (50P) ─────────────────────────────────── */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10 }}>
            오늘의 기록 · 50P
          </div>

          {todayLogDone ? (
            <div style={{
              background: 'rgba(74,222,128,0.05)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 14, padding: '18px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green, marginBottom: 4 }}>
                오늘 기록 완료
              </div>
              {todayEmotion && (
                <div style={{ fontSize: 12, color: 'rgba(74,222,128,0.65)' }}>
                  "{todayEmotion}" · +50P
                </div>
              )}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                내일 다시 기록해요
              </div>
            </div>
          ) : (
            <div
              onClick={() => { setLogOpen(!logOpen); setLogErr(''); }}
              style={{
                background: logOpen ? 'rgba(155,135,245,0.08)' : 'rgba(255,255,255,0.03)',
                border: logOpen ? `1px solid rgba(155,135,245,0.3)` : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>📝 오늘 여수는 어땠나요?</div>
                  <div style={{ fontSize: 12, color: C.muted }}>하루 1회 · +50P</div>
                </div>
                <span style={{ fontSize: 11, color: C.gold, background: 'rgba(255,215,106,0.08)', border: '1px solid rgba(255,215,106,0.18)', borderRadius: 10, padding: '2px 8px' }}>
                  +50P
                </span>
              </div>

              <AnimatePresence>
                {logOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                      <AnswerGrid answers={LOG_ANSWERS} selected={logPicked} onSelect={setLogPicked} />
                      {logErr && (
                        <div style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{logErr}</div>
                      )}
                      <button
                        onClick={handleLogSubmit}
                        disabled={!logPicked || logSubmitting}
                        style={{
                          display: 'block', width: '100%', padding: '13px 0',
                          borderRadius: 12, border: 'none', marginTop: 14,
                          background: logPicked && !logSubmitting
                            ? `linear-gradient(135deg, ${C.purple}, #7B67D5)`
                            : 'rgba(155,135,245,0.15)',
                          color: logPicked && !logSubmitting ? '#fff' : C.muted,
                          fontSize: 14, fontWeight: 700,
                          cursor: logPicked && !logSubmitting ? 'pointer' : 'default',
                          fontFamily: "'Noto Sans KR', sans-serif",
                          transition: 'all 0.15s',
                        }}
                      >
                        {logSubmitting ? '기록 중...' : '오늘 기록하기'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 포인트 안내 */}
        <div style={{
          marginTop: 24, padding: '14px 16px',
          background: 'rgba(255,215,106,0.04)',
          border: '1px solid rgba(255,215,106,0.1)',
          borderRadius: 12, textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,215,106,0.55)', lineHeight: 1.7 }}>
            💛 5개 미션(500P) + 전체 완료 보너스(500P) + 매일 기록(50P/일)<br />
            45일 꾸준히 하면 5,000P 달성 가능해요
          </div>
        </div>
      </div>
    </div>
  );
}
