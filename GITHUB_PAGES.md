# GitHub Pages Deployment Guide

## Quick Start

Your app is configured to deploy automatically to GitHub Pages!

### Automatic Deployment

Every time you push to the `main` branch, GitHub Actions will automatically:
1. Build your frontend
2. Deploy to GitHub Pages

### Manual Deployment

You can also deploy manually from your local machine:

```bash
cd apps/frontend
npm run deploy
```

## Accessing Your App

After deployment, your app will be available at:
**https://sachin-s543.github.io/Diary/**

## Important Notes

> [!WARNING]
> **Backend Not Included**
> 
> GitHub Pages only hosts static sites (frontend only). Your backend API is NOT deployed.
> 
> **Options for Backend:**
> 1. Deploy backend separately on Render/Railway (see DEPLOYMENT.md)
> 2. Use a different platform for full-stack deployment
> 3. For now, the app will work in "offline mode" without backend features

## Enable GitHub Pages

Before the deployment works, you need to enable GitHub Pages in your repository:

1. Go to your GitHub repository: https://github.com/Sachin-S543/Diary
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. Save the settings

## First Deployment

After enabling GitHub Pages and pushing this commit, GitHub Actions will:
- Run the deployment workflow
- Build your frontend
- Deploy to GitHub Pages

Check the **Actions** tab in your repository to monitor progress.

## Local Development

The base path `/Diary/` is only used in production. For local development:

```bash
npm run dev
```

This will run on `http://localhost:5173` without the base path.

## Troubleshooting

### Deployment Fails
- Check the **Actions** tab for error logs
- Ensure GitHub Pages is enabled in repository settings
- Verify the workflow has proper permissions

### 404 Errors
- Ensure the base path in `vite.config.ts` matches your repository name
- Clear browser cache and try again

### Assets Not Loading
- Check that all asset paths are relative (not absolute)
- Verify the base path configuration

## Next Steps

1. **Enable GitHub Pages** in repository settings
2. **Push this commit** to trigger deployment
3. **Wait 2-3 minutes** for deployment to complete
4. **Visit** https://sachin-s543.github.io/Diary/

For backend deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) for Render deployment instructions.
