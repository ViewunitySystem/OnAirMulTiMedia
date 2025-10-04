#!/usr/bin/env node

import { watch } from 'node:fs';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Automatischer Audit-Updater
 * Überwacht Datei-Änderungen und aktualisiert das Audit-Manifest automatisch
 * Lädt die audit-run.json und zeigt alle Module korrekt an
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
  'electron'
];

class AutoAuditUpdater {
  constructor() {
    this.watchers = new Map();
    this.lastUpdate = null;
    this.updateInProgress = false;
    this.debounceTimer = null;
  }

  async start() {
    console.log('🚀 Starting Auto Audit Updater...');
    
    // Initial update
    await this.performUpdate();
    
    // Start watching directories
    for (const dir of WATCH_DIRECTORIES) {
      await this.watchDirectory(dir);
    }
    
    console.log('✅ Auto Audit Updater is running!');
    console.log('📁 Watching directories:', WATCH_DIRECTORIES.join(', '));
    console.log('🔄 Auto-updating audit manifest on file changes...');
    console.log('🌐 Audit Manifest: https://viewunitysystem.github.io/OnAirMulTiMedia/docs/audit-manifest.html');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping Auto Audit Updater...');
      this.stop();
      process.exit(0);
    });
  }

  async watchDirectory(dirPath) {
    try {
      const watcher = watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (filename && this.shouldWatchFile(filename)) {
          console.log(`📝 File changed: ${join(dirPath, filename)}`);
          this.debouncedUpdate();
        }
      });
      
      this.watchers.set(dirPath, watcher);
      console.log(`👁️ Watching: ${dirPath}`);
    } catch (error) {
      console.warn(`⚠️ Cannot watch ${dirPath}: ${error.message}`);
    }
  }

  shouldWatchFile(filename) {
    // Only watch relevant file types
    const relevantExtensions = ['.html', '.js', '.ts', '.mjs', '.json', '.md', '.yml', '.yaml', '.css'];
    const relevantFiles = ['package.json', 'Dockerfile', 'docker-compose.yml', 'Makefile'];
    
    return relevantExtensions.some(ext => filename.endsWith(ext)) || 
           relevantFiles.includes(filename) ||
           filename.includes('config') ||
           filename.includes('manifest');
  }

  debouncedUpdate() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.performUpdate();
    }, 2000); // 2 second debounce
  }

  async performUpdate() {
    if (this.updateInProgress) {
      console.log('⏳ Update already in progress, skipping...');
      return;
    }
    
    this.updateInProgress = true;
    const startTime = Date.now();
    
    try {
      console.log('🔄 Performing audit update...');
      
      // Run the module scanner
      console.log('📊 Scanning modules...');
      execSync('node scripts/scan-all-modules.mjs', { stdio: 'inherit' });
      
      // Check if audit-run.json was created
      try {
        const auditData = JSON.parse(await readFile('docs/audit-run.json', 'utf8'));
        const moduleCount = auditData.modules?.length || 0;
        const activeCount = auditData.modules?.filter(m => m.status === 'aktiv' || m.status === 'Aktiv').length || 0;
        
        console.log(`✅ Audit updated: ${moduleCount} modules found, ${activeCount} active`);
        
        // Update the info.html with current module count
        await this.updateInfoHtml(auditData);
        
        this.lastUpdate = new Date().toISOString();
        
        const duration = Date.now() - startTime;
        console.log(`🎯 Update completed in ${duration}ms`);
        console.log(`🌐 View at: https://viewunitysystem.github.io/OnAirMulTiMedia/docs/audit-manifest.html`);
        
      } catch (error) {
        console.error('❌ Failed to read audit-run.json:', error.message);
      }
      
    } catch (error) {
      console.error('❌ Update failed:', error.message);
    } finally {
      this.updateInProgress = false;
    }
  }

  async updateInfoHtml(auditData) {
    try {
      let content = await readFile('info.html', 'utf8');
      
      const moduleCount = auditData.modules?.length || 0;
      const appCount = auditData.stats?.byType?.app || 0;
      const toolCount = auditData.stats?.byType?.tool || 0;
      const programCount = auditData.stats?.byType?.program || 0;
      
      // Update the title
      content = content.replace(
        /🚀 Alle Apps & Tools \(\d+ Module.*?\)/,
        `🚀 Alle Apps & Tools (${moduleCount} Module: ${appCount} Apps, ${toolCount} Tools, ${programCount} Programs)`
      );
      
      await writeFile('info.html', content);
      console.log(`📝 Updated info.html with ${moduleCount} total modules`);
    } catch (error) {
      console.warn('⚠️ Could not update info.html:', error.message);
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

// Start the auto updater
const updater = new AutoAuditUpdater();
updater.start().catch(console.error);
