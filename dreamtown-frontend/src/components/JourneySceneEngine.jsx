/**
 * JourneySceneEngine.jsx
 *
 * DreamTown Journey Scene Engine — MVP
 * 사용자가 앱 진입 시 장면 카드를 조용히 1회 노출하는 시스템
 *
 * 원칙:
 *   - 서버 의존 없음 (localStorage만 사용)
 *   - 하루 1회, 장면 순서 고정
 *   - 입력/버튼 최소화, 강요 없음
 *   - 자동 등장 / 자동 사라짐
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logEvent } from '../lib/events.js';
import { getOrAssignVariant } from '../lib/experiment.js';

// ── 상수 ────────────────────────────────────────────────────────
const LS_KEY = 'dreamtown_scene_state';

const SCENE_ORDER = ['cablecar', 'observatory', 'cruise'];

// coupon_test_1: cablecar 감정 문장 A/B
const EXPERIMENT_ID = 'coupon_test_1';
const CABLECAR_TEXT = {
  A: '지금 이 순간,\n잠깐 쉬어도 괜찮아요',
  B: '지금 멈춘 건 포기가 아니라,\n다시 가기 위한 준비일지도 몰라요',
};

const SCENES = {
  cablecar: {
    // text는 A/B variant에 따라 런타임에 결정됨 (아래 resolveSceneText 참고)
    duration: 3000,
  },
  observatory: {
    text: '이 장면에서\n시작해도 괜찮을 것 같나요?',
    duration: 5000,
  },
  cruise: {
    text: '이 이야기를\n조금 더 이어가보고 싶어졌나요?',
    duration: 4000,
  },
};

function resolveSceneText(sceneId, variant) {
  if (sceneId === 'cablecar') return CABLECAR_TEXT[variant] ?? CABLECAR_TEXT.A;
  return SCENES[sceneId]?.text ?? '';
}

// ── 헬퍼 ────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveState(scene) {
  localStorage.setItem(
    LS_KEY,
    JSON.stringify({ lastSeenScene: scene, lastSeenDate: today() }),
  );
}

function resolveNextScene(lastSeenScene) {
  if (!lastSeenScene) return 'cablecar';
  const idx = SCENE_ORDER.indexOf(lastSeenScene);
  return idx === -1 || idx === SCENE_ORDER.length - 1
    ? null
    : SCENE_ORDER[idx + 1];
}

// ── 컴포넌트 ────────────────────────────────────────────────────
export default function JourneySceneEngine() {
  // 'idle' | 'question' | 'scene' | 'done'
  const [phase, setPhase] = useState('idle');
  const [currentScene, setCurrentScene] = useState(null);
  const timerRef  = useRef(null);
  // A/B variant — cablecar 진입 시 1회 할당, 이후 고정
  const variantRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const { lastSeenDate, lastSeenScene } = loadState();

      // 오늘 이미 노출됐으면 종료
      if (lastSeenDate === today()) return;

      // 다음에 보여줄 장면 결정
      const next = resolveNextScene(lastSeenScene ?? null);
      if (!next) return; // 모든 장면 소진

      // cablecar 장면일 때 A/B 할당
      if (next === 'cablecar') {
        variantRef.current = getOrAssignVariant(EXPERIMENT_ID);
      }

      setCurrentScene(next);
      setPhase('question');
    }, 2000);

    return () => clearTimeout(timerRef.current);
  }, []);

  function handleYes() {
    setPhase('scene');
    const variant = variantRef.current;
    // scene_view 이벤트 (experiment 정보 포함)
    logEvent('scene_view', {
      scene_id:        currentScene,
      scene_type:      '여행',
      emotion_context: null,
      ...(currentScene === 'cablecar' && variant
        ? { experiment_id: EXPERIMENT_ID, variant }
        : {}),
    });

    const { duration } = SCENES[currentScene];
    timerRef.current = setTimeout(() => {
      saveState(currentScene);
      setPhase('done');
    }, duration);
  }

  function handleNo() {
    setPhase('done');
  }

  if (phase === 'idle' || phase === 'done') return null;

  const variant   = variantRef.current;
  const sceneText = currentScene ? resolveSceneText(currentScene, variant) : '';

  return (
    <AnimatePresence>
      {phase === 'question' && (
        <motion.div
          key="question"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3 }}
          style={overlayStyle}
        >
          <p style={questionTextStyle}>
            지금 이 순간을{'\n'}조금 더 느껴보고 싶으세요?
          </p>
          <div style={btnRowStyle}>
            <button style={btnPrimaryStyle} onClick={handleYes}>
              가볍게 볼게요
            </button>
            <button style={btnGhostStyle} onClick={handleNo}>
              그냥 둘게요
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'scene' && (
        <motion.div
          key="scene"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3 }}
          style={{ ...overlayStyle, pointerEvents: 'none' }}
        >
          <p style={sceneTextStyle}>
            {sceneText.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < sceneText.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── 스타일 ───────────────────────────────────────────────────────
const overlayStyle = {
  position:             'fixed',
  bottom:               '32px',
  left:                 '16px',
  right:                '16px',
  margin:               '0 auto',
  width:                'auto',
  maxWidth:             '420px',
  background:           'rgba(13, 27, 42, 0.82)',
  backdropFilter:       'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border:               '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius:         '20px',
  padding:              '28px 24px',
  textAlign:            'center',
  zIndex:               9999,
  boxShadow:            '0 8px 32px rgba(0,0,0,0.4)',
  boxSizing:            'border-box',
};

const questionTextStyle = {
  color:        'rgba(255,255,255,0.75)',
  fontSize:     '15px',
  lineHeight:   1.7,
  whiteSpace:   'pre-line',
  marginBottom: '20px',
};

const sceneTextStyle = {
  color:      'rgba(255,255,255,0.70)',
  fontSize:   '15px',
  lineHeight: 1.8,
  whiteSpace: 'pre-line',
};

const btnRowStyle = {
  display:        'flex',
  flexDirection:  'column',
  gap:            '10px',
};

const btnPrimaryStyle = {
  padding:      '13px 0',
  borderRadius: '12px',
  border:       '1px solid rgba(255,255,255,0.18)',
  background:   'rgba(255,255,255,0.07)',
  color:        'rgba(255,255,255,0.80)',
  fontSize:     '14px',
  cursor:       'pointer',
};

const btnGhostStyle = {
  padding:      '13px 0',
  borderRadius: '12px',
  border:       'none',
  background:   'transparent',
  color:        'rgba(255,255,255,0.30)',
  fontSize:     '13px',
  cursor:       'pointer',
};
