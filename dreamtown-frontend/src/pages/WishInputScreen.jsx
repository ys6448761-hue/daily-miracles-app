/**
 * WishInputScreen.jsx
 * OG 초대 유입 전용 — 1스크린 소원 작성 → 즉시 별 생성
 *
 * 정책:
 *  - 로그인 선요구 없음 (getOrCreateUserId로 익명 ID 자동 생성)
 *  - gemType 자동(sapphire) / phoneNumber null — 작성 이후 수집
 *  - RED 신호: 케어 메시지 표시 후 종료
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postWish, postStarCreate, getOrCreateUserId } from '../api/dreamtown.js';
import { saveStarId } from '../lib/utils/starSession.js';

// ── placeholder 풀 ──────────────────────────────────────────────────
const PLACEHOLDER_POOL = [
  '내 작은 카페를 열고 싶어요',
  '매일 조금씩 나를 사랑하고 싶어요',
  '소중한 사람과 더 자주 연락하고 싶어요',
  '두려움 없이 새로운 시작을 하고 싶어요',
  '올해는 나를 위한 시간을 갖고 싶어요',
  '하고 싶은 것들을 하나씩 해보고 싶어요',
  '건강하게, 그리고 행복하게 살고 싶어요',
];

function pickThree() {
  return [...PLACEHOLDER_POOL]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
}

// ── 별 shimmer 위치 고정 (렌더마다 변하지 않게) ─────────────────────
const STARS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  size: 1 + (i % 3) * 0.8,
  top:  5 + (i * 9.3) % 90,
  left: 3 + (i * 11.7) % 94,
  delay: (i * 0.37) % 2.5,
}));

// ── keyframes (인라인) ────────────────────────────────────────────────
const STYLE = `
  @keyframes wis-twinkle {
    0%   { opacity: 0.08; transform: scale(1); }
    100% { opacity: 0.65; transform: scale(1.5); }
  }
  @keyframes wis-ph-fade {
    0%   { opacity: 0; }
    12%  { opacity: 1; }
    78%  { opacity: 1; }
    100% { opacity: 0; }
  }
`;

export default function WishInputScreen({ onBack }) {
  const nav     = useNavigate();
  const inputRef = useRef(null);

  const [text, setText]     = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  // 3개 placeholder 순환
  const [placeholders]   = useState(pickThree);
  const [phIdx, setPhIdx] = useState(0);

  // 진입 시 자동 포커스
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  // placeholder 2.8초마다 순환 (입력 시작 전까지)
  useEffect(() => {
    if (text) return;
    const t = setInterval(() => setPhIdx(i => (i + 1) % 3), 2800);
    return () => clearInterval(t);
  }, [text]);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) { setError('소원을 한 줄 적어주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const userId = getOrCreateUserId();
      const wishResult = await postWish({
        userId,
        wishText:    trimmed,
        gemType:     'sapphire',   // 기본값 — 후속 설정 화면에서 변경 가능
        yeosuTheme:  'night_sea',
      });

      if (wishResult.safety === 'RED') {
        setError(wishResult.care_message || '지금 이 소원을 담기 어려워요. 잠시 후 다시 시도해주세요.');
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
          starId:  star.star_id,
          starName: star.star_name,
          galaxy:  star.galaxy,
          gemType: 'sapphire',
        },
      });
    } catch (e) {
      setError(e.message || '잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!text.trim() && !loading;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0D1B2A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{STYLE}</style>

      {/* 배경 glow — 포커스/입력 시 점등 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: (focused || text)
            ? 'radial-gradient(ellipse 70% 50% at 50% 62%, rgba(155,135,245,0.13) 0%, transparent 70%)'
            : 'transparent',
          transition: 'background 0.7s ease',
        }}
      />

      {/* 별 shimmer 레이어 */}
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
            animation: `wis-twinkle ${1.6 + s.delay}s ${s.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* 콘텐츠 */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 320 }}>

        {/* 안내 레이블 */}
        <p style={{
          fontSize: 12,
          color: 'rgba(255,215,106,0.65)',
          textAlign: 'center',
          marginBottom: 22,
          letterSpacing: '0.06em',
        }}>
          ✦ 소원을 한 줄로 담아주세요
        </p>

        {/* 입력 영역 */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => { setText(e.target.value); setError(''); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleSubmit(); }}
            placeholder={placeholders[phIdx]}
            maxLength={60}
            autoComplete="off"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${focused ? 'rgba(155,135,245,0.55)' : 'rgba(255,255,255,0.13)'}`,
              borderRadius: 16,
              padding: '18px 16px',
              color: 'white',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: focused
                ? '0 0 22px 5px rgba(155,135,245,0.11)'
                : 'none',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              // placeholder 순환 — key trick으로 fade 처리
            }}
          />
          {/* 글자수 */}
          <p style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.2)',
            textAlign: 'right',
            marginTop: 6,
          }}>
            {text.length} / 60
          </p>
        </div>

        {/* 에러 */}
        {error && (
          <p style={{
            fontSize: 12,
            color: 'rgba(255,120,120,0.85)',
            textAlign: 'center',
            marginBottom: 14,
            lineHeight: 1.5,
          }}>
            {error}
          </p>
        )}

        {/* CTA — 별 만들기 */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            borderRadius: 9999,
            padding: '16px 0',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            background: canSubmit ? '#FFD76A' : 'rgba(255,215,106,0.18)',
            color: canSubmit ? '#0D1B2A' : 'rgba(255,215,106,0.4)',
            boxShadow: canSubmit ? '0 0 28px 7px rgba(255,215,106,0.22)' : 'none',
            transition: 'all 0.28s ease',
          }}
        >
          {loading ? '별을 만드는 중...' : '별 만들기 ✦'}
        </button>

        {/* 뒤로가기 */}
        <button
          onClick={onBack}
          style={{
            display: 'block',
            margin: '22px auto 0',
            fontSize: 12,
            color: 'rgba(255,255,255,0.2)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ← 돌아가기
        </button>
      </div>
    </main>
  );
}
