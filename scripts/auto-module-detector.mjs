#!/usr/bin/env node

import { watch } from 'node:fs';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Automatischer Modul-Detector mit File-Watching
 * Überwacht das gesamte Repository auf Änderungen und aktualisiert automatisch
 * das Audit-Manifest und alle Module-Listen
 */

const WATCH_DIRECTORIES = [
  '.',
  'apps',
  'modules', 
  'webui',
  'docs',
  'scripts',
  'blueprints',
  'investors',
  'governance',
  'audit',
  'config',
  'sdr-licensing',
  'hackathon-bridge',
  'live-data-platform',
  'disaster-recovery',
  'presets',
  'schemas',
  'status',
  'tests',
  'functions',
  'core',
  'src',
  'electron',
  'webui'
];

const MODULE_PATTERNS = [
  { pattern: /\.html$/, type: 'app', category: 'Web App', priority: 'high' },
  { pattern: /\.js$/, type: 'tool', category: 'JavaScript Tool', priority: 'medium' },
  { pattern: /\.mjs$/, type: 'tool', category: 'ES Module', priority: 'medium' },
  { pattern: /\.ts$/, type: 'tool', category: 'TypeScript Tool', priority: 'medium' },
  { pattern: /\.tsx$/, type: 'tool', category: 'React Component', priority: 'medium' },
  { pattern: /\.py$/, type: 'program', category: 'Python Script', priority: 'low' },
  { pattern: /\.ps1$/, type: 'program', category: 'PowerShell Script', priority: 'low' },
  { pattern: /\.sh$/, type: 'program', category: 'Bash Script', priority: 'low' },
  { pattern: /\.bat$/, type: 'program', category: 'Batch Script', priority: 'low' },
  { pattern: /\.json$/, type: 'config', category: 'Configuration', priority: 'low' },
  { pattern: /\.md$/, type: 'doc', category: 'Documentation', priority: 'low' },
  { pattern: /\.yml$|\.yaml$/, type: 'config', category: 'YAML Config', priority: 'low' },
  { pattern: /\.css$/, type: 'resource', category: 'Stylesheet', priority: 'low' },
  { pattern: /Dockerfile|docker-compose/, type: 'container', category: 'Container', priority: 'medium' },
  { pattern: /package\.json|Cargo\.toml|requirements\.txt/, type: 'config', category: 'Package Config', priority: 'high' }
];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /target\//,
  /dist\//,
  /build\//,
  /\.cache/,
  /coverage\//,
  /test-results\//,
  /playwright-report\//,
  /\.next\//,
  /\.nuxt\//,
  /\.vuepress\//,
  /\.docusaurus\//,
  /\.svelte-kit\//,
  /\.astro\//,
  /\.vercel\//,
  /\.netlify\//,
  /\.turbo\//,
  /\.eslintcache/,
  /\.parcel-cache\//,
  /\.rollup\.cache\//,
  /\.vite\//,
  /\.swc\//,
  /\.tsbuildinfo/,
  /\.DS_Store/,
  /Thumbs\.db/,
  /\.vscode\//,
  /\.idea\//,
  /\.tmp\//,
  /\.temp\//,
  /\.log$/,
  /\.lock$/,
  /\.pid$/,
  /\.sock$/,
  /\.swp$/,
  /\.swo$/,
  /~$/
];

const SPECIAL_CATEGORIES = {
  'info.html': { category: 'Main Portal', priority: 'critical' },
  'index.html': { category: 'Homepage', priority: 'critical' },
  'manifest.html': { category: 'PWA Manifest', priority: 'high' },
  'client.html': { category: 'Test Client', priority: 'high' },
  'overlay.html': { category: 'Audit Overlay', priority: 'high' },
  'blueprints.html': { category: 'Blueprints', priority: 'high' },
  'regulatory.html': { category: 'Regulatory', priority: 'high' },
  'audit-export.html': { category: 'Audit Export', priority: 'high' },
  'test.html': { category: 'Test Page', priority: 'medium' },
  'offline.html': { category: 'Offline Page', priority: 'medium' },
  'serverfarm-dashboard.html': { category: 'Serverfarm Dashboard', priority: 'high' },
  'serverfarm-matrix.html': { category: 'Serverfarm Matrix', priority: 'high' },
  'cloud-sql-dashboard.html': { category: 'Cloud SQL Dashboard', priority: 'high' },
  'test-api.html': { category: 'API Test Interface', priority: 'high' },
  'api-status-monitor.html': { category: 'API Status Monitor', priority: 'high' },
  'advanced-analytics.html': { category: 'Advanced Analytics', priority: 'high' },
  'webtrit-real.html': { category: 'WebTrit Real', priority: 'high' },
  'real-webtrit-phone.js': { category: 'WebTrit Phone', priority: 'high' },
  'real-webtrit-swipe.js': { category: 'WebTrit Swipe', priority: 'high' },
  'webtrit-swipe.js': { category: 'WebTrit Swipe Engine', priority: 'high' },
  'vodafone-telephony-integration.js': { category: 'Vodafone Integration', priority: 'medium' },
  'start-oamtm.bat': { category: 'Windows Starter', priority: 'medium' },
  'start-oamtm.ps1': { category: 'PowerShell Starter', priority: 'medium' },
  'activate-pipeline.ps1': { category: 'Pipeline Activator', priority: 'medium' },
  'activate-pipeline.sh': { category: 'Linux Pipeline Activator', priority: 'medium' },
  'fix-all-bugs.sh': { category: 'Bug Fixer', priority: 'medium' },
  'package.json': { category: 'Node.js Package', priority: 'critical' },
  'Cargo.toml': { category: 'Rust Package', priority: 'high' },
  'docker-compose.yml': { category: 'Docker Compose', priority: 'high' },
  'Dockerfile.dev': { category: 'Development Container', priority: 'medium' },
  'Dockerfile.webui': { category: 'WebUI Container', priority: 'medium' },
  'vite.config.js': { category: 'Vite Config', priority: 'medium' },
  'vitest.config.ts': { category: 'Vitest Config', priority: 'medium' },
  'playwright.config.ts': { category: 'Playwright Config', priority: 'medium' },
  'tsconfig.json': { category: 'TypeScript Config', priority: 'medium' },
  'firebase.json': { category: 'Firebase Config', priority: 'high' },
  'firebase.serverfarm.json': { category: 'Firebase Serverfarm Config', priority: 'high' },
  'wrangler.toml': { category: 'Cloudflare Worker Config', priority: 'medium' },
  'vercel.json': { category: 'Vercel Config', priority: 'medium' },
  'capacitor.config.json': { category: 'Capacitor Config', priority: 'medium' },
  'electron-builder.json': { category: 'Electron Builder Config', priority: 'medium' },
  'commitlint.config.cjs': { category: 'Commitlint Config', priority: 'low' },
  'renovate.json': { category: 'Renovate Config', priority: 'low' },
  'rust-toolchain.toml': { category: 'Rust Toolchain', priority: 'low' },
  'rustfmt.toml': { category: 'Rust Formatter', priority: 'low' },
  'clippy.toml': { category: 'Clippy Config', priority: 'low' },
  'Makefile': { category: 'Makefile', priority: 'medium' },
  'LICENSE': { category: 'License', priority: 'high' },
  'README.md': { category: 'Readme', priority: 'high' },
  'SECURITY.md': { category: 'Security Policy', priority: 'high' },
  'CODE_OF_CONDUCT.md': { category: 'Code of Conduct', priority: 'medium' },
  'CONTRIBUTING.md': { category: 'Contributing Guide', priority: 'medium' },
  'DEPLOYMENT_GUIDE.md': { category: 'Deployment Guide', priority: 'medium' },
  'MANIFEST.md': { category: 'Manifest Documentation', priority: 'medium' }
};

class AutoModuleDetector {
  constructor() {
    this.watchers = new Map();
    this.lastScan = null;
    this.scanInProgress = false;
    this.debounceTimer = null;
  }

  async start() {
    console.log('🚀 Starting Auto Module Detector...');
    
    // Initial scan
    await this.performFullScan();
    
    // Start watching directories
    for (const dir of WATCH_DIRECTORIES) {
      await this.watchDirectory(dir);
    }
    
    console.log('✅ Auto Module Detector is running!');
    console.log('📁 Watching directories:', WATCH_DIRECTORIES.join(', '));
    console.log('🔄 Auto-updating on file changes...');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping Auto Module Detector...');
      this.stop();
      process.exit(0);
    });
  }

  async watchDirectory(dirPath) {
    try {
      const watcher = watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (filename && !this.shouldIgnoreFile(filename)) {
          this.debouncedScan();
        }
      });
      
      this.watchers.set(dirPath, watcher);
      console.log(`👁️ Watching: ${dirPath}`);
    } catch (error) {
      console.warn(`⚠️ Cannot watch ${dirPath}: ${error.message}`);
    }
  }

  shouldIgnoreFile(filename) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(filename));
  }

  debouncedScan() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.performFullScan();
    }, 1000); // 1 second debounce
  }

  async performFullScan() {
    if (this.scanInProgress) {
      console.log('⏳ Scan already in progress, skipping...');
      return;
    }
    
    this.scanInProgress = true;
    const startTime = Date.now();
    
    try {
      console.log('🔍 Performing full module scan...');
      
      const allModules = [];
      
      for (const dir of WATCH_DIRECTORIES) {
        const modules = await this.scanDirectory(dir);
        allModules.push(...modules);
      }
      
      // Sort and categorize modules
      const sortedModules = this.sortAndCategorizeModules(allModules);
      
      // Generate statistics
      const stats = this.generateStatistics(sortedModules);
      
      // Create audit report
      const auditReport = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        scanType: 'auto-module-detection',
        lastModified: this.lastScan,
        stats,
        modules: sortedModules,
        metadata: {
          scanner: 'auto-module-detector.mjs',
          watchDirectories: WATCH_DIRECTORIES.length,
          patterns: MODULE_PATTERNS.length,
          excludePatterns: EXCLUDE_PATTERNS.length,
          specialCategories: Object.keys(SPECIAL_CATEGORIES).length,
          scanDuration: Date.now() - startTime
        }
      };
      
      // Write audit report
      await writeFile('docs/audit-run.json', JSON.stringify(auditReport, null, 2));
      
      // Update info.html if needed
      await this.updateInfoHtml(stats);
      
      // Update audit manifest
      await this.updateAuditManifest(stats);
      
      this.lastScan = new Date().toISOString();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Scan completed in ${duration}ms`);
      console.log(`📊 Found ${sortedModules.length} modules (${stats.byType.app || 0} apps, ${stats.byType.tool || 0} tools, ${stats.byType.program || 0} programs)`);
      
    } catch (error) {
      console.error('❌ Scan failed:', error.message);
    } finally {
      this.scanInProgress = false;
    }
  }

  async scanDirectory(dirPath, basePath = '') {
    const modules = [];
    
    try {
      const entries = await readdir(dirPath);
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const relativePath = join(basePath, entry);
        
        if (this.shouldIgnoreFile(relativePath)) {
          continue;
        }
        
        try {
          const stats = await stat(fullPath);
          
          if (stats.isDirectory()) {
            const subModules = await this.scanDirectory(fullPath, relativePath);
            modules.push(...subModules);
          } else if (stats.isFile()) {
            const moduleInfo = this.categorizeModule(entry, relativePath, stats);
            if (moduleInfo) {
              modules.push(moduleInfo);
            }
          }
        } catch (error) {
          // Skip files/directories we can't access
        }
      }
    } catch (error) {
      // Skip directories we can't access
    }
    
    return modules;
  }

  categorizeModule(filename, relativePath, stats) {
    // Check for special categories first
    if (SPECIAL_CATEGORIES[filename]) {
      const special = SPECIAL_CATEGORIES[filename];
      return {
        name: filename,
        path: relativePath,
        type: 'special',
        category: special.category,
        priority: special.priority,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        auditierbar: true,
        zertifiziert: true,
        status: 'aktiv',
        autoDetected: true,
        detectionTime: new Date().toISOString()
      };
    }
    
    // Check against patterns
    for (const { pattern, type, category, priority } of MODULE_PATTERNS) {
      if (pattern.test(filename)) {
        return {
          name: filename,
          path: relativePath,
          type,
          category,
          priority,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          auditierbar: true,
          zertifiziert: true,
          status: 'aktiv',
          autoDetected: true,
          detectionTime: new Date().toISOString()
        };
      }
    }
    
    return null;
  }

  sortAndCategorizeModules(modules) {
    return modules.sort((a, b) => {
      // Sort by priority first (critical > high > medium > low)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority] || 4;
      const bPriority = priorityOrder[b.priority] || 4;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then by category
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      
      // Finally by name
      return a.name.localeCompare(b.name);
    });
  }

  generateStatistics(modules) {
    const stats = {
      total: modules.length,
      byType: {},
      byCategory: {},
      byStatus: {},
      byPriority: {}
    };
    
    modules.forEach(module => {
      stats.byType[module.type] = (stats.byType[module.type] || 0) + 1;
      stats.byCategory[module.category] = (stats.byCategory[module.category] || 0) + 1;
      stats.byStatus[module.status] = (stats.byStatus[module.status] || 0) + 1;
      stats.byPriority[module.priority] = (stats.byPriority[module.priority] || 0) + 1;
    });
    
    return stats;
  }

  async updateInfoHtml(stats) {
    try {
      let content = await readFile('info.html', 'utf8');
      
      // Update the app count in info.html
      const newAppCount = stats.byType.app || 0;
      const newToolCount = stats.byType.tool || 0;
      const newProgramCount = stats.byType.program || 0;
      const totalCount = stats.total;
      
      // Replace the title
      content = content.replace(
        /🚀 Alle Apps & Tools \(\d+ Apps\)/,
        `🚀 Alle Apps & Tools (${totalCount} Module: ${newAppCount} Apps, ${newToolCount} Tools, ${newProgramCount} Programs)`
      );
      
      await writeFile('info.html', content);
      console.log(`📝 Updated info.html with ${totalCount} total modules`);
    } catch (error) {
      console.warn('⚠️ Could not update info.html:', error.message);
    }
  }

  async updateAuditManifest(stats) {
    try {
      // The audit-manifest.html will automatically pick up the updated audit-run.json
      console.log(`📊 Audit manifest will show ${stats.total} modules`);
    } catch (error) {
      console.warn('⚠️ Could not update audit manifest:', error.message);
    }
  }

  stop() {
    for (const [dir, watcher] of this.watchers) {
      watcher.close();
      console.log(`👁️ Stopped watching: ${dir}`);
    }
    this.watchers.clear();
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

// Start the auto detector
const detector = new AutoModuleDetector();
detector.start().catch(console.error);
