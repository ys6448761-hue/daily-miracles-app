/**
 * TravelGuideHome
 * Day-1 MVP: Integrated journey experience
 * Hero: "소원이님, 오늘의 여수를 만나볼까요?"
 * Four cards: 가볼 곳 → 먹을 곳 → 쉬어갈 곳 → 별빛혜택
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
        <h1>소원이님,<br />오늘의 여수를 만나볼까요?</h1>
        <p className="hero-supporting">어디를 가야 할지, 무엇을 먹을지, 어디서 잠시 쉬어갈지, 받을 수 있는 작은 혜택까지<br />Lumi가 지금 여행에 맞춰 찾아드릴게요.</p>
      </header>

      {error && (
        <div className="error-alert">
          <p>⚠️ {error}</p>
        </div>
      )}

      <section className="experience-cards">
        <div className="experience-card">
          <div className="card-icon">📍</div>
          <h3>가볼 곳</h3>
          <p>소원이에게 맞는<br />여수의 장소</p>
        </div>
        <div className="experience-card">
          <div className="card-icon">🍽️</div>
          <h3>먹을 곳</h3>
          <p>지금 동선에 맞는<br />한 끼</p>
        </div>
        <div className="experience-card">
          <div className="card-icon">☕</div>
          <h3>쉬어갈 곳</h3>
          <p>여행 중 잠깐<br />숨 고르기</p>
        </div>
        <div className="experience-card">
          <div className="card-icon">⭐</div>
          <h3>별빛혜택</h3>
          <p>지금 받을 수 있는<br />작은 혜택</p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="recommendation-form">
        <div className="form-intro">
          <p>몇 가지만 알려주시면 Lumi가 지금 여행에 맞게 골라드려요.</p>
        </div>

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

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '추천 받는 중...' : '오늘의 여수 추천받기'}
        </button>
      </form>
    </div>
  );
}

export default TravelGuideHome;
