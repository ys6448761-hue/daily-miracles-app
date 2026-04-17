/**
 * AurumOpenScene.jsx — 아우룸 열림 연출 (3초)
 *
 * 타이밍:
 *   0.0~0.4s  정지          (어두운 배경)
 *   0.4~1.2s  금빛 등장     (중심 글로우)
 *   1.2~2.2s  확장          (빛이 퍼짐)
 *   2.2~3.0s  플래시 + 전환 (화면 통과)
 *
 * 컬러: 금빛 (FFD76A / FFC300 / amber)
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const D = 3.0;
const t = (sec) => sec / D;

export default function AurumOpenScene({ onComplete, fallbackMs, onFallback }) {
  const calledRef = useRef(false);

  const done = () => {
    if (!calledRef.current) {
      calledRef.current = true;
      onComplete?.();
    }
  };

  useEffect(() => {
    // 정상 종료: 연출 끝나면 전환
    const tid = setTimeout(done, D * 1000 + 100);
    // 안전망: fallbackMs 내 onComplete 미호출 시 강제 전환 (연출 실패 대비)
    const fid = fallbackMs ? setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        (onFallback ?? onComplete)?.();
      }
    }, fallbackMs) : null;

    return () => {
      clearTimeout(tid);
      if (fid) clearTimeout(fid);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#05040a',
      zIndex: 9999,
      overflow: 'hidden',
    }}>

      {/* 1. 배경 글로우 (금빛 공간감) */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,215,106,0.45) 0%, rgba(200,150,20,0.12) 40%, transparent 65%)',
        }}
        animate={{ opacity: [0, 0, 0.1, 0.45, 0.75, 0.6, 0.1, 0] }}
        transition={{
          duration: D,
          times: [0, t(0.4), t(0.8), t(1.4), t(2.0), t(2.4), t(2.7), 1],
          ease: 'linear',
        }}
      />

      {/* 2. 외곽 글로우 (확장) */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 120, height: 120,
          marginTop: -60, marginLeft: -60,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,106,0.4) 0%, transparent 70%)',
          filter: 'blur(10px)',
        }}
        animate={{
          scale:   [0, 0, 0.1, 0.6, 2.0, 5.0, 14,  30],
          opacity: [0, 0, 0.4, 0.7, 0.9, 0.7, 0.3,  0],
        }}
        transition={{
          duration: D,
          times: [0, t(0.4), t(1.0), t(1.6), t(2.1), t(2.4), t(2.7), 1],
          ease: [0.2, 0.0, 0.8, 1.0],
        }}
      />

      {/* 3. 핵심 — 금빛 구슬 */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 52, height: 52,
          marginTop: -26, marginLeft: -26,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fffde0 0%, #FFD76A 30%, #d4a000 60%, transparent 80%)',
          boxShadow: [
            '0 0 16px 6px rgba(255,215,106,0.9)',
            '0 0 40px 14px rgba(255,180,0,0.5)',
            '0 0 70px 24px rgba(200,140,0,0.3)',
          ].join(', '),
        }}
        animate={{
          scale:   [0, 0, 0.02, 0.12, 0.35, 1.0, 3.5, 16],
          opacity: [0, 0, 0.6, 0.9,  1,    1,   1,   0],
        }}
        transition={{
          duration: D,
          times: [0, t(0.4), t(1.1), t(1.6), t(2.0), t(2.3), t(2.7), 1],
          ease: [0.2, 0.0, 0.9, 1.0],
        }}
      />

      {/* 4. 플래시 */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,248,220,1) 0%, rgba(255,215,106,0.5) 50%, transparent 80%)',
        }}
        animate={{ opacity: [0, 0, 0, 0.8, 0] }}
        transition={{
          duration: D,
          times: [0, t(2.3), t(2.5), t(2.65), 1],
          ease: 'linear',
        }}
      />

    </div>
  );
}
