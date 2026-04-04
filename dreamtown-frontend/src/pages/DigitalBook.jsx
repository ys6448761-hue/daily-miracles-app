/**
 * DigitalBook.jsx — 내 여정 초안
 * 경로: /my-star/:id/book
 *
 * SSOT (2026-04-04):
 *   - 초기/중기: 책 CTA 없음. 이야기/초안 중심.
 *   - 100일: /my-star/:id/100days 전용 페이지
 *   - 6개월: /my-star/:id/masterpiece (작품 전환 게이트)
 *
 * 구조:
 *   1. Cover    — 별 이름 / 소원 / 기간
 *   2. Intro    — 첫 기록
 *   3. Growth   — 여정 + 의도적 빈 구간
 *   4. Summary  — 변화 요약 + progress + "기록 이어가기"
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getStarTimeline, getOrCreateUserId } from '../api/dreamtown.js';

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
  const careLogs   = (tl.dream_log ?? []).filter(l => l.log_type === 'care' && l.payload?.message_text);
  const voyageLogs = (tl.dream_log ?? []).filter(l => l.log_type === 'voyage');
  const wishImage  = (tl.artifacts ?? []).find(a => a.type === 'image' && a.result_url)?.result_url ?? null;
  const firstLog   = careLogs[0] ?? null;
  const growthLogs = careLogs.filter(l => { const d = l.payload?.day ?? 0; return d >= 7 && d <= 30; });
  const choices    = (tl.choices ?? []).slice(0, 3);
  const report     = (tl.reports ?? [])[0] ?? null;
  return { careLogs, voyageLogs, wishImage, firstLog, growthLogs, choices, report };
}

// ── 빈 구간 컴포넌트 (의도적 미완성) ─────────────────────────
function EmptyChapter({ label = '이 구간' }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 p-5 text-center">
      <div className="flex justify-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-1.5 rounded-full bg-white/10"
            style={{ width: `${20 + (i * 13 % 40)}px` }} />
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
  const { id } = useParams();
  const nav    = useNavigate();

  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getStarTimeline(id)
      .then(setTimeline)
      .catch(() => setTimeline(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── 로딩 ──────────────────────────────────────────────────────
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

  const { star, stats }                                             = timeline;
  const { wishImage, firstLog, growthLogs, choices, careLogs, voyageLogs } = parseTimeline(timeline);
  const days      = daysSince(star.created_at);
  const startDate = fmt(star.created_at);
  const today     = fmt(new Date());

  return (
    <div className="min-h-screen text-white pb-24 overflow-x-hidden">

      {/* ── 헤더 ─────────────────────────────────────────────── */}
      <div className="flex items-center px-5 pt-5 pb-2">
        <button onClick={() => nav(-1)} className="text-white/40 hover:text-white/70 mr-3 transition-colors">
          ←
        </button>
        <span className="text-white/40 text-sm">내 여정 초안</span>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — COVER
          ══════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="px-6 pt-8 pb-8"
      >
        {/* 소원그림 */}
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
          className="bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-center"
        >
          <p className="text-white/80 text-sm leading-relaxed">
            당신의 <span className="text-star-gold font-semibold">{days}일</span>이<br />
            이야기로 만들어지고 있습니다
          </p>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — INTRO (감정 몰입)
          ══════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="px-6 mb-8"
      >
        <div className="w-full h-px bg-white/8 mb-6" />
        <p className="text-white/25 text-xs uppercase tracking-widest text-center mb-5">1장 — 처음</p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-3">
          <p className="text-white/35 text-xs mb-1">{startDate}</p>
          <p className="text-white/70 text-sm leading-relaxed">
            이 날, 당신은 이 소원을 처음 적었습니다.
          </p>
          <p className="text-white/45 text-sm leading-relaxed mt-2 italic">
            &ldquo;{star.wish_text}&rdquo;
          </p>
        </div>

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

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — GROWTH (의도적 빈 구간 포함)
          ══════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95, duration: 0.6 }}
        className="px-6 mb-8"
      >
        <div className="w-full h-px bg-white/8 mb-6" />
        <p className="text-white/25 text-xs uppercase tracking-widest text-center mb-5">2장 — 여정</p>

        {growthLogs[0] ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
            <p className="text-white/25 text-xs mb-1">D+{growthLogs[0].payload?.day} · 7일의 기록</p>
            <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
              {growthLogs[0].payload.message_text}
            </p>
          </div>
        ) : (
          <div className="mb-3"><EmptyChapter label="7일의 기록" /></div>
        )}

        {/* 의도적 빈 구간 (항상 포함) */}
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

        {growthLogs.length > 1 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-white/25 text-xs mb-1">
              D+{growthLogs[growthLogs.length - 1].payload?.day} · 30일의 기록
            </p>
            <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
              {growthLogs[growthLogs.length - 1].payload.message_text}
            </p>
          </div>
        ) : (
          <EmptyChapter label="30일의 기록" />
        )}
      </motion.section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — SUMMARY
          ══════════════════════════════════════════════════════════ */}
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
          <p className="text-white/70 text-sm leading-relaxed">
            당신은 이렇게 지나왔습니다.
          </p>
        </div>

        {/* 주요 선택 */}
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

        {/* "완성되지 않았다" 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.7 }}
          className="bg-white/4 border border-white/10 rounded-2xl px-5 py-6 mb-6 text-center"
        >
          <p className="text-white/30 text-xs leading-relaxed">하지만</p>
          <p className="text-white/60 text-sm leading-relaxed mt-1">
            이 이야기는 아직 완성되지 않았습니다
          </p>
        </motion.div>

      </motion.section>

    </div>
  );
}
