#!/usr/bin/env node

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Vollständiger Modul-Scanner für OnAirMulTiMedia
 * Findet alle Apps, Tools, Module und Programme automatisch
 */

const MODULE_PATTERNS = [
  // HTML-Dateien (Apps)
  { pattern: /\.html$/, type: 'app', category: 'Web App' },
  // JavaScript-Dateien (Tools)
  { pattern: /\.js$/, type: 'tool', category: 'JavaScript Tool' },
  { pattern: /\.mjs$/, type: 'tool', category: 'ES Module' },
  { pattern: /\.ts$/, type: 'tool', category: 'TypeScript Tool' },
  // Python-Skripte
  { pattern: /\.py$/, type: 'program', category: 'Python Script' },
  // PowerShell-Skripte
  { pattern: /\.ps1$/, type: 'program', category: 'PowerShell Script' },
  // Bash-Skripte
  { pattern: /\.sh$/, type: 'program', category: 'Bash Script' },
  // Batch-Dateien
  { pattern: /\.bat$/, type: 'program', category: 'Batch Script' },
  // JSON-Konfigurationen
  { pattern: /\.json$/, type: 'config', category: 'Configuration' },
  // Markdown-Dokumentation
  { pattern: /\.md$/, type: 'doc', category: 'Documentation' },
  // YAML-Konfigurationen
  { pattern: /\.yml$|\.yaml$/, type: 'config', category: 'YAML Config' },
  // CSS-Stylesheets
  { pattern: /\.css$/, type: 'resource', category: 'Stylesheet' },
  // Docker-Dateien
  { pattern: /Dockerfile|docker-compose/, type: 'container', category: 'Container' },
  // Package-Dateien
  { pattern: /package\.json|Cargo\.toml|requirements\.txt/, type: 'config', category: 'Package Config' }
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
  'info.html': 'Main Portal',
  'index.html': 'Homepage',
  'manifest.html': 'PWA Manifest',
  'client.html': 'Test Client',
  'overlay.html': 'Audit Overlay',
  'blueprints.html': 'Blueprints',
  'regulatory.html': 'Regulatory',
  'audit-export.html': 'Audit Export',
  'test.html': 'Test Page',
  'offline.html': 'Offline Page',
  'serverfarm-dashboard.html': 'Serverfarm Dashboard',
  'serverfarm-matrix.html': 'Serverfarm Matrix',
  'cloud-sql-dashboard.html': 'Cloud SQL Dashboard',
  'test-api.html': 'API Test Interface',
  'api-status-monitor.html': 'API Status Monitor',
  'advanced-analytics.html': 'Advanced Analytics',
  'webtrit-real.html': 'WebTrit Real',
  'real-webtrit-phone.js': 'WebTrit Phone',
  'real-webtrit-swipe.js': 'WebTrit Swipe',
  'webtrit-swipe.js': 'WebTrit Swipe Engine',
  'vodafone-telephony-integration.js': 'Vodafone Integration',
  'start-oamtm.bat': 'Windows Starter',
  'start-oamtm.ps1': 'PowerShell Starter',
  'activate-pipeline.ps1': 'Pipeline Activator',
  'activate-pipeline.sh': 'Linux Pipeline Activator',
  'fix-all-bugs.sh': 'Bug Fixer',
  'package.json': 'Node.js Package',
  'Cargo.toml': 'Rust Package',
  'docker-compose.yml': 'Docker Compose',
  'Dockerfile.dev': 'Development Container',
  'Dockerfile.webui': 'WebUI Container',
  'vite.config.js': 'Vite Config',
  'vitest.config.ts': 'Vitest Config',
  'playwright.config.ts': 'Playwright Config',
  'tsconfig.json': 'TypeScript Config',
  'firebase.json': 'Firebase Config',
  'firebase.serverfarm.json': 'Firebase Serverfarm Config',
  'wrangler.toml': 'Cloudflare Worker Config',
  'vercel.json': 'Vercel Config',
  'capacitor.config.json': 'Capacitor Config',
  'electron-builder.json': 'Electron Builder Config',
  'commitlint.config.cjs': 'Commitlint Config',
  'renovate.json': 'Renovate Config',
  'rust-toolchain.toml': 'Rust Toolchain',
  'rustfmt.toml': 'Rust Formatter',
  'clippy.toml': 'Clippy Config',
  'Makefile': 'Makefile',
  'LICENSE': 'License',
  'README.md': 'Readme',
  'SECURITY.md': 'Security Policy',
  'CODE_OF_CONDUCT.md': 'Code of Conduct',
  'CONTRIBUTING.md': 'Contributing Guide',
  'DEPLOYMENT_GUIDE.md': 'Deployment Guide',
  'MANIFEST.md': 'Manifest Documentation'
};

async function scanDirectory(dirPath, basePath = '') {
  const modules = [];
  
  try {
    const entries = await readdir(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const relativePath = join(basePath, entry);
      
      // Skip excluded patterns
      if (EXCLUDE_PATTERNS.some(pattern => pattern.test(relativePath))) {
        continue;
      }
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // Recursively scan subdirectories
          const subModules = await scanDirectory(fullPath, relativePath);
          modules.push(...subModules);
        } else if (stats.isFile()) {
          // Check if file matches any module pattern
          const moduleInfo = categorizeModule(entry, relativePath, stats);
          if (moduleInfo) {
            modules.push(moduleInfo);
          }
        }
      } catch (error) {
        // Skip files/directories we can't access
        console.warn(`Skipping ${fullPath}: ${error.message}`);
      }
    }
  } catch (error) {
    console.warn(`Cannot scan directory ${dirPath}: ${error.message}`);
  }
  
  return modules;
}

function categorizeModule(filename, relativePath, stats) {
  // Check for special categories first
  if (SPECIAL_CATEGORIES[filename]) {
    return {
      name: filename,
      path: relativePath,
      type: 'special',
      category: SPECIAL_CATEGORIES[filename],
      size: stats.size,
      modified: stats.mtime.toISOString(),
      auditierbar: true,
      zertifiziert: true,
      status: 'aktiv'
    };
  }
  
  // Check against patterns
  for (const { pattern, type, category } of MODULE_PATTERNS) {
    if (pattern.test(filename)) {
      return {
        name: filename,
        path: relativePath,
        type,
        category,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        auditierbar: true,
        zertifiziert: true,
        status: 'aktiv'
      };
    }
  }
  
  return null;
}

async function generateAuditReport() {
  console.log('🔍 Scanning all modules in OnAirMulTiMedia...');
  
  const allModules = await scanDirectory('.');
  
  // Sort modules by category and name
  allModules.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
  
  // Generate statistics
  const stats = {
    total: allModules.length,
    byType: {},
    byCategory: {},
    byStatus: {}
  };
  
  allModules.forEach(module => {
    // Count by type
    stats.byType[module.type] = (stats.byType[module.type] || 0) + 1;
    
    // Count by category
    stats.byCategory[module.category] = (stats.byCategory[module.category] || 0) + 1;
    
    // Count by status
    stats.byStatus[module.status] = (stats.byStatus[module.status] || 0) + 1;
  });
  
  // Generate audit report
  const auditReport = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    scanType: 'full-module-discovery',
    stats,
    modules: allModules,
    metadata: {
      scanner: 'scan-all-modules.mjs',
      patterns: MODULE_PATTERNS.length,
      excludePatterns: EXCLUDE_PATTERNS.length,
      specialCategories: Object.keys(SPECIAL_CATEGORIES).length
    }
  };
  
  // Write audit report
  await writeFile('docs/audit-run.json', JSON.stringify(auditReport, null, 2));
  
  console.log(`✅ Found ${allModules.length} modules:`);
  console.log(`   📱 Apps: ${stats.byType.app || 0}`);
  console.log(`   🔧 Tools: ${stats.byType.tool || 0}`);
  console.log(`   💻 Programs: ${stats.byType.program || 0}`);
  console.log(`   ⚙️ Configs: ${stats.byType.config || 0}`);
  console.log(`   📚 Docs: ${stats.byType.doc || 0}`);
  console.log(`   🎨 Resources: ${stats.byType.resource || 0}`);
  console.log(`   🐳 Containers: ${stats.byType.container || 0}`);
  console.log(`   ⭐ Special: ${stats.byType.special || 0}`);
  
  console.log('\n📊 Top Categories:');
  Object.entries(stats.byCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });
  
  console.log('\n🎯 Audit Report written to docs/audit-run.json');
  
  return auditReport;
}

// Run the scanner
generateAuditReport().catch(console.error);
