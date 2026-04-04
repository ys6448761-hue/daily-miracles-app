/**
 * StoryDraftMVP.jsx — 나의 이야기 초안 검증용 MVP
 * 경로: /story-draft-mvp
 *
 * AIL-STORY-2026-0404-001 · v4
 *
 * ⚠️ 이 페이지는 검증 전용입니다.
 *    - 실제 사용자 데이터 사용 없음
 *    - 판매/결제/상담 연결 없음
 *    - 샘플 데이터만 사용
 *    - 기존 프로덕션 플로우와 완전 독립
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SAMPLE = {
  wish:  '나는 내 삶을 스스로 결정하는 사람이 되고 싶다',
  pivot: '당신은 도망치지 않는 사람이 되었습니다',
};

function log(action) {
  console.info(JSON.stringify({
    requestId:  `mvp-${Date.now().toString(36)}`,
    action,
    experiment: 'AIL-STORY-2026-0404-001',
  }));
}

const fade = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay, duration: 0.7 },
});

function Divider() {
  return <div className="w-full h-px bg-white/8 my-10" />;
}

// ═══════════════════════════════════════════════════════════════
export default function StoryDraftMVP() {
  const nav       = useNavigate();
  const endRef    = useRef(null);
  const loggedRef = useRef(false);

  useEffect(() => { log('story_draft_view'); }, []);

  useEffect(() => {
    if (!endRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loggedRef.current) {
          loggedRef.current = true;
          log('story_draft_reach_end');
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen text-white pb-32 overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          인트로
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(0)} className="px-6 pt-16 pb-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-3xl mb-8"
        >
          ✦
        </motion.div>

        <motion.h1 {...fade(0.3)} className="text-2xl font-bold text-white leading-tight mb-4">
          당신의 이야기를<br />정리해봤어요
        </motion.h1>

        <motion.p {...fade(0.5)} className="text-white/40 text-sm leading-relaxed">
          여기, 당신이 걸어온 길이 있습니다
        </motion.p>
      </motion.section>

      <Divider />

      {/* ══════════════════════════════════════════════════════
          1장 — 처음
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(0.6)} className="px-6 mb-10">
        <p className="text-white/20 text-xs uppercase tracking-widest text-center mb-8">
          1장 — 처음
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-7 text-center">
          <p className="text-white/30 text-xs mb-4">그때 당신이 바란 것</p>
          <p className="text-white/85 text-base leading-relaxed italic">
            &ldquo;{SAMPLE.wish}&rdquo;
          </p>
        </div>
      </motion.section>

      <Divider />

      {/* ══════════════════════════════════════════════════════
          2장 — 여정
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(0.7)} className="px-6 mb-10">
        <p className="text-white/20 text-xs uppercase tracking-widest text-center mb-10">
          2장 — 여정
        </p>

        <div className="space-y-5 px-2">
          <p className="text-white/40 text-base leading-relaxed">
            어떤 날은 조금 더 나아갔고,
          </p>
          <p className="text-white/40 text-base leading-relaxed">
            어떤 날은 그대로인 것 같았습니다.
          </p>
          <p className="text-white/60 text-base leading-relaxed mt-4">
            그래도 당신은
          </p>
          <p className="text-white/85 text-base leading-relaxed font-semibold">
            다시 돌아왔습니다.
          </p>
        </div>
      </motion.section>

      <Divider />

      {/* ══════════════════════════════════════════════════════
          3장 — 변화   ← 감정 피크 최상단
          ══════════════════════════════════════════════════════ */}
      <motion.section className="px-6 mb-10">
        <p className="text-white/20 text-xs uppercase tracking-widest text-center mb-10">
          3장 — 변화
        </p>

        {/* ── 감정 피크 ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1.0 }}
          className="py-16 text-center"
        >
          <p className="text-white/35 text-base leading-relaxed mb-5">
            그리고 지금,
          </p>
          <p className="text-white/55 text-lg leading-relaxed mb-5">
            당신은
          </p>
          <p className="text-white text-2xl font-bold leading-snug tracking-tight">
            &ldquo;조금씩 앞으로 나아가는<br />사람이 되고 있습니다&rdquo;
          </p>
        </motion.div>

        {/* ── 확인 문장 ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="bg-white/4 border border-white/10 rounded-3xl px-6 py-8 text-center mt-6"
        >
          <div className="text-white/40 text-xl mb-5">✦</div>
          <p className="text-white text-xl font-bold leading-relaxed tracking-tight">
            {SAMPLE.pivot}
          </p>
        </motion.div>
      </motion.section>

      <Divider />

      {/* ══════════════════════════════════════════════════════
          4장 — 다음
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(0.9)} className="px-6 mb-8 text-center">
        <p className="text-white/20 text-xs uppercase tracking-widest mb-8">
          4장 — 다음
        </p>

        <p className="text-white/60 text-sm leading-relaxed mb-2">
          이 이야기는 여기서 끝나지 않습니다
        </p>
        <p className="text-white/30 text-sm leading-relaxed mb-10">
          이건 시작입니다
        </p>

        <div ref={endRef} className="space-y-3">
          <button
            onClick={() => log('story_draft_keep')}
            className="w-full py-4 rounded-2xl text-sm font-medium text-white/55 border border-white/15 hover:border-white/30 hover:text-white/80 transition-all"
          >
            여기까지의 이야기를 간직하기
          </button>
          <button
            onClick={() => { log('story_draft_continue'); nav('/my-star'); }}
            className="w-full py-4 rounded-2xl text-sm font-medium text-white/55 border border-white/15 hover:border-white/30 hover:text-white/80 transition-all"
          >
            이 이야기를 이어가기
          </button>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════
          운영자용 (사용자 비노출)
          ══════════════════════════════════════════════════════ */}
      <div className="px-6 mt-16 pt-8 border-t border-white/5">
        <p className="text-white/10 text-xs text-center mb-4 uppercase tracking-widest">진행자 참고</p>
        <div className="space-y-3">
          {[
            '이거 보고 어떤 느낌이 들었나요?',
            '이걸 다시 보고 싶은 마음이 드나요?',
            '이 이야기를 이어가보고 싶은 생각이 드나요?',
          ].map((q, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-white/10 text-xs shrink-0 mt-0.5">Q{i + 1}</span>
              <p className="text-white/12 text-xs leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
        <p className="text-white/8 text-xs text-center mt-6">
          AIL-STORY-2026-0404-001 · 검증용 MVP
        </p>
      </div>

    </div>
  );
}
