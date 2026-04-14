/**
 * CablecarPage.jsx — 케이블카 캐빈 QR 전용 진입 엔진
 * 경로: /cablecar
 *
 * 처음 사용자 → 소원 입력 → 별 생성 + 즉시 각성 → /my-star/:id
 * 기존 사용자 → 자동 각성/재각성 → /my-star/:id
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrCreateUserId } from '../api/dreamtown.js';
import { readSavedStar, saveStarId } from '../lib/utils/starSession.js';

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0D1B2A 0%, #0A2240 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 24px',
    fontFamily: "'Noto Sans KR', sans-serif",
    color: '#E8E4F0',
  },
  card: {
    background: 'rgba(155, 135, 245, 0.07)',
    border: '1px solid rgba(155, 135, 245, 0.2)',
    borderRadius: 24,
    padding: '36px 24px',
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: '#9B87F5',
    fontWeight: 700,
    letterSpacing: '0.08em',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 22,
    fontWeight: 800,
    color: '#E8E4F0',
    lineHeight: 1.4,
    marginBottom: 8,
  },
  subline: {
    fontSize: 14,
    color: '#7A6E9C',
    marginBottom: 28,
    lineHeight: 1.6,
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '15px 0',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #9B87F5, #7B67D5)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
  btnDisabled: {
    background: 'rgba(155,135,245,0.2)',
    color: '#7A6E9C',
    cursor: 'default',
  },
  textarea: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: '1px solid rgba(155,135,245,0.3)',
    background: 'rgba(255,255,255,0.04)',
    color: '#E8E4F0',
    fontSize: 14,
    lineHeight: 1.65,
    resize: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Noto Sans KR', sans-serif",
    marginBottom: 4,
  },
  error: {
    fontSize: 13,
    color: '#f87171',
    marginTop: 12,
    lineHeight: 1.5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#9B87F5',
    display: 'inline-block',
    margin: '0 4px',
  },
};

// ── 로딩 (자동 각성 처리 중) ──────────────────────────────────────
function ProcessingView({ headline }) {
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚡</div>
        <div style={{ marginBottom: 20 }}>
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              style={S.dot}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        <div style={{ fontSize: 15, color: '#C4BAE0', lineHeight: 1.7 }}>
          {headline || '별과 연결하는 중...'}
        </div>
      </motion.div>
    </div>
  );
}

// ── 완료 화면 (단순) ─────────────────────────────────────────────
function AwakenedView({ onNext }) {
  return (
    <div style={S.page}>
      <motion.div
        style={{ ...S.card, padding: '48px 24px', textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: '#E8E4F0', marginBottom: 6 }}>
          이 순간이 기록되었습니다
        </div>
        <div style={{ fontSize: 13, color: '#7A6E9C', marginBottom: 32 }}>
          여수 케이블카에서
        </div>
        <button
          onClick={onNext}
          style={{
            ...S.btn,
            marginTop: 0,
            padding: '13px 0',
            fontSize: 14,
          }}
        >
          내 별 보기
        </button>
      </motion.div>
    </div>
  );
}

// ── 소원 입력 화면 (처음 사용자) ─────────────────────────────────
function WishInputView({ onSubmit, loading, error }) {
  const [text, setText] = useState('');

  return (
    <div style={S.page}>
      <motion.div
        style={S.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚡</div>
        <div style={S.label}>여수 케이블카 캐빈</div>
        <div style={S.headline}>
          이 순간,<br />소원을 담아 별을 탄생시키세요
        </div>
        <div style={S.subline}>
          케이블카 위에서 시작한 소원은<br />
          별이 되어 하늘에 남습니다
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(text); }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="마음속 소원을 적어주세요&#10;예: 더 용감하게 도전하고 싶어요"
            maxLength={200}
            rows={4}
            style={S.textarea}
            autoFocus
          />
          <div style={{ fontSize: 11, color: '#5a5370', textAlign: 'right', marginBottom: 12 }}>
            {text.length}/200
          </div>
          {error && <div style={S.error}>{error}</div>}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            style={{
              ...S.btn,
              ...(loading || !text.trim() ? S.btnDisabled : {}),
            }}
          >
            {loading ? '별 탄생 중...' : '별 탄생시키기 ✨'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── 에러 화면 ─────────────────────────────────────────────────────
function ErrorView({ message, onRetry }) {
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>문제가 생겼어요</div>
        <div style={{ fontSize: 14, color: '#f87171', marginBottom: 24 }}>{message}</div>
        <button style={S.btn} onClick={onRetry}>다시 시도</button>
      </motion.div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function CablecarPage() {
  const nav = useNavigate();

  const [phase, setPhase] = useState('init');
  // init | processing | input | awakened | error
  const [result, setResult] = useState(null);
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);

  const callEnter = async ({ starId, wishText }) => {
    const userId = getOrCreateUserId();
    const body = { user_id: userId, place: 'yeosu_cablecar_cabin' };
    if (starId) body.star_id = starId;
    if (wishText) body.wish_text = wishText;

    const r = await fetch('/api/cablecar/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok || !data.success) throw new Error(data.error || '오류가 발생했습니다.');
    return data;
  };

  // ── 마운트 시 기존 별 확인 ──────────────────────────────────────
  useEffect(() => {
    const existingStarId = readSavedStar();

    if (existingStarId) {
      // 기존 별 → 자동 각성/재각성 처리
      setPhase('processing');
      callEnter({ starId: existingStarId })
        .then(data => {
          saveStarId(data.starId);
          setResult(data);
          setPhase('awakened');
        })
        .catch(err => {
          console.error('[cablecar] 자동 각성 실패:', err.message);
          setPhase('error');
          setResult({ message: err.message });
        });
    } else {
      // 새 사용자 → 소원 입력 화면
      setPhase('input');
    }
  }, []);

  // ── 소원 제출 ──────────────────────────────────────────────────
  const handleWishSubmit = async (wishText) => {
    if (!wishText.trim()) { setInputError('소원을 입력해주세요.'); return; }
    setLoading(true);
    setInputError('');
    try {
      const data = await callEnter({ wishText: wishText.trim() });
      saveStarId(data.starId);
      setResult(data);
      setPhase('awakened');
    } catch (err) {
      setInputError(err.message || '별 탄생에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // ── 완료 후 이동 ──────────────────────────────────────────────
  const goToStar = () => {
    if (result?.nextUrl) nav(result.nextUrl);
    else nav('/my-star');
  };

  if (phase === 'init' || phase === 'processing') {
    return <ProcessingView headline={phase === 'processing' ? '별과 연결하는 중...' : undefined} />;
  }

  if (phase === 'input') {
    return (
      <WishInputView
        onSubmit={handleWishSubmit}
        loading={loading}
        error={inputError}
      />
    );
  }

  if (phase === 'awakened' && result) {
    return <AwakenedView onNext={goToStar} />;
  }

  return (
    <ErrorView
      message={result?.message || '알 수 없는 오류입니다'}
      onRetry={() => window.location.reload()}
    />
  );
}
