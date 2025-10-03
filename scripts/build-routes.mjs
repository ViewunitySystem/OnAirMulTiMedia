import { readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// TEL Portal System Configuration
const ROOT = process.env.PAGES_ROOT || 'OnAirMulTiMedia';
const OUT_ROUTES = 'audit/routes.json';
const OUT_REDIRECTS = 'audit/redirect-map.json';
const REPO_PATH = '/OnAirMulTiMedia'; // GitHub Pages Repo-Pfad

console.log('🛣️ TEL Portal System - Building Routes...');
console.log(`📁 Root directory: ${ROOT}`);
console.log(`🔗 Repo path: ${REPO_PATH}`);

// Ensure audit directory exists
await mkdir('audit', { recursive: true }).catch(() => {});

async function* walk(dir) {
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        yield* walk(p);
      } else if (/\.(html|htm|pdf|json|png|jpg|jpeg|svg|webp|ico|js|css|txt|md)$/i.test(e.name)) {
        yield p;
      }
    }
  } catch (error) {
    console.warn(`⚠️ Warning: Could not read directory ${dir}:`, error.message);
  }
}

function urlFromFile(f) {
  let rel = f.replace(new RegExp('^' + ROOT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\/]'), '').replace(/\\/g, '/');
  if (rel === 'index.html') rel = '';
  else if (rel.endsWith('/index.html')) rel = rel.replace('/index.html', '');
  return `/${rel}`;
}

// Collect all routes
const routes = [];
let fileCount = 0;

for await (const file of walk(ROOT)) {
  try {
    const stats = await stat(file);
    const url = urlFromFile(file);
    
    routes.push({ 
      file: file.replace(/\\/g, '/'), 
      url, 
      mtime: stats.mtimeMs,
      size: stats.size,
      ext: path.extname(file).toLowerCase()
    });
    fileCount++;
  } catch (error) {
    console.warn(`⚠️ Warning: Could not stat file ${file}:`, error.message);
  }
}

// Sort routes alphabetically
routes.sort((a, b) => a.url.localeCompare(b.url));

// Write routes file
const routesData = { 
  generatedAt: new Date().toISOString(),
  project: 'TEL Portal System - OnAirMulTiMedia',
  repoPath: REPO_PATH,
  totalFiles: fileCount,
  routes 
};

await writeFile(OUT_ROUTES, JSON.stringify(routesData, null, 2));

// Generate intelligent redirects based on common patterns
const redirects = {
  generatedAt: new Date().toISOString(),
  project: 'TEL Portal System - 404 Auto-Fix',
  repoPath: REPO_PATH,
  rules: [
    // Common extension patterns
    { from: '/console-viewer', to: `${REPO_PATH}/console-viewer.html`, reason: 'extension', score: 1.0 },
    { from: '/index', to: `${REPO_PATH}/index.html`, reason: 'extension', score: 1.0 },
    { from: '/manifest', to: `${REPO_PATH}/manifest.webmanifest`, reason: 'extension', score: 1.0 },
    
    // Common directory patterns
    { from: '/src', to: `${REPO_PATH}/src/`, reason: 'directory', score: 0.9 },
    { from: '/public', to: `${REPO_PATH}/public/`, reason: 'directory', score: 0.9 },
    
    // TEL Portal System specific redirects
    { from: '/ucm', to: `${REPO_PATH}/console-viewer.html`, reason: 'tel_portal', score: 0.95 },
    { from: '/monitor', to: `${REPO_PATH}/console-viewer.html`, reason: 'tel_portal', score: 0.95 },
    { from: '/logs', to: `${REPO_PATH}/console-viewer.html`, reason: 'tel_portal', score: 0.95 },
    
    // Common typos and variations
    { from: '/OnAirMulTiMedia', to: `${REPO_PATH}/`, reason: 'repo_root', score: 1.0 },
    { from: '/onairmultimedia', to: `${REPO_PATH}/`, reason: 'case_variation', score: 0.9 },
    { from: '/oamtm', to: `${REPO_PATH}/`, reason: 'abbreviation', score: 0.8 },
    
    // Service Worker and PWA patterns
    { from: '/sw', to: `${REPO_PATH}/sw.js`, reason: 'service_worker', score: 0.95 },
    { from: '/service-worker', to: `${REPO_PATH}/sw.js`, reason: 'service_worker', score: 0.95 },
    
    // API and data endpoints (for future use)
    { from: '/api/log', to: `${REPO_PATH}/log`, reason: 'api_endpoint', score: 0.9 },
    { from: '/audit', to: `${REPO_PATH}/audit/`, reason: 'audit_directory', score: 0.9 }
  ]
};

// Add dynamic redirects based on found routes
for (const route of routes) {
  const url = route.url;
  const fileName = path.basename(url);
  const baseName = path.basename(url, path.extname(url));
  
  // Add extension-less redirects for HTML files
  if (route.ext === '.html' && baseName !== 'index') {
    const redirectFrom = url.replace('.html', '');
    const existingRule = redirects.rules.find(r => r.from === redirectFrom);
    if (!existingRule) {
      redirects.rules.push({
        from: redirectFrom,
        to: `${REPO_PATH}${url}`,
        reason: 'auto_extension',
        score: 0.8
      });
    }
  }
}

await writeFile(OUT_REDIRECTS, JSON.stringify(redirects, null, 2));

console.log('✅ Routes generated successfully!');
console.log(`📊 Total files processed: ${fileCount}`);
console.log(`🛣️ Total routes: ${routes.length}`);
console.log(`🔄 Total redirects: ${redirects.rules.length}`);
console.log(`📁 Routes saved to: ${OUT_ROUTES}`);
console.log(`🔄 Redirects saved to: ${OUT_REDIRECTS}`);
console.log('');
console.log('🔗 Top 10 routes:');
routes.slice(0, 10).forEach(route => {
  console.log(`   ${route.url} → ${route.file}`);
});
console.log('');
console.log('🔄 Top 10 redirects:');
redirects.rules.slice(0, 10).forEach(rule => {
  console.log(`   ${rule.from} → ${rule.to} (${rule.reason}, score: ${rule.score})`);
});
