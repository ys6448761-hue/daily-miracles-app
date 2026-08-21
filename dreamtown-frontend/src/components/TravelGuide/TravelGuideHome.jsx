/**
 * TravelGuideHome
 * First screen: question-driven recommendation
 */

import React, { useState } from 'react';

function TravelGuideHome({ context, onGetRecommendations, loading, error }) {
  const [formData, setFormData] = useState({
    people_type: 'family_with_kids',
    time_available_minutes: 180,
    has_car: true,
    weather: { condition: 'clear', temperature_celsius: 25 },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGetRecommendations(formData);
  };

  return (
    <div className="travel-guide-home">
      <header className="hero">
        <h1>🌟 여수, 어디 갈까요?</h1>
        <p>당신의 여정에 맞춘 추천을 받아보세요</p>
      </header>

      {error && (
        <div className="error-alert">
          <p>⚠️ {error}</p>
        </div>
      )}

      <section className="menu-grid">
        <div className="menu-item">
          <span>📍</span>
          <p>어디 갈까요?</p>
        </div>
        <div className="menu-item">
          <span>🍚</span>
          <p>뭐 먹을까요?</p>
        </div>
        <div className="menu-item">
          <span>🚕</span>
          <p>어떻게 갈까요?</p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="recommendation-form">
        <div className="form-group">
          <label>누구와 함께 가나요?</label>
          <select
            value={formData.people_type}
            onChange={(e) =>
              setFormData({ ...formData, people_type: e.target.value })
            }
          >
            <option value="solo">혼자</option>
            <option value="couple">연인 / 부부</option>
            <option value="friends">친구</option>
            <option value="family">가족</option>
            <option value="family_with_kids">아이와</option>
            <option value="family_elderly">부모님과</option>
            <option value="group">단체</option>
          </select>
        </div>

        <div className="form-group">
          <label>얼마나 여유가 있나요?</label>
          <input
            type="number"
            min="30"
            max="480"
            value={formData.time_available_minutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                time_available_minutes: parseInt(e.target.value),
              })
            }
          />
          <span>분</span>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.has_car}
              onChange={(e) =>
                setFormData({ ...formData, has_car: e.target.checked })
              }
            />
            차가 있어요
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? '추천 받는 중...' : '추천 받기'}
        </button>
      </form>

      <footer className="footer">
        <p>✨ 지금 내 마음에 맞는 여수</p>
        <p>💬 궁금한 것이 있으신가요?</p>
      </footer>
    </div>
  );
}

export default TravelGuideHome;
