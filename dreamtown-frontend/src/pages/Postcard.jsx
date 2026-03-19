import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PostcardView from '../features/galaxy/components/PostcardView';
import PostcardActions from '../features/galaxy/components/PostcardActions';

export default function PostcardPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [captureMode, setCaptureMode] = useState(false);

  const message = state?.message ?? '오늘은 조용히 빛나도 괜찮습니다';
  const growthLine = state?.growthLine ?? '';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-10">
      <PostcardView
        message={message}
        growthLine={growthLine}
        captureMode={captureMode}
      />

      <PostcardActions
        onBack={() => navigate(-1)}
        setCaptureMode={setCaptureMode}
        message={message}
      />
    </div>
  );
}
