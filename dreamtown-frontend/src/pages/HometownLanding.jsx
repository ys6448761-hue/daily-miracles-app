/**
 * HometownLanding.jsx — 별의 고향 QR 스캔 랜딩
 * 경로: /hometown?partner=HT_xxx
 *
 * 모바일 375px 최적화 | Aurora5 톤 (#9B87F5, #0D1B2A)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { postWish, postStarCreate, getOrCreateUserId } from '../api/dreamtown.js';
import { saveStarId } from '../lib/utils/starSession.js';

// ── 공통 스타일 ──────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#0D1B2A',
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
    borderRadius: 20,
    padding: '36px 24px',
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#E8E4F0',
    lineHeight: 1.4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9B87F5',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  body: {
    fontSize: 15,
    color: '#C4BAE0',
    lineHeight: 1.7,
    marginBottom: 28,
  },
  partnerName: {
    fontSize: 24,
    fontWeight: 800,
    color: '#9B87F5',
    marginBottom: 4,
  },
  partnerAddress: {
    fontSize: 13,
    color: '#7A6E9C',
    marginBottom: 20,
  },
  starName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#FFD700',
    marginBottom: 16,
  },
  visitBadge: {
    display: 'inline-block',
    background: 'rgba(155, 135, 245, 0.15)',
    border: '1px solid rgba(155, 135, 245, 0.3)',
    borderRadius: 20,
    padding: '6px 16px',
    fontSize: 13,
    color: '#9B87F5',
    marginBottom: 20,
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '14px 0',
    borderRadius: 12,
    border: 'none',
    background: '#9B87F5',
    color: '#0D1B2A',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
  btnSecondary: {
    display: 'block',
    width: '100%',
    padding: '12px 0',
    borderRadius: 12,
    border: '1px solid rgba(155, 135, 245, 0.4)',
    background: 'transparent',
    color: '#9B87F5',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#f87171',
    marginTop: 16,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#9B87F5',
    display: 'inline-block',
    margin: '0 4px',
  },
};

// ── 별빛 파티클 (first_visit 축하 애니메이션) ──────────────────────
function StarParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div style={{ position: 'relative', height: 80, marginBottom: 16 }}>
      {particles.map(i => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale:   [0, 1.2, 0.6],
            x:       (Math.cos((i / 12) * Math.PI * 2) * 60),
            y:       (Math.sin((i / 12) * Math.PI * 2) * 60),
          }}
          transition={{ duration: 1.5, delay: i * 0.08, repeat: Infinity, repeatDelay: 2 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#9B87F5' : '#E8E4F0',
            marginTop: -3,
            marginLeft: -3,
          }}
        />
      ))}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 36 }}>
        ✨
      </div>
    </div>
  );
}

// ── 밝기 상승 애니메이션 (revisit) ────────────────────────────────
function BrightnessRise() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0.5 }}
      animate={{ scale: [0.8, 1.15, 1.0], opacity: [0.5, 1, 0.9] }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{ fontSize: 48, marginBottom: 16 }}
    >
      🌟
    </motion.div>
  );
}

// ── 로딩 UI ────────────────────────────────────────────────────────
function LoadingView() {
  return (
    <div style={S.page}>
      <motion.div
        style={S.card}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ marginBottom: 20 }}>
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              style={S.loadingDot}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        <div style={S.body}>별의 고향을 찾고 있어요...</div>
      </motion.div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────
export default function HometownLanding() {
  const nav = useNavigate();
  const [state, setState] = useState('loading');
  // loading | need_star | first_visit | revisit | already_hometown | error
  const [data, setData] = useState({});

  // 인라인 소원 입력 상태 (need_star 상태에서 사용)
  const [wishText,    setWishText]    = useState('');
  const [wishLoading, setWishLoading] = useState(false);
  const [wishError,   setWishError]   = useState('');

  useEffect(() => {
    const partnerCode = new URLSearchParams(window.location.search).get('partner');
    const userId = localStorage.getItem('dt_user_id');

    if (!partnerCode) {
      setState('error');
      setData({ message: 'QR 코드가 올바르지 않아요' });
      return;
    }

    fetch('/api/hometown/arrive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_code: partnerCode, user_id: userId || undefined }),
    })
      .then(r => r.json())
      .then(d => {
        // need_login → need_star로 통합 (인라인 소원 입력)
        if (d.status === 'need_login') {
          setState('need_star');
        } else {
          setState(d.status || 'error');
        }
        setData(d);
      })
      .catch(() => {
        setState('error');
        setData({ message: '서버 연결에 실패했어요' });
      });
  }, []);

  // 인라인 소원 제출 → 별 탄생 → 고향 자동 확정
  async function handleWishSubmit(e) {
    e.preventDefault();
    if (!wishText.trim()) { setWishError('소원을 입력해주세요.'); return; }
    setWishLoading(true);
    setWishError('');
    const partnerCode = new URLSearchParams(window.location.search).get('partner');
    try {
      const userId = getOrCreateUserId();
      const wishResult = await postWish({ userId, wishText: wishText.trim(), gemType: 'sapphire', yeosuTheme: 'night_sea' });
      if (wishResult.safety === 'RED') { setWishError(wishResult.care_message || '입력 내용을 확인해주세요.'); return; }

      const star = await postStarCreate({ wishId: wishResult.wish_id, userId, phoneNumber: null });
      saveStarId(star.star_id);

      // 고향 자동 확정 (fire-and-forget)
      if (partnerCode) {
        fetch('/api/hometown/arrive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partner_code: partnerCode, user_id: userId }),
        }).catch(() => {});
      }

      nav(star.next ?? '/star-birth', {
        state: { starId: star.star_id, starName: star.star_name, galaxy: star.galaxy, gemType: 'sapphire', userId, day1: star.day1, wishText: wishText.trim() },
      });
    } catch (err) {
      setWishError(err.message || '별 탄생에 실패했어요. 다시 시도해주세요.');
    } finally {
      setWishLoading(false);
    }
  }

  if (state === 'loading') return <LoadingView />;

  // ── need_login ──────────────────────────────────────────────────
  if (state === 'need_login') {
    return (
      <div style={S.page}>
        <motion.div style={S.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏡</div>
          {data.partner && (
            <>
              <div style={S.partnerName}>{data.partner.name}</div>
              {data.partner.address && <div style={S.partnerAddress}>{data.partner.address}</div>}
            </>
          )}
          <div style={S.title}>별의 고향에 오신 걸 환영해요</div>
          <div style={S.body}>
            이 고향에 별을 심으려면<br />
            먼저 소원이가 되어야 해요
          </div>
          <button style={S.btn} onClick={() => nav('/wish')}>
            소원 만들러 가기
          </button>
        </motion.div>
      </div>
    );
  }

  // ── need_star — 인라인 소원 입력 ────────────────────────────────
  if (state === 'need_star') {
    return (
      <div style={S.page}>
        <motion.div style={S.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#9B87F5', marginBottom: 4 }}>
            여기서 별이 태어납니다
          </div>
          {data.partner?.name && (
            <div style={{ fontSize: 20, fontWeight: 800, color: '#E8E4F0', marginBottom: 16 }}>
              {data.partner.name}에서
            </div>
          )}
          <div style={{ fontSize: 13, color: '#7A6E9C', marginBottom: 20, lineHeight: 1.6 }}>
            지금 소원을 입력하면<br />
            이곳이 당신 별의 고향이 됩니다
          </div>
          <form onSubmit={handleWishSubmit}>
            <textarea
              value={wishText}
              onChange={e => { setWishText(e.target.value); setWishError(''); }}
              placeholder="마음속 소원을 적어주세요&#10;예: 더 용감해지고 싶어요"
              maxLength={200}
              rows={4}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(155,135,245,0.3)',
                background: 'rgba(255,255,255,0.04)', color: '#E8E4F0', fontSize: 14,
                lineHeight: 1.65, resize: 'none', outline: 'none', boxSizing: 'border-box',
                marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif",
              }}
            />
            <div style={{ fontSize: 11, color: '#5a5370', textAlign: 'right', marginBottom: wishError ? 8 : 16 }}>
              {wishText.length}/200
            </div>
            {wishError && (
              <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12, lineHeight: 1.5 }}>{wishError}</div>
            )}
            <button
              type="submit"
              disabled={wishLoading || !wishText.trim()}
              style={{
                ...S.btn,
                background: (wishText.trim() && !wishLoading) ? '#9B87F5' : 'rgba(155,135,245,0.2)',
                color: (wishText.trim() && !wishLoading) ? '#0D1B2A' : '#7A6E9C',
                cursor: (wishText.trim() && !wishLoading) ? 'pointer' : 'default',
              }}
            >
              {wishLoading ? '별 탄생 중...' : '별 탄생시키기 ✨'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── first_visit ─────────────────────────────────────────────────
  if (state === 'first_visit') {
    return (
      <div style={S.page}>
        <motion.div style={S.card} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <StarParticles />
          {data.partner && <div style={S.partnerName}>{data.partner.name}</div>}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div style={S.title}>
              {data.partner?.name
                ? `${data.partner.name}이(가) 당신 별의 고향이 되었습니다`
                : '고향이 생겼어요!'}
            </div>
            {data.star?.star_name && (
              <div style={S.starName}>★ {data.star.star_name}</div>
            )}
            <div style={S.body}>
              이곳을 방문할 때마다<br />
              별이 조금씩 더 밝아질 거예요
            </div>
          </motion.div>
          {data.star?.id && (
            <button style={S.btn} onClick={() => nav(`/my-star/${data.star.id}`)}>
              내 별 보러 가기
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── revisit ─────────────────────────────────────────────────────
  if (state === 'revisit') {
    const visitCount = data.visit_count ?? 1;
    const returnMessages = [
      '돌아왔군요. 별이 기다리고 있었어요 ✨',
      '고향의 빛이 조금 더 밝아졌어요 🌟',
      `${visitCount}번째 귀환이에요. 별이 성장했습니다 ⭐`,
    ];
    const returnMsg = visitCount >= 5
      ? returnMessages[2]
      : visitCount >= 2
        ? returnMessages[1]
        : returnMessages[0];

    return (
      <div style={S.page}>
        <motion.div style={S.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* 귀환 sparkle 애니메이션 */}
          <StarParticles />
          {/* 별 밝기 상승 */}
          <BrightnessRise />
          {data.partner && <div style={S.partnerName}>{data.partner.name}</div>}
          {/* 오럼 귀환 메시지 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: 15, color: '#C4BAE0', marginBottom: 12, lineHeight: 1.6 }}
          >
            {returnMsg}
          </motion.div>
          {data.star?.star_name && (
            <div style={S.starName}>★ {data.star.star_name}</div>
          )}
          <div style={S.visitBadge}>
            {visitCount}번째 방문
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              height: 4,
              background: 'linear-gradient(90deg, #9B87F5, #FFD700)',
              borderRadius: 2,
              marginBottom: 24,
              transformOrigin: 'left',
            }}
          />
          {data.star?.id && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              style={{ ...S.btn, background: 'linear-gradient(135deg, #9B87F5, #B8A8FF)' }}
              onClick={() => nav(`/my-star/${data.star.id}`)}
            >
              ✨ 내 별 확인하기
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── already_hometown ────────────────────────────────────────────
  if (state === 'already_hometown') {
    return (
      <div style={S.page}>
        <motion.div style={S.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🌍</div>
          <div style={S.title}>
            {data.partner?.name
              ? `당신의 별은 이미 ${data.partner.name}의 별이에요`
              : '이미 고향이 있어요'}
          </div>
          {data.partner?.address && (
            <div style={S.partnerAddress}>{data.partner.address}</div>
          )}
          <div style={S.body}>
            고향은 하나뿐입니다<br />
            <span style={{ color: '#7A6E9C', fontSize: 13 }}>별은 처음 심긴 고향에서만 빛날 수 있어요</span>
          </div>
          {data.star?.id && (
            <button style={S.btnSecondary} onClick={() => nav(`/my-star/${data.star.id}`)}>
              내 별 보러 가기
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── error ───────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={S.title}>문제가 생겼어요</div>
        <div style={S.errorText}>{data.message || '알 수 없는 오류입니다'}</div>
        <button style={{ ...S.btnSecondary, marginTop: 24 }} onClick={() => nav('/')}>
          홈으로 가기
        </button>
      </motion.div>
    </div>
  );
}
