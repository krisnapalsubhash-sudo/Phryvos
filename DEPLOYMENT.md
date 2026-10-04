# Phryvos Deployment Guide

## Quick Deploy (Recommended)

### Option 1: Cloudflare Tunnel (Free)

1. **Sign up for Cloudflare** if you haven't already: https://dash.cloudflare.com/sign-up

2. **Add your domain** to Cloudflare:
   - Go to "Add a Site"
   - Enter your domain (e.g., `phryvos.com`)
   - Select the free plan
   - Update your nameservers at your domain registrar

3. **Install Cloudflare Tunnel** on your server:
   ```bash
   # Ubuntu/Debian
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
   sudo dpkg -i cloudflared.deb
   ```

4. **Create and run tunnel**:
   ```bash
   # Login to Cloudflare
   cloudflared tunnel login
   
   # Create tunnel
   cloudflared tunnel create phryvos
   
   # Run tunnel (replace with your domain)
   cloudflared tunnel --url http://localhost:4000
   ```

5. **Deploy the app**:
   ```bash
   cd /root/projects/ideavo
   bun run build
   bun run start --port 4000
   ```

### Option 2: Docker Deployment

```bash
# Build and run with Docker
cd /root/projects/ideavo
docker build -t phryvos .
docker run -d -p 4000:4000 --name phryvos phryvos

# Then set up Cloudflare Tunnel as above
```

### Option 3: Use the Deploy Script

```bash
cd /root/projects/ideavo
./deploy.sh
```

## Verify Deployment

After setup, visit your domain:
- `https://yourdomain.com` - Landing page
- `https://yourdomain.com/login` - Login
- `https://yourdomain.com/feed` - Feed
- `https://yourdomain.com/radar` - Radar (galaxy experience)

## Troubleshooting

### Tunnel not connecting
- Check if the app is running: `curl http://localhost:4000`
- Check tunnel status: `cloudflared tunnel list`
- Restart tunnel: `cloudflared tunnel run phryvos`

### App not starting
- Check logs: `docker logs phryvos` or check process output
- Ensure port 4000 is available
- Run `bun run build` to verify build succeeds

### DNS not propagating
- Wait 5-10 minutes for DNS changes
- Check DNS: `dig yourdomain.com +short`
- Verify nameservers point to Cloudflare

## Production Checklist

- [ ] Domain added to Cloudflare
- [ ] Nameservers updated
- [ ] Tunnel created and running
- [ ] App built and running on port 4000
- [ ] HTTPS working (automatic with Cloudflare)
- [ ] All pages accessible
- [ ] Radar animation loading

## Support

- Cloudflare Tunnel docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- Next.js deployment: https://nextjs.org/docs/app/building-your-application/deploying
