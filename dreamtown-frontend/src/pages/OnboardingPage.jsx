/**
 * OnboardingPage.jsx — /onboarding
 *
 * DreamTown 핵심 퍼널: 소원 → 날짜/인원 → 추천 → 별 생성
 *
 * 4단계 플로우:
 *   STEP 1 — 소원 텍스트 입력 + gem_type 선택
 *   STEP 2 — 날짜 타입 + 인원 타입 선택
 *   STEP 3 — 추천 결과 (상품 최대 2개, 1개 강조)
 *   STEP 4 — 별 생성 완료
 *
 * UX 규칙:
 *   - 추천은 1개 강조
 *   - 상품 최대 2개
 *   - CTA 항상 하단 고정
 *   - "결제" 대신 "시작하기"
 *   - 별은 CTA 클릭 시에만 생성
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE ?? '';

// ── 상수 ──────────────────────────────────────────────────────────────
const GEM_OPTIONS = [
  { key: 'emerald',  emoji: '💚', label: '치유',  desc: '쉬고 싶어요'     },
  { key: 'sapphire', emoji: '💙', label: '성장',  desc: '성장하고 싶어요' },
  { key: 'citrine',  emoji: '💛', label: '관계',  desc: '함께하고 싶어요' },
  { key: 'ruby',     emoji: '❤️', label: '도전',  desc: '도전해보고 싶어요'},
  { key: 'diamond',  emoji: '🤍', label: '기적',  desc: '특별한 순간을 원해요'},
];

const DATE_OPTIONS = [
  { key: 'today',     label: '오늘',      sub: '바로 지금'   },
  { key: 'this_week', label: '이번 주',   sub: '며칠 내로'   },
  { key: 'next_week', label: '다음 주',   sub: '여유롭게'    },
  { key: 'custom',    label: '나중에',    sub: '날짜 미정'   },
];

const PEOPLE_OPTIONS = [
  { key: 'solo',    label: '혼자',   emoji: '🧘' },
  { key: 'couple',  label: '둘이',   emoji: '👫' },
  { key: 'family',  label: '가족',   emoji: '👨‍👩‍👧' },
  { key: 'friends', label: '친구들', emoji: '👥' },
];

const GALAXY_COLOR = {
  healing: '#FFB8C8', growth: '#6AE8B8', relation: '#A8B8FF',
  challenge: '#FFD76A', miracle: '#C8A8FF',
};

const STEP = { WISH: 1, CONTEXT: 2, RECOMMEND: 3, DONE: 4 };

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();

  const [step,        setStep]       = useState(STEP.WISH);
  const [wishText,    setWishText]   = useState('');
  const [gemType,     setGemType]    = useState('');
  const [dateType,    setDateType]   = useState('');
  const [peopleType,  setPeopleType] = useState('');
  const [wish,        setWish]       = useState(null);   // { wish_id }
  const [context,     setContext]    = useState(null);   // { context_id }
  const [rec,         setRec]        = useState(null);   // recommendation response
  const [selectedPid, setSelectedPid] = useState('');   // 선택된 product_id
  const [star,        setStar]       = useState(null);   // { star_id }
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState('');

  const textareaRef = useRef(null);

  // ── API 헬퍼 ──────────────────────────────────────────────────────
  async function post(path, body) {
    const res = await fetch(`${API}/api/dt/funnel${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // ── STEP 1 → 2: 소원 저장 ─────────────────────────────────────────
  async function handleWishSubmit() {
    if (!wishText.trim()) { setError('소원을 입력해주세요'); return; }
    setLoading(true); setError('');
    try {
      const data = await post('/wish', { wish_text: wishText.trim(), gem_type: gemType || 'emerald' });
      if (!data.ok) throw new Error(data.error);
      setWish(data);
      setStep(STEP.CONTEXT);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  // ── STEP 2 → 3: 컨텍스트 저장 + 추천 로드 ────────────────────────
  async function handleContextSubmit() {
    if (!dateType || !peopleType) { setError('날짜와 인원을 모두 선택해주세요'); return; }
    setLoading(true); setError('');
    try {
      const ctxData = await post('/context', {
        wish_id: wish?.wish_id, date_type: dateType, people_type: peopleType,
      });
      if (!ctxData.ok) throw new Error(ctxData.error);
      setContext(ctxData);

      const recData = await post('/recommendation', {
        wish_id: wish?.wish_id, context_id: ctxData.context_id,
      });
      if (!recData.ok) throw new Error(recData.error);
      setRec(recData);
      setSelectedPid(recData.recommended_products?.[0]?.product_id ?? '');
      setStep(STEP.RECOMMEND);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  // ── STEP 3 → 4: CTA 클릭 → 별 생성 ──────────────────────────────
  async function handleCTA() {
    setLoading(true); setError('');
    try {
      const data = await post('/star', {
        wish_id:    wish?.wish_id,
        product_id: selectedPid,
        route_code: rec?.recommended_route,
        context_id: context?.context_id,
      });
      if (!data.ok) throw new Error(data.error);
      setStar(data);
      setStep(STEP.DONE);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const accent = rec ? (GALAXY_COLOR[rec.galaxy_code] ?? '#FFD76A') : '#FFD76A';

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>

        {/* ── STEP 1: 소원 입력 ── */}
        {step === STEP.WISH && (
          <div style={cardStyle}>
            <p style={headerText}>✦ DREAMTOWN</p>
            <h1 style={titleText}>어떤 소원을 품고 있나요?</h1>
            <p style={subtitleText}>지금 마음속에 있는 것을 자유롭게 적어주세요</p>

            <textarea
              ref={textareaRef}
              style={textareaStyle}
              value={wishText}
              onChange={e => setWishText(e.target.value)}
              placeholder="예: 여수에서 조용히 쉬고 싶어요"
              rows={3}
              autoFocus
            />

            <p style={sectionLabel}>나의 바람</p>
            <div style={gemGrid}>
              {GEM_OPTIONS.map(g => (
                <button
                  key={g.key}
                  onClick={() => setGemType(g.key)}
                  style={{
                    ...gemBtn,
                    background:  gemType === g.key ? 'rgba(255,215,106,0.15)' : 'rgba(255,255,255,0.04)',
                    border:      `1px solid ${gemType === g.key ? 'rgba(255,215,106,0.5)' : 'rgba(255,255,255,0.10)'}`,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{g.emoji}</span>
                  <span style={{ fontSize: 11, color: gemType === g.key ? '#FFD76A' : 'rgba(255,255,255,0.5)', marginTop: 4 }}>{g.label}</span>
                </button>
              ))}
            </div>

            {error && <p style={errorText}>{error}</p>}
          </div>
        )}

        {/* ── STEP 2: 날짜/인원 선택 ── */}
        {step === STEP.CONTEXT && (
          <div style={cardStyle}>
            <p style={headerText}>✦ DREAMTOWN</p>
            <h1 style={titleText}>언제, 누구와 함께인가요?</h1>

            <p style={sectionLabel}>여행 시기</p>
            <div style={optionGrid2}>
              {DATE_OPTIONS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDateType(d.key)}
                  style={optionBtn(dateType === d.key)}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: dateType === d.key ? 'white' : 'rgba(255,255,255,0.6)' }}>{d.label}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{d.sub}</span>
                </button>
              ))}
            </div>

            <p style={{ ...sectionLabel, marginTop: 20 }}>함께하는 사람</p>
            <div style={optionGrid2}>
              {PEOPLE_OPTIONS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeopleType(p.key)}
                  style={optionBtn(peopleType === p.key)}
                >
                  <span style={{ fontSize: 22 }}>{p.emoji}</span>
                  <span style={{ fontSize: 12, color: peopleType === p.key ? 'white' : 'rgba(255,255,255,0.5)', marginTop: 4 }}>{p.label}</span>
                </button>
              ))}
            </div>

            {error && <p style={errorText}>{error}</p>}
          </div>
        )}

        {/* ── STEP 3: 추천 결과 ── */}
        {step === STEP.RECOMMEND && rec && (
          <div style={cardStyle}>
            <p style={headerText}>✦ DREAMTOWN</p>
            <h1 style={titleText}>
              <span style={{ color: accent }}>{rec.route_label}</span>을<br />추천드려요
            </h1>
            <p style={subtitleText}>"{wishText}"에 어울리는 경험이에요</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              {rec.recommended_products.map((prod, i) => (
                <button
                  key={prod.product_id}
                  onClick={() => setSelectedPid(prod.product_id)}
                  style={{
                    ...productCard,
                    border: `1.5px solid ${selectedPid === prod.product_id
                      ? accent
                      : 'rgba(255,255,255,0.08)'}`,
                    background: selectedPid === prod.product_id
                      ? `rgba(${hexToRgb(accent)},0.08)`
                      : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      {i === 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: accent,
                          background: `rgba(${hexToRgb(accent)},0.15)`,
                          padding: '2px 8px', borderRadius: 999, marginBottom: 6, display: 'inline-block',
                        }}>
                          {prod.tag === 'best' ? '✦ 추천' : prod.tag?.toUpperCase()}
                        </span>
                      )}
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'white', marginTop: i === 0 ? 4 : 0 }}>
                        {prod.title}
                      </p>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: accent, whiteSpace: 'nowrap', marginLeft: 12 }}>
                      ₩{prod.price.toLocaleString('ko-KR')}
                    </p>
                  </div>
                  {selectedPid === prod.product_id && (
                    <p style={{ fontSize: 11, color: accent, marginTop: 6 }}>선택됨 ✓</p>
                  )}
                </button>
              ))}
            </div>

            {error && <p style={errorText}>{error}</p>}
          </div>
        )}

        {/* ── STEP 4: 별 생성 완료 ── */}
        {step === STEP.DONE && star && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>✦</p>
            <h1 style={{ ...titleText, fontSize: 20 }}>별이 생겨났어요</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 8, lineHeight: 1.7 }}>
              "{wishText}"<br />
              <span style={{ color: accent, fontSize: 13 }}>가 {star.star_name}이 되었어요</span>
            </p>
            <button
              onClick={() => navigate('/my-star')}
              style={{ ...ctaStyle, background: accent, color: '#0A1628', marginTop: 32, border: 'none' }}
            >
              내 별 보러가기 →
            </button>
          </div>
        )}

      </div>

      {/* ── 하단 고정 CTA ── */}
      {step !== STEP.DONE && (
        <div style={ctaBarStyle}>
          {error && step !== STEP.WISH && step !== STEP.CONTEXT && (
            <p style={{ ...errorText, marginBottom: 8 }}>{error}</p>
          )}
          <button
            onClick={
              step === STEP.WISH      ? handleWishSubmit  :
              step === STEP.CONTEXT   ? handleContextSubmit :
              step === STEP.RECOMMEND ? handleCTA         : undefined
            }
            disabled={loading || (step === STEP.WISH && !wishText.trim())}
            style={{
              ...ctaStyle,
              background:
                step === STEP.RECOMMEND
                  ? accent
                  : 'rgba(100,232,184,0.15)',
              color:  step === STEP.RECOMMEND ? '#0A1628' : 'rgba(100,232,184,0.9)',
              border: step === STEP.RECOMMEND ? 'none' : '1px solid rgba(100,232,184,0.4)',
              opacity: (loading || (step === STEP.WISH && !wishText.trim())) ? 0.5 : 1,
            }}
          >
            {loading ? '잠깐만요...' :
              step === STEP.WISH      ? '다음 →' :
              step === STEP.CONTEXT   ? '추천 받기 →' :
              step === STEP.RECOMMEND ? '이 시간을 시작하기 ✦' : ''}
          </button>

          {/* 뒤로가기 */}
          {step > STEP.WISH && (
            <button
              onClick={() => { setError(''); setStep(s => s - 1); }}
              style={backBtn}
            >
              ← 이전
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── 유틸 ────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ── 스타일 ────────────────────────────────────────────────────────────
const pageStyle = {
  minHeight: '100vh', background: '#0A1628',
  display: 'flex', flexDirection: 'column',
  paddingBottom: 140,
};

const wrapStyle = {
  flex: 1,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '32px 16px 0',
};

const cardStyle = {
  width: '100%', maxWidth: 420,
};

const headerText = {
  fontSize: 10, color: 'rgba(255,215,106,0.6)',
  letterSpacing: '0.1em', marginBottom: 12,
};

const titleText = {
  fontSize: 24, fontWeight: 700, color: 'white',
  lineHeight: 1.35, marginBottom: 8,
};

const subtitleText = {
  fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24,
};

const sectionLabel = {
  fontSize: 12, color: 'rgba(255,255,255,0.4)',
  marginBottom: 10, marginTop: 4,
};

const textareaStyle = {
  width: '100%', padding: '14px', borderRadius: 12,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'white', fontSize: 15, resize: 'none',
  boxSizing: 'border-box', marginBottom: 20, outline: 'none',
  lineHeight: 1.6,
};

const gemGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8,
};

const gemBtn = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const optionGrid2 = {
  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
};

const optionBtn = (selected) => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '14px 8px', borderRadius: 12, cursor: 'pointer',
  background:  selected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
  border:      `1px solid ${selected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
  transition:  'all 0.15s ease',
});

const productCard = {
  width: '100%', padding: '16px', borderRadius: 14,
  cursor: 'pointer', textAlign: 'left',
  transition: 'all 0.15s ease',
};

const ctaBarStyle = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  padding: '16px 16px 32px',
  background: 'linear-gradient(to top, #0A1628 60%, transparent)',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  maxWidth: 420, margin: '0 auto',
};

const ctaStyle = {
  width: '100%', maxWidth: 420,
  padding: '16px 0', borderRadius: 9999,
  fontSize: 15, fontWeight: 700, cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const backBtn = {
  marginTop: 10,
  background: 'transparent', border: 'none',
  color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer',
};

const errorText = {
  fontSize: 12, color: 'rgba(255,100,100,0.8)',
  textAlign: 'center', marginTop: 8,
};
