const { spawn } = require('child_process');
const waitOn = require('wait-on');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config();

// Function to sync global .env to all projects
function syncEnvironmentFiles() {
  console.log('🔄 Syncing global .env file to all projects...');
  
  const globalEnvPath = path.join(__dirname, '.env');
  const projects = ['fuzion-db-viewer', 'fuzion-postman', 'fuzion-transformer', 'suite-ui'];
  
  if (!fs.existsSync(globalEnvPath)) {
    console.error('❌ Global .env file not found!');
    return false;
  }
  
  let syncedCount = 0;
  projects.forEach(project => {
    try {
      const targetPath = path.join(__dirname, project, '.env');
      fs.copyFileSync(globalEnvPath, targetPath);
      console.log(`✅ Synced to: ${project}`);
      syncedCount++;
    } catch (error) {
      console.error(`❌ Failed to sync to ${project}:`, error.message);
    }
  });
  
  console.log(`📊 Synced ${syncedCount}/${projects.length} projects\n`);
  return syncedCount === projects.length;
}

// Configuration with environment variable support
const SERVICES = [
  {
    name: 'DB-VIEWER',
    dir: 'fuzion-db-viewer',
    port: process.env.DB_VIEWER_PORT || 4001,
    url: process.env.DB_VIEWER_URL || 'http://145.223.23.191:4001',
    color: '\x1b[32m', // Green
    priority: 1
  },
  {
    name: 'POSTMAN',
    dir: 'fuzion-postman', 
    port: process.env.POSTMAN_PORT || 4002,
    url: process.env.POSTMAN_URL || 'http://145.223.23.191:4002',
    color: '\x1b[33m', // Yellow
    priority: 2
  },
  {
    name: 'TRANSFORMER',
    dir: 'fuzion-transformer',
    port: process.env.TRANSFORMER_PORT || 4003,
    url: process.env.TRANSFORMER_URL || 'http://145.223.23.191:4003',
    color: '\x1b[35m', // Magenta
    priority: 3
  },
  {
    name: 'SUITE-DASHBOARD',
    dir: 'suite-ui',
    port: process.env.SUITE_DASHBOARD_PORT || 3000,
    url: process.env.SUITE_DASHBOARD_URL || 'http://145.223.23.191:3000',
    color: '\x1b[34m', // Blue
    priority: 4,
    isMain: true
  }
];

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

class ServiceOrchestrator {
  constructor() {
    this.processes = new Map();
    this.readyServices = new Set();
    this.startTime = Date.now();
  }

  log(service, message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = service ? `[${service.name}]` : '[ORCHESTRATOR]';
    const color = service ? service.color : '\x1b[36m'; // Cyan for orchestrator
    
    console.log(`${color}${BOLD}${prefix}${RESET} ${color}[${timestamp}]${RESET} ${message}`);
  }

  async startService(service) {
    return new Promise((resolve, reject) => {
      this.log(service, `Starting ${service.name} on port ${service.port}...`);
      
      const process = spawn('npm', ['run', 'dev', '--', '--port', service.port], {
        cwd: path.join(__dirname, service.dir),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      this.processes.set(service.name, process);

      // Handle stdout
      process.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.log(service, output);
        }
      });

      // Handle stderr
      process.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('npm WARN')) {
          this.log(service, `[WARN] ${output}`, 'WARN');
        }
      });

      // Handle process exit
      process.on('exit', (code) => {
        if (code !== 0) {
          this.log(service, `[ERROR] Exited with code ${code}`, 'ERROR');
          reject(new Error(`${service.name} failed to start`));
        }
      });

      // Wait for service to be ready
      this.waitForService(service).then(() => {
        this.readyServices.add(service.name);
        this.log(service, `Ready and accessible at ${service.url}`);
        resolve();
      }).catch(reject);
    });
  }

  async waitForService(service) {
    const opts = {
      resources: [service.url],
      delay: 1000,
      interval: 2000,
      timeout: 60000,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    };

    this.log(service, `Waiting for service to be ready...`);
    
    try {
      await waitOn(opts);
    } catch (error) {
      throw new Error(`${service.name} failed to become ready: ${error.message}`);
    }
  }

  async startAll() {
    console.log(`\n${BOLD}FUZIONEST DEVELOPMENT SUITE ORCHESTRATOR${RESET}\n`);
    
    // First, sync the global .env file to all projects
    if (!syncEnvironmentFiles()) {
      console.log('⚠️  Some .env files failed to sync, but continuing with startup...\n');
    }
    
    this.log(null, 'Starting orchestrated deployment workflow...');
    
    // Sort services by priority (excluding main dashboard)
    const supportServices = SERVICES.filter(s => !s.isMain).sort((a, b) => a.priority - b.priority);
    const mainService = SERVICES.find(s => s.isMain);

    try {
      // Start support services in sequence
      this.log(null, `Starting ${supportServices.length} support services...`);
      
      for (const service of supportServices) {
        await this.startService(service);
        this.log(null, `${service.name} is ready (${this.readyServices.size}/${supportServices.length})`);
      }

      // All support services are ready
      this.log(null, 'All support services are ready!');
      this.log(null, 'Service Status:');
      
      supportServices.forEach(service => {
        this.log(null, `   [OK] ${service.name}: ${service.url}`);
      });

      // Start main dashboard
      this.log(null, `\nStarting main dashboard...`);
      await this.startService(mainService);

      // Final success message
      const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
      
      console.log(`\n${BOLD}FUZIONEST DEVELOPMENT SUITE IS READY!${RESET}`);
      console.log(`${BOLD}Total startup time: ${totalTime}s${RESET}\n`);
      
      console.log(`${BOLD}ACCESS POINTS:${RESET}`);
      console.log(`${mainService.color}${BOLD}   MAIN DASHBOARD: ${mainService.url}${RESET}`);
      console.log(`${BOLD}   Individual Services:${RESET}`);
      
      supportServices.forEach(service => {
        console.log(`${service.color}      ${service.name}: ${service.url}${RESET}`);
      });
      
      console.log(`\n${BOLD}Use the sidebar in the dashboard to navigate between tools${RESET}`);
      console.log(`${BOLD}Press Ctrl+C to stop all services${RESET}\n`);

    } catch (error) {
      this.log(null, `[ERROR] Orchestration failed: ${error.message}`, 'ERROR');
      await this.stopAll();
      process.exit(1);
    }
  }

  async stopAll() {
    this.log(null, 'Stopping all services...');
    
    for (const [serviceName, process] of this.processes) {
      this.log(null, `Stopping ${serviceName}...`);
      process.kill('SIGTERM');
    }
    
    this.log(null, 'All services stopped');
  }
}

// Handle graceful shutdown
const orchestrator = new ServiceOrchestrator();

process.on('SIGINT', async () => {
  console.log('\n');
  await orchestrator.stopAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await orchestrator.stopAll();
  process.exit(0);
});

// Start the orchestration
orchestrator.startAll().catch((error) => {
  console.error('Orchestration failed:', error);
  process.exit(1);
});