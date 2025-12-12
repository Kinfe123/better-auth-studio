@echo off
REM Better Auth Studio Startup Script for Windows
REM This script sets up environment variables and starts the studio

echo 🚀 Starting Better Auth Studio...

if "%1"=="" (
    set PORT=3000
) else (
    set PORT=%1
)

echo 📡 Starting on port: %PORT%
echo 🔧 Using test configuration (GitHub OAuth disabled)

echo 🔧 Starting Better Auth Studio with environment variables...
better-auth-studio start --port %PORT%
