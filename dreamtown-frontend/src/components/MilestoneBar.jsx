// 항해 마일스톤 진행바 — MyStar / StarDetail 공용 컴포넌트
//
// Props (두 가지 사용 방식):
//   A. milestones 배열 전달 (서버 사전계산값 사용 — 권장)
//      milestones: [{ day, reached, date }]  ← /detail API 반환값
//
//   B. createdAt + daysSinceBirth 전달 (클라이언트 계산)
//      createdAt      : 별 탄생일 (ISO string)
//      daysSinceBirth : D+ 숫자

const DEFAULT_MILESTONES = [1, 7, 30, 100, 365];

function computeMilestoneDate(createdAt, targetDay) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + targetDay - 1);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function MilestoneBar({ milestones, createdAt, daysSinceBirth }) {
  // milestones 배열이 있으면 그대로 사용, 없으면 직접 계산
  const nodes = milestones?.length > 0
    ? milestones
    : DEFAULT_MILESTONES.map(day => ({
        day,
        reached: (daysSinceBirth ?? 0) >= day,
        date:    computeMilestoneDate(createdAt, day),
      }));

  return (
    <div className="mb-5">
      <p style={{ color: 'rgba(232,228,217,0.5)', fontSize: 11, marginBottom: 10, paddingLeft: 4 }}>
        항해 여정
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0 4px' }}>
        {nodes.map(({ day, reached, date }, i) => {
          const isLast = i === nodes.length - 1;
          return (
            <div key={day} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1 }}>
              {/* 마일스톤 노드 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: reached ? '#FFD76A' : 'transparent',
                  border: `2px solid ${reached ? '#FFD76A' : 'rgba(255,255,255,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {reached
                    ? <span style={{ fontSize: 8, color: '#0a0e1a', fontWeight: 700 }}>✓</span>
                    : <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.2)' }}>●</span>}
                </div>
                <span style={{
                  fontSize: 9, marginTop: 4,
                  color: reached ? 'rgba(255,215,106,0.7)' : 'rgba(255,255,255,0.2)',
                }}>
                  D+{day}
                </span>
                {/* MM.DD — 날짜 있을 때만 렌더링 */}
                {date && (
                  <span style={{
                    fontSize: 9,
                    color: reached ? 'rgba(255,215,106,0.5)' : 'rgba(255,255,255,0.15)',
                  }}>
                    {date}
                  </span>
                )}
              </div>

              {/* 연결선 — marginBottom으로 원 중심 높이에 맞춤 */}
              {!isLast && (
                <div style={{
                  flex: 1, height: 1,
                  marginBottom: date ? 25 : 14,
                  background: reached ? 'rgba(255,215,106,0.4)' : 'rgba(255,255,255,0.1)',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
