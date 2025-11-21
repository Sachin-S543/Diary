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
