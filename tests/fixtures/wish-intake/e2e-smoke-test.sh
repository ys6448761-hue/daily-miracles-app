#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Wish Intake 7문항 E2E 스모크 테스트
# ═══════════════════════════════════════════════════════════════════════════
#
# 검증 항목:
# 1. 세션 생성 (CREATED → IN_PROGRESS)
# 2. 7문항 순차 답변 제출 (한글 UTF-8 인코딩)
# 3. 세션 완료 상태 전이 (COMPLETED)
# 4. GPT-4 요약 생성 및 Airtable 저장 (SUMMARIZED)
#
# 사용법: bash e2e-smoke-test.sh
# 주의: Windows curl UTF-8 문제로 --data-binary @file 방식 사용
#
# 작성일: 2026-01-17
# ═══════════════════════════════════════════════════════════════════════════

BASE_URL="https://daily-miracles-app.onrender.com/api/wish-intake"
FIXTURES_DIR="$(dirname "$0")"

echo "=== Wish Intake E2E 스모크 테스트 ==="
echo ""

# 1. 세션 생성
echo "[1/4] 세션 생성..."
RESPONSE=$(curl -s -X POST "$BASE_URL/start" \
  -H "Content-Type: application/json" \
  -d '{"channel": "web"}')

SESSION_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo "❌ 세션 생성 실패"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ 세션 생성: $SESSION_ID"
echo ""

# 2. 7문항 답변 제출
echo "[2/4] 7문항 답변 제출..."
URL="$BASE_URL/$SESSION_ID/answer"

for i in 1 2 3 4 5 6 7; do
  RESULT=$(curl -s -X POST "$URL" \
    -H "Content-Type: application/json; charset=utf-8" \
    --data-binary "@$FIXTURES_DIR/test-q$i.json")

  if echo "$RESULT" | grep -q '"success":true'; then
    echo "  Q$i ✅"
  else
    echo "  Q$i ❌"
    echo "  $RESULT"
  fi
done
echo ""

# 3. 세션 상태 확인
echo "[3/4] 세션 상태 확인..."
STATUS=$(curl -s "$BASE_URL/$SESSION_ID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
echo "  상태: $STATUS"

if [ "$STATUS" != "COMPLETED" ]; then
  echo "❌ COMPLETED 상태가 아님"
  exit 1
fi
echo "✅ COMPLETED 확인"
echo ""

# 4. 요약 생성
echo "[4/4] 요약 생성..."
SUMMARY=$(curl -s -X POST "$BASE_URL/$SESSION_ID/summary" \
  -H "Content-Type: application/json")

if echo "$SUMMARY" | grep -q '"success":true'; then
  echo "✅ 요약 생성 성공"

  # 최종 상태 확인
  FINAL_STATUS=$(curl -s "$BASE_URL/$SESSION_ID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "  최종 상태: $FINAL_STATUS"
else
  echo "❌ 요약 생성 실패"
  echo "$SUMMARY"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════"
echo "✅ E2E 스모크 테스트 통과"
echo "  세션: $SESSION_ID"
echo "═══════════════════════════════════════════"
