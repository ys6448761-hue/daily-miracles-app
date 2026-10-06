/**
 * SOUL 무여정 Main Home V1
 * 여수맘 파일럿 + Founder Meeting용 프로덕션 홈
 *
 * Route: /muyojeong
 * SOUL runtime: POST /api/dt/travel/input/text (no place_code — traveler context only)
 *
 * Constraints (Founder directive):
 *   - NO schema / migration / seed / new knowledge
 *   - NO FAQ / Dynamic FAQ / Commerce / booking / analytics
 *   - NO new recommendation engine
 *   - SOUL character asset not found → CSS wave decoration (do not substitute another rendition)
 *   - STOP after verification for Founder/Lumi Visual Review
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrEnsureGuestCredential } from '../api/dreamtown.js';

// ── SOUL Answer Summary — local, same pattern as SoulCableCarPage ─────────────
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

  const lines        = response.message_ko.split('\n');
  const firstLine    = lines[0] || '';
  const sentenceEnd  = firstLine.search(/[.!?。]\s*/);
  const firstSentence = sentenceEnd >= 0 ? firstLine.slice(0, sentenceEnd + 1) : firstLine;
  const restOfFirst  = sentenceEnd >= 0 ? firstLine.slice(sentenceEnd + 1).trim() : '';
  const restLines    = [restOfFirst, ...lines.slice(1)].filter(Boolean).join('\n');

  const keyPoints  = (response.why_details?.[0]?.place_features || []).slice(0, 3);
  const nextAction = response.next_options?.[0] || null;

  return (
    <div className="rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">SOUL의 답</p>
        {onNewQuestion && (
          <button
            onClick={onNewQuestion}
            className="text-xs text-white opacity-30 hover:opacity-60 transition-opacity"
          >
            다시 물어보기
          </button>
        )}
      </div>
      <p className="text-sm font-medium text-white leading-snug">{firstSentence}</p>
      {restLines && (
        <p className="text-sm text-white opacity-70 leading-relaxed mt-1 whitespace-pre-line">{restLines}</p>
      )}
      {badge && (
        <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium border ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      {keyPoints.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {keyPoints.map((pt, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-10 text-white opacity-70">
              {pt}
            </span>
          ))}
        </div>
      )}
      {nextAction && (
        <div className="mt-3 pt-3 border-t border-white border-opacity-10">
          <p className="text-xs text-white opacity-40 mb-1">다음에 알려주세요</p>
          <p className="text-xs text-white opacity-70 leading-snug">{nextAction}</p>
        </div>
      )}
    </div>
  );
}

// ── Suggestion chips — 4 canonical pilot queries ───────────────────────────────
const SUGGESTION_CHIPS = [
  '부모님과 어디 가면 좋을까?',
  '아이와 오늘 어디 가지?',
  '차 가져가는데 동선 짜줘',
  '비 오면 어디 가면 좋아?',
];

// ── Place entries — existing Living Detail, reuse existing hero assets ──────────
// Label: "SOUL과 먼저 둘러보기" — NOT "TOP 3" / "Best 3"
// Navigation: all route to /soul/cable-car (handles cablecar/odongdo/hyangiram via SOUL switching)
const PLACE_ENTRIES = [
  {
    code:    'cablecar',
    name:    '여수해상케이블카',
    desc:    '자산 ↔ 돌산 · 편도 약 13분',
    heroSrc: '/images/soul/place-hero/cablecar.png',
    path:    '/soul/cable-car',
  },
  {
    code:    'odongdo',
    name:    '오동도',
    desc:    '방파제 길 · 동백꽃 · 동백열차',
    heroSrc: '/images/soul/place-hero/odongdo.png',
    path:    '/soul/cable-car',
  },
  {
    code:    'hyangiram',
    name:    '향일암',
    desc:    '절벽 암자 · 해돋이 · 두 갈래 길',
    heroSrc: '/images/soul/place-hero/hyangiram.png',
    path:    '/soul/cable-car',
  },
];

// ── Main page ────────────────────────────────────────────────────────────────
export default function MuyojeongHomePage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [inputValue,   setInputValue]   = useState('');
  const [sessionId,    setSessionId]    = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [soulResponse, setSoulResponse] = useState(null);
  const [errorMsg,     setErrorMsg]     = useState(null);

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
          // NO place_code — Main home sends traveler context only, not place context
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
    <div className="min-h-screen bg-night-sky text-white pb-24">

      {/* ── BRAND HEADER ── */}
      {/* Compact header: brand label + SOUL identity side-by-side to save vertical space */}
      <header className="px-4 pt-6 pb-0">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <p className="text-xs text-white opacity-25 tracking-widest uppercase leading-none mb-0.5">
              무료 여수여행정보
            </p>
            <h1 className="text-lg font-bold tracking-wide leading-none" style={{ color: '#E8D5A3' }}>
              무여정
            </h1>
          </div>
          {/* SOUL identity mark — CSS wave character. SOUL_CHARACTER_MASTER_V1.png not found in repo. */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 38% 38%, rgba(34,211,238,0.22) 0%, rgba(14,116,144,0.32) 60%, rgba(3,7,18,0.55) 100%)',
                border:     '1.5px solid rgba(34,211,238,0.28)',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>🌊</span>
            </div>
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: '1px solid rgba(232,213,163,0.14)', transform: 'scale(1.2)' }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 space-y-5 pt-5">

        {/* ── BRAND PROMISE — compact, input visible above fold on 375px+ ── */}
        <section>
          <h2 className="text-xl font-semibold text-white leading-snug mb-1">
            여수가 궁금하면,<br />그냥 물어보세요.
          </h2>
          <p className="text-sm text-white opacity-45 leading-relaxed">
            여수를 잘 아는 여행친구 SOUL이 함께 찾아볼게요.
          </p>
        </section>

        {/* ── SOUL INPUT — PRIMARY ACTION ── */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border:     '1px solid rgba(255,255,255,0.14)',
          }}
        >
          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="여수 여행 뭐든 물어보세요"
              className="flex-1 bg-transparent text-white placeholder-white placeholder-opacity-40 text-sm outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="text-sm font-semibold whitespace-nowrap hover:opacity-80 transition-opacity disabled:opacity-40"
              style={{ color: '#E8D5A3' }}
            >
              {isLoading ? '확인 중…' : '물어보기'}
            </button>
          </form>
        </div>

        {/* ── SUGGESTION CHIPS — hidden after first SOUL response ── */}
        {!soulResponse && !isLoading && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="px-3 py-2.5 rounded-full text-sm border text-white text-left leading-snug transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.18)',
                  opacity:      0.75,
                  background:   'transparent',
                  minHeight:    '40px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.opacity = '0.75'; }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* ── LOADING INDICATOR ── */}
        {isLoading && (
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm text-white opacity-50">SOUL이 여수 여행 정보를 찾고 있어요…</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {errorMsg && !isLoading && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm text-white opacity-60 mb-2">{errorMsg}</p>
            <button onClick={handleReset} className="text-xs" style={{ color: '#E8D5A3', opacity: 0.7 }}>다시 시도</button>
          </div>
        )}

        {/* ── SOUL ANSWER ── */}
        {soulResponse && !isLoading && (
          <SoulAnswerSummary response={soulResponse} onNewQuestion={handleReset} />
        )}

        {/* ── PLACE ENTRIES: SOUL과 먼저 둘러보기 ── */}
        <section>
          <p className="text-xs text-white opacity-35 uppercase tracking-wider mb-3">
            SOUL과 먼저 둘러보기
          </p>
          <div className="space-y-3">
            {PLACE_ENTRIES.map((place) => (
              <button
                key={place.code}
                onClick={() => navigate(place.path)}
                className="w-full rounded-2xl overflow-hidden text-left transition-all hover:opacity-90"
                style={{ border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <div className="relative h-28 overflow-hidden bg-blue-900 bg-opacity-30">
                  <img
                    src={place.heroSrc}
                    alt={place.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {/* gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)',
                    }}
                  />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-sm font-semibold text-white leading-snug">{place.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{place.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── FOOTER NOTE ── */}
        <div className="text-center pt-2 pb-4">
          <p className="text-xs text-white opacity-20 leading-relaxed">
            SOUL은 현재 알고 있는 정보를 바탕으로 답해드려요.<br />
            최신 운영 정보는 현장에서 확인을 권장해요.
          </p>
        </div>

      </div>
    </div>
  );
}
