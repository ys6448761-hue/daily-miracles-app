@echo off
chcp 65001 > nul
cd /d "C:\Users\세진\OneDrive\바탕 화면\daily-miracles-mvp"

echo ========================================
echo   Dogfooding Auto Commit Script
echo ========================================
echo.

REM Git 상태 확인
echo [1/4] Git 상태 확인...
git status --short .claude/dogfooding/
echo.

REM .claude/dogfooding/ 변경사항 추가
echo [2/4] dogfooding 폴더 스테이징...
git add .claude/dogfooding/
echo.

REM 커밋 (날짜 자동)
echo [3/4] 커밋 생성...
git commit -m "dogfooding: update %date%"
echo.

REM GitHub push
echo [4/4] GitHub에 푸시...
git push origin main
echo.

echo ========================================
echo   Dogfooding sync completed!
echo ========================================
pause
