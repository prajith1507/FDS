# 🚀 Production Deployment Guide

## Quick Production Start

### **Single Command Build & Start**
```bash
npm run build-and-start
```
This will:
1. Build all four projects for production
2. Start all services in production mode

### **Step-by-Step Production Deployment**

#### 1. Build All Projects
```bash
npm run build
```

#### 2. Start Production Services
```bash
npm run start
```

#### 3. Access Your Applications
- 🎛️ **Suite Dashboard** → http://145.223.23.191:3000
- 🗄️ **DB Viewer** → http://145.223.23.191:4001  
- 🚀 **Postman** → http://145.223.23.191:4002
- ⚡ **Transformer** → http://145.223.23.191:4003

## 🔧 Individual Service Management

### Build Individual Services
```bash
npm run build:db-viewer     # Database management tool
npm run build:postman       # API testing suite  
npm run build:transformer   # Data transformation engine
npm run build:suite         # Main dashboard
```

### Start Individual Services
```bash
npm run start:db-viewer     # Start DB viewer only
npm run start:postman       # Start Postman only
npm run start:transformer   # Start Transformer only
npm run start:suite         # Start Suite dashboard only
```

## 🌍 Environment Configuration

### Production Environment Variables
Edit the global `.env` file for production:

```bash
# Production API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com
BACKEND_BASE_URL=https://your-production-api.com

# Production Settings
NODE_ENV=production
DEBUG_MODE=false
ENABLE_API_LOGGING=false

# Production Ports (if different)
SUITE_DASHBOARD_PORT=3000
DB_VIEWER_PORT=4001
POSTMAN_PORT=4002
TRANSFORMER_PORT=4003
```

### Auto-Sync Environment
The build process automatically syncs the global `.env` to all projects, ensuring consistent configuration.

## 🐳 Docker Deployment (Optional)

### Create Dockerfile for each service
```dockerfile
# Example for any service
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY .next ./.next
COPY public ./public
COPY .env ./

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  suite-ui:
    build: ./suite-ui
    ports:
      - "3000:3000"
  
  db-viewer:
    build: ./fuzion-db-viewer
    ports:
      - "4001:4001"
      
  postman:
    build: ./fuzion-postman
    ports:
      - "4002:4002"
      
  transformer:
    build: ./fuzion-transformer
    ports:
      - "4003:4003"
```

## 🔍 Health Checks

### Manual Health Check
```bash
curl http://145.223.23.191:3000/api/health    # Suite dashboard
curl http://145.223.23.191:4001/api/health    # DB viewer
curl http://145.223.23.191:4002/api/health    # Postman
curl http://145.223.23.191:4003/api/health    # Transformer
```

### Automated Health Monitoring
The suite includes built-in health check endpoints that you can monitor with tools like:
- Prometheus + Grafana
- New Relic
- DataDog
- Custom monitoring scripts

## 🚦 Process Management with PM2

### Install PM2
```bash
npm install -g pm2
```

### Create ecosystem.config.js
```javascript
module.exports = {
  apps: [
    {
      name: 'suite-ui',
      cwd: './suite-ui',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'db-viewer',
      cwd: './fuzion-db-viewer',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'postman',
      cwd: './fuzion-postman',
      script: 'npm', 
      args: 'start',
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'transformer',
      cwd: './fuzion-transformer',
      script: 'npm',
      args: 'start', 
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
```

### PM2 Commands
```bash
pm2 start ecosystem.config.js    # Start all services
pm2 status                       # Check status
pm2 logs                         # View logs
pm2 restart all                  # Restart all
pm2 stop all                     # Stop all
pm2 delete all                   # Delete all
```

## 🔧 Troubleshooting Production Issues

### Service Won't Start
1. Check if build completed successfully
2. Verify environment variables
3. Check port availability
4. Review logs for errors

### Build Failures
```bash
npm run clean        # Clean build artifacts
npm run build        # Rebuild
```

### Environment Issues
```bash
npm run sync-env     # Re-sync environment variables
```

### Port Conflicts
Check if ports are available:
```bash
netstat -ano | findstr :3000    # Windows
netstat -ano | findstr :4001
netstat -ano | findstr :4002
netstat -ano | findstr :4003
```

## 📊 Performance Optimization

### Build Optimization
- Clean builds before production: `npm run clean`
- Use production environment: `NODE_ENV=production`
- Enable compression in your reverse proxy

### Runtime Optimization
- Use PM2 cluster mode for scaling
- Implement caching strategies
- Monitor memory usage
- Set up log rotation

## 🔒 Security Considerations

1. **Environment Variables**: Never commit production `.env` files
2. **API Keys**: Rotate keys regularly
3. **CORS**: Configure properly for production domains
4. **HTTPS**: Always use SSL in production
5. **Firewall**: Restrict access to necessary ports only

---

💡 **Pro Tip**: Use `npm run build-and-start` for quick production deployments during development and testing!