# SagarSaathi Deployment Guide

## Prerequisites

### Install Docker Desktop for Mac
1. Download from: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Start Docker Desktop application
4. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

## Local Docker Deployment

### Step 1: Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values (minimum required):
# - JWT_SECRET=your_secret_key_here
# - MONGODB_URI will be set by docker-compose
# - ADMIN_EMAIL and ADMIN_PASSWORD for admin access
```

### Step 2: Build and Run with Docker
```bash
# Build and start all services (MongoDB, Backend, Frontend, Nginx)
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check running containers
docker ps
```

### Step 3: Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Nginx**: http://localhost:80

### Stop the Application
```bash
docker-compose down
```

## Option 2: Quick Local Development (Without Docker)

If you want to test quickly without Docker:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run server

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

Access at: http://localhost:3000

## Public Deployment Options

### Option A: Render.com (Free, Easy)

1. **Sign up**: https://render.com
2. **Create Web Service** for backend:
   - Connect GitHub repo
   - Build command: `cd backend && npm install`
   - Start command: `npm start`
   - Add environment variables
3. **Create Static Site** for frontend:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/build`
   - Add environment variable: `REACT_APP_API_URL` pointing to backend URL

**Result**: You'll get URLs like:
- Backend: `https://sagarsaathi-backend.onrender.com`
- Frontend: `https://sagarsaathi.onrender.com`

### Option B: Railway.app (Free tier available)

1. **Sign up**: https://railway.app
2. **New Project** → Deploy from GitHub
3. Railway auto-detects Node.js apps
4. Add MongoDB service from Railway marketplace
5. Set environment variables
6. Deploy!

**Result**: Get a URL like `https://sagarsaathi-production.up.railway.app`

### Option C: Vercel (Frontend) + Render (Backend)

**Frontend on Vercel:**
1. Sign up: https://vercel.com
2. Import GitHub repo
3. Framework: Create React App
4. Root directory: `frontend`
5. Deploy!

**Backend on Render:**
Same as Option A

### Option D: DigitalOcean App Platform

1. Sign up: https://www.digitalocean.com/products/app-platform
2. Create new app from GitHub
3. Configure services (backend + frontend)
4. Add MongoDB database
5. Deploy!

Cost: ~$5-10/month

### Option E: Heroku

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create apps
heroku create sagarsaathi-backend
heroku create sagarsaathi-frontend

# Add MongoDB
heroku addons:create mongolab:sandbox -a sagarsaathi-backend

# Deploy backend
cd backend
git init
heroku git:remote -a sagarsaathi-backend
git push heroku main

# Deploy frontend
cd ../frontend
npm run build
# Deploy build folder
```

## Quick Public Link with ngrok (Temporary)

For immediate testing without deployment:

```bash
# Install ngrok
brew install ngrok

# Start your local app
cd backend && npm run server & cd frontend && npm start

# In another terminal, expose frontend
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
```

**Note**: ngrok URLs are temporary and expire when you stop the process.

## Recommended Quick Setup for Testing

### Using Render.com (5 minutes):

1. **Push latest code to GitHub** ✓ (Already done)

2. **Deploy Backend**:
   - Go to https://render.com
   - New → Web Service
   - Connect: `github.com/sharanya330/sagarsaathi`
   - Name: `sagarsaathi-backend`
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables:
     ```
     JWT_SECRET=your_secret_here
     MONGODB_URI=mongodb+srv://... (or use Render's MongoDB)
     PORT=5000
     ADMIN_EMAIL=admin@sagarsaathi.com
     ADMIN_PASSWORD=admin123
     ```
   - Click "Create Web Service"

3. **Deploy Frontend**:
   - New → Static Site
   - Connect same repo
   - Name: `sagarsaathi`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`
   - Add environment variable:
     ```
     REACT_APP_API_URL=https://sagarsaathi-backend.onrender.com
     ```
   - Click "Create Static Site"

4. **Access your app**:
   - Frontend URL: `https://sagarsaathi.onrender.com`
   - Backend URL: `https://sagarsaathi-backend.onrender.com`

## MongoDB Setup for Production

### Option 1: MongoDB Atlas (Free tier)
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Whitelist all IPs: 0.0.0.0/0
5. Get connection string
6. Add to environment variables

### Option 2: Use Render's MongoDB
Render provides managed MongoDB as an add-on

## Environment Variables Checklist

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret_key
ADMIN_EMAIL=admin@sagarsaathi.com
ADMIN_PASSWORD=your_admin_password
FRONTEND_BASE_URL=https://your-frontend-url.com

# Optional
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
GOOGLE_MAPS_API_KEY=
```

**Frontend (.env):**
```env
REACT_APP_API_URL=https://your-backend-url.com
```

## Health Check

After deployment, verify:

```bash
# Backend health
curl https://your-backend-url.com/

# Test API
curl https://your-backend-url.com/api/users
```

## Troubleshooting

**Docker issues:**
- Ensure Docker Desktop is running
- Check logs: `docker-compose logs`
- Rebuild: `docker-compose down && docker-compose up --build`

**Deployment issues:**
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check build logs in deployment platform
- Ensure CORS is configured correctly

**Backend not accessible:**
- Check if backend is running: `docker ps` or check deployment logs
- Verify PORT is correct
- Check firewall/security groups

**Frontend not loading:**
- Verify REACT_APP_API_URL points to correct backend
- Check browser console for errors
- Ensure build completed successfully

## Next Steps

1. Choose a deployment option above
2. Set up MongoDB Atlas account
3. Configure environment variables
4. Deploy and test
5. Share the public URL!

For immediate testing, I recommend **Render.com** - it's free and takes about 5 minutes to set up.
