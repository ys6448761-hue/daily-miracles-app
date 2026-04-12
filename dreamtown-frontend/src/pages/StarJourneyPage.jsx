/**
 * StarJourneyPage.jsx — Star Journey 파트너 탐색 화면
 * 경로: /star-journey
 *
 * 섹션:
 *  1. 내 은하 맞춤 추천 2~3개
 *  2. 은하 필터 탭
 *  3. 파트너 카드 그리드 (6개씩 더 보기)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getOrCreateUserId } from '../api/dreamtown.js';
import { readSavedStar } from '../lib/utils/starSession.js';

const BASE = import.meta.env.VITE_API_BASE ?? '';

const GALAXY_FILTERS = [
  { id: 'all',          label: '전체',  emoji: '🌌' },
  { id: 'healing',      label: '치유',  emoji: '🌿' },
  { id: 'relationship', label: '관계',  emoji: '💫' },
  { id: 'challenge',    label: '도전',  emoji: '⚡' },
  { id: 'growth',       label: '성장',  emoji: '🌱' },
];

const GALAXY_COLOR = {
  healing:      '#6FCFB0',
  relationship: '#9B87F5',
  challenge:    '#F5A623',
  growth:       '#74C365',
  miracle:      '#FFD700',
  all:          '#9B87F5',
};

const TIER_BADGE = {
  flagship: { label: 'Flagship', color: '#FFD700' },
  branch:   { label: null,       color: null },
};

export default function StarJourneyPage() {
  const nav = useNavigate();

  const [userId,       setUserId]       = useState(null);
  const [myGalaxy,     setMyGalaxy]     = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [partners,     setPartners]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [summary,      setSummary]      = useState(null);

  // 초기화 — userId + 내 별 은하 로드
  useEffect(() => {
    (async () => {
      const uid = await getOrCreateUserId();
      setUserId(uid);

      // 내 별 은하 읽기
      const saved = readSavedStar();
      if (saved?.galaxy) {
        setMyGalaxy(saved.galaxy);
        setActiveFilter(saved.galaxy);
      }

      // 여정 현황
      try {
        const sr = await fetch(`${BASE}/api/star-journey/summary?user_id=${uid}`);
        if (sr.ok) setSummary(await sr.json());
      } catch (_) {}
    })();
  }, []);

  // 필터 변경 시 목록 로드
  useEffect(() => {
    if (!userId) return;
    loadPartners();
  }, [userId, activeFilter]);

  async function loadPartners() {
    setLoading(true);
    setVisibleCount(6);
    try {
      const qs = new URLSearchParams({ user_id: userId, galaxy_type: activeFilter });
      const r  = await fetch(`${BASE}/api/star-journey/partners/all?${qs}`);
      const d  = await r.json();
      setPartners(d.partners || []);
    } catch (_) {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }

  const recommended = partners.filter(p => p.achievement_hint && !p.is_visited).slice(0, 3);
  const visible      = partners.slice(0, visibleCount);
  const hasMore      = visibleCount < partners.length;

  const accentColor = GALAXY_COLOR[activeFilter] || '#9B87F5';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090F1E',
      color: '#E8E4F0',
      fontFamily: "'Noto Sans KR', sans-serif",
      paddingBottom: 60,
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '20px 20px 12px',
      }}>
        <button
          onClick={() => nav(-1)}
          style={{ background: 'none', border: 'none', color: '#9B87F5', fontSize: 20, cursor: 'pointer', padding: 0 }}
        >
          ←
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>별자리 여정</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            파트너를 방문하고 별자리를 완성해요
          </p>
        </div>
      </div>

      {/* 여정 현황 요약 바 */}
      {summary && (
        <div style={{
          margin: '0 16px 16px',
          background: 'rgba(155,135,245,0.08)',
          border: '1px solid rgba(155,135,245,0.2)',
          borderRadius: 14,
          padding: '12px 16px',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }}>
          <Stat label="방문" value={summary.uniquePartners} unit="곳" />
          <Stat label="달성" value={summary.achievements?.length || 0} unit="개" />
          <Stat label="보유 쿠폰" value={summary.activeCoupons?.length || 0} unit="장" />
        </div>
      )}

      {/* 달성 뱃지 스트립 */}
      {summary?.achievements?.length > 0 && (
        <div style={{
          overflowX: 'auto',
          display: 'flex',
          gap: 8,
          padding: '0 16px 12px',
          scrollbarWidth: 'none',
        }}>
          {summary.achievements.map(a => (
            <div key={a.achievement_type} style={{
              flexShrink: 0,
              background: 'rgba(255,215,0,0.1)',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 12,
              color: '#FFD700',
              whiteSpace: 'nowrap',
            }}>
              {a.badge_emoji} {a.achievement_name}
            </div>
          ))}
        </div>
      )}

      {/* 추천 섹션 */}
      {!loading && recommended.length > 0 && (
        <section style={{ padding: '0 16px 20px' }}>
          <div style={{ fontSize: 13, color: accentColor, fontWeight: 700, marginBottom: 10 }}>
            ✦ {myGalaxy ? `${GALAXY_FILTERS.find(f=>f.id===myGalaxy)?.label || ''} 은하 추천` : '달성 임박'}
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {recommended.map(p => (
              <PartnerCard key={p.partner_id} partner={p} accentColor={accentColor} compact />
            ))}
          </div>
        </section>
      )}

      {/* 은하 필터 탭 */}
      <div style={{
        overflowX: 'auto',
        display: 'flex',
        gap: 8,
        padding: '0 16px 16px',
        scrollbarWidth: 'none',
      }}>
        {GALAXY_FILTERS.map(f => {
          const active = activeFilter === f.id;
          const color  = GALAXY_COLOR[f.id] || '#9B87F5';
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
                background: active ? `${color}22` : 'transparent',
                color: active ? color : 'rgba(255,255,255,0.5)',
                fontSize: 13,
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f.emoji} {f.label}
            </button>
          );
        })}
      </div>

      {/* 파트너 카드 그리드 */}
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px 0', fontSize: 13 }}>
            불러오는 중...
          </div>
        ) : partners.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.3)',
            padding: '40px 0',
            fontSize: 14,
            lineHeight: 1.8,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌌</div>
            아직 이 은하에 파트너가 없어요<br />
            <span style={{ fontSize: 12 }}>곧 새로운 공간이 열릴 거예요</span>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}>
              <AnimatePresence>
                {visible.map((p, i) => (
                  <motion.div
                    key={p.partner_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <PartnerCard partner={p} accentColor={GALAXY_COLOR[p.galaxy_type] || '#9B87F5'} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + 6)}
                style={{
                  width: '100%',
                  marginTop: 16,
                  padding: '12px 0',
                  background: 'rgba(155,135,245,0.08)',
                  border: '1px solid rgba(155,135,245,0.2)',
                  borderRadius: 12,
                  color: '#9B87F5',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                더 보기 ({partners.length - visibleCount}개 남음) ↓
              </button>
            )}

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 16 }}>
              전체 {partners.length}개 파트너
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 파트너 카드 ──────────────────────────────────────────────────
function PartnerCard({ partner, accentColor, compact = false }) {
  const tierBadge = TIER_BADGE[partner.partner_tier];

  return (
    <div style={{
      background: '#10172A',
      border: partner.is_visited
        ? `1px solid ${accentColor}55`
        : '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: compact ? '12px 14px' : '16px 14px',
      width: compact ? 130 : '100%',
      flexShrink: compact ? 0 : undefined,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 방문 완료 글로우 */}
      {partner.is_visited && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at top left, ${accentColor}0A, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Flagship 뱃지 */}
      {tierBadge?.label && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 9, fontWeight: 700,
          color: tierBadge.color,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 6,
          padding: '2px 6px',
          letterSpacing: 0.5,
        }}>
          {tierBadge.label}
        </div>
      )}

      <div style={{ fontSize: compact ? 28 : 32, marginBottom: 6 }}>{partner.emoji}</div>
      <div style={{
        fontSize: compact ? 12 : 13,
        fontWeight: 700,
        marginBottom: 4,
        lineHeight: 1.3,
        color: '#E8E4F0',
      }}>
        {partner.partner_name}
      </div>
      <div style={{
        fontSize: 11,
        color: accentColor,
        marginBottom: 8,
        opacity: 0.85,
      }}>
        {partner.galaxy_label}
      </div>

      {partner.is_visited ? (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: accentColor, fontWeight: 700,
        }}>
          ✅ 방문{partner.visit_count > 1 ? ` ×${partner.visit_count}` : ''}
        </div>
      ) : partner.achievement_hint ? (
        <div style={{
          fontSize: 10,
          color: '#FFD700',
          lineHeight: 1.5,
          background: 'rgba(255,215,0,0.08)',
          borderRadius: 6,
          padding: '3px 6px',
        }}>
          ✦ {partner.achievement_hint}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          미방문
        </div>
      )}
    </div>
  );
}

// ── 통계 수치 ────────────────────────────────────────────────────
function Stat({ label, value, unit }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 48 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#9B87F5', lineHeight: 1 }}>
        {value}<span style={{ fontSize: 11, fontWeight: 400 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
