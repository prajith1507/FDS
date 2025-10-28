# 🚀 Vercel Deployment Quick Start

## ⚡ Fast Track Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy All Projects
```bash
npm run deploy:vercel
```

## 📋 Manual Deployment Steps

### Option A: Automated Script
```bash
npm run deploy:vercel
```

### Option B: Manual One by One
```bash
# 1. DB Viewer
cd fuzion-db-viewer
vercel --prod

# 2. Postman
cd ../fuzion-postman  
vercel --prod

# 3. Transformer
cd ../fuzion-transformer
vercel --prod

# 4. Suite UI (Main Dashboard)
cd ../suite-ui
vercel --prod
```

## 🔧 Environment Variables to Set in Vercel

After deployment, go to each project in Vercel dashboard and set these:

### All Projects
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com
```

### Suite UI Additional Variables
```
NEXT_PUBLIC_DB_VIEWER_URL=https://fuzion-db-viewer.vercel.app
NEXT_PUBLIC_POSTMAN_URL=https://fuzion-postman.vercel.app
NEXT_PUBLIC_TRANSFORMER_URL=https://fuzion-transformer.vercel.app
```

## 🎯 Expected URLs After Deployment

- **Main Dashboard:** `https://fuzion-suite-ui.vercel.app`
- **DB Viewer:** `https://fuzion-db-viewer.vercel.app`
- **API Testing:** `https://fuzion-postman.vercel.app`
- **Transformer:** `https://fuzion-transformer.vercel.app`

## ✅ Post-Deployment Checklist

- [ ] All 4 projects deployed successfully
- [ ] Environment variables configured in Vercel
- [ ] Suite UI updated with correct service URLs
- [ ] All applications accessible via their URLs
- [ ] API connections working properly

## 🚨 If Build Fails

```bash
# Clean and rebuild locally first
npm run clean
npm run build

# Fix any TypeScript/build errors
# Then try deployment again
npm run deploy:vercel
```

---

💡 **Tip:** The Suite UI should be deployed last so you can update its environment variables with the URLs of the other deployed services!