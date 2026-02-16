#!/bin/sh
set -eu

echo "[cron] start $(date -Iseconds)"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tA -c "SELECT current_user;"
rc=$?
echo "[cron] end $(date -Iseconds) exit=$rc"
exit $rc
