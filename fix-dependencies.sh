#!/bin/bash

echo "🚀 Fixing dependencies for Sehat Safe..."

# 1. Install Root Dependencies (Frontend + Framer Motion)
echo "📦 Installing Frontend Dependencies..."
npm install

# 2. Install Server Dependencies (Backend + Bcryptjs)
echo "📦 Installing Backend Dependencies..."
cd server
npm install
cd ..

echo "✅ All dependencies installed!"
echo "👉 You can now run 'npm run dev' to start the app."
