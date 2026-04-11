/**
 * PartnerLogin.jsx — 별들의 고향 파트너 로그인
 * 경로: /partner/login
 *
 * 모바일 375px 최적화 | Aurora5 톤
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PARTNER_JWT_KEY = 'partner_jwt';

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
  },
  logo: {
    textAlign: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    fontSize: 36,
    display: 'block',
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#9B87F5',
  },
  logoSub: {
    fontSize: 13,
    color: '#7A6E9C',
    marginTop: 4,
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: '#9B87F5',
    fontWeight: 600,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid rgba(155, 135, 245, 0.3)',
    background: 'rgba(255,255,255,0.05)',
    color: '#E8E4F0',
    fontSize: 15,
    marginBottom: 16,
    boxSizing: 'border-box',
    outline: 'none',
    WebkitAppearance: 'none',
  },
  btn: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 12,
    border: 'none',
    background: '#9B87F5',
    color: '#0D1B2A',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
  },
  error: {
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#f87171',
    marginBottom: 16,
  },
};

export default function PartnerLogin() {
  const nav = useNavigate();
  const [loginId,  setLoginId]  = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!loginId || !password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const r = await fetch('/api/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId.trim(), password }),
      });
      const d = await r.json();

      if (!r.ok) {
        setError(d.error || '로그인에 실패했어요.');
        return;
      }

      localStorage.setItem(PARTNER_JWT_KEY, d.token);
      nav('/partner/dashboard', { replace: true });

    } catch {
      setError('서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <motion.div
        style={S.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* 로고 */}
        <div style={S.logo}>
          <span style={S.logoIcon}>🏡</span>
          <div style={S.logoTitle}>별들의 고향</div>
          <div style={S.logoSub}>파트너 관리자 로그인</div>
        </div>

        <form onSubmit={handleLogin} autoComplete="on">
          {error && <div style={S.error}>{error}</div>}

          <label style={S.label} htmlFor="login_id">아이디</label>
          <input
            id="login_id"
            type="text"
            autoComplete="username"
            placeholder="DT-YS-C001"
            value={loginId}
            onChange={e => setLoginId(e.target.value)}
            style={S.input}
          />

          <label style={S.label} htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={S.input}
          />

          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
