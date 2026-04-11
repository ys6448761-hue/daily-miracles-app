/**
 * PartnerOrders.jsx — 파트너 주문 관리
 * 경로: /partner/orders
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_LABEL = {
  paid:      { text: '신규주문', color: '#FFD700' },
  preparing: { text: '준비중',   color: '#60a5fa' },
  shipped:   { text: '배송중',   color: '#34d399' },
  delivered: { text: '배송완료', color: '#7A6E9C' },
  cancelled: { text: '취소됨',   color: '#f87171' },
};

const S = {
  page:     { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', paddingBottom: 40 },
  header:   { background: 'rgba(155,135,245,0.08)', borderBottom: '1px solid rgba(155,135,245,0.15)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#9B87F5' },
  newBadge: { background: '#FFD700', color: '#0D1B2A', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 10 },
  filterRow:{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' },
  filterBtn:(active) => ({ padding: '6px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', background: active ? '#9B87F5' : 'rgba(155,135,245,0.1)', color: active ? '#0D1B2A' : '#9B87F5' }),
  emptyBox: { textAlign: 'center', padding: '60px 20px', color: '#7A6E9C', fontSize: 14 },
  card:     { margin: '0 20px 10px', background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.12)', borderRadius: 14, overflow: 'hidden' },
  cardHead: { padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(155,135,245,0.08)' },
  cardDate: { fontSize: 12, color: '#7A6E9C' },
  statusPill:(color) => ({ fontSize: 11, fontWeight: 700, color, background: color + '22', padding: '3px 8px', borderRadius: 10 }),
  cardBody: { padding: '14px 16px' },
  prodName: { fontSize: 14, fontWeight: 700, color: '#E8E4F0', marginBottom: 4 },
  prodMeta: { fontSize: 12, color: '#7A6E9C', marginBottom: 8 },
  amt:      { fontSize: 15, fontWeight: 800, color: '#FFD700' },
  divider:  { height: 1, background: 'rgba(155,135,245,0.08)', margin: '10px 0' },
  deliveryRow:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid rgba(155,135,245,0.06)' },
  dName:    { fontSize: 13, color: '#E8E4F0', fontWeight: 600 },
  dAddr:    { fontSize: 11, color: '#7A6E9C', marginTop: 2 },
  dMsg:     { fontSize: 11, color: '#9B87F5', marginTop: 2 },
  shipBtn:  { padding: '6px 12px', borderRadius: 8, border: '1px solid #34d399', background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 12, cursor: 'pointer' },
  shipped:  { fontSize: 11, color: '#34d399', fontWeight: 600 },
  modal:    { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 999 },
  modalBox: { width: '100%', maxWidth: 448, margin: '0 auto', background: '#1a2a3a', borderRadius: '16px 16px 0 0', padding: '24px 20px 40px' },
  modalTitle:{ fontSize: 16, fontWeight: 700, color: '#E8E4F0', marginBottom: 16 },
  input:    { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(155,135,245,0.25)', background: 'rgba(255,255,255,0.04)', color: '#E8E4F0', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' },
  confirmBtn:{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#34d399', color: '#0D1B2A', fontSize: 15, fontWeight: 800, cursor: 'pointer' },
  cancelBtn: { width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(155,135,245,0.2)', background: 'transparent', color: '#9B87F5', fontSize: 14, cursor: 'pointer', marginTop: 8 },
};

function fmtPrice(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
function fmtDate(s) {
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function PartnerOrders() {
  const nav = useNavigate();
  const jwt = localStorage.getItem('partner_jwt');

  const [orders,    setOrders]   = useState([]);
  const [newCount,  setNewCount] = useState(0);
  const [filter,    setFilter]   = useState('all');
  const [loading,   setLoading]  = useState(true);
  const [shipModal, setShipModal]= useState(null); // { deliveryId, orderIdx, deliveryIdx }
  const [trackNum,  setTrackNum] = useState('');
  const [shipping,  setShipping] = useState(false);
  const [error,     setError]    = useState('');

  useEffect(() => {
    if (!jwt) { nav('/partner/login'); return; }
    loadOrders();
  }, [filter]);

  async function loadOrders() {
    setLoading(true);
    try {
      const q = filter !== 'all' ? `?status=${filter}` : '';
      const r = await fetch(`/api/partner/orders${q}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (r.status === 401) { nav('/partner/login'); return; }
      const d = await r.json();
      setOrders(d.orders || []);
      setNewCount(d.new_count || 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleShip() {
    if (!trackNum.trim()) { setError('운송장 번호를 입력해주세요.'); return; }
    setShipping(true);
    setError('');
    try {
      const r = await fetch(`/api/partner/orders/${shipModal.deliveryId}/ship`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ tracking_number: trackNum.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || '처리 실패'); return; }

      // 로컬 상태 업데이트
      setOrders(prev => prev.map((o, oi) => {
        if (oi !== shipModal.orderIdx) return o;
        return {
          ...o,
          deliveries: o.deliveries.map((del, di) =>
            di === shipModal.deliveryIdx
              ? { ...del, delivery_status: 'shipped', tracking_number: trackNum.trim() }
              : del
          ),
        };
      }));
      setShipModal(null);
      setTrackNum('');
    } catch {
      setError('서버 오류가 발생했어요.');
    } finally {
      setShipping(false);
    }
  }

  const FILTERS = [
    { value: 'all',      label: '전체' },
    { value: 'paid',     label: `신규 ${newCount > 0 ? `(${newCount})` : ''}` },
    { value: 'preparing',label: '준비중' },
    { value: 'shipped',  label: '배송중' },
    { value: 'delivered',label: '완료' },
  ];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={{ background: 'none', border: 'none', color: '#9B87F5', cursor: 'pointer', fontSize: 20 }} onClick={() => nav('/partner/dashboard')}>←</button>
        <span style={S.headerTitle}>주문 관리</span>
        {newCount > 0 && <span style={S.newBadge}>NEW {newCount}</span>}
      </div>

      {/* 필터 */}
      <div style={S.filterRow}>
        {FILTERS.map(f => (
          <button key={f.value} style={S.filterBtn(filter === f.value)} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={S.emptyBox}>불러오는 중...</div>
      ) : orders.length === 0 ? (
        <div style={S.emptyBox}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
          주문이 없어요
        </div>
      ) : (
        orders.map((o, oi) => {
          const st = STATUS_LABEL[o.status] || STATUS_LABEL.paid;
          return (
            <motion.div
              key={o.order_id}
              style={S.card}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: oi * 0.04 }}
            >
              <div style={S.cardHead}>
                <span style={S.cardDate}>{fmtDate(o.created_at)} · #{o.order_id?.slice(0, 8)}</span>
                <span style={S.statusPill(st.color)}>{st.text}</span>
              </div>
              <div style={S.cardBody}>
                <div style={S.prodName}>{o.product_name}</div>
                <div style={S.prodMeta}>수량 {o.quantity}개 · {fmtPrice(o.total_amount)}</div>
                <div style={{ fontSize: 13 }}>
                  내 수익: <span style={S.amt}>{fmtPrice(o.partner_amount)}</span>
                </div>

                {o.deliveries && o.deliveries.length > 0 && (
                  <>
                    <div style={S.divider} />
                    <div style={{ fontSize: 11, color: '#7A6E9C', marginBottom: 8 }}>배송지 {o.deliveries.length}곳</div>
                    {o.deliveries.map((d, di) => (
                      <div key={di} style={S.deliveryRow}>
                        <div style={{ flex: 1, marginRight: 8 }}>
                          <div style={S.dName}>{d.recipient_name} · {d.recipient_phone}</div>
                          <div style={S.dAddr}>{d.address}</div>
                          {d.gift_message && <div style={S.dMsg}>💌 {d.gift_message}</div>}
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {d.delivery_status === 'shipped' || d.delivery_status === 'delivered' ? (
                            <span style={S.shipped}>운송장 {d.tracking_number}</span>
                          ) : (
                            <button
                              style={S.shipBtn}
                              onClick={() => { setShipModal({ deliveryId: d.id, orderIdx: oi, deliveryIdx: di }); setTrackNum(''); setError(''); }}
                            >
                              발송처리
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          );
        })
      )}

      {/* 발송 처리 모달 */}
      <AnimatePresence>
        {shipModal && (
          <motion.div style={S.modal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setShipModal(null)}>
            <motion.div style={S.modalBox} initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}>
              <div style={S.modalTitle}>발송 처리</div>
              <input
                style={S.input}
                placeholder="운송장 번호 입력"
                value={trackNum}
                onChange={e => setTrackNum(e.target.value)}
                autoFocus
              />
              {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</div>}
              <button style={S.confirmBtn} onClick={handleShip} disabled={shipping}>
                {shipping ? '처리 중...' : '배송 시작'}
              </button>
              <button style={S.cancelBtn} onClick={() => setShipModal(null)}>취소</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
