# Deployment Guide for Secret Capsule Diary

This application is configured for deployment on [Render](https://render.com).

## Prerequisites

- GitHub account with your repository
- Render account (free tier available)

## Deployment Steps

### 1. Push to GitHub

Ensure all your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### 2. Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click **"Apply"** to create the services

### 3. Configure Environment Variables

Render will automatically set most environment variables, but you should:

1. Go to the **secret-capsule-api** service
2. Navigate to **Environment** tab
3. Verify/update these variables:
   - `JWT_SECRET`: Auto-generated (keep it secure!)
   - `FRONTEND_URL`: Auto-linked to frontend service
   - `DATABASE_PATH`: Set to `/opt/render/project/src/apps/server/data`

### 4. Wait for Deployment

- Backend will deploy first (takes ~2-3 minutes)
- Frontend will deploy after (takes ~1-2 minutes)
- Check the **Logs** tab for any errors

### 5. Access Your Application

Once deployed, Render will provide URLs:
- Frontend: `https://secret-capsule-frontend.onrender.com`
- Backend API: `https://secret-capsule-api.onrender.com`

## Important Notes

### Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after inactivity may take 30-60 seconds
- 750 hours/month of free usage

### Database Persistence

- SQLite database is stored on a persistent disk
- Data will persist across deployments
- Disk is backed up automatically

### Custom Domain (Optional)

1. Go to your frontend service settings
2. Click **"Custom Domain"**
3. Follow instructions to add your domain

## Troubleshooting

### Build Fails

- Check the **Logs** tab for error messages
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### CORS Errors

- Verify `FRONTEND_URL` environment variable is set correctly
- Check browser console for specific error messages

### Database Issues

- Ensure `DATABASE_PATH` points to the mounted disk
- Check file permissions in the logs

## Local Development

To run locally with production-like settings:

```bash
# Copy environment example
cp .env.example .env

# Install dependencies
npm install

# Run development servers
npm run dev
```

## Updating Your Deployment

Simply push to GitHub:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically redeploy your application.

## Backend Docker Deployment (GitHub Container Registry)

The backend can now be built as a Docker image and pushed to GitHub Container Registry (GHCR). You can then run the container on any platform that supports Docker (e.g., Fly.io, Railway, Render, or your own server).

### 1. Build & Push Image (CI)

The workflow `.github/workflows/docker.yml` automatically builds the Docker image on every push to `main` that touches the `apps/server` directory and pushes it to `ghcr.io/<your‑username>/secret-capsule-backend:latest`.

### 2. Run the Container

```bash
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e FRONTEND_URL=https://<your‑github‑pages‑url> \
  -e DATABASE_PATH=/data/diary.db \
  -v ./data:/data \
  ghcr.io/<your‑username>/secret-capsule-backend:latest
```

- **Ports**: Exposes port `3001` (default API port). Adjust if you changed the backend config.
- **Persistent storage**: Mount a local `./data` directory (or a volume) to `/data` so the SQLite file persists.
- **Environment variables**: Same as the Render deployment (`JWT_SECRET`, `FRONTEND_URL`, `DATABASE_PATH`).

### 3. Update Frontend API URL

The frontend expects the API at `VITE_API_URL`. Set this environment variable in GitHub Pages (Settings → Pages → Environment variables) or in a `.env.production` file:

```env
VITE_API_URL=https://<your‑hosted‑backend‑url>
```

### 4. Redeploy

After any change, simply push to GitHub:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

The CI workflow will rebuild and push a new image; restart your container to pick up the new version.

### 5. Optional: Deploy to Fly.io (one‑click)

If you prefer a managed platform, you can deploy the image to Fly.io:

```bash
fly launch --image ghcr.io/<your‑username>/secret-capsule-backend:latest
```

Follow Fly.io prompts to create an app and attach a volume for SQLite persistence.

---

**Note**: The frontend continues to be deployed to GitHub Pages as described earlier. The backend Docker image can be run anywhere you like; the guide above shows a generic Docker run command and an example with Fly.io.
