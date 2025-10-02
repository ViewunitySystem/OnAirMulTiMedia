#!/usr/bin/env node

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixNavigationFlow() {
  console.log('🔧 Fixing Navigation Flow...');
  
  const files = [
    'index.html',
    'info.html',
    'nomadic_swipe_nemo.html',
    'test-dashboard.html',
    'client.html',
    'overlay.html',
    'blueprints.html',
    'manifest.html',
    'regulatory.html',
    'audit-export.html',
    'settings/settings-panel.html',
    'telemetry/telemetry-dashboard.html',
    'web-remote/controller.html',
    'web-remote/display.html',
    'test.html',
    'docs/index.html'
  ];

  let fixedFiles = 0;

  for (const file of files) {
    try {
      const filePath = join(__dirname, '..', file);
      const content = await fs.readFile(filePath, 'utf8');
      
      let modified = false;
      let newContent = content;

      // Remove target="_blank" from internal links
      newContent = newContent.replace(/target="_blank"/g, '');
      
      // Add proper navigation flow
      if (newContent.includes('<body')) {
        // Add navigation breadcrumb
        const breadcrumb = `
    <!-- Navigation Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">🏠 Start</a> 
      <span>›</span> 
      <span>${file.replace('.html', '').replace('/', ' › ')}</span>
    </nav>
    
    <style>
      .breadcrumb {
        background: rgba(255,255,255,0.05);
        padding: 0.5rem 1rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        font-size: 0.9rem;
      }
      .breadcrumb a {
        color: #7dd3fc;
        text-decoration: none;
      }
      .breadcrumb a:hover {
        text-decoration: underline;
      }
      .breadcrumb span {
        color: #a6b0c9;
        margin: 0 0.5rem;
      }
    </style>`;

        newContent = newContent.replace('<body', breadcrumb + '\n<body');
        modified = true;
      }

      // Add keyboard navigation
      if (newContent.includes('</body>')) {
        const keyboardNav = `
    <script>
      // Keyboard Navigation
      document.addEventListener('keydown', function(e) {
        // Alt + Left Arrow = Back
        if (e.altKey && e.key === 'ArrowLeft') {
          e.preventDefault();
          window.history.back();
        }
        // Alt + Right Arrow = Forward
        if (e.altKey && e.key === 'ArrowRight') {
          e.preventDefault();
          window.history.forward();
        }
        // Alt + Home = Go to Start
        if (e.altKey && e.key === 'Home') {
          e.preventDefault();
          window.location.href = '/';
        }
        // Escape = Close modal/overlay
        if (e.key === 'Escape') {
          const modals = document.querySelectorAll('.modal, .overlay');
          modals.forEach(modal => {
            if (modal.style.display !== 'none') {
              modal.style.display = 'none';
            }
          });
        }
      });
      
      // Add focus management
      document.addEventListener('DOMContentLoaded', function() {
        // Focus first interactive element
        const firstInteractive = document.querySelector('a, button, input, select, textarea');
        if (firstInteractive) {
          firstInteractive.focus();
        }
      });
    </script>`;

        newContent = newContent.replace('</body>', keyboardNav + '\n</body>');
        modified = true;
      }

      if (modified) {
        await fs.writeFile(filePath, newContent);
        console.log(`✅ Fixed navigation flow in: ${file}`);
        fixedFiles++;
      }

    } catch (error) {
      console.log(`⚠️ Skipped ${file}: ${error.message}`);
    }
  }

  console.log(`\n🎯 Navigation Flow Fix Complete!`);
  console.log(`📁 Fixed files: ${fixedFiles}/${files.length}`);
  console.log(`🔧 Changes:`);
  console.log(`  - Removed target="_blank" from internal links`);
  console.log(`  - Added breadcrumb navigation`);
  console.log(`  - Added keyboard navigation (Alt+Arrow, Alt+Home, Escape)`);
  console.log(`  - Added focus management`);
  console.log(`  - Improved user experience for PC users`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixNavigationFlow().catch(error => {
    console.error('❌ Navigation Flow Fix failed:', error);
    process.exit(1);
  });
}

export { fixNavigationFlow };
