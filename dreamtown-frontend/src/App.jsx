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
import VoyageLanding from './pages/VoyageLanding.jsx';
import VoyageWish from './pages/VoyageWish.jsx';
import VoyageBooking from './pages/VoyageBooking.jsx';
import VoyageStatus from './pages/VoyageStatus.jsx';
import VoyageReflection from './pages/VoyageReflection.jsx';
import VoyagePaymentReturn from './pages/VoyagePaymentReturn.jsx';
import MobileTicket from './pages/MobileTicket.jsx';
// html5-qrcode가 포함된 PartnerVerify는 lazy load — 파트너 화면 진입 시에만 번들 로드
const PartnerVerify = lazy(() => import('./pages/PartnerVerify.jsx'));
import PartnerManual from './pages/PartnerManual.jsx';
import PartnerApply from './pages/PartnerApply.jsx';
import PartnerApplyResult from './pages/PartnerApplyResult.jsx';
import PartnerLogin from './pages/PartnerLogin.jsx';
import PartnerDashboard from './pages/PartnerDashboard.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import AdminBenefitPage from './pages/AdminBenefitPage.jsx';
import AdminExperimentPage from './pages/AdminExperimentPage.jsx';
import AdminKpiPage from './pages/AdminKpiPage.jsx';
import AdminAiDashboard from './pages/AdminAiDashboard.jsx';
import VoyageAdmin from './pages/VoyageAdmin.jsx';
import JourneyWishPage from './pages/JourneyWishPage.jsx';
import JourneyContextPage from './pages/JourneyContextPage.jsx';
import JourneyRecommendPage from './pages/JourneyRecommendPage.jsx';
import StarJourneyPage from './pages/StarJourneyPage.jsx';
import Day7Complete from './pages/Day7Complete.jsx';
import HometownLanding from './pages/HometownLanding.jsx';
import CablecarPage from './pages/CablecarPage.jsx';
import CablecarLandingPage from './pages/CablecarLandingPage.jsx';
import AurumCreatePage from './pages/AurumCreatePage.jsx';
import AurumViewPage from './pages/AurumViewPage.jsx';
import PromiseLocationPage from './pages/PromiseLocationPage.jsx';
import PromiseViewPage from './pages/PromiseViewPage.jsx';
import MissionPage from './pages/MissionPage.jsx';
import HometownAdmin from './pages/HometownAdmin.jsx';
import Shop from './pages/Shop.jsx';
import ShopDetail from './pages/ShopDetail.jsx';
import ShopCheckout from './pages/ShopCheckout.jsx';
import ShopOrders from './pages/ShopOrders.jsx';
import PartnerOrders from './pages/partner/PartnerOrders.jsx';
import PartnerSettlement from './pages/partner/PartnerSettlement.jsx';
import PartnerAgreement from './pages/partner/PartnerAgreement.jsx';
import PartnerSubscribe from './pages/partner/PartnerSubscribe.jsx';
import AdminPartners from './pages/admin/AdminPartners.jsx';
import AdminQRCenter from './pages/admin/AdminQRCenter.jsx';

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
          <Route path="/day"              element={<Day />} />
          <Route path="/day7-complete"   element={<Day7Complete />} />
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
          <Route path="/voyage"                    element={<VoyageLanding />} />
          <Route path="/voyage/wish"               element={<VoyageWish />} />
          <Route path="/voyage/booking"            element={<VoyageBooking />} />
          <Route path="/voyage/payment/result"     element={<VoyagePaymentReturn />} />
          <Route path="/voyage/:id"                element={<VoyageStatus />} />
          <Route path="/voyage/:id/reflection"     element={<VoyageReflection />} />
          {/* 모바일 이용권 */}
          <Route path="/ticket/:code"              element={<MobileTicket />} />
          <Route path="/onboarding"                element={<OnboardingPage />} />
          {/* 케이블카 캐빈 QR 진입 */}
          <Route path="/cablecar"                  element={<CablecarPage />} />
          {/* 케이블카 각성 패스 구매 랜딩 */}
          <Route path="/cablecar-landing"          element={<CablecarLandingPage />} />
          {/* 아우룸 — 위치 잠금 기억 캡슐 */}
          <Route path="/aurum/create"              element={<AurumCreatePage />} />
          <Route path="/aurum/:id"                 element={<AurumViewPage />} />
          {/* 약속 기록 — 장소 × 시간 이중 잠금 */}
          <Route path="/location/:locationId"      element={<PromiseLocationPage />} />
          <Route path="/promise/:id"               element={<PromiseViewPage />} />
          {/* 여수 미션 + 포인트 */}
          <Route path="/missions"                  element={<MissionPage />} />
          {/* 별들의 고향 */}
          <Route path="/hometown"                  element={<HometownLanding />} />
          <Route path="/admin/hometown/:partnerId" element={<HometownAdmin />} />
          {/* 어드민 — 일반 사용자 인증 가드 완전 제외, VoyageAdmin 자체 TokenGate만 사용 */}
          <Route path="/admin/benefit"             element={<AdminBenefitPage />} />
          <Route path="/admin/experiment"          element={<AdminExperimentPage />} />
          <Route path="/admin/kpi"                 element={<AdminKpiPage />} />
          <Route path="/admin/ai-cost"             element={<AdminAiDashboard />} />
          <Route path="/admin/voyage"              element={<VoyageAdmin />} />
          <Route path="/admin/partners"            element={<AdminPartners />} />
          <Route path="/admin/qr-center"           element={<AdminQRCenter />} />
          {/* /admin/* catch-all — catch-all → / → AppLaunch 경로 차단 */}
          <Route path="/admin/*"                   element={<VoyageAdmin />} />
          {/* Core Journey Flow */}
          <Route path="/journey"                   element={<JourneyWishPage />} />
          <Route path="/journey/context"           element={<JourneyContextPage />} />
          <Route path="/journey/recommend"         element={<JourneyRecommendPage />} />
          {/* Star Journey — 파트너 방문 동선 탐색 */}
          <Route path="/star-journey"              element={<StarJourneyPage />} />
          {/* 특산품 쇼핑 */}
          <Route path="/shop"                      element={<Shop />} />
          <Route path="/shop/orders"               element={<ShopOrders />} />
          <Route path="/shop/checkout"             element={<ShopCheckout />} />
          <Route path="/shop/:id"                  element={<ShopDetail />} />
          {/* 파트너 */}
          <Route path="/partner/apply"             element={<PartnerApply />} />
          <Route path="/partner/apply/result"     element={<PartnerApplyResult />} />
          <Route path="/partner/agreement"          element={<PartnerAgreement />} />
          <Route path="/partner/subscribe"         element={<PartnerSubscribe />} />
          <Route path="/partner/login"              element={<PartnerLogin />} />
          <Route path="/partner/dashboard"         element={<PartnerDashboard />} />
          <Route path="/partner/orders"            element={<PartnerOrders />} />
          <Route path="/partner/settlement"        element={<PartnerSettlement />} />
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
