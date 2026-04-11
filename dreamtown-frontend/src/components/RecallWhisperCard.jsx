/**
 * RecallWhisperCard.jsx — 과거 속삭임 재등장
 *
 * 과거에 남긴 문장이 아무 설명 없이 조용히 떠오르는 장치.
 * 버튼 없음 / 날짜 없음 / 분석 없음 / 7초 자동 소멸.
 *
 * 조건:
 *   - whisper ≥ 5
 *   - 하루 1회
 *   - 랜덤 5%
 *   - 이미 재등장한 문장 제외
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { logEvent } from '../lib/events.js';
import { newRequestId } from '../lib/requestId.js';

const WHISPER_JOURNEY_KEY = 'dreamtown_whisper_journey_id';
const AUTO_DISMISS_MS     = 7000;

export default function RecallWhisperCard() {
  const [card,    setCard]    = useState(null); // { text, meta }
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const journeyId = localStorage.getItem(WHISPER_JOURNEY_KEY);
    if (!journeyId) return;

    axios.get(`/api/dt/recall-whisper?journey_id=${journeyId}`)
      .then(({ data }) => {
        if (!data.show || !data.text) return;

        const requestId  = newRequestId();
        const sourceType = data.source_type ?? 'recall';
        const textLength = data.text_length ?? data.text.trim().length;
        const base = {
          request_id:  requestId,
          journey_id:  journeyId,
          source_type: sourceType,
          text_length: textLength,
          is_blend:    data.is_blend   ?? false,
          fallback:    data.fallback   ?? false,
        };

        // source_type에 따라 이벤트 분기
        // blend_eligible은 서버사이드에서 이미 기록됨
        if (sourceType === 'blend') {
          // blend_shown은 서버사이드에서 이미 기록됨 — 클라이언트는 rendered만
          logEvent('blend_rendered', { ...base, duration_ms: AUTO_DISMISS_MS });
        } else {
          logEvent('recall_eligible', base);
          logEvent('recall_shown',    base);
          logEvent('recall_rendered', base);
        }

        setCard({ text: data.text, meta: base });
        setVisible(true);

        timerRef.current = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
      })
      .catch(() => {});

    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <AnimatePresence>
      {visible && card && (
        <motion.div
          key="recall"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={cardStyle}
        >
          <p style={labelStyle}>그때 남긴 한 줄이, 다시 떠올랐어요</p>
          <p style={textStyle}>"{card.text}"</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── 스타일 ───────────────────────────────────────────────────────────

const cardStyle = {
  position:             'fixed',
  bottom:               '32px',
  left:                 '16px',
  right:                '16px',
  margin:               '0 auto',
  maxWidth:             '420px',
  background:           'rgba(13, 27, 42, 0.88)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid rgba(255,255,255,0.07)',
  borderRadius:         '20px',
  padding:              '26px 22px',
  zIndex:               9996,
  boxShadow:            '0 8px 40px rgba(0,0,0,0.4)',
  boxSizing:            'border-box',
  pointerEvents:        'none',
  textAlign:            'center',
};

const labelStyle = {
  color:        'rgba(255,255,255,0.28)',
  fontSize:     '11px',
  letterSpacing: '0.05em',
  marginBottom: '14px',
};

const textStyle = {
  color:      'rgba(255,255,255,0.72)',
  fontSize:   '15px',
  fontWeight: 400,
  lineHeight: 1.75,
};
