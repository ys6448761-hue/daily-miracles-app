/**
 * StorybookUpload.jsx
 * C7A E2E: Upload 6 REAL photos (C3A) with client-side optimization
 *
 * Flow:
 * 1. Display 6 canonical REAL slots: jinamgwan/real_a, real_b, cablecar/real_a, real_b, jongpo/real_a, real_b
 * 2. For each: Select file → Optimize (resize to max 2048px, EXIF orientation, JPEG 0.8) → POST /api/storybook/:journey_id/upload
 * 3. After all 6: GET /api/storybook/my-journey to verify status = photos_complete
 * 4. Navigate to /storybook/:journey_id (view)
 *
 * Optimization:
 * - HEIC/HEIF → JPEG (heic2any)
 * - EXIF orientation reading (exifr)
 * - Canvas resize + rotate
 * - Target: 1-2MB, max 2048px
 *
 * C3B Note: Story Art upload is handled by operator (manual, /api/admin/storybook/.../upload-story-art)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import exifr from 'exifr';
import heic2any from 'heic2any';
import './StorybookUpload.css';

const CANONICAL_SLOTS = [
  { location: 'jinamgwan', slot: 'real_a', label: '진남관 사진 1', emoji: '❤️' },
  { location: 'jinamgwan', slot: 'real_b', label: '진남관 사진 2', emoji: '❤️' },
  { location: 'cablecar', slot: 'real_a', label: '케이블카 사진 1', emoji: '🌬️' },
  { location: 'cablecar', slot: 'real_b', label: '케이블카 사진 2', emoji: '🌬️' },
  { location: 'jongpo', slot: 'real_a', label: '종포 사진 1', emoji: '⭐' },
  { location: 'jongpo', slot: 'real_b', label: '종포 사진 2', emoji: '⭐' }
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB server limit
const MAX_DIMENSION = 2048; // pixels
const JPEG_QUALITY = 0.8;

async function optimizeImageForStorybook(file) {
  try {
    let processFile = file;

    // Convert HEIC/HEIF to JPEG
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name?.toLowerCase().endsWith('.heic')) {
      try {
        processFile = await heic2any({ blob: file, toType: 'image/jpeg' });
      } catch (heicErr) {
        throw new Error(`HEIC 변환 실패: ${heicErr.message}`);
      }
    }

    // Load image
    const img = new Image();
    const reader = new FileReader();

    const loadImage = new Promise((resolve, reject) => {
      reader.onload = () => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(processFile);
    });

    await loadImage;

    // Read EXIF orientation
    let orientation = 1;
    try {
      const exifData = await exifr.parse(processFile, { pick: ['Orientation'] });
      orientation = exifData?.Orientation || 1;
    } catch (exifErr) {
      // Fallback to default orientation if EXIF parsing fails
      console.warn('EXIF reading failed, using default orientation:', exifErr);
    }

    // Calculate resized dimensions (max 2048px on longest side)
    let { width, height } = img;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    // EXIF orientation mapping (EXIF orientation values 1-8)
    const orientationMap = {
      1: { angle: 0, transpose: false }, // Normal
      2: { angle: 0, transpose: true },  // Flip horizontal
      3: { angle: 180, transpose: false }, // Rotate 180°
      4: { angle: 0, transpose: true },  // Flip vertical
      5: { angle: 90, transpose: true },  // Rotate 90° + flip
      6: { angle: 90, transpose: false }, // Rotate 90°
      7: { angle: 270, transpose: true }, // Rotate 270° + flip
      8: { angle: 270, transpose: false } // Rotate 270°
    };

    const orientConfig = orientationMap[orientation] || orientationMap[1];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions (swap if rotating 90/270)
    if (orientConfig.angle === 90 || orientConfig.angle === 270) {
      canvas.width = height;
      canvas.height = width;
    } else {
      canvas.width = width;
      canvas.height = height;
    }

    // Apply rotation and flipping
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((orientConfig.angle * Math.PI) / 180);
    if (orientConfig.transpose) ctx.scale(-1, 1);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();

    // Encode to JPEG blob
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas blob conversion failed'));
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    });

    // Cleanup canvas
    canvas.width = 0;
    canvas.height = 0;

    // Check final size
    if (blob.size > MAX_FILE_SIZE) {
      const sizeMB = (blob.size / 1024 / 1024).toFixed(1);
      throw new Error(`최적화 후 파일이 여전히 ${sizeMB}MB입니다. 업로드할 수 없습니다.`);
    }

    return blob;
  } catch (err) {
    throw new Error(`사진 처리 실패: ${err.message}`);
  }
}

function StorybookUpload() {
  const { journey_id } = useParams();
  const navigate = useNavigate();
  const [uploadStatus, setUploadStatus] = useState({});
  const [optimizingSlot, setOptimizingSlot] = useState(null);
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

      // Verify all six canonical REAL slots are uploaded on server (no re-upload)
      const verifyResponse = await fetch('/api/storybook/my-journey', {
        credentials: 'include'
      });

      if (!verifyResponse.ok) {
        throw new Error('상태 확인 실패');
      }

      const data = await verifyResponse.json();
      const journeyStatus = data?.journey?.status;

      if (journeyStatus !== 'photos_complete') {
        throw new Error(`예상치 못한 상태: ${journeyStatus ?? 'missing'}`);
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
          {CANONICAL_SLOTS.map(({ location, slot, label, emoji }) => {
            const inputId = `file-${location}-${slot}`;
            const slotKey = `${location}/${slot}`;
            const isOptimizing = optimizingSlot === slotKey;
            const handleFileChange = async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  setOptimizingSlot(slotKey);
                  setUploadStatus(prev => ({ ...prev, [slotKey]: 'optimizing' }));
                  setError(null);
                  const optimizedBlob = await optimizeImageForStorybook(file);
                  const optimizedFile = new File([optimizedBlob], file.name, { type: 'image/jpeg' });
                  await handleFileUpload(location, slot, optimizedFile);
                  // Clear input to prevent accidental re-uploads
                  e.target.value = '';
                } catch (err) {
                  console.error('Optimization error:', err);
                  setUploadStatus(prev => ({ ...prev, [slotKey]: 'error' }));
                  setError(err.message || '사진 처리 중 오류가 발생했습니다');
                } finally {
                  setOptimizingSlot(null);
                }
              }
            };
            return (
              <div key={slotKey} className="upload-slot">
                <div className="slot-emoji">{emoji}</div>
                <label className="slot-label" htmlFor={inputId}>{label}</label>
                <input
                  id={inputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="upload-input"
                  data-location={location}
                  data-slot={slot}
                  onChange={handleFileChange}
                  disabled={overallStatus === 'uploading' || overallStatus === 'complete' || isOptimizing}
                />
                <div className={`slot-status ${uploadStatus[slotKey]}`}>
                  {uploadStatus[slotKey] === 'success' && '✅'}
                  {uploadStatus[slotKey] === 'uploading' && '⏳'}
                  {uploadStatus[slotKey] === 'optimizing' && '⚙️'}
                  {uploadStatus[slotKey] === 'error' && '❌'}
                </div>
              </div>
            );
          })}
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
