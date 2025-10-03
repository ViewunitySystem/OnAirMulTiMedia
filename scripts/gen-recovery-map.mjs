#!/usr/bin/env node

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

/**
 * 1100% Max Performance Self-Heal Pack
 * Recovery-Map Generator - Single Source of Truth
 */

async function generateRecoveryMap() {
  console.log('🎯 [recovery-map] Generating recovery map...');
  
  try {
    // Read existing routes if available
    let routes = [];
    try {
      const routesData = await readFile('audit/routes.json', 'utf8');
      routes = JSON.parse(routesData);
    } catch {
      // Fallback: scan directory for HTML files
      const scanDir = async (dir, prefix = '') => {
        const entries = await readdir(dir, { withFileTypes: true });
        const files = [];
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...await scanDir(fullPath, prefix + entry.name + '/'));
          } else if (entry.isFile() && extname(entry.name) === '.html') {
            files.push({
              url: '/' + prefix + entry.name,
              name: entry.name.replace('.html', ''),
              type: 'page'
            });
          }
        }
        return files;
      };
      
      routes = [
        ...await scanDir('.', ''),
        ...await scanDir('docs', 'docs/'),
        ...await scanDir('OnAirMulTiMedia', 'OnAirMulTiMedia/')
      ];
    }
    
    // Generate pages from routes
    const pages = routes
      .filter(r => r.url && r.url.endsWith('.html'))
      .map(r => ({
        name: r.name || r.url.replace(/^\//, '').replace(/\.html$/, '').replace(/\//g, '-'),
        url: r.url,
        recoverable: true,
        rules: ['csp', '404', 'assets'],
        deps: []
      }))
      .filter((page, index, arr) => arr.findIndex(p => p.url === page.url) === index); // Remove duplicates
    
    // Add known critical dependencies
    const criticalDeps = [
      '/manifest.json',
      '/css/style.css',
      '/js/app.js',
      '/audit/redirect-map.json',
      '/composer-engine.ts',
      '/midi-export.js',
      '/monitoring/monitoring-report.json',
      '/audit/change-log.json',
      '/capabilities.json'
    ];
    
    // Add dependencies to relevant pages
    pages.forEach(page => {
      if (page.url === '/index.html') {
        page.deps = ['/manifest.json', '/css/style.css', '/js/app.js'];
      } else if (page.url === '/info.html') {
        page.deps = ['/audit/redirect-map.json'];
      } else if (page.url === '/bug-symphony.html') {
        page.deps = ['/composer-engine.ts', '/midi-export.js'];
      } else if (page.url === '/docs/selfheal-dashboard.html') {
        page.deps = ['/audit/recovery-map.json', '/audit/fixes.jsonl'];
      } else if (page.url === '/docs/monitoring-dashboard.html') {
        page.deps = ['/monitoring/monitoring-report.json'];
      } else if (page.url === '/docs/change-log.html') {
        page.deps = ['/audit/change-log.json'];
      } else if (page.url === '/docs/tool-map.html') {
        page.deps = ['/capabilities.json'];
      }
    });
    
    // Generate recovery map
    const map = {
      version: 1,
      generatedAt: new Date().toISOString(),
      pages,
      rules: {
        csp: {
          action: 'inject-meta-or-headers',
          policy: "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; font-src 'self' data:; media-src 'self' data: blob:; object-src 'none'; frame-src 'none';"
        },
        '404': {
          action: 'client-redirect-or-server-redirect',
          fallback: '/404.html'
        },
        assets: {
          action: 'swap-to-cdn-or-local-mirror',
          cdn: 'https://cdn.jsdelivr.net/npm/',
          local: '/node_modules/'
        }
      },
      performance: {
        targets: {
          lcp: 1.8,
          inp: 200,
          cls: 0.1,
          fcp: 1.5,
          ttfb: 600
        },
        optimizations: {
          criticalCSS: true,
          preload: ['/index.html', '/info.html', '/bug-symphony.html'],
          prefetch: ['/docs/selfheal-dashboard.html', '/audit/recovery-map.json'],
          serviceWorker: true,
          http2: true,
          brotli: true
        }
      },
      healing: {
        autoRecovery: true,
        maxRetries: 3,
        backoffMs: 1000,
        timeoutMs: 5000,
        healthCheckInterval: 30000
      }
    };
    
    // Write recovery map
    await writeFile('audit/recovery-map.json', JSON.stringify(map, null, 2));
    
    console.log(`✅ [recovery-map] Generated ${pages.length} pages`);
    console.log(`📊 [recovery-map] Rules: ${Object.keys(map.rules).length}`);
    console.log(`⚡ [recovery-map] Performance targets: ${Object.keys(map.performance.targets).length}`);
    console.log(`🔧 [recovery-map] Healing config: ${map.healing.autoRecovery ? 'enabled' : 'disabled'}`);
    
    return map;
    
  } catch (error) {
    console.error('❌ [recovery-map] Error:', error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateRecoveryMap().catch(process.exit);
}

export { generateRecoveryMap };
