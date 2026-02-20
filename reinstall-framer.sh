#!/bin/bash
echo "🧹 Cleaning framer-motion..."
rm -rf node_modules/framer-motion
rm -rf node_modules/.vite

echo "📦 Re-installing framer-motion..."
npm install framer-motion@latest

echo "✅ Done! Please restart your VS Code window now."
echo "   (Cmd+Shift+P -> 'Reload Window')"
