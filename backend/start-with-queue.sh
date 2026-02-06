#!/bin/bash

echo "============================================"
echo "KP-BBPMP Queue System - Quick Start"
echo "============================================"
echo ""

echo "Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "[ERROR] Redis is not running!"
    echo ""
    echo "Please start Redis first:"
    echo "  Option 1: sudo systemctl start redis (Linux)"
    echo "  Option 2: brew services start redis (Mac)"
    echo "  Option 3: docker run -d -p 6379:6379 --name redis redis:alpine"
    echo ""
    exit 1
fi

echo "[OK] Redis is running"
echo ""

echo "Installing dependencies..."
npm install

echo ""
echo "Starting server with queue workers..."
echo ""
echo "Queue Dashboard will be available at: http://localhost:5000/admin/queues"
echo ""

npm run dev
