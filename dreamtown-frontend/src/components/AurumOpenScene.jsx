/**
 * AurumOpenScene.jsx — DreamTown 입장 연출 (5초)
 *
 * 자산: /videos/intro-yeosu-entry-v1.mp4 (공식 승인, 1.5MB, 실측 4.90s)
 * 타이밍: 0.0~5.0s 비디오 전체 재생 → 감정 질문 전환
 *   (3초 컷 시 영상 후반 1.9s가 잘려 아우룸이 "왔다가 사라짐" 체감 → 5초 노출로 해소)
 * 모바일: autoplay + muted + playsInline (iOS 자동재생 정책 충족)
 * loop 미설정 — 영상 끝나면 마지막 프레임 유지 (paused), 5s 후 onComplete
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const D = 5.0;
const t = (sec) => sec / D;
const INTRO_VIDEO = '/videos/intro-yeosu-entry-v1.mp4';

export default function AurumOpenScene({ onComplete, fallbackMs, onFallback }) {
  // eslint-disable-next-line no-unused-vars
  const _unused = { fallbackMs, onFallback }; // 호환 — 더 이상 사용 안 함 (조기 종료 차단)
  const calledRef = useRef(false);
  const videoRef  = useRef(null);

  useEffect(() => {
    // minDuration guard — 무조건 5000ms 이후에만 onComplete (영상 4.90s 전체 노출)
    // video onEnded / onError / framer-motion onAnimationComplete 등 조기 종료 경로 차단
    const timer = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onComplete?.();
      }
    }, 5000);

    // iOS Safari 자동재생 보강 — play() 명시 호출 (실패해도 timer 영향 없음)
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#05040a',
      zIndex: 9999,
      overflow: 'hidden',
    }}>

      {/* 0. 공식 입장 영상 (intro-yeosu-entry-v1) — 주인공, zIndex 2로 빛 위 노출 */}
      <video
        ref={videoRef}
        src={INTRO_VIDEO}
        autoPlay
        muted
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          inset: 0,
          width:  '100%',
          height: '100%',
          objectFit: 'cover',
          background: '#05040a',
          zIndex: 2,
        }}
      />

      {/* 1. 배경 글로우 — 영상 뒤 subtle 분위기 (zIndex 1) */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,215,106,0.18) 0%, rgba(200,150,20,0.06) 40%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
        animate={{ opacity: [0, 0, 0.1, 0.30, 0.45, 0.35, 0.1, 0] }}
        transition={{
          duration: D,
          times: [0, t(0.4), t(0.8), t(1.4), t(2.0), t(2.4), t(2.7), 1],
          ease: 'linear',
        }}
      />

      {/* 2~4 빛 layer 제거 — 영상이 주인공, 빛은 #1 배경 분위기만 유지
           기존 외곽 글로우/핵심 구슬/플래시는 영상 가림 원인이라 미사용 */}

    </div>
  );
}
