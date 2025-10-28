# 🌟 Single Global .env Configuration

## ✨ What is this?

This project uses **ONE** global `.env` file that automatically syncs to all three tools:
- 🗄️ **fuzion-db-viewer** 
- 🚀 **fuzion-postman**
- ⚡ **fuzion-transformer**
- 🎛️ **suite-ui**

## 🎯 How it works

```
📁 Root Folder
├── .env                    ← 🌟 EDIT THIS FILE ONLY
├── fuzion-db-viewer/
│   └── .env               ← ✅ Auto-synced
├── fuzion-postman/
│   └── .env               ← ✅ Auto-synced  
├── fuzion-transformer/
│   └── .env               ← ✅ Auto-synced
└── suite-ui/
    └── .env               ← ✅ Auto-synced
```

## 🚀 Quick Start

### 1. Edit the global configuration
```bash
notepad .env    # Edit the main .env file in root
```

### 2. Change your API URL
```bash
# Change this line in .env:
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
```

### 3. Start everything (auto-syncs first)
```bash
npm run dev
```

## 🔄 Manual Sync (if needed)

If you need to sync without starting the services:

```bash
npm run sync-env
```

## ⚙️ What gets synced?

**All environment variables:**
- ✅ API URLs and endpoints
- ✅ Service ports (3000, 4001, 4002, 4003) 
- ✅ Feature flags and debug settings
- ✅ Authentication configuration
- ✅ Request timeouts and delays

## 📝 Key Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Main API server | `https://obl-syncapi.fuzionest.com` |
| `SUITE_DASHBOARD_PORT` | Main dashboard | `3000` |
| `DB_VIEWER_PORT` | Database tool | `4001` |
| `POSTMAN_PORT` | API testing | `4002` |
| `TRANSFORMER_PORT` | Data transform | `4003` |

## 🎉 Benefits

- ✅ **One file to rule them all** - Edit once, applies everywhere
- ✅ **Auto-sync on startup** - No manual copying needed
- ✅ **Consistent configuration** - All tools use same settings
- ✅ **Easy deployment** - Just change one file for different environments

## 🛠️ Troubleshooting

**Q: Changes not taking effect?**
```bash
npm run sync-env    # Force sync
npm run dev         # Restart services
```

**Q: Which file should I edit?**
- ✅ Edit: `.env` (in root folder)
- ❌ Don't edit: `.env` files in individual project folders

**Q: Can I have different settings per tool?**
- No, this approach uses one unified configuration
- If you need tool-specific settings, use the individual `.env.local` approach instead

---

💡 **Remember:** Always edit the **root `.env`** file only!