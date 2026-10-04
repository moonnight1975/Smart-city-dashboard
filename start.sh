#!/usr/bin/env bash

# MetroCity Smart City Dashboard Startup Script

echo "🏙️  Starting MetroCity Smart City Dashboard..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill 0
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Backend
echo "🚀 Launching FastAPI Backend on http://localhost:8000 ..."
cd "$ROOT_DIR/backend"
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi
venv/bin/python -m uvicorn main:app --reload --port 8000 &

# Wait a moment for backend to initialize
sleep 2

# Start Frontend
echo "🚀 Launching Next.js Frontend on http://localhost:3000 ..."
cd "$ROOT_DIR/frontend"
npm run dev &

echo ""
echo "✅ MetroCity Services are running!"
echo "   - Frontend Dashboard: http://localhost:3000"
echo "   - Backend API Docs:   http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services."

# Wait for background processes
wait
