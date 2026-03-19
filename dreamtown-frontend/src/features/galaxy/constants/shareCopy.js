/**
 * shareCopy.js — Postcard 공유 카피 (루미 설계)
 *
 * 원칙:
 * ❌ 서비스 설명 / 기능 강조 / 감동 강요
 * ✅ 공감 / 여운 / "내 얘기 같은 느낌"
 *
 * 구조: [공감 한 줄] + [여운 한 줄] + [방향별 감정 한 줄] + [CTA + 링크]
 */

// 3종 카피 — A/B/C 실험 (share_copy_v1)
export const SHARE_COPY = {
  A: {
    body: '요즘 이런 순간, 있지 않았나요?\n\n나도 몰랐던 마음을\n조금 알게 된 것 같아요',
    cta:  '👉 내 빛도 한번 선택해보기',
  },
  B: {
    body: '그냥 지나갈 수도 있었던 하루였는데\n\n조금 다르게 느껴졌어요',
    cta:  '👉 당신도 한번 해보세요',
  },
  C: {
    body: '이거 생각보다 이상하다\n\n근데… 좀 맞는 것 같아',
    cta:  '👉 나도 해보기',
  },
};

// 방향별 감정 한 줄 — 카피 body와 CTA 사이 삽입 (선택 경험의 잔향)
export const DIRECTION_FEELING = {
  north: '"조금 괜찮아진 느낌이에요"',
  east:  '"뭔가 시작하고 싶어졌어요"',
  west:  '"마음이 좀 정리됐어요"',
  south: '"이대로도 괜찮은 것 같아요"',
};

// 공유 텍스트 조합 — 카피 + 방향 감정 + CTA + 링크
export function buildShareText({ variant, direction, shareUrl }) {
  const { body, cta } = SHARE_COPY[variant] || SHARE_COPY.A;
  const feeling = direction ? DIRECTION_FEELING[direction] : null;

  const lines = [body];
  if (feeling) lines.push(feeling);
  lines.push(`${cta}\n${shareUrl}`);

  return lines.join('\n\n');
}
