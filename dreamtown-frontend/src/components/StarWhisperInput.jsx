/**
 * StarWhisperInput.jsx — 별들의 속삭임
 *
 * 스쳐가는 생각을 가볍게 남기는 입력창.
 * 기록 기능이 아니라, 스쳐가는 생각을 잡는 장치.
 *
 * UX 원칙:
 *  - 짧게, 가볍게, 스쳐가듯
 *  - 저장 후 아무 일 없었던 것처럼 닫기
 *  - "기록하세요" "성장하세요" 금지
 */

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { logEvent } from '../lib/events.js';

const CONTEXT_TAGS = [
  ['morning_commute', '출근길'],
  ['before_sleep',    '잠들기 전'],
  ['moving',          '이동 중'],
  ['alone',           '혼자 있을 때'],
];

export default function StarWhisperInput({ journeyId, onClose }) {
  const [text,    setText]    = useState('');
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  // 마운트 시: 자동 포커스 + whisper_shown 이벤트 (작성률 분모)
  useEffect(() => {
    textareaRef.current?.focus();
    logEvent('whisper_shown', { journey_id: journeyId });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await axios.post('/api/dt/journey-logs', {
        journey_id:  journeyId,
        growth_text: text,
        context_tag: context,
      });
      logEvent('whisper_created', { journey_id: journeyId, context_tag: context || null });
    } catch (e) {
      console.error('[StarWhisper] 저장 실패:', e);
    } finally {
      setLoading(false);
      onClose?.();
    }
  }

  return (
    <div style={boxStyle}>
      <p style={titleStyle}>방금 스친 생각이 있나요?</p>
      <p style={subStyle}>아주 짧아도 괜찮아요</p>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="한 줄로 남겨보세요"
        style={textareaStyle}
        rows={2}
      />

      <div style={tagRowStyle}>
        {CONTEXT_TAGS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setContext(context === key ? null : key)}
            style={context === key ? tagActiveStyle : tagStyle}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={actionRowStyle}>
        <button onClick={submit} disabled={loading || !text.trim()} style={submitBtnStyle}>
          남기기
        </button>
        <button onClick={onClose} style={skipBtnStyle}>
          지금은 넘어가기
        </button>
      </div>
    </div>
  );
}

// ── 스타일 ───────────────────────────────────────────────────────────

const boxStyle = {
  marginTop:    '16px',
  borderTop:    '1px solid rgba(255,255,255,0.08)',
  paddingTop:   '18px',
};

const titleStyle = {
  color:        'rgba(255,255,255,0.72)',
  fontSize:     '14px',
  fontWeight:   500,
  marginBottom: '4px',
  textAlign:    'left',
};

const subStyle = {
  color:        'rgba(255,255,255,0.32)',
  fontSize:     '12px',
  marginBottom: '12px',
  textAlign:    'left',
};

const textareaStyle = {
  width:        '100%',
  background:   'rgba(255,255,255,0.06)',
  border:       '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  padding:      '10px 12px',
  color:        'rgba(255,255,255,0.80)',
  fontSize:     '14px',
  lineHeight:   1.6,
  resize:       'none',
  outline:      'none',
  boxSizing:    'border-box',
  fontFamily:   'inherit',
};

const tagRowStyle = {
  display:    'flex',
  flexWrap:   'wrap',
  gap:        '6px',
  marginTop:  '10px',
};

const tagStyle = {
  padding:      '5px 10px',
  borderRadius: '20px',
  border:       '1px solid rgba(255,255,255,0.14)',
  background:   'transparent',
  color:        'rgba(255,255,255,0.38)',
  fontSize:     '11px',
  cursor:       'pointer',
};

const tagActiveStyle = {
  ...tagStyle,
  border:     '1px solid rgba(155,135,245,0.5)',
  background: 'rgba(155,135,245,0.12)',
  color:      'rgba(155,135,245,0.90)',
};

const actionRowStyle = {
  display:        'flex',
  flexDirection:  'column',
  gap:            '8px',
  marginTop:      '14px',
};

const submitBtnStyle = {
  padding:      '11px 0',
  borderRadius: '10px',
  border:       '1px solid rgba(255,255,255,0.18)',
  background:   'rgba(255,255,255,0.07)',
  color:        'rgba(255,255,255,0.80)',
  fontSize:     '13px',
  fontWeight:   500,
  cursor:       'pointer',
};

const skipBtnStyle = {
  padding:    '8px 0',
  border:     'none',
  background: 'transparent',
  color:      'rgba(255,255,255,0.24)',
  fontSize:   '12px',
  cursor:     'pointer',
};
