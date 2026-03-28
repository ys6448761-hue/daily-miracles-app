import { useNavigate, useLocation } from 'react-router-dom';

// 공개 경로 — "내 별" 버튼 숨김 (star auto-load 차단)
const PUBLIC_ROUTES = ['/dreamtown', '/my-star'];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const hideMyStarButton = PUBLIC_ROUTES.some(
    (r) => location.pathname === r || location.pathname.startsWith(r + '?')
  );

  function goToMyStar() {
    const starId = localStorage.getItem('dt_active_star_id');
    if (starId) {
      navigate(`/my-star/${starId}`);
    } else {
      navigate('/intro');
    }
  }

  return (
    <header className="mb-8 flex items-center justify-between px-4 pt-4">
      <button
        onClick={() => navigate('/')}
        className="text-xl font-bold text-[#9B87F5]"
      >
        드림타운
      </button>

      <nav className="flex items-center gap-4 text-sm">
        {/* 공개 경로에서는 "내 별" 버튼 숨김 — localStorage → 자동 이동 차단 */}
        {!hideMyStarButton && (
          <button
            type="button"
            onClick={goToMyStar}
            className="rounded-full bg-[#9B87F5] px-4 py-2 text-sm text-white hover:bg-[#8B74F0] transition-colors"
          >
            내 별
          </button>
        )}
      </nav>
    </header>
  );
}
