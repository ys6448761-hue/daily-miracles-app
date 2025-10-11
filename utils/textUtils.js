// 스토리에서 이미지 설명 추출하는 함수
function extractImageDescriptions(storyText) {
  const imageDescriptions = [];
  const regex = /\*\*이미지:\*\*\s*(.+?)(?=\n|\*\*스토리)/g;
  let match;

  while ((match = regex.exec(storyText)) !== null) {
    imageDescriptions.push(match[1].trim());
  }

  return imageDescriptions;
}

module.exports = {
  extractImageDescriptions
};