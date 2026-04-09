/**
 * Day7Complete.jsx — Day7 완주 화면
 *
 * 흐름: Day7 루미카드 CTA 클릭 → POST /api/dt/stars/:id/complete → 이 화면
 * 역할: "성취 경험 확정" — 변화를 느끼는 순간을 만들어준다
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOrCreateUserId, logFlowEvent } from '../api/dreamtown.js';
import { readSavedStar } from '../lib/utils/starSession.js';

export default function Day7Complete() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const [done, setDone]       = useState(false);
  const [visible, setVisible] = useState(false);

  const starId  = state?.starId  ?? readSavedStar();
  const userId  = getOrCreateUserId();

  useEffect(() => {
    // 완주 API 호출 (중복 호출 무해 — 서버에서 이미 완료 체크)
    if (!starId) { setDone(true); setTimeout(() => setVisible(true), 100); return; }

    fetch(`/api/dt/stars/${starId}/complete`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId }),
    })
      .then(r => r.json())
      .then(() => {
        logFlowEvent({ userId, stage: 'growth', action: 'day7_complete', value: { starId, source: 'day7_complete_page' } });
        setDone(true);
        setTimeout(() => setVisible(true), 100);
      })
      .catch(() => { setDone(true); setTimeout(() => setVisible(true), 100); });
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D1B2A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        color: '#fff',
        textAlign: 'center',
      }}
    >
      {/* 별 성장 애니메이션 */}
      <div
        style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,106,0.9) 0%, rgba(255,215,106,0.2) 60%, transparent 100%)',
          marginBottom: 32,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.6)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          boxShadow: '0 0 40px rgba(255,215,106,0.4)',
        }}
      />

      {/* 타이틀 */}
      <p
        style={{
          fontSize: 13,
          color: 'rgba(255,215,106,0.7)',
          marginBottom: 12,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease 0.3s',
        }}
      >
        ✨ 당신의 별이 성장했어요
      </p>

      {/* 메인 메시지 */}
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.5,
          color: '#fff',
          marginBottom: 16,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease 0.5s',
        }}
      >
        작은 선택들이 모여<br />지금의 변화를 만들었어요
      </h2>

      {/* 서브 메시지 */}
      <p
        style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.7,
          marginBottom: 40,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease 0.7s',
        }}
      >
        7일을 이어온 당신의 별은<br />
        이제 다른 사람들에게도 빛날 수 있어요
      </p>

      {/* CTA 버튼 그룹 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
          maxWidth: 320,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease 0.9s',
        }}
      >
        {/* 공명 — 진짜 DreamTown 시작 */}
        <button
          onClick={() => navigate(starId ? `/my-star/${starId}` : '/home')}
          style={{
            width: '100%',
            padding: '14px 0',
            background: '#FFD76A',
            color: '#0D1B2A',
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          내 별 보러 가기
        </button>

        <button
          onClick={() => navigate('/home')}
          style={{
            width: '100%',
            padding: '12px 0',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          광장으로
        </button>
      </div>
    </main>
  );
}
