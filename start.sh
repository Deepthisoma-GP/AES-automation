#!/usr/bin/env bash
# Start the APFB backend (FastAPI :8000) and frontend (Vite :5173) together.
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting backend on :8000 …"
(cd "$ROOT/backend" && uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

echo "Starting frontend on :5173 …"
(cd "$ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

trap "echo 'Stopping…'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM
echo "APFB running → http://localhost:5173  (Ctrl-C to stop)"
wait
