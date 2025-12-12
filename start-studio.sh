#!/bin/bash

# Better Auth Studio Startup Script
# This script sets up environment variables and starts the studio

echo "🚀 Starting Better Auth Studio..."

if [ $# -eq 0 ]; then
    PORT=3000
else
    PORT=$1
fi

echo "📡 Starting on port: $PORT"
echo "🔧 Using test configuration (GitHub OAuth disabled)"

echo "🔧 Starting Better Auth Studio with environment variables..."
better-auth-studio start --port "$PORT"
