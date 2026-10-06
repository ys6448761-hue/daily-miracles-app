/**
 * SOUL 무여정 Main Home V1.1
 * 여수맘 파일럿 + Founder Meeting용 프로덕션 홈
 *
 * Route: /muyojeong
 * SOUL runtime: POST /api/dt/travel/input/text (no place_code — traveler context only)
 *
 * V1.1 changes (Founder/Lumi visual review revision):
 *   - Overflow fix: no transform:scale; overflow-x:hidden; flex min-width:0 on input
 *   - Visual: warm Yeosu evening harbor gradient, Yeosu Blue / Starlight Gold / Aqua Glow
 *   - SOUL master: soul-master.png (copied from Founder Original — originals untouched)
 *   - Chips: 2-column grid, 44px tap targets
 *   - Place cards: per-place routing (/soul/cable-car?place=code)
 *   - word-break: keep-all on all Korean text for correct mobile wrapping
 *
 * Asset paths:
 *   SOUL master → public/images/soul/soul-master.png (Founder Original copy)
 *   Home visual reference → public/images/soul/muyojeong-home-reference.png (Founder Original copy)
 *
 * Constraints (Founder directive):
 *   - NO schema / migration / seed / new knowledge / FAQ / Commerce / analytics
 *   - STOP after verification for Founder/Lumi Visual Review
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrEnsureGuestCredential } from '../api/dreamtown.js';

// ── Color tokens — from Founder Visual Reference ───────────────────────────────
const C = {
  yeosuBlue:    '#6EB8FF',
  starlightGold: '#FFD67A',
  aquaGlow:     '#B8F4FF',
};

// ── SOUL Answer Summary ────────────────────────────────────────────────────────
function SoulAnswerSummary({ response, onNewQuestion }) {
  if (!response || !response.message_ko) return null;

  const mode   = response.presentation_mode;
  const status = response.status;

  let badge = null;
  if (status !== 'JOURNEY_CONTINUITY') {
    if (mode === 'DISCOVERING' || (status === 'PLACE_LOOKUP' && response.places?.length > 0)) {
      badge = { label: '추천 가능', cls: 'text-green-300 bg-green-900 bg-opacity-40 border-green-700 border-opacity-40' };
    } else if (mode === 'PARTIAL') {
      badge = { label: '상황에 따라 달라요', cls: 'text-yellow-300 bg-yellow-900 bg-opacity-30 border-yellow-700 border-opacity-40' };
    } else if (status === 'CLARIFICATION' || (mode === 'CLARIFICATION' && status !== 'JOURNEY_CONTINUITY')) {
      badge = { label: '확인 필요', cls: 'text-blue-300 bg-blue-900 bg-opacity-30 border-blue-700 border-opacity-40' };
    }
  }

  const lines         = response.message_ko.split('\n');
  const firstLine     = lines[0] || '';
  const sentenceEnd   = firstLine.search(/[.!?。]\s*/);
  const firstSentence = sentenceEnd >= 0 ? firstLine.slice(0, sentenceEnd + 1) : firstLine;
  const restOfFirst   = sentenceEnd >= 0 ? firstLine.slice(sentenceEnd + 1).trim() : '';
  const restLines     = [restOfFirst, ...lines.slice(1)].filter(Boolean).join('\n');

  const keyPoints  = (response.why_details?.[0]?.place_features || []).slice(0, 3);
  const nextAction = response.next_options?.[0] || null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(110,184,255,0.07)',
        border:     `1px solid rgba(110,184,255,0.22)`,
        boxShadow:  '0 2px 16px rgba(110,184,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontSize: '0.6875rem', color: C.yeosuBlue, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          SOUL의 답
        </p>
        {onNewQuestion && (
          <button
            onClick={onNewQuestion}
            style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            다시 물어보기
          </button>
        )}
      </div>
      <p className="text-white font-medium leading-snug" style={{ fontSize: '0.9375rem', wordBreak: 'keep-all' }}>
        {firstSentence}
      </p>
      {restLines && (
        <p
          className="text-white leading-relaxed mt-1 whitespace-pre-line"
          style={{ fontSize: '0.875rem', opacity: 0.7, wordBreak: 'keep-all' }}
        >
          {restLines}
        </p>
      )}
      {badge && (
        <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium border ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      {keyPoints.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {keyPoints.map((pt, i) => (
            <span key={i} style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              {pt}
            </span>
          ))}
        </div>
      )}
      {nextAction && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.38)', marginBottom: '4px' }}>다음에 알려주세요</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.5, wordBreak: 'keep-all' }}>{nextAction}</p>
        </div>
      )}
    </div>
  );
}

// ── Suggestion chips — Founder directive canonical 4, 2-col grid ──────────────
const SUGGESTION_CHIPS = [
  '부모님과 어디 가면 좋을까?',
  '아이와 오늘 어디 가지?',
  '차 가져가는데 동선 짜줘',
  '비 오면 어디 가면 좋아?',
];

// ── Place entries — per-place routing via ?place= URL param ───────────────────
// SoulCableCarPage.entryPlaceCode reads this to start the correct Living Detail view.
const PLACE_ENTRIES = [
  {
    code:    'cablecar',
    name:    '여수해상케이블카',
    desc:    '자산 ↔ 돌산 · 편도 약 13분',
    heroSrc: '/images/soul/place-hero/cablecar.png',
    path:    '/soul/cable-car?place=cablecar',
  },
  {
    code:    'odongdo',
    name:    '오동도',
    desc:    '방파제 길 · 동백꽃 · 동백열차',
    heroSrc: '/images/soul/place-hero/odongdo.png',
    path:    '/soul/cable-car?place=odongdo',
  },
  {
    code:    'hyangiram',
    name:    '향일암',
    desc:    '절벽 암자 · 해돋이 · 두 갈래 길',
    heroSrc: '/images/soul/place-hero/hyangiram.png',
    path:    '/soul/cable-car?place=hyangiram',
  },
];

// ── Main page ────────────────────────────────────────────────────────────────
export default function MuyojeongHomePage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [inputValue,    setInputValue]    = useState('');
  const [sessionId,     setSessionId]     = useState(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [soulResponse,  setSoulResponse]  = useState(null);
  const [errorMsg,      setErrorMsg]      = useState(null);
  const [soulMasterErr, setSoulMasterErr] = useState(false);

  async function _callSOUL(text) {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const cred = await getOrEnsureGuestCredential();
      if (!cred?.guest_token) throw new Error('인증 정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.');

      const res = await fetch('/api/dt/travel/input/text', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${cred.guest_token}`,
        },
        body: JSON.stringify({
          message:    text,
          session_id: sessionId,
          // NO place_code — main home is traveler context only
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === 'string' ? body.error : '요청 처리에 실패했어요. 다시 시도해주세요.');
      }

      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);
      setSoulResponse(data);
    } catch (err) {
      setErrorMsg(err.message || '일정을 확인하는 중 문제가 생겼어요. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const raw = inputValue.trim();
    if (!raw || isLoading) return;
    _callSOUL(raw);
  }

  function handleChipClick(chip) {
    if (isLoading) return;
    _callSOUL(chip);
  }

  function handleReset() {
    setSoulResponse(null);
    setErrorMsg(null);
    setInputValue('');
    inputRef.current?.focus();
  }

  return (
    // overflow-x:hidden — primary overflow guard.
    // No transform:scale used anywhere (V1 source of overflow was absolute+scale ring → removed).
    <div
      className="min-h-screen text-white pb-24"
      style={{
        overflowX: 'hidden',
        // Warm Yeosu evening harbor atmosphere:
        // deep purple-navy top (evening sky) → ocean blue → dark sea
        // radial warm sunset glow at top-right (cable car / harbor direction)
        background: [
          'radial-gradient(ellipse at 80% 0%, rgba(255,165,50,0.10) 0%, transparent 48%)',
          'radial-gradient(ellipse at 20% 15%, rgba(110,184,255,0.07) 0%, transparent 40%)',
          'linear-gradient(180deg, #130b1e 0%, #0b1830 30%, #061525 65%, #030c18 100%)',
        ].join(', '),
      }}
    >

      {/* ── HERO — brand + SOUL + promise ── */}
      {/* Subtle aqua warm highlight at top */}
      <div
        style={{
          background:    'linear-gradient(180deg, rgba(14,116,144,0.13) 0%, transparent 100%)',
          paddingTop:    '2.25rem',
          paddingBottom: '1.5rem',
          paddingLeft:   '1rem',
          paddingRight:  '1rem',
        }}
      >
        <div className="max-w-md mx-auto flex flex-col items-center text-center">

          {/* Brand label */}
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.30)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            무료 여수여행정보
          </p>

          {/* SOUL character — approved Master asset (soul-master.png) */}
          {/* On error: CSS aqua wave fallback */}
          <div
            style={{
              width:        '80px',
              height:       '80px',
              borderRadius: '50%',
              overflow:     'hidden',
              flexShrink:   0,
              marginBottom: '0.875rem',
              // Aqua glow ring via box-shadow — no absolute positioning, no overflow
              boxShadow: [
                `0 0 0 3px rgba(110,184,255,0.22)`,
                `0 0 0 8px rgba(255,214,122,0.09)`,
                `0 0 28px rgba(110,184,255,0.18)`,
              ].join(', '),
            }}
          >
            {!soulMasterErr ? (
              <img
                src="/images/soul/soul-master.png"
                alt="SOUL — 나의 여수여행 친구"
                onError={() => setSoulMasterErr(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  width:      '100%',
                  height:     '100%',
                  background: 'radial-gradient(circle at 38% 38%, rgba(110,184,255,0.38) 0%, rgba(6,78,100,0.6) 60%, rgba(4,14,24,0.8) 100%)',
                  display:    'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize:   '2rem',
                }}
              >
                🌊
              </div>
            )}
          </div>

          {/* SOUL identity tagline */}
          <p style={{ fontSize: '0.75rem', color: C.yeosuBlue, opacity: 0.85, marginBottom: '0.625rem', letterSpacing: '0.04em' }}>
            나의 여수여행 친구
          </p>

          {/* Brand name */}
          <h1
            style={{
              fontWeight:    800,
              fontSize:      '2rem',
              letterSpacing: '0.04em',
              color:         C.starlightGold,
              marginBottom:  '1rem',
              lineHeight:    1.1,
            }}
          >
            무여정
          </h1>

          {/* Brand promise */}
          <h2
            style={{
              fontWeight: 600,
              fontSize:   '1.125rem',
              color:      '#ffffff',
              lineHeight: 1.45,
              wordBreak:  'keep-all',
              marginBottom: '0.5rem',
            }}
          >
            여수가 궁금하면,<br />그냥 물어보세요.
          </h2>
          <p
            style={{
              fontSize:  '0.875rem',
              color:     'rgba(255,255,255,0.50)',
              lineHeight: 1.55,
              wordBreak:  'keep-all',
            }}
          >
            여수를 잘 아는 여행친구 SOUL이 함께 찾아볼게요.
          </p>

        </div>
      </div>

      {/* ── CONTENT ── */}
      <div
        className="max-w-md mx-auto px-4"
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >

        {/* ── SOUL INPUT — PRIMARY ACTION, pill style ── */}
        <div
          style={{
            borderRadius: '999px',
            background:   'rgba(255,255,255,0.08)',
            border:       `1.5px solid rgba(110,184,255,0.28)`,
            boxShadow:    '0 2px 20px rgba(110,184,255,0.10)',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', alignItems: 'center', padding: '4px 6px 4px 20px' }}
          >
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="여수에서 궁금한 건 뭐든 물어보세요"
              disabled={isLoading}
              // min-width:0 is critical — prevents flex child from overflowing parent in mobile Chrome
              style={{
                flex:        '1 1 0',
                minWidth:    0,
                background:  'transparent',
                color:       'white',
                fontSize:    '0.9375rem',
                outline:     'none',
                border:      'none',
                padding:     '10px 0',
                wordBreak:   'keep-all',
              }}
              className="placeholder-white placeholder-opacity-35"
            />
            {/* Send button — circular, Yeosu Blue tint */}
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              style={{
                width:        '40px',
                height:       '40px',
                borderRadius: '50%',
                flexShrink:   0,
                background:   isLoading || !inputValue.trim() ? 'rgba(110,184,255,0.15)' : 'rgba(110,184,255,0.85)',
                border:       'none',
                cursor:       isLoading || !inputValue.trim() ? 'default' : 'pointer',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     '1.125rem',
                transition:   'background 0.15s',
                marginLeft:   '8px',
              }}
              aria-label="전달"
            >
              {isLoading ? (
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>…</span>
              ) : (
                '→'
              )}
            </button>
          </form>
        </div>

        {/* ── SUGGESTION CHIPS — 2-column grid, hidden after SOUL answers ── */}
        {!soulResponse && !isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                style={{
                  padding:      '10px 12px',
                  borderRadius: '12px',
                  border:       '1px solid rgba(255,255,255,0.14)',
                  background:   'rgba(255,255,255,0.05)',
                  color:        'rgba(255,255,255,0.78)',
                  fontSize:     '0.8125rem',
                  textAlign:    'left',
                  lineHeight:   1.4,
                  cursor:       'pointer',
                  minHeight:    '44px',
                  wordBreak:    'keep-all',
                  transition:   'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(110,184,255,0.40)';
                  e.currentTarget.style.background  = 'rgba(110,184,255,0.09)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                  e.currentTarget.style.background  = 'rgba(255,255,255,0.05)';
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* ── LOADING ── */}
        {isLoading && (
          <div
            className="rounded-2xl text-center py-4"
            style={{ background: 'rgba(110,184,255,0.05)', border: '1px solid rgba(110,184,255,0.12)' }}
          >
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.48)' }}>
              SOUL이 여수 여행 정보를 찾고 있어요…
            </p>
          </div>
        )}

        {/* ── ERROR ── */}
        {errorMsg && !isLoading && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.58)', wordBreak: 'keep-all', marginBottom: '8px' }}>
              {errorMsg}
            </p>
            <button
              onClick={handleReset}
              style={{ color: C.starlightGold, opacity: 0.72, fontSize: '0.8125rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* ── SOUL ANSWER ── */}
        {soulResponse && !isLoading && (
          <SoulAnswerSummary response={soulResponse} onNewQuestion={handleReset} />
        )}

        {/* ── PLACE ENTRIES: SOUL과 먼저 둘러보기 ── */}
        <section style={{ marginTop: '4px' }}>
          <p
            style={{
              fontSize:      '0.6875rem',
              color:         'rgba(255,255,255,0.30)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom:  '10px',
            }}
          >
            SOUL과 먼저 둘러보기
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PLACE_ENTRIES.map((place) => (
              <button
                key={place.code}
                onClick={() => navigate(place.path)}
                style={{
                  width:        '100%',
                  display:      'block',
                  borderRadius: '16px',
                  overflow:     'hidden',
                  textAlign:    'left',
                  cursor:       'pointer',
                  background:   'none',
                  padding:      0,
                  border:       '1px solid rgba(255,255,255,0.10)',
                  // No transform on hover — avoids mobile overflow issues
                }}
              >
                <div
                  style={{
                    position:   'relative',
                    height:     '112px',
                    background: 'rgba(6,24,40,0.9)',
                    overflow:   'hidden',
                  }}
                >
                  <img
                    src={place.heroSrc}
                    alt={place.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {/* gradient overlay — crop is intentional, text always readable */}
                  <div
                    style={{
                      position:   'absolute',
                      inset:      0,
                      background: 'linear-gradient(to top, rgba(3,12,24,0.72) 0%, rgba(3,12,24,0.18) 60%, transparent 100%)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom:   0,
                      left:     0,
                      right:    0,
                      padding:  '0 16px 12px',
                    }}
                  >
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize:   '0.9375rem',
                        color:      '#fff',
                        wordBreak:  'keep-all',
                        lineHeight: 1.3,
                      }}
                    >
                      {place.name}
                    </p>
                    <p
                      style={{
                        fontSize:   '0.75rem',
                        color:      'rgba(255,255,255,0.52)',
                        marginTop:  '2px',
                        wordBreak:  'keep-all',
                      }}
                    >
                      {place.desc}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── FOOTER NOTE ── */}
        <div style={{ textAlign: 'center', paddingTop: '4px', paddingBottom: '1.5rem' }}>
          <p
            style={{
              fontSize:   '0.6875rem',
              color:      'rgba(255,255,255,0.20)',
              lineHeight: 1.6,
              wordBreak:  'keep-all',
            }}
          >
            SOUL은 현재 알고 있는 정보를 바탕으로 답해드려요.<br />
            최신 운영 정보는 현장에서 확인을 권장해요.
          </p>
        </div>

      </div>
    </div>
  );
}
