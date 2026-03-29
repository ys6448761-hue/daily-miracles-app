import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { readSavedStar } from '../lib/utils/starSession.js';
import InviteHero from './InviteHero.jsx';

/**
 * /dreamtown — 공개 입구 (Public Entry)
 *
 * 정책:
 *  - localStorage 있어도 자동 복귀 금지
 *  - ?entry=invite → InviteHero 먼저 노출, CTA 클릭 시에만 앱 진입
 *  - 기존 별 안내는 하단 약한 CTA로만 노출
 */
export default function DreamTown() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [hasExistingStar, setHasExistingStar] = useState(false);

  const isInvite = searchParams.get('entry') === 'invite';

  // invite 진입 시: InviteHero 표시 → CTA 클릭 전까지 실제 앱 미진입
  const [showDreamtown, setShowDreamtown] = useState(!isInvite);

  useEffect(() => {
    // 레거시 키 제거 — 공개 입구에서 dt_star_id 완전 소거
    localStorage.removeItem('dt_star_id');
    // 자동 복귀 없음 — 존재 여부만 확인해서 복귀 버튼 노출 여부 결정
    const saved = readSavedStar();
    if (saved) setHasExistingStar(true);
  }, []);

  // ?entry=invite → InviteHero (CTA 클릭 전)
  if (isInvite && !showDreamtown) {
    return (
      <InviteHero
        onWish={() => navigate('/intro')}
        onSeeDreamtown={() => setShowDreamtown(true)}
      />
    );
  }

  // 기존 DreamTown 화면 (직접 진입 또는 "별 보기" CTA 이후)
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
          onClick={() => navigate('/intro')}
          className="w-full rounded-full bg-[#9B87F5] py-3.5 text-sm font-medium text-white"
        >
          별 만들기
        </button>
      </div>

      {/* 기존 별 — 약한 CTA (강제 이동 없음) */}
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
