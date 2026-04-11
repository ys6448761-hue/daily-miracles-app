/**
 * JourneySceneEngine.jsx
 *
 * DreamTown Journey Scene Engine — Scene→Action MVP
 *
 * 흐름:
 *   idle → question → scene(5단) → coupon → done
 *
 * 5단 구조 (SSOT: Scene→Action SSOT v1):
 *   1. 감정 리마인드
 *   2. 장면 몰입
 *   3. 공명 문장 (🔥 감정 peak / A/B 실험)
 *   4. 선택 1개
 *   5. 쿠폰 행동 연결
 *
 * 원칙:
 *   - 선택은 항상 1개
 *   - 서버 의존 없음
 *   - 하루 1회
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logEvent } from '../lib/events.js';
import { getOrAssignVariant } from '../lib/experiment.js';
import StarWhisperInput from './StarWhisperInput.jsx';

// ── 상수 ────────────────────────────────────────────────────────────
const LS_KEY        = 'dreamtown_scene_state';
const LS_WHISPER    = 'dreamtown_whisper_shown'; // 별들의 속삭임 최초 1회 노출 추적
const SCENE_ORDER   = ['cablecar', 'observatory', 'cruise'];
const EXPERIMENT_ID = 'coupon_test_1';

// ── whisper journeyId: 디바이스 영속 UUID (공명 eligibility 크로스-세션 체크 필요)
const WHISPER_JOURNEY_KEY = 'dreamtown_whisper_journey_id';

function getOrCreateWhisperJourneyId() {
  let id = localStorage.getItem(WHISPER_JOURNEY_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(WHISPER_JOURNEY_KEY, id);
  }
  return id;
}

function hasWhisperShown() {
  return localStorage.getItem(LS_WHISPER) === '1';
}

function markWhisperShown() {
  localStorage.setItem(LS_WHISPER, '1');
}

// ── 장면 정의 ────────────────────────────────────────────────────────
const SCENES = {
  cablecar: {
    atmosphere:  '바람이 조용히 스치는 순간',
    resonance: {
      A: '지금 이 순간,\n잠깐 쉬어도 괜찮아요',
      B: '지금 멈춘 건 포기가 아니라,\n다시 가기 위한 준비일지도 몰라요',
    },
    choice:   '조금 더 이 순간에 있어볼래요',
    coupon: {
      // Travel UX SSOT 3단 구조
      emotion: '조금 가벼워진 이 마음,\n그대로 바람 속에 두고 와도 괜찮아요',
      experience: '케이블카에서 천천히 내려다보는 시간',
      ctaLabel: '이 순간 이어가기',
    },
    duration: null, // 버튼 선택형 — 자동 소멸 없음
  },
  observatory: {
    atmosphere: '멀리서 보이는 것들이 선명해지는 순간',
    resonance:  { A: '이 장면에서\n시작해도 괜찮을 것 같나요?', B: null },
    choice:     null, // 선택 버튼 없음 (자동 소멸)
    coupon:     null,
    duration:   5000,
  },
  cruise: {
    atmosphere: '파도 소리가 조용히 따라오는 순간',
    resonance:  { A: '이 이야기를\n조금 더 이어가보고 싶어졌나요?', B: null },
    choice:     null,
    coupon:     null,
    duration:   4000,
  },
};

// ── 헬퍼 ────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }

function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? {}; }
  catch { return {}; }
}

function saveState(scene) {
  localStorage.setItem(LS_KEY, JSON.stringify({ lastSeenScene: scene, lastSeenDate: today() }));
}

function resolveNextScene(last) {
  if (!last) return 'cablecar';
  const idx = SCENE_ORDER.indexOf(last);
  return idx === -1 || idx === SCENE_ORDER.length - 1 ? null : SCENE_ORDER[idx + 1];
}

function nl2br(text) {
  if (!text) return null;
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
  ));
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────
export default function JourneySceneEngine() {
  // 'idle' | 'question' | 'scene' | 'coupon' | 'whisper' | 'done'
  const [phase, setPhase]               = useState('idle');
  const [currentScene, setCurrentScene] = useState(null);
  const [showWhisper, setShowWhisper]   = useState(false);
  const timerRef    = useRef(null);
  const variantRef  = useRef(null); // A/B variant
  const journeyIdRef = useRef(null);

  // ── 진입 타이머 ───────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const { lastSeenDate, lastSeenScene } = loadState();
      if (lastSeenDate === today()) return;

      const next = resolveNextScene(lastSeenScene ?? null);
      if (!next) return;

      if (next === 'cablecar') {
        variantRef.current = getOrAssignVariant(EXPERIMENT_ID);
      }

      setCurrentScene(next);
      setPhase('question');
    }, 2000);

    return () => clearTimeout(timerRef.current);
  }, []);

  // ── 이벤트 핸들러 ─────────────────────────────────────────────
  function handleYes() {
    const variant = variantRef.current;
    logEvent('scene_view', {
      scene_id:        currentScene,
      scene_type:      '여행',
      emotion_context: null,
      ...(currentScene === 'cablecar' && variant
        ? { experiment_id: EXPERIMENT_ID, variant }
        : {}),
    });

    setPhase('scene');

    // 자동 소멸 장면 (choice 없음)
    const scene = SCENES[currentScene];
    if (scene.duration) {
      timerRef.current = setTimeout(() => {
        saveState(currentScene);
        goToWhisperOrDone();
      }, scene.duration);
    }
  }

  function handleNo() { setPhase('done'); }

  function handleChoice() {
    const variant = variantRef.current;
    const expParams = variant ? { experiment_id: EXPERIMENT_ID, variant } : {};

    // 선택 클릭 — scene_action_click
    logEvent('scene_action_click', {
      scene_id:  currentScene,
      scene_type: '여행',
      ...expParams,
    });

    // 상품 노출 — travel_offer_view (감정 peak 이후 등장)
    logEvent('travel_offer_view', {
      offer_id:  'cpn_cablecar_001',
      scene_id:  currentScene,
      ...expParams,
    });

    setPhase('coupon');
  }

  function goToWhisperOrDone() {
    if (!hasWhisperShown()) {
      journeyIdRef.current = getOrCreateWhisperJourneyId();
      markWhisperShown();
      setShowWhisper(true);
    } else {
      setPhase('done');
    }
  }

  function handleCouponCta() {
    const variant = variantRef.current;
    logEvent('conversion_action', {
      action_type: 'book',
      value:       null,
      ...(variant ? { experiment_id: EXPERIMENT_ID, variant } : {}),
    });
    saveState(currentScene);
    goToWhisperOrDone();
  }

  function handleCouponClose() {
    saveState(currentScene);
    goToWhisperOrDone();
  }

  // ── 별들의 속삭임 오버레이 (showWhisper) ─────────────────────
  if (showWhisper) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="whisper"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          style={overlayStyle}
        >
          <StarWhisperInput
            journeyId={journeyIdRef.current}
            onClose={() => { setShowWhisper(false); setPhase('done'); }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── 렌더 가드 ────────────────────────────────────────────────
  if (phase === 'idle' || phase === 'done' || !currentScene) return null;

  const scene   = SCENES[currentScene];
  const variant = variantRef.current;
  const resonanceText = scene.resonance?.[variant] ?? scene.resonance?.A ?? '';

  return (
    <AnimatePresence mode="wait">

      {/* ── 진입 질문 ─────────────────────────────── */}
      {phase === 'question' && (
        <motion.div
          key="question"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          style={overlayStyle}
        >
          <p style={labelStyle}>잠깐, 그 느낌 기억나시나요?</p>
          <p style={questionTextStyle}>
            지금 이 순간을{'\n'}조금 더 느껴보고 싶으세요?
          </p>
          <div style={btnColStyle}>
            <button style={btnPrimaryStyle} onClick={handleYes}>가볍게 볼게요</button>
            <button style={btnGhostStyle}   onClick={handleNo}>그냥 둘게요</button>
          </div>
        </motion.div>
      )}

      {/* ── 장면 카드 (5단) ───────────────────────── */}
      {phase === 'scene' && (
        <motion.div
          key="scene"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35 }}
          style={overlayStyle}
        >
          {/* 1 감정 리마인드 */}
          <p style={labelStyle}>아까 이런 느낌이었죠</p>

          {/* 2 장면 */}
          <p style={atmosphereStyle}>{scene.atmosphere}</p>

          {/* 3 공명 */}
          <p style={resonanceStyle}>{nl2br(resonanceText)}</p>

          {/* 4 선택 (cablecar만) */}
          {scene.choice && (
            <button style={choiceBtnStyle} onClick={handleChoice}>
              {scene.choice}
            </button>
          )}
        </motion.div>
      )}

      {/* ── 쿠폰 카드 ─────────────────────────────── */}
      {phase === 'coupon' && scene.coupon && (
        <motion.div
          key="coupon"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35 }}
          style={overlayStyle}
        >
          {/* 1단: 감정 연결 문장 */}
          <p style={offerEmotionStyle}>{nl2br(scene.coupon.emotion)}</p>

          {/* 2단: 경험 설명 */}
          <p style={offerExperienceStyle}>{scene.coupon.experience}</p>

          {/* 3단: 행동 버튼 1개 */}
          <div style={{ ...btnColStyle, marginTop: 22 }}>
            <button style={btnPrimaryStyle} onClick={handleCouponCta}>
              {scene.coupon.ctaLabel}
            </button>
            <button style={btnGhostStyle} onClick={handleCouponClose}>
              나중에 볼게요
            </button>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}

// ── 스타일 ───────────────────────────────────────────────────────────
const overlayStyle = {
  position:             'fixed',
  bottom:               '32px',
  left:                 '16px',
  right:                '16px',
  margin:               '0 auto',
  width:                'auto',
  maxWidth:             '420px',
  background:           'rgba(13, 27, 42, 0.88)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius:         '20px',
  padding:              '28px 24px',
  textAlign:            'center',
  zIndex:               9999,
  boxShadow:            '0 8px 40px rgba(0,0,0,0.5)',
  boxSizing:            'border-box',
};

const labelStyle = {
  fontSize:     '11px',
  color:        'rgba(255,255,255,0.28)',
  letterSpacing: '0.06em',
  marginBottom: '10px',
};

const questionTextStyle = {
  color:        'rgba(255,255,255,0.78)',
  fontSize:     '16px',
  lineHeight:   1.7,
  whiteSpace:   'pre-line',
  marginBottom: '22px',
  fontWeight:   500,
};

const atmosphereStyle = {
  color:        'rgba(255,255,255,0.42)',
  fontSize:     '13px',
  lineHeight:   1.7,
  marginBottom: '14px',
};

const resonanceStyle = {
  color:        'rgba(255,255,255,0.82)',
  fontSize:     '16px',
  lineHeight:   1.85,
  whiteSpace:   'pre-line',
  fontWeight:   500,
  marginBottom: '22px',
};

// Travel UX SSOT — 3단 상품 카드
const offerEmotionStyle = {
  color:        'rgba(255,255,255,0.80)',
  fontSize:     '15px',
  fontWeight:   500,
  lineHeight:   1.85,
  whiteSpace:   'pre-line',
  marginBottom: '14px',
};

const offerExperienceStyle = {
  color:        'rgba(255,255,255,0.38)',
  fontSize:     '13px',
  lineHeight:   1.6,
  marginBottom: '2px',
};

const btnColStyle = {
  display:       'flex',
  flexDirection: 'column',
  gap:           '10px',
};

const choiceBtnStyle = {
  width:        '100%',
  padding:      '14px 0',
  borderRadius: '12px',
  border:       '1px solid rgba(255,255,255,0.22)',
  background:   'rgba(255,255,255,0.08)',
  color:        'rgba(255,255,255,0.85)',
  fontSize:     '14px',
  fontWeight:   500,
  cursor:       'pointer',
  marginBottom: '0',
};

const btnPrimaryStyle = {
  padding:      '14px 0',
  borderRadius: '12px',
  border:       '1px solid rgba(255,255,255,0.20)',
  background:   'rgba(255,255,255,0.08)',
  color:        'rgba(255,255,255,0.85)',
  fontSize:     '14px',
  fontWeight:   500,
  cursor:       'pointer',
};

const btnGhostStyle = {
  padding:      '12px 0',
  borderRadius: '12px',
  border:       'none',
  background:   'transparent',
  color:        'rgba(255,255,255,0.28)',
  fontSize:     '13px',
  cursor:       'pointer',
};
