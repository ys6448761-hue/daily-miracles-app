/**
 * JourneyRecommendPage.jsx — 추천 여정 + 여정 시작 CTA
 * 경로: /journey/recommend?wish_id=...&context_id=...
 *
 * 섹션:
 *  1. RecommendationCard (추천 1개 크게)
 *  2. StartJourneyButton → POST /api/journeys/start → star 생성
 *  3. IncludedBenefitsSection (GET /api/dt/products/:id 혜택)
 *  4. CustomizeDrawer (보조 CTA)
 *
 * SSOT: 별은 이 화면에서 CTA 클릭 시만 생성
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function JourneyRecommendPage() {
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const wishId     = params.get('wish_id');
  const contextId  = params.get('context_id');

  const [rec,       setRec]       = useState(null);
  const [benefits,  setBenefits]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [starting,  setStarting]  = useState(false);
  const [started,   setStarted]   = useState(false);   // 이미 시작된 여정 → 버튼 비활성화
  const [error,     setError]     = useState(null);
  const [noRec,     setNoRec]     = useState(false);   // 추천 없음 케이스 구분
  const [showCustomize, setShowCustomize] = useState(false);
  const [altProducts,   setAltProducts]   = useState([]);

  // 추천 로드
  useEffect(() => {
    if (!wishId || !contextId) { setLoading(false); return; }
    fetchRecommendation();
  }, [wishId, contextId]);

  // 혜택 로드 (추천 product 확정 후)
  useEffect(() => {
    if (rec?.recommended_product?.product_id) {
      fetchBenefits(rec.recommended_product.product_id);
    }
  }, [rec]);

  async function fetchRecommendation() {
    setLoading(true);
    setError(null);
    setNoRec(false);
    try {
      const res = await fetch('/api/recommendation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ wish_id: wishId, context_id: contextId }),
      });
      const data = await res.json();
      // 추천 없음(404)과 서버 오류(5xx)를 구분
      if (res.status === 404 || (data.error ?? '').includes('없음')) {
        setNoRec(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? '추천 실패');
      setRec(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBenefits(productId) {
    try {
      const res = await fetch(`/api/dt/products/${productId}`);
      const data = await res.json();
      if (res.ok) setBenefits(data.benefits ?? []);
    } catch { /* 혜택 없어도 계속 */ }
  }

  async function fetchAltProducts() {
    const routeType = rec?.recommended_product?.route_type;
    if (!routeType) return;
    try {
      const res = await fetch(`/api/dt/products?city_code=yeosu`);
      const data = await res.json();
      setAltProducts((data.products ?? []).filter(p => p.id !== rec.recommended_product.product_id).slice(0, 4));
    } catch { /* ignore */ }
  }

  async function handleStartJourney(productId) {
    if (starting || started) return;  // 중복 클릭 방지 (프론트 레벨)
    setStarting(true);
    try {
      const res = await fetch('/api/journeys/start', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          wish_id:    wishId,
          context_id: contextId,
          product_id: productId ?? rec.recommended_product.product_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '여정 시작 실패');
      setStarted(true);  // 성공 후 버튼 잠금
      // 별 생성 완료 → my-star 화면으로
      navigate(`/my-star/${data.star_id}?journey_id=${data.journey_id}&new=1`);
    } catch (e) {
      setError(e.message);
      setStarting(false);
    }
  }

  function handleOpenCustomize() {
    setShowCustomize(true);
    fetchAltProducts();
    // 이벤트: click_customize_journey
    fetch('/api/dt/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'click_customize_journey', params: { wish_id: wishId, context_id: contextId } }),
    }).catch(() => {});
  }

  if (!wishId || !contextId) {
    return (
      <div style={styles.page}>
        <div style={{ color: '#f87171', padding: 20 }}>wish_id / context_id 없음</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button onClick={() => navigate(-1)} style={styles.back}>← 뒤로</button>

      {loading && <LoadingCard />}

      {/* 추천 없음 — 서버 오류와 구분된 안전한 상태 */}
      {noRec && !loading && <NoRecCard onRetry={fetchRecommendation} />}

      {error && !loading && !noRec && <ErrorCard message={error} onRetry={fetchRecommendation} />}

      {rec && !loading && (
        <>
          {/* ── 1. 추천 카드 ── */}
          <div style={styles.recCardWrap}>
            <div style={styles.recBadge}>추천 여정</div>
            <h2 style={styles.recTitle}>{rec.recommended_product.title}</h2>
            <p style={styles.recReason}>{rec.recommended_product.reason}</p>
            <div style={styles.priceRow}>
              <span style={styles.price}>
                {Number(rec.recommended_product.base_price).toLocaleString('ko-KR')}원
              </span>
              <span style={styles.priceSub}>부터</span>
            </div>
          </div>

          {/* ── 2. 메인 CTA ── */}
          <button
            onClick={() => handleStartJourney()}
            disabled={starting || started}
            style={{ ...styles.startBtn, opacity: (starting || started) ? 0.6 : 1 }}
          >
            {started ? '여정이 시작됐어요 ✓' : starting ? '여정 시작 중...' : '이 여정 시작하기'}
          </button>

          {/* ── 3. 포함된 혜택 ── */}
          {benefits.length > 0 && (
            <IncludedBenefitsSection
              benefits={benefits}
              productId={rec.recommended_product.product_id}
            />
          )}

          {/* ── 4. 보조 CTA ── */}
          {rec.customizable && !showCustomize && (
            <button onClick={handleOpenCustomize} style={styles.customizeBtn}>
              조금 바꿔볼까요?
            </button>
          )}

          {/* ── Customize Drawer ── */}
          {showCustomize && (
            <CustomizeDrawer
              products={altProducts}
              onSelect={handleStartJourney}
              onClose={() => setShowCustomize(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── 포함된 혜택 섹션 ──────────────────────────────────────────────────
function IncludedBenefitsSection({ benefits, productId }) {
  const [expanded, setExpanded] = useState(false);

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      // 이벤트: view_included_benefits (처음 열 때만)
      fetch('/api/dt/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name: 'view_included_benefits', params: { product_id: productId, benefit_count: benefits.length } }),
      }).catch(() => {});
    }
  }

  return (
    <div style={styles.benefitSection}>
      <div style={styles.benefitHeader} onClick={handleToggle}>
        <span style={styles.benefitTitle}>이번 여정에 담긴 작은 선물</span>
        <span style={{ color: '#60a5fa', fontSize: 12 }}>{expanded ? '접기' : `${benefits.length}개 보기`}</span>
      </div>

      {expanded && (
        <div style={styles.benefitList}>
          {benefits.map((b, i) => (
            <div key={i} style={styles.benefitItem}>
              <div style={styles.benefitCopy}>{b.display_copy}</div>
              {b.description && <div style={styles.benefitDesc}>{b.description}</div>}
              {b.location_hint && (
                <div style={styles.locationHint}>📍 {b.location_hint}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Customize Drawer ────────────────────────────────────────────────
function CustomizeDrawer({ products, onSelect, onClose }) {
  if (!products.length) {
    return (
      <div style={styles.drawer}>
        <div style={styles.drawerTitle}>다른 여정 옵션</div>
        <div style={{ color: '#6b7280', fontSize: 13, padding: '12px 0' }}>지금은 다른 옵션이 없어요</div>
        <button onClick={onClose} style={styles.closeBtn}>닫기</button>
      </div>
    );
  }
  return (
    <div style={styles.drawer}>
      <div style={styles.drawerTitle}>다른 여정 옵션</div>
      {products.map(p => (
        <button key={p.id} onClick={() => onSelect(p.id)} style={styles.altBtn}>
          <span style={styles.altTitle}>{p.title}</span>
          <span style={styles.altPrice}>{Number(p.price).toLocaleString('ko-KR')}원</span>
        </button>
      ))}
      <button onClick={onClose} style={styles.closeBtn}>취소</button>
    </div>
  );
}

function LoadingCard() {
  return (
    <div style={styles.loadingCard}>
      <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>여정을 찾고 있어요...</div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>소원을 분석 중입니다</div>
    </div>
  );
}

function ErrorCard({ message, onRetry }) {
  return (
    <div style={styles.errorCard}>
      <div style={{ color: '#f87171', marginBottom: 12 }}>{message}</div>
      <button onClick={onRetry} style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}>
        다시 시도
      </button>
    </div>
  );
}

function NoRecCard({ onRetry }) {
  return (
    <div style={{
      background: '#0d1b2a', border: '1px solid #1e2d3d', borderRadius: 14,
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🌙</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', marginBottom: 8 }}>
        추천을 다시 준비 중이에요
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
        지금 이 지역의 여정을 준비하고 있어요.<br />
        잠시 후 다시 시도해주세요.
      </div>
      <button onClick={onRetry} style={{
        background: '#1e2d3d', border: '1px solid #374151', color: '#9ca3af',
        borderRadius: 10, padding: '10px 24px', fontSize: 14, cursor: 'pointer',
      }}>
        다시 확인하기
      </button>
    </div>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh', background: '#060e1a', color: '#f0f4ff',
    padding: '20px 20px 80px', fontFamily: 'sans-serif',
  },
  back: {
    background: 'none', border: 'none', color: '#60a5fa',
    fontSize: 14, cursor: 'pointer', padding: '4px 0', marginBottom: 24,
  },

  // 추천 카드
  recCardWrap: {
    background: 'linear-gradient(135deg, #0d1b2a, #1e2d3d)',
    border: '1px solid #2563eb40', borderRadius: 18,
    padding: '28px 24px', marginBottom: 20,
  },
  recBadge: {
    display: 'inline-block', background: '#2563eb', color: '#fff',
    fontSize: 11, fontWeight: 700, letterSpacing: 1,
    borderRadius: 6, padding: '3px 10px', marginBottom: 16,
  },
  recTitle: { fontSize: 20, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.4 },
  recReason: { fontSize: 14, color: '#93c5fd', margin: '0 0 20px', lineHeight: 1.5 },
  priceRow:  { display: 'flex', alignItems: 'baseline', gap: 6 },
  price:     { fontSize: 26, fontWeight: 800, color: '#f0f4ff' },
  priceSub:  { fontSize: 13, color: '#9ca3af' },

  // CTA
  startBtn: {
    width: '100%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    color: '#fff', border: 'none', borderRadius: 14, padding: '18px',
    fontSize: 17, fontWeight: 800, cursor: 'pointer', marginBottom: 20,
  },
  customizeBtn: {
    width: '100%', background: 'none', border: '1px solid #1e2d3d',
    color: '#9ca3af', borderRadius: 12, padding: '12px',
    fontSize: 14, cursor: 'pointer', marginTop: 4,
  },

  // 혜택 섹션
  benefitSection: {
    background: '#0a1628', border: '1px solid #1e2d3d',
    borderRadius: 14, padding: '16px 20px', marginBottom: 16,
  },
  benefitHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    cursor: 'pointer',
  },
  benefitTitle: { fontSize: 14, fontWeight: 700, color: '#f0f4ff' },
  benefitList:  { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 },
  benefitItem:  { borderTop: '1px solid #1e2d3d', paddingTop: 12 },
  benefitCopy:  { fontSize: 14, color: '#e2e8f0', fontWeight: 600, marginBottom: 4 },
  benefitDesc:  { fontSize: 12, color: '#9ca3af' },
  locationHint: { fontSize: 11, color: '#60a5fa', marginTop: 4 },

  // Customize Drawer
  drawer: {
    background: '#0d1b2a', border: '1px solid #1e2d3d',
    borderRadius: 14, padding: '20px', marginTop: 8,
  },
  drawerTitle: { fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#9ca3af' },
  altBtn: {
    width: '100%', background: '#0a1628', border: '1px solid #1e2d3d',
    borderRadius: 10, padding: '14px 16px', marginBottom: 8,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    cursor: 'pointer',
  },
  altTitle: { fontSize: 14, color: '#f0f4ff' },
  altPrice: { fontSize: 13, color: '#9ca3af' },
  closeBtn: {
    width: '100%', background: 'none', border: '1px solid #374151',
    color: '#6b7280', borderRadius: 10, padding: '10px',
    fontSize: 13, cursor: 'pointer', marginTop: 4,
  },

  // 기타
  loadingCard: {
    background: '#0d1b2a', border: '1px solid #1e2d3d', borderRadius: 14,
    padding: '40px 24px', textAlign: 'center',
  },
  errorCard: {
    background: '#2d0707', border: '1px solid #dc2626', borderRadius: 10,
    padding: '16px 20px',
  },
};
