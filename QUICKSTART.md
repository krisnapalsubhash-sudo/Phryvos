# Phryvos — Deploy to Your Domain

Your app is built and ready. Here's how to put it online:

## What You'll Need
1. A domain name (e.g., `phryvos.com`)
2. A Cloudflare account (free): https://dash.cloudflare.com/sign-up
3. This server/VPS where the app is running

---

## Step 1: Add Domain to Cloudflare

1. Go to https://dash.cloudflare.com
2. Click **"Add a Site"**
3. Enter your domain name
4. Select the **Free plan**
5. Cloudflare will check your DNS — click **"Continue"**
6. **Update your nameservers** at your domain registrar (GoDaddy, Namecheap, etc.)
   - Cloudflare will show you 2 nameservers (like `dina.ns.cloudflare.com` and `ivan.ns.cloudflare.com`)
   - Replace your current nameservers with these
7. Wait 5-10 minutes for DNS to propagate

---

## Step 2: Create Cloudflare Tunnel

On your server, run:

```bash
# Login to Cloudflare (opens browser)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create phryvos
```

**Save the Tunnel ID** it shows you (looks like `abc123-def456-ghi789`)

---

## Step 3: Configure DNS

Add a CNAME record in Cloudflare Dashboard:

**Dashboard → DNS → Records → Add Record**
- Type: `CNAME`
- Name: `www` (or your subdomain like `app`, `radar`, etc.)
- Content: `{YOUR_TUNNEL_ID}.cfargotunnel.com`
- Proxy status: **Proxied** (orange cloud)

Example: `www.phryvos.com` → `abc123.cfargotunnel.com`

---

## Step 4: Start the Tunnel

```bash
# Run tunnel (keeps running in foreground)
cloudflared tunnel --name phryvos run
```

**Open a NEW terminal/tab** and start the app:

```bash
cd /root/projects/ideavo
bun run start --port 4000
```

**Or use one command** (run in background):

```bash
cd /root/projects/ideavo
nohup bun run start --port 4000 > /tmp/phryvos.log 2>&1 &
cloudflared tunnel --name phryvos run
```

---

## Step 5: Verify

Visit your domain:
- `https://www.phryvos.com` — Landing page
- `https://www.phryvos.com/radar` — Galaxy radar
- `https://www.phryvos.com/login` — Login page

---

## Make Tunnel Run Forever (Optional)

```bash
# Install as system service
sudo cloudflared service install

# Start automatically
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

---

## Need Help?

- Cloudflare Tunnel docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- App is at: http://localhost:4000 (when tunnel is running)
