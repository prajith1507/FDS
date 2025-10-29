# Fuzionest Development Suite

A unified web-based developer dashboard that combines three independent tools into a single interface.

## 🧩 Architecture

The suite consists of:
- **suite-ui** (Port 3000) - Main host application with sidebar navigation
- **fuzion-db-viewer** (Port 4001) - Database management tool
- **fuzion-postman** (Port 4002) - API testing and management tool  
- **fuzion-transformer** (Port 4003) - Data transformation tool

## 🚀 Quick Start

### 1. Start the Main Suite UI

```bash
cd suite-ui
npm install
npm run dev
```

The main dashboard will be available at http://145.223.23.191:3000

### 2. Start Individual Tools

Each tool runs independently on its own port:

**DB Viewer:**
```bash
cd fuzion-db-viewer
npm install
npm run dev -- --port 4001
```

**Postman:**
```bash
cd fuzion-postman  
npm install
npm run dev -- --port 4002
```

**Transformer:**
```bash
cd fuzion-transformer
npm install  
npm run dev -- --port 4003
```

## 📋 Features

- **Unified Interface**: Single sidebar navigation for all tools
- **Independent Tools**: Each tool maintains its own development lifecycle
- **iframe Integration**: Tools load seamlessly without affecting each other
- **Responsive Design**: Works on desktop and tablet devices
- **Tool Status**: Dashboard shows which tools are running
- **Collapsible Sidebar**: Maximize workspace when needed

## 🔧 Development

### Project Structure

```
suite-ui/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Sidebar.tsx
│   └── ToolContainer.tsx
├── package.json
└── ...config files
```

### Tool Configuration

Tool URLs are configured in `components/ToolContainer.tsx`:

```typescript
const toolUrls = {
  'dashboard': null,
  'db-viewer': 'http://145.223.23.191:4001',
  'postman': 'http://145.223.23.191:4002', 
  'transformer': 'http://145.223.23.191:4003'
}
```

### Adding New Tools

1. Add the tool configuration to `toolUrls`
2. Add menu item to `menuItems` in `Sidebar.tsx`
3. Update the `Tool` type definition

## 🎨 Styling

- Built with **Tailwind CSS** for utility-first styling
- Dark sidebar with light content area
- Smooth transitions and hover effects
- Responsive grid layouts

## 🔒 Security

- iframe sandbox restrictions applied for security
- CORS considerations handled for cross-origin tool loading
- Each tool runs in isolation

## 📝 Notes

- Tools must handle being loaded in an iframe context
- Some tools may need CORS configuration for iframe loading
- The dashboard provides an overview when no specific tool is selected