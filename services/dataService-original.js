const { initializeDB, closeDB } = require('../config/database');

// 데이터베이스 인스턴스
let db = null;

// 데이터베이스 초기화
async function initialize() {
  if (!db) {
    db = await initializeDB();
    console.log('🗄️ 데이터 서비스 초기화 완료');
  }
  return db;
}

// 스토리 저장
async function saveStory(storyId, storyData) {
  await initialize();

  return new Promise((resolve, reject) => {
    // 트랜잭션 시작
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // 스토리 메인 데이터 저장
      const storyQuery = `
        INSERT OR REPLACE INTO stories (
          id, name, age, personality, hobby, dream_job,
          favorite_color, favorite_animal, special_memory,
          story_text, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      const storyParams = [
        storyId,
        storyData.name,
        storyData.age,
        storyData.personality,
        storyData.hobby,
        storyData.dreamJob,
        storyData.favoriteColor,
        storyData.favoriteAnimal,
        storyData.specialMemory,
        storyData.story
      ];

      db.run(storyQuery, storyParams, function(err) {
        if (err) {
          db.run('ROLLBACK');
          console.error('❌ 스토리 저장 실패:', err.message);
          reject(err);
          return;
        }

        // 기존 이미지 삭제 (업데이트 시)
        db.run('DELETE FROM story_images WHERE story_id = ?', [storyId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          // 이미지 데이터 저장
          if (storyData.images && storyData.images.length > 0) {
            const imageQuery = `
              INSERT INTO story_images (story_id, image_url, page_number, is_blank_frame)
              VALUES (?, ?, ?, ?)
            `;

            let completed = 0;
            const totalImages = storyData.images.length;

            storyData.images.forEach((imageUrl, index) => {
              if (imageUrl) {
                const isBlankFrame = index === storyData.images.length - 1;
                const pageNumber = isBlankFrame ? 11 : index + 1;

                db.run(imageQuery, [storyId, imageUrl, pageNumber, isBlankFrame], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }

                  completed++;
                  if (completed === totalImages) {
                    // 모든 이미지 저장 완료
                    db.run('COMMIT', (err) => {
                      if (err) {
                        console.error('❌ 트랜잭션 커밋 실패:', err.message);
                        reject(err);
                      } else {
                        console.log(`💾 스토리 저장 완료: ${storyId} (이미지 ${totalImages}개)`);
                        resolve(storyId);
                      }
                    });
                  }
                });
              } else {
                completed++;
                if (completed === totalImages) {
                  db.run('COMMIT', (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(storyId);
                    }
                  });
                }
              }
            });
          } else {
            // 이미지가 없는 경우
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('❌ 트랜잭션 커밋 실패:', err.message);
                reject(err);
              } else {
                console.log(`💾 스토리 저장 완료: ${storyId} (이미지 없음)`);
                resolve(storyId);
              }
            });
          }
        });
      });
    });
  });
}

// 스토리 조회 (이미지 포함)
async function getStory(storyId) {
  await initialize();

  return new Promise((resolve, reject) => {
    // 스토리 메인 데이터 조회
    const storyQuery = `
      SELECT * FROM stories WHERE id = ?
    `;

    db.get(storyQuery, [storyId], (err, storyRow) => {
      if (err) {
        console.error('❌ 스토리 조회 실패:', err.message);
        reject(err);
        return;
      }

      if (!storyRow) {
        resolve(null);
        return;
      }

      // 이미지 데이터 조회
      const imageQuery = `
        SELECT image_url, page_number, is_blank_frame
        FROM story_images
        WHERE story_id = ?
        ORDER BY page_number ASC
      `;

      db.all(imageQuery, [storyId], (err, imageRows) => {
        if (err) {
          console.error('❌ 이미지 조회 실패:', err.message);
          reject(err);
          return;
        }

        // 데이터 구조 변환 (기존 형식과 호환)
        const storyData = {
          id: storyRow.id,
          name: storyRow.name,
          age: storyRow.age,
          personality: storyRow.personality,
          hobby: storyRow.hobby,
          dreamJob: storyRow.dream_job,
          favoriteColor: storyRow.favorite_color,
          favoriteAnimal: storyRow.favorite_animal,
          specialMemory: storyRow.special_memory,
          story: storyRow.story_text,
          images: imageRows.map(row => row.image_url),
          createdAt: new Date(storyRow.created_at)
        };

        resolve(storyData);
      });
    });
  });
}

// 모든 스토리 개수
async function getStoriesCount() {
  await initialize();

  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM stories', [], (err, row) => {
      if (err) {
        console.error('❌ 스토리 개수 조회 실패:', err.message);
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
}

// 스토리 존재 여부 확인
async function hasStory(storyId) {
  await initialize();

  return new Promise((resolve, reject) => {
    db.get('SELECT 1 FROM stories WHERE id = ?', [storyId], (err, row) => {
      if (err) {
        console.error('❌ 스토리 존재 확인 실패:', err.message);
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
}

// 최근 스토리 목록 조회 (관리용)
async function getRecentStories(limit = 10) {
  await initialize();

  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, name, created_at
      FROM stories
      ORDER BY created_at DESC
      LIMIT ?
    `;

    db.all(query, [limit], (err, rows) => {
      if (err) {
        console.error('❌ 최근 스토리 조회 실패:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 데이터베이스 통계 조회
async function getDatabaseStats() {
  await initialize();

  return new Promise((resolve, reject) => {
    const queries = {
      totalStories: 'SELECT COUNT(*) as count FROM stories',
      totalImages: 'SELECT COUNT(*) as count FROM story_images',
      oldestStory: 'SELECT created_at FROM stories ORDER BY created_at ASC LIMIT 1',
      newestStory: 'SELECT created_at FROM stories ORDER BY created_at DESC LIMIT 1'
    };

    const stats = {};
    const queryKeys = Object.keys(queries);
    let completed = 0;

    queryKeys.forEach(key => {
      db.get(queries[key], [], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (key.includes('Story')) {
          stats[key] = row ? row.created_at : null;
        } else {
          stats[key] = row ? row.count : 0;
        }

        completed++;
        if (completed === queryKeys.length) {
          resolve(stats);
        }
      });
    });
  });
}

// 데이터베이스 정리 (서버 종료 시)
async function cleanup() {
  if (db) {
    await closeDB(db);
    db = null;
    console.log('🗄️ 데이터 서비스 정리 완료');
  }
}

module.exports = {
  initialize,
  saveStory,
  getStory,
  getStoriesCount,
  hasStory,
  getRecentStories,
  getDatabaseStats,
  cleanup
};