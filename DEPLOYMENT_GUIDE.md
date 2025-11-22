# DEPLOYMENT GUIDE - SECRET CAPSULE v2.0

## 🚀 DEPLOYMENT OPTIONS

### Option 1: Local Development (Current Setup)

**Backend:**
```bash
cd apps/server
npm install
npm run dev
# Running on http://localhost:3001
```

**Frontend:**
```bash
cd apps/frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## Option 2: Deploy Backend to Railway/Render

### Railway Deployment (Recommended)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Navigate to server directory
   cd apps/server
   
   # Initialize Railway project
   railway init
   
   # Deploy
   railway up
   ```

3. **Set Environment Variables in Railway Dashboard**
   ```
   PORT=3001
   JWT_SECRET=<generate-strong-random-secret>
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

4. **Get Your Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Note this URL for frontend configuration

### Render Deployment (Alternative)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Connect your GitHub repository
   - Select `apps/server` as root directory
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Set Environment Variables**
   ```
   PORT=3001
   JWT_SECRET=<strong-secret>
   NODE_ENV=production
   FRONTEND_URL=<your-frontend-url>
   ```

---

## Option 3: Deploy Frontend to Vercel

### Vercel Deployment (Recommended for Frontend)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to Frontend**
   ```bash
   cd apps/frontend
   ```

3. **Create vercel.json**
   Already configured in the project

4. **Deploy**
   ```bash
   vercel
   ```

5. **Set Environment Variable**
   ```bash
   vercel env add VITE_API_URL
   # Enter your Railway/Render backend URL
   # Example: https://secret-capsule-api.railway.app
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Alternative: Netlify Deployment

1. **Build the Frontend**
   ```bash
   cd apps/frontend
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to https://netlify.com
   - Drag and drop the `dist` folder
   - Or use Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Set Environment Variables in Netlify Dashboard**
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

---

## Option 4: GitHub Pages (Static Frontend Only)

**Note:** GitHub Pages doesn't support backend, so you'll need to deploy backend separately.

1. **Update vite.config.ts base path**
   - Already set to `/Diary/`

2. **Deploy**
   ```bash
   cd apps/frontend
   npm run deploy
   ```

3. **Access**
   - Frontend: https://sachin-s543.github.io/Diary/
   - Backend: Deploy to Railway/Render separately

---

## 🔧 PRODUCTION CONFIGURATION

### Backend Environment Variables

Create `.env` file in `apps/server`:
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_PATH=/path/to/production/database
```

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend Environment Variables

Create `.env.production` in `apps/frontend`:
```env
VITE_API_URL=https://your-backend-url.railway.app
```

---

## 🐳 DOCKER DEPLOYMENT (Advanced)

### Backend Dockerfile

Already created at `apps/server/Dockerfile`

**Build and Run:**
```bash
cd apps/server
docker build -t secret-capsule-backend .
docker run -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -e NODE_ENV=production \
  secret-capsule-backend
```

### Docker Compose (Full Stack)

Create `docker-compose.yml` in root:
```yaml
version: '3.8'
services:
  backend:
    build: ./apps/server
    ports:
      - "3001:3001"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
  
  frontend:
    build: ./apps/frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

**Run:**
```bash
docker-compose up -d
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

### Backend
- [ ] Environment variables set correctly
- [ ] JWT_SECRET is strong and unique
- [ ] CORS configured for frontend domain
- [ ] Database path configured
- [ ] Health check endpoint working
- [ ] HTTPS enabled (automatic on Railway/Render)

### Frontend
- [ ] API URL points to production backend
- [ ] Build completes without errors
- [ ] All routes accessible
- [ ] Authentication flow works
- [ ] Capsule creation/deletion works
- [ ] Export/Import functionality works

### Security
- [ ] HTTPS enabled on both frontend and backend
- [ ] Secure cookies enabled in production
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting active
- [ ] Session timeout configured
- [ ] No sensitive data in logs

---

## 🧪 TESTING PRODUCTION DEPLOYMENT

### Test Backend
```bash
# Health check
curl https://your-backend-url.railway.app/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Test Frontend
1. Open frontend URL in browser
2. Create account (signup)
3. Login
4. Create a capsule
5. Unlock capsule
6. Delete capsule
7. Logout

### Test Security
- [ ] Encryption works (capsule content not visible in network tab)
- [ ] Session expires after 20 minutes
- [ ] Rate limiting triggers after 3 failed logins
- [ ] HTTPS lock icon visible in browser

---

## 🔄 CONTINUOUS DEPLOYMENT

### GitHub Actions (Automatic Deployment)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 MONITORING & MAINTENANCE

### Backend Monitoring
- Railway/Render provide built-in monitoring
- Check logs regularly
- Monitor database size
- Set up alerts for errors

### Database Backup
```bash
# Backup SQLite database
cp database.sqlite database.backup.$(date +%Y%m%d).sqlite

# Automated backup (cron job)
0 2 * * * cp /path/to/database.sqlite /backups/db-$(date +\%Y\%m\%d).sqlite
```

### Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit
npm audit fix
```

---

## 🆘 TROUBLESHOOTING

### Backend Won't Start
- Check environment variables
- Verify PORT is available
- Check database path exists
- Review logs for errors

### Frontend Can't Connect to Backend
- Verify VITE_API_URL is correct
- Check CORS configuration
- Ensure backend is running
- Check browser console for errors

### Authentication Issues
- Clear browser cookies
- Check JWT_SECRET is set
- Verify CORS credentials: 'include'
- Check cookie settings (secure, httpOnly)

### Build Failures
- Clear node_modules and reinstall
- Check Node.js version (18+)
- Verify all dependencies installed
- Check for TypeScript errors

---

## 🎯 RECOMMENDED DEPLOYMENT STACK

**For Production:**
- **Backend:** Railway (free tier available, easy deployment)
- **Frontend:** Vercel (free tier, automatic HTTPS, CDN)
- **Database:** SQLite (included, or upgrade to PostgreSQL)
- **Monitoring:** Railway/Vercel built-in dashboards

**Estimated Cost:** $0-20/month depending on usage

---

## 📞 SUPPORT

If you encounter issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify all environment variables
4. Test locally first
5. Check GitHub repository for updates

---

**Deployment Guide Version:** 2.0.0  
**Last Updated:** November 22, 2025  
**Status:** Production Ready ✅
