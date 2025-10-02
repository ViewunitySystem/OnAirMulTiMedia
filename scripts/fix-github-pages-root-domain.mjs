#!/usr/bin/env node

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixGitHubPagesRootDomain() {
  console.log('🔧 Fixing GitHub Pages Root Domain...');
  
  // Problem: https://www.viewunitysystem.github.io/ gives 404
  // Solution: Create proper root domain setup
  
  const rootIndex = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ViewunitySystem - OnAirMulTiMedia</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0b0f17;
      color: #eaf0ff;
      margin: 0;
      padding: 2rem;
      text-align: center;
    }
    h1 { color: #f472b6; }
    a { color: #7dd3fc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .loading { opacity: 0.7; }
  </style>
</head>
<body>
  <h1>ViewunitySystem</h1>
  <p>Weiterleitung zu OnAirMulTiMedia...</p>
  <p class="loading">Automatische Weiterleitung in 2 Sekunden...</p>
  
  <script>
    // Sofortige Weiterleitung zu OnAirMulTiMedia
    window.location.replace('/OnAirMulTiMedia/');
    
    // Fallback nach 2 Sekunden
    setTimeout(function() {
      window.location.href = '/OnAirMulTiMedia/';
    }, 2000);
  </script>
</body>
</html>`;

  // Create root index.html for GitHub Pages
  await fs.writeFile('index.html', rootIndex);
  
  // Update CNAME for both domains
  const cname = `viewunitysystem.github.io
www.viewunitysystem.github.io`;

  await fs.writeFile('CNAME', cname);
  
  console.log('✅ Root domain files created:');
  console.log('  - index.html (root redirect)');
  console.log('  - CNAME (both domains)');
  console.log('\n🌐 URLs after fix:');
  console.log('  - https://viewunitysystem.github.io/ → /OnAirMulTiMedia/');
  console.log('  - https://www.viewunitysystem.github.io/ → /OnAirMulTiMedia/');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixGitHubPagesRootDomain().catch(error => {
    console.error('❌ GitHub Pages Root Domain Fix failed:', error);
    process.exit(1);
  });
}

export { fixGitHubPagesRootDomain };
