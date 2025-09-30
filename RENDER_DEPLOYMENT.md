# Render Deployment Guide

This guide will help you deploy your restaurant recipe app to Render.

## Why Render?

✅ **Much simpler** than Railway  
✅ **Auto-detects** your app structure  
✅ **One-click deploy** from GitHub  
✅ **Free tier** available  
✅ **Automatic HTTPS** and custom domains  

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository

## Deployment Steps

### Option 1: One-Click Deploy (Recommended)

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will auto-detect your `render.yaml` configuration
5. Click "Apply" - Render will create all services automatically!

### Option 2: Manual Setup (If needed)

#### Step 1: Create Database

1. In Render dashboard, click "New +" → "PostgreSQL"
2. Name it "recipe-db"
3. Choose "Starter" plan (free)
4. Note the connection details

#### Step 2: Deploy Backend

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Add environment variables (see below)

#### Step 3: Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Set **Root Directory** to `frontend`
4. Set **Build Command** to `npm install && npm run build`
5. Set **Publish Directory** to `build`
6. Add environment variables (see below)

## Environment Variables

### Backend Environment Variables

```bash
NODE_ENV=production
PORT=10000
MONGO_URI=<from database connection string>
JWT_SECRET=<generate a strong secret>
FRONTEND_URL=https://your-frontend-url.onrender.com
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
```

### Frontend Environment Variables

```bash
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

## Cost

**Render Pricing**:
- **Free Tier**: 750 hours/month per service
- **Starter Plan**: $7/month per service (if you exceed free tier)

**Your App**:
- Backend: Free tier (750 hours/month)
- Frontend: Free tier (750 hours/month)  
- Database: Free tier (1GB storage)

**Total**: **$0/month** (within free tier limits)

## Key Advantages of Render

1. **Auto-detection**: Automatically detects Node.js and React apps
2. **Environment linking**: Services can reference each other automatically
3. **Free tier**: Generous free tier for small apps
4. **Simple setup**: Much less configuration than Railway
5. **Automatic HTTPS**: SSL certificates included
6. **Custom domains**: Easy to add your own domain

## File Structure

```
restaurant-recipe-app/
├── backend/
│   ├── package.json
│   └── ... (your backend code)
├── frontend/
│   ├── package.json
│   └── ... (your frontend code)
├── render.yaml (Render configuration)
└── RENDER_DEPLOYMENT.md (this guide)
```

## What Render Does Automatically

- **Detects** your app type (Node.js, React, etc.)
- **Builds** your app automatically
- **Deploys** to their infrastructure
- **Provides** HTTPS certificates
- **Manages** environment variables
- **Handles** scaling and restarts

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in package.json

2. **Environment Variables**
   - Make sure all required variables are set
   - Check the variable names match exactly

3. **Database Connection**
   - Verify MONGO_URI is correct
   - Ensure database is running

### Getting Help

- Render Documentation: [render.com/docs](https://render.com/docs)
- Render Support: Available in dashboard

## Next Steps After Deployment

1. **Test the app** using the provided URLs
2. **Set up custom domain** (optional)
3. **Monitor usage** to stay within free tier
4. **Set up monitoring** (optional)

---

**Render is much simpler than Railway!** The one-click deploy with `render.yaml` should handle everything automatically.
