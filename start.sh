#!/bin/bash

# Cheryl App - 启动脚本
# 同时启动后端服务 + Cloudflare Tunnel

DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$DIR/logs"
mkdir -p "$LOG_DIR"

# 启动后端服务
node "$DIR/server.js" > "$LOG_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo "✅ 后端服务已启动 (PID: $SERVER_PID) - 端口 3456"

# 等待服务器就绪
sleep 2

# 启动Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3456 > "$LOG_DIR/tunnel.log" 2>&1 &
TUNNEL_PID=$!
echo "✅ Cloudflare Tunnel 已启动 (PID: $TUNNEL_PID)"

# 等待tunnel就绪
sleep 5
TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG_DIR/tunnel.log" | head -1)
echo ""
echo "========================================"
echo "  🌟 Cheryl日程 App 已启动！"
echo "  本地访问: http://localhost:3456"
echo "  局域网访问: http://$(ipconfig getifaddr en0 2>/dev/null || echo "192.168.x.x"):3456"
echo "  公网访问: $TUNNEL_URL"
echo "========================================"
echo ""
echo "📱 在手机上打开上面的公网链接即可使用！"
echo "💡 添加到主屏幕获得App体验"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 保存PID以方便停止
echo "$SERVER_PID" > "$LOG_DIR/server.pid"
echo "$TUNNEL_PID" > "$LOG_DIR/tunnel.pid"

# 等待信号
trap "kill $SERVER_PID $TUNNEL_PID 2>/dev/null; echo '服务已停止'; exit" SIGINT SIGTERM
wait
