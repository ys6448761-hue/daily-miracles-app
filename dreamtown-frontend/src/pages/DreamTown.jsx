import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { readSavedStar } from '../lib/utils/starSession.js';
import InviteIntro from './InviteIntro.jsx';
import WishInputScreen from './WishInputScreen.jsx';
import StarDetail from './StarDetail.jsx';

/**
 * /dreamtown — 공개 입구 (Public Entry)
 *
 * scene 상태 머신:
 *  'intro'     — ?entry=invite 진입 시 단일 인트로 화면 (InviteIntro)
 *  'wish'      — "시작하기 ✦" CTA → WishInputScreen (즉시 전환)
 *  'dreamtown' — 직접 진입 or 기존 광장 화면
 *
 * 정책:
 *  - localStorage 있어도 자동 복귀 금지
 *  - invite 유입: 인트로 → 입력, 단계 없음
 *  - 일반 진입: 광장 화면 → "내 소원 남기기 ✦" → /wish (케이블카 인트로)
 */
export default function DreamTown() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const isInvite    = searchParams.get('entry') === 'invite';
  const starIdParam = searchParams.get('starId');

  const [hasExistingStar, setHasExistingStar] = useState(false);
  const [scene, setScene] = useState(
    isInvite && !starIdParam ? 'intro' : 'dreamtown'
  );

  useEffect(() => {
    if (isInvite && starIdParam) return;
    localStorage.removeItem('dt_star_id');
    const saved = readSavedStar();
    if (saved) setHasExistingStar(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── invite + starId → 특정 별 상세 바로 표시 ──────────────────────
  if (isInvite && starIdParam) {
    return <StarDetail starId={starIdParam} viewMode="public" />;
  }

  // ── Scene: intro (invite 전용) ─────────────────────────────────────
  if (scene === 'intro') {
    return <InviteIntro onStart={() => setScene('wish')} />;
  }

  // ── Scene: wish (즉시 소원 입력) ───────────────────────────────────
  if (scene === 'wish') {
    return <WishInputScreen onBack={() => setScene('intro')} />;
  }

  // ── Scene: dreamtown (세계관 시작 화면) ────────────────────────────
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0D1B2A] px-6">
      {/* 인트로 */}
      <div className="mb-14 text-center">
        <div
          className="mx-auto mb-6 h-3 w-3 rounded-full bg-[#9B87F5]"
          style={{ boxShadow: '0 0 18px 5px rgba(155,135,245,0.4)' }}
        />
        <h1 className="text-lg font-medium text-white/80">
          드림타운에 오신 걸 환영해요
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/40">
          소원을 품은 별들이 모이는 곳이에요.
          <br />
          당신의 별을 만들어보세요.
        </p>
      </div>

      {/* 메인 CTA */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => navigate('/wish')}
          className="w-full rounded-full bg-[#9B87F5] py-3.5 text-sm font-medium text-white"
        >
          내 소원 남기기 ✦
        </button>
      </div>

      {/* 기존 별 — 약한 CTA */}
      {hasExistingStar && (
        <p className="mt-10 text-xs text-white/25">
          이미 만든 별이 있나요?{' '}
          <button
            onClick={() => navigate('/my-star')}
            className="underline underline-offset-4 hover:text-white/40 transition-colors"
          >
            내 별로 돌아가기
          </button>
        </p>
      )}
    </main>
  );
}
