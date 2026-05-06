import { useState, useEffect, useCallback } from 'react';
import { getStarFeed, postResonate } from '../api/dreamtown.js';

const GEM_COLOR = {
  citrine:  'rgba(255, 215, 106, 0.18)',
  sapphire: 'rgba(106, 168, 255, 0.18)',
  emerald:  'rgba(106, 220, 168, 0.18)',
  ruby:     'rgba(255, 106, 106, 0.18)',
  diamond:  'rgba(240, 240, 255, 0.18)',
};

const GEM_GLOW = {
  citrine:  'rgba(255, 215, 106, 0.55)',
  sapphire: 'rgba(106, 168, 255, 0.55)',
  emerald:  'rgba(106, 220, 168, 0.55)',
  ruby:     'rgba(255, 106, 106, 0.55)',
  diamond:  'rgba(240, 240, 255, 0.55)',
};

function StarCard({ star }) {
  const [resonated, setResonated] = useState(false);

  const handleResonate = useCallback(async () => {
    if (resonated) return;
    setResonated(true);
    try {
      await postResonate(star.id);
    } catch {
      setResonated(false);
    }
  }, [star.id, resonated]);

  const borderColor = GEM_COLOR[star.gem] || 'rgba(255,255,255,0.08)';
  const glowColor   = GEM_GLOW[star.gem]  || 'rgba(255,255,255,0.4)';

  return (
    <div style={{
      background: 'rgba(12, 10, 30, 0.85)',
      border: `1px solid ${borderColor}`,
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      {star.image_url && (
        <img
          src={star.image_url}
          alt=""
          style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }}
        />
      )}

      <div style={{ padding: '16px 20px 20px' }}>
        {star.public_message && (
          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.82)',
            lineHeight: 1.6,
            marginBottom: 16,
            fontStyle: 'italic',
          }}>
            "{star.public_message}"
          </p>
        )}

        <button
          onClick={handleResonate}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
            background: resonated ? borderColor : 'transparent',
            color: resonated ? glowColor : 'rgba(255,255,255,0.5)',
            fontSize: 14,
            cursor: resonated ? 'default' : 'pointer',
            transition: 'all 0.35s ease',
            boxShadow: resonated ? `0 0 18px ${glowColor}` : 'none',
          }}
        >
          {resonated ? '✦ 공명했어요' : '나도 이런 적 있어요'}
        </button>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [stars,   setStars]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getStarFeed({ limit: 20 })
      .then(data => setStars(data.stars || []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #080618 0%, #0c0a20 100%)',
      padding: '32px 20px 60px',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      <h1 style={{
        fontSize: 18,
        fontWeight: 600,
        color: 'rgba(255,215,106,0.85)',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        별들의 울림
      </h1>
      <p style={{
        fontSize: 13,
        color: 'rgba(255,255,255,0.35)',
        textAlign: 'center',
        marginBottom: 32,
      }}>
        각자의 별이 남긴 빛
      </p>

      {loading && (
        <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 60 }}>
          별을 불러오는 중...
        </p>
      )}

      {error && (
        <p style={{ color: 'rgba(255,106,106,0.6)', textAlign: 'center', marginTop: 60 }}>
          {error}
        </p>
      )}

      {!loading && !error && stars.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 60 }}>
          아직 공유된 별이 없어요
        </p>
      )}

      {stars.map(star => (
        <StarCard key={star.id} star={star} />
      ))}
    </div>
  );
}
