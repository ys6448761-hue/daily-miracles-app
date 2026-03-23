// 항해 마일스톤 진행바 — MyStar / StarDetail 공용 컴포넌트
// Props:
//   createdAt      : 별 탄생일 (ISO string)
//   daysSinceBirth : D+ 계산 결과 (number)

const MILESTONES = [1, 7, 30, 100, 365];

function getMilestoneDate(createdAt, targetDay) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  d.setDate(d.getDate() + targetDay - 1);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function MilestoneBar({ createdAt, daysSinceBirth }) {
  return (
    <div className="mb-5">
      <p style={{ color: 'rgba(232,228,217,0.5)', fontSize: 11, marginBottom: 10, paddingLeft: 4 }}>
        항해 여정
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0 4px' }}>
        {MILESTONES.map((day, i) => {
          const reached = daysSinceBirth >= day;
          const isLast  = i === MILESTONES.length - 1;
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
                <span style={{
                  fontSize: 9,
                  color: reached ? 'rgba(255,215,106,0.5)' : 'rgba(255,255,255,0.15)',
                }}>
                  {getMilestoneDate(createdAt, day)}
                </span>
              </div>

              {/* 연결선 — marginBottom으로 원 중심 높이에 맞춤 */}
              {!isLast && (
                <div style={{
                  flex: 1, height: 1, marginBottom: 25,
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
