/**
 * MissionPage.jsx — 여수 미션 + 일일 감정 로그
 * 경로: /missions?star_id=xxx
 *
 * - 5개 여수 미션 목록 (각 100P)
 * - 오늘의 감정 로그 (50P, 1일 1회)
 * - 포인트 잔액 표시
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrCreateUserId } from '../api/dreamtown.js';
import { readSavedStar } from '../lib/utils/starSession.js';

// ── 스타일 토큰 ──────────────────────────────────────────────────
const C = {
  bg:      '#0D1B2A',
  card:    'rgba(255,255,255,0.04)',
  border:  'rgba(255,255,255,0.08)',
  purple:  '#9B87F5',
  gold:    '#FFD76A',
  muted:   '#7A6E9C',
  text:    '#E8E4F0',
  green:   '#4ade80',
};

const S = {
  page: {
    minHeight: '100vh',
    background: `linear-gradient(180deg, ${C.bg} 0%, #0A2240 100%)`,
    fontFamily: "'Noto Sans KR', sans-serif",
    color: C.text,
    padding: '0 0 80px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 20px 0',
    gap: 12,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    cursor: 'pointer',
    padding: '8px 0',
  },
  section: { padding: '0 20px', marginBottom: 20 },
  card: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: '16px',
    marginBottom: 12,
  },
  pointBadge: {
    display: 'inline-block',
    background: 'rgba(255,215,106,0.12)',
    border: '1px solid rgba(255,215,106,0.28)',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 13,
    color: C.gold,
    fontWeight: 700,
  },
  missionCard: {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  missionCardDone: {
    background: 'rgba(74,222,128,0.05)',
    border: '1px solid rgba(74,222,128,0.18)',
  },
  emotionGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  emotionChip: {
    padding: '7px 14px',
    borderRadius: 20,
    border: `1px solid rgba(155,135,245,0.3)`,
    background: 'rgba(155,135,245,0.08)',
    fontSize: 13,
    color: C.purple,
    cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  emotionChipSelected: {
    background: 'rgba(155,135,245,0.25)',
    border: `1px solid ${C.purple}`,
    color: '#fff',
    fontWeight: 700,
  },
  submitBtn: {
    display: 'block',
    width: '100%',
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    background: `linear-gradient(135deg, ${C.purple}, #7B67D5)`,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 12,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  cancelBtn: {
    display: 'block',
    width: '100%',
    padding: '11px 0',
    borderRadius: 12,
    border: `1px solid rgba(255,255,255,0.1)`,
    background: 'transparent',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    cursor: 'pointer',
    marginTop: 8,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
};

// ── 감정 선택 패널 ───────────────────────────────────────────────
function EmotionPicker({ emotions, selected, onSelect }) {
  return (
    <div style={S.emotionGrid}>
      {emotions.map(e => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          style={{
            ...S.emotionChip,
            ...(selected === e ? S.emotionChipSelected : {}),
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

// ── 포인트 헤더 배너 ─────────────────────────────────────────────
function PointBanner({ totalPoints, completedCount, totalCount }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(155,135,245,0.12) 0%, rgba(255,215,106,0.06) 100%)',
      border: '1px solid rgba(155,135,245,0.2)',
      borderRadius: 16,
      padding: '18px 20px',
      marginBottom: 24,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>여수 미션 포인트</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.gold, lineHeight: 1 }}>
          {totalPoints.toLocaleString()}P
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
          1P = 10원 상당
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>미션 완료</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>
          {completedCount}<span style={{ fontSize: 14, color: C.muted }}>/{totalCount}</span>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
          완료 시 최대 {totalCount * 100}P
        </div>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function MissionPage() {
  const nav              = useNavigate();
  const [params]         = useSearchParams();
  const starIdFromQuery  = params.get('star_id');
  const starId           = starIdFromQuery || readSavedStar();

  const [loading,      setLoading]      = useState(true);
  const [missions,     setMissions]     = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalPoints,  setTotalPoints]  = useState(0);
  const [todayLogDone, setTodayLogDone] = useState(false);
  const [todayLogEmotion, setTodayLogEmotion] = useState(null);

  // 확장된 미션 패널
  const [expandedId,   setExpandedId]  = useState(null);
  const [pickedEmotion, setPickedEmotion] = useState(null);
  const [submitting,   setSubmitting]  = useState(false);
  const [submitError,  setSubmitError] = useState('');

  // 일일 로그 패널
  const [logExpanded,  setLogExpanded]  = useState(false);
  const [logEmotion,   setLogEmotion]   = useState(null);
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logError,     setLogError]     = useState('');

  // ── 데이터 로드 ──────────────────────────────────────────────
  const load = async () => {
    if (!starId) { setLoading(false); return; }
    setLoading(true);
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
        setTodayLogEmotion(mData.today_log?.emotion ?? null);
      }
      if (pData?.success) {
        setTotalPoints(pData.total_points ?? 0);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [starId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 미션 완료 제출 ────────────────────────────────────────────
  const handleMissionSubmit = async () => {
    if (!expandedId || !pickedEmotion || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const userId = getOrCreateUserId();
      const r = await fetch('/api/yeosu-missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          star_id:    starId,
          user_id:    userId,
          mission_id: expandedId,
          emotion:    pickedEmotion,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        if (data.error === 'ALREADY_COMPLETED') {
          setSubmitError('이미 완료한 미션이에요.');
        } else {
          setSubmitError(data.message || '오류가 발생했어요. 다시 시도해주세요.');
        }
        return;
      }
      // 성공 → 데이터 갱신
      await load();
      setExpandedId(null);
      setPickedEmotion(null);
    } catch (_) {
      setSubmitError('네트워크 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 일일 로그 제출 ────────────────────────────────────────────
  const handleLogSubmit = async () => {
    if (!logEmotion || logSubmitting) return;
    setLogSubmitting(true);
    setLogError('');
    try {
      const userId = getOrCreateUserId();
      const r = await fetch('/api/yeosu-missions/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          star_id: starId,
          user_id: userId,
          emotion: logEmotion,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        if (data.error === 'ALREADY_LOGGED') {
          setLogError('오늘은 이미 감정을 기록했어요.');
        } else {
          setLogError(data.message || '오류가 발생했어요.');
        }
        return;
      }
      await load();
      setLogExpanded(false);
      setLogEmotion(null);
    } catch (_) {
      setLogError('네트워크 오류가 발생했어요.');
    } finally {
      setLogSubmitting(false);
    }
  };

  // ── 로딩 ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: C.muted }}>불러오는 중...</div>
      </div>
    );
  }

  // ── 별 없음 ──────────────────────────────────────────────────
  if (!starId) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⭐</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>별이 없어요</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
            케이블카 QR을 스캔해서 별을 먼저 탄생시켜주세요
          </div>
          <button onClick={() => nav('/cablecar')} style={S.submitBtn}>
            별 탄생시키러 가기
          </button>
        </div>
      </div>
    );
  }

  const LOG_EMOTIONS = ['설레임', '행복', '평온', '감동', '감사', '기대', '그리움', '치유'];

  return (
    <div style={S.page}>
      {/* 헤더 */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => nav(-1)}>← 뒤로</button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: C.muted }}>여수 미션</div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* 타이틀 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.purple, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
            Yeosu Missions
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 6 }}>
            여수에서<br />특별한 순간을 기록해요
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            미션 완료마다 100P, 매일 감정 기록 50P<br />
            모은 포인트로 특별한 혜택을 받아요
          </div>
        </div>

        {/* 포인트 배너 */}
        <PointBanner
          totalPoints={totalPoints}
          completedCount={completedCount}
          totalCount={missions.length}
        />

        {/* 미션 목록 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 12, letterSpacing: '0.05em' }}>
            여수 체험 미션
          </div>

          {missions.map(m => {
            const isExpanded = expandedId === m.id;
            const isDone     = m.completed;

            return (
              <motion.div
                key={m.id}
                layout
                style={{
                  ...S.missionCard,
                  ...(isDone ? S.missionCardDone : {}),
                  cursor: isDone ? 'default' : 'pointer',
                }}
                onClick={() => {
                  if (isDone) return;
                  setExpandedId(isExpanded ? null : m.id);
                  setPickedEmotion(null);
                  setSubmitError('');
                }}
              >
                {/* 아이콘 */}
                <div style={{ fontSize: 32, flexShrink: 0, marginTop: 2 }}>{m.icon}</div>

                {/* 내용 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: isDone ? C.green : C.text }}>
                      {m.title}
                    </span>
                    {isDone && (
                      <span style={{ fontSize: 11, color: C.green, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: '2px 8px' }}>
                        ✓ 완료
                      </span>
                    )}
                    {!isDone && (
                      <span style={{ fontSize: 11, color: C.gold, background: 'rgba(255,215,106,0.08)', border: '1px solid rgba(255,215,106,0.2)', borderRadius: 10, padding: '2px 8px' }}>
                        +100P
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                    {m.description}
                  </div>
                  {isDone && m.completion?.emotion && (
                    <div style={{ fontSize: 11, color: 'rgba(74,222,128,0.7)', marginTop: 4 }}>
                      감정: {m.completion.emotion}
                    </div>
                  )}

                  {/* 감정 선택 패널 */}
                  <AnimatePresence>
                    {isExpanded && !isDone && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                            이 순간 어떤 감정이었나요?
                          </div>
                          <EmotionPicker
                            emotions={m.emotions}
                            selected={pickedEmotion}
                            onSelect={setPickedEmotion}
                          />
                          {submitError && (
                            <div style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{submitError}</div>
                          )}
                          <button
                            onClick={handleMissionSubmit}
                            disabled={!pickedEmotion || submitting}
                            style={{
                              ...S.submitBtn,
                              ...(!pickedEmotion || submitting
                                ? { background: 'rgba(155,135,245,0.2)', color: C.muted, cursor: 'default' }
                                : {}),
                            }}
                          >
                            {submitting ? '기록 중...' : '미션 완료 기록하기 ✨'}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setExpandedId(null); setPickedEmotion(null); }}
                            style={S.cancelBtn}
                          >
                            취소
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 일일 감정 로그 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 12, letterSpacing: '0.05em' }}>
            오늘의 여수 감정 로그
          </div>

          {todayLogDone ? (
            <div style={{
              ...S.card,
              background: 'rgba(74,222,128,0.05)',
              border: '1px solid rgba(74,222,128,0.18)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green, marginBottom: 4 }}>
                오늘의 감정을 기록했어요
              </div>
              {todayLogEmotion && (
                <div style={{ fontSize: 12, color: 'rgba(74,222,128,0.7)' }}>
                  감정: {todayLogEmotion} · +50P
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                ...S.card,
                cursor: 'pointer',
              }}
              onClick={() => { setLogExpanded(!logExpanded); setLogError(''); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    📝 오늘 여수에서의 감정
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    오늘 하루 어떤 감정이었나요? · +50P
                  </div>
                </div>
                <span style={{ fontSize: 11, color: C.gold, background: 'rgba(255,215,106,0.08)', border: '1px solid rgba(255,215,106,0.2)', borderRadius: 10, padding: '2px 8px' }}>
                  +50P
                </span>
              </div>

              <AnimatePresence>
                {logExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                      <EmotionPicker
                        emotions={LOG_EMOTIONS}
                        selected={logEmotion}
                        onSelect={setLogEmotion}
                      />
                      {logError && (
                        <div style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{logError}</div>
                      )}
                      <button
                        onClick={handleLogSubmit}
                        disabled={!logEmotion || logSubmitting}
                        style={{
                          ...S.submitBtn,
                          ...(!logEmotion || logSubmitting
                            ? { background: 'rgba(155,135,245,0.2)', color: C.muted, cursor: 'default' }
                            : {}),
                        }}
                      >
                        {logSubmitting ? '기록 중...' : '오늘의 감정 기록하기'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 포인트 안내 */}
        <div style={{ ...S.card, marginTop: 24, textAlign: 'center', background: 'rgba(255,215,106,0.04)', border: '1px solid rgba(255,215,106,0.1)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,215,106,0.6)', lineHeight: 1.7 }}>
            💛 모인 포인트는 여수 파트너 혜택으로 교환할 수 있어요<br />
            최대 5개 미션(500P) + 매일 로그(50P/일)
          </div>
        </div>
      </div>
    </div>
  );
}
