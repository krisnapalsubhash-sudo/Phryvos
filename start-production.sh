#!/bin/bash
# Phryvos Production Deployment Script
# This script starts the Next.js app and Cloudflare Tunnel

set -e

echo "🚀 Starting Phryvos Production Environment"
echo "==========================================="

# Check if already running
if pgrep -f "next start" > /dev/null; then
    echo "✓ Next.js server is already running"
else
    echo "Starting Next.js production server..."
    cd /root/projects/ideavo
    nohup npx next start --port 4000 > /tmp/phryvos.log 2>&1 &
    sleep 3
fi

# Check tunnel
if pgrep -f "cloudflared tunnel" > /dev/null; then
    echo "✓ Cloudflare Tunnel is already running"
else
    echo "Starting Cloudflare Tunnel..."
    nohup cloudflared tunnel --config /root/projects/ideavo/cloudflared-config.yml run > /tmp/cloudflared.log 2>&1 &
    sleep 5
fi

# Show status
echo ""
echo "✅ Services Status:"
echo "-------------------"
curl -s -o /dev/null -w "• Next.js App: HTTP %{http_code}\n" http://localhost:4000/
curl -s -o /dev/null -w "• Tunnel: HTTP %{http_code}\n" https://38c13e1f-ec20-4ac6-971f-128664eecffc.phryvos.in/

echo ""
echo "📍 Your Phryvos URL:"
echo "   http://localhost:4000 (local)"
echo "   https://38c13e1f-ec20-4ac6-971f-128664eecffc.phryvos.in (tunnel)"
echo ""
echo "📋 Logs:"
echo "   App: tail -f /tmp/phryvos.log"
echo "   Tunnel: tail -f /tmp/cloudflared.log"
echo ""
echo "🛑 To stop:"
echo "   pkill -f 'next start'"
echo "   pkill -f 'cloudflared tunnel'"
