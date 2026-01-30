#!/bin/bash
# ===============================================================================
# team-memory Pre-commit Gate Installer
# ===============================================================================
#
# Usage:
#   ./tools/install_precommit_gate.sh
#
# This script installs a pre-commit hook that runs:
#   1. rebuild indexes
#   2. lint check
#
# ===============================================================================

set -e

HOOK_PATH=".git/hooks/pre-commit"

echo ""
echo "==============================================================="
echo "  Installing team-memory pre-commit gate"
echo "==============================================================="
echo ""

# Check if .git exists
if [ ! -d ".git" ]; then
    echo "[ERROR] Not a git repository. Run from project root."
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Write pre-commit hook
cat > "$HOOK_PATH" << 'EOF'
#!/bin/bash
# team-memory pre-commit gate

# Check if team-memory files are staged
STAGED_FILES=$(git diff --cached --name-only | grep -E "^\.claude/team-memory/" || true)

if [ -z "$STAGED_FILES" ]; then
    # No team-memory files staged, skip checks
    exit 0
fi

echo ""
echo "🔍 team-memory pre-commit gate"
echo ""

# Step 1: Rebuild indexes
echo "[1/2] Rebuilding indexes..."
python tools/rebuild_team_memory_indexes_simple.py > /dev/null 2>&1

# Check for drift
if [ -n "$(git status --porcelain .claude/team-memory/*/index.md)" ]; then
    echo ""
    echo "❌ DRIFT DETECTED!"
    echo ""
    echo "Index files need to be updated and staged."
    echo ""
    echo "Run:"
    echo "  python tools/rebuild_team_memory_indexes_simple.py"
    echo "  git add .claude/team-memory/*/index.md"
    echo ""
    exit 1
fi

# Step 2: Lint
echo "[2/2] Running lint..."
python tools/lint_team_memory.py > /dev/null 2>&1
LINT_RESULT=$?

if [ $LINT_RESULT -ne 0 ]; then
    echo ""
    echo "❌ Lint failed! Run for details:"
    echo "  python tools/lint_team_memory.py"
    echo ""
    exit 1
fi

echo "✅ Pre-commit gate passed"
echo ""
EOF

# Make it executable
chmod +x "$HOOK_PATH"

echo "[OK] Pre-commit hook installed at: $HOOK_PATH"
echo ""
echo "The hook will automatically run when you commit changes to:"
echo "  .claude/team-memory/*"
echo ""
echo "To bypass (not recommended):"
echo "  git commit --no-verify"
echo ""
