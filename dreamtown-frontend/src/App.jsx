import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLaunch from './pages/AppLaunch.jsx';
import DreamTownIntro from './pages/DreamTownIntro.jsx';
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-night-sky max-w-md mx-auto relative overflow-hidden">
        <Routes>
          <Route path="/"            element={<AppLaunch />} />
          <Route path="/intro"       element={<DreamTownIntro />} />
          <Route path="/wish"        element={<WishGate />} />
          <Route path="/star-birth"  element={<StarBirth />} />
          <Route path="/my-star/:id" element={<MyStar />} />
          <Route path="/galaxy"      element={<Galaxy />} />
          <Route path="/day"         element={<Day />} />
          <Route path="/history"     element={<History />} />
          <Route path="/star-growth" element={<StarGrowth />} />
          <Route path="/star"        element={<Star />} />
          <Route path="/postcard"    element={<Postcard />} />
          <Route path="/home"        element={<Home />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
