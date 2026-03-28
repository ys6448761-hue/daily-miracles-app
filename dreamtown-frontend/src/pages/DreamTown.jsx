import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { readSavedStar } from '../lib/utils/starSession.js';

/**
 * /dreamtown — 공개 입구 (Public Entry)
 *
 * 정책:
 *  - localStorage 있어도 자동 복귀 금지
 *  - ?entry=invite → 동일하게 public flow 강제
 *  - 기존 별 안내는 하단 약한 CTA로만 노출
 */
export default function DreamTown() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [hasExistingStar, setHasExistingStar] = useState(false);

  const isInvite = searchParams.get('entry') === 'invite';
  const forcePublicEntry = location.pathname === '/dreamtown' || isInvite;

  useEffect(() => {
    if (!forcePublicEntry) return;
    // 자동 복귀 없음 — 존재 여부만 확인해서 복귀 버튼 노출 여부 결정
    const saved = readSavedStar();
    if (saved) setHasExistingStar(true);
  }, [forcePublicEntry]);

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
