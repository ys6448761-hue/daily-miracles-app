import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StorybookLanding from './pages/storybook/StorybookLanding.jsx';
import StorybookRestore from './pages/storybook/StorybookRestore.jsx';
import StorybookUpload from './pages/storybook/StorybookUpload.jsx';
import StorybookView from './components/storybook/StorybookView.jsx';

export default function StorybookApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/storybook" element={<StorybookLanding />} />
        <Route path="/storybook/restore" element={<StorybookRestore />} />
        <Route path="/storybook/:journey_id/upload" element={<StorybookUpload />} />
        <Route path="/storybook/:journey_id" element={<StorybookView />} />
        <Route path="*" element={<Navigate to="/storybook" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
