#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createRootRepository() {
  console.log('🔧 Creating Root Repository for GitHub Pages...');
  
  // Step 1: Create new directory for root repo
  const rootRepoPath = join(__dirname, '..', '..', 'viewunitysystem.github.io');
  
  try {
    // Create directory
    await fs.mkdir(rootRepoPath, { recursive: true });
    console.log(`✅ Created directory: ${rootRepoPath}`);
    
    // Initialize git repository
    execSync('git init', { cwd: rootRepoPath, stdio: 'inherit' });
    console.log('✅ Initialized git repository');
    
    // Create index.html with redirect
    const indexHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ViewunitySystem - Redirecting...</title>
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

    await fs.writeFile(join(rootRepoPath, 'index.html'), indexHtml);
    console.log('✅ Created index.html with redirect');
    
    // Create README.md
    const readme = `# ViewunitySystem

This repository serves as the root domain for ViewunitySystem GitHub Pages.

## Redirect

This page automatically redirects to the main OnAirMulTiMedia application:

**https://viewunitysystem.github.io/OnAirMulTiMedia/**

## Setup

1. Create this repository on GitHub: \`viewunitysystem.github.io\`
2. Enable GitHub Pages for the \`main\` branch
3. The root domain will automatically redirect to OnAirMulTiMedia

## Links

- [OnAirMulTiMedia Application](https://viewunitysystem.github.io/OnAirMulTiMedia/)
- [GitHub Repository](https://github.com/ViewunitySystem/OnAirMulTiMedia)
`;

    await fs.writeFile(join(rootRepoPath, 'README.md'), readme);
    console.log('✅ Created README.md');
    
    // Add and commit files
    execSync('git add .', { cwd: rootRepoPath, stdio: 'inherit' });
    execSync('git commit -m "Initial commit: Root domain redirect to OnAirMulTiMedia"', { cwd: rootRepoPath, stdio: 'inherit' });
    console.log('✅ Committed initial files');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Create repository on GitHub: viewunitysystem.github.io');
    console.log('2. Add remote: git remote add origin https://github.com/ViewunitySystem/viewunitysystem.github.io.git');
    console.log('3. Push: git push -u origin main');
    console.log('4. Enable GitHub Pages in repository settings');
    console.log('\n🌐 After setup:');
    console.log('  - https://viewunitysystem.github.io/ → redirects to OnAirMulTiMedia');
    console.log('  - https://www.viewunitysystem.github.io/ → redirects to OnAirMulTiMedia');
    
  } catch (error) {
    console.error('❌ Error creating root repository:', error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createRootRepository().catch(error => {
    console.error('❌ Root Repository Creation failed:', error);
    process.exit(1);
  });
}

export { createRootRepository };
