# 🚀 Vercel Deployment Guide

## Overview

The Fuzion Development Suite consists of 4 separate Next.js applications that need to be deployed individually on Vercel:

1. **fuzion-suite-ui** - Main dashboard (deploy this first)
2. **fuzion-db-viewer** - Database management tool
3. **fuzion-postman** - API testing suite  
4. **fuzion-transformer** - Data transformation engine

## 📋 Pre-Deployment Checklist

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Build Test Locally
```bash
# Test each project builds successfully
cd fuzion-suite-ui && npm run build
cd ../fuzion-db-viewer && npm run build
cd ../fuzion-postman && npm run build
cd ../fuzion-transformer && npm run build
```

## 🎯 Step-by-Step Deployment

### Step 1: Deploy Suite UI (Main Dashboard)
```bash
cd suite-ui
vercel
```

**Configuration prompts:**
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- Project name? **fuzion-suite-ui**
- Directory? **./suite-ui** (or just press Enter)

**Note the deployment URL:** `https://fuzion-suite-ui.vercel.app`

### Step 2: Deploy DB Viewer
```bash
cd ../fuzion-db-viewer
vercel
```

**Configuration:**
- Project name: **fuzion-db-viewer**
- **Note the URL:** `https://fuzion-db-viewer.vercel.app`

### Step 3: Deploy Postman
```bash
cd ../fuzion-postman
vercel
```

**Configuration:**
- Project name: **fuzion-postman**
- **Note the URL:** `https://fuzion-postman.vercel.app`

### Step 4: Deploy Transformer
```bash
cd ../fuzion-transformer
vercel
```

**Configuration:**
- Project name: **fuzion-transformer**
- **Note the URL:** `https://fuzion-transformer.vercel.app`

## 🔧 Environment Variables Setup

After deployment, configure environment variables in Vercel dashboard:

### For Suite UI
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
NEXT_PUBLIC_DB_VIEWER_URL=https://fuzion-db-viewer.vercel.app
NEXT_PUBLIC_POSTMAN_URL=https://fuzion-postman.vercel.app
NEXT_PUBLIC_TRANSFORMER_URL=https://fuzion-transformer.vercel.app
```

### For DB Viewer
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
NEXT_PUBLIC_DATABASE_ENDPOINT=/api/database
NEXT_PUBLIC_HEALTH_CHECK_ENDPOINT=/api/health
```

### For Postman
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
NEXT_PUBLIC_COLLECTIONS_URL=https://your-api-server.com/api/collections/
NEXT_PUBLIC_BULK_UPDATE_URL=https://your-api-server.com/api/collections/bulk-update
NEXT_PUBLIC_SAVE_API_ENDPOINT=/api/apis/create
NEXT_PUBLIC_API_DETAILS_ENDPOINT=/api/apis/key
```

### For Transformer
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
NEXT_PUBLIC_TRANSFORMATION_ENDPOINT=/api/transformations
NEXT_PUBLIC_COPILOT_ENDPOINT=/api/copilot
NEXT_PUBLIC_FILE_UPLOAD_ENDPOINT=/api/files/upload
```

## 🌐 Domain Configuration (Optional)

### Custom Domains
1. Go to Vercel Dashboard
2. Select each project
3. Go to Settings → Domains
4. Add custom domains:
   - `suite.yourdomain.com` → Suite UI
   - `db.yourdomain.com` → DB Viewer
   - `api-test.yourdomain.com` → Postman
   - `transform.yourdomain.com` → Transformer

### Update Environment Variables
After setting custom domains, update the URLs in environment variables.

## 📝 Automated Deployment Script

Create a PowerShell script for automated deployment:

```powershell
# deploy-to-vercel.ps1
Write-Host "🚀 Deploying Fuzion Suite to Vercel..." -ForegroundColor Cyan

$projects = @("suite-ui", "fuzion-db-viewer", "fuzion-postman", "fuzion-transformer")

foreach ($project in $projects) {
    Write-Host "Deploying $project..." -ForegroundColor Yellow
    Set-Location $project
    vercel --prod
    Set-Location ..
    Write-Host "✅ $project deployed" -ForegroundColor Green
}

Write-Host "🎉 All projects deployed successfully!" -ForegroundColor Green
```

## 🔄 CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        project: [suite-ui, fuzion-db-viewer, fuzion-postman, fuzion-transformer]
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd ${{ matrix.project }}
          npm install
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ${{ matrix.project }}
```

## 🚨 Common Issues & Solutions

### Build Errors
```bash
# If build fails, check for:
1. Missing dependencies
2. TypeScript errors
3. Environment variable issues
4. Import/export problems
```

### Environment Variables Not Loading
- Ensure all `NEXT_PUBLIC_` prefixed variables are set in Vercel dashboard
- Redeploy after adding environment variables
- Check variable names match exactly

### CORS Issues
```javascript
// Add to next.config.js in each project
module.exports = {
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}
```

## 📊 Monitoring & Analytics

### Vercel Analytics
Add to each project's `app/layout.tsx`:
```javascript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Performance Monitoring
- Enable Vercel Speed Insights
- Monitor Core Web Vitals
- Set up error tracking with Sentry

## 🔗 Final URLs

After deployment, your applications will be available at:

- **Main Dashboard:** `https://fuzion-suite-ui.vercel.app`
- **DB Viewer:** `https://fuzion-db-viewer.vercel.app`
- **API Testing:** `https://fuzion-postman.vercel.app`
- **Transformer:** `https://fuzion-transformer.vercel.app`

## 🎉 Next Steps

1. Test all deployed applications
2. Configure custom domains (optional)
3. Set up monitoring and analytics
4. Configure CI/CD for automatic deployments
5. Update DNS records if using custom domains

---

💡 **Pro Tip:** Deploy the Suite UI last and update its environment variables with the URLs of the other deployed services!