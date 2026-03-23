/**
 * FontManager — 결정론적 폰트 경로 해석
 * AIL-2026-0219-VID-003
 *
 * 해석 순서:
 *   1. assets/fonts/NotoSansKR-Regular.ttf (번들)
 *   2. Docker: /usr/share/fonts/noto-cjk/ (fc-cache)
 *   3. 없으면 명확한 에러 → 시스템 기본 폰트 절대 사용 안 함
 */

const fs = require('fs');
const path = require('path');

const FONT_NAME = 'Noto Sans KR';
const BUNDLED_FONT_FILENAME = 'NotoSansKR-Regular.ttf';

// 검색 경로 (우선순위 순)
const SEARCH_PATHS = [
  // 1. 프로젝트 번들 (최우선)
  path.join(__dirname, '..', '..', 'assets', 'fonts', BUNDLED_FONT_FILENAME),
  // 2. Docker (apt-get install fonts-noto-cjk)
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/truetype/noto/NotoSansKR-Regular.ttf',
  // 3. macOS (brew install font-noto-sans-cjk)
  '/Library/Fonts/NotoSansCJK-Regular.ttc',
];

class FontManager {
  /**
   * 폰트 경로 결정론적 해석
   * @returns {string} 폰트 파일 절대 경로
   * @throws {Error} FONT_NOT_FOUND — 모든 경로에서 미발견 시
   */
  static resolve() {
    for (const fontPath of SEARCH_PATHS) {
      if (FontManager.exists(fontPath)) {
        return fontPath;
      }
    }

    throw Object.assign(
      new Error(
        `FONT_NOT_FOUND: ${FONT_NAME} 미발견.\n` +
        `검색 경로:\n${SEARCH_PATHS.map(p => `  - ${p}`).join('\n')}\n\n` +
        `해결 방법:\n` +
        `  로컬: assets/fonts/${BUNDLED_FONT_FILENAME} 에 폰트 파일을 배치하세요.\n` +
        `  Docker: apt-get install -y fonts-noto-cjk && fc-cache -fv`
      ),
      { errorCode: 'FONT_NOT_FOUND' }
    );
  }

  /**
   * 폰트 파일 존재 확인
   */
  static exists(fontPath) {
    try {
      return fs.existsSync(fontPath) && fs.statSync(fontPath).isFile();
    } catch (_) {
      return false;
    }
  }

  /**
   * 번들 폰트 경로 반환 (존재 여부 무관)
   */
  static getBundledPath() {
    return path.join(__dirname, '..', '..', 'assets', 'fonts', BUNDLED_FONT_FILENAME);
  }

  /**
   * 폰트 이름 반환
   */
  static getFontName() {
    return FONT_NAME;
  }

  /**
   * 검색 경로 반환 (디버깅용)
   */
  static getSearchPaths() {
    return [...SEARCH_PATHS];
  }
}

module.exports = FontManager;
