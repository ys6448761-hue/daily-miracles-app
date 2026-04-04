/**
 * StoryDraftMVP.jsx — 나의 이야기 초안 검증용 MVP
 * 경로: /story-draft-mvp
 *
 * AIL-STORY-2026-0404-001
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

// ── 샘플 데이터 (더미, PRIVATE 데이터 0건) ──────────────────
const SAMPLE = {
  wish:   '나는 내 삶을 스스로 결정하는 사람이 되고 싶다',
  emotion: [
    '그날은 오래 참아온 것들이 한꺼번에 쏟아진 날이었어요.',
    '그래도 뭔가를 시작해보고 싶다는 마음이 처음으로 분명하게 느껴졌습니다.',
  ],
  pivot: '당신은 도망치지 않는 사람이 되었습니다',
};

// ── 진입/클릭 로그 ────────────────────────────────────────────
function log(action, extra = {}) {
  console.info(JSON.stringify({
    requestId: `mvp-${Date.now().toString(36)}`,
    action,
    experiment: 'AIL-STORY-2026-0404-001',
    ...extra,
  }));
}

// ── 섹션 페이드 애니메이션 ────────────────────────────────────
const fade = (delay = 0) => ({
  initial:    { opacity: 0, y: 18 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay, duration: 0.7 },
});

// ── 구분선 ────────────────────────────────────────────────────
function Divider() {
  return <div className="w-full h-px bg-white/8 my-8" />;
}

// ═══════════════════════════════════════════════════════════════
export default function StoryDraftMVP() {
  const nav       = useNavigate();
  const endRef    = useRef(null);
  const loggedRef = useRef(false);

  // 진입 로그
  useEffect(() => {
    log('story_draft_view');
  }, []);

  // 끝 도달 로그 (1회)
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

  function handleKeep() {
    log('story_draft_keep');
  }

  function handleContinue() {
    log('story_draft_continue');
    nav('/my-star');
  }

  return (
    <div className="min-h-screen text-white pb-32 overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          [1] 인트로
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

        <motion.p {...fade(0.5)} className="text-white/45 text-sm leading-relaxed">
          당신의 이야기가<br />조금씩 드러나고 있습니다
        </motion.p>
      </motion.section>

      <Divider />

      {/* ══════════════════════════════════════════════════════
          [2] 시작 — 첫 소원 + 감정 요약
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(0.6)} className="px-6 mb-10">
        <p className="text-white/20 text-xs uppercase tracking-widest text-center mb-6">
          1장 — 처음
        </p>

        {/* 첫 소원 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-6 mb-4 text-center">
          <p className="text-white/30 text-xs mb-3">그때 당신이 바란 것</p>
          <p className="text-white/80 text-base leading-relaxed italic">
            &ldquo;{SAMPLE.wish}&rdquo;
          </p>
        </div>

        {/* 감정 요약 */}
        <div className="space-y-2">
          {SAMPLE.emotion.map((line, i) => (
            <p key={i} className="text-white/50 text-sm leading-relaxed px-1">
              {line}
            </p>
          ))}
        </div>
      </motion.section>

      <Divider />

      {/* ══════════════════════════════════════════════════════
          [3] 변화 — 감정 피크 + 서사 산문
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(0.7)} className="px-6 mb-10">
        <p className="text-white/20 text-xs uppercase tracking-widest text-center mb-6">
          2장 — 여정
        </p>

        {/* 감정 피크 — 스크롤 멈춤 지점 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.9 }}
          className="py-16 text-center mb-8"
        >
          <p className="text-white/35 text-base leading-relaxed mb-4">
            그리고 지금,
          </p>
          <p className="text-white/55 text-lg leading-relaxed mb-4">
            당신은
          </p>
          <p className="text-white text-2xl font-bold leading-snug tracking-tight">
            &ldquo;조금씩 앞으로 나아가는<br />사람이 되고 있습니다&rdquo;
          </p>
        </motion.div>

        {/* 서사 산문 */}
        <div className="space-y-3 px-1">
          <p className="text-white/40 text-sm leading-relaxed">어떤 날은 조금 더 나아갔고,</p>
          <p className="text-white/40 text-sm leading-relaxed">어떤 날은 그대로인 것 같았습니다.</p>
          <p className="text-white/55 text-sm leading-relaxed mt-2">그래도 당신은</p>
          <p className="text-white/70 text-sm leading-relaxed font-medium">다시 돌아왔습니다.</p>
        </div>
      </motion.section>

      <Divider />

      {/* ══════════════════════════════════════════════════════
          [4] 전환 — 중앙 강조 문장
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(0.9)} className="px-6 mb-10 text-center">
        <p className="text-white/20 text-xs uppercase tracking-widest mb-8">
          3장 — 변화
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="bg-white/4 border border-white/12 rounded-3xl px-6 py-8"
        >
          <div className="text-star-gold text-xl mb-5">✦</div>
          <p className="text-white text-xl font-bold leading-relaxed tracking-tight">
            {SAMPLE.pivot}
          </p>
        </motion.div>
      </motion.section>

      <Divider />

      {/* ══════════════════════════════════════════════════════
          [5] 다음 — 선택지 2개 (동일 위계)
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(1.0)} className="px-6 mb-8 text-center">
        <p className="text-white/20 text-xs uppercase tracking-widest mb-6">
          4장 — 다음
        </p>

        <p className="text-white/65 text-sm leading-relaxed mb-2">
          이 이야기는 여기서 끝나지 않습니다
        </p>
        <p className="text-white/35 text-sm leading-relaxed mb-10">
          이건 시작입니다
        </p>

        {/* 선택지 2개 — 동일 위계 */}
        <div ref={endRef} className="space-y-3">
          <button
            onClick={handleKeep}
            className="w-full py-4 rounded-2xl text-sm font-medium text-white/60 border border-white/15 hover:border-white/30 hover:text-white/80 transition-all"
          >
            여기까지의 이야기를 간직하기
          </button>
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-2xl text-sm font-medium text-white/60 border border-white/15 hover:border-white/30 hover:text-white/80 transition-all"
          >
            이 이야기를 이어가기
          </button>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════
          [6] 운영자용 테스트 안내 (사용자 비노출 톤)
          ══════════════════════════════════════════════════════ */}
      <div className="px-6 mt-16 pt-8 border-t border-white/5">
        <p className="text-white/12 text-xs text-center mb-4 uppercase tracking-widest">
          진행자 참고
        </p>
        <div className="space-y-3">
          {[
            '이거 보고 어떤 느낌이 들었나요?',
            '이걸 다시 보고 싶은 마음이 드나요?',
            '이 이야기를 이어가보고 싶은 생각이 드나요?',
          ].map((q, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-white/12 text-xs shrink-0 mt-0.5">Q{i + 1}</span>
              <p className="text-white/15 text-xs leading-relaxed">{q}</p>
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
