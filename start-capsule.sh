#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "===================================================="
echo "🚀 启动 Antigravity 独立桌面悬浮小胶囊 (全局置顶模式)"
echo "===================================================="

# 1. 杀掉可能残留的旧进程
pkill -f "AntigravityCapsule" 2>/dev/null || true
lsof -ti :8765 | xargs kill -9 2>/dev/null || true

# 2. 启动数据流后台服务
node dist/desktop.js > /dev/null 2>&1 &
sleep 0.5

# 3. 后台启动原生 macOS 置顶半透明悬浮窗
nohup ./dist/AntigravityCapsule > /dev/null 2>&1 &

echo "💊 悬浮小胶囊已启动并常驻在屏幕右上角！"
echo "✨ 特性："
echo "   - 永远置顶，切换任何窗口/全屏应用均不消失"
echo "   - 鼠标按住背景可任意拖拽"
echo "   - 点击展开面板，在顶部下拉框可自由切换不同项目"
echo "💡 若需关闭胶囊，运行: ./stop-capsule.sh"
