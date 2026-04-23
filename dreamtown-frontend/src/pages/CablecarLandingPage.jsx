/**
 * CablecarLandingPage.jsx — /cablecar-landing → /entry?loc=cablecar 로 통합
 * 경로: /cablecar-landing (구 랜딩, 이제 EntryPage 로 리디렉트)
 */
import { Navigate } from 'react-router-dom';

export default function CablecarLandingPage() {
  return <Navigate to="/entry?loc=cablecar" replace />;
}
