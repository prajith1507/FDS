# 🏗️ Build Guide - Fuzion Development Suite

## Quick Build Commands

### 🚀 Build Everything
```bash
npm run build
```
This builds all four projects in sequence:
1. fuzion-db-viewer
2. fuzion-postman  
3. fuzion-transformer
4. suite-ui

### 🎯 Build Individual Projects
```bash
npm run build:db-viewer     # Database management tool
npm run build:postman       # API testing suite
npm run build:transformer   # Data transformation engine
npm run build:suite         # Main dashboard
```

## 🔧 Build Process Details

### What Happens During Build
1. **Environment Sync** - Global `.env` is automatically synced to all projects
2. **Next.js Build** - Each project is built using `next build`
3. **Static Generation** - Pages are pre-rendered where possible
4. **Optimization** - Code is minified and optimized for production

### Build Output Locations
```
fuzion-dev-suite/
├── fuzion-db-viewer/.next/     ← DB Viewer build
├── fuzion-postman/.next/       ← Postman build
├── fuzion-transformer/.next/   ← Transformer build
└── suite-ui/.next/             ← Suite UI build
```

## 🧹 Cleaning Build Artifacts

### Clean Everything
```bash
npm run clean
```

### Clean Individual Projects
```bash
npm run clean:db-viewer
npm run clean:postman  
npm run clean:transformer
npm run clean:suite
```

## ⚠️ Common Build Issues

### Issue: "NODE_ENV" warning
```
⚠ You are using a non-standard "NODE_ENV" value
```
**Solution:** This is a warning about our development environment setup. It doesn't affect the build.

### Issue: TypeScript errors
```
Cannot find name 'process'
```
**Solution:** Make sure `@types/node` is installed:
```bash
cd [project-folder]
npm install --save-dev @types/node
```

### Issue: Build fails on specific page
```
Error occurred prerendering page
```
**Solution:** Check if the page uses client-side only features. Wrap with Suspense boundary if needed.

## 🚀 Production Deployment

### 1. Build All Projects
```bash
npm run build
```

### 2. Start Production Servers
```bash
cd fuzion-db-viewer && npm start &
cd fuzion-postman && npm start &
cd fuzion-transformer && npm start &
cd suite-ui && npm start &
```

### 3. Or Use PM2 (Recommended)
```bash
pm2 start ecosystem.config.js
```

## 📊 Build Performance Tips

1. **Parallel Builds** - Each project builds independently
2. **Incremental Builds** - Only changed files are rebuilt in development
3. **Clean Before Deploy** - Run `npm run clean` before production builds
4. **Environment Variables** - Ensure all `.env` files are properly synced

## 🔍 Debugging Build Issues

### Enable Verbose Logging
```bash
npm run build -- --verbose
```

### Check Individual Project
```bash
cd fuzion-postman
npm run build
```

### Clear Cache and Rebuild
```bash
npm run clean
npm run build
```

---

💡 **Tip:** Use `npm run start` instead of `npm run dev` for a production-like environment with automatic environment syncing!