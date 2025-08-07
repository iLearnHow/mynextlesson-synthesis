# 🚀 Cloudflare Pages Deployment Guide

## Prerequisites
1. Cloudflare account with Pages enabled
2. Node.js and npm installed
3. Wrangler CLI installed

## Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare
```bash
wrangler login
```

## Step 3: Deploy to Cloudflare Pages
```bash
# Option A: Use the deployment script
./deploy-cloudflare.sh

# Option B: Manual deployment
wrangler pages deploy production-deploy --project-name=ilearnhow
```

## Step 4: Configure Custom Domain
1. Go to Cloudflare Dashboard
2. Navigate to Pages > ilearnhow
3. Go to Custom domains
4. Add ilearnhow.com
5. Configure DNS settings

## Step 5: Verify Deployment
- Main site: https://ilearnhow.com
- Test page: https://ilearnhow.com/working-test.html
- Live test: https://ilearnhow.com/live-test.html

## Expected Results
- ✅ Site loads without errors
- ✅ All icons work (📅 😊 🎭 🌍 👶 ➕)
- ✅ Overlays show/hide properly
- ✅ Kelly and Ken avatars display correctly
- ✅ No JavaScript errors in console

## Troubleshooting
- If deployment fails, check wrangler login status
- If domain doesn't work, verify DNS settings in Cloudflare
- If files don't load, check the production-deploy directory exists

## Files Being Deployed
- index.html (main interface)
- All JavaScript files (*.js)
- Avatar assets (lesson-player-deploy/)
- Curriculum data (data/)
- Test files (working-test.html, live-test.html)
