#!/bin/bash

echo "🛑 正在关闭 Antigravity 悬浮小胶囊及后台服务..."
pkill -f "AntigravityCapsule" 2>/dev/null || true
lsof -ti :8765 | xargs kill -9 2>/dev/null || true
echo "✅ 已成功关闭！"
