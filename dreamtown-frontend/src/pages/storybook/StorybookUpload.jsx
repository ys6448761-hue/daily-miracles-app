/**
 * StorybookUpload.jsx
 * C7A E2E: Upload 6 REAL photos (C3A)
 *
 * Flow:
 * 1. Display 6 canonical REAL slots: jinamgwan/real_a, real_b, cablecar/real_a, real_b, jongpo/real_a, real_b
 * 2. For each: POST /api/storybook/:journey_id/upload (multipart, with session cookie)
 * 3. After all 6: GET /api/storybook/my-journey to verify status = photos_complete
 * 4. Navigate to /storybook/:journey_id (view)
 *
 * C3B Note: Story Art upload is handled by operator (manual, /api/admin/storybook/.../upload-story-art)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StorybookUpload.css';

const CANONICAL_SLOTS = [
  { location: 'jinamgwan', slot: 'real_a', label: '진남관 사진 1', emoji: '❤️' },
  { location: 'jinamgwan', slot: 'real_b', label: '진남관 사진 2', emoji: '❤️' },
  { location: 'cablecar', slot: 'real_a', label: '케이블카 사진 1', emoji: '🌬️' },
  { location: 'cablecar', slot: 'real_b', label: '케이블카 사진 2', emoji: '🌬️' },
  { location: 'jongpo', slot: 'real_a', label: '종포 사진 1', emoji: '⭐' },
  { location: 'jongpo', slot: 'real_b', label: '종포 사진 2', emoji: '⭐' }
];

function StorybookUpload() {
  const { journey_id } = useParams();
  const navigate = useNavigate();
  const [uploadStatus, setUploadStatus] = useState({});
  const [overallStatus, setOverallStatus] = useState('ready');
  const [error, setError] = useState(null);

  const handleFileUpload = async (location, slot, file) => {
    if (!file) return;

    try {
      setUploadStatus(prev => ({ ...prev, [`${location}/${slot}`]: 'uploading' }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('location', location);
      formData.append('slot', slot);

      const response = await fetch(`/api/storybook/${journey_id}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();

      setUploadStatus(prev => ({ ...prev, [`${location}/${slot}`]: 'success' }));
      return data;
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus(prev => ({ ...prev, [`${location}/${slot}`]: 'error' }));
      throw err;
    }
  };

  const handleSubmit = async () => {
    try {
      setOverallStatus('uploading');
      setError(null);

      const fileInputs = document.querySelectorAll('.upload-input');
      let completedCount = 0;

      for (const input of fileInputs) {
        if (input.files && input.files[0]) {
          const location = input.dataset.location;
          const slot = input.dataset.slot;
          await handleFileUpload(location, slot, input.files[0]);
          completedCount++;
        }
      }

      if (completedCount !== 6) {
        throw new Error(`업로드된 사진이 부족합니다 (${completedCount}/6)`);
      }

      // Verify status = photos_complete
      const verifyResponse = await fetch('/api/storybook/my-journey', {
        credentials: 'include'
      });

      if (!verifyResponse.ok) {
        throw new Error('상태 확인 실패');
      }

      const verifyData = await verifyResponse.json();

      if (verifyData.status !== 'photos_complete') {
        throw new Error(`예상치 못한 상태: ${verifyData.status}`);
      }

      setOverallStatus('complete');
      navigate(`/storybook/${journey_id}`);
    } catch (err) {
      setError(err.message || '업로드에 실패했습니다');
      setOverallStatus('error');
      console.error('Submit error:', err);
    }
  };

  const uploadedCount = Object.values(uploadStatus).filter(s => s === 'success').length;
  const canSubmit = uploadedCount === 6 && overallStatus === 'ready';

  return (
    <div className="storybook-upload">
      <div className="upload-container">
        <h1 className="upload-title">여행 사진 올리기</h1>
        <p className="upload-subtitle">6장의 사진을 올려주세요 (2장 × 3곳)</p>

        <div className="upload-grid">
          {CANONICAL_SLOTS.map(({ location, slot, label, emoji }) => (
            <div key={`${location}/${slot}`} className="upload-slot">
              <div className="slot-emoji">{emoji}</div>
              <label className="slot-label">{label}</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="upload-input"
                data-location={location}
                data-slot={slot}
                disabled={overallStatus === 'uploading' || overallStatus === 'complete'}
              />
              <div className={`slot-status ${uploadStatus[`${location}/${slot}`]}`}>
                {uploadStatus[`${location}/${slot}`] === 'success' && '✅'}
                {uploadStatus[`${location}/${slot}`] === 'uploading' && '⏳'}
                {uploadStatus[`${location}/${slot}`] === 'error' && '❌'}
              </div>
            </div>
          ))}
        </div>

        <div className="upload-progress">
          <p className="progress-text">
            {uploadedCount} / 6 사진 준비됨
          </p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(uploadedCount / 6) * 100}%` }} />
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={!canSubmit || overallStatus === 'uploading'}
        >
          {overallStatus === 'uploading' ? '업로드 중...' : '사진 완료'}
        </button>
      </div>
    </div>
  );
}

export default StorybookUpload;
