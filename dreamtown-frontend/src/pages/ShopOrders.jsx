/**
 * ShopOrders.jsx — 내 주문 내역
 * 경로: /shop/orders
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const STATUS_LABEL = {
  paid:      { text: '결제완료',  color: '#9B87F5' },
  preparing: { text: '준비중',    color: '#60a5fa' },
  shipped:   { text: '배송중',    color: '#34d399' },
  delivered: { text: '배송완료',  color: '#7A6E9C' },
  cancelled: { text: '취소됨',    color: '#f87171' },
};

const DELIVERY_LABEL = {
  pending:   '접수',
  preparing: '준비중',
  shipped:   '배송중',
  delivered: '배송완료',
};

const S = {
  page:    { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Noto Sans KR', sans-serif", color: '#E8E4F0', paddingBottom: 40 },
  header:  { background: 'rgba(155,135,245,0.08)', borderBottom: '1px solid rgba(155,135,245,0.15)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#9B87F5' },
  successBanner: { margin: '16px 20px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12, padding: '14px 16px' },
  successTitle: { fontSize: 15, fontWeight: 700, color: '#34d399', marginBottom: 4 },
  successSub:   { fontSize: 13, color: '#C4BAE0' },
  emptyBox: { textAlign: 'center', padding: '80px 20px', color: '#7A6E9C', fontSize: 14 },
  orderCard: { margin: '0 20px 12px', background: 'rgba(155,135,245,0.06)', border: '1px solid rgba(155,135,245,0.12)', borderRadius: 14, overflow: 'hidden' },
  cardHead:  { padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(155,135,245,0.08)' },
  cardDate:  { fontSize: 12, color: '#7A6E9C' },
  statusPill:(color) => ({ fontSize: 11, fontWeight: 700, color, background: color + '22', padding: '3px 8px', borderRadius: 10 }),
  cardBody:  { padding: '14px 16px' },
  productRow:{ display: 'flex', gap: 12, marginBottom: 12 },
  imgBox:    { width: 56, height: 56, borderRadius: 8, background: 'rgba(155,135,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  img:       { width: '100%', height: '100%', objectFit: 'cover' },
  productName:{ fontSize: 14, fontWeight: 700, color: '#E8E4F0', marginBottom: 4 },
  productMeta:{ fontSize: 12, color: '#7A6E9C' },
  totalAmt:  { fontSize: 16, fontWeight: 800, color: '#FFD700', marginTop: 4 },
  divider:   { height: 1, background: 'rgba(155,135,245,0.08)', margin: '10px 0' },
  deliveryList: { fontSize: 12, color: '#C4BAE0' },
  deliveryRow:  { display: 'flex', justifyContent: 'space-between', padding: '4px 0' },
  trackingLink: { color: '#9B87F5', fontWeight: 600 },
  shopBtn: { display: 'block', margin: '24px 20px 0', padding: '14px 0', borderRadius: 12, border: 'none', background: '#9B87F5', color: '#0D1B2A', fontSize: 15, fontWeight: 800, cursor: 'pointer', textAlign: 'center', width: 'calc(100% - 40px)' },
};

function fmtPrice(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
function fmtDate(s) {
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ShopOrders() {
  const nav = useNavigate();
  const { state } = useLocation();
  const newOrderId   = state?.newOrderId;
  const productName  = state?.productName;

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('dt_active_star_id') || localStorage.getItem('dt_user_id');

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetch(`/api/shop/orders?user_id=${userId}`)
      .then(r => r.json())
      .then(d => setOrders(d.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={{ background: 'none', border: 'none', color: '#9B87F5', cursor: 'pointer', fontSize: 20 }} onClick={() => nav('/shop')}>←</button>
        <span style={S.headerTitle}>주문 내역</span>
      </div>

      {newOrderId && (
        <motion.div style={S.successBanner} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={S.successTitle}>주문이 완료됐어요 ✨</div>
          <div style={S.successSub}>{productName || '상품'}이 곧 여수에서 출발해요</div>
        </motion.div>
      )}

      <div style={{ height: 16 }} />

      {loading ? (
        <div style={S.emptyBox}>불러오는 중...</div>
      ) : orders.length === 0 ? (
        <div style={S.emptyBox}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
          아직 주문 내역이 없어요
          <br /><br />
          <button style={{ ...S.shopBtn, margin: '12px auto 0', display: 'inline-block', width: 'auto', padding: '10px 24px' }} onClick={() => nav('/shop')}>
            쇼핑하러 가기
          </button>
        </div>
      ) : (
        <>
          {orders.map((o, i) => {
            const st = STATUS_LABEL[o.status] || STATUS_LABEL.paid;
            return (
              <motion.div
                key={o.id}
                style={S.orderCard}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div style={S.cardHead}>
                  <span style={S.cardDate}>{fmtDate(o.created_at)}</span>
                  <span style={S.statusPill(st.color)}>{st.text}</span>
                </div>
                <div style={S.cardBody}>
                  <div style={S.productRow}>
                    <div style={S.imgBox}>
                      {o.image_url
                        ? <img src={o.image_url} alt={o.product_name} style={S.img} />
                        : <span style={{ fontSize: 24 }}>🎁</span>
                      }
                    </div>
                    <div>
                      <div style={S.productName}>{o.product_name}</div>
                      <div style={S.productMeta}>{o.partner_name || '여수 특산품'} · {o.quantity}개</div>
                      <div style={S.totalAmt}>{fmtPrice(o.total_amount)}</div>
                    </div>
                  </div>

                  {o.deliveries && o.deliveries.length > 0 && (
                    <>
                      <div style={S.divider} />
                      <div style={{ fontSize: 11, color: '#7A6E9C', marginBottom: 6 }}>배송지 {o.deliveries.length}곳</div>
                      <div style={S.deliveryList}>
                        {o.deliveries.map((d, di) => (
                          <div key={di} style={S.deliveryRow}>
                            <span>{d.recipient_name} · {d.address?.slice(0, 16)}{d.address?.length > 16 ? '...' : ''}</span>
                            <span>
                              {d.tracking_number
                                ? <span style={S.trackingLink}>운송장: {d.tracking_number}</span>
                                : <span style={{ color: '#7A6E9C' }}>{DELIVERY_LABEL[d.delivery_status] || '접수'}</span>
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
          <button style={S.shopBtn} onClick={() => nav('/shop')}>
            더 쇼핑하기
          </button>
        </>
      )}
    </div>
  );
}
