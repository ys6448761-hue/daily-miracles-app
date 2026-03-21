/**
 * FeedbackFlow — 공명 직후 경량 피드백 수집
 *
 * UX 원칙:
 * - 행동(공명) 이후만 노출
 * - 3초 안에 끝나야 함 → 4개 선택지 + 선택 즉시 제출
 * - 선택형 중심, comment는 1줄 선택 입력
 * - "설문"처럼 보이지 않게 → 작은 카드, 자연스러운 후속
 *
 * Props:
 *   starId       string  — 대상 별 ID
 *   onComplete   fn      — 완료/건너뛰기 콜백
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postFeedback, getOrCreateUserId } from '../api/dreamtown.js';

const FEELING_OPTIONS = [
  { type: '가볍게', desc: '살짝 스쳤어요' },
  { type: '깊이',   desc: '오래 머물렀어요' },
  { type: '공감',   desc: '나도 그랬어요' },
  { type: '위로',   desc: '힘이 됐어요' },
];

const REASON_OPTIONS = [
  '비슷한 마음이라서',
  '위로가 됐어서',
  '나도 겪었던 일이라',
  '용기를 얻었어서',
];

export default function FeedbackFlow({ starId, onComplete }) {
  const [step, setStep]           = useState('feeling'); // feeling | reason | done
  const [feeling, setFeeling]     = useState(null);
  const [reason, setReason]       = useState(null);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(selectedReason = reason) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await postFeedback({
        userId:      getOrCreateUserId(),
        starId,
        feelingType: feeling,
        reason:      selectedReason ?? null,
        comment:     comment.trim() || null,
      });
    } catch (_) {
      // 피드백 실패는 사용자에게 노출 안 함
    } finally {
      setStep('done');
      setTimeout(onComplete, 800);
    }
  }

  function handleFeelingSelect(type) {
    setFeeling(type);
    setStep('reason');
  }

  function handleReasonSelect(r) {
    setReason(r);
    submit(r);
  }

  return (
    <AnimatePresence>
      {step !== 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-3 bg-white/3 border border-white/8 rounded-2xl p-4"
        >
          {step === 'feeling' && (
            <>
              <p className="text-white/40 text-xs mb-3 text-center">
                이 공명이 어떻게 닿았나요?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FEELING_OPTIONS.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => handleFeelingSelect(opt.type)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-xl py-3 px-2 text-center transition-colors"
                  >
                    <p className="text-white/80 text-sm font-medium">{opt.type}</p>
                    <p className="text-white/35 text-[11px]">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={onComplete}
                className="w-full text-white/20 text-xs mt-3 py-1 hover:text-white/40 transition-colors"
              >
                건너뛰기
              </button>
            </>
          )}

          {step === 'reason' && (
            <>
              <p className="text-white/40 text-xs mb-3 text-center">
                어떤 이유로 닿았나요? <span className="text-white/20">(선택)</span>
              </p>
              <div className="flex flex-col gap-1.5 mb-3">
                {REASON_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => handleReasonSelect(r)}
                    disabled={submitting}
                    className="text-left bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl px-3 py-2.5 text-white/70 text-sm hover:text-white/90 transition-colors disabled:opacity-50"
                  >
                    {r}
                  </button>
                ))}
              </div>
              {/* 한 줄 코멘트 (선택) */}
              <input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="한 줄 더 (선택)"
                maxLength={100}
                className="w-full bg-transparent text-white/60 text-sm placeholder-white/20 outline-none border-b border-white/10 pb-1 mb-3"
              />
              <button
                onClick={() => submit(null)}
                disabled={submitting}
                className="w-full text-white/30 text-xs py-1 hover:text-white/50 transition-colors disabled:opacity-30"
              >
                {submitting ? '저장 중...' : '건너뛰기'}
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
