const https = require('https');
const fs = require('fs');

// 이미지 다운로드 함수
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // 실패 시 파일 삭제
      reject(err);
    });
  });
}

module.exports = {
  downloadImage
};