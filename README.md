# 🚀 Fuzionest Development Suite

**One command to rule them all!** ⚡

A unified development environment that starts all your tools with a single command.

## 🎯 Quick Start

### **Single Command Setup**

Run this **ONE** command to start everything:

```bash
cd "c:\Users\FUZIONEST1\Downloads\FDS"
npm run dev
```

This will automatically start:
- 🎛️ **Suite Dashboard** → http://localhost:3000
- 🗄️ **DB Viewer** → http://localhost:4001  
- 🚀 **Postman** → http://localhost:4002
- ⚡ **Transformer** → http://localhost:4003

## 📊 What Happens When You Run `npm run dev`

```
┌─────────────────────────────────────────────┐
│  🎛️  SUITE      │ Dashboard UI (Port 3000)  │
├─────────────────────────────────────────────┤
│  🗄️  DB-VIEWER  │ Database Tool (Port 4001) │
├─────────────────────────────────────────────┤
│  🚀  POSTMAN    │ API Testing (Port 4002)   │
├─────────────────────────────────────────────┤
│  ⚡  TRANSFORMER│ Data Transform (Port 4003) │
└─────────────────────────────────────────────┘
```

## 🛠️ Available Commands

### **Development**
```bash
npm run dev                 # Start all tools at once (auto-syncs .env)
npm run start               # Sync .env and start all tools
npm run sync-env            # Sync global .env to all projects
```

### **Production Build & Start**
```bash
npm run build               # Build all tools for production
npm run start               # Start all tools in production mode
npm run build-and-start     # Build and start in one command

# Individual production starts
npm run start:db-viewer     # Start DB viewer in production
npm run start:postman       # Start Postman in production
npm run start:transformer   # Start Transformer in production
npm run start:suite         # Start Suite in production
```

### **Individual Builds**
```bash
npm run build:db-viewer     # Build only DB viewer
npm run build:postman       # Build only Postman
npm run build:transformer   # Build only Transformer
npm run build:suite         # Build only dashboard
```

### **Installation & Setup**
```bash
npm run install-all         # Install dependencies for all tools
npm install                 # Install orchestrator dependencies
```

### **Maintenance**
```bash
npm run clean               # Clean all build artifacts
npm run clean:db-viewer     # Clean DB viewer build
npm run clean:postman       # Clean Postman build
npm run clean:transformer   # Clean Transformer build
npm run clean:suite         # Clean Suite build
```
npm run build:db-viewer    # Build only DB viewer
npm run build:postman      # Build only Postman  
npm run build:transformer  # Build only Transformer
```

## 🔧 First Time Setup

If this is your first time, run:

```bash
# 1. Install all dependencies
npm run install-all

# 2. Start everything
npm run dev
```

## 🌐 Access Your Tools

Once running, open your browser to:

- **Main Dashboard**: http://localhost:3000
- **Individual Tools** (accessible via dashboard sidebar):
  - DB Viewer: http://localhost:4001
  - Postman: http://localhost:4002
  - Transformer: http://localhost:4003

## 🎨 Features

- ✅ **Single Command Start**: No more juggling multiple terminals
- ✅ **Color-Coded Logs**: Easy to identify which tool is logging what
- ✅ **Automatic Port Management**: Each tool runs on its designated port
- ✅ **Unified Interface**: Access all tools through one dashboard
- ✅ **Independent Development**: Each tool maintains its own lifecycle
- ✅ **Graceful Shutdown**: Stop all tools with Ctrl+C

## 🔧 How It Works

The master `package.json` uses `concurrently` to run multiple development servers:

```javascript
{
  "dev": "concurrently --kill-others-on-fail --prefix-colors \"bgBlue.bold,bgGreen.bold,bgYellow.bold,bgMagenta.bold\" --names \"SUITE,DB-VIEWER,POSTMAN,TRANSFORMER\" \"npm run dev:suite\" \"npm run dev:db-viewer\" \"npm run dev:postman\" \"npm run dev:transformer\""
}
```

## 🐛 Troubleshooting

### **Port Already in Use**
If you get port conflicts:
```bash
# Kill processes on the ports
netstat -ano | findstr :3000
netstat -ano | findstr :4001
netstat -ano | findstr :4002
netstat -ano | findstr :4003
```

### **Dependencies Issues**
```bash
# Clean install all dependencies
npm run install-all
```

### **Individual Tool Issues**
Run tools individually to debug:
```bash
npm run dev:suite        # Test dashboard only
npm run dev:db-viewer    # Test DB viewer only
```

## 📁 Project Structure

```
FDS/
├── package.json          # Master control file
├── suite-ui/            # Main dashboard (Port 3000)
├── fuzion-db-viewer/    # Database tool (Port 4001)  
├── fuzion-postman/      # API testing (Port 4002)
└── fuzion-transformer/  # Data transform (Port 4003)
```

## 🎯 Next Steps

1. **Start Development**: `npm run dev`
2. **Open Dashboard**: http://localhost:3000
3. **Navigate Between Tools**: Use the sidebar in the dashboard
4. **Develop Independently**: Each tool can be modified without affecting others

---

**Happy Coding! 🚀**