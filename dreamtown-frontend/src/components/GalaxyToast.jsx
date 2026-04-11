/**
 * GalaxyToast.jsx
 *
 * 은하군 기준 REDEEMED 토스트 오버레이
 * - 2.5초 후 자동 사라짐
 * - 은하별 accent 색상
 * - 파트너 검증 화면 / 모바일 티켓에서 공용 사용
 *
 * 사용법:
 *   const [toast, setToast] = useState(null);
 *   <GalaxyToast message={toast} galaxyCode="growth" onDone={() => setToast(null)} />
 */

import { useEffect, useState } from 'react';

const GALAXY_ACCENT = {
  challenge: '#FFD76A',
  growth:    '#6AE8B8',
  relation:  '#A8B8FF',
  healing:   '#FFB8C8',
  miracle:   '#C8A8FF',
};

const DURATION_MS = 2500;

export default function GalaxyToast({ message, galaxyCode, onDone }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading]   = useState(false);

  useEffect(() => {
    if (!message) return;

    setVisible(true);
    setFading(false);

    const fadeTimer = setTimeout(() => setFading(true), DURATION_MS - 400);
    const doneTimer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, DURATION_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [message]);

  if (!visible || !message) return null;

  const accent = GALAXY_ACCENT[galaxyCode] ?? '#FFD76A';

  return (
    <div style={{
      position:   'fixed',
      top:        0, left: 0, right: 0, bottom: 0,
      zIndex:     9999,
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        maxWidth:     320,
        padding:      '16px 24px',
        borderRadius: 999,
        background:   'rgba(8,18,32,0.92)',
        border:       `1px solid ${accent}40`,
        boxShadow:    `0 0 24px ${accent}20, 0 8px 32px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',

        fontSize:     15,
        fontWeight:   500,
        color:        accent,
        textAlign:    'center',
        lineHeight:   1.5,
        letterSpacing: '0.01em',

        // 페이드 인/아웃
        opacity:    fading ? 0 : 1,
        transform:  fading ? 'translateY(8px) scale(0.97)' : 'translateY(0) scale(1)',
        transition: fading
          ? 'opacity 0.4s ease, transform 0.4s ease'
          : 'opacity 0.25s ease, transform 0.25s ease',
      }}>
        {message}
      </div>
    </div>
  );
}
