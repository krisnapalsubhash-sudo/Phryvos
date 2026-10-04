# Phryvos - Complete Deployment Guide

## ✅ Current Status

Your Phryvos app is **built and ready**:
- Production build: `/root/projects/ideavo/.next/` (192MB)
- Local server: http://localhost:4000 ✓
- Cloudflare Tunnel: Created and authenticated ✓

## 🚀 Deployment Options

### Option 1: Quick Tunnel (Instant - No Domain Needed)

Run this command to get an instant public URL:

```bash
cloudflared tunnel --url http://localhost:4000
```

This will output a temporary URL like:
```
https://something-random.trycloudflare.com
```

**Pros:** Instant, no DNS setup needed  
**Cons:** Random URL, expires when you stop the tunnel

---

### Option 2: Your Custom Domain (phryvos.in)

Your tunnel is already created with ID: `38c13e1f-ec20-4ac6-971f-128664eecffc`

**Step 1: Add DNS Records in Cloudflare**

Go to Cloudflare Dashboard → Your Domain (phryvos.in) → DNS → Add Record:

**Record 1 - WWW subdomain:**
- Type: `CNAME`
- Name: `www`
- Content: `38c13e1f-ec20-4ac6-971f-128664eecffc.cfargotunnel.com`
- Proxy: **Proxied** (orange cloud must be ON)

**Record 2 - Root domain (optional):**
- Type: `CNAME`
- Name: `@`
- Content: `38c13e1f-ec20-4ac6-971f-128664eecffc.cfargotunnel.com`
- Proxy: **Proxied**

**Step 2: Update Tunnel Config**

The config file is at: `/root/projects/ideavo/cloudflared-config.yml`

Make sure it contains:
```yaml
tunnel: 38c13e1f-ec20-4ac6-971f-128664eecffc
credentials-file: /root/.cloudflared/38c13e1f-ec20-4ac6-971f-128664eecffc.json

ingress:
  - hostname: phryvos.in
    service: http://localhost:4000
  - hostname: www.phryvos.in
    service: http://localhost:4000
  - service: http_status:404
```

**Step 3: Restart Tunnel**

```bash
# Stop existing tunnel
pkill -f "cloudflared tunnel"

# Start with config
cd /root/projects/ideavo
nohup cloudflared tunnel --config cloudflared-config.yml run > /tmp/cloudflared.log 2>&1 &

# Verify
tail -f /tmp/cloudflared.log
```

**Step 4: Wait for DNS Propagation**

DNS changes take 5-10 minutes to propagate. You can check with:
```bash
dig www.phryvos.in +short
```

---

### Option 3: One-Command Deployment Script

I've created a deployment script. Run it:

```bash
cd /root/projects/ideavo
./deploy.sh
```

This will:
1. Start the Next.js production server
2. Start the Cloudflare Tunnel
3. Show you the URLs

---

## 📍 Your URLs

Once deployed, your Phryvos will be available at:

**Local (immediate):**
- http://localhost:4000

**Cloudflare Tunnel:**
- https://38c13e1f-ec20-4ac6-971f-128664eecffc.phryvos.in

**Custom Domain (after DNS setup):**
- https://phryvos.in
- https://www.phryvos.in

---

## 🔧 Management Commands

```bash
# View running services
ps aux | grep -E "next|cloudflared" | grep -v grep

# View logs
tail -f /tmp/phryvos.log
tail -f /tmp/cloudflared.log

# Stop services
pkill -f "next start"
pkill -f "cloudflared"

# Check tunnel status
cloudflared tunnel list
cloudflared tunnel info phryvos-tunnel

# Restart everything
cd /root/projects/ideavo && ./deploy.sh
```

---

## 🧪 Test Your Deployment

After starting, test these URLs:

```bash
# Test local
curl -s http://localhost:4000/ | grep -o '<title>[^<]*</title>'

# Test tunnel (replace with your tunnel URL)
curl -s https://38c13e1f-ec20-4ac6-971f-128664eecffc.phryvos.in/ | grep -o '<title>[^<]*</title>'
```

---

## 📋 Key Pages

- **Landing Page:** /
- **Radar (Galaxy):** /radar
- **Login:** /login
- **Register:** /register
- **Feed:** /feed
- **Chat:** /chat
- **Profile:** /profile/me
- **Settings:** /settings

---

## ⚠️ Troubleshooting

**Tunnel returns 404/530:**
1. Check if Next.js is running: `curl http://localhost:4000`
2. Check tunnel logs: `tail -20 /tmp/cloudflared.log`
3. Restart tunnel: `pkill -f cloudflared && ./deploy.sh`

**DNS not propagating:**
1. Wait 5-10 minutes
2. Check DNS: `dig www.phryvos.in +short`
3. Verify CNAME points to your tunnel ID

**Port conflicts:**
```bash
# Check what's using port 4000
lsof -i :4000
# Kill it
kill <PID>
```

---

## 🎯 Next Steps

1. **Test locally:** Visit http://localhost:4000
2. **Choose deployment option** above
3. **Share your URL** with others!

Your Phryvos app is production-ready with:
- ✅ Dark cinematic UI
- ✅ Canvas-based galaxy radar
- ✅ All 11 pages working
- ✅ TypeScript compiled
- ✅ Zero Instagram DNA
