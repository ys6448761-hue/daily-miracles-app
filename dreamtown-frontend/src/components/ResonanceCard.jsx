/**
 * ResonanceCard.jsx — 공명 카드
 *
 * 타인의 속삭임 문장을 조용히 보여주는 패시브 카드.
 * 버튼 없음 / 좋아요 없음 / 클릭 없음.
 * 6초 후 자동 소멸.
 *
 * 조건: App 마운트 시 resonance-feed API 호출 → eligible=true 시 노출
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { logEvent } from '../lib/events.js';
import { newRequestId } from '../lib/requestId.js';

const WHISPER_JOURNEY_KEY = 'dreamtown_whisper_journey_id';
const AUTO_DISMISS_MS     = 6000;

export default function ResonanceCard() {
  const [feed,    setFeed]    = useState(null); // { aurum_message, items }
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const journeyId = localStorage.getItem(WHISPER_JOURNEY_KEY);
    if (!journeyId) return;

    axios.get(`/api/dt/resonance-feed?journey_id=${journeyId}`)
      .then(({ data }) => {
        if (!data.show || !data.items?.length) return;

        const requestId = newRequestId();
        const base = {
          request_id:  requestId,
          journey_id:  journeyId,
          source_type: 'resonance',
        };

        logEvent('resonance_eligible', base);

        setFeed({ aurum_message: data.aurum_message, items: data.items });
        setVisible(true);

        logEvent('resonance_shown', { ...base, count: data.items.length });
        data.items.forEach((item, i) =>
          logEvent('resonance_item_rendered', {
            ...base,
            position:    i,
            text_length: item.text.trim().length,
          })
        );

        timerRef.current = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
      })
      .catch(() => {}); // 공명은 실패해도 조용히

    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <AnimatePresence>
      {visible && feed && (
        <motion.div
          key="resonance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4 }}
          style={cardStyle}
        >
          <p style={labelStyle}>✨ 이런 순간을 남긴 소원이도 있어요</p>

          <div style={textsStyle}>
            {feed.items.map((item, i) => (
              <p key={i} style={textItemStyle}>"{item.text}"</p>
            ))}
          </div>

          <p style={footerStyle}>{feed.aurum_message}</p>
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
  background:           'rgba(13, 27, 42, 0.90)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid rgba(255,255,255,0.08)',
  borderRadius:         '20px',
  padding:              '24px 22px',
  zIndex:               9998,
  boxShadow:            '0 8px 40px rgba(0,0,0,0.45)',
  boxSizing:            'border-box',
  pointerEvents:        'none', // 완전 패시브 — 클릭/탭 무반응
};

const labelStyle = {
  color:        'rgba(255,255,255,0.32)',
  fontSize:     '11px',
  letterSpacing: '0.05em',
  marginBottom: '14px',
  textAlign:    'center',
};

const textsStyle = {
  display:       'flex',
  flexDirection: 'column',
  gap:           '10px',
  marginBottom:  '16px',
};

const textItemStyle = {
  color:       'rgba(255,255,255,0.72)',
  fontSize:    '14px',
  lineHeight:  1.7,
  fontWeight:  400,
  textAlign:   'left',
};

const footerStyle = {
  color:     'rgba(255,255,255,0.22)',
  fontSize:  '11px',
  textAlign: 'center',
};
