# Manual Railway Deploy (Without GitHub)

Since CLI login is having issues, here's how to deploy manually:

## 1. Create Empty Project in Railway Web

- Click "New Project"
- Select "Empty Service"
- Name it "ilearnhow-tts"

## 2. Get Your Project Token

In your Railway project:
- Go to Settings → Tokens
- Create a new token
- Copy it

## 3. Deploy Using Token

```bash
# Set your token
export RAILWAY_TOKEN="your-token-here"

# Deploy directly
railway up --service ilearnhow-tts
```

## 4. Alternative: Use Railway's GitHub App

1. Install Railway's GitHub app: https://github.com/apps/railway-app
2. Push your code to a GitHub repo
3. Connect the repo in Railway's web UI

## 5. Set Environment Variables (if needed)

In Railway web UI:
- Go to Variables
- Add any needed variables

The Dockerfile will handle everything else!
