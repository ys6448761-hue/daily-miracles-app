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
  wish:     '나는 내 삶을 스스로 결정하는 사람이 되고 싶다',
  emotion: [
    '그날은 오래 참아온 것들이 한꺼번에 쏟아진 날이었어요.',
    '그래도 뭔가를 시작해보고 싶다는 마음이 처음으로 분명하게 느껴졌습니다.',
  ],
  logs: [
    {
      day:     'Day 1',
      label:   '시작한 날',
      text:    '잘 할 수 있을지 모르겠어요. 그냥 시작했어요.',
      tone:    '조심스러움',
    },
    {
      day:     'Day 37',
      label:   '가장 흔들렸던 순간',
      text:    '오늘 처음으로 하기 싫어서 안 했는데, 그래도 내일 또 할 것 같아요.',
      tone:    '솔직함',
    },
    {
      day:     'Day 102',
      label:   '가장 달라진 생각',
      text:    '이게 내 것이 됐다는 걸 오늘 느꼈어요.',
      tone:    '확신',
    },
  ],
  moments: [
    { label: '가장 흔들렸던 순간', text: '하기 싫어서 멈췄지만, 다음날 다시 시작했다' },
    { label: '가장 용기 냈던 선택', text: '아무도 시키지 않았는데 혼자 결정했다' },
    { label: '가장 달라진 생각',   text: '잘 해야 한다는 생각이 그냥 하면 된다로 바뀌었다' },
  ],
  pivot:   '당신은 도망치지 않는 사람이 되었습니다',
};

// ── 진입/클릭 로그 (최소 3개) ────────────────────────────────
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
    // 반응 수집 — 기능 연결 없음
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
          [3] 변화 — Day 로그 + 3가지 요약 블록
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(0.7)} className="px-6 mb-10">
        <p className="text-white/20 text-xs uppercase tracking-widest text-center mb-6">
          2장 — 여정
        </p>

        {/* 서사 브릿지 문장 */}
        <div className="mb-8 px-1">
          <p className="text-white/40 text-sm leading-relaxed mb-1">어떤 날은 조금 더 나아갔고,</p>
          <p className="text-white/40 text-sm leading-relaxed">어떤 날은 그대로인 것 같았습니다.</p>
        </div>

        {/* 이야기 문장 3개 — 시스템 표현 없이 */}
        <div className="space-y-3 mb-8">
          {SAMPLE.logs.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + i * 0.12, duration: 0.6 }}
              className="bg-white/4 border border-white/8 rounded-2xl px-5 py-4"
            >
              <p className="text-white/65 text-sm leading-relaxed">
                &ldquo;{l.text}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>

        {/* 마무리 서사 */}
        <div className="px-1 mb-2">
          <p className="text-white/35 text-sm leading-relaxed mb-1">그럼에도 불구하고</p>
          <p className="text-white/60 text-sm leading-relaxed font-medium">당신은 멈추지 않았습니다.</p>
        </div>

        {/* 요약 블록 3개 */}
        <div className="space-y-3 mt-6">
          {SAMPLE.moments.map((m, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-1 h-1 rounded-full bg-white/30 mt-2 shrink-0" />
              <div>
                <p className="text-white/30 text-xs mb-0.5">{m.label}</p>
                <p className="text-white/60 text-sm leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════
          [감정 피크] 전환 문장 — 스크롤 멈춤 지점
          ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.9 }}
        className="px-6 py-20 text-center"
      >
        <p className="text-white/35 text-base leading-relaxed mb-6">
          그리고 지금,
        </p>
        <p className="text-white/55 text-lg leading-relaxed mb-6">
          당신은
        </p>
        <p className="text-white text-2xl font-bold leading-snug tracking-tight">
          &ldquo;조금씩 앞으로 나아가는<br />사람이 되고 있습니다&rdquo;
        </p>
      </motion.div>

      <Divider />

      {/* ══════════════════════════════════════════════════════
          [4] 전환 — 중앙 강조 문장
          ══════════════════════════════════════════════════════ */}
      <motion.section {...fade(0.9)} className="px-6 mb-10 text-center">
        <p className="text-white/20 text-xs uppercase tracking-widest mb-8">
          3장 — 지금
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
