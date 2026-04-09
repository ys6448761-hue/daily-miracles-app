/**
 * WishCheckin.jsx — 소원 전 상태 체크인
 *
 * Props:
 *   userId     — 유저 ID (로그용, 없어도 동작)
 *   onDone     — 체크인 완료/스킵 후 콜백 () => void
 *
 * 흐름:
 *   상태 선택 → 0.3s 딜레이 → 공감 + 행동 버튼 → 완료 메시지 → onDone()
 *
 * UX 원칙:
 *   - 스킵 가능 (건너뛰기)
 *   - 설명/분석 없음
 *   - "툭 던지고 끝"
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postCheckinState } from '../api/dreamtown.js';

// 상태 4개 (하드코딩 — 서버와 동기화)
const STATES = [
  { key: 'breathless',   label: '숨이 좀 막혀요' },
  { key: 'overthinking', label: '생각이 많아요' },
  { key: 'want_rest',    label: '그냥 쉬고 싶어요' },
  { key: 'want_more',    label: '괜찮은데 더 잘해보고 싶어요' },
];

// 단계: idle → responding → done
export default function WishCheckin({ userId, onDone }) {
  const [phase,      setPhase]      = useState('idle');       // idle | responding | done
  const [response,   setResponse]   = useState(null);         // API 응답
  const [selected,   setSelected]   = useState(null);         // 선택된 state_key

  // 상태 선택
  async function handleSelect(stateKey) {
    setSelected(stateKey);
    setPhase('responding');

    // 0.3s 딜레이 — "생각해서 답해주는 느낌"
    await new Promise(r => setTimeout(r, 300));

    try {
      const data = await postCheckinState({ userId, stateKey, actionClicked: false });
      setResponse(data);
    } catch {
      // 실패해도 흐름 유지
      setResponse({ message: '지금은 이 정도면 충분해요', action: '계속해볼까요?', completion_message: '좋아요' });
    }
  }

  // 행동 버튼 클릭
  async function handleAction() {
    if (selected) {
      postCheckinState({ userId, stateKey: selected, actionClicked: true }).catch(() => {});
    }
    setPhase('done');
    // 1.5초 후 onDone
    setTimeout(onDone, 1500);
  }

  // 스킵
  function handleSkip() {
    onDone();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[260px] px-6 py-8 select-none">
      <AnimatePresence mode="wait">

        {/* ── 상태 선택 화면 ─────────────────────────── */}
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-xs"
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-white/50">지금 어떤가요?</p>
              <button
                onClick={handleSkip}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                건너뛰기
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {STATES.map(s => (
                <button
                  key={s.key}
                  onClick={() => handleSelect(s.key)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── 응답 화면 ───────────────────────────────── */}
        {phase === 'responding' && response && (
          <motion.div
            key="responding"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-xs flex flex-col gap-5"
          >
            <p className="text-base text-white/90 leading-relaxed text-center">
              {response.message}
            </p>

            <button
              onClick={handleAction}
              className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
            >
              {response.action}
            </button>

            <button
              onClick={handleSkip}
              className="text-xs text-white/30 hover:text-white/50 transition-colors text-center"
            >
              건너뛰기
            </button>
          </motion.div>
        )}

        {/* ── 로딩 (딜레이 중) ────────────────────────── */}
        {phase === 'responding' && !response && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-white/30 text-sm"
          >
            …
          </motion.div>
        )}

        {/* ── 완료 화면 ───────────────────────────────── */}
        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-white/70 text-sm text-center"
          >
            {response?.completion_message ?? '좋아요, 충분해요'}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
