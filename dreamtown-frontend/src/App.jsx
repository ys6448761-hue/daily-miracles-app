import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { migrateStarId } from './lib/utils/starSession.js';
import AppLaunch from './pages/AppLaunch.jsx';
import Intro from './pages/Intro.jsx';
import WishGate from './pages/WishGate.jsx';
import StarBirth from './pages/StarBirth.jsx';
import MyStar from './pages/MyStar.jsx';
import Galaxy from './pages/Galaxy.jsx';
import Day from './pages/Day.jsx';
import History from './pages/History.jsx';
import StarGrowth from './pages/StarGrowth.jsx';
import Star from './pages/Star.jsx';
import Postcard from './pages/Postcard.jsx';
import Home from './pages/Home.jsx';
import StarDetail from './pages/StarDetail.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import GiftLanding from './pages/GiftLanding.jsx';
import AllStars from './pages/AllStars.jsx';
import DreamTown from './pages/DreamTown.jsx';
import MyStarReturn from './pages/MyStarReturn.jsx';
import DigitalBook from './pages/DigitalBook.jsx';

// 중복 슬래시 정규화 (//dreamtown → /dreamtown)
if (window.location.pathname.startsWith('//')) {
  const normalized = window.location.pathname.replace(/\/+/g, '/');
  window.history.replaceState({}, '', normalized + window.location.search);
}

// dt_star_id → dt_active_star_id 1회 마이그레이션
migrateStarId();


export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-night-sky max-w-md mx-auto relative">
        <Routes>
          <Route path="/"            element={<AppLaunch />} />
          <Route path="/intro"       element={<Intro />} />
          <Route path="/wish"        element={<WishGate />} />
          <Route path="/star-birth"  element={<StarBirth />} />
          <Route path="/my-star"     element={<MyStarReturn />} />
          <Route path="/my-star/:id" element={<MyStar />} />
          <Route path="/my-star/:id/book" element={<DigitalBook />} />
          <Route path="/star/:id"    element={<StarDetail />} />
          <Route path="/galaxy"      element={<Galaxy />} />
          <Route path="/day"         element={<Day />} />
          <Route path="/history"     element={<History />} />
          <Route path="/star-growth" element={<StarGrowth />} />
          <Route path="/star"        element={<Star />} />
          <Route path="/postcard"    element={<Postcard />} />
          <Route path="/home"        element={<Home />} />
          <Route path="/dreamtown"               element={<DreamTown />} />
          <Route path="/dashboard"               element={<DashboardPage />} />
          <Route path="/stars"                   element={<AllStars />} />
          <Route path="/dreamtown/gift/:star_id" element={<GiftLanding />} />
          <Route path="*"                        element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
