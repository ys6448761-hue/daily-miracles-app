/**
 * CablecarPage.jsx — 케이블카 캐빈 QR 전용 진입 엔진
 * 경로: /cablecar          (무료)
 *       /cablecar?code=XXX (유료 — 결제 완료 리디렉트)
 *
 * ── 분기 ──────────────────────────────────────────────────────────
 *
 *  [유료 + 기존 별]  → 각성 연출 5초 → /my-star/:id
 *  [유료 + 별 없음]  → 소원 입력 → 별 생성 → 각성 연출 5초 → /my-star/:id
 *  [무료 + 기존 별]  → "방문 기록됨" 화면 (각성 없음)
 *  [무료 + 별 없음]  → 상품 구매 안내 화면 (별 생성 없음)
 *
 * ── 원칙 ──────────────────────────────────────────────────────────
 *  "각성은 무료 기능이 아니라 상품이다"
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrCreateUserId } from '../api/dreamtown.js';
import { readSavedStar, saveStarId, clearStarId } from '../lib/utils/starSession.js';
import StarAwakeningScene from '../components/StarAwakeningScene.jsx';

function dbg(step, data) {
  console.log(`[Cablecar] ${step}`, data ?? '');
}

// ── 공통 스타일 ──────────────────────────────────────────────────
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
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  btnOutline: {
    display: 'block',
    width: '100%',
    padding: '13px 0',
    borderRadius: 14,
    border: '1px solid rgba(155,135,245,0.3)',
    background: 'transparent',
    color: '#9B87F5',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
    fontFamily: "'Noto Sans KR', sans-serif",
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
  error: { fontSize: 13, color: '#f87171', marginTop: 12, lineHeight: 1.5 },
  dot: {
    width: 10, height: 10, borderRadius: '50%',
    background: '#9B87F5', display: 'inline-block', margin: '0 4px',
  },
};

// ── 로딩 ──────────────────────────────────────────────────────────
function ProcessingView() {
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚡</div>
        <div style={{ marginBottom: 20 }}>
          {[0, 1, 2].map(i => (
            <motion.span
              key={i} style={S.dot}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        <div style={{ fontSize: 15, color: '#C4BAE0', lineHeight: 1.7 }}>
          확인하는 중...
        </div>
      </motion.div>
    </div>
  );
}

// ── [유료] 소원 입력 ──────────────────────────────────────────────
function WishInputView({ onSubmit, loading, error }) {
  const [text, setText] = useState('');
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚡</div>
        <div style={S.label}>여수 케이블카 캐빈</div>
        <div style={S.headline}>이 순간,<br />소원을 담아 별을 탄생시키세요</div>
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
            style={{ ...S.btn, ...(loading || !text.trim() ? S.btnDisabled : {}) }}
          >
            {loading ? '별 탄생 중...' : '별 탄생시키기 ✨'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── [무료 + 기존별] 각성 구매 유도 ──────────────────────────────
function BasicLogView({ onNext }) {
  const nav = useNavigate();
  return (
    <div style={S.page}>
      <motion.div
        style={{ ...S.card, padding: '36px 20px' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* 잠든 별 글로우 */}
        <motion.div
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,190,255,0.6) 0%, rgba(155,135,245,0.3) 50%, transparent 80%)',
            boxShadow: '0 0 16px 6px rgba(155,135,245,0.3)',
            margin: '0 auto 20px',
            filter: 'blur(1px)',
          }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div style={{ fontSize: 11, fontWeight: 700, color: '#9B87F5', letterSpacing: '0.1em', marginBottom: 8 }}>
          내 별이 있어요
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 8 }}>
          별이 깨어날<br />준비가 됐어요
        </div>
        <div style={{ fontSize: 13, color: '#7A6E9C', lineHeight: 1.65, marginBottom: 24 }}>
          케이블카 위에서 이 순간을 기록했어요.<br />
          각성 패스로 지금 바로 깨울 수 있어요.
        </div>

        {/* 가격 뱃지 */}
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: 20,
          background: 'rgba(255,215,106,0.1)',
          border: '1px solid rgba(255,215,106,0.25)',
          fontSize: 13,
          color: '#FFD76A',
          fontWeight: 700,
          marginBottom: 20,
        }}>
          오픈가 19,900원
        </div>

        <button
          onClick={() => nav('/cablecar-landing')}
          style={{ ...S.btn, marginTop: 0 }}
        >
          내 별 깨우기 ✨
        </button>
        <button onClick={onNext} style={{ ...S.btnOutline, marginTop: 8, fontSize: 13 }}>
          지금은 괜찮아요 — 내 별 보기
        </button>
      </motion.div>
    </div>
  );
}

// ── [무료 + 별 없음] 상품 구매 안내 ──────────────────────────────
function ProductCTAView({ onShop }) {
  return (
    <div style={S.page}>
      <motion.div
        style={S.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
        <div style={S.label}>여수 케이블카 캐빈</div>
        <div style={S.headline}>케이블카에서<br />내 별을 만들어요</div>
        <div style={S.subline}>
          별 탄생과 각성 연출은<br />
          각성 패스 구매 후 바로 시작돼요
        </div>

        {/* 상품 카드 2종 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { name: '베이직', price: '19,900원', desc: '기록 + 내 별 연결' },
            { name: '프리미엄', price: '24,900원', desc: '기억 확장 + 장소 연결', highlight: true },
          ].map(p => (
            <div
              key={p.name}
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: 12,
                background: p.highlight ? 'rgba(155,135,245,0.12)' : 'rgba(255,255,255,0.04)',
                border: p.highlight ? '1px solid rgba(155,135,245,0.35)' : '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: p.highlight ? '#9B87F5' : '#E8E4F0', marginBottom: 4 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFD76A', marginBottom: 4 }}>
                {p.price}
              </div>
              <div style={{ fontSize: 10, color: '#7A6E9C', lineHeight: 1.4 }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onShop} style={S.btn}>
          각성 패스 구매하기 →
        </button>
        <div style={{ fontSize: 11, color: '#5a5370', marginTop: 12 }}>
          오픈가 19,900원 · 결제 완료 후 바로 각성 시작
        </div>
      </motion.div>
    </div>
  );
}

// ── [유료] 각성 직후 앱 상품 업셀 ────────────────────────────────
function UpsellView({ starId, onNext }) {
  const nav = useNavigate();
  return (
    <div style={S.page}>
      <motion.div
        style={{ ...S.card, padding: '36px 20px' }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 별 글로우 */}
        <motion.div
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'radial-gradient(circle, #fff 0%, #e8e0ff 25%, #9B87F5 55%, transparent 80%)',
            boxShadow: '0 0 20px 8px rgba(155,135,245,0.7)',
            margin: '0 auto 20px',
          }}
          animate={{ boxShadow: [
            '0 0 20px 8px rgba(155,135,245,0.7)',
            '0 0 32px 14px rgba(155,135,245,0.9)',
            '0 0 20px 8px rgba(155,135,245,0.7)',
          ]}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div style={{ fontSize: 11, fontWeight: 700, color: '#9B87F5', letterSpacing: '0.1em', marginBottom: 10 }}>
          별이 각성됐어요
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#E8E4F0', lineHeight: 1.4, marginBottom: 8 }}>
          이 별, 계속<br />키워보시겠어요?
        </div>
        <div style={{ fontSize: 13, color: '#7A6E9C', lineHeight: 1.65, marginBottom: 24 }}>
          별은 지금 막 깨어났어요.<br />
          DreamTown 멤버십으로 함께 성장시켜봐요.
        </div>

        {/* 플랜 카드 2종 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            {
              name:  '베이직',
              price: '9,900원',
              tag:   '가볍게 이어가기',
              desc:  '별 성장 + 하루 기록 + 공명',
              highlight: false,
            },
            {
              name:  '프리미엄',
              price: '24,900원',
              tag:   '제대로 이어가기',
              desc:  '모든 기능 + AI 코치 + 여행 연결',
              highlight: true,
            },
          ].map(plan => (
            <motion.div
              key={plan.name}
              onClick={() => nav('/shop')}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1,
                padding: '14px 10px',
                borderRadius: 14,
                background: plan.highlight
                  ? 'rgba(155,135,245,0.14)'
                  : 'rgba(255,255,255,0.04)',
                border: plan.highlight
                  ? '1px solid rgba(155,135,245,0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: plan.highlight ? '#9B87F5' : '#E8E4F0', marginBottom: 4 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFD76A', marginBottom: 4 }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 9, color: '#9B87F5', fontWeight: 600, marginBottom: 6 }}>
                {plan.tag}
              </div>
              <div style={{ fontSize: 10, color: '#7A6E9C', lineHeight: 1.4 }}>
                {plan.desc}
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => nav('/shop')}
          style={{ ...S.btn, fontSize: 14, padding: '13px 0', marginTop: 0 }}
        >
          멤버십 자세히 보기 →
        </button>
        <button
          onClick={onNext}
          style={{ ...S.btnOutline, marginTop: 8, fontSize: 13 }}
        >
          지금은 괜찮아요 — 내 별 보기
        </button>
      </motion.div>
    </div>
  );
}

// ── 에러 ──────────────────────────────────────────────────────────
function ErrorView({ message, onRetry, savedStarId }) {
  const nav = useNavigate();
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>문제가 생겼어요</div>
        <div style={{ fontSize: 13, color: '#f87171', marginBottom: 24, lineHeight: 1.5 }}>{message}</div>
        <button style={S.btn} onClick={onRetry}>다시 시도</button>
        {savedStarId && (
          <button
            style={S.btnOutline}
            onClick={() => nav(`/my-star/${savedStarId}`)}
          >
            내 별 바로 보기
          </button>
        )}
      </motion.div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function CablecarPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // 유료 여부: 결제 완료 후 /cablecar?code=XXXX 로 리디렉트됨
  const credentialCode = searchParams.get('code') ?? null;
  const isPaid         = !!credentialCode;

  const [phase,      setPhase]      = useState('init');
  // init | processing | input | awakening | upsell | logged_only | no_product | error
  const [result,     setResult]     = useState(null);
  const [inputError, setInputError] = useState('');
  const [loading,    setLoading]    = useState(false);

  // ── API 호출 ──────────────────────────────────────────────────
  const callEnter = async ({ starId, wishText }) => {
    const userId = getOrCreateUserId();
    dbg('A. userId', userId);
    dbg('B. isPaid', isPaid);
    dbg('C. starId', starId ?? '(없음)');

    const body = { user_id: userId, place: 'yeosu_cablecar_cabin' };
    if (starId)          body.star_id          = starId;
    if (wishText)        body.wish_text         = wishText;
    if (credentialCode)  body.credential_code   = credentialCode;

    const r    = await fetch('/api/cablecar/enter', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await r.json();
    dbg('D. API 응답', { status: r.status, mode: data.mode, has_product: data.has_product });

    if (!r.ok) {
      const err = new Error(data.error || data.message || '오류가 발생했습니다.');
      err.status = r.status;
      throw err;
    }
    return data;
  };

  // ── 마운트 ───────────────────────────────────────────────────
  useEffect(() => {
    const existingStarId = readSavedStar();
    dbg('0. 마운트', { existingStarId: existingStarId ?? '없음', isPaid });

    // [무료 + 별 없음] → 즉시 상품 안내 (API 불필요)
    if (!isPaid && !existingStarId) {
      dbg('0-A. 무료 + 별 없음 → no_product');
      setPhase('no_product');
      return;
    }

    // [유료 + 별 없음] → 소원 입력 (API 불필요)
    if (isPaid && !existingStarId) {
      dbg('0-B. 유료 + 별 없음 → input');
      setPhase('input');
      return;
    }

    // [별 있음] → API 호출 (유료면 각성, 무료면 logged_only)
    setPhase('processing');
    callEnter({ starId: existingStarId })
      .then(data => {
        if (data.has_product) {
          dbg('1. 유료 각성 → awakening', data.starName);
          saveStarId(data.starId);
          setResult(data);
          setPhase('awakening');
        } else {
          // logged_only: 방문 기록됨, 각성 없음
          dbg('1. 무료 방문 → logged_only', data.starId);
          saveStarId(data.starId);
          setResult(data);
          setPhase('logged_only');
        }
      })
      .catch(err => {
        dbg('2. 오류', { message: err.message, status: err.status });
        if (err.status === 404) {
          clearStarId();
          setPhase(isPaid ? 'input' : 'no_product');
        } else {
          setPhase('error');
          setResult({ message: err.message });
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── [유료] 소원 제출 ─────────────────────────────────────────
  const handleWishSubmit = async (wishText) => {
    if (!wishText.trim()) { setInputError('소원을 입력해주세요.'); return; }
    setLoading(true);
    setInputError('');
    try {
      const data = await callEnter({ wishText: wishText.trim() });
      dbg('3. 신규 별 생성', data.starId);
      saveStarId(data.starId);
      setResult(data);
      setPhase('awakening');
    } catch (err) {
      dbg('4. 소원 제출 실패', err.message);
      setInputError(err.message || '별 탄생에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // ── 내 별로 이동 ─────────────────────────────────────────────
  const goToStar = () => {
    if (result?.nextUrl) nav(result.nextUrl);
    else if (result?.starId) nav(`/my-star/${result.starId}`);
    else nav('/my-star');
  };

  // ── 렌더 ─────────────────────────────────────────────────────

  if (phase === 'init' || phase === 'processing') {
    return <ProcessingView />;
  }

  // [무료 + 별 없음] 상품 안내
  if (phase === 'no_product') {
    return <ProductCTAView onShop={() => nav('/cablecar-landing')} />;
  }

  // [유료 + 별 없음] 소원 입력
  if (phase === 'input') {
    return (
      <WishInputView
        onSubmit={handleWishSubmit}
        loading={loading}
        error={inputError}
      />
    );
  }

  // [유료] 별 각성 시그니처 연출 (5초) → 완료 시 업셀로
  if (phase === 'awakening' && result) {
    return (
      <StarAwakeningScene
        starName={result.starName}
        onComplete={() => setPhase('upsell')}
      />
    );
  }

  // [유료] 각성 직후 앱 상품 업셀
  if (phase === 'upsell' && result) {
    return <UpsellView starId={result.starId} onNext={goToStar} />;
  }

  // [무료 + 기존별] 방문 기록
  if (phase === 'logged_only') {
    return <BasicLogView onNext={goToStar} />;
  }

  // 에러
  return (
    <ErrorView
      message={result?.message || '알 수 없는 오류입니다'}
      onRetry={() => window.location.reload()}
      savedStarId={readSavedStar()}
    />
  );
}
