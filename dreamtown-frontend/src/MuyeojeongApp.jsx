import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LumiTravelPage from './pages/LumiTravelPage.jsx';

export default function MuyeojeongApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/lumi" element={<LumiTravelPage />} />
        <Route path="*" element={<Navigate to="/lumi" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
