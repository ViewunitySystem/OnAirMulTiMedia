#!/usr/bin/env node

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GitHub Pages Root-Domain Fix
// Problem: https://www.viewunitysystem.github.io/ gibt 404
// Lösung: Root-Domain auf OnAirMulTiMedia weiterleiten

async function createRootRedirect() {
  console.log('🔧 Creating GitHub Pages Root-Domain Redirect...');
  
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

  // Für GitHub Pages Root-Domain: index.html im Root-Verzeichnis
  await fs.writeFile('index.html', rootIndex);
  
  console.log('✅ Root-Domain Redirect erstellt: index.html');
  console.log('📝 Weiterleitung: / → /OnAirMulTiMedia/');
}

async function createCNAME() {
  console.log('🔧 Creating CNAME file for custom domain...');
  
  const cname = `viewunitysystem.github.io
www.viewunitysystem.github.io`;

  await fs.writeFile('CNAME', cname);
  
  console.log('✅ CNAME file erstellt');
  console.log('📝 Domains: viewunitysystem.github.io, www.viewunitysystem.github.io');
}

async function main() {
  try {
    await createRootRedirect();
    await createCNAME();
    
    console.log('\n🎯 GitHub Pages Root-Domain Fix abgeschlossen!');
    console.log('📋 Nächste Schritte:');
    console.log('1. git add index.html CNAME');
    console.log('2. git commit -m "fix: GitHub Pages Root-Domain Redirect"');
    console.log('3. git push origin gh-pages');
    console.log('\n🌐 URLs nach Fix:');
    console.log('- https://viewunitysystem.github.io/ → /OnAirMulTiMedia/');
    console.log('- https://www.viewunitysystem.github.io/ → /OnAirMulTiMedia/');
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Root-Domain Redirect:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createRootRedirect, createCNAME };
