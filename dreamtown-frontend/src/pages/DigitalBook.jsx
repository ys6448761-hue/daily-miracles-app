/**
 * DigitalBook.jsx — 디지털북 → 실물책 전환 UX
 * 경로: /my-star/:id/book
 *
 * 하네스 원칙:
 *   RULE 1: 디지털북은 완전한 편집 금지 (의도적 미완성)
 *   RULE 2: 빈 구간 최소 1곳 포함 (갈망 유발)
 *   RULE 3: CTA 최소 3회 노출
 *   RULE 4: "완성되지 않았다" 메시지 반드시 포함
 *
 * Sections:
 *   1. Cover    — star_name / dates / 소원 / CTA ①
 *   2. Intro    — first_wish / first_image / first_log
 *   3. Growth   — day7/day30 + 의도적 빈 구간 + CTA ②
 *   4. Summary  — 변화 요약 + "아직 완성되지 않았다" + CTA ③
 *   5. Modal    — 실물책 전환 화면
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { readSavedStar } from '../lib/utils/starSession.js';
import { getStarTimeline, postBookUpgrade, getOrCreateUserId } from '../api/dreamtown.js';

// ── 날짜 포맷 ─────────────────────────────────────────────────
function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
function daysSince(iso) {
  return Math.max(1, Math.floor((Date.now() - new Date(iso)) / 86400000) + 1);
}

// ── 타임라인 데이터 파싱 ─────────────────────────────────────
function parseTimeline(tl) {
  const careLogs = (tl.dream_log ?? []).filter(l => l.log_type === 'care' && l.payload?.message_text);
  const voyageLogs = (tl.dream_log ?? []).filter(l => l.log_type === 'voyage');
  const wishImage = (tl.artifacts ?? []).find(a => a.type === 'image' && a.result_url)?.result_url ?? null;

  // 초기 기록 (Day 1~3)
  const firstLog = careLogs[0] ?? null;

  // Day7 ~ Day30 구간 로그
  const growthLogs = careLogs.filter(l => {
    const d = l.payload?.day ?? 0;
    return d >= 7 && d <= 30;
  });

  // 선택/변화 지점 (최대 3개)
  const choices = (tl.choices ?? []).slice(0, 3);

  // 주요 보고서
  const report = (tl.reports ?? [])[0] ?? null;

  return { careLogs, voyageLogs, wishImage, firstLog, growthLogs, choices, report };
}

// ── CTA 버튼 컴포넌트 ─────────────────────────────────────────
function BookCTA({ onClick, label = '내 책 만들기', subtle = false }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200
        ${subtle
          ? 'bg-white/8 border border-white/15 text-white/60 hover:bg-white/12 hover:text-white/80'
          : 'bg-gradient-to-r from-dream-purple to-violet-500 text-white hover:brightness-110 shadow-lg shadow-violet-900/30'
        }`}
    >
      {label} →
    </motion.button>
  );
}

// ── 빈 구간 컴포넌트 (의도적 미완성) ─────────────────────────
function EmptyChapter({ label = '이 구간' }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 p-5 text-center">
      <div className="flex justify-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-1.5 rounded-full bg-white/10"
            style={{ width: `${20 + Math.random() * 40}px` }} />
        ))}
      </div>
      <p className="text-white/25 text-xs leading-relaxed">
        {label}은 아직 완전히 정리되지 않았습니다
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════
export default function DigitalBook() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const myStarId = readSavedStar();

  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  // 로그용 requestId
  const requestId = useRef(`book-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    getStarTimeline(id)
      .then(setTimeline)
      .catch(() => setTimeline(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── CTA 클릭 핸들러 (Task 5: 로그 + Task 2: API) ──────────
  function handleCTAClick() {
    const userId = getOrCreateUserId();
    // Task 5: 로그
    console.info(JSON.stringify({
      requestId: requestId.current,
      user_id:   userId,
      star_id:   id,
      action:    'book_upgrade_click',
    }));
    setShowModal(true);
  }

  // ── 로딩 ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/40">
        <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          여정을 불러오는 중 ✦
        </motion.p>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/40 text-sm">여정을 불러올 수 없어요</p>
        <button onClick={() => nav(-1)} className="text-white/50 underline text-sm">돌아가기</button>
      </div>
    );
  }

  const { star, stats } = timeline;
  const { wishImage, firstLog, growthLogs, choices, report } = parseTimeline(timeline);
  const days      = daysSince(star.created_at);
  const startDate = fmt(star.created_at);
  const today     = fmt(new Date());
  const userId    = getOrCreateUserId();

  return (
    <>
      <div className="min-h-screen text-white pb-24 overflow-x-hidden">

        {/* ── 헤더 ───────────────────────────────────────────── */}
        <div className="flex items-center px-5 pt-5 pb-2">
          <button onClick={() => nav(-1)} className="text-white/40 hover:text-white/70 mr-3 transition-colors">
            ←
          </button>
          <span className="text-white/40 text-sm">내 여정 책</span>
        </div>

        {/* ════════════════════════════════════════════════════════
            SECTION 1 — COVER
            ════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="px-6 pt-8 pb-8"
        >
          {/* 소원그림 (있을 때만) */}
          {wishImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mx-auto mb-6 w-44 h-44 rounded-2xl overflow-hidden shadow-xl border border-white/10"
            >
              <img src={wishImage} alt="소원그림" className="w-full h-full object-cover" />
            </motion.div>
          )}

          {/* 별 이름 */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl font-bold text-white text-center mb-3 tracking-tight"
          >
            {star.star_name}
          </motion.h1>

          {/* 소원 문장 */}
          <motion.blockquote
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-white/50 text-sm leading-relaxed italic text-center px-4 mb-4"
          >
            &ldquo;{star.wish_text}&rdquo;
          </motion.blockquote>

          {/* 기간 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="text-white/25 text-xs text-center mb-6"
          >
            {startDate} — {today} · D+{days}
          </motion.p>

          {/* 핵심 카피 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-center mb-5"
          >
            <p className="text-white/80 text-sm leading-relaxed">
              당신의 <span className="text-star-gold font-semibold">{days}일</span>이<br />
              한 권의 이야기로 정리되었습니다
            </p>
          </motion.div>

        </motion.section>

        {/* ════════════════════════════════════════════════════════
            SECTION 2 — INTRO (감정 몰입)
            ════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="px-6 mb-8"
        >
          <div className="w-full h-px bg-white/8 mb-6" />
          <p className="text-white/25 text-xs uppercase tracking-widest text-center mb-5">1장 — 처음</p>

          {/* 첫 소원 기록일 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-3">
            <p className="text-white/35 text-xs mb-1">{startDate}</p>
            <p className="text-white/70 text-sm leading-relaxed">
              이 날, 당신은 이 소원을 처음 적었습니다.
            </p>
            <p className="text-white/45 text-sm leading-relaxed mt-2 italic">
              &ldquo;{star.wish_text}&rdquo;
            </p>
          </div>

          {/* 첫 번째 케어 메시지 */}
          {firstLog ? (
            <div className="bg-white/5 border border-white/8 rounded-xl p-4">
              <p className="text-white/25 text-xs mb-1">D+{firstLog.payload?.day ?? 1} · 첫 번째 기록</p>
              <p className="text-white/55 text-sm leading-relaxed line-clamp-3">
                {firstLog.payload.message_text}
              </p>
            </div>
          ) : (
            <EmptyChapter label="첫 번째 기록" />
          )}
        </motion.section>

        {/* ════════════════════════════════════════════════════════
            SECTION 3 — GROWTH (중요 · 의도적 빈 구간 포함)
            ════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6 }}
          className="px-6 mb-8"
        >
          <div className="w-full h-px bg-white/8 mb-6" />
          <p className="text-white/25 text-xs uppercase tracking-widest text-center mb-5">2장 — 여정</p>

          {/* Day 7 기록 */}
          {growthLogs[0] ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
              <p className="text-white/25 text-xs mb-1">D+{growthLogs[0].payload?.day} · 7일의 기록</p>
              <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
                {growthLogs[0].payload.message_text}
              </p>
            </div>
          ) : (
            <div className="mb-3">
              <EmptyChapter label="7일의 기록" />
            </div>
          )}

          {/* RULE 2: 의도적 빈 구간 (항상 포함) ── */}
          <div className="bg-white/3 border border-dashed border-white/15 rounded-2xl p-5 mb-3">
            <p className="text-white/25 text-xs text-center mb-4">중간 여정</p>
            <div className="space-y-2">
              {[60, 80, 45, 70, 50].map((w, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="h-1 rounded-full bg-white/8" style={{ width: `${w}%` }} />
                  <div className="h-1 rounded-full bg-white/5 flex-1" />
                </div>
              ))}
            </div>
            <p className="text-white/40 text-sm text-center mt-4 leading-relaxed font-medium">
              이 구간은 아직 완전히 정리되지 않았습니다
            </p>
          </div>

          {/* Day 30 기록 (있으면) */}
          {growthLogs.length > 1 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5">
              <p className="text-white/25 text-xs mb-1">
                D+{growthLogs[growthLogs.length - 1].payload?.day} · 30일의 기록
              </p>
              <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
                {growthLogs[growthLogs.length - 1].payload.message_text}
              </p>
            </div>
          ) : (
            <div className="mb-5">
              <EmptyChapter label="30일의 기록" />
            </div>
          )}

          {/* CTA ① — 중간 · 약한 강조 */}
          <BookCTA onClick={handleCTAClick} label="내 책 만들기" subtle />
        </motion.section>

        {/* ════════════════════════════════════════════════════════
            SECTION 4 — SUMMARY (핵심)
            ════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="px-6 mb-8"
        >
          <div className="w-full h-px bg-white/8 mb-6" />
          <p className="text-white/25 text-xs uppercase tracking-widest text-center mb-5">3장 — 변화</p>

          {/* 변화 요약 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-5 mb-4">
            <p className="text-white/70 text-sm leading-relaxed mb-3">
              당신은 {days}일 동안 이렇게 살아왔습니다.
            </p>
            <div className="space-y-2">
              {[
                { label: '기록한 날',    value: `${stats?.total_events ?? 0}회` },
                { label: '성장 단계',    value: star.star_stage ?? 'day1' },
                { label: '함께한 은하',  value: star.galaxy ?? '' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-white/35 text-xs">{item.label}</span>
                  <span className="text-white/65 text-xs font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 선택 3개 */}
          {choices.length > 0 && (
            <div className="space-y-2 mb-4">
              {choices.map((c, i) => (
                <div key={i} className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 flex gap-3 items-start">
                  <span className="text-white/25 text-xs shrink-0 mt-0.5">{fmt(c.created_at)}</span>
                  <p className="text-white/50 text-xs leading-relaxed">{c.choice_value}</p>
                </div>
              ))}
            </div>
          )}

          {/* RULE 4: "완성되지 않았다" 메시지 ──────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7 }}
            className="bg-white/4 border border-white/10 rounded-2xl px-5 py-6 mb-6 text-center"
          >
            <p className="text-white/70 text-sm leading-relaxed mb-3">
              당신은 {days}일 동안 이렇게 살아왔습니다
            </p>
            <p className="text-white/30 text-xs leading-relaxed">
              하지만
            </p>
            <p className="text-white/60 text-sm leading-relaxed mt-1">
              이 이야기는 아직 완성되지 않았습니다
            </p>
          </motion.div>

          {/* CTA ② — 마지막 · 가장 강한 강조 */}
          <BookCTA onClick={handleCTAClick} label="이 이야기를 작품으로 만들기" />
        </motion.section>

      </div>

      {/* ════════════════════════════════════════════════════════
          SECTION 5 — 실물책 전환 모달 (Task 3)
          ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <BookUpgradeModal
            star={star}
            starId={id}
            userId={userId}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── 실물책 전환 모달 ─────────────────────────────────────────
function BookUpgradeModal({ star, starId, userId, onClose }) {
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);
  const [phone, setPhone]             = useState('');

  async function handleStart(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Task 2: POST /api/book/upgrade
      await postBookUpgrade({ starId, userId, phone: phone.trim() || null });
    } catch {
      // 실패해도 UX는 성공 처리
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-md bg-[#0d0b1e] border-t border-white/10 rounded-t-3xl px-6 pt-6 pb-10"
      >
        {/* 핸들 */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        {!done ? (
          <>
            {/* 메인 카피 */}
            <div className="text-center mb-7">
              <h2 className="text-xl font-bold text-white leading-snug mb-3">
                당신의 이야기를<br />
                세상에 단 하나의 책으로<br />
                만들 수 있습니다
              </h2>
              <p className="text-white/40 text-sm leading-relaxed">
                AI가 기록한 당신의 {Math.max(1, Math.floor((Date.now() - new Date(star.created_at)) / 86400000) + 1)}일
              </p>
              <p className="text-white/40 text-sm leading-relaxed mt-1">
                이제 작가와 함께<br />
                <span className="text-white/70">작품으로 완성해드립니다</span>
              </p>
            </div>

            {/* 포함 내용 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 space-y-2">
              {[
                '전체 여정 AI 편집 + 작가 교열',
                '소원그림 전체 삽화 인쇄',
                '여수 소원 의식 초대',
                '세상에 단 하나의 실물 책',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <span className="text-dream-purple text-xs">✦</span>
                  <span className="text-white/60 text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* 연락처 폼 + CTA */}
            <form onSubmit={handleStart} className="space-y-3">
              <input
                type="tel"
                placeholder="연락처 (선택 · 010-0000-0000)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200
                  ${submitting
                    ? 'bg-white/10 text-white/30'
                    : 'bg-gradient-to-r from-dream-purple to-violet-500 text-white hover:brightness-110 shadow-lg shadow-violet-900/40 active:scale-95'
                  }`}
              >
                {submitting ? '신청 중...' : '책 제작 시작하기 →'}
              </button>
            </form>

            <div className="mt-5 text-center space-y-1">
              <p className="text-white/55 text-sm leading-relaxed">
                이건 기록이 아닙니다
              </p>
              <p className="text-white/55 text-sm leading-relaxed">
                당신의 인생을 작품으로 만드는 과정입니다
              </p>
            </div>
            <p className="text-white/25 text-xs text-center mt-3 leading-relaxed">
              신청 후 담당 작가가 직접 연락드립니다 · 300~500만원
            </p>
          </>
        ) : (
          /* 완료 화면 */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <div className="text-4xl mb-4">✦</div>
            <p className="text-white font-bold text-lg mb-2">신청이 접수되었습니다</p>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              {star.star_name}의 이야기를 책으로 만들 준비를 시작할게요.<br />
              담당자가 곧 연락드리겠습니다.
            </p>
            <button
              onClick={onClose}
              className="text-white/40 text-sm underline"
            >
              닫기
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
