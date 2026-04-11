/**
 * PartnerApplyResult.jsx — 파트너 신청 결과 화면
 * 경로: /partner/apply/result
 * verdict: approved | rejected | manual | pending
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const VERDICT_CONFIG = {
  approved: {
    icon:    '🌟',
    title:   '파트너로 승인됐어요!',
    color:   '#FFD700',
    border:  'rgba(255,215,0,0.35)',
    bg:      'rgba(255,215,0,0.07)',
    message: (name, loginId) =>
      `${name} 사장님, 환영해요!\n문자로 로그인 정보를 보내드렸어요.\n\nID: ${loginId || '발급 중...'}`,
    cta:     '파트너 로그인 →',
    ctaPath: '/partner/login',
  },
  manual: {
    icon:    '⏳',
    title:   '조금 더 확인이 필요해요',
    color:   '#FBBF24',
    border:  'rgba(251,191,36,0.35)',
    bg:      'rgba(251,191,36,0.06)',
    message: (name) =>
      `${name} 사장님, 신청해 주셔서 감사해요!\n담당자가 직접 확인 후 24시간 내로 연락드릴게요.`,
    cta:     '홈으로 →',
    ctaPath: '/',
  },
  rejected: {
    icon:    '💫',
    title:   '이번엔 함께하기 어렵게 됐어요',
    color:   '#9B87F5',
    border:  'rgba(155,135,245,0.3)',
    bg:      'rgba(155,135,245,0.06)',
    message: (name) =>
      `${name} 사장님, 신청해 주셔서 감사해요.\n별들의 고향과 더 잘 맞는 공간을 찾고 있어요.\n3개월 후 재신청을 환영해요.`,
    cta:     '처음으로 →',
    ctaPath: '/',
  },
  pending: {
    icon:    '✦',
    title:   '심사 중이에요',
    color:   '#9B87F5',
    border:  'rgba(155,135,245,0.3)',
    bg:      'rgba(155,135,245,0.06)',
    message: (name) =>
      `${name} 사장님, 신청이 접수됐어요!\n곧 심사 결과를 문자로 알려드릴게요.`,
    cta:     '홈으로 →',
    ctaPath: '/',
  },
};

export default function PartnerApplyResult() {
  const { state } = useLocation();
  const nav = useNavigate();

  const verdict      = state?.verdict        || 'pending';
  const businessName = state?.business_name  || '사장님';
  const loginId      = state?.loginId        || null;

  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.pending;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1B2A',
      fontFamily: "'Noto Sans KR', sans-serif",
      color: '#E8E4F0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}
      >
        <div style={{ fontSize: 64, marginBottom: 20 }}>{config.icon}</div>

        <div style={{
          background: config.bg,
          border:     `1px solid ${config.border}`,
          borderRadius: 20,
          padding: '24px 20px',
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: config.color, marginBottom: 16, lineHeight: 1.4 }}>
            {config.title}
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
            {config.message(businessName, loginId)}
          </p>
        </div>

        {verdict === 'approved' && loginId && (
          <div style={{
            background: 'rgba(155,135,245,0.08)',
            border: '1px solid rgba(155,135,245,0.2)',
            borderRadius: 14,
            padding: '16px',
            marginBottom: 20,
            textAlign: 'left',
          }}>
            <div style={{ fontSize: 11, color: '#9B87F5', fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>
              로그인 정보
            </div>
            <div style={{ fontSize: 13, color: '#C4BAE0', marginBottom: 6 }}>
              ID: <span style={{ color: '#FFD700', fontWeight: 700, fontFamily: 'monospace' }}>{loginId}</span>
            </div>
            <div style={{ fontSize: 12, color: '#7A6E9C' }}>
              임시 비밀번호는 SMS로 발송됐어요
            </div>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => nav(config.ctaPath)}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 14,
            border: 'none',
            background: config.color === '#FFD700' ? '#9B87F5' : config.color,
            color: '#0D1B2A',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {config.cta}
        </motion.button>

        {verdict === 'rejected' && (
          <p style={{ fontSize: 12, color: '#7A6E9C', marginTop: 16, lineHeight: 1.6 }}>
            다른 문의: app.dailymiracles.kr
          </p>
        )}
      </motion.div>
    </div>
  );
}
