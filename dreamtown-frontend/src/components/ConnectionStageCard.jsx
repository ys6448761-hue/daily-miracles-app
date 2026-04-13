/**
 * ConnectionStageCard.jsx — 연결 단계
 *
 * "이미 존재하던 것을 한 번 보여주는 것"
 * 생애 단 1회. 버튼 없음. 자동 소멸 (8초).
 *
 * 조건:
 *   - whisper ≥ 5, 공명 경험 ≥ 1
 *   - 20% 랜덤, 생애 1회 (서버 + localStorage 이중 방어)
 *   - signal 기반 유사도 top-3 중 랜덤 매칭
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { logEvent } from '../lib/events.js';
import { newRequestId } from '../lib/requestId.js';

const WHISPER_JOURNEY_KEY = 'dreamtown_whisper_journey_id';
const LS_CONNECTION_SHOWN = 'dreamtown_connection_shown';
const AUTO_DISMISS_MS     = 8000;

export default function ConnectionStageCard() {
  const [card,    setCard]    = useState(null);
  const [visible, setVisible] = useState(false);
  const timerRef  = useRef(null);

  useEffect(() => {
    if (localStorage.getItem(LS_CONNECTION_SHOWN) === '1') return;

    const journeyId = localStorage.getItem(WHISPER_JOURNEY_KEY);
    if (!journeyId) return;

    const requestId = newRequestId();
    const base = { request_id: requestId, journey_id: journeyId, source_type: 'connection' };

    logEvent('connection_eligible', { ...base, has_resonance: true });

    axios.get(`/api/dt/connection-stage?journey_id=${journeyId}`)
      .then(({ data }) => {
        if (!data.show) return;

        localStorage.setItem(LS_CONNECTION_SHOWN, '1');

        setCard({ title: data.title, text: data.text, aurum_message: data.aurum_message });
        setVisible(true);

        logEvent('connection_shown',    { ...base, text_length: data.text?.length ?? 0 });
        logEvent('connection_selected', { ...base });
        logEvent('connection_completed', { journey_id: journeyId, connection_once: true });

        timerRef.current = setTimeout(() => {
          setVisible(false);
        }, AUTO_DISMISS_MS);
      })
      .catch(() => {});

    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <AnimatePresence>
      {visible && card && (
        <motion.div
          key="connection"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={cardStyle}
        >
          <p style={titleStyle}>{card.title}</p>
          <p style={textStyle}>"{card.text}"</p>
          <p style={aurumStyle}>{card.aurum_message}</p>
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
  background:           'rgba(8, 18, 32, 0.94)',
  backdropFilter:       'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border:               '1px solid rgba(155,135,245,0.18)',
  borderRadius:         '20px',
  padding:              '30px 24px',
  zIndex:               9997,
  boxShadow:            '0 8px 60px rgba(155,135,245,0.12)',
  boxSizing:            'border-box',
  pointerEvents:        'none',
  textAlign:            'center',
};

const titleStyle = {
  color:         'rgba(255,255,255,0.28)',
  fontSize:      '12px',
  letterSpacing: '0.04em',
  marginBottom:  '18px',
};

const textStyle = {
  color:        'rgba(255,255,255,0.82)',
  fontSize:     '16px',
  fontWeight:   400,
  lineHeight:   1.85,
  marginBottom: '20px',
};

const aurumStyle = {
  color:      'rgba(155,135,245,0.50)',
  fontSize:   '11px',
  lineHeight: 1.6,
};
