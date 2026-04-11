/**
 * PartnerSubscribe.jsx — 파트너 구독 페이지
 * 경로: /partner/subscribe
 * Aurora5 톤 | "이거 안 하면 손해" 설득 구조
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const BENEFITS = [
  {
    icon: '✨',
    title: '매월 별자리 스토리 자동 생성',
    desc: '이번 달 우리 업체를 찾은 소원이들의 이야기가 자동으로 만들어져요. SNS에 바로 올릴 수 있어요.',
    metric: '월 1회 자동 발행',
  },
  {
    icon: '💌',
    title: '손님 감사 편지 자동 발송',
    desc: '방문한 소원이에게 "여수를 기억해줘서 고마워요" 메시지가 자동으로 전송돼요.',
    metric: '방문 후 24시간 이내',
  },
  {
    icon: '📊',
    title: '매출 효과 수치로 확인',
    desc: '방문자 수 성장률, 재방문율, 주문 매출을 한눈에 확인해요. 숫자로 증명되는 ROI.',
    metric: '전월 대비 성장률 표시',
  },
  {
    icon: '🏆',
    title: '지역 랭킹 노출',
    desc: '여수 지역 내 별자리 순위가 DreamTown에 표시돼요. 상위 업체는 메인 화면에 노출.',
    metric: '지역 TOP 3 메인 노출',
  },
  {
    icon: '📸',
    title: '1클릭 인스타 공유',
    desc: '별자리 스토리를 인스타그램 스토리/피드로 1번 탭으로 공유해요. 디자인 필요 없음.',
    metric: '카드 자동 생성 포함',
  },
];

const S = {
  page:    { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', paddingBottom: 120 },
  header:  { background: 'rgba(155,135,245,0.08)', borderBottom: '1px solid rgba(155,135,245,0.15)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#9B87F5' },

  // 히어로
  hero:    { padding: '36px 24px 28px', textAlign: 'center' },
  heroEyebrow: { fontSize: 11, fontWeight: 700, color: '#9B87F5', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 },
  heroHeadline: { fontSize: 28, fontWeight: 900, color: '#E8E4F0', lineHeight: 1.25, marginBottom: 10 },
  heroSub: { fontSize: 14, color: '#C4BAE0', lineHeight: 1.7, marginBottom: 24 },
  heroPriceBox: { display: 'inline-block', background: 'rgba(155,135,245,0.12)', border: '1px solid rgba(155,135,245,0.3)', borderRadius: 14, padding: '14px 28px' },
  heroPriceLabel: { fontSize: 12, color: '#9B87F5', marginBottom: 4 },
  heroPrice: { fontSize: 32, fontWeight: 900, color: '#FFD700' },
  heroPriceSub: { fontSize: 12, color: '#7A6E9C', marginTop: 4 },

  // 혜택 리스트
  benefitList: { padding: '0 20px' },
  benefitItem: { display: 'flex', gap: 14, padding: '16px 0', borderBottom: '1px solid rgba(155,135,245,0.08)' },
  benefitIcon: { fontSize: 24, flexShrink: 0, width: 36, textAlign: 'center', paddingTop: 2 },
  benefitBody: { flex: 1 },
  benefitTitle: { fontSize: 14, fontWeight: 700, color: '#E8E4F0', marginBottom: 4 },
  benefitDesc: { fontSize: 12, color: '#C4BAE0', lineHeight: 1.7, marginBottom: 6 },
  benefitMetric: { display: 'inline-block', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#34d399', fontWeight: 600 },

  // 손해 배너
  lossBanner: { margin: '24px 20px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 14, padding: '18px 16px' },
  lossTitle:  { fontSize: 15, fontWeight: 800, color: '#f87171', marginBottom: 10 },
  lossItem:   { fontSize: 13, color: '#C4BAE0', lineHeight: 1.8, paddingLeft: 4 },

  // 소셜 증명
  proofBox:   { margin: '0 20px 24px', background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.12)', borderRadius: 14, padding: '16px' },
  proofTitle: { fontSize: 12, fontWeight: 700, color: '#9B87F5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  proofStat:  { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  proofKey:   { fontSize: 13, color: '#C4BAE0' },
  proofVal:   { fontSize: 14, fontWeight: 800, color: '#E8E4F0' },

  // 구독 중 상태
  activeBox:  { margin: '20px 20px 0', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 14, padding: '18px 16px' },
  activeTitle:{ fontSize: 15, fontWeight: 700, color: '#34d399', marginBottom: 8 },
  activeSub:  { fontSize: 13, color: '#C4BAE0', marginBottom: 16 },
  cancelBtn:  { background: 'none', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 20px', color: '#f87171', fontSize: 13, cursor: 'pointer' },

  // 고정 하단
  stickyBar:  { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 448, padding: '12px 20px 28px', background: 'rgba(13,27,42,0.97)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(155,135,245,0.15)' },
  subBtn:     { width: '100%', padding: '17px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #9B87F5 0%, #7c6ee0 100%)', color: '#0D1B2A', fontSize: 17, fontWeight: 900, cursor: 'pointer', letterSpacing: 0.3 },
  subBtnNote: { textAlign: 'center', fontSize: 11, color: '#7A6E9C', marginTop: 8 },
  error:      { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 10 },
};

function fmtPrice(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
function fmtDate(s) {
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

export default function PartnerSubscribe() {
  const nav = useNavigate();
  const jwt = localStorage.getItem('partner_jwt');

  const [sub,      setSub]      = useState(null);   // 구독 상태
  const [stats,    setStats]    = useState(null);   // 효과 통계
  const [loading,  setLoading]  = useState(true);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error,    setError]    = useState('');
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    if (!jwt) { nav('/partner/login'); return; }
    const h = { Authorization: `Bearer ${jwt}` };
    Promise.all([
      fetch('/api/partner/subscription',       { headers: h }).then(r => r.json()),
      fetch('/api/partner/subscription/stats', { headers: h }).then(r => r.json()).catch(() => null),
    ]).then(([subData, statsData]) => {
      setSub(subData);
      setStats(statsData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleStart() {
    setStarting(true); setError('');
    try {
      const r = await fetch('/api/partner/subscription/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ payment_key: 'DEMO' }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || '처리 실패'); return; }
      setSub({ subscribed: true, expires_at: d.expires_at, days_left: 31 });
    } catch { setError('서버 오류가 발생했어요.'); }
    finally { setStarting(false); }
  }

  async function handleCancel() {
    setCancelling(true); setError('');
    try {
      const r = await fetch('/api/partner/subscription/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || '취소 실패'); return; }
      setSub(prev => ({ ...prev, cancelled: true }));
      setShowCancel(false);
    } catch { setError('서버 오류가 발생했어요.'); }
    finally { setCancelling(false); }
  }

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A6E9C' }}>
      불러오는 중...
    </div>
  );

  const isSubscribed = sub?.subscribed && !sub?.cancelled;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={{ background: 'none', border: 'none', color: '#9B87F5', cursor: 'pointer', fontSize: 20 }} onClick={() => nav('/partner/dashboard')}>←</button>
        <span style={S.headerTitle}>파트너 프리미엄</span>
      </div>

      {/* 히어로 */}
      <motion.div style={S.hero} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={S.heroEyebrow}>DreamTown Partner Premium</div>
        <div style={S.heroHeadline}>
          이거 안 하면<br />손해예요
        </div>
        <div style={S.heroSub}>
          별자리가 손님을 불러오고,<br />
          감사 편지가 재방문을 만들어요.<br />
          사장님이 할 일은 <strong style={{ color: '#9B87F5' }}>아무것도 없어요</strong>.
        </div>
        <div style={S.heroPriceBox}>
          <div style={S.heroPriceLabel}>월 구독료</div>
          <div style={S.heroPrice}>30,000원</div>
          <div style={S.heroPriceSub}>VAT 포함 · 언제든 취소 가능</div>
        </div>
      </motion.div>

      {/* 구독 중이면 효과 통계 표시 */}
      {isSubscribed && stats && (
        <motion.div style={S.proofBox} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div style={S.proofTitle}>내 구독 효과</div>
          <div style={S.proofStat}>
            <span style={S.proofKey}>이번 달 방문</span>
            <span style={S.proofVal}>
              {stats.visits.this_month}명
              {stats.visits.growth_pct != null && (
                <span style={{ fontSize: 12, color: stats.visits.growth_pct >= 0 ? '#34d399' : '#f87171', marginLeft: 6 }}>
                  {stats.visits.growth_pct >= 0 ? '▲' : '▼'}{Math.abs(stats.visits.growth_pct)}%
                </span>
              )}
            </span>
          </div>
          <div style={S.proofStat}>
            <span style={S.proofKey}>이번 달 매출</span>
            <span style={S.proofVal}>{fmtPrice(stats.sales.this_month)}</span>
          </div>
          {stats.ranking.rank && (
            <div style={S.proofStat}>
              <span style={S.proofKey}>지역 랭킹</span>
              <span style={{ ...S.proofVal, color: stats.ranking.rank <= 3 ? '#FFD700' : '#E8E4F0' }}>
                {stats.ranking.rank}위 / {stats.ranking.total}개 업체
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* 5가지 혜택 */}
      <div style={S.benefitList}>
        {BENEFITS.map((b, i) => (
          <motion.div
            key={b.title}
            style={S.benefitItem}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
          >
            <div style={S.benefitIcon}>{b.icon}</div>
            <div style={S.benefitBody}>
              <div style={S.benefitTitle}>{b.title}</div>
              <div style={S.benefitDesc}>{b.desc}</div>
              <span style={S.benefitMetric}>{b.metric}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 안 하면 손해 배너 */}
      {!isSubscribed && (
        <motion.div style={S.lossBanner} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <div style={S.lossTitle}>구독 안 하면 이걸 놓쳐요</div>
          <div style={S.lossItem}>❌ 방문한 손님, 연락처도 없이 그냥 떠나요</div>
          <div style={S.lossItem}>❌ 경쟁 업체는 랭킹에 노출, 내 업체는 없어요</div>
          <div style={S.lossItem}>❌ 스토리 콘텐츠 직접 만들어야 해요 (시간 낭비)</div>
          <div style={S.lossItem}>❌ 재방문율 0% — 한번 오고 안 와요</div>
        </motion.div>
      )}

      {/* 구독 중 상태 + 취소 */}
      {isSubscribed && (
        <div style={{ padding: '0 20px 24px' }}>
          <div style={S.activeBox}>
            <div style={S.activeTitle}>✅ 프리미엄 구독 중</div>
            <div style={S.activeSub}>
              만료일: {sub.expires_at ? fmtDate(sub.expires_at) : '—'}
              {sub.days_left > 0 && ` (${sub.days_left}일 남음)`}
            </div>
            <button style={S.cancelBtn} onClick={() => setShowCancel(true)}>구독 취소</button>
          </div>
        </div>
      )}

      {error && <div style={{ ...S.error, margin: '0 20px 12px' }}>{error}</div>}

      {/* 취소 확인 모달 */}
      <AnimatePresence>
        {showCancel && (
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 999 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowCancel(false)}
          >
            <motion.div
              style={{ width: '100%', maxWidth: 448, margin: '0 auto', background: '#1a2a3a', borderRadius: '16px 16px 0 0', padding: '24px 20px 40px' }}
              initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E8E4F0', marginBottom: 10 }}>구독을 취소할까요?</div>
              <div style={{ fontSize: 13, color: '#C4BAE0', lineHeight: 1.7, marginBottom: 20 }}>
                만료일까지는 모든 혜택이 유지됩니다.<br />
                취소해도 현재 달은 환불되지 않아요.
              </div>
              <button
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#f87171', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}
                onClick={handleCancel} disabled={cancelling}
              >
                {cancelling ? '처리 중...' : '네, 취소할게요'}
              </button>
              <button
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1px solid rgba(155,135,245,0.3)', background: 'transparent', color: '#9B87F5', fontSize: 14, cursor: 'pointer' }}
                onClick={() => setShowCancel(false)}
              >
                계속 쓸게요
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 구독 CTA 고정 하단 */}
      {!isSubscribed && (
        <div style={S.stickyBar}>
          {error && <div style={S.error}>{error}</div>}
          <motion.button
            style={S.subBtn}
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            disabled={starting}
          >
            {starting ? '처리 중...' : '월 30,000원으로 시작하기 →'}
          </motion.button>
          <div style={S.subBtnNote}>언제든 취소 가능 · 즉시 모든 혜택 활성화</div>
        </div>
      )}
    </div>
  );
}
