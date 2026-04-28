/**
 * AdminCablecarPage.jsx
 * /admin/cablecar → /admin/location/yeosu_cablecar 리디렉트
 * 공통 UI: LocationAdmin.jsx (4탭 — 대시보드/오늘현황/별현황/QR운영)
 */
import { Navigate } from 'react-router-dom';

export default function AdminCablecarPage() {
  return <Navigate to="/admin/location/yeosu_cablecar" replace />;
}
