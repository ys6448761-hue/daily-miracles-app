/**
 * HundredDays.jsx — 100일의 이야기
 * 경로: /my-star/:id/100days
 *
 * 규칙:
 *   - 가치 인식 화면 (판매 화면 아님)
 *   - 가격/신청/CTA 절대 금지
 *   - 마지막에 씨앗 문장 1회 ("나중에 작품으로 남길 수 있습니다")
 *
 * 로그:
 *   story_100day_view  — 진입 시
 *   story_100day_complete — 끝까지 스크롤 시
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getStar, getOrCreateUserId } from '../api/dreamtown.js';

function daysSince(iso) {
  return Math.max(1, Math.floor((Date.now() - new Date(iso)) / 86400000) + 1);
}

export default function HundredDays() {
  const { id } = useParams();
  const nav    = useNavigate();

  const [star, setStar]       = useState(null);
  const [loading, setLoading] = useState(true);
  const endRef                = useRef(null);
  const completedRef          = useRef(false);

  // 진입 로그
  useEffect(() => {
    const uid = getOrCreateUserId();
    console.info(JSON.stringify({
      requestId:      `100d-view-${Date.now().toString(36)}`,
      user_id:        uid,
      star_id:        id,
      action:         'story_100day_view',
    }));
  }, [id]);

  // 별 데이터 로드
  useEffect(() => {
    getStar(id)
      .then(setStar)
      .catch(() => setStar(null))
      .finally(() => setLoading(false));
  }, [id]);

  // 끝까지 스크롤 감지 → story_100day_complete
  useEffect(() => {
    if (!endRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !completedRef.current) {
          completedRef.current = true;
          const uid = getOrCreateUserId();
          console.info(JSON.stringify({
            requestId:       `100d-complete-${Date.now().toString(36)}`,
            user_id:         uid,
            star_id:         id,
            action:          'story_100day_complete',
            days_since_start: star ? daysSince(star.created_at) : null,
          }));
        }
      },
      { threshold: 0.8 }
    );
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [id, star]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/40">
        <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          ✦
        </motion.p>
      </div>
    );
  }

  const days = star ? daysSince(star.created_at) : null;

  return (
    <div className="min-h-screen text-white pb-24 overflow-x-hidden">

      {/* 헤더 */}
      <div className="flex items-center px-5 pt-5 pb-2">
        <button onClick={() => nav(-1)} className="text-white/40 hover:text-white/70 mr-3 transition-colors">
          ←
        </button>
        <span className="text-white/40 text-sm">🌟 100일의 이야기</span>
      </div>

      {/* 메인 카피 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="px-6 pt-10 pb-8 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-5xl mb-8"
        >
          🌟
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-2xl font-bold text-white leading-tight mb-4"
        >
          당신의 이야기가<br />
          <span className="text-star-gold">100일</span>을 넘었습니다
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-white/50 text-sm leading-relaxed"
        >
          이건 단순한 기록이 아닙니다<br />
          당신이 살아온 시간입니다
        </motion.p>
      </motion.section>

      {/* 구분선 */}
      <div className="px-6 mb-8">
        <div className="w-full h-px bg-white/8" />
      </div>

      {/* 요약 */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="px-6 mb-8"
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-6 text-center">
          <p className="text-white/70 text-sm leading-relaxed mb-2">
            당신은 {days ?? '100'}일 동안 이렇게 살아왔습니다
          </p>
          {star && (
            <p className="text-white/40 text-xs leading-relaxed italic">
              &ldquo;{star.wish_text}&rdquo;
            </p>
          )}
        </div>
      </motion.section>

      {/* 의미 카드 1 */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.6 }}
        className="px-6 mb-6"
      >
        <div className="bg-white/4 border border-white/8 rounded-2xl px-5 py-5">
          <p className="text-star-gold text-xs mb-3 tracking-widest uppercase">의미</p>
          <p className="text-white/70 text-sm leading-relaxed">
            100일 동안 무언가를 계속했다는 건<br />
            이미 특별한 일입니다
          </p>
        </div>
      </motion.section>

      {/* 의미 카드 2 */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
        className="px-6 mb-6"
      >
        <div className="bg-white/4 border border-white/8 rounded-2xl px-5 py-5">
          <p className="text-white/60 text-xs mb-3 tracking-widest uppercase">가치</p>
          <p className="text-white/70 text-sm leading-relaxed">
            당신의 이야기는<br />
            이미 충분히 의미를 가지고 있습니다
          </p>
        </div>
      </motion.section>

      {/* 씨앗 문장 (1회, 판매 없음) */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.6 }}
        className="px-6 mb-10"
      >
        <div className="bg-white/3 border border-dashed border-white/12 rounded-2xl px-5 py-5 text-center">
          <p className="text-white/40 text-sm leading-relaxed">
            이 이야기는<br />
            나중에 하나의 작품으로 남길 수 있습니다
          </p>
        </div>
      </motion.section>

      {/* 종료 CTA */}
      <div ref={endRef} className="px-6 text-center pb-8">
        <button
          onClick={() => nav(`/my-star/${id}`)}
          className="text-white/55 text-sm border border-white/20 rounded-xl px-8 py-3.5 hover:border-white/35 hover:text-white/75 transition-all"
        >
          이야기 이어가기 →
        </button>
      </div>

    </div>
  );
}
