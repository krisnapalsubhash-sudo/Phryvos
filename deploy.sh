#!/bin/bash
# Phryvos Deployment Script
set -e
echo "🚀 Starting Phryvos & Cloudflare Tunnel"

# 1. Start Next.js
if ! pgrep -f "next start" > /dev/null; then
    echo "Starting Next.js..."
    cd . && nohup npx next start --port 4000 > /tmp/phryvos.log 2>&1 &
    sleep 3
else
    echo "Next.js is already running."
fi

# 2. Start Cloudflared Tunnel with HTTP/2 protocol
if ! pgrep -f "cloudflared tunnel" > /dev/null; then
    echo "Starting Cloudflare Tunnel (http2 protocol)..."
    nohup cloudflared tunnel --protocol http2 --config ./cloudflared-config.yml run > /tmp/cloudflared.log 2>&1 &
    sleep 5
else
    echo "Cloudflared Tunnel is already running."
fi

echo "✅ Live at:"
echo "   - https://phryvos.in"
echo "   - https://www.phryvos.in"
