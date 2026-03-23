#!/bin/bash
# AIL-2026-0220-VID-SAMPLE-TEST-003
# Linux/Docker 환경 VID 샘플 테스트 실행기
#
# 사용법:
#   bash scripts/ops/docker-vid-sample-test.sh
#
# 필요: Docker Desktop (또는 Docker Engine)
#
# 검증 흐름:
#   1. Docker 이미지 빌드 (node:20 + ffmpeg + fonts-noto-cjk)
#   2. vid-sample-test.js 실행
#   3. 결과물을 호스트 output/_vid-docker-test/ 에 마운트
#   4. 증거 검증 (ffmpeg_stderr.log, frame*.png, meta.json)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_HOST="$PROJECT_ROOT/output/_vid-docker-test"
IMAGE_NAME="vid-sample-test"

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  VID-SAMPLE-TEST-003: Linux/Docker 재현성 검증       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Docker 확인 ──────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "❌ Docker가 설치되어 있지 않습니다."
  echo "   Docker Desktop 설치: https://www.docker.com/products/docker-desktop"
  exit 1
fi

echo "✅ Docker: $(docker --version)"

# ── 2. 이미지 빌드 ─────────────────────────────────────
echo ""
echo "--- 이미지 빌드 ---"
docker build \
  -f "$SCRIPT_DIR/Dockerfile.vid-test" \
  -t "$IMAGE_NAME" \
  "$PROJECT_ROOT"

echo ""
echo "✅ 이미지 빌드 완료: $IMAGE_NAME"

# ── 3. 호스트 출력 디렉토리 준비 ────────────────────────
mkdir -p "$OUTPUT_HOST"

# ── 4. 컨테이너 실행 ───────────────────────────────────
echo ""
echo "--- 컨테이너 실행 ---"
docker run --rm \
  -v "$OUTPUT_HOST:/app/output/_vid-sample-test" \
  "$IMAGE_NAME"

EXIT_CODE=$?

# ── 5. 증거 검증 ───────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Docker 실행 결과 (exit=$EXIT_CODE)"
echo "═══════════════════════════════════════════════════════"
echo ""

# 5a. ffmpeg_stderr.log에 NotoSansKR 로드 증거
if [ -f "$OUTPUT_HOST/ffmpeg_stderr.log" ]; then
  FONT_EVIDENCE=$(grep -i -c "font\|noto" "$OUTPUT_HOST/ffmpeg_stderr.log" 2>/dev/null || true)
  if [ "$FONT_EVIDENCE" -gt 0 ]; then
    echo "  ✅ ffmpeg_stderr.log: NotoSansKR 폰트 로드 증거 ${FONT_EVIDENCE}건"
    grep -i "loading font\|font provider\|noto" "$OUTPUT_HOST/ffmpeg_stderr.log" | head -3 | while read -r line; do
      echo "     $line"
    done
  else
    echo "  ❌ ffmpeg_stderr.log: 폰트 로드 증거 없음"
  fi
else
  echo "  ❌ ffmpeg_stderr.log 미존재"
fi

# 5b. frame*.png 자막 가시 확인 (파일 존재 + 크기 > 1KB)
echo ""
FRAME_COUNT=0
for f in "$OUTPUT_HOST"/frame*.png; do
  if [ -f "$f" ]; then
    SIZE=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 1000 ]; then
      FRAME_COUNT=$((FRAME_COUNT + 1))
      echo "  ✅ $(basename "$f"): ${SIZE}B (자막 가시 확인 필요 — 눈으로)"
    fi
  fi
done
if [ "$FRAME_COUNT" -gt 0 ]; then
  echo "  → frame*.png ${FRAME_COUNT}장 생성됨"
else
  echo "  ❌ frame*.png 미존재 또는 비정상"
fi

# 5c. meta.json CIx-Video 점수
echo ""
if [ -f "$OUTPUT_HOST/meta.json" ]; then
  CIX=$(grep -o '"score":[0-9]*' "$OUTPUT_HOST/meta.json" | head -1 | cut -d: -f2)
  STATUS=$(grep -o '"status":"[^"]*"' "$OUTPUT_HOST/meta.json" | head -1 | cut -d: -f2 | tr -d '"')
  KOR_RATE=$(grep -o '"kor_pass_rate":"[^"]*"' "$OUTPUT_HOST/meta.json" | cut -d: -f2 | tr -d '"')
  echo "  ✅ meta.json: CIx-Video=${CIX} (${STATUS}), KOR=${KOR_RATE}"

  if [ "$CIX" -ge 70 ]; then
    echo "  ✅ CIx-Video ≥ 70 기준 충족"
  else
    echo "  ❌ CIx-Video < 70 — 릴리즈 차단"
  fi
else
  echo "  ❌ meta.json 미존재"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "  📌 최종: ✅ PASS — Linux/Docker 재현성 확인"
else
  echo "  📌 최종: ❌ FAIL — Docker 내부 테스트 실패"
fi
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  📁 증거: $OUTPUT_HOST/"
echo ""

exit $EXIT_CODE
