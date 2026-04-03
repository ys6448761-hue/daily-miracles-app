/**
 * WishInputScreen.jsx
 * OG 초대 유입 전용 — 1스크린 소원 작성 → 즉시 별 생성
 *
 * 핵심 UX 원칙:
 *  - 초기값 "조금 더 " → 완전 빈칸 이탈 방지, 커서 끝에 위치
 *  - 추천 문장 3개 고정 → 탭 1회로 입력 완료
 *  - CTA 항상 활성화 (disabled 없음)
 *  - 로그인 선요구 없음
 *  - autoFocus → 진입 즉시 키보드 (카카오 인앱: 유저 제스처 후 mount이므로 동작)
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postWish, postStarCreate, getOrCreateUserId } from '../api/dreamtown.js';
import { saveStarId } from '../lib/utils/starSession.js';
import { gaWishInputStart, gaWishCreateSubmit } from '../utils/gtag';

// ── 고정 추천 문장 3개 ──────────────────────────────────────────────
const SUGGESTIONS = [
  '조금 더 용감해지고 싶어요',
  '나 자신을 믿고 싶어요',
  '하루를 덜 불안하게 보내고 싶어요',
];

// ── 별 shimmer 위치 고정 (렌더마다 동일) ────────────────────────────
const STARS = Array.from({ length: 14 }, (_, i) => ({
  id:    i,
  size:  1 + (i % 3) * 0.7,
  top:   4  + (i * 6.8)  % 91,
  left:  2  + (i * 7.3)  % 95,
  delay: (i * 0.41) % 2.8,
  dur:   1.4 + (i * 0.19) % 1.2,
}));

// ── keyframes ───────────────────────────────────────────────────────
const STYLE = `
  @keyframes wis-twinkle {
    0%   { opacity: 0.06; transform: scale(1); }
    100% { opacity: 0.72; transform: scale(1.6); }
  }
`;

const INITIAL_TEXT = '조금 더 ';

export default function WishInputScreen({ onBack }) {
  const nav      = useNavigate();
  const inputRef = useRef(null);

  const [text, setText]       = useState(INITIAL_TEXT);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [selected, setSelected] = useState(null);
  const inputStartedRef = useRef(false); // wish_input_start 중복 방지

  // 진입 즉시 커서 끝에 위치
  // InviteIntro "시작하기" 클릭 직후 mount이므로 유저 제스처 window 안에 있음
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, []);

  // ── 칩 탭 ────────────────────────────────────────────────────────
  function handleChip(suggestion, idx) {
    setText(suggestion);
    setSelected(idx);
    setError('');
    if (!inputStartedRef.current) {
      inputStartedRef.current = true;
      gaWishInputStart({ isInvite: true, trigger: 'chip' });
    }
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  // ── 제출 ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    const trimmed = text.trim();
    // 초기값만 남은 경우 포커스로 유도 (에러 없음)
    if (!trimmed || trimmed === INITIAL_TEXT.trim()) {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      return;
    }

    gaWishCreateSubmit({ isInvite: true, wishLength: trimmed.length });
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
          wishText: trimmed,
        },
      });
    } catch (e) {
      setError(e.message || '잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const hasTyped = text.trim() !== INITIAL_TEXT.trim();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0D1B2A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '64px 24px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{STYLE}</style>

      {/* ── 배경 glow ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: focused
            ? 'radial-gradient(ellipse 80% 55% at 50% 42%, rgba(155,135,245,0.17) 0%, transparent 68%)'
            : 'transparent',
          transition: 'background 0.6s ease',
        }}
      />

      {/* ── 별 shimmer (타이핑 시 opacity 상승) ─────────────────── */}
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
            opacity: hasTyped ? 1 : 0.6,
            animation: `wis-twinkle ${s.dur}s ${s.delay}s ease-in-out infinite alternate`,
            transition: 'opacity 0.5s ease',
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
        }}
      >
        {/* 안내 레이블 */}
        <p style={{
          fontSize: 12,
          color: 'rgba(255,215,106,0.65)',
          textAlign: 'center',
          marginBottom: 20,
          letterSpacing: '0.06em',
        }}>
          ✦ 소원을 한 줄로 담아주세요
        </p>

        {/* ── 입력창 ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 12 }}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => {
              const val = e.target.value;
              setText(val);
              setError('');
              setSelected(null);
              // wish_input_start: INITIAL_TEXT 이탈 첫 감지 시 1회만 발화
              if (!inputStartedRef.current && val.trim() !== INITIAL_TEXT.trim()) {
                inputStartedRef.current = true;
                gaWishInputStart({ isInvite: true, trigger: 'manual' });
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter' && !loading) handleSubmit(); }}
            maxLength={60}
            autoComplete="off"
            inputMode="text"
            enterKeyHint="done"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                focused
                  ? 'rgba(155,135,245,0.6)'
                  : hasTyped
                  ? 'rgba(255,215,106,0.4)'
                  : 'rgba(255,255,255,0.15)'
              }`,
              borderRadius: 16,
              padding: '18px 16px',
              color: 'white',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: focused
                ? '0 0 24px 6px rgba(155,135,245,0.13)'
                : hasTyped
                ? '0 0 14px 3px rgba(255,215,106,0.09)'
                : 'none',
              transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            }}
          />
          <p style={{
            fontSize: 11,
            color: text.length > 50 ? 'rgba(255,180,100,0.75)' : 'rgba(255,255,255,0.2)',
            textAlign: 'right',
            marginTop: 5,
            transition: 'color 0.2s',
          }}>
            {text.length} / 60
          </p>
        </div>

        {/* ── 추천 문장 칩 ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
          {SUGGESTIONS.map((s, i) => (
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
          <p style={{
            fontSize: 12,
            color: 'rgba(255,110,110,0.85)',
            textAlign: 'center',
            marginBottom: 14,
            lineHeight: 1.55,
          }}>
            {error}
          </p>
        )}

        {/* ── CTA — disabled 없음, 항상 터치 가능 ──────────────── */}
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
            cursor: loading ? 'wait' : 'pointer',
            background: hasTyped ? '#FFD76A' : 'rgba(255,215,106,0.28)',
            color: hasTyped ? '#0D1B2A' : 'rgba(255,215,106,0.65)',
            boxShadow: hasTyped ? '0 0 32px 8px rgba(255,215,106,0.25)' : 'none',
            transition: 'background 0.28s ease, box-shadow 0.28s ease, color 0.28s ease',
          }}
        >
          {loading ? '별을 만드는 중...' : '별 만들기 ✦'}
        </button>

        {/* ── 뒤로가기 ─────────────────────────────────────────── */}
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
