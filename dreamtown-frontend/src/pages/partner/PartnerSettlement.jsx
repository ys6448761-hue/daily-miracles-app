/**
 * PartnerSettlement.jsx — 파트너 정산 내역
 * 경로: /partner/settlement
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const STATUS_LABEL = {
  pending:    { text: '정산 대기', color: '#60a5fa' },
  processing: { text: '처리중',   color: '#FFD700' },
  completed:  { text: '입금완료', color: '#34d399' },
};

const S = {
  page:   { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', paddingBottom: 40 },
  header: { background: 'rgba(155,135,245,0.08)', borderBottom: '1px solid rgba(155,135,245,0.15)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#9B87F5' },
  thisMonth: { margin: '16px 20px', background: 'rgba(155,135,245,0.08)', border: '1px solid rgba(155,135,245,0.2)', borderRadius: 14, padding: '20px 16px' },
  tmLabel:   { fontSize: 11, color: '#9B87F5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  tmRow:     { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  tmKey:     { fontSize: 13, color: '#C4BAE0' },
  tmVal:     { fontSize: 14, fontWeight: 700, color: '#E8E4F0' },
  tmTotal:   { display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(155,135,245,0.1)', marginTop: 4 },
  tmTotalKey:{ fontSize: 13, color: '#C4BAE0' },
  tmTotalVal:{ fontSize: 22, fontWeight: 800, color: '#FFD700' },
  sectionTitle:{ fontSize: 12, color: '#9B87F5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '16px 20px 8px' },
  card:   { margin: '0 20px 8px', background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.12)', borderRadius: 12, padding: '14px 16px' },
  cardRow:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  month:  { fontSize: 14, fontWeight: 700, color: '#E8E4F0' },
  statusPill:(color) => ({ fontSize: 11, fontWeight: 700, color, background: color + '22', padding: '3px 8px', borderRadius: 10 }),
  subRow: { display: 'flex', justifyContent: 'space-between', marginTop: 6 },
  subKey: { fontSize: 12, color: '#7A6E9C' },
  subVal: { fontSize: 13, fontWeight: 700, color: '#9B87F5' },
  amt:    { fontSize: 16, fontWeight: 800, color: '#FFD700' },
  emptyBox: { textAlign: 'center', padding: '40px 20px', color: '#7A6E9C', fontSize: 13 },
  infoBox:{ margin: '16px 20px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#34d399', lineHeight: 1.6 },
};

function fmtPrice(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
function fmtMonth(s) {
  const d = new Date(s);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export default function PartnerSettlement() {
  const nav = useNavigate();
  const jwt = localStorage.getItem('partner_jwt');

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jwt) { nav('/partner/login'); return; }
    fetch('/api/partner/settlement', {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then(r => { if (r.status === 401) { nav('/partner/login'); return null; } return r.json(); })
      .then(d => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={{ background: 'none', border: 'none', color: '#9B87F5', cursor: 'pointer', fontSize: 20 }} onClick={() => nav('/partner/dashboard')}>←</button>
        <span style={S.headerTitle}>정산 내역</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#7A6E9C' }}>불러오는 중...</div>
      ) : data ? (
        <>
          {/* 이번 달 실시간 집계 */}
          <motion.div style={S.thisMonth} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={S.tmLabel}>{fmtMonth(data.current_month.month)} 현황</div>
            <div style={S.tmRow}>
              <span style={S.tmKey}>총 매출</span>
              <span style={S.tmVal}>{fmtPrice(data.current_month.total_sales)}</span>
            </div>
            <div style={S.tmRow}>
              <span style={S.tmKey}>주문 건수</span>
              <span style={S.tmVal}>{data.current_month.order_count}건</span>
            </div>
            <div style={S.tmRow}>
              <span style={S.tmKey}>플랫폼 수수료 (15%)</span>
              <span style={S.tmVal}>{fmtPrice(data.current_month.total_sales - data.current_month.partner_amount)}</span>
            </div>
            <div style={S.tmTotal}>
              <span style={S.tmTotalKey}>내 수익 (85%)</span>
              <span style={S.tmTotalVal}>{fmtPrice(data.current_month.partner_amount)}</span>
            </div>
          </motion.div>

          <div style={S.infoBox}>
            💡 정산은 매월 말일 기준으로 다음 달 10일에 등록 계좌로 입금됩니다.
          </div>

          {/* 이전 정산 내역 */}
          {data.settlements && data.settlements.length > 0 && (
            <>
              <div style={S.sectionTitle}>이전 정산</div>
              {data.settlements.map((s, i) => {
                const st = STATUS_LABEL[s.status] || STATUS_LABEL.pending;
                return (
                  <motion.div
                    key={s.id}
                    style={S.card}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div style={S.cardRow}>
                      <span style={S.month}>{fmtMonth(s.settlement_month)}</span>
                      <span style={S.statusPill(st.color)}>{st.text}</span>
                    </div>
                    <div style={S.subRow}>
                      <span style={S.subKey}>주문 {s.order_count}건 · 총 매출 {fmtPrice(s.total_sales)}</span>
                      <span style={S.amt}>{fmtPrice(s.partner_amount)}</span>
                    </div>
                    {s.bank_name && s.account_number && (
                      <div style={{ fontSize: 11, color: '#7A6E9C', marginTop: 4 }}>
                        {s.bank_name} {s.account_number}
                        {s.paid_at && ` · ${new Date(s.paid_at).toLocaleDateString('ko-KR')} 입금`}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}

          {data.settlements?.length === 0 && (
            <div style={S.emptyBox}>
              아직 정산 내역이 없어요<br />
              <span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>이번 달 주문 이후 다음 달에 첫 정산이 생성됩니다</span>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: '#f87171' }}>데이터를 불러올 수 없어요</div>
      )}
    </div>
  );
}
