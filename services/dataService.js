const { initializeDB, closeDB } = require('../config/database');
const { database: logDatabase, error: logError, info: logInfo } = require('../config/logger');
const { createError } = require('../utils/errors');

// 데이터베이스 인스턴스
let db = null;

// 데이터베이스 초기화
async function initialize() {
  try {
    if (!db) {
      db = await initializeDB();
      logDatabase('initialized', { status: 'success' });
    }
    return db;
  } catch (error) {
    logError('Database initialization failed', error);
    throw createError.database('데이터베이스 초기화에 실패했습니다.', error);
  }
}

// 스토리 저장
async function saveStory(storyId, storyData) {
  try {
    await initialize();

    // 입력 데이터 검증
    validateStoryData(storyData);

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

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
          parseInt(storyData.age),
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
            logError('Story save failed', err, { storyId, operation: 'save_story' });
            reject(createError.database('스토리 저장에 실패했습니다.', err));
            return;
          }

          // 기존 이미지 삭제 (업데이트 시)
          db.run('DELETE FROM story_images WHERE story_id = ?', [storyId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              logError('Image cleanup failed', err, { storyId, operation: 'cleanup_images' });
              reject(createError.database('이미지 데이터 정리에 실패했습니다.', err));
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
                      logError('Image save failed', err, {
                        storyId,
                        imageIndex: index,
                        pageNumber,
                        operation: 'save_image'
                      });
                      reject(createError.database('이미지 저장에 실패했습니다.', err));
                      return;
                    }

                    completed++;
                    if (completed === totalImages) {
                      // 모든 이미지 저장 완료
                      db.run('COMMIT', (err) => {
                        if (err) {
                          logError('Transaction commit failed', err, { storyId });
                          reject(createError.database('데이터 저장 완료에 실패했습니다.', err));
                        } else {
                          const duration = Date.now() - startTime;
                          logDatabase('story_saved', {
                            storyId,
                            imageCount: totalImages,
                            duration: `${duration}ms`
                          });
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
                        reject(createError.database('데이터 저장 완료에 실패했습니다.', err));
                      } else {
                        const duration = Date.now() - startTime;
                        logDatabase('story_saved', {
                          storyId,
                          imageCount: totalImages,
                          duration: `${duration}ms`
                        });
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
                  logError('Transaction commit failed', err, { storyId });
                  reject(createError.database('데이터 저장 완료에 실패했습니다.', err));
                } else {
                  const duration = Date.now() - startTime;
                  logDatabase('story_saved', {
                    storyId,
                    imageCount: 0,
                    duration: `${duration}ms`
                  });
                  resolve(storyId);
                }
              });
            }
          });
        });
      });
    });
  } catch (error) {
    logError('Save story operation failed', error, { storyId });

    if (error.name === 'ValidationError' || error.errorCode === 'VALIDATION_ERROR') {
      throw error;
    }

    throw createError.database('스토리 저장 중 오류가 발생했습니다.', error);
  }
}

// 스토리 조회 (이미지 포함)
async function getStory(storyId) {
  try {
    await initialize();

    if (!storyId || typeof storyId !== 'string') {
      throw createError.validation('올바른 스토리 ID가 필요합니다.');
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // 스토리 메인 데이터 조회
      const storyQuery = `SELECT * FROM stories WHERE id = ?`;

      db.get(storyQuery, [storyId], (err, storyRow) => {
        if (err) {
          logError('Story retrieval failed', err, { storyId, operation: 'get_story' });
          reject(createError.database('스토리 조회에 실패했습니다.', err));
          return;
        }

        if (!storyRow) {
          logInfo('Story not found', { storyId });
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
            logError('Images retrieval failed', err, { storyId, operation: 'get_images' });
            reject(createError.database('이미지 조회에 실패했습니다.', err));
            return;
          }

          try {
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

            const duration = Date.now() - startTime;
            logDatabase('story_retrieved', {
              storyId,
              imageCount: imageRows.length,
              duration: `${duration}ms`
            });

            resolve(storyData);
          } catch (transformError) {
            logError('Data transformation failed', transformError, { storyId });
            reject(createError.database('데이터 변환 중 오류가 발생했습니다.', transformError));
          }
        });
      });
    });
  } catch (error) {
    logError('Get story operation failed', error, { storyId });
    throw error;
  }
}

// 모든 스토리 개수
async function getStoriesCount() {
  try {
    await initialize();

    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM stories', [], (err, row) => {
        if (err) {
          logError('Stories count failed', err, { operation: 'count_stories' });
          reject(createError.database('스토리 개수 조회에 실패했습니다.', err));
        } else {
          logDatabase('count_retrieved', { count: row.count });
          resolve(row.count);
        }
      });
    });
  } catch (error) {
    logError('Get stories count failed', error);
    throw createError.database('스토리 개수 조회 중 오류가 발생했습니다.', error);
  }
}

// 스토리 존재 여부 확인
async function hasStory(storyId) {
  try {
    await initialize();

    if (!storyId || typeof storyId !== 'string') {
      throw createError.validation('올바른 스토리 ID가 필요합니다.');
    }

    return new Promise((resolve, reject) => {
      db.get('SELECT 1 FROM stories WHERE id = ?', [storyId], (err, row) => {
        if (err) {
          logError('Story existence check failed', err, { storyId });
          reject(createError.database('스토리 존재 확인에 실패했습니다.', err));
        } else {
          resolve(!!row);
        }
      });
    });
  } catch (error) {
    logError('Has story check failed', error, { storyId });
    throw error;
  }
}

// 최근 스토리 목록 조회 (관리용)
async function getRecentStories(limit = 10) {
  try {
    await initialize();

    if (limit <= 0 || limit > 100) {
      throw createError.validation('조회 개수는 1-100 사이여야 합니다.');
    }

    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, name, created_at
        FROM stories
        ORDER BY created_at DESC
        LIMIT ?
      `;

      db.all(query, [limit], (err, rows) => {
        if (err) {
          logError('Recent stories retrieval failed', err, { limit });
          reject(createError.database('최근 스토리 조회에 실패했습니다.', err));
        } else {
          logDatabase('recent_stories_retrieved', { count: rows.length, limit });
          resolve(rows);
        }
      });
    });
  } catch (error) {
    logError('Get recent stories failed', error, { limit });
    throw error;
  }
}

// 데이터베이스 통계 조회
async function getDatabaseStats() {
  try {
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
            logError('Database stats query failed', err, { query: key });
            reject(createError.database('데이터베이스 통계 조회에 실패했습니다.', err));
            return;
          }

          if (key.includes('Story')) {
            stats[key] = row ? row.created_at : null;
          } else {
            stats[key] = row ? row.count : 0;
          }

          completed++;
          if (completed === queryKeys.length) {
            logDatabase('stats_retrieved', stats);
            resolve(stats);
          }
        });
      });
    });
  } catch (error) {
    logError('Get database stats failed', error);
    throw createError.database('데이터베이스 통계 조회 중 오류가 발생했습니다.', error);
  }
}

// 데이터베이스 정리 (서버 종료 시)
async function cleanup() {
  try {
    if (db) {
      await closeDB(db);
      db = null;
      logDatabase('cleanup_completed');
    }
  } catch (error) {
    logError('Database cleanup failed', error);
    throw createError.database('데이터베이스 정리에 실패했습니다.', error);
  }
}

// 스토리 데이터 검증
function validateStoryData(storyData) {
  const requiredFields = [
    'name', 'age', 'personality', 'hobby', 'dreamJob',
    'favoriteColor', 'favoriteAnimal', 'specialMemory', 'story'
  ];

  const missingFields = requiredFields.filter(field => !storyData[field]);
  if (missingFields.length > 0) {
    throw createError.validation(
      `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
      missingFields[0]
    );
  }

  // 나이 검증
  const age = parseInt(storyData.age);
  if (isNaN(age) || age < 1 || age > 150) {
    throw createError.validation('나이는 1-150 사이의 숫자여야 합니다.', 'age');
  }

  // 텍스트 길이 검증
  if (storyData.name.length > 50) {
    throw createError.validation('이름은 50자를 초과할 수 없습니다.', 'name');
  }

  if (storyData.story.length > 50000) {
    throw createError.validation('스토리 내용이 너무 깁니다.', 'story');
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