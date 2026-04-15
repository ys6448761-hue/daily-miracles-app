/**
 * StarAwakeningScene.jsx — 별 각성 시그니처 연출 (5초)
 *
 * 타이밍:
 *   0.0~0.5s  정지          (어두운 우주)
 *   0.5~1.5s  빛 등장       (중심부 글로우)
 *   1.5~2.5s  별 탄생       (작은 점 출현)
 *   2.5~4.0s  확대 + 접근   (나에게 다가옴 — 핵심)
 *   4.0~5.0s  플래시 + 전환 (화면 통과 → 내 별)
 *
 * 원칙: 과한 효과 금지 / 감정 중심 / 조용하게
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const D = 5.0; // total duration (seconds)

// ── 타임 오프셋 헬퍼 ─────────────────────────────────────────────
// t(초) → times 배열 값 (0~1)
const t = (sec) => sec / D;

export default function StarAwakeningScene({ starName, onComplete }) {
  const calledRef = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onComplete?.();
      }
    }, D * 1000 + 120); // 5초 + 버퍼

    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000005',
      zIndex: 9999,
      overflow: 'hidden',
    }}>

      {/* ── 1. 배경 글로우 (보라빛 공간감) ───────────────────────── */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(155,135,245,0.5) 0%, rgba(100,80,200,0.15) 40%, transparent 65%)',
        }}
        animate={{
          opacity: [0, 0, 0.08, 0.32, 0.60, 0.55, 0.22, 0],
        }}
        transition={{
          duration: D,
          times: [0, t(0.5), t(1.0), t(2.2), t(3.2), t(3.8), t(4.4), 1],
          ease: 'linear',
        }}
      />

      {/* ── 2. 외곽 글로우 레이어 (별보다 크게, 약하게) ─────────────── */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 120,
          height: 120,
          marginTop: -60,
          marginLeft: -60,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155,135,245,0.35) 0%, transparent 70%)',
          filter: 'blur(12px)',
        }}
        animate={{
          scale:   [0, 0, 0.1, 0.5, 1.6, 4.0, 12, 30],
          opacity: [0, 0, 0.3, 0.6, 0.8, 0.7, 0.4,  0],
        }}
        transition={{
          duration: D,
          times: [0, t(0.5), t(1.2), t(2.0), t(2.8), t(3.5), t(4.2), 1],
          ease: [0.2, 0.0, 0.8, 1.0],
        }}
      />

      {/* ── 3. 별 본체 (핵심: 점 → 나에게 다가옴) ────────────────── */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 56,
          height: 56,
          marginTop: -28,
          marginLeft: -28,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff 0%, #e8e0ff 25%, #9B87F5 55%, transparent 80%)',
          boxShadow: [
            '0 0 12px 4px rgba(155,135,245,0.9)',
            '0 0 30px 10px rgba(155,135,245,0.5)',
            '0 0 60px 20px rgba(100,80,200,0.3)',
          ].join(', '),
        }}
        animate={{
          scale:   [0, 0, 0.02, 0.10, 0.28, 0.80, 3.0, 14],
          opacity: [0, 0, 0.5,  0.85,  1,    1,    1,   0],
        }}
        transition={{
          duration: D,
          times: [0, t(0.5), t(1.3), t(2.0), t(2.6), t(3.2), t(4.0), 1],
          ease: [0.2, 0.0, 0.9, 1.0],
        }}
      />

      {/* ── 4. 별 이름 (중간에 잠깐 등장) ──────────────────────────── */}
      {starName && (
        <motion.div
          style={{
            position: 'absolute',
            bottom: '26%',
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'rgba(230,220,255,0.85)',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '0.15em',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
          animate={{
            opacity: [0, 0, 0,   0.5, 0.85, 0.9, 0],
          }}
          transition={{
            duration: D,
            times: [0, t(1.5), t(2.0), t(2.5), t(3.0), t(3.6), t(4.3)],
            ease: 'linear',
          }}
        >
          {starName}
        </motion.div>
      )}

      {/* ── 5. 플래시 (별이 화면을 통과하는 순간) ───────────────────── */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(240,235,255,1) 0%, rgba(155,135,245,0.6) 50%, transparent 80%)',
        }}
        animate={{
          opacity: [0, 0, 0, 0.75, 0],
        }}
        transition={{
          duration: D,
          times: [0, t(3.6), t(3.9), t(4.15), 1],
          ease: 'linear',
        }}
      />

    </div>
  );
}
