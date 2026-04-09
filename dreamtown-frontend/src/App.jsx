import { lazy, Suspense } from 'react';
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
import HundredDays from './pages/HundredDays.jsx';
import StoryDraftMVP from './pages/StoryDraftMVP.jsx';
import WishSelect from './pages/WishSelect.jsx';
import WishInputScreen from './pages/WishInputScreen.jsx';
import JourneySceneEngine from './components/JourneySceneEngine.jsx';
import ResonanceCard from './components/ResonanceCard.jsx';
import ConnectionStageCard from './components/ConnectionStageCard.jsx';
import RecallWhisperCard from './components/RecallWhisperCard.jsx';
import MonetizationFlow from './components/MonetizationFlow.jsx';
import VoyageWish from './pages/VoyageWish.jsx';
import VoyageBooking from './pages/VoyageBooking.jsx';
import VoyageStatus from './pages/VoyageStatus.jsx';
import VoyageReflection from './pages/VoyageReflection.jsx';
import VoyagePaymentReturn from './pages/VoyagePaymentReturn.jsx';
import MobileTicket from './pages/MobileTicket.jsx';
// html5-qrcode가 포함된 PartnerVerify는 lazy load — 파트너 화면 진입 시에만 번들 로드
const PartnerVerify = lazy(() => import('./pages/PartnerVerify.jsx'));
import PartnerManual from './pages/PartnerManual.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import AdminBenefitPage from './pages/AdminBenefitPage.jsx';
import AdminExperimentPage from './pages/AdminExperimentPage.jsx';
import AdminKpiPage from './pages/AdminKpiPage.jsx';

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
        <JourneySceneEngine />
        <ResonanceCard />
        <ConnectionStageCard />
        <RecallWhisperCard />
        <MonetizationFlow />
        <Routes>
          <Route path="/"            element={<AppLaunch />} />
          <Route path="/intro"       element={<Intro />} />
          <Route path="/wish"        element={<WishGate />} />
          <Route path="/wish/select" element={<WishSelect />} />
          <Route path="/wish/input"  element={<WishInputScreen />} />
          <Route path="/star-birth"  element={<StarBirth />} />
          <Route path="/my-star"     element={<MyStarReturn />} />
          <Route path="/my-star/:id" element={<MyStar />} />
          <Route path="/my-star/:id/book"     element={<DigitalBook />} />
          <Route path="/my-star/:id/100days"  element={<HundredDays />} />
          <Route path="/story-draft-mvp"     element={<StoryDraftMVP />} />
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
          {/* 북은하 항해 MVP */}
          <Route path="/voyage"                    element={<VoyageWish />} />
          <Route path="/voyage/booking"            element={<VoyageBooking />} />
          <Route path="/voyage/payment/result"     element={<VoyagePaymentReturn />} />
          <Route path="/voyage/:id"                element={<VoyageStatus />} />
          <Route path="/voyage/:id/reflection"     element={<VoyageReflection />} />
          {/* 모바일 이용권 */}
          <Route path="/ticket/:code"              element={<MobileTicket />} />
          <Route path="/onboarding"                element={<OnboardingPage />} />
          <Route path="/admin/benefit"             element={<AdminBenefitPage />} />
          <Route path="/admin/experiment"          element={<AdminExperimentPage />} />
          <Route path="/admin/kpi"                 element={<AdminKpiPage />} />
          <Route path="/partner/manual"            element={<PartnerManual />} />
          <Route path="/partner/verify"            element={
            <Suspense fallback={<div style={{ minHeight:'100vh', background:'#0A1628' }} />}>
              <PartnerVerify />
            </Suspense>
          } />
          <Route path="*"                          element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
