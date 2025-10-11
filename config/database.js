const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 데이터베이스 파일 경로
const DB_PATH = path.join(process.cwd(), 'data', 'stories.db');

// 데이터 디렉토리 생성
function ensureDataDirectory() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 데이터 디렉토리 생성됨:', dataDir);
  }
}

// 데이터베이스 연결
function connectDB() {
  ensureDataDirectory();

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ SQLite 데이터베이스 연결 실패:', err.message);
        reject(err);
      } else {
        console.log('✅ SQLite 데이터베이스 연결 성공');
        resolve(db);
      }
    });
  });
}

// 테이블 초기화
async function initializeTables(db) {
  // 테이블 생성 쿼리들
  const tableQueries = [
    // 스토리 메인 테이블
    `CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      personality TEXT NOT NULL,
      hobby TEXT NOT NULL,
      dream_job TEXT NOT NULL,
      favorite_color TEXT NOT NULL,
      favorite_animal TEXT NOT NULL,
      special_memory TEXT NOT NULL,
      story_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // 이미지 테이블 (1:N 관계)
    `CREATE TABLE IF NOT EXISTS story_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      is_blank_frame BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )`
  ];

  // 인덱스 생성 쿼리들
  const indexQueries = [
    `CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_story_images_story_id ON story_images(story_id)`,
    `CREATE INDEX IF NOT EXISTS idx_story_images_page_number ON story_images(story_id, page_number)`
  ];

  // 테이블 먼저 생성
  for (const query of tableQueries) {
    await new Promise((resolve, reject) => {
      db.run(query, (err) => {
        if (err) {
          console.error('❌ 테이블 생성 실패:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 인덱스 생성
  for (const query of indexQueries) {
    await new Promise((resolve, reject) => {
      db.run(query, (err) => {
        if (err) {
          console.error('❌ 인덱스 생성 실패:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  console.log('✅ 모든 데이터베이스 테이블 및 인덱스 초기화 완료');
  return db;
}

// 데이터베이스 초기화 (연결 + 테이블 생성)
async function initializeDB() {
  try {
    const db = await connectDB();
    await initializeTables(db);
    return db;
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
}

// 데이터베이스 닫기
function closeDB(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('❌ 데이터베이스 종료 실패:', err.message);
        reject(err);
      } else {
        console.log('✅ 데이터베이스 연결 종료');
        resolve();
      }
    });
  });
}

module.exports = {
  initializeDB,
  closeDB,
  DB_PATH
};