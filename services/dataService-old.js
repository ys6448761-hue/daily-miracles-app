// 메모리 데이터베이스 (실제 운영시 MongoDB 사용 권장)
const stories = new Map();

// 스토리 저장
function saveStory(storyId, storyData) {
  stories.set(storyId, {
    ...storyData,
    createdAt: new Date(),
    id: storyId
  });
  return storyId;
}

// 스토리 조회
function getStory(storyId) {
  return stories.get(storyId);
}

// 모든 스토리 개수
function getStoriesCount() {
  return stories.size;
}

// 스토리 존재 여부 확인
function hasStory(storyId) {
  return stories.has(storyId);
}

module.exports = {
  saveStory,
  getStory,
  getStoriesCount,
  hasStory
};