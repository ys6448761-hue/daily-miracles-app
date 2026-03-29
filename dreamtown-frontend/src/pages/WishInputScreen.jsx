/**
 * WishInputScreen.jsx
 * OG 초대 유입 전용 — 1스크린 소원 작성 → 즉시 별 생성
 *
 * UX 원칙:
 *  - 클릭형 추천 문장 3개 → 탭 1회로 입력 완료
 *  - 로그인 선요구 없음 (익명 userId 자동 생성)
 *  - CTA 항상 터치 가능 — 빈 값 클릭 시 input focus 유도 (error 없음)
 *  - 카카오 인앱브라우저 대응: auto-focus 모바일 스킵, backdrop-filter 제거
 *  - 키보드 올라와도 CTA 보이도록 top-align 레이아웃
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postWish, postStarCreate, getOrCreateUserId } from '../api/dreamtown.js';
import { saveStarId } from '../lib/utils/starSession.js';

// ── 추천 문장 풀 ────────────────────────────────────────────────────
// 짧고 직관적 — 탭 1회로 입력 완료 가능한 길이
const SUGGESTION_POOL = [
  '내 작은 카페를 열고 싶어요',
  '매일 조금씩 나를 사랑하고 싶어요',
  '두려움 없이 새로운 시작을 하고 싶어요',
  '소중한 사람과 더 자주 연락하고 싶어요',
  '올해는 나를 위한 시간을 갖고 싶어요',
  '하고 싶은 것들을 하나씩 해보고 싶어요',
  '건강하게, 행복하게 살고 싶어요',
  '내가 원하는 일을 하며 살고 싶어요',
];

function pickThree() {
  return [...SUGGESTION_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
}

// ── placeholder 풀 (추천 문장과 독립) ─────────────────────────────
const PH_POOL = [
  '나의 소원은...',
  '이루고 싶은 것을 한 줄로',
  '소원을 적어주세요',
];

// ── 별 shimmer 위치 (렌더마다 고정) ────────────────────────────────
const STARS = Array.from({ length: 14 }, (_, i) => ({
  id:    i,
  size:  1 + (i % 3) * 0.7,
  top:   4 + (i * 6.8) % 91,
  left:  2 + (i * 7.3) % 95,
  delay: (i * 0.41) % 2.8,
  dur:   1.4 + (i * 0.19) % 1.2,
}));

// ── 카카오/모바일 인앱 감지 ─────────────────────────────────────────
const IS_MOBILE = typeof navigator !== 'undefined' &&
  /Mobi|Android|iPhone|iPad|KAKAOTALK/i.test(navigator.userAgent);

// ── keyframes ───────────────────────────────────────────────────────
const STYLE = `
  @keyframes wis-twinkle {
    0%   { opacity: 0.06; transform: scale(1); }
    100% { opacity: 0.7;  transform: scale(1.6); }
  }
  @keyframes wis-shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-4px); }
    60%       { transform: translateX(4px); }
  }
  .wis-shake { animation: wis-shake 0.28s ease; }
`;

export default function WishInputScreen({ onBack }) {
  const nav      = useNavigate();
  const inputRef = useRef(null);
  const inputWrapRef = useRef(null);

  const [text, setText]         = useState('');
  const [focused, setFocused]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [shaking, setShaking]   = useState(false);
  const [selected, setSelected] = useState(null); // 선택된 chip index

  const [suggestions] = useState(pickThree);
  const [phIdx, setPhIdx] = useState(0);

  // 데스크탑만 auto-focus (카카오 인앱/모바일은 gesture 없이 focus 불가)
  useEffect(() => {
    if (!IS_MOBILE) {
      const t = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, []);

  // placeholder 2.8s 순환 — 입력 전까지
  useEffect(() => {
    if (text) return;
    const t = setInterval(() => setPhIdx(i => (i + 1) % 3), 2800);
    return () => clearInterval(t);
  }, [text]);

  // ── 칩 탭 핸들러 ────────────────────────────────────────────────
  function handleChip(suggestion, idx) {
    setText(suggestion);
    setSelected(idx);
    setError('');
    // 유저 제스처 후 focus → 모바일도 동작
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── CTA 핸들러 ───────────────────────────────────────────────────
  async function handleSubmit() {
    const trimmed = text.trim();

    // 빈 값 → error 없이 input 포커스 + shake
    if (!trimmed) {
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userId = getOrCreateUserId();
      const wishResult = await postWish({
        userId,
        wishText:   trimmed,
        gemType:    'sapphire',
        yeosuTheme: 'night_sea',
      });

      if (wishResult.safety === 'RED') {
        setError(wishResult.care_message || '지금 이 소원을 담기 어려워요.');
        return;
      }

      const star = await postStarCreate({
        wishId:      wishResult.wish_id,
        userId,
        phoneNumber: null,
      });
      saveStarId(star.star_id);

      nav('/star-birth', {
        state: {
          starId:   star.star_id,
          starName: star.star_name,
          galaxy:   star.galaxy,
          gemType:  'sapphire',
        },
      });
    } catch (e) {
      setError(e.message || '잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const hasText = !!text.trim();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0D1B2A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '64px 24px 48px',  // top-align → 키보드 올라와도 CTA 접근 가능
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{STYLE}</style>

      {/* ── 배경 glow — 포커스/입력 시 점등 ─────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: (focused || hasText)
            ? 'radial-gradient(ellipse 80% 55% at 50% 45%, rgba(155,135,245,0.16) 0%, transparent 68%)'
            : 'transparent',
          transition: 'background 0.6s ease',
        }}
      />

      {/* ── 별 shimmer ───────────────────────────────────────────── */}
      {STARS.map(s => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            width:  s.size + 'px',
            height: s.size + 'px',
            borderRadius: '50%',
            background: '#FFD76A',
            top:  s.top  + '%',
            left: s.left + '%',
            pointerEvents: 'none',
            animation: `wis-twinkle ${s.dur}s ${s.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* ── 콘텐츠 ──────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* 안내 레이블 */}
        <p
          style={{
            fontSize: 12,
            color: 'rgba(255,215,106,0.65)',
            textAlign: 'center',
            marginBottom: 20,
            letterSpacing: '0.06em',
          }}
        >
          ✦ 소원을 한 줄로 담아주세요
        </p>

        {/* ── 입력창 ──────────────────────────────────────────── */}
        <div
          ref={inputWrapRef}
          className={shaking ? 'wis-shake' : ''}
          style={{ marginBottom: 12 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => { setText(e.target.value); setError(''); setSelected(null); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter' && !loading) handleSubmit(); }}
            placeholder={PH_POOL[phIdx]}
            maxLength={60}
            autoComplete="off"
            inputMode="text"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                focused
                  ? 'rgba(155,135,245,0.6)'
                  : hasText
                  ? 'rgba(255,215,106,0.35)'
                  : 'rgba(255,255,255,0.14)'
              }`,
              borderRadius: 16,
              padding: '18px 16px',
              color: 'white',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: focused
                ? '0 0 24px 6px rgba(155,135,245,0.13)'
                : hasText
                ? '0 0 16px 3px rgba(255,215,106,0.08)'
                : 'none',
              transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            }}
          />
          <p
            style={{
              fontSize: 11,
              color: text.length > 50 ? 'rgba(255,180,100,0.7)' : 'rgba(255,255,255,0.2)',
              textAlign: 'right',
              marginTop: 5,
              transition: 'color 0.2s',
            }}
          >
            {text.length} / 60
          </p>
        </div>

        {/* ── 추천 문장 칩 ────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 22,
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleChip(s, i)}
              style={{
                textAlign: 'left',
                padding: '11px 16px',
                borderRadius: 12,
                border: `1px solid ${
                  selected === i
                    ? 'rgba(255,215,106,0.55)'
                    : 'rgba(255,255,255,0.1)'
                }`,
                background: selected === i
                  ? 'rgba(255,215,106,0.09)'
                  : 'rgba(255,255,255,0.03)',
                color: selected === i
                  ? 'rgba(255,215,106,0.9)'
                  : 'rgba(255,255,255,0.5)',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                lineHeight: 1.4,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ── 에러 ────────────────────────────────────────────── */}
        {error && (
          <p
            style={{
              fontSize: 12,
              color: 'rgba(255,110,110,0.85)',
              textAlign: 'center',
              marginBottom: 14,
              lineHeight: 1.55,
            }}
          >
            {error}
          </p>
        )}

        {/* ── CTA — 항상 터치 가능 ────────────────────────────── */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            borderRadius: 9999,
            padding: '16px 0',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: hasText ? '#FFD76A' : 'rgba(255,215,106,0.22)',
            color: hasText ? '#0D1B2A' : 'rgba(255,215,106,0.55)',
            boxShadow: hasText ? '0 0 32px 8px rgba(255,215,106,0.24)' : 'none',
            transition: 'background 0.28s ease, box-shadow 0.28s ease, color 0.28s ease',
          }}
        >
          {loading ? '별을 만드는 중...' : '별 만들기 ✦'}
        </button>

        {/* ── 뒤로가기 ─────────────────────────────────────── */}
        <button
          onClick={onBack}
          style={{
            display: 'block',
            margin: '20px auto 0',
            fontSize: 12,
            color: 'rgba(255,255,255,0.2)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 12px',
          }}
        >
          ← 돌아가기
        </button>
      </div>
    </main>
  );
}
