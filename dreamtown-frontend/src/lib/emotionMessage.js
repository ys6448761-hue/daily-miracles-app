/**
 * emotionMessage.js — 소원 키워드 기반 감정 문장 생성
 * StarBirth.jsx 공유 문구에 사용
 */

const KEYWORD_MESSAGES = {
  '용기': '오늘은 조금 용기 내보고 싶었어요',
  '사랑': '소중한 마음을 별에 담아봤어요',
  '건강': '괜찮아지고 싶은 마음을 남겨봤어요',
  '성장': '조금씩 나아가고 싶은 하루예요',
  '도전': '두근거리는 마음을 별로 만들었어요',
  '치유': '오늘은 나를 위한 시간을 가졌어요',
  '관계': '소중한 사람을 생각하며 소원을 빌었어요',
  '꿈': '꿈을 향한 첫 걸음을 내딛었어요',
};

const DEFAULT_MESSAGES = [
  '오늘 내 마음을 별에 남겨봤어요',
  '이건 나만 보기 아까운 하루네요',
  '누군가에게 닿았으면 좋겠어요',
];

/**
 * 소원 텍스트에서 키워드를 감지해 감정 문장을 반환합니다.
 * 키워드 없으면 DEFAULT_MESSAGES 중 랜덤 반환.
 */
export function generateShareMessage(wishText) {
  if (wishText) {
    for (const [key, msg] of Object.entries(KEYWORD_MESSAGES)) {
      if (wishText.includes(key)) return msg;
    }
  }
  return DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)];
}
