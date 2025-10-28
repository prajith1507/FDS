# Environment Configuration Guide

This document explains the **single global .env** configuration system for the Fuzion Development Suite.

## 🎯 Single Global .env Approach

The Fuzion Development Suite uses **ONE** global `.env` file that is automatically synchronized to all projects. This ensures consistent configuration across all tools.

## 📁 File Structure

```
fuzion-dev-suite/
├── .env                          # 🌟 SINGLE GLOBAL CONFIGURATION
├── .env.example                  # Template for .env file
├── sync-env.ps1                  # Auto-sync script
├── orchestrator.js               # Handles auto-sync on startup
├── fuzion-db-viewer/
│   └── .env                      # ← Synced from global
├── fuzion-postman/
│   └── .env                      # ← Synced from global  
├── fuzion-transformer/
│   └── .env                      # ← Synced from global
└── suite-ui/
    └── .env                      # ← Synced from global
```

## 🚀 Quick Setup

1. **Edit the global configuration:**
   ```bash
   # Edit the main .env file in the root directory
   notepad .env
   ```

2. **Update your settings:**
   ```bash
   # Change the API URL to your environment
   NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
   ```

3. **Sync to all projects (automatic):**
   ```bash
   npm run dev    # Automatically syncs .env and starts all services
   ```

   **Or manually sync:**
   ```bash
   npm run sync-env    # Only sync .env files without starting services
   ```

## ⚙️ How It Works

### Automatic Synchronization
- **On Startup**: When you run `npm run dev`, the orchestrator automatically syncs the global `.env` to all projects
- **Manual Sync**: Run `npm run sync-env` anytime to sync changes manually

### Sync Process
1. Reads the global `.env` file
2. Copies it to all project directories:
   - `fuzion-db-viewer/.env`
   - `fuzion-postman/.env`  
   - `fuzion-transformer/.env`
   - `suite-ui/.env`
3. Confirms successful sync for each project

## Configuration Variables

### Backend API Configuration
| Variable | Description | Default Value |
|----------|-------------|---------------|
| `NEXT_PUBLIC_API_BASE_URL` | Main backend API URL | `https://obl-syncapi.fuzionest.com` |
| `BACKEND_BASE_URL` | Server-side API URL | Same as above |

### Service Ports
| Variable | Description | Default Value |
|----------|-------------|---------------|
| `SUITE_DASHBOARD_PORT` | Main dashboard port | `3000` |
| `DB_VIEWER_PORT` | Database viewer port | `4001` |
| `POSTMAN_PORT` | API testing tool port | `4002` |
| `TRANSFORMER_PORT` | Data transformer port | `4003` |

### API Endpoints (Postman Tool)
| Variable | Description | Default Value |
|----------|-------------|---------------|
| `NEXT_PUBLIC_COLLECTIONS_URL` | Collections API endpoint | `/api/collections/` |
| `NEXT_PUBLIC_BULK_UPDATE_URL` | Bulk update endpoint | `/api/collections/bulk-update` |
| `NEXT_PUBLIC_SAVE_API_ENDPOINT` | Save API endpoint | `/api/apis/create` |
| `NEXT_PUBLIC_API_DETAILS_ENDPOINT` | API details endpoint | `/api/apis/key` |

### Configuration Options
| Variable | Description | Default Value |
|----------|-------------|---------------|
| `REQUEST_TIMEOUT` | API request timeout (ms) | `30000` |
| `AUTO_SAVE_DELAY` | Auto-save delay (ms) | `600` |
| `DEFAULT_AUTH_TYPE` | Default auth method | `bearer` |
| `DEBUG_MODE` | Enable debug logging | `true` |
| `ENABLE_API_LOGGING` | Log API calls to console | `true` |

## Development vs Production

### Development Environment
```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL=https://dev-api.example.com
DEBUG_MODE=true
ENABLE_API_LOGGING=true
```

### Production Environment
```bash
# .env.local
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
DEBUG_MODE=false
ENABLE_API_LOGGING=false
```

## Service-Specific Configurations

Each service has its own `.env.local` file that extends the main configuration:

### DB Viewer (`fuzion-db-viewer/.env.local`)
```bash
# Specific to database operations
NEXT_PUBLIC_DATABASE_ENDPOINT=/api/database
NEXT_PUBLIC_HEALTH_CHECK_ENDPOINT=/api/health
```

### Postman (`fuzion-postman/.env.local`)
```bash
# API testing specific
NEXT_PUBLIC_COLLECTIONS_URL=https://api.example.com/api/collections/
NEXT_PUBLIC_BULK_UPDATE_URL=https://api.example.com/api/collections/bulk-update
```

### Transformer (`fuzion-transformer/.env.local`)
```bash
# Data transformation specific
NEXT_PUBLIC_TRANSFORMATION_ENDPOINT=/api/transformations
NEXT_PUBLIC_COPILOT_ENDPOINT=/api/copilot
MAX_FILE_SIZE=10485760
SUPPORTED_FILE_TYPES=json,xml,csv,yaml
```

### Suite UI (`suite-ui/.env.local`)
```bash
# Main dashboard specific
NEXT_PUBLIC_DB_VIEWER_URL=http://localhost:4001
NEXT_PUBLIC_POSTMAN_URL=http://localhost:4002
NEXT_PUBLIC_TRANSFORMER_URL=http://localhost:4003
```

## Troubleshooting

### Common Issues

1. **Services not starting on correct ports:**
   - Check that port variables are correctly set in `.env.local`
   - Ensure no other applications are using the specified ports

2. **API calls failing:**
   - Verify `NEXT_PUBLIC_API_BASE_URL` is correct
   - Check network connectivity to the API server
   - Enable `DEBUG_MODE=true` for detailed logging

3. **Environment variables not loading:**
   - Ensure `.env.local` files exist in the correct directories
   - Restart the development server after changing environment variables
   - Check that variable names match exactly (case-sensitive)

### Debug Mode

Enable debug mode to see detailed environment information:

```bash
DEBUG_MODE=true
ENABLE_API_LOGGING=true
```

This will log:
- Environment variable values (masked for security)
- API request/response details
- Service startup information
- Health check status

## Security Considerations

1. **Never commit `.env.local` files to version control**
2. **Use different API keys/URLs for development and production**
3. **Regularly rotate API keys and tokens**
4. **Keep the `.env.example` file updated as a template**

## Environment Variable Priority

Variables are loaded in this order (highest priority first):

1. Service-specific `.env.local` files
2. Main `.env.local` file  
3. Main `.env` file
4. Default values in code

## Need Help?

If you encounter issues with environment configuration:

1. Check this guide for common solutions
2. Verify your `.env.local` files match the examples
3. Enable debug mode for detailed logging
4. Ensure all required dependencies are installed

## Environment Template

Create a `.env.example` file based on the main `.env` for your team:

```bash
# Copy this file to .env.local and customize the values

# Backend Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
BACKEND_BASE_URL=https://your-api-server.com

# Service Ports (change if conflicts exist)
SUITE_DASHBOARD_PORT=3000
DB_VIEWER_PORT=4001
POSTMAN_PORT=4002
TRANSFORMER_PORT=4003

# Development Settings
NODE_ENV=development
DEBUG_MODE=true
ENABLE_API_LOGGING=true
```